import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';
import { formatCurrency } from '../utils/formatters';

export default function StatsBar({ stats, ticker }) {
  if (!stats) return null;

  const { totalBuyValue, totalSellValue, buyCount, sellCount, uniqueInsiderCount, netSentiment } =
    stats;

  const sentimentColor =
    netSentiment === 'bullish'
      ? Colors.buy
      : netSentiment === 'bearish'
      ? Colors.sell
      : Colors.neutral;

  const sentimentIcon =
    netSentiment === 'bullish' ? 'trending-up' : netSentiment === 'bearish' ? 'trending-down' : 'minus';

  return (
    <View style={styles.container}>
      <View style={styles.sentimentRow}>
        <View style={[styles.sentiment, { borderColor: sentimentColor }]}>
          <Feather name={sentimentIcon} size={14} color={sentimentColor} />
          <Text style={[styles.sentimentText, { color: sentimentColor }]}>
            {netSentiment?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.period}>Last 90 days · {uniqueInsiderCount} insiders</Text>
      </View>

      <View style={styles.metricsRow}>
        <Metric
          label="Buys"
          value={formatCurrency(totalBuyValue, true)}
          sub={`${buyCount} transactions`}
          color={Colors.buy}
          icon="arrow-up"
        />
        <View style={styles.divider} />
        <Metric
          label="Sells"
          value={formatCurrency(totalSellValue, true)}
          sub={`${sellCount} transactions`}
          color={Colors.sell}
          icon="arrow-down"
        />
      </View>

      {/* Buy/Sell ratio bar */}
      {(totalBuyValue + totalSellValue) > 0 && (
        <View style={styles.ratioContainer}>
          <View style={styles.ratioBar}>
            <View
              style={[
                styles.ratioFill,
                {
                  width: `${(totalBuyValue / (totalBuyValue + totalSellValue)) * 100}%`,
                  backgroundColor: Colors.buy,
                },
              ]}
            />
            <View
              style={[
                styles.ratioFill,
                {
                  width: `${(totalSellValue / (totalBuyValue + totalSellValue)) * 100}%`,
                  backgroundColor: Colors.sell,
                },
              ]}
            />
          </View>
          <View style={styles.ratioLabels}>
            <Text style={[styles.ratioLabel, { color: Colors.buy }]}>Buy</Text>
            <Text style={[styles.ratioLabel, { color: Colors.sell }]}>Sell</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Metric({ label, value, sub, color, icon }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricHeader}>
        <Feather name={icon} size={12} color={color} />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sentimentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sentiment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  sentimentText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  period: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.base,
  },
  metric: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  metricSub: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 1,
  },
  ratioContainer: {
    marginTop: Spacing.md,
  },
  ratioBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.bgElevated,
  },
  ratioFill: {
    height: '100%',
  },
  ratioLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ratioLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
