import { gql } from "@apollo/client";

export const CREATE_RIDER = gql`
  mutation CreateRider($riderInput: RiderInput!) {
    createRider(riderInput: $riderInput) {
      _id
    }
  }
`;
