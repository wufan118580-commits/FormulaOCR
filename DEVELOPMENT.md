# 开发指南 - Phase 1 基础框架

## 已完成的工作

### 1. 项目配置文件
- ✅ `package.json` - 项目依赖和脚本
- ✅ `tsconfig.json` - TypeScript 配置
- ✅ `vite.config.ts` - Vite 构建配置
- ✅ `tailwind.config.js` - TailwindCSS 配置
- ✅ `postcss.config.js` - PostCSS 配置
- ✅ `manifest.json` - Chrome 扩展清单

### 2. 核心类型定义
- ✅ `src/shared/types/index.ts` - TypeScript 类型定义
- ✅ `src/shared/constants/index.ts` - 常量定义

### 3. Popup 界面
- ✅ `src/popup/index.html` - Popup HTML 结构
- ✅ `src/popup/index.tsx` - 入口文件
- ✅ `src/popup/App.tsx` - 主应用组件
- ✅ `src/popup/styles.css` - 样式文件
- ✅ `src/popup/components/ModelStatus.tsx` - 模型状态组件
- ✅ `src/popup/components/CaptureButtons.tsx` - 截图按钮组件
- ✅ `src/popup/components/ResultPreview.tsx` - 结果预览组件
- ✅ `src/popup/components/HistoryPanel.tsx` - 历史记录组件

### 4. Content Script (截图功能)
- ✅ `src/content/overlay.css` - 遮罩层样式
- ✅ `src/content/overlay.ts` - 遮罩层管理类
- ✅ `src/content/screenshot.ts` - 截图逻辑

### 5. Background Service Worker
- ✅ `src/background/service-worker.ts` - 后台服务

### 6. Options 页面
- ✅ `src/options/index.html` - Options HTML 结构
- ✅ `src/options/index.tsx` - 入口文件
- ✅ `src/options/App.tsx` - 设置页面组件

### 7. 其他文件
- ✅ `.gitignore` - Git 忽略文件
- ✅ `ICONS.md` - 图标说明
- ✅ `README.md` - 项目说明

## 下一步操作

### 1. 安装依赖

```bash
npm install
```

### 2. 创建图标文件

由于当前无法直接创建 PNG 图片文件，你有两个选择：

**选项 A: 使用现有图标（推荐）**
- 找一个 128x128 的 PNG 图标
- 复制到 `icons/` 目录
- 重命名为 `icon16.png`, `icon48.png`, `icon128.png`

**选项 B: 生成占位图标**

如果你有 ImageMagick：
```bash
convert -size 16x16 xc:#0ea5e9 icons/icon16.png
convert -size 48x48 xc:#0ea5e9 icons/icon48.png
convert -size 128x128 xc:#0ea5e9 icons/icon128.png
```

或者暂时修改 `manifest.json`，注释掉图标相关配置：
```json
"icons": {
  // 暂时注释
  // "16": "icons/icon16.png",
  // "48": "icons/icon48.png",
  // "128": "icons/icon128.png"
}
```

### 3. 构建项目

```bash
npm run build
```

### 4. 加载到浏览器

#### Chrome:
1. 打开 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist` 目录

#### Edge:
1. 打开 `edge://extensions/`
2. 启用"开发人员模式"
3. 点击"加载解压缩的扩展"
4. 选择 `dist` 目录

### 5. 测试基础功能

1. 点击扩展图标，打开 Popup
2. 查看模型状态（应显示"未初始化"）
3. 点击"区域截图识别"或"全屏截图识别"
4. 在页面上拖动选择区域（区域截图）
5. 点击"识别公式"按钮
6. 检查是否能捕获到图像数据
7. 打开设置页面，修改配置

## 当前状态

✅ **UI 框架**: 完成
✅ **截图功能**: 完成（基础实现）
✅ **消息通信**: 完成
✅ **存储管理**: 完成
❌ **模型推理**: 待实现（Phase 2-3）
❌ **图像预处理**: 待实现（Phase 3）
❌ **实际推理**: 待实现（Phase 3）

## 已知问题

1. **图标文件**: 需要手动创建 PNG 图标
2. **截图实现**: 当前使用简化实现，可能需要优化
3. **MathJax**: 需要网络连接加载 CDN
4. **模型状态**: 当前只显示状态，没有实际加载模型

## 架构说明

### 组件通信流程

```
Popup → Background → Content Script (截图)
                ↓
          捕获图像
                ↓
          返回 Popup
                ↓
          显示结果 (Phase 3)
```

### 数据存储

- `chrome.storage.local`:
  - `config`: 扩展配置
  - `history`: 历史记录
  - `modelStatus`: 模型状态

## 代码规范

- 使用 TypeScript 进行类型检查
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 组件使用函数式组件 + Hooks
- 样式使用 TailwindCSS

## 调试技巧

### 查看日志

1. Popup 日志: 右键点击 Popup → 检查
2. Background 日志: `chrome://extensions/` → Service Worker 链接
3. Content Script 日志: 页面 F12 → Console

### 调试消息通信

```typescript
// 在 content script 中
console.log('Received message:', message);

// 在 background 中
chrome.runtime.onMessage.addListener((message) => {
  console.log('Background received:', message);
});
```

### 清除存储数据

```javascript
// 在浏览器控制台执行
chrome.storage.local.clear()
```

## Phase 2 准备

下一阶段（Phase 2）将进行模型转换工作，需要：

1. 安装 PyTorch 和 ONNX 相关依赖
2. 准备 Pix2Tex 模型
3. 实现模型量化
4. 导出 ONNX 格式
5. 测试模型准确性

详见 `DESIGN.md` 文档。

## 常见问题

### Q: 构建失败，提示找不到 `@types/chrome`？
A: 运行 `npm install` 安装所有依赖。

### Q: 加载扩展后图标不显示？
A: 需要手动创建图标文件，参考 `ICONS.md`。

### Q: 截图功能不工作？
A: 确保在支持 `chrome.tabs.captureVisibleTab` 的页面测试（需要 tab 权限）。

### Q: Popup 打不开？
A: 检查 `manifest.json` 中的 `default_popup` 路径是否正确。

## 联系支持

如有问题，请查看：
- [Chrome Extension 文档](https://developer.chrome.com/docs/extensions/)
- [Vite 文档](https://vitejs.dev/)
- [React 文档](https://react.dev/)
