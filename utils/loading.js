/**
 * 加载状态管理
 * 提供骨架屏、加载动画等现代化加载体验
 */

class LoadingManager {
    constructor() {
        this.loadingOverlay = null;
        this.skeletonElements = new Map();
        this.init();
    }
    
    init() {
        this.createLoadingOverlay();
    }
    
    createLoadingOverlay() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'loading-overlay';
        this.loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(2px);
        `;
        
        this.loadingOverlay.innerHTML = `
            <div style="
                background: white;
                padding: 32px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
                min-width: 200px;
            ">
                <div class="spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                "></div>
                <div class="loading-text" style="
                    color: #333;
                    font-size: 16px;
                    font-weight: 500;
                ">加载中...</div>
                <div class="loading-progress" style="
                    width: 100%;
                    height: 4px;
                    background: #f0f0f0;
                    border-radius: 2px;
                    margin-top: 16px;
                    overflow: hidden;
                ">
                    <div class="progress-bar" style="
                        height: 100%;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        border-radius: 2px;
                        width: 0%;
                        transition: width 0.3s ease;
                    "></div>
                </div>
            </div>
        `;
        
        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes skeleton-loading {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
            }
            
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200px 100%;
                animation: skeleton-loading 1.5s infinite;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.loadingOverlay);
    }
    
    /**
     * 显示加载状态
     * @param {string} message - 加载消息
     * @param {number} progress - 进度百分比 (0-100)
     */
    show(message = '加载中...', progress = null) {
        this.loadingOverlay.style.display = 'flex';
        
        const textElement = this.loadingOverlay.querySelector('.loading-text');
        const progressBar = this.loadingOverlay.querySelector('.progress-bar');
        
        if (textElement) {
            textElement.textContent = message;
        }
        
        if (progressBar && progress !== null) {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
    }
    
    /**
     * 隐藏加载状态
     */
    hide() {
        this.loadingOverlay.style.display = 'none';
    }
    
    /**
     * 更新加载进度
     * @param {number} progress - 进度百分比 (0-100)
     * @param {string} message - 可选的消息更新
     */
    updateProgress(progress, message = null) {
        const progressBar = this.loadingOverlay.querySelector('.progress-bar');
        const textElement = this.loadingOverlay.querySelector('.loading-text');
        
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
        
        if (message && textElement) {
            textElement.textContent = message;
        }
    }
    
    /**
     * 为元素创建骨架屏
     * @param {HTMLElement} element - 目标元素
     * @param {string} type - 骨架屏类型: text, card, list, table
     */
    createSkeleton(element, type = 'text') {
        if (!element) return;
        
        const originalContent = element.innerHTML;
        const skeletonId = `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 保存原始内容
        this.skeletonElements.set(skeletonId, {
            element: element,
            originalContent: originalContent,
            type: type
        });
        
        // 根据类型生成骨架屏
        let skeletonHTML = '';
        
        switch (type) {
            case 'text':
                skeletonHTML = `
                    <div class="skeleton" style="height: 16px; margin-bottom: 8px;"></div>
                    <div class="skeleton" style="height: 16px; width: 80%; margin-bottom: 8px;"></div>
                    <div class="skeleton" style="height: 16px; width: 60%;"></div>
                `;
                break;
                
            case 'card':
                skeletonHTML = `
                    <div class="skeleton" style="height: 20px; margin-bottom: 12px;"></div>
                    <div class="skeleton" style="height: 16px; margin-bottom: 8px;"></div>
                    <div class="skeleton" style="height: 16px; width: 70%; margin-bottom: 8px;"></div>
                    <div class="skeleton" style="height: 16px; width: 50%;"></div>
                `;
                break;
                
            case 'list':
                skeletonHTML = Array.from({length: 5}, () => `
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <div class="skeleton" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 12px;"></div>
                        <div class="skeleton" style="height: 16px; flex: 1;"></div>
                    </div>
                `).join('');
                break;
                
            case 'table':
                skeletonHTML = `
                    <div class="skeleton" style="height: 20px; margin-bottom: 8px;"></div>
                    ${Array.from({length: 4}, () => `
                        <div style="display: flex; margin-bottom: 8px;">
                            <div class="skeleton" style="height: 16px; flex: 1; margin-right: 8px;"></div>
                            <div class="skeleton" style="height: 16px; flex: 1; margin-right: 8px;"></div>
                            <div class="skeleton" style="height: 16px; flex: 1;"></div>
                        </div>
                    `).join('')}
                `;
                break;
        }
        
        element.innerHTML = skeletonHTML;
        element.setAttribute('data-skeleton-id', skeletonId);
        
        return skeletonId;
    }
    
    /**
     * 移除骨架屏
     * @param {string} skeletonId - 骨架屏ID
     */
    removeSkeleton(skeletonId) {
        const skeletonData = this.skeletonElements.get(skeletonId);
        if (skeletonData) {
            skeletonData.element.innerHTML = skeletonData.originalContent;
            skeletonData.element.removeAttribute('data-skeleton-id');
            this.skeletonElements.delete(skeletonId);
        }
    }
    
    /**
     * 移除所有骨架屏
     */
    removeAllSkeletons() {
        this.skeletonElements.forEach((data, id) => {
            this.removeSkeleton(id);
        });
    }
    
    /**
     * 显示页面加载器
     * @param {string} message - 加载消息
     */
    showPageLoader(message = '正在加载页面...') {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.display = 'flex';
            const textElement = loader.querySelector('p');
            if (textElement) {
                textElement.textContent = message;
            }
        }
    }
    
    /**
     * 隐藏页面加载器
     */
    hidePageLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

// 初始化加载管理器
const loadingManager = new LoadingManager();

// 全局函数
window.showLoading = (message, progress) => {
    loadingManager.show(message, progress);
};

window.hideLoading = () => {
    loadingManager.hide();
};

window.updateLoadingProgress = (progress, message) => {
    loadingManager.updateProgress(progress, message);
};

window.createSkeleton = (element, type) => {
    return loadingManager.createSkeleton(element, type);
};

window.removeSkeleton = (skeletonId) => {
    loadingManager.removeSkeleton(skeletonId);
};

window.showPageLoader = (message) => {
    loadingManager.showPageLoader(message);
};

window.hidePageLoader = () => {
    loadingManager.hidePageLoader();
};
