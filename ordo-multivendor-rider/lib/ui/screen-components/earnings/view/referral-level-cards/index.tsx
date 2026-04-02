import { useApptheme } from "@/lib/context/global/theme.context";
import { FETCH_DRIVER_REFERRAL_LEVEL_COUNTS } from "@/lib/apollo/queries/referral.query";
import { IDriverReferralLevelCountsResponse } from "@/lib/utils/interfaces/referral.interface";
import { QueryResult, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function ReferralLevelCards() {
  const { appTheme } = useApptheme();
  const { t } = useTranslation();

  const { data } = useQuery(FETCH_DRIVER_REFERRAL_LEVEL_COUNTS) as QueryResult<
    IDriverReferralLevelCountsResponse | undefined
  >;

  const counts = data?.fetchDriverReferralLevelCounts;

  const levels = [
    { label: t("Level 1"), count: counts?.level1Count ?? 0 },
    { label: t("Level 2"), count: counts?.level2Count ?? 0 },
    { label: t("Level 3"), count: counts?.level3Count ?? 0 },
  ];

  return (
    <View className="flex-row px-3 pt-4 pb-2" style={{ gap: 8 }}>
      {levels.map((level) => (
        <View
          key={level.label}
          className="flex-1 rounded-xl p-3 items-center"
          style={{
            backgroundColor: appTheme.themeBackground,
            borderWidth: 1,
            borderColor: appTheme.borderLineColor,
          }}
        >
          <Text className="text-2xl font-bold" style={{ color: appTheme.primary }}>
            {level.count}
          </Text>
          <Text className="text-xs font-medium mt-1" style={{ color: appTheme.fontSecondColor }}>
            {level.label}
          </Text>
          <Text className="text-xs" style={{ color: appTheme.fontSecondColor, opacity: 0.7 }}>
            {t("Riders")}
          </Text>
        </View>
      ))}
    </View>
  );
}
