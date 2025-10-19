/**
 * 用户配置文件
 * 用于管理用户账号和权限
 * 
 * 安全配置：
 * - 生产环境：从GitHub Secrets获取密码哈希
 * - 开发环境：使用默认配置
 * - 自动检测环境并选择相应配置
 */

// 防止重复加载
if (window.USER_CONFIG_LOADED) {
    console.warn('user-config.js 已经加载过，跳过重复加载');
} else {
    window.USER_CONFIG_LOADED = true;
    console.log('user-config.js 开始加载...');

    // 检测环境
    const isProduction = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

// 获取GitHub Secrets配置
function getGitHubSecrets() {
    // 在GitHub Pages环境中，这些值应该通过GitHub Actions注入
    // 或者通过服务器端API获取
    const secrets = {
        ADMIN_PASSWORD_HASH: window.GITHUB_SECRETS?.ADMIN_PASSWORD_HASH || 'dev_hash_admin_2024',
        EDITOR_PASSWORD_HASH: window.GITHUB_SECRETS?.EDITOR_PASSWORD_HASH || 'dev_hash_editor_2024',
        VIEWER_PASSWORD_HASH: window.GITHUB_SECRETS?.VIEWER_PASSWORD_HASH || 'dev_hash_viewer_2024',
        JWT_SECRET: window.GITHUB_SECRETS?.JWT_SECRET || 'dev_jwt_secret',
        ENCRYPTION_KEY: window.GITHUB_SECRETS?.ENCRYPTION_KEY || 'dev_encryption_key'
    };
    
    return secrets;
}

// 用户数据库配置
const USER_CONFIG = {
    // 默认用户配置
    defaultUsers: {
        'admin': {
            // 从GitHub Secrets获取密码哈希
            passwordHash: getGitHubSecrets().ADMIN_PASSWORD_HASH,
            role: 'admin',
            name: '系统管理员',
            email: 'admin@system.local',
            created: '2024-01-01',
            lastLogin: null,
            isActive: true
        },
        'editor': {
            passwordHash: getGitHubSecrets().EDITOR_PASSWORD_HASH,
            role: 'editor',
            name: '编辑用户',
            email: 'editor@system.local',
            created: '2024-01-01',
            lastLogin: null,
            isActive: true
        },
        'viewer': {
            passwordHash: getGitHubSecrets().VIEWER_PASSWORD_HASH,
            role: 'viewer',
            name: '查看用户',
            email: 'viewer@system.local',
            created: '2024-01-01',
            lastLogin: null,
            isActive: true
        }
    },
    
    // 安全配置
    security: {
        jwtSecret: (typeof process !== 'undefined' && process.env.JWT_SECRET) || 'dev_jwt_secret',
        encryptionKey: (typeof process !== 'undefined' && process.env.ENCRYPTION_KEY) || 'dev_encryption_key',
        sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15分钟
    },
    
    // 角色权限配置
    roles: {
        'admin': {
            canView: true,
            canEdit: true,
            canDelete: true,
            canExport: true,
            canImport: true,
            canManageUsers: true
        },
        'editor': {
            canView: true,
            canEdit: true,
            canDelete: false,
            canExport: true,
            canImport: true,
            canManageUsers: false
        },
        'viewer': {
            canView: true,
            canEdit: false,
            canDelete: false,
            canExport: false,
            canImport: false,
            canManageUsers: false
        }
    }
};

/**
 * 添加新用户（仅用于开发环境）
 * @param {string} username - 用户名
 * @param {string} role - 角色
 * @param {string} name - 真实姓名
 * @returns {boolean} 是否添加成功
 */
function addUser(username, role, name) {
    // 检查用户名是否已存在
    if (USER_CONFIG.defaultUsers[username]) {
        console.error('用户名已存在');
        return false;
    }
    
    // 检查角色是否有效
    if (!USER_CONFIG.roles[role]) {
        console.error('无效的角色');
        return false;
    }
    
    // 添加新用户（无敏感信息）
    USER_CONFIG.defaultUsers[username] = {
        role: role,
        name: name,
        created: new Date().toISOString(),
        isActive: true
    };
    
    console.log(`用户 ${username} 添加成功`);
    return true;
}

/**
 * 更新用户信息
 * @param {string} username - 用户名
 * @param {Object} updates - 更新内容
 * @returns {boolean} 是否更新成功
 */
function updateUser(username, updates) {
    if (!USER_CONFIG.defaultUsers[username]) {
        console.error('用户不存在');
        return false;
    }
    
    // 更新用户信息
    Object.assign(USER_CONFIG.defaultUsers[username], updates);
    
    console.log(`用户 ${username} 更新成功`);
    return true;
}

/**
 * 删除用户
 * @param {string} username - 用户名
 * @returns {boolean} 是否删除成功
 */
function deleteUser(username) {
    if (!USER_CONFIG.defaultUsers[username]) {
        console.error('用户不存在');
        return false;
    }
    
    delete USER_CONFIG.defaultUsers[username];
    console.log(`用户 ${username} 删除成功`);
    return true;
}

/**
 * 重置用户密码（已移除，密码管理应在服务器端）
 * @param {string} username - 用户名
 * @returns {boolean} 是否重置成功
 */
function resetPassword(username) {
    console.warn('密码重置功能已移除，请在服务器端管理密码');
    return false;
}

/**
 * 获取用户列表
 * @returns {Array} 用户列表
 */
function getUserList() {
    return Object.keys(USER_CONFIG.defaultUsers).map(username => {
        const user = USER_CONFIG.defaultUsers[username];
        return {
            username: username,
            name: user.name,
            role: user.role,
            email: user.email,
            created: user.created,
            lastLogin: user.lastLogin,
            isActive: user.isActive
        };
    });
}

/**
 * 密码哈希函数
 * 支持环境变量和开发环境
 */
function hashPassword(password) {
    // 输入验证
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('密码不能为空');
    }
    
    if (password.length < 6) {
        throw new Error('密码长度至少6位');
    }
    
    // 检查是否在Node.js环境中（可以使用crypto模块）
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
        try {
            const crypto = require('crypto');
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
            return `${salt}:${hash}`;
        } catch (error) {
            console.error('密码哈希失败:', error);
            throw new Error('密码哈希失败');
        }
    }
    
    // 开发环境：使用简单的哈希
    const salt = 'dev_salt_2024_secure';
    const saltedPassword = password + salt;
    
    let hash = 0;
    for (let i = 0; i < saltedPassword.length; i++) {
        const char = saltedPassword.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    
    return 'dev_hash_' + Math.abs(hash).toString(36) + '_' + timestamp + '_' + random;
}

