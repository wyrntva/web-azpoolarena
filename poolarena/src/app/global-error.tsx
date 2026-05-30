'use client';

import { useEffect } from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Tự động reload 1 lần để lấy JS mới nhất (fix deployment mismatch)
    // sessionStorage đảm bảo không reload vô tận nếu lỗi thật sự
    const RELOAD_KEY = 'global_error_reloaded';
    const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);

    if (!alreadyReloaded) {
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
    }
  }, []);

  return (
    <html>
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'sans-serif',
          background: '#0a0a0a',
          color: '#fff',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <h2 style={{ marginBottom: '0.5rem' }}>Đã xảy ra lỗi</h2>
        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
          Vui lòng thử lại
        </p>
        <button
          onClick={() => {
            sessionStorage.removeItem('global_error_reloaded');
            window.location.reload();
          }}
          style={{
            padding: '0.6rem 1.5rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          Tải lại trang
        </button>
      </body>
    </html>
  );
}
