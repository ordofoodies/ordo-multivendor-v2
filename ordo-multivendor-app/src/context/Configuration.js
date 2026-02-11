import React from 'react'
import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'

import { getConfiguration } from '../apollo/queries'

const GETCONFIGURATION = gql`
  ${getConfiguration}
`

const ConfigurationContext = React.createContext({})

export const ConfigurationProvider = props => {
  const { loading, data, error } = useQuery(GETCONFIGURATION)

  const WEB_CLIENT_ID = '822560760184-039q45jjdc1b7thg39qi37js40tmdb14.apps.googleusercontent.com';
  const ANDROID_CLIENT_ID = '822560760184-v5rhhue5lfqhtferr234butm08qgg95o.apps.googleusercontent.com';
  const IOS_CLIENT_ID = '822560760184-qjcj5ho18j2kpdi03ne4cejlfs55t1rl.apps.googleusercontent.com';

  const configuration =
    loading || error || !data?.configuration
      ? {
          currency: '',
          currencySymbol: '',
          deliveryRate: 10,
          costType: 'perKM',
          expoClientID: WEB_CLIENT_ID,
          androidClientID:ANDROID_CLIENT_ID,
          iOSClientID:IOS_CLIENT_ID
        }
      : data?.configuration
  
  return (
    <ConfigurationContext.Provider value={configuration}>
      {props?.children}
    </ConfigurationContext.Provider>
  )
}
export const ConfigurationConsumer = ConfigurationContext.Consumer
export default ConfigurationContext
