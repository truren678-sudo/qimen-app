import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { buildNoteKey, buildNoteTitle, compressImage, getNote, saveNote } from '../utils/chartNotes';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function ChartNotesModal({ result, onClose, onSaved }) {
    const titleId = useId();
    const key = useMemo(() => buildNoteKey(result), [result]);
    const [text, setText] = useState('');
    const [images, setImages] = useState([]); // [{ id, blob }]
    const [status, setStatus] = useState('loading'); // loading | idle | saving | saved | error
    const [viewing, setViewing] = useState(null);
    const fileRef = useRef(null);
    const textareaRef = useRef(null);
    const dirtyRef = useRef(false); // 只有使用者修改過才自動儲存
    const createdAtRef = useRef(null);
    const latest = useRef({});
    useEffect(() => { latest.current = { key, result, onSaved, text, images }; });

    // 載入此盤的筆記
    useEffect(() => {
        let cancelled = false;
        dirtyRef.current = false;
        getNote(key).then(note => {
            if (cancelled) return;
            setText(note?.text || '');
            setImages(note?.images || []);
            createdAtRef.current = note?.createdAt || null;
            setStatus('idle');
            textareaRef.current?.focus();
        }).catch(() => !cancelled && setStatus('error'));
        return () => { cancelled = true; };
    }, [key]);

    // 自動儲存（停止輸入 0.6 秒後）
    useEffect(() => {
        if (!dirtyRef.current) return undefined;
        const timer = setTimeout(() => {
            const { key: k, result: r, onSaved: cb } = latest.current;
            const createdAt = createdAtRef.current || Date.now();
            createdAtRef.current = createdAt;
            saveNote({ key: k, title: buildNoteTitle(r), text, images, createdAt })
                .then(() => { dirtyRef.current = false; setStatus('saved'); cb?.(text.trim().length > 0 || images.length > 0); })
                .catch(() => setStatus('error'));
        }, 600);
        return () => clearTimeout(timer);
    }, [text, images]);

    // 關閉視窗時若還有未儲存的修改，立即寫入
    useEffect(() => () => {
        if (!dirtyRef.current) return;
        const { key: k, result: r, onSaved: cb, text: t, images: imgs } = latest.current;
        saveNote({ key: k, title: buildNoteTitle(r), text: t, images: imgs, createdAt: createdAtRef.current || Date.now() })
            .then(() => cb?.(t.trim().length > 0 || imgs.length > 0))
            .catch(() => {});
    }, []);

    // 圖片預覽網址
    const urls = useMemo(() => Object.fromEntries(images.map(img => [img.id, URL.createObjectURL(img.blob)])), [images]);
    useEffect(() => () => Object.values(urls).forEach(u => URL.revokeObjectURL(u)), [urls]);

    useEffect(() => {
        const onKey = e => {
            if (e.key !== 'Escape') return;
            if (viewing) setViewing(null); else onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [viewing, onClose]);

    const markDirty = () => { dirtyRef.current = true; setStatus('saving'); };

    const handleFiles = async fileList => {
        const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
        if (files.length === 0) return;
        try {
            const added = await Promise.all(files.map(async f => ({ id: newId(), blob: await compressImage(f) })));
            markDirty();
            setImages(prev => [...prev, ...added]);
        } catch {
            setStatus('error');
        }
    };

    const statusText = { loading: '載入中…', idle: '', saving: '儲存中…', saved: '已自動儲存', error: '儲存失敗，請再試一次' }[status];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative bg-white w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
                <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
                    <div className="min-w-0">
                        <h2 id={titleId} className="text-lg font-bold text-gray-800">📝 盤局筆記</h2>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{buildNoteTitle(result)}</p>
                    </div>
                    <button onClick={onClose} aria-label="關閉筆記" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => { markDirty(); setText(e.target.value); }}
                        onPaste={e => {
                            const files = Array.from(e.clipboardData?.files || []);
                            if (files.length) { e.preventDefault(); handleFiles(files); }
                        }}
                        disabled={status === 'loading'}
                        placeholder="記錄這個盤的問題、判斷、後續應驗…（可直接貼上或拖曳圖片）"
                        aria-label="筆記內容"
                        className="w-full min-h-[160px] border border-gray-300 rounded-lg p-3 text-[15px] leading-relaxed focus:outline-none focus:border-[#4395CA] resize-y"
                    />

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-gray-700">圖片（{images.length}）</h3>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="text-sm text-[#4395CA] border border-[#4395CA] rounded-md px-3 py-1 hover:bg-blue-50"
                            >
                                ＋ 上傳圖片
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
                        </div>
                        {images.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {images.map(img => (
                                    <div key={img.id} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                                        <button type="button" onClick={() => setViewing(img.id)} className="w-full h-full" aria-label="放大檢視圖片">
                                            <img src={urls[img.id]} alt="" className="w-full h-full object-cover" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { markDirty(); setImages(prev => prev.filter(x => x.id !== img.id)); }}
                                            aria-label="刪除圖片"
                                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80"
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400">尚無圖片。可上傳截圖、照片等與此盤相關的資料。</p>
                        )}
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className={status === 'error' ? 'text-red-600' : 'text-gray-400'} role="status">{statusText}</span>
                    <span className="text-gray-400">筆記只存在這台裝置的瀏覽器中</span>
                </div>

                {viewing && urls[viewing] && (
                    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
                        <img src={urls[viewing]} alt="" className="max-w-full max-h-full object-contain" />
                        <button onClick={() => setViewing(null)} aria-label="關閉圖片" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white text-2xl leading-none">×</button>
                    </div>
                )}
            </div>
        </div>
    );
}
