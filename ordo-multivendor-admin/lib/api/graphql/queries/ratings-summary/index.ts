import { gql } from '@apollo/client';

const RATING_STAT = `
  average
  count
  distribution
`;

export const GET_RATINGS_SUMMARY = gql`
  query RatingsSummary($dateFrom: String, $dateTo: String) {
    ratingsSummary(dateFrom: $dateFrom, dateTo: $dateTo) {
      totalReviews
      withComments
      topTags {
        tag
        count
      }
      restaurant { ${RATING_STAT} }
      food { ${RATING_STAT} }
      rider { ${RATING_STAT} }
      service { ${RATING_STAT} }
    }
  }
`;

export const GET_RATINGS_LEADERBOARD = gql`
  query RatingsLeaderboard(
    $type: String!
    $dateFrom: String
    $dateTo: String
    $limit: Int
  ) {
    ratingsLeaderboard(
      type: $type
      dateFrom: $dateFrom
      dateTo: $dateTo
      limit: $limit
    ) {
      _id
      name
      average
      count
    }
  }
`;

export const GET_ADMIN_REVIEWS = gql`
  query AdminReviews(
    $page: Int
    $limit: Int
    $dateFrom: String
    $dateTo: String
    $category: String
    $maxStars: Int
    $withCommentsOnly: Boolean
  ) {
    adminReviews(
      page: $page
      limit: $limit
      dateFrom: $dateFrom
      dateTo: $dateTo
      category: $category
      maxStars: $maxStars
      withCommentsOnly: $withCommentsOnly
    ) {
      total
      reviews {
        _id
        createdAt
        orderId
        rating
        foodRating
        riderRating
        serviceRating
        tags
        comments
        restaurantId
        restaurantName
        riderId
        riderName
        customerName
      }
    }
  }
`;
