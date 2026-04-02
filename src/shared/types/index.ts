// 图像区域类型
export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 推理结果类型
export interface InferenceResult {
  latex: string;
  confidence: number;
  processingTime: number;
  timestamp: number;
}

// 历史记录类型
export interface HistoryItem {
  id: string;
  image: string; // base64 编码的图像
  latex: string;
  confidence: number;
  timestamp: number;
}

// 模型状态类型
export type ModelStatus =
  | 'uninitialized'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'error';

// 模型配置类型
export interface ModelConfig {
  encoderPath: string;
  decoderPath: string;
  vocabPath: string;
  quantization: 'int8' | 'fp16' | 'fp32';
}

// 插件配置类型
export interface ExtensionConfig {
  modelVersion: string;
  autoDownload: boolean;
  maxHistorySize: number;
  language: 'zh' | 'en';
}

// 消息类型
export type MessageType =
  | 'CAPTURE_START'
  | 'CAPTURE_COMPLETE'
  | 'INFERENCE_START'
  | 'INFERENCE_COMPLETE'
  | 'INFERENCE_ERROR'
  | 'MODEL_STATUS_UPDATE'
  | 'GET_MODEL_STATUS'
  | 'CLEAR_HISTORY'
  | 'SAVE_HISTORY';

// 消息数据类型
export interface MessageData {
  type: MessageType;
  payload?: any;
}

// 截图模式
export type CaptureMode = 'region' | 'fullscreen';

// 预处理配置
export interface PreprocessConfig {
  targetSize: number;
  mean: number[];
  std: number[];
}
