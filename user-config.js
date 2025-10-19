/**
 * 用户配置文件
 * 基础版本 - 使用开发环境配置
 */

const USER_CONFIG = {
  defaultUsers: {
    'admin': {
      username: 'admin',
      role: 'admin',
      name: '系统管理员',
      email: 'admin@example.com',
      passwordHash: 'dev_admin_hash_placeholder'
    },
    'editor': {
      username: 'editor', 
      role: 'editor',
      name: '编辑者',
      email: 'editor@example.com',
      passwordHash: 'dev_editor_hash_placeholder'
    },
    'viewer': {
      username: 'viewer',
      role: 'viewer', 
      name: '查看者',
      email: 'viewer@example.com',
      passwordHash: 'dev_viewer_hash_placeholder'
    }
  }
};

// 简单的密码验证函数（开发环境）
function verifyPassword(inputPassword, storedHash) {
  // 开发环境简单验证
  const devPasswords = {
    'admin': 'Tongji2024@Admin',
    'editor': 'Tongji2024@Editor',
    'viewer': 'Tongji2024@Viewer'
  };
  
  // 简单的密码匹配
  for (const [role, password] of Object.entries(devPasswords)) {
    if (inputPassword === password) {
      return true;
    }
  }
  return false;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    USER_CONFIG,
    verifyPassword
  };
} else {
  // 浏览器环境
  window.USER_CONFIG = USER_CONFIG;
  window.verifyPassword = verifyPassword;
}
