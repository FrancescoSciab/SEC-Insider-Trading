import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../utils/theme';

const SEC_LINKS = [
  { label: 'SEC EDGAR Full-Text Search', url: 'https://efts.sec.gov/LATEST/search-index' },
  { label: 'Insider Transactions Data Sets', url: 'https://www.sec.gov/data-research/sec-markets-data/insider-transactions-data-sets' },
  { label: 'SEC Form 4 Explanation', url: 'https://www.sec.gov/files/forms-3-4-5.pdf' },
  { label: 'Section 16 — Exchange Act', url: 'https://www.sec.gov/rules-regulations/2000/08/selective-disclosure-insider-trading' },
];

const FORM_TYPES = [
  { form: 'Form 3', desc: 'Initial statement of beneficial ownership. Filed when someone first becomes an insider.' },
  { form: 'Form 4', desc: 'Statement of changes in beneficial ownership. Filed within 2 business days of a transaction.' },
  { form: 'Form 5', desc: 'Annual statement of beneficial ownership. Reports transactions not previously reported.' },
];

const TX_CODES = [
  { code: 'P', label: 'Purchase', desc: 'Open market or private purchase' },
  { code: 'S', label: 'Sale', desc: 'Open market or private sale' },
  { code: 'A', label: 'Grant/Award', desc: 'Grant, award, or other acquisition (e.g. stock options)' },
  { code: 'M', label: 'Option Exercise', desc: 'Exercise of derivative security (option)' },
  { code: 'F', label: 'Tax Withholding', desc: 'Payment of exercise price or tax by forfeiting shares' },
  { code: 'G', label: 'Gift', desc: 'Bona fide gift' },
  { code: 'D', label: 'Returned to Issuer', desc: 'Sale or transfer back to the issuer' },
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoDot} />
          <Text style={styles.title}>About the Data</Text>
          <Text style={styles.subtitle}>
            All data in this app is sourced directly from the U.S. Securities and Exchange
            Commission's EDGAR system. No third-party aggregators, no paywalls, no bias.
          </Text>
        </View>

        {/* What is insider trading */}
        <Section title="What is Insider Trading (Legal)?">
          <Text style={styles.bodyText}>
            Under Section 16 of the Securities Exchange Act of 1934, corporate insiders —
            including directors, officers, and shareholders owning more than 10% of a company's
            stock — must report their trades in that company's securities to the SEC.
          </Text>
          <Text style={[styles.bodyText, { marginTop: Spacing.sm }]}>
            This is entirely legal and required by law. These disclosures are public record and
            can be a useful signal of executive confidence or concern about a company's future.
          </Text>
        </Section>

        {/* Form types */}
        <Section title="SEC Form Types">
          {FORM_TYPES.map((f) => (
            <View key={f.form} style={styles.formRow}>
              <View style={styles.formBadge}>
                <Text style={styles.formBadgeText}>{f.form}</Text>
              </View>
              <Text style={styles.formDesc}>{f.desc}</Text>
            </View>
          ))}
        </Section>

        {/* Transaction codes */}
        <Section title="Transaction Codes">
          {TX_CODES.map((t) => (
            <View key={t.code} style={styles.codeRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{t.code}</Text>
              </View>
              <View style={styles.codeContent}>
                <Text style={styles.codeLabel}>{t.label}</Text>
                <Text style={styles.codeDesc}>{t.desc}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* Data freshness */}
        <Section title="Data Freshness">
          <Text style={styles.bodyText}>
            This app ingests Form 4 filings directly from SEC EDGAR. The database is updated
            daily via a scheduled job. Insiders are required to file within 2 business days of
            a transaction.
          </Text>
          <View style={styles.infoBox}>
            <Feather name="clock" size={14} color={Colors.neutral} />
            <Text style={styles.infoBoxText}>
              New filings typically appear within 24 hours of the SEC receiving them.
            </Text>
          </View>
        </Section>

        {/* Official SEC links */}
        <Section title="Official SEC Sources">
          {SEC_LINKS.map((link) => (
            <TouchableOpacity
              key={link.url}
              style={styles.linkRow}
              onPress={() => Linking.openURL(link.url)}
            >
              <Text style={styles.linkText}>{link.label}</Text>
              <Feather name="external-link" size={14} color={Colors.primary} />
            </TouchableOpacity>
          ))}
        </Section>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Feather name="alert-triangle" size={14} color={Colors.warning} />
          <Text style={styles.disclaimerText}>
            This app is for informational purposes only and does not constitute financial,
            investment, or legal advice. Always verify data against the official SEC EDGAR system.
            Past insider activity is not a predictor of future stock performance.
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.xxl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSub,
    fontSize: Typography.base,
    lineHeight: 22,
  },
  section: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
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
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  bodyText: {
    color: Colors.textSub,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  formBadge: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  formBadgeText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  formDesc: {
    color: Colors.textSub,
    fontSize: Typography.sm,
    flex: 1,
    lineHeight: 18,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  codeBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '800',
  },
  codeContent: {
    flex: 1,
  },
  codeLabel: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  codeDesc: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 1,
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.neutralFaint,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral,
    marginTop: Spacing.sm,
  },
  infoBoxText: {
    color: Colors.text,
    fontSize: Typography.xs,
    flex: 1,
    lineHeight: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  linkText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '500',
    flex: 1,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
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
});
