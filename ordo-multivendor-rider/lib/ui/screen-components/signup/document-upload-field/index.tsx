import { useApptheme } from "@/lib/context/global/theme.context";
import { UploadIcon } from "@/lib/assets/svg";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

interface DocumentUploadFieldProps {
  label: string;
  value: string;
  error?: string;
  onPress: () => void;
}

export default function DocumentUploadField({
  label,
  value,
  error,
  onPress,
}: DocumentUploadFieldProps) {
  const { appTheme } = useApptheme();
  const { t } = useTranslation();

  return (
    <View className="mb-3">
      <Text className="mb-2 text-sm" style={{ color: appTheme.fontMainColor }}>
        {label}
      </Text>

      {!value ? (
        <TouchableOpacity
          className="w-full rounded-md border border-dashed p-3 h-28 items-center justify-center"
          style={{ borderColor: appTheme.borderLineColor }}
          onPress={onPress}
        >
          <UploadIcon />
          <Text
            className="mt-2 text-xs"
            style={{ color: appTheme.fontSecondColor }}
          >
            {t("Upload Image")}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          className="flex flex-row justify-between border rounded-md p-4"
          style={{ borderColor: appTheme.borderLineColor }}
        >
          <View className="flex flex-row gap-2">
            <Ionicons name="image" size={20} color="#3F51B5" />
            <Text style={{ color: appTheme.fontSecondColor }}>
              {t("Image uploaded")}
            </Text>
          </View>
          <Ionicons size={18} name="create-outline" color="#6B7280" />
        </TouchableOpacity>
      )}

      {error ? (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}
