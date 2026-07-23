'use client';
// ThemeToggle — ปุ่มสลับโหมดมืด/สว่าง (จำค่าไว้ใน localStorage)
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const el = document.documentElement;
    if (next) { el.setAttribute('data-theme', 'dark'); try { localStorage.setItem('voc-theme', 'dark'); } catch {} }
    else { el.removeAttribute('data-theme'); try { localStorage.setItem('voc-theme', 'light'); } catch {} }
  }

  return (
    <button className="theme-toggle" onClick={toggle} title="สลับโหมดมืด/สว่าง">
      {dark ? '☀️ โหมดสว่าง' : '🌙 โหมดมืด'}
    </button>
  );
}
