# GitHub Actions 工作流说明

## 📋 工作流概览

### `deploy.yml` - 统一部署工作流

这是唯一的工作流文件，负责：
- 生成GitHub Secrets配置文件
- 部署到GitHub Pages
- 验证部署结果

## 🔄 工作流触发条件

1. **推送触发**: 推送到 `main` 分支时自动运行
2. **手动触发**: 在GitHub Actions页面手动运行
3. **定时触发**: 每天凌晨2点自动更新配置（可选）

## 📁 生成的文件

### `github-secrets-config.js`
- 包含从GitHub Secrets注入的密码哈希
- 用于浏览器环境认证
- 包含开发环境回退值

### `user-config.js`
- 包含完整的用户配置
- 用于服务器端验证
- 包含角色权限配置

## 🔐 安全特性

1. **环境隔离**: 生产环境使用GitHub Secrets，开发环境使用默认值
2. **密码哈希**: 使用PBKDF2算法进行密码哈希
3. **权限管理**: 基于角色的访问控制
4. **自动验证**: 部署后自动验证配置正确性

## 🚀 部署流程

1. **代码推送** → 触发工作流
2. **生成配置** → 从GitHub Secrets生成配置文件
3. **验证配置** → 检查配置文件正确性
4. **部署页面** → 推送到GitHub Pages
5. **验证部署** → 确认部署成功

## 🔧 配置要求

### 必需的GitHub Secrets

| Secret名称 | 描述 | 生成方式 |
|-----------|------|----------|
| `ADMIN_PASSWORD_HASH` | 管理员密码哈希 | 运行 `generate-secrets.py` |
| `EDITOR_PASSWORD_HASH` | 编辑者密码哈希 | 运行 `generate-secrets.py` |
| `VIEWER_PASSWORD_HASH` | 查看者密码哈希 | 运行 `generate-secrets.py` |
| `JWT_SECRET` | JWT密钥 | 运行 `generate-secrets.py` |
| `ENCRYPTION_KEY` | 加密密钥 | 运行 `generate-secrets.py` |

### 自动生成的Token

- `GITHUB_TOKEN`: 自动提供，用于部署

## 📊 工作流状态

- ✅ **成功**: 所有步骤完成，部署成功
- ❌ **失败**: 某个步骤失败，需要检查日志
- ⏳ **运行中**: 工作流正在执行

## 🔍 故障排除

### 常见问题

1. **Secrets未配置**
   - 检查GitHub Secrets是否已设置
   - 确认Secret名称正确

2. **配置文件生成失败**
   - 检查GitHub Actions日志
   - 确认Secrets值格式正确

3. **部署失败**
   - 检查GitHub Pages设置
   - 确认仓库权限

### 调试步骤

1. 查看GitHub Actions日志
2. 检查生成的配置文件
3. 验证GitHub Pages设置
4. 测试部署的网站

## 📈 性能优化

- 使用Node.js缓存加速构建
- 并行执行验证步骤
- 优化文件生成逻辑

## 🔄 更新流程

1. 修改工作流文件
2. 推送到main分支
3. 工作流自动运行
4. 验证部署结果

---

**注意**: 这是唯一的工作流文件，替代了之前的两个分离的工作流，避免了冲突和重复。
