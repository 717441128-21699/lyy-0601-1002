import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Map, Filter, ZoomIn, ZoomOut, Maximize2, Info, CircleDot, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTheme } from '@/hooks/useTheme';
import { mockAreas } from '@/mock/data';
import { getValveTypeLabel, getValveStatusLabel } from '@/utils/suggestions';
import type { PipeSegment, ValveWell, Hazard } from '@/types';
import { Modal } from '@/components/Modal';

interface MapViewport {
  x: number;
  y: number;
  scale: number;
}

export const PipeNetworkMapModule: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pipes, valves, hazards, selectedArea, setSelectedArea, config, updatePipe } = useInspectionStore();
  const { themeColors } = useTheme();
  const [viewport, setViewport] = useState<MapViewport>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedPipe, setSelectedPipe] = useState<PipeSegment | null>(null);
  const [selectedValve, setSelectedValve] = useState<ValveWell | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const filteredPipes = selectedArea === 'all'
    ? pipes
    : pipes.filter(p => p.area === selectedArea);

  const filteredValves = selectedArea === 'all'
    ? valves
    : valves.filter(v => {
        const nearbyPipe = pipes.find(p =>
          (p.startPoint[0] === v.position[0] && p.startPoint[1] === v.position[1]) ||
          (p.endPoint[0] === v.position[0] && p.endPoint[1] === v.position[1])
        );
        return nearbyPipe?.area === selectedArea;
      });

  const getHazardAtPosition = useCallback((x: number, y: number): Hazard | undefined => {
    return hazards.find(h =>
      Math.abs(h.position[0] - x) < 15 &&
      Math.abs(h.position[1] - y) < 15
    );
  }, [hazards]);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    ctx.strokeStyle = 'var(--border-primary)';
    ctx.lineWidth = 0.5 / viewport.scale;
    ctx.globalAlpha = 0.3;
    for (let x = 0; x < 900; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 700);
      ctx.stroke();
    }
    for (let y = 0; y < 700; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(900, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    filteredPipes.forEach(pipe => {
      const [x1, y1] = pipe.startPoint;
      const [x2, y2] = pipe.endPoint;

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      if (pipe.status === 'inspected') {
        gradient.addColorStop(0, config.legend.inspectedColor);
        gradient.addColorStop(1, config.legend.inspectedColor + '99');
      } else {
        gradient.addColorStop(0, config.legend.uninspectedColor);
        gradient.addColorStop(1, config.legend.uninspectedColor + '99');
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = pipe.status === 'inspected' ? config.legend.inspectedColor : config.legend.uninspectedColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (selectedPipe?.id === pipe.id) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'var(--accent-primary)';
        ctx.lineWidth = 10;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    filteredValves.forEach(valve => {
      const [x, y] = valve.position;

      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--bg-secondary)';
      ctx.fill();
      ctx.strokeStyle = valve.status === 'normal' ? 'var(--accent-success)' :
                        valve.status === 'maintenance' ? 'var(--accent-warning)' : 'var(--accent-danger)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = valve.status === 'normal' ? 'var(--accent-success)' :
                        valve.status === 'maintenance' ? 'var(--accent-warning)' : 'var(--accent-danger)';
      ctx.fill();

      if (selectedValve?.id === valve.id) {
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.strokeStyle = 'var(--accent-primary)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    hazards.forEach(hazard => {
      const [x, y] = hazard.position;
      const color = hazard.level === 'minor' ? config.legend.minorColor :
                    hazard.level === 'moderate' ? config.legend.moderateColor :
                    hazard.level === 'severe' ? config.legend.severeColor :
                    config.legend.criticalColor;

      const pulseSize = 15 + Math.sin(Date.now() / 300) * 3;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = color + '40';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', x, y);
    });

    ctx.restore();
  }, [viewport, filteredPipes, filteredValves, hazards, selectedPipe, selectedValve, config.legend]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      drawMap();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [drawMap]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale;

    for (const valve of filteredValves) {
      const distance = Math.sqrt(
        Math.pow(valve.position[0] - x, 2) +
        Math.pow(valve.position[1] - y, 2)
      );
      if (distance < 15) {
        setSelectedValve(valve);
        setSelectedPipe(null);
        return;
      }
    }

    for (const pipe of filteredPipes) {
      const [x1, y1] = pipe.startPoint;
      const [x2, y2] = pipe.endPoint;

      const A = x - x1;
      const B = y - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;
      if (param < 0) { xx = x1; yy = y1; }
      else if (param > 1) { xx = x2; yy = y2; }
      else { xx = x1 + param * C; yy = y1 + param * D; }

      const distance = Math.sqrt(Math.pow(x - xx, 2) + Math.pow(y - yy, 2));
      if (distance < 10) {
        setSelectedPipe(pipe);
        setSelectedValve(null);
        return;
      }
    }

    const hazard = getHazardAtPosition(x, y);
    if (hazard) {
      setSelectedPipe(null);
      setSelectedValve(null);
      return;
    }

    setSelectedPipe(null);
    setSelectedValve(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * delta)),
    }));
  };

  const handleZoomIn = () => {
    setViewport(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }));
  };

  const handleZoomOut = () => {
    setViewport(prev => ({ ...prev, scale: Math.max(0.5, prev.scale * 0.8) }));
  };

  const handleReset = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
    setSelectedPipe(null);
    setSelectedValve(null);
  };

  const stats = useMemo(() => ({
    total: pipes.length,
    inspected: pipes.filter(p => p.status === 'inspected').length,
    uninspected: pipes.filter(p => p.status === 'uninspected').length,
    valves: valves.length,
    hazards: hazards.length,
  }), [pipes, valves, hazards]);

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <Card className="lg:col-span-1">
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0, 180, 216, 0.2)' }}>
                <CircleDot size={20} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>总管段</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(48, 209, 88, 0.2)' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--accent-success)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>已巡检</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent-success)' }}>{stats.inspected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(107, 114, 128, 0.2)' }}>
                <XCircle size={20} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>未巡检</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)' }}>{stats.uninspected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 59, 48, 0.2)' }}>
                <AlertTriangle size={20} style={{ color: 'var(--accent-danger)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>隐患数量</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent-danger)' }}>{stats.hazards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle icon={<Filter size={18} />}>区域筛选</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedArea('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                    selectedArea === 'all' ? 'text-white' : ''
                  }`}
                  style={{
                    background: selectedArea === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: selectedArea === 'all' ? 'var(--text-inverse)' : 'var(--text-primary)',
                  }}
                >
                  全部区域
                </button>
                {mockAreas.map(area => (
                  <button
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      selectedArea === area ? 'text-white' : ''
                    }`}
                    style={{
                      background: selectedArea === area ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: selectedArea === area ? 'var(--text-inverse)' : 'var(--text-primary)',
                    }}
                  >
                    {area}
                    <span className="float-right text-sm opacity-70">
                      {pipes.filter(p => p.area === area).length}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {showLegend && (
            <Card>
              <CardHeader>
                <CardTitle icon={<Info size={18} />}>图例说明</CardTitle>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  收起
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-1.5 rounded" style={{ background: config.legend.inspectedColor }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>已巡检管段</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-1.5 rounded" style={{ background: config.legend.uninspectedColor }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>未巡检管段</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--accent-success)', background: 'var(--accent-success)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>阀门井(正常)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--accent-warning)', background: 'var(--accent-warning)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>阀门井(维护中)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--accent-danger)', background: 'var(--accent-danger)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>阀门井(故障)</span>
                  </div>
                  <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border-primary)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>隐患等级</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: config.legend.minorColor }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>轻微</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: config.legend.moderateColor }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>一般</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: config.legend.severeColor }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>严重</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: config.legend.criticalColor }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>危急</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(selectedPipe || selectedValve) && (
            <Card className="animate-slide-in">
              <CardHeader>
                <CardTitle icon={<Info size={18} />}>详情信息</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPipe && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>管段名称</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedPipe.name}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>所属区域</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedPipe.area}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>管径</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedPipe.diameter}mm</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>管材</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedPipe.material}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>状态</p>
                      <span className={`badge ${selectedPipe.status === 'inspected' ? 'badge-success' : 'badge-info'}`}>
                        {selectedPipe.status === 'inspected' ? '已巡检' : '未巡检'}
                      </span>
                    </div>
                    {selectedPipe.inspectedAt && (
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>巡检时间</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedPipe.inspectedAt}</p>
                      </div>
                    )}
                    {selectedPipe.inspector && (
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>巡检人员</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedPipe.inspector}</p>
                      </div>
                    )}
                    <div className="pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>快速操作</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            updatePipe(selectedPipe.id, {
                              status: 'inspected',
                              inspectedAt: new Date().toLocaleString('zh-CN'),
                              inspector: '当前用户',
                            });
                            setSelectedPipe({
                              ...selectedPipe,
                              status: 'inspected',
                              inspectedAt: new Date().toLocaleString('zh-CN'),
                              inspector: '当前用户',
                            });
                          }}
                          disabled={selectedPipe.status === 'inspected'}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedPipe.status === 'inspected'
                              ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          }`}
                        >
                          <CheckCircle2 size={16} />
                          标记已巡
                        </button>
                        <button
                          onClick={() => {
                            updatePipe(selectedPipe.id, {
                              status: 'uninspected',
                              inspectedAt: '',
                              inspector: '',
                            });
                            setSelectedPipe({
                              ...selectedPipe,
                              status: 'uninspected',
                              inspectedAt: '',
                              inspector: '',
                            });
                          }}
                          disabled={selectedPipe.status === 'uninspected'}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedPipe.status === 'uninspected'
                              ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                          }`}
                        >
                          <XCircle size={16} />
                          标记未巡
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {selectedValve && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>阀门井名称</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedValve.name}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>阀门类型</p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{getValveTypeLabel(selectedValve.type)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>状态</p>
                      <span className={`badge ${
                        selectedValve.status === 'normal' ? 'badge-success' :
                        selectedValve.status === 'maintenance' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {getValveStatusLabel(selectedValve.status)}
                      </span>
                    </div>
                    {selectedValve.lastInspection && (
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>上次巡检</p>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedValve.lastInspection}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          <Card className="h-[600px] relative overflow-hidden">
            <CardHeader>
              <CardTitle icon={<Map size={20} />}>管网地图</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <ZoomOut size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <ZoomIn size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button
                  onClick={handleReset}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <Maximize2 size={18} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)] p-0">
              <div
                ref={containerRef}
                className="w-full h-full relative grid-bg cursor-grab active:cursor-grabbing overflow-hidden"
                style={{ background: 'var(--bg-secondary)' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleClick}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{ display: 'block' }}
                />
                <div
                  className="absolute bottom-4 right-4 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                >
                  缩放: {Math.round(viewport.scale * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={!!selectedValve} onClose={() => setSelectedValve(null)} title="阀门井详情" size="sm">
        {selectedValve && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>阀门井名称</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedValve.name}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>类型</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{getValveTypeLabel(selectedValve.type)}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>状态</p>
                <span className={`badge ${
                  selectedValve.status === 'normal' ? 'badge-success' :
                  selectedValve.status === 'maintenance' ? 'badge-warning' : 'badge-danger'
                }`}>
                  {getValveStatusLabel(selectedValve.status)}
                </span>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>位置坐标</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  ({selectedValve.position[0]}, {selectedValve.position[1]})
                </p>
              </div>
            </div>
            {selectedValve.lastInspection && (
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>上次巡检时间</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedValve.lastInspection}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
