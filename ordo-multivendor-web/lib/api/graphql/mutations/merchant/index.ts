import { gql } from "@apollo/client";

export const MERCHANT_APPLICATION_FIELDS = `
  _id
  status
  reviewNote
  storeUsername
  owner { firstName lastName email phone }
  business { legalName registrationNumber taxId businessLicenseUrl ownerIdUrl }
  store {
    name
    shopType { _id name }
    cuisines
    phone
    address
    city
    postCode
    location { latitude longitude }
    logo
    coverImage
    openingTimes { day times { startTime endTime } }
    menuPhotos
    notes
  }
  bank { bankName accountHolder accountNumber routingCode }
`;

export const SUBMIT_MERCHANT_APPLICATION = gql`
  mutation SubmitMerchantApplication($input: MerchantApplicationInput!) {
    submitMerchantApplication(input: $input) {
      _id
      status
    }
  }
`;

export const RESUBMIT_MERCHANT_APPLICATION = gql`
  mutation ResubmitMerchantApplication(
    $email: String!
    $password: String!
    $input: MerchantApplicationInput!
  ) {
    resubmitMerchantApplication(email: $email, password: $password, input: $input) {
      ${MERCHANT_APPLICATION_FIELDS}
    }
  }
`;

export const MERCHANT_APPLICATION_STATUS = gql`
  query MerchantApplicationStatus($email: String!, $password: String!) {
    merchantApplicationStatus(email: $email, password: $password) {
      ${MERCHANT_APPLICATION_FIELDS}
    }
  }
`;

export const MERCHANT_FORM_OPTIONS = gql`
  query MerchantFormOptions {
    fetchAllShopTypes {
      data {
        _id
        name
      }
    }
    cuisines {
      _id
      name
      shopType
    }
  }
`;
