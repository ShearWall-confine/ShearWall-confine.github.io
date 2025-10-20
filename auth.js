// 权限控制系统
let currentUser = null;
let userPermissions = {
    canEdit: false,
    canView: false,
    canExport: false,
    canImport: false
};

// 页面加载时检查用户权限（排除登录页面）
document.addEventListener('DOMContentLoaded', function() {
    // 防止重复执行
    if (window.authInitialized) {
        return;
    }
    window.authInitialized = true;
    
    // 检查当前页面是否为登录页面
    const currentPage = window.location.pathname.split('/').pop();
    const isLoginPage = currentPage === 'login.html' || currentPage === 'login-test.html';
    
    console.log('当前页面:', currentPage, '是否为登录页面:', isLoginPage);
    
    // 如果不是登录页面，才检查认证状态
    if (!isLoginPage) {
        checkAuthentication();
    } else {
        // 在登录页面，不自动设置游客模式，让用户可以选择登录或游客模式
        console.log('在登录页面，等待用户选择登录或游客模式');
    }
});

// 检查用户认证状态
function checkAuthentication() {
    const userData = sessionStorage.getItem('currentUser');
    const currentPage = window.location.pathname.split('/').pop();
    
    // 允许游客访问的页面列表
    const guestAllowedPages = [
        'index.html',
        'login.html', 
        'login-test.html',
        'database.html'
    ];
    
    // 如果是允许游客访问的页面，不强制登录
    if (guestAllowedPages.includes(currentPage)) {
        console.log('当前页面允许游客访问:', currentPage);
        if (!userData) {
            // 设置游客模式
            setGuestMode();
        }
        return;
    }
    
    if (!userData) {
        // 未登录，跳转到登录页面（但避免在登录页面本身执行）
        if (currentPage !== 'login.html' && currentPage !== 'login-test.html') {
            window.location.href = 'login.html';
        }
        return;
    }
    
    try {
        currentUser = JSON.parse(userData);
        setUserPermissions();
        updateUIForUserRole();
        showUserInfo();
    } catch (error) {
        console.error('用户数据解析错误:', error);
        sessionStorage.removeItem('currentUser');
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'login.html' && currentPage !== 'login-test.html') {
            window.location.href = 'login.html';
        }
    }
}

// 设置游客模式
function setGuestMode() {
    console.log('设置游客模式');
    
    // 创建游客用户数据
    const guestUser = {
        username: 'guest',
        role: 'guest',
        name: '游客',
        email: 'guest@example.com',
        loginTime: new Date().toISOString(),
        isGuest: true
    };
    
    // 设置游客权限（只读权限）
    userPermissions = {
        canEdit: false,
        canView: true,
        canExport: false,
        canImport: false
    };
    
    // 保存游客信息
    sessionStorage.setItem('currentUser', JSON.stringify(guestUser));
    currentUser = guestUser;
    
    // 更新UI
    updateUIForUserRole();
    showUserInfo();
    
    console.log('游客模式已设置');
}

// 设置用户权限
function setUserPermissions() {
    if (!currentUser) return;
    
    const permissionMap = {
        'admin': { canEdit: true, canView: true, canExport: true, canImport: true },
        'editor': { canEdit: true, canView: true, canExport: true, canImport: true },
        'viewer': { canEdit: false, canView: true, canExport: false, canImport: false },
        'guest': { canEdit: false, canView: true, canExport: false, canImport: false }
    };
    
    userPermissions = permissionMap[currentUser.role] || {
        canEdit: false,
        canView: false,
        canExport: false,
        canImport: false
    };
}

