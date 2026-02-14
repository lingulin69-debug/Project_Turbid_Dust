/**
 * Project Turbid Dust - 全局常量定义
 */

// === 地图配置 ===
export const MAP_CONFIG = {
  // 地图尺寸（优化后从 4096x2160 减少到 2048x1080）
  WIDTH: 2048,
  HEIGHT: 1080,

  // 缩放限制
  SCALE_MIN: 0.5,
  SCALE_MAX: 2,
  SCALE_STEP: 0.1,

  // 性能优化
  USE_WILL_CHANGE: true,
  USE_GPU_ACCELERATION: true
} as const;

// === Z-Index 层级管理 ===
export const Z_INDEX = {
  MAP_BASE: 0,
  MAP_OVERLAY: 10,
  HUD_ELEMENTS: 50,
  MODALS_BACKDROP: 60,
  MODALS: 70,
  DEV_PANEL: 200,
  TOOLTIPS: 250
} as const;

// === UI 尺寸 ===
export const UI_SIZE = {
  // 最小点击区域（遵循可访问性标准）
  MIN_TOUCH_TARGET: 44, // 44px

  // 按钮尺寸
  BUTTON_SM: 32,
  BUTTON_MD: 40,
  BUTTON_LG: 48,

  // Modal 宽度
  MODAL_SM: 400,
  MODAL_MD: 500,
  MODAL_LG: 600,

  // 断点
  BREAKPOINT_SM: 640,
  BREAKPOINT_MD: 768,
  BREAKPOINT_LG: 1024
} as const;

// === 天平配置 ===
export const BALANCE_CONFIG = {
  MIN: 0,
  MAX: 100,
  BALANCED: 50,

  // 倾斜角度计算
  ROTATION_MULTIPLIER: 0.3,
  MAX_ROTATION: 15,

  // 阈值
  TURBID_THRESHOLD: 45,
  PURE_THRESHOLD: 55
} as const;

// === 游戏配置 ===
export const GAME_CONFIG = {
  MAX_INVENTORY_SIZE: 12,
  DAILY_COIN_LIMIT: 15,
  INITIAL_COINS: 10,

  // 漂流瓶
  DRIFT_BOTTLE_COST: 5,
  DRIFT_MESSAGE_MAX_WORDS: 5,

  // 礼物系统
  BREATHING_COST: 1
} as const;

// === 性能优化配置 ===
export const PERFORMANCE_CONFIG = {
  // 降低模糊半径以提升性能
  BLUR_RADIUS: 4, // 从 20px 降到 4px

  // 防抖/节流延迟
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,

  // 虚拟化
  ENABLE_VIRTUALIZATION: false, // 未来可启用
  VIEWPORT_BUFFER: 100
} as const;

// === 动画配置 ===
export const ANIMATION_CONFIG = {
  // 减少动画以提升性能
  REDUCE_MOTION: false, // 可根据用户偏好设置

  // 动画时长
  DURATION_FAST: 150,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 500,

  // Spring 配置
  SPRING_STIFF: 60,
  SPRING_DAMP: 10
} as const;

// === 颜色配置 ===
export const COLORS = {
  FACTION_TURBID: '#9333ea', // purple-600
  FACTION_PURE: '#eab308',   // yellow-500

  SUCCESS: '#22c55e', // green-500
  ERROR: '#ef4444',   // red-500
  WARNING: '#f59e0b', // amber-500
  INFO: '#3b82f6'     // blue-500
} as const;
