import { useEffect, useRef, useCallback, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { newsAPI } from '../api/news.api';
import { API_BASE } from '../constants/shared';

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const COLORS = [
  { hex: '#ED1C1F', label: 'Đỏ' },
  { hex: '#172339', label: 'Xanh đen' },
];

// SVG icons for alignment (Solar pack thiếu align-center)
const AlignLeftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <rect x="3" y="4"  width="18" height="2.5" rx="1.25"/>
    <rect x="3" y="9"  width="12" height="2.5" rx="1.25"/>
    <rect x="3" y="14" width="18" height="2.5" rx="1.25"/>
    <rect x="3" y="19" width="12" height="2.5" rx="1.25"/>
  </svg>
);
const AlignCenterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <rect x="3" y="4"  width="18" height="2.5" rx="1.25"/>
    <rect x="6" y="9"  width="12" height="2.5" rx="1.25"/>
    <rect x="3" y="14" width="18" height="2.5" rx="1.25"/>
    <rect x="6" y="19" width="12" height="2.5" rx="1.25"/>
  </svg>
);
const AlignRightIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <rect x="3" y="4"  width="18" height="2.5" rx="1.25"/>
    <rect x="9" y="9"  width="12" height="2.5" rx="1.25"/>
    <rect x="3" y="14" width="18" height="2.5" rx="1.25"/>
    <rect x="9" y="19" width="12" height="2.5" rx="1.25"/>
  </svg>
);

// Modal nhỏ dùng chung cho Button chèn vào editor
interface ButtonModalState {
  open: boolean;
  label: string;
  url: string;
}

