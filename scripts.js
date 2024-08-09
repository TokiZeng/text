let previousBtcPrice = null;
let previousEthPrice = null;
let previousSelectedPrice = null;

async function fetchSymbols() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price');
        const data = await response.json();
        const symbolSelect = document.getElementById('symbol-select');
        data.forEach(item => {
            if (item.symbol.endsWith('USDT')) {
                const option = document.createElement('option');
                option.value = item.symbol;
                option.text = formatSymbol(item.symbol);
                symbolSelect.add(option);
            }
        });
    } catch (error) {
        console.error('Error fetching symbols:', error);
    }
}

function formatSymbol(symbol) {
    return symbol.replace('USDT', '/USDT');
}

async function fetchPrices(symbol, elementId, previousPrice) {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        const data = await response.json();
        
        const response24h = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        const data24h = await response24h.json();

        updatePrice(elementId, data.price, previousPrice, data24h.priceChangePercent, symbol);
        return data.price;
    } catch (error) {
        console.error(`Error fetching prices for ${symbol}:`, error);
        return previousPrice;
    }
}

function updatePrice(elementId, newPrice, oldPrice, priceChangePercent, symbol) {
    const priceElement = document.getElementById(elementId);
    const priceValueElement = priceElement.querySelector('.price-value');
    const priceChangeElement = priceElement.querySelector('.price-change');
    const priceNameElement = priceElement.querySelector('.price-name');
    const formattedSymbol = formatSymbol(symbol);
    const price = parseFloat(newPrice).toFixed(2);
    priceValueElement.innerText = `$${price}`;
    priceChangeElement.innerText = `(${priceChangePercent}%)`;
    priceNameElement.innerText = formattedSymbol;
    if (priceChangePercent >= 0) {
        priceChangeElement.classList.add('green');
        priceChangeElement.classList.remove('red');
    } else {
        priceChangeElement.classList.add('red');
        priceChangeElement.classList.remove('green');
    }
    if (oldPrice !== null) {
        if (price > oldPrice) {
            flashColor(priceValueElement, 'green');
        } else if (price < oldPrice) {
            flashColor(priceValueElement, 'red');
        }
    }
}

function flashColor(element, color) {
    element.classList.add(color);
    setTimeout(() => {
        element.classList.remove(color);
    }, 500);
}

function showContent(tabId) {
    const contents = document.querySelectorAll('.content');
    contents.forEach(function(content) {
        content.classList.add('hidden');
    });
    document.getElementById(tabId).classList.remove('hidden');
}

function openInNewWindow(url) {
    window.open(url, '_blank');
}

document.addEventListener("DOMContentLoaded", function() {
    fetchSymbols();
    fetchPrices('BTCUSDT', 'btc-price', previousBtcPrice).then(price => previousBtcPrice = price);
    fetchPrices('ETHUSDT', 'eth-price', previousEthPrice).then(price => previousEthPrice = price);
    showContent('news');
    setInterval(() => {
        const symbol = document.getElementById('symbol-select').value;
        fetchPrices(symbol, 'selected-price', previousSelectedPrice).then(price => previousSelectedPrice = price);
        fetchPrices('BTCUSDT', 'btc-price', previousBtcPrice).then(price => previousBtcPrice = price);
        fetchPrices('ETHUSDT', 'eth-price', previousEthPrice).then(price => previousEthPrice = price);
    }, 5000); // 每5秒更新一次價格
});
