import { ModelStatus } from '@/shared/types';
import { MODEL_STATUS, DEFAULT_CONFIG, CACHE_KEYS } from '@/shared/constants';

// 模型状态
let currentModelStatus: ModelStatus = 'uninitialized';

// 初始化
async function init() {
  console.log('FormulaOCR background service worker initialized');

  // 加载配置
  await loadConfig();

  // 检查模型状态
  await checkModelStatus();

  // 监听安装事件
  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);

    if (details.reason === 'install') {
      // 首次安装
      await setModelStatus('uninitialized');
      await saveConfig(DEFAULT_CONFIG);
    }
  });
}

// 加载配置
async function loadConfig() {
  const data = await chrome.storage.local.get([CACHE_KEYS.CONFIG]);
  if (!data[CACHE_KEYS.CONFIG]) {
    await saveConfig(DEFAULT_CONFIG);
  }
}

// 保存配置
async function saveConfig(config: any) {
  await chrome.storage.local.set({ [CACHE_KEYS.CONFIG]: config });
}

// 检查模型状态
async function checkModelStatus() {
  const data = await chrome.storage.local.get([CACHE_KEYS.MODEL_STATUS]);
  currentModelStatus = data[CACHE_KEYS.MODEL_STATUS] || 'uninitialized';
}

// 设置模型状态
async function setModelStatus(status: ModelStatus) {
  currentModelStatus = status;
  await chrome.storage.local.set({ [CACHE_KEYS.MODEL_STATUS]: status });

  // 通知所有页面
  notifyModelStatusChange(status);
}

// 通知模型状态变更
function notifyModelStatusChange(status: ModelStatus) {
  chrome.runtime.sendMessage({
    type: 'MODEL_STATUS_UPDATE',
    payload: { status },
  });

  // 通知所有标签页
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'MODEL_STATUS_UPDATE',
          payload: { status },
        }).catch(() => {
          // 忽略错误（某些页面可能无法接收消息）
        });
      }
    });
  });
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  handleAsyncMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    });

  return true; // 保持消息通道打开以支持异步响应
});

// 异步处理消息
async function handleAsyncMessage(message: any, sender: any) {
  switch (message.type) {
    case 'GET_MODEL_STATUS':
      return { status: currentModelStatus };

    case 'CAPTURE_COMPLETE':
      // 收到截图，开始推理
      console.log('Screenshot received, starting inference...');
      // TODO: Phase 2 将实现实际的推理逻辑
      return { success: true, message: 'Screenshot received (inference not yet implemented)' };

    case 'CAPTURE_ERROR':
      console.error('Capture error:', message.payload.error);
      return { success: false, error: message.payload.error };

    case 'CLEAR_HISTORY':
      await chrome.storage.local.remove([CACHE_KEYS.HISTORY]);
      return { success: true };

    case 'SAVE_HISTORY':
      await saveHistoryItem(message.payload.item);
      return { success: true };

    case 'GET_CONFIG':
      const config = await chrome.storage.local.get([CACHE_KEYS.CONFIG]);
      return config[CACHE_KEYS.CONFIG] || DEFAULT_CONFIG;

    case 'UPDATE_CONFIG':
      await saveConfig(message.payload.config);
      return { success: true };

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// 保存历史记录项
async function saveHistoryItem(item: any) {
  const data = await chrome.storage.local.get([CACHE_KEYS.HISTORY]);
  const history = data[CACHE_KEYS.HISTORY] || [];

  // 添加新项
  history.unshift(item);

  // 限制历史记录数量
  const config = await chrome.storage.local.get([CACHE_KEYS.CONFIG]);
  const maxSize = config[CACHE_KEYS.CONFIG]?.maxHistorySize || 50;

  const trimmedHistory = history.slice(0, maxSize);

  await chrome.storage.local.set({ [CACHE_KEYS.HISTORY]: trimmedHistory });
}

// 初始化
init();
