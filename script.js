// 全局变量
let projectData = {
    projectName: "我的研究课题",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    description: "在这里描述您的课题整体思路和研究目标...",
    tasks: [],
    timeline: [],
    files: [],
    results: [],
    roadmap: []
};

let currentEditingTask = null;
let currentEditingSection = null;
let currentEditingRoadmapNode = null;
let currentEditingFolder = null;
let currentEditingTimelineItem = null;
let currentFolderId = null; // 当前所在文件夹ID
let fileViewMode = 'tree'; // 文件视图模式：只使用树形视图
let filesDirHandle = null; // File System Access API 目录句柄
let fsAccessEnabled = false; // 是否启用文件系统访问
let timelineViewMode = 'list'; // 时间线视图模式：list 或 calendar
let roadmapViewMode = 'list'; // 技术路线图视图模式：list 或 mindmap
let currentCalendarDate = new Date(); // 当前日历显示的日期

// 时间线过滤和管理状态
let timelineFilters = {
    dateRange: 'all',
    displayMode: 'all',
    isCollapsed: false,
    customStartDate: null,
    customEndDate: null
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户权限
    if (typeof checkAuthentication === 'function') {
        checkAuthentication();
    }
    
    loadTheme();
    loadData();
    initializeEventListeners();
    renderAll();
    
    // 初始化视图状态
    setTimeout(() => {
        initializeViewStates();
    }, 200);
});

// 初始化事件监听器
function initializeEventListeners() {
    // 任务过滤器
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterTasks(this.dataset.status);
        });
    });

    // 文件分类过滤器
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterFiles(this.dataset.category);
        });
    });

    // 可编辑内容点击事件
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('editable-content')) {
            makeEditable(e.target);
        }
    });

    // 拖拽上传 - 网格视图
    const filesGrid = document.getElementById('files-grid');
    if (filesGrid) {
        filesGrid.addEventListener('dragover', handleDragOver);
        filesGrid.addEventListener('drop', handleDrop);
        filesGrid.addEventListener('dragleave', handleDragLeave);
    }
    
    // 拖拽上传 - 树形视图
    const fileTree = document.getElementById('file-tree');
    if (fileTree) {
        fileTree.addEventListener('dragover', handleDragOver);
        fileTree.addEventListener('drop', handleDrop);
        fileTree.addEventListener('dragleave', handleDragLeave);
    }
}

// 加载数据
async function loadData() {
    // 优先从GitHub加载数据
    if (window.githubSync) {
        try {
            console.log('尝试从GitHub加载数据...');
            const githubData = await window.githubSync.loadData();
            if (githubData) {
                projectData = githubData;
                console.log('从GitHub加载数据成功:', projectData);
                
                // 同时保存到localStorage作为备份
                localStorage.setItem('projectProgressData', JSON.stringify(projectData));
                return;
            }
        } catch (error) {
            console.error('从GitHub加载数据失败:', error);
        }
    }
    
    // 如果GitHub加载失败，从localStorage加载
    const savedData = localStorage.getItem('projectProgressData');
    if (savedData) {
        try {
            projectData = JSON.parse(savedData);
            console.log('从localStorage加载数据:', projectData);
        } catch (error) {
            console.error('解析保存的数据失败:', error);
            projectData = {
                projectName: "我的研究课题",
                startDate: "2024-01-01",
                endDate: "2024-12-31",
                description: "在这里描述您的课题整体思路和研究目标...",
                tasks: [],
                timeline: [],
                files: [],
                results: [],
                roadmap: []
            };
        }
    } else {
        console.log('没有找到保存的数据，初始化示例数据');
        // 初始化示例数据
        initializeSampleData();
    }
    
    // 确保所有数组都存在
    if (!projectData.roadmap) projectData.roadmap = [];
    if (!projectData.timeline) projectData.timeline = [];
    if (!projectData.folders) projectData.folders = [];
    if (!projectData.files) projectData.files = [];
    if (!projectData.tasks) projectData.tasks = [];
    if (!projectData.results) projectData.results = [];
    if (!projectData.mindmaps) projectData.mindmaps = [];
    
    console.log('数据加载完成，最终状态:', {
        timeline: projectData.timeline?.length || 0,
        roadmap: projectData.roadmap?.length || 0,
        tasks: projectData.tasks?.length || 0
    });
    
    // 加载文件系统访问状态
    loadFileSystemState();
}

// 保存数据
async function saveData() {
    // 保存到localStorage
    localStorage.setItem('projectProgressData', JSON.stringify(projectData));
    
    // 如果GitHub同步可用，同时保存到GitHub
    if (window.githubSync && window.githubSync.hasUpdatePermission()) {
        try {
            console.log('保存数据到GitHub...');
            const success = await window.githubSync.saveData(projectData);
            if (success) {
                console.log('数据已同步到GitHub');
                showNotification('数据已同步到云端', 'success');
            } else {
                console.log('GitHub同步失败，数据已保存到本地');
                showNotification('数据已保存到本地', 'info');
            }
        } catch (error) {
            console.error('GitHub同步失败:', error);
            showNotification('数据已保存到本地', 'info');
        }
    }
    
    updateOverallProgress();
}

// 初始化示例数据
function initializeSampleData() {
    projectData.tasks = [
        {
            id: 1,
            title: "文献调研",
            description: "收集和阅读相关文献，了解研究现状",
            status: "completed",
            priority: "high",
            startDate: "2024-01-01",
            endDate: "2024-02-15",
            progress: 100,
            subtasks: [
                { 
                    id: 1, 
                    title: "确定关键词", 
                    completed: true, 
                    notes: "已确定5个核心关键词：地震、管道、应力、分析、安全",
                    issues: []
                },
                { 
                    id: 2, 
                    title: "搜索数据库", 
                    completed: true, 
                    notes: "使用CNKI、万方、维普等数据库进行检索",
                    issues: []
                },
                { 
                    id: 3, 
                    title: "阅读文献", 
                    completed: true, 
                    notes: "已阅读50篇相关文献，重点关注地震动应力分析方法",
                    issues: []
                },
                { 
                    id: 4, 
                    title: "整理笔记", 
                    completed: true, 
                    notes: "按主题分类整理文献笔记，形成研究框架",
                    issues: []
                }
            ],
            attachments: []
        },
        {
            id: 2,
            title: "实验设计",
            description: "设计实验方案，确定实验参数",
            status: "in-progress",
            priority: "high",
            startDate: "2024-02-01",
            endDate: "2024-03-31",
            progress: 60,
            subtasks: [
                { 
                    id: 5, 
                    title: "确定实验目标", 
                    completed: true, 
                    notes: "明确实验目标：验证管道在地震作用下的应力分布规律",
                    issues: []
                },
                { 
                    id: 6, 
                    title: "选择实验方法", 
                    completed: true, 
                    notes: "选择有限元分析方法，使用ANSYS软件进行仿真",
                    issues: []
                },
                { 
                    id: 7, 
                    title: "设计实验流程", 
                    completed: false, 
                    notes: "正在设计详细的实验步骤和参数设置",
                    issues: ["需要确定地震波输入参数", "材料参数获取困难"]
                },
                { 
                    id: 8, 
                    title: "准备实验材料", 
                    completed: false, 
                    notes: "需要准备管道材料参数和地震波数据",
                    issues: ["材料参数数据库不完整"]
                }
            ],
            attachments: []
        },
        {
            id: 3,
            title: "数据收集",
            description: "进行实验并收集数据",
            status: "pending",
            priority: "medium",
            startDate: "2024-04-01",
            endDate: "2024-06-30",
            progress: 0,
            subtasks: [
                { title: "准备实验设备", completed: false },
                { title: "进行初步实验", completed: false },
                { title: "收集主要数据", completed: false },
                { title: "数据预处理", completed: false }
            ],
            attachments: []
        }
    ];

    projectData.timeline = [
        {
            id: 1,
            date: "2024-01-01",
            title: "项目启动",
            description: "确定研究方向和目标，开始文献调研"
        },
        {
            id: 2,
            date: "2024-02-15",
            title: "文献调研完成",
            description: "完成相关文献的收集和整理工作"
        },
        {
            id: 3,
            date: "2024-03-31",
            title: "实验设计完成",
            description: "完成实验方案设计和参数确定"
        }
    ];

    projectData.files = [
        {
            id: 1,
            name: "研究计划.docx",
            type: "document",
            size: "2.5MB",
            uploadDate: "2024-01-01",
            category: "documents"
        },
        {
            id: 2,
            name: "实验数据.xlsx",
            type: "spreadsheet",
            size: "1.2MB",
            uploadDate: "2024-02-15",
            category: "data"
        }
    ];

    projectData.results = [
        {
            id: 1,
            title: "文献综述初稿",
            description: "完成了相关领域的文献综述初稿",
            date: "2024-02-15",
            image: null,
            attachments: []
        }
    ];

    projectData.roadmap = [
        {
            id: 1,
            title: "文献调研与理论研究",
            description: "系统梳理国内外相关研究成果，明确研究方向和技术路线",
            status: "completed",
            type: "research",
            estimatedTime: "1.5个月",
            keyPoints: [
                "检索并阅读相关领域文献",
                "总结现有技术方法的优缺点",
                "确定本课题的创新点"
            ],
            expectedOutcomes: "完成文献综述报告，明确研究目标和技术方案"
        },
        {
            id: 2,
            title: "实验方案设计",
            description: "设计详细的实验方案，确定实验参数和评价指标",
            status: "in-progress",
            type: "experiment",
            estimatedTime: "2个月",
            keyPoints: [
                "确定实验方法和流程",
                "选择合适的实验设备和材料",
                "设计对比实验方案",
                "确定评价指标体系"
            ],
            expectedOutcomes: "完成实验方案设计报告，准备好实验环境"
        },
        {
            id: 3,
            title: "数据采集与处理",
            description: "进行实验并收集数据，完成数据预处理和质量控制",
            status: "pending",
            type: "experiment",
            estimatedTime: "3个月",
            keyPoints: [
                "按照方案进行实验",
                "实时记录实验数据",
                "数据清洗和预处理",
                "数据质量检查"
            ],
            expectedOutcomes: "获得高质量的实验数据集"
        },
        {
            id: 4,
            title: "算法开发与优化",
            description: "开发核心算法，进行参数调优和性能优化",
            status: "pending",
            type: "development",
            estimatedTime: "2.5个月",
            keyPoints: [
                "实现基础算法框架",
                "算法参数调优",
                "性能优化和改进",
                "代码文档编写"
            ],
            expectedOutcomes: "完成算法实现和优化，形成可重用的代码库"
        },
        {
            id: 5,
            title: "数据分析与结果验证",
            description: "对实验数据进行深入分析，验证算法效果",
            status: "pending",
            type: "analysis",
            estimatedTime: "2个月",
            keyPoints: [
                "统计分析实验结果",
                "可视化数据分析",
                "对比分析不同方法",
                "结果可靠性验证"
            ],
            expectedOutcomes: "完成数据分析报告，验证研究假设"
        },
        {
            id: 6,
            title: "系统集成与测试",
            description: "将各模块集成为完整系统，进行全面测试",
            status: "pending",
            type: "testing",
            estimatedTime: "1.5个月",
            keyPoints: [
                "模块集成与接口调试",
                "功能测试和性能测试",
                "用户体验测试",
                "问题修复和优化"
            ],
            expectedOutcomes: "完成系统集成，通过各项测试指标"
        },
        {
            id: 7,
            title: "论文撰写与答辩",
            description: "撰写学位论文，准备答辩材料",
            status: "pending",
            type: "deployment",
            estimatedTime: "2个月",
            keyPoints: [
                "撰写论文初稿",
                "论文修改完善",
                "准备答辩PPT",
                "模拟答辩练习"
            ],
            expectedOutcomes: "完成高质量的学位论文，顺利通过答辩"
        }
    ];

    projectData.timeline = [
        {
            id: 1,
            title: "项目启动",
            description: "项目正式启动，确定研究方向和目标",
            date: "2024-01-01",
            status: "completed"
        },
        {
            id: 2,
            title: "文献调研完成",
            description: "完成相关文献的收集、阅读和分析",
            date: "2024-02-15",
            status: "completed"
        },
        {
            id: 3,
            title: "实验设计阶段",
            description: "设计实验方案，确定实验参数和流程",
            date: "2024-03-31",
            status: "in-progress"
        },
        {
            id: 4,
            title: "数据收集开始",
            description: "开始进行实验并收集数据",
            date: "2024-04-01",
            status: "pending"
        },
        {
            id: 5,
            title: "数据分析阶段",
            description: "对收集的数据进行深入分析",
            date: "2024-07-01",
            status: "pending"
        },
        {
            id: 6,
            title: "论文撰写",
            description: "开始撰写学位论文",
            date: "2024-09-01",
            status: "pending"
        },
        {
            id: 7,
            title: "论文答辩",
            description: "完成论文答辩",
            date: "2024-12-31",
            status: "pending"
        }
    ];

    saveData();
}

// 渲染所有内容
function renderAll() {
    console.log('开始渲染所有内容，当前数据状态:', {
        timeline: projectData.timeline?.length || 0,
        roadmap: projectData.roadmap?.length || 0,
        tasks: projectData.tasks?.length || 0
    });
    
    renderOverview();
    renderTasks();
    renderTimeline();
    renderTimelineVertical();
    renderResults();
    renderRoadmap();
    renderFileTree();
    
    // 确保技术路线图和时间线正确显示
    setTimeout(() => {
        console.log('延迟渲染，数据状态:', {
            timeline: projectData.timeline?.length || 0,
            roadmap: projectData.roadmap?.length || 0
        });
        // 无论数据是否为空，都要调用渲染函数以显示正确状态
        renderRoadmap();
        renderTimelineVertical();
        
        // 如果有任务，同步到时间线
        if (projectData.tasks && projectData.tasks.length > 0) {
            console.log('同步任务到时间线');
            syncTasksToTimeline();
            renderTimelineVertical();
        }
    }, 200);
}

// 渲染项目概览
function renderOverview() {
    document.getElementById('project-name').textContent = projectData.projectName;
    document.getElementById('start-date').textContent = projectData.startDate;
    document.getElementById('end-date').textContent = projectData.endDate;
    document.getElementById('project-description').textContent = projectData.description;
    updateOverallProgress();
}

// 更新整体进度
function updateOverallProgress() {
    if (projectData.tasks.length === 0) {
        document.getElementById('overall-progress').style.width = '0%';
        document.getElementById('progress-text').textContent = '0%';
        return;
    }

    const totalProgress = projectData.tasks.reduce((sum, task) => sum + task.progress, 0);
    const averageProgress = Math.round(totalProgress / projectData.tasks.length);
    
    document.getElementById('overall-progress').style.width = averageProgress + '%';
    document.getElementById('progress-text').textContent = averageProgress + '%';
}

// 渲染任务列表
function renderTasks() {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';

    projectData.tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
}

// 创建任务元素
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.dataset.taskId = task.id;
    div.dataset.status = task.status;

    const statusClass = `status-${task.status}`;
    const priorityIcon = task.priority === 'high' ? 'fas fa-exclamation-triangle' : 
                        task.priority === 'medium' ? 'fas fa-minus' : 'fas fa-arrow-down';

    div.innerHTML = `
        <div class="task-header">
            <div>
                <div class="task-title">${task.title}</div>
                <div class="task-status ${statusClass}">${getStatusText(task.status)}</div>
            </div>
            <div class="task-actions">
                <button class="btn btn-edit" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="task-meta">
            <div class="task-meta-item">
                <i class="fas fa-flag" style="color: ${getPriorityColor(task.priority)}"></i>
                <span>${getPriorityText(task.priority)}</span>
            </div>
            <div class="task-meta-item">
                <i class="fas fa-calendar"></i>
                <span>${task.startDate} - ${task.endDate}</span>
            </div>
            <div class="task-meta-item">
                <i class="fas fa-paperclip"></i>
                <span>${task.attachments.length} 个附件</span>
            </div>
        </div>
        <div class="task-description">${task.description}</div>
        <div class="task-progress">
            <div class="task-progress-label">
                <span>进度</span>
                <span>${task.progress}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${task.progress}%"></div>
            </div>
        </div>
        <div class="task-subtasks">
            <strong>子任务:</strong>
            <ul>
                ${task.subtasks.map(subtask => `
                    <li style="color: ${subtask.completed ? '#28a745' : '#6c757d'}">
                        <i class="fas fa-${subtask.completed ? 'check' : 'circle'}"></i>
                        ${subtask.title}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    return div;
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待开始',
        'in-progress': '进行中',
        'completed': '已完成'
    };
    return statusMap[status] || status;
}

// 获取优先级文本
function getPriorityText(priority) {
    const priorityMap = {
        'high': '高',
        'medium': '中',
        'low': '低'
    };
    return priorityMap[priority] || priority;
}

// 获取优先级颜色
function getPriorityColor(priority) {
    const colorMap = {
        'high': '#dc3545',
        'medium': '#ffc107',
        'low': '#28a745'
    };
    return colorMap[priority] || '#6c757d';
}

// 过滤任务
function filterTasks(status) {
    const tasks = document.querySelectorAll('.task-item');
    tasks.forEach(task => {
        if (status === 'all' || task.dataset.status === status) {
            task.style.display = 'block';
        } else {
            task.style.display = 'none';
        }
    });
}

// 渲染时间线（已废弃，使用renderTimelineVertical替代）
function renderTimeline() {
    // 这个函数已经不再使用，时间线现在通过renderTimelineVertical渲染
    // 保留此函数以避免调用错误
    console.log('renderTimeline函数已废弃，使用renderTimelineVertical替代');
}

