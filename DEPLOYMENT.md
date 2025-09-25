# 本地部署指南

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env.local
```

然后编辑 `.env.local` 文件，添加您的 API 密钥：

- **OpenAI API Key**: 从 https://platform.openai.com/api-keys 获取
- **Gemini API Key**: 从 https://makersuite.google.com/app/apikey 获取  
- **Zhipu API Key**: 从 https://open.bigmodel.cn/ 获取

### 3. 启动开发服务器
```bash
npm run dev
```

应用将在 http://localhost:3000 (或下一个可用端口) 启动。

## 功能测试

1. **选择 AI 模型**: OpenAI GPT-4V / Google Gemini / Zhipu GLM-4V
2. **选择 Gen Z 角色**: 5 种不同的用户画像
3. **上传图片**: 拖拽或点击上传 UI 截图
4. **运行模拟**: 获得 AI 驱动的 UX 评估
5. **查看结果**: 分数、分析和具体问题
6. **导出结果**: Markdown 或 JSON 格式

## 生产部署

### Vercel 部署 (推荐)
1. 将代码推送到 GitHub
2. 在 Vercel 中连接仓库
3. 在 Vercel 控制台添加环境变量
4. 自动部署

### 其他平台
```bash
npm run build
npm start
```

## 故障排除

- **端口被占用**: 应用会自动尝试下一个可用端口
- **API 密钥错误**: 检查 `.env.local` 文件中的密钥格式
- **图片上传失败**: 确保图片格式为 PNG/JPG/WebP
- **评估失败**: 检查网络连接和 API 配额

## 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/evaluate/   # API 路由
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 根布局
│   └── page.tsx        # 主页面
├── components/         # React 组件
│   ├── ImageUploader.tsx
│   └── ResultsView.tsx
├── data/              # 静态数据
│   ├── personas.ts    # Gen Z 角色数据
│   └── evaluation-dimensions.ts
├── lib/               # 工具库
│   └── ai-adapters.ts # AI 提供商适配器
└── types/             # TypeScript 类型定义
    └── index.ts
```
