import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import type { PipeSegment, ValveWell, Hazard, Inspector, AppConfig, SavedProject } from '@/types';

export const exportElementAsImage = async (
  elementId: string,
  filename: string,
  config: AppConfig
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('未找到要导出的元素');
  }

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const mimeType = config.exportFormat === 'png' ? 'image/png' : 'image/jpeg';
  const quality = config.exportFormat === 'jpeg' ? config.exportQuality / 100 : undefined;
  const extension = config.exportFormat;

  canvas.toBlob(
    (blob) => {
      if (blob) {
        saveAs(blob, `${filename}.${extension}`);
      }
    },
    mimeType,
    quality
  );
};

export const exportDataToCsv = <T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${filename}.csv`);
};

export const exportPipesToCsv = (pipes: PipeSegment[]): void => {
  const exportData = pipes.map(pipe => ({
    管段编号: pipe.name,
    所属区域: pipe.area,
    起点X: pipe.startPoint[0],
    起点Y: pipe.startPoint[1],
    终点X: pipe.endPoint[0],
    终点Y: pipe.endPoint[1],
    管径: pipe.diameter,
    管材: pipe.material,
    巡检状态: pipe.status === 'inspected' ? '已巡检' : '未巡检',
    巡检时间: pipe.inspectedAt || '',
    巡检人员: pipe.inspector || '',
  }));
  exportDataToCsv(exportData, '管段数据');
};

export const exportValvesToCsv = (valves: ValveWell[]): void => {
  const typeLabels: Record<string, string> = { gate: '闸阀', butterfly: '蝶阀', check: '止回阀' };
  const statusLabels: Record<string, string> = { normal: '正常', maintenance: '维护中', fault: '故障' };

  const exportData = valves.map(valve => ({
    阀门井编号: valve.name,
    位置X: valve.position[0],
    位置Y: valve.position[1],
    阀门类型: typeLabels[valve.type] || valve.type,
    状态: statusLabels[valve.status] || valve.status,
    上次巡检: valve.lastInspection || '',
  }));
  exportDataToCsv(exportData, '阀门井数据');
};

export const exportHazardsToCsv = (hazards: Hazard[]): void => {
  const typeLabels: Record<string, string> = { leak: '渗漏', blockage: '堵塞', damage: '破损', other: '其他' };
  const levelLabels: Record<string, string> = { minor: '轻微', moderate: '一般', severe: '严重', critical: '危急' };
  const statusLabels: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决' };

  const exportData = hazards.map(hazard => ({
    隐患编号: hazard.id,
    隐患类型: typeLabels[hazard.type] || hazard.type,
    隐患等级: levelLabels[hazard.level] || hazard.level,
    位置: hazard.location,
    位置X: hazard.position[0],
    位置Y: hazard.position[1],
    描述: hazard.description,
    上报人: hazard.reporter,
    上报时间: hazard.reportedAt,
    状态: statusLabels[hazard.status] || hazard.status,
    整改建议: hazard.suggestion,
  }));
  exportDataToCsv(exportData, '隐患数据');
};

export const exportStatisticsToCsv = (statistics: {
  inspectors: Inspector[];
  totalPipes: number;
  inspectedPipes: number;
  totalHazards: number;
  resolvedHazards: number;
}): void => {
  const summaryData = [{
    总管段数: statistics.totalPipes,
    已巡管段数: statistics.inspectedPipes,
    巡检率: `${((statistics.inspectedPipes / statistics.totalPipes) * 100).toFixed(1)}%`,
    隐患总数: statistics.totalHazards,
    已解决隐患: statistics.resolvedHazards,
    解决率: `${((statistics.resolvedHazards / statistics.totalHazards) * 100).toFixed(1)}%`,
  }];

  const inspectorData = statistics.inspectors.map(inspector => ({
    巡检人员: inspector.name,
    巡检次数: inspector.inspectionCount,
    总里程: `${inspector.totalDistance}km`,
    上报隐患: inspector.hazardReported,
  }));

  const csv1 = Papa.unparse(summaryData);
  const csv2 = Papa.unparse(inspectorData);
  const combinedCsv = `${csv1}\n\n${csv2}`;

  const blob = new Blob([`\uFEFF${combinedCsv}`], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, '统计数据.csv');
};

export const exportProjectToJson = (project: SavedProject): void => {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, `${project.name}.json`);
};

export const importProjectFromJson = async (file: File): Promise<SavedProject> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // 支持两种格式：标准SavedProject格式 和 智慧水务巡检汇报包格式
        let savedProject: SavedProject;

        if (data.type === '智慧水务巡检汇报包') {
          // 处理离线汇报包格式
          savedProject = {
            id: `report-${Date.now()}`,
            name: `${data.type}_${new Date(data.exportedAt).toLocaleDateString('zh-CN')}`,
            data: {
              pipes: data.data?.pipes || [],
              valves: data.data?.valves || [],
              routes: data.data?.routes || [],
              hazards: data.data?.hazards || [],
              photos: data.data?.photos || [],
              inspectors: data.data?.inspectors || [],
            },
            config: {
              theme: data.config?.theme || 'tech',
              legend: data.config?.legend || {
                pipeColor: '#0ea5e9',
                inspectedColor: '#22c55e',
                uninspectedColor: '#94a3b8',
                valveColor: '#f59e0b',
                hazardColor: '#ef4444',
                minorColor: '#22c55e',
                moderateColor: '#f59e0b',
                severeColor: '#f97316',
                criticalColor: '#ef4444',
              },
              exportFormat: data.config?.exportFormat || 'png',
              exportQuality: data.config?.exportQuality || 90,
            },
            exportFilters: data.exportFilters,
            createdAt: data.exportedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } else {
          // 处理标准SavedProject格式
          if (!data.data || !data.config) {
            throw new Error('无效的方案文件格式');
          }
          savedProject = data as SavedProject;
        }

        resolve(savedProject);
      } catch (error) {
        reject(new Error('文件格式无效'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};
