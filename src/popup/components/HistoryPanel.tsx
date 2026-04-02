import React, { useState, useEffect } from 'react';
import { HistoryItem } from '@/shared/types';

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await chrome.storage.local.get(['history']);
    setHistory(data.history || []);
  };

  const handleClearHistory = async () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      await chrome.storage.local.remove(['history']);
      setHistory([]);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyLatex = (latex: string) => {
    navigator.clipboard.writeText(latex);
    alert('已复制到剪贴板');
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">历史记录</h2>
        <button
          onClick={handleClearHistory}
          className="text-sm text-red-600 hover:text-red-700"
        >
          清空
        </button>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>暂无历史记录</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <img
                  src={item.image}
                  alt="formula"
                  className="w-16 h-16 object-contain bg-white rounded border border-gray-200"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">
                    {formatDate(item.timestamp)}
                  </div>
                  <div className="text-sm text-gray-800 truncate">
                    {item.latex}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    置信度: {(item.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleCopyLatex(item.latex)}
                  className="p-1 text-blue-600 hover:text-blue-700"
                  title="复制"
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
      >
        关闭
      </button>
    </div>
  );
}
