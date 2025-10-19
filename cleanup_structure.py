#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub Pages 文件结构清理脚本
整理文件结构，修复链接问题
"""

import os
import shutil
from pathlib import Path

def cleanup_file_structure():
    """清理文件结构"""
    print("🧹 开始清理文件结构...")
    
    # 需要保留的核心文件
    core_files = [
        'index.html',      # 登录页面（默认页面）
        'main.html',       # 主页面
        'auth.js',         # 权限控制脚本
        'script.js',       # 主功能脚本
        'styles.css',      # 样式文件
        'researchgroup_website.html',  # 研究组网站
        'base_list2.html', # 剪力墙数据库
        'mindmap-viewer.html',  # 思维导图查看器
    ]
    
    # 需要保留的目录
    core_dirs = [
        'cSs',      # CSS样式目录
        'figurE',   # 图片目录
        'js',       # JavaScript目录
        'database', # 数据库目录
    ]
    
    # 需要删除的重复文件
    files_to_remove = [
        'auth.html',  # 重复的登录页面
    ]
    
    # 删除重复文件
    for file in files_to_remove:
        if os.path.exists(file):
            os.remove(file)
            print(f"✅ 已删除重复文件: {file}")
    
    # 检查核心文件是否存在
    missing_files = []
    for file in core_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ 缺少核心文件: {', '.join(missing_files)}")
        return False
    
    print("✅ 文件结构检查完成")
    return True

def create_redirect_pages():
    """创建重定向页面"""
    print("🔄 创建重定向页面...")
    
    # 创建从旧链接到新链接的重定向
    redirect_html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面重定向</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .redirect-container {
            background: white;
            color: #333;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="redirect-container">
        <h2>页面重定向中...</h2>
        <div class="spinner"></div>
        <p>正在跳转到课题进度管理系统...</p>
        <p>如果没有自动跳转，请点击 <a href="index.html">这里</a></p>
    </div>
    
    <script>
        // 自动跳转到登录页面
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    </script>
</body>
</html>"""
    
    # 创建重定向页面
    with open('auth.html', 'w', encoding='utf-8') as f:
        f.write(redirect_html)
    
    print("✅ 已创建重定向页面: auth.html")

def create_readme():
    """创建README文件"""
    readme_content = """# 鲁懿虬老师课题组 - 课题进度管理系统

## 🎯 系统概述

本系统是专为鲁懿虬老师课题组设计的课题进度管理平台，集成了项目进度管理、任务跟踪、时间线管理、文件管理和技术路线图等功能。

## 🌐 访问地址

- **主页面**: https://shearwall-confine.github.io
- **课题进度管理**: https://shearwall-confine.github.io/main.html
- **剪力墙数据库**: https://shearwall-confine.github.io/base_list2.html

## 🔐 用户账户

### 查看者账户
- **用户名**: viewer
- **密码**: 123456
- **权限**: 只能查看项目进度，无法编辑

### 编辑者账户
- **用户名**: admin
- **密码**: admin123
- **权限**: 可以查看和编辑所有内容

## 📱 主要功能

### 课题进度管理
- ✅ 项目概览和进度跟踪
- ✅ 任务管理和分配
- ✅ 时间线管理
- ✅ 文件管理和共享
- ✅ 技术路线图规划
- ✅ 成果展示

### 剪力墙数据库
- ✅ 试验数据查询
- ✅ 数据可视化
- ✅ 统计分析

## 🛠️ 技术特性

- **响应式设计**: 支持各种设备访问
- **用户权限控制**: 区分查看者和编辑者权限
- **数据持久化**: 数据存储在用户浏览器中
- **主题切换**: 支持多种主题配色
- **文件管理**: 支持文件上传和下载

## 📞 技术支持

如有问题，请联系课题组管理员。

---

**同济大学 | 结构防灾减灾工程系 | 鲁懿虬老师课题组**
"""
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("✅ 已更新README.md文件")

def main():
    print("=" * 60)
    print("   鲁懿虬老师课题组 - 文件结构清理工具")
    print("=" * 60)
    print()
    
    # 清理文件结构
    if not cleanup_file_structure():
        print("❌ 文件结构清理失败")
        return
    
    # 创建重定向页面
    create_redirect_pages()
    
    # 创建README
    create_readme()
    
    print()
    print("=" * 60)
    print("🎉 文件结构清理完成！")
    print("=" * 60)
    print()
    print("📋 清理结果：")
    print("✅ 删除了重复的auth.html文件")
    print("✅ 创建了重定向页面")
    print("✅ 更新了README.md文件")
    print("✅ 文件结构已优化")
    print()
    print("🚀 现在可以重新上传到GitHub了！")

if __name__ == "__main__":
    main()
