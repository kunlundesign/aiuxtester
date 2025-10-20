# 🏗️ 多阶段构建：依赖层
FROM node:20-alpine AS deps
WORKDIR /app

# 🔧 安装构建工具（某些native模块需要）
RUN apk add --no-cache libc6-compat

# 📦 只复制依赖相关文件，利用Docker层缓存
COPY package.json package-lock.json* ./
RUN npm ci --only=production --omit=dev

# 🏗️ 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 🔧 设置构建环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 🏗️ 安装全部依赖（包括devDependencies）并构建
RUN npm ci
RUN npm run build

# 🚀 运行时阶段（最小镜像）
FROM node:20-alpine AS runner
WORKDIR /app

# 🔧 创建非root用户（安全性）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 📋 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 📦 复制必要的运行时文件
COPY --from=builder /app/public ./public

# 🔒 设置正确的文件权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 📦 复制standalone构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 👤 切换到非root用户
USER nextjs

# 🌐 暴露端口
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 🚀 启动应用
CMD ["node", "server.js"]