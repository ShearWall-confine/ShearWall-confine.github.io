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
    const isLoginPage = currentPage === 'login.html' || currentPage === 'login-test.html' || currentPage === 'index.html';
    
    console.log('当前页面:', currentPage, '是否为登录页面:', isLoginPage);
    
    // 如果不是登录页面，才检查认证状态
    if (!isLoginPage) {
        checkAuthentication();
    }
});

// 检查用户认证状态
function checkAuthentication() {
    const userData = sessionStorage.getItem('currentUser');
    
    if (!userData) {
        // 未登录，跳转到登录页面（但避免在登录页面本身执行）
        const currentPage = window.location.pathname.split('/').pop();
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

// 设置用户权限
function setUserPermissions() {
    if (!currentUser) return;
    
    switch (currentUser.role) {
        case 'editor':
            userPermissions = {
                canEdit: true,
                canView: true,
                canExport: true,
                canImport: true
            };
            break;
        case 'viewer':
            userPermissions = {
                canEdit: false,
                canView: true,
                canExport: false,
                canImport: false
            };
            break;
        default:
            userPermissions = {
                canEdit: false,
                canView: false,
                canExport: false,
                canImport: false
            };
    }
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
    const editButtons = document.querySelectorAll('button[onclick*="edit"], button[onclick*="add"], button[onclick*="upload"], button[onclick*="new"]');
    editButtons.forEach(btn => {
        if (btn.textContent.includes('编辑') || 
            btn.textContent.includes('添加') || 
            btn.textContent.includes('上传') || 
            btn.textContent.includes('新建')) {
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
    
    // 禁用表单输入
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        if (!input.id.includes('search') && !input.id.includes('filter')) {
            input.disabled = true;
        }
    });
}

// 显示用户信息
function showUserInfo() {
    if (!currentUser) return;
    
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
                <span class="user-role">${currentUser.role === 'editor' ? '编辑者' : '查看者'}</span>
            </div>
            <button class="btn btn-logout" onclick="logout()" title="退出登录">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        
        header.appendChild(userInfo);
    }
}

// 登录函数
function login(username, password) {
    // 模拟用户数据库
    const users = {
        'admin': { password: 'admin123', role: 'editor', name: '管理员' },
        'viewer': { password: 'viewer123', role: 'viewer', name: '查看者' },
        'editor': { password: 'editor123', role: 'editor', name: '编辑者' }
    };
    
    // 验证用户名和密码
    if (users[username] && users[username].password === password) {
        const userData = {
            username: username,
            role: users[username].role,
            name: users[username].name,
            loginTime: new Date().toISOString()
        };
        
        // 保存用户信息到sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        currentUser = userData;
        setUserPermissions();
        
        console.log('登录成功:', userData);
        return true;
    } else {
        console.log('登录失败: 用户名或密码错误');
        return false;
    }
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
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
