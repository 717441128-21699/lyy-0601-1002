import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useStatistics, StatisticsFilters } from '@/hooks/useStatistics';
import { useTheme } from '@/hooks/useTheme';
import { useInspectionStore } from '@/store/useInspectionStore';
import { getHazardTypeLabel, getHazardLevelLabel } from '@/utils/suggestions';
import type { HazardLevel } from '@/types';

export const StatisticsModule: React.FC = () => {
  const { themeColors, currentTheme } = useTheme();
  const { config, pipes, hazards } = useInspectionStore();

  const [filters, setFilters] = useState<StatisticsFilters>({
    area: 'all',
    hazardLevel: 'all',
    reporter: 'all',
  });

  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const [showLevelFilter, setShowLevelFilter] = useState(false);
  const [showReporterFilter, setShowReporterFilter] = useState(false);

  const stats = useStatistics(filters);

  const availableAreas = useMemo(() => {
    return [...new Set(pipes.map(p => p.area))];
  }, [pipes]);

  const availableReporters = useMemo(() => {
    return [...new Set(hazards.map(h => h.reporter))];
  }, [hazards]);

  const hasActiveFilters = filters.area !== 'all' || filters.hazardLevel !== 'all' || filters.reporter !== 'all';

  const resetFilters = () => {
    setFilters({ area: 'all', hazardLevel: 'all', reporter: 'all' });
  };

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
    </div>
  );
};
