// Core
import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useMemo, useState } from "react";

// Interfaces
import {
  IRiderEarnings,
  IRiderEarningsResponse,
} from "@/lib/utils/interfaces/rider-earnings.interface";
import {
  IRecentActivityItem,
  IRecentActivityResponse,
  IRiderLoyaltyDataResponse,
} from "@/lib/utils/interfaces/referral.interface";

// Charts
import { barDataItem } from "react-native-gifted-charts";

// GraphQL
import { RIDER_EARNINGS_GRAPH } from "@/lib/apollo/queries/earnings.query";
import {
  FETCH_RIDER_RECENT_ACTIVITY,
  FETCH_RIDER_LOYALTY_HISTORY,
  FETCH_RIDER_LOYALTY_DATA,
} from "@/lib/apollo/queries/referral.query";

// Hooks
import { useApptheme } from "@/lib/context/global/theme.context";
import { useUserContext } from "@/lib/context/global/user.context";
import { QueryResult, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";

// Expo
import { router } from "expo-router";

// Skeletons
import { EarningScreenMainLoading } from "@/lib/ui/skeletons";

// Components
import EarningsBarChart from "../../bar-chart";
import EarningStack from "../earnings-stack";
import EarningsTabs, { EarningsTab } from "../../tabs";
import ReferralStack from "../referrals-stack";
import ReferralModal from "../referrals-modal";
import ReferralRewards from "../referral-rewards";
import ReferralEarningsCard from "../referral-earnings-card";
import ReferralLevelCards from "../referral-level-cards";
import LoyaltyStack from "../loyalty-stack";
import UplineTab from "../upline-tab";

// Helpers
import formatNumber from "@/lib/utils/methods/num-formatter";

export default function EarningsMain() {
  const { appTheme } = useApptheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<EarningsTab>("deliveries");
  const [referralModalVisible, setReferralModalVisible] = useState<
    IReferralEarnings & { bool: boolean }
  >({
    bool: false,
    _id: "",
    date: "",
    referralsArray: [],
    totalEarningsSum: 0,
    totalReferrals: 0,
  });

  const { userId, setModalVisible } = useUserContext();

  // Deliveries query
  const { loading: isRiderEarningsLoading, data: riderEarningsData } = useQuery(
    RIDER_EARNINGS_GRAPH,
    { variables: { riderId: userId ?? "" } }
  ) as QueryResult<IRiderEarningsResponse | undefined, { riderId: string }>;

  // Referral activity query
  const { loading: isReferralLoading, data: referralData } = useQuery(
    FETCH_RIDER_RECENT_ACTIVITY,
    {
      variables: { limit: 100, offset: 0 },
      skip: activeTab !== "referrals",
    }
  ) as QueryResult<IRecentActivityResponse | undefined>;

  // Loyalty (SELF) history query
  const { loading: isLoyaltyLoading, data: loyaltyHistoryData } = useQuery(
    FETCH_RIDER_LOYALTY_HISTORY,
    { skip: activeTab !== "referrals" }
  ) as QueryResult<{ fetchRiderLoyaltyHistory: IRecentActivityItem[] } | undefined>;

  // Loyalty summary
  const { data: loyaltyData } = useQuery(FETCH_RIDER_LOYALTY_DATA, {
    skip: activeTab !== "referrals",
  }) as QueryResult<IRiderLoyaltyDataResponse | undefined>;

  // Bar data for deliveries
  const barData: barDataItem[] =
    riderEarningsData?.riderEarningsGraph.earnings
      .slice(0, 5)
      .sort(
        (a, b) =>
          new Date(String(a.date)).setHours(0, 0, 0, 0) -
          new Date(String(b.date)).setHours(23, 59, 59, 999)
      )
      .map((earning: IRiderEarnings) => ({
        value: Math.abs(earning.totalEarningsSum),
        label: earning._id,
        topLabelComponent: () => (
          <Text style={{ color: appTheme.fontMainColor, fontSize: 10, fontWeight: "600", marginBottom: 0 }}>
            ${formatNumber(earning.totalEarningsSum)}
          </Text>
        ),
      })) ?? [];

  // Group referral activities by date
  const groupedReferralActivities = useMemo(() => {
    if (!referralData?.fetchRiderRecentActivity?.activities) return [];

    const grouped: Record<string, { activities: IRecentActivityItem[]; totalEarnings: number; date: Date }> = {};

    referralData.fetchRiderRecentActivity.activities.forEach((activity) => {
      if (!activity.createdAt) return;
      const timestamp = parseInt(activity.createdAt);
      const dateObj = isNaN(timestamp) ? new Date(activity.createdAt) : new Date(timestamp);
      if (isNaN(dateObj.getTime())) return;
      const dateKey = dateObj.toISOString().split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = { activities: [], totalEarnings: 0, date: dateObj };
      grouped[dateKey].activities.push(activity);
      grouped[dateKey].totalEarnings += activity.value;
    });

    return Object.entries(grouped)
      .map(([dateKey, data]) => ({
        dateKey,
        date: data.date,
        activities: data.activities,
        totalEarnings: data.totalEarnings,
        totalReferrals: data.activities.length,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [referralData]);

  const formatDisplayDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Referral bar data
  const referralBarData: barDataItem[] = useMemo(
    () =>
      groupedReferralActivities.map((group) => ({
        value: Math.abs(group.totalEarnings),
        label: formatDisplayDate(group.date).split(",")[0],
        topLabelComponent: () => (
          <Text style={{ color: appTheme.fontMainColor, fontSize: 10, fontWeight: "600", marginBottom: 0 }}>
            ${formatNumber(group.totalEarnings)}
          </Text>
        ),
      })),
    [groupedReferralActivities, appTheme.fontMainColor]
  );

  const totalReferralEarnings =
    referralData?.fetchRiderRecentActivity?.summary?.totalEarnings ?? 0;

  // Loyalty SELF transactions (own deliveries)
  const loyaltySelfItems: IRecentActivityItem[] = useMemo(
    () => (loyaltyHistoryData?.fetchRiderLoyaltyHistory ?? []).filter(
      (item) => item.rewardRole === "SELF"
    ),
    [loyaltyHistoryData]
  );

  // Released residual (upline) earnings
  const loyaltyReleasedResidualItems: IRecentActivityItem[] = useMemo(
    () => (loyaltyHistoryData?.fetchRiderLoyaltyHistory ?? []).filter(
      (item) => item.rewardRole === "UPLINE"
    ),
    [loyaltyHistoryData]
  );

  const totalLoyaltyCash = loyaltyData?.fetchRiderLoyaltyData?.loyaltyCash ?? 0;
  const totalResidualReleasedCash = loyaltyReleasedResidualItems.reduce((sum, i) => sum + i.value, 0);

  if (isRiderEarningsLoading || (activeTab === "referrals" && (isReferralLoading || isLoyaltyLoading))) {
    return <EarningScreenMainLoading />;
  }

  const chartProps = {
    width: 700,
    height: 200,
    frontColor: appTheme.primary,
    barStyle: { marginTop: 15 },
    rulesColor: appTheme.secondaryTextColor,
    topLabelTextStyle: { color: appTheme.primary },
    xAxisLabelTextStyle: { display: "flex" as const, fontSize: 9, color: appTheme.fontMainColor },
    yAxisTextStyle: { fontSize: 8, color: appTheme.fontSecondColor },
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.screenBackground }}>
      <EarningsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── DELIVERIES ── */}
      {activeTab === "deliveries" && (
        <>
          <EarningsBarChart data={barData} {...chartProps} />
          <View className="flex flex-row justify-between w-full px-4 py-4">
            <Text className="text-xl font-bold" style={{ color: appTheme.fontMainColor }}>
              {t("Recent Activity")}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible({
                  bool: false, _id: "", date: "", earningsArray: [],
                  totalEarningsSum: 0, totalTipsSum: 0, totalDeliveries: 0,
                });
                router.push("/(tabs)/earnings/(routes)/earnings-detail");
              }}
            >
              <Text className="text-sm text-[#3B82F6] font-bold">{t("See More")}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={riderEarningsData?.riderEarningsGraph?.earnings?.slice(0, 5)}
            keyExtractor={(_, index) => index.toString()}
            style={{ height: "55%" }}
            ListEmptyComponent={
              <Text className="block mx-auto font-bold text-center w-full my-12" style={{ color: appTheme.fontSecondColor }}>
                {t("No record found")}
              </Text>
            }
            renderItem={(info) => (
              <EarningStack
                date={info.item.date}
                earning={info.item.totalEarningsSum}
                totalDeliveries={info.item.earningsArray.length}
                _id={info.item._id}
                tip={info.item.totalTipsSum}
                earningsArray={info.item.earningsArray}
                key={info.index}
                setModalVisible={setModalVisible}
              />
            )}
          />
        </>
      )}

      {/* ── REFERRALS & LOYALTY ── */}
      {activeTab === "referrals" && (
        <ScrollView
          style={{ height: "100%" }}
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Level count cards */}
          <ReferralLevelCards />

          {/* Referral bar chart */}
          <EarningsBarChart data={referralBarData} {...chartProps} />

          {/* Referral activity section */}
          <View className="flex flex-row justify-between w-full px-4 py-4">
            <Text className="text-base font-bold" style={{ color: appTheme.fontMainColor }}>
              {t("Referral Activity")}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/earnings/(routes)/referrals-detail")}>
              <Text className="text-sm text-[#3B82F6] font-bold">{t("See More")}</Text>
            </TouchableOpacity>
          </View>

          {groupedReferralActivities.map((group) => (
            <ReferralStack
              key={group.dateKey}
              date={formatDisplayDate(group.date)}
              earning={group.totalEarnings}
              totalReferrals={group.totalReferrals}
              _id={group.dateKey}
              referralsArray={group.activities}
              setModalVisible={setReferralModalVisible}
              activityId={group.activities[0]?._id}
              dateKey={group.dateKey}
            />
          ))}

          <ReferralEarningsCard totalEarnings={totalReferralEarnings} />
          <ReferralRewards />

          {/* Loyalty earnings section */}
          <View
            className="mx-3 mt-4 mb-2 rounded-xl overflow-hidden"
            style={{ borderWidth: 1, borderColor: appTheme.borderLineColor }}
          >
            {/* Own delivery loyalty */}
            <View
              className="px-4 py-3 flex-row justify-between items-center"
              style={{ backgroundColor: appTheme.themeBackground }}
            >
              <View>
                <Text className="text-base font-bold" style={{ color: appTheme.fontMainColor }}>
                  {t("Delivery Loyalty Bonus")}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: appTheme.fontSecondColor }}>
                  {t("From your own deliveries")} · QAR {totalLoyaltyCash.toFixed(2)}
                </Text>
              </View>
            </View>
            {loyaltySelfItems.length === 0 ? (
              <View className="p-4 items-center">
                <Text className="text-sm" style={{ color: appTheme.fontSecondColor }}>
                  {t("No delivery loyalty earnings yet")}
                </Text>
              </View>
            ) : (
              loyaltySelfItems.slice(0, 5).map((item) => (
                <LoyaltyStack key={item._id} item={item} label={t("Delivery Bonus")} />
              ))
            )}

            {/* Released residual earnings */}
            {loyaltyReleasedResidualItems.length > 0 && (
              <>
                <View
                  className="px-4 py-3 flex-row justify-between items-center"
                  style={{
                    backgroundColor: appTheme.themeBackground,
                    borderTopWidth: 1,
                    borderTopColor: appTheme.borderLineColor,
                  }}
                >
                  <View>
                    <Text className="text-base font-bold" style={{ color: appTheme.fontMainColor }}>
                      {t("Residual Earnings Released")}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: appTheme.fontSecondColor }}>
                      {t("From your referred riders' deliveries")} · QAR {totalResidualReleasedCash.toFixed(2)}
                    </Text>
                  </View>
                </View>
                {loyaltyReleasedResidualItems.slice(0, 5).map((item) => (
                  <LoyaltyStack
                    key={item._id}
                    item={item}
                    label={t("Residual Released")}
                    badgeColor="#D97706"
                  />
                ))}
              </>
            )}
          </View>

          <ReferralModal
            totalEarnings={referralModalVisible.totalEarningsSum}
            totalReferrals={referralModalVisible.totalReferrals}
            modalVisible={referralModalVisible}
            setModalVisible={setReferralModalVisible}
            activityId={referralModalVisible._id}
          />
        </ScrollView>
      )}

      {/* ── RESIDUAL POINTS ── */}
      {activeTab === "upline" && (
        <View style={{ flex: 1 }}>
          <UplineTab />
        </View>
      )}
    </View>
  );
}
