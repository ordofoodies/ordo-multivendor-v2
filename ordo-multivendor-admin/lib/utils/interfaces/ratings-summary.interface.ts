export type TRatingCategory = 'RESTAURANT' | 'FOOD' | 'RIDER' | 'SERVICE';

export interface IRatingStat {
  average: number;
  count: number;
  // index 0 = 1 star ... index 4 = 5 stars
  distribution: number[];
}

export interface IReviewTagCount {
  tag: string;
  count: number;
}

export interface IRatingsSummary {
  totalReviews: number;
  withComments: number;
  topTags: IReviewTagCount[];
  restaurant: IRatingStat;
  food: IRatingStat;
  rider: IRatingStat;
  service: IRatingStat;
}

export interface IRatedEntity {
  _id: string;
  name: string;
  average: number;
  count: number;
}

export interface IAdminReview {
  _id: string;
  createdAt: string | null;
  orderId: string | null;
  rating: number;
  foodRating: number | null;
  riderRating: number | null;
  serviceRating: number | null;
  tags: string[] | null;
  comments: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  riderId: string | null;
  riderName: string | null;
  customerName: string | null;
}

export interface IAdminReviewsPage {
  total: number;
  reviews: IAdminReview[];
}
