# GitHub同步文件保存位置说明

## 📍 文件保存位置

### **GitHub仓库路径**
```
仓库: ShearWall-confine/ShearWall-confine.github.io
文件: data_saved/shared-project-data.json
完整URL: https://github.com/ShearWall-confine/ShearWall-confine.github.io/blob/main/data_saved/shared-project-data.json
```

### **配置信息**
```javascript
// github-sync.js 第8-10行
this.repoOwner = 'ShearWall-confine';
this.repoName = 'ShearWall-confine.github.io';
this.dataPath = 'data_saved/shared-project-data.json';
```

## 📂 文件结构

### **仓库目录结构**
```
ShearWall-confine.github.io/
├── index.html
├── project-management.html
├── login.html
├── user-management.html
├── password-generator.html
├── data_saved/
│   └── shared-project-data.json  ← 同步数据存储位置
├── header.css
├── auth.js
├── script.js
└── github-sync.js
```

### **数据文件内容**
```json
{
  "projectName": "项目名称",
  "tasks": [
    {
      "id": 1234567890,
      "title": "任务标题",
      "description": "任务描述",
      "status": "进行中",
      "priority": "高",
      "progress": 50,
      "startDate": "2024-10-19",
      "endDate": "2024-12-31",
      "subtasks": []
    }
  ],
  "timeline": [
    {
      "id": 1234567891,
      "title": "时间线项目",
      "date": "2024-10-19",
      "isSynced": true
    }
  ],
  "lastUpdated": "2024-10-19T15:30:00.000Z"
}
```

## 🔄 同步机制

### **保存流程**
1. **本地保存**：立即保存到 `localStorage`
2. **防抖延迟**：2秒后触发GitHub同步
3. **频率限制**：30秒内最多同步一次
4. **API调用**：通过GitHub API保存到仓库

### **加载流程**
1. **检查本地**：优先从 `localStorage` 加载
2. **GitHub同步**：从GitHub仓库加载最新数据
3. **数据合并**：合并本地和云端数据
4. **界面更新**：更新所有相关界面

## 🛠️ 访问方式

### **直接访问**
- **GitHub网页**：https://github.com/ShearWall-confine/ShearWall-confine.github.io/blob/main/data_saved/shared-project-data.json
- **原始数据**：https://raw.githubusercontent.com/ShearWall-confine/ShearWall-confine.github.io/main/data_saved/shared-project-data.json

### **API访问**
```javascript
// 获取文件内容
fetch('https://api.github.com/repos/ShearWall-confine/ShearWall-confine.github.io/contents/data_saved/shared-project-data.json')
  .then(response => response.json())
  .then(data => {
    const content = JSON.parse(atob(data.content));
    console.log('项目数据:', content);
  });
```

## 🔐 权限要求

### **读取权限**
- ✅ **公开仓库**：任何人都可以读取
- ✅ **无需认证**：可以直接访问文件内容

### **写入权限**
- ✅ **Personal Access Token**：需要GitHub Token
- ✅ **仓库权限**：Contents (Read and write)
- ✅ **API限制**：每小时最多5000次请求

## 📊 数据格式

### **编码方式**
- **存储格式**：Base64编码
- **字符编码**：UTF-8
- **数据格式**：JSON

### **同步状态**
```javascript
// 同步状态标识
{
  "isSynced": true,           // 是否已同步到GitHub
  "lastSyncTime": "2024-10-19T15:30:00.000Z",  // 最后同步时间
  "syncStatus": "success"     // 同步状态：success/error/pending
}
```

## 🚨 注意事项

### **数据安全**
- ✅ **加密存储**：密码使用哈希加密
- ✅ **权限控制**：基于角色的访问控制
- ✅ **数据备份**：本地和云端双重备份

### **同步限制**
- ✅ **频率限制**：30秒内最多同步一次
- ✅ **API限制**：每小时最多4000次请求
- ✅ **防抖机制**：2秒防抖延迟

### **错误处理**
- ✅ **网络错误**：自动重试机制
- ✅ **权限错误**：降级到本地存储
- ✅ **数据冲突**：以最新数据为准

## 🎯 使用建议

### **开发环境**
- 使用本地存储进行开发测试
- 定期同步到GitHub进行备份

### **生产环境**
- 启用GitHub同步功能
- 监控API调用频率
- 定期检查数据完整性

### **团队协作**
- 所有用户共享同一份数据
- 实时同步更新
- 冲突自动解决

---

**文件位置**: `data_saved/shared-project-data.json`  
**仓库地址**: https://github.com/ShearWall-confine/ShearWall-confine.github.io  
**最后更新**: 2024年10月19日
