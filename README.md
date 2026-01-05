# VIRTUAL ATELIER - AI 虚拟试衣间

这是一个基于 Next.js 的 AI 虚拟试衣间应用，使用 Google Gemini API 进行图像生成。前端和后端分离，API 密钥安全存储在后端。

## 功能特性

- 上传最多 4 张服装图片
- 生成 5 个不同角度的虚拟试衣效果
- 安全的 API 密钥管理
- 响应式界面设计

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Google Gemini API

## 环境配置

1. 复制环境变量文件：

```bash
cp .env.example .env.local
```

2. 在 `.env.local` 文件中设置 API 密钥：

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## 本地开发

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

3. 访问 `http://localhost:3000`

## 部署到 Vercel

### 使用 Vercel CLI

1. 安装 Vercel CLI：

```bash
npm i -g vercel
```

2. 登录 Vercel：

```bash
vercel login
```

3. 部署项目：

```bash
vercel
```

### 直接通过 GitHub

1. 将代码推送到 GitHub 仓库
2. 访问 [vercel.com](https://vercel.com) 并导入项目
3. 在环境变量设置中添加 `GEMINI_API_KEY`

## API 路由

- `/api/generate` - 处理图像生成请求

## 安全性

- API 密钥存储在环境变量中，不会暴露给前端
- 所有图像生成请求都通过后端代理
- 前端仅接收生成的图像数据

## 文件结构

```
app/
├── api/
│   └── generate/route.ts    # API 路由处理图像生成
├── globals.css              # 全局样式
├── layout.tsx              # 根布局
├── page.tsx                # 主页组件
└── ...                     # 其他 Next.js 文件
```

## 注意事项

- 确保你的 Google Gemini API 密钥有足够的配额
- 图像生成可能需要一些时间，请耐心等待
- 上传的图片格式应为常见的图片格式 (JPG, PNG, etc.)