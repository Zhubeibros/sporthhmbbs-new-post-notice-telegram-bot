const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Telegram Bot 配置
const TELEGRAM_TOKEN = '2033272917:AAERLMr-WD9DXkSyKctgt6GzajKE3ugIqc4';
const TELEGRAM_CHAT_ID = '-1001572303287';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// NodeBB API 配置
const NODEBB_URL = 'https://sporthhmbbs.xyz';
const NODEBB_API_TOKEN = 'f74ea769-f954-4289-8c04-e589030edc6d';

// 用來追蹤最後一個回應的 ID
let lastReplyId = null;

// 查詢 NodeBB 最近的回應
async function fetchRecentReplies() {
    try {
        const response = await axios.get(`${NODEBB_URL}/api/recent/replies`, {
            headers: {
                Authorization: `Bearer ${NODEBB_API_TOKEN}`,
            },
        });
        console.log("API 響應:", response.data); // 添加日誌輸出
        return response.data.posts || []; // 確保返回一個數組
    } catch (error) {
        console.error('無法獲取 NodeBB 回應:', error);
        return [];
    }
}

// 發送 Telegram 通知
async function sendTelegramReplyNotification(reply) {
    // 獲取作者的頭貼 URL
    const avatarUrl = reply.user.picture || 'default_avatar_url'; // 替換為默認頭貼 URL

    // 構建消息內容
    const message = `
作者: ${reply.user.username}
回應: ${reply.content}
連結: ${NODEBB_URL}/post/${reply.pid}
    `;

    // 發送頭貼和消息
    await bot.sendPhoto(TELEGRAM_CHAT_ID, avatarUrl, { caption: message });
}

// 定時檢查新回應
async function checkForNewReplies() {
    const replies = await fetchRecentReplies();

    // 檢查 replies 是否為可迭代的對象
    if (Array.isArray(replies)) {
        // 檢查是否有新回應
        for (const reply of replies) {
            if (!lastReplyId || reply.pid > lastReplyId) {
                await sendTelegramReplyNotification(reply);
                lastReplyId = reply.pid;
            }
        }
    } else {
        console.error("replies 不是可迭代的對象:", replies);
    }
}

// 啟動定時器
setInterval(checkForNewReplies, 10000); // 每10秒檢查一次 