import React, { useLayoutEffect, useRef, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useMutation } from '@apollo/client'
import { useTranslation } from 'react-i18next'

import { CONFIRM_MEMBERSHIP_CHECKOUT, MY_MEMBERSHIP } from '../../apollo/membership'
import { FlashMessage } from '../../ui/FlashMessage/FlashMessage'

// Stripe returns to the web's /membership page (success_url / cancel_url set by
// the API). We catch those URLs here instead of loading them.
const SESSION_RE = /\/membership\?(?:.*&)?session_id=([^&#]+)/
const CANCEL_RE = /\/membership\?(?:.*&)?canceled=1/

function MembershipCheckout(props) {
  const { t } = useTranslation()
  const { url } = props?.route?.params ?? {}
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const handled = useRef(false)

  const [confirm] = useMutation(CONFIRM_MEMBERSHIP_CHECKOUT, {
    refetchQueries: [{ query: MY_MEMBERSHIP }],
    awaitRefetchQueries: true
  })

  useLayoutEffect(() => {
    props?.navigation.setOptions({ headerRight: null, title: t('membershipCheckoutTitle') })
  }, [props?.navigation])

  // returns false when the URL was ours and must not be loaded
  const intercept = (nextUrl) => {
    if (handled.current || !nextUrl) return !handled.current
    const success = nextUrl.match(SESSION_RE)
    if (success) {
      handled.current = true
      setConfirming(true)
      // activate right away instead of waiting for Stripe's webhook
      confirm({ variables: { sessionId: decodeURIComponent(success[1]) } })
        .then(() => FlashMessage({ message: t('membershipWelcome') }))
        .catch((error) =>
          FlashMessage({ message: error?.graphQLErrors?.[0]?.message || t('membershipConfirmFailed') })
        )
        .finally(() => props?.navigation.goBack())
      return false
    }
    if (CANCEL_RE.test(nextUrl)) {
      handled.current = true
      FlashMessage({ message: t('membershipCheckoutCanceled') })
      props?.navigation.goBack()
      return false
    }
    return true
  }

  return (
    <View style={{ flex: 1 }}>
      {url && !confirming ? (
        <WebView
          javaScriptEnabled
          bounces={false}
          source={{ uri: url }}
          onLoad={() => setLoading(false)}
          onShouldStartLoadWithRequest={(request) => intercept(request.url)}
          // Android doesn't always ask for redirects; catch them here too
          onNavigationStateChange={(state) => intercept(state.url)}
        />
      ) : null}
      {loading || confirming ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ActivityIndicator size='large' />
        </View>
      ) : null}
    </View>
  )
}

export default MembershipCheckout
