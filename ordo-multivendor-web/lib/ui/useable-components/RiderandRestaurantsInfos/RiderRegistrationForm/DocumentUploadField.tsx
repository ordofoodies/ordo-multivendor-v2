"use client";

import { useMutation } from "@apollo/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faCloudArrowUp,
  faImage,
  faRotateRight,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { UPLOAD_IMAGE_TO_S3 } from "@/lib/api/graphql/mutations";
import useToast from "@/lib/hooks/useToast";

import { isLocalPreview, useUploadTracker } from "./uploads";

interface DocumentUploadFieldProps {
  label: string;
  value: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  aspect?: "wide" | "square";
  // opens the camera directly on mobile
  capture?: "user" | "environment";
  // longest side after compression; documents need more detail than a selfie
  maxDimension?: number;
  onChange: (url: string) => void;
}

const fileToBase64 = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ATTEMPTS = 3;
const ATTEMPT_TIMEOUT = 45000;
const RETRY_DELAYS = [1500, 4000];

const BROWSER_FORMATS = ["image/jpeg", "image/png", "image/webp"];

class UnsupportedImageError extends Error {}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

// phone photos are often 5-10MB; shrink them before the base64 upload.
// Also rejects files the browser can't decode (e.g. HEIC on desktop Chrome),
// which would otherwise upload fine but never display.
const compressImage = async (file: File, maxDimension: number): Promise<Blob> => {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (BROWSER_FORMATS.includes(file.type)) return file;
    throw new UnsupportedImageError(file.type || "unknown");
  }
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    return blob && (blob.size < file.size || !BROWSER_FORMATS.includes(file.type))
      ? blob
      : file;
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
};

const DocumentUploadField = ({
  label,
  value,
  helperText,
  error,
  required,
  aspect = "wide",
  capture,
  maxDimension = 1600,
  onChange,
}: DocumentUploadFieldProps) => {
  const t = useTranslations();
  const { showToast } = useToast();
  const tracker = useUploadTracker();
  const inputRef = useRef<HTMLInputElement | null>(null);
  // identifies the latest selection so a slow, replaced upload is ignored
  const currentUpload = useRef(0);
  // the photo that failed to upload, kept so the rider can retry in one tap
  const [failed, setFailed] = useState<{ file: File; preview: string } | null>(null);
  const [uploadImage] = useMutation(UPLOAD_IMAGE_TO_S3);
  const isUploading = isLocalPreview(value);

  const sendOnce = async (base64: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT);
    try {
      const { data } = await uploadImage({
        variables: { image: base64 },
        context: { fetchOptions: { signal: controller.signal } },
      });
      const imageUrl = data?.uploadImageToS3?.imageUrl;
      if (!imageUrl) throw new Error("No image URL returned");
      return imageUrl as string;
    } finally {
      clearTimeout(timer);
    }
  };

  const upload = async (file: File, preview: string, id: number) => {
    try {
      const base64 = await fileToBase64(await compressImage(file, maxDimension));
      let lastError: unknown;
      for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        if (currentUpload.current !== id) return;
        try {
          const imageUrl = await sendOnce(base64);
          if (currentUpload.current === id) onChange(imageUrl);
          return;
        } catch (err) {
          lastError = err;
          // flaky connections usually recover after a short pause
          if (attempt < ATTEMPTS - 1) await sleep(RETRY_DELAYS[attempt]);
        }
      }
      throw lastError;
    } catch (err) {
      console.error("Failed to upload rider document:", err);
      if (currentUpload.current !== id) return;
      onChange("");
      const unsupported = err instanceof UnsupportedImageError;
      setFailed(unsupported ? null : { file, preview });
      showToast({
        type: "error",
        title: label,
        message: unsupported ? t("rider_upload_unsupported_format") : t("image_upload_failed"),
        duration: 5000,
      });
    }
  };

  const start = (file: File, preview = URL.createObjectURL(file)) => {
    const id = ++currentUpload.current;
    setFailed(null);
    // show the photo right away; the upload finishes in the background
    onChange(preview);
    tracker?.track(upload(file, preview, id));
  };

  const handleSelect = (file?: File) => {
    if (inputRef.current) inputRef.current.value = "";
    if (file) start(file);
  };

  const handleRemove = () => {
    currentUpload.current++;
    setFailed(null);
    onChange("");
  };

  const shown = value || failed?.preview || "";

  return (
    <div>
      <label className="text-sm font-medium dark:text-gray-300">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div
        className={`mt-2 rounded-2xl border border-dashed p-4 dark:bg-gray-800/70 ${
          error
            ? "border-red-400 bg-red-50/40"
            : "border-gray-300 bg-gray-50 dark:border-gray-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          capture={capture}
          className="hidden"
          onChange={(event) => handleSelect(event.target.files?.[0])}
        />

        {shown ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700">
            <div
              className={`relative w-full ${
                aspect === "square" ? "mx-auto aspect-square max-w-[240px]" : "aspect-[16/10]"
              }`}
            >
              <Image src={shown} alt={label} fill className="object-cover" unoptimized />
              {isUploading ? (
                <span className="absolute bottom-2 start-2 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow dark:bg-gray-900/80 dark:text-gray-200">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-primary-color" />
                  {t("rider_upload_in_progress")}
                </span>
              ) : null}
              {!value && failed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/75 dark:bg-gray-900/75">
                  <span className="text-xs font-medium text-red-600 dark:text-red-300">
                    {t("rider_upload_not_uploaded")}
                  </span>
                  <button
                    type="button"
                    onClick={() => start(failed.file, failed.preview)}
                    className="flex items-center gap-2 rounded-full bg-primary-color px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    <FontAwesomeIcon icon={faRotateRight} />
                    {t("rider_upload_retry")}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-600">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-primary-color"
              >
                {t("replace_image_label")}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-2 text-xs font-medium text-red-500"
              >
                <FontAwesomeIcon icon={faTrash} />
                {t("remove_image_label")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-start shadow-sm ring-1 ring-gray-200 transition hover:ring-primary-color dark:bg-gray-700 dark:ring-gray-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-primary-color dark:bg-gray-600">
                <FontAwesomeIcon icon={capture ? faCamera : faCloudArrowUp} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t("upload_image_label")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("upload_image_formats_hint")}
                </p>
              </div>
            </div>
            <FontAwesomeIcon icon={faImage} className="text-gray-400" />
          </button>
        )}

        {helperText ? (
          <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        ) : null}
      </div>
      {error ? <small className="p-error text-sm">{error}</small> : null}
    </div>
  );
};

export default DocumentUploadField;
