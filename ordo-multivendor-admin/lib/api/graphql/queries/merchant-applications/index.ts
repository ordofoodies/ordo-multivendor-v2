import { gql } from '@apollo/client';

const APPLICATION_SUMMARY = `
  _id
  status
  createdAt
  submitCount
  owner { firstName lastName email phone }
  store { name shopType { _id name } zone { _id name } }
`;

const APPLICATION_DETAIL = `
  ${APPLICATION_SUMMARY}
  reviewNote
  vendor
  restaurant
  storeUsername
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
    zone { _id name }
    logo
    coverImage
    openingTimes { day times { startTime endTime } }
    menuPhotos
    notes
  }
  bank { bankName accountHolder accountNumber routingCode }
  history { status note at }
`;

export const GET_MERCHANT_APPLICATIONS = gql`
  query MerchantApplications($status: String) {
    merchantApplications(status: $status) {
      ${APPLICATION_SUMMARY}
    }
  }
`;

export const GET_MERCHANT_APPLICATION = gql`
  query MerchantApplication($id: ID!) {
    merchantApplication(id: $id) {
      ${APPLICATION_DETAIL}
    }
  }
`;

export const APPROVE_MERCHANT_APPLICATION = gql`
  mutation ApproveMerchantApplication($id: ID!, $deliveryRadiusKm: Float) {
    approveMerchantApplication(id: $id, deliveryRadiusKm: $deliveryRadiusKm) {
      _id
      status
    }
  }
`;

export const REQUEST_MERCHANT_APPLICATION_INFO = gql`
  mutation RequestMerchantApplicationInfo($id: ID!, $note: String!) {
    requestMerchantApplicationInfo(id: $id, note: $note) {
      _id
      status
    }
  }
`;

export const REJECT_MERCHANT_APPLICATION = gql`
  mutation RejectMerchantApplication($id: ID!, $reason: String!) {
    rejectMerchantApplication(id: $id, reason: $reason) {
      _id
      status
    }
  }
`;
