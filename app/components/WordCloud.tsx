// components/WordCloud.tsx — คำที่พูดถึงมาก = ตัวใหญ่, คลิกคำเพื่อค้นหา (Server Component)
import Link from 'next/link';

const PAL = ['#1f3a93', '#2e6cf0', '#16a34a', '#0e7c86', '#475569', '#0ea5e9', '#8b5cf6', '#64748b', '#0369a1'];

export default function WordCloud({ freq, basePath }: { freq: [string, number][]; basePath: string }) {
  if (!freq.length) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>ไม่มีคำเด่นในชุดข้อมูลนี้</span>;
  const vals = freq.map(p => p[1]);
  const mx = Math.max(...vals), mn = Math.min(...vals);
  // สลับลำดับแบบคงที่ (interleave) ให้คำใหญ่กระจายตัว ไม่กองซ้ายบน
  const mixed: [string, number][] = [];
  for (let i = 0, j = freq.length - 1; i <= j; i++, j--) {
    mixed.push(freq[i]); if (i !== j) mixed.push(freq[j]);
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'baseline', lineHeight: 1.5 }}>
      {mixed.map(([w, n], i) => {
        const sz = 14 + Math.round((n - mn) / ((mx - mn) || 1) * 30);
        const fw = sz > 30 ? 700 : sz > 22 ? 600 : 500;
        return (
          <Link key={w} href={`${basePath}?q=${encodeURIComponent(w)}`}
            title={`${n} รายการ — คลิกเพื่อค้นหา`}
            style={{ fontSize: sz, color: PAL[i % PAL.length], fontWeight: fw, textDecoration: 'none' }}>
            {w}
          </Link>
        );
      })}
    </div>
  );
}
