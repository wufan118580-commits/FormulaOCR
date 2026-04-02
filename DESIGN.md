# 浏览器公式识别插件 - 设计文档

## 1. 项目概述

### 1.1 项目名称
FormulaOCR - 浏览器公式识别插件

### 1.2 项目目标
开发一个浏览器扩展插件，支持在浏览器中截图并识别数学公式，将其转换为 LaTeX 格式。所有推理在本地完成，无需后端服务。

### 1.3 核心特性
- 截图识别公式（支持区域选择和全屏截图）
- 纯前端推理（本地模型，无云端依赖）
- 快速响应时间（目标 < 3秒）
- 支持导出为 LaTeX 代码和复制到剪贴板
- 历史记录功能
- 离线可用

---

## 2. 技术架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Popup UI   │  │ Content UI  │  │ Options UI  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    业务逻辑层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ 截图管理器   │  │ 推理引擎    │  │ 结果处理器   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    模型层                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ ONNX Runtime│ │ 模型加载器   │ │ 缓存管理     │      │
│  │ Web Session │ │             │ │             │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    数据存储层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Chrome Storage│ │ IndexedDB   │ │ Cache API   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

#### 前端框架
- **Manifest V3**: Chrome/Edge 扩展标准
- **TypeScript**: 类型安全
- **React 18**: UI 框架（也可考虑使用原生 JS 或 Vue）
- **TailwindCSS**: 样式框架
- **Webpack/Vite**: 构建工具

#### 深度学习推理
- **ONNX Runtime Web**: 主要推理引擎
- **WebGL**: GPU 加速后端
- **WebAssembly**: CPU 后端

#### 图像处理
- **Canvas API**: 图像捕获和处理
- **html2canvas**: 可选，用于复杂页面截图

#### 存储
- **Chrome Storage API**: 配置和历史记录
- **IndexedDB**: 模型权重和缓存
- **Cache API**: 模型文件缓存

---

## 3. 模型设计与优化

### 3.1 基础模型选择

#### 3.1.1 Pix2Tex 模型架构
```
Pix2Tex = Vision Encoder + Text Decoder

Vision Encoder: ViT (Vision Transformer)
- Input: 384×384 RGB 图像
- Patch size: 16×16
- Hidden size: 768
- Layers: 12
- Attention heads: 12

Text Decoder: GPT-2 based
- Max sequence length: 512
- Vocabulary size: ~10k (LaTeX tokens)
- Hidden size: 768
- Layers: 12
```

#### 3.1.2 替代方案对比

| 模型 | 参数量 | 准确率 | 推理速度 | 文件大小 |
|------|--------|--------|----------|----------|
| Pix2Tex (原版) | ~120M | 95%+ | 慢 | ~480MB |
| Pix2Tex (INT8) | ~120M | 94% | 快 | ~120MB |
| LaTeX-OCR | ~120M | 93% | 中 | ~480MB |
| Im2LaTeX | ~90M | 90% | 快 | ~360MB |

**推荐**: Pix2Tex + INT8 量化

### 3.2 模型优化策略

#### 3.2.1 模型量化

**INT8 量化 (推荐)**
```python
# PyTorch 量化流程
import torch
from torch.quantization import quantize_dynamic

model = load_pix2tex_model()

# 动态量化（适合推理）
quantized_model = quantize_dynamic(
    model,
    {torch.nn.Linear},  # 量化线性层
    dtype=torch.qint8
)

# 导出为 ONNX
torch.onnx.export(
    quantized_model,
    dummy_input,
    "pix2tex_int8.onnx",
    opset_version=14
)
```

**优势**:
- 模型大小减少 75% (480MB → ~120MB)
- 推理速度提升 2-3x
- 精度损失 < 1%

**FP16 量化 (备选)**
- 模型大小减少 50%
- 推理速度提升 1.5-2x
- 精度损失极小

#### 3.2.2 模型剪枝 (可选)

```python
import torch.nn.utils.prune as prune

# 结构化剪枝
for module in model.modules():
    if isinstance(module, torch.nn.Linear):
        prune.l1_unstructured(module, name='weight', amount=0.2)
```

**目标**: 减少参数量 20-30%

