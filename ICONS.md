# 图标文件说明

由于当前无法创建实际的图片文件，请按以下要求准备图标：

## 所需图标

1. **icon16.png** - 16x16 像素
2. **icon48.png** - 48x48 像素
3. **icon128.png** - 128x128 像素

## 图标设计建议

- 主题：公式识别（可使用数学符号如 ∑、∫、π 等）
- 颜色：蓝色主色调 (#0ea5e9)
- 风格：扁平化、现代、简洁

## 创建方法

### 方法 1: 在线工具
- 使用 https://www.favicon-generator.org/ 或类似工具
- 上传一个高分辨率图标，生成不同尺寸

### 方法 2: 使用 Figma/Sketch
- 设计 512x512 的图标
- 导出为 PNG，然后缩放到所需尺寸

### 方法 3: 使用 ImageMagick
```bash
convert icon.png -resize 16x16 icon16.png
convert icon.png -resize 48x48 icon48.png
convert icon.png -resize 128x128 icon128.png
```

## 临时占位

在开发阶段，可以使用纯色方块作为占位符：

```bash
# 创建临时占位图标
mkdir -p icons
convert -size 16x16 xc:#0ea5e9 icons/icon16.png
convert -size 48x48 xc:#0ea5e9 icons/icon48.png
convert -size 128x128 xc:#0ea5e9 icons/icon128.png
```

## 放置位置

将生成的图标文件放在 `icons/` 目录下。
