export type TMerchantApplicationStatus = 'SUBMITTED' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED';

interface IRef {
  _id: string;
  name?: string | null;
}

export interface IMerchantApplicationSummary {
  _id: string;
  status: TMerchantApplicationStatus;
  createdAt: string;
  submitCount?: number;
  owner: { firstName: string; lastName: string; email: string; phone: string };
  store: { name: string; shopType?: IRef | null; zone?: IRef | null };
}

export interface IMerchantApplication extends IMerchantApplicationSummary {
  reviewNote?: string | null;
  vendor?: string | null;
  restaurant?: string | null;
  storeUsername?: string | null;
  business: {
    legalName: string;
    registrationNumber?: string | null;
    taxId?: string | null;
    businessLicenseUrl?: string | null;
    ownerIdUrl?: string | null;
  };
  store: IMerchantApplicationSummary['store'] & {
    cuisines?: string[] | null;
    phone?: string | null;
    address: string;
    city?: string | null;
    postCode?: string | null;
    location?: { latitude: number; longitude: number } | null;
    logo?: string | null;
    coverImage?: string | null;
    openingTimes?: { day: string; times?: { startTime: string[]; endTime: string[] }[] | null }[] | null;
    menuPhotos?: string[] | null;
    notes?: string | null;
  };
  bank?: {
    bankName?: string | null;
    accountHolder?: string | null;
    accountNumber?: string | null;
    routingCode?: string | null;
  } | null;
  history?: { status: TMerchantApplicationStatus; note?: string | null; at?: string | null }[] | null;
}
