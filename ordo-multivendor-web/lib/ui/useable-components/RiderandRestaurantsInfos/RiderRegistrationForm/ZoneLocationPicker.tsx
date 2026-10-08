"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client";
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

import { ZONE_BY_AREA, ZONE_BY_LOCATION } from "@/lib/api/graphql/queries/zone";
import { GoogleMapsContext } from "@/lib/context/global/google-maps.context";
import { RiderRegistrationFormValues } from "@/lib/utils/interfaces";

import { FieldLabel } from "./fields";

type Status = "idle" | "locating" | "outside" | "location-error" | "server-error";

interface Prediction {
  description: string;
  place_id: string;
}

const ZONE_LOOKUP_TIMEOUT = 15000;

// Asks where the rider will work; the delivery zone is derived from it and
// never shown to the rider.
const ZoneLocationPicker = () => {
  const t = useTranslations();
  const { isLoaded } = useContext(GoogleMapsContext);
  const { values, errors, touched, setFieldValue } =
    useFormikContext<RiderRegistrationFormValues>();
  const [status, setStatus] = useState<Status>("idle");
  // a typed city is kept as the work area even if it never resolves to a zone
  const [query, setQuery] = useState(() => (values.zoneId ? "" : values.deliveryArea));
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  // place we know ÖRDO doesn't serve; kept out of the form so it can't pass
  const [outsideArea, setOutsideArea] = useState("");
  const autocomplete = useRef<google.maps.places.AutocompleteService | null>(null);
  const [findZone] = useLazyQuery(ZONE_BY_LOCATION, { fetchPolicy: "network-only" });
  const [findZoneByArea] = useLazyQuery(ZONE_BY_AREA, { fetchPolicy: "network-only" });

  const busy = status === "locating";
  const canSearch =
    isLoaded && typeof window !== "undefined" && !!window.google?.maps?.places;

  useEffect(() => {
    if (canSearch && !autocomplete.current) {
      autocomplete.current = new window.google.maps.places.AutocompleteService();
    }
  }, [canSearch]);

  const setZone = (zone: { _id: string; title: string } | null, area: string) => {
    setFieldValue("zoneId", zone?._id ?? "");
    setFieldValue("zoneLabel", zone?.title ?? "");
    setFieldValue("deliveryArea", area);
  };

  // don't leave the rider on a spinner if the API is unreachable
  const withTimeout = () =>
    new Promise<{ data?: undefined; error: Error }>((done) =>
      setTimeout(() => done({ error: new Error("timeout") }), ZONE_LOOKUP_TIMEOUT)
    );

  const resolve = async (latitude: number, longitude: number, area: string) => {
    setStatus("locating");
    const timeout = withTimeout();
    const { data, error } = await Promise.race([
      findZone({ variables: { latitude, longitude } }),
      timeout,
    ]);
    if (error) {
      setZone(null, "");
      setStatus("server-error");
      return;
    }
    const zone = data?.zoneByLocation ?? null;
    setZone(zone, zone ? area : "");
    setOutsideArea(zone ? "" : area);
    if (!zone) setQuery("");
    setStatus(zone ? "idle" : "outside");
  };

  // "Santo Domingo, Dominican Republic" rather than a street address
  const reverseGeocodeCity = (latitude: number, longitude: number) =>
    new Promise<string>((done) => {
      if (!window.google?.maps) return done("");
      new window.google.maps.Geocoder().geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, geocodeStatus) => {
          if (geocodeStatus !== "OK" || !results?.length) return done("");
          const component = (type: string) =>
            results
              .flatMap((result) => result.address_components)
              .find((part) => part.types.includes(type))?.long_name;
          const city =
            component("locality") ??
            component("administrative_area_level_2") ??
            component("administrative_area_level_1");
          done([city, component("country")].filter(Boolean).join(", "));
        }
      );
    });

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("location-error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const area = await reverseGeocodeCity(coords.latitude, coords.longitude);
        await resolve(coords.latitude, coords.longitude, area);
      },
      () => setStatus("location-error"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const fetchSuggestions = useMemo(
    () =>
      debounce((input: string) => {
        if (!autocomplete.current || input.trim().length < 2) {
          setSuggestions([]);
          return;
        }
        autocomplete.current.getPlacePredictions(
          { input, types: ["(regions)"] },
          (predictions) =>
            setSuggestions(
              (predictions ?? []).map(({ description, place_id }) => ({
                description,
                place_id,
              }))
            )
        );
      }, 300),
    []
  );

  const selectPlace = (place: Prediction) => {
    setQuery("");
    setSuggestions([]);
    setStatus("locating");
    new window.google.maps.Geocoder().geocode(
      { placeId: place.place_id },
      (results, geocodeStatus) => {
        const location = results?.[0]?.geometry?.location;
        if (geocodeStatus !== "OK" || !location) {
          setStatus("server-error");
          return;
        }
        resolve(location.lat(), location.lng(), place.description);
      }
    );
  };

  const typeArea = (text: string) => {
    setQuery(text);
    setZone(null, text);
    if (status !== "locating") setStatus("idle");
  };

  // without Google suggestions, check a typed city on the server (Enter/blur);
  // if it can't be placed the rider can still continue
  const checkTypedArea = async () => {
    const area = query.trim();
    if (canSearch || area.length < 2 || values.zoneId || busy) return;
    setStatus("locating");
    const { data } = await Promise.race([
      findZoneByArea({ variables: { area } }),
      withTimeout(),
    ]);
    const zone = data?.zoneByArea ?? null;
    if (zone) setZone(zone, area);
    setStatus("idle");
  };

  const fieldError = getIn(touched, "deliveryArea") ? getIn(errors, "deliveryArea") : undefined;
  const typedOnly = !values.zoneId && values.deliveryArea.trim().length >= 2;

  const notice =
    status === "outside"
      ? {
          tone: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
          text: t("rider_zone_outside", {
            area: outsideArea || t("rider_zone_this_area"),
          }),
        }
      : status === "location-error"
        ? {
            tone: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200",
            text: canSearch ? t("rider_zone_location_error") : t("rider_zone_location_error_no_search"),
          }
        : status === "server-error"
          ? {
              tone: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200",
              text: t("rider_zone_server_error"),
            }
          : null;

  return (
    <div>
      <FieldLabel label={t("rider_zone_label")} required />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("rider_zone_hint")}</p>

      {values.zoneId ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/40">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faCircleCheck} className="mt-0.5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {values.deliveryArea || t("rider_zone_current_location")}
              </p>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                {t("rider_zone_found")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setZone(null, "");
              setQuery("");
              setStatus("idle");
            }}
            className="shrink-0 text-xs font-medium text-primary-color"
          >
            {t("rider_zone_change")}
          </button>
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          <div
            className="relative"
            onKeyDownCapture={(e) => {
              // Enter would otherwise submit the whole step
              if (e.key === "Enter" && !suggestions.length) {
                e.preventDefault();
                checkTypedArea();
              }
            }}
            onBlur={checkTypedArea}
          >
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute start-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-400"
            />
            <AutoComplete
              value={query}
              suggestions={suggestions}
              field="description"
              placeholder={t("rider_zone_search_placeholder")}
              completeMethod={(e) => fetchSuggestions(e.query)}
              onChange={(e) => {
                // a picked suggestion arrives as an object and is handled by onSelect
                if (typeof e.value === "string") typeArea(e.value);
              }}
              onSelect={(e) => selectPlace(e.value as Prediction)}
              disabled={busy}
              className="w-full"
              inputClassName="w-full rounded-lg border-2 border-gray-100 !py-3 !ps-9 !pe-12 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              panelClassName="text-sm"
            />
            <button
              type="button"
              onClick={detectCurrentLocation}
              disabled={busy}
              title={t("rider_zone_use_location")}
              aria-label={t("rider_zone_use_location")}
              className="absolute end-2 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-primary-color transition hover:bg-orange-50 disabled:opacity-60 dark:hover:bg-gray-600"
            >
              <FontAwesomeIcon icon={busy ? faSpinner : faLocationCrosshairs} spin={busy} />
            </button>
          </div>

          {busy ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("rider_zone_locating")}</p>
          ) : typedOnly && !notice ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("rider_zone_typed_note")}
            </p>
          ) : null}

          {notice ? (
            <p className={`flex items-start gap-2 rounded-lg p-3 text-xs ${notice.tone}`}>
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
              {notice.text}
            </p>
          ) : null}
        </div>
      )}

      {fieldError && !typedOnly && !notice ? (
        <small className="p-error text-sm">{fieldError}</small>
      ) : null}
    </div>
  );
};

export default ZoneLocationPicker;
