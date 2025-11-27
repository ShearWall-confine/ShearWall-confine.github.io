/**
 * 统一头部加载器
 * 用于在所有页面中动态加载统一的头部组件
 */

// 加载头部HTML和CSS
async function loadHeader() {
    try {
        // 检查是否在本地文件系统中运行
        const isLocalFile = window.location.protocol === 'file:';
        
        if (isLocalFile) {
            console.log('检测到本地文件系统，使用内联头部');
            loadInlineHeader();
            return;
        }
        
        // 加载头部CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'header.css';
        document.head.appendChild(cssLink);
        
        // 加载头部HTML
        console.log('正在加载 header.html...');
        const response = await fetch('header.html');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const headerHTML = await response.text();
        console.log('header.html 加载成功');
        
        // 创建头部容器
        const headerContainer = document.createElement('div');
        headerContainer.id = 'header-container';
        headerContainer.innerHTML = headerHTML;
        
        // 将头部插入到页面顶部
        document.body.insertBefore(headerContainer, document.body.firstChild);
        
        console.log('头部组件加载成功');
    } catch (error) {
        console.log('外部头部文件加载失败，使用内联头部:', error.message);
        // 如果加载失败，使用内联头部
        loadInlineHeader();
    }
}

// 内联头部（用于本地文件系统）
function loadInlineHeader() {
    // 加载头部CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'header.css';
    document.head.appendChild(cssLink);
    
    // 创建内联头部HTML（使用正确的四个链接结构）
    const headerHTML = `
        <div class="head-top">     
            <a href="https://www.tongji.edu.cn/">
                <img src="figurE/tju.png" />
            </a>
            <a href="https://ddms.tongji.edu.cn/main.htm">
                <img src="figurE/tju-ce.png" />
            </a>
            <a href="https://ddms.tongji.edu.cn/main.htm">
                <p>&nbsp;结构防灾减灾工程系&nbsp;</p>
            </a>
            <a href="https://shearwall-confine.github.io/">
                <p>&nbsp;xxx老师课题组&nbsp;</p>
                <p>&nbsp;Research Group&nbsp;</p>
            </a> 
        </div>
        <div class="head-bottom">     
            <ul>
                <li><a href="index.html">首页</a></li>
                <li><a href="#">概况</a>
                    <ul>
                        <li><a href="#"><i class="fas fa-search"></i> 研究方向</a></li>
                        <li><a href="#"><i class="fas fa-project-diagram"></i> 研究项目</a></li>
                    </ul>
                </li>
                <li><a href="#">组内动态</a></li>
                <li><a href="#">研究团队</a>
                    <ul>
                        <li><a href="#"><i class="fas fa-chalkboard-teacher"></i> 教师</a></li>
                        <li><a href="#"><i class="fas fa-user-graduate"></i> 博士后</a></li>
                        <li><a href="#"><i class="fas fa-user-check"></i> 出站博士后</a></li>
                        <li><a href="#"><i class="fas fa-graduation-cap"></i> 博士</a></li>
                        <li><a href="#"><i class="fas fa-user-graduate"></i> 往届博士</a></li>
                        <li><a href="#"><i class="fas fa-user"></i> 研究生</a></li>
                        <li><a href="#"><i class="fas fa-user-friends"></i> 往届研究生</a></li>
                    </ul>
                </li>
                <li><a href="#">科研成果</a>
                    <ul>
                        <li><a href="#"><i class="fas fa-flask"></i> ILEE联合试验</a></li>
                        <li><a href="database.html"><i class="fas fa-database"></i> 剪力墙数据库</a></li>
                    </ul>
                </li>
                <li><a href="#">科研工具</a>
                    <ul>
                        <li><a href="login.html"><i class="fas fa-tasks"></i> 课题进度管理</a></li>
                        <li><a href="german_20251031/german_index.html"><i class="fas fa-language"></i> 德语学习工具</a></li>
                        <li><a href="table/pool.html"><i class="fas fa-bullseye"></i> 台球游戏</a></li>
                        <li><a href="table/cs.html"><i class="fas fa-crosshairs"></i> 终极火力演练场</a></li>
                        <li><a href="table/mambarun.html"><i class="fas fa-running"></i> 曼巴狂奔跑道</a></li>
                    </ul>
                </li>
                <li><a href="#">交流合作</a></li>
                <li><a href="#">联系我们</a></li>
            </ul>
        </div>
    `;
    
    // 创建头部容器
    const headerContainer = document.createElement('div');
    headerContainer.id = 'header-container';
    headerContainer.innerHTML = headerHTML;
    
    // 将头部插入到页面顶部
    document.body.insertBefore(headerContainer, document.body.firstChild);
    
    console.log('内联头部组件加载成功');
}