// 根据用户角色更新UI
function updateUIForUserRole() {
    if (!userPermissions.canEdit) {
        // 隐藏所有编辑按钮
        hideEditButtons();
        disableEditFeatures();
    }
    
    if (!userPermissions.canExport) {
        // 隐藏导出按钮
        const exportBtn = document.querySelector('button[onclick="exportData()"]');
        if (exportBtn) exportBtn.style.display = 'none';
    }
    
    if (!userPermissions.canImport) {
        // 隐藏导入按钮
        const importBtn = document.querySelector('button[onclick="importData()"]');
        if (importBtn) importBtn.style.display = 'none';
    }
    
    // 添加只读样式
    if (!userPermissions.canEdit) {
        document.body.classList.add('readonly-mode');
    }
}

// 隐藏编辑按钮
function hideEditButtons() {
    // 使用更通用的选择器
    const editButtons = document.querySelectorAll(`
        button[onclick*="edit"], 
        button[onclick*="add"], 
        button[onclick*="upload"], 
        button[onclick*="new"],
        .edit-btn,
        .add-btn,
        .upload-btn
    `);
    
    editButtons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('编辑') || text.includes('添加') || 
            text.includes('上传') || text.includes('新建') ||
            text.includes('edit') || text.includes('add')) {
            btn.style.display = 'none';
        }
    });
    
    // 隐藏特定的编辑按钮
    const specificButtons = [
        'button[onclick="addTask()"]',
        'button[onclick="addTimelineItem()"]',
        'button[onclick="addResult()"]',
        'button[onclick="addRoadmapNode()"]',
        'button[onclick="addFolder()"]',
        'button[onclick="uploadFile()"]',
        'button[onclick="editSection"]',
        'button[onclick="editRoadmap()"]'
    ];
    
    specificButtons.forEach(selector => {
        const btn = document.querySelector(selector);
        if (btn) btn.style.display = 'none';
    });
}

// 禁用编辑功能
function disableEditFeatures() {
    // 禁用所有可编辑内容
    const editableElements = document.querySelectorAll('.editable-content');
    editableElements.forEach(element => {
        element.style.pointerEvents = 'none';
        element.style.opacity = '0.7';
    });
    
    // 更精确的表单元素选择
    const editableInputs = document.querySelectorAll(`
        input:not([type="search"]):not([id*="search"]):not([id*="filter"]),
        textarea:not([id*="search"]):not([id*="filter"]),
        select:not([id*="search"]):not([id*="filter"])
    `);
    
    editableInputs.forEach(input => {
        input.disabled = true;
    });
}

// 显示用户信息
function showUserInfo() {
    if (!currentUser) return;
    
    // 检查是否已经存在用户信息，避免重复添加
    const existingUserInfo = document.querySelector('.user-info');
    if (existingUserInfo) {
        existingUserInfo.remove();
    }
    
    // 在头部添加用户信息
    const header = document.querySelector('.header');
    if (header) {
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="user-details">
                <span class="user-name">${currentUser.name}</span>
                <span class="user-role">${getRoleDisplayName(currentUser.role)}</span>
            </div>
            <button class="btn btn-logout" onclick="logout()" title="退出登录">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        
        header.appendChild(userInfo);
    }
}

// 获取角色显示名称
function getRoleDisplayName(role) {
    const roleNames = {
        'admin': '管理员',
        'editor': '编辑者',
        'viewer': '查看者',
        'guest': '游客'
    };
    return roleNames[role] || role;
}

// 简单的密码哈希函数（生产环境应使用更安全的哈希算法）
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
}

// 登录函数
async function login(username, password) {
    console.log('开始用户认证...');
    
    // 检查是否在GitHub Pages环境
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages) {
        // GitHub Pages环境：只使用GitHub Secrets，不允许开发环境回退
        console.log('GitHub Pages环境，仅使用GitHub Secrets认证');
        return await authenticateWithGitHubSecrets(username, password);
    } else {
        // 本地开发环境：使用临时认证
        console.log('本地开发环境，使用开发环境认证');
        return authenticateForDevelopment(username, password);
    }
}

