document.addEventListener('DOMContentLoaded', function() {
    let SYMBOL = document.getElementById('symbol').value;
    const API_URL_BASE = 'https://api.binance.com/api/v3/ticker/price?symbol=';
    const API_STATS_URL_BASE = 'https://api.binance.com/api/v3/ticker/24hr?symbol=';
    const API_KLINES_URL_BASE = 'https://api.binance.com/api/v3/klines?symbol=';

    const currentPriceElem = document.getElementById('currentPrice');
    const priceChangeElem = document.getElementById('priceChange');
    const previousMinutePriceElem = document.getElementById('previousMinutePrice');
    const twoMinutesAgoPriceElem = document.getElementById('twoMinutesAgoPrice');
    const highPriceElem = document.getElementById('highPrice');
    const lowPriceElem = document.getElementById('lowPrice');
    const alertElem = document.getElementById('alert');
    const alertSound = document.getElementById('alertSound');
    const thresholdInput = document.getElementById('thresholdInput');
    const thresholdType = document.getElementById('thresholdType');
    const alertType = document.getElementById('alertType');

    let previousPrice = null;
    let previousMinutePrice = null;
    let twoMinutesAgoPrice = null;

    async function getCurrentPrice(symbol) {
        try {
            const response = await fetch(API_URL_BASE + symbol);
            const data = await response.json();
            return parseFloat(data.price);
        } catch (error) {
            console.error('Error fetching price:', error);
            return null;
        }
    }

    async function getKlinePrice(symbol, interval, limit) {
        try {
            const response = await fetch(`${API_KLINES_URL_BASE}${symbol}&interval=${interval}&limit=${limit}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching Kline data:', error);
            return null;
        }
    }

    async function get24hrStats(symbol) {
        try {
            const response = await fetch(API_STATS_URL_BASE + symbol);
            const data = await response.json();
            console.log('Fetched 24hr stats:', data);
            return { highPrice: parseFloat(data.highPrice), lowPrice: parseFloat(data.lowPrice) };
        } catch (error) {
            console.error('Error fetching 24hr stats:', error);
            return { highPrice: null, lowPrice: null };
        }
    }

    async function updateHistoricalPrices(symbol) {
        const klineData = await getKlinePrice(symbol, '1m', 3);
        if (klineData && klineData.length >= 3) {
            const previousMinuteData = klineData[klineData.length - 2];
            const twoMinutesAgoData = klineData[klineData.length - 3];
            previousMinutePrice = parseFloat(previousMinuteData[4]); // 收盤價
            twoMinutesAgoPrice = parseFloat(twoMinutesAgoData[4]); // 收盤價
            updatePriceDisplay(previousMinutePriceElem, previousMinutePrice, null);
            updatePriceDisplay(twoMinutesAgoPriceElem, twoMinutesAgoPrice, null);
        }
    }

    function updatePriceDisplay(element, value, previousValue) {
        element.textContent = value.toFixed(3);
        if (previousValue !== null) {
            if (value > previousValue) {
                element.classList.remove('price-neutral', 'price-down');
                element.classList.add('price-up');
            } else if (value < previousValue) {
                element.classList.remove('price-neutral', 'price-up');
                element.classList.add('price-down');
            } else {
                element.classList.remove('price-up', 'price-down');
                element.classList.add('price-neutral');
            }
        } else {
            element.classList.add('price-neutral');
        }
    }

    function updateChangeDisplay(element, change) {
        if (thresholdType.value === 'percent') {
            element.textContent = (change * 100).toFixed(3) + '%';
        } else {
            element.textContent = change.toFixed(3);
        }

        if (change > 0) {
            element.classList.remove('price-neutral', 'price-down');
            element.classList.add('price-up');
        } else if (change < 0) {
            element.classList.remove('price-neutral', 'price-up');
            element.classList.add('price-down');
        } else {
            element.classList.remove('price-up', 'price-down');
            element.classList.add('price-neutral');
        }
    }

    async function checkPriceChange() {
        SYMBOL = document.getElementById('symbol').value;
        const currentPrice = await getCurrentPrice(SYMBOL);
        if (currentPrice === null) return;

        updatePriceDisplay(currentPriceElem, currentPrice, previousMinutePrice);

        if (previousMinutePrice !== null) {
            let priceChange;
            let alertTriggered = false;

            if (thresholdType.value === 'percent') {
                priceChange = (currentPrice - previousMinutePrice) / previousMinutePrice;
                const threshold = parseFloat(thresholdInput.value) / 100;
                if (alertType.value === 'both') {
                    alertTriggered = Math.abs(priceChange) >= threshold;
                } else if (alertType.value === 'rise') {
                    alertTriggered = priceChange >= threshold;
                } else if (alertType.value === 'fall') {
                    alertTriggered = priceChange <= -threshold;
                }
            } else if (thresholdType.value === 'value') {
                priceChange = currentPrice - previousMinutePrice;
                const threshold = parseFloat(thresholdInput.value);
                if (alertType.value === 'both') {
                    alertTriggered = Math.abs(priceChange) >= threshold;
                } else if (alertType.value === 'rise') {
                    alertTriggered = priceChange >= threshold;
                } else if (alertType.value === 'fall') {
                    alertTriggered = priceChange <= -threshold;
                }
            } else if (thresholdType.value === 'targetPrice') {
                const targetPrice = parseFloat(thresholdInput.value);
                priceChange = currentPrice - previousMinutePrice; // 這裡保持價格變化的顯示正確
                if ((currentPrice >= targetPrice && previousPrice < targetPrice) || 
                    (currentPrice <= targetPrice && previousPrice > targetPrice)) {
                    alertTriggered = true;
                }
            }

            if (alertTriggered) {
                alertElem.textContent = `警報：價格變動達到設定閾值，當前價格為 ${currentPrice.toFixed(3)}`;
                alertSound.play();
            } else {
                alertElem.textContent = '';
            }

            updateChangeDisplay(priceChangeElem, priceChange);
        }

        previousPrice = currentPrice;
    }

    async function updatePrices() {
        SYMBOL = document.getElementById('symbol').value;
        const newPrice = await getCurrentPrice(SYMBOL);
        if (newPrice !== null) {
            if (previousMinutePrice !== null) {
                twoMinutesAgoPrice = previousMinutePriceElem.textContent !== '-' ? parseFloat(previousMinutePriceElem.textContent) : null;
                updatePriceDisplay(twoMinutesAgoPriceElem, twoMinutesAgoPrice, null);
            }
            previousMinutePrice = newPrice;
            updatePriceDisplay(previousMinutePriceElem, previousMinutePrice, twoMinutesAgoPrice);
        }
    }

    async function updateDailyStats() {
        SYMBOL = document.getElementById('symbol').value;
        const stats = await get24hrStats(SYMBOL);
        if (stats.highPrice !== null && stats.lowPrice !== null) {
            highPriceElem.textContent = stats.highPrice.toFixed(3);
            lowPriceElem.textContent = stats.lowPrice.toFixed(3);
        }
    }

    document.getElementById('symbol').addEventListener('change', () => {
        previousPrice = null;
        previousMinutePrice = null;
        twoMinutesAgoPrice = null;
        currentPriceElem.textContent = '-';
        priceChangeElem.textContent = '-';
        previousMinutePriceElem.textContent = '-';
        twoMinutesAgoPriceElem.textContent = '-';
        highPriceElem.textContent = '-';
        lowPriceElem.textContent = '-';
        alertElem.textContent = '';
        updateDailyStats();
        updateHistoricalPrices(SYMBOL);
    });

    setInterval(checkPriceChange, 1000);  // 每秒運行一次
    setInterval(updatePrices, 60000);  // 每分鐘運行一次
    setInterval(updateDailyStats, 60000);  // 每分鐘更新一次當日最高價和最低價
    setInterval(() => updateHistoricalPrices(SYMBOL), 60000); // 每分鐘更新歷史價格

    checkPriceChange();  // 初始運行一次
    updatePrices();  // 初始運行一次
    updateDailyStats();  // 初始運行一次
    updateHistoricalPrices(SYMBOL);  // 初始運行一次
});
