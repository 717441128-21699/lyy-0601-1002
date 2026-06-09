import { useMemo } from 'react';
import { useInspectionStore } from '@/store/useInspectionStore';
import type { Statistics } from '@/types';

export const useStatistics = (): Statistics => {
  const { pipes, valves, hazards, routes, inspectors } = useInspectionStore();

  return useMemo(() => {
    const totalPipes = pipes.length;
    const inspectedPipes = pipes.filter(p => p.status === 'inspected').length;
    const totalValves = valves.length;
    const totalHazards = hazards.length;
    const resolvedHazards = hazards.filter(h => h.status === 'resolved').length;
    const inspectionCount = routes.length;
    const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);

    const topInspectors = [...inspectors].sort((a, b) => b.inspectionCount - a.inspectionCount).slice(0, 5);

    const hazardByType = hazards.reduce((acc, h) => {
      acc[h.type] = (acc[h.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hazardByLevel = hazards.reduce((acc, h) => {
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
        inspections: routes.filter(r => isCurrentMonth(r.date)).length,
        hazards: hazards.filter(h => isCurrentMonth(h.reportedAt)).length,
        distance: routes.filter(r => isCurrentMonth(r.date)).reduce((sum, r) => sum + r.distance, 0),
      },
      lastMonth: {
        inspections: routes.filter(r => isLastMonth(r.date)).length,
        hazards: hazards.filter(h => isLastMonth(h.reportedAt)).length,
        distance: routes.filter(r => isLastMonth(r.date)).reduce((sum, r) => sum + r.distance, 0),
      },
    };

    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayInspections = routes.filter(r => r.date === dateStr).length;
      const dayHazards = hazards.filter(h => h.reportedAt.startsWith(dateStr)).length;

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
    };
  }, [pipes, valves, hazards, routes, inspectors]);
};
