import { useApptheme } from "@/lib/context/global/theme.context";
import {
  FETCH_RIDER_RESIDUAL_LOYALTY_DATA,
  FETCH_RIDER_RESIDUAL_TRANSACTIONS,
} from "@/lib/apollo/queries/referral.query";
import {
  IRiderResidualLoyaltyDataResponse,
  IRiderResidualTransactionsResponse,
  IResidualTransaction,
} from "@/lib/utils/interfaces/referral.interface";
import { QueryResult, useQuery } from "@apollo/client";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColorScheme } from "@/lib/hooks/useColorScheme";

export default function ResidualPointsTab() {
  const { appTheme } = useApptheme();
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";

  const { data: summaryData, loading: summaryLoading } = useQuery(
    FETCH_RIDER_RESIDUAL_LOYALTY_DATA,
    { fetchPolicy: "cache-and-network" }
  ) as QueryResult<IRiderResidualLoyaltyDataResponse | undefined>;

  const { data: txData, loading: txLoading } = useQuery(
    FETCH_RIDER_RESIDUAL_TRANSACTIONS,
    { fetchPolicy: "cache-and-network" }
  ) as QueryResult<IRiderResidualTransactionsResponse | undefined>;

  const residual = summaryData?.fetchRiderResidualLoyaltyData;
  const locked = residual?.residualCashBalance ?? 0;
  const totalEarned = residual?.totalResidualCashEarned ?? 0;
  const transactions = txData?.fetchRiderResidualTransactions ?? [];

  const getDaysLeft = (eligibleUntil: string | null) => {
    if (!eligibleUntil) return null;
    const diff = new Date(eligibleUntil).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appTheme.themeBackground },
    content: { padding: 16, paddingBottom: 200 },
    summaryCard: {
      backgroundColor: appTheme.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    summaryTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    summaryLeft: { flex: 1 },
    summaryTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: "rgba(31,41,55,0.65)",
      marginBottom: 4,
    },
    summaryValue: { fontSize: 32, fontWeight: "800", color: "#1F2937" },
    summaryUnit: { fontSize: 12, color: "rgba(31,41,55,0.55)", marginTop: 2 },
    summaryRight: {
      backgroundColor: "rgba(31,41,55,0.12)",
      borderRadius: 10,
      padding: 10,
      alignItems: "center",
      minWidth: 70,
    },
    summaryRightValue: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
    summaryRightLabel: {
      fontSize: 9,
      color: "rgba(31,41,55,0.6)",
      marginTop: 2,
      textAlign: "center",
    },
    infoRow: {
      flexDirection: "row",
      backgroundColor: "rgba(31,41,55,0.1)",
      borderRadius: 10,
      padding: 10,
      gap: 6,
      alignItems: "flex-start",
    },
    infoText: { flex: 1, fontSize: 11, color: "rgba(31,41,55,0.75)", lineHeight: 16 },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: appTheme.fontMainColor,
      marginBottom: 10,
    },
    emptyCard: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 12,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E5E7EB",
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 8,
      textAlign: "center",
    },
    txCard: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E5E7EB",
    },
    txHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    txPoints: { fontSize: 18, fontWeight: "800", color: appTheme.primary },
    txBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#FEF3C7",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    txBadgeText: { fontSize: 10, fontWeight: "600", color: "#92400E" },
    txRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    txLabel: { fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280" },
    txValue: { fontSize: 12, fontWeight: "600", color: appTheme.fontMainColor },
    progressRow: { marginTop: 8 },
    progressLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    progressLabelText: { fontSize: 10, color: isDark ? "#9CA3AF" : "#6B7280" },
    progressBar: {
      height: 5,
      backgroundColor: isDark ? "#374151" : "#E5E7EB",
      borderRadius: 3,
      overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: "#D97706", borderRadius: 3 },
    urgentBadge: { backgroundColor: "#FEE2E2" },
    urgentBadgeText: { color: "#991B1B" },
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  });

  if (summaryLoading || txLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={appTheme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryTitle}>{t("Pending Residual Cash")}</Text>
              <Text style={styles.summaryValue}>QAR {locked.toFixed(2)}</Text>
              <Text style={styles.summaryUnit}>{t("waiting to be released")}</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryRightValue}>QAR {totalEarned.toFixed(0)}</Text>
              <Text style={styles.summaryRightLabel}>{`Total\nEarned`}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Feather name="info" size={12} color="rgba(31,41,55,0.6)" style={{ marginTop: 1 }} />
            <Text style={styles.infoText}>
              {t(
                "Earned when your referred riders deliver orders. Once they complete the required orders in the time window, the cash is added to your main earnings balance. If the window expires before that, the cash is lost."
              )}
            </Text>
          </View>
        </View>

        {/* Section title */}
        <Text style={styles.sectionTitle}>
          {t("Pending Transactions")} ({transactions.length})
        </Text>

        {/* Empty state */}
        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={32}
              color={appTheme.primary}
            />
            <Text style={styles.emptyText}>
              {t("No pending residual cash.\nAll earned amounts are in your wallet.")}
            </Text>
          </View>
        ) : (
          transactions.map((tx: IResidualTransaction) => {
            const daysLeft = getDaysLeft(tx.eligibleUntil);
            const isUrgent = daysLeft !== null && daysLeft <= 2;
            const windowEnd = tx.eligibleUntil
              ? new Date(tx.eligibleUntil).toLocaleDateString()
              : "-";
            const windowStart = tx.eligibleFrom
              ? new Date(tx.eligibleFrom).toLocaleDateString()
              : "-";
            const totalWindow =
              tx.eligibleUntil && tx.eligibleFrom
                ? new Date(tx.eligibleUntil).getTime() - new Date(tx.eligibleFrom).getTime()
                : null;
            const elapsed = tx.eligibleFrom
              ? Date.now() - new Date(tx.eligibleFrom).getTime()
              : null;
            const timeProgress =
              totalWindow && elapsed ? Math.min(elapsed / totalWindow, 1) : 0;

            return (
              <View key={tx._id} style={styles.txCard}>
                <View style={styles.txHeader}>
                  <Text style={styles.txPoints}>+QAR {tx.value.toFixed(2)}</Text>
                  <View style={[styles.txBadge, isUrgent && styles.urgentBadge]}>
                    <Feather
                      name="clock"
                      size={10}
                      color={isUrgent ? "#991B1B" : "#92400E"}
                    />
                    <Text style={[styles.txBadgeText, isUrgent && styles.urgentBadgeText]}>
                      {daysLeft !== null ? `${daysLeft}d left` : t("Pending")}
                    </Text>
                  </View>
                </View>

                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>{t("From")}</Text>
                  <Text style={styles.txValue}>
                    {tx.triggeredBy} ({t("Level")} {tx.level})
                  </Text>
                </View>
                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>{t("Required orders")}</Text>
                  <Text style={styles.txValue}>
                    {tx.requiredCompletedOrders} {t("within")}{" "}
                    {tx.completionWindow?.toLowerCase()}
                  </Text>
                </View>
                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>{t("Window")}</Text>
                  <Text style={styles.txValue}>
                    {windowStart} → {windowEnd}
                  </Text>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressLabel}>
                    <Text style={styles.progressLabelText}>{t("Time elapsed")}</Text>
                    <Text style={styles.progressLabelText}>
                      {Math.round(timeProgress * 100)}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${timeProgress * 100}%`,
                          backgroundColor: isUrgent ? "#EF4444" : "#D97706",
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
