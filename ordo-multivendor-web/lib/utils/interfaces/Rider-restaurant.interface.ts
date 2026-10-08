import { StaticImageData } from "next/image";

export interface Cards {
  image: string | StaticImageData;
  heading: string;
  text: string;
  color:string;
}

export interface WhyCardsListProps {
  cards: Cards[];
}

export interface sideCardProps{
  image:string | StaticImageData,
  heading:string,
  subHeading:string,
  right:boolean
  }
  
  
 export interface sideCardList{
    sideCards:sideCardProps[]
  }


 export interface VendorFormValues {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
  }

export type RiderDocumentKey =
  | "driverLicense"
  | "vehicleRegistration"
  | "insurance"
  | "platePhoto"
  | "ownershipProof"
  | "idDocument";

export interface RiderDocumentFormValue {
  url: string;
  backUrl: string;
  number: string;
  expiryDate: string;
}

export interface RiderRegistrationFormValues {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
  vehicleType: string;
  vehicleNumber: string;
  zoneId: string;
  zoneLabel: string;
  // address the zone was detected from, shown back to the rider
  deliveryArea: string;
  profilePhoto: string;
  documents: Record<RiderDocumentKey, RiderDocumentFormValue>;
  termsAccepted: boolean;
}
