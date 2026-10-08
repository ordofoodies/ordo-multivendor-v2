import { gql } from '@apollo/client'
import { Linking } from 'react-native'
import { myOrders } from '../../apollo/queries'

// Deep links emitted by the Live Activity (iOS) and the progress notification (Android):
//   ordo-customer://order-tracking?id=<orderId>[&chat=rider]
//   ordo-customer://call-rider?phone=<phone>        (iOS only; widgets cannot open tel: directly)
const APP_SCHEME = 'ordo-customer'

const MY_ORDERS = gql`
  ${myOrders}
`

const parse = (url) => {
  if (typeof url !== 'string' || !url.toLowerCase().startsWith(`${APP_SCHEME}://`)) return null
  const [, rest] = url.split('://')
  const [host, query = ''] = rest.split('?')
  const params = {}
  query.split('&').forEach((pair) => {
    if (!pair) return
    const [key, value = ''] = pair.split('=')
    params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '))
  })
  return { host: host.replace(/\/$/, '').toLowerCase(), params }
}

const dialRider = (phone) => {
  const trimmed = String(phone || '').trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 5) return
  Linking.openURL(`tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`).catch(() => {})
}

const findOrder = async (client, orderId) => {
  try {
    const { data } = await client.query({ query: MY_ORDERS, fetchPolicy: 'cache-first' })
    return data?.orders?.find((order) => order._id === orderId) ?? null
  } catch {
    return null
  }
}

/**
 * Handles a Live Activity deep link. Returns true when the URL belonged to the Live Activity.
 * `navigate(routeName, params)` must only be called once navigation is ready.
 */
export const handleLiveActivityUrl = async (url, { client, navigate }) => {
  const link = parse(url)
  if (!link) return false

  if (link.host === 'call-rider') {
    dialRider(link.params.phone)
    return true
  }

  if (link.host !== 'order-tracking' || !link.params.id) return false

  const orderId = link.params.id
  navigate('OrderDetail', { _id: orderId })

  if (link.params.chat === 'rider') {
    const order = await findOrder(client, orderId)
    if (order?.rider) {
      navigate('ChatWithRider', {
        id: order._id,
        orderNo: order.orderId,
        total: order.orderAmount,
        riderPhone: order.rider.phone
      })
    }
  }
  return true
}

/**
 * Subscribes to incoming URLs and replays the URL that launched the app.
 * Returns an unsubscribe function.
 */
export const subscribeToLiveActivityLinks = ({ client, navigate }) => {
  Linking.getInitialURL()
    .then((url) => url && handleLiveActivityUrl(url, { client, navigate }))
    .catch(() => {})
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleLiveActivityUrl(url, { client, navigate }).catch(() => {})
  })
  return () => subscription.remove()
}
