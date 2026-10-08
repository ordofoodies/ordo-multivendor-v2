import * as Device from 'expo-device'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Debug logging for push setup; development builds only so tokens never reach release logs.
export const pushLog = (message, details) => {
  if (__DEV__) console.log(`[Push] ${message}`, details ?? '')
}

// The API sends order pushes on the "default" channel (helpers/notifications.js).
// On Android 13+ a channel must exist before the permission prompt can be shown.
const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C'
  })
}

/**
 * Returns this device's Expo push token, or null when it can't be obtained.
 * With `askPermission` the system prompt is shown if the OS still allows asking.
 * Never throws.
 */
export const getExpoPushToken = async ({ askPermission = true } = {}) => {
  if (!Device.isDevice) {
    pushLog('not a physical device, no push token')
    return null
  }
  try {
    await ensureAndroidChannel()
    let { status, canAskAgain } = await Notifications.getPermissionsAsync()
    pushLog('permission status', { status, canAskAgain })
    if (status !== 'granted' && askPermission && canAskAgain !== false) {
      ;({ status } = await Notifications.requestPermissionsAsync())
      pushLog('permission after prompt', { status })
    }
    if (status !== 'granted') {
      pushLog('permission not granted, no push token')
      return null
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    pushLog('expo push token', { token: data, projectId })
    return data || null
  } catch (error) {
    console.warn('[Push] could not get push notification token:', error?.message)
    return null
  }
}
