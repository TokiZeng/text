document.addEventListener('DOMContentLoaded', function() {
    async function fetchNews() {
        try {
            const response = await fetch('http://125.228.97.125:3000/news');
            console.log(response); // 打印響應對象以檢查狀態碼和標頭
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(data); // 打印 API 響應以進行調試

            const newsContainer = document.getElementById('news');
            newsContainer.innerHTML = '';

            if (data.articles.length === 0) {
                newsContainer.innerHTML = '<p>No news articles found.</p>';
                return;
            }

            data.articles.forEach(article => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                newsItem.innerHTML = `
                    <img src="${article.urlToImage}" alt="News Image" class="news-image">
                    <div class="news-content">
                        <h3>${article.title}</h3>
                        <p>${article.description || 'No description available'}</p>
                        <p><small>Published at: ${new Date(article.publishedAt).toLocaleString()}</small></p>
                        <a href="#" class="read-more" data-article='${JSON.stringify(article)}'>Read more</a>
                    </div>
                `;
                newsContainer.appendChild(newsItem);
            });

            document.querySelectorAll('.read-more').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const article = JSON.parse(this.getAttribute('data-article'));
                    localStorage.setItem('selectedArticle', JSON.stringify(article));
                    window.location.href = 'news-detail.html';
                });
            });
        } catch (error) {
            console.error('Error fetching news:', error);
            document.getElementById('news').innerHTML = '<p>Failed to fetch news. Please try again later.</p>';
        }
    }

    // 初次加載新聞
    fetchNews();

    // 每10分鐘刷新一次新聞
    setInterval(fetchNews, 600000); // 將間隔時間設置為10分鐘
});
