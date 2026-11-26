// Quick-tap review feedback. Keys are stored on the review (`tags`) and must stay stable:
// the store app and admin panel map the same keys to labels. Add new keys rather than renaming.
//
// Which set the customer sees depends on the overall star rating they pick:
//   4–5 stars → what went well, 1–3 stars → what went wrong.

export const POSITIVE_REVIEW_TAGS = [
  { key: 'food_tasty', label: 'Tasty food' },
  { key: 'food_hot', label: 'Food was hot' },
  { key: 'food_good_portion', label: 'Good portions' },
  { key: 'order_accurate', label: 'Order was correct' },
  { key: 'packaging_good', label: 'Well packaged' },
  { key: 'rider_fast', label: 'Fast delivery', rider: true },
  { key: 'rider_friendly', label: 'Friendly rider', rider: true },
  { key: 'rider_careful', label: 'Handled with care', rider: true },
  { key: 'app_easy', label: 'Easy to order' }
]

export const NEGATIVE_REVIEW_TAGS = [
  { key: 'food_cold', label: 'Food was cold' },
  { key: 'food_bad_taste', label: 'Didn’t taste good' },
  { key: 'food_small_portion', label: 'Small portions' },
  { key: 'order_wrong', label: 'Wrong or missing items' },
  { key: 'packaging_bad', label: 'Spilled or poor packaging' },
  { key: 'rider_late', label: 'Late delivery', rider: true },
  { key: 'rider_rude', label: 'Rider was rude', rider: true },
  { key: 'rider_lost', label: 'Rider couldn’t find me', rider: true },
  { key: 'app_issue', label: 'App or payment problem' }
]

export const isPositiveRating = (stars) => stars >= 4

export const getReviewTags = (stars, { hasRider = true } = {}) => {
  if (!stars) return []
  const tags = isPositiveRating(stars) ? POSITIVE_REVIEW_TAGS : NEGATIVE_REVIEW_TAGS
  return hasRider ? tags : tags.filter((tag) => !tag.rider)
}

// i18n key for a tag label, e.g. "reviewTag_food_hot"
export const reviewTagI18nKey = (key) => `reviewTag_${key}`
