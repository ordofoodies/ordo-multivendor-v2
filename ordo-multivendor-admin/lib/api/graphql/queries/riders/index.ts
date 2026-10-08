import { gql } from '@apollo/client';

export const GET_RIDERS = gql`
  query riders {
    riders {
      _id
      name
      email
      username
      password
      phone
      available
      vehicleType
      assigned
      madeBy
      riderRequestStatus
      rejectionReason
      applyCount
      createdAt
      zone {
        _id
        title
      }
    }
  }
`;

export const GET_RIDER = gql`
  query Rider($id: String!) {
    rider(id: $id) {
      _id
      name
      email
      username
      password
      phone
      available
      assigned
      zone {
        _id
        title
      }
      bussinessDetails {
        bankName
        accountName
        accountCode
        accountNumber
        bussinessRegNo
        companyRegNo
        taxRate
      }
      licenseDetails {
        number
        expiryDate
        image
      }
      vehicleDetails {
        number
        image
      }
      vehicleType
      image
      workArea
      riderRequestStatus
      requiredDocuments
      missingDocuments
      documents {
        profilePhoto {
          originalUrl
          processedUrl
          status
          rejectionReason
          processingStatus
          processingError
        }
        driverLicense { url backUrl number expiryDate status rejectionReason uploadedAt reviewedAt }
        vehicleRegistration { url backUrl number expiryDate status rejectionReason uploadedAt reviewedAt }
        insurance { url backUrl number expiryDate status rejectionReason uploadedAt reviewedAt }
        platePhoto { url backUrl number expiryDate status rejectionReason uploadedAt reviewedAt }
        ownershipProof { url backUrl number expiryDate status rejectionReason uploadedAt reviewedAt }
        idDocument { url backUrl number expiryDate status rejectionReason uploadedAt reviewedAt }
      }
    }
  }
`;

export const GET_AVAILABLE_RIDERS = gql`
  query {
    availableRiders {
      _id
      name
      username
      phone
      available
      vehicleType
      zone {
        _id
      }
    }
  }
`;
export const GET_RIDERS_BY_ZONE = gql`
  query RidersByZone($id: String!) {
    ridersByZone(id: $id) {
      _id
      name
      username
      phone
      available
      vehicleType
      zone {
        _id
        title
      }
    }
  }
`;
