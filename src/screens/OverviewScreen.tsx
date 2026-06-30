import DateTimePicker from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getPerformanceHistory } from '../api/performance';
import { ActivityBarChart, LocatorPieChart } from '../components/AnalyticsCharts';
import { DashboardHeader } from '../components/DashboardHeader';
import { Screen } from '../components/Screen';
import { Card } from '../components/ui/Card';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUserData } from '../context/UserDataContext';
import { exportAnalytics } from '../lib/analytics-export';
import {
    activityChartTitle,
    type DateFilter,
    type DatePreset,
    defaultDateFilter,
    runAnalytics,
    toYMD,
} from '../lib/dashboard-analytics';
import type { PerformanceScanResult } from '../lib/performance-types';
import { monoFont } from '../theme/tokens';

type ExportFormat = 'csv' | 'json' | 'pdf';

export function OverviewScreen() {
  const { token, isGuest } = useAuth();
  const { colors } = useTheme();
  const { indexedHistory, historyLoading } = useUserData();
  const initial = defaultDateFilter();
  const [draftFilter, setDraftFilter] = useState<DateFilter>(initial);
  const [appliedFilter, setAppliedFilter] = useState<DateFilter>(initial);
  const [showDatePicker, setShowDatePicker] = useState<'single' | 'from' | 'to' | null>(null);
  const dateFocusRef = useRef(0);
  const [activeTab, setActiveTab] = useState<'locator' | 'performance'>('locator');
  const [perfHistory, setPerfHistory] = useState<PerformanceScanResult[]>([]);
  const [perfLoading, setPerfLoading] = useState(false);

  const filterPending =
    draftFilter.preset !== appliedFilter.preset ||
    draftFilter.singleDay !== appliedFilter.singleDay ||
    draftFilter.rangeStart !== appliedFilter.rangeStart ||
    draftFilter.rangeEnd !== appliedFilter.rangeEnd;

  const commitFilter = useCallback(() => setAppliedFilter(draftFilter), [draftFilter]);

  useEffect(() => {
    if (token && activeTab === 'performance') {
      setPerfLoading(true);
      getPerformanceHistory(token)
        .then(setPerfHistory)
        .catch(() => setPerfHistory([]))
        .finally(() => setPerfLoading(false));
    }
  }, [token, activeTab]);

  const { filtered, charts, stats, perf } = useMemo(
    () => runAnalytics(indexedHistory, appliedFilter),
    [indexedHistory, appliedFilter],
  );

  const perfStats = useMemo(() => {
    if (perfHistory.length === 0) return null;
    const scores = perfHistory.map((p) => p.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const criticalCount = perfHistory.reduce((sum, p) => sum + p.findings.filter((f) => f.severity === 'critical').length, 0);
    const warningCount = perfHistory.reduce((sum, p) => sum + p.findings.filter((f) => f.severity === 'warning').length, 0);
    return {
      totalScans: perfHistory.length,
      avgScore: Math.round(avgScore),
      criticalCount,
      warningCount,
    };
  }, [perfHistory]);

  const perfActivityData = useMemo(() => {
    if (perfHistory.length === 0) return [];
    const byDate = new Map<string, number>();
    perfHistory.forEach((p) => {
      const date = p.createdAt.slice(0, 10);
      byDate.set(date, (byDate.get(date) || 0) + 1);
    });
    return Array.from(byDate.entries())
      .map(([date, searches]) => ({ date, searches }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [perfHistory]);

  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (exporting) return;
      const dataToExport = activeTab === 'locator' ? filtered : perfHistory;
      if (dataToExport.length === 0) {
        Alert.alert('Nothing to export', 'There is no data for the selected period.');
        return;
      }
      setExporting(format);
      try {
        const path = await exportAnalytics(format, {
          filter: appliedFilter,
          entries: activeTab === 'locator' ? filtered : [],
          stats: activeTab === 'locator' ? stats : undefined,
          activityData: activeTab === 'locator' ? charts.activityData : perfActivityData,
          pieData: activeTab === 'locator' ? charts.pieData : undefined,
          perfHistory: activeTab === 'performance' ? perfHistory : undefined,
          perfStats: activeTab === 'performance' ? perfStats : undefined,
        });
        Alert.alert('Export saved', `${format.toUpperCase()} saved:\n${path}`);
      } catch (err) {
        Alert.alert('Export failed', err instanceof Error ? err.message : 'Could not export analytics.');
      } finally {
        setExporting(null);
      }
    },
    [exporting, filtered, appliedFilter, stats, charts, activeTab, perfHistory, perfActivityData, perfStats],
  );

  const setPreset = (preset: DatePreset) => {
    const next = { ...draftFilter, preset };
    setDraftFilter(next);
    setAppliedFilter(next);
    dateFocusRef.current = 0;
  };

  const showInitialLoader = historyLoading && indexedHistory.length === 0;

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
        <SegmentedControl
          value={activeTab}
          onChange={(v) => setActiveTab(v as 'locator' | 'performance')}
          options={[
            { value: 'locator', label: 'Locator' },
            { value: 'performance', label: 'Performance' },
          ]}
        />
      </Card>

      <Card style={{ gap: 12, marginBottom: 16 }}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>REPORT PERIOD</Text>
        <SegmentedControl
          value={draftFilter.preset}
          onChange={(p) => setPreset(p)}
          options={[
            { value: 'all', label: 'All time' },
            { value: 'single', label: 'One day' },
            { value: 'range', label: 'Range' },
          ]}
        />

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
          <Text style={{ fontSize: 10, color: colors.muted, fontFamily: monoFont }}>
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

      {activeTab === 'locator' ? (
        <View style={styles.kpiRow}>
          <Card style={styles.kpi}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>TOTAL SEARCHES</Text>
            <Text style={[styles.kpiVal, { color: colors.accent }]}>{stats?.totalSearches ?? 0}</Text>
          </Card>
          <Card style={styles.kpi}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>ELEMENTS</Text>
            <Text style={[styles.kpiVal, { color: colors.info }]}>{stats?.totalElements ?? 0}</Text>
          </Card>
          <Card style={[styles.kpi, { flex: 1.2 }]}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>TOP TYPE</Text>
            <Text style={[styles.kpiVal, { color: colors.secondary, fontSize: 18, textTransform: 'capitalize' }]}>
              {stats?.topType ?? 'None'}
            </Text>
          </Card>
        </View>
      ) : (
        <View style={styles.kpiRow}>
          <Card style={styles.kpi}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>TOTAL SCANS</Text>
            <Text style={[styles.kpiVal, { color: colors.accent }]}>{perfStats?.totalScans ?? 0}</Text>
          </Card>
          <Card style={styles.kpi}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>AVG SCORE</Text>
            <Text style={[styles.kpiVal, { color: colors.info }]}>{perfStats?.avgScore ?? 0}</Text>
          </Card>
          <Card style={[styles.kpi, { flex: 1.2 }]}>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>CRITICAL</Text>
            <Text style={[styles.kpiVal, { color: '#ef4444', fontSize: 18 }]}>
              {perfStats?.criticalCount ?? 0}
            </Text>
          </Card>
        </View>
      )}

      <Card style={{ marginTop: 16, gap: 12 }}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>
          {activeTab === 'locator' ? activityChartTitle(appliedFilter) : 'Scan Activity'}
        </Text>
        {activeTab === 'locator' ? (
          showInitialLoader ? (
            <ActivityIndicator color={colors.accent} />
          ) : filtered.length === 0 ? (
            <Text style={{ color: colors.muted, textAlign: 'center' }}>No data for this period</Text>
          ) : (
            <ActivityBarChart data={charts.activityData} />
          )
        ) : perfLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : perfHistory.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No performance scans yet</Text>
        ) : (
          <ActivityBarChart data={perfActivityData} />
        )}
      </Card>

      {activeTab === 'locator' && (
        <Card style={{ marginTop: 16, gap: 12 }}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Locator Types</Text>
          {showInitialLoader ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <LocatorPieChart data={charts.pieData} />
          )}
        </Card>
      )}

      <Card style={{ marginTop: 16, gap: 12, marginBottom: 24 }}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>Export report</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Download the {activeTab} analytics for the selected period ({activeTab === 'locator' ? perf.recordCount : perfHistory.length} {activeTab === 'locator' ? (perf.recordCount === 1 ? 'record' : 'records') : (perfHistory.length === 1 ? 'scan' : 'scans')}).
        </Text>
        <View style={styles.exportRow}>
          {(['csv', 'json', 'pdf'] as ExportFormat[]).map((fmt) => (
            <Pressable
              key={fmt}
              onPress={() => handleExport(fmt)}
              disabled={!!exporting || (activeTab === 'locator' ? filtered.length === 0 : perfHistory.length === 0)}
              style={[
                styles.exportBtn,
                { borderColor: colors.accent, opacity: !!exporting || (activeTab === 'locator' ? filtered.length === 0 : perfHistory.length === 0) ? 0.5 : 1 },
              ]}
            >
              {exporting === fmt ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>{fmt.toUpperCase()}</Text>
              )}
            </Pressable>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  dateBtn: { borderWidth: 1, borderRadius: 8, padding: 12 },
  applyBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpi: { flex: 1, padding: 12 },
  kpiLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  kpiVal: { fontSize: 24, fontWeight: '700' },
  chartTitle: { fontSize: 16, fontWeight: '700' },
  exportRow: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
