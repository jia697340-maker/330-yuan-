/**
 * PWA 移动端通知管理器
 * 专为移动端设计，使用 ServiceWorkerRegistration.showNotification()
 */

class NotificationManager {
    constructor() {
        this.swRegistration = null;
        this.permissionGranted = false;
        this.isInitialized = false;
    }

    /**
     * 初始化通知系统
     */
    async init() {
        console.log('[通知管理器] 开始初始化...');

        // 检查浏览器支持
        if (!('serviceWorker' in navigator)) {
            console.error('[通知管理器] 浏览器不支持 Service Worker');
            return false;
        }

        if (!('Notification' in window)) {
            console.error('[通知管理器] 浏览器不支持通知 API');
            return false;
        }

        try {
            // 等待 Service Worker 注册完成
            this.swRegistration = await navigator.serviceWorker.ready;
            console.log('[通知管理器] Service Worker 已就绪');

            // 检查通知权限
            await this.checkPermission();

            this.isInitialized = true;
            console.log('[通知管理器] 初始化完成');
            return true;
        } catch (error) {
            console.error('[通知管理器] 初始化失败:', error);
            return false;
        }
    }

    /**
     * 检查并请求通知权限
     */
    async checkPermission() {
        const permission = Notification.permission;
        console.log('[通知管理器] 当前权限状态:', permission);

        if (permission === 'granted') {
            this.permissionGranted = true;
            return true;
        }

        if (permission === 'denied') {
            console.warn('[通知管理器] 用户已拒绝通知权限');
            this.permissionGranted = false;
            return false;
        }

        // 权限为 default，需要请求
        return await this.requestPermission();
    }

    /**
     * 请求通知权限
     */
    async requestPermission() {
        try {
            console.log('[通知管理器] 请求通知权限...');
            const permission = await Notification.requestPermission();
            
            this.permissionGranted = (permission === 'granted');
            console.log('[通知管理器] 权限请求结果:', permission);
            
            return this.permissionGranted;
        } catch (error) {
            console.error('[通知管理器] 权限请求失败:', error);
            return false;
        }
    }

    /**
     * 显示通知（移动端专用）
     * @param {string} title - 通知标题
     * @param {Object} options - 通知选项
     */
    async showNotification(title, options = {}) {
        // 确保已初始化
        if (!this.isInitialized) {
            console.warn('[通知管理器] 未初始化，正在初始化...');
            const success = await this.init();
            if (!success) {
                console.error('[通知管理器] 初始化失败，无法显示通知');
                return false;
            }
        }

        // 检查权限
        if (!this.permissionGranted) {
            console.warn('[通知管理器] 没有通知权限');
            const granted = await this.requestPermission();
            if (!granted) {
                console.error('[通知管理器] 用户拒绝了通知权限');
                return false;
            }
        }

        // 确保有 Service Worker Registration
        if (!this.swRegistration) {
            console.error('[通知管理器] Service Worker Registration 不可用');
            return false;
        }

        try {
            // 设置默认选项
            const notificationOptions = {
                body: options.body || '您有新消息',
                icon: options.icon || 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1758510900942_qdqqd_djw0z2.jpeg',
                badge: options.badge || 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1758510900942_qdqqd_djw0z2.jpeg',
                tag: options.tag || `msg-${Date.now()}`,
                requireInteraction: options.requireInteraction !== false, // 默认 true
                vibrate: options.vibrate || [200, 100, 200], // 震动模式
                data: options.data || {},
                silent: options.silent || false,
                timestamp: options.timestamp || Date.now()
            };

            // 使用 ServiceWorkerRegistration.showNotification()
            await this.swRegistration.showNotification(title, notificationOptions);
            
            console.log('[通知管理器] 通知已发送:', title);
            return true;
        } catch (error) {
            console.error('[通知管理器] 显示通知失败:', error);
            return false;
        }
    }

    /**
     * 发送聊天消息通知
     */
    async notifyNewMessage(chatName, messageContent, chatId) {
        return await this.showNotification(`${chatName}`, {
            body: messageContent,
            tag: `chat-${chatId}`,
            data: {
                type: 'chat',
                chatId: chatId,
                timestamp: Date.now()
            },
            requireInteraction: true,
            vibrate: [200, 100, 200]
        });
    }

    /**
     * 发送系统通知
     */
    async notifySystem(message) {
        return await this.showNotification('EPhone', {
            body: message,
            tag: 'system',
            data: {
                type: 'system'
            },
            requireInteraction: false
        });
    }

    /**
     * 测试通知
     */
    async testNotification() {
        console.log('[通知管理器] 发送测试通知...');
        return await this.showNotification('测试通知', {
            body: '如果你看到这条通知，说明通知功能正常工作！',
            tag: 'test',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200]
        });
    }

    /**
     * 获取当前权限状态
     */
    getPermissionStatus() {
        return {
            permission: Notification.permission,
            granted: this.permissionGranted,
            initialized: this.isInitialized
        };
    }
}

// 创建全局实例
window.notificationManager = new NotificationManager();

// 页面加载时自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.notificationManager.init();
    });
} else {
    window.notificationManager.init();
}

console.log('[通知管理器] 模块已加载');
