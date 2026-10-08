// useCreateAccount.android.js

import { useEffect, useState, useContext } from 'react'
import { StatusBar, Platform } from 'react-native'
import * as Device from 'expo-device'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useEnvVars from '../../../environment' // Adjust path if necessary
import gql from 'graphql-tag'
import { login } from '../../apollo/mutations' // Adjust path if necessary
import ThemeContext from '../../ui/ThemeContext/ThemeContext' // Adjust path if necessary
import { theme } from '../../utils/themeColors' // Adjust path if necessary
import { useMutation } from '@apollo/client'
import * as AppleAuthentication from 'expo-apple-authentication' // Keep import, function will handle platform check
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { FlashMessage } from '../../ui/FlashMessage/FlashMessage' // Adjust path if necessary
import analytics from '../../utils/analytics' // Adjust path if necessary
import AuthContext from '../../context/Auth' // Adjust path if necessary
import { useTranslation } from 'react-i18next'
import { GoogleSignin } from '@react-native-google-signin/google-signin' // Android-specific Google import
import { getStoredReferralCode } from '../../utils/branch.io'
import { getReferralCode, clearReferralCode } from '../../utils/referralStorage'
import { getExpoPushToken, pushLog } from '../../utils/pushNotifications'

const LOGIN = gql`
  ${login}
`

