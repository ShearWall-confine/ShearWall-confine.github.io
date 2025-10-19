/**
 * 性能优化工具
 * 提供防抖、节流、虚拟滚动等性能优化功能
 */

class PerformanceOptimizer {
    constructor() {
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        this.observers = new Map();
    }
    
    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} delay - 延迟时间(毫秒)
     * @param {string} key - 防抖键值，用于管理多个防抖函数
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay, key = 'default') {
        return (...args) => {
            // 清除之前的定时器
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            // 设置新的定时器
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }
    
    /**
     * 节流函数
     * @param {Function} func - 要执行的函数
     * @param {number} delay - 间隔时间(毫秒)
     * @param {string} key - 节流键值
     * @returns {Function} 节流后的函数
     */
    throttle(func, delay, key = 'default') {
        return (...args) => {
            if (this.throttleTimers.has(key)) {
                return;
            }
            
            func.apply(this, args);
            
            const timer = setTimeout(() => {
                this.throttleTimers.delete(key);
            }, delay);
            
            this.throttleTimers.set(key, timer);
        };
    }
    
    /**
     * 虚拟滚动实现
     * @param {HTMLElement} container - 容器元素
     * @param {Array} data - 数据数组
     * @param {Function} renderItem - 渲染单个项目的函数
     * @param {Object} options - 配置选项
     */
    createVirtualScroll(container, data, renderItem, options = {}) {
        const {
            itemHeight = 50,
            buffer = 5,
            className = 'virtual-scroll-item'
        } = options;
        
        let scrollTop = 0;
        let containerHeight = container.clientHeight;
        let visibleCount = Math.ceil(containerHeight / itemHeight);
        let startIndex = 0;
        let endIndex = Math.min(startIndex + visibleCount + buffer, data.length);
        
        // 创建虚拟滚动容器
        const virtualContainer = document.createElement('div');
        virtualContainer.style.cssText = `
            height: ${data.length * itemHeight}px;
            position: relative;
            overflow: hidden;
        `;
        
        // 创建可见项目容器
        const visibleContainer = document.createElement('div');
        visibleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
        `;
        
        virtualContainer.appendChild(visibleContainer);
        container.appendChild(virtualContainer);
        
        // 渲染可见项目
        const renderVisibleItems = () => {
            visibleContainer.innerHTML = '';
            visibleContainer.style.transform = `translateY(${startIndex * itemHeight}px)`;
            
            for (let i = startIndex; i < endIndex; i++) {
                const item = document.createElement('div');
                item.className = className;
                item.style.cssText = `
                    height: ${itemHeight}px;
                    position: absolute;
                    top: ${(i - startIndex) * itemHeight}px;
                    left: 0;
                    right: 0;
                `;
                
                const itemContent = renderItem(data[i], i);
                if (typeof itemContent === 'string') {
                    item.innerHTML = itemContent;
                } else {
                    item.appendChild(itemContent);
                }
                
                visibleContainer.appendChild(item);
            }
        };
        
        // 滚动处理
        const handleScroll = this.throttle((e) => {
            scrollTop = e.target.scrollTop;
            const newStartIndex = Math.floor(scrollTop / itemHeight);
            const newEndIndex = Math.min(newStartIndex + visibleCount + buffer * 2, data.length);
            
            if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
                startIndex = newStartIndex;
                endIndex = newEndIndex;
                renderVisibleItems();
            }
        }, 16, 'virtual-scroll');
        
        virtualContainer.addEventListener('scroll', handleScroll);
        
        // 初始渲染
        renderVisibleItems();
        
        return {
            update: (newData) => {
                data = newData;
                virtualContainer.style.height = `${data.length * itemHeight}px`;
                renderVisibleItems();
            },
            destroy: () => {
                virtualContainer.removeEventListener('scroll', handleScroll);
                virtualContainer.remove();
            }
        };
    }
    
    /**
     * 懒加载实现
     * @param {HTMLElement} element - 要懒加载的元素
     * @param {Function} callback - 加载回调
     * @param {Object} options - 配置选项
     */
    createLazyLoad(element, callback, options = {}) {
        const {
            rootMargin = '50px',
            threshold = 0.1
        } = options;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin,
            threshold
        });
        
        observer.observe(element);
        return observer;
    }
    
    /**
     * 批量DOM操作优化
     * @param {Function} operations - 操作函数
     */
    batchDOMOperations(operations) {
        // 使用DocumentFragment减少重排
        const fragment = document.createDocumentFragment();
        
        // 临时隐藏容器
        const containers = document.querySelectorAll('.batch-container');
        containers.forEach(container => {
            container.style.display = 'none';
        });
        
        try {
            operations(fragment);
        } finally {
            // 恢复显示
            containers.forEach(container => {
                container.style.display = '';
            });
        }
    }
    
    /**
     * 内存管理 - 清理事件监听器
     * @param {HTMLElement} element - 元素
     * @param {string} event - 事件类型
     * @param {Function} handler - 事件处理函数
     */
    addManagedEventListener(element, event, handler) {
        if (!element._managedListeners) {
            element._managedListeners = [];
        }
        
        element.addEventListener(event, handler);
        element._managedListeners.push({ event, handler });
    }
    
    /**
     * 清理元素的所有管理的事件监听器
     * @param {HTMLElement} element - 元素
     */
    cleanupManagedListeners(element) {
        if (element._managedListeners) {
            element._managedListeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
            element._managedListeners = [];
        }
    }
    
    /**
     * 清理所有定时器
     */
    cleanup() {
        // 清理防抖定时器
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        // 清理节流定时器
        this.throttleTimers.forEach(timer => clearTimeout(timer));
        this.throttleTimers.clear();
        
        // 清理观察器
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// 初始化性能优化器
const performanceOptimizer = new PerformanceOptimizer();

// 全局函数
window.debounce = (func, delay, key) => {
    return performanceOptimizer.debounce(func, delay, key);
};

window.throttle = (func, delay, key) => {
    return performanceOptimizer.throttle(func, delay, key);
};

window.createVirtualScroll = (container, data, renderItem, options) => {
    return performanceOptimizer.createVirtualScroll(container, data, renderItem, options);
};

window.createLazyLoad = (element, callback, options) => {
    return performanceOptimizer.createLazyLoad(element, callback, options);
};

window.batchDOMOperations = (operations) => {
    return performanceOptimizer.batchDOMOperations(operations);
};

window.addManagedEventListener = (element, event, handler) => {
    return performanceOptimizer.addManagedEventListener(element, event, handler);
};

window.cleanupManagedListeners = (element) => {
    return performanceOptimizer.cleanupManagedListeners(element);
};

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    performanceOptimizer.cleanup();
});
