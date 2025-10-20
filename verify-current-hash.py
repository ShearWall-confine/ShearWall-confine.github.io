#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证当前 user-config.js 中的哈希值
"""

import hashlib

def verify_password_with_salt(password, salt, hash_value):
    """使用指定的 salt 验证密码"""
    try:
        # 将 salt 从 hex 转换为 bytes
        salt_bytes = bytes.fromhex(salt)
        
        # 使用 PBKDF2 算法计算哈希
        computed_hash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt_bytes, 10000)
        computed_hash_hex = computed_hash.hex()
        
        return computed_hash_hex == hash_value
    except Exception as e:
        print(f"验证失败: {e}")
        return False

def main():
    print("验证当前 user-config.js 中的哈希值")
    print("=" * 50)
    
    # 当前 user-config.js 中的哈希值
    current_hash = "09208fc77dde6d10c1963a1939108648:737b69d98f350265393c47428feb988fa3f1c18bd4a950471ea23fb238e93df0f5701f2382f9b1c669d217bf1aebbf4f1413b0cdd98204a92dee9a444527087e"
    
    # 要测试的密码
    test_passwords = [
        'TongGi13246@Admin',
        'TongGi9519@Editor', 
        'TongGi8271@Viewer',
        'Tongji2024@Admin',
        'Tongji2024@Editor',
        'Tongji2024@Viewer',
        'admin',
        'editor',
        'viewer',
        'password',
        '123456'
    ]
    
    print(f"当前哈希值: {current_hash}")
    print(f"Salt: {current_hash.split(':')[0]}")
    print(f"Hash: {current_hash.split(':')[1][:20]}...")
    print()
    
    # 解析哈希值
    salt, hash_value = current_hash.split(':')
    
    print("开始验证密码...")
    for password in test_passwords:
        is_valid = verify_password_with_salt(password, salt, hash_value)
        if is_valid:
            print(f"✅ 找到匹配密码: {password}")
            break
        else:
            print(f"❌ 不匹配: {password}")
    
    print("\n验证完成！")

if __name__ == "__main__":
    main()