// 渲染文件列表（网格视图 - 已弃用）
function renderFiles() {
    // 由于已移除网格视图，此函数不再需要
    console.log('renderFiles函数已弃用，仅支持树形视图');
    return;
    
    // 显示同步状态
    if (fsAccessEnabled) {
        const syncStatus = checkFileSyncStatus();
        const statusElement = document.createElement('div');
        statusElement.className = `file-sync-status ${syncStatus.percentage === 100 ? 'synced' : syncStatus.percentage > 0 ? 'partial' : 'error'}`;
        statusElement.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>文件同步状态：${syncStatus.synced}/${syncStatus.total} (${syncStatus.percentage}%)</span>
            <div class="sync-progress-bar">
                <div class="sync-progress-fill" style="width: ${syncStatus.percentage}%"></div>
            </div>
        `;
        container.appendChild(statusElement);
    }
    
    // 获取当前文件夹中的子文件夹
    const currentFolders = projectData.folders.filter(folder => 
        folder.parentId === currentFolderId
    );
    
    // 获取当前文件夹中的文件
    const currentFiles = projectData.files.filter(file => 
        file.folderId === currentFolderId
    );
    
    // 先渲染文件夹
    currentFolders.forEach(folder => {
        const div = document.createElement('div');
        div.className = 'file-item folder-item';
        div.dataset.category = 'all';
        div.ondblclick = () => navigateToFolderInGrid(folder.id);
        
        const childFiles = projectData.files.filter(f => f.folderId === folder.id);
        
        div.innerHTML = `
            <div class="file-icon"><i class="fas fa-folder" style="color: var(--accent-color); font-size: 3rem;"></i></div>
            <div class="file-name">${folder.name}</div>
            <div class="file-size">${childFiles.length} 个文件</div>
            <div class="file-actions">
                <button class="btn btn-edit" onclick="event.stopPropagation(); editFolder(${folder.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteFolder(${folder.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
    
    // 再渲染文件
    currentFiles.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.category = file.category;
        
        const icon = getFileIcon(file.type);
        // 同步状态指示器
        let syncStatus = '';
        if (fsAccessEnabled) {
            if (file.savedToLocal) {
                syncStatus = '<span class="file-sync-indicator synced"><i class="fas fa-check-circle"></i> 已同步</span>';
            } else if (file.syncError) {
                syncStatus = '<span class="file-sync-indicator error"><i class="fas fa-exclamation-triangle"></i> 同步错误</span>';
            } else {
                syncStatus = '<span class="file-sync-indicator unsynced"><i class="fas fa-times-circle"></i> 未同步</span>';
            }
        }
        
        div.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-name">${file.name}</div>
            <div class="file-meta">${file.size} - ${file.uploadDate}</div>
            <div class="file-sync-status">${syncStatus}</div>
            <div class="file-actions">
                <button class="btn btn-primary" onclick="downloadFile(${file.id})">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteFile(${file.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // 添加双击打开文件功能
        div.ondblclick = () => openFileWithSystemDefault(file.id);
        container.appendChild(div);
    });
    
    // 如果没有文件夹和文件，显示空状态
    if (currentFolders.length === 0 && currentFiles.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'files-empty';
        emptyDiv.innerHTML = `
            <i class="fas fa-folder-open"></i>
            <p>此文件夹为空</p>
            <p>点击"新建文件夹"或"上传文件"开始添加内容</p>
        `;
        container.appendChild(emptyDiv);
    }
    
    // 更新面包屑导航（网格视图）
    updateGridBreadcrumb();
}

// 网格视图中导航到文件夹
function navigateToFolderInGrid(folderId) {
    currentFolderId = folderId;
    renderFiles();
}

// 更新网格视图的面包屑导航
function updateGridBreadcrumb() {
    // 只在网格视图中显示简单的路径提示
    const categoryBtns = document.querySelector('.file-categories');
    if (!categoryBtns) return;
    
    let pathText = '当前位置：根目录';
    if (currentFolderId !== null) {
        const path = [];
        let folderId = currentFolderId;
        
        while (folderId !== null) {
            const folder = projectData.folders.find(f => f.id === folderId);
            if (folder) {
                path.unshift(folder.name);
                folderId = folder.parentId;
            } else {
                break;
            }
        }
        
        pathText = '当前位置：' + (path.length > 0 ? path.join(' / ') : '根目录');
    }
    
    // 在分类按钮前添加返回按钮和路径提示
    const existingNav = document.getElementById('grid-nav');
    if (existingNav) existingNav.remove();
    
    const navDiv = document.createElement('div');
    navDiv.id = 'grid-nav';
    navDiv.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding: 10px; background: var(--bg-color); border-radius: 5px;';
    
    if (currentFolderId !== null) {
        navDiv.innerHTML = `
            <button class="btn btn-secondary" onclick="navigateToFolderInGrid(null)" style="padding: 6px 12px;">
                <i class="fas fa-home"></i> 返回根目录
            </button>
            <span style="color: var(--text-secondary); font-size: 14px;">${pathText}</span>
        `;
    } else {
        navDiv.innerHTML = `<span style="color: var(--text-secondary); font-size: 14px;">${pathText}</span>`;
    }
    
    categoryBtns.parentNode.insertBefore(navDiv, categoryBtns);
}

// 获取文件图标
function getFileIcon(type) {
    const iconMap = {
        'document': '<i class="fas fa-file-word"></i>',
        'spreadsheet': '<i class="fas fa-file-excel"></i>',
        'image': '<i class="fas fa-file-image"></i>',
        'pdf': '<i class="fas fa-file-pdf"></i>',
        'video': '<i class="fas fa-file-video"></i>',
        'audio': '<i class="fas fa-file-audio"></i>',
        'archive': '<i class="fas fa-file-archive"></i>',
        'code': '<i class="fas fa-file-code"></i>'
    };
    return iconMap[type] || '<i class="fas fa-file"></i>';
}

// 过滤文件
function filterFiles(category) {
    const files = document.querySelectorAll('.file-item');
    files.forEach(file => {
        if (category === 'all' || file.dataset.category === category) {
            file.style.display = 'block';
        } else {
            file.style.display = 'none';
        }
    });
}

// 渲染成果列表
function renderResults() {
    const container = document.getElementById('results-container');
    container.innerHTML = '';

    projectData.results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div class="result-title">${result.title}</div>
            <div class="result-description">${result.description}</div>
            ${result.image ? `<img src="${result.image}" class="result-image" alt="${result.title}">` : ''}
            <div class="result-meta">
                <span>${result.date}</span>
                <div class="result-actions">
                    <button class="btn btn-edit" onclick="editResult(${result.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteResult(${result.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// 添加任务
function addTask() {
    // 检查编辑权限
    if (typeof checkEditPermission === 'function' && !checkEditPermission()) {
        return;
    }
    
    const newTask = {
        id: Date.now(),
        title: "新任务",
        description: "请输入任务描述",
        status: "pending",
        priority: "medium",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        subtasks: [],
        attachments: [],
        autoProgress: true // 默认启用自动进度计算
    };
    
    projectData.tasks.push(newTask);
    saveData();
    renderTasks();
    editTask(newTask.id);
}

// 编辑任务
function editTask(taskId) {
    const task = projectData.tasks.find(t => t.id === taskId);
    if (!task) return;

    currentEditingTask = task;
    
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('taskModal-title');
    const modalBody = document.getElementById('taskModal-body');
    
    modalTitle.textContent = '编辑任务';
    
    console.log('编辑任务时的日期值:', {
        startDate: task.startDate,
        endDate: task.endDate,
        taskId: task.id
    });
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>任务标题</label>
            <input type="text" class="form-control" id="task-title" value="${task.title}">
        </div>
        <div class="form-group">
            <label>任务描述</label>
            <textarea class="form-control" id="task-description" rows="3">${task.description}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>状态</label>
                <select class="form-control" id="task-status">
                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>待开始</option>
                    <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>进行中</option>
                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>已完成</option>
                </select>
            </div>
            <div class="form-group">
                <label>优先级</label>
                <select class="form-control" id="task-priority">
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>高</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>中</option>
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>低</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>开始日期</label>
                <input type="date" class="form-control" id="task-start-date" value="${task.startDate}">
            </div>
            <div class="form-group">
                <label>结束日期</label>
                <input type="date" class="form-control" id="task-end-date" value="${task.endDate}">
            </div>
        </div>
        <div class="form-group">
            <label>进度 (%)</label>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-weight: 500; color: var(--text-color);">任务进度:</span>
                <span id="progress-value" style="font-weight: 600; color: var(--primary-color);">${task.progress}%</span>
            </div>
            <div id="progress-info" style="font-size: 12px; color: var(--text-secondary); margin-top: 5px; padding: 8px; background: rgba(52, 144, 220, 0.1); border-radius: 4px;">
                ${task.subtasks && task.subtasks.length > 0 ? 
                    `基于子任务完成情况自动计算：已完成 ${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length} 个子任务` : 
                    '暂无子任务，进度为 0%'
                }
            </div>
        </div>
        <div class="form-group">
            <label>子任务</label>
            <div id="subtasks-container">
                ${task.subtasks.map((subtask, index) => `
                    <div class="subtask-item" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin-bottom: 15px; background: var(--card-bg);">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="toggleSubtask(${index})" style="margin-right: 10px;">
                            <input type="text" class="form-control" value="${subtask.title}" onchange="updateSubtaskTitle(${index}, this.value)" style="flex: 1; margin-right: 10px;">
                            <button class="btn btn-secondary btn-sm" onclick="editSubtaskDetails(${index})" title="编辑说明和问题">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn ${subtask.completionTime ? 'btn-success' : 'btn-info'} btn-sm subtask-time-btn" onclick="editSubtaskTime(${index})" title="${subtask.completionTime ? '编辑时间' : '设置时间'}">
                                <i class="fas fa-${subtask.completionTime ? 'clock' : 'clock'}"></i>
                                ${subtask.completionTime ? '<span class="time-indicator">✓</span>' : ''}
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="removeSubtask(${index})" style="margin-left: 5px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        ${subtask.completionTime ? `
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 8px; background: rgba(52, 144, 220, 0.1); border-radius: 4px;">
                                <i class="fas fa-calendar" style="color: var(--primary-color);"></i>
                                <span style="font-size: 12px; color: var(--text-secondary);">
                                    完成时间: ${subtask.completionTime}
                                </span>
                                <button class="btn btn-sm btn-outline-danger" onclick="removeSubtaskTime(${index})" title="取消时间设置">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        ` : ''}
                        ${subtask.notes ? `
                            <div class="subtask-notes" style="margin-bottom: 8px; padding: 8px; background: rgba(52, 144, 220, 0.1); border-radius: 4px; font-size: 14px;">
                                <strong>说明：</strong>${subtask.notes}
                            </div>
                        ` : ''}
                        ${subtask.issues && subtask.issues.length > 0 ? `
                            <div class="subtask-issues" style="margin-bottom: 8px;">
                                <strong style="color: #dc3545;">问题：</strong>
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    ${subtask.issues.map(issue => `<li style="color: #dc3545; font-size: 14px;">${issue}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-primary" onclick="addSubtask()">
                <i class="fas fa-plus"></i> 添加子任务
            </button>
        </div>
    `;
    
    // 进度滑块事件
    const progressSlider = document.getElementById('task-progress');
    const progressValue = document.getElementById('progress-value');
    if (progressSlider) {
        progressSlider.addEventListener('input', function() {
            progressValue.textContent = this.value + '%';
            // 自动保存进度
            autoSaveTaskProgress();
        });
    }
    
    // 为所有输入框添加自动保存监听器
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const statusInput = document.getElementById('task-status');
    const priorityInput = document.getElementById('task-priority');
    
    // 为基本输入框添加自动保存
    [titleInput, descriptionInput, statusInput, priorityInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                console.log(`${this.id} 输入变化:`, this.value);
                autoSaveTaskData();
            });
            
            input.addEventListener('change', function() {
                console.log(`${this.id} 值变化:`, this.value);
                autoSaveTaskData();
            });
            
            input.addEventListener('blur', function() {
                console.log(`${this.id} 失焦:`, this.value);
                autoSaveTaskData();
            });
        }
    });
    
    // 添加日期输入框变化监听
    const startDateInput = document.getElementById('task-start-date');
    const endDateInput = document.getElementById('task-end-date');
    
    if (startDateInput) {
        console.log('开始日期输入框初始值:', startDateInput.value);
        console.log('任务开始日期:', task.startDate);
        
        startDateInput.addEventListener('change', function() {
            console.log('开始日期变化:', this.value);
            // 自动保存任务数据
            autoSaveTaskData();
        });
        
        startDateInput.addEventListener('input', function() {
            console.log('开始日期输入:', this.value);
        });
        
        startDateInput.addEventListener('blur', function() {
            console.log('开始日期失焦:', this.value);
            validateTaskDates();
        });
    }
    
    if (endDateInput) {
        console.log('结束日期输入框初始值:', endDateInput.value);
        console.log('任务结束日期:', task.endDate);
        
        endDateInput.addEventListener('change', function() {
            console.log('结束日期变化:', this.value);
            // 自动保存任务数据
            autoSaveTaskData();
        });
        
        endDateInput.addEventListener('input', function() {
            console.log('结束日期输入:', this.value);
        });
        
        endDateInput.addEventListener('blur', function() {
            console.log('结束日期失焦:', this.value);
            validateTaskDates();
        });
    }
    
    modal.style.display = 'block';
}

// 保存任务 - 已改为自动保存，此函数不再需要手动调用
function saveTask() {
    console.log('saveTask函数已被自动保存功能替代，无需手动调用');
    // 所有任务数据现在都通过自动保存监听器自动保存
    // 此函数保留是为了兼容性，但实际不会执行任何操作
}

// 关闭任务模态框
function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    currentEditingTask = null;
}

// 删除任务
function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        // 删除任务
        projectData.tasks = projectData.tasks.filter(t => t.id !== taskId);
        
        // 删除对应的时间线项
        projectData.timeline = projectData.timeline.filter(item => 
            item.linkedTaskId !== taskId
        );
        
        saveData();
        renderTasks();
        renderTimelineVertical();
    }
}

// 添加子任务
function addSubtask() {
    if (!currentEditingTask) return;
    
    const newSubtask = {
        id: Date.now(),
        title: '新子任务',
        completed: false,
        notes: '',
        issues: []
    };
    
    currentEditingTask.subtasks.push(newSubtask);
    
    console.log('添加子任务:', {
        '子任务标题': newSubtask.title,
        '任务ID': currentEditingTask.id,
        '总子任务数': currentEditingTask.subtasks.length
    });
    
    // 自动更新任务进度
    updateTaskProgressFromSubtasks(currentEditingTask.id);
    
    // 重新渲染任务编辑界面以显示新的子任务结构
    editTask(currentEditingTask.id);
}

// 切换子任务状态
function toggleSubtask(index) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[index];
    const oldStatus = subtask.completed;
    subtask.completed = !subtask.completed;
    
    console.log('切换子任务状态:', {
        '子任务标题': subtask.title,
        '旧状态': oldStatus,
        '新状态': subtask.completed,
        '任务ID': currentEditingTask.id
    });
    
    // 自动保存任务数据
    saveData();
    
    // 自动更新任务进度
    updateTaskProgressFromSubtasks(currentEditingTask.id);
    
    // 同步子任务状态到时间线
    if (subtask.completionTime) {
        syncSubtaskToTimeline(currentEditingTask.id, index);
        renderTimelineVertical();
    }
}

// 更新子任务标题
function updateSubtaskTitle(index, title) {
    if (!currentEditingTask) return;
    currentEditingTask.subtasks[index].title = title;
    
    // 自动保存任务数据
    console.log(`子任务标题已更新: ${title}`);
    saveData();
    updateTaskProgressFromSubtasks(currentEditingTask.id);
}

// 删除子任务
function removeSubtask(index) {
    if (!currentEditingTask) return;
    
    const removedSubtask = currentEditingTask.subtasks[index];
    currentEditingTask.subtasks.splice(index, 1);
    
    console.log('删除子任务:', {
        '子任务标题': removedSubtask.title,
        '任务ID': currentEditingTask.id,
        '剩余子任务数': currentEditingTask.subtasks.length
    });
    
    // 自动更新任务进度
    updateTaskProgressFromSubtasks(currentEditingTask.id);
    
    // 重新渲染子任务列表
    const container = document.getElementById('subtasks-container');
    container.innerHTML = currentEditingTask.subtasks.map((subtask, index) => `
        <div class="subtask-item" style="display: flex; align-items: center; margin-bottom: 10px;">
            <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="toggleSubtask(${index})">
            <input type="text" class="form-control" value="${subtask.title}" onchange="updateSubtaskTitle(${index}, this.value)" style="margin-left: 10px;">
            <button class="btn btn-danger" onclick="removeSubtask(${index})" style="margin-left: 10px;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// 编辑章节
function editSection(sectionId) {
    // 检查编辑权限
    if (typeof checkEditPermission === 'function' && !checkEditPermission()) {
        return;
    }
    currentEditingSection = sectionId;
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (sectionId === 'overview') {
        modalTitle.textContent = '编辑项目概览';
        modalBody.innerHTML = `
            <div class="form-group">
                <label>项目名称</label>
                <input type="text" class="form-control" id="edit-project-name" value="${projectData.projectName}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>开始日期</label>
                    <input type="date" class="form-control" id="edit-start-date" value="${projectData.startDate}">
                </div>
                <div class="form-group">
                    <label>结束日期</label>
                    <input type="date" class="form-control" id="edit-end-date" value="${projectData.endDate}">
                </div>
            </div>
            <div class="form-group">
                <label>项目描述</label>
                <textarea class="form-control" id="edit-description" rows="5">${projectData.description}</textarea>
            </div>
        `;
    }
    
    modal.style.display = 'block';
}

// 保存模态框
function saveModal() {
    if (currentEditingSection === 'overview') {
        projectData.projectName = document.getElementById('edit-project-name').value;
        projectData.startDate = document.getElementById('edit-start-date').value;
        projectData.endDate = document.getElementById('edit-end-date').value;
        projectData.description = document.getElementById('edit-description').value;
        
        saveData();
        renderOverview();
    }
    
    closeModal();
}

// 关闭模态框
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    currentEditingSection = null;
}

// 编辑时间线
function editTimeline() {
    // 这里可以添加时间线编辑功能
    alert('时间线编辑功能待实现');
}

// 上传文件
function uploadFile() {
    // 检查编辑权限
    if (typeof checkEditPermission === 'function' && !checkEditPermission()) {
        return;
    }
    document.getElementById('fileInput').click();
}

// 处理文件上传
function handleFileUpload(event) {
    const files = event.target.files;
    for (let file of files) {
        const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: getFileType(file.name),
            size: formatFileSize(file.size),
            uploadDate: new Date().toISOString().split('T')[0],
            category: getFileCategory(file.name),
            folderId: currentFolderId, // 添加到当前文件夹
            file: file
        };
        
        projectData.files.push(fileData);
    }
    
    saveData();
    renderFiles();
    
    // 如果在树形视图中，刷新树形显示
    if (fileViewMode === 'tree') {
        renderFileTree();
    }
    
    // 清空文件选择
    event.target.value = '';
}

// 获取文件类型
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'doc': 'document', 'docx': 'document',
        'xls': 'spreadsheet', 'xlsx': 'spreadsheet',
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
        'pdf': 'pdf',
        'mp4': 'video', 'avi': 'video', 'mov': 'video',
        'mp3': 'audio', 'wav': 'audio',
        'zip': 'archive', 'rar': 'archive',
        'js': 'code', 'html': 'code', 'css': 'code', 'py': 'code'
    };
    return typeMap[ext] || 'document';
}

// 获取文件分类
function getFileCategory(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'images';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'data';
    if (['doc', 'docx', 'pdf', 'txt'].includes(ext)) return 'documents';
    return 'others';
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 下载文件
function downloadFile(fileId) {
    const file = projectData.files.find(f => f.id === fileId);
    if (file && file.file) {
        const url = URL.createObjectURL(file.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert('文件不存在或无法下载');
    }
}

// 删除文件
function deleteFile(fileId) {
    if (confirm('确定要删除这个文件吗？')) {
        projectData.files = projectData.files.filter(f => f.id !== fileId);
        saveData();
        renderFiles();
        
        // 如果在树形视图中，刷新树形显示
        if (fileViewMode === 'tree') {
            renderFileTree();
        }
    }
}

// 添加成果
function addResult() {
    // 检查编辑权限
    if (typeof checkEditPermission === 'function' && !checkEditPermission()) {
        return;
    }
    const newResult = {
        id: Date.now(),
        title: "新成果",
        description: "请输入成果描述",
        date: new Date().toISOString().split('T')[0],
        image: null,
        attachments: []
    };
    
    projectData.results.push(newResult);
    saveData();
    renderResults();
    editResult(newResult.id);
}

// 编辑成果
function editResult(resultId) {
    const result = projectData.results.find(r => r.id === resultId);
    if (!result) return;
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '编辑成果';
    modalBody.innerHTML = `
        <div class="form-group">
            <label>成果标题</label>
            <input type="text" class="form-control" id="result-title" value="${result.title}">
        </div>
        <div class="form-group">
            <label>成果描述</label>
            <textarea class="form-control" id="result-description" rows="4">${result.description}</textarea>
        </div>
        <div class="form-group">
            <label>完成日期</label>
            <input type="date" class="form-control" id="result-date" value="${result.date}">
        </div>
        <div class="form-group">
            <label>成果图片</label>
            <input type="file" class="form-control" id="result-image" accept="image/*" onchange="handleResultImage(event)">
            ${result.image ? `<img src="${result.image}" style="max-width: 200px; margin-top: 10px;">` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
    
    // 保存当前编辑的成果ID
    modal.dataset.resultId = resultId;
}

// 处理成果图片
function handleResultImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const resultId = parseInt(document.getElementById('modal').dataset.resultId);
            const result = projectData.results.find(r => r.id === resultId);
            if (result) {
                result.image = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

// 删除成果
function deleteResult(resultId) {
    if (confirm('确定要删除这个成果吗？')) {
        projectData.results = projectData.results.filter(r => r.id !== resultId);
        saveData();
        renderResults();
    }
}

// 拖拽处理
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    for (let file of files) {
        const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: getFileType(file.name),
            size: formatFileSize(file.size),
            uploadDate: new Date().toISOString().split('T')[0],
            category: getFileCategory(file.name),
            folderId: currentFolderId, // 添加到当前文件夹
            file: file
        };
        
        projectData.files.push(fileData);
    }
    
    saveData();
    renderFiles();
    
    // 如果在树形视图中，刷新树形显示
    if (fileViewMode === 'tree') {
        renderFileTree();
    }
}

// 导出数据
function exportData() {
    // 检查导出权限
    if (typeof checkPermission === 'function' && !checkPermission('canExport')) {
        if (typeof showMessage === 'function') {
            showMessage('您没有导出权限', 'warning');
        }
        return;
    }
    
    // 创建增强的导出数据
    const exportData = {
        ...projectData,
        exportInfo: {
            exportTime: new Date().toISOString(),
            version: '1.0.0',
            taskCount: projectData.tasks ? projectData.tasks.length : 0,
            completedTasks: projectData.tasks ? projectData.tasks.filter(t => t.status === 'completed').length : 0,
            totalSubtasks: projectData.tasks ? projectData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) : 0,
            completedSubtasks: projectData.tasks ? projectData.tasks.reduce((sum, t) => 
                sum + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0) : 0,
            timelineItems: projectData.timeline ? projectData.timeline.length : 0
        }
    };
    
    // 使用UTF-8编码确保中文字符正确导出
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    
    // 生成包含具体时间的文件名
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    a.download = `project_progress_${dateStr}_${timeStr}.json`;
    
    // 添加BOM头确保UTF-8编码被正确识别
    const bom = '\uFEFF';
    const dataWithBom = bom + dataStr;
    const dataBlobWithBom = new Blob([dataWithBom], {type: 'application/json;charset=utf-8'});
    const urlWithBom = URL.createObjectURL(dataBlobWithBom);
    a.href = urlWithBom;
    
    a.click();
    URL.revokeObjectURL(url);
    URL.revokeObjectURL(urlWithBom);
    
    showNotification('数据导出成功！', 'success');
}

// 导入数据
function importData() {
    // 检查导入权限
    if (typeof checkPermission === 'function' && !checkPermission('canImport')) {
        if (typeof showMessage === 'function') {
            showMessage('您没有导入权限', 'warning');
        }
        return;
    }
    document.getElementById('importFile').click();
}

// 对比数据
function compareData() {
    document.getElementById('compareFile').click();
}

// GitHub同步相关函数
function setupGitHubSync() {
    if (window.githubSync) {
        const success = window.githubSync.showTokenDialog();
        if (success) {
            showNotification('GitHub Token设置成功！现在可以同步数据到云端', 'success');
        }
    } else {
        showNotification('GitHub同步模块未加载', 'error');
    }
}

async function syncFromGitHub() {
    if (window.githubSync) {
        try {
            showNotification('正在从GitHub同步数据...', 'info');
            const githubData = await window.githubSync.loadData();
            if (githubData) {
                projectData = githubData;
                saveData();
                renderAll();
                showNotification('数据同步成功！', 'success');
            } else {
                showNotification('同步失败：无法从GitHub获取数据', 'error');
            }
        } catch (error) {
            console.error('同步失败:', error);
            showNotification('同步失败：' + error.message, 'error');
        }
    } else {
        showNotification('GitHub同步模块未加载', 'error');
    }
}

// 返回课题组页面
function goToHomePage() {
    if (confirm('确定要返回课题组页面吗？未保存的数据可能会丢失。')) {
        // 保存当前数据
        saveData();
        // 跳转到课题组首页
        window.location.href = 'index.html';
    }
}

