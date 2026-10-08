'use client';

// Core
import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';

// PrimeReact Components
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

// Localization
import { useTranslations } from 'next-intl';

// GraphQL
import { GET_RIDER, GET_ZONES, UPDATE_RIDER_ZONE } from '@/lib/api/graphql';

// Hooks
import useToast from '@/lib/hooks/useToast';

// Interfaces
import { IZonesResponse, ISingleRiderResponse } from '@/lib/utils/interfaces';

interface IZoneEditorProps {
  rider: ISingleRiderResponse;
}

export default function ZoneEditor({ rider }: IZoneEditorProps) {
  const t = useTranslations();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [zoneId, setZoneId] = useState(rider.zone?._id ?? '');

  const { data, loading: zonesLoading } = useQuery<IZonesResponse>(GET_ZONES, {
    skip: !editing,
  });

  const [updateZone, { loading }] = useMutation(UPDATE_RIDER_ZONE, {
    refetchQueries: [{ query: GET_RIDER, variables: { id: rider._id } }],
    onCompleted: () => {
      setEditing(false);
      showToast({
        type: 'success',
        title: t('Success'),
        message: t('rider_zone_updated'),
      });
    },
    onError: (error) =>
      showToast({
        type: 'error',
        title: t('Error'),
        message: error.graphQLErrors?.[0]?.message ?? t('rider_zone_update_failed'),
      }),
  });

  const options =
    data?.zones
      ?.filter((zone) => zone.isActive)
      .map((zone) => ({ label: zone.title, value: zone._id })) ?? [];

  if (!editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="font-medium">{rider.zone?.title ?? '-'}</span>
          <button
            type="button"
            onClick={() => {
              setZoneId(rider.zone?._id ?? '');
              setEditing(true);
            }}
            className="text-xs font-medium text-primary-color underline"
          >
            {t('rider_zone_change')}
          </button>
        </div>
        {rider.workArea ? (
          <span className="text-xs text-gray-500">
            {t('rider_work_area', { area: rider.workArea })}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Dropdown
        value={zoneId}
        options={options}
        onChange={(e) => setZoneId(e.value)}
        loading={zonesLoading}
        placeholder={t('Zone')}
        filter
        className="w-full"
      />
      <div className="flex gap-2">
        <Button
          size="small"
          label={t('Save')}
          loading={loading}
          disabled={!zoneId || zoneId === rider.zone?._id}
          onClick={() => updateZone({ variables: { riderId: rider._id, zoneId } })}
        />
        <Button
          size="small"
          label={t('Cancel')}
          outlined
          disabled={loading}
          onClick={() => setEditing(false)}
        />
      </div>
    </div>
  );
}
