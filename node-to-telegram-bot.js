const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Telegram Bot 配置
const TELEGRAM_TOKEN = '2033272917:AAERLMr-WD9DXkSyKctgt6GzajKE3ugIqc4';
const TELEGRAM_CHAT_ID = '-1001572303287';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// NodeBB API 配置
const NODEBB_URL = 'https://sporthhmbbs.xyz';
const NODEBB_API_TOKEN = 'f74ea769-f954-4289-8c04-e589030edc6d';

// 用來追蹤最後一篇文章的 ID
let lastPostId = null;

// 查詢 NodeBB 最近的文章
async function fetchRecentPosts() {
    try {
        const response = await axios.get(`${NODEBB_URL}/api/recent`, {
            headers: {
                Authorization: `Bearer ${NODEBB_API_TOKEN}`,
            },
        });
        console.log("API 響應:", response.data); // 添加日誌輸出
        return response.data.topics || []; // 確保返回一個數組
    } catch (error) {
        console.error('無法獲取 NodeBB 文章:', error);
        return [];
    }
}

// 發送 Telegram 通知
async function sendTelegramNotification(post) {
    const message = `
📢 新文章通知
作者: ${post.user.username}
標題: ${post.title}
連結: ${NODEBB_URL}/topic/${post.slug}
    `;
    await bot.sendMessage(TELEGRAM_CHAT_ID, message);
}

// 定時檢查新文章
async function checkForNewPosts() {
    const posts = await fetchRecentPosts();

    // 檢查 posts 是否為可迭代的對象
    if (Array.isArray(posts)) {
        // 檢查是否有新文章
        for (const post of posts) {
            if (!lastPostId || post.tid > lastPostId) {
                await sendTelegramNotification(post);
                lastPostId = post.tid;
            }
        }
    } else {
        console.error("posts 不是可迭代的對象:", posts);
    }
}

// 啟動定時器
setInterval(checkForNewPosts, 10000); // 每10秒檢查一次
