'use client';

// Core
import { useApolloClient, useMutation } from '@apollo/client';
import { useEffect, useState } from 'react';

// PrimeReact Components
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';

// Localization
import { useTranslations } from 'next-intl';

// GraphQL
import {
  GET_RIDER,
  REPROCESS_RIDER_PHOTO,
  REVIEW_RIDER_DOCUMENT,
} from '@/lib/api/graphql';

// Hooks
import useToast from '@/lib/hooks/useToast';

// Components
import RejectionReasonModal from '@/lib/ui/useable-components/rejection-reason-modal';

// Interfaces
import {
  IRiderDetailsProps,
  IRiderDocument,
  IRiderDocuments,
  TRiderDocumentStatus,
} from '@/lib/utils/interfaces';

const DOCUMENT_LABELS: Record<keyof IRiderDocuments, string> = {
  profilePhoto: 'rider_doc_profile_photo',
  driverLicense: 'rider_doc_driver_license',
  vehicleRegistration: 'rider_doc_vehicle_registration',
  insurance: 'rider_doc_insurance',
  platePhoto: 'rider_doc_plate_photo',
  ownershipProof: 'rider_doc_ownership_proof',
  idDocument: 'rider_doc_id_document',
};

const STATUS_SEVERITY: Record<TRiderDocumentStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const errorMessage = (error: unknown, fallback: string) =>
  (error as { graphQLErrors?: { message: string }[] })?.graphQLErrors?.[0]
    ?.message ?? fallback;