// 处理导入
function handleImport(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 检查是否为进度对比模式
                if (importedData.exportInfo) {
                    showProgressComparison(importedData);
                } else {
                    // 直接导入模式
                    projectData = importedData;
                    saveData();
                    renderAll();
                    showNotification('数据导入成功！', 'success');
                }
            } catch (error) {
                showNotification('导入失败：文件格式不正确', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// 显示进度对比
function showProgressComparison(importedData) {
    const currentData = projectData;
    const comparisonData = importedData;
    
    // 创建对比模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'progress-comparison-modal';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3><i class="fas fa-chart-line"></i> 任务进度对比</h3>
                <span class="close" onclick="closeProgressComparison()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="comparison-container">
                    <div class="comparison-section">
                        <h4><i class="fas fa-calendar"></i> 导出时间信息</h4>
                        <div class="export-info">
                            <p><strong>导出时间：</strong>${new Date(comparisonData.exportInfo.exportTime).toLocaleString('zh-CN')}</p>
                            <p><strong>版本：</strong>${comparisonData.exportInfo.version}</p>
                        </div>
                    </div>
                    
                    <div class="comparison-section">
                        <h4><i class="fas fa-tasks"></i> 任务进度对比</h4>
                        <div class="progress-comparison">
                            <div class="comparison-item">
                                <div class="comparison-label">总任务数</div>
                                <div class="comparison-values">
                                    <span class="current">当前: ${currentData.tasks ? currentData.tasks.length : 0}</span>
                                    <span class="imported">导出时: ${comparisonData.exportInfo.taskCount}</span>
                                    <span class="change ${(currentData.tasks ? currentData.tasks.length : 0) - comparisonData.exportInfo.taskCount >= 0 ? 'positive' : 'negative'}">
                                        ${(currentData.tasks ? currentData.tasks.length : 0) - comparisonData.exportInfo.taskCount >= 0 ? '+' : ''}${(currentData.tasks ? currentData.tasks.length : 0) - comparisonData.exportInfo.taskCount}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="comparison-item">
                                <div class="comparison-label">已完成任务</div>
                                <div class="comparison-values">
                                    <span class="current">当前: ${currentData.tasks ? currentData.tasks.filter(t => t.status === 'completed').length : 0}</span>
                                    <span class="imported">导出时: ${comparisonData.exportInfo.completedTasks}</span>
                                    <span class="change ${(currentData.tasks ? currentData.tasks.filter(t => t.status === 'completed').length : 0) - comparisonData.exportInfo.completedTasks >= 0 ? 'positive' : 'negative'}">
                                        ${(currentData.tasks ? currentData.tasks.filter(t => t.status === 'completed').length : 0) - comparisonData.exportInfo.completedTasks >= 0 ? '+' : ''}${(currentData.tasks ? currentData.tasks.filter(t => t.status === 'completed').length : 0) - comparisonData.exportInfo.completedTasks}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="comparison-item">
                                <div class="comparison-label">总子任务数</div>
                                <div class="comparison-values">
                                    <span class="current">当前: ${currentData.tasks ? currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) : 0}</span>
                                    <span class="imported">导出时: ${comparisonData.exportInfo.totalSubtasks}</span>
                                    <span class="change ${(currentData.tasks ? currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) : 0) - comparisonData.exportInfo.totalSubtasks >= 0 ? 'positive' : 'negative'}">
                                        ${(currentData.tasks ? currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) : 0) - comparisonData.exportInfo.totalSubtasks >= 0 ? '+' : ''}${(currentData.tasks ? currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) : 0) - comparisonData.exportInfo.totalSubtasks}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="comparison-item">
                                <div class="comparison-label">已完成子任务</div>
                                <div class="comparison-values">
                                    <span class="current">当前: ${currentData.tasks ? currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0) : 0}</span>
                                    <span class="imported">导出时: ${comparisonData.exportInfo.completedSubtasks}</span>
                                    <span class="change ${(currentData.tasks ? currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0) : 0) - comparisonData.exportInfo.completedSubtasks >= 0 ? 'positive' : 'negative'}">
                                        ${(currentData.tasks ? currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0) : 0) - comparisonData.exportInfo.completedSubtasks >= 0 ? '+' : ''}${(currentData.tasks ? currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0) : 0) - comparisonData.exportInfo.completedSubtasks}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="comparison-item">
                                <div class="comparison-label">时间线项目</div>
                                <div class="comparison-values">
                                    <span class="current">当前: ${currentData.timeline ? currentData.timeline.length : 0}</span>
                                    <span class="imported">导出时: ${comparisonData.exportInfo.timelineItems}</span>
                                    <span class="change ${(currentData.timeline ? currentData.timeline.length : 0) - comparisonData.exportInfo.timelineItems >= 0 ? 'positive' : 'negative'}">
                                        ${(currentData.timeline ? currentData.timeline.length : 0) - comparisonData.exportInfo.timelineItems >= 0 ? '+' : ''}${(currentData.timeline ? currentData.timeline.length : 0) - comparisonData.exportInfo.timelineItems}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-section">
                        <h4><i class="fas fa-chart-pie"></i> 完成率对比</h4>
                        <div class="completion-rate-comparison">
                            <div class="rate-item">
                                <div class="rate-label">任务完成率</div>
                                <div class="rate-bars">
                                    <div class="rate-bar">
                                        <div class="rate-label-small">当前</div>
                                        <div class="rate-bar-container">
                                            <div class="rate-bar-fill" style="width: ${currentData.tasks && currentData.tasks.length > 0 ? (currentData.tasks.filter(t => t.status === 'completed').length / currentData.tasks.length * 100) : 0}%"></div>
                                            <span class="rate-text">${currentData.tasks && currentData.tasks.length > 0 ? Math.round(currentData.tasks.filter(t => t.status === 'completed').length / currentData.tasks.length * 100) : 0}%</span>
                                        </div>
                                    </div>
                                    <div class="rate-bar">
                                        <div class="rate-label-small">导出时</div>
                                        <div class="rate-bar-container">
                                            <div class="rate-bar-fill imported" style="width: ${comparisonData.exportInfo.taskCount > 0 ? (comparisonData.exportInfo.completedTasks / comparisonData.exportInfo.taskCount * 100) : 0}%"></div>
                                            <span class="rate-text">${comparisonData.exportInfo.taskCount > 0 ? Math.round(comparisonData.exportInfo.completedTasks / comparisonData.exportInfo.taskCount * 100) : 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="rate-item">
                                <div class="rate-label">子任务完成率</div>
                                <div class="rate-bars">
                                    <div class="rate-bar">
                                        <div class="rate-label-small">当前</div>
                                        <div class="rate-bar-container">
                                            <div class="rate-bar-fill" style="width: ${currentData.tasks && currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) > 0 ? (currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0) / currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) * 100) : 0}%"></div>
                                            <span class="rate-text">${currentData.tasks && currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) > 0 ? Math.round(currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0) / currentData.tasks.reduce((sum, t) => sum + (t.subtasks ? t.subtasks.length : 0), 0) * 100) : 0}%</span>
                                        </div>
                                    </div>
                                    <div class="rate-bar">
                                        <div class="rate-label-small">导出时</div>
                                        <div class="rate-bar-container">
                                            <div class="rate-bar-fill imported" style="width: ${comparisonData.exportInfo.totalSubtasks > 0 ? (comparisonData.exportInfo.completedSubtasks / comparisonData.exportInfo.totalSubtasks * 100) : 0}%"></div>
                                            <span class="rate-text">${comparisonData.exportInfo.totalSubtasks > 0 ? Math.round(comparisonData.exportInfo.completedSubtasks / comparisonData.exportInfo.totalSubtasks * 100) : 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-section">
                        <h4><i class="fas fa-tasks"></i> 详细任务对比</h4>
                        <div class="task-detail-comparison">
                            ${generateTaskComparisonHTML(currentData, comparisonData)}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeProgressComparison()">关闭</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // 保存导入数据供后续使用
    window.importedDataForDirectImport = comparisonData;
}

// 关闭进度对比模态框
function closeProgressComparison() {
    const modal = document.getElementById('progress-comparison-modal');
    if (modal) {
        modal.remove();
    }
}

// 直接导入数据
function importDataDirectly() {
    if (window.importedDataForDirectImport) {
        projectData = window.importedDataForDirectImport;
        saveData();
        renderAll();
        showNotification('数据导入成功！', 'success');
        closeProgressComparison();
    }
}

// 生成任务对比HTML
function generateTaskComparisonHTML(currentData, comparisonData) {
    const currentTasks = currentData.tasks || [];
    const comparisonTasks = comparisonData.tasks || [];
    
    let html = '<div class="task-comparison-list">';
    
    // 获取所有任务（当前和对比中的）
    const allTaskTitles = new Set([
        ...currentTasks.map(t => t.title),
        ...comparisonTasks.map(t => t.title)
    ]);
    
    allTaskTitles.forEach(taskTitle => {
        const currentTask = currentTasks.find(t => t.title === taskTitle);
        const comparisonTask = comparisonTasks.find(t => t.title === taskTitle);
        
        html += `
            <div class="task-comparison-item">
                <div class="task-comparison-header">
                    <h5><i class="fas fa-tasks"></i> ${taskTitle}</h5>
                    <div class="task-status-indicators">
                        ${currentTask ? `<span class="status-indicator current ${currentTask.status}">当前: ${getStatusText(currentTask.status)}</span>` : '<span class="status-indicator missing">当前: 不存在</span>'}
                        ${comparisonTask ? `<span class="status-indicator comparison ${comparisonTask.status}">导出时: ${getStatusText(comparisonTask.status)}</span>` : '<span class="status-indicator missing">导出时: 不存在</span>'}
                    </div>
                </div>
                
                <div class="task-comparison-details">
                    ${generateSubtaskComparisonHTML(currentTask, comparisonTask)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 生成子任务对比HTML
function generateSubtaskComparisonHTML(currentTask, comparisonTask) {
    const currentSubtasks = currentTask?.subtasks || [];
    const comparisonSubtasks = comparisonTask?.subtasks || [];
    
    if (currentSubtasks.length === 0 && comparisonSubtasks.length === 0) {
        return '<div class="no-subtasks">无子任务</div>';
    }
    
    // 计算子任务完成率
    const currentCompleted = currentSubtasks.filter(s => s.completed).length;
    const currentTotal = currentSubtasks.length;
    const currentRate = currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0;
    
    const comparisonCompleted = comparisonSubtasks.filter(s => s.completed).length;
    const comparisonTotal = comparisonSubtasks.length;
    const comparisonRate = comparisonTotal > 0 ? Math.round((comparisonCompleted / comparisonTotal) * 100) : 0;
    
    let html = '<div class="subtask-comparison">';
    html += '<h6><i class="fas fa-list-ul"></i> 子任务对比</h6>';
    
    // 添加子任务完成率对比
    html += `
        <div class="subtask-completion-rate">
            <div class="completion-rate-item">
                <span class="rate-label">当前完成率:</span>
                <div class="rate-bar">
                    <div class="rate-fill" style="width: ${currentRate}%; background: var(--primary-color);"></div>
                    <span class="rate-text">${currentRate}% (${currentCompleted}/${currentTotal})</span>
                </div>
            </div>
            <div class="completion-rate-item">
                <span class="rate-label">导出时完成率:</span>
                <div class="rate-bar">
                    <div class="rate-fill" style="width: ${comparisonRate}%; background: var(--secondary-color);"></div>
                    <span class="rate-text">${comparisonRate}% (${comparisonCompleted}/${comparisonTotal})</span>
                </div>
            </div>
            <div class="completion-rate-change">
                <span class="change-label">变化:</span>
                <span class="change-value ${currentRate > comparisonRate ? 'improved' : currentRate < comparisonRate ? 'regressed' : 'no-change'}">
                    ${currentRate > comparisonRate ? '+' : ''}${currentRate - comparisonRate}%
                    <i class="fas fa-${currentRate > comparisonRate ? 'arrow-up' : currentRate < comparisonRate ? 'arrow-down' : 'minus'}"></i>
                </span>
            </div>
        </div>
    `;
    
    // 获取所有子任务标题
    const allSubtaskTitles = new Set([
        ...currentSubtasks.map(s => s.title),
        ...comparisonSubtasks.map(s => s.title)
    ]);
    
    allSubtaskTitles.forEach(subtaskTitle => {
        const currentSubtask = currentSubtasks.find(s => s.title === subtaskTitle);
        const comparisonSubtask = comparisonSubtasks.find(s => s.title === subtaskTitle);
        
        const currentStatus = currentSubtask ? (currentSubtask.completed ? 'completed' : 'pending') : 'missing';
        const comparisonStatus = comparisonSubtask ? (comparisonSubtask.completed ? 'completed' : 'pending') : 'missing';
        
        html += `
            <div class="subtask-comparison-item">
                <div class="subtask-title">${subtaskTitle}</div>
                <div class="subtask-status-comparison">
                    <div class="status-comparison">
                        <span class="status-badge current ${currentStatus}">
                            <i class="fas fa-${currentStatus === 'completed' ? 'check' : currentStatus === 'pending' ? 'clock' : 'times'}"></i>
                            当前: ${getSubtaskStatusText(currentStatus)}
                        </span>
                        <span class="status-badge comparison ${comparisonStatus}">
                            <i class="fas fa-${comparisonStatus === 'completed' ? 'check' : comparisonStatus === 'pending' ? 'clock' : 'times'}"></i>
                            导出时: ${getSubtaskStatusText(comparisonStatus)}
                        </span>
                    </div>
                    ${generateSubtaskChangeIndicator(currentStatus, comparisonStatus)}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 生成子任务变化指示器
function generateSubtaskChangeIndicator(currentStatus, comparisonStatus) {
    if (currentStatus === 'missing' && comparisonStatus === 'missing') {
        return '<span class="change-indicator no-change">无变化</span>';
    }
    
    if (currentStatus === 'missing') {
        return '<span class="change-indicator removed">已删除</span>';
    }
    
    if (comparisonStatus === 'missing') {
        return '<span class="change-indicator added">新增</span>';
    }
    
    if (currentStatus === comparisonStatus) {
        return '<span class="change-indicator no-change">无变化</span>';
    }
    
    if (currentStatus === 'completed' && comparisonStatus === 'pending') {
        return '<span class="change-indicator improved">已完成</span>';
    }
    
    if (currentStatus === 'pending' && comparisonStatus === 'completed') {
        return '<span class="change-indicator regressed">未完成</span>';
    }
    
    return '<span class="change-indicator changed">状态变化</span>';
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待开始',
        'in-progress': '进行中',
        'completed': '已完成'
    };
    return statusMap[status] || '未知';
}

// 获取子任务状态文本
function getSubtaskStatusText(status) {
    const statusMap = {
        'completed': '已完成',
        'pending': '待完成',
        'missing': '不存在'
    };
    return statusMap[status] || '未知';
}

// 处理对比数据
function handleCompare(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 检查是否为增强导出文件
                if (importedData.exportInfo) {
                    showProgressComparison(importedData);
                } else {
                    // 普通文件，显示提示
                    showNotification('请选择之前导出的增强数据文件进行对比', 'warning');
                }
            } catch (error) {
                showNotification('文件格式不正确，请选择有效的JSON文件', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// 使内容可编辑
function makeEditable(element) {
    if (element.classList.contains('editing')) return;
    
    element.classList.add('editing');
    const originalContent = element.textContent;
    
    const input = document.createElement('textarea');
    input.value = originalContent;
    input.className = 'form-control';
    input.style.minHeight = '100px';
    
    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    
    const save = () => {
        const newContent = input.value;
        element.textContent = newContent;
        element.classList.remove('editing');
        
        // 更新数据
        if (element.id === 'project-description') {
            projectData.description = newContent;
            saveData();
        }
    };
    
    const cancel = () => {
        element.textContent = originalContent;
        element.classList.remove('editing');
    };
    
    input.addEventListener('blur', save);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            save();
        } else if (e.key === 'Escape') {
            cancel();
        }
    });
}

// ==================== 技术路线图相关功能 ====================

// 渲染技术路线图
function renderRoadmap() {
    const container = document.getElementById('roadmap-container');
    if (!container) return;
    
    // 确保roadmap数组存在
    if (!projectData.roadmap) {
        projectData.roadmap = [];
    }
    
    if (projectData.roadmap.length === 0) {
        container.innerHTML = `
            <div class="roadmap-empty">
                <i class="fas fa-route"></i>
                <p>暂无技术路线节点</p>
                <p>点击"添加节点"开始构建您的技术路线图</p>
            </div>
        `;
        return;
    }
    
    const flow = document.createElement('div');
    flow.className = 'roadmap-flow';
    
    // 只渲染根节点（没有父节点的节点）
    const rootNodes = projectData.roadmap.filter(node => !node.parentId);
    
    rootNodes.forEach((node, index) => {
        const nodeElement = createRoadmapNodeWithChildren(node, index);
        flow.appendChild(nodeElement);
    });
    
    container.innerHTML = '';
    container.appendChild(flow);
}

// 创建技术路线图节点元素
function createRoadmapNode(node, index) {
    const div = document.createElement('div');
    div.className = `roadmap-node ${node.status} ${node.type ? 'type-' + node.type : ''}`;
    div.dataset.nodeId = node.id;
    
    const statusClass = `status-${node.status}`;
    
    div.innerHTML = `
        <div class="roadmap-node-header">
            <h4 class="roadmap-node-title">${index + 1}. ${node.title}</h4>
            <span class="roadmap-node-status ${statusClass}">${getStatusText(node.status)}</span>
        </div>
        <div class="roadmap-node-description">${node.description}</div>
        <div class="roadmap-node-meta">
            <span><i class="fas fa-calendar"></i> ${node.estimatedTime || '待定'}</span>
            <div class="roadmap-node-actions">
                <button class="btn btn-primary" onclick="addChildNode(${node.id})" title="添加子节点">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-edit" onclick="editRoadmapNode(${node.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteRoadmapNode(${node.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        ${index < projectData.roadmap.length - 1 ? '<div class="roadmap-connector"></div>' : ''}
    `;
    
    return div;
}

// 创建带子节点的技术路线图节点
function createRoadmapNodeWithChildren(node, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'roadmap-node-wrapper';
    
    // 创建主节点
    const nodeElement = createRoadmapNode(node, index);
    wrapper.appendChild(nodeElement);
    
    // 获取子节点
    const childNodes = projectData.roadmap.filter(child => child.parentId === node.id);
    
    if (childNodes.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'roadmap-children';
        
        childNodes.forEach((childNode, childIndex) => {
            const childElement = createRoadmapNodeWithChildren(childNode, childIndex);
            childElement.classList.add('roadmap-child');
            childrenContainer.appendChild(childElement);
        });
        
        wrapper.appendChild(childrenContainer);
    }
    
    return wrapper;
}

// 添加技术路线图节点
function addRoadmapNode(parentId = null) {
    // 检查编辑权限
    if (typeof checkEditPermission === 'function' && !checkEditPermission()) {
        return;
    }
    const newNode = {
        id: Date.now(),
        title: "新技术节点",
        description: "请描述这个技术节点的具体内容和目标",
        status: "pending",
        type: "research",
        estimatedTime: "1个月",
        dependencies: [],
        parentId: parentId, // 添加父节点ID
        children: [] // 添加子节点数组
    };
    
    projectData.roadmap.push(newNode);
    
    // 如果有父节点，更新父节点的子节点列表
    if (parentId) {
        const parentNode = projectData.roadmap.find(n => n.id === parentId);
        if (parentNode) {
            if (!parentNode.children) {
                parentNode.children = [];
            }
            parentNode.children.push(newNode.id);
        }
    }
    
    saveData();
    renderRoadmap();
    editRoadmapNode(newNode.id);
}

// 添加子节点
function addChildNode(parentId) {
    addRoadmapNode(parentId);
}

// 编辑技术路线图节点
function editRoadmapNode(nodeId) {
    const node = projectData.roadmap.find(n => n.id === nodeId);
    if (!node) return;
    
    currentEditingRoadmapNode = node;
    
    const modal = document.getElementById('roadmapModal');
    const modalTitle = document.getElementById('roadmapModal-title');
    const modalBody = document.getElementById('roadmapModal-body');
    
    modalTitle.textContent = '编辑技术路线节点';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>节点标题</label>
            <input type="text" class="form-control" id="roadmap-node-title" value="${node.title}">
        </div>
        <div class="form-group">
            <label>节点描述</label>
            <textarea class="form-control" id="roadmap-node-description" rows="4">${node.description}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>节点类型</label>
                <select class="form-control" id="roadmap-node-type">
                    <option value="research" ${node.type === 'research' ? 'selected' : ''}>理论研究</option>
                    <option value="experiment" ${node.type === 'experiment' ? 'selected' : ''}>实验验证</option>
                    <option value="analysis" ${node.type === 'analysis' ? 'selected' : ''}>数据分析</option>
                    <option value="development" ${node.type === 'development' ? 'selected' : ''}>系统开发</option>
                    <option value="testing" ${node.type === 'testing' ? 'selected' : ''}>测试评估</option>
                    <option value="deployment" ${node.type === 'deployment' ? 'selected' : ''}>部署应用</option>
                </select>
            </div>
            <div class="form-group">
                <label>状态</label>
                <select class="form-control" id="roadmap-node-status">
                    <option value="pending" ${node.status === 'pending' ? 'selected' : ''}>待开始</option>
                    <option value="in-progress" ${node.status === 'in-progress' ? 'selected' : ''}>进行中</option>
                    <option value="completed" ${node.status === 'completed' ? 'selected' : ''}>已完成</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>预计时间</label>
            <input type="text" class="form-control" id="roadmap-node-time" value="${node.estimatedTime || ''}" placeholder="例如：1个月、2周等">
        </div>
        <div class="form-group">
            <label>技术要点</label>
            <textarea class="form-control" id="roadmap-node-keypoints" rows="3" placeholder="列出关键技术要点，每行一个">${node.keyPoints ? node.keyPoints.join('\n') : ''}</textarea>
        </div>
        <div class="form-group">
            <label>预期成果</label>
            <textarea class="form-control" id="roadmap-node-outcomes" rows="3" placeholder="描述预期产出的成果">${node.expectedOutcomes || ''}</textarea>
        </div>
    `;
    
    modal.style.display = 'block';
}

// 保存技术路线图节点
function saveRoadmapNode() {
    if (!currentEditingRoadmapNode) return;
    
    const node = currentEditingRoadmapNode;
    node.title = document.getElementById('roadmap-node-title').value;
    node.description = document.getElementById('roadmap-node-description').value;
    node.type = document.getElementById('roadmap-node-type').value;
    node.status = document.getElementById('roadmap-node-status').value;
    node.estimatedTime = document.getElementById('roadmap-node-time').value;
    
    // 处理技术要点
    const keyPointsText = document.getElementById('roadmap-node-keypoints').value;
    node.keyPoints = keyPointsText.split('\n').filter(point => point.trim() !== '');
    
    // 处理预期成果
    node.expectedOutcomes = document.getElementById('roadmap-node-outcomes').value;
    
    saveData();
    renderRoadmap();
    closeRoadmapModal();
}

// 删除技术路线图节点
function deleteRoadmapNode(nodeId) {
    const node = projectData.roadmap.find(n => n.id === nodeId);
    if (!node) return;
    
    // 检查是否有子节点
    const childNodes = projectData.roadmap.filter(n => n.parentId === nodeId);
    const hasChildren = childNodes.length > 0;
    
    let confirmMessage = '确定要删除这个技术路线节点吗？';
    if (hasChildren) {
        confirmMessage = `确定要删除这个技术路线节点吗？\n\n注意：这将同时删除 ${childNodes.length} 个子节点。`;
    }
    
    if (confirm(confirmMessage)) {
        // 递归删除所有子节点
        function deleteNodeAndChildren(nodeId) {
            const children = projectData.roadmap.filter(n => n.parentId === nodeId);
            children.forEach(child => {
                deleteNodeAndChildren(child.id);
            });
            projectData.roadmap = projectData.roadmap.filter(n => n.id !== nodeId);
        }
        
        deleteNodeAndChildren(nodeId);
        saveData();
        renderRoadmap();
    }
}

// 关闭技术路线图模态框
function closeRoadmapModal() {
    document.getElementById('roadmapModal').style.display = 'none';
    currentEditingRoadmapNode = null;
}

// 编辑整个技术路线图
function editRoadmap() {
    // 检查编辑权限
    if (typeof checkEditPermission === 'function' && !checkEditPermission()) {
        return;
    }
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '批量编辑技术路线图';
    
    // 创建可排序的节点列表
    let nodesHTML = '<div class="form-group"><label>节点顺序（可拖拽排序）</label><div id="roadmap-sortable-list" class="sortable-list">';
    
    projectData.roadmap.forEach((node, index) => {
        nodesHTML += `
            <div class="sortable-item" data-node-id="${node.id}">
                <span class="sortable-handle"><i class="fas fa-grip-vertical"></i></span>
                <span class="sortable-content">${index + 1}. ${node.title}</span>
                <button class="btn btn-edit" onclick="editRoadmapNode(${node.id}); closeModal();">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
    });
    
    nodesHTML += '</div></div>';
    nodesHTML += `
        <div class="alert alert-info">
            <i class="fas fa-info-circle"></i> 
            提示：拖拽节点可以调整顺序，点击编辑按钮可以修改节点内容
        </div>
    `;
    
    modalBody.innerHTML = nodesHTML;
    
    modal.style.display = 'block';
    
    // 这里可以添加拖拽排序功能（需要额外的库或原生实现）
}

// 移动技术路线图节点
function moveRoadmapNode(nodeId, direction) {
    const index = projectData.roadmap.findIndex(n => n.id === nodeId);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
        [projectData.roadmap[index], projectData.roadmap[index - 1]] = 
        [projectData.roadmap[index - 1], projectData.roadmap[index]];
    } else if (direction === 'down' && index < projectData.roadmap.length - 1) {
        [projectData.roadmap[index], projectData.roadmap[index + 1]] = 
        [projectData.roadmap[index + 1], projectData.roadmap[index]];
    }
    
    saveData();
    renderRoadmap();
}

// ==================== 主题切换功能 ====================

// 加载主题
function loadTheme() {
    const savedTheme = localStorage.getItem('projectTheme') || 'default';
    applyTheme(savedTheme);
}

