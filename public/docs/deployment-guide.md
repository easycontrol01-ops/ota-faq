# OTA FAQ 知识库 — 完整部署指南（新手版）

> 本文档面向非技术人员，按步骤操作即可完成部署。
> 预计耗时：20-30 分钟

---

## 一、需要注册的三个平台（全部免费）

| 平台 | 用途 | 网址 |
|------|------|------|
| GitHub | 存放代码 | https://github.com |
| Neon | 数据库 | https://neon.tech |
| Vercel | 网站部署 | https://vercel.com |

---

## 二、第一步：注册 GitHub

1. 打开 https://github.com
2. 点击右上角 **Sign up**
3. 输入邮箱、设置密码、用户名
4. 完成验证
5. 进入邮箱点击确认链接

---

## 三、第二步：注册 Neon 数据库

1. 打开 https://neon.tech
2. 点击 **Sign Up** → **Continue with GitHub**
3. 登录后点击 **Create Project**
4. 项目名填：`ota-faq`
5. Region 选 **Singapore** 或 **Tokyo**
6. 点击 **Create Project**
7. 创建成功后，找到 **Connection string**，类似：
   ```
   postgresql://用户名:密码@xxx.neon.tech/neondb?sslmode=require
   ```
8. **复制这个连接字符串，保存到记事本**（后面要用）

---

## 四、第三步：上传代码到 GitHub

### 4.1 创建 GitHub 仓库
1. 打开 https://github.com/new
2. Repository name 填：`ota-faq`
3. 选择 **Public**
4. 点击 **Create repository**

### 4.2 上传项目代码
1. 先在电脑上解压项目的 zip 文件
2. 确认解压后能看到这些文件：
   - `package.json`
   - `src/`
   - `public/`
   - `next.config.ts`
3. 在 GitHub 仓库页面点击 **Add file** → **Upload files**
4. 把解压后文件夹里的 **所有内容** 拖进去

### ⚠️ 重要提醒
- **不要上传 zip 压缩包本身**
- 要上传的是 **解压后的所有文件和文件夹**
- 上传后 GitHub 仓库首页应该直接能看到 `package.json`、`src`、`public`

5. 点击 **Commit changes** 提交

---

## 五、第四步：在 Vercel 部署

### 5.1 注册并登录 Vercel
1. 打开 https://vercel.com
2. 点击 **Sign Up** → **Continue with GitHub**
3. 授权 Vercel 访问您的 GitHub

### 5.2 导入项目
1. 登录后点击 **Add New** → **Project**
2. 找到 `ota-faq` 仓库，点击 **Import**

### 5.3 配置项目（⚠️ 非常重要）

#### Framework Preset
```
Next.js
```
> 如果默认不是 Next.js，请手动从下拉菜单里选择

#### Root Directory
```
留空
```
> 如果 GitHub 仓库首页直接能看到 package.json，就留空
> 如果代码被包在一个子文件夹里（比如 ota-faq-knowledge-base），就填那个文件夹名

#### Output Directory
```
不要填任何内容！保持默认即可
```
> ⚠️ 千万不要填 public，否则会导致 404

#### Environment Variables（环境变量）
点击展开 Environment Variables，添加两条：

**第一条：**
- Key: `DATABASE_URL`
- Value: 粘贴您在第二步保存的 Neon 数据库连接字符串

**第二条：**
- Key: `JWT_SECRET`
- Value: `ota-faq-secret-2025-admin`（可以自定义）

### 5.4 开始部署
点击 **Deploy**，等待 2-3 分钟

### 5.5 部署成功
- 状态显示绿色 **Ready** 表示成功
- 点击 **Visit** 可以访问网站
- 在 **Settings → Domains** 可以查看长期域名

---

## 六、第五步：初始化数据库

部署成功后，网站能打开但还没有数据。需要在 Neon 里执行 SQL 创建表和管理员账号。

### 6.1 打开 Neon SQL Editor
1. 打开 https://console.neon.tech
2. 进入您的数据库项目
3. 点击左侧 **SQL Editor**

### 6.2 执行初始化 SQL
新建一个查询，粘贴以下 SQL，然后点击 **Run**：

```sql
-- 1) 创建枚举类型
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'employee'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE faq_status AS ENUM ('draft', 'published', 'offline', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE faq_type AS ENUM ('platform', 'device'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE faq_os AS ENUM ('Android', 'RTOS', 'Linux', 'any'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE faq_visibility AS ENUM ('public', 'internal'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) 创建表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE, password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee', disabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY, name_zh VARCHAR(200) NOT NULL, name_en VARCHAR(200) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY, title_zh TEXT NOT NULL DEFAULT '', title_en TEXT NOT NULL DEFAULT '',
    content_zh TEXT NOT NULL DEFAULT '', content_en TEXT NOT NULL DEFAULT '',
    type faq_type NOT NULL DEFAULT 'platform', os faq_os NOT NULL DEFAULT 'any',
    visibility faq_visibility NOT NULL DEFAULT 'public', status faq_status NOT NULL DEFAULT 'draft',
    category_id INTEGER REFERENCES categories(id),
    view_count INTEGER NOT NULL DEFAULT 0, helpful_count INTEGER NOT NULL DEFAULT 0, not_helpful_count INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES users(id), updated_by INTEGER REFERENCES users(id),
    published_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS faq_tags (
    id SERIAL PRIMARY KEY, faq_id INTEGER NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS faq_versions (
    id SERIAL PRIMARY KEY, faq_id INTEGER NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
    title_zh TEXT NOT NULL DEFAULT '', title_en TEXT NOT NULL DEFAULT '',
    content_zh TEXT NOT NULL DEFAULT '', content_en TEXT NOT NULL DEFAULT '',
    change_note TEXT DEFAULT '', modified_by INTEGER REFERENCES users(id),
    version_number INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS search_logs (
    id SERIAL PRIMARY KEY, keyword VARCHAR(500) NOT NULL, result_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY, faq_id INTEGER NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
    helpful BOOLEAN NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3) 插入管理员账号（密码：123456）
INSERT INTO users (username, email, password_hash, role)
SELECT 'admin', 'admin@ota.com', '$2b$10$MZgxQStGPF6xVN.cApaNGen8bT4rcchIFgvxJvMnS8CahtoCQL3bS', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 4) 插入默认分类
INSERT INTO categories (name_zh, name_en, sort_order) SELECT 'OTA升级', 'OTA Upgrade', 1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_zh = 'OTA升级');
INSERT INTO categories (name_zh, name_en, sort_order) SELECT '设备连接', 'Device Connection', 2 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_zh = '设备连接');
INSERT INTO categories (name_zh, name_en, sort_order) SELECT '网络异常', 'Network Issues', 3 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_zh = '网络异常');
INSERT INTO categories (name_zh, name_en, sort_order) SELECT '系统限制', 'System Limitations', 4 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_zh = '系统限制');
INSERT INTO categories (name_zh, name_en, sort_order) SELECT '配置说明', 'Configuration Guide', 5 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_zh = '配置说明');
INSERT INTO categories (name_zh, name_en, sort_order) SELECT '常见报错', 'Common Errors', 6 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name_zh = '常见报错');

-- 5) 插入默认标签
INSERT INTO tags (name) SELECT 'hotspot' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'hotspot');
INSERT INTO tags (name) SELECT 'wifi' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'wifi');
INSERT INTO tags (name) SELECT 'mdm' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'mdm');
INSERT INTO tags (name) SELECT 'apk update' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'apk update');
INSERT INTO tags (name) SELECT 'firmware' WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'firmware');
```

执行成功后会提示 `Success` 或 `Query executed successfully`。

---

## 七、第六步：登录测试

1. 打开您的 Vercel 域名（如 https://ota-faq.vercel.app）
2. 点击右上角 **登录**
3. 输入：
   - 用户名：`admin`
   - 密码：`123456`
4. 登录成功后即可进入管理后台

---

## 八、后续更新代码

如果以后需要修改网站代码：

1. 把新代码上传到 GitHub 仓库
2. Vercel 会 **自动检测到更新**
3. **自动重新部署**（约 1-2 分钟）
4. 您不需要手动操作

---

## 九、常见问题

### Q1: 访问网站显示 404
检查 Vercel 项目设置：
- Framework Preset 是否为 **Next.js**
- Output Directory 是否为 **留空 / 默认**

### Q2: 登录失败
检查：
- 是否已在 Neon 执行了初始化 SQL
- Vercel 环境变量 DATABASE_URL 是否正确

### Q3: 需要重新部署
在 Vercel 项目里找到 Deployments → 最新记录 → Redeploy

---

## 十、平台免费额度说明

| 平台 | 免费额度 | 适用场景 |
|------|---------|---------|
| GitHub | 完全免费，无限仓库 | 存放代码 |
| Neon | 免费版：0.5 GB 存储，190 小时/月计算时间 | 小型项目数据库 |
| Vercel | 免费版：100 GB 带宽/月，无限部署 | 网站托管 |

### 免费版能支撑多大业务？
- 约 **500-1000 篇** FAQ 文章
- 约 **每月 5-10 万次** 页面访问
- 约 **10-50 个** 管理员/员工账号
- 对于中小企业内部知识库完全够用

### 什么时候需要付费？
- 当网站访问量非常大（超过 10 万次/月）
- 或数据库存储超过 0.5 GB
- 到时候可以按需升级

---

> 文档版本：v1.0
> 最后更新：2025年
