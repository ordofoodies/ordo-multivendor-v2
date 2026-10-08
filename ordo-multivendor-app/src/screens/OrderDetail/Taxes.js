import React, { useContext } from 'react'
import TextDefault from '../../components/Text/TextDefault/TextDefault'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import { theme } from '../../utils/themeColors'
import { alignment } from '../../utils/alignment'

import styles from './styles'
import color from '../../components/Text/TextDefault/styles'

const Taxes = ({ tax, deliveryCharges, memberDelivery = 0, memberOrder = 0, currency }) => {
  const themeContext = useContext(ThemeContext)
  const { t, i18n } = useTranslation()
  const currentTheme = {
    isRTL: i18n.dir() === 'rtl',
    ...theme[themeContext.ThemeValue]
  }

  return (
    <View >
      <View
        style={{
          flexDirection: theme?.isRTL ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextDefault
          H5
          isRTL
          bolder
          style={{ ...alignment.Mmedium }}
          textColor={currentTheme.gray900}
          bold
        >
          {' '}
          {t('taxFee')}
        </TextDefault>
        <TextDefault style={{ ...alignment.Mmedium }} bolder H5>
          {' '}
          {currency}{tax}{' '}
        </TextDefault>
      </View>
      <View
        style={{
          flexDirection: theme?.isRTL ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <TextDefault
          H5
          style={{ ...alignment.Mmedium, textAlign: 'center' }}
          textColor={currentTheme.gray900}
          bolder
          isRTL
        >
          {' '}
          {t('delvieryCharges')}
        </TextDefault>
        {memberDelivery > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', ...alignment.Mmedium }}>
            <TextDefault H5 textColor={currentTheme.fontSecondColor} style={{ textDecorationLine: 'line-through', marginRight: 6 }}>
              {currency}{deliveryCharges}
            </TextDefault>
            <TextDefault H5 bolder textColor='#16a34a'>
              {currency}{(deliveryCharges - memberDelivery).toFixed(2)}
            </TextDefault>
          </View>
        ) : (
          <TextDefault H5 bolder style={{ ...alignment.Mmedium }}>
            {' '}
            {currency}{deliveryCharges}{' '}
          </TextDefault>
        )}
      </View>
      {memberOrder > 0 ? (
        <View
          style={{
            flexDirection: theme?.isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <TextDefault H5 isRTL bolder style={{ ...alignment.Mmedium }} textColor={currentTheme.gray900}>
            {' '}
            {t('membershipMemberDiscountLabel')}
          </TextDefault>
          <TextDefault H5 bolder textColor='#16a34a' style={{ ...alignment.Mmedium }}>
            -{currency}{memberOrder.toFixed(2)}
          </TextDefault>
        </View>
      ) : null}
      {memberDelivery + memberOrder > 0 ? (
        <View
          style={{
            flexDirection: theme?.isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginHorizontal: 10,
            marginTop: 4,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: 'rgba(255,128,0,0.1)'
          }}
        >
          <TextDefault bold textColor={currentTheme.main}>
            {t('membershipOrderSaved')}
          </TextDefault>
          <TextDefault bolder textColor={currentTheme.main}>
            {currency}{(memberDelivery + memberOrder).toFixed(2)}
          </TextDefault>
        </View>
      ) : null}
    </View>
  )
}

export default Taxes