// 应用主题
function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('projectTheme', themeName);
    
    // 更新主题选择器中的选中状态
    document.querySelectorAll('.theme-option').forEach(option => {
        if (option.dataset.theme === themeName) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// 切换主题
function changeTheme(themeName) {
    applyTheme(themeName);
    
    // 添加过渡效果
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

// 切换主题选择器显示/隐藏
function toggleThemeSelector() {
    const selector = document.getElementById('theme-selector');
    if (selector.style.display === 'none' || selector.style.display === '') {
        selector.style.display = 'block';
        // 确保当前主题被标记为选中
        const currentTheme = document.body.getAttribute('data-theme') || 'default';
        document.querySelectorAll('.theme-option').forEach(option => {
            if (option.dataset.theme === currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    } else {
        selector.style.display = 'none';
    }
}

// 点击主题选择器外部关闭
document.addEventListener('click', function(e) {
    const selector = document.getElementById('theme-selector');
    const themeBtn = document.querySelector('.btn-theme');
    
    if (selector && selector.style.display === 'block') {
        if (!selector.contains(e.target) && e.target !== themeBtn && !themeBtn.contains(e.target)) {
            selector.style.display = 'none';
        }
    }
});

// ==================== 文件树形管理功能 ====================

// 初始化文件夹结构
function initializeFileFolders() {
    if (!projectData.folders) {
        projectData.folders = [
            {
                id: 1,
                name: "文档资料",
                parentId: null,
                children: [],
                createDate: "2024-01-01"
            },
            {
                id: 2,
                name: "实验数据",
                parentId: null,
                children: [],
                createDate: "2024-01-01"
            },
            {
                id: 3,
                name: "图片资源",
                parentId: null,
                children: [],
                createDate: "2024-01-01"
            }
        ];
    }
    
    // 为现有文件添加folderId字段
    if (projectData.files && projectData.files.length > 0) {
        projectData.files.forEach(file => {
            if (!file.hasOwnProperty('folderId')) {
                file.folderId = null; // 根目录
            }
        });
    }
}

// 切换文件视图模式（已弃用，仅保留树形视图）
function toggleFileView() {
    // 由于已移除网格视图，此函数不再需要
    console.log('文件视图切换功能已弃用，仅支持树形视图');
    return;
}

// 渲染文件树
function renderFileTree() {
    const container = document.getElementById('file-tree');
    if (!container) {
        console.error('文件树容器未找到');
        return;
    }
    
    initializeFileFolders();
    
    container.innerHTML = '';
    
    // 获取根目录文件夹
    const rootFolders = projectData.folders.filter(folder => folder.parentId === currentFolderId);
    const rootFiles = projectData.files.filter(file => file.folderId === currentFolderId);
    
    if (rootFolders.length === 0 && rootFiles.length === 0) {
        container.innerHTML = `
            <div class="tree-empty">
                <i class="fas fa-folder-open"></i>
                <p>此文件夹为空</p>
                <p>点击"新建文件夹"或"上传文件"开始添加内容</p>
            </div>
        `;
        return;
    }
    
    // 渲染文件夹
    rootFolders.forEach(folder => {
        container.appendChild(createFolderNode(folder));
    });
    
    // 渲染文件
    rootFiles.forEach(file => {
        container.appendChild(createFileNode(file));
    });
}

// 创建文件夹节点
function createFolderNode(folder) {
    const node = document.createElement('div');
    node.className = 'tree-node';
    node.dataset.folderId = folder.id;
    
    const childFolders = projectData.folders.filter(f => f.parentId === folder.id);
    const childFiles = projectData.files.filter(f => f.folderId === folder.id);
    const hasChildren = childFolders.length > 0 || childFiles.length > 0;
    
    node.innerHTML = `
        <div class="tree-node-header" ondblclick="navigateToFolder(${folder.id})">
            ${hasChildren ? `<span class="tree-node-toggle" onclick="toggleNode(event, this)"><i class="fas fa-chevron-right"></i></span>` : '<span style="width: 20px;"></span>'}
            <i class="fas fa-folder tree-node-icon folder"></i>
            <span class="tree-node-name">${folder.name}</span>
            <div class="tree-node-meta">
                <span><i class="fas fa-clock"></i> ${folder.createDate}</span>
                <span><i class="fas fa-file"></i> ${childFiles.length} 文件</span>
            </div>
            <div class="tree-node-actions">
                <button class="btn btn-edit" onclick="event.stopPropagation(); editFolder(${folder.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteFolder(${folder.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        ${hasChildren ? `<div class="tree-node-children"></div>` : ''}
    `;
    
    return node;
}

// 创建文件节点
function createFileNode(file) {
    const node = document.createElement('div');
    node.className = 'tree-node';
    node.dataset.fileId = file.id;
    
    const icon = getFileIcon(file.type);
    
    node.innerHTML = `
        <div class="tree-node-header">
            <span style="width: 20px;"></span>
            ${icon.replace('class="', 'class="tree-node-icon file ')}
            <span class="tree-node-name">${file.name}</span>
            <div class="tree-node-meta">
                <span><i class="fas fa-clock"></i> ${file.uploadDate}</span>
                <span><i class="fas fa-hdd"></i> ${file.size}</span>
            </div>
            <div class="tree-node-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); downloadFile(${file.id})">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteFile(${file.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // 添加双击打开文件功能
    node.ondblclick = () => openFileWithSystemDefault(file.id);
    
    return node;
}

// 切换节点展开/折叠
function toggleNode(event, toggle) {
    event.stopPropagation();
    const node = toggle.closest('.tree-node');
    const children = node.querySelector('.tree-node-children');
    
    if (!children) return;
    
    toggle.classList.toggle('expanded');
    children.classList.toggle('expanded');
    
    // 如果是首次展开，加载子节点
    if (children.classList.contains('expanded') && children.children.length === 0) {
        const folderId = parseInt(node.dataset.folderId);
        const childFolders = projectData.folders.filter(f => f.parentId === folderId);
        const childFiles = projectData.files.filter(f => f.folderId === folderId);
        
        childFolders.forEach(folder => {
            children.appendChild(createFolderNode(folder));
        });
        
        childFiles.forEach(file => {
            children.appendChild(createFileNode(file));
        });
    }
}

// 导航到文件夹
function navigateToFolder(folderId) {
    currentFolderId = folderId;
    renderFileTree();
    updateBreadcrumb();
}

// 更新面包屑导航
function updateBreadcrumb() {
    const breadcrumb = document.getElementById('file-breadcrumb');
    breadcrumb.innerHTML = '';
    
    const path = [];
    let currentId = currentFolderId;
    
    while (currentId !== null) {
        const folder = projectData.folders.find(f => f.id === currentId);
        if (folder) {
            path.unshift(folder);
            currentId = folder.parentId;
        } else {
            break;
        }
    }
    
    // 根目录
    const rootItem = document.createElement('span');
    rootItem.className = 'breadcrumb-item' + (currentFolderId === null ? ' active' : '');
    rootItem.innerHTML = '<i class="fas fa-home"></i> 根目录';
    rootItem.onclick = () => navigateToFolder(null);
    breadcrumb.appendChild(rootItem);
    
    // 路径中的文件夹
    path.forEach((folder, index) => {
        const item = document.createElement('span');
        item.className = 'breadcrumb-item' + (index === path.length - 1 ? ' active' : '');
        item.textContent = folder.name;
        item.onclick = () => navigateToFolder(folder.id);
        breadcrumb.appendChild(item);
    });
}

// 添加文件夹
function addFolder() {
    // 检查编辑权限
    if (typeof checkEditPermission === 'function' && !checkEditPermission()) {
        return;
    }
    currentEditingFolder = null;
    
    const modal = document.getElementById('folderModal');
    const modalTitle = document.getElementById('folderModal-title');
    const modalBody = document.getElementById('folderModal-body');
    
    modalTitle.textContent = '新建文件夹';
    modalBody.innerHTML = `
        <div class="form-group">
            <label>文件夹名称</label>
            <input type="text" class="form-control" id="folder-name" placeholder="请输入文件夹名称">
        </div>
        <div class="form-group">
            <label>父文件夹</label>
            <select class="form-control" id="folder-parent">
                <option value="">根目录</option>
                ${generateFolderOptions()}
            </select>
        </div>
        <div class="form-group">
            <label>备注</label>
            <textarea class="form-control" id="folder-description" rows="3" placeholder="选填：添加文件夹说明"></textarea>
        </div>
    `;
    
    // 设置当前文件夹为默认父文件夹
    if (currentFolderId !== null) {
        document.getElementById('folder-parent').value = currentFolderId;
    }
    
    modal.style.display = 'block';
}

// 生成文件夹选项
function generateFolderOptions(excludeId = null) {
    initializeFileFolders();
    let options = '';
    
    function addFolderOption(folder, level = 0) {
        if (folder.id === excludeId) return;
        
        const indent = '&nbsp;&nbsp;'.repeat(level);
        options += `<option value="${folder.id}">${indent}${folder.name}</option>`;
        
        const children = projectData.folders.filter(f => f.parentId === folder.id);
        children.forEach(child => addFolderOption(child, level + 1));
    }
    
    const rootFolders = projectData.folders.filter(f => f.parentId === null);
    rootFolders.forEach(folder => addFolderOption(folder));
    
    return options;
}

// 编辑文件夹
function editFolder(folderId) {
    const folder = projectData.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    currentEditingFolder = folder;
    
    const modal = document.getElementById('folderModal');
    const modalTitle = document.getElementById('folderModal-title');
    const modalBody = document.getElementById('folderModal-body');
    
    modalTitle.textContent = '编辑文件夹';
    modalBody.innerHTML = `
        <div class="form-group">
            <label>文件夹名称</label>
            <input type="text" class="form-control" id="folder-name" value="${folder.name}">
        </div>
        <div class="form-group">
            <label>父文件夹</label>
            <select class="form-control" id="folder-parent">
                <option value="">根目录</option>
                ${generateFolderOptions(folder.id)}
            </select>
        </div>
        <div class="form-group">
            <label>备注</label>
            <textarea class="form-control" id="folder-description" rows="3">${folder.description || ''}</textarea>
        </div>
    `;
    
    document.getElementById('folder-parent').value = folder.parentId || '';
    
    modal.style.display = 'block';
}

// 保存文件夹
function saveFolder() {
    const name = document.getElementById('folder-name').value.trim();
    if (!name) {
        alert('请输入文件夹名称');
        return;
    }
    
    const parentValue = document.getElementById('folder-parent').value;
    const parentId = parentValue === '' ? null : parseInt(parentValue);
    const description = document.getElementById('folder-description').value.trim();
    
    if (currentEditingFolder) {
        // 编辑现有文件夹
        currentEditingFolder.name = name;
        currentEditingFolder.parentId = parentId;
        currentEditingFolder.description = description;
    } else {
        // 创建新文件夹
        initializeFileFolders();
        const newFolder = {
            id: Date.now(),
            name: name,
            parentId: parentId,
            description: description,
            children: [],
            createDate: new Date().toISOString().split('T')[0]
        };
        projectData.folders.push(newFolder);
    }
    
    saveData();
    if (fileViewMode === 'tree') {
        renderFileTree();
    }
    closeFolderModal();
}

// 删除文件夹
function deleteFolder(folderId) {
    const folder = projectData.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    // 检查是否有子文件夹或文件
    const hasChildren = projectData.folders.some(f => f.parentId === folderId);
    const hasFiles = projectData.files.some(f => f.folderId === folderId);
    
    if (hasChildren || hasFiles) {
        if (!confirm(`文件夹"${folder.name}"不为空，确定要删除吗？\n（文件夹中的所有内容将被移动到根目录）`)) {
            return;
        }
        
        // 将子文件夹和文件移动到根目录
        projectData.folders.forEach(f => {
            if (f.parentId === folderId) {
                f.parentId = null;
            }
        });
        projectData.files.forEach(f => {
            if (f.folderId === folderId) {
                f.folderId = null;
            }
        });
    } else {
        if (!confirm(`确定要删除文件夹"${folder.name}"吗？`)) {
            return;
        }
    }
    
    projectData.folders = projectData.folders.filter(f => f.id !== folderId);
    saveData();
    if (fileViewMode === 'tree') {
        renderFileTree();
    }
}

// 关闭文件夹模态框
function closeFolderModal() {
    document.getElementById('folderModal').style.display = 'none';
    currentEditingFolder = null;
}

// 搜索文件
function searchFiles(keyword) {
    if (!keyword.trim()) {
        renderFileTree();
        return;
    }
    
    const container = document.getElementById('file-tree');
    container.innerHTML = '';
    
    keyword = keyword.toLowerCase();
    
    // 搜索文件夹
    const matchedFolders = projectData.folders.filter(folder => 
        folder.name.toLowerCase().includes(keyword)
    );
    
    // 搜索文件
    const matchedFiles = projectData.files.filter(file => 
        file.name.toLowerCase().includes(keyword)
    );
    
    if (matchedFolders.length === 0 && matchedFiles.length === 0) {
        container.innerHTML = `
            <div class="tree-empty">
                <i class="fas fa-search"></i>
                <p>未找到匹配的文件或文件夹</p>
            </div>
        `;
        return;
    }
    
    matchedFolders.forEach(folder => {
        container.appendChild(createFolderNode(folder));
    });
    
    matchedFiles.forEach(file => {
        container.appendChild(createFileNode(file));
    });
}

// ==================== File System Access API 功能 ====================

// 检查浏览器是否支持 File System Access API
function isFileSystemAccessSupported() {
    return 'showDirectoryPicker' in window;
}

// 选择本地目录
async function selectLocalDirectory(presetPath = null) {
    if (!isFileSystemAccessSupported()) {
        alert('您的浏览器不支持 File System Access API\n\n支持的浏览器：\n- Chrome 86+\n- Edge 86+\n\n当前将使用浏览器内存存储文件');
        return;
    }
    
    try {
        // 请求用户选择目录
        const pickerOptions = {
            mode: 'readwrite'
        };
        
        // 如果有预设路径，尝试使用它作为起始位置
        if (presetPath) {
            // 注意：File System Access API 不支持直接指定路径
            // 但我们可以尝试使用 'documents' 作为起始位置
            pickerOptions.startIn = 'documents';
        } else {
            pickerOptions.startIn = 'documents';
        }
        
        const dirHandle = await window.showDirectoryPicker(pickerOptions);
        
        // 保存目录句柄
        filesDirHandle = dirHandle;
        fsAccessEnabled = true;
        
        // 更新按钮文本
        const btnText = document.getElementById('fs-access-text');
        if (btnText) {
            btnText.innerHTML = '<i class="fas fa-check"></i> 已连接';
            btnText.parentElement.style.backgroundColor = 'var(--secondary-color)';
        }
        
        // 隐藏快速重连按钮
        const quickReconnectBtn = document.getElementById('quick-reconnect-btn');
        if (quickReconnectBtn) {
            quickReconnectBtn.style.display = 'none';
        }
        
        // 显示目录路径
        updateDirectoryDisplay(dirHandle.name);
        
        // 保存状态
        saveFileSystemState();
        
        // 显示成功消息
        showNotification('目录访问已授权！正在扫描本地文件...', 'success');
        
        // 扫描并同步本地文件
        await scanAndSyncLocalFiles();
        
        // 尝试同步现有文件（上传到本地）
        await syncExistingFiles();
        
        // 启动定期同步（可选）
        startAutoSync();
        
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('选择目录失败:', err);
            alert('选择目录失败: ' + err.message);
        }
    }
}

// 同步现有文件到本地
async function syncExistingFiles() {
    if (!fsAccessEnabled || !filesDirHandle) return;
    
    const filesToSync = projectData.files.filter(f => f.file && !f.savedToLocal);
    
    if (filesToSync.length === 0) return;
    
    const confirmed = confirm(`发现 ${filesToSync.length} 个文件尚未同步到本地\n是否现在同步？`);
    if (!confirmed) return;
    
    let successCount = 0;
    for (const fileData of filesToSync) {
        const saved = await saveFileToLocal(fileData.file, getFolderPathById(fileData.folderId));
        if (saved) {
            fileData.savedToLocal = true;
            fileData.file = null; // 清除内存中的文件对象
            successCount++;
        }
    }
    
    if (successCount > 0) {
        saveData();
        renderFiles();
        if (fileViewMode === 'tree') {
            renderFileTree();
        }
        showNotification(`成功同步 ${successCount} 个文件到本地`, 'success');
    }
}

// 保存文件到本地磁盘
async function saveFileToLocal(file, folderPath = '') {
    if (!filesDirHandle) return false;
    
    try {
        let currentDir = filesDirHandle;
        
        // 创建/进入文件夹路径
        if (folderPath) {
            const folders = folderPath.split('/').filter(f => f);
            for (const folderName of folders) {
                try {
                    currentDir = await currentDir.getDirectoryHandle(folderName, { create: true });
                } catch (err) {
                    console.error(`创建文件夹失败: ${folderName}`, err);
                    return false;
                }
            }
        }
        
        // 创建并写入文件
        const fileHandle = await currentDir.getFileHandle(file.name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        
        return true;
    } catch (err) {
        console.error('保存文件到本地失败:', err);
        return false;
    }
}

// 从本地磁盘读取文件
async function loadFileFromLocal(filename, folderPath = '') {
    if (!filesDirHandle) return null;
    
    try {
        let currentDir = filesDirHandle;
        
        // 进入文件夹路径
        if (folderPath) {
            const folders = folderPath.split('/').filter(f => f);
            for (const folderName of folders) {
                currentDir = await currentDir.getDirectoryHandle(folderName);
            }
        }
        
        // 读取文件
        const fileHandle = await currentDir.getFileHandle(filename);
        const file = await fileHandle.getFile();
        
        return file;
    } catch (err) {
        console.error('从本地读取文件失败:', err);
        return null;
    }
}

// 从本地磁盘删除文件
async function deleteFileFromLocal(filename, folderPath = '') {
    if (!filesDirHandle) return false;
    
    try {
        let currentDir = filesDirHandle;
        
        if (folderPath) {
            const folders = folderPath.split('/').filter(f => f);
            for (const folderName of folders) {
                currentDir = await currentDir.getDirectoryHandle(folderName);
            }
        }
        
        await currentDir.removeEntry(filename);
        return true;
    } catch (err) {
        console.error('删除本地文件失败:', err);
        return false;
    }
}

// 获取文件夹路径字符串（通过文件夹ID）
function getFolderPathById(folderId) {
    if (folderId === null) return '';
    
    const path = [];
    let currentId = folderId;
    
    while (currentId !== null) {
        const folder = projectData.folders.find(f => f.id === currentId);
        if (folder) {
            path.unshift(folder.name);
            currentId = folder.parentId;
        } else {
            break;
        }
    }
    
    return path.join('/');
}

// 显示通知消息
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 增强的文件上传处理
async function handleFileUploadEnhanced(event) {
    const files = event.target.files;
    let savedCount = 0;
    let totalCount = files.length;
    
    for (let file of files) {
        // 尝试保存到本地磁盘
        let savedToLocal = false;
        if (fsAccessEnabled && filesDirHandle) {
            savedToLocal = await saveFileToLocal(file, getFolderPathById(currentFolderId));
        }
        
        // 创建文件数据
        const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: getFileType(file.name),
            size: formatFileSize(file.size),
            uploadDate: new Date().toISOString().split('T')[0],
            category: getFileCategory(file.name),
            folderId: currentFolderId,
            savedToLocal: savedToLocal,
            file: savedToLocal ? null : file // 如果保存到本地，不需要保存 File 对象
        };
        
        projectData.files.push(fileData);
        
        if (savedToLocal) savedCount++;
    }
    
    saveData();
    renderFiles();
    
    if (fileViewMode === 'tree') {
        renderFileTree();
    }
    
    event.target.value = '';
    
    // 显示上传结果
    if (fsAccessEnabled) {
        if (savedCount === totalCount) {
            showNotification(`成功上传 ${totalCount} 个文件到本地磁盘`, 'success');
        } else if (savedCount > 0) {
            showNotification(`上传完成：${savedCount}/${totalCount} 个文件保存到本地`, 'info');
        } else {
            showNotification(`文件已上传，但保存到本地失败（已保存在浏览器内存中）`, 'error');
        }
    }
}

// 增强的文件下载
async function downloadFileEnhanced(fileId) {
    const fileData = projectData.files.find(f => f.id === fileId);
    if (!fileData) {
        alert('文件不存在');
        return;
    }
    
    let file = null;
    
    // 1. 尝试从本地磁盘读取
    if (fileData.savedToLocal && filesDirHandle) {
        file = await loadFileFromLocal(fileData.name, getFolderPathById(fileData.folderId));
        if (!file) {
            showNotification('从本地读取文件失败，请重新上传', 'error');
            return;
        }
    }
    
    // 2. 使用内存中的 File 对象
    if (!file && fileData.file) {
        file = fileData.file;
    }
    
    // 3. 下载文件
    if (file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert('文件不存在或无法下载');
    }
}

// 增强的文件删除
async function deleteFileEnhanced(fileId) {
    const fileData = projectData.files.find(f => f.id === fileId);
    if (!fileData) return;
    
    if (!confirm('确定要删除这个文件吗？')) return;
    
    // 如果文件保存在本地，也删除本地文件
    if (fileData.savedToLocal && filesDirHandle) {
        const deleted = await deleteFileFromLocal(fileData.name, getFolderPathById(fileData.folderId));
        if (deleted) {
            showNotification('文件已从本地磁盘删除', 'success');
        }
    }
    
    // 从数据中删除
    projectData.files = projectData.files.filter(f => f.id !== fileId);
    saveData();
    renderFiles();
    
    if (fileViewMode === 'tree') {
        renderFileTree();
    }
}

// 替换原有的文件上传、下载、删除函数
const originalHandleFileUpload = handleFileUpload;
const originalDownloadFile = downloadFile;
const originalDeleteFile = deleteFile;

// 重新定义函数
handleFileUpload = handleFileUploadEnhanced;
downloadFile = downloadFileEnhanced;
deleteFile = deleteFileEnhanced;

// ==================== 时间线编辑功能 ====================

// 渲染垂直时间线
function renderTimelineVertical() {
    const container = document.getElementById('timeline-vertical-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 确保timeline数组存在
    if (!projectData.timeline) {
        projectData.timeline = [];
    }
    
    if (projectData.timeline.length === 0) {
        container.innerHTML = `
            <div class="timeline-empty">
                <i class="fas fa-calendar-plus"></i>
                <p>暂无时间线项目</p>
                <p>点击 + 按钮添加</p>
            </div>
        `;
        return;
    }
    
    // 按日期排序
    const sortedTimeline = [...projectData.timeline].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedTimeline.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `timeline-vertical-item ${item.status}`;
        itemElement.dataset.itemId = item.id;
        
        const statusText = {
            'pending': '待完成',
            'in-progress': '进行中',
            'completed': '已完成'
        };
        
        itemElement.innerHTML = `
            <div class="timeline-vertical-date">${formatDate(item.date)}</div>
            <div class="timeline-vertical-title">${item.title}</div>
            <div class="timeline-vertical-desc">${item.description}</div>
            <div class="timeline-vertical-status ${item.status}">${statusText[item.status]}</div>
            <div class="timeline-vertical-actions">
                <button class="btn btn-edit" onclick="editTimelineItem(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteTimelineItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
}

// 添加时间线项目
function addTimelineItem() {
    // 检查编辑权限
    if (typeof checkEditPermission === 'function' && !checkEditPermission()) {
        return;
    }
    currentEditingTimelineItem = null;
    document.getElementById('timelineModalTitle').textContent = '添加时间线项目';
    document.getElementById('timelineDate').value = '';
    document.getElementById('timelineTitle').value = '';
    document.getElementById('timelineDescription').value = '';
    document.getElementById('timelineStatus').value = 'pending';
    document.getElementById('timelineModal').style.display = 'block';
}

// 编辑时间线项目
function editTimelineItem(itemId) {
    const item = projectData.timeline.find(t => t.id === itemId);
    if (!item) return;
    
    currentEditingTimelineItem = item;
    document.getElementById('timelineModalTitle').textContent = '编辑时间线项目';
    document.getElementById('timelineDate').value = item.date;
    document.getElementById('timelineTitle').value = item.title;
    document.getElementById('timelineDescription').value = item.description;
    document.getElementById('timelineStatus').value = item.status;
    document.getElementById('timelineModal').style.display = 'block';
}

// 保存时间线项目
function saveTimelineItem() {
    const date = document.getElementById('timelineDate').value;
    const title = document.getElementById('timelineTitle').value;
    const description = document.getElementById('timelineDescription').value;
    const status = document.getElementById('timelineStatus').value;
    
    if (!date || !title) {
        alert('请填写日期和标题');
        return;
    }
    
    if (currentEditingTimelineItem) {
        // 编辑现有项目
        currentEditingTimelineItem.date = date;
        currentEditingTimelineItem.title = title;
        currentEditingTimelineItem.description = description;
        currentEditingTimelineItem.status = status;
    } else {
        // 添加新项目
        const newItem = {
            id: Date.now(),
            date: date,
            title: title,
            description: description,
            status: status
        };
        projectData.timeline.push(newItem);
    }
    
    saveData();
    renderTimelineVertical();
    closeTimelineModal();
}

// 删除时间线项目
function deleteTimelineItem(itemId) {
    if (!confirm('确定要删除这个时间线项目吗？')) return;
    
    projectData.timeline = projectData.timeline.filter(t => t.id !== itemId);
    saveData();
    renderTimelineVertical();
}

// 关闭时间线模态框
function closeTimelineModal() {
    document.getElementById('timelineModal').style.display = 'none';
    currentEditingTimelineItem = null;
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
    });
}

// 启动自动同步
function startAutoSync() {
    if (!fsAccessEnabled) return;
    
    // 立即执行一次同步
    scanAndSyncLocalFiles();
    
    // 每30秒检查一次文件变化
    setInterval(async () => {
        if (fsAccessEnabled && filesDirHandle) {
            await scanAndSyncLocalFiles();
        }
    }, 30000);
    
    // 每5分钟深度同步一次
    setInterval(async () => {
        if (fsAccessEnabled && filesDirHandle) {
            await deepSyncFiles();
        }
    }, 300000);
}

// 扫描并同步本地文件
async function scanAndSyncLocalFiles() {
    if (!filesDirHandle) return;
    
    try {
        const localFiles = await readDirectoryContents(filesDirHandle);
        const existingFileNames = projectData.files.map(f => f.name);
        
        // 检查是否有新文件
        const newFiles = localFiles.filter(file => !existingFileNames.includes(file.name));
        
        if (newFiles.length > 0) {
            showNotification(`发现 ${newFiles.length} 个新文件，已自动同步`, 'success');
            
            // 添加新文件到系统
            for (const file of newFiles) {
                const fileData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: getFileType(file.name),
                    size: formatFileSize(file.size),
                    uploadDate: new Date().toISOString().split('T')[0],
                    category: getFileCategory(file.name),
                    folderId: null, // 根目录
                    savedToLocal: true,
                    file: null
                };
                projectData.files.push(fileData);
            }
            
            saveData();
            renderFiles();
            if (fileViewMode === 'tree') {
                renderFileTree();
            }
        }
    } catch (err) {
        console.error('扫描本地文件失败:', err);
    }
}

// 读取目录内容
async function readDirectoryContents(dirHandle, path = '') {
    const files = [];
    
    try {
        for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'file') {
                const file = await handle.getFile();
                files.push({
                    name: name,
                    size: file.size,
                    path: path,
                    lastModified: file.lastModified,
                    handle: handle
                });
            } else if (handle.kind === 'directory') {
                const subFiles = await readDirectoryContents(handle, path + name + '/');
                files.push(...subFiles);
            }
        }
    } catch (err) {
        console.error('读取目录失败:', err);
    }
    
    return files;
}

// 深度同步文件
async function deepSyncFiles() {
    if (!filesDirHandle) return;
    
    try {
        const localFiles = await readDirectoryContents(filesDirHandle);
        const systemFiles = projectData.files;
        
        // 检查本地新增的文件
        const newLocalFiles = localFiles.filter(localFile => 
            !systemFiles.some(systemFile => 
                systemFile.name === localFile.name && 
                systemFile.savedToLocal
            )
        );
        
        // 检查系统中有但本地没有的文件
        const missingLocalFiles = systemFiles.filter(systemFile => 
            systemFile.savedToLocal && 
            !localFiles.some(localFile => localFile.name === systemFile.name)
        );
        
        // 检查文件大小变化
        const changedFiles = localFiles.filter(localFile => {
            const systemFile = systemFiles.find(sf => 
                sf.name === localFile.name && sf.savedToLocal
            );
            return systemFile && systemFile.size !== formatFileSize(localFile.size);
        });
        
        let syncCount = 0;
        
        // 添加新文件到系统
        for (const localFile of newLocalFiles) {
            const fileData = {
                id: Date.now() + Math.random(),
                name: localFile.name,
                type: getFileType(localFile.name),
                size: formatFileSize(localFile.size),
                uploadDate: new Date(localFile.lastModified).toISOString().split('T')[0],
                category: getFileCategory(localFile.name),
                folderId: null,
                savedToLocal: true,
                file: null,
                lastModified: localFile.lastModified
            };
            projectData.files.push(fileData);
            syncCount++;
        }
        
        // 标记缺失的文件
        for (const missingFile of missingLocalFiles) {
            missingFile.savedToLocal = false;
            missingFile.syncError = '文件在本地不存在';
            syncCount++;
        }
        
        // 更新变化的文件
        for (const changedFile of changedFiles) {
            const systemFile = systemFiles.find(sf => 
                sf.name === changedFile.name && sf.savedToLocal
            );
            if (systemFile) {
                systemFile.size = formatFileSize(changedFile.size);
                systemFile.lastModified = changedFile.lastModified;
                syncCount++;
            }
        }
        
        if (syncCount > 0) {
            saveData();
            renderFiles();
            if (fileViewMode === 'tree') {
                renderFileTree();
            }
            showNotification(`深度同步完成：${syncCount} 个文件已更新`, 'success');
        }
        
    } catch (err) {
        console.error('深度同步失败:', err);
        showNotification('深度同步失败：' + err.message, 'error');
    }
}

// 手动同步按钮功能
async function manualSyncFiles() {
    if (!fsAccessEnabled) {
        showNotification('请先选择本地目录', 'error');
        return;
    }
    
    showNotification('开始手动同步...', 'info');
    
    try {
        // 首先尝试重新获取目录权限
        if (!filesDirHandle) {
            showNotification('目录连接已断开，请重新选择目录以获取文件访问权限', 'error');
            return;
        }
        
        // 执行轻量级同步
        await scanAndSyncLocalFiles();
        
        // 执行深度同步
        await deepSyncFiles();
        
        // 同步文件夹结构
        await syncFolderStructure();
        
        showNotification('手动同步完成！', 'success');
    } catch (err) {
        console.error('手动同步失败:', err);
        showNotification('手动同步失败：' + err.message, 'error');
    }
}

// 同步文件夹结构
async function syncFolderStructure() {
    if (!filesDirHandle) return;
    
    try {
        // 获取本地文件夹结构
        const localFolders = await getLocalFolderStructure(filesDirHandle);
        
        // 获取系统中的文件夹
        const systemFolders = projectData.folders || [];
        
        // 检查本地新增的文件夹
        const newLocalFolders = localFolders.filter(localFolder => 
            !systemFolders.some(systemFolder => 
                systemFolder.name === localFolder.name && 
                systemFolder.parentId === localFolder.parentId
            )
        );
        
        // 添加新文件夹到系统
        for (const localFolder of newLocalFolders) {
            const folderData = {
                id: Date.now() + Math.random(),
                name: localFolder.name,
                parentId: localFolder.parentId,
                createdDate: new Date().toISOString().split('T')[0],
                savedToLocal: true
            };
            projectData.folders.push(folderData);
        }
        
        if (newLocalFolders.length > 0) {
            saveData();
            renderFiles();
            if (fileViewMode === 'tree') {
                renderFileTree();
            }
            showNotification(`发现 ${newLocalFolders.length} 个新文件夹`, 'success');
        }
        
    } catch (err) {
        console.error('同步文件夹结构失败:', err);
    }
}

// 获取本地文件夹结构
async function getLocalFolderStructure(dirHandle, parentId = null, path = '') {
    const folders = [];
    
    try {
        for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'directory') {
                const folderPath = path ? `${path}/${name}` : name;
                folders.push({
                    name: name,
                    parentId: parentId,
                    path: folderPath
                });
                
                // 递归获取子文件夹
                const subFolders = await getLocalFolderStructure(handle, null, folderPath);
                folders.push(...subFolders);
            }
        }
    } catch (err) {
        console.error('读取文件夹结构失败:', err);
    }
    
    return folders;
}

