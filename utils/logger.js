/**
 * 日志管理工具
 * 生产环境自动禁用调试日志
 */

// 环境检测
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

// 日志级别
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// 当前日志级别
const currentLogLevel = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;

/**
 * 安全的日志记录器
 */
class Logger {
    static error(message, ...args) {
        if (currentLogLevel >= LOG_LEVELS.ERROR) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
    
    static warn(message, ...args) {
        if (currentLogLevel >= LOG_LEVELS.WARN) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    
    static info(message, ...args) {
        if (currentLogLevel >= LOG_LEVELS.INFO) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }
    
    static debug(message, ...args) {
        if (currentLogLevel >= LOG_LEVELS.DEBUG) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
    
    static group(label) {
        if (currentLogLevel >= LOG_LEVELS.DEBUG) {
            console.group(label);
        }
    }
    
    static groupEnd() {
        if (currentLogLevel >= LOG_LEVELS.DEBUG) {
            console.groupEnd();
        }
    }
}

// 全局日志函数
window.Logger = Logger;

// 替换原有的console方法
if (!isDevelopment) {
    // 生产环境禁用大部分console方法
    window.console = {
        ...console,
        log: () => {},
        debug: () => {},
        info: () => {},
        warn: Logger.warn,
        error: Logger.error
    };
}
