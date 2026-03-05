import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';
import { formatCurrency, formatShares, formatDate, formatDateRelative, isBuy } from '../utils/formatters';
import { getTxMeta } from '../utils/theme';

export default function TransactionCard({ transaction: tx, onPress, showTicker = true }) {
  const meta = getTxMeta(tx.transactionCode);
  const buy = isBuy(tx);
  const valueColor = buy ? Colors.buy : Colors.sell;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(tx)}
      activeOpacity={0.75}
    >
      {/* Top row: ticker + badge + value */}
      <View style={styles.row}>
        <View style={styles.left}>
          {showTicker && tx.issuerTicker ? (
            <View style={styles.tickerBadge}>
              <Text style={styles.ticker}>{tx.issuerTicker}</Text>
            </View>
          ) : (
            <View style={styles.tickerBadge}>
              <Text style={styles.ticker}>—</Text>
            </View>
          )}
          <View style={[styles.txBadge, { backgroundColor: meta.bg }]}>
            <Feather name={meta.icon} size={10} color={meta.color} />
            <Text style={[styles.txLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {tx.totalValue ? (
          <Text style={[styles.value, { color: valueColor }]}>
            {buy ? '+' : '-'}{formatCurrency(tx.totalValue, true)}
          </Text>
        ) : (
          <Text style={styles.valueMuted}>{formatShares(tx.sharesTraded)} sh</Text>
        )}
      </View>

      {/* Insider name */}
      <Text style={styles.insiderName} numberOfLines={1}>
        {tx.reportingName || 'Unknown Insider'}
      </Text>

      {/* Company name */}
      {tx.issuerName && (
        <Text style={styles.companyName} numberOfLines={1}>
          {tx.issuerName}
        </Text>
      )}

      {/* Bottom row: shares + price + date */}
      <View style={[styles.row, styles.bottomRow]}>
        <View style={styles.detailChip}>
          <Text style={styles.detailLabel}>Shares</Text>
          <Text style={[styles.detailValue, { color: valueColor }]}>
            {buy ? '+' : ''}{formatShares(tx.sharesTraded)}
          </Text>
        </View>

        {tx.pricePerShare != null && (
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>{formatCurrency(tx.pricePerShare)}</Text>
          </View>
        )}

        <View style={[styles.detailChip, styles.dateChip]}>
          <Feather name="calendar" size={10} color={Colors.textMuted} />
          <Text style={styles.dateText}>
            {formatDate(tx.transactionDate)}
          </Text>
        </View>
      </View>

      {/* Role indicator */}
      {(tx.isDirector || tx.isOfficer || tx.isTenPercentOwner) && (
        <View style={styles.rolesRow}>
          {tx.isDirector && <RolePill label="Director" />}
          {tx.isOfficer && <RolePill label={tx.officerTitle || 'Officer'} />}
          {tx.isTenPercentOwner && <RolePill label="10% Owner" />}
        </View>
      )}
    </TouchableOpacity>
  );
}

function RolePill({ label }) {
  return (
    <View style={styles.rolePill}>
      <Text style={styles.roleText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  tickerBadge: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ticker: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  txBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  txLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  value: {
    fontSize: Typography.md,
    fontWeight: '700',
  },
  valueMuted: {
    fontSize: Typography.base,
    color: Colors.textSub,
    fontWeight: '600',
  },
  insiderName: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  companyName: {
    color: Colors.textSub,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  bottomRow: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
    justifyContent: 'flex-start',
  },
  detailChip: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: Colors.text,
    fontSize: Typography.xs,
    fontWeight: '600',
    marginTop: 1,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  rolePill: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  roleText: {
    color: Colors.textMuted,
    fontSize: 10,
    maxWidth: 120,
  },
});
