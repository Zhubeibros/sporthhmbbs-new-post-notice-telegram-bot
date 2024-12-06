const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Telegram Bot 配置
const TELEGRAM_TOKEN = '2033272917:AAERLMr-WD9DXkSyKctgt6GzajKE3ugIqc4';
const TELEGRAM_CHAT_ID = '-1001572303287';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// NodeBB API 配置
const NODEBB_URL = 'https://sporthhmbbs.xyz';
const NODEBB_API_TOKEN = 'f74ea769-f954-4289-8c04-e589030edc6d';

// 用來追蹤最後一篇文章的 ID
let lastPostId = null;
let lastReplyId = null;

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
async function sendTelegramNotification(post) {
    // 獲取作者的頭貼 URL
    const avatarUrl = post.user.picture || 'default_avatar_url'; // 替換為默認頭貼 URL

    // 構建消息內容
    const message = `
作者: ${post.user.username}
標題: ${post.title}
連結: ${NODEBB_URL}/topic/${post.slug}
    `;

    // 發送頭貼和消息
    await bot.sendPhoto(TELEGRAM_CHAT_ID, avatarUrl, { caption: message });
}

// 發送 Telegram 回應通知
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

// 發佈內容到 NodeBB
async function postToNodeBB(username, topicId, content, imageUrl) {
    try {
        const response = await axios.post(`${NODEBB_URL}/api/v1/topics/${topicId}/posts`, {
            content: content,
            // 如果有圖片，根據 NodeBB API 的要求進行調整
            // image: imageUrl // 根據 NodeBB API 的要求進行調整
        }, {
            headers: {
                Authorization: `Bearer ${NODEBB_API_TOKEN}`, // 使用 NodeBB API Token
                'Content-Type': 'application/json',
            },
        });
        console.log('成功發佈到 NodeBB:', response.data);
    } catch (error) {
        console.error('發佈到 NodeBB 失敗:', error);
    }
}

// 接收 Telegram 消息
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // 假設消息格式為 "username, topic id, content, image_url"
    const [username, topicId, content, imageUrl] = msg.text.split(',');

    // 調用發佈函數
    await postToNodeBB(username.trim(), topicId.trim(), content.trim(), imageUrl ? imageUrl.trim() : null);
});

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

// 啟動定時器來檢查新文章和新回應
setInterval(async () => {
    await checkForNewPosts();
    await checkForNewReplies();
}, 10000); // 每10秒檢查一次
