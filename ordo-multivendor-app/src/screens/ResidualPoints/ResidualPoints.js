import { useLayoutEffect, useContext } from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useQuery } from '@apollo/client'
import { FETCH_USER_RESIDUAL_LOYALTY_DATA, FETCH_USER_RESIDUAL_TRANSACTIONS } from '../../apollo/queries'
import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import { theme } from '../../utils/themeColors'
import { HeaderBackButton } from '@react-navigation/elements'
import { scale } from '../../utils/scaling'
import { MaterialIcons } from '@expo/vector-icons'
import navigationService from '../../routes/navigationService'

function ResidualPoints(props) {
  const themeContext = useContext(ThemeContext)
  const currentTheme = theme[themeContext.ThemeValue]
  const isDark = themeContext.ThemeValue === 'Dark'

  const { data: summaryData, loading: summaryLoading } = useQuery(FETCH_USER_RESIDUAL_LOYALTY_DATA, { fetchPolicy: 'cache-and-network' })
  const { data: txData, loading: txLoading } = useQuery(FETCH_USER_RESIDUAL_TRANSACTIONS, { fetchPolicy: 'cache-and-network' })

  const residual = summaryData?.fetchUserResidualLoyaltyData
  const locked = residual?.residualPointsBalance || 0
  const totalEarned = residual?.totalResidualEarnedPoints || 0
  const transactions = txData?.fetchUserResidualTransactions || []

  // Read required orders from summary data (available even when transactions are empty)
  const requiredOrders = residual?.requiredCompletedOrders ?? null

  const getDaysLeft = (eligibleUntil) => {
    if (!eligibleUntil) return null
    const diff = new Date(eligibleUntil) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: currentTheme.themeBackground },
    content: { padding: 16 },
    summaryCard: {
      backgroundColor: currentTheme.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16
    },
    summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    summaryLeft: { flex: 1 },
    summaryTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(31,41,55,0.65)', marginBottom: 4 },
    summaryValue: { fontSize: 32, fontWeight: '800', color: '#1F2937' },
    summaryUnit: { fontSize: 12, color: 'rgba(31,41,55,0.55)', marginTop: 2 },
    summaryRight: {
      backgroundColor: 'rgba(31,41,55,0.12)',
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
      minWidth: 70
    },
    summaryRightValue: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
    summaryRightLabel: { fontSize: 9, color: 'rgba(31,41,55,0.6)', marginTop: 2, textAlign: 'center' },
    infoRow: {
      flexDirection: 'row',
      backgroundColor: 'rgba(31,41,55,0.1)',
      borderRadius: 10,
      padding: 10,
      gap: 6,
      alignItems: 'flex-start'
    },
    infoText: { flex: 1, fontSize: 11, color: 'rgba(31,41,55,0.75)', lineHeight: 16 },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: currentTheme.fontMainColor,
      marginBottom: 10
    },
    emptyCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB'
    },
    emptyText: { fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 8, textAlign: 'center' },
    txCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB'
    },
    txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    txPoints: { fontSize: 18, fontWeight: '800', color: currentTheme.primary },
    txBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20
    },
    txBadgeText: { fontSize: 10, fontWeight: '600', color: '#92400E' },
    txRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    txLabel: { fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280' },
    txValue: { fontSize: 12, fontWeight: '600', color: currentTheme.fontMainColor },
    progressRow: { marginTop: 8 },
    progressLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    progressLabelText: { fontSize: 10, color: isDark ? '#9CA3AF' : '#6B7280' },
    progressBar: {
      height: 5,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 3,
      overflow: 'hidden'
    },
    progressFill: { height: '100%', backgroundColor: '#D97706', borderRadius: 3 },
    urgentBadge: { backgroundColor: '#FEE2E2' },
    urgentBadgeText: { color: '#991B1B' }
  })

  useLayoutEffect(() => {
    props?.navigation.setOptions({
      headerRight: null,
      headerTitle: 'Residual Points',
      headerTitleAlign: 'center',
      headerTitleStyle: { color: currentTheme.fontMainColor, fontSize: 16 },
      headerTitleContainerStyle: {
        marginTop: '1%',
        paddingLeft: scale(25),
        paddingRight: scale(25),
        height: '75%',
        borderRadius: scale(10),
        borderWidth: 1,
        borderColor: 'white'
      },
      headerStyle: { backgroundColor: currentTheme.themeBackground },
      headerLeft: () => (
        <HeaderBackButton
          truncatedLabel=''
          backImage={() => (
            <View style={{ backgroundColor: 'white', borderRadius: 50, marginLeft: 10, alignItems: 'center' }}>
              <MaterialIcons name='arrow-back' size={30} color='black' />
            </View>
          )}
          onPress={() => navigationService.goBack()}
        />
      )
    })
  }, [props?.navigation])

  if (summaryLoading || txLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size='large' color={currentTheme.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryTitle}>Pending Residual Points</Text>
              <Text style={styles.summaryValue}>{locked.toLocaleString()}</Text>
              <Text style={styles.summaryUnit}>pts waiting to be released</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryRightValue}>{totalEarned.toLocaleString()}</Text>
              <Text style={styles.summaryRightLabel}>Total{'\n'}Earned</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Feather name='info' size={12} color='rgba(31,41,55,0.6)' style={{ marginTop: 1 }} />
            <Text style={styles.infoText}>
              These are your bonus points accumulated this week from orders placed by your downlines.
              {requiredOrders != null
                ? ` To be eligible to earn these points, simply place ${requiredOrders} direct order(s) this week.`
                : ' To be eligible to earn these points, make sure you place your direct orders this week.'
              }
              {' '}Go for it, you're sure to succeed!
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pending Transactions ({transactions.length})</Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name='check-circle-outline' size={32} color={currentTheme.primary} />
            <Text style={styles.emptyText}>No pending residual points.{'\n'}All earned points are in your main balance.</Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const daysLeft = getDaysLeft(tx.eligibleUntil)
            const isUrgent = daysLeft !== null && daysLeft <= 2
            const windowEnd = tx.eligibleUntil ? new Date(tx.eligibleUntil).toLocaleDateString() : '-'
            const windowStart = tx.eligibleFrom ? new Date(tx.eligibleFrom).toLocaleDateString() : '-'
            // progress: we don't have completed orders count here, show time progress instead
            const totalWindow = tx.eligibleUntil && tx.eligibleFrom
              ? new Date(tx.eligibleUntil) - new Date(tx.eligibleFrom)
              : null
            const elapsed = tx.eligibleFrom ? new Date() - new Date(tx.eligibleFrom) : null
            const timeProgress = totalWindow && elapsed ? Math.min(elapsed / totalWindow, 1) : 0

            return (
              <View key={tx._id} style={styles.txCard}>
                <View style={styles.txHeader}>
                  <Text style={styles.txPoints}>+{tx.value} pts</Text>
                  <View style={[styles.txBadge, isUrgent && styles.urgentBadge]}>
                    <Feather name='clock' size={10} color={isUrgent ? '#991B1B' : '#92400E'} />
                    <Text style={[styles.txBadgeText, isUrgent && styles.urgentBadgeText]}>
                      {daysLeft !== null ? `${daysLeft}d left` : 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>From</Text>
                  <Text style={styles.txValue}>{tx.triggeredBy} (Level {tx.level})</Text>
                </View>
                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>Required orders</Text>
                  <Text style={styles.txValue}>{tx.requiredCompletedOrders} within {tx.completionWindow?.toLowerCase()}</Text>
                </View>
                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>Window</Text>
                  <Text style={styles.txValue}>{windowStart} → {windowEnd}</Text>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressLabel}>
                    <Text style={styles.progressLabelText}>Time elapsed</Text>
                    <Text style={styles.progressLabelText}>{Math.round(timeProgress * 100)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${timeProgress * 100}%`, backgroundColor: isUrgent ? '#EF4444' : '#D97706' }]} />
                  </View>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default ResidualPoints
