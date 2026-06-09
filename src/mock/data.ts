import { v4 as uuidv4 } from 'uuid';
import type { PipeSegment, ValveWell, InspectionRoute, Hazard, Photo, Inspector } from '@/types';
import { createPlaceholderImage } from '@/utils/placeholderImages';

const areas = ['东城区', '西城区', '南城区', '北城区', '中心区'];
const materials = ['球墨铸铁', 'PE管', '钢管', 'PVC管', '水泥管'];
const inspectors = ['张伟', '李明', '王芳', '刘强', '陈静'];

export const mockPipes: PipeSegment[] = [
  { id: uuidv4(), name: '管段A-001', area: '东城区', startPoint: [100, 150], endPoint: [250, 150], diameter: 300, material: '球墨铸铁', status: 'inspected', inspectedAt: '2026-06-08 09:30', inspector: '张伟' },
  { id: uuidv4(), name: '管段A-002', area: '东城区', startPoint: [250, 150], endPoint: [250, 300], diameter: 200, material: 'PE管', status: 'inspected', inspectedAt: '2026-06-08 10:15', inspector: '张伟' },
  { id: uuidv4(), name: '管段A-003', area: '东城区', startPoint: [250, 300], endPoint: [400, 300], diameter: 300, material: '球墨铸铁', status: 'uninspected' },
  { id: uuidv4(), name: '管段B-001', area: '西城区', startPoint: [450, 100], endPoint: [600, 100], diameter: 400, material: '钢管', status: 'inspected', inspectedAt: '2026-06-07 14:20', inspector: '李明' },
  { id: uuidv4(), name: '管段B-002', area: '西城区', startPoint: [600, 100], endPoint: [600, 250], diameter: 300, material: '球墨铸铁', status: 'inspected', inspectedAt: '2026-06-07 15:00', inspector: '李明' },
  { id: uuidv4(), name: '管段B-003', area: '西城区', startPoint: [600, 250], endPoint: [750, 250], diameter: 200, material: 'PE管', status: 'uninspected' },
  { id: uuidv4(), name: '管段C-001', area: '南城区', startPoint: [100, 400], endPoint: [250, 400], diameter: 300, material: 'PVC管', status: 'inspected', inspectedAt: '2026-06-06 08:45', inspector: '王芳' },
  { id: uuidv4(), name: '管段C-002', area: '南城区', startPoint: [250, 400], endPoint: [250, 550], diameter: 250, material: '水泥管', status: 'inspected', inspectedAt: '2026-06-06 09:30', inspector: '王芳' },
  { id: uuidv4(), name: '管段C-003', area: '南城区', startPoint: [250, 550], endPoint: [400, 550], diameter: 300, material: '球墨铸铁', status: 'inspected', inspectedAt: '2026-06-06 10:15', inspector: '王芳' },
  { id: uuidv4(), name: '管段D-001', area: '北城区', startPoint: [450, 400], endPoint: [600, 400], diameter: 400, material: '钢管', status: 'uninspected' },
  { id: uuidv4(), name: '管段D-002', area: '北城区', startPoint: [600, 400], endPoint: [600, 550], diameter: 300, material: '球墨铸铁', status: 'uninspected' },
  { id: uuidv4(), name: '管段E-001', area: '中心区', startPoint: [350, 275], endPoint: [500, 275], diameter: 500, material: '钢管', status: 'inspected', inspectedAt: '2026-06-05 11:00', inspector: '刘强' },
  { id: uuidv4(), name: '管段E-002', area: '中心区', startPoint: [500, 275], endPoint: [500, 425], diameter: 400, material: '球墨铸铁', status: 'inspected', inspectedAt: '2026-06-05 11:45', inspector: '刘强' },
  { id: uuidv4(), name: '管段E-003', area: '中心区', startPoint: [350, 425], endPoint: [500, 425], diameter: 300, material: 'PE管', status: 'uninspected' },
  { id: uuidv4(), name: '管段E-004', area: '中心区', startPoint: [350, 275], endPoint: [350, 425], diameter: 300, material: '球墨铸铁', status: 'inspected', inspectedAt: '2026-06-05 10:30', inspector: '陈静' },
];

