import React, { useState, useEffect, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import SearchBar from '../components/SearchBar';
import TransactionCard from '../components/TransactionCard';
import { LoadingSpinner, ErrorView, FooterLoader, EmptyView } from '../components/SharedComponents';
import { Colors, Spacing, Typography, Radius } from '../utils/theme';
import { getRecentTransactions, getRecentSearches, saveRecentSearch } from '../services/api';
import { usePaginatedData } from '../hooks/usePaginatedData';

const FILTER_CODES = [
  { code: null, label: 'All' },
  { code: 'P', label: 'Buys' },
  { code: 'S', label: 'Sells' },
  { code: 'A', label: 'Awards' },
];

export default function HomeScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  const fetcher = useCallback(
    (page) => getRecentTransactions({ page, limit: 20, code: activeFilter }),
    [activeFilter]
  );

  const { data, loading, refreshing, error, loadMore, refresh, hasMore } = usePaginatedData(
    fetcher,
    [activeFilter]
  );

  useEffect(() => {
    loadRecentSearches();
  }, []);

  async function loadRecentSearches() {
    const r = await getRecentSearches();
    setRecentSearches(r);
  }

  async function handleSearch(query, type) {
    await saveRecentSearch({ query, type, timestamp: Date.now() });
    navigation.navigate('SearchResults', { query, type });
    loadRecentSearches();
  }

  function handleTransactionPress(tx) {
    navigation.navigate('TransactionDetail', { transactionId: tx._id, transaction: tx });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TransactionCard transaction={item} onPress={handleTransactionPress} />
        )}
        ListHeaderComponent={
          <Header
            onSearch={handleSearch}
            recentSearches={recentSearches}
            onRecentPress={(item) => handleSearch(item.query, item.type)}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        }
        ListEmptyComponent={
          loading ? null : <EmptyView message="No transactions found" icon="activity" />
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

      {loading && data.length === 0 && <LoadingSpinner message="Loading transactions..." />}
      {error && !loading && <ErrorView message={error} onRetry={refresh} />}
    </SafeAreaView>
  );
}

function Header({ onSearch, recentSearches, onRecentPress, activeFilter, onFilterChange }) {
  return (
    <View style={styles.header}>
      {/* Hero */}
      <LinearGradient
        colors={['rgba(0,229,160,0.08)', 'transparent']}
        style={styles.heroBg}
      />
      <View style={styles.heroContent}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>SEC Insider Tracker</Text>
        </View>
        <Text style={styles.heroTitle}>Insider Trades,{'\n'}Raw from the SEC</Text>
        <Text style={styles.heroSub}>
          Official Form 4 data · No commentary · No bias
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar onSearch={onSearch} />
      </View>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionLabel}>Recent</Text>
          <View style={styles.recentChips}>
            {recentSearches.slice(0, 6).map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.recentChip}
                onPress={() => onRecentPress(item)}
              >
                <Feather name="clock" size={10} color={Colors.textMuted} />
                <Text style={styles.recentChipText}>{item.query}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Filter Pills */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionLabel}>Latest Filings</Text>
        <View style={styles.filterRow}>
          {FILTER_CODES.map((f) => (
            <TouchableOpacity
              key={f.code ?? 'all'}
              style={[
                styles.filterPill,
                activeFilter === f.code && styles.filterPillActive,
              ]}
              onPress={() => onFilterChange(f.code)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f.code && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingBottom: Spacing.sm,
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  heroContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  logoText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: Colors.text,
    fontSize: Typography.xxl,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  heroSub: {
    color: Colors.textSub,
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    zIndex: 100,
  },
  recentSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentChipText: {
    color: Colors.textSub,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryFaint,
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSub,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.primary,
  },
});