// 检查文件同步状态
function checkFileSyncStatus() {
    const totalFiles = projectData.files.length;
    const syncedFiles = projectData.files.filter(f => f.savedToLocal).length;
    const unsyncedFiles = totalFiles - syncedFiles;
    
    return {
        total: totalFiles,
        synced: syncedFiles,
        unsynced: unsyncedFiles,
        percentage: totalFiles > 0 ? Math.round((syncedFiles / totalFiles) * 100) : 0
    };
}

// 显示同步状态
function showSyncStatus() {
    const status = checkFileSyncStatus();
    const message = `文件同步状态：\n总计：${status.total} 个文件\n已同步：${status.synced} 个\n未同步：${status.unsynced} 个\n同步率：${status.percentage}%`;
    alert(message);
}

// 修复文件同步问题
async function repairFileSync() {
    if (!fsAccessEnabled) {
        showNotification('请先选择本地目录', 'error');
        return;
    }
    
    showNotification('开始修复文件同步...', 'info');
    
    try {
        // 首先尝试重新获取目录权限
        if (!filesDirHandle) {
            showNotification('目录连接已断开，请重新选择目录以获取文件访问权限', 'error');
            return;
        }
        
        // 执行完整的同步流程
        await scanAndSyncLocalFiles();
        await deepSyncFiles();
        await syncFolderStructure();
        
        // 检查未同步的文件
        const unsyncedFiles = projectData.files.filter(f => !f.savedToLocal && f.file);
        
        if (unsyncedFiles.length > 0) {
            const confirmed = confirm(`发现 ${unsyncedFiles.length} 个文件需要重新同步，是否继续？`);
            if (confirmed) {
                let successCount = 0;
                let failCount = 0;
                
                for (const fileData of unsyncedFiles) {
                    try {
                        const saved = await saveFileToLocal(fileData.file, getFolderPathById(fileData.folderId));
                        if (saved) {
                            fileData.savedToLocal = true;
                            fileData.file = null;
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } catch (err) {
                        console.error(`修复文件失败: ${fileData.name}`, err);
                        failCount++;
                    }
                }
                
                if (successCount > 0) {
                    saveData();
                    renderFiles();
                    if (fileViewMode === 'tree') {
                        renderFileTree();
                    }
                }
                
                showNotification(`修复完成：成功 ${successCount} 个，失败 ${failCount} 个`, 
                    failCount > 0 ? 'error' : 'success');
            }
        } else {
            showNotification('所有文件已同步，无需修复', 'success');
        }
        
    } catch (err) {
        console.error('修复文件同步失败:', err);
        showNotification('修复文件同步失败：' + err.message, 'error');
    }
}

// ==================== 时间线视图切换功能 ====================

// 切换时间线视图
function switchTimelineView(view) {
    timelineViewMode = view;
    
    // 更新按钮状态
    const listBtn = document.getElementById('timeline-list-btn');
    const calendarBtn = document.getElementById('timeline-calendar-btn');
    
    if (listBtn) listBtn.classList.toggle('active', view === 'list');
    if (calendarBtn) calendarBtn.classList.toggle('active', view === 'calendar');
    
    // 显示/隐藏对应视图
    const listContainer = document.getElementById('timeline-vertical-container');
    const calendarContainer = document.getElementById('timeline-calendar-container');
    
    if (listContainer) listContainer.style.display = view === 'list' ? 'block' : 'none';
    if (calendarContainer) calendarContainer.style.display = view === 'calendar' ? 'block' : 'none';
    
    if (view === 'calendar') {
        renderCalendar();
    }
}

// 渲染日历视图
function renderCalendar() {
    const container = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('calendar-month-display');
    
    if (!container) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // 更新月份显示
    monthDisplay.textContent = `${year}年${month + 1}月`;
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // 清空容器
    container.innerHTML = '';
    
    // 添加星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        container.appendChild(dayHeader);
    });
    
    // 添加上个月的日期（填充空白）
    const prevMonth = new Date(year, month, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.innerHTML = `<div class="calendar-day-number">${prevMonth.getDate() - i}</div>`;
        container.appendChild(dayElement);
    }
    
    // 添加当月日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(year, month, day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        dayElement.className = 'calendar-day';
        dayElement.dataset.date = dateString;
        
        // 检查是否是今天
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // 检查是否有事件
        const dayEvents = projectData.timeline.filter(item => item.date === dateString);
        if (dayEvents.length > 0) {
            dayElement.classList.add('has-events');
        }
        
        dayElement.innerHTML = `
            <div class="calendar-day-number">${day}</div>
            ${dayEvents.map(event => `
                <div class="calendar-event ${event.status}">${event.title}</div>
            `).join('')}
        `;
        
        // 点击事件
        dayElement.onclick = () => showDayEvents(dateString, dayEvents);
        
        container.appendChild(dayElement);
    }
    
    // 添加下个月的日期（填充空白）
    const remainingDays = 42 - (firstDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        container.appendChild(dayElement);
    }
}

// 显示某天的事件
function showDayEvents(dateString, events) {
    if (events.length === 0) {
        // 如果没有事件，询问是否添加
        if (confirm('这一天没有安排，是否添加新事件？')) {
            addTimelineItem();
            // 设置日期
            setTimeout(() => {
                document.getElementById('timelineDate').value = dateString;
            }, 100);
        }
        return;
    }
    
    // 显示事件列表
    const eventList = events.map(event => 
        `• ${event.title} (${event.status === 'pending' ? '待完成' : event.status === 'in-progress' ? '进行中' : '已完成'})`
    ).join('\n');
    
    alert(`${dateString} 的事件：\n\n${eventList}`);
}

// 改变日历月份
function changeCalendarMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

// 回到今天
function goToToday() {
    currentCalendarDate = new Date();
    renderCalendar();
}

// ==================== 任务时间同步到时间线 ====================

// 同步任务时间到时间线
function syncTasksToTimeline() {
    // 清除之前自动同步的时间线项目
    projectData.timeline = projectData.timeline.filter(item => !item.autoSync);
    
    // 为每个任务创建时间线项目
    projectData.tasks.forEach(task => {
        if (task.startDate) {
            const startItem = {
                id: `task-start-${task.id}`,
                date: task.startDate,
                title: `开始：${task.title}`,
                description: `开始执行任务：${task.description}`,
                status: 'pending',
                autoSync: true,
                taskId: task.id,
                type: 'task-start'
            };
            projectData.timeline.push(startItem);
        }
        
        if (task.endDate) {
            const endItem = {
                id: `task-end-${task.id}`,
                date: task.endDate,
                title: `完成：${task.title}`,
                description: `完成任务：${task.description}`,
                status: task.status === 'completed' ? 'completed' : 'pending',
                autoSync: true,
                taskId: task.id,
                type: 'task-end'
            };
            projectData.timeline.push(endItem);
        }
    });
    
    saveData();
    renderTimelineVertical();
    if (timelineViewMode === 'calendar') {
        renderCalendar();
    }
}

// ==================== 技术路线图思维导图功能 ====================

// 切换技术路线图视图
function switchRoadmapView(view) {
    roadmapViewMode = view;
    
    // 更新按钮状态
    const listBtn = document.getElementById('roadmap-list-btn');
    const mindmapBtn = document.getElementById('roadmap-mindmap-btn');
    
    if (listBtn) listBtn.classList.toggle('active', view === 'list');
    if (mindmapBtn) mindmapBtn.classList.toggle('active', view === 'mindmap');
    
    // 显示/隐藏对应视图
    const listContainer = document.getElementById('roadmap-list-container');
    const mindmapContainer = document.getElementById('roadmap-mindmap-container');
    
    if (listContainer) listContainer.style.display = view === 'list' ? 'block' : 'none';
    if (mindmapContainer) mindmapContainer.style.display = view === 'mindmap' ? 'block' : 'none';
    
    // 如果切换到思维导图视图，确保容器存在
    if (view === 'mindmap' && mindmapContainer) {
        // 可以在这里添加思维导图的初始化逻辑
        console.log('切换到思维导图视图');
    }
}

// 选择Markdown文件
function selectMarkdownFile() {
    document.getElementById('markdown-file-input').click();
}

// 选择Excel文件
function selectExcelFile() {
    document.getElementById('excel-file-input').click();
}

// 处理Markdown文件上传
function handleMarkdownFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.txt')) {
        alert('请选择Markdown文件(.md)或文本文件(.txt)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        document.getElementById('mindmap-md-input').value = content;
        
        // 显示文本输入区域
        const textInput = document.getElementById('mindmap-text-input');
        textInput.style.display = 'block';
        
        showNotification(`已加载文件: ${file.name}`, 'success');
    };
    reader.onerror = function() {
        alert('读取文件失败');
    };
    reader.readAsText(file, 'UTF-8');
}

// 处理Excel文件上传
function handleExcelFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        alert('请选择Excel文件(.xlsx或.xls)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 将工作表转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 转换为Markdown格式
            const markdownContent = convertExcelToMarkdown(jsonData);
            
            // 显示在文本输入区域
            document.getElementById('mindmap-md-input').value = markdownContent;
            
            // 显示文本输入区域
            const textInput = document.getElementById('mindmap-text-input');
            textInput.style.display = 'block';
            
            showNotification(`已加载Excel文件: ${file.name}`, 'success');
            
        } catch (error) {
            console.error('Excel文件解析失败:', error);
            alert('Excel文件解析失败: ' + error.message);
        }
    };
    
    reader.onerror = function() {
        alert('读取Excel文件失败');
    };
    
    reader.readAsArrayBuffer(file);
}

// 将Excel数据转换为Markdown格式
function convertExcelToMarkdown(jsonData) {
    let markdown = '';
    let currentLevel = 0;
    
    // 过滤空行
    const filteredData = jsonData.filter(row => 
        row && row.some(cell => cell && cell.toString().trim() !== '')
    );
    
    if (filteredData.length === 0) {
        return '# Excel文件内容\n\n文件为空或无法解析内容。';
    }
    
    // 第一行作为标题
    const firstRow = filteredData[0];
    if (firstRow && firstRow[0]) {
        markdown += `# ${firstRow[0].toString().trim()}\n\n`;
    }
    
    // 处理其他行
    for (let i = 1; i < filteredData.length; i++) {
        const row = filteredData[i];
        if (!row || row.length === 0) continue;
        
        // 计算缩进级别（基于非空单元格的位置）
        let level = 0;
        let content = '';
        
        for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (cell && cell.toString().trim() !== '') {
                level = j;
                content = cell.toString().trim();
                break;
            }
        }
        
        if (content) {
            // 根据层级添加相应的Markdown格式
            if (level === 0) {
                markdown += `## ${content}\n\n`;
            } else if (level === 1) {
                markdown += `### ${content}\n\n`;
            } else if (level === 2) {
                markdown += `#### ${content}\n\n`;
            } else {
                // 使用列表格式
                const indent = '  '.repeat(level - 1);
                markdown += `${indent}- ${content}\n`;
            }
        }
    }
    
    return markdown;
}

// 切换文本输入显示
function toggleTextInput() {
    const textInput = document.getElementById('mindmap-text-input');
    const isVisible = textInput.style.display !== 'none';
    textInput.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        document.getElementById('mindmap-md-input').focus();
    }
}

// 测试Markdown解析
function testMarkdownParsing() {
    const testText = `# 证券市场基本法律法规

## 1.证券市场基本法律法规

### 1.证券市场法律法规

- 法律关系的概念、特征和种类

	- 法律关系发生的方式

		- 确认性法律关系与创设性法律

		- 双边法律关系与多边法律关系

- 法律关系

	- 法律关系由主体、客体与内容构成

		- 法律关系由主体、客体与内容构成`;

    try {
        const result = parseMarkdownToMindmap(testText);
        console.log('Markdown解析测试结果:', result);
        return result;
    } catch (error) {
        console.error('Markdown解析测试失败:', error);
        return null;
    }
}

// 从Markdown生成思维导图
function generateMindmapFromMD() {
    const mdInput = document.getElementById('mindmap-md-input');
    if (!mdInput) {
        showNotification('思维导图输入框未找到', 'error');
        return;
    }
    
    const mdText = mdInput.value;
    if (!mdText.trim()) {
        showNotification('请输入Markdown文本或选择文件', 'error');
        return;
    }
    
    try {
        const mindmapData = parseMarkdownToMindmap(mdText);
        
        // 添加时间戳和ID
        mindmapData.id = Date.now();
        mindmapData.createdAt = new Date().toISOString();
        mindmapData.sourceText = mdText;
        
        // 保存到项目数据中
        if (!projectData.mindmaps) {
            projectData.mindmaps = [];
        }
        
        // 检查是否已存在相同的思维导图
        const existingIndex = projectData.mindmaps.findIndex(m => m.sourceText === mdText);
        if (existingIndex >= 0) {
            // 更新现有的思维导图
            projectData.mindmaps[existingIndex] = mindmapData;
            showNotification('思维导图已更新！', 'success');
        } else {
            // 添加新的思维导图
            projectData.mindmaps.push(mindmapData);
            showNotification('思维导图生成成功！', 'success');
        }
        
        // 保存项目数据
        saveData();
        
        // 渲染思维导图
        renderMindmap(mindmapData);
        
        // 保存到localStorage供查看器使用
        localStorage.setItem('currentMindmap', JSON.stringify(mindmapData));
        
        // 显示全屏查看按钮
        const viewBtn = document.getElementById('view-mindmap-btn');
        if (viewBtn) {
            viewBtn.style.display = 'inline-flex';
        }
        
        // 更新思维导图历史列表
        updateMindmapHistory();
        
    } catch (err) {
        console.error('生成思维导图失败:', err);
        showNotification('生成思维导图失败: ' + err.message, 'error');
    }
}