export const mockValves: ValveWell[] = [
  { id: uuidv4(), name: '阀门井V-001', position: [100, 150], type: 'gate', status: 'normal', lastInspection: '2026-06-08' },
  { id: uuidv4(), name: '阀门井V-002', position: [250, 150], type: 'butterfly', status: 'normal', lastInspection: '2026-06-08' },
  { id: uuidv4(), name: '阀门井V-003', position: [250, 300], type: 'check', status: 'maintenance', lastInspection: '2026-06-01' },
  { id: uuidv4(), name: '阀门井V-004', position: [400, 300], type: 'gate', status: 'normal', lastInspection: '2026-05-28' },
  { id: uuidv4(), name: '阀门井V-005', position: [450, 100], type: 'butterfly', status: 'normal', lastInspection: '2026-06-07' },
  { id: uuidv4(), name: '阀门井V-006', position: [600, 100], type: 'gate', status: 'fault', lastInspection: '2026-06-07' },
  { id: uuidv4(), name: '阀门井V-007', position: [600, 250], type: 'check', status: 'normal', lastInspection: '2026-06-07' },
  { id: uuidv4(), name: '阀门井V-008', position: [750, 250], type: 'butterfly', status: 'normal', lastInspection: '2026-05-30' },
  { id: uuidv4(), name: '阀门井V-009', position: [100, 400], type: 'gate', status: 'normal', lastInspection: '2026-06-06' },
  { id: uuidv4(), name: '阀门井V-010', position: [250, 400], type: 'butterfly', status: 'normal', lastInspection: '2026-06-06' },
  { id: uuidv4(), name: '阀门井V-011', position: [250, 550], type: 'check', status: 'normal', lastInspection: '2026-06-06' },
  { id: uuidv4(), name: '阀门井V-012', position: [400, 550], type: 'gate', status: 'maintenance', lastInspection: '2026-06-02' },
  { id: uuidv4(), name: '阀门井V-013', position: [450, 400], type: 'butterfly', status: 'normal', lastInspection: '2026-05-25' },
  { id: uuidv4(), name: '阀门井V-014', position: [600, 400], type: 'gate', status: 'normal', lastInspection: '2026-05-25' },
  { id: uuidv4(), name: '阀门井V-015', position: [350, 275], type: 'check', status: 'normal', lastInspection: '2026-06-05' },
  { id: uuidv4(), name: '阀门井V-016', position: [500, 275], type: 'butterfly', status: 'normal', lastInspection: '2026-06-05' },
  { id: uuidv4(), name: '阀门井V-017', position: [500, 425], type: 'gate', status: 'normal', lastInspection: '2026-06-05' },
  { id: uuidv4(), name: '阀门井V-018', position: [350, 425], type: 'check', status: 'fault', lastInspection: '2026-06-03' },
];

export const mockRoutes: InspectionRoute[] = [
  {
    id: uuidv4(),
    name: '东城区巡检路线',
    date: '2026-06-08',
    inspector: '张伟',
    distance: 3.2,
    duration: 120,
    points: [
      { id: uuidv4(), timestamp: '2026-06-08 09:00', position: [100, 150], inspector: '张伟', notes: '起点，阀门井检查正常', photos: [] },
      { id: uuidv4(), timestamp: '2026-06-08 09:30', position: [250, 150], inspector: '张伟', notes: '管段A-001检查完成', photos: ['photo-001'] },
      { id: uuidv4(), timestamp: '2026-06-08 10:15', position: [250, 300], inspector: '张伟', notes: '管段A-002检查完成，阀门井需要维护', photos: ['photo-002'] },
      { id: uuidv4(), timestamp: '2026-06-08 11:00', position: [400, 300], inspector: '张伟', notes: '终点，管段A-003未巡检', photos: [] },
    ],
  },
  {
    id: uuidv4(),
    name: '西城区巡检路线',
    date: '2026-06-07',
    inspector: '李明',
    distance: 2.8,
    duration: 105,
    points: [
      { id: uuidv4(), timestamp: '2026-06-07 14:00', position: [450, 100], inspector: '李明', notes: '起点', photos: [] },
      { id: uuidv4(), timestamp: '2026-06-07 14:20', position: [600, 100], inspector: '李明', notes: '管段B-001检查完成，发现阀门故障', photos: ['photo-003'] },
      { id: uuidv4(), timestamp: '2026-06-07 15:00', position: [600, 250], inspector: '李明', notes: '管段B-002检查完成', photos: [] },
      { id: uuidv4(), timestamp: '2026-06-07 15:45', position: [750, 250], inspector: '李明', notes: '终点', photos: [] },
    ],
  },
  {
    id: uuidv4(),
    name: '南城区巡检路线',
    date: '2026-06-06',
    inspector: '王芳',
    distance: 3.5,
    duration: 130,
    points: [
      { id: uuidv4(), timestamp: '2026-06-06 08:30', position: [100, 400], inspector: '王芳', notes: '起点', photos: [] },
      { id: uuidv4(), timestamp: '2026-06-06 08:45', position: [250, 400], inspector: '王芳', notes: '管段C-001检查完成', photos: ['photo-004'] },
      { id: uuidv4(), timestamp: '2026-06-06 09:30', position: [250, 550], inspector: '王芳', notes: '管段C-002检查完成', photos: [] },
      { id: uuidv4(), timestamp: '2026-06-06 10:15', position: [400, 550], inspector: '王芳', notes: '管段C-003检查完成，阀门井维护中', photos: ['photo-005'] },
    ],
  },
];

