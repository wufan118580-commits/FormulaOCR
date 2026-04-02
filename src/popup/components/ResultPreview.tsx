import React, { useEffect, useRef } from 'react';

interface ResultPreviewProps {
  latex: string;
  confidence: number | null;
  processingTime: number | null;
  onCopy: () => void;
  onClear: () => void;
}

export default function ResultPreview({
  latex,
  confidence,
  processingTime,
  onCopy,
  onClear,
}: ResultPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 动态加载 MathJax
    if (typeof window.MathJax === 'undefined') {
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        renderMath();
      };
    } else {
      renderMath();
    }
  }, [latex]);

  const renderMath = () => {
    if (window.MathJax && previewRef.current) {
      window.MathJax.typesetPromise([previewRef.current]).catch((err: any) => {
        console.error('MathJax rendering error:', err);
      });
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* LaTeX Preview */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">识别结果</span>
          <div className="flex gap-2">
            {confidence !== null && (
              <span className="text-xs text-gray-500">
                置信度: {(confidence * 100).toFixed(1)}%
              </span>
            )}
            {processingTime !== null && (
              <span className="text-xs text-gray-500">
                用时: {processingTime.toFixed(2)}s
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          {/* 渲染的公式 */}
          <div
            ref={previewRef}
            className="min-h-[60px] flex items-center justify-center text-lg mb-3"
          >
            {`$$${latex}$$`}
          </div>

          {/* LaTeX 代码 */}
          <div className="bg-gray-50 rounded p-2 mt-2">
            <div className="text-xs text-gray-500 mb-1">LaTeX 代码:</div>
            <code className="text-sm text-gray-800 break-all">{latex}</code>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCopy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <svg
            className="w-4 h-4"
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
          复制 LaTeX
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          清除
        </button>
      </div>
    </div>
  );
}
