"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faLocationCrosshairs,
  faMagnifyingGlass,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { getIn, useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { AutoComplete } from "primereact/autocomplete";
import { debounce } from "lodash";

import { ZONE_BY_LOCATION } from "@/lib/api/graphql/queries/zone";
import { GoogleMapsContext } from "@/lib/context/global/google-maps.context";

import { FieldLabel, TextField } from "../../RiderRegistrationForm/fields";
import { MerchantFormValues } from "../constants";

interface Prediction {
  description: string;
  place_id: string;
}

interface Place {
  address?: string;
  city?: string;
  postCode?: string;
}

const LOOKUP_TIMEOUT = 15000;

const placeFrom = (result?: google.maps.GeocoderResult): Place => {
  if (!result) return {};
  const part = (type: string) =>
    result.address_components.find((c) => c.types.includes(type))?.long_name;
  return {
    address: result.formatted_address,
    city: part("locality") ?? part("administrative_area_level_2"),
    postCode: part("postal_code"),
  };
};

const LocationStep = () => {
  const t = useTranslations();
  const { isLoaded } = useContext(GoogleMapsContext);
  const { values, errors, touched, setFieldValue } = useFormikContext<MerchantFormValues>();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<"location" | "server" | null>(null);
  const autocomplete = useRef<google.maps.places.AutocompleteService | null>(null);
  const [findZone] = useLazyQuery(ZONE_BY_LOCATION, { fetchPolicy: "network-only" });

  const maps =
    isLoaded && typeof window !== "undefined" && window.google?.maps?.places
      ? window.google.maps
      : null;

  useEffect(() => {
    if (maps && !autocomplete.current) {
      autocomplete.current = new maps.places.AutocompleteService();
    }
  }, [maps]);

  const position =
    values.latitude !== null && values.longitude !== null
      ? { lat: values.latitude, lng: values.longitude }
      : null;

  const checkServiceArea = async (latitude: number, longitude: number) => {
    const timeout = new Promise<{ data?: undefined; error: Error }>((done) =>
      setTimeout(() => done({ error: new Error("timeout") }), LOOKUP_TIMEOUT)
    );
    const { data, error } = await Promise.race([
      findZone({ variables: { latitude, longitude } }),
      timeout,
    ]);
    if (error) {
      setProblem("server");
      setFieldValue("inServiceArea", null);
      return;
    }
    setProblem(null);
    setFieldValue("inServiceArea", !!data?.zoneByLocation);
  };

  const setPin = async (latitude: number, longitude: number, place: Place) => {
    setFieldValue("latitude", latitude);
    setFieldValue("longitude", longitude);
    if (place.address) setFieldValue("address", place.address);
    if (place.city !== undefined) setFieldValue("city", place.city ?? "");
    if (place.postCode !== undefined) setFieldValue("postCode", place.postCode ?? "");
    setBusy(true);
    await checkServiceArea(latitude, longitude);
    setBusy(false);
  };

  const reverseGeocode = (latitude: number, longitude: number) =>
    new Promise<Place>((done) => {
      if (!maps) return done({});
      new maps.Geocoder().geocode({ location: { lat: latitude, lng: longitude } }, (results, status) =>
        done(status === "OK" ? placeFrom(results?.[0]) : {})
      );
    });

  const detectMyLocation = () => {
    if (!navigator.geolocation) return setProblem("location");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) =>
        setPin(coords.latitude, coords.longitude, await reverseGeocode(coords.latitude, coords.longitude)),
      () => {
        setBusy(false);
        setProblem("location");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const fetchSuggestions = useMemo(
    () =>
      debounce((input: string) => {
        if (!autocomplete.current || input.trim().length < 3) return setSuggestions([]);
        autocomplete.current.getPlacePredictions({ input }, (predictions) =>
          setSuggestions((predictions ?? []).map(({ description, place_id }) => ({ description, place_id })))
        );
      }, 300),
    []
  );

  const selectPlace = (place: Prediction) => {
    if (!maps) return;
    setQuery("");
    setSuggestions([]);
    setBusy(true);
    new maps.Geocoder().geocode({ placeId: place.place_id }, (results, status) => {
      const location = results?.[0]?.geometry?.location;
      if (status !== "OK" || !location) {
        setBusy(false);
        return setProblem("server");
      }
      setPin(location.lat(), location.lng(), placeFrom(results?.[0]));
    });
  };

  const pinError = getIn(touched, "latitude") ? getIn(errors, "latitude") : undefined;

  return (
    <div className="grid gap-5">
      <p className="text-sm text-gray-600 dark:text-gray-300">{t("merchant_location_intro")}</p>

      <div>
        <FieldLabel label={t("merchant_find_store")} required />
        <div className="relative mt-2">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute start-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-400"
          />
          <AutoComplete
            value={query}
            suggestions={suggestions}
            field="description"
            placeholder={maps ? t("merchant_search_address") : t("merchant_search_unavailable")}
            completeMethod={(e) => fetchSuggestions(e.query)}
            onChange={(e) => typeof e.value === "string" && setQuery(e.value)}
            onSelect={(e) => selectPlace(e.value as Prediction)}
            disabled={busy || !maps}
            className="w-full"
            inputClassName="w-full rounded-lg border-2 border-gray-100 !py-3 !ps-9 !pe-12 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={detectMyLocation}
            disabled={busy}
            title={t("rider_zone_use_location")}
            aria-label={t("rider_zone_use_location")}
            className="absolute end-2 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-primary-color hover:bg-orange-50 disabled:opacity-60 dark:hover:bg-gray-600"
          >
            <FontAwesomeIcon icon={busy ? faSpinner : faLocationCrosshairs} spin={busy} />
          </button>
        </div>
      </div>

      {maps && position ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600">
          <GoogleMap
            mapContainerClassName="h-64 w-full"
            center={position}
            zoom={16}
            options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
            onClick={async (e) => {
              const lat = e.latLng?.lat();
              const lng = e.latLng?.lng();
              if (lat !== undefined && lng !== undefined) setPin(lat, lng, await reverseGeocode(lat, lng));
            }}
          >
            <MarkerF
              position={position}
              draggable
              onDragEnd={async (e) => {
                const lat = e.latLng?.lat();
                const lng = e.latLng?.lng();
                if (lat !== undefined && lng !== undefined) setPin(lat, lng, await reverseGeocode(lat, lng));
              }}
            />
          </GoogleMap>
          <p className="bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
            {t("merchant_drag_pin")}
          </p>
        </div>
      ) : null}

      {position && values.inServiceArea === true ? (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-800 dark:bg-green-950/40 dark:text-green-200">
          <FontAwesomeIcon icon={faCircleCheck} />
          {t("merchant_in_service_area")}
        </p>
      ) : null}
      {position && values.inServiceArea === false ? (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
          {t("merchant_outside_service_area")}
        </p>
      ) : null}
      {problem ? (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
          {problem === "location" ? t("rider_zone_location_error_no_search") : t("rider_zone_server_error")}
        </p>
      ) : null}
      {pinError && !position ? <small className="p-error text-sm">{pinError}</small> : null}

      {/* the found address can be corrected by hand (unit, floor, landmark) */}
      <TextField name="address" label={t("merchant_address")} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="city" label={t("merchant_city")} />
        <TextField name="postCode" label={t("merchant_post_code")} />
      </div>
    </div>
  );
};

export default LocationStep;