/**
 * 验证密码
 * 支持环境变量和开发环境
 */
function verifyPassword(password, storedHash) {
    try {
        // 检查是否是生产环境的哈希格式（salt:hash）
        if (storedHash.includes(':')) {
            const [salt, hash] = storedHash.split(':');
            if (!salt || !hash) {
                console.error('无效的哈希格式');
                return false;
            }
            
            // 检查是否在Node.js环境中
            if (typeof process !== 'undefined') {
                try {
                    const crypto = require('crypto');
                    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
                    return computedHash === hash;
                } catch (error) {
                    console.error('密码验证失败:', error);
                    return false;
                }
            }
        }
        
        // 开发环境：重新计算哈希进行比较
        const computedHash = hashPassword(password);
        return computedHash === storedHash;
    } catch (error) {
        console.error('密码验证失败:', error.message);
        return false;
    }
}

    // 导出配置（如果使用模块系统）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            USER_CONFIG,
            addUser,
            updateUser,
            deleteUser,
            resetPassword,
            getUserList,
            hashPassword,
            verifyPassword
        };
    } else {
        // 浏览器环境
        window.USER_CONFIG = USER_CONFIG;
        window.addUser = addUser;
        window.updateUser = updateUser;
        window.deleteUser = deleteUser;
        window.resetPassword = resetPassword;
        window.getUserList = getUserList;
        window.hashPassword = hashPassword;
        window.verifyPassword = verifyPassword;
    }
    
    console.log('user-config.js 加载完成');
}
