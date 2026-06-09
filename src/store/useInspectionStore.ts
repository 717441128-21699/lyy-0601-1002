import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { generateSuggestion } from '@/utils/suggestions';
import type {
  PipeSegment,
  ValveWell,
  InspectionRoute,
  Hazard,
  Photo,
  Inspector,
  AppConfig,
  SavedProject,
  ModuleType,
  HazardType,
  HazardLevel,
  HazardStatus,
} from '@/types';
import { storage } from '@/utils/storage';
import { mockPipes, mockValves, mockRoutes, mockHazards, mockPhotos, mockInspectors } from '@/mock/data';

const defaultConfig: AppConfig = {
  theme: 'dark',
  legend: {
    inspectedColor: '#30D158',
    uninspectedColor: '#6B7280',
    minorColor: '#FFD60A',
    moderateColor: '#FF9F0A',
    severeColor: '#FF453A',
    criticalColor: '#AF52DE',
  },
  exportFormat: 'png',
  exportQuality: 90,
};

interface InspectionState {
  currentModule: ModuleType;
  pipes: PipeSegment[];
  valves: ValveWell[];
  routes: InspectionRoute[];
  hazards: Hazard[];
  photos: Photo[];
  inspectors: Inspector[];
  config: AppConfig;
  savedProjects: SavedProject[];
  selectedArea: string;
  selectedRouteId: string | null;
  isPlaying: boolean;
  playbackSpeed: number;
  playbackProgress: number;
  isLoading: boolean;

  setCurrentModule: (module: ModuleType) => void;
  setSelectedArea: (area: string) => void;
  setSelectedRouteId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackProgress: (progress: number | ((prev: number) => number)) => void;
  setConfig: (config: Partial<AppConfig>) => void;

  loadData: () => void;
  loadMockData: () => void;
  saveData: () => void;

  addPipe: (pipe: Omit<PipeSegment, 'id'>) => void;
  updatePipe: (id: string, pipe: Partial<PipeSegment>) => void;
  deletePipe: (id: string) => void;

  addHazard: (hazard: Omit<Hazard, 'id' | 'suggestion' | 'reportedAt'>) => void;
  updateHazard: (id: string, hazard: Partial<Hazard>) => void;
  deleteHazard: (id: string) => void;
  updateHazardStatus: (id: string, status: HazardStatus) => void;

  addPhoto: (photo: Omit<Photo, 'id'>) => void;
  updatePhoto: (id: string, photo: Partial<Photo>) => void;
  deletePhoto: (id: string) => void;

