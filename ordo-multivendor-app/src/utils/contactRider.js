import { Alert, Linking } from 'react-native'
import i18next from 'i18next'
import { callNumber } from './callNumber'

const tr = (key, fallback) => {
  const value = i18next?.t?.(key)
  return value && value !== key ? value : fallback
}

// WhatsApp needs the full international number as digits only (no "+", spaces or dashes).
const toWhatsAppDigits = (phone) => String(phone || '').replace(/\D/g, '')

const askToCallDirectly = (phone) => {
  if (!phone) {
    Alert.alert(tr('riderContactUnavailable', 'The rider’s contact number is not available right now.'))
    return
  }
  Alert.alert(
    tr('whatsAppUnavailableTitle', 'WhatsApp not available'),
    tr('whatsAppUnavailableCallPrompt', 'We couldn’t open WhatsApp for this rider. Do you want to call them directly? Standard call charges may apply.'),
    [
      { text: tr('cancel', 'Cancel'), style: 'cancel' },
      { text: tr('callDirectly', 'Call directly'), onPress: () => callNumber(phone) }
    ]
  )
}

/**
 * Contacts the rider over WhatsApp (free chat / internet calls). If WhatsApp can't be
 * opened for the rider's number, asks the customer before falling back to a paid direct call.
 */
export const contactRider = async (phone) => {
  const digits = toWhatsAppDigits(phone)
  if (digits.length < 7) {
    askToCallDirectly(phone)
    return
  }

  // openURL (unlike canOpenURL) doesn't need the scheme declared in
  // LSApplicationQueriesSchemes / <queries>; it rejects when no app handles it.
  try {
    await Linking.openURL(`whatsapp://send?phone=${digits}`)
  } catch {
    askToCallDirectly(phone)
  }
}
