import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { Image, Keyboard, Platform, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import TextDefault from '../Text/TextDefault/TextDefault'
import CrossCirleIcon from '../../assets/SVG/cross-circle-icon'
import { scale } from '../../utils/scaling'
import StarIcon from '../../assets/SVG/star-icon'
import { styles } from './styles'
import Button from '../Button/Button'
import { order as orderQuery } from '../../apollo/queries'
import gql from 'graphql-tag'
import { useApolloClient, useMutation } from '@apollo/client'
import { reviewOrder } from '../../apollo/mutations'
import { useTranslation } from 'react-i18next'
import { FlashMessage } from '../../ui/FlashMessage/FlashMessage'

const ORDER = gql`${orderQuery}`
const REVIEWORDER = gql`
  ${reviewOrder}
`

const EMPTY_RATINGS = { food: 0, rider: 0, service: 0 }
const isIOS = Platform.OS === 'ios'

function Review({ onOverlayPress, theme, orderId, rating }, ref) {
  const { t } = useTranslation()
  const client = useApolloClient()

  // overall restaurant rating; starts from the star tapped on the order card
  const [overall, setOverall] = useState(rating || 0)
  const [ratings, setRatings] = useState(EMPTY_RATINGS)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState()

  const [mutate] = useMutation(REVIEWORDER)

  // Android keyboard handling: pad the content by the keyboard height so the
  // input/submit can scroll above it, then scroll them into view.
  const contentRef = useRef(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (isIOS) return
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e?.endCoordinates?.height || 0)
      setTimeout(() => contentRef.current?.scrollToEnd?.({ animated: true }), 50)
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  useEffect(() => {
    setOverall(rating || 0)
  }, [rating, orderId])

  useEffect(() => {
    if (!orderId) return
    setRatings(EMPTY_RATINGS)
    setDescription('')
    client
      .query({ query: ORDER, variables: { id: orderId } })
      .then((result) => setOrder(result?.data?.order))
      .catch(() => {})
  }, [orderId])

  const hasRider = Boolean(order?.rider?._id) && !order?.isPickedUp
  const setRating = (key) => (value) => setRatings((prev) => ({ ...prev, [key]: value }))

  const close = () => ref?.current?.close()

  const onSubmit = async () => {
    if (loading) return
    if (!overall) {
      FlashMessage({ message: t('pleaseAddStarRating') })
      return
    }
    setLoading(true)
    try {
      await mutate({
        variables: {
          order: orderId,
          rating: overall,
          foodRating: ratings.food || null,
          riderRating: hasRider ? ratings.rider || null : null,
          serviceRating: ratings.service || null,
          description
        }
      })
      FlashMessage({ message: t('thanksForYourFeedback') })
      setDescription('')
      close()
    } catch (error) {
      FlashMessage({ message: error?.graphQLErrors?.[0]?.message || error?.message || t('somethingWentWrong') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modalize
      ref={ref}
      handlePosition='inside'
      withHandle={false}
      adjustToContentHeight
      modalStyle={{ borderWidth: StyleSheet.hairlineWidth }}
      onOverlayPress={onOverlayPress}
      // iOS: Modalize's built-in keyboard avoidance works fine.
      // Android: the app is edge-to-edge, so the window doesn't resize for the
      // keyboard and Modalize can't detect it — handled manually below.
      avoidKeyboardLikeIOS={isIOS}
      keyboardAvoidingBehavior='padding'
      contentRef={contentRef}
      // Modalize renders its own ScrollView; nesting another one breaks scrolling.
      scrollViewProps={{
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false
      }}
    >
        <View style={[styles.container(theme), { paddingBottom: scale(20) + (isIOS ? 0 : keyboardHeight) }]}>
          <View style={styles.headingContainer(theme)}>
            <TextDefault bolder H3 textColor={theme.gray900}>
              {t('howWasOrder')}
            </TextDefault>
            <TouchableOpacity onPress={close}>
              <CrossCirleIcon stroke={theme.newIconColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.itemContainer(theme)}>
            <View style={{ justifyContent: 'space-evenly', flex: 1 }}>
              {order?.items?.slice(0, 2).map((item, index) => (
                <TextDefault key={`${item.food}-${index}`} H5 bold textColor={theme.gray900} isRTL>
                  {item.title}
                </TextDefault>
              ))}
              {order?.deliveredAt && (
                <TextDefault textColor={theme.gray500} isRTL>
                  {new Date(order.deliveredAt).toLocaleString()}
                </TextDefault>
              )}
            </View>
            <Image source={order?.restaurant?.image ? { uri: order.restaurant.image } : require('../../assets/images/food_placeholder.png')} style={styles.image} />
          </View>

          <TextDefault textColor={theme.gray900} H5 bolder style={{ marginTop: scale(16) }} isRTL>
            {t('rateRestaurant', { name: order?.restaurant?.name || '' })}
          </TextDefault>
          <StarRating value={overall} onSelect={setOverall} theme={theme} />

          {overall > 0 && (
            <View>
              <RatingRow label={t('rateFood')} value={ratings.food} onSelect={setRating('food')} theme={theme} />
              {hasRider && (
                <RatingRow
                  label={order?.rider?.name ? t('rateRiderNamed', { name: order.rider.name }) : t('rateRider')}
                  value={ratings.rider}
                  onSelect={setRating('rider')}
                  theme={theme}
                />
              )}
              <RatingRow label={t('rateOrdoService')} value={ratings.service} onSelect={setRating('service')} theme={theme} />

              <TextDefault textColor={theme.gray900} H5 bolder style={{ marginVertical: scale(8) }} isRTL>
                {t('tellAboutExp')} {order?.restaurant?.name}
              </TextDefault>
              <TextInput
                placeholder={t('typeHere')}
                placeholderTextColor={theme.placeholderColor}
                value={description}
                onChangeText={setDescription}
                maxLength={500}
                multiline
                style={[styles.modalInput(theme), { minHeight: scale(60), textAlignVertical: 'top' }]}
              />
              <Button
                text={t('submit')}
                buttonProps={{ onPress: onSubmit, disabled: loading }}
                buttonStyles={{ borderRadius: 15, backgroundColor: theme.primary, margin: 10, opacity: loading ? 0.6 : 1 }}
                textStyles={{ margin: 10, alignSelf: 'center' }}
                textProps={{ H4: true, bold: true, textColor: theme.black }}
              />
            </View>
          )}
        </View>
    </Modalize>
  )
}

const RatingRow = ({ label, value, onSelect, theme }) => (
  <View style={styles.ratingRow(theme)}>
    <TextDefault textColor={theme.gray900} bold style={{ flex: 1 }} isRTL>
      {label}
    </TextDefault>
    <StarRating value={value} onSelect={onSelect} theme={theme} size={26} compact />
  </View>
)

const StarRating = ({ value = 0, onSelect, theme, size, compact = false }) => (
  <View style={compact ? styles.smallStarContainer : styles.starContainer(theme)}>
    {[1, 2, 3, 4, 5].map((index) => (
      <TouchableWithoutFeedback key={`star-${index}`} onPress={() => onSelect(index)}>
        <View style={compact ? { paddingHorizontal: 2 } : { flex: 1, alignItems: 'center' }}>
          <StarIcon isFilled={index <= value} size={size} />
        </View>
      </TouchableWithoutFeedback>
    ))}
  </View>
)

export default forwardRef(Review)
