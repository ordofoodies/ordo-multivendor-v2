import AsyncStorage from '@react-native-async-storage/async-storage'
import { gql } from '@apollo/client'
import * as Notifications from 'expo-notifications'
import i18next from 'i18next'
import { AppState, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native'
import ActivityController from 'ordo-activity-controller'

// Live order tracking:
//  - iOS: ActivityKit Live Activity (lock screen + Dynamic Island), updated by the backend over APNs.
//  - Android: ongoing progress notification, updated by the backend over FCM data messages
//    (applied natively by ActivityUpdateReceiver, so it works while the app is killed).

const REGISTER_SESSION = gql`
  mutation RegisterLiveActivitySession($orderId: ID!, $activityId: String!, $platform: String!, $pushToken: String!, $schemaVersion: Int, $language: String) {
    registerLiveActivitySession(orderId: $orderId, activityId: $activityId, platform: $platform, pushToken: $pushToken, schemaVersion: $schemaVersion, language: $language) {
      success
      message
    }
  }
`

const REMOVE_SESSION = gql`
  mutation RemoveLiveActivitySession($orderId: ID!, $activityId: String) {
    removeLiveActivitySession(orderId: $orderId, activityId: $activityId) {
      success
      message
    }
  }
`

export const LIVE_ACTIVITY_MESSAGE_TYPE = 'live_activity_update'

const SCHEMA_VERSION = 1
const SESSION_KEY = 'ordo-live-activity-session'
const RETRY_DELAYS_MS = [750, 2000, 5000]
const SUPPORTED_LANGUAGES = ['en', 'ar', 'he']
const TERMINAL_STATUSES = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'CANCELLEDBYREST']

let apolloClient = null
let iosTokenSubscription = null
let androidTokenSubscription = null
let appStateSubscription = null

const log = (message, details) => {
  if (__DEV__) console.log(`[LiveActivity] ${message}`, details ?? '')
}

const isAvailable = () => Platform.OS !== 'web' && Boolean(ActivityController?.startLiveActivity)

const platformName = () => (Platform.OS === 'ios' ? 'IOS' : 'ANDROID')

const language = () => {
  const current = (i18next.resolvedLanguage || i18next.language || 'en').split('-')[0]
  return SUPPORTED_LANGUAGES.includes(current) ? current : 'en'
}

const parseNativeResult = (value) => (typeof value === 'string' ? JSON.parse(value) : value)

const readSession = async () => {
  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const writeSession = (session) => AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))

const clearSession = () => AsyncStorage.removeItem(SESSION_KEY).catch(() => {})

const isClientError = (error) => {
  if (!error?.networkError && error?.graphQLErrors?.length > 0) return true
  const statusCode = error?.networkError?.statusCode ?? error?.networkError?.status
  return statusCode !== undefined && statusCode < 500
}

const registerSession = async ({ orderId, activityId, pushToken }) => {
  if (!apolloClient) throw new Error('Live Activity service is not configured with an Apollo client.')
  let lastError
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      await apolloClient.mutate({
        mutation: REGISTER_SESSION,
        variables: {
          orderId,
          activityId,
          platform: platformName(),
          pushToken,
          schemaVersion: SCHEMA_VERSION,
          language: language()
        }
      })
      log('session registered', { orderId, activityId })
      return
    } catch (error) {
      lastError = error
      const delay = RETRY_DELAYS_MS[attempt]
      if (isClientError(error) || delay === undefined) break
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

// Android: the "push token" for a session is the device's FCM token.
const getAndroidPushToken = async () => {
  const token = await Notifications.getDevicePushTokenAsync()
  return token?.data
}

const requestAndroidPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
  return result === PermissionsAndroid.RESULTS.GRANTED
}

const reregisterStoredSession = async (pushTokenOverride) => {
  const session = await readSession()
  if (!session?.orderId || !session?.activityId) return
  if (!(await ActivityController.isLiveActivityRunning().catch(() => false))) {
    await clearSession()
    return
  }
  const pushToken = pushTokenOverride || (Platform.OS === 'android' ? await getAndroidPushToken() : session.pushToken)
  if (!pushToken) return
  await registerSession({ orderId: session.orderId, activityId: session.activityId, pushToken })
}

