-- OTA FAQ 知识库初始化数据脚本
-- 在 Neon 数据库控制台的 SQL Editor 中运行此脚本

-- 插入管理员账号（密码：123456）
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@ota.com', '$2b$10$MZgxQStGPF6xVN.cApaNGen8bT4rcchIFgvxJvMnS8CahtoCQL3bS', 'admin'),
('employee1', 'emp1@ota.com', '$2b$10$MZgxQStGPF6xVN.cApaNGen8bT4rcchIFgvxJvMnS8CahtoCQL3bS', 'employee')
ON CONFLICT DO NOTHING;

-- 插入默认分类
INSERT INTO categories (name_zh, name_en, sort_order) VALUES
('OTA升级', 'OTA Upgrade', 1),
('设备连接', 'Device Connection', 2),
('网络异常', 'Network Issues', 3),
('系统限制', 'System Limitations', 4),
('配置说明', 'Configuration Guide', 5),
('常见报错', 'Common Errors', 6)
ON CONFLICT DO NOTHING;

-- 插入默认标签
INSERT INTO tags (name) VALUES
('hotspot'), ('sim pin'), ('preload'), ('wifi'), ('mdm'), 
('apk update'), ('firmware'), ('bluetooth'), ('security'), ('battery')
ON CONFLICT DO NOTHING;
