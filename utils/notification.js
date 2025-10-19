/**
 * 现代化通知系统
 * 替换alert()和confirm()，提供更好的用户体验
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }
    
    init() {
        // 创建通知容器
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }
    
    /**
     * 显示通知
     * @param {string} message - 消息内容
     * @param {string} type - 类型: success, error, warning, info
     * @param {number} duration - 显示时长(毫秒)
     */
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // 样式配置
        const styles = {
            success: {
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                icon: '✓'
            },
            error: {
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                color: 'white',
                icon: '✕'
            },
            warning: {
                background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                color: '#212529',
                icon: '⚠'
            },
            info: {
                background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                color: 'white',
                icon: 'ℹ'
            }
        };
        
        const style = styles[type] || styles.info;
        
        notification.style.cssText = `
            background: ${style.background};
            color: ${style.color};
            padding: 16px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 18px;">${style.icon}</span>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: 8px;
            ">×</button>
        `;
        
        this.container.appendChild(notification);
        
        // 动画显示
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            this.hide(notification);
        }, duration);
        
        // 点击隐藏
        notification.addEventListener('click', () => {
            this.hide(notification);
        });
    }
    
    hide(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }
    
    // 便捷方法
    success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

/**
 * 现代化确认对话框
 */
class ConfirmDialog {
    static show(message, title = '确认') {
        return new Promise((resolve) => {
            // 创建遮罩层
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            `;
            
            // 创建对话框
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transform: scale(0.9);
                transition: transform 0.2s ease;
            `;
            
            dialog.innerHTML = `
                <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">${title}</h3>
                <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="cancel-btn" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">取消</button>
                    <button id="confirm-btn" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">确认</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            // 动画显示
            setTimeout(() => {
                dialog.style.transform = 'scale(1)';
            }, 10);
            
            // 事件处理
            const cancelBtn = dialog.querySelector('#cancel-btn');
            const confirmBtn = dialog.querySelector('#confirm-btn');
            
            const cleanup = () => {
                dialog.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 200);
            };
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            
            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            // ESC键取消
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    }
}

// 初始化通知系统
const notificationSystem = new NotificationSystem();

// 全局函数
window.showNotification = (message, type, duration) => {
    notificationSystem.show(message, type, duration);
};

window.showConfirm = (message, title) => {
    return ConfirmDialog.show(message, title);
};

// 替换原有的alert和confirm
window.alert = (message) => {
    notificationSystem.error(message, 5000);
};

window.confirm = (message) => {
    return ConfirmDialog.show(message, '确认');
};
