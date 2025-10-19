# GitHub Pages 设置修复指南

## 🚨 问题分析

错误信息显示GitHub Actions仍在尝试推送到gh-pages分支，这说明GitHub Pages设置可能不正确。

## 🔧 修复步骤

### 1. 检查GitHub Pages设置

1. **进入仓库设置**
   - 访问你的GitHub仓库
   - 点击 `Settings` 标签

2. **检查Pages设置**
   - 左侧菜单选择 `Pages`
   - 查看 `Source` 设置

3. **正确的设置**
   ```
   Source: GitHub Actions
   ```

4. **如果设置错误**
   - 如果显示 "Deploy from a branch"
   - 请改为 "GitHub Actions"
   - 保存设置

### 2. 检查工作流文件

确认 `.github/workflows/deploy.yml` 包含：

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    
    steps:
    # ... 其他步骤 ...
    
    - name: Setup Pages
      uses: actions/configure-pages@v4
      
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: ./
        
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

### 3. 重新触发部署

```bash
# 提交更改
git add .
git commit -m "Fix: Update GitHub Pages settings"
git push origin main
```

## 🔍 验证步骤

### 1. 检查GitHub Actions
1. 进入仓库 `Actions` 页面
2. 查看最新的工作流运行
3. 确认使用正确的部署步骤

### 2. 检查Pages设置
1. 进入 `Settings` → `Pages`
2. 确认Source为 "GitHub Actions"
3. 查看部署状态

### 3. 访问网站
1. 等待部署完成
2. 访问GitHub Pages URL
3. 测试网站功能

## 🛠️ 故障排除

### 问题1: 仍然推送到gh-pages
**原因**: GitHub Pages设置不正确
**解决**: 将Source改为 "GitHub Actions"

### 问题2: 工作流找不到
**原因**: 工作流文件路径错误
**解决**: 确认文件在 `.github/workflows/` 目录

### 问题3: 权限错误
**原因**: 缺少正确的权限设置
**解决**: 添加 `permissions` 配置

## 📋 检查清单

- [ ] GitHub Pages Source设置为 "GitHub Actions"
- [ ] 工作流文件包含正确的permissions
- [ ] 使用官方GitHub Pages actions
- [ ] 代码已推送到GitHub
- [ ] GitHub Actions运行成功
- [ ] 网站可以访问

## 🎯 预期结果

修复后应该看到：
- ✅ 使用 `actions/configure-pages@v4`
- ✅ 使用 `actions/upload-pages-artifact@v3`
- ✅ 使用 `actions/deploy-pages@v4`
- ❌ 不再使用 `peaceiris/actions-gh-pages@v4`
- ❌ 不再直接推送到gh-pages分支

## 📞 技术支持

如果问题仍然存在：
1. 检查GitHub仓库权限设置
2. 确认Actions功能已启用
3. 查看详细的错误日志
4. 尝试重新创建仓库
