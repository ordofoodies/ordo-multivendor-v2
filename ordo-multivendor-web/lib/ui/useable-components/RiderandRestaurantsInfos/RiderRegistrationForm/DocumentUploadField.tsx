"use client";

import { useMutation } from "@apollo/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faImage,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { UPLOAD_IMAGE_TO_S3 } from "@/lib/api/graphql/mutations";
import useToast from "@/lib/hooks/useToast";

interface DocumentUploadFieldProps {
  label: string;
  value: string;
  helperText?: string;
  onChange: (url: string) => void;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const DocumentUploadField = ({
  label,
  value,
  helperText,
  onChange,
}: DocumentUploadFieldProps) => {
  const t = useTranslations();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadImage] = useMutation(UPLOAD_IMAGE_TO_S3);

  const handleSelect = async (file?: File) => {
    if (!file) return;

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);
      const { data } = await uploadImage({ variables: { image: base64 } });
      const imageUrl = data?.uploadImageToS3?.imageUrl;

      if (!imageUrl) {
        throw new Error("No image URL returned");
      }

      onChange(imageUrl);
      showToast({
        type: "success",
        title: label,
        message: t("image_uploaded_successfully"),
        duration: 2500,
      });
    } catch (error) {
      console.error("Failed to upload rider document:", error);
      setPreviewUrl("");
      onChange("");
      showToast({
        type: "error",
        title: label,
        message: t("image_upload_failed"),
        duration: 2500,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl("");
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="text-sm dark:text-gray-300">{label}</label>
      <div className="mt-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/70">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(event) => handleSelect(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-gray-200 transition hover:ring-primary-color dark:bg-gray-700 dark:ring-gray-600"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-primary-color dark:bg-gray-600">
              <FontAwesomeIcon
                icon={isUploading ? faSpinner : faCloudArrowUp}
                spin={isUploading}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {value ? t("replace_image_label") : t("upload_image_label")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("upload_image_formats_hint")}
              </p>
            </div>
          </div>
          <FontAwesomeIcon icon={faImage} className="text-gray-400" />
        </button>

        {helperText ? (
          <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        ) : null}

        {value || previewUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={value || previewUrl}
                alt={label}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-600">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("image_uploaded_successfully")}
              </span>
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
        ) : null}
      </div>
    </div>
  );
};

export default DocumentUploadField;