export default function QuillEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = 240,
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const isInternalUpdate = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [btnModal, setBtnModal] = useState<ButtonModalState>({ open: false, label: '', url: '' });

  onChangeRef.current = onChange;

  // Set initial content once
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalUpdate.current = true;
    el.innerHTML = value || '';
    isInternalUpdate.current = false;
  }, []);

  // Sync when value changes externally (edit modal open)
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalUpdate.current) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalUpdate.current = true;
    const html = el.innerHTML;
    onChangeRef.current(html === '<br>' ? '' : html);
    isInternalUpdate.current = false;
  }, []);

  /** Save cursor position before editor loses focus (e.g. clicking toolbar) */
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  /** Restore cursor and return the range */
  const restoreSelection = (): Range | null => {
    const sel = window.getSelection();
    const range = savedRangeRef.current;
    if (range && sel) {
      sel.removeAllRanges();
      sel.addRange(range);
      return range;
    }
    return null;
  };

  const execCmd = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    emitChange();
  }, [emitChange]);

  const applyBlock = useCallback((tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    emitChange();
  }, [emitChange]);

  const applyColor = useCallback((hex: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, hex);
    emitChange();
  }, [emitChange]);

  // ── Image ────────────────────────────────────────────────────
  const handleImageButtonClick = () => {
    saveSelection();
    imageInputRef.current?.click();
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImgUploading(true);
    try {
      const url = await newsAPI.uploadImage(file);
      const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

      const range = restoreSelection();
      const img = document.createElement('img');
      img.src = fullUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '6px';
      img.style.margin = '4px 0';

      if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else {
        editorRef.current?.appendChild(img);
      }
      emitChange();
      toast.success('Đã chèn ảnh');
    } catch {
      toast.error('Tải ảnh lên thất bại');
    } finally {
      setImgUploading(false);
    }
  };

  // ── Button ───────────────────────────────────────────────────
  const openBtnModal = () => {
    saveSelection();
    setBtnModal({ open: true, label: '', url: '' });
  };

  const insertButton = () => {
    if (!btnModal.label.trim() || !btnModal.url.trim()) {
      toast.error('Vui lòng nhập đủ văn bản và URL');
      return;
    }
    const rawUrl = btnModal.url.trim();
    const safeUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const html = `<div style="text-align:center;margin:12px 0;"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:8px 24px;border-radius:24px;background:#C6010B;color:#fff;text-decoration:none;font-weight:500;font-size:16px;line-height:24px;font-family:Montserrat,sans-serif;">${btnModal.label}</a></div>`;
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    emitChange();
    setBtnModal({ open: false, label: '', url: '' });
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const tbBtn = 'w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors';
  const divider = <div className="w-px h-5 bg-gray-300 dark:bg-gray-500 mx-0.5" />;

  return (
    <>
      <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        {/* Scrollable container — toolbar sticks inside this */}
        <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">

          {/* Heading buttons */}
          <button type="button" title="Tiêu đề (18px)" onMouseDown={(e) => { e.preventDefault(); applyBlock('h3'); }} className={tbBtn + ' text-xs font-bold w-auto px-1.5'}>H3</button>
          <button type="button" title="Chữ thường (16px)" onMouseDown={(e) => { e.preventDefault(); applyBlock('p'); }} className={tbBtn + ' text-xs w-auto px-1.5'}>¶</button>

          {divider}

          {/* Bold / Italic / Underline */}
          <button type="button" title="In đậm" onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className={tbBtn}>
            <Icon icon="solar:text-bold-outline" className="h-4 w-4" />
          </button>
          <button type="button" title="In nghiêng" onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className={tbBtn}>
            <Icon icon="solar:text-italic-outline" className="h-4 w-4" />
          </button>
          <button type="button" title="Gạch chân" onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className={tbBtn}>
            <Icon icon="solar:text-underline-outline" className="h-4 w-4" />
          </button>

          {divider}

          {/* Text color — 2 fixed colors */}
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={`Màu chữ ${c.label}`}
                onMouseDown={(e) => { e.preventDefault(); applyColor(c.hex); }}
                className="w-6 h-6 rounded-full border-2 border-white shadow ring-1 ring-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-0.5">Màu chữ</span>
          </div>

          {divider}

          {/* Lists */}
          <button type="button" title="Danh sách có số" onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} className={tbBtn}>
            <Icon icon="solar:list-check-outline" className="h-4 w-4" />
          </button>
          <button type="button" title="Danh sách chấm tròn" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className={tbBtn}>
            <Icon icon="solar:list-outline" className="h-4 w-4" />
          </button>

          {divider}

          {/* Alignment */}
          <button type="button" title="Căn trái" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} className={tbBtn}>
            <AlignLeftIcon />
          </button>
          <button type="button" title="Căn giữa" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} className={tbBtn}>
            <AlignCenterIcon />
          </button>
          <button type="button" title="Căn phải" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} className={tbBtn}>
            <AlignRightIcon />
          </button>

          {divider}

          {/* Link */}
          <button
            type="button"
            title="Chèn liên kết"
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); const url = prompt('Nhập URL liên kết:'); if (url) { restoreSelection(); execCmd('createLink', url); } }}
            className={tbBtn}
          >
            <Icon icon="solar:link-outline" className="h-4 w-4" />
          </button>

          {/* Image */}
          <button
            type="button"
            title="Chèn ảnh"
            disabled={imgUploading}
            onMouseDown={(e) => { e.preventDefault(); handleImageButtonClick(); }}
            className={tbBtn + (imgUploading ? ' opacity-50 cursor-wait' : '')}
          >
            {imgUploading
              ? <Icon icon="solar:refresh-circle-outline" className="h-4 w-4 animate-spin" />
              : <Icon icon="solar:gallery-add-outline" className="h-4 w-4" />}
          </button>

          {/* Button */}
          <button
            type="button"
            title="Chèn button"
            onMouseDown={(e) => { e.preventDefault(); openBtnModal(); }}
            className={tbBtn}
          >
            <Icon icon="solar:cursor-square-outline" className="h-4 w-4" />
          </button>

          {divider}

          {/* Clear format */}
          <button type="button" title="Xóa định dạng" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }} className={tbBtn}>
            <Icon icon="solar:eraser-outline" className="h-4 w-4" />
          </button>
        </div>

        {/* Editor area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          style={{ minHeight, fontSize: 16 }}
          className={[
            'px-3 py-2 text-gray-900 dark:text-white',
            'bg-white dark:bg-gray-800',
            'focus:outline-none',
            '[&_p]:text-base [&_p]:leading-relaxed',
            '[&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:my-1.5',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
            '[&_a]:text-blue-600 [&_a]:underline',
            '[&[data-placeholder]:empty]:before:content-[attr(data-placeholder)]',
            '[&[data-placeholder]:empty]:before:text-gray-400',
            '[&[data-placeholder]:empty]:before:pointer-events-none',
          ].join(' ')}
        />

        </div>{/* end scroll container */}

        {/* Hidden file input for inline image */}
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      </div>

      {/* Button insert modal */}
      {btnModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Chèn Button</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Văn bản hiển thị *</label>
                <input
                  autoFocus
                  type="text"
                  value={btnModal.label}
                  onChange={(e) => setBtnModal((s) => ({ ...s, label: e.target.value }))}
                  placeholder="VD: Đăng ký ngay"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">URL liên kết *</label>
                <input
                  type="text"
                  value={btnModal.url}
                  onChange={(e) => setBtnModal((s) => ({ ...s, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyDown={(e) => { if (e.key === 'Enter') insertButton(); }}
                />
              </div>
              {/* Preview */}
              {btnModal.label && (
                <div className="pt-1">
                  <p className="text-xs text-gray-400 mb-1">Preview:</p>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 24px', borderRadius: 24, background: '#C6010B', color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: 16, lineHeight: '24px', fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {btnModal.label}
                  </a>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setBtnModal({ open: false, label: '', url: '' })}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={insertButton}
                className="px-4 py-2 text-sm rounded-lg bg-[#ED1C1F] text-white font-semibold hover:bg-red-700"
              >
                Chèn button
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
