import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import TransactionCard from '../components/TransactionCard';
import StatsBar from '../components/StatsBar';
import { LoadingSpinner, ErrorView, FooterLoader, EmptyView } from '../components/SharedComponents';
import { Colors, Spacing, Typography, Radius } from '../utils/theme';
import { search, getTickerStats } from '../services/api';
import { usePaginatedData } from '../hooks/usePaginatedData';

export default function SearchResultsScreen({ route, navigation }) {
  const { query, type = 'all' } = route.params;
  const [stats, setStats] = useState(null);
  const isTicker = /^[A-Z]{1,5}$/.test(query.toUpperCase());

  const fetcher = useCallback(
    (page) => search(query, { type, page, limit: 20 }),
    [query, type]
  );

  const { data, loading, refreshing, error, loadMore, refresh, hasMore, total } =
    usePaginatedData(fetcher, [query, type]);

  // Load stats for ticker searches
  React.useEffect(() => {
    if (isTicker) {
      getTickerStats(query.toUpperCase())
        .then(setStats)
        .catch(() => {});
    }
  }, [query, isTicker]);

  function handleTransactionPress(tx) {
    navigation.navigate('TransactionDetail', { transactionId: tx._id, transaction: tx });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{query.toUpperCase()}</Text>
          <Text style={styles.subtitle}>
            {total > 0 ? `${total.toLocaleString()} transactions` : 'Searching...'}
          </Text>
        </View>
      </View>

      {loading && data.length === 0 ? (
        <LoadingSpinner message={`Searching for "${query}"...`} />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={handleTransactionPress}
              showTicker={!isTicker}
            />
          )}
          ListHeaderComponent={
            <>
              {stats && <StatsBar stats={stats.stats} ticker={query} />}
              {data.length > 0 && (
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsLabel}>Transactions</Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <EmptyView
              message={`No transactions found for "${query}".\nData may not be ingested yet.`}
              icon="search"
            />
          }
          ListFooterComponent={<FooterLoader visible={hasMore && !refreshing} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.xl,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: Colors.textSub,
    fontSize: Typography.sm,
    marginTop: 1,
  },
  list: {
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.sm,
  },
  resultsHeader: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  resultsLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
