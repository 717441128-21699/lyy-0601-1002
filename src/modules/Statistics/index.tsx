import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  AlertTriangle,
  Ruler,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  X,
  ChevronDown,
  RefreshCw,
  Presentation,
  Download,
  Image,
  MapPin,
  FileText,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useStatistics, StatisticsFilters } from '@/hooks/useStatistics';
import { useTheme } from '@/hooks/useTheme';
import { useInspectionStore } from '@/store/useInspectionStore';
import { getHazardTypeLabel, getHazardLevelLabel } from '@/utils/suggestions';
import { exportElementAsImage } from '@/utils/exporters';
import type { HazardLevel } from '@/types';

export const StatisticsModule: React.FC = () => {
  const { themeColors, currentTheme } = useTheme();
  const { config, pipes, hazards, photos, activeFilters, setActiveFilters } = useInspectionStore();

  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const [showLevelFilter, setShowLevelFilter] = useState(false);
  const [showReporterFilter, setShowReporterFilter] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const filters = activeFilters;
  const setFilters = (newFilters: Partial<StatisticsFilters>) => {
    setActiveFilters(newFilters);
  };

  const stats = useStatistics(filters);

  const availableAreas = useMemo(() => {
    return [...new Set(pipes.map(p => p.area))];
  }, [pipes]);

  const availableReporters = useMemo(() => {
    return [...new Set(hazards.map(h => h.reporter))];
  }, [hazards]);

  const hasActiveFilters = filters.area !== 'all' || filters.hazardLevel !== 'all' || filters.reporter !== 'all';

  const resetFilters = () => {
    setActiveFilters({ area: 'all', hazardLevel: 'all', reporter: 'all' });
  };

  const handleExportReport = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const filename = `智慧水务巡检汇报_${new Date().toISOString().split('T')[0]}`;
      await exportElementAsImage('report-view-content', filename, config);
    } catch (error) {
      console.error('导出汇报图片失败:', error);
      alert('导出失败：' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const reportPhotos = useMemo(() => {
    const hazardPhotoIds = new Set(stats.hazardByType ? [] : []);
    return photos
      .filter(p => p.hazardId)
      .slice(0, 6);
  }, [photos]);

  const textColor = currentTheme === 'light' ? '#1F2937' : '#F3F4F6';
  const axisLineColor = currentTheme === 'light' ? '#E5E7EB' : '#374151';
  const splitLineColor = currentTheme === 'light' ? '#F3F4F6' : '#1F2937';

  const inspectionRate = stats.totalPipes > 0 ? ((stats.inspectedPipes / stats.totalPipes) * 100).toFixed(1) : '0';
  const resolveRate = stats.totalHazards > 0 ? ((stats.resolvedHazards / stats.totalHazards) * 100).toFixed(1) : '0';

  const monthlyDiff = useMemo(() => {
    const { currentMonth, lastMonth } = stats.monthlyComparison;
    return {
      inspections: currentMonth.inspections - lastMonth.inspections,
      inspectionsPercent: lastMonth.inspections > 0
        ? (((currentMonth.inspections - lastMonth.inspections) / lastMonth.inspections) * 100).toFixed(1)
        : '0',
      hazards: currentMonth.hazards - lastMonth.hazards,
      hazardsPercent: lastMonth.hazards > 0
        ? (((currentMonth.hazards - lastMonth.hazards) / lastMonth.hazards) * 100).toFixed(1)
        : '0',
      distance: (currentMonth.distance - lastMonth.distance).toFixed(1),
      distancePercent: lastMonth.distance > 0
        ? (((currentMonth.distance - lastMonth.distance) / lastMonth.distance) * 100).toFixed(1)
        : '0',
    };
  }, [stats.monthlyComparison]);

  const workloadChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-primary)',
      textStyle: { color: textColor },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: stats.topInspectors.map(i => i.name),
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor, fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: '巡检次数',
        position: 'left',
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: textColor, fontSize: 11 },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      {
        type: 'value',
        name: '里程(km)',
        position: 'right',
        axisLine: { lineStyle: { color: axisLineColor } },
        axisLabel: { color: textColor, fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '巡检次数',
        type: 'bar',
        data: stats.topInspectors.map(i => i.inspectionCount),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: themeColors.primary },
              { offset: 1, color: themeColors.primary + '66' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '30%',
      },
      {
        name: '总里程',
        type: 'line',
        yAxisIndex: 1,
        data: stats.topInspectors.map(i => i.totalDistance),
        smooth: true,
        lineStyle: { color: config.legend.inspectedColor, width: 2 },
        itemStyle: { color: config.legend.inspectedColor },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: config.legend.inspectedColor + '33' },
              { offset: 1, color: config.legend.inspectedColor + '00' },
            ],
          },
        },
      },
    ],
  }), [stats.topInspectors, themeColors.primary, config.legend.inspectedColor, textColor, axisLineColor, splitLineColor]);

  const hazardTypeChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-primary)',
      textStyle: { color: textColor },
      formatter: '{b}: {c}个 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: textColor, fontSize: 11 },
    },
    series: [
      {
        name: '隐患类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--bg-primary)',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: textColor },
        },
        data: Object.entries(stats.hazardByType).map(([type, count]) => ({
          value: count,
          name: getHazardTypeLabel(type as any),
          itemStyle: {
            color: type === 'leak' ? '#3B82F6' :
                   type === 'blockage' ? '#F59E0B' :
                   type === 'damage' ? config.legend.severeColor : '#8B5CF6',
          },
        })),
      },
    ],
  }), [stats.hazardByType, config.legend.severeColor, textColor]);

  const hazardLevelChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-primary)',
      textStyle: { color: textColor },
      formatter: '{b}: {c}个 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: textColor, fontSize: 11 },
    },
    series: [
      {
        name: '隐患等级',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--bg-primary)',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: textColor },
        },
        data: Object.entries(stats.hazardByLevel).map(([level, count]) => ({
          value: count,
          name: getHazardLevelLabel(level as any),
          itemStyle: {
            color: config.legend[`${level}Color` as keyof typeof config.legend],
          },
        })),
      },
    ],
  }), [stats.hazardByLevel, config.legend, textColor]);

  const trendChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-primary)',
      textStyle: { color: textColor },
    },
    legend: {
      data: ['巡检次数', '隐患数量'],
      textStyle: { color: textColor, fontSize: 11 },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stats.trendData.map(d => d.date),
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor, fontSize: 11 },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    series: [
      {
        name: '巡检次数',
        type: 'line',
        smooth: true,
        data: stats.trendData.map(d => d.inspections),
        lineStyle: { color: themeColors.primary, width: 2 },
        itemStyle: { color: themeColors.primary },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: themeColors.primary + '33' },
              { offset: 1, color: themeColors.primary + '00' },
            ],
          },
        },
      },
      {
        name: '隐患数量',
        type: 'line',
        smooth: true,
        data: stats.trendData.map(d => d.hazards),
        lineStyle: { color: config.legend.severeColor, width: 2 },
        itemStyle: { color: config.legend.severeColor },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: config.legend.severeColor + '33' },
              { offset: 1, color: config.legend.severeColor + '00' },
            ],
          },
        },
      },
    ],
  }), [stats.trendData, themeColors.primary, config.legend.severeColor, textColor, axisLineColor, splitLineColor]);

  const monthCompareChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-primary)',
      textStyle: { color: textColor },
    },
    legend: {
      data: ['本月', '上月'],
      textStyle: { color: textColor, fontSize: 11 },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['巡检次数', '隐患数量', '巡检里程(km)'],
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor, fontSize: 11 },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    series: [
      {
        name: '本月',
        type: 'bar',
        data: [
          stats.monthlyComparison.currentMonth.inspections,
          stats.monthlyComparison.currentMonth.hazards,
          stats.monthlyComparison.currentMonth.distance,
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: themeColors.primary },
              { offset: 1, color: themeColors.primary + '66' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '30%',
      },
      {
        name: '上月',
        type: 'bar',
        data: [
          stats.monthlyComparison.lastMonth.inspections,
          stats.monthlyComparison.lastMonth.hazards,
          stats.monthlyComparison.lastMonth.distance,
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#6B7280' },
              { offset: 1, color: '#6B728066' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '30%',
      },
    ],
  }), [stats.monthlyComparison, themeColors.primary, textColor, axisLineColor, splitLineColor]);

  return (
    <div className="space-y-4 h-full overflow-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                统计分析
                {hasActiveFilters && (
                  <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    已筛选
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReportView(true)}
                >
                  <Presentation className="w-4 h-4" />
                  汇报视图
                </Button>
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowAreaFilter(!showAreaFilter);
                      setShowLevelFilter(false);
                      setShowReporterFilter(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-bg-secondary"
                    style={{
                      background: filters.area !== 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: filters.area !== 'all' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    }}
                  >
                    <Filter className="w-4 h-4" />
                    区域: {filters.area === 'all' ? '全部' : filters.area}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showAreaFilter && (
                    <div className="absolute top-full left-0 mt-2 bg-bg-primary border border-border-primary rounded-lg shadow-xl z-20 min-w-[150px]">
                      <div
                        className="px-4 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                        onClick={() => {
                          setFilters({ ...filters, area: 'all' });
                          setShowAreaFilter(false);
                        }}
                      >
                        全部区域
                      </div>
                      {availableAreas.map(area => (
                        <div
                          key={area}
                          className="px-4 py-2 hover:bg-bg-secondary cursor-pointer text-sm flex items-center justify-between"
                          onClick={() => {
                            setFilters({ ...filters, area });
                            setShowAreaFilter(false);
                          }}
                        >
                          {area}
                          {filters.area === area && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowLevelFilter(!showLevelFilter);
                      setShowAreaFilter(false);
                      setShowReporterFilter(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-bg-secondary"
                    style={{
                      background: filters.hazardLevel !== 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: filters.hazardLevel !== 'all' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    }}
                  >
                    <Filter className="w-4 h-4" />
                    等级: {filters.hazardLevel === 'all' ? '全部' : getHazardLevelLabel(filters.hazardLevel as HazardLevel)}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showLevelFilter && (
                    <div className="absolute top-full left-0 mt-2 bg-bg-primary border border-border-primary rounded-lg shadow-xl z-20 min-w-[150px]">
                      <div
                        className="px-4 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                        onClick={() => {
                          setFilters({ ...filters, hazardLevel: 'all' });
                          setShowLevelFilter(false);
                        }}
                      >
                        全部等级
                      </div>
                      {(['minor', 'moderate', 'severe', 'critical'] as HazardLevel[]).map(level => (
                        <div
                          key={level}
                          className="px-4 py-2 hover:bg-bg-secondary cursor-pointer text-sm flex items-center justify-between gap-2"
                          onClick={() => {
                            setFilters({ ...filters, hazardLevel: level });
                            setShowLevelFilter(false);
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: config.legend[`${level}Color` as keyof typeof config.legend] as string }}
                            />
                            {getHazardLevelLabel(level)}
                          </span>
                          {filters.hazardLevel === level && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowReporterFilter(!showReporterFilter);
                      setShowAreaFilter(false);
                      setShowLevelFilter(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-bg-secondary"
                    style={{
                      background: filters.reporter !== 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: filters.reporter !== 'all' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    }}
                  >
                    <Users className="w-4 h-4" />
                    上报人: {filters.reporter === 'all' ? '全部' : filters.reporter}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showReporterFilter && (
                    <div className="absolute top-full left-0 mt-2 bg-bg-primary border border-border-primary rounded-lg shadow-xl z-20 min-w-[150px]">
                      <div
                        className="px-4 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                        onClick={() => {
                          setFilters({ ...filters, reporter: 'all' });
                          setShowReporterFilter(false);
                        }}
                      >
                        全部上报人
                      </div>
                      {availableReporters.map(reporter => (
                        <div
                          key={reporter}
                          className="px-4 py-2 hover:bg-bg-secondary cursor-pointer text-sm flex items-center justify-between"
                          onClick={() => {
                            setFilters({ ...filters, reporter });
                            setShowReporterFilter(false);
                          }}
                        >
                          {reporter}
                          {filters.reporter === reporter && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-bg-secondary"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    重置筛选
                  </button>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm opacity-70">总管段</span>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Ruler className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.totalPipes}</p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>已巡 {stats.inspectedPipes}</span>
              <span className="opacity-50">({inspectionRate}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm opacity-70">隐患总数</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${config.legend.severeColor}20` }}>
                <AlertTriangle className="w-5 h-5" style={{ color: config.legend.severeColor }} />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.totalHazards}</p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>解决 {stats.resolvedHazards}</span>
              <span className="opacity-50">({resolveRate}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm opacity-70">巡检次数</span>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.inspectionCount}</p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              {monthlyDiff.inspections >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={monthlyDiff.inspections >= 0 ? 'text-green-500' : 'text-red-500'}>
                {monthlyDiff.inspectionsPercent}%
              </span>
              <span className="opacity-50">较上月</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm opacity-70">总里程</span>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.totalDistance.toFixed(1)}<span className="text-lg ml-1">km</span></p>
            <div className="flex items-center gap-1 mt-1 text-sm">
              {parseFloat(monthlyDiff.distance) >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={parseFloat(monthlyDiff.distance) >= 0 ? 'text-green-500' : 'text-red-500'}>
                {monthlyDiff.distancePercent}%
              </span>
              <span className="opacity-50">较上月</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              人员工作量排名
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={workloadChartOption} style={{ height: '300px' }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              本月上月数据对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={monthCompareChartOption} style={{ height: '300px' }} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              隐患类型分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={hazardTypeChartOption} style={{ height: '280px' }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              隐患等级分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={hazardLevelChartOption} style={{ height: '280px' }} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            近30天趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts option={trendChartOption} style={{ height: '320px' }} />
        </CardContent>
      </Card>

      <Modal isOpen={showReportView} onClose={() => setShowReportView(false)} title="巡检汇报视图" size="xl">
        <div id="report-view-content" ref={reportRef} className="space-y-4">
          <div className="text-center pb-4 border-b border-border-primary">
            <h1 className="text-2xl font-bold">智慧水务巡检汇报</h1>
            <p className="text-sm opacity-60 mt-1">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                  筛选: {filters.area !== 'all' && filters.area + ' '}
                  {filters.hazardLevel !== 'all' && getHazardLevelLabel(filters.hazardLevel as HazardLevel) + ' '}
                  {filters.reporter !== 'all' && filters.reporter}
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-bg-secondary">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-60">管段总数</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${themeColors.primary}20` }}>
                  <Ruler className="w-4 h-4" style={{ color: themeColors.primary }} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.totalPipes}</p>
              <p className="text-xs opacity-60 mt-1">已巡 {stats.inspectedPipes} ({inspectionRate}%)</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secondary">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-60">隐患总数</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${config.legend.severeColor}20` }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: config.legend.severeColor }} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.totalHazards}</p>
              <p className="text-xs opacity-60 mt-1">已解决 {stats.resolvedHazards} ({resolveRate}%)</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secondary">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-60">巡检次数</span>
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.inspectionCount}</p>
              <p className="text-xs opacity-60 mt-1">总里程 {stats.totalDistance.toFixed(1)} km</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-secondary">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs opacity-60">巡检人员</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.topInspectors.length}</p>
              <p className="text-xs opacity-60 mt-1">上报隐患 {stats.totalHazards} 个</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-bg-secondary">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                隐患类型分布
              </h3>
              <ReactECharts option={hazardTypeChartOption} style={{ height: '220px' }} />
            </div>
            <div className="p-4 rounded-xl bg-bg-secondary">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                隐患等级分布
              </h3>
              <ReactECharts option={hazardLevelChartOption} style={{ height: '220px' }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-secondary">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              近30天趋势
            </h3>
            <ReactECharts option={trendChartOption} style={{ height: '200px' }} />
          </div>

          {reportPhotos.length > 0 && (
            <div className="p-4 rounded-xl bg-bg-secondary">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" />
                现场照片摘要
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {reportPhotos.map((photo) => {
                  const hazard = hazards.find(h => h.id === photo.hazardId);
                  return (
                    <div key={photo.id} className="relative rounded-lg overflow-hidden aspect-square">
                      <img
                        src={photo.thumbnail || photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      {hazard && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-xs text-white truncate">{hazard.location}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-bg-secondary">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              隐患清单摘要
            </h3>
            <div className="space-y-2 max-h-40 overflow-auto">
              {hazards
                .filter(h => {
                  const matchArea = filters.area === 'all' || h.location.includes(filters.area);
                  const matchLevel = filters.hazardLevel === 'all' || h.level === filters.hazardLevel;
                  const matchReporter = filters.reporter === 'all' || h.reporter === filters.reporter;
                  return matchArea && matchLevel && matchReporter;
                })
                .slice(0, 5)
                .map((hazard) => (
                  <div key={hazard.id} className="flex items-center justify-between p-2 rounded-lg bg-bg-primary">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: config.legend[`${hazard.level}Color` as keyof typeof config.legend] }}
                      />
                      <span className="text-sm truncate">{hazard.location}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs opacity-60">{getHazardTypeLabel(hazard.type)}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${config.legend[`${hazard.level}Color` as keyof typeof config.legend]}20`,
                          color: config.legend[`${hazard.level}Color` as keyof typeof config.legend],
                        }}
                      >
                        {getHazardLevelLabel(hazard.level)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-primary">
          <p className="text-sm opacity-60">
            <MapPin className="w-4 h-4 inline mr-1" />
            {filters.area === 'all' ? '全部区域' : filters.area}
            {filters.reporter !== 'all' && ` · ${filters.reporter}`}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowReportView(false)}>
              关闭
            </Button>
            <Button variant="primary" onClick={handleExportReport} disabled={isExporting}>
              <Download className="w-4 h-4" />
              {isExporting ? '导出中...' : '导出汇报图片'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
