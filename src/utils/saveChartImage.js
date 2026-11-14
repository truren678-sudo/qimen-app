// 將排盤畫面輸出為 PNG：手機優先用系統分享（可直接存到相簿），其餘情況下載檔案

function pad(n) { return String(n).padStart(2, '0'); }

export function buildChartImageName(result) {
    const { solar, chartType } = result;
    return `奇門_${chartType}_${solar.year}-${pad(solar.month)}-${pad(solar.day)}_${pad(solar.hour)}${pad(solar.minute)}.png`;
}

function isTouchDevice() {
    return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
}

/**
 * @returns {Promise<'shared'|'downloaded'|'cancelled'>}
 */
// 以標記 data-capture-bounds 的內容範圍為準，左右各留邊距，裁掉兩側空白
function getContentBounds(node, padding) {
    const base = node.getBoundingClientRect();
    let left = Infinity, right = -Infinity;
    node.querySelectorAll('[data-capture-bounds]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        left = Math.min(left, r.left - base.left);
        right = Math.max(right, r.right - base.left);
    });
    if (!Number.isFinite(left)) return { x: 0, width: base.width };
    const x = Math.max(0, left - padding);
    return { x, width: Math.min(base.width, right + padding) - x };
}

async function renderChartBlob(node) {
    const { toCanvas } = await import('html-to-image');
    const width = node.offsetWidth;
    if (!width) throw new Error('盤面尚未顯示');
    const bounds = getContentBounds(node, 24);
    // 手機上盤面會縮小顯示，依內容寬度提高解析度，輸出寬約 1200px 的清晰圖片
    const pixelRatio = Math.min(4, Math.max(2, 1200 / bounds.width));
    const full = await toCanvas(node, {
        pixelRatio,
        backgroundColor: '#f2f4f7',
        cacheBust: true,
        filter: el => !(el instanceof HTMLElement && el.dataset.noCapture !== undefined),
    });

    const scale = full.width / width;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bounds.width * scale);
    canvas.height = full.height;
    canvas.getContext('2d').drawImage(full, Math.round(bounds.x * scale), 0, canvas.width, full.height, 0, 0, canvas.width, full.height);
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('圖片產生失敗'))), 'image/png'));
}

export async function saveChartImage(node, filename) {
    const blob = await renderChartBlob(node);

    const file = new File([blob], filename, { type: 'image/png' });
    if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: filename });
            return 'shared';
        } catch (err) {
            if (err?.name === 'AbortError') return 'cancelled';
            // 分享失敗則改為下載
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
}
