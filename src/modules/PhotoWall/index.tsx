import React, { useState } from 'react';
import {
  Image,
  Search,
  Filter,
  X,
  MapPin,
  Calendar,
  Tag,
  AlertTriangle,
  ChevronDown,
  Upload,
  Maximize2,
  Link2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useTheme } from '@/hooks/useTheme';
import { getHazardLevelLabel, getHazardTypeLabel } from '@/utils/suggestions';
import type { Photo, PhotoCategory } from '@/types';
import { mockAreas, mockInspectorNames } from '@/mock/data';

export const PhotoWallModule: React.FC = () => {
  const { photos, hazards, addPhoto, config } = useInspectionStore();
  const { themeColors } = useTheme();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<PhotoCategory | 'all'>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterHazard, setFilterHazard] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showAreaFilter, setShowAreaFilter] = useState(false);
  const [showHazardFilter, setShowHazardFilter] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [newPhoto, setNewPhoto] = useState({
    title: '',
    location: mockAreas[0],
    category: 'site' as PhotoCategory,
    hazardId: '',
    tags: [] as string[],
    takenBy: mockInspectorNames[0],
  });
  const [tagInput, setTagInput] = useState('');

  const filteredPhotos = photos.filter((photo) => {
    const matchKeyword =
      photo.title.includes(searchKeyword) ||
      photo.location.includes(searchKeyword) ||
      photo.tags.some((tag) => tag.includes(searchKeyword));
    const matchCategory = filterCategory === 'all' || photo.category === filterCategory;
    const matchArea = filterArea === 'all' || photo.location === filterArea;
    const matchHazard =
      filterHazard === 'all'
        ? true
        : filterHazard === 'none'
          ? !photo.hazardId
          : photo.hazardId === filterHazard;
    return matchKeyword && matchCategory && matchArea && matchHazard;
  });

  const getCategoryLabel = (category: PhotoCategory): string => {
    const labels: Record<PhotoCategory, string> = {
      site: '现场',
      hazard: '隐患',
      equipment: '设备',
    };
    return labels[category] || '其他';
  };

  const getCategoryColor = (category: PhotoCategory): string => {
    const colors: Record<PhotoCategory, string> = {
      site: '#3B82F6',
      hazard: config.legend.severeColor,
      equipment: '#8B5CF6',
    };
    return colors[category] || '#6B7280';
  };

  const getRelatedHazard = (photo: Photo) => {
    return hazards.find((h) => h.id === photo.hazardId);
  };

  const handleViewPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newPhoto.tags.includes(tagInput.trim())) {
      setNewPhoto({ ...newPhoto, tags: [...newPhoto.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewPhoto({ ...newPhoto, tags: newPhoto.tags.filter((t) => t !== tag) });
  };

  const handleUpload = () => {
    if (!newPhoto.title) {
      alert('请填写照片标题');
      return;
    }

    const generatePhotoUrl = (seed: string) =>
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('water pipeline inspection ' + seed)}&image_size=square_hd`;

    const url = generatePhotoUrl(newPhoto.title);
    addPhoto({
      url,
      thumbnail: url,
      title: newPhoto.title,
      takenAt: new Date().toISOString().split('T')[0],
      location: newPhoto.location,
      hazardId: newPhoto.hazardId || undefined,
      category: newPhoto.category,
      tags: newPhoto.tags,
    });

    setShowUploadModal(false);
    setNewPhoto({
      title: '',
      location: mockAreas[0],
      category: 'site',
      hazardId: '',
      tags: [],
      takenBy: mockInspectorNames[0],
    });
  };

  const stats = {
    total: photos.length,
    site: photos.filter((p) => p.category === 'site').length,
    hazard: photos.filter((p) => p.category === 'hazard').length,
    equipment: photos.filter((p) => p.category === 'equipment').length,
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">照片总数</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Image className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">现场照片</p>
                <p className="text-3xl font-bold mt-1 text-blue-500">{stats.site}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-70">隐患照片</p>
                <p className="text-3xl font-bold mt-1" style={{ color: config.legend.severeColor }}>
                  {stats.hazard}
                </p>
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
                <p className="text-sm opacity-70">设备照片</p>
                <p className="text-3xl font-bold mt-1 text-purple-500">{stats.equipment}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Tag className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              照片墙
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4" />
              上传照片
            </Button>
          </CardTitle>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                placeholder="搜索标题、位置、标签..."
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
                  setShowCategoryFilter(!showCategoryFilter);
                  setShowAreaFilter(false);
                  setShowHazardFilter(false);
                }}
              >
                <Filter className="w-4 h-4" />
                分类: {filterCategory === 'all' ? '全部' : getCategoryLabel(filterCategory)}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showCategoryFilter && (
                <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-primary rounded-lg shadow-lg z-10 min-w-[120px]">
                  <div
                    className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                    onClick={() => {
                      setFilterCategory('all');
                      setShowCategoryFilter(false);
                    }}
                  >
                    全部
                  </div>
                  {(['site', 'hazard', 'equipment'] as PhotoCategory[]).map((cat) => (
                    <div
                      key={cat}
                      className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm flex items-center gap-2"
                      onClick={() => {
                        setFilterCategory(cat);
                        setShowCategoryFilter(false);
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCategoryColor(cat) }}
                      />
                      {getCategoryLabel(cat)}
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
                  setShowAreaFilter(!showAreaFilter);
                  setShowCategoryFilter(false);
                  setShowHazardFilter(false);
                }}
              >
                <Filter className="w-4 h-4" />
                区域: {filterArea === 'all' ? '全部' : filterArea}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showAreaFilter && (
                <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-primary rounded-lg shadow-lg z-10 min-w-[120px]">
                  <div
                    className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                    onClick={() => {
                      setFilterArea('all');
                      setShowAreaFilter(false);
                    }}
                  >
                    全部区域
                  </div>
                  {mockAreas.map((area) => (
                    <div
                      key={area}
                      className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                      onClick={() => {
                        setFilterArea(area);
                        setShowAreaFilter(false);
                      }}
                    >
                      {area}
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
                  setShowHazardFilter(!showHazardFilter);
                  setShowCategoryFilter(false);
                  setShowAreaFilter(false);
                }}
              >
                <Filter className="w-4 h-4" />
                关联: {filterHazard === 'all' ? '全部' : filterHazard === 'none' ? '未关联' : '已关联'}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showHazardFilter && (
                <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-primary rounded-lg shadow-lg z-10 min-w-[150px]">
                  <div
                    className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                    onClick={() => {
                      setFilterHazard('all');
                      setShowHazardFilter(false);
                    }}
                  >
                    全部
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                    onClick={() => {
                      setFilterHazard('none');
                      setShowHazardFilter(false);
                    }}
                  >
                    未关联隐患
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-bg-secondary cursor-pointer text-sm"
                    onClick={() => {
                      setFilterHazard('linked');
                      setShowHazardFilter(false);
                    }}
                  >
                    已关联隐患
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto min-h-0">
          {filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <Image className="w-12 h-12 mb-3" />
              <p>暂无符合条件的照片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {filteredPhotos.map((photo) => {
                const relatedHazard = getRelatedHazard(photo);
                return (
                  <div
                    key={photo.id}
                    className="group relative rounded-lg overflow-hidden border border-border-primary cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => handleViewPhoto(photo)}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={photo.thumbnail}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium truncate">{photo.title}</p>
                      </div>
                      <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{
                            backgroundColor: `${getCategoryColor(photo.category)}20`,
                            color: getCategoryColor(photo.category),
                          }}
                        >
                          {getCategoryLabel(photo.category)}
                        </span>
                        {relatedHazard && (
                          <span
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: `${
                                config.legend[
                                  `${relatedHazard.level}Color` as keyof typeof config.legend
                                ]
                              }20`,
                              color:
                                config.legend[
                                  `${relatedHazard.level}Color` as keyof typeof config.legend
                                ],
                            }}
                          >
                            {getHazardLevelLabel(relatedHazard.level)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-60">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{photo.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="上传照片"
        size="lg"
      >
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border-primary rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => alert('演示模式：将自动生成模拟图片')}
          >
            <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm opacity-70">点击或拖拽照片到此处上传</p>
            <p className="text-xs opacity-50 mt-1">支持 JPG、PNG 格式</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">照片标题</label>
            <input
              type="text"
              value={newPhoto.title}
              onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
              placeholder="请输入照片标题"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">拍摄区域</label>
              <select
                value={newPhoto.location}
                onChange={(e) => setNewPhoto({ ...newPhoto, location: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
              >
                {mockAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">照片分类</label>
              <select
                value={newPhoto.category}
                onChange={(e) =>
                  setNewPhoto({ ...newPhoto, category: e.target.value as PhotoCategory })
                }
                className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
              >
                <option value="site">现场</option>
                <option value="hazard">隐患</option>
                <option value="equipment">设备</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">关联隐患（可选）</label>
            <select
              value={newPhoto.hazardId}
              onChange={(e) => setNewPhoto({ ...newPhoto, hazardId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
            >
              <option value="">不关联</option>
              {hazards.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.location} - {getHazardTypeLabel(h.type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">标签</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="输入标签后按回车添加"
                className="flex-1 px-3 py-2 rounded-lg bg-bg-secondary border border-border-primary focus:outline-none focus:border-primary"
              />
              <Button variant="ghost" size="sm" onClick={handleAddTag}>
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newPhoto.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full bg-bg-tertiary flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag);
                    }}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowUploadModal(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleUpload}>
            上传
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="照片详情"
        size="xl"
      >
        {selectedPhoto && (
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-lg overflow-hidden bg-bg-secondary">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain max-h-[500px]"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{selectedPhoto.title}</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: `${getCategoryColor(selectedPhoto.category)}20`,
                      color: getCategoryColor(selectedPhoto.category),
                    }}
                  >
                    {getCategoryLabel(selectedPhoto.category)}
                  </span>
                </div>

                <div className="flex items-center gap-2 opacity-80">
                  <MapPin className="w-4 h-4 opacity-50" />
                  {selectedPhoto.location}
                </div>

                <div className="flex items-center gap-2 opacity-80">
                  <Calendar className="w-4 h-4 opacity-50" />
                  {selectedPhoto.takenAt}
                </div>
              </div>

              {getRelatedHazard(selectedPhoto) && (
                <div className="p-3 rounded-lg border border-border-primary bg-bg-secondary">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">关联隐患</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{
                          backgroundColor: `${
                            config.legend[
                              `${getRelatedHazard(selectedPhoto)!.level}Color` as keyof typeof config.legend
                            ]
                          }20`,
                          color:
                            config.legend[
                              `${getRelatedHazard(selectedPhoto)!.level}Color` as keyof typeof config.legend
                            ],
                        }}
                      >
                        {getHazardLevelLabel(getRelatedHazard(selectedPhoto)!.level)}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-bg-tertiary">
                        {getHazardTypeLabel(getRelatedHazard(selectedPhoto)!.type)}
                      </span>
                    </div>
                    <p className="opacity-80">{getRelatedHazard(selectedPhoto)!.location}</p>
                    <p className="text-xs opacity-60">
                      {getRelatedHazard(selectedPhoto)!.description}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">标签</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPhoto.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-bg-tertiary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setSelectedPhoto(null)}>
            关闭
          </Button>
        </div>
      </Modal>
    </div>
  );
};
