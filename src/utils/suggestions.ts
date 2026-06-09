import type { HazardType, HazardLevel, Hazard, Photo } from '@/types';

const suggestionTemplates: Record<HazardType, Record<HazardLevel, string>> = {
  leak: {
    minor: '轻微渗漏，建议使用密封胶进行临时处理，加强日常巡检关注，在下次计划维修时安排彻底修复。预计处理时间1-2小时。',
    moderate: '一般渗漏，建议安排维修人员进行接口密封处理，检查密封圈老化情况，必要时更换。预计维修时间2-3小时，可能需要短时降压。',
    severe: '严重渗漏，建议立即安排维修队伍进行处理，关闭相关管段阀门，设置警示标志，更换受损管道或接口。预计维修时间4-6小时。',
    critical: '危急渗漏！建议立即启动应急预案，关闭上下游阀门，疏散周边人员，组织紧急抢修队伍，准备好应急排水设备。预计维修时间8小时以上。',
  },
  blockage: {
    minor: '轻微堵塞，建议使用高压水枪进行冲洗，检查滤网是否有杂物，定期进行预防性清理。预计处理时间30分钟。',
    moderate: '一般堵塞，建议使用高压水枪进行管道冲洗，如无法疏通则考虑使用管道疏通机器人检查，必要时开挖清理。预计处理时间2-3小时。',
    severe: '严重堵塞，建议立即安排专业疏通队伍，先尝试高压水和化学药剂联合处理，如无效则需要局部开挖更换管道。预计处理时间4-6小时。',
    critical: '危急堵塞！建议立即关闭上游阀门，防止污水溢出，启动应急排水预案，组织紧急疏通或管道更换。预计处理时间6-8小时。',
  },
  damage: {
    minor: '轻微破损，建议进行表面修复处理，加强监控，记录破损位置和程度，在下次大修时安排更换。预计处理时间1小时。',
    moderate: '一般破损，建议安排维修人员进行补强处理，检查破损原因（腐蚀、外力等），采取针对性防护措施。预计维修时间3-4小时。',
    severe: '严重破损，建议立即关闭相关阀门，设置警示标志，组织维修队伍进行管道更换或补强。预计维修时间6-8小时。',
    critical: '危急破损！建议立即启动应急预案，关闭上下游阀门，疏散周边人员，设置安全防护，组织紧急抢修更换管道。预计维修时间8小时以上。',
  },
  other: {
    minor: '轻微问题，建议记录在案，加强日常巡检关注，在合适时机安排处理。预计处理时间30分钟-1小时。',
    moderate: '一般问题，建议安排相关人员进行处理，制定处理方案，尽快消除隐患。预计处理时间1-2小时。',
    severe: '严重问题，建议优先安排处理，组织专业人员评估风险，制定详细处理方案。预计处理时间3-5小时。',
    critical: '危急问题！建议立即采取紧急措施，防止事态扩大，组织专项处理小组，制定应急方案。预计处理时间根据具体情况确定。',
  },
};

export const generateSuggestion = (type: HazardType, level: HazardLevel, description?: string): string => {
  const baseSuggestion = suggestionTemplates[type]?.[level] || suggestionTemplates.other.moderate;

  if (description) {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('井盖') || lowerDesc.includes('井盖')) {
      return `井盖相关问题：${baseSuggestion} 特别注意：更换井盖时应设置明显警示标志和临时防护，确保行人和车辆安全。`;
    }
    if (lowerDesc.includes('阀门')) {
      return `阀门相关问题：${baseSuggestion} 特别注意：处理阀门问题前应确认阀门状态，准备好备用阀门和密封件，防止处理过程中出现漏水。`;
    }
    if (lowerDesc.includes('腐蚀') || lowerDesc.includes('锈蚀')) {
      return `腐蚀相关问题：${baseSuggestion} 特别注意：应检查腐蚀原因，采取防腐措施，评估管道剩余使用寿命，制定中长期更换计划。`;
    }
  }

  return baseSuggestion;
};

export const getHazardTypeLabel = (type: HazardType): string => {
  const labels: Record<HazardType, string> = {
    leak: '渗漏',
    blockage: '堵塞',
    damage: '破损',
    other: '其他',
  };
  return labels[type] || '其他';
};

export const getHazardLevelLabel = (level: HazardLevel): string => {
  const labels: Record<HazardLevel, string> = {
    minor: '轻微',
    moderate: '一般',
    severe: '严重',
    critical: '危急',
  };
  return labels[level] || '一般';
};

export const getHazardStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
  };
  return labels[status] || '待处理';
};

export const getValveTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    gate: '闸阀',
    butterfly: '蝶阀',
    check: '止回阀',
  };
  return labels[type] || type;
};

export const getValveStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    normal: '正常',
    maintenance: '维护中',
    fault: '故障',
  };
  return labels[status] || status;
};

export const isPhotoLinkedToHazard = (photo: Photo, hazards: Hazard[]): boolean => {
  if (photo.hazardId) {
    return hazards.some(h => h.id === photo.hazardId);
  }
  return hazards.some(h => h.photos.includes(photo.id));
};

export const getPhotoLinkedHazard = (photo: Photo, hazards: Hazard[]): Hazard | undefined => {
  if (photo.hazardId) {
    return hazards.find(h => h.id === photo.hazardId);
  }
  return hazards.find(h => h.photos.includes(photo.id));
};

export const getHazardPhotoIds = (hazards: Hazard[]): Set<string> => {
  const photoIds = new Set<string>();
  hazards.forEach(h => {
    h.photos.forEach(id => photoIds.add(id));
  });
  hazards.forEach(h => {
    if (h.id) {
      // 也检查通过hazardId关联的照片
    }
  });
  return photoIds;
};

export const filterPhotosByHazardFilters = (
  photos: Photo[],
  hazards: Hazard[],
  filters: {
    area?: string | 'all';
    hazardLevel?: HazardLevel | 'all';
    reporter?: string | 'all';
    photoAssociation?: 'all' | 'linked' | 'none';
  }
): Photo[] => {
  const filteredHazards = hazards.filter(h => {
    const matchArea = !filters.area || filters.area === 'all' || h.location.includes(filters.area);
    const matchLevel = !filters.hazardLevel || filters.hazardLevel === 'all' || h.level === filters.hazardLevel;
    const matchReporter = !filters.reporter || filters.reporter === 'all' || h.reporter === filters.reporter;
    return matchArea && matchLevel && matchReporter;
  });

  const filteredHazardPhotoIds = getHazardPhotoIds(filteredHazards);

  return photos.filter(p => {
    const matchArea = !filters.area || filters.area === 'all' || p.location === filters.area;
    const isLinked = isPhotoLinkedToHazard(p, filteredHazards) || filteredHazardPhotoIds.has(p.id);
    
    const matchAssociation = filters.photoAssociation === 'all'
      ? true
      : filters.photoAssociation === 'linked'
        ? isLinked
        : !isLinked;
    
    return matchArea && matchAssociation;
  });
};