export const mockHazards: Hazard[] = [
  {
    id: uuidv4(),
    type: 'leak',
    level: 'severe',
    location: '东城区管段A-002',
    position: [250, 225],
    description: '管道接口处发现渗漏，有水渍渗出',
    reporter: '张伟',
    reportedAt: '2026-06-08 10:20',
    status: 'processing',
    photos: ['photo-002'],
    suggestion: '建议立即安排维修人员进行接口密封处理，必要时更换密封圈。预计维修时间4小时，需要临时关闭相关管段阀门。',
  },
  {
    id: uuidv4(),
    type: 'blockage',
    level: 'moderate',
    location: '西城区管段B-001',
    position: [525, 100],
    description: '管道内有堵塞现象，水流速度明显下降',
    reporter: '李明',
    reportedAt: '2026-06-07 14:30',
    status: 'pending',
    photos: ['photo-003'],
    suggestion: '建议使用高压水枪进行管道冲洗，如无法疏通则需要开挖检查。预计处理时间2-3小时。',
  },
  {
    id: uuidv4(),
    type: 'damage',
    level: 'critical',
    location: '中心区管段E-004',
    position: [350, 350],
    description: '管道外壁发现裂纹，有破裂风险',
    reporter: '刘强',
    reportedAt: '2026-06-05 11:30',
    status: 'processing',
    photos: ['photo-006'],
    suggestion: '危急隐患！建议立即关闭相关阀门，设置警示标志，组织紧急维修队伍进行管道更换。预计维修时间8小时。',
  },
  {
    id: uuidv4(),
    type: 'leak',
    level: 'minor',
    location: '南城区管段C-001',
    position: [175, 400],
    description: '管道表面有轻微水痕，渗漏量较小',
    reporter: '王芳',
    reportedAt: '2026-06-06 09:00',
    status: 'resolved',
    photos: ['photo-004'],
    suggestion: '已完成修复，采用密封胶进行临时处理，建议下次巡检时重点关注。',
  },
  {
    id: uuidv4(),
    type: 'other',
    level: 'moderate',
    location: '北城区阀门井V-014',
    position: [600, 400],
    description: '阀门井井盖破损，存在安全隐患',
    reporter: '陈静',
    reportedAt: '2026-06-04 16:00',
    status: 'pending',
    photos: ['photo-007'],
    suggestion: '建议更换新井盖，设置临时防护措施。预计处理时间1小时。',
  },
];

const img1 = createPlaceholderImage('normal', '管段A-001正常');
const img2 = createPlaceholderImage('leak', '管段A-002渗漏');
const img3 = createPlaceholderImage('blockage', '管段B-001堵塞');
const img4 = createPlaceholderImage('leak', '管段C-001轻微渗漏');
const img5 = createPlaceholderImage('valve', '阀门井维护');
const img6 = createPlaceholderImage('damage', '管段E-004裂纹');
const img7 = createPlaceholderImage('damage', '井盖破损');
const img8 = createPlaceholderImage('valve', '阀门井V-001');
const img9 = createPlaceholderImage('site', '巡检现场');
const img10 = createPlaceholderImage('equipment', '流量计检查');
const img11 = createPlaceholderImage('document', '管网图纸');
const img12 = createPlaceholderImage('repair', '维修作业');

