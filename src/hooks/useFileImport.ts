import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { useInspectionStore } from '@/store/useInspectionStore';
import { validatePipeData, validateValveData, validateHazardData } from '@/utils/validators';
import type { ImportProgress, ValidationResult, PipeSegment, ValveWell, Hazard } from '@/types';

interface ParsedData {
  pipes: PipeSegment[];
  valves: ValveWell[];
  hazards: Hazard[];
}

export const useFileImport = () => {
  const { addPipe, addHazard } = useInspectionStore();
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const parseCsv = useCallback(async (file: File): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as Record<string, unknown>[]);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }, []);

  const parseJson = useCallback(async (file: File): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(Array.isArray(data) ? data : [data]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  const transformPipeData = useCallback((row: Record<string, unknown>): PipeSegment | null => {
    const startX = Number(row.startX || row['起点X'] || 0);
    const startY = Number(row.startY || row['起点Y'] || 0);
    const endX = Number(row.endX || row['终点X'] || 0);
    const endY = Number(row.endY || row['终点Y'] || 0);

    const pipe: Partial<PipeSegment> = {
      id: String(row.id || row['管段编号'] || uuidv4()),
      name: String(row.name || row['管段名称'] || ''),
      area: String(row.area || row['所属区域'] || ''),
      startPoint: [startX, startY] as [number, number],
      endPoint: [endX, endY] as [number, number],
      diameter: Number(row.diameter || row['管径'] || 0),
      material: String(row.material || row['管材'] || ''),
      status: (row.status || row['状态']) === '已巡检' ? 'inspected' : 'uninspected',
      inspectedAt: String(row.inspectedAt || row['巡检时间'] || ''),
      inspector: String(row.inspector || row['巡检人员'] || ''),
    };

    const validation = validatePipeData(pipe);
    if (!validation.valid) {
      return null;
    }

    return pipe as PipeSegment;
  }, []);

  const transformHazardData = useCallback((row: Record<string, unknown>): Omit<Hazard, 'id' | 'suggestion'> | null => {
    const posX = Number(row.positionX || row['位置X'] || 0);
    const posY = Number(row.positionY || row['位置Y'] || 0);

    const typeMap: Record<string, Hazard['type']> = {
      '渗漏': 'leak', '堵塞': 'blockage', '破损': 'damage', '其他': 'other',
    };

    const levelMap: Record<string, Hazard['level']> = {
      '轻微': 'minor', '一般': 'moderate', '严重': 'severe', '危急': 'critical',
    };

    const hazard: Omit<Hazard, 'id' | 'suggestion'> = {
      type: typeMap[String(row.type || row['隐患类型'])] || 'other',
      level: levelMap[String(row.level || row['隐患等级'])] || 'moderate',
      location: String(row.location || row['位置'] || ''),
      position: [posX, posY] as [number, number],
      description: String(row.description || row['描述'] || ''),
      reporter: String(row.reporter || row['上报人'] || ''),
      reportedAt: String(row.reportedAt || row['上报时间'] || new Date().toISOString()),
      status: 'pending',
      photos: [],
    };

    const validation = validateHazardData(hazard);
    if (!validation.valid) {
      return null;
    }

    return hazard;
  }, []);

  const importFile = useCallback(async (file: File, dataType: 'pipes' | 'hazards' | 'valves') => {
    setProgress({
      stage: 'parsing',
      progress: 0,
      total: 100,
      message: '正在解析文件...',
    });

    try {
      let data: Record<string, unknown>[];

      if (file.name.endsWith('.csv')) {
        data = await parseCsv(file);
      } else if (file.name.endsWith('.json')) {
        data = await parseJson(file);
      } else {
        throw new Error('不支持的文件格式，请上传CSV或JSON文件');
      }

      setProgress({
        stage: 'validating',
        progress: 30,
        total: 100,
        message: '正在校验数据...',
      });

      setPreviewData(data.slice(0, 10));

      const allErrors: string[] = [];
      const allWarnings: string[] = [];
      const validItems: unknown[] = [];

      data.forEach((row, index) => {
        if (dataType === 'pipes') {
          const validation = validatePipeData(transformPipeData(row));
          if (!validation.valid) {
            allErrors.push(`第${index + 1}行: ${validation.errors.join(', ')}`);
          } else {
            validItems.push(row);
          }
          allWarnings.push(...validation.warnings.map(w => `第${index + 1}行: ${w}`));
        } else if (dataType === 'hazards') {
          const validation = validateHazardData(transformHazardData(row));
          if (!validation.valid) {
            allErrors.push(`第${index + 1}行: ${validation.errors.join(', ')}`);
          } else {
            validItems.push(row);
          }
          allWarnings.push(...validation.warnings.map(w => `第${index + 1}行: ${w}`));
        }
      });

      setValidationResults({
        valid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
      });

      setProgress({
        stage: 'complete',
        progress: 100,
        total: 100,
        message: `解析完成，共${data.length}条数据，有效${validItems.length}条`,
      });

      return { data, validItems };
    } catch (error) {
      setProgress(null);
      setValidationResults({
        valid: false,
        errors: [error instanceof Error ? error.message : '文件解析失败'],
        warnings: [],
      });
      throw error;
    }
  }, [parseCsv, parseJson, transformPipeData, transformHazardData]);

  const confirmImport = useCallback((data: Record<string, unknown>[], dataType: 'pipes' | 'hazards') => {
    setProgress({
      stage: 'saving',
      progress: 50,
      total: 100,
      message: '正在保存数据...',
    });

    if (dataType === 'pipes') {
      data.forEach(row => {
        const pipe = transformPipeData(row);
        if (pipe) {
          addPipe(pipe);
        }
      });
    } else if (dataType === 'hazards') {
      data.forEach(row => {
        const hazard = transformHazardData(row);
        if (hazard) {
          addHazard(hazard);
        }
      });
    }

    setProgress({
      stage: 'complete',
      progress: 100,
      total: 100,
      message: '数据导入成功！',
    });
  }, [addPipe, addHazard, transformPipeData, transformHazardData]);

  const resetImport = useCallback(() => {
    setProgress(null);
    setValidationResults(null);
    setPreviewData([]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dataType: 'pipes' | 'hazards' | 'valves') => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      importFile(files[0], dataType);
    }
  }, [importFile]);

  return {
    progress,
    validationResults,
    previewData,
    isDragging,
    importFile,
    confirmImport,
    resetImport,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
