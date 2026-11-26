// Quick-tap feedback tags customers pick when rating an order.
// Keys must match ordo-multivendor-app/src/utils/reviewTags.js.
export const REVIEW_TAG_LABELS: Record<string, string> = {
  // positive (4–5 stars)
  food_tasty: 'Tasty food',
  food_hot: 'Food was hot',
  food_good_portion: 'Good portions',
  order_accurate: 'Order was correct',
  packaging_good: 'Well packaged',
  rider_fast: 'Fast delivery',
  rider_friendly: 'Friendly rider',
  rider_careful: 'Handled with care',
  app_easy: 'Easy to order',
  // negative (1–3 stars)
  food_cold: 'Food was cold',
  food_bad_taste: 'Didn’t taste good',
  food_small_portion: 'Small portions',
  order_wrong: 'Wrong or missing items',
  packaging_bad: 'Spilled or poor packaging',
  rider_late: 'Late delivery',
  rider_rude: 'Rider was rude',
  rider_lost: 'Rider couldn’t find customer',
  app_issue: 'App or payment problem',
};

export const NEGATIVE_REVIEW_TAGS = new Set([
  'food_cold',
  'food_bad_taste',
  'food_small_portion',
  'order_wrong',
  'packaging_bad',
  'rider_late',
  'rider_rude',
  'rider_lost',
  'app_issue',
]);

export const reviewTagLabel = (tag: string) =>
  REVIEW_TAG_LABELS[tag] ??
  tag.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
