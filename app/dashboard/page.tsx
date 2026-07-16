import Link from 'next/link';
import { listVOC, pipelineStats, sentimentStats, channelStats, CASE_STATUS, Voc } from '../../lib/data';

export const dynamic = 'force-dynamic';

const COL: Record<string,string> = {
  'รับเรื่อง':'#94a3b8','ส่งต่อหน่วยงานที่รับผิดชอบ':'#4aa3ff','กำลังดำเนินการ':'#2e6cf0',
  'รอข้อมูลเพิ่มเติม':'#f59e0b','ติดตามผล':'#8b5cf6','ดำเนินการเสร็จ/ปิดเรื่อง':'#16a34a'
};

// sparkline SVG เล็ก ๆ สำหรับการ์ดเวลา
function Spark({ arr, color }: { arr: number[]; color: string }) {
  if (arr.length < 2) return null;
  const w = 120, h = 26;
  const mx = Math.max(...arr), mn = Math.min(...arr);
  const pts = arr.map((v, i) => `${(i / (arr.length - 1) * w).toFixed(1)},${(h - 3 - (v - mn) / ((mx - mn) || 1) * (h - 6)).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display:'block', marginTop:6 }}>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color + '22'} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

function dcount(rows: Voc[], from: Date, to: Date) {
  return rows.filter(r => { const d = new Date(r.occurredAt); return d >= from && d <= to; });
}
function dailySeries(rows: Voc[], from: Date, days: number) {
  const out: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86400000).toISOString().slice(0, 10);
    out.push(rows.filter(r => r.occurredAt === d).length);
  }
  return out;
}

export default async function Dashboard() {
  const [all, pipe, sent, chans] = await Promise.all([
    listVOC({}), pipelineStats(), sentimentStats(), channelStats(),
  ]);
  const rows = all.slice(0, 15);
  const total = Object.values(pipe).reduce((a, b) => a + b, 0);

  // อ้างอิง "วันนี้" = วันที่ล่าสุดในข้อมูล (บางช่องทางนำเข้าจากไฟล์ ไม่เรียลไทม์)
  const dates = all.map(r => r.occurredAt).filter(Boolean).sort();
  const anchor = dates.length ? new Date(dates[dates.length - 1]) : new Date();
  const D = (n: number) => new Date(anchor.getTime() - n * 86400000);
  // ปีงบประมาณ 2569: 1 ต.ค. 2568 (2025-10-01) – 30 ก.ย. 2569 (2026-09-30)
  const fyStart = new Date('2025-10-01');
  const today = dcount(all, new Date(anchor.toISOString().slice(0, 10)), anchor);
  const week = dcount(all, D(6), anchor);
  const month = dcount(all, new Date(anchor.getFullYear(), anchor.getMonth(), 1), anchor);
  const fy = dcount(all, fyStart, anchor);
  const timeCards = [
    { lab: 'วันนี้ (ล่าสุดในข้อมูล)', rows: today, color: '#1f3a93', spark: dailySeries(all, D(6), 7) },
    { lab: '7 วันล่าสุด', rows: week, color: '#2e6cf0', spark: dailySeries(all, D(13), 14) },
    { lab: 'เดือนนี้', rows: month, color: '#0e7c86', spark: dailySeries(all, D(29), 30) },
    { lab: 'ปีงบประมาณ 2569', rows: fy, color: '#8b5cf6', spark: dailySeries(all, D(29), 30) },
  ];

  // ประเด็นที่ต้องจับตา = หัวข้อที่เสียงเชิงลบมากที่สุด
  const negTopic: Record<string, { c: number; neg: number }> = {};
  all.forEach(r => { negTopic[r.topic] ||= { c: 0, neg: 0 }; negTopic[r.topic].c++; if (r.sentiment === 'Negative') negTopic[r.topic].neg++; });
  const watch = Object.entries(negTopic).filter(([, o]) => o.neg > 0)
    .sort((a, b) => b[1].neg - a[1].neg).slice(0, 5);

  // Top 5 โครงการ บวก/ลบ
  const proj: Record<string, { pos: number; neg: number; c: number }> = {};
  all.forEach(r => { if (!r.project) return; proj[r.project] ||= { pos: 0, neg: 0, c: 0 }; proj[r.project].c++; if (r.sentiment === 'Positive') proj[r.project].pos++; if (r.sentiment === 'Negative') proj[r.project].neg++; });
  const topPos = Object.entries(proj).sort((a, b) => b[1].pos - a[1].pos).slice(0, 5);
  const topNeg = Object.entries(proj).sort((a, b) => b[1].neg - a[1].neg).slice(0, 5);

  return (
    <>
      <header className="top"><h1>ภาพรวมเสียงของลูกค้า</h1><div className="sub">สรุปข้อมูลจาก 8 ช่องทาง</div></header>
      <div className="content">
        {/* การ์ดเวลา + sparkline */}
        <div className="cards">
          {timeCards.map(c => (
            <div key={c.lab} className="kpi">
              <div className="lab">{c.lab}</div>
              <div className="val" style={{ color: c.color }}>{c.rows.length.toLocaleString()}</div>
              <Spark arr={c.spark} color={c.color} />
            </div>
          ))}
        </div>

        <div className="cards">
          <div className="kpi"><div className="lab">เสียงลูกค้าทั้งหมด</div><div className="val">{sent.total.toLocaleString()}</div></div>
          <div className="kpi"><div className="lab">เสียงเชิงบวก (% Positive)</div><div className="val" style={{color:'var(--green)'}}>{sent.posPct}%</div></div>
          <div className="kpi"><div className="lab">เสียงเชิงลบ (% Negative)</div><div className="val" style={{color:'var(--red)'}}>{sent.negPct}%</div></div>
          <div className="kpi"><div className="lab">อยู่ระหว่างดำเนินการ</div><div className="val">{total - (pipe['ดำเนินการเสร็จ/ปิดเรื่อง']||0)}</div></div>
        </div>

        <div className="card">
          <h3>📋 สถานะการดำเนินการเรื่อง (Case Pipeline)</h3>
          <div className="pipe">
            {CASE_STATUS.map(s => { const w = total ? (pipe[s]/total*100) : 0; return <div key={s} title={s+': '+pipe[s]} style={{width:w+'%',background:COL[s]}} />; })}
          </div>
          <div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:12}}>
            {CASE_STATUS.map(s => <span key={s}><b style={{color:COL[s]}}>●</b> {s}: <b>{pipe[s]}</b></span>)}
          </div>
        </div>

        {/* ประเด็นที่ต้องจับตา + Top 5 โครงการ */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:16 }}>
          <div className="card" style={{ marginBottom:0 }}>
            <h3>⚠️ ประเด็นที่ต้องจับตา</h3>
            {watch.map(([t, o]) => (
              <div key={t} style={{ padding:'7px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <Link href={'/voc?q=' + encodeURIComponent(t)} style={{ color:'#0f172a', fontWeight:600 }}>{t}</Link>
                  <span style={{ color:'var(--red)', fontWeight:700 }}>{o.neg} ลบ</span>
                </div>
                <div style={{ height:6, background:'#fee2e2', borderRadius:6, marginTop:4 }}>
                  <div style={{ width: Math.round(o.neg / o.c * 100) + '%', height:'100%', background:'#dc2626', borderRadius:6 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom:0 }}>
            <h3>🏆 Top 5 โครงการ — เสียงเชิงบวก</h3>
            {topPos.map(([p, o], i) => (
              <div key={p} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
                <span>{i+1}. {p}</span><span style={{ color:'var(--green)', fontWeight:700 }}>{o.pos}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom:0 }}>
            <h3>🚨 Top 5 โครงการ — เสียงเชิงลบ</h3>
            {topNeg.map(([p, o], i) => (
              <div key={p} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
                <span>{i+1}. {p}</span><span style={{ color:'var(--red)', fontWeight:700 }}>{o.neg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>📥 เสียงลูกค้าแยกตามช่องทาง</h3>
          <table><thead><tr><th>ช่องทาง</th><th>จำนวน</th><th>% เชิงลบ</th></tr></thead>
            <tbody>{chans.map(c => <tr key={c.name}><td><Link href={'/channels/'+encodeURIComponent(c.name)} style={{color:'#2e6cf0'}}>{c.name}</Link></td><td>{c.count}</td><td>{c.negPct}%</td></tr>)}</tbody>
          </table>
        </div>

        <div className="card">
          <h3>💬 รายการล่าสุด</h3>
          <table><thead><tr><th>รหัส</th><th>วันที่ต้นทาง</th><th>ช่องทาง</th><th>หัวข้อ</th><th>Sentiment</th><th>สถานะ</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id}>
                <td><Link href={'/voc/'+r.id} className="tag">{r.ref}</Link></td>
                <td>{r.occurredAt}{r.imported?' (ไฟล์)':''}</td>
                <td>{r.channel}{r.source!==r.channel?' › '+r.source:''}</td>
                <td>{r.topic}</td>
                <td><span className={'pill '+(r.sentiment==='Positive'?'p-pos':r.sentiment==='Negative'?'p-neg':'p-neu')}>{r.sentiment}</span></td>
                <td>{r.status}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
