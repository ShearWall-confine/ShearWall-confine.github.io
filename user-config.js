/**
 * 用户配置文件
 * 用于管理用户账号和权限
 * 
 * 安全警告：此文件已移除所有敏感信息
 * 在GitHub Pages环境中，所有用户数据应通过以下方式管理：
 * 1. 使用GitHub Secrets存储敏感信息
 * 2. 通过GitHub Actions动态生成配置文件
 * 3. 使用外部认证服务
 */

// 用户数据库配置（已移除敏感信息）
const USER_CONFIG = {
    // 默认用户（仅用于开发测试，无敏感信息）
    defaultUsers: {
        'admin': {
            role: 'admin',
            name: '系统管理员',
            created: '2024-01-01',
            isActive: true
        },
        'viewer': {
            role: 'viewer',
            name: '查看用户',
            created: '2024-01-01',
            isActive: true
        },
        'editor': {
            role: 'editor',
            name: '编辑用户',
            created: '2024-01-01',
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
 * 密码哈希函数（已移除）
 * 警告：密码管理应在服务器端进行
 */
function hashPassword(password) {
    console.warn('密码哈希功能已移除，请在服务器端管理密码');
    throw new Error('密码管理应在服务器端进行');
}

/**
 * 验证密码（已移除）
 * 警告：密码验证应在服务器端进行
 */
function verifyPassword(password, hash) {
    console.warn('密码验证功能已移除，请在服务器端进行密码验证');
    return false;
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