export const mockPhotos: Photo[] = [
  { id: 'photo-001', url: img1.url, thumbnail: img1.thumbnail, title: '管段A-001正常', takenAt: '2026-06-08 09:35', location: '东城区', category: 'site', tags: ['管段', '正常'] },
  { id: 'photo-002', url: img2.url, thumbnail: img2.thumbnail, title: '管段A-002渗漏', takenAt: '2026-06-08 10:18', location: '东城区', hazardId: mockHazards[0].id, category: 'hazard', tags: ['渗漏', '严重'] },
  { id: 'photo-003', url: img3.url, thumbnail: img3.thumbnail, title: '管段B-001堵塞', takenAt: '2026-06-07 14:25', location: '西城区', hazardId: mockHazards[1].id, category: 'hazard', tags: ['堵塞', '一般'] },
  { id: 'photo-004', url: img4.url, thumbnail: img4.thumbnail, title: '管段C-001轻微渗漏', takenAt: '2026-06-06 08:50', location: '南城区', hazardId: mockHazards[3].id, category: 'hazard', tags: ['渗漏', '轻微'] },
  { id: 'photo-005', url: img5.url, thumbnail: img5.thumbnail, title: '阀门井维护', takenAt: '2026-06-06 10:20', location: '南城区', category: 'equipment', tags: ['阀门井', '维护'] },
  { id: 'photo-006', url: img6.url, thumbnail: img6.thumbnail, title: '管段E-004裂纹', takenAt: '2026-06-05 11:35', location: '中心区', hazardId: mockHazards[2].id, category: 'hazard', tags: ['破损', '危急'] },
  { id: 'photo-007', url: img7.url, thumbnail: img7.thumbnail, title: '阀门井井盖破损', takenAt: '2026-06-04 16:05', location: '北城区', hazardId: mockHazards[4].id, category: 'hazard', tags: ['井盖', '破损'] },
  { id: 'photo-008', url: img8.url, thumbnail: img8.thumbnail, title: '阀门井V-001', takenAt: '2026-06-08 09:05', location: '东城区', category: 'equipment', tags: ['阀门井', '正常'] },
  { id: 'photo-009', url: img9.url, thumbnail: img9.thumbnail, title: '巡检现场', takenAt: '2026-06-07 14:00', location: '西城区', category: 'site', tags: ['巡检', '现场'] },
  { id: 'photo-010', url: img10.url, thumbnail: img10.thumbnail, title: '流量计检查', takenAt: '2026-06-06 09:15', location: '南城区', category: 'equipment', tags: ['设备', '检查'] },
  { id: 'photo-011', url: img11.url, thumbnail: img11.thumbnail, title: '管网图纸', takenAt: '2026-06-05 10:00', location: '中心区', category: 'site', tags: ['图纸', '资料'] },
  { id: 'photo-012', url: img12.url, thumbnail: img12.thumbnail, title: '维修作业', takenAt: '2026-06-04 14:30', location: '北城区', category: 'site', tags: ['维修', '作业'] },
];

// Update hazard photos with actual photo IDs
mockHazards[0].photos = ['photo-002'];
mockHazards[1].photos = ['photo-003'];
mockHazards[2].photos = ['photo-006'];
mockHazards[3].photos = ['photo-004'];
mockHazards[4].photos = ['photo-007'];

export const mockInspectors: Inspector[] = [
  { id: uuidv4(), name: '张伟', inspectionCount: 12, totalDistance: 38.5, hazardReported: 5 },
  { id: uuidv4(), name: '李明', inspectionCount: 10, totalDistance: 32.1, hazardReported: 3 },
  { id: uuidv4(), name: '王芳', inspectionCount: 11, totalDistance: 35.8, hazardReported: 4 },
  { id: uuidv4(), name: '刘强', inspectionCount: 8, totalDistance: 28.2, hazardReported: 2 },
  { id: uuidv4(), name: '陈静', inspectionCount: 9, totalDistance: 30.5, hazardReported: 3 },
];

export const mockAreas = areas;
export const mockMaterials = materials;
export const mockInspectorNames = inspectors;