// 打开思维导图查看器
function openMindmapViewer() {
    const mindmapData = localStorage.getItem('currentMindmap');
    if (!mindmapData) {
        alert('没有找到思维导图数据，请先生成思维导图');
        return;
    }
    
    // 在新窗口中打开查看器
    const viewerWindow = window.open('mindmap-viewer.html', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (!viewerWindow) {
        alert('无法打开新窗口，请检查浏览器设置');
    }
}

// 解析Markdown为思维导图数据
function parseMarkdownToMindmap(mdText) {
    const lines = mdText.split('\n');
    const mindmap = {
        id: 'root',
        title: '思维导图',
        nodes: [],
        connections: []
    };
    
    let nodeId = 0;
    const nodeMap = new Map();
    const stack = []; // 用于跟踪当前层级
    
    // 创建根节点
    const rootNode = {
        id: 'root',
        text: '思维导图',
        level: 0,
        parentId: null
    };
    mindmap.nodes.push(rootNode);
    nodeMap.set('root', rootNode);
    stack.push({ node: rootNode, level: 0 });
    
    lines.forEach((line, index) => {
        const originalLine = lines[index];
        if (!originalLine.trim()) return;
        
        // 检测缩进级别（支持制表符和空格）
        const indentMatch = originalLine.match(/^(\s*)/);
        const indentLevel = indentMatch ? indentMatch[1].length : 0;
        const content = originalLine.trim();
        
        let level = 0;
        let text = '';
        
        if (content.startsWith('# ')) {
            // 一级标题
            level = 1;
            text = content.substring(2);
            mindmap.title = text;
        } else if (content.startsWith('## ')) {
            // 二级标题
            level = 2;
            text = content.substring(3);
        } else if (content.startsWith('### ')) {
            // 三级标题
            level = 3;
            text = content.substring(4);
        } else if (content.startsWith('#### ')) {
            // 四级标题
            level = 4;
            text = content.substring(5);
        } else if (content.startsWith('##### ')) {
            // 五级标题
            level = 5;
            text = content.substring(6);
        } else if (content.startsWith('###### ')) {
            // 六级标题
            level = 6;
            text = content.substring(7);
        } else if (content.startsWith('- ') || content.startsWith('* ')) {
            // 列表项
            // 根据缩进级别计算层级，制表符算作4个空格
            const tabIndent = (originalLine.match(/\t/g) || []).length;
            const spaceIndent = (originalLine.match(/^(\s*)/)[1].replace(/\t/g, '').length);
            const totalIndent = tabIndent * 4 + spaceIndent;
            level = Math.max(1, Math.floor(totalIndent / 4) + 1);
            text = content.substring(2);
        } else if (content.match(/^\d+\./)) {
            // 有序列表
            const tabIndent = (originalLine.match(/\t/g) || []).length;
            const spaceIndent = (originalLine.match(/^(\s*)/)[1].replace(/\t/g, '').length);
            const totalIndent = tabIndent * 4 + spaceIndent;
            level = Math.max(1, Math.floor(totalIndent / 4) + 1);
            text = content.replace(/^\d+\.\s*/, '');
        } else if (originalLine.startsWith('\t') || originalLine.startsWith('    ')) {
            // 缩进内容（制表符或4个空格）
            const tabIndent = (originalLine.match(/\t/g) || []).length;
            const spaceIndent = (originalLine.match(/^(\s*)/)[1].replace(/\t/g, '').length);
            const totalIndent = tabIndent * 4 + spaceIndent;
            level = Math.max(1, Math.floor(totalIndent / 4) + 1);
            text = content;
        } else {
            // 普通文本
            level = 1;
            text = content;
        }
        
        if (text) {
            // 创建节点
            const nodeId = `node-${index}`;
            const node = {
                id: nodeId,
                text: text,
                level: level,
                parentId: null
            };
            
            // 找到合适的父节点
            let parentNode = null;
            for (let i = stack.length - 1; i >= 0; i--) {
                if (stack[i].level < level) {
                    parentNode = stack[i].node;
                    break;
                }
            }
            
            if (parentNode) {
                node.parentId = parentNode.id;
                mindmap.connections.push({
                    from: parentNode.id,
                    to: nodeId
                });
            }
            
            mindmap.nodes.push(node);
            nodeMap.set(nodeId, node);
            
            // 更新栈
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }
            stack.push({ node: node, level: level });
        }
    });
    
    return mindmap;
}

// 渲染思维导图
function renderMindmap(data) {
    const container = document.getElementById('mindmap-container');
    if (!container) {
        console.error('思维导图容器未找到');
        return;
    }
    
    container.innerHTML = '';
    
    if (!data || !data.nodes || data.nodes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-project-diagram" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>暂无思维导图数据</p>
                <p>请导入Markdown文件或手动输入内容</p>
            </div>
        `;
        return;
    }
    
    console.log('渲染思维导图，节点数量:', data.nodes.length);
    console.log('思维导图数据:', data);
    
    // 计算布局
    const layout = calculateMindmapLayout(data.nodes);
    console.log('计算得到的布局:', layout);
    
    // 渲染连接线
    if (data.connections) {
        data.connections.forEach(connection => {
            const connectionElement = createMindmapConnection(connection, layout);
            if (connectionElement) {
                container.appendChild(connectionElement);
            }
        });
    }
    
    // 渲染节点
    data.nodes.forEach(node => {
        const position = layout[node.id];
        if (position) {
            const nodeElement = createMindmapNode(node, position);
            container.appendChild(nodeElement);
        } else {
            console.warn('节点位置未找到:', node.id, node.text);
        }
    });
}

// 计算思维导图布局
function calculateMindmapLayout(nodes) {
    const layout = {};
    
    // 找到根节点
    const rootNode = nodes.find(node => node.id === 'root') || nodes[0];
    if (!rootNode) return layout;
    
    // 根节点位置（居中）
    layout[rootNode.id] = { x: 400, y: 300 };
    
    // 按层级组织节点
    const nodesByLevel = {};
    nodes.forEach(node => {
        if (!nodesByLevel[node.level]) {
            nodesByLevel[node.level] = [];
        }
        nodesByLevel[node.level].push(node);
    });
    
    // 为每个层级计算位置
    Object.keys(nodesByLevel).forEach(level => {
        const levelNodes = nodesByLevel[level];
        const levelNum = parseInt(level);
        
        if (levelNum === 0) return; // 跳过根节点
        
        // 计算该层级的Y位置
        const levelY = 300 + levelNum * 120; // 每层间隔120px
        
        levelNodes.forEach((node, index) => {
            let x, y;
            
            if (levelNum === 1) {
                // 第一级节点水平分布
                const totalNodes = levelNodes.length;
                const startX = 400 - (totalNodes - 1) * 100; // 居中分布
                x = startX + index * 200; // 每个节点间隔200px
                y = levelY;
            } else {
                // 其他层级节点
                const parentNode = nodes.find(n => n.id === node.parentId);
                if (parentNode && layout[parentNode.id]) {
                    const parentPos = layout[parentNode.id];
                    const siblings = nodes.filter(n => n.parentId === node.parentId);
                    const siblingIndex = siblings.findIndex(n => n.id === node.id);
                    
                    if (siblings.length === 1) {
                        // 只有一个子节点，放在父节点正下方
                        x = parentPos.x;
                        y = levelY;
                    } else {
                        // 多个子节点，在父节点下方水平分布
                        const totalSiblings = siblings.length;
                        const startX = parentPos.x - (totalSiblings - 1) * 80; // 居中分布
                        x = startX + siblingIndex * 160; // 每个节点间隔160px
                        y = levelY;
                    }
                } else {
                    // 如果没有父节点，按层级分布
                    x = 200 + index * 150;
                    y = levelY;
                }
            }
            
            layout[node.id] = { x, y };
        });
    });
    
    return layout;
}

// 创建思维导图节点
function createMindmapNode(node, position) {
    const nodeElement = document.createElement('div');
    nodeElement.className = `mindmap-node level-${node.level || 0}`;
    nodeElement.style.left = position.x + 'px';
    nodeElement.style.top = position.y + 'px';
    nodeElement.textContent = node.text;
    nodeElement.title = node.text;
    nodeElement.dataset.nodeId = node.id;
    
    return nodeElement;
}

// 创建思维导图连接线
function createMindmapConnection(connection, layout) {
    const fromPos = layout[connection.from];
    const toPos = layout[connection.to];
    
    if (!fromPos || !toPos) return null;
    
    const connectionElement = document.createElement('div');
    connectionElement.className = 'mindmap-connection';
    
    // 计算连接线位置和角度
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    connectionElement.style.left = (fromPos.x + 60) + 'px';
    connectionElement.style.top = (fromPos.y + 20) + 'px';
    connectionElement.style.width = (length - 120) + 'px';
    connectionElement.style.transform = `rotate(${angle}deg)`;
    connectionElement.style.transformOrigin = '0 50%';
    
    return connectionElement;
}

// 清空思维导图
function clearMindmap() {
    document.getElementById('mindmap-container').innerHTML = '';
    document.getElementById('mindmap-md-input').value = '';
    
    // 隐藏全屏查看按钮
    const viewBtn = document.getElementById('view-mindmap-btn');
    if (viewBtn) {
        viewBtn.style.display = 'none';
    }
}

// 切换思维导图历史记录显示
function toggleMindmapHistory() {
    const historyDiv = document.getElementById('mindmap-history');
    if (historyDiv) {
        const isVisible = historyDiv.style.display !== 'none';
        historyDiv.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            updateMindmapHistory();
        }
    }
}

// 更新思维导图历史记录
function updateMindmapHistory() {
    const historyList = document.getElementById('mindmap-history-list');
    if (!historyList) return;
    
    if (!projectData.mindmaps || projectData.mindmaps.length === 0) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>暂无思维导图历史记录</p>
            </div>
        `;
        return;
    }
    
    // 按创建时间倒序排列
    const sortedMindmaps = [...projectData.mindmaps].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    historyList.innerHTML = sortedMindmaps.map(mindmap => {
        const date = new Date(mindmap.createdAt).toLocaleString('zh-CN');
        const title = mindmap.title || '未命名思维导图';
        
        return `
            <div class="mindmap-history-item" onclick="loadMindmapFromHistory(${mindmap.id})">
                <div class="mindmap-history-info">
                    <div class="mindmap-history-title">${title}</div>
                    <div class="mindmap-history-date">${date}</div>
                </div>
                <div class="mindmap-history-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); loadMindmapFromHistory(${mindmap.id})" title="加载">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); openMindmapViewerFromHistory(${mindmap.id})" title="全屏查看">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="btn btn-delete" onclick="event.stopPropagation(); deleteMindmapFromHistory(${mindmap.id})" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 从历史记录加载思维导图
function loadMindmapFromHistory(mindmapId) {
    const mindmap = projectData.mindmaps.find(m => m.id === mindmapId);
    if (!mindmap) {
        showNotification('思维导图不存在', 'error');
        return;
    }
    
    // 加载到输入框
    const mdInput = document.getElementById('mindmap-md-input');
    if (mdInput) {
        mdInput.value = mindmap.sourceText;
    }
    
    // 显示文本输入区域
    const textInput = document.getElementById('mindmap-text-input');
    if (textInput) {
        textInput.style.display = 'block';
    }
    
    // 渲染思维导图
    renderMindmap(mindmap);
    
    // 保存到localStorage供查看器使用
    localStorage.setItem('currentMindmap', JSON.stringify(mindmap));
    
    // 显示全屏查看按钮
    const viewBtn = document.getElementById('view-mindmap-btn');
    if (viewBtn) {
        viewBtn.style.display = 'inline-flex';
    }
    
    showNotification('思维导图已加载', 'success');
}

// 从历史记录打开思维导图查看器
function openMindmapViewerFromHistory(mindmapId) {
    const mindmap = projectData.mindmaps.find(m => m.id === mindmapId);
    if (!mindmap) {
        showNotification('思维导图不存在', 'error');
        return;
    }
    
    // 保存到localStorage供查看器使用
    localStorage.setItem('currentMindmap', JSON.stringify(mindmap));
    
    // 打开查看器
    openMindmapViewer();
}

// 从历史记录删除思维导图
function deleteMindmapFromHistory(mindmapId) {
    if (!confirm('确定要删除这个思维导图吗？')) {
        return;
    }
    
    projectData.mindmaps = projectData.mindmaps.filter(m => m.id !== mindmapId);
    saveData();
    updateMindmapHistory();
    
    showNotification('思维导图已删除', 'success');
}

// ==================== 修复时间线数据持久化 ====================

// 同步任务到时间线
function syncTasksToTimeline() {
    if (!projectData.tasks || !projectData.timeline) {
        projectData.timeline = projectData.timeline || [];
        return;
    }
    
    console.log('=== 同步任务到时间线开始 ===');
    console.log('当前任务数据:', projectData.tasks.map(t => ({
        id: t.id,
        title: t.title,
        startDate: t.startDate,
        endDate: t.endDate
    })));
    
    // 先删除所有已同步的时间线项（保留手动创建的项目）
    const beforeFilter = projectData.timeline.length;
    projectData.timeline = projectData.timeline.filter(item => !item.isSynced);
    const afterFilter = projectData.timeline.length;
    console.log(`删除同步项: ${beforeFilter} -> ${afterFilter}`);
    
    // 遍历所有任务，为每个任务创建开始和结束时间点
    projectData.tasks.forEach(task => {
        // 创建开始时间点
        if (task.startDate) {
            const startItem = {
                id: `task-start-${task.id}`,
                date: task.startDate,
                title: `开始：${task.title}`,
                description: `开始执行任务：${task.description || ''}`,
                status: 'pending',
                linkedTaskId: task.id,
                tags: ['工作清单', '开始'],
                isSynced: true,
                type: 'task-start'
            };
            projectData.timeline.push(startItem);
            console.log(`创建开始时间点: ${task.title} - ${task.startDate}`);
        }
        
        // 创建结束时间点
        if (task.endDate) {
            const endItem = {
                id: `task-end-${task.id}`,
                date: task.endDate,
                title: `完成：${task.title}`,
                description: `完成任务：${task.description || ''}`,
                status: task.status === 'completed' ? 'completed' : 'pending',
                linkedTaskId: task.id,
                tags: ['工作清单', '结束'],
                isSynced: true,
                type: 'task-end'
            };
            projectData.timeline.push(endItem);
            console.log(`创建结束时间点: ${task.title} - ${task.endDate}`);
        }
        
        // 同步子任务时间到时间线
        if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach((subtask, subtaskIndex) => {
                // 处理新的completionTime字段
                if (subtask.completionTime) {
                    const completionItem = {
                        id: `subtask-completion-${task.id}-${subtaskIndex}`,
                        date: subtask.completionTime.split('T')[0],
                        time: subtask.completionTime.split('T')[1] || '23:59',
                        title: `完成：${subtask.title}`,
                        description: `完成子任务：${subtask.title}${subtask.timeDescription ? '\n' + subtask.timeDescription : ''}`,
                        status: subtask.completed ? 'completed' : 'pending',
                        linkedTaskId: task.id,
                        linkedSubtaskIndex: subtaskIndex,
                        tags: ['子任务', '完成', task.title],
                        isSynced: true,
                        type: 'subtask-completion',
                        parentTask: task.title,
                        isSubtask: true
                    };
                    projectData.timeline.push(completionItem);
                    console.log(`创建子任务完成时间点: ${subtask.title} - ${subtask.completionTime}`);
                }
                
                // 兼容旧数据：处理startTime和endTime字段
                if (subtask.startTime && !subtask.completionTime) {
                    subtask.completionTime = subtask.startTime;
                    const completionItem = {
                        id: `subtask-completion-${task.id}-${subtaskIndex}`,
                        date: subtask.completionTime.split('T')[0],
                        time: subtask.completionTime.split('T')[1] || '23:59',
                        title: `完成：${subtask.title}`,
                        description: `完成子任务：${subtask.title}${subtask.timeDescription ? '\n' + subtask.timeDescription : ''}`,
                        status: subtask.completed ? 'completed' : 'pending',
                        linkedTaskId: task.id,
                        linkedSubtaskIndex: subtaskIndex,
                        tags: ['子任务', '完成', task.title],
                        isSynced: true,
                        type: 'subtask-completion',
                        parentTask: task.title,
                        isSubtask: true
                    };
                    projectData.timeline.push(completionItem);
                    console.log(`迁移子任务开始时间到完成时间: ${subtask.title} - ${subtask.completionTime}`);
                }
                
                if (subtask.endTime && !subtask.completionTime) {
                    subtask.completionTime = subtask.endTime;
                    const completionItem = {
                        id: `subtask-completion-${task.id}-${subtaskIndex}`,
                        date: subtask.completionTime.split('T')[0],
                        time: subtask.completionTime.split('T')[1] || '23:59',
                        title: `完成：${subtask.title}`,
                        description: `完成子任务：${subtask.title}${subtask.timeDescription ? '\n' + subtask.timeDescription : ''}`,
                        status: subtask.completed ? 'completed' : 'pending',
                        linkedTaskId: task.id,
                        linkedSubtaskIndex: subtaskIndex,
                        tags: ['子任务', '完成', task.title],
                        isSynced: true,
                        type: 'subtask-completion',
                        parentTask: task.title,
                        isSubtask: true
                    };
                    projectData.timeline.push(completionItem);
                    console.log(`迁移子任务结束时间到完成时间: ${subtask.title} - ${subtask.completionTime}`);
                }
            });
        }
    });
    
    console.log('=== 同步任务到时间线完成 ===');
    console.log('最终时间线数据:', projectData.timeline.map(item => ({
        id: item.id,
        title: item.title,
        date: item.date,
        isSynced: item.isSynced
    })));
}

// 在保存任务时自动同步到时间线
function saveTaskWithTimelineSync(taskData) {
    // 保存任务
    if (currentEditingTask) {
        Object.assign(currentEditingTask, taskData);
    } else {
        taskData.id = Date.now();
        projectData.tasks.push(taskData);
    }
    
    // 同步到时间线
    syncTasksToTimeline();
    
    saveData();
    renderTasks();
    renderTimelineVertical();
    closeTaskModal();
}

// 重写保存任务函数
const originalSaveTask = saveTask;
saveTask = saveTaskWithTimelineSync;

// ==================== 文件系统状态管理 ====================

// 保存文件系统访问状态
function saveFileSystemState() {
    const fsState = {
        enabled: fsAccessEnabled,
        lastSelectedPath: getCurrentDirectoryPath(),
        lastSyncTime: new Date().toISOString(),
        directoryName: filesDirHandle ? filesDirHandle.name : null
    };
    localStorage.setItem('fileSystemState', JSON.stringify(fsState));
    console.log('文件系统状态已保存:', fsState);
}

// 加载文件系统访问状态
function loadFileSystemState() {
    const savedState = localStorage.getItem('fileSystemState');
    if (savedState) {
        try {
            const fsState = JSON.parse(savedState);
            if (fsState.enabled && fsState.directoryName) {
                // 更新按钮显示
                const btnText = document.getElementById('fs-access-text');
                if (btnText) {
                    btnText.innerHTML = `<i class="fas fa-check"></i> 已连接`;
                    btnText.parentElement.style.backgroundColor = 'var(--secondary-color)';
                }
                
                // 显示快速重连按钮
                const quickReconnectBtn = document.getElementById('quick-reconnect-btn');
                if (quickReconnectBtn) {
                    quickReconnectBtn.style.display = 'inline-flex';
                    quickReconnectBtn.title = `快速重连到: ${fsState.directoryName}`;
                }
                
                // 显示保存的路径（使用绝对路径）
                updateDirectoryDisplay(fsState.directoryName);
                
                // 设置状态变量
                fsAccessEnabled = true;
                
                // 注意：filesDirHandle 无法在页面刷新后恢复
                // 需要用户重新选择目录来重新获取权限
                console.log('文件系统状态已恢复，但需要重新选择目录获取权限:', fsState);
                
                // 显示提示信息
                setTimeout(() => {
                    showNotification('目录连接已恢复，点击"快速重连"按钮重新获取文件访问权限', 'info');
                }, 1000);
            }
        } catch (err) {
            console.error('加载文件系统状态失败:', err);
        }
    }
}

// 获取当前目录路径
function getCurrentDirectoryPath() {
    if (filesDirHandle && filesDirHandle.name) {
        return filesDirHandle.name;
    }
    return null;
}

// 更新目录显示
function updateDirectoryDisplay(path) {
    const displayElement = document.getElementById('directory-display');
    const pathSpan = document.getElementById('directory-path');
    
    if (displayElement && path) {
        // 尝试获取绝对路径
        let absolutePath = path;
        try {
            // 如果路径不是绝对路径，尝试构造绝对路径
            if (!path.includes(':')) {
                // 假设是相对路径，尝试构造完整路径
                absolutePath = `D:\\Tongji\\trae\\1\\Project_progress_20251018\\files\\${path}`;
            }
        } catch (err) {
            console.warn('无法获取绝对路径:', err);
        }
        
        // 更新路径显示
        if (pathSpan) {
            pathSpan.textContent = absolutePath;
        }
        
        displayElement.style.display = 'block';
    }
}

// 复制目录路径
async function copyDirectoryPath() {
    const pathSpan = document.getElementById('directory-path');
    const copyBtn = document.querySelector('.btn-copy');
    
    if (!pathSpan || !pathSpan.textContent) {
        showNotification('没有找到目录路径', 'error');
        return;
    }
    
    const path = pathSpan.textContent;
    
    try {
        // 使用现代 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(path);
        } else {
            // 降级到传统方法
            const textArea = document.createElement('textarea');
            textArea.value = path;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        
        // 显示成功反馈
        if (copyBtn) {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                copyBtn.classList.remove('copied');
            }, 2000);
        }
        
        showNotification('目录路径已复制到剪贴板', 'success');
        
    } catch (err) {
        console.error('复制失败:', err);
        showNotification('复制失败，请手动复制', 'error');
    }
}

// 增强的选择本地目录函数
async function selectLocalDirectoryEnhanced() {
    if (!isFileSystemAccessSupported()) {
        alert('您的浏览器不支持 File System Access API\n\n支持的浏览器：\n- Chrome 86+\n- Edge 86+\n\n当前将使用浏览器内存存储文件');
        return;
    }
    
    try {
        // 请求用户选择目录
        const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });
        
        // 保存目录句柄
        filesDirHandle = dirHandle;
        fsAccessEnabled = true;
        
        // 更新按钮文本
        const btnText = document.getElementById('fs-access-text');
        if (btnText) {
            btnText.innerHTML = '<i class="fas fa-check"></i> 已连接';
            btnText.parentElement.style.backgroundColor = 'var(--secondary-color)';
        }
        
        // 显示目录路径
        updateDirectoryDisplay(dirHandle.name);
        
        // 保存状态
        saveFileSystemState();
        
        // 显示成功消息
        showNotification('目录访问已授权！正在扫描本地文件...', 'success');
        
        // 扫描并同步本地文件
        await scanAndSyncLocalFiles();
        
        // 尝试同步现有文件（上传到本地）
        await syncExistingFiles();
        
        // 启动定期同步（可选）
        startAutoSync();
        
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('选择目录失败:', err);
            alert('选择目录失败: ' + err.message);
        }
    }
}

// 重写选择目录函数
selectLocalDirectory = selectLocalDirectoryEnhanced;

// ==================== 双击打开文件功能 ====================

// 使用系统默认程序打开文件
async function openFileWithSystemDefault(fileId) {
    const fileData = projectData.files.find(f => f.id === fileId);
    if (!fileData) {
        showNotification('文件不存在', 'error');
        return;
    }
    
    try {
        let file = null;
        
        // 1. 如果文件已同步到本地，尝试从本地打开
        if (fileData.savedToLocal && filesDirHandle) {
            file = await loadFileFromLocal(fileData.name, getFolderPathById(fileData.folderId));
            if (file) {
                await openFileInSystem(file);
                showNotification(`正在使用系统默认程序打开: ${fileData.name}`, 'success');
                return;
            }
        }
        
        // 2. 如果本地没有，使用内存中的文件
        if (fileData.file) {
            await openFileInSystem(fileData.file);
            showNotification(`正在使用系统默认程序打开: ${fileData.name}`, 'success');
            return;
        }
        
        // 3. 如果都没有，提示用户
        showNotification('文件不可用，请重新上传', 'error');
        
    } catch (err) {
        console.error('打开文件失败:', err);
        showNotification('打开文件失败: ' + err.message, 'error');
    }
}

// 在系统中打开文件
async function openFileInSystem(file) {
    // 创建临时下载链接
    const url = URL.createObjectURL(file);
    
    // 创建隐藏的下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.style.display = 'none';
    
    // 添加到页面并触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 等待一小段时间让下载开始
    await new Promise(resolve => setTimeout(resolve, 100));
}

// 增强的文件打开功能（支持更多文件类型）
async function openFileWithSystemDefaultEnhanced(fileId) {
    const fileData = projectData.files.find(f => f.id === fileId);
    if (!fileData) {
        showNotification('文件不存在', 'error');
        return;
    }
    
    try {
        let file = null;
        
        // 获取文件
        if (fileData.savedToLocal && filesDirHandle) {
            file = await loadFileFromLocal(fileData.name, getFolderPathById(fileData.folderId));
        } else if (fileData.file) {
            file = fileData.file;
        }
        
        if (!file) {
            showNotification('文件不可用，请重新上传', 'error');
            return;
        }
        
        // 根据文件类型选择打开方式
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (isTextFile(fileExtension)) {
            // 文本文件：在新窗口中显示
            openTextFileInWindow(file);
        } else if (isImageFile(fileExtension)) {
            // 图片文件：在新窗口中显示
            openImageInWindow(file);
        } else {
            // 其他文件：下载并尝试用系统默认程序打开
            await openFileInSystem(file);
        }
        
        showNotification(`正在打开: ${fileData.name}`, 'success');
        
    } catch (err) {
        console.error('打开文件失败:', err);
        showNotification('打开文件失败: ' + err.message, 'error');
    }
}

// 判断是否为文本文件
function isTextFile(extension) {
    const textExtensions = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'h', 'sql', 'log', 'csv'];
    return textExtensions.includes(extension);
}

// 判断是否为图片文件
function isImageFile(extension) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    return imageExtensions.includes(extension);
}

// 在新窗口中打开文本文件
function openTextFileInWindow(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${file.name}</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        margin: 20px; 
                        background: #f5f5f5;
                        line-height: 1.6;
                    }
                    .file-header {
                        background: #333;
                        color: white;
                        padding: 10px;
                        margin: -20px -20px 20px -20px;
                        font-size: 14px;
                    }
                    pre { 
                        background: white; 
                        padding: 20px; 
                        border-radius: 5px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        overflow-x: auto;
                        white-space: pre-wrap;
                    }
                </style>
            </head>
            <body>
                <div class="file-header">
                    <strong>${file.name}</strong> (${formatFileSize(file.size)})
                </div>
                <pre>${escapeHtml(e.target.result)}</pre>
            </body>
            </html>
        `);
        newWindow.document.close();
    };
    reader.readAsText(file);
}