export const useCreateAccount = () => {
  const Analytics = analytics()
  const navigation = useNavigation()
  const { t, i18n } = useTranslation()
  const [mutate] = useMutation(LOGIN, { onCompleted, onError })
  const [enableApple, setEnableApple] = useState(false)
  const [loginButton, loginButtonSetter] = useState(null)
  const [loading, setLoading] = useState(false)
  const { setTokenAsync } = useContext(AuthContext)
  const themeContext = useContext(ThemeContext)
  const [googleUser, setGoogleUser] = useState(null)
  const currentTheme = { isRTL: i18n.dir() === 'rtl', ...theme[themeContext.ThemeValue] }

  const { IOS_CLIENT_ID_GOOGLE, ANDROID_CLIENT_ID_GOOGLE, EXPO_CLIENT_ID, TERMS_AND_CONDITIONS, PRIVACY_POLICY } = useEnvVars()

  // Configure Google Sign-In ONCE for Android
  useEffect(() => {
    console.log('🔧 Configuring Google Sign-In for Android...');
    GoogleSignin.configure({
      webClientId: "822560760184-039q45jjdc1b7thg39qi37js40tmdb14.apps.googleusercontent.com", // Web client ID for Expo
      androidClientId: "822560760184-v5rhhue5lfqhtferr234butm08qgg95o.apps.googleusercontent.com", // Android client ID
      iosClientId: "822560760184-qjcj5ho18j2kpdi03ne4cejlfs55t1rl.apps.googleusercontent.com", // iOS client ID
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,

    });
    console.log('✅ Google Sign-In configured for Android');
  }, []);

  // Google Sign-In Function for Android
  const signIn = async () => {
    try {
      console.log('🚀 Starting Google sign in (Android)...')
      loginButtonSetter('Google')
      setLoading(true)

      // Check for Google Play Services on Android
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices()
        console.log('✅ Google Play Services available')
      }

      const userInfo = await GoogleSignin.signIn()
      console.log('✅ Google sign-in successful!')
      console.log('👤 User:', userInfo.user.email)

      const userData = {
        phone: '',
        email: userInfo.user.email,
        password: '',
        name: userInfo.user.name,
        picture: userInfo.user.photo || '',
        type: 'google'
      }

      setGoogleUser(userInfo.user.name)
      console.log('🔐 Logging in user...')
      await mutateLogin(userData)
    } catch (error) {
      console.error('❌ Google sign-in error:', error)

      if (error.code === 'SIGN_IN_CANCELLED') {
        console.log('❌ User cancelled')
      } else if (error.code === 'IN_PROGRESS') {
        console.log('⏳ Sign in already in progress')
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        console.log('❌ Google Play Services not available')
        FlashMessage({ message: 'Google Play Services not available' })
      } else {
        FlashMessage({ message: 'Google sign in failed' })
      }

      setLoading(false)
      loginButtonSetter(null)
    }
  }

  // --- Common Navigation Functions ---
  const navigateToLogin = () => {
    navigation.navigate('Login')
  }

  const navigateToRegister = () => {
    navigation.navigate('Register')
  }

  const navigateToPhone = () => {
    navigation.navigate('PhoneNumber', {
      name: googleUser,
      phone: ''
    })
  }

  const navigateToMain = () => {
    navigation.navigate({
      name: 'Main',
      merge: true
    })
  }

  // --- Common Login Mutation Function ---
  async function mutateLogin(user) {
    try {
      console.log('🔐 [Login Debug] Starting login mutation for:', user.email)
      console.log('🔐 [Login Debug] User type:', user.type)
      console.log('🔐 [Login Debug] Full user object:', user)

      // Asks for notification permission if needed so order updates can be pushed.
      const notificationToken = await getExpoPushToken()
      pushLog('google login: sending token to API', { email: user.email, type: user.type, notificationToken })

      console.log('🔐 [Login Debug] About to call GraphQL mutation with variables:', {
        ...user,
        notificationToken: notificationToken ? 'token_present' : 'no_token'
      })

      const referralData = await getStoredReferralCode()
      const branchReferralCode = referralData?.code || null
      const storedReferralCode = await getReferralCode()
      const finalReferralCode = storedReferralCode || branchReferralCode

      mutate({
        variables: {
          ...user,
          notificationToken: notificationToken,
          referralCode: finalReferralCode
        }
      })
    } catch (error) {
      console.error('🔐 [Login Debug] ❌ Error in mutateLogin:', error)
      setLoading(false)
      loginButtonSetter(null)
    }
  }

  // --- Common Apple Authentication Check (will always be false on Android) ---
  useEffect(() => {
    checkIfSupportsAppleAuthentication()
  }, [])

  async function checkIfSupportsAppleAuthentication() {
    try {
      console.log('🍎 [Apple Debug] Checking Apple Authentication support...')
      console.log('🍎 [Apple Debug] Platform:', Platform.OS) // Will always be 'android' in this file
      console.log('🍎 [Apple Debug] Device type:', Device.deviceType)

      const isAvailable = await AppleAuthentication.isAvailableAsync()
      console.log('🍎 [Apple Debug] Apple Authentication available:', isAvailable)

      if (Platform.OS === 'ios') {
        console.log('🍎 [Apple Debug] Running on iOS - Apple should be available')
      } else {
        // This block will always be hit in .android.js
        console.log('🍎 [Apple Debug] Not running on iOS - Apple will not be available')
      }

      setEnableApple(isAvailable) // This will correctly be false on Android
    } catch (error) {
      console.error('🍎 [Apple Debug] ❌ Error checking Apple Authentication:', error)
      setEnableApple(false)
    }
  }

  // --- Common Login Success Handler ---
  async function onCompleted(data) {
    pushLog('google login: logged in', { userId: data?.login?.userId, email: data?.login?.email })
    console.log('✅ [Login Debug] Login mutation completed successfully')
    console.log('✅ [Login Debug] Response data:', data)
    console.log('✅ [Login Debug] User email:', data.login.email)
    console.log('✅ [Login Debug] User active status:', data.login.isActive)
    console.log('✅ [Login Debug] User phone:', data.login.phone)

    if (data.login.isActive === false) {
      console.log('❌ [Login Debug] Account is deactivated')
      FlashMessage({ message: t('accountDeactivated') })
      setLoading(false)
      loginButtonSetter(null)
      return
    }

    try {
      console.log('✅ [Login Debug] Setting auth token...')
      await setTokenAsync(data.login.token)
      
      // Verify token was saved
      const savedToken = await AsyncStorage.getItem('token')
      console.log('✅ [Login Debug] Token saved successfully:', savedToken ? 'YES' : 'NO')
      
      // Small delay to ensure token is available for Apollo client
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if user is new and from social login, show referral screen
      if (data.login.isNewUser && (loginButton === 'Google' || loginButton === 'Apple')) {
        const storedReferralCode = await getReferralCode()
        
        if (storedReferralCode) {
          // User has referral code stored, proceed without showing referral screen
          navigation.reset({
            index: 0,
            routes: [
              {
                name: data?.login?.phone === '' ? 'PhoneNumber' : 'Main',
                params: data?.login?.phone === '' ? {
                  name: googleUser,
                  phone: ''
                } : undefined
              }
            ]
          })
        } else {
          // No referral code stored, show referral entry screen
          navigation.navigate('ReferralCodeEntry', { 
            isNewUser: true,
            onComplete: () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: data?.login?.phone === '' ? 'PhoneNumber' : 'Main',
                    params: data?.login?.phone === '' ? {
                      name: googleUser,
                      phone: ''
                    } : undefined
                  }
                ]
              })
            }
          })
        }
      } else {
        // Existing user or non-social login, proceed normally
        navigation.reset({
          index: 0,
          routes: [
            {
              name: data?.login?.phone === '' ? 'PhoneNumber' : 'Main',
              params: data?.login?.phone === '' ? {
                name: googleUser,
                phone: ''
              } : undefined
            }
          ]
        })
      }
      
      FlashMessage({ message: 'Successfully logged in' })
      
      if (data?.login?.phone === '') {
        console.log('✅ [Login Debug] No phone number - navigated to phone screen')
      } else {
        console.log('✅ [Login Debug] Phone number exists - navigated to main app')
      }
    } catch (error) {
      console.error('❌ [Login Debug] Error in onCompleted:', error)
    } finally {
      console.log('✅ [Login Debug] Resetting loading states')
      setLoading(false)
      loginButtonSetter(null)
    }
  }

  // --- Common Login Error Handler ---
  function onError(error) {
    console.error('❌ [Login Debug] Login mutation error occurred')
    console.error('❌ [Login Debug] Error message:', error.message)
    console.error('❌ [Login Debug] Full error object:', error)
    console.error('❌ [Login Debug] GraphQL errors:', error.graphQLErrors)
    console.error('❌ [Login Debug] Network error:', error.networkError)

    FlashMessage({
      message: error.message || 'Login failed. Please try again.'
    })

    setLoading(false)
    loginButtonSetter(null)
  }

  // --- Common Focus Effect for Status Bar (with Android-specific styling) ---
  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(currentTheme.main)
    }
    StatusBar.setBarStyle(themeContext.ThemeValue === 'Dark' ? 'light-content' : 'dark-content')
  })

  // --- Common Link Handlers ---
  const openTerms = () => {
    Linking.openURL(TERMS_AND_CONDITIONS)
  }

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY)
  }

  return {
    enableApple,
    loginButton,
    loginButtonSetter,
    loading,
    setLoading,
    themeContext,
    mutateLogin,
    currentTheme,
    navigateToLogin,
    navigateToRegister,
    openTerms,
    openPrivacyPolicy,
    navigateToMain,
    navigation,
    signIn // Android-specific signIn function
  }
}
