import { useApptheme } from "@/lib/context/global/theme.context";
import { IRecentActivityItem } from "@/lib/utils/interfaces/referral.interface";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

interface LoyaltyStackProps {
  item: IRecentActivityItem;
  label?: string;
  badgeColor?: string;
}

export default function LoyaltyStack({ item, label, badgeColor }: LoyaltyStackProps) {
  const { appTheme } = useApptheme();
  const { t } = useTranslation();

  const timestamp = parseInt(item.createdAt);
  const date = isNaN(timestamp) ? new Date(item.createdAt) : new Date(timestamp);
  const dateStr = isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const displayLabel = label ?? t("Delivery Bonus");
  const color = badgeColor ?? appTheme.primary;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: appTheme.borderLineColor,
        backgroundColor: appTheme.themeBackground,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: appTheme.fontMainColor }}>
          {displayLabel}
        </Text>
        {item.triggeredBy && item.triggeredBy !== "-" && (
          <Text style={{ fontSize: 11, color: appTheme.fontSecondColor, marginTop: 2 }}>
            {t("From")} {item.triggeredBy} · {t("Level")} {item.level}
          </Text>
        )}
        <Text style={{ fontSize: 11, color: appTheme.fontSecondColor, marginTop: 2 }}>
          {dateStr}
        </Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: "700", color }}>
        +QAR {item.value.toFixed(2)}
      </Text>
    </View>
  );
}
