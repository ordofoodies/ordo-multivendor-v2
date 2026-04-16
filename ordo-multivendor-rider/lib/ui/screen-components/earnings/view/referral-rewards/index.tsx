// Contexts
import { useApptheme } from "@/lib/context/global/theme.context";
import { useContext } from "react";
import { ConfigurationContext } from "@/lib/context/global/configuration.context";

// Core
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

// Icons
import { Ionicons } from "@expo/vector-icons";

// Interfaces
import { IRecentActivityItem } from "@/lib/utils/interfaces/referral.interface";

interface ReferralRewardsProps {
  items: IRecentActivityItem[];
}

export default function ReferralRewards({ items }: ReferralRewardsProps) {
  const { appTheme } = useApptheme();
  const { t } = useTranslation();
  const configuration = useContext(ConfigurationContext);
  const currencySymbol = configuration?.currencySymbol || '$';

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);

  const totalEarnings = items.reduce((sum, item) => sum + item.value, 0);
  const filteredItems = items.filter((item) => item.level === activeLevel);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const timestamp = parseInt(dateString);
      const date = isNaN(timestamp) ? new Date(dateString) : new Date(timestamp);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "N/A";
    }
  };

  return (
    <View
      className="mx-3 my-3 rounded-lg overflow-hidden"
      style={{
        backgroundColor: appTheme.themeBackground,
        borderWidth: 1,
        borderColor: appTheme.borderLineColor,
      }}
    >
      {/* Header */}
      <TouchableOpacity
        className="flex flex-row justify-between items-center p-4"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View className="flex flex-row items-center gap-3">
          <Ionicons name="trophy-outline" size={24} color={appTheme.primary} />
          <View>
            <Text className="text-base font-bold" style={{ color: appTheme.fontMainColor }}>
              {t("Downline Delivery Rewards")}
            </Text>
            <Text className="text-sm" style={{ color: appTheme.fontSecondColor }}>
              {currencySymbol}{totalEarnings.toFixed(0)} {t("earned so far")}
            </Text>
            {!isExpanded && (
              <Text className="text-xs mt-1" style={{ color: appTheme.fontSecondColor, opacity: 0.7 }}>
                {t("Tap to view detailed breakdown")}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={28} color="#666666" />
      </TouchableOpacity>

      {/* Collapsible Content */}
      {isExpanded && (
        <View>
          {/* Level Tabs */}
          <View className="flex flex-row justify-around px-4 pb-3">
            {([1, 2, 3] as const).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setActiveLevel(level)}
                className="px-4 py-2"
                style={{
                  borderBottomWidth: activeLevel === level ? 2 : 0,
                  borderBottomColor: activeLevel === level ? appTheme.primary : "transparent",
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: activeLevel === level ? appTheme.primary : appTheme.fontSecondColor }}
                >
                  {t("Level")} {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Items List */}
          <View className="px-4 pb-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <View
                  key={item._id}
                  className="flex flex-row justify-between items-center py-3"
                  style={{
                    borderBottomWidth: index === filteredItems.length - 1 ? 0 : 1,
                    borderBottomColor: appTheme.borderLineColor,
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold mb-1" style={{ color: appTheme.fontMainColor }}>
                      {item.triggeredBy}
                    </Text>
                    <Text className="text-xs" style={{ color: appTheme.fontSecondColor }}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-base font-bold" style={{ color: appTheme.fontMainColor }}>
                    {currencySymbol}{item.value.toFixed(1)}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-center py-4" style={{ color: appTheme.fontSecondColor }}>
                {t("No downline delivery rewards at this level")}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
