// =============================================
// PixelGet — Main Script
// =============================================

const WORKER_ENDPOINT = 'https://pixelgetbypas.antarahimmuhammad.workers.dev';
const HISTORY_KEY = 'pixelget_history';
const MAX_HISTORY = 10;

// DOM Elements
const inputTextarea = document.getElementById('input');
const outputContainer = document.getElementById('outputContainer');
const generateBtn = document.getElementById('generateBtn');
const validateBtn = document.getElementById('validateBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const toggleQrBtn = document.getElementById('toggleQrBtn');
const exportBtn = document.getElementById('exportBtn');
const historyContainer = document.getElementById('historyContainer');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');

// State
let generatedLinks = [];
let qrVisible = false;

// ---- URL Parsing ----
const PIXELDRAIN_REGEX = {
    file: /(?:https?:\/\/)?(?:www\.)?pixeldrain\.com\/u\/([a-zA-Z0-9_-]+)/gi,
    list: /(?:https?:\/\/)?(?:www\.)?pixeldrain\.com\/l\/([a-zA-Z0-9_-]+)/gi,
    dir: /(?:https?:\/\/)?(?:www\.)?pixeldrain\.com\/d\/([a-zA-Z0-9_-]+)/gi
};

function parsePixelDrainUrls(text) {
    const results = [];
    const seen = new Set();

    // File links (/u/)
    const fileMatches = [...text.matchAll(PIXELDRAIN_REGEX.file)];
    fileMatches.forEach(match => {
        const id = match[1];
        if (!seen.has(id)) {
            seen.add(id);
            results.push({
                id,
                type: 'file',
                originalUrl: match[0],
                cdnUrl: `https://cdn.pixeldrain.eu.cc/${id}`
            });
        }
    });

    // List/Album links (/l/)
    const listMatches = [...text.matchAll(PIXELDRAIN_REGEX.list)];
    listMatches.forEach(match => {
        const id = match[1];
        if (!seen.has(id)) {
            seen.add(id);
            results.push({
                id,
                type: 'list',
                originalUrl: match[0],
                cdnUrl: `https://cdn.pixeldrain.eu.cc/l/${id}`
            });
        }
    });

    // Directory links (/d/)
    const dirMatches = [...text.matchAll(PIXELDRAIN_REGEX.dir)];
    dirMatches.forEach(match => {
        const id = match[1];
        if (!seen.has(id)) {
            seen.add(id);
            results.push({
                id,
                type: 'dir',
                originalUrl: match[0],
                cdnUrl: `https://cdn.pixeldrain.eu.cc/d/${id}`
            });
        }
    });

    return results;
}

// ---- Generate Links ----
generateBtn.addEventListener('click', () => {
    const inputText = inputTextarea.value.trim();

    if (!inputText) {
        showStatus('Input is empty', 'err');
        return;
    }

    const parsed = parsePixelDrainUrls(inputText);

    if (parsed.length === 0) {
        showStatus('No valid PixelDrain URLs found', 'err');
        return;
    }

    generatedLinks = parsed;
    renderLinks();
    saveToHistory(parsed);
    showStatus(`Generated ${parsed.length} link(s)`, 'ok');
    copyAllBtn.disabled = false;
});

// ---- Render Links ----
function renderLinks() {
    outputContainer.innerHTML = '';

    generatedLinks.forEach((link, index) => {
        const card = document.createElement('div');
        card.className = 'link-card';
        card.dataset.index = index;

        const typeLabel = {
            file: 'FILE',
            list: 'ALBUM',
            dir: 'FOLDER'
        }[link.type];

        card.innerHTML = `
            <div class="link-card-header">
                <a href="${link.cdnUrl}" target="_blank" class="link-card-url" title="${link.cdnUrl}">
                    ${link.cdnUrl}
                </a>
                <span class="link-status status-${link.status || 'unknown'}" data-index="${index}">
                    ${typeLabel}
                </span>
            </div>
            <div class="link-actions">
                <button class="link-action-btn copy-link-btn" data-index="${index}">
                    <svg viewBox="0 0 24 24" width="13" height="13">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy
                </button>
                <button class="link-action-btn qr-link-btn" data-index="${index}">
                    <svg viewBox="0 0 24 24" width="13" height="13">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    QR
                </button>
            </div>
            <div class="qr-wrapper" data-index="${index}"></div>
        `;

        outputContainer.appendChild(card);
    });

    attachLinkEventListeners();
}

// ---- Link Event Listeners ----
function attachLinkEventListeners() {
    // Copy individual link
    document.querySelectorAll('.copy-link-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            const url = generatedLinks[index].cdnUrl;
            copyToClipboard(url, btn);
        });
    });

    // Toggle QR for individual link
    document.querySelectorAll('.qr-link-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            toggleQrForLink(index);
        });
    });
}

