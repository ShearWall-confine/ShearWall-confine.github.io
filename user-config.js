/**
 * 用户配置文件
 * 用于管理用户账号和权限
 * 注意：此文件应放在服务器端，不应暴露在前端代码中
 */

// 用户数据库配置
const USER_CONFIG = {
    // 默认用户（仅用于开发测试）
    defaultUsers: {
        'admin': {
            passwordHash: 'hash_Tongji2024@Admin', // 实际应该是bcrypt等安全哈希
            role: 'editor',
            name: '管理员',
            email: 'admin@tongji.edu.cn',
            created: '2024-01-01',
            lastLogin: null,
            isActive: true
        },
        'viewer': {
            passwordHash: 'hash_Tongji2024@Viewer',
            role: 'viewer',
            name: '查看者',
            email: 'viewer@tongji.edu.cn',
            created: '2024-01-01',
            lastLogin: null,
            isActive: true
        },
        'editor': {
            passwordHash: 'hash_Tongji2024@Editor',
            role: 'editor',
            name: '编辑者',
            email: 'editor@tongji.edu.cn',
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
 * 简单的密码哈希函数
 * 注意：生产环境应使用bcrypt等更安全的哈希算法
 * @param {string} password - 明文密码
 * @returns {string} 哈希值
 */
function hashPassword(password) {
    // 这里使用简单的哈希，生产环境应使用bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + hash.toString();
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 哈希值
 * @returns {boolean} 是否匹配
 */
function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
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
