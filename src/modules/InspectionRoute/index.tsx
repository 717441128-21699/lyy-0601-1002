import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Route,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  MapPin,
  Clock,
  Ruler,
  User,
  Calendar,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTheme } from '@/hooks/useTheme';
import type { InspectionRoute, InspectionPoint } from '@/types';

export const InspectionRouteModule: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const {
    routes,
    selectedRouteId,
    setSelectedRouteId,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    playbackProgress,
    setPlaybackProgress,
    config,
  } = useInspectionStore();
  const { themeColors } = useTheme();

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [showPointList, setShowPointList] = useState(true);

  const totalPoints = selectedRoute?.points?.length || 0;
  const progressPercent = totalPoints > 0 ? (playbackProgress / (totalPoints - 1)) * 100 : 0;

  const getInterpolatedPosition = useCallback(
    (progress: number): [number, number] => {
      if (!selectedRoute || totalPoints === 0) return [0, 0];
      const points = selectedRoute.points;

      const idx = Math.floor(progress);
      const fraction = progress - idx;

      if (idx >= totalPoints - 1) {
        return points[totalPoints - 1].position;
      }
      if (idx < 0) return points[0].position;

      const p1 = points[idx].position;
      const p2 = points[idx + 1].position;

      return [p1[0] + (p2[0] - p1[0]) * fraction, p1[1] + (p2[1] - p1[1]) * fraction];
    },
    [selectedRoute, totalPoints],
  );

  const drawRouteMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedRoute) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, rect.width, rect.height);

    const padding = 60;
    const points = selectedRoute.points;

    const minX = Math.min(...points.map((p) => p.position[0])) - padding;
    const maxX = Math.max(...points.map((p) => p.position[0])) + padding;
    const minY = Math.min(...points.map((p) => p.position[1])) - padding;
    const maxY = Math.max(...points.map((p) => p.position[1])) + padding;

    const scaleX = rect.width / (maxX - minX);
    const scaleY = rect.height / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (rect.width - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (rect.height - (maxY - minY) * scale) / 2 - minY * scale;

    const transformX = (x: number) => x * scale + offsetX;
    const transformY = (y: number) => y * scale + offsetY;

    ctx.strokeStyle = 'var(--border-primary)';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;
    for (let x = 0; x < rect.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.beginPath();
    points.forEach((point, idx) => {
      const [x, y] = point.position;
      const tx = transformX(x);
      const ty = transformY(y);
      if (idx === 0) {
        ctx.moveTo(tx, ty);
      } else {
        ctx.lineTo(tx, ty);
      }
    });
    ctx.strokeStyle = 'var(--border-secondary)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const visitedProgress = Math.floor(playbackProgress);
    if (visitedProgress > 0 && points.length > 1) {
      ctx.beginPath();
      for (let i = 0; i <= visitedProgress && i < points.length; i++) {
        const [x, y] = points[i].position;
        const tx = transformX(x);
        const ty = transformY(y);
        if (i === 0) {
          ctx.moveTo(tx, ty);
        } else {
          ctx.lineTo(tx, ty);
        }
      }

      if (visitedProgress < points.length - 1) {
        const [cx, cy] = getInterpolatedPosition(playbackProgress);
        ctx.lineTo(transformX(cx), transformY(cy));
      }

      const gradient = ctx.createLinearGradient(
        transformX(points[0].position[0]),
        transformY(points[0].position[1]),
        transformX(points[Math.min(visitedProgress, points.length - 1)].position[0]),
        transformY(points[Math.min(visitedProgress, points.length - 1)].position[1]),
      );
      gradient.addColorStop(0, config.legend.inspectedColor);
      gradient.addColorStop(1, config.legend.inspectedColor + 'CC');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    points.forEach((point, idx) => {
      const [x, y] = point.position;
      const tx = transformX(x);
      const ty = transformY(y);
      const isVisited = idx <= Math.floor(playbackProgress);
      const isCurrent =
        idx === Math.floor(playbackProgress) ||
        (idx === 0 && playbackProgress === 0);

      ctx.beginPath();
      ctx.arc(tx, ty, isCurrent ? 12 : 8, 0, Math.PI * 2);

      if (isCurrent) {
        ctx.fillStyle = themeColors.primary;
        ctx.shadowColor = themeColors.primary;
        ctx.shadowBlur = 15;
      } else if (isVisited) {
        ctx.fillStyle = config.legend.inspectedColor;
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = config.legend.uninspectedColor;
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(tx, ty, isCurrent ? 14 : 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'var(--bg-primary)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'var(--text-primary)';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`#${idx + 1}`, tx, ty + 28);
    });

    const [curX, curY] = getInterpolatedPosition(playbackProgress);
    const cpx = transformX(curX);
    const cpy = transformY(curY);

    const time = Date.now() / 500;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const radius = 16 + i * 8 + Math.sin(time + i) * 3;
      ctx.arc(cpx, cpy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${themeColors.primary}${Math.floor((1 - i * 0.3) * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cpx, cpy, 10, 0, Math.PI * 2);
    ctx.fillStyle = themeColors.primary;
    ctx.fill();
    ctx.strokeStyle = 'var(--bg-primary)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [selectedRoute, playbackProgress, config.legend, themeColors.primary, getInterpolatedPosition]);

  useEffect(() => {
    drawRouteMap();
  }, [drawRouteMap]);

  useEffect(() => {
    if (isPlaying && selectedRoute) {
      const animate = () => {
        setPlaybackProgress((prev) => {
          const next = prev + 0.02 * playbackSpeed;
          if (next >= totalPoints - 1) {
            setIsPlaying(false);
            return totalPoints - 1;
          }
          setCurrentPointIndex(Math.floor(next));
          return next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, selectedRoute, totalPoints, setPlaybackProgress, setIsPlaying]);

  useEffect(() => {
    if (selectedRoute) {
      setPlaybackProgress(0);
      setCurrentPointIndex(0);
      setIsPlaying(false);
    }
  }, [selectedRouteId, selectedRoute, setPlaybackProgress, setIsPlaying]);

  const handlePlayPause = () => {
    if (playbackProgress >= totalPoints - 1) {
      setPlaybackProgress(0);
      setCurrentPointIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    setCurrentPointIndex(0);
  };

  const handleSkipForward = () => {
    setPlaybackProgress(Math.min(playbackProgress + 1, totalPoints - 1));
    setCurrentPointIndex(Math.floor(Math.min(playbackProgress + 1, totalPoints - 1)));
  };

  const handleSkipBack = () => {
    setPlaybackProgress(Math.max(playbackProgress - 1, 0));
    setCurrentPointIndex(Math.floor(Math.max(playbackProgress - 1, 0)));
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
  };

  const formatTime = (timestamp: string) => {
    return timestamp.split(' ')[1] || timestamp;
  };

  if (!selectedRoute) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Route className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg opacity-60">暂无巡检路线数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-3 space-y-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              巡检路线列表
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
            {routes.map((route) => (
              <div
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  selectedRouteId === route.id
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:border-primary/50 hover:bg-bg-secondary'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{route.name}</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {route.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {route.inspector}
                  </div>
                  <div className="flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    {route.distance}km
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {route.points.length}个点
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="col-span-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                {selectedRoute.name} - 巡检轨迹
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 opacity-70" />
                  {selectedRoute.date}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 opacity-70" />
                  {selectedRoute.inspector}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border-primary"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <canvas ref={canvasRef} className="w-full h-full" />

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <div className="glass-card px-3 py-2 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Ruler className="w-3 h-3" />
                      {selectedRoute.distance}km
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(selectedRoute.duration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${progressPercent}%`,
                      background: `linear-gradient(90deg, ${config.legend.inspectedColor}, ${themeColors.primary})`,
                    }}
                  />
                </div>
                <span className="text-sm font-mono min-w-[60px] text-right">
                  {Math.floor(progressPercent)}%
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <SkipBack className="w-4 h-4" />
                  重置
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSkipBack}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="primary" size="lg" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSkipForward}>
                  <SkipForward className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs opacity-70">速度:</span>
                  {[0.5, 1, 2, 4].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-primary text-white'
                          : 'bg-bg-secondary hover:bg-bg-tertiary'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-3 space-y-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                巡检点明细
              </div>
              <button
                onClick={() => setShowPointList(!showPointList)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                {showPointList ? '收起' : '展开'}
              </button>
            </CardTitle>
          </CardHeader>
          {showPointList && (
            <CardContent className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
              {selectedRoute.points.map((point: InspectionPoint, idx: number) => {
                const isVisited = idx <= Math.floor(playbackProgress);
                const isCurrent = idx === Math.floor(playbackProgress);

                return (
                  <div
                    key={point.id}
                    className={`relative p-3 rounded-lg border-l-4 transition-all ${
                      isCurrent
                        ? 'border-primary bg-primary/10'
                        : isVisited
                          ? 'border-green-500 bg-green-500/5'
                          : 'border-gray-500/30 bg-bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isVisited ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-medium text-sm">巡检点 {idx + 1}</span>
                      </div>
                      <span className="text-xs opacity-70">{formatTime(point.timestamp)}</span>
                    </div>
                    <div className="text-xs space-y-1 pl-8">
                      <div className="flex items-center gap-1 opacity-80">
                        <User className="w-3 h-3" />
                        {point.inspector}
                      </div>
                      {point.notes && (
                        <p className="opacity-70 leading-relaxed">{point.notes}</p>
                      )}
                      {point.photos.length > 0 && (
                        <div className="flex items-center gap-1 text-primary">
                          <span className="text-xs">📷 {point.photos.length}张照片</span>
                        </div>
                      )}
                    </div>

                    {idx < selectedRoute.points.length - 1 && (
                      <div className="absolute left-[11px] top-full w-0.5 h-3 bg-border-primary" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};
