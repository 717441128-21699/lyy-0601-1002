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
  History,
  RotateCcw,
  Filter,
  GitCompare,
  X,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTheme } from '@/hooks/useTheme';
import { themes } from '@/styles/themes';
import { exportElementAsImage, exportProjectToJson, importProjectFromJson } from '@/utils/exporters';
import { getHazardLevelLabel } from '@/utils/suggestions';
import type { ThemeType, SavedProject } from '@/types';

export const SettingsModule: React.FC = () => {
  const {
    config,
    setConfig,
    saveProject,
    savedProjects,
    loadProject,
    importAndLoadProject,
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
    importHistory,
    loadFromImportHistory,
    clearImportHistory,
  } = useInspectionStore();

  const { themeColors, currentTheme, switchTheme } = useTheme();

  const [projectName, setProjectName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const [compareSelection, setCompareSelection] = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareResult, setCompareResult] = useState<null | {
    item1: typeof importHistory[0];
    item2: typeof importHistory[0];
    differences: {
      pipes: { item1: number; item2: number; diff: number };
      hazards: { item1: number; item2: number; diff: number };
      photos: { item1: number; item2: number; diff: number };
      routes: { item1: number; item2: number; diff: number };
      distance: { item1: number; item2: number; diff: number };
      addedHazards: typeof hazards;
      removedHazards: typeof hazards;
    };
  }>(null);

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
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      importAndLoadProject(newProject);
      alert('方案导入成功！数据已加载，刷新后仍然保留。');
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

  const handleCompareSelection = (id: string) => {
    const newSelection = new Set(compareSelection);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else if (newSelection.size < 2) {
      newSelection.add(id);
    } else {
      alert('最多只能选择两个历史包进行对比');
      return;
    }
    setCompareSelection(newSelection);
  };

  const handleCompare = () => {
    if (compareSelection.size !== 2) {
      alert('请选择两个历史包进行对比');
      return;
    }
    const ids = Array.from(compareSelection);
    const item1 = importHistory.find(h => h.id === ids[0])!;
    const item2 = importHistory.find(h => h.id === ids[1])!;

    const data1 = item1.project.data;
    const data2 = item2.project.data;

    const hazardIds1 = new Set(data1.hazards?.map(h => h.id) || []);
    const hazardIds2 = new Set(data2.hazards?.map(h => h.id) || []);

    const addedHazards = (data2.hazards || []).filter(h => !hazardIds1.has(h.id));
    const removedHazards = (data1.hazards || []).filter(h => !hazardIds2.has(h.id));

    const distance1 = (data1.routes || []).reduce((sum, r) => sum + (r.distance || 0), 0);
    const distance2 = (data2.routes || []).reduce((sum, r) => sum + (r.distance || 0), 0);

    setCompareResult({
      item1,
      item2,
      differences: {
        pipes: {
          item1: data1.pipes?.length || 0,
          item2: data2.pipes?.length || 0,
          diff: (data2.pipes?.length || 0) - (data1.pipes?.length || 0),
        },
        hazards: {
          item1: data1.hazards?.length || 0,
          item2: data2.hazards?.length || 0,
          diff: (data2.hazards?.length || 0) - (data1.hazards?.length || 0),
        },
        photos: {
          item1: data1.photos?.length || 0,
          item2: data2.photos?.length || 0,
          diff: (data2.photos?.length || 0) - (data1.photos?.length || 0),
        },
        routes: {
          item1: data1.routes?.length || 0,
          item2: data2.routes?.length || 0,
          diff: (data2.routes?.length || 0) - (data1.routes?.length || 0),
        },
        distance: {
          item1: distance1,
          item2: distance2,
          diff: distance2 - distance1,
        },
        addedHazards,
        removedHazards,
      },
    });

    setShowCompareModal(true);
  };

  const clearCompareSelection = () => {
    setCompareSelection(new Set());
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" />
              最近导入记录
            </div>
            <div className="flex items-center gap-2">
              {compareSelection.size === 2 && (
                <Button variant="primary" size="sm" onClick={handleCompare}>
                <GitCompare className="w-4 h-4" />
                对比选中
              </Button>
            )}
              {compareSelection.size > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCompareSelection}>
                  <X className="w-4 h-4" />
                  取消选择 ({compareSelection.size}/2)
                </Button>
              )}
              {importHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearImportHistory}>
                  <Trash2 className="w-4 h-4" />
                  清空历史
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-50">
              <History className="w-12 h-12 mb-3" />
              <p>暂无导入记录</p>
              <p className="text-sm mt-1">导入汇报包后会在这里显示，方便快速回滚</p>
            </div>
          ) : (
            <div className="space-y-2">
              {importHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-bg-secondary transition-colors border-2 ${
                    compareSelection.has(item.id) ? 'border-primary' : 'border-border-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={compareSelection.has(item.id)}
                      onChange={() => handleCompareSelection(item.id)}
                      className="w-5 h-5 rounded border-border-primary text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-primary" />
                      <span className="font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm opacity-60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.importedAt).toLocaleString('zh-CN')}
                      </span>
                      {item.project.exportFilters && (
                        <span className="flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          筛选: {item.project.exportFilters.area === 'all' ? '全部区域' : item.project.exportFilters.area}
                          {item.project.exportFilters.hazardLevel !== 'all' && ` · ${item.project.exportFilters.hazardLevel}`}
                          {item.project.exportFilters.reporter !== 'all' && ` · ${item.project.exportFilters.reporter}`}
                        </span>
                      )}
                      {item.project.data && (
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {item.project.data.hazards?.length || 0}个隐患 · {item.project.data.pipes?.length || 0}条管段 · {item.project.data.photos?.length || 0}张照片
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => loadFromImportHistory(item.id)}
                  >
                    <RotateCcw className="w-4 h-4" />
                    回滚到此版本
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

      <Modal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        title="片区对比分析"
        size="xl"
      >
        {compareResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6 p-4 rounded-xl bg-bg-secondary">
              <div className="text-center flex-1">
                <p className="font-medium text-lg">{compareResult.item1.name}</p>
                <p className="text-sm opacity-60">{new Date(compareResult.item1.importedAt).toLocaleDateString('zh-CN')}</p>
              </div>
              <div className="text-2xl font-bold opacity-50">VS</div>
              <div className="text-center flex-1">
                <p className="font-medium text-lg">{compareResult.item2.name}</p>
                <p className="text-sm opacity-60">{new Date(compareResult.item2.importedAt).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="p-4 rounded-xl bg-bg-secondary text-center">
                <p className="text-sm opacity-60 mb-2">管段数</p>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <span>{compareResult.differences.pipes.item1}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                  <span>{compareResult.differences.pipes.item2}</span>
                </div>
                <p className={`text-sm mt-1 ${compareResult.differences.pipes.diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {compareResult.differences.pipes.diff >= 0 ? (
                    <><Plus className="w-3 h-3 inline" /> {compareResult.differences.pipes.diff}</>
                  ) : (
                    <><Minus className="w-3 h-3 inline" /> {Math.abs(compareResult.differences.pipes.diff)}</>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-bg-secondary text-center">
                <p className="text-sm opacity-60 mb-2">隐患数</p>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <span>{compareResult.differences.hazards.item1}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                  <span>{compareResult.differences.hazards.item2}</span>
                </div>
                <p className={`text-sm mt-1 ${compareResult.differences.hazards.diff >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {compareResult.differences.hazards.diff >= 0 ? (
                    <><Plus className="w-3 h-3 inline" /> {compareResult.differences.hazards.diff}</>
                  ) : (
                    <><Minus className="w-3 h-3 inline" /> {Math.abs(compareResult.differences.hazards.diff)}</>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-bg-secondary text-center">
                <p className="text-sm opacity-60 mb-2">照片数</p>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <span>{compareResult.differences.photos.item1}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                  <span>{compareResult.differences.photos.item2}</span>
                </div>
                <p className={`text-sm mt-1 ${compareResult.differences.photos.diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {compareResult.differences.photos.diff >= 0 ? (
                    <><Plus className="w-3 h-3 inline" /> {compareResult.differences.photos.diff}</>
                  ) : (
                    <><Minus className="w-3 h-3 inline" /> {Math.abs(compareResult.differences.photos.diff)}</>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-bg-secondary text-center">
                <p className="text-sm opacity-60 mb-2">路线数</p>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <span>{compareResult.differences.routes.item1}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                  <span>{compareResult.differences.routes.item2}</span>
                </div>
                <p className={`text-sm mt-1 ${compareResult.differences.routes.diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {compareResult.differences.routes.diff >= 0 ? (
                    <><Plus className="w-3 h-3 inline" /> {compareResult.differences.routes.diff}</>
                  ) : (
                    <><Minus className="w-3 h-3 inline" /> {Math.abs(compareResult.differences.routes.diff)}</>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-bg-secondary text-center">
                <p className="text-sm opacity-60 mb-2">总里程</p>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <span>{compareResult.differences.distance.item1.toFixed(1)}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                  <span>{compareResult.differences.distance.item2.toFixed(1)}</span>
                </div>
                <p className={`text-sm mt-1 ${compareResult.differences.distance.diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {compareResult.differences.distance.diff >= 0 ? (
                    <><Plus className="w-3 h-3 inline" /> {compareResult.differences.distance.diff.toFixed(1)} km</>
                  ) : (
                    <><Minus className="w-3 h-3 inline" /> {Math.abs(compareResult.differences.distance.diff).toFixed(1)} km</>
                  )}
                </p>
              </div>
            </div>

            {compareResult.differences.addedHazards.length > 0 && (
              <div className="p-4 rounded-xl bg-bg-secondary">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-green-500">
                  <Plus className="w-5 h-5" />
                  新增隐患 ({compareResult.differences.addedHazards.length}处)
                </h3>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {compareResult.differences.addedHazards.map((hazard) => (
                    <div key={hazard.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-primary border border-border-primary">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: config.legend[`${hazard.level}Color` as keyof typeof config.legend] }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{hazard.location}</p>
                          <p className="text-sm opacity-60 truncate">{hazard.description}</p>
                        </div>
                      </div>
                      <span
                        className="text-sm px-2 py-1 rounded-lg font-medium flex-shrink-0 ml-2"
                        style={{
                          backgroundColor: `${config.legend[`${hazard.level}Color` as keyof typeof config.legend]}20`,
                          color: config.legend[`${hazard.level}Color` as keyof typeof config.legend],
                        }}
                      >
                        {getHazardLevelLabel(hazard.level)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {compareResult.differences.removedHazards.length > 0 && (
              <div className="p-4 rounded-xl bg-bg-secondary">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-red-500">
                  <Minus className="w-5 h-5" />
                  减少/已解决隐患 ({compareResult.differences.removedHazards.length}处)
                </h3>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {compareResult.differences.removedHazards.map((hazard) => (
                    <div key={hazard.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-primary border border-border-primary opacity-70">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: config.legend[`${hazard.level}Color` as keyof typeof config.legend] }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{hazard.location}</p>
                          <p className="text-sm opacity-60 truncate">{hazard.description}</p>
                        </div>
                      </div>
                      <span
                        className="text-sm px-2 py-1 rounded-lg font-medium flex-shrink-0 ml-2"
                        style={{
                          backgroundColor: `${config.legend[`${hazard.level}Color` as keyof typeof config.legend]}20`,
                          color: config.legend[`${hazard.level}Color` as keyof typeof config.legend],
                        }}
                      >
                        {getHazardLevelLabel(hazard.level)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {compareResult.differences.addedHazards.length === 0 && compareResult.differences.removedHazards.length === 0 && (
              <div className="p-8 rounded-xl bg-bg-secondary text-center opacity-50">
                <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>两个片区的隐患完全一致</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border-primary">
          <Button variant="ghost" onClick={() => setShowCompareModal(false)}>
            关闭
          </Button>
        </div>
      </Modal>
    </div>
  );
};