const Thumbnail = ({ url, alt }: { url: string; alt: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="block h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-gray-50"
    title={alt}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt={alt} className="h-full w-full object-cover" />
  </a>
);

export default function ApplicationDocuments({ loading, rider }: IRiderDetailsProps) {
  const t = useTranslations();
  const { showToast } = useToast();
  const client = useApolloClient();
  const [rejecting, setRejecting] = useState<keyof IRiderDocuments | null>(null);

  const refetchRider = () => client.refetchQueries({ include: [GET_RIDER] });

  const [review, { loading: reviewLoading }] = useMutation(REVIEW_RIDER_DOCUMENT, {
    onCompleted: refetchRider,
    onError: (error) =>
      showToast({
        type: 'error',
        title: t('Error'),
        message: errorMessage(error, t('rider_doc_review_failed')),
      }),
  });

  const [reprocess, { loading: reprocessLoading }] = useMutation(REPROCESS_RIDER_PHOTO, {
    onCompleted: refetchRider,
    onError: (error) =>
      showToast({
        type: 'error',
        title: t('Error'),
        message: errorMessage(error, t('rider_photo_processing_failed')),
      }),
  });

  const photo = rider?.documents?.profilePhoto;

  // the branded photo is generated in the background; poll until it settles
  useEffect(() => {
    if (photo?.processingStatus !== 'PROCESSING') return;
    const timer = setTimeout(refetchRider, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo?.processingStatus, rider]);

  if (loading) {
    return <Skeleton height="16rem" />;
  }

  // older riders (created by admin or from the app) have no documents at all
  if (!rider?.documents && !rider?.missingDocuments?.length) {
    return null;
  }

  const keys = Array.from(
    new Set([
      ...(rider.requiredDocuments ?? []),
      ...(rider.documents?.idDocument ? ['idDocument'] : []),
    ])
  ) as (keyof IRiderDocuments)[];

  const setStatus = (document: keyof IRiderDocuments, status: TRiderDocumentStatus, reason?: string) =>
    review({ variables: { riderId: rider._id, document, status, reason } });

  const isExpired = (date?: string | null) => !!date && new Date(date) < new Date();

  return (
    <div className="flex flex-col gap-2 overflow-hidden rounded-lg border lg:col-span-2">
      <header className="flex items-center justify-between border-b-[1px] bg-[#F4F4F5] px-6 py-3 dark:bg-dark-900">
        <span className="text-lg font-medium">{t('rider_application_documents')}</span>
        {rider.missingDocuments?.length ? (
          <Tag
            severity="warning"
            value={t('rider_documents_missing_count', { count: rider.missingDocuments.length })}
          />
        ) : null}
      </header>

      <ul className="divide-y">
        {keys.map((key) => {
          const label = t(DOCUMENT_LABELS[key]);
          const isPhoto = key === 'profilePhoto';
          const doc = isPhoto ? photo : (rider.documents?.[key] as IRiderDocument | null | undefined);
          const url = isPhoto ? photo?.originalUrl : (doc as IRiderDocument | undefined)?.url;
          const detail = isPhoto ? undefined : (doc as IRiderDocument | undefined);

          return (
            <li key={key} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-4">
                {url ? (
                  <div className="flex gap-2">
                    <Thumbnail url={url} alt={label} />
                    {detail?.backUrl ? <Thumbnail url={detail.backUrl} alt={`${label} (back)`} /> : null}
                    {isPhoto && photo?.processedUrl ? (
                      <Thumbnail url={photo.processedUrl} alt={t('rider_photo_branded')} />
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-dashed text-xs text-gray-400">
                    {t('rider_doc_not_uploaded')}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <span className="font-medium">{label}</span>
                  {detail?.number ? (
                    <span className="text-xs text-gray-500">#{detail.number}</span>
                  ) : null}
                  {detail?.expiryDate ? (
                    <span className={`text-xs ${isExpired(detail.expiryDate) ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                      {t('rider_doc_expires', { date: new Date(detail.expiryDate).toLocaleDateString() })}
                      {isExpired(detail.expiryDate) ? ` · ${t('rider_doc_expired')}` : ''}
                    </span>
                  ) : null}
                  {doc?.status === 'REJECTED' && doc.rejectionReason ? (
                    <span className="text-xs text-red-600">{doc.rejectionReason}</span>
                  ) : null}
                  {isPhoto && photo?.processingStatus && photo.processingStatus !== 'NONE' ? (
                    <span className={`text-xs ${photo.processingStatus === 'FAILED' ? 'text-red-600' : 'text-gray-500'}`}>
                      {t(`rider_photo_processing_${photo.processingStatus.toLowerCase()}`)}
                      {photo.processingStatus === 'FAILED' && photo.processingError ? `: ${photo.processingError}` : ''}
                    </span>
                  ) : null}
                </div>
              </div>

              {doc ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag severity={STATUS_SEVERITY[doc.status]} value={t(`rider_doc_status_${doc.status.toLowerCase()}`)} />
                  {doc.status !== 'APPROVED' ? (
                    <Button
                      size="small"
                      label={t('Approve')}
                      severity="success"
                      outlined
                      disabled={reviewLoading}
                      onClick={() => setStatus(key, 'APPROVED')}
                    />
                  ) : null}
                  {doc.status !== 'REJECTED' ? (
                    <Button
                      size="small"
                      label={t('Reject')}
                      severity="danger"
                      outlined
                      disabled={reviewLoading}
                      onClick={() => setRejecting(key)}
                    />
                  ) : null}
                  {isPhoto &&
                  photo?.status === 'APPROVED' &&
                  rider.riderRequestStatus === 'ACCEPTED' &&
                  photo.processingStatus !== 'PROCESSING' &&
                  photo.processingStatus !== 'DONE' ? (
                    <Button
                      size="small"
                      label={t('rider_photo_retry')}
                      outlined
                      loading={reprocessLoading}
                      onClick={() => reprocess({ variables: { riderId: rider._id } })}
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <RejectionReasonModal
        visible={!!rejecting}
        loading={reviewLoading}
        onHide={() => setRejecting(null)}
        onConfirm={(reason) => {
          if (rejecting) setStatus(rejecting, 'REJECTED', reason);
          setRejecting(null);
        }}
      />
    </div>
  );
}