// 备用头部（如果外部文件加载失败）
function loadFallbackHeader() {
    const headerContainer = document.createElement('div');
    headerContainer.id = 'header-container';
    headerContainer.innerHTML = `
        <div class="head-top">     
            <a href="https://www.tongji.edu.cn/">
                <img src="figurE/tju.png" />
            </a>
            <a href="https://ddms.tongji.edu.cn/main.htm">
                <img src="figurE/tju-ce.png" />
            </a>
            <a href="https://ddms.tongji.edu.cn/main.htm">
                <p>&nbsp;结构防灾减灾工程系&nbsp;</p>
            </a>
            <a href="https://shearwall-confine.github.io/">
                <p>&nbsp;xxx老师课题组&nbsp;</p>
                <p>&nbsp;Research Group&nbsp;</p>
            </a> 
        </div>
        <div class="head-bottom">     
            <ul>
                <li><a href="index.html">首页</a></li>
                <li><a href="#">概况</a>
                    <ul>
                        <li><a href="#">研究方向</a></li>
                        <li><a href="#">研究项目</a></li>
                    </ul>
                </li>
                <li><a href="#">组内动态</a></li>
                <li><a href="#">研究团队</a>
                    <ul>
                        <li><a href="#">教师</a></li>
                        <li><a href="#">博士后</a></li>
                        <li><a href="#">出站博士后</a></li>
                        <li><a href="#">博士</a></li>
                        <li><a href="#">往届博士</a></li>
                        <li><a href="#">研究生</a></li>
                        <li><a href="#">往届研究生</a></li>
                    </ul>
                </li>
                <li><a href="#">科研成果</a>
                    <ul>
                        <li><a href="#">ILEE联合试验</a></li>
                        <li><a href="database.html">剪力墙数据库</a></li>
                    </ul>
                </li>
                <li><a href="#">科研工具</a>
                    <ul>
                        <li><a href="login.html"><i class="fas fa-tasks"></i> 课题进度管理</a></li>
                        <li><a href="german_20251031/german_index.html"><i class="fas fa-language"></i> 德语学习工具</a></li>
                        <li><a href="table/pool.html"><i class="fas fa-bullseye"></i> 台球游戏</a></li>
                        <li><a href="table/cs.html"><i class="fas fa-crosshairs"></i> 终极火力演练场</a></li>
                        <li><a href="table/mambarun.html"><i class="fas fa-running"></i> 曼巴狂奔跑道</a></li>
                    </ul>
                </li>
                <li><a href="#">交流合作</a></li>
                <li><a href="#">联系我们</a></li>
            </ul>
        </div>
    `;
    
    // 添加内联样式
    const style = document.createElement('style');
    style.textContent = `
        .head-top {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 15px 0;
            border-bottom: 3px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }
        .head-top a {
            display: flex;
            align-items: center;
            padding: 8px 15px;
            margin: 0 8px;
            border-radius: 25px;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
        }
        .head-top a:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .head-top img {
            height: 45px;
            margin-right: 12px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            transition: transform 0.3s ease;
        }
        .head-top p {
            margin: 0;
            font-size: 15px;
            color: white;
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        .head-bottom {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border-bottom: 1px solid rgba(102, 126, 234, 0.1);
        }
        .head-bottom ul {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
        }
        .head-bottom > ul > li > a {
            display: block;
            padding: 18px 25px;
            color: #333;
            font-weight: 500;
            transition: all 0.3s ease;
            position: relative;
            border-radius: 8px;
            margin: 5px;
        }
        .head-bottom > ul > li > a:hover {
            color: #667eea;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }
    `;
    document.head.appendChild(style);
    document.body.insertBefore(headerContainer, document.body.firstChild);
}

// 页面加载时自动加载头部
document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
    // 延迟执行，确保头部已加载
    setTimeout(() => {
        highlightCurrentPage();
        addNavigationEffects();
        addSmoothScrolling();
        addScrollEffects();
        addScrollStyles();
    }, 100);
});

// 高亮当前页面
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    const navLinks = document.querySelectorAll('.head-bottom a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// 添加导航交互效果
function addNavigationEffects() {
    const navLinks = document.querySelectorAll('.head-bottom a');
    
    navLinks.forEach(link => {
        // 添加点击波纹效果
        link.addEventListener('click', function(e) {
            createRippleEffect(e, this);
        });
        
        // 添加键盘导航支持
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// 创建波纹效果
function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(102, 126, 234, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    // 添加CSS动画
    if (!document.getElementById('ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// 添加平滑滚动效果
function addSmoothScrolling() {
    const links = document.querySelectorAll('.head-bottom a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 添加导航栏滚动效果
function addScrollEffects() {
    let lastScrollTop = 0;
    const header = document.querySelector('.head-bottom');
    
    if (!header) return;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // 向下滚动，隐藏导航栏
            header.style.transform = 'translateY(-100%)';
        } else {
            // 向上滚动，显示导航栏
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// 添加导航栏样式
function addScrollStyles() {
    if (!document.getElementById('scroll-styles')) {
        const style = document.createElement('style');
        style.id = 'scroll-styles';
        style.textContent = `
            .head-bottom {
                transition: transform 0.3s ease-in-out;
                position: sticky;
                top: 0;
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);
    }
}