// 在新窗口中打开图片文件
function openImageInWindow(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${file.name}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        background: #f0f0f0;
                        text-align: center;
                    }
                    .image-header {
                        background: #333;
                        color: white;
                        padding: 10px;
                        margin: -20px -20px 20px -20px;
                        font-size: 14px;
                    }
                    img { 
                        max-width: 100%; 
                        max-height: 80vh; 
                        border-radius: 5px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    }
                </style>
            </head>
            <body>
                <div class="image-header">
                    <strong>${file.name}</strong> (${formatFileSize(file.size)})
                </div>
                <img src="${e.target.result}" alt="${file.name}">
            </body>
            </html>
        `);
        newWindow.document.close();
    };
    reader.readAsDataURL(file);
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 重写打开文件函数，使用增强版本
openFileWithSystemDefault = openFileWithSystemDefaultEnhanced;

// ==================== 快速重连功能 ====================

// 快速重连到记忆的目录
async function quickReconnectDirectory() {
    const savedState = localStorage.getItem('fileSystemState');
    if (!savedState) {
        showNotification('没有找到记忆的目录信息', 'error');
        return;
    }
    
    try {
        const fsState = JSON.parse(savedState);
        if (!fsState.directoryName) {
            showNotification('没有找到记忆的目录信息', 'error');
            return;
        }
        
        // 显示详细的提示信息
        const message = `请重新选择目录以恢复连接\n\n记忆的目录: ${fsState.directoryName}\n\n注意：由于浏览器安全限制，无法直接打开指定路径，请手动导航到该目录并选择。`;
        
        if (confirm(message)) {
            // 显示提示信息
            showNotification(`请导航到: ${fsState.directoryName}`, 'info');
            
            // 调用选择目录函数
            await selectLocalDirectory(fsState.directoryName);
        }
        
    } catch (err) {
        console.error('快速重连失败:', err);
        showNotification('快速重连失败: ' + err.message, 'error');
    }
}

// ==================== 视图状态初始化 ====================

// 渲染时间线垂直视图
function renderTimelineVertical() {
    const container = document.getElementById('timeline-vertical-container');
    if (!container) {
        console.error('时间线容器未找到: timeline-vertical-container');
        return;
    }
    
    // 确保timeline数组存在
    if (!projectData.timeline) {
        projectData.timeline = [];
    }
    
    console.log('渲染时间线，数据:', projectData.timeline);
    
    if (projectData.timeline.length === 0) {
        container.innerHTML = `
            <div class="timeline-empty">
                <i class="fas fa-clock"></i>
                <p>暂无时间线项目</p>
                <p>点击"添加项目"开始构建您的时间线</p>
            </div>
        `;
        return;
    }
    
    // 应用过滤条件
    const filteredTimeline = filterTimelineItems(projectData.timeline);
    
    if (filteredTimeline.length === 0) {
        container.innerHTML = `
            <div class="timeline-empty">
                <i class="fas fa-filter"></i>
                <p>没有符合条件的时间线项目</p>
                <button class="btn btn-secondary" onclick="resetTimelineFilters()">重置过滤条件</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    // 根据显示模式渲染
    if (timelineFilters.displayMode === 'grouped') {
        renderTimelineGrouped(filteredTimeline, container);
    } else {
        renderTimelineList(filteredTimeline, container);
    }
}

// 创建时间线项目元素
function createTimelineItemElement(item) {
    const div = document.createElement('div');
    div.className = `timeline-vertical-item ${item.status}${item.isSynced ? ' synced' : ''}`;
    div.dataset.itemId = item.id;
    
    // 格式化日期
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // 创建标签HTML
    let tagsHTML = '';
    if (item.tags && item.tags.length > 0) {
        console.log('创建标签HTML，标签:', item.tags);
        tagsHTML = `
            <div class="timeline-tags-container">
                ${item.tags.map(tag => `
                    <span class="timeline-tag ${item.isSynced ? 'synced-tag' : ''}">${tag}</span>
                `).join('')}
            </div>
        `;
    }
    
    // 创建类型标记
    let typeMarker = '';
    if (item.type === 'task-start') {
        typeMarker = '<i class="fas fa-play-circle timeline-type-marker start-marker"></i>';
    } else if (item.type === 'task-end') {
        typeMarker = '<i class="fas fa-check-circle timeline-type-marker end-marker"></i>';
    } else if (item.type === 'subtask-start') {
        typeMarker = '<i class="fas fa-play timeline-type-marker subtask-start-marker"></i>';
    } else if (item.type === 'subtask-end') {
        typeMarker = '<i class="fas fa-check timeline-type-marker subtask-end-marker"></i>';
    } else if (item.type === 'subtask-completion') {
        typeMarker = '<i class="fas fa-check timeline-type-marker subtask-completion-marker"></i>';
    }
    
    // 创建操作按钮
    let actionButtons = '';
    if (!item.isSynced) {
        // 非同步项目可以编辑
        actionButtons = `
            <div class="timeline-actions">
                <button class="btn btn-edit btn-sm" onclick="editTimelineItem(${item.id})" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="editTimelineTags(${item.id})" title="编辑标签">
                    <i class="fas fa-tags"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteTimelineItem(${item.id})" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    } else {
        // 同步项目显示来源信息
        actionButtons = `
            <div class="timeline-actions">
                <span class="timeline-sync-indicator" title="此项目来自工作清单同步，不可编辑">
                    <i class="fas fa-sync"></i> 同步项
                </span>
            </div>
        `;
    }
    
    // 子任务特殊样式
    const isSubtask = item.isSubtask || item.type?.includes('subtask');
    const subtaskClass = isSubtask ? 'timeline-subtask' : '';
    
    // 更新div的className以包含子任务类
    if (isSubtask) {
        div.className += ` ${subtaskClass}`;
    }
    
    const htmlContent = `
        <div class="timeline-vertical-content">
            <div class="timeline-vertical-date">${formattedDate}</div>
            <div class="timeline-vertical-title">
                ${typeMarker}
                ${item.title}
                ${isSubtask ? `<span class="subtask-parent-label">(${item.parentTask})</span>` : ''}
            </div>
            <div class="timeline-vertical-desc">${item.description || ''}</div>
            ${tagsHTML}
            <div class="timeline-vertical-status ${item.status}">${getStatusText(item.status)}</div>
            ${actionButtons}
        </div>
    `;
    
    console.log('时间线项目HTML:', htmlContent);
    div.innerHTML = htmlContent;
    
    return div;
}

// 初始化视图状态
function initializeViewStates() {
    // 初始化时间线视图
    switchTimelineView(timelineViewMode);
    
    // 初始化技术路线图视图
    switchRoadmapView(roadmapViewMode);
    
    // 初始化文件视图
    if (fileViewMode === 'tree') {
        toggleFileView();
    }
    
    console.log('视图状态初始化完成');
}

// 测试时间线标签功能
function testTimelineTags() {
    console.log('测试时间线标签功能');
    
    // 检查是否有任务数据
    if (!projectData.tasks || projectData.tasks.length === 0) {
        console.log('没有任务数据，创建测试任务');
        const testTask = {
            id: Date.now(),
            title: "测试任务",
            description: "这是一个测试任务",
            status: "in-progress",
            priority: "high",
            startDate: "2024-01-01",
            endDate: "2024-01-15",
            progress: 50,
            subtasks: [],
            attachments: []
        };
        projectData.tasks.push(testTask);
        saveData();
    }
    
    // 同步任务到时间线
    syncTasksToTimeline();
    
    // 渲染时间线
    renderTimelineVertical();
    
    console.log('时间线数据:', projectData.timeline);
    showNotification('时间线标签测试完成，请查看时间线区域', 'success');
}

// 编辑时间线项目
function editTimelineItem(itemId) {
    const item = projectData.timeline.find(i => i.id === itemId);
    if (!item) {
        showNotification('时间线项目不存在', 'error');
        return;
    }
    
    // 检查是否为同步项目
    if (item.isSynced) {
        showNotification('此项目来自工作清单同步，不可编辑。请在工作清单中修改任务。', 'warning');
        return;
    }
    
    currentEditingTimelineItem = item;
    
    // 使用专门的时间线模态框
    const modal = document.getElementById('timelineModal');
    const modalTitle = document.getElementById('timelineModalTitle');
    
    modalTitle.textContent = '编辑时间线项目';
    
    // 填充表单数据
    document.getElementById('timelineTitle').value = item.title;
    document.getElementById('timelineDescription').value = item.description || '';
    document.getElementById('timelineDate').value = item.date;
    document.getElementById('timelineStatus').value = item.status;
    
    modal.style.display = 'block';
}

// 关闭时间线模态框
function closeTimelineModal() {
    const modal = document.getElementById('timelineModal');
    modal.style.display = 'none';
    currentEditingTimelineItem = null;
}

// 删除时间线项目
function deleteTimelineItem(itemId) {
    const item = projectData.timeline.find(i => i.id === itemId);
    if (!item) {
        showNotification('时间线项目不存在', 'error');
        return;
    }
    
    // 检查是否为同步项目
    if (item.isSynced) {
        showNotification('此项目来自工作清单同步，不可删除。请在工作清单中删除任务。', 'warning');
        return;
    }
    
    if (confirm('确定要删除这个时间线项目吗？')) {
        projectData.timeline = projectData.timeline.filter(i => i.id !== itemId);
        saveData();
        renderTimelineVertical();
        showNotification('时间线项目已删除', 'success');
    }
}

// 保存时间线项目
function saveTimelineItem() {
    // 检查是否使用专门的时间线模态框
    const timelineModal = document.getElementById('timelineModal');
    if (timelineModal && timelineModal.style.display === 'block') {
        // 使用专门的时间线模态框
        const title = document.getElementById('timelineTitle').value;
        const description = document.getElementById('timelineDescription').value;
        const date = document.getElementById('timelineDate').value;
        const status = document.getElementById('timelineStatus').value;
        
        if (!title.trim()) {
            showNotification('请输入项目标题', 'error');
            return;
        }
        
        if (!date) {
            showNotification('请选择日期', 'error');
            return;
        }
        
        if (currentEditingTimelineItem) {
            // 编辑现有项目
            currentEditingTimelineItem.title = title;
            currentEditingTimelineItem.description = description;
            currentEditingTimelineItem.date = date;
            currentEditingTimelineItem.status = status;
        } else {
            // 创建新项目
            const newItem = {
                id: Date.now(),
                title: title,
                description: description,
                date: date,
                status: status,
                tags: [],
                isSynced: false
            };
            projectData.timeline.push(newItem);
        }
        
        saveData();
        renderTimelineVertical();
        closeTimelineModal();
        showNotification('时间线项目已保存', 'success');
        return;
    }
    
    // 使用通用模态框的情况
    if (!currentEditingTimelineItem) return;
    
    const title = document.getElementById('timeline-title').value;
    const description = document.getElementById('timeline-description').value;
    const date = document.getElementById('timeline-date').value;
    const status = document.getElementById('timeline-status').value;
    const tagsInput = document.getElementById('timeline-tags').value;
    
    if (!title.trim()) {
        showNotification('请输入项目标题', 'error');
        return;
    }
    
    if (!date) {
        showNotification('请选择日期', 'error');
        return;
    }
    
    // 更新项目数据
    currentEditingTimelineItem.title = title;
    currentEditingTimelineItem.description = description;
    currentEditingTimelineItem.date = date;
    currentEditingTimelineItem.status = status;
    
    // 处理标签
    if (tagsInput.trim()) {
        currentEditingTimelineItem.tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else {
        currentEditingTimelineItem.tags = [];
    }
    
    saveData();
    renderTimelineVertical();
    closeModal();
    showNotification('时间线项目已保存', 'success');
}

// 添加时间线项目
function addTimelineItem() {
    // 清除当前编辑项目
    currentEditingTimelineItem = null;
    
    // 使用专门的时间线模态框
    const modal = document.getElementById('timelineModal');
    const modalTitle = document.getElementById('timelineModalTitle');
    
    modalTitle.textContent = '添加时间线项目';
    
    // 清空表单
    document.getElementById('timelineTitle').value = '';
    document.getElementById('timelineDescription').value = '';
    document.getElementById('timelineDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('timelineStatus').value = 'pending';
    
    modal.style.display = 'block';
}

// 编辑子任务详情（说明和问题）
function editSubtaskDetails(subtaskIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask) return;
    
    // 创建子任务详情编辑模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'subtask-details-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>编辑子任务详情</h3>
                <span class="close" onclick="closeSubtaskDetailsModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>子任务标题</label>
                    <input type="text" class="form-control" id="subtask-title" value="${subtask.title}">
                </div>
                <div class="form-group">
                    <label>说明</label>
                    <textarea class="form-control" id="subtask-notes" rows="3" placeholder="输入子任务的详细说明...">${subtask.notes || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>遇到的问题</label>
                    <div id="subtask-issues-container">
                        ${(subtask.issues || []).map((issue, index) => `
                            <div class="issue-item" style="display: flex; align-items: center; margin-bottom: 8px;">
                                <input type="text" class="form-control" value="${issue}" onchange="updateSubtaskIssue(${subtaskIndex}, ${index}, this.value)" style="flex: 1; margin-right: 10px;">
                                <button class="btn btn-danger btn-sm" onclick="removeSubtaskIssue(${subtaskIndex}, ${index})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="addSubtaskIssue(${subtaskIndex})" style="margin-top: 8px;">
                        <i class="fas fa-plus"></i> 添加问题
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeSubtaskDetailsModal()">取消</button>
                <button class="btn btn-primary" onclick="saveSubtaskDetails(${subtaskIndex})">保存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// 关闭子任务详情模态框
function closeSubtaskDetailsModal() {
    const modal = document.getElementById('subtask-details-modal');
    if (modal) {
        modal.remove();
    }
}

// 保存子任务详情
function saveSubtaskDetails(subtaskIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask) return;
    
    // 更新子任务数据
    subtask.title = document.getElementById('subtask-title').value;
    subtask.notes = document.getElementById('subtask-notes').value;
    
    // 自动保存任务数据
    console.log(`子任务详情已更新: ${subtask.title}`);
    saveData();
    
    // 重新渲染任务编辑界面
    editTask(currentEditingTask.id);
    
    // 关闭模态框
    closeSubtaskDetailsModal();
    
    showNotification('子任务详情已保存', 'success');
}

// 添加子任务问题
function addSubtaskIssue(subtaskIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask) return;
    
    if (!subtask.issues) {
        subtask.issues = [];
    }
    
    subtask.issues.push('');
    
    // 重新渲染问题列表
    renderSubtaskIssues(subtaskIndex);
}

// 更新子任务问题
function updateSubtaskIssue(subtaskIndex, issueIndex, value) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask || !subtask.issues) return;
    
    subtask.issues[issueIndex] = value;
    
    // 自动保存任务数据
    console.log(`子任务问题已更新: ${value}`);
    saveData();
}

// 删除子任务问题
function removeSubtaskIssue(subtaskIndex, issueIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask || !subtask.issues) return;
    
    subtask.issues.splice(issueIndex, 1);
    
    // 重新渲染问题列表
    renderSubtaskIssues(subtaskIndex);
}

// 渲染子任务问题列表
function renderSubtaskIssues(subtaskIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask) return;
    
    const container = document.getElementById('subtask-issues-container');
    if (!container) return;
    
    container.innerHTML = (subtask.issues || []).map((issue, index) => `
        <div class="issue-item" style="display: flex; align-items: center; margin-bottom: 8px;">
            <input type="text" class="form-control" value="${issue}" onchange="updateSubtaskIssue(${subtaskIndex}, ${index}, this.value)" style="flex: 1; margin-right: 10px;">
            <button class="btn btn-danger btn-sm" onclick="removeSubtaskIssue(${subtaskIndex}, ${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// 测试任务日期保存功能
function testTaskDateSave() {
    console.log('=== 测试任务日期保存功能 ===');
    
    // 检查当前编辑的任务
    if (!currentEditingTask) {
        console.log('没有正在编辑的任务');
        return;
    }
    
    console.log('当前编辑的任务:', currentEditingTask);
    
    // 检查日期输入框的值
    const startDateInput = document.getElementById('task-start-date');
    const endDateInput = document.getElementById('task-end-date');
    
    if (startDateInput) {
        console.log('开始日期输入框值:', startDateInput.value);
    } else {
        console.log('开始日期输入框未找到');
    }
    
    if (endDateInput) {
        console.log('结束日期输入框值:', endDateInput.value);
    } else {
        console.log('结束日期输入框未找到');
    }
    
    // 检查任务数据中的日期
    console.log('任务数据中的日期:', {
        startDate: currentEditingTask.startDate,
        endDate: currentEditingTask.endDate
    });
    
    // 检查时间线数据
    const timelineItems = projectData.timeline.filter(item => item.linkedTaskId === currentEditingTask.id);
    console.log('相关时间线项目:', timelineItems);
    
    showNotification('测试完成，请查看控制台输出', 'success');
}

// ==================== 时间线过滤和管理功能 ====================

// 过滤时间线项目
function filterTimelineItems(timeline) {
    let filtered = [...timeline];
    
    // 按日期过滤
    if (timelineFilters.dateRange !== 'all') {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.date);
            
            switch (timelineFilters.dateRange) {
                case 'today':
                    return itemDate >= startOfToday && itemDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
                case 'week':
                    const startOfWeek = new Date(startOfToday);
                    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
                    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return itemDate >= startOfWeek && itemDate < endOfWeek;
                case 'month':
                    return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
                case 'quarter':
                    const quarter = Math.floor(today.getMonth() / 3);
                    return Math.floor(itemDate.getMonth() / 3) === quarter && itemDate.getFullYear() === today.getFullYear();
                case 'year':
                    return itemDate.getFullYear() === today.getFullYear();
                case 'future':
                    return itemDate >= startOfToday;
                case 'past':
                    return itemDate < startOfToday;
                case 'custom':
                    if (timelineFilters.customStartDate && timelineFilters.customEndDate) {
                        const startDate = new Date(timelineFilters.customStartDate);
                        const endDate = new Date(timelineFilters.customEndDate);
                        return itemDate >= startDate && itemDate <= endDate;
                    }
                    return true;
                default:
                    return true;
            }
        });
    }
    
    // 按日期排序
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// 渲染时间线列表
function renderTimelineList(timeline, container) {
    timeline.forEach(item => {
        const timelineItem = createTimelineItemElement(item);
        
        // 添加历史项目样式（当前日期不算历史项目）
        const itemDate = new Date(item.date);
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (itemDate < startOfToday) {
            timelineItem.classList.add('historical');
            if (timelineFilters.isCollapsed) {
                timelineItem.classList.add('collapsed');
            }
        }
        
        // 添加紧凑模式样式
        if (timelineFilters.displayMode === 'compact') {
            timelineItem.classList.add('compact');
        }
        
        container.appendChild(timelineItem);
    });
}

// 渲染时间线分组
function renderTimelineGrouped(timeline, container) {
    const groups = groupTimelineByDate(timeline);
    
    Object.keys(groups).forEach(groupKey => {
        const group = groups[groupKey];
        const groupElement = createTimelineGroupElement(groupKey, group);
        container.appendChild(groupElement);
    });
}

// 按日期分组时间线
function groupTimelineByDate(timeline) {
    const groups = {};
    
    timeline.forEach(item => {
        const date = new Date(item.date);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let groupKey;
        if (diffDays < 0) {
            if (diffDays >= -7) {
                groupKey = '最近一周';
            } else if (diffDays >= -30) {
                groupKey = '最近一月';
            } else {
                groupKey = '更早历史';
            }
        } else if (diffDays === 0) {
            groupKey = '今天';
        } else if (diffDays <= 7) {
            groupKey = '未来一周';
        } else if (diffDays <= 30) {
            groupKey = '未来一月';
        } else {
            groupKey = '更远未来';
        }
        
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
    });
    
    return groups;
}

// 创建时间线分组元素
function createTimelineGroupElement(groupKey, items) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'timeline-group';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'timeline-group-header';
    headerDiv.onclick = () => toggleTimelineGroup(groupDiv);
    
    headerDiv.innerHTML = `
        <span class="timeline-group-title">${groupKey}</span>
        <span class="timeline-group-count">${items.length} 项</span>
        <i class="fas fa-chevron-down timeline-group-icon"></i>
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'timeline-group-content';
    
    items.forEach(item => {
        const timelineItem = createTimelineItemElement(item);
        contentDiv.appendChild(timelineItem);
    });
    
    groupDiv.appendChild(headerDiv);
    groupDiv.appendChild(contentDiv);
    
    return groupDiv;
}

// 切换时间线分组
function toggleTimelineGroup(groupElement) {
    const content = groupElement.querySelector('.timeline-group-content');
    const icon = groupElement.querySelector('.timeline-group-icon');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
    } else {
        content.classList.add('collapsed');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');
    }
}

