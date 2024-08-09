const express = require('express');
const request = require('request');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());

let cachedData = null;
const cacheFile = path.join(__dirname, 'cache.json');

// 使用動態 import
async function fetchModule() {
    return await import('node-fetch');
}

// 定義一個函數用於翻譯文本
async function translateText(text) {
    try {
        const { default: fetch } = await fetchModule();
        const response = await fetch('http://125.228.97.125:5000/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
        if (!response.ok) {
            throw new Error('Translation API request failed');
        }
        const data = await response.json();
        return data.translated_text;
    } catch (error) {
        console.error('Translation error:', error);
        return text; // 如果翻譯失敗，保留原文
    }
}

// 定義一個函數用於抓取並翻譯新聞數據
async function fetchAndCacheNews() {
    const url = 'https://newsapi.org/v2/everything?q=cryptocurrency&sortBy=publishedAt&apiKey=6a738aaf6c3f4d4eba4f41f2fd953201';
    const options = {
        url: url,
        headers: {
            'User-Agent': 'YourAppName/1.0'
        }
    };

    request(options, async (error, response, body) => {
        if (error) {
            console.error('Error fetching news:', error);
        } else if (response.statusCode === 200) {
            let data = JSON.parse(body);

            // 對每篇文章進行翻譯
            for (let article of data.articles) {
                article.title = await translateText(article.title);
                article.description = article.description ? await translateText(article.description) : null;
                article.content = article.content ? await translateText(article.content) : null;
            }

            cachedData = data;
            fs.writeFileSync(cacheFile, JSON.stringify(data));
            console.log('Translated news data cached successfully.');
        } else {
            console.error(`Failed to fetch news, status code: ${response.statusCode}`);
        }
    });
}

// 每10分鐘抓取並翻譯一次數據
setInterval(fetchAndCacheNews, 600000); // 10分鐘

// 啟動伺服器時立即抓取並翻譯一次
fetchAndCacheNews();

app.get('/news', (req, res) => {
    if (cachedData) {
        res.json(cachedData);
    } else if (fs.existsSync(cacheFile)) {
        const data = fs.readFileSync(cacheFile, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.status(503).send('Service unavailable. Please try again later.');
    }
});

app.listen(port, () => {
    console.log(`Proxy server is running on http://localhost:${port}`);
});
