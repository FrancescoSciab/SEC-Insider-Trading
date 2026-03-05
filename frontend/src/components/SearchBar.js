import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../utils/theme';
import { autocomplete } from '../services/api';

export default function SearchBar({
  onSearch,
  placeholder = 'Search ticker or insider name...',
  autoFocus = false,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingAc, setLoadingAc] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const handleChange = useCallback((text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text || text.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingAc(true);
      try {
        const res = await autocomplete(text);
        setSuggestions(res.data || []);
        setShowSuggestions((res.data || []).length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingAc(false);
      }
    }, 300);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    Keyboard.dismiss();
    onSearch?.(query.trim(), 'all');
  }, [query, onSearch]);

  const handleSuggestionPress = useCallback((item) => {
    setQuery(item.ticker || item.name);
    setShowSuggestions(false);
    Keyboard.dismiss();
    onSearch?.(item.ticker || item.name, item.ticker ? 'ticker' : 'all');
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <Feather name="search" size={18} color={Colors.textMuted} style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          autoFocus={autoFocus}
        />
        {loadingAc && <ActivityIndicator size="small" color={Colors.primary} style={styles.icon} />}
        {!loadingAc && query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSubmit}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {showSuggestions && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.cik}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestion}
                onPress={() => handleSuggestionPress(item)}
              >
                <View style={styles.sugTicker}>
                  <Text style={styles.sugTickerText}>{item.ticker || '—'}</Text>
                </View>
                <Text style={styles.sugName} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: '500',
    height: '100%',
  },
  clearBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  searchBtnText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  dropdown: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  sugTicker: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    minWidth: 48,
    alignItems: 'center',
  },
  sugTickerText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  sugName: {
    color: Colors.text,
    fontSize: Typography.sm,
    flex: 1,
  },
});