  saveProject: (name: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;

  clearAllData: () => void;
  resetConfig: () => void;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  currentModule: 'map',
  pipes: [],
  valves: [],
  routes: [],
  hazards: [],
  photos: [],
  inspectors: [],
  config: defaultConfig,
  savedProjects: [],
  selectedArea: 'all',
  selectedRouteId: null,
  isPlaying: false,
  playbackSpeed: 1,
  playbackProgress: 0,
  isLoading: false,

  setCurrentModule: (module) => set({ currentModule: module }),
  setSelectedArea: (area) => set({ selectedArea: area }),
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setPlaybackProgress: (progress) =>
    set((state) => ({
      playbackProgress: typeof progress === 'function' ? progress(state.playbackProgress) : progress,
    })),
  setConfig: (newConfig) => {
    set((state) => {
      const config = { ...state.config, ...newConfig };
      storage.setConfig(config);
      return { config };
    });
  },

  loadData: () => {
    set({ isLoading: true });
    const pipes = storage.getPipes();
    const valves = storage.getValves();
    const routes = storage.getRoutes();
    const hazards = storage.getHazards();
    const photos = storage.getPhotos();
    const inspectors = storage.getInspectors();
    const config = storage.getConfig() || defaultConfig;
    const savedProjects = storage.getProjects();

    if (pipes.length === 0 && valves.length === 0) {
      get().loadMockData();
    } else {
      set({
        pipes,
        valves,
        routes,
        hazards,
        photos,
        inspectors,
        config,
        savedProjects,
        isLoading: false,
      });
    }
  },

  loadMockData: () => {
    set({
      pipes: mockPipes,
      valves: mockValves,
      routes: mockRoutes,
      hazards: mockHazards,
      photos: mockPhotos,
      inspectors: mockInspectors,
      isLoading: false,
    });
    get().saveData();
  },

  saveData: () => {
    const { pipes, valves, routes, hazards, photos, inspectors, config, savedProjects } = get();
    storage.setPipes(pipes);
    storage.setValves(valves);
    storage.setRoutes(routes);
    storage.setHazards(hazards);
    storage.setPhotos(photos);
    storage.setInspectors(inspectors);
    storage.setConfig(config);
    storage.setProjects(savedProjects);
  },

  addPipe: (pipe) => {
    const newPipe = { ...pipe, id: uuidv4() };
    set((state) => ({ pipes: [...state.pipes, newPipe] }));
    get().saveData();
  },

  updatePipe: (id, pipe) => {
    set((state) => ({
      pipes: state.pipes.map((p) => (p.id === id ? { ...p, ...pipe } : p)),
    }));
    get().saveData();
  },

  deletePipe: (id) => {
    set((state) => ({
      pipes: state.pipes.filter((p) => p.id !== id),
    }));
    get().saveData();
  },

  addHazard: (hazard) => {
    const suggestion = generateSuggestion(hazard.type, hazard.level, hazard.description);
    const newHazard = {
      ...hazard,
      id: uuidv4(),
      suggestion,
      reportedAt: new Date().toISOString(),
    };
    set((state) => ({ hazards: [...state.hazards, newHazard] }));
    get().saveData();
  },

  updateHazard: (id, hazard) => {
    set((state) => ({
      hazards: state.hazards.map((h) => (h.id === id ? { ...h, ...hazard } : h)),
    }));
    get().saveData();
  },

  deleteHazard: (id) => {
    set((state) => ({
      hazards: state.hazards.filter((h) => h.id !== id),
    }));
    get().saveData();
  },

  updateHazardStatus: (id, status) => {
    get().updateHazard(id, { status });
  },

  addPhoto: (photo) => {
    const newPhoto = { ...photo, id: uuidv4() };
    set((state) => ({ photos: [...state.photos, newPhoto] }));
    get().saveData();
  },

  updatePhoto: (id, photo) => {
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, ...photo } : p)),
    }));
    get().saveData();
  },

  deletePhoto: (id) => {
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
    }));
    get().saveData();
  },

  saveProject: (name) => {
    const { pipes, valves, routes, hazards, photos, inspectors, config, savedProjects } = get();
    const newProject: SavedProject = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: { pipes, valves, routes, hazards, photos, inspectors },
      config,
    };
    const updatedProjects = [...savedProjects, newProject];
    set({ savedProjects: updatedProjects });
    storage.setProjects(updatedProjects);
  },

  loadProject: (id) => {
    const project = get().savedProjects.find((p) => p.id === id);
    if (project) {
      set({
        pipes: project.data.pipes,
        valves: project.data.valves,
        routes: project.data.routes,
        hazards: project.data.hazards,
        photos: project.data.photos,
        inspectors: project.data.inspectors,
        config: project.config,
      });
      get().saveData();
    }
  },

  deleteProject: (id) => {
    const updatedProjects = get().savedProjects.filter((p) => p.id !== id);
    set({ savedProjects: updatedProjects });
    storage.setProjects(updatedProjects);
  },

  clearAllData: () => {
    storage.clearData();
    set({
      pipes: [],
      valves: [],
      routes: [],
      hazards: [],
      photos: [],
      inspectors: [],
    });
  },

  resetConfig: () => {
    set({ config: defaultConfig });
    storage.setConfig(defaultConfig);
  },
}));
