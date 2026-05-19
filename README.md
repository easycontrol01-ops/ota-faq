# OTA FAQ 知识库

一个专业的 FAQ 知识库管理系统，支持公开/内部知识库、批量导入、版本管理等功能。

## 功能特性

- 📚 FAQ 管理（创建、编辑、删除、发布）
- 📂 分类管理
- 🏷️ 标签管理
- 👥 用户权限管理
- 📊 数据统计分析
- 📥 批量导入（Excel模板）
- 🖼️ 图片上传
- 📜 版本追踪与回滚
- 🔍 全文搜索
- 🌐 中英文切换

## 部署到 Vercel

### 1. Fork 或导入此仓库到你的 GitHub

### 2. 创建 Neon 数据库
- 访问 https://neon.tech
- 创建免费项目，获取数据库连接字符串

### 3. 部署到 Vercel
- 访问 https://vercel.com
- 导入你的 GitHub 仓库
- 添加环境变量：
  - `DATABASE_URL`: 你的 Neon 数据库连接字符串
  - `JWT_SECRET`: 任意随机字符串（用于加密）

### 4. 初始化数据库
部署成功后，在 Vercel 项目设置中进入 Functions 或运行：
```
npx drizzle-kit push
```

### 5. 创建管理员账号
首次使用需要直接在数据库中创建管理员账号，或者联系开发者获取初始化脚本。

## 默认账号

- 用户名：admin
- 密码：123456

## 技术栈

- Next.js 16 (App Router)
- PostgreSQL + Drizzle ORM
- Tailwind CSS
- TypeScript

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的数据库连接

# 推送数据库结构
npx drizzle-kit push

# 启动开发服务器
npm run dev
```
