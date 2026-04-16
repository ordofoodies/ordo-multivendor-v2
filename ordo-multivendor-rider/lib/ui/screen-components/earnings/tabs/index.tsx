import { useApptheme } from "@/lib/context/global/theme.context";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

export type EarningsTab = "deliveries" | "referrals" | "upline";

interface EarningsTabsProps {
  activeTab: EarningsTab;
  onTabChange: (tab: EarningsTab) => void;
}

const TABS: { key: EarningsTab; label: string }[] = [
  { key: "deliveries", label: "Deliveries" },
  { key: "referrals", label: "Invitations & Loyalty" },
  { key: "upline", label: "Residual Income" },
];

export default function EarningsTabs({ activeTab, onTabChange }: EarningsTabsProps) {
  const { appTheme } = useApptheme();
  const { t } = useTranslation();

  return (
    <View className="flex-row px-3 pt-4 pb-0">
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onTabChange(tab.key)}
          className="flex-1"
        >
          <Text
            className="text-xs font-semibold text-center pb-3"
            style={{
              color: activeTab === tab.key ? appTheme.primary : appTheme.fontSecondColor,
            }}
            numberOfLines={1}
          >
            {t(tab.label)}
          </Text>
          {activeTab === tab.key && (
            <View
              style={{
                height: 3,
                backgroundColor: appTheme.primary,
                borderRadius: 2,
              }}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
