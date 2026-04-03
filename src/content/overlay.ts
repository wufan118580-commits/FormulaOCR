// 截图覆盖层管理
export class OverlayManager {
  private overlay: HTMLElement | null = null;
  private selectionBox: HTMLElement | null = null;
  private dimensions: HTMLElement | null = null;
  private toolbar: HTMLElement | null = null;
  private hint: HTMLElement | null = null;

  private isSelecting = false;
  private startPoint: { x: number; y: number } | null = null;
  private currentRegion: { x: number; y: number; width: number; height: number } | null = null;

  private onConfirm: ((region: { x: number; y: number; width: number; height: number }) => void) | null = null;
  private onCancel: (() => void) | null = null;

  constructor() {
    this.createOverlay();
    this.attachEventListeners();
  }

  private createOverlay(): void {
    // 创建遮罩层
    this.overlay = document.createElement('div');
    this.overlay.id = 'formula-ocr-overlay';
    document.body.appendChild(this.overlay);

    // 创建选择框
    this.selectionBox = document.createElement('div');
    this.selectionBox.id = 'formula-ocr-selection-box';
    document.body.appendChild(this.selectionBox);

    // 创建尺寸标签
    this.dimensions = document.createElement('div');
    this.dimensions.id = 'formula-ocr-dimensions';
    document.body.appendChild(this.dimensions);

    // 创建工具栏
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'formula-ocr-toolbar';
    this.toolbar.innerHTML = `
      <button class="secondary" id="formula-ocr-cancel">取消</button>
      <button class="primary" id="formula-ocr-confirm">识别公式</button>
    `;
    document.body.appendChild(this.toolbar);

    // 创建提示
    this.hint = document.createElement('div');
    this.hint.id = 'formula-ocr-hint';
    this.hint.textContent = '拖动鼠标选择公式区域';
    document.body.appendChild(this.hint);

    // 加载样式
    this.loadStyles();
  }

  private loadStyles(): void {
    const styleId = 'formula-ocr-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #formula-ocr-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.3);
          z-index: 2147483647;
          cursor: crosshair;
          display: none;
          isolation: isolate;
        }
        #formula-ocr-overlay.active { display: block; }
        #formula-ocr-selection-box {
          position: fixed;
          border: 3px solid #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
          pointer-events: none;
          display: none;
          z-index: 2147483648;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5),
                      0 0 20px rgba(239, 68, 68, 0.5);
          isolation: isolate;
        }
        #formula-ocr-selection-box.active { display: block; }
        #formula-ocr-dimensions {
          position: fixed;
          background-color: #ef4444;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          pointer-events: none;
          white-space: nowrap;
          display: none;
          z-index: 2147483649;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          isolation: isolate;
        }
        #formula-ocr-dimensions.active { display: block; }
        #formula-ocr-toolbar {
          position: fixed;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          padding: 12px 20px;
          display: none;
          z-index: 2147483650;
          isolation: isolate;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        #formula-ocr-toolbar.active { display: flex; gap: 12px; }
        #formula-ocr-toolbar button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        #formula-ocr-toolbar button.primary {
          background-color: #ef4444;
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        #formula-ocr-toolbar button.primary:hover {
          background-color: #dc2626;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          transform: translateY(-1px);
        }
        #formula-ocr-toolbar button.primary:active { transform: translateY(0); }
        #formula-ocr-toolbar button.secondary {
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
        }
        #formula-ocr-toolbar button.secondary:hover { background-color: #e5e7eb; }
        #formula-ocr-hint {
          position: fixed;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          z-index: 2147483650;
          display: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          isolation: isolate;
        }
        #formula-ocr-hint.active { display: block; }
      `;
      document.head.appendChild(style);
    }
  }

  private attachEventListeners(): void {
    if (!this.overlay) return;

    // 鼠标按下
    this.overlay.addEventListener('mousedown', (e) => {
      this.isSelecting = true;
      this.startPoint = { x: e.clientX, y: e.clientY };
      this.selectionBox?.classList.add('active');
    });

    // 鼠标移动
    document.addEventListener('mousemove', (e) => {
      // 选择中更新选择框
      if (!this.isSelecting || !this.startPoint || !this.selectionBox) return;

      const width = e.clientX - this.startPoint.x;
      const height = e.clientY - this.startPoint.y;

      const left = width < 0 ? e.clientX : this.startPoint.x;
      const top = height < 0 ? e.clientY : this.startPoint.y;

      this.selectionBox.style.left = `${left}px`;
      this.selectionBox.style.top = `${top}px`;
      this.selectionBox.style.width = `${Math.abs(width)}px`;
      this.selectionBox.style.height = `${Math.abs(height)}px`;

      // 更新尺寸标签
      if (this.dimensions) {
        this.dimensions.textContent = `${Math.abs(width)} × ${Math.abs(height)}`;
        this.dimensions.style.left = `${e.clientX + 10}px`;
        this.dimensions.style.top = `${e.clientY + 10}px`;
        this.dimensions.classList.add('active');
      }

      this.currentRegion = {
        x: left,
        y: top,
        width: Math.abs(width),
        height: Math.abs(height),
      };
    });

    // 鼠标抬起
    document.addEventListener('mouseup', (e) => {
      if (!this.isSelecting) return;

      this.isSelecting = false;
      this.hint?.classList.remove('active');
      this.dimensions?.classList.remove('active');

      // 如果选择了有效区域，显示工具栏
      if (
        this.currentRegion &&
        this.currentRegion.width > 10 &&
        this.currentRegion.height > 10
      ) {
        this.toolbar?.classList.add('active');
      }
    });

    // 取消按钮
    document.getElementById('formula-ocr-cancel')?.addEventListener('click', () => {
      this.hide();
      this.onCancel?.();
    });

    // 确认按钮
    document.getElementById('formula-ocr-confirm')?.addEventListener('click', () => {
      if (this.currentRegion) {
        this.hide();
        this.onConfirm?.(this.currentRegion);
      }
    });
  }

  startSelection(
    onConfirm: (region: { x: number; y: number; width: number; height: number }) => void,
    onCancel: () => void
  ): void {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;

    // 重置状态
    this.isSelecting = false;
    this.startPoint = null;
    this.currentRegion = null;

    // 显示遮罩层
    this.overlay?.classList.add('active');
    this.hint?.classList.add('active');

    // 隐藏工具栏
    this.toolbar?.classList.remove('active');
    this.selectionBox?.classList.remove('active');
    this.dimensions?.classList.remove('active');
  }

  hide(): void {
    this.overlay?.classList.remove('active');
    this.hint?.classList.remove('active');
    this.toolbar?.classList.remove('active');
    this.selectionBox?.classList.remove('active');
    this.dimensions?.classList.remove('active');
  }

  destroy(): void {
    this.overlay?.remove();
    this.selectionBox?.remove();
    this.dimensions?.remove();
    this.toolbar?.remove();
    this.hint?.remove();
  }
}
