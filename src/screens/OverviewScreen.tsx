import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen } from '../components/Screen';
import { Card } from '../components/ui/Card';
import { DashboardHeader } from '../components/DashboardHeader';
import { ActivityBarChart, LocatorPieChart } from '../components/AnalyticsCharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../api/client';
import {
  type HistoryEntry,
  type IndexedHistoryEntry,
  type DateFilter,
  type DatePreset,
  defaultDateFilter,
  indexHistory,
  runAnalytics,
  activityChartTitle,
  toYMD,
} from '../lib/dashboard-analytics';

export function OverviewScreen() {
  const { token, isGuest } = useAuth();
  const { colors } = useTheme();
  const [indexedHistory, setIndexedHistory] = useState<IndexedHistoryEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const initial = defaultDateFilter();
  const [draftFilter, setDraftFilter] = useState<DateFilter>(initial);
  const [appliedFilter, setAppliedFilter] = useState<DateFilter>(initial);
  const [showDatePicker, setShowDatePicker] = useState<'single' | 'from' | 'to' | null>(null);
  const dateFocusRef = useRef(0);

  useEffect(() => {
    if (!token) {
      setFetching(false);
      return;
    }
    (async () => {
      const { ok, data } = await apiFetch<HistoryEntry[]>('/locator/history', { token });
      if (ok) setIndexedHistory(indexHistory(data));
      setFetching(false);
    })();
  }, [token]);

  const filterPending =
    draftFilter.preset !== appliedFilter.preset ||
    draftFilter.singleDay !== appliedFilter.singleDay ||
    draftFilter.rangeStart !== appliedFilter.rangeStart ||
    draftFilter.rangeEnd !== appliedFilter.rangeEnd;

  const commitFilter = useCallback(() => setAppliedFilter(draftFilter), [draftFilter]);

  const { filtered, charts, stats, perf } = useMemo(
    () => runAnalytics(indexedHistory, appliedFilter),
    [indexedHistory, appliedFilter],
  );

  const setPreset = (preset: DatePreset) => {
    const next = { ...draftFilter, preset };
    setDraftFilter(next);
    setAppliedFilter(next);
    dateFocusRef.current = 0;
  };

  if (isGuest) {
    return (
      <Screen scroll>
        <DashboardHeader />
        <Card>
          <Text style={[styles.title, { color: colors.foreground }]}>Analytics Overview</Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            Sign in to view search analytics and history reports.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <DashboardHeader />
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Analytics Overview</Text>

      <Card style={{ gap: 12, marginBottom: 16 }}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>REPORT PERIOD</Text>
        <View style={[styles.presetRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {(['all', 'single', 'range'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPreset(p)}
              style={[styles.presetBtn, draftFilter.preset === p && { backgroundColor: colors.accent }]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: draftFilter.preset === p ? colors.primaryText : colors.muted,
                }}
              >
                {p === 'all' ? 'All time' : p === 'single' ? 'One day' : 'Range'}
              </Text>
            </Pressable>
          ))}
        </View>

        {draftFilter.preset === 'single' && (
          <Pressable onPress={() => setShowDatePicker('single')} style={[styles.dateBtn, { borderColor: colors.inputBorder }]}>
            <Text style={{ color: colors.foreground }}>Day: {draftFilter.singleDay}</Text>
          </Pressable>
        )}
        {draftFilter.preset === 'range' && (
          <View style={{ gap: 8 }}>
            <Pressable onPress={() => setShowDatePicker('from')} style={[styles.dateBtn, { borderColor: colors.inputBorder }]}>
              <Text style={{ color: colors.foreground }}>From: {draftFilter.rangeStart}</Text>
            </Pressable>
            <Pressable onPress={() => setShowDatePicker('to')} style={[styles.dateBtn, { borderColor: colors.inputBorder }]}>
              <Text style={{ color: colors.foreground }}>To: {draftFilter.rangeEnd}</Text>
            </Pressable>
          </View>
        )}

        {filterPending && draftFilter.preset !== 'all' && (
          <Pressable onPress={commitFilter} style={[styles.applyBtn, { backgroundColor: colors.accent }]}>
            <Text style={{ color: colors.primaryText, fontWeight: '600' }}>Apply filter</Text>
          </Pressable>
        )}

        {token && indexedHistory.length > 0 && (
          <Text style={{ fontSize: 10, color: colors.muted, fontFamily: 'monospace' }}>
            {perf.recordCount} in report · {perf.totalMs}ms · {perf.activityPoints} chart pts
            {filterPending ? ' · draft pending' : ''}
          </Text>
        )}
      </Card>

      {showDatePicker && (
        <DateTimePicker
          value={
            new Date(
              `${showDatePicker === 'single' ? draftFilter.singleDay : showDatePicker === 'from' ? draftFilter.rangeStart : draftFilter.rangeEnd}T12:00:00`,
            )
          }
          mode="date"
          onChange={(_, date) => {
            setShowDatePicker(null);
            if (!date) return;
            const ymd = toYMD(date);
            if (showDatePicker === 'single') setDraftFilter((f) => ({ ...f, singleDay: ymd }));
            else if (showDatePicker === 'from') setDraftFilter((f) => ({ ...f, rangeStart: ymd }));
            else setDraftFilter((f) => ({ ...f, rangeEnd: ymd }));
          }}
        />
      )}

      <View style={styles.kpiRow}>
        <Card style={styles.kpi}>
          <Text style={[styles.kpiLabel, { color: colors.muted }]}>TOTAL SEARCHES</Text>
          <Text style={[styles.kpiVal, { color: colors.accent }]}>{stats?.totalSearches ?? 0}</Text>
        </Card>
        <Card style={styles.kpi}>
          <Text style={[styles.kpiLabel, { color: colors.muted }]}>ELEMENTS</Text>
          <Text style={[styles.kpiVal, { color: '#3b82f6' }]}>{stats?.totalElements ?? 0}</Text>
        </Card>
        <Card style={[styles.kpi, { flex: 1.2 }]}>
          <Text style={[styles.kpiLabel, { color: colors.muted }]}>TOP TYPE</Text>
          <Text style={[styles.kpiVal, { color: '#10b981', fontSize: 18, textTransform: 'capitalize' }]}>
            {stats?.topType ?? 'None'}
          </Text>
        </Card>
      </View>

      <Card style={{ marginTop: 16, gap: 12 }}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>{activityChartTitle(appliedFilter)}</Text>
        {fetching ? (
          <ActivityIndicator color={colors.accent} />
        ) : filtered.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No data for this period</Text>
        ) : (
          <ActivityBarChart data={charts.activityData} />
        )}
      </Card>

      <Card style={{ marginTop: 16, gap: 12, marginBottom: 24 }}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>Locator Types</Text>
        {fetching ? <ActivityIndicator color={colors.accent} /> : <LocatorPieChart data={charts.pieData} />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  presetRow: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, padding: 2 },
  presetBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  dateBtn: { borderWidth: 1, borderRadius: 8, padding: 12 },
  applyBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpi: { flex: 1, padding: 12 },
  kpiLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  kpiVal: { fontSize: 24, fontWeight: '700' },
  chartTitle: { fontSize: 16, fontWeight: '700' },
});
