import { useMemo } from 'react';
import { useInspectionStore } from '@/store/useInspectionStore';
import type { Statistics, HazardLevel } from '@/types';

export interface StatisticsFilters {
  area: string | 'all';
  hazardLevel: HazardLevel | 'all';
  reporter: string | 'all';
}

export const useStatistics = (filters: StatisticsFilters = { area: 'all', hazardLevel: 'all', reporter: 'all' }): Statistics => {
  const { pipes, valves, hazards, routes, inspectors } = useInspectionStore();

  return useMemo(() => {
    const filteredHazards = hazards.filter(h => {
      const matchArea = filters.area === 'all' || h.location.includes(filters.area);
      const matchLevel = filters.hazardLevel === 'all' || h.level === filters.hazardLevel;
      const matchReporter = filters.reporter === 'all' || h.reporter === filters.reporter;
      return matchArea && matchLevel && matchReporter;
    });

    const filteredPipes = pipes.filter(p => {
      if (filters.area === 'all') return true;
      return p.area === filters.area;
    });

    const filteredRoutes = routes; // 目前route没有area字段，不过滤

    const inspectorNames = [...new Set(hazards.map(h => h.reporter))];
    const areas = [...new Set(pipes.map(p => p.area))];

    const totalPipes = filteredPipes.length;
    const inspectedPipes = filteredPipes.filter(p => p.status === 'inspected').length;
    const totalValves = valves.length;
    const totalHazards = filteredHazards.length;
    const resolvedHazards = filteredHazards.filter(h => h.status === 'resolved').length;
    const inspectionCount = filteredRoutes.length;
    const totalDistance = filteredRoutes.reduce((sum, r) => sum + r.distance, 0);

    const topInspectors = inspectorNames
      .map(name => ({
        id: `inspector-${name}`,
        name,
        inspectionCount: filteredHazards.filter(h => h.reporter === name).length,
        totalDistance: 0,
        hazardReported: filteredHazards.filter(h => h.reporter === name).length,
      }))
      .sort((a, b) => b.inspectionCount - a.inspectionCount)
      .slice(0, 5);

    const hazardByType = filteredHazards.reduce((acc, h) => {
      acc[h.type] = (acc[h.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hazardByLevel = filteredHazards.reduce((acc, h) => {
      acc[h.level] = (acc[h.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const isCurrentMonth = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    };

    const isLastMonth = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    };

    const monthlyComparison = {
      currentMonth: {
        inspections: filteredRoutes.filter(r => isCurrentMonth(r.date)).length,
        hazards: filteredHazards.filter(h => isCurrentMonth(h.reportedAt)).length,
        distance: filteredRoutes.filter(r => isCurrentMonth(r.date)).reduce((sum, r) => sum + r.distance, 0),
      },
      lastMonth: {
        inspections: filteredRoutes.filter(r => isLastMonth(r.date)).length,
        hazards: filteredHazards.filter(h => isLastMonth(h.reportedAt)).length,
        distance: filteredRoutes.filter(r => isLastMonth(r.date)).reduce((sum, r) => sum + r.distance, 0),
      },
    };

    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayInspections = filteredRoutes.filter(r => r.date === dateStr).length;
      const dayHazards = filteredHazards.filter(h => h.reportedAt.startsWith(dateStr)).length;

      trendData.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        inspections: dayInspections,
        hazards: dayHazards,
      });
    }

    return {
      totalPipes,
      inspectedPipes,
      totalValves,
      totalHazards,
      resolvedHazards,
      inspectionCount,
      totalDistance,
      topInspectors,
      hazardByType,
      hazardByLevel,
      monthlyComparison,
      trendData,
      availableAreas: areas,
      availableReporters: inspectorNames,
    };
  }, [pipes, valves, hazards, routes, inspectors, filters.area, filters.hazardLevel, filters.reporter]);
};
