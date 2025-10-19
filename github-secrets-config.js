/**
 * GitHub Secrets 配置文件
 * 此文件在GitHub Actions构建时会被动态生成
 * 包含从GitHub Secrets获取的密码哈希值
 */

// 这个文件会在GitHub Actions中动态生成
// 包含从GitHub Secrets获取的密码哈希值
window.GITHUB_SECRETS = {
    // 这些值会在GitHub Actions构建时从secrets中注入
    ADMIN_PASSWORD_HASH: '{{ secrets.ADMIN_PASSWORD_HASH }}',
    EDITOR_PASSWORD_HASH: '{{ secrets.EDITOR_PASSWORD_HASH }}',
    VIEWER_PASSWORD_HASH: '{{ secrets.VIEWER_PASSWORD_HASH }}',
    JWT_SECRET: '{{ secrets.JWT_SECRET }}',
    ENCRYPTION_KEY: '{{ secrets.ENCRYPTION_KEY }}'
};

// 开发环境回退值
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.GITHUB_SECRETS = {
        ADMIN_PASSWORD_HASH: 'dev_hash_admin_2024',
        EDITOR_PASSWORD_HASH: 'dev_hash_editor_2024',
        VIEWER_PASSWORD_HASH: 'dev_hash_viewer_2024',
        JWT_SECRET: 'dev_jwt_secret',
        ENCRYPTION_KEY: 'dev_encryption_key'
    };
}
