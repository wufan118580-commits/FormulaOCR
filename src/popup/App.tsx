import React, { useState, useEffect } from 'react';
import ModelStatus from './components/ModelStatus';
import CaptureButtons from './components/CaptureButtons';
import ResultPreview from './components/ResultPreview';
import HistoryPanel from './components/HistoryPanel';
import { ModelStatus as ModelStatusType } from '@/shared/types';
import { MODEL_STATUS, SUCCESS_MESSAGES } from '@/shared/constants';

const MODEL_STATUS_LABELS: Record<ModelStatusType, string> = {
  uninitialized: '未初始化',
  downloading: '下载中...',
  loading: '加载中...',
  ready: '就绪',
  error: '错误',
};

export default function App() {
  const [modelStatus, setModelStatus] = useState<ModelStatusType>('uninitialized');
  const [showHistory, setShowHistory] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  useEffect(() => {
    // 检查模型状态
    chrome.storage.local.get(['modelStatus'], (data) => {
      if (data.modelStatus) {
        setModelStatus(data.modelStatus);
      }
    });

    // 监听来自 background 的消息
    const handleMessage = (message: any) => {
      console.log('Popup received message:', message);

      switch (message.type) {
        case 'MODEL_STATUS_UPDATE':
          setModelStatus(message.payload.status);
          break;
        case 'INFERENCE_COMPLETE':
          setResult(message.payload.latex);
          setConfidence(message.payload.confidence);
          setProcessingTime(message.payload.processingTime);
          break;
        case 'INFERENCE_ERROR':
          alert('识别失败: ' + message.payload.error);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleCaptureRegion = async () => {
    try {
      // 获取当前活动的标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (!tab || !tab.id) {
        alert('无法获取当前页面信息');
        return;
      }

      // 检查是否在受限页面（如 chrome://、edge:// 等）
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('devtools://'))) {
        alert('不能在浏览器内置页面截图\n\n请访问普通网页（如 https://www.baidu.com）后再试');
        return;
      }

      console.log('Sending message to tab:', tab.id, tab.url);

      // 直接发送截图命令（content script 应该已经通过 manifest 自动注入）
      await chrome.tabs.sendMessage(tab.id, {
        type: 'START_REGION_CAPTURE',
      });

      // 关闭 popup 以便截图
      window.close();
    } catch (error) {
      console.error('Failed to capture:', error);
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      alert(`截图失败: ${errorMsg}\n\n提示:\n1. 请刷新页面后重试\n2. 或访问其他网页测试\n3. 不要在 edge:// 或 chrome:// 页面使用`);
    }
  };

  const handleCaptureFullscreen = async () => {
    try {
      // 获取当前活动的标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (!tab || !tab.id) {
        alert('无法获取当前页面信息');
        return;
      }

      // 检查是否在受限页面
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('devtools://'))) {
        alert('不能在浏览器内置页面截图\n\n请访问普通网页（如 https://www.baidu.com）后再试');
        return;
      }

      console.log('Sending fullscreen capture to tab:', tab.id, tab.url);

      // 直接发送全屏截图命令
      await chrome.tabs.sendMessage(tab.id, {
        type: 'START_FULLSCREEN_CAPTURE',
      });

      // 关闭 popup
      window.close();
    } catch (error) {
      console.error('Failed to capture:', error);
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      alert(`截图失败: ${errorMsg}\n\n提示:\n1. 请刷新页面后重试\n2. 或访问其他网页测试\n3. 不要在 edge:// 或 chrome:// 页面使用`);
    }
  };

  const handleCopyLatex = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert('已复制到剪贴板');
    }
  };

  const handleClearResult = () => {
    setResult(null);
    setConfidence(null);
    setProcessingTime(null);
  };

  return (
    <div className="w-[380px] min-h-[500px] bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📐</span>
              FormulaOCR
            </h1>
            <p className="text-xs text-blue-100 mt-1">公式识别 · 纯前端推理</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            title="历史记录"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Model Status */}
      <ModelStatus status={modelStatus} label={MODEL_STATUS_LABELS[modelStatus]} />

      {/* Main Content */}
      <div className="p-4">
        {!showHistory ? (
          <>
            {/* Capture Buttons */}
            <CaptureButtons
              onCaptureRegion={handleCaptureRegion}
              onCaptureFullscreen={handleCaptureFullscreen}
              disabled={false}  // 开发阶段始终可用
            />

            {/* Result Preview */}
            {result ? (
              <ResultPreview
                latex={result}
                confidence={confidence}
                processingTime={processingTime}
                onCopy={handleCopyLatex}
                onClear={handleClearResult}
              />
            ) : (
              <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">点击上方按钮开始截图识别</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <HistoryPanel onClose={() => setShowHistory(false)} />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t">
        <div className="flex justify-between">
          <span>v1.0.0</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => chrome.runtime.openOptionsPage()}>
            设置
          </span>
        </div>
      </div>
    </div>
  );
}