// GitHub Pages环境认证（使用GitHub Secrets）
async function authenticateWithGitHubSecrets(username, password) {
    console.log('使用GitHub Secrets进行认证...');
    
    // 从user-config.js获取用户配置
    if (typeof USER_CONFIG === 'undefined') {
        console.error('USER_CONFIG未定义，请确保user-config.js已加载');
        return false;
    }
    
    const user = USER_CONFIG.defaultUsers[username];
    if (!user) {
        console.log('用户不存在:', username);
        return false;
    }
    
    // 使用user-config.js中的密码验证
    if (typeof verifyPassword === 'function') {
        // 处理异步密码验证
        try {
            const isValid = await verifyPassword(password, user.passwordHash);
            if (isValid) {
                const userData = {
                    username: user.username || username,
                    role: user.role,
                    name: user.name,
                    email: user.email,
                    loginTime: new Date().toISOString()
                };
                
                // 保存用户信息到sessionStorage
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                currentUser = userData;
                setUserPermissions();
                updateUIForUserRole();
                showUserInfo();
                
                console.log('GitHub Secrets认证成功:', userData);
                return true;
            } else {
                console.log('密码错误');
                return false;
            }
        } catch (error) {
            console.error('密码验证异常:', error);
            return false;
        }
    } else {
        console.error('verifyPassword函数未找到，请确保user-config.js已正确引入');
        return false;
    }
}

// 本地开发环境认证（临时方案）
function authenticateForDevelopment(username, password) {
    // 检查是否在GitHub Pages环境，如果是则拒绝开发环境认证
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) {
        console.error('GitHub Pages环境不允许使用开发环境认证');
        return false;
    }
    
    console.warn('使用开发环境临时认证');
    
    // 临时开发环境密码（生产环境应移除）
    // 注意：这些密码仅用于本地开发，生产环境使用GitHub Secrets
    const devPasswords = {
        'admin': 'Tongji2024@Admin',     // 开发环境临时密码
        'editor': 'Tongji2024@Editor',  // 开发环境临时密码
        'viewer': 'Tongji2024@Viewer'   // 开发环境临时密码
    };
    
    if (devPasswords[username] && password === devPasswords[username]) {
        const userData = {
            username: username,
            role: username,
            name: username === 'admin' ? '系统管理员' : 
                  username === 'editor' ? '编辑者' : '查看者',
            loginTime: new Date().toISOString()
        };
        
        // 保存用户信息到sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        currentUser = userData;
        setUserPermissions();
        updateUIForUserRole();
        showUserInfo();
        
        console.log('开发环境认证成功:', userData);
        return true;
    }
    
    console.log('开发环境认证失败');
    return false;
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        sessionStorage.removeItem('currentUser');
        // 如果是游客模式，返回首页；否则跳转到登录页
        if (currentUser && currentUser.isGuest) {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'login.html';
        }
    }
}

// 权限检查函数
function checkPermission(permission) {
    return userPermissions[permission] || false;
}

// 重写原有的编辑函数，添加权限检查
function checkEditPermission() {
    if (!userPermissions.canEdit) {
        showMessage('您没有编辑权限，请联系管理员', 'warning');
        return false;
    }
    return true;
}

// 显示消息
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 添加到页面
    document.body.appendChild(messageDiv);
    
    // 自动移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
    .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-left: auto;
    }
    
    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }
    
    .user-details {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    
    .user-name {
        font-weight: 500;
        color: #333;
        font-size: 14px;
    }
    
    .user-role {
        font-size: 12px;
        color: #666;
    }
    
    .btn-logout {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s ease;
    }
    
    .btn-logout:hover {
        background: #c82333;
    }
    
    .readonly-mode {
        pointer-events: none;
    }
    
    .readonly-mode .editable-content {
        pointer-events: auto;
        opacity: 0.7;
    }
    
    .message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 15px 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    }
    
    .message-warning {
        border-left: 4px solid #ffc107;
        background: #fff3cd;
    }
    
    .message-info {
        border-left: 4px solid #17a2b8;
        background: #d1ecf1;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