#### 3.2.3 知识蒸馏 (可选)

使用大模型训练小模型:
- Teacher: 完整 Pix2Tex
- Student: 压缩版 (减少层数或隐藏维度)
- 目标: 将参数量降至 50M 以下

### 3.3 ONNX 转换流程

```bash
# 1. 环境准备
pip install onnx onnxruntime onnx-simplifier

# 2. PyTorch 转 ONNX
python export_onnx.py --model pix2tex --quantization int8

# 3. ONNX 优化
onnxsim pix2tex_int8.onnx pix2tex_int8_optimized.onnx

# 4. 模型分析
onnxruntime.quantization.preprocess_model(
    model_path="pix2tex_int8.onnx",
    model_type="bert"
)
```

### 3.4 模型文件结构

```
dist/models/
├── encoder_fp32.onnx          # 编码器 FP32 (可选)
├── encoder_int8.onnx          # 编码器 INT8 (主模型)
├── decoder_fp32.onnx          # 解码器 FP32 (可选)
├── decoder_int8.onnx          # 解码器 INT8 (主模型)
├── vocab.json                 # 词汇表
└── config.json                # 模型配置
```

---

## 4. 插件架构设计

### 4.1 扩展结构

```
formula-ocr-extension/
├── manifest.json              # 扩展清单
├── popup/                     # 弹出页面
│   ├── index.html
│   ├── index.tsx
│   └── style.css
├── content/                   # 内容脚本
│   ├── screenshot.ts
│   └── overlay.ts
├── background/                # 后台脚本
│   └── service_worker.ts
├── options/                   # 设置页面
│   ├── index.html
│   └── index.tsx
├── shared/                    # 共享代码
│   ├── types/
│   ├── utils/
│   └── constants/
├── core/                      # 核心逻辑
│   ├── inference.ts          # 推理引擎
│   ├── model-loader.ts       # 模型加载器
│   └── preprocessor.ts       # 图像预处理
└── assets/                    # 静态资源
    └── models/               # 模型文件
```

