/**
 * GitHub API 数据同步模块
 * 实现跨设备数据同步，所有用户看到相同内容
 */

class GitHubSync {
    constructor() {
        this.repoOwner = 'ShearWall-confine';
        this.repoName = 'ShearWall-confine.github.io';
        this.dataPath = 'data_saved/shared-project-data.json';
        this.token = null; // 需要用户提供GitHub Token
        this.baseURL = 'https://api.github.com';
        
        // API调用频率限制
        this.lastApiCall = 0;
        this.apiCallCount = 0;
        this.apiCallWindow = 0;
        this.maxCallsPerHour = 4000; // 保守估计，留出缓冲
        this.minCallInterval = 1000; // 最小调用间隔1秒
    }

    /**
     * 设置GitHub Token
     * @param {string} token - GitHub Personal Access Token
     */
    setToken(token) {
        this.token = token;
    }
    
    /**
     * 检查API调用频率限制
     * @returns {boolean} 是否可以调用API
     */
    canMakeApiCall() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        
        // 检查最小调用间隔
        if (timeSinceLastCall < this.minCallInterval) {
            console.log(`API调用被限制，距离上次调用仅${timeSinceLastCall}ms，需要等待${this.minCallInterval - timeSinceLastCall}ms`);
            return false;
        }
        
        // 重置小时窗口
        if (now - this.apiCallWindow > 3600000) { // 1小时
            this.apiCallCount = 0;
            this.apiCallWindow = now;
        }
        
        // 检查每小时调用次数
        if (this.apiCallCount >= this.maxCallsPerHour) {
            console.log(`API调用被限制，已达到每小时${this.maxCallsPerHour}次限制`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 记录API调用
     */
    recordApiCall() {
        this.lastApiCall = Date.now();
        this.apiCallCount++;
    }

    /**
     * 从GitHub加载数据
     * @returns {Promise<Object>} 项目数据
     */
    async loadData() {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${this.repoOwner}/${this.repoName}/contents/${this.dataPath}`,
                {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        ...(this.token && { 'Authorization': `token ${this.token}` })
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = `HTTP error! status: ${response.status}`;
                
                if (response.status === 401) {
                    errorMessage = 'GitHub Token无效或已过期';
                } else if (response.status === 403) {
                    errorMessage = 'GitHub权限不足或API调用频率超限';
                } else if (response.status === 404) {
                    errorMessage = 'GitHub仓库或文件不存在';
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
            
            console.log('从GitHub加载数据成功:', content);
            return content;
        } catch (error) {
            console.error('从GitHub加载数据失败:', error);
            throw error; // 重新抛出错误，让调用者处理
        }
    }

    /**
     * 保存数据到GitHub
     * @param {Object} data - 要保存的数据
     * @returns {Promise<boolean>} 是否保存成功
     */
    async saveData(data) {
        if (!this.token) {
            console.error('未设置GitHub Token，无法保存数据');
            return false;
        }

        // 检查API调用频率限制
        if (!this.canMakeApiCall()) {
            console.log('API调用被频率限制阻止，跳过GitHub同步');
            return false;
        }

        try {
            // 先获取当前文件的SHA
            const currentFile = await this.getCurrentFileInfo();
            
            const response = await fetch(
                `${this.baseURL}/repos/${this.repoOwner}/${this.repoName}/contents/${this.dataPath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `更新项目数据 - ${new Date().toLocaleString()}`,
                        content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
                        sha: currentFile.sha
                    })
                }
            );

            if (response.ok) {
                console.log('数据保存到GitHub成功');
                this.recordApiCall();
                return true;
            } else {
                const error = await response.json().catch(() => ({}));
                console.error('保存数据失败:', error);
                
                let errorMessage = `保存失败: ${response.status}`;
                
                if (response.status === 401) {
                    errorMessage = 'GitHub Token无效或已过期';
                } else if (response.status === 403) {
                    if (error.message && error.message.includes('rate limit')) {
                        errorMessage = 'GitHub API调用频率超限';
                        console.log('GitHub API频率限制，增加等待时间');
                        this.minCallInterval = Math.min(this.minCallInterval * 2, 60000); // 最大1分钟
                    } else {
                        errorMessage = 'GitHub权限不足';
                    }
                } else if (response.status === 404) {
                    errorMessage = 'GitHub仓库或文件不存在';
                }
                
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('保存数据到GitHub失败:', error);
            throw error; // 重新抛出错误，让调用者处理
        }
    }

    /**
     * 获取当前文件信息
     * @returns {Promise<Object>} 文件信息
     */
    async getCurrentFileInfo() {
        try {
            const response = await fetch(
                `${this.baseURL}/repos/${this.repoOwner}/${this.repoName}/contents/${this.dataPath}`,
                {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        ...(this.token && { 'Authorization': `token ${this.token}` })
                    }
                }
            );

            if (response.ok) {
                return await response.json();
            } else {
                return { sha: null };
            }
        } catch (error) {
            console.error('获取文件信息失败:', error);
            return { sha: null };
        }
    }

    /**
     * 获取默认数据
     * @returns {Object} 默认项目数据
     */
    getDefaultData() {
        return {
            projectName: "我的研究课题",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            description: "在这里描述您的课题整体思路和研究目标...",
            tasks: [],
            timeline: [],
            files: [],
            results: [],
            roadmap: [],
            lastUpdated: new Date().toISOString(),
            version: "1.0.0"
        };
    }

    /**
     * 检查是否有更新权限
     * @returns {boolean} 是否有更新权限
     */
    hasUpdatePermission() {
        return !!this.token;
    }
    
    /**
     * 验证Token是否有效
     * @returns {Promise<boolean>} Token是否有效
     */
    async validateToken() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await fetch(`${this.baseURL}/user`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${this.token}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('Token验证失败:', error);
            return false;
        }
    }

    /**
     * 显示GitHub Token设置对话框
     */
    async showTokenDialog() {
        const token = prompt(
            '请输入GitHub Personal Access Token:\n\n' +
            '获取Token步骤:\n' +
            '1. 访问 https://github.com/settings/tokens\n' +
            '2. 点击 "Generate new token"\n' +
            '3. 选择 "repo" 权限\n' +
            '4. 复制生成的Token'
        );
        
        if (token) {
            this.setToken(token);
            
            // 验证Token是否有效
            const isValid = await this.validateToken();
            if (isValid) {
                localStorage.setItem('githubToken', token);
                return true;
            } else {
                alert('Token无效，请检查Token是否正确或权限是否足够');
                this.clearToken();
                return false;
            }
        }
        return false;
    }

    /**
     * 从本地存储加载Token
     */
    loadTokenFromStorage() {
        const token = localStorage.getItem('githubToken');
        if (token) {
            this.setToken(token);
        }
    }

    /**
     * 清除Token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('githubToken');
    }
}

// 创建全局实例
window.githubSync = new GitHubSync();

// 页面加载时自动加载Token
document.addEventListener('DOMContentLoaded', function() {
    window.githubSync.loadTokenFromStorage();
});
