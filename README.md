# FormulaOCR - 浏览器公式识别插件

浏览器扩展插件，支持截图识别数学公式并转换为 LaTeX 格式。纯前端推理，无需后端服务。

## 特性

- 📸 **截图识别**: 支持区域选择和全屏截图
- 🚀 **纯前端**: 所有推理在本地完成，无需云端
- 📝 **LaTeX 输出**: 识别结果直接输出 LaTeX 代码
- 📋 **历史记录**: 自动保存识别历史
- 💾 **离线可用**: 模型本地缓存，无需网络

## 技术栈

- **前端框架**: React 18 + TypeScript
- **扩展标准**: Chrome Extension Manifest V3
- **深度学习**: ONNX Runtime Web
- **构建工具**: Vite + CRXJS
- **样式**: TailwindCSS

## 快速开始

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 加载到浏览器

**Chrome:**
1. 打开 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist` 目录

**Edge:**
1. 打开 `edge://extensions/`
2. 启用"开发人员模式"
3. 点击"加载解压缩的扩展"
4. 选择 `dist` 目录

### 项目结构

```
src/
├── background/          # 后台脚本
├── content/             # 内容脚本（截图）
├── popup/               # 弹出页面
├── options/             # 设置页面
└── shared/              # 共享代码
    ├── types/          # TypeScript 类型定义
    └── constants/      # 常量定义
```

## 开发进度

- [x] Phase 1: 基础框架 ✅ **已完成**
- [ ] Phase 2: 模型转换
- [ ] Phase 3: 推理引擎
- [ ] Phase 4: UI 完善
- [ ] Phase 5: 测试优化
- [ ] Phase 6: 发布准备

### Phase 1 已完成 (当前阶段)

✅ 项目配置和构建系统
✅ Popup 界面（主界面）
✅ Options 页面（设置页面）
✅ Content Script（截图功能）
✅ Background Service Worker
✅ 消息通信
✅ 存储管理

详细内容请查看 [PHASE1_SUMMARY.md](./PHASE1_SUMMARY.md)

## 文档

- **[DESIGN.md](./DESIGN.md)** - 完整设计文档
- **[PHASE1_SUMMARY.md](./PHASE1_SUMMARY.md)** - Phase 1 完成总结
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - 开发指南

## 浏览器兼容性

- Chrome 113+
- Edge 113+

## License

MIT
