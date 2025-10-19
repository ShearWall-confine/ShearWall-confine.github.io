# 工作流权限问题修复指南

## 🚨 问题分析

"Error: Process completed with exit code 1" 通常表示权限不足，可能的原因：

1. **工作流权限不足** - GitHub Actions缺少必要的权限
2. **GitHub Pages设置错误** - Source设置不正确
3. **GitHub Secrets未设置** - 缺少必要的环境变量
4. **仓库权限问题** - 仓库设置限制了Actions权限

## 🔧 已应用的权限修复

### 工作流权限设置
```yaml
permissions:
  contents: read          # 读取仓库内容
  pages: write           # 写入GitHub Pages
  id-token: write        # 生成身份令牌
  actions: read          # 读取Actions信息
  checks: write         # 写入检查状态
  pull-requests: write   # 写入PR状态
  statuses: write       # 写入状态
  security-events: write # 写入安全事件
```

## 📋 检查清单

### 1. GitHub Pages设置
- [ ] 进入仓库 Settings → Pages
- [ ] 确认Source设置为 "GitHub Actions"
- [ ] 如果显示 "Deploy from a branch"，请改为 "GitHub Actions"

### 2. GitHub Secrets设置
- [ ] 进入仓库 Settings → Secrets and variables → Actions
- [ ] 确认以下secrets已设置：
  - `ADMIN_PASSWORD_HASH`
  - `EDITOR_PASSWORD_HASH`
  - `VIEWER_PASSWORD_HASH`
  - `JWT_SECRET`
  - `ENCRYPTION_KEY`

### 3. 仓库权限设置
- [ ] 进入仓库 Settings → Actions → General
- [ ] 确认 "Allow all actions and reusable workflows" 已启用
- [ ] 确认 "Allow GitHub Actions to create and approve pull requests" 已启用

### 4. 工作流文件
- [ ] 确认 `.github/workflows/deploy.yml` 存在
- [ ] 确认包含正确的permissions设置
- [ ] 确认使用官方GitHub Pages actions

## 🚀 测试修复

### 方法1: 运行修复脚本
```bash
# 双击运行
fix-workflow-permissions.bat
```

### 方法2: 手动测试
```bash
# 提交权限修复
git add .github/workflows/deploy.yml
git commit -m "Fix: Add comprehensive workflow permissions"
git push origin main

# 检查GitHub Actions
# 进入仓库 Actions 页面查看运行状态
```

## 🔍 验证步骤

### 1. 检查GitHub Actions
1. 进入仓库 Actions 页面
2. 查看最新的工作流运行
3. 确认所有步骤都成功
4. 不再出现权限错误

### 2. 检查部署状态
1. 进入 Settings → Pages
2. 查看部署状态
3. 确认网站可以访问

### 3. 测试网站功能
1. 访问GitHub Pages URL
2. 测试登录功能
3. 验证权限控制

## 🛠️ 故障排除

### 问题1: 仍然权限错误
**解决方案:**
1. 检查GitHub Pages设置
2. 确认GitHub Secrets已设置
3. 检查仓库权限设置

### 问题2: GitHub Secrets未生效
**解决方案:**
1. 重新设置GitHub Secrets
2. 确认名称完全匹配
3. 重新触发工作流

### 问题3: 工作流找不到
**解决方案:**
1. 确认文件路径正确
2. 检查YAML语法
3. 重新提交文件

## 📊 权限说明

### 必需权限
- `contents: read` - 读取仓库内容
- `pages: write` - 部署到GitHub Pages
- `id-token: write` - 生成身份令牌

### 推荐权限
- `actions: read` - 读取Actions信息
- `checks: write` - 写入检查状态
- `statuses: write` - 写入状态信息

## 🎯 预期结果

修复后应该看到：
- ✅ 工作流运行成功
- ✅ 不再出现权限错误
- ✅ 网站成功部署
- ✅ 登录功能正常

## 📞 技术支持

如果问题仍然存在：
1. 检查GitHub仓库权限设置
2. 确认Actions功能已启用
3. 查看详细的错误日志
4. 尝试重新创建仓库
