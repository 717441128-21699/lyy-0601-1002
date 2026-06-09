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
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Target,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useStatistics, StatisticsFilters } from '@/hooks/useStatistics';
import { useTheme } from '@/hooks/useTheme';
import { useInspectionStore } from '@/store/useInspectionStore';
import { getHazardTypeLabel, getHazardLevelLabel, filterPhotosByHazardFilters, isPhotoLinkedToHazard, getPhotoLinkedHazard } from '@/utils/suggestions';
import { exportElementAsImage } from '@/utils/exporters';
import type { HazardLevel, Hazard } from '@/types';

export const StatisticsModule: React.FC = () => {
  const { themeColors, currentTheme } = useTheme();
  const { config, pipes, hazards, photos, activeFilters, setActiveFilters } = useInspectionStore();

  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const [showLevelFilter, setShowLevelFilter] = useState(false);
  const [showReporterFilter, setShowReporterFilter] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

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

  const filteredHazards = useMemo(() => {
    return hazards.filter(h => {
      const matchArea = filters.area === 'all' || h.location.includes(filters.area);
      const matchLevel = filters.hazardLevel === 'all' || h.level === filters.hazardLevel;
      const matchReporter = filters.reporter === 'all' || h.reporter === filters.reporter;
      return matchArea && matchLevel && matchReporter;
    });
  }, [hazards, filters]);

  const reportPhotos = useMemo(() => {
    return photos
      .filter(p => {
        const matchArea = filters.area === 'all' || p.location === filters.area;
        const isLinked = isPhotoLinkedToHazard(p, filteredHazards);
        return matchArea && isLinked;
      })
      .slice(0, 6);
  }, [photos, filters, filteredHazards]);

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

  const presentationSections = useMemo(() => [
    {
      id: 'metrics',
      title: '关键指标',
      icon: <BarChart3 className="w-5 h-5" />,
      narration: `各位领导好，今天汇报的是${filters.area === 'all' ? '全区域' : filters.area}的巡检情况。截至目前，我们已完成巡检管段${stats.inspectedPipes}条，巡检率达到${inspectionRate}%。发现隐患${stats.totalHazards}处，其中已解决${stats.resolvedHazards}处，解决率${resolveRate}%。本月累计巡检${stats.inspectionCount}次，总里程${stats.totalDistance.toFixed(1)}公里。`,
      keyHazards: () => filteredHazards
        .filter(h => h.level === 'critical' || h.level === 'severe')
        .slice(0, 3),
    },
    {
      id: 'distribution',
      title: '隐患分布',
      icon: <PieChart className="w-5 h-5" />,
      narration: `从隐患类型来看，${Object.entries(stats.hazardByType).sort((a, b) => b[1] - a[1]).map(([type, count], idx) => `${idx === 0 ? '主要' : '其次'}是${getHazardTypeLabel(type as any)}，共${count}处`).join('，')}。按等级划分，${Object.entries(stats.hazardByLevel).sort((a, b) => b[1] - a[1]).map(([level, count]) => `${getHazardLevelLabel(level as any)}${count}处`).join('，')}。我们重点关注严重及以上等级的隐患，确保及时处理。`,
      keyHazards: () => filteredHazards
        .filter(h => h.status !== 'resolved')
        .slice(0, 3),
    },
    {
      id: 'trend',
      title: '趋势分析',
      icon: <TrendingUp className="w-5 h-5" />,
      narration: `从近30天趋势来看，巡检次数保持稳定，隐患发现数量${stats.trendData.slice(-7).reduce((sum, d) => sum + d.hazards, 0) > stats.trendData.slice(-14, -7).reduce((sum, d) => sum + d.hazards, 0) ? '有所上升，说明巡检质量在提高' : '稳中有降，说明前期整改效果明显'}。本月较上月，巡检次数${monthlyDiff.inspections >= 0 ? '增加' : '减少'}${Math.abs(monthlyDiff.inspections)}次，隐患数量${monthlyDiff.hazards >= 0 ? '增加' : '减少'}${Math.abs(monthlyDiff.hazards)}处。`,
      keyHazards: () => filteredHazards
        .filter(h => {
          const date = new Date(h.reportedAt);
          const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 7;
        })
        .slice(0, 3),
    },
    {
      id: 'photos',
      title: '现场照片',
      icon: <Image className="w-5 h-5" />,
      narration: `以上是现场拍摄的典型照片，涵盖了${reportPhotos.length}处隐患点。每一张照片都关联了具体的隐患信息，包括位置、类型和等级。现场照片为我们的隐患诊断和整改方案制定提供了直观的依据。接下来我们将重点处理照片中显示的严重隐患，确保管网安全运行。`,
      keyHazards: () => reportPhotos
        .map(p => getPhotoLinkedHazard(p, filteredHazards))
        .filter(Boolean)
        .slice(0, 3) as Hazard[],
    },
  ], [stats, filteredHazards, reportPhotos, filters, inspectionRate, resolveRate, monthlyDiff]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && reportRef.current) {
      reportRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const nextSection = () => {
    setCurrentSection((prev) => (prev + 1) % presentationSections.length);
  };

  const prevSection = () => {
    setCurrentSection((prev) => (prev - 1 + presentationSections.length) % presentationSections.length);
  };

  const toggleAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
      setAutoPlay(false);
    } else {
      autoPlayRef.current = setInterval(() => {
        setCurrentSection((prev) => (prev + 1) % presentationSections.length);
      }, 8000);
      setAutoPlay(true);
    }
  };

  React.useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <Button
              variant={!isPresentationMode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setIsPresentationMode(false)}
            >
              <BarChart3 className="w-4 h-4" />
              标准视图
            </Button>
            <Button
              variant={isPresentationMode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setIsPresentationMode(true)}
            >
              <Presentation className="w-4 h-4" />
              讲解模式
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isPresentationMode && (
              <>
                <Button variant="ghost" size="sm" onClick={toggleAutoPlay}>
                  {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {autoPlay ? '暂停' : '自动播放'}
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  {isFullscreen ? '退出全屏' : '全屏'}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleExportReport} disabled={isExporting}>
              <Download className="w-4 h-4" />
              {isExporting ? '导出中...' : '导出图片'}
            </Button>
          </div>
        </div>

        {isPresentationMode && (
          <div className="flex items-center justify-center gap-2 mb-4 pb-3 border-b border-border-primary">
            <Button variant="ghost" size="sm" onClick={prevSection}>
              <ChevronLeft className="w-4 h-4" />
              上一段
            </Button>
            {presentationSections.map((section, idx) => (
              <Button
                key={section.id}
                variant={currentSection === idx ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentSection(idx)}
                className="min-w-[100px]"
              >
                {section.icon}
                {section.title}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={nextSection}>
              下一段
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div id="report-view-content" ref={reportRef} className="space-y-4">
          {isPresentationMode ? (
            <div className="space-y-6">
              <div className="text-center pb-4 border-b border-border-primary">
                <h1 className="text-3xl font-bold mb-3">{presentationSections[currentSection].title}</h1>
                <div className="text-lg leading-relaxed max-w-4xl mx-auto p-4 rounded-xl bg-bg-secondary border border-border-primary">
                  {presentationSections[currentSection].narration}
                </div>
              </div>

              {currentSection === 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-6 rounded-xl bg-bg-secondary">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm opacity-60">管段总数</span>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${themeColors.primary}20` }}>
                        <Ruler className="w-5 h-5" style={{ color: themeColors.primary }} />
                      </div>
                    </div>
                    <p className="text-4xl font-bold">{stats.totalPipes}</p>
                    <p className="text-sm opacity-60 mt-2">已巡 {stats.inspectedPipes} ({inspectionRate}%)</p>
                  </div>
                  <div className="p-6 rounded-xl bg-bg-secondary">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm opacity-60">隐患总数</span>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${config.legend.severeColor}20` }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: config.legend.severeColor }} />
                      </div>
                    </div>
                    <p className="text-4xl font-bold">{stats.totalHazards}</p>
                    <p className="text-sm opacity-60 mt-2">已解决 {stats.resolvedHazards} ({resolveRate}%)</p>
                  </div>
                  <div className="p-6 rounded-xl bg-bg-secondary">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm opacity-60">巡检次数</span>
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                    <p className="text-4xl font-bold">{stats.inspectionCount}</p>
                    <p className="text-sm opacity-60 mt-2">总里程 {stats.totalDistance.toFixed(1)} km</p>
                  </div>
                  <div className="p-6 rounded-xl bg-bg-secondary">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm opacity-60">巡检人员</span>
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-500" />
                      </div>
                    </div>
                    <p className="text-4xl font-bold">{stats.topInspectors.length}</p>
                    <p className="text-sm opacity-60 mt-2">上报隐患 {stats.totalHazards} 个</p>
                  </div>
                </div>
              )}

              {currentSection === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-bg-secondary">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      隐患类型分布
                    </h3>
                    <ReactECharts option={hazardTypeChartOption} style={{ height: '300px' }} />
                  </div>
                  <div className="p-6 rounded-xl bg-bg-secondary">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      隐患等级分布
                    </h3>
                    <ReactECharts option={hazardLevelChartOption} style={{ height: '300px' }} />
                  </div>
                </div>
              )}

              {currentSection === 2 && (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-bg-secondary">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      近30天趋势
                    </h3>
                    <ReactECharts option={trendChartOption} style={{ height: '300px' }} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-bg-secondary text-center">
                      <p className="text-sm opacity-60 mb-1">本月巡检</p>
                      <p className="text-2xl font-bold">{stats.monthlyComparison.currentMonth.inspections}</p>
                      <p className="text-xs mt-1">
                        {monthlyDiff.inspections >= 0 ? (
                          <span className="text-green-500">↑ {monthlyDiff.inspectionsPercent}% 较上月</span>
                        ) : (
                          <span className="text-red-500">↓ {monthlyDiff.inspectionsPercent}% 较上月</span>
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-bg-secondary text-center">
                      <p className="text-sm opacity-60 mb-1">本月隐患</p>
                      <p className="text-2xl font-bold">{stats.monthlyComparison.currentMonth.hazards}</p>
                      <p className="text-xs mt-1">
                        {monthlyDiff.hazards >= 0 ? (
                          <span className="text-red-500">↑ {monthlyDiff.hazardsPercent}% 较上月</span>
                        ) : (
                          <span className="text-green-500">↓ {monthlyDiff.hazardsPercent}% 较上月</span>
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-bg-secondary text-center">
                      <p className="text-sm opacity-60 mb-1">本月里程</p>
                      <p className="text-2xl font-bold">{stats.monthlyComparison.currentMonth.distance.toFixed(1)} km</p>
                      <p className="text-xs mt-1">
                        {parseFloat(monthlyDiff.distance) >= 0 ? (
                          <span className="text-green-500">↑ {monthlyDiff.distancePercent}% 较上月</span>
                        ) : (
                          <span className="text-red-500">↓ {monthlyDiff.distancePercent}% 较上月</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentSection === 3 && (
                <div className="space-y-6">
                  {reportPhotos.length > 0 ? (
                    <div className="p-6 rounded-xl bg-bg-secondary">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        现场照片摘要（{reportPhotos.length}张）
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {reportPhotos.map((photo) => {
                          const hazard = getPhotoLinkedHazard(photo, filteredHazards);
                          return (
                            <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-square">
                              <img
                                src={photo.thumbnail || photo.url}
                                alt={photo.title}
                                className="w-full h-full object-cover"
                              />
                              {hazard && (
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                  <p className="text-sm text-white font-medium">{hazard.location}</p>
                                  <p className="text-xs text-white/80 mt-1">
                                    {getHazardTypeLabel(hazard.type)} · {getHazardLevelLabel(hazard.level)}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-bg-secondary text-center opacity-50">
                      <Image className="w-16 h-16 mx-auto mb-3" />
                      <p>暂无关联照片</p>
                    </div>
                  )}
                </div>
              )}

              {presentationSections[currentSection].keyHazards().length > 0 && (
                <div className="p-6 rounded-xl bg-bg-secondary">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    重点关注隐患
                  </h3>
                  <div className="space-y-3">
                    {presentationSections[currentSection].keyHazards().map((hazard) => (
                      <div key={hazard.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-primary border border-border-primary">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: config.legend[`${hazard.level}Color` as keyof typeof config.legend] }}
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{hazard.location}</p>
                            <p className="text-sm opacity-60 truncate">{hazard.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm px-2 py-1 rounded-lg bg-bg-secondary">
                            {getHazardTypeLabel(hazard.type)}
                          </span>
                          <span
                            className="text-sm px-2 py-1 rounded-lg font-medium"
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
              )}

              <div className="flex justify-center items-center gap-2 pt-4">
                {presentationSections.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSection(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSection === idx ? 'bg-primary w-8' : 'bg-border-primary'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
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
                现场照片摘要（{reportPhotos.length}张）
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {reportPhotos.map((photo) => {
                  const hazard = getPhotoLinkedHazard(photo, filteredHazards);
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
            </>
          )}
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
