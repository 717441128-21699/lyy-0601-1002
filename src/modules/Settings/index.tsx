import React, { useState, useRef } from 'react';
import {
  Settings,
  Palette,
  Download,
  Save,
  Trash2,
  FolderOpen,
  Database,
  RefreshCw,
  Sun,
  Moon,
  Zap,
  Check,
  Upload,
  FileJson,
  Download as DownloadIcon,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTheme } from '@/hooks/useTheme';
import { themes } from '@/styles/themes';
import { exportElementAsImage, exportProjectToJson, importProjectFromJson } from '@/utils/exporters';
import type { ThemeType, SavedProject } from '@/types';

export const SettingsModule: React.FC = () => {
  const {
    config,
    setConfig,
    saveProject,
    savedProjects,
    loadProject,
    deleteProject,
    resetConfig,
    clearAllData,
    loadMockData,
    pipes,
    valves,
    routes,
    hazards,
    photos,
    inspectors,
  } = useInspectionStore();
  const { currentTheme, switchTheme, themeColors } = useTheme();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeList: { key: ThemeType; name: string; icon: React.ReactNode }[] = [
    { key: 'dark', name: '深色主题', icon: <Moon className="w-5 h-5" /> },
    { key: 'light', name: '浅色主题', icon: <Sun className="w-5 h-5" /> },
    { key: 'tech', name: '科技蓝', icon: <Zap className="w-5 h-5" /> },
  ];

  const legendItems = [
    { key: 'inspectedColor', label: '已巡检', desc: '已巡检管段颜色' },
    { key: 'uninspectedColor', label: '未巡检', desc: '未巡检管段颜色' },
    { key: 'minorColor', label: '轻微隐患', desc: '轻微隐患标记颜色' },
    { key: 'moderateColor', label: '一般隐患', desc: '一般隐患标记颜色' },
    { key: 'severeColor', label: '严重隐患', desc: '严重隐患标记颜色' },
    { key: 'criticalColor', label: '危急隐患', desc: '危急隐患标记颜色' },
  ] as const;

  const handleExportImage = async () => {
    setIsExporting(true);
    try {
      const filename = `智慧水务巡检汇报_${new Date().toISOString().split('T')[0]}`;
      await exportElementAsImage('main-content', filename, config);
    } catch (error) {
      console.error('导出图片失败:', error);
      alert('导出图片失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveProject = () => {
    if (!projectName.trim()) {
      alert('请输入方案名称');
      return;
    }
    saveProject(projectName.trim());
    setProjectName('');
    setShowSaveModal(false);
  };

  const handleImportProject = async (file: File) => {
    try {
      const project = await importProjectFromJson(file);
      const newProject: SavedProject = {
        ...project,
        id: project.id || `imported-${Date.now()}`,
        name: `${project.name} (导入)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      loadProject(newProject.id);
      alert('方案导入成功');
    } catch (error) {
      alert('导入失败：' + (error as Error).message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportProject(file);
      e.target.value = '';
    }
  };

  const handleExportProject = (project: SavedProject) => {
    exportProjectToJson(project);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-4 h-full overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              主题设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3">选择主题</label>
              <div className="grid grid-cols-3 gap-3">
                {themeList.map((theme) => (
                  <button
                    key={theme.key}
                    onClick={() => switchTheme(theme.key)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      currentTheme === theme.key
                        ? 'border-primary bg-primary/10'
                        : 'border-border-primary hover:border-primary/50'
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded-lg mb-2 overflow-hidden"
                      style={{ background: themes[theme.key].colors.background.gradient }}
                    />
                    <div className="flex items-center justify-center gap-2">
                      {theme.icon}
                      <span className="text-sm font-medium">{theme.name}</span>
                      {currentTheme === theme.key && <Check className="w-4 h-4 text-green-500" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              图例颜色设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {legendItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs opacity-60">{item.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.legend[item.key]}
                    onChange={(e) => {
                      setConfig({
                        legend: { ...config.legend, [item.key]: e.target.value } });
                    }}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <span className="text-xs font-mono opacity-60">
                    {config.legend[item.key]}
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-border-primary">
              <Button variant="ghost" size="sm" onClick={resetConfig}>
                <RefreshCw className="w-4 h-4" />
                恢复默认颜色
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              导出设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">导出格式</label>
                <select
                  value={config.exportFormat}
                  onChange={(e) =>
                    setConfig({ exportFormat: e.target.value as 'png' | 'jpeg' })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
                >
                  <option value="png">PNG (无损)</option>
                  <option value="jpeg">JPEG (压缩)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">导出质量</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={config.exportQuality}
                    onChange={(e) =>
                    setConfig({ exportQuality: parseInt(e.target.value) })
                  }
                  className="flex-1"
                  />
                  <span className="text-sm font-mono min-w-[40px]">{config.exportQuality}%</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-primary">
              <p className="text-sm font-medium mb-3">快速操作</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={handleExportImage}
                  disabled={isExporting}
                >
                  <DownloadIcon className="w-4 h-4" />
                  {isExporting ? '导出中...' : '导出汇报图片'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSaveModal(true)}
                >
                  <Save className="w-4 h-4" />
                  保存方案
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowLoadModal(true)}
                >
                  <FolderOpen className="w-4 h-4" />
                  加载方案
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  导入方案
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              数据管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-bg-secondary">
                <p className="text-xs opacity-60">管段数据</p>
                <p className="text-2xl font-bold mt-1">{pipes.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-secondary">
                <p className="text-xs opacity-60">阀门井</p>
                <p className="text-2xl font-bold mt-1">{valves.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-secondary">
                <p className="text-xs opacity-60">巡检路线</p>
                <p className="text-2xl font-bold mt-1">{routes.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-secondary">
                <p className="text-xs opacity-60">隐患记录</p>
                <p className="text-2xl font-bold mt-1">{hazards.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-secondary">
                <p className="text-xs opacity-60">照片数量</p>
                <p className="text-2xl font-bold mt-1">{photos.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-bg-secondary">
                <p className="text-xs opacity-60">巡检人员</p>
                <p className="text-2xl font-bold mt-1">{inspectors.length}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border-primary">
              <p className="text-sm font-medium mb-3">数据操作</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  onClick={loadMockData}
                >
                  <RefreshCw className="w-4 h-4" />
                  加载演示数据
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  清空所有数据
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            已保存的方案
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedProjects.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <Save className="w-12 h-12 mx-auto mb-3" />
              <p>暂无保存的方案</p>
              <p className="text-sm">点击上方"保存方案"按钮创建新方案</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg border border-border-primary hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-xs opacity-60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadProject(project.id)}
                        title="加载方案"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportProject(project)}
                        title="导出方案"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('确定要删除这个方案吗？')) {
                            deleteProject(project.id);
                          }
                        }}
                        title="删除方案"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs opacity-60">
                    <div>
                      <span className="block font-mono">{project.data.pipes.length}</span>
                      <span className="block text-[10px]">管段</span>
                    </div>
                    <div>
                      <span className="block font-mono">{project.data.hazards.length}</span>
                      <span className="block text-[10px]">隐患</span>
                    </div>
                    <div>
                      <span className="block font-mono">{project.data.photos.length}</span>
                      <span className="block text-[10px]">照片</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="保存方案"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">方案名称</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="请输入方案名称"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>
          <p className="text-sm opacity-60">
            将保存当前所有数据（管段、阀门井、巡检路线、隐患记录、照片等）和配置设置保存为一个方案，方便以后加载使用。
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowSaveModal(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSaveProject}>
            保存
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        title="加载方案"
        size="lg"
      >
        {savedProjects.length === 0 ? (
          <div className="text-center py-8 opacity-50">
            <FolderOpen className="w-12 h-12 mx-auto mb-3" />
            <p>暂无保存的方案</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {savedProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-lg border border-border-primary hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => {
                  loadProject(project.id);
                  setShowLoadModal(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-xs opacity-60">
                      更新于 {formatDate(project.updatedAt)}</p>
                  </div>
                  <div className="flex gap-4 text-xs opacity-60">
                    <span>{project.data.pipes.length} 管段</span>
                    <span>{project.data.hazards.length} 隐患</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowLoadModal(false)}>
            取消
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="确认清空数据"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-500">此操作不可恢复</p>
              <p className="text-sm opacity-80">
                将清空所有管段、阀门井、巡检路线、隐患记录、照片等数据，但不会删除已保存的方案。
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              clearAllData();
              setShowClearConfirm(false);
            }}
          >
            确认清空
          </Button>
        </div>
      </Modal>
    </div>
  );
};
