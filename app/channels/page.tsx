import Link from 'next/link';
import { channelStats, sentimentStats } from '../../lib/data';

export const dynamic = 'force-dynamic';

// ไอคอนประจำช่องทาง (ตาม prototype)
const ICON: Record<string, string> = {
  'Social Media': '👍',
  'Website / Email / DB': '🌐',
  'ทีมรณรงค์ขาย': '🧑‍💼',
  'ฝ่ายงานสำนักงานใหญ่': '🏢',
  'สำนักงานสาขาทั่วประเทศ': '📍',
  'Call Center': '🎧',
  'ระบบร้องเรียน/ข้อเสนอแนะ': '📣',
  'แบบประเมินความพึงพอใจ': '📝',
};

export default async function Channels() {
  const [chans, s] = await Promise.all([channelStats(), sentimentStats()]);
  const total = chans.reduce((a, c) => a + c.count, 0);
  const maxCount = Math.max(...chans.map(c => c.count), 1);

  return (
    <>
      <header className="top">
        <h1>8 ช่องทางรับฟังลูกค้า</h1>
        <div className="sub">คลิกการ์ดช่องทางเพื่อดูแดชบอร์ดเฉพาะช่องทาง · รวม {total.toLocaleString()} รายการ</div>
      </header>
      <div className="content">
        {/* ภาพรวมทั้ง 8 ช่องทาง */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <h3>🥧 สัดส่วน Sentiment (ภาพรวมทั้ง 8 ช่องทาง)</h3>
            {([['เชิงบวก', s.Positive, s.posPct, '#16a34a'], ['เป็นกลาง', s.Neutral, s.neuPct, '#64748b'], ['เชิงลบ', s.Negative, s.negPct, '#dc2626']] as const).map(([lab, n, pct, col]) => (
              <div key={lab} style={{ margin: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                  <span>{lab}</span><span style={{ fontWeight: 600 }}>{n} ({pct}%)</span>
                </div>
                <div style={{ height: 8, background: '#eef2f7', borderRadius: 6 }}>
                  <div style={{ width: pct + '%', height: '100%', background: col, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: 0 }}>
            <h3>📥 เสียงลูกค้าแยกตาม 8 ช่องทาง</h3>
            {chans.map(c => (
              <div key={c.name} style={{ margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3 }}>
                  <span>{ICON[c.name]} {c.name}</span><span style={{ fontWeight: 600 }}>{c.count.toLocaleString()}</span>
                </div>
                <div style={{ height: 7, background: '#eef2f7', borderRadius: 6 }}>
                  <div style={{ width: Math.round(c.count / maxCount * 100) + '%', height: '100%', background: '#2e6cf0', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* การ์ด 8 ช่องทาง */}
        <div className="card" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: 8 }}>
          <h3>📋 8 ช่องทางรับฟังลูกค้า <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12 }}>— คลิกการ์ดเพื่อดูแดชบอร์ดเฉพาะช่องทาง</span></h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
          {chans.map((c, i) => (
            <Link key={c.name} href={'/channels/' + encodeURIComponent(c.name)} className="card"
              style={{ display: 'block', cursor: 'pointer', marginBottom: 0 }}>
              <h3 style={{ marginBottom: 8, fontSize: 14 }}><span style={{ fontSize: 18, marginRight: 6 }}>{ICON[c.name]}</span>{i + 1}. {c.name}</h3>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1f3a93' }}>{c.count.toLocaleString()}<span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}> รายการ</span></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12 }}>
                <span>เชิงบวก <b style={{ color: '#16a34a' }}>{c.posPct}%</b></span>
                <span>กลาง <b style={{ color: '#475569' }}>{c.neuPct}%</b></span>
                <span>เชิงลบ <b style={{ color: c.negPct > 20 ? '#dc2626' : '#f59e0b' }}>{c.negPct}%</b></span>
              </div>
              <div style={{ fontSize: 11.5, color: '#2e6cf0', marginTop: 8 }}>ดูรายละเอียด →</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
