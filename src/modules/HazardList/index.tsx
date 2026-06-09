import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Image,
  Edit2,
  Trash2,
  ChevronDown,
  Lightbulb,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTheme } from '@/hooks/useTheme';
import {
  getHazardTypeLabel,
  getHazardLevelLabel,
  getHazardStatusLabel,
  generateSuggestion,
} from '@/utils/suggestions';
import type { Hazard, HazardType, HazardLevel, HazardStatus } from '@/types';
import { mockInspectorNames } from '@/mock/data';

export const HazardListModule: React.FC = () => {
  const { hazards, photos, addHazard, updateHazard, deleteHazard, updateHazardStatus, config } =
    useInspectionStore();
  const { themeColors } = useTheme();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterLevel, setFilterLevel] = useState<HazardLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<HazardStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<HazardType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [showLevelFilter, setShowLevelFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const [newHazard, setNewHazard] = useState({
    type: 'leak' as HazardType,
    level: 'moderate' as HazardLevel,
    location: '',
    position: [0, 0] as [number, number],
    description: '',
    reporter: mockInspectorNames[0],
    status: 'pending' as HazardStatus,
    photos: [] as string[],
  });

  const filteredHazards = hazards.filter((h) => {
    const matchKeyword =
      h.location.includes(searchKeyword) ||
      h.description.includes(searchKeyword) ||
      h.reporter.includes(searchKeyword);
    const matchLevel = filterLevel === 'all' || h.level === filterLevel;
    const matchStatus = filterStatus === 'all' || h.status === filterStatus;
    const matchType = filterType === 'all' || h.type === filterType;
    return matchKeyword && matchLevel && matchStatus && matchType;
  });

  const getLevelColor = (level: HazardLevel): string => {
    const colors: Record<HazardLevel, string> = {
      minor: config.legend.minorColor,
      moderate: config.legend.moderateColor,
      severe: config.legend.severeColor,
      critical: config.legend.criticalColor,
    };
    return colors[level];
  };

  const getStatusIcon = (status: HazardStatus) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleViewDetail = (hazard: Hazard) => {
    setSelectedHazard(hazard);
    setShowDetailModal(true);
  };

  const handleAddHazard = () => {
    if (!newHazard.location || !newHazard.description) {
      alert('请填写完整的隐患信息');
      return;
    }
    addHazard({
      ...newHazard,
      position: [Math.floor(Math.random() * 800) + 50, Math.floor(Math.random() * 600) + 50],
    });
    setShowAddModal(false);
    setNewHazard({
      type: 'leak',
      level: 'moderate',
      location: '',
      position: [0, 0],
      description: '',
      reporter: mockInspectorNames[0],
      status: 'pending',
      photos: [],
    });
  };

  const handleStatusChange = (id: string, status: HazardStatus) => {
    updateHazardStatus(id, status);
    if (selectedHazard?.id === id) {
      setSelectedHazard({ ...selectedHazard, status });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条隐患记录吗？')) {
      deleteHazard(id);
      if (selectedHazard?.id === id) {
        setShowDetailModal(false);
        setSelectedHazard(null);
      }
    }
  };

  const getHazardPhotos = (hazard: Hazard) => {
    return photos.filter((p) => hazard.photos.includes(p.id));
  };

  const stats = {
    total: hazards.length,
    pending: hazards.filter((h) => h.status === 'pending').length,
    processing: hazards.filter((h) => h.status === 'processing').length,
    resolved: hazards.filter((h) => h.status === 'resolved').length,
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">隐患总数</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: `${config.legend.severeColor}20` }}
              >
                <AlertTriangle className="w-6 h-6" style={{ color: config.legend.severeColor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">待处理</p>
                <p className="text-3xl font-bold mt-1" style={{ color: config.legend.moderateColor }}>
                  {stats.pending}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: `${config.legend.moderateColor}20` }}
              >
                <Clock className="w-6 h-6" style={{ color: config.legend.moderateColor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">处理中</p>
                <p className="text-3xl font-bold mt-1 text-blue-500">{stats.processing}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/20">
                <Loader2 className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">已解决</p>
                <p className="text-3xl font-bold mt-1 text-green-500">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/20">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              隐患清单
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4" />
              登记隐患
            </Button>
          </CardTitle>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                placeholder="搜索位置、描述、上报人..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLevelFilter(!showLevelFilter);
                  setShowStatusFilter(false);
                  setShowTypeFilter(false);
                }}
              >
                <Filter className="w-4 h-4" />
                等级: {filterLevel === 'all' ? '全部' : getHazardLevelLabel(filterLevel)}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showLevelFilter && (
                <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-primary rounded-lg shadow-lg z-10 min-w-[120px]">
                  <div
                    className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                    onClick={() => {
                      setFilterLevel('all');
                      setShowLevelFilter(false);
                    }}
                  >
                    全部
                  </div>
                  {(['minor', 'moderate', 'severe', 'critical'] as HazardLevel[]).map((level) => (
                    <div
                      key={level}
                      className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm flex items-center gap-2"
                      onClick={() => {
                        setFilterLevel(level);
                        setShowLevelFilter(false);
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getLevelColor(level) }}
                      />
                      {getHazardLevelLabel(level)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowStatusFilter(!showStatusFilter);
                  setShowLevelFilter(false);
                  setShowTypeFilter(false);
                }}
              >
                <Filter className="w-4 h-4" />
                状态: {filterStatus === 'all' ? '全部' : getHazardStatusLabel(filterStatus)}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showStatusFilter && (
                <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-primary rounded-lg shadow-lg z-10 min-w-[120px]">
                  <div
                    className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                    onClick={() => {
                      setFilterStatus('all');
                      setShowStatusFilter(false);
                    }}
                  >
                    全部
                  </div>
                  {(['pending', 'processing', 'resolved'] as HazardStatus[]).map((status) => (
                    <div
                      key={status}
                      className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm flex items-center gap-2"
                      onClick={() => {
                        setFilterStatus(status);
                        setShowStatusFilter(false);
                      }}
                    >
                      {getStatusIcon(status)}
                      {getHazardStatusLabel(status)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTypeFilter(!showTypeFilter);
                  setShowLevelFilter(false);
                  setShowStatusFilter(false);
                }}
              >
                <Filter className="w-4 h-4" />
                类型: {filterType === 'all' ? '全部' : getHazardTypeLabel(filterType)}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showTypeFilter && (
                <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-primary rounded-lg shadow-lg z-10 min-w-[120px]">
                  <div
                    className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                    onClick={() => {
                      setFilterType('all');
                      setShowTypeFilter(false);
                    }}
                  >
                    全部
                  </div>
                  {(['leak', 'blockage', 'damage', 'other'] as HazardType[]).map((type) => (
                    <div
                      key={type}
                      className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                      onClick={() => {
                        setFilterType(type);
                        setShowTypeFilter(false);
                      }}
                    >
                      {getHazardTypeLabel(type)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto min-h-0">
          {filteredHazards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <AlertTriangle className="w-12 h-12 mb-3" />
              <p>暂无符合条件的隐患记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHazards.map((hazard) => (
                <div
                  key={hazard.id}
                  className="p-4 rounded-lg border border-border-primary hover:border-primary/50 transition-all cursor-pointer bg-bg-secondary/50"
                  onClick={() => handleViewDetail(hazard)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: getLevelColor(hazard.level) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="px-2 py-0.5 text-xs rounded-full font-medium"
                            style={{
                              backgroundColor: `${getLevelColor(hazard.level)}20`,
                              color: getLevelColor(hazard.level),
                            }}
                          >
                            {getHazardLevelLabel(hazard.level)}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-bg-tertiary">
                            {getHazardTypeLabel(hazard.type)}
                          </span>
                          <span className="flex items-center gap-1 text-xs opacity-70">
                            {getStatusIcon(hazard.status)}
                            {getHazardStatusLabel(hazard.status)}
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">{hazard.location}</h4>
                        <p className="text-sm opacity-70 line-clamp-2">{hazard.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs opacity-60">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {hazard.reporter}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {hazard.reportedAt}
                          </span>
                          {hazard.photos.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Image className="w-3 h-3" />
                              {hazard.photos.length}张
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(hazard);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(hazard.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="登记新隐患"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">隐患类型</label>
              <select
                value={newHazard.type}
                onChange={(e) =>
                  setNewHazard({ ...newHazard, type: e.target.value as HazardType })
                }
                className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
              >
                <option value="leak">渗漏</option>
                <option value="blockage">堵塞</option>
                <option value="damage">破损</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">隐患等级</label>
              <select
                value={newHazard.level}
                onChange={(e) =>
                  setNewHazard({ ...newHazard, level: e.target.value as HazardLevel })
                }
                className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
              >
                <option value="minor">轻微</option>
                <option value="moderate">一般</option>
                <option value="severe">严重</option>
                <option value="critical">危急</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">位置描述</label>
            <input
              type="text"
              value={newHazard.location}
              onChange={(e) => setNewHazard({ ...newHazard, location: e.target.value })}
              placeholder="例如：东城区管段A-002"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">隐患描述</label>
            <textarea
              value={newHazard.description}
              onChange={(e) => setNewHazard({ ...newHazard, description: e.target.value })}
              placeholder="请详细描述隐患情况..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">上报人</label>
            <select
              value={newHazard.reporter}
              onChange={(e) => setNewHazard({ ...newHazard, reporter: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
            >
              {mockInspectorNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {newHazard.description && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary mb-1">自动生成整改建议</p>
                  <p className="text-sm opacity-80 leading-relaxed">
                    {generateSuggestion(newHazard.type, newHazard.level, newHazard.description)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowAddModal(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleAddHazard}>
            提交登记
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="隐患详情"
        size="lg"
      >
        {selectedHazard && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 text-sm rounded-full font-medium"
                style={{
                  backgroundColor: `${getLevelColor(selectedHazard.level)}20`,
                  color: getLevelColor(selectedHazard.level),
                }}
              >
                {getHazardLevelLabel(selectedHazard.level)}
              </span>
              <span className="px-3 py-1 text-sm rounded-full bg-bg-tertiary">
                {getHazardTypeLabel(selectedHazard.type)}
              </span>
              <span className="flex items-center gap-1 text-sm">
                {getStatusIcon(selectedHazard.status)}
                {getHazardStatusLabel(selectedHazard.status)}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedHazard.location}</h3>
              <p className="opacity-80 leading-relaxed">{selectedHazard.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 opacity-50" />
                <span>坐标: ({selectedHazard.position[0]}, {selectedHazard.position[1]})</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 opacity-50" />
                <span>上报人: {selectedHazard.reporter}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 opacity-50" />
                <span>上报时间: {selectedHazard.reportedAt}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary mb-1">整改建议</p>
                  <p className="text-sm opacity-80 leading-relaxed">{selectedHazard.suggestion}</p>
                </div>
              </div>
            </div>

            {getHazardPhotos(selectedHazard).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">现场照片</p>
                <div className="grid grid-cols-4 gap-2">
                  {getHazardPhotos(selectedHazard).map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.thumbnail}
                      alt={photo.title}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border-primary">
              <p className="text-sm font-medium mb-3">更新状态</p>
              <div className="flex gap-2">
                <Button
                  variant={selectedHazard.status === 'pending' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleStatusChange(selectedHazard.id, 'pending')}
                >
                  <Clock className="w-4 h-4" />
                  待处理
                </Button>
                <Button
                  variant={selectedHazard.status === 'processing' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleStatusChange(selectedHazard.id, 'processing')}
                >
                  <Loader2 className="w-4 h-4" />
                  处理中
                </Button>
                <Button
                  variant={selectedHazard.status === 'resolved' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleStatusChange(selectedHazard.id, 'resolved')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  已解决
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowDetailModal(false)}>
            关闭
          </Button>
        </div>
      </Modal>
    </div>
  );
};
