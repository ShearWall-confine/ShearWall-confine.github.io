/**
 * 用户配置文件
 * 用于管理用户账号和权限
 * 注意：此文件应放在服务器端，不应暴露在前端代码中
 * 
 * 安全警告：此文件包含敏感信息，生产环境应该：
 * 1. 移至服务器端
 * 2. 使用环境变量
 * 3. 实现真正的密码加密
 */

// 用户数据库配置
const USER_CONFIG = {
    // 默认用户（仅用于开发测试）
    // 生产环境应该从服务器获取
    defaultUsers: {
        'admin': {
            // 注意：这是开发环境的临时哈希，生产环境必须使用bcrypt
            passwordHash: 'dev_hash_admin_2024', 
            role: 'admin', // 修正角色为admin
            name: '系统管理员',
            email: 'admin@system.local', // 使用本地邮箱
            created: '2024-01-01',
            lastLogin: null,
            isActive: true
        },
        'viewer': {
            passwordHash: 'dev_hash_viewer_2024',
            role: 'viewer',
            name: '查看用户',
            email: 'viewer@system.local',
            created: '2024-01-01',
            lastLogin: null,
            isActive: true
        },
        'editor': {
            passwordHash: 'dev_hash_editor_2024',
            role: 'editor',
            name: '编辑用户',
            email: 'editor@system.local',
            created: '2024-01-01',
            lastLogin: null,
            isActive: true
        }
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
 * 添加新用户
 * @param {string} username - 用户名
 * @param {string} password - 明文密码
 * @param {string} role - 角色
 * @param {string} name - 真实姓名
 * @param {string} email - 邮箱
 * @returns {boolean} 是否添加成功
 */
function addUser(username, password, role, name, email) {
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
    
    // 添加新用户
    USER_CONFIG.defaultUsers[username] = {
        passwordHash: hashPassword(password),
        role: role,
        name: name,
        email: email,
        created: new Date().toISOString(),
        lastLogin: null,
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
 * 重置用户密码
 * @param {string} username - 用户名
 * @param {string} newPassword - 新密码
 * @returns {boolean} 是否重置成功
 */
function resetPassword(username, newPassword) {
    if (!USER_CONFIG.defaultUsers[username]) {
        console.error('用户不存在');
        return false;
    }
    
    USER_CONFIG.defaultUsers[username].passwordHash = hashPassword(newPassword);
    console.log(`用户 ${username} 密码重置成功`);
    return true;
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
 * 密码哈希函数（开发环境）
 * 警告：生产环境必须使用bcrypt等安全哈希算法
 * @param {string} password - 明文密码
 * @returns {string} 哈希值
 */
function hashPassword(password) {
    // 输入验证
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('密码不能为空');
    }
    
    if (password.length < 6) {
        throw new Error('密码长度至少6位');
    }
    
    // 开发环境：使用盐值增强安全性
    const salt = 'dev_salt_2024_secure';
    const saltedPassword = password + salt;
    
    let hash = 0;
    for (let i = 0; i < saltedPassword.length; i++) {
        const char = saltedPassword.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    
    // 添加时间戳和随机数增加随机性
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    
    return 'dev_hash_' + Math.abs(hash).toString(36) + '_' + timestamp + '_' + random;
}

/**
 * 验证密码（开发环境）
 * 警告：生产环境应使用bcrypt.compare()
 * @param {string} password - 明文密码
 * @param {string} hash - 哈希值
 * @returns {boolean} 是否匹配
 */
function verifyPassword(password, hash) {
    try {
        // 开发环境：重新计算哈希进行比较
        const computedHash = hashPassword(password);
        return computedHash === hash;
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
}