// ---- QR Code ----
function toggleQrForLink(index) {
    const wrapper = document.querySelector(`.qr-wrapper[data-index="${index}"]`);
    
    if (wrapper.classList.contains('visible')) {
        wrapper.classList.remove('visible');
        wrapper.innerHTML = '';
    } else {
        wrapper.classList.add('visible');
        const canvas = document.createElement('canvas');
        wrapper.appendChild(canvas);
        
        QRCode.toCanvas(canvas, generatedLinks[index].cdnUrl, {
            width: 160,
            margin: 1,
            color: {
                dark: '#d4d4d8',
                light: '#1a1a1c'
            }
        });
    }
}

toggleQrBtn.addEventListener('click', () => {
    qrVisible = !qrVisible;
    document.querySelectorAll('.qr-wrapper').forEach((wrapper, index) => {
        if (qrVisible && !wrapper.classList.contains('visible')) {
            wrapper.classList.add('visible');
            const canvas = document.createElement('canvas');
            wrapper.appendChild(canvas);
            
            QRCode.toCanvas(canvas, generatedLinks[index].cdnUrl, {
                width: 160,
                margin: 1,
                color: {
                    dark: '#d4d4d8',
                    light: '#1a1a1c'
                }
            });
        } else if (!qrVisible) {
            wrapper.classList.remove('visible');
            wrapper.innerHTML = '';
        }
    });
});

// ---- Validation ----
validateBtn.addEventListener('click', async () => {
    if (generatedLinks.length === 0) {
        showStatus('Generate links first', 'err');
        return;
    }

    showStatus('Validating links...', 'ok');
    validateBtn.disabled = true;

    for (let i = 0; i < generatedLinks.length; i++) {
        const link = generatedLinks[i];
        const statusEl = document.querySelector(`.link-status[data-index="${i}"]`);
        
        statusEl.className = 'link-status status-checking';
        statusEl.textContent = 'CHECKING...';

        try {
            // Call CF Worker untuk validasi (bypass CORS)
            const response = await fetch(`${WORKER_ENDPOINT}?url=${encodeURIComponent(link.cdnUrl)}`, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });

            const data = await response.json();

            if (data.ok) {
                link.status = 'ok';
                statusEl.className = 'link-status status-ok';
                statusEl.textContent = 'OK';
            } else {
                link.status = 'error';
                statusEl.className = 'link-status status-error';
                statusEl.textContent = 'FAILED';
            }
        } catch (err) {
            // Fallback: ga bisa validasi, anggap ok aja
            link.status = 'unknown';
            statusEl.className = 'link-status status-ok';
            statusEl.textContent = link.type === 'file' ? 'FILE' : link.type === 'list' ? 'ALBUM' : 'FOLDER';
        }
    }

    validateBtn.disabled = false;
    showStatus('Validation complete', 'ok');
});

// ---- Copy Functions ----
copyAllBtn.addEventListener('click', () => {
    const allUrls = generatedLinks.map(l => l.cdnUrl).join('\n');
    copyToClipboard(allUrls, copyAllBtn);
});

async function copyToClipboard(text, buttonEl) {
    try {
        await navigator.clipboard.writeText(text);
        
        const originalHTML = buttonEl.innerHTML;
        buttonEl.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Copied
        `;
        buttonEl.style.opacity = '0.7';
        
        setTimeout(() => {
            buttonEl.innerHTML = originalHTML;
            buttonEl.style.opacity = '1';
        }, 1500);
    } catch (err) {
        showStatus('Failed to copy', 'err');
    }
}

// ---- Export ----
exportBtn.addEventListener('click', () => {
    if (generatedLinks.length === 0) {
        showStatus('No links to export', 'err');
        return;
    }

    const content = generatedLinks.map(l => l.cdnUrl).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelget-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showStatus('Exported to TXT file', 'ok');
});

// ---- History ----
function saveToHistory(links) {
    const history = getHistory();
    const entry = {
        timestamp: Date.now(),
        urls: links.map(l => l.originalUrl),
        count: links.length
    };
    
    history.unshift(entry);
    if (history.length > MAX_HISTORY) {
        history.pop();
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
        return [];
    }
}

function renderHistory() {
    const history = getHistory();
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-state small"><p>No history yet</p></div>';
        return;
    }
    
    historyContainer.innerHTML = '';
    
    history.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const time = new Date(entry.timestamp);
        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        const urlsPreview = entry.urls[0] || '';
        
        item.innerHTML = `
            <span class="history-item-time">${timeStr}</span>
            <span class="history-item-urls">${urlsPreview}</span>
            <span class="history-item-count">${entry.count}x</span>
        `;
        
        item.addEventListener('click', () => {
            inputTextarea.value = entry.urls.join('\n');
            showStatus('History loaded', 'ok');
        });
        
        historyContainer.appendChild(item);
    });
}

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all history?')) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
        showStatus('History cleared', 'ok');
    }
});

// ---- Status Bar ----
function showStatus(message, type = 'ok') {
    statusText.textContent = message;
    statusBar.className = `status-bar ${type}`;
    statusBar.classList.remove('hidden');
    
    setTimeout(() => {
        statusBar.classList.add('hidden');
    }, 3000);
}

// ---- Keyboard Shortcuts ----
inputTextarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        generateBtn.click();
    }
});

// ---- Init ----
renderHistory();

// ---- Service Worker (PWA) ----
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed:', err));
    });
}
