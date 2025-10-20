/**
 * 用户配置文件
 * 包含完整的用户信息和权限配置
 * 生成时间: 2025-10-20 13:31:25
 */

const USER_CONFIG = {
  defaultUsers: {
    'admin': {
      username: 'admin',
      role: 'admin',
      name: '系统管理员',
      email: 'admin@example.com',
      passwordHash: 'a8a25210f4cdcd8b629ebadb6c46d0a7:30c9ae72fd755ff377c812b048cfc13ebd1086f982eb2c9f4077261863b49e111366921326518e879a5506160fb4f3d4ad63d4d86ad47dc0ccd3c003a91485be'
    },
    'editor': {
      username: 'editor', 
      role: 'editor',
      name: '编辑者',
      email: 'editor@example.com',
      passwordHash: 'f023a309ea6013e489f7862e6dc28cf2:1c86b766ad2a81624c1c6b798fb04b3cef46fea8053bf1de5651bca70025ae06e990bc62355bc9aacd5639392f85c302aa18591688880eb3fe6936572bbb5367'
    },
    'viewer': {
      username: 'viewer',
      role: 'viewer', 
      name: '查看者',
      email: 'viewer@example.com',
      passwordHash: '4a61575d58676013b7ed6f5a2ff22ef3:806e9644907204002f9970a1bc58bb7811213794827d63dce2da67cca7a4e9d59fc5b9edca5c5a10d99ea2b1f8f0d5d7bfa316b71ea599fd2f1878b260a6611d'
    }
  }
};

// PBKDF2 密码验证函数
async function verifyPBKDF2(password, salt, hash) {
  try {
    // 将 salt 从 hex 转换为 Uint8Array
    const saltBytes = new Uint8Array(salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // 导入密码
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // 使用 PBKDF2 派生密钥
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 10000,
        hash: 'SHA-512'
      },
      keyMaterial,
      512 // 512 bits = 64 bytes
    );
    
    // 将结果转换为 hex 字符串
    const derivedHash = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return derivedHash === hash;
  } catch (error) {
    console.error('PBKDF2 验证失败:', error);
    return false;
  }
}

// 密码验证函数
async function verifyPassword(inputPassword, storedHash) {
  try {
    // 检查是否是 PBKDF2 格式（salt:hash）
    if (storedHash.includes(':')) {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) {
        console.error('无效的哈希格式');
        return false;
      }
      
      // 使用 PBKDF2 算法验证
      return await verifyPBKDF2(inputPassword, salt, hash);
    }
    
    // 回退到 simpleHash 验证（开发环境）
    if (typeof window !== 'undefined' && window.simpleHash) {
      return window.simpleHash(inputPassword) === storedHash;
    }
    
    console.warn('⚠️ 无法验证密码：未知的哈希格式');
    return false;
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
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
