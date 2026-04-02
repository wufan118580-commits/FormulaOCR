import { OverlayManager } from './overlay';

let overlayManager: OverlayManager | null = null;

// 初始化
function init() {
  console.log('FormulaOCR content script initialized');
}

// 启动区域截图
async function startRegionCapture() {
  return new Promise<{ imageData: ImageData; region: any }>((resolve, reject) => {
    if (!overlayManager) {
      overlayManager = new OverlayManager();
    }

    overlayManager.startSelection(
      async (region) => {
        try {
          const imageData = await captureRegion(region);
          resolve({ imageData, region });
        } catch (error) {
          reject(error);
        }
      },
      () => {
        reject(new Error('Screenshot cancelled'));
      }
    );
  });
}

// 捕获指定区域
async function captureRegion(
  region: { x: number; y: number; width: number; height: number }
): Promise<ImageData> {
  // 使用 html2canvas 或者直接用 Chrome API
  // 这里简化实现，使用 canvas

  return new Promise((resolve, reject) => {
    try {
      // 方法 1: 使用 chrome.tabs.captureVisibleTab (需要 background script 支持)
      // 方法 2: 直接使用 canvas (只能捕获可见部分)

      // 这里使用 canvas 方法
      const canvas = document.createElement('canvas');
      canvas.width = region.width;
      canvas.height = region.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // 获取整个页面的截图
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const img = new Image();
        img.onload = () => {
          // 从截图中提取指定区域
          ctx.drawImage(img, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
          const imageData = ctx.getImageData(0, 0, region.width, region.height);
          resolve(imageData);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 全屏截图
async function captureFullscreen(): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  });
}

// ImageData 转 base64
function imageDataToBase64(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

// 监听来自 popup/background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  console.log('Current URL:', window.location.href);

  switch (message.type) {
    case 'START_REGION_CAPTURE':
      handleRegionCapture();
      break;
    case 'START_FULLSCREEN_CAPTURE':
      handleFullscreenCapture();
      break;
  }

  return true; // 保持消息通道打开
});

// 处理区域截图
async function handleRegionCapture() {
  try {
    console.log('Starting region capture...');
    const { imageData, region } = await startRegionCapture();

    // 转换为 base64
    const base64 = imageDataToBase64(imageData);

    console.log('Capture completed, sending to background...');

    // 发送到 background script
    chrome.runtime.sendMessage({
      type: 'CAPTURE_COMPLETE',
      payload: {
        image: base64,
        region,
        timestamp: Date.now(),
      },
    });

    // 重新打开 popup
    chrome.action.openPopup();
  } catch (error) {
    console.error('Region capture failed:', error);

    chrome.runtime.sendMessage({
      type: 'CAPTURE_ERROR',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

// 处理全屏截图
async function handleFullscreenCapture() {
  try {
    console.log('Starting fullscreen capture...');
    const imageData = await captureFullscreen();
    const base64 = imageDataToBase64(imageData);

    console.log('Capture completed, sending to background...');

    chrome.runtime.sendMessage({
      type: 'CAPTURE_COMPLETE',
      payload: {
        image: base64,
        region: null,
        timestamp: Date.now(),
      },
    });

    chrome.action.openPopup();
  } catch (error) {
    console.error('Fullscreen capture failed:', error);

    chrome.runtime.sendMessage({
      type: 'CAPTURE_ERROR',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

// 页面加载时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
