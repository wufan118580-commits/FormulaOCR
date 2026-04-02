// 模型版本
export const MODEL_VERSION = 'v1.0-int8';

// 模型文件路径
export const MODEL_PATHS = {
  encoder: '/assets/models/encoder_int8.onnx',
  decoder: '/assets/models/decoder_int8.onnx',
  vocab: '/assets/models/vocab.json',
  config: '/assets/models/config.json',
} as const;

// 图像处理常量
export const IMAGE_CONFIG = {
  TARGET_SIZE: 384,
  MEAN: [0.485, 0.456, 0.406], // ImageNet 均值
  STD: [0.229, 0.224, 0.225],  // ImageNet 标准差
} as const;

// 性能常量
export const PERFORMANCE_CONFIG = {
  MAX_HISTORY_SIZE: 100,
  INFERENCE_TIMEOUT: 30000, // 30秒
  MODEL_LOAD_TIMEOUT: 60000, // 60秒
} as const;

// 缓存键
export const CACHE_KEYS = {
  MODEL_VERSION: 'model-version',
  MODEL_STATUS: 'model-status',
  HISTORY: 'history',
  CONFIG: 'config',
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  modelVersion: MODEL_VERSION,
  autoDownload: true,
  maxHistorySize: 50,
  language: 'zh',
} as const;

// UI 常量
export const UI_CONFIG = {
  POPUP_WIDTH: 400,
  POPUP_HEIGHT: 600,
  OPTIONS_WIDTH: 800,
  OPTIONS_HEIGHT: 600,
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  MODEL_LOAD_FAILED: '模型加载失败，请重试',
  INFERENCE_FAILED: '公式识别失败，请重试',
  NETWORK_ERROR: '网络连接错误',
  INVALID_IMAGE: '无效的图像数据',
  CAPTURE_CANCELLED: '截图已取消',
  TIMEOUT: '操作超时，请重试',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  MODEL_LOADED: '模型加载完成',
  MODEL_UPDATED: '模型已更新',
  CAPTURED: '截图成功',
  COPIED: '已复制到剪贴板',
  SAVED: '已保存到历史记录',
} as const;
