import { gql } from "@apollo/client";

import { RIDER_APPLICATION_FIELDS } from "../../mutations/rider";

export const RIDER_APPLICATION = gql`
  query RiderApplication($email: String!, $password: String!) {
    riderApplication(email: $email, password: $password) {
      ${RIDER_APPLICATION_FIELDS}
    }
  }
`;
