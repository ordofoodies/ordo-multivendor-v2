import { gql } from "@apollo/client";

export const CREATE_RIDER = gql`
  mutation CreateRider($riderInput: RiderInput!) {
    createRider(riderInput: $riderInput) {
      _id
    }
  }
`;

const RIDER_DOCUMENT_FIELDS = `
  url
  backUrl
  number
  expiryDate
  status
  rejectionReason
`;

export const RIDER_APPLICATION_FIELDS = `
  _id
  name
  email
  vehicleType
  riderRequestStatus
  rejectionReason
  requiredDocuments
  vehicleDetails {
    number
  }
  documents {
    profilePhoto {
      originalUrl
      status
      rejectionReason
    }
    driverLicense { ${RIDER_DOCUMENT_FIELDS} }
    vehicleRegistration { ${RIDER_DOCUMENT_FIELDS} }
    insurance { ${RIDER_DOCUMENT_FIELDS} }
    platePhoto { ${RIDER_DOCUMENT_FIELDS} }
    ownershipProof { ${RIDER_DOCUMENT_FIELDS} }
    idDocument { ${RIDER_DOCUMENT_FIELDS} }
  }
`;

export const RESUBMIT_RIDER_DOCUMENTS = gql`
  mutation ResubmitRiderDocuments(
    $email: String!
    $password: String!
    $vehicleNumber: String
    $documents: RiderDocumentsInput!
  ) {
    resubmitRiderDocuments(
      email: $email
      password: $password
      vehicleNumber: $vehicleNumber
      documents: $documents
    ) {
      ${RIDER_APPLICATION_FIELDS}
    }
  }
`;