const observeIosTokens = () => {
  if (Platform.OS !== 'ios' || iosTokenSubscription) return
  iosTokenSubscription = new NativeEventEmitter(ActivityController).addListener('LiveActivityTokenUpdated', async ({ orderId, activityId, pushToken }) => {
    if (!orderId || !activityId || !pushToken) return
    log('iOS push token updated', { orderId, activityId })
    await writeSession({ orderId, activityId, pushToken, platform: 'IOS' }).catch(() => {})
    registerSession({ orderId, activityId, pushToken }).catch(() => {})
  })
}

const observeAndroidTokens = () => {
  if (Platform.OS !== 'android' || androidTokenSubscription) return
  androidTokenSubscription = Notifications.addPushTokenListener((token) => {
    if (token?.type === 'android' && token.data) {
      reregisterStoredSession(token.data).catch(() => {})
    }
  })
}

/**
 * Call once with the app's Apollo client. Safe to call again with a new client.
 */
const configure = (client) => {
  apolloClient = client
  if (!isAvailable()) return
  observeIosTokens()
  observeAndroidTokens()
  if (!appStateSubscription) {
    // Keeps the backend's token fresh after the app has been in the background.
    appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reregisterStoredSession().catch(() => {})
    })
  }
  reregisterStoredSession().catch(() => {})
}

/**
 * Starts live tracking for a freshly placed delivery order.
 * `order` needs `_id`, `orderId` and optionally `restaurant.name`, `isPickedUp`, `orderStatus`.
 */
const startForOrder = async (order) => {
  if (!isAvailable() || !order?._id) return null
  if (order.isPickedUp) return null // self-pickup orders have no delivery to track
  if (TERMINAL_STATUSES.includes(String(order.orderStatus || '').toUpperCase())) return null

  if (Platform.OS === 'ios' && !(await ActivityController.areLiveActivitiesEnabled())) {
    log('Live Activities disabled by the user')
    return null
  }
  if (Platform.OS === 'android' && !(await requestAndroidPermission())) {
    log('notification permission denied')
    return null
  }

  const orderId = String(order._id)
  const result = parseNativeResult(
    await ActivityController.startLiveActivity(
      JSON.stringify({
        orderId,
        displayOrderId: String(order.orderId ?? orderId),
        restaurantName: order.restaurant?.name ?? '',
        restaurantImage: order.restaurant?.image ?? '',
        restaurantLogo: order.restaurant?.logo ?? '',
        state: {
          schemaVersion: SCHEMA_VERSION,
          status: String(order.orderStatus || 'PENDING').toUpperCase(),
          estimatedArrivalEpoch: 0,
          etaUpdatedAtEpoch: Math.floor(Date.now() / 1000),
          riderName: '',
          riderPhone: '',
          language: language()
        }
      })
    )
  )
  log('native start completed', { orderId, activityId: result?.activityId, alreadyRunning: result?.alreadyRunning })

  // One order is tracked at a time; if another order still owns the activity, keep it.
  if (result?.orderId && result.orderId !== orderId) return result

  const pushToken = Platform.OS === 'ios' ? result.pushToken : await getAndroidPushToken()
  await writeSession({ orderId, activityId: result.activityId, pushToken, platform: platformName() })
  // On iOS the token often arrives a moment later via LiveActivityTokenUpdated.
  if (pushToken) {
    registerSession({ orderId, activityId: result.activityId, pushToken }).catch((error) => log('registration failed', error?.message))
  }
  return result
}

/** Ends tracking locally and tells the backend to stop sending updates. */
const stop = async () => {
  if (!isAvailable()) return
  const session = await readSession()
  await ActivityController.stopLiveActivity().catch(() => {})
  await clearSession()
  if (session?.orderId && apolloClient) {
    await apolloClient
      .mutate({ mutation: REMOVE_SESSION, variables: { orderId: session.orderId, activityId: session.activityId } })
      .catch(() => {})
  }
}

export default {
  configure,
  startForOrder,
  stop
}
