import type { ValidationResult, PipeSegment, ValveWell, Hazard } from '@/types';

export const validatePipeData = (data: unknown): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['数据格式无效'], warnings: [] };
  }

  const pipe = data as Partial<PipeSegment>;

  if (!pipe.name) {
    errors.push('缺少管段名称');
  }

  if (!pipe.area) {
    errors.push('缺少所属区域');
  }

  if (!pipe.startPoint || !Array.isArray(pipe.startPoint) || pipe.startPoint.length !== 2) {
    errors.push('起点坐标格式无效');
  } else {
    if (typeof pipe.startPoint[0] !== 'number' || typeof pipe.startPoint[1] !== 'number') {
      errors.push('起点坐标必须为数字');
    }
  }

  if (!pipe.endPoint || !Array.isArray(pipe.endPoint) || pipe.endPoint.length !== 2) {
    errors.push('终点坐标格式无效');
  } else {
    if (typeof pipe.endPoint[0] !== 'number' || typeof pipe.endPoint[1] !== 'number') {
      errors.push('终点坐标必须为数字');
    }
  }

  if (pipe.diameter !== undefined && (typeof pipe.diameter !== 'number' || pipe.diameter <= 0)) {
    errors.push('管径必须为正数');
  }

  if (pipe.status && !['inspected', 'uninspected'].includes(pipe.status)) {
    errors.push('状态值无效，应为 inspected 或 uninspected');
  }

  if (!pipe.material) {
    warnings.push('建议填写管材信息');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateValveData = (data: unknown): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['数据格式无效'], warnings: [] };
  }

  const valve = data as Partial<ValveWell>;

  if (!valve.id) {
    errors.push('缺少唯一标识ID');
  }

  if (!valve.name) {
    errors.push('缺少阀门井名称');
  }

  if (!valve.position || !Array.isArray(valve.position) || valve.position.length !== 2) {
    errors.push('位置坐标格式无效');
  } else {
    if (typeof valve.position[0] !== 'number' || typeof valve.position[1] !== 'number') {
      errors.push('位置坐标必须为数字');
    }
  }

  if (valve.type && !['gate', 'butterfly', 'check'].includes(valve.type)) {
    errors.push('阀门类型无效');
  }

  if (valve.status && !['normal', 'maintenance', 'fault'].includes(valve.status)) {
    errors.push('状态值无效');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateHazardData = (data: unknown): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['数据格式无效'], warnings: [] };
  }

  const hazard = data as Partial<Hazard>;

  if (!hazard.type || !['leak', 'blockage', 'damage', 'other'].includes(hazard.type)) {
    errors.push('隐患类型无效');
  }

  if (!hazard.level || !['minor', 'moderate', 'severe', 'critical'].includes(hazard.level)) {
    errors.push('隐患等级无效');
  }

  if (!hazard.location) {
    errors.push('缺少隐患位置');
  }

  if (!hazard.description) {
    errors.push('缺少隐患描述');
  }

  if (!hazard.reporter) {
    warnings.push('建议填写上报人');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateCsvRow = (row: Record<string, unknown>, requiredFields: string[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  requiredFields.forEach(field => {
    if (row[field] === undefined || row[field] === null || row[field] === '') {
      errors.push(`缺少必填字段: ${field}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateCoordinates = (x: unknown, y: unknown): ValidationResult => {
  const errors: string[] = [];

  if (typeof x !== 'number' || isNaN(x)) {
    errors.push('X坐标必须为有效数字');
  }

  if (typeof y !== 'number' || isNaN(y)) {
    errors.push('Y坐标必须为有效数字');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
};
