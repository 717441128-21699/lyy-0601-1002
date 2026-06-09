import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, RefreshCw, Download, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { useFileImport } from '@/hooks/useFileImport';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';
import { mockAreas, mockMaterials, mockInspectorNames } from '@/mock/data';
import { useInspectionStore } from '@/store/useInspectionStore';
import { v4 as uuidv4 } from 'uuid';
import type { PipeSegment, HazardType, HazardLevel } from '@/types';
import { generateSuggestion } from '@/utils/suggestions';

export const DataImportModule: React.FC = () => {
  const [dataType, setDataType] = useState<'pipes' | 'hazards'>('pipes');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const { themeColors } = useTheme();
  const { addPipe, addHazard } = useInspectionStore();

  const {
    progress,
    validationResults,
    previewData,
    isDragging,
    importFile,
    confirmImport,
    resetImport,
    handleDragOver,
    handleDragLeave,
  } = useFileImport();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedData, setImportedData] = useState<Record<string, unknown>[]>([]);

  const processFile = async (file: File) => {
    try {
      const result = await importFile(file, dataType);
      if (result) {
        setImportedData(result.validItems as Record<string, unknown>[]);
      }
    } catch (error) {
      console.error('导入失败:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (importedData.length === 0) {
      alert('没有可导入的有效数据');
      return;
    }
    confirmImport(importedData, dataType);
    alert(`成功导入 ${importedData.length} 条${dataType === 'pipes' ? '管段' : '隐患'}数据！请切换到${dataType === 'pipes' ? '管网地图' : '隐患清单'}或统计分析查看。`);
  };

  const stageLabels: Record<string, string> = {
    parsing: '解析中',
    validating: '校验中',
    saving: '保存中',
    complete: '完成',
  };

  const [manualPipe, setManualPipe] = useState<Partial<PipeSegment>>({
    name: '',
    area: mockAreas[0],
    startPoint: [0, 0],
    endPoint: [0, 0],
    diameter: 300,
    material: mockMaterials[0],
    status: 'uninspected',
  });

  const [manualHazard, setManualHazard] = useState({
    type: 'leak' as HazardType,
    level: 'moderate' as HazardLevel,
    location: '',
    position: [0, 0] as [number, number],
    description: '',
    reporter: mockInspectorNames[0],
  });

  const handleAddPipe = () => {
    if (manualPipe.name && manualPipe.area) {
      addPipe({
        name: manualPipe.name,
        area: manualPipe.area,
        startPoint: manualPipe.startPoint as [number, number],
        endPoint: manualPipe.endPoint as [number, number],
        diameter: manualPipe.diameter || 300,
        material: manualPipe.material || '',
        status: manualPipe.status || 'uninspected',
      });
      setManualPipe({
        name: '',
        area: mockAreas[0],
        startPoint: [0, 0],
        endPoint: [0, 0],
        diameter: 300,
        material: mockMaterials[0],
        status: 'uninspected',
      });
      setShowManualAdd(false);
    }
  };

  const handleAddHazard = () => {
    if (manualHazard.location && manualHazard.description) {
      addHazard({
        type: manualHazard.type,
        level: manualHazard.level,
        location: manualHazard.location,
        position: manualHazard.position,
        description: manualHazard.description,
        reporter: manualHazard.reporter,
        status: 'pending',
        photos: [],
      });
      setManualHazard({
        type: 'leak',
        level: 'moderate',
        location: '',
        position: [0, 0],
        description: '',
        reporter: mockInspectorNames[0],
      });
      setShowManualAdd(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle icon={<FileText size={20} />}>数据导入</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-primary)' }}>
              <button
                onClick={() => { setDataType('pipes'); resetImport(); }}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: dataType === 'pipes' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: dataType === 'pipes' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}
              >
                管段数据
              </button>
              <button
                onClick={() => { setDataType('hazards'); resetImport(); }}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: dataType === 'hazards' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: dataType === 'hazards' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}
              >
                隐患数据
              </button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowManualAdd(!showManualAdd)}
            >
              手动添加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showManualAdd && (
            <div className="mb-6 p-4 rounded-xl animate-fade-in" style={{ background: 'var(--bg-tertiary)' }}>
              <h4 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                手动添加{dataType === 'pipes' ? '管段' : '隐患'}
              </h4>
              {dataType === 'pipes' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>管段名称</label>
                    <input
                      type="text"
                      value={manualPipe.name}
                      onChange={(e) => setManualPipe({ ...manualPipe, name: e.target.value })}
                      className="input-field"
                      placeholder="如：管段A-004"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>所属区域</label>
                    <select
                      value={manualPipe.area}
                      onChange={(e) => setManualPipe({ ...manualPipe, area: e.target.value })}
                      className="input-field"
                    >
                      {mockAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>管材</label>
                    <select
                      value={manualPipe.material}
                      onChange={(e) => setManualPipe({ ...manualPipe, material: e.target.value })}
                      className="input-field"
                    >
                      {mockMaterials.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>起点X坐标</label>
                    <input
                      type="number"
                      value={manualPipe.startPoint?.[0]}
                      onChange={(e) => setManualPipe({ ...manualPipe, startPoint: [Number(e.target.value), manualPipe.startPoint?.[1] || 0] })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>起点Y坐标</label>
                    <input
                      type="number"
                      value={manualPipe.startPoint?.[1]}
                      onChange={(e) => setManualPipe({ ...manualPipe, startPoint: [manualPipe.startPoint?.[0] || 0, Number(e.target.value)] })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>终点X坐标</label>
                    <input
                      type="number"
                      value={manualPipe.endPoint?.[0]}
                      onChange={(e) => setManualPipe({ ...manualPipe, endPoint: [Number(e.target.value), manualPipe.endPoint?.[1] || 0] })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>终点Y坐标</label>
                    <input
                      type="number"
                      value={manualPipe.endPoint?.[1]}
                      onChange={(e) => setManualPipe({ ...manualPipe, endPoint: [manualPipe.endPoint?.[0] || 0, Number(e.target.value)] })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>管径(mm)</label>
                    <input
                      type="number"
                      value={manualPipe.diameter}
                      onChange={(e) => setManualPipe({ ...manualPipe, diameter: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>巡检状态</label>
                    <select
                      value={manualPipe.status}
                      onChange={(e) => setManualPipe({ ...manualPipe, status: e.target.value as 'inspected' | 'uninspected' })}
                      className="input-field"
                    >
                      <option value="uninspected">未巡检</option>
                      <option value="inspected">已巡检</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>隐患类型</label>
                    <select
                      value={manualHazard.type}
                      onChange={(e) => setManualHazard({ ...manualHazard, type: e.target.value as HazardType })}
                      className="input-field"
                    >
                      <option value="leak">渗漏</option>
                      <option value="blockage">堵塞</option>
                      <option value="damage">破损</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>隐患等级</label>
                    <select
                      value={manualHazard.level}
                      onChange={(e) => setManualHazard({ ...manualHazard, level: e.target.value as HazardLevel })}
                      className="input-field"
                    >
                      <option value="minor">轻微</option>
                      <option value="moderate">一般</option>
                      <option value="severe">严重</option>
                      <option value="critical">危急</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>上报人</label>
                    <select
                      value={manualHazard.reporter}
                      onChange={(e) => setManualHazard({ ...manualHazard, reporter: e.target.value })}
                      className="input-field"
                    >
                      {mockInspectorNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>位置描述</label>
                    <input
                      type="text"
                      value={manualHazard.location}
                      onChange={(e) => setManualHazard({ ...manualHazard, location: e.target.value })}
                      className="input-field"
                      placeholder="如：东城区管段A-004"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>隐患描述</label>
                    <textarea
                      value={manualHazard.description}
                      onChange={(e) => setManualHazard({ ...manualHazard, description: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="请详细描述隐患情况..."
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="secondary" size="sm" onClick={() => setShowManualAdd(false)}>
                  取消
                </Button>
                <Button variant="primary" size="sm" onClick={dataType === 'pipes' ? handleAddPipe : handleAddHazard}>
                  添加
                </Button>
              </div>
            </div>
          )}

          {!progress ? (
            <div
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer',
                isDragging ? 'border-cyan-400 bg-cyan-400/10' : ''
              )}
              style={{
                borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border-secondary)',
                background: isDragging ? 'rgba(0, 180, 216, 0.1)' : 'var(--bg-tertiary)',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0, 180, 216, 0.2)' }}
              >
                <Upload size={32} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                拖拽文件到此处或点击上传
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                支持 CSV、JSON 格式文件
              </p>
              <div className="flex items-center justify-center gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <span className="flex items-center gap-1">
                  <FileText size={14} /> .csv
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={14} /> .json
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {progress.stage === 'complete' ? (
                    <CheckCircle size={24} style={{ color: 'var(--accent-success)' }} />
                  ) : progress.stage === 'saving' ? (
                    <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-primary)' }} />
                  )}
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {stageLabels[progress.stage]}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {progress.message}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                  {Math.round(progress.progress)}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress.progress}%`,
                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                  }}
                />
              </div>

              {validationResults && (
                <div className="space-y-3">
                  {validationResults.errors.length > 0 && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 59, 48, 0.1)' }}>
                      <div className="flex items-start gap-3">
                        <XCircle size={20} style={{ color: 'var(--accent-danger)' }} className="mt-0.5" />
                        <div>
                          <p className="font-medium mb-2" style={{ color: 'var(--accent-danger)' }}>
                            发现 {validationResults.errors.length} 个错误
                          </p>
                          <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                            {validationResults.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                            {validationResults.errors.length > 5 && (
                              <li>... 还有 {validationResults.errors.length - 5} 个错误</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {validationResults.warnings.length > 0 && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 214, 10, 0.1)' }}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} style={{ color: 'var(--accent-warning)' }} className="mt-0.5" />
                        <div>
                          <p className="font-medium mb-2" style={{ color: 'var(--accent-warning)' }}>
                            发现 {validationResults.warnings.length} 个警告
                          </p>
                          <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                            {validationResults.warnings.slice(0, 3).map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                            {validationResults.warnings.length > 3 && (
                              <li>... 还有 {validationResults.warnings.length - 3} 个警告</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {previewData.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                    数据预览（前10条）
                  </h4>
                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-primary)' }}>
                    <table className="w-full text-sm">
                      <thead style={{ background: 'var(--bg-tertiary)' }}>
                        <tr>
                          {Object.keys(previewData[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                            {Object.values(row).map((value, colIndex) => (
                              <td key={colIndex} className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {progress.stage === 'complete' && validationResults?.valid === false && validationResults.errors.length === 0 && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(48, 209, 88, 0.1)' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} style={{ color: 'var(--accent-success)' }} />
                    <p style={{ color: 'var(--accent-success)' }}>数据校验通过，可以导入</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="secondary" size="sm" icon={<RefreshCw size={16} />} onClick={resetImport}>
                  重新导入
                </Button>
                {progress.stage === 'complete' && validationResults?.errors.length === 0 && (
                  <Button variant="primary" size="sm" icon={<Download size={16} />} onClick={handleConfirmImport}>
                    确认导入
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
