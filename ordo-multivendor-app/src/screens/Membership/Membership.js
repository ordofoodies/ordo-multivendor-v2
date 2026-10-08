import React, { useCallback, useContext, useLayoutEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons'
import { HeaderBackButton } from '@react-navigation/elements'
import { useFocusEffect } from '@react-navigation/native'
import { useMutation } from '@apollo/client'
import { useTranslation } from 'react-i18next'

import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import ConfigurationContext from '../../context/Configuration'
import UserContext from '../../context/User'
import { theme } from '../../utils/themeColors'
import TextDefault from '../../components/Text/TextDefault/TextDefault'
import { FlashMessage } from '../../ui/FlashMessage/FlashMessage'
import navigationService from '../../routes/navigationService'
import { CANCEL_MEMBERSHIP, RESUME_MEMBERSHIP, START_MEMBERSHIP_CHECKOUT } from '../../apollo/membership'
import useMembership, { benefitLines, planPriceText } from '../../ui/hooks/useMembership'

const errorMessage = (error, fallback) => error?.graphQLErrors?.[0]?.message || fallback

function Membership(props) {
  const { t, i18n } = useTranslation()
  const themeContext = useContext(ThemeContext)
  const currentTheme = { isRTL: i18n.dir() === 'rtl', ...theme[themeContext.ThemeValue] }
  const configuration = useContext(ConfigurationContext)
  const { isLoggedIn } = useContext(UserContext)
  const currency = configuration?.currencySymbol ?? ''
  const { program, membership, isMember, totalSaved, ordersWithSavings, trialAvailable, loading, refetch } = useMembership()
  const [joiningPlan, setJoiningPlan] = useState(null)

  const [startCheckout] = useMutation(START_MEMBERSHIP_CHECKOUT)
  const [cancel, { loading: canceling }] = useMutation(CANCEL_MEMBERSHIP)
  const [resume, { loading: resuming }] = useMutation(RESUME_MEMBERSHIP)

  // back from the payment page or another screen: show the latest state
  useFocusEffect(
    useCallback(() => {
      refetch()
      setJoiningPlan(null)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  useLayoutEffect(() => {
    props?.navigation.setOptions({
      headerTitle: program?.name || t('membershipTitle'),
      headerTitleAlign: 'center',
      headerTitleStyle: { color: currentTheme.fontMainColor, fontSize: 16 },
      headerStyle: { backgroundColor: currentTheme.themeBackground },
      headerLeft: () => (
        <HeaderBackButton
          truncatedLabel=''
          backImage={() => (
            <View style={{ backgroundColor: 'white', borderRadius: 50, marginLeft: 10, alignItems: 'center' }}>
              <MaterialIcons name='arrow-back' size={30} color='black' />
            </View>
          )}
          onPress={() => navigationService.goBack()}
        />
      )
    })
  }, [props?.navigation, program?.name, currentTheme.themeBackground])

  const join = async (plan) => {
    if (!isLoggedIn) {
      props?.navigation.navigate('CreateAccount')
      return
    }
    setJoiningPlan(plan._id)
    try {
      const { data } = await startCheckout({ variables: { planId: plan._id } })
      props?.navigation.navigate('MembershipCheckout', { url: data.startMembershipCheckout })
    } catch (error) {
      setJoiningPlan(null)
      FlashMessage({ message: errorMessage(error, t('membershipCheckoutFailed')) })
    }
  }

  const toggleRenewal = () => {
    const run = async () => {
      try {
        await (membership?.cancelAtPeriodEnd ? resume() : cancel())
        await refetch()
      } catch (error) {
        FlashMessage({ message: errorMessage(error, t('membershipUpdateFailed')) })
      }
    }
    if (membership?.cancelAtPeriodEnd) {
      run()
      return
    }
    Alert.alert(t('membershipCancelTitle'), t('membershipCancelBody', { date: endDate }), [
      { text: t('membershipKeep'), style: 'cancel' },
      { text: t('membershipCancel'), style: 'destructive', onPress: run }
    ])
  }

  const s = styles(currentTheme)
  const endDate = membership ? new Date(membership.currentPeriodEnd).toLocaleDateString() : ''

  if (loading && !program) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={currentTheme.main} />
      </View>
    )
  }

  if (!program?.enabled) {
    return (
      <View style={[s.container, s.center, { padding: 24 }]}>
        <MaterialCommunityIcons name='crown' size={44} color={currentTheme.main} />
        <TextDefault H3 bolder center textColor={currentTheme.fontMainColor} style={{ marginTop: 12 }}>
          {t('membershipUnavailableTitle')}
        </TextDefault>
        <TextDefault center textColor={currentTheme.fontSecondColor} style={{ marginTop: 6 }}>
          {t('membershipUnavailableBody')}
        </TextDefault>
      </View>
    )
  }

  const perks = [
    ...(program.perks ?? []),
    ...(program.freeDeliveryMinOrder > 0 ? [t('membershipMinOrderNote', { amount: `${currency}${program.freeDeliveryMinOrder}` })] : [])
  ]
  const showTrial = program.trialDays > 0 && trialAvailable

  const Check = ({ text, light }) => (
    <View style={s.checkRow}>
      <Ionicons name='checkmark-circle' size={18} color={light ? '#fff' : '#16a34a'} />
      <TextDefault textColor={light ? '#fff' : currentTheme.fontMainColor} style={s.checkText} isRTL>
        {text}
      </TextDefault>
    </View>
  )

  return (
    <SafeAreaView edges={['bottom']} style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* hero */}
        <View style={s.hero}>
          <View style={s.crown}>
            <MaterialCommunityIcons name='crown' size={30} color={currentTheme.main} />
          </View>
          <TextDefault H2 bolder center textColor='#fff'>
            {program.name}
          </TextDefault>
          {program.tagline ? (
            <TextDefault center textColor='#fff' style={{ marginTop: 4, opacity: 0.9 }}>
              {program.tagline}
            </TextDefault>
          ) : null}
          {perks.length ? (
            <View style={{ marginTop: 14, alignSelf: 'stretch' }}>
              {perks.map((perk) => (
                <Check key={perk} text={perk} light />
              ))}
            </View>
          ) : null}
        </View>

        {isMember && membership ? (
          <View style={s.card}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <TextDefault small textColor={currentTheme.fontSecondColor}>
                  {t('membershipYourPlan')}
                </TextDefault>
                <TextDefault H4 bolder textColor={currentTheme.fontMainColor}>
                  {membership.planSnapshot?.name ?? program.name}
                </TextDefault>
              </View>
              <View style={s.pillGreen}>
                <TextDefault small bold textColor='#15803d'>
                  {membership.status === 'trialing' ? t('membershipStatusTrial') : t('membershipStatusActive')}
                </TextDefault>
              </View>
            </View>

            <TextDefault textColor={currentTheme.fontSecondColor} style={{ marginTop: 10 }} isRTL>
              {membership.source === 'admin'
                ? t('membershipGrantedUntil', { date: endDate })
                : membership.cancelAtPeriodEnd
                  ? t('membershipEndsOn', { date: endDate })
                  : membership.status === 'trialing'
                    ? t('membershipTrialEnds', { date: endDate })
                    : t('membershipRenewsOn', { date: endDate })}
            </TextDefault>

            <View style={{ marginTop: 12 }}>
              {benefitLines(t, membership.benefits, currency).map((line) => (
                <Check key={line} text={line} />
              ))}
            </View>

            <View style={s.savings}>
              <MaterialCommunityIcons name='piggy-bank-outline' size={24} color={currentTheme.main} />
              <TextDefault textColor={currentTheme.fontMainColor} style={{ flex: 1, marginLeft: 10 }} isRTL>
                {ordersWithSavings > 0
                  ? t('membershipSavings', { amount: `${currency}${Number(totalSaved).toFixed(2)}`, count: ordersWithSavings })
                  : t('membershipSavingsNone')}
              </TextDefault>
            </View>

            {membership.source === 'stripe' ? (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={canceling || resuming}
                onPress={toggleRenewal}
                style={[membership.cancelAtPeriodEnd ? s.primaryButton : s.outlineButton, { marginTop: 16 }]}
              >
                {canceling || resuming ? (
                  <ActivityIndicator color={membership.cancelAtPeriodEnd ? '#fff' : currentTheme.fontMainColor} />
                ) : (
                  <TextDefault bold textColor={membership.cancelAtPeriodEnd ? '#fff' : currentTheme.fontMainColor}>
                    {membership.cancelAtPeriodEnd ? t('membershipResume') : t('membershipCancel')}
                  </TextDefault>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
            <TextDefault H4 bolder textColor={currentTheme.fontMainColor} style={s.sectionTitle} isRTL>
              {t('membershipChoosePlan')}
            </TextDefault>
            {program.plans.map((plan) => (
              <View key={plan._id} style={s.card}>
                {plan.badge ? (
                  <View style={s.badge}>
                    <TextDefault small bold textColor='#fff'>
                      {plan.badge}
                    </TextDefault>
                  </View>
                ) : null}
                <TextDefault bold textColor={currentTheme.fontMainColor}>
                  {plan.name}
                </TextDefault>
                <TextDefault H3 bolder textColor={currentTheme.fontMainColor} style={{ marginTop: 4 }}>
                  {planPriceText(t, plan, currency)}
                </TextDefault>
                <View style={{ marginTop: 10 }}>
                  {benefitLines(t, plan, currency).map((line) => (
                    <Check key={line} text={line} />
                  ))}
                </View>
                {showTrial ? (
                  <TextDefault small bold textColor='#16a34a' style={{ marginTop: 8 }}>
                    {t('membershipTrialOffer', { days: program.trialDays })}
                  </TextDefault>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={!!joiningPlan}
                  onPress={() => join(plan)}
                  style={[s.primaryButton, { marginTop: 14, opacity: joiningPlan && joiningPlan !== plan._id ? 0.5 : 1 }]}
                >
                  {joiningPlan === plan._id ? (
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <TextDefault bold textColor='#fff'>
                      {showTrial ? t('membershipStartTrial') : t('membershipJoin')}
                    </TextDefault>
                  )}
                </TouchableOpacity>
              </View>
            ))}
            <TextDefault small center textColor={currentTheme.fontSecondColor} style={{ marginHorizontal: 24, marginTop: 4 }}>
              {t('membershipFinePrint')}
            </TextDefault>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = (currentTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: currentTheme.themeBackground },
    center: { alignItems: 'center', justifyContent: 'center' },
    hero: {
      margin: 16,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: currentTheme.main
    },
    crown: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10
    },
    sectionTitle: { marginHorizontal: 16, marginBottom: 4, marginTop: 4 },
    card: {
      marginHorizontal: 16,
      marginTop: 14,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: currentTheme.borderColor ?? '#efefef',
      backgroundColor: currentTheme.cardBackground ?? currentTheme.themeBackground
    },
    badge: {
      position: 'absolute',
      top: -10,
      right: 14,
      backgroundColor: currentTheme.main,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 3
    },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pillGreen: { backgroundColor: '#dcfce7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
    checkText: { marginLeft: 8, flex: 1 },
    savings: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: 'rgba(255,128,0,0.1)'
    },
    primaryButton: {
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.main
    },
    outlineButton: {
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: currentTheme.fontSecondColor
    }
  })

export default Membership
