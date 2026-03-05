import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../utils/theme';

export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Feather name="alert-circle" size={40} color={Colors.error} />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMsg}>{message || 'An unexpected error occurred.'}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Feather name="refresh-cw" size={14} color={Colors.textOnPrimary} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function EmptyView({ message, icon = 'inbox' }) {
  return (
    <View style={styles.center}>
      <Feather name={icon} size={40} color={Colors.textMuted} />
      <Text style={styles.emptyText}>{message || 'No data found'}</Text>
    </View>
  );
}

export function FooterLoader({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSub,
    fontSize: Typography.base,
    marginTop: Spacing.md,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMsg: {
    color: Colors.textSub,
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  retryText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: Typography.base,
  },
  emptyText: {
    color: Colors.textSub,
    fontSize: Typography.base,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});
