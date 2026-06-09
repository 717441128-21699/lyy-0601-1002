import React, { useState } from 'react';
import { Droplets, Sun, Moon, MonitorSmartphone, Download, Save } from 'lucide-react';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTheme } from '@/hooks/useTheme';
import { exportElementAsImage, exportProjectToJson } from '@/utils/exporters';
import type { ThemeType } from '@/types';
import { ModuleTabs } from './ModuleTabs';
import { Button } from './Button';
import { Modal } from './Modal';

export const Header: React.FC = () => {
  const { config, saveProject, pipes, valves, routes, hazards, photos, inspectors } = useInspectionStore();
  const { switchTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [exporting, setExporting] = useState(false);

  const themeOptions: { id: ThemeType; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: '深色主题', icon: <Moon size={18} /> },
    { id: 'light', label: '浅色主题', icon: <Sun size={18} /> },
    { id: 'tech', label: '科技蓝', icon: <MonitorSmartphone size={18} /> },
  ];

  const handleExportImage = async () => {
    setExporting(true);
    try {
      await exportElementAsImage('main-content', '智慧水务巡检看板', config);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveProject = () => {
    if (projectName.trim()) {
      saveProject(projectName.trim());
      setShowSaveModal(false);
      setProjectName('');
    }
  };

  const handleExportJson = () => {
    const project = {
      id: Date.now().toString(),
      name: projectName || '智慧水务巡检方案',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: { pipes, valves, routes, hazards, photos, inspectors },
      config,
    };
    exportProjectToJson(project);
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 px-6 py-4 border-b"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: 'var(--accent-primary)' }}
            >
              <Droplets size={24} style={{ color: 'var(--text-inverse)' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                智慧水务巡检看板
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Smart Water Inspection Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                icon={<MonitorSmartphone size={16} />}
                onClick={() => setShowThemeMenu(!showThemeMenu)}
              >
                主题
              </Button>
              {showThemeMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 glass-card py-2 z-50 animate-fade-in"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        switchTheme(theme.id);
                        setShowThemeMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-opacity-50 transition-colors text-left"
                      style={{
                        background: config.theme === theme.id ? 'var(--accent-primary)' : 'transparent',
                        color: config.theme === theme.id ? 'var(--text-inverse)' : 'var(--text-primary)',
                      }}
                    >
                      {theme.icon}
                      <span>{theme.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<Save size={16} />}
              onClick={() => setShowSaveModal(true)}
            >
              保存方案
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={<Download size={16} />}
              onClick={handleExportImage}
              disabled={exporting}
            >
              {exporting ? '导出中...' : '导出图片'}
            </Button>
          </div>
        </div>

        <ModuleTabs />
      </header>

      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="保存方案" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              方案名称
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="请输入方案名称"
              className="input-field"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleExportJson}>
              导出为JSON
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveProject}>
              保存到本地
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
