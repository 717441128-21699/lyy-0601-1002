import type { PipeSegment, ValveWell, InspectionRoute, Hazard, Photo, Inspector, AppConfig, SavedProject } from '@/types';

const STORAGE_KEYS = {
  PIPES: 'inspection_pipes',
  VALVES: 'inspection_valves',
  ROUTES: 'inspection_routes',
  HAZARDS: 'inspection_hazards',
  PHOTOS: 'inspection_photos',
  INSPECTORS: 'inspection_inspectors',
  CONFIG: 'inspection_config',
  PROJECTS: 'inspection_projects',
};

export const storage = {
  getPipes: (): PipeSegment[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PIPES);
    return data ? JSON.parse(data) : [];
  },

  setPipes: (pipes: PipeSegment[]) => {
    localStorage.setItem(STORAGE_KEYS.PIPES, JSON.stringify(pipes));
  },

  getValves: (): ValveWell[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VALVES);
    return data ? JSON.parse(data) : [];
  },

  setValves: (valves: ValveWell[]) => {
    localStorage.setItem(STORAGE_KEYS.VALVES, JSON.stringify(valves));
  },

  getRoutes: (): InspectionRoute[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ROUTES);
    return data ? JSON.parse(data) : [];
  },

  setRoutes: (routes: InspectionRoute[]) => {
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
  },

  getHazards: (): Hazard[] => {
    const data = localStorage.getItem(STORAGE_KEYS.HAZARDS);
    return data ? JSON.parse(data) : [];
  },

  setHazards: (hazards: Hazard[]) => {
    localStorage.setItem(STORAGE_KEYS.HAZARDS, JSON.stringify(hazards));
  },

  getPhotos: (): Photo[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    return data ? JSON.parse(data) : [];
  },

  setPhotos: (photos: Photo[]) => {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
  },

  getInspectors: (): Inspector[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INSPECTORS);
    return data ? JSON.parse(data) : [];
  },

  setInspectors: (inspectors: Inspector[]) => {
    localStorage.setItem(STORAGE_KEYS.INSPECTORS, JSON.stringify(inspectors));
  },

  getConfig: (): AppConfig | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? JSON.parse(data) : null;
  },

  setConfig: (config: AppConfig) => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },

  getProjects: (): SavedProject[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },

  setProjects: (projects: SavedProject[]) => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  saveProject: (project: SavedProject) => {
    const projects = storage.getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    storage.setProjects(projects);
  },

  deleteProject: (projectId: string) => {
    const projects = storage.getProjects().filter(p => p.id !== projectId);
    storage.setProjects(projects);
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  clearData: () => {
    localStorage.removeItem(STORAGE_KEYS.PIPES);
    localStorage.removeItem(STORAGE_KEYS.VALVES);
    localStorage.removeItem(STORAGE_KEYS.ROUTES);
    localStorage.removeItem(STORAGE_KEYS.HAZARDS);
    localStorage.removeItem(STORAGE_KEYS.PHOTOS);
    localStorage.removeItem(STORAGE_KEYS.INSPECTORS);
  },
};