### 4.2 Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "FormulaOCR - 公式识别",
  "version": "1.0.0",
  "description": "截图识别数学公式，转换为 LaTeX",
  "permissions": [
    "storage",
    "scripting",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background/service_worker.ts"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/screenshot.ts"],
      "run_at": "document_idle"
    }
  ],
  "options_ui": {
    "page": "options/index.html",
    "open_in_tab": false
  },
  "web_accessible_resources": [
    {
      "resources": ["assets/models/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### 4.3 核心模块设计

#### 4.3.1 推理引擎 (InferenceEngine)

```typescript
// core/inference.ts
class InferenceEngine {
  private session: ort.InferenceSession | null = null;
  private config: ModelConfig;
  private isInitialized: boolean = false;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // 加载 ONNX Runtime
    // 初始化推理 Session
  }

  async preprocess(image: ImageData): Promise<ort.Tensor> {
    // 图像预处理
    // Resize to 384x384
    // Normalize
    // Transpose (CHW)
  }

  async infer(encoderInput: ort.Tensor): Promise<string> {
    // 编码器推理
    // 自回归解码
    // 后处理
  }

  async dispose(): Promise<void> {
    // 清理资源
  }
}
```

#### 4.3.2 模型加载器 (ModelLoader)

```typescript
// core/model-loader.ts
class ModelLoader {
  private cacheName = 'formula-ocr-models';
  private modelVersions = {
    encoder: 'v1.0-int8',
    decoder: 'v1.0-int8'
  };

  async loadModel(type: 'encoder' | 'decoder'): Promise<ArrayBuffer> {
    // 1. 检查 IndexedDB 缓存
    const cached = await this.loadFromCache(type);
    if (cached) return cached;

    // 2. 从扩展包加载
    const bundled = await this.loadFromBundle(type);
    if (bundled) {
      await this.cacheModel(type, bundled);
      return bundled;
    }

    // 3. 从远程服务器加载（可选）
    const remote = await this.loadFromRemote(type);
    await this.cacheModel(type, remote);
    return remote;
  }

  private async loadFromCache(type: string): Promise<ArrayBuffer | null> {
    // IndexedDB 查询
  }

  private async cacheModel(type: string, data: ArrayBuffer): Promise<void> {
    // IndexedDB 存储
  }
}
```

#### 4.3.3 截图管理器 (ScreenshotManager)

```typescript
// content/screenshot.ts
class ScreenshotManager {
  private overlay: HTMLElement | null = null;
  private isSelecting: boolean = false;
  private startPoint: { x: number; y: number } | null = null;

  startSelection(): void {
    // 创建遮罩层
    // 显示选择框
  }

  captureRegion(region: Region): ImageData {
    // 使用 Canvas API 捕获指定区域
  }

  captureFullscreen(): ImageData {
    // 使用 chrome.tabs.captureVisibleTab
  }
}
```

### 4.4 UI 设计

#### 4.4.1 Popup 界面

```
┌─────────────────────────────┐
│   📐 FormulaOCR            │
├─────────────────────────────┤
│  [📷 截图] [📋 历史]       │
├─────────────────────────────┤
│  结果预览区                 │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   LaTeX 公式预览     │   │
│  │                     │   │
│  └─────────────────────┘   │
│  [📋 复制] [💾 保存]       │
├─────────────────────────────┤
│  模型状态: ✅ 已加载        │
│  推理用时: 1.2s            │
└─────────────────────────────┘
```

#### 4.4.2 选择区域界面

```
┌─────────────────────────────┐
│     [×]                     │
│  ┌─────────────────────┐   │
│  │  拖动选择公式区域    │   │
│  │                     │   │
│  │                     │   │
│  └─────────────────────┘   │
│  [取消] [识别]              │
└─────────────────────────────┘
```

---

## 5. 数据流设计

### 5.1 识别流程

```
用户点击截图
    ↓
选择区域/全屏截图
    ↓
捕获图像 (ImageData)
    ↓
预处理 (resize, normalize)
    ↓
编码器推理
    ↓
自回归解码 (迭代生成 tokens)
    ↓
后处理 (token → LaTeX)
    ↓
显示结果 + 保存历史
```

### 5.2 消息通信

```typescript
// content script → popup
chrome.runtime.sendMessage({
  type: 'CAPTURE_RESULT',
  image: imageData
});

// background → popup
chrome.runtime.sendMessage({
  type: 'INFERENCE_RESULT',
  latex: result.latex,
  confidence: result.confidence
});
```

---

## 6. 性能优化

### 6.1 模型加载优化

**策略 1: 懒加载**
- 插件安装后不立即加载模型
- 用户首次使用时才下载/加载
- 后台预加载

**策略 2: 分层缓存**
```typescript
// 多级缓存策略
interface CacheStrategy {
  level1: 'memory';      // 内存缓存 (当前会话)
  level2: 'indexedDB';   // 本地存储 (持久化)
  level3: 'cacheAPI';    // Service Worker 缓存
}
```

**策略 3: 增量更新**
- 只下载更新的模型权重
- 版本检查和自动更新

### 6.2 推理优化

**策略 1: 批处理优化**
- 单张图片推理，无需批处理

**策略 2: 内存复用**
```typescript
// 预分配张量内存
const tensorCache = {
  input: createTensor([1, 3, 384, 384]),
  encoderOutput: createTensor([1, 577, 768]),
  decoderOutput: createTensor([1, 512])
};
```

**策略 3: 多线程推理**
```typescript
// 使用 Web Worker 避免阻塞主线程
const worker = new Worker('inference-worker.ts');
worker.postMessage({ image: imageData });
```

### 6.3 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 模型加载时间 | < 5s | 首次加载 |
| 推理时间 | < 3s | 单张图片 |
| 内存占用 | < 500MB | 运行时 |
| 模型大小 | < 150MB | INT8 量化 |

---

## 7. 用户体验设计

### 7.1 用户旅程

```
1. 用户安装插件
   ↓
2. 首次使用提示
   "首次使用需要下载模型 (~120MB)"
   ↓
3. 用户同意下载
   - 显示下载进度
   - 后台下载
   - 下载完成提示
   ↓
4. 用户点击截图按钮
   ↓
5. 选择公式区域
   ↓
6. 推理进行中 (显示加载动画)
   ↓
7. 显示识别结果
   - LaTeX 代码
   - 预览渲染
   - 复制按钮
   ↓
8. 保存到历史记录
```

### 7.2 错误处理

```typescript
enum ErrorType {
  MODEL_LOAD_FAILED = '模型加载失败',
  INFERENCE_FAILED = '推理失败',
  NETWORK_ERROR = '网络错误',
  INVALID_IMAGE = '无效图像'
}

class ErrorHandler {
  static handle(error: Error): UserFriendlyMessage {
    // 将技术错误转换为用户友好的提示
  }
}
```

---

## 8. 开发计划

### 8.1 阶段划分

#### Phase 1: 基础框架 (Week 1-2)
- [ ] 搭建扩展基础结构
- [ ] 实现 Manifest V3 配置
- [ ] 创建基础 UI (Popup, Options)
- [ ] 实现截图功能

#### Phase 2: 模型转换 (Week 2-3)
- [ ] 准备 Pix2Tex 模型
- [ ] 实现 INT8 量化
- [ ] 导出 ONNX 格式
- [ ] 模型测试和验证

#### Phase 3: 推理引擎 (Week 3-4)
- [ ] 集成 ONNX Runtime Web
- [ ] 实现模型加载器
- [ ] 实现推理逻辑
- [ ] 性能测试和优化

#### Phase 4: UI 完善 (Week 4-5)
- [ ] 实现结果预览
- [ ] 实现 LaTeX 渲染
- [ ] 实现历史记录
- [ ] 实现复制/保存功能

#### Phase 5: 测试和优化 (Week 5-6)
- [ ] 功能测试
- [ ] 性能测试
- [ ] 兼容性测试
- [ ] Bug 修复

#### Phase 6: 发布准备 (Week 6-7)
- [ ] 文档编写
- [ ] 打包发布
- [ ] Chrome Web Store 提交
- [ ] Edge Add-ons 提交

### 8.2 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| ONNX 转换失败 | 高 | 中 | 提前测试转换流程，准备多个版本 |
| 推理速度过慢 | 中 | 低 | 使用 INT8 量化，优化预处理 |
| 内存占用过高 | 中 | 中 | 实现内存管理，清理缓存 |
| 浏览器兼容性 | 低 | 低 | 使用 polyfill，降级方案 |

---

## 9. 依赖库清单

### 9.1 生产依赖

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "onnxruntime-web": "^1.16.0",
    "mathjax": "^3.2.2",
    "uuid": "^9.0.0"
  }
}
```

### 9.2 开发依赖

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "@crxjs/vite-plugin": "^2.0.0",
    "tailwindcss": "^3.3.0",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 10. 参考资源

### 10.1 相关项目
- [Pix2Tex](https://github.com/lukas-blecher/LaTeX-OCR) - LaTeX-OCR 项目
- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) - ONNX Runtime Web
- [Chrome Extensions Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

### 10.2 技术文档
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [ONNX Runtime Web API](https://onnxruntime.ai/docs/api/js/)
- [WebGL Backend](https://onnxruntime.ai/docs/performance/tune-webgl.html)

---

## 11. 附录

### 11.1 模型配置示例

```json
{
  "encoder": {
    "inputShape": [1, 3, 384, 384],
    "outputShape": [1, 577, 768],
    "quantization": "int8",
    "fileSize": "80MB"
  },
  "decoder": {
    "inputShape": [1, 768],
    "outputShape": [1, 512],
    "quantization": "int8",
    "fileSize": "40MB"
  }
}
```

### 11.2 环境要求

- **浏览器**: Chrome 113+ 或 Edge 113+
- **WebGL 支持**: WebGL 2.0
- **内存**: 建议 4GB+
- **存储空间**: 500MB+ (模型 + 缓存)

---

## 12. 后续优化方向

### 12.1 短期优化
- [ ] 支持手写公式识别
- [ ] 支持批量识别
- [ ] 支持公式编辑功能

### 12.2 长期优化
- [ ] 支持更多格式输出 (MathML, Image)
- [ ] 集成 LaTeX 编辑器
- [ ] 支持多语言公式
- [ ] 云端模型更新

---

**文档版本**: v1.0
**创建日期**: 2026-04-02
**最后更新**: 2026-04-02
