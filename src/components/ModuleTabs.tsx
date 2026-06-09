import React from 'react';
import { Upload, Map, Route, AlertTriangle, Image, BarChart3, Settings } from 'lucide-react';
import { useInspectionStore } from '@/store/useInspectionStore';
import type { ModuleType } from '@/types';
import { cn } from '@/utils/cn';

const modules: { id: ModuleType; label: string; icon: React.ReactNode }[] = [
  { id: 'import', label: '数据导入', icon: <Upload size={18} /> },
  { id: 'map', label: '管网地图', icon: <Map size={18} /> },
  { id: 'route', label: '巡检路线', icon: <Route size={18} /> },
  { id: 'hazard', label: '隐患清单', icon: <AlertTriangle size={18} /> },
  { id: 'photo', label: '照片墙', icon: <Image size={18} /> },
  { id: 'statistics', label: '统计分析', icon: <BarChart3 size={18} /> },
  { id: 'settings', label: '参数设置', icon: <Settings size={18} /> },
];

export const ModuleTabs: React.FC = () => {
  const { currentModule, setCurrentModule, hazards } = useInspectionStore();
  const pendingHazards = hazards.filter(h => h.status === 'pending').length;

  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
      {modules.map((module) => (
        <button
          key={module.id}
          onClick={() => setCurrentModule(module.id)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
            currentModule === module.id
              ? 'shadow-lg'
              : 'hover:bg-opacity-50'
          )}
          style={{
            background: currentModule === module.id ? 'var(--accent-primary)' : 'transparent',
            color: currentModule === module.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
          }}
        >
          {module.icon}
          <span className="hidden md:inline">{module.label}</span>
          {module.id === 'hazard' && pendingHazards > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full animate-pulse-glow"
              style={{
                background: 'var(--accent-danger)',
                color: 'white',
              }}
            >
              {pendingHazards}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
