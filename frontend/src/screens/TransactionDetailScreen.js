import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';
import { getTxMeta } from '../utils/theme';
import {
  formatCurrency,
  formatShares,
  formatDate,
  formatDateRelative,
  isBuy,
} from '../utils/formatters';

export default function TransactionDetailScreen({ route, navigation }) {
  const tx = route.params?.transaction;

  if (!tx) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Transaction data not available</Text>
      </SafeAreaView>
    );
  }

  const meta = getTxMeta(tx.transactionCode);
  const buy = isBuy(tx);
  const valueColor = buy ? Colors.buy : Colors.sell;

  async function openSECFiling() {
    if (!tx.secFilingUrl) {
      Alert.alert('No Link', 'SEC filing URL not available for this transaction.');
      return;
    }
    try {
      await Linking.openURL(tx.secFilingUrl);
    } catch {
      Alert.alert('Error', 'Could not open the SEC filing link.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Nav */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Transaction Detail</Text>
        <TouchableOpacity onPress={openSECFiling} style={styles.secBtn}>
          <Feather name="external-link" size={18} color={Colors.primary} />
          <Text style={styles.secBtnText}>SEC Filing</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            {tx.issuerTicker && (
              <View style={styles.tickerBadge}>
                <Text style={styles.ticker}>{tx.issuerTicker}</Text>
              </View>
            )}
            <View style={[styles.txBadge, { backgroundColor: meta.bg }]}>
              <Feather name={meta.icon} size={12} color={meta.color} />
              <Text style={[styles.txBadgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          {tx.totalValue && (
            <Text style={[styles.heroValue, { color: valueColor }]}>
              {buy ? '+' : '-'}{formatCurrency(tx.totalValue, true)}
            </Text>
          )}

          <Text style={styles.heroCompany}>{tx.issuerName || 'Unknown Company'}</Text>

          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>Filed</Text>
              <Text style={styles.heroMetaValue}>{formatDateRelative(tx.filingDate)}</Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>Transaction Date</Text>
              <Text style={styles.heroMetaValue}>{formatDate(tx.transactionDate)}</Text>
            </View>
          </View>
        </View>

        {/* Insider section */}
        <Section title="Insider">
          <DetailRow label="Name" value={tx.reportingName} />
          <DetailRow label="CIK" value={tx.reportingCik} mono />
          <DetailRow
            label="Role"
            value={[
              tx.isDirector && 'Director',
              tx.isOfficer && (tx.officerTitle || 'Officer'),
              tx.isTenPercentOwner && '10%+ Owner',
            ]
              .filter(Boolean)
              .join(' · ') || '—'}
          />
        </Section>

        {/* Transaction section */}
        <Section title="Transaction">
          <DetailRow label="Form Type" value={`Form ${tx.formType || '4'}`} />
          <DetailRow label="Transaction Code" value={`${tx.transactionCode} — ${meta.label}`} />
          <DetailRow label="Security" value={tx.securityTitle} />
          <DetailRow
            label="Shares"
            value={`${buy ? '+' : ''}${formatShares(tx.sharesTraded)}`}
            valueColor={valueColor}
          />
          <DetailRow label="Price per Share" value={formatCurrency(tx.pricePerShare)} />
          <DetailRow
            label="Total Value"
            value={tx.totalValue ? `${buy ? '+' : '-'}${formatCurrency(tx.totalValue)}` : '—'}
            valueColor={tx.totalValue ? valueColor : undefined}
          />
          <DetailRow
            label="Shares Owned After"
            value={tx.sharesOwnedAfter ? formatShares(tx.sharesOwnedAfter) : '—'}
          />
          <DetailRow
            label="Ownership Type"
            value={tx.directIndirect === 'D' ? 'Direct' : 'Indirect'}
          />
        </Section>

        {/* Dates section */}
        <Section title="Filing Dates">
          <DetailRow label="Transaction Date" value={formatDate(tx.transactionDate)} />
          <DetailRow label="Filing Date" value={formatDate(tx.filingDate)} />
          <DetailRow label="Accession Number" value={tx.accessionNumber} mono small />
        </Section>

        {/* Footnotes */}
        {tx.footnotes && tx.footnotes.length > 0 && (
          <Section title="Footnotes">
            {tx.footnotes.map((fn, i) => (
              <View key={i} style={styles.footnote}>
                <Text style={styles.footnoteNum}>{i + 1}</Text>
                <Text style={styles.footnoteText}>{fn}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* SEC Link */}
        <TouchableOpacity style={styles.secLinkBtn} onPress={openSECFiling}>
          <Feather name="file-text" size={16} color={Colors.primary} />
          <Text style={styles.secLinkText}>View Original SEC Filing</Text>
          <Feather name="external-link" size={14} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.disclaimer}>
          <Feather name="info" size={12} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            Data sourced directly from SEC EDGAR. This is not financial advice.
          </Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function DetailRow({ label, value, valueColor, mono = false, small = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          mono && styles.mono,
          small && styles.small,
          valueColor && { color: valueColor },
        ]}
        selectable
      >
        {value || '—'}
      </Text>
    </View>
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
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  navTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  secBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secBtnText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  heroCard: {
    margin: Spacing.base,
    padding: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tickerBadge: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ticker: {
    color: Colors.primary,
    fontSize: Typography.md,
    fontWeight: '800',
    letterSpacing: 1,
  },
  txBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  txBadgeText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  heroValue: {
    fontSize: Typography.hero,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroCompany: {
    color: Colors.textSub,
    fontSize: Typography.base,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  heroMetaItem: {},
  heroMetaLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroMetaValue: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    color: Colors.textSub,
    fontSize: Typography.sm,
    flex: 1,
  },
  detailValue: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: Typography.xs,
    color: Colors.textSub,
  },
  small: {
    fontSize: Typography.xs,
  },
  footnote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  footnoteNum: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
    width: 16,
  },
  footnoteText: {
    color: Colors.textSub,
    fontSize: Typography.sm,
    flex: 1,
    lineHeight: 18,
  },
  secLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    paddingVertical: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  secLinkText: {
    color: Colors.primary,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    flex: 1,
    lineHeight: 16,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    padding: Spacing.xl,
  },
});
