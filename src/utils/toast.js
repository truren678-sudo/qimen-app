// 輕量提示：畫面下方短暫顯示訊息後自動消失，不打斷操作（取代 alert）
let hideTimer = null;

export function showToast(message, duration = 2000) {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('app-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'app-toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.style.cssText = [
            'position:fixed', 'left:50%', 'bottom:88px', 'transform:translateX(-50%)',
            'z-index:9999', 'max-width:calc(100vw - 32px)', 'padding:8px 16px',
            'border-radius:8px', 'background:rgba(31,41,55,0.92)', 'color:#fff',
            'font-size:14px', 'line-height:1.4', 'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
            'pointer-events:none', 'transition:opacity .2s', 'opacity:0',
        ].join(';');
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.opacity = '1';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { el.style.opacity = '0'; }, duration);
}
