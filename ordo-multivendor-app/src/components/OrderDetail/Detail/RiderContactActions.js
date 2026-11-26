import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import TextDefault from '../../Text/TextDefault/TextDefault'
import { scale } from '../../../utils/scaling'
import { contactRider } from '../../../utils/contactRider'
import { callNumber } from '../../../utils/callNumber'

const WHATSAPP_GREEN = '#25D366'

const ActionButton = ({ icon, iconColor, label, onPress, theme }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.button(theme)}>
    <Ionicons name={icon} size={20} color={iconColor} />
    <TextDefault H5 bolder textColor={theme.newFontcolor} style={{ marginHorizontal: scale(6) }}>
      {label}
    </TextDefault>
  </TouchableOpacity>
)

/**
 * Ways for the customer to reach the rider, shown from rider acceptance until delivery.
 * Order of preference: in-app chat / WhatsApp (free) first, paid direct call last.
 */
export const RiderContactActions = ({ theme, riderPhone, onChat }) => {
  const { t } = useTranslation()

  return (
    <View style={styles.row(theme)}>
      <ActionButton theme={theme} icon='chatbubble-ellipses-outline' iconColor={theme.newFontcolor} label={t('chat', { defaultValue: 'Chat' })} onPress={onChat} />
      {!!riderPhone && <ActionButton theme={theme} icon='logo-whatsapp' iconColor={WHATSAPP_GREEN} label='WhatsApp' onPress={() => contactRider(riderPhone)} />}
      {!!riderPhone && <ActionButton theme={theme} icon='call-outline' iconColor={theme.newFontcolor} label={t('call', { defaultValue: 'Call' })} onPress={() => callNumber(riderPhone)} />}
    </View>
  )
}

const styles = {
  row: (theme) => ({
    flexDirection: theme?.isRTL ? 'row-reverse' : 'row',
    gap: scale(8),
    marginTop: scale(10),
    marginBottom: scale(16)
  }),
  button: (theme) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(12),
    borderRadius: scale(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.gray500,
    backgroundColor: theme.themeBackground
  })
}
