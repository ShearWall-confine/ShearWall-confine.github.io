/**
 * GitHub API 数据同步模块
 * 实现跨设备数据同步，所有用户看到相同内容
 */

class GitHubSync {
    constructor() {
        this.repoOwner = 'ShearWall-confine';
        this.repoName = 'ShearWall-confine.github.io';
        this.dataPath = 'data/shared-project-data.json';
        this.token = null; // 需要用户提供GitHub Token
        this.baseURL = 'https://api.github.com';
    }

    /**
     * 设置GitHub Token
     * @param {string} token - GitHub Personal Access Token
     */
    setToken(token) {
        this.token = token;
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
            
            console.log('从GitHub加载数据成功:', content);
            return content;
        } catch (error) {
            console.error('从GitHub加载数据失败:', error);
            // 返回默认数据
            return this.getDefaultData();
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
                return true;
            } else {
                const error = await response.json();
                console.error('保存数据失败:', error);
                return false;
            }
        } catch (error) {
            console.error('保存数据到GitHub失败:', error);
            return false;
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
     * 显示GitHub Token设置对话框
     */
    showTokenDialog() {
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
            localStorage.setItem('githubToken', token);
            return true;
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
