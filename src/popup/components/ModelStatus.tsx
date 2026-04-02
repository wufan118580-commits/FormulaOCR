import React from 'react';
import { ModelStatus as ModelStatusType } from '../../../shared/types';

interface ModelStatusProps {
  status: ModelStatusType;
  label: string;
}

const STATUS_STYLES: Record<
  ModelStatusType,
  { bgColor: string; textColor: string; icon: string }
> = {
  uninitialized: {
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: '⚠️',
  },
  downloading: {
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    icon: '⏳',
  },
  loading: {
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: '⏳',
  },
  ready: {
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    icon: '✅',
  },
  error: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: '❌',
  },
};

export default function ModelStatus({ status, label }: ModelStatusProps) {
  const style = STATUS_STYLES[status];
  const isLoading = status === 'downloading' || status === 'loading';

  return (
    <div className={`${style.bgColor} ${style.textColor} px-4 py-3 flex items-center gap-3`}>
      <span className="text-xl">{style.icon}</span>
      <div className="flex-1">
        <div className="font-medium text-sm">模型状态: {label}</div>
        {isLoading && (
          <div className="text-xs mt-1 text-gray-500">请稍候，首次使用需要下载模型 (~120MB)</div>
        )}
      </div>
      {isLoading && <div className="spinner"></div>}
    </div>
  );
}
