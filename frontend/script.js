// Configuration
const config = {
    backendUrl: 'https://syedasimpasha.pythonanywhere.com/analyze',
    defaultAsset: 'BTC-USD',
    typingDelay: 800,
    errorMessage: 'Unable to process request. Please try again later.'
};

// DOM Elements
const messageContainer = document.getElementById('messageContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Initialize Chatbot
function initChatbot() {
    addEventListeners();
    showSystemMessage('Welcome! Ask me about stocks, crypto, or commodities.');
}

// Event Listeners
function addEventListeners() {
    sendButton.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserMessage();
        }
    });
}

// Message Handling
async function handleUserMessage() {
    const query = userInput.value.trim();
    if (!query) return;

    addMessage(query, 'user');
    userInput.value = '';
    showLoading(true);

    try {
        const analysis = await fetchAnalysis(query);
        displayAnalysis(analysis);
    } catch (error) {
        showError(config.errorMessage);
    } finally {
        showLoading(false);
    }
}

// API Communication
async function fetchAnalysis(query) {
    const response = await fetch(config.backendUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            symbol: extractSymbol(query),
            type: detectAssetType(query),
            timeframe: detectTimeframe(query)
        })
    });

    if (!response.ok) throw new Error('API Error');
    return response.json();
}

// Message Display
function displayAnalysis(data) {
    if (data.error) {
        showError(data.error);
        return;
    }

    const message = `
        <div class="analysis-result">
            <p><strong>Current Price:</strong> $${data.current_price}</p>
            <p><strong>24h Change:</strong> ${data.change?.toFixed(2) || 0}%</p>
            <div class="predictions">
                <h4>Predictions:</h4>
                <p>Intraday: $${data.predictions.intraday}</p>
                <p>Short-term: $${data.predictions.short_term}</p>
                <p>Long-term: $${data.predictions.long_term}</p>
            </div>
        </div>
    `;

    addMessage(message, 'bot');
}

// NLP Functions
function extractSymbol(query) {
    const symbolMap = {
        'bitcoin': 'BTC-USD',
        'apple': 'AAPL',
        'gold': 'GC=F',
        'silver': 'SI=F',
        'oil': 'CL=F'
    };
    
    const lowerQuery = query.toLowerCase();
    return Object.entries(symbolMap).reduce((acc, [key, symbol]) => 
        lowerQuery.includes(key) ? symbol : acc, config.defaultAsset);
}

function detectAssetType(query) {
    const lowerQuery = query.toLowerCase();
    if (/stock|equity|share|nasdaq|nyse/i.test(lowerQuery)) return 'stock';
    if (/crypto|bitcoin|eth|blockchain/i.test(lowerQuery)) return 'crypto';
    if (/gold|silver|oil|commodity/i.test(lowerQuery)) return 'commodity';
    if (/forex|currency|usd|eur/i.test(lowerQuery)) return 'forex';
    return 'crypto';
}

function detectTimeframe(query) {
    const lowerQuery = query.toLowerCase();
    if (/intraday|today|day trading/i.test(lowerQuery)) return 'intraday';
    if (/short term|next week|weekly/i.test(lowerQuery)) return 'short_term';
    if (/long term|yearly|annual/i.test(lowerQuery)) return 'long_term';
    return 'intraday';
}

// UI Helpers
function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${type}-message`;
    messageDiv.innerHTML = content;
    messageContainer.appendChild(messageDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

function showLoading(show) {
    const loader = document.querySelector('.loading-indicator');
    if (show) {
        loader.style.display = 'block';
    } else {
        loader.style.display = 'none';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message-bubble error-message';
    errorDiv.textContent = message;
    messageContainer.appendChild(errorDiv);
}

function showSystemMessage(message) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'message-bubble system-message';
    systemDiv.textContent = message;
    messageContainer.appendChild(systemDiv);
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', initChatbot);
