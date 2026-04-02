import React, { useState, useEffect } from 'react';
import { ExtensionConfig } from '@/shared/types';
import { DEFAULT_CONFIG } from '@/shared/constants';

export default function App() {
  const [config, setConfig] = useState<ExtensionConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const data = await chrome.storage.local.get(['config']);
    if (data.config) {
      setConfig(data.config);
    }
  };

  const handleSave = async () => {
    await chrome.storage.local.set({ config });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    if (window.confirm('确定要重置所有设置吗？')) {
      setConfig(DEFAULT_CONFIG);
      await chrome.storage.local.set({ config: DEFAULT_CONFIG });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      await chrome.storage.local.remove(['history']);
      alert('历史记录已清空');
    }
  };

  return (
    <div className="min-w-[600px] min-h-[400px] bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📐</span>
          <div>
            <h1 className="text-2xl font-bold">FormulaOCR</h1>
            <p className="text-sm text-blue-100">设置</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-3xl">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">通用设置</h2>

          <div className="space-y-4">
            {/* Model Version */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">模型版本</div>
                <div className="text-sm text-gray-500">
                  当前使用的模型版本
                </div>
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {config.modelVersion}
              </div>
            </div>

            {/* Auto Download */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">自动下载模型</div>
                <div className="text-sm text-gray-500">
                  首次使用时自动下载模型
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoDownload}
                  onChange={(e) =>
                    setConfig({ ...config, autoDownload: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">语言</div>
                <div className="text-sm text-gray-500">界面显示语言</div>
              </div>
              <select
                value={config.language}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    language: e.target.value as 'zh' | 'en',
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            历史记录
          </h2>

          <div className="space-y-4">
            {/* Max History Size */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-700">最大历史记录数</div>
                <div className="text-sm text-gray-500">
                  保存的历史记录最大数量
                </div>
              </div>
              <input
                type="number"
                min="10"
                max="1000"
                value={config.maxHistorySize}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxHistorySize: parseInt(e.target.value) || 50,
                  })
                }
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Clear History Button */}
            <div>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                清空历史记录
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            保存设置
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            重置默认
          </button>
          {saved && (
            <span className="text-green-600 font-medium self-center ml-2">
              ✓ 已保存
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-6 py-3 text-xs text-gray-500 text-center">
        FormulaOCR v1.0.0 - 浏览器公式识别插件
      </div>
    </div>
  );
}
