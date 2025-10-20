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
      passwordHash: '09208fc77dde6d10c1963a1939108648:737b69d98f350265393c47428feb988fa3f1c18bd4a950471ea23fb238e93df0f5701f2382f9b1c669d217bf1aebbf4f1413b0cdd98204a92dee9a444527087e'
    },
    'editor': {
      username: 'editor', 
      role: 'editor',
      name: '编辑者',
      email: 'editor@example.com',
      passwordHash: 'b77b6cd029cebc863f611aca856aa81f:f8fc82988fbbbdefc9b44a86836c6040762340a583e437f999701161621d44180c7275dbf1693ae3592c652547479a290e8e299a53cd2af25ff3bffa7f54ec67'
    },
    'viewer': {
      username: 'viewer',
      role: 'viewer', 
      name: '查看者',
      email: 'viewer@example.com',
      passwordHash: '53b1ea9f096995a077150f127f312a4b:1f9185b9a418bc11c4a1925d969c7fbb09bda3fb2fdeecf9e27ae1b6e4385134eb0d35da53daccc47bdcc3f843adaa88c273137215e3270624482ca183bffa2b'
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
