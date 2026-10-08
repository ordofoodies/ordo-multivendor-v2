// /*****************************
//  * environment.js
//  * path: '/environment.js' (root of your project)
//  ******************************/

import { useContext } from 'react'
import ConfigurationContext from './src/context/Configuration'
import * as Updates from 'expo-updates'

const useEnvVars = (env = Updates.channel) => {
  const configuration = useContext(ConfigurationContext)
  console.log('🔧 [useEnvVars] Environment:', env)
  console.log('🔧 [useEnvVars] Configuration:', configuration)
  console.log('🔧 [useEnvVars] Google API Key:', configuration?.googleApiKey)

  if (env === 'production' || env === 'staging') {
    return {

      // GRAPHQL_URL: 'https://ordo-api-v2-production.up.railway.app/graphql',
      // WS_GRAPHQL_URL: 'wss://ordo-api-v2-production.up.railway.app/graphql',
      // SERVER_URL: 'https://ordo-api-v2-production.up.railway.app/graphql',
      // SERVER_REST_URL: 'https://ordo-api-v2-production.up.railway.app/',
      GRAPHQL_URL: 'https://5k2n1mch-8001.inc1.devtunnels.ms/graphql',
      WS_GRAPHQL_URL: 'wss://5k2n1mch-8001.inc1.devtunnels.ms/graphql',
      SERVER_URL: 'https://5k2n1mch-8001.inc1.devtunnels.ms/graphql',
      SERVER_REST_URL: 'https://5k2n1mch-8001.inc1.devtunnels.ms/',

      IOS_CLIENT_ID_GOOGLE: configuration?.iOSClientID,
      ANDROID_CLIENT_ID_GOOGLE: configuration?.androidClientID,
      AMPLITUDE_API_KEY: configuration?.appAmplitudeApiKey,
      GOOGLE_MAPS_KEY: configuration?.googleApiKey,
      EXPO_CLIENT_ID: configuration?.expoClientID,
      SENTRY_DSN: configuration?.customerAppSentryUrl ?? 'https://a1b557c6994834ea179d3c0a822cee76@o4510397051502592.ingest.de.sentry.io/4510397087481936',
      TERMS_AND_CONDITIONS: configuration?.termsAndConditions,
      PRIVACY_POLICY: configuration?.privacyPolicy,
      TEST_OTP: configuration?.testOtp,
      GOOGLE_PACES_API_BASE_URL: configuration?.googlePlacesApiBaseUrl
    }
  }

  return {

    GRAPHQL_URL: 'https://5k2n1mch-8001.inc1.devtunnels.ms/graphql',
    WS_GRAPHQL_URL: 'wss://5k2n1mch-8001.inc1.devtunnels.ms/graphql',
    SERVER_URL: 'https://5k2n1mch-8001.inc1.devtunnels.ms/graphql',
    SERVER_REST_URL: 'https://5k2n1mch-8001.inc1.devtunnels.ms/',
    // GRAPHQL_URL: 'https://ordo-api-v2-production.up.railway.app/graphql',
    // WS_GRAPHQL_URL: 'wss://ordo-api-v2-production.up.railway.app/graphql',
    // SERVER_URL: 'https://ordo-api-v2-production.up.railway.app/graphql',
    // SERVER_REST_URL: 'https://ordo-api-v2-production.up.railway.app/',

    IOS_CLIENT_ID_GOOGLE: configuration?.iOSClientID,
    ANDROID_CLIENT_ID_GOOGLE: configuration?.androidClientID,
    AMPLITUDE_API_KEY: configuration?.appAmplitudeApiKey,
    GOOGLE_MAPS_KEY: configuration?.googleApiKey,
    EXPO_CLIENT_ID: configuration?.expoClientID,
    SENTRY_DSN: configuration?.customerAppSentryUrl ?? 'https://a1b557c6994834ea179d3c0a822cee76@o4510397051502592.ingest.de.sentry.io/4510397087481936',
    TERMS_AND_CONDITIONS: configuration?.termsAndConditions,
    PRIVACY_POLICY: configuration?.privacyPolicy,
    TEST_OTP: configuration?.testOtp,
    GOOGLE_PACES_API_BASE_URL: configuration?.googlePlacesApiBaseUrl
  }
}

export default useEnvVars