// 按日期范围过滤时间线
function filterTimelineByDateRange() {
    const dateRange = document.getElementById('timeline-date-range').value;
    timelineFilters.dateRange = dateRange;
    
    if (dateRange === 'custom') {
        document.getElementById('custom-date-range').style.display = 'flex';
    } else {
        document.getElementById('custom-date-range').style.display = 'none';
    }
    
    renderTimelineVertical();
}

// 按自定义日期过滤时间线
function filterTimelineByCustomDate() {
    const startDate = document.getElementById('timeline-start-date').value;
    const endDate = document.getElementById('timeline-end-date').value;
    
    timelineFilters.customStartDate = startDate;
    timelineFilters.customEndDate = endDate;
    
    renderTimelineVertical();
}

// 改变时间线显示模式
function changeTimelineDisplayMode() {
    const displayMode = document.getElementById('timeline-display-mode').value;
    timelineFilters.displayMode = displayMode;
    
    renderTimelineVertical();
}

// 切换时间线折叠状态
function toggleTimelineCollapse() {
    timelineFilters.isCollapsed = !timelineFilters.isCollapsed;
    
    const button = document.getElementById('timeline-collapse-btn');
    const icon = button.querySelector('i');
    
    if (timelineFilters.isCollapsed) {
        button.innerHTML = '<i class="fas fa-chevron-down"></i> 展开历史';
    } else {
        button.innerHTML = '<i class="fas fa-chevron-up"></i> 折叠历史';
    }
    
    renderTimelineVertical();
}

// 重置时间线过滤条件
function resetTimelineFilters() {
    timelineFilters = {
        dateRange: 'all',
        displayMode: 'all',
        isCollapsed: false,
        customStartDate: null,
        customEndDate: null
    };
    
    // 重置UI控件
    document.getElementById('timeline-date-range').value = 'all';
    document.getElementById('timeline-display-mode').value = 'all';
    document.getElementById('custom-date-range').style.display = 'none';
    document.getElementById('timeline-start-date').value = '';
    document.getElementById('timeline-end-date').value = '';
    
    const button = document.getElementById('timeline-collapse-btn');
    button.innerHTML = '<i class="fas fa-chevron-up"></i> 折叠历史';
    
    renderTimelineVertical();
    showNotification('过滤条件已重置', 'success');
}

// ==================== 时间线标签管理功能 ====================

// 编辑时间线标签
function editTimelineTags(itemId) {
    const item = projectData.timeline.find(i => i.id === itemId);
    if (!item) {
        showNotification('时间线项目不存在', 'error');
        return;
    }
    
    // 检查是否为同步项目
    if (item.isSynced) {
        showNotification('此项目来自工作清单同步，不可编辑标签。请在工作清单中修改任务。', 'warning');
        return;
    }
    
    // 创建标签编辑模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'timeline-tags-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>编辑时间线标签</h3>
                <span class="close" onclick="closeTimelineTagsModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>项目标题</label>
                    <input type="text" class="form-control" id="timeline-tags-title" value="${item.title}" readonly>
                </div>
                <div class="form-group">
                    <label>当前标签</label>
                    <div id="current-tags-display">
                        ${(item.tags || []).map(tag => `
                            <span class="timeline-tag-display">
                                ${tag}
                                <button class="btn btn-danger btn-xs" onclick="removeTimelineTag('${itemId}', '${tag}')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </span>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label>添加新标签</label>
                    <div class="tag-input-group">
                        <input type="text" class="form-control" id="new-tag-input" placeholder="输入新标签">
                        <button class="btn btn-primary" onclick="addTimelineTag(${itemId})">
                            <i class="fas fa-plus"></i> 添加
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label>常用标签</label>
                    <div class="common-tags">
                        <button class="btn btn-outline-secondary btn-sm" onclick="addCommonTag('${itemId}', '重要')">重要</button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="addCommonTag('${itemId}', '紧急')">紧急</button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="addCommonTag('${itemId}', '里程碑')">里程碑</button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="addCommonTag('${itemId}', '会议')">会议</button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="addCommonTag('${itemId}', '截止')">截止</button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="addCommonTag('${itemId}', '开始')">开始</button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="addCommonTag('${itemId}', '完成')">完成</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeTimelineTagsModal()">关闭</button>
                <button class="btn btn-primary" onclick="saveTimelineTags(${itemId})">保存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // 添加回车键支持
    document.getElementById('new-tag-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTimelineTag(itemId);
        }
    });
}

// 关闭时间线标签模态框
function closeTimelineTagsModal() {
    const modal = document.getElementById('timeline-tags-modal');
    if (modal) {
        modal.remove();
    }
}

// 添加时间线标签
function addTimelineTag(itemId) {
    const input = document.getElementById('new-tag-input');
    const tag = input.value.trim();
    
    if (!tag) {
        showNotification('请输入标签内容', 'warning');
        return;
    }
    
    const item = projectData.timeline.find(i => i.id === itemId);
    if (!item) return;
    
    if (!item.tags) {
        item.tags = [];
    }
    
    // 检查标签是否已存在
    if (item.tags.includes(tag)) {
        showNotification('标签已存在', 'warning');
        return;
    }
    
    item.tags.push(tag);
    input.value = '';
    
    // 重新渲染标签显示
    renderTimelineTagsDisplay(itemId);
    
    showNotification('标签已添加', 'success');
}

// 添加常用标签
function addCommonTag(itemId, tag) {
    const item = projectData.timeline.find(i => i.id === itemId);
    if (!item) return;
    
    if (!item.tags) {
        item.tags = [];
    }
    
    // 检查标签是否已存在
    if (item.tags.includes(tag)) {
        showNotification('标签已存在', 'warning');
        return;
    }
    
    item.tags.push(tag);
    
    // 重新渲染标签显示
    renderTimelineTagsDisplay(itemId);
    
    showNotification('标签已添加', 'success');
}

// 删除时间线标签
function removeTimelineTag(itemId, tag) {
    const item = projectData.timeline.find(i => i.id === itemId);
    if (!item) return;
    
    if (!item.tags) return;
    
    item.tags = item.tags.filter(t => t !== tag);
    
    // 重新渲染标签显示
    renderTimelineTagsDisplay(itemId);
    
    showNotification('标签已删除', 'success');
}

// 渲染时间线标签显示
function renderTimelineTagsDisplay(itemId) {
    const item = projectData.timeline.find(i => i.id === itemId);
    if (!item) return;
    
    const container = document.getElementById('current-tags-display');
    if (!container) return;
    
    container.innerHTML = (item.tags || []).map(tag => `
        <span class="timeline-tag-display">
            ${tag}
            <button class="btn btn-danger btn-xs" onclick="removeTimelineTag('${itemId}', '${tag}')">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

// 保存时间线标签
function saveTimelineTags(itemId) {
    const item = projectData.timeline.find(i => i.id === itemId);
    if (!item) return;
    
    // 数据已经实时更新，这里只需要保存和关闭
    saveData();
    renderTimelineVertical();
    closeTimelineTagsModal();
    
    showNotification('标签已保存', 'success');
}

// ==================== 任务日期保存问题调试 ====================

// 调试任务日期保存问题
function debugTaskDateSave() {
    console.log('=== 调试任务日期保存问题 ===');
    
    // 检查当前编辑的任务
    if (!currentEditingTask) {
        console.log('没有正在编辑的任务');
        return;
    }
    
    console.log('当前编辑的任务:', currentEditingTask);
    
    // 检查日期输入框的值
    const startDateInput = document.getElementById('task-start-date');
    const endDateInput = document.getElementById('task-end-date');
    
    if (startDateInput) {
        console.log('开始日期输入框值:', startDateInput.value);
        console.log('开始日期输入框属性:', {
            value: startDateInput.value,
            defaultValue: startDateInput.defaultValue,
            min: startDateInput.min,
            max: startDateInput.max
        });
    } else {
        console.log('开始日期输入框未找到');
    }
    
    if (endDateInput) {
        console.log('结束日期输入框值:', endDateInput.value);
    } else {
        console.log('结束日期输入框未找到');
    }
    
    // 检查任务数据中的日期
    console.log('任务数据中的日期:', {
        startDate: currentEditingTask.startDate,
        endDate: currentEditingTask.endDate
    });
    
    // 检查时间线数据
    const timelineItems = projectData.timeline.filter(item => item.linkedTaskId === currentEditingTask.id);
    console.log('相关时间线项目:', timelineItems);
    
    showNotification('调试完成，请查看控制台输出', 'success');
}

// 强制设置任务开始日期
function forceSetTaskStartDate(dateString) {
    if (!currentEditingTask) {
        showNotification('没有正在编辑的任务', 'error');
        return;
    }
    
    const startDateInput = document.getElementById('task-start-date');
    if (startDateInput) {
        startDateInput.value = dateString;
        console.log('强制设置开始日期为:', dateString);
        showNotification('开始日期已设置为: ' + dateString, 'success');
    } else {
        showNotification('开始日期输入框未找到', 'error');
    }
}

// 测试任务日期保存
function testTaskDateSave() {
    console.log('=== 测试任务日期保存 ===');
    
    if (!currentEditingTask) {
        console.log('没有正在编辑的任务');
        return;
    }
    
    // 获取当前输入框的值
    const startDateInput = document.getElementById('task-start-date');
    const endDateInput = document.getElementById('task-end-date');
    
    if (startDateInput && endDateInput) {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        console.log('输入框中的日期:', { startDate, endDate });
        
        // 手动更新任务数据
        currentEditingTask.startDate = startDate;
        currentEditingTask.endDate = endDate;
        
        console.log('更新后的任务数据:', {
            startDate: currentEditingTask.startDate,
            endDate: currentEditingTask.endDate
        });
        
        // 同步到时间线
        syncTasksToTimeline();
        
        // 保存数据
        saveData();
        
        // 重新渲染
        renderTasks();
        renderTimelineVertical();
        
        showNotification('任务日期已手动更新', 'success');
    } else {
        showNotification('日期输入框未找到', 'error');
    }
}

// 验证任务日期
function validateTaskDates() {
    const startDateInput = document.getElementById('task-start-date');
    const endDateInput = document.getElementById('task-end-date');
    
    if (!startDateInput || !endDateInput) return;
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
        showNotification('开始日期不能晚于结束日期', 'warning');
        startDateInput.style.borderColor = '#dc3545';
        endDateInput.style.borderColor = '#dc3545';
    } else {
        startDateInput.style.borderColor = '';
        endDateInput.style.borderColor = '';
    }
}

// 强制更新任务数据
function forceUpdateTaskData() {
    if (!currentEditingTask) {
        showNotification('没有正在编辑的任务', 'error');
        return;
    }
    
    const startDateInput = document.getElementById('task-start-date');
    const endDateInput = document.getElementById('task-end-date');
    
    if (!startDateInput || !endDateInput) {
        showNotification('日期输入框未找到', 'error');
        return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    console.log('强制更新任务数据:', {
        '输入框开始日期': startDate,
        '输入框结束日期': endDate,
        '当前任务开始日期': currentEditingTask.startDate,
        '当前任务结束日期': currentEditingTask.endDate
    });
    
    // 强制更新任务数据
    currentEditingTask.startDate = startDate;
    currentEditingTask.endDate = endDate;
    
    console.log('更新后的任务数据:', {
        '任务开始日期': currentEditingTask.startDate,
        '任务结束日期': currentEditingTask.endDate
    });
    
    // 同步到时间线
    syncTasksToTimeline();
    
    // 保存数据
    saveData();
    
    // 重新渲染
    renderTasks();
    renderTimelineVertical();
    
    showNotification('任务数据已强制更新', 'success');
}

// 编辑子任务时间
function editSubtaskTime(subtaskIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask) return;
    
    // 创建子任务时间编辑模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'subtask-time-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>设置子任务时间</h3>
                <span class="close" onclick="closeSubtaskTimeModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>子任务标题</label>
                    <input type="text" class="form-control" id="subtask-time-title" value="${subtask.title}" readonly>
                </div>
                <div class="form-group">
                    <label>完成时间 <span class="required">*</span></label>
                    <input type="datetime-local" class="form-control" id="subtask-completion-time" value="${subtask.completionTime || ''}" required>
                    <div class="form-help">设置子任务的完成时间点</div>
                </div>
                <div class="form-group">
                    <label>时间说明</label>
                    <textarea class="form-control" id="subtask-time-description" rows="2" placeholder="可选：添加时间说明...">${subtask.timeDescription || ''}</textarea>
                </div>
                <div style="background: rgba(52, 144, 220, 0.1); padding: 10px; border-radius: 4px; margin-top: 10px;">
                    <small style="color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i>
                        设置时间后，子任务将自动同步到时间线，并标记为"${currentEditingTask.title}"的子任务
                    </small>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeSubtaskTimeModal()">取消</button>
                <button class="btn btn-danger" onclick="removeSubtaskTimeFromModal(${subtaskIndex})">清除时间</button>
                <button class="btn btn-primary" onclick="saveSubtaskTime(${subtaskIndex})">保存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// 关闭子任务时间模态框
function closeSubtaskTimeModal() {
    const modal = document.getElementById('subtask-time-modal');
    if (modal) {
        modal.remove();
    }
}

// 保存子任务时间
function saveSubtaskTime(subtaskIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask) return;
    
    const completionTime = document.getElementById('subtask-completion-time').value;
    const timeDescription = document.getElementById('subtask-time-description').value;
    
    console.log('保存子任务时间:', {
        '子任务标题': subtask.title,
        '完成时间': completionTime,
        '时间说明': timeDescription,
        '任务ID': currentEditingTask.id
    });
    
    // 更新子任务时间
    subtask.completionTime = completionTime;
    subtask.timeDescription = timeDescription;
    
    // 自动保存任务数据
    saveData();
    
    // 同步到时间线
    syncSubtaskToTimeline(currentEditingTask.id, subtaskIndex);
    
    // 重新渲染任务编辑界面
    editTask(currentEditingTask.id);
    
    // 关闭模态框
    closeSubtaskTimeModal();
    
    showNotification(`子任务"${subtask.title}"时间已设置`, 'success');
}

// 移除子任务时间
function removeSubtaskTime(subtaskIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask) return;
    
    if (confirm(`确定要移除子任务"${subtask.title}"的时间设置吗？`)) {
        // 从时间线中移除对应的子任务项目
        removeSubtaskFromTimeline(currentEditingTask.id, subtaskIndex);
        
        // 清除子任务时间
        subtask.completionTime = null;
        subtask.timeDescription = null;
        
        // 自动保存任务数据
        saveData();
        
        // 重新渲染任务编辑界面
        editTask(currentEditingTask.id);
        
        showNotification(`子任务"${subtask.title}"时间已移除`, 'success');
    }
}

// 从模态框中移除子任务时间
function removeSubtaskTimeFromModal(subtaskIndex) {
    if (!currentEditingTask) return;
    
    const subtask = currentEditingTask.subtasks[subtaskIndex];
    if (!subtask) return;
    
    // 从时间线中移除对应的子任务项目
    removeSubtaskFromTimeline(currentEditingTask.id, subtaskIndex);
    
    // 清除子任务时间
    subtask.completionTime = null;
    subtask.timeDescription = null;
    
    // 自动保存任务数据
    saveData();
    
    // 重新渲染任务编辑界面
    editTask(currentEditingTask.id);
    
    // 关闭模态框
    closeSubtaskTimeModal();
    
    showNotification(`子任务"${subtask.title}"时间已移除`, 'success');
}

// 同步子任务到时间线
function syncSubtaskToTimeline(taskId, subtaskIndex) {
    const task = projectData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const subtask = task.subtasks[subtaskIndex];
    if (!subtask) return;
    
    console.log('同步子任务到时间线:', {
        '任务标题': task.title,
        '子任务标题': subtask.title,
        '完成时间': subtask.completionTime
    });
    
    // 先移除该子任务的旧时间线项目
    removeSubtaskFromTimeline(taskId, subtaskIndex);
    
    // 确保时间线数组存在
    if (!projectData.timeline) {
        projectData.timeline = [];
    }
    
    // 创建子任务时间线项目（只创建完成时间点）
    if (subtask.completionTime) {
        const completionItem = {
            id: `subtask-completion-${taskId}-${subtaskIndex}`,
            date: subtask.completionTime.split('T')[0], // 只取日期部分
            time: subtask.completionTime.split('T')[1] || '23:59', // 时间部分
            title: `完成：${subtask.title}`,
            description: `完成子任务：${subtask.title}${subtask.timeDescription ? '\n' + subtask.timeDescription : ''}`,
            status: subtask.completed ? 'completed' : 'pending',
            linkedTaskId: taskId,
            linkedSubtaskIndex: subtaskIndex,
            tags: ['子任务', '完成', task.title],
            isSynced: true,
            type: 'subtask-completion',
            parentTask: task.title,
            isSubtask: true
        };
        projectData.timeline.push(completionItem);
        console.log('创建子任务完成时间点:', completionItem);
    }
    
    // 保存数据
    saveData();
    
    // 重新渲染时间线
    renderTimelineVertical();
    
    showNotification(`子任务"${subtask.title}"已同步到时间线`, 'success');
}

// 从时间线中移除子任务
function removeSubtaskFromTimeline(taskId, subtaskIndex) {
    if (!projectData.timeline) return;
    
    // 移除所有相关的子任务时间线项目
    const completionItemId = `subtask-completion-${taskId}-${subtaskIndex}`;
    const startItemId = `subtask-start-${taskId}-${subtaskIndex}`;
    const endItemId = `subtask-end-${taskId}-${subtaskIndex}`;
    
    const beforeCount = projectData.timeline.length;
    projectData.timeline = projectData.timeline.filter(item => 
        item.id !== completionItemId && 
        item.id !== startItemId && 
        item.id !== endItemId &&
        !(item.linkedTaskId === taskId && item.linkedSubtaskIndex === subtaskIndex)
    );
    const afterCount = projectData.timeline.length;
    
    console.log('从时间线移除子任务:', {
        '任务ID': taskId,
        '子任务索引': subtaskIndex,
        '移除前': beforeCount,
        '移除后': afterCount,
        '移除的项目ID': [completionItemId, startItemId, endItemId]
    });
    
    // 保存数据
    saveData();
    
    // 重新渲染时间线
    renderTimelineVertical();
}

// 自动保存任务数据
function autoSaveTaskData() {
    if (!currentEditingTask) {
        console.log('没有正在编辑的任务，跳过自动保存');
        return;
    }
    
    // 获取所有输入框的值
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const statusInput = document.getElementById('task-status');
    const priorityInput = document.getElementById('task-priority');
    const startDateInput = document.getElementById('task-start-date');
    const endDateInput = document.getElementById('task-end-date');
    
    console.log('自动保存任务数据 - 输入框检查:', {
        'task-title': !!titleInput,
        'task-description': !!descriptionInput,
        'task-status': !!statusInput,
        'task-priority': !!priorityInput,
        'task-start-date': !!startDateInput,
        'task-end-date': !!endDateInput
    });
    
    // 更新任务数据
    if (titleInput) currentEditingTask.title = titleInput.value;
    if (descriptionInput) currentEditingTask.description = descriptionInput.value;
    if (statusInput) currentEditingTask.status = statusInput.value;
    if (priorityInput) currentEditingTask.priority = priorityInput.value;
    if (startDateInput) currentEditingTask.startDate = startDateInput.value;
    if (endDateInput) currentEditingTask.endDate = endDateInput.value;
    
    console.log('任务数据已自动更新:', {
        '标题': currentEditingTask.title,
        '描述': currentEditingTask.description,
        '状态': currentEditingTask.status,
        '优先级': currentEditingTask.priority,
        '开始日期': currentEditingTask.startDate,
        '结束日期': currentEditingTask.endDate
    });
    
    // 同步到时间线
    syncTasksToTimeline();
    
    // 保存数据
    saveData();
    
    // 只重新渲染任务列表和时间线，不重新渲染编辑界面
    renderTasks();
    renderTimelineVertical();
    
    console.log('任务数据自动保存完成');
}

// 自动保存任务进度
function autoSaveTaskProgress() {
    if (!currentEditingTask) {
        console.log('没有正在编辑的任务，跳过自动保存进度');
        return;
    }
    
    const progressSlider = document.getElementById('task-progress');
    
    if (!progressSlider) {
        console.log('进度滑块未找到，跳过自动保存进度');
        return;
    }
    
    const progressValue = progressSlider.value;
    const parsedProgress = parseInt(progressValue);
    
    console.log('自动保存任务进度:', {
        '进度滑块值': progressValue,
        '解析后的进度': parsedProgress,
        '当前任务进度': currentEditingTask.progress
    });
    
    // 更新任务进度
    currentEditingTask.progress = parsedProgress;
    
    console.log('任务进度已自动更新:', {
        '任务进度': currentEditingTask.progress
    });
    
    // 保存数据
    saveData();
    
    // 重新渲染任务列表
    renderTasks();
    
    console.log('任务进度自动保存完成');
}

// 计算基于子任务的进度
function calculateTaskProgressFromSubtasks(task) {
    if (!task.subtasks || task.subtasks.length === 0) {
        // 如果没有子任务，返回0进度
        return 0;
    }
    
    const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
    const totalSubtasks = task.subtasks.length;
    const progressPercentage = Math.round((completedSubtasks / totalSubtasks) * 100);
    
    console.log('计算子任务进度:', {
        '任务标题': task.title,
        '已完成子任务': completedSubtasks,
        '总子任务数': totalSubtasks,
        '计算出的进度': progressPercentage
    });
    
    return progressPercentage;
}

// 更新任务进度（基于子任务）
function updateTaskProgressFromSubtasks(taskId) {
    const task = projectData.tasks.find(t => t.id === taskId);
    if (!task) {
        console.log('任务未找到:', taskId);
        return;
    }
    
    // 所有任务都按子任务完成度计算进度（移除autoProgress检查）
    
    const newProgress = calculateTaskProgressFromSubtasks(task);
    const oldProgress = task.progress;
    
    task.progress = newProgress;
    
    console.log('更新任务进度:', {
        '任务标题': task.title,
        '旧进度': oldProgress,
        '新进度': newProgress,
        '自动进度': task.autoProgress,
        '子任务完成情况': task.subtasks.map(st => ({
            title: st.title,
            completed: st.completed
        }))
    });
    
    // 保存数据
    saveData();
    
    // 重新渲染任务列表
    renderTasks();
    
    // 如果正在编辑这个任务，更新进度滑块和进度信息
    if (currentEditingTask && currentEditingTask.id === taskId) {
        const progressSlider = document.getElementById('task-progress');
        const progressValue = document.getElementById('progress-value');
        
        if (progressSlider && progressValue) {
            progressSlider.value = newProgress;
            progressValue.textContent = newProgress + '%';
        }
        
        // 更新进度信息
        updateProgressInfo();
    }
    
    showNotification(`任务进度已自动更新：${newProgress}%（基于子任务完成情况）`, 'success');
}

// 更新进度信息显示
function updateProgressInfo() {
    if (!currentEditingTask) return;
    
    const progressInfo = document.getElementById('progress-info');
    if (!progressInfo) return;
    
    if (currentEditingTask.subtasks && currentEditingTask.subtasks.length > 0) {
        const completedCount = currentEditingTask.subtasks.filter(st => st.completed).length;
        const totalCount = currentEditingTask.subtasks.length;
        const percentage = Math.round((completedCount / totalCount) * 100);
        
        progressInfo.innerHTML = `已完成 ${completedCount}/${totalCount} 个子任务 (${percentage}%)`;
    } else {
        progressInfo.innerHTML = '暂无子任务';
    }
}
