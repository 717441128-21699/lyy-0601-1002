export type PipeStatus = 'inspected' | 'uninspected';
export type ValveType = 'gate' | 'butterfly' | 'check';
export type ValveStatus = 'normal' | 'maintenance' | 'fault';
export type HazardType = 'leak' | 'blockage' | 'damage' | 'other';
export type HazardLevel = 'minor' | 'moderate' | 'severe' | 'critical';
export type HazardStatus = 'pending' | 'processing' | 'resolved';
export type PhotoCategory = 'site' | 'hazard' | 'equipment';
export type ThemeType = 'dark' | 'light' | 'tech';
export type ModuleType = 'import' | 'map' | 'route' | 'hazard' | 'photo' | 'statistics' | 'settings';

export interface PipeSegment {
  id: string;
  name: string;
  area: string;
  startPoint: [number, number];
  endPoint: [number, number];
  diameter: number;
  material: string;
  status: PipeStatus;
  inspectedAt?: string;
  inspector?: string;
}

export interface ValveWell {
  id: string;
  name: string;
  position: [number, number];
  type: ValveType;
  status: ValveStatus;
  lastInspection?: string;
}

export interface InspectionPoint {
  id: string;
  timestamp: string;
  position: [number, number];
  inspector: string;
  notes?: string;
  photos: string[];
}

export interface InspectionRoute {
  id: string;
  name: string;
  date: string;
  inspector: string;
  points: InspectionPoint[];
  distance: number;
  duration: number;
}

export interface Hazard {
  id: string;
  type: HazardType;
  level: HazardLevel;
  location: string;
  position: [number, number];
  description: string;
  reporter: string;
  reportedAt: string;
  status: HazardStatus;
  photos: string[];
  suggestion: string;
}

export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  takenAt: string;
  location: string;
  hazardId?: string;
  category: PhotoCategory;
  tags: string[];
}

export interface Inspector {
  id: string;
  name: string;
  avatar?: string;
  inspectionCount: number;
  totalDistance: number;
  hazardReported: number;
}

export interface Statistics {
  totalPipes: number;
  inspectedPipes: number;
  totalValves: number;
  totalHazards: number;
  resolvedHazards: number;
  inspectionCount: number;
  totalDistance: number;
  topInspectors: Inspector[];
  hazardByType: Record<string, number>;
  hazardByLevel: Record<string, number>;
  monthlyComparison: {
    currentMonth: { inspections: number; hazards: number; distance: number };
    lastMonth: { inspections: number; hazards: number; distance: number };
  };
  trendData: { date: string; inspections: number; hazards: number }[];
}

export interface AppConfig {
  theme: ThemeType;
  legend: {
    inspectedColor: string;
    uninspectedColor: string;
    minorColor: string;
    moderateColor: string;
    severeColor: string;
    criticalColor: string;
  };
  exportFormat: 'png' | 'jpeg';
  exportQuality: number;
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: {
    pipes: PipeSegment[];
    valves: ValveWell[];
    routes: InspectionRoute[];
    hazards: Hazard[];
    photos: Photo[];
    inspectors: Inspector[];
  };
  config: AppConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

export interface ImportProgress {
  stage: 'parsing' | 'validating' | 'saving' | 'complete';
  progress: number;
  total: number;
  message: string;
}
