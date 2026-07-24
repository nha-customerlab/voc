'use client';
// ChannelsView — 8 ช่องทางรับฟังเสียงลูกค้า (interactive)
// หน้ายิ้ม/นิ่ง/เศร้า + แถบเทียบช่องทาง + การ์ด hover ขยับ + คลิกดูรายละเอียดด้านล่าง + ปุ่มกลับ
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Voc } from '../../lib/data';
import { CHANNELS } from '../../lib/data';
import { computeCloud } from '../../lib/cloud';
import WordCloud from '../components/WordCloud';
import TrendChart from '../components/TrendChart';

const ICON: Record<string, string> = {
  'Social Media': '👍', 'Website / Email / DB': '🌐', 'ทีมรณรงค์ขาย': '🧑‍💼', 'ฝ่ายงานสำนักงานใหญ่': '🏢',
  'สำนักงานสาขาทั่วประเทศ': '📍', 'Call Center': '🎧', 'ระบบร้องเรียน/ข้อเสนอแนะ': '📣', 'แบบประเมินความพึงพอใจ': '📝',
};
const SENT_TH: Record<string, string> = { Positive: 'เชิงบวก', Neutral: 'เป็นกลาง', Negative: 'เชิงลบ' };
const SENT_COLOR: Record<string, string> = { Positive: '#16a34a', Neutral: '#f59e0b', Negative: '#dc2626' };

// หน้ายิ้ม/นิ่ง/เศร้า เป็น SVG
function Face({ kind, color }: { kind: 'smile' | 'flat' | 'frown'; color: string }) {
  const mouth = kind === 'smile' ? 'M32 60 Q50 76 68 60' : kind === 'frown' ? 'M32 66 Q50 50 68 66' : 'M34 62 H66';
  return (
    <svg viewBox="0 0 100 100" width="72" height="72" aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill={color + '22'} stroke={color} strokeWidth="4" />
      <circle cx="37" cy="42" r="5.5" fill={color} />
      <circle cx="63" cy="42" r="5.5" fill={color} />
      <path d={mouth} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export default function ChannelsView({ rows }: { rows: Voc[] }) {
  const [sel, setSel] = useState<string | null>(null);

  const stats = useMemo(() => CHANNELS.map(name => {
    const r = rows.filter(x => x.channel === name);
    const t = r.length || 1;
    const pos = r.filter(x => x.sentiment === 'Positive').length;
    const neu = r.filter(x => x.sentiment === 'Neutral').length;
    const neg = r.filter(x => x.sentiment === 'Negative').length;
    return { name, count: r.length, pos, neu, neg, posPct: Math.round(pos / t * 100), neuPct: Math.round(neu / t * 100), negPct: Math.round(neg / t * 100) };
  }), [rows]);

  const total = stats.reduce((a, c) => a + c.count, 0);
  const maxCount = Math.max(...stats.map(c => c.count), 1);
  const allPos = rows.filter(r => r.sentiment === 'Positive').length;
  const allNeu = rows.filter(r => r.sentiment === 'Neutral').length;
  const allNeg = rows.filter(r => r.sentiment === 'Negative').length;
  const t0 = rows.length || 1;
  const faces = [
    { kind: 'smile' as const, lab: 'เชิงบวก (Positive)', n: allPos, pct: Math.round(allPos / t0 * 100), color: '#16a34a' },
    { kind: 'flat' as const, lab: 'เป็นกลาง (Neutral)', n: allNeu, pct: Math.round(allNeu / t0 * 100), color: '#f59e0b' },
    { kind: 'frown' as const, lab: 'เชิงลบ (Negative)', n: allNeg, pct: Math.round(allNeg / t0 * 100), color: '#dc2626' },
  ];

  return (
    <>
      <header className="top">
        <h1>8 ช่องทางรับฟังเสียงลูกค้า</h1>
        <div className="sub">คลิกการ์ดช่องทางเพื่อดูแดชบอร์ดเฉพาะช่องทาง · รวม {total.toLocaleString()} รายการ</div>
      </header>
      <div className="content">
        {/* ===== ภาพรวม (แสดงเมื่อยังไม่เลือกช่องทาง) ===== */}
        {!sel && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            {/* หน้ายิ้ม/นิ่ง/เศร้า */}
            <div className="card" style={{ marginBottom: 0, flex: '1 1 300px' }}>
              <h3>ความรู้สึกของลูกค้า (ภาพรวมทั้ง 8 ช่องทาง)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 12, textAlign: 'center' }}>
                {faces.map(f => (
                  <div key={f.lab} style={{ padding: '10px 6px', borderRadius: 12, background: f.color + '10' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><Face kind={f.kind} color={f.color} /></div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: f.color, marginTop: 6 }}>{f.pct}%</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{f.n.toLocaleString()} เสียง</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{f.lab}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* เทียบช่องทาง — กราฟแท่งแนวตั้ง (stacked ตามอารมณ์) */}
            <div className="card" style={{ marginBottom: 0, flex: '2 1 460px' }}>
              <h3>เสียงลูกค้าแยกตามช่องทาง</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 210, padding: '14px 0 0' }}>
                {stats.map((c, i) => {
                  const barH = Math.max(4, Math.round(c.count / maxCount * 150));
                  const seg = (v: number) => (c.count ? Math.round(barH * v / c.count) : 0);
                  return (
                    <div key={c.name} onClick={() => setSel(c.name)} title={`${c.name}\nรวม ${c.count} · บวก ${c.posPct}% กลาง ${c.neuPct}% ลบ ${c.negPct}%`}
                      className="chan-bar" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{c.count}</div>
                      <div style={{ width: '78%', maxWidth: 40, height: barH, display: 'flex', flexDirection: 'column', borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
                        <div style={{ height: seg(c.neg), background: '#dc2626' }} />
                        <div style={{ height: seg(c.neu), background: '#f59e0b' }} />
                        <div style={{ flex: 1, background: '#16a34a' }} />
                      </div>
                      <div style={{ fontSize: 17, marginTop: 6 }}>{ICON[c.name]}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{i + 1}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>🟢 บวก · 🟡 กลาง · 🔴 ลบ — คลิกแท่งเพื่อดูรายละเอียดช่องทาง (เลข 1–8 ตรงกับการ์ดด้านล่าง)</div>
            </div>
          </div>
        )}

        {/* ===== การ์ด 8 ช่องทาง ===== */}
        <div style={{ fontSize: 14, fontWeight: 600, margin: '4px 0 10px' }}>
          📋 8 ช่องทางรับฟังเสียงลูกค้า <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12 }}>— คลิกการ์ดเพื่อดูแดชบอร์ดเฉพาะช่องทาง</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
          {stats.map((c, i) => (
            <div key={c.name} className={'card chan-card' + (sel === c.name ? ' sel' : '')} style={{ marginBottom: 0 }}
              onClick={() => setSel(sel === c.name ? null : c.name)}>
              <h3 title={c.name} style={{ marginBottom: 8, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span style={{ fontSize: 18, flex: '0 0 auto' }}>{ICON[c.name]}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{i + 1}. {c.name}</span>
              </h3>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1f3a93' }}>{c.count.toLocaleString()}<span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}> รายการ</span></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12 }}>
                <span>บวก <b style={{ color: '#16a34a' }}>{c.posPct}%</b></span>
                <span>กลาง <b style={{ color: '#475569' }}>{c.neuPct}%</b></span>
                <span>ลบ <b style={{ color: c.negPct > 20 ? '#dc2626' : '#f59e0b' }}>{c.negPct}%</b></span>
              </div>
            </div>
          ))}
        </div>

        {/* ===== รายละเอียดเฉพาะช่องทาง (แสดงด้านล่างเมื่อเลือก) ===== */}
        {sel && <ChannelDetail rows={rows.filter(r => r.channel === sel)} name={sel} onBack={() => setSel(null)} />}
      </div>
    </>
  );
}

function ChannelDetail({ rows, name, onBack }: { rows: Voc[]; name: string; onBack: () => void }) {
  const total = rows.length || 1;
  const sent = { Positive: 0, Neutral: 0, Negative: 0 };
  rows.forEach(r => sent[r.sentiment]++);
  const high = rows.filter(r => r.priority === 'High').length;

  const jr: Record<string, number> = {}; rows.forEach(r => { if (r.journey) jr[r.journey] = (jr[r.journey] || 0) + 1; });
  const journey = Object.entries(jr).sort((a, b) => b[1] - a[1]);
  const tp: Record<string, number> = {}; rows.forEach(r => { if (r.topic) tp[r.topic] = (tp[r.topic] || 0) + 1; });
  const topTopics = Object.entries(tp).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const src: Record<string, number> = {}; rows.forEach(r => { const s = r.source || name; src[s] = (src[s] || 0) + 1; });
  const sources = Object.entries(src).sort((a, b) => b[1] - a[1]);
  const byDay: Record<string, number> = {}; rows.forEach(r => { if (r.occurredAt) byDay[r.occurredAt] = (byDay[r.occurredAt] || 0) + 1; });
  const trend = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ label: d.slice(5).split('-').reverse().join('/'), value: v }));
  const cloud = computeCloud(rows);

  return (
    <div style={{ marginTop: 20, paddingTop: 4, borderTop: '2px dashed var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0' }}>
        <h2 style={{ fontSize: 18 }}>{ICON[name]} เจาะลึกช่องทาง: {name}</h2>
        <button className="btn" style={{ background: '#64748b' }} onClick={onBack}>← กลับดูทุกช่องทาง</button>
      </div>

      {rows.length === 0 ? <div className="card">ยังไม่มีข้อมูลในช่องทางนี้</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ marginBottom: 0 }}><div style={{ fontSize: 12, color: '#64748b' }}>จำนวนเสียงลูกค้า</div><div style={{ fontSize: 26, fontWeight: 700, color: '#1f3a93' }}>{rows.length.toLocaleString()}</div></div>
            <div className="card" style={{ marginBottom: 0 }}><div style={{ fontSize: 12, color: '#64748b' }}>% เสียงเชิงบวก</div><div style={{ fontSize: 26, fontWeight: 700, color: '#16a34a' }}>{Math.round(sent.Positive / total * 100)}%</div></div>
            <div className="card" style={{ marginBottom: 0 }}><div style={{ fontSize: 12, color: '#64748b' }}>% เสียงเชิงลบ</div><div style={{ fontSize: 26, fontWeight: 700, color: '#dc2626' }}>{Math.round(sent.Negative / total * 100)}%</div></div>
            <div className="card" style={{ marginBottom: 0 }}><div style={{ fontSize: 12, color: '#64748b' }}>เร่งด่วนสูง (High)</div><div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b' }}>{high}</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 16 }}>
            <div className="card" style={{ marginBottom: 0 }}><h3>แนวโน้มรายวัน</h3><TrendChart points={trend} /></div>
            <div className="card" style={{ marginBottom: 0 }}>
              <h3>แหล่งที่มาในช่องทางนี้</h3>
              {sources.map(([k, v]) => (
                <div key={k} style={{ margin: '10px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}><span>{k}</span><span style={{ fontWeight: 600 }}>{v} ({Math.round(v / total * 100)}%)</span></div>
                  <div style={{ height: 8, background: '#eef2f7', borderRadius: 6 }}><div style={{ width: Math.round(v / total * 100) + '%', height: '100%', background: '#2e6cf0', borderRadius: 6 }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            <div className="card">
              <h3>สัดส่วน Sentiment</h3>
              {(['Positive', 'Neutral', 'Negative'] as const).map(s => (
                <div key={s} style={{ margin: '10px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}><span>{SENT_TH[s]}</span><span style={{ fontWeight: 600 }}>{sent[s]} ({Math.round(sent[s] / total * 100)}%)</span></div>
                  <div style={{ height: 8, background: '#eef2f7', borderRadius: 6 }}><div style={{ width: Math.round(sent[s] / total * 100) + '%', height: '100%', background: SENT_COLOR[s], borderRadius: 6 }} /></div>
                </div>
              ))}
            </div>
            <div className="card"><h3>Customer Journey</h3>{journey.map(([k, v]) => (<div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}><span>{k}</span><span style={{ fontWeight: 600, color: '#1f3a93' }}>{v}</span></div>))}</div>
            <div className="card"><h3>ประเด็นที่พูดถึงมาก</h3>{topTopics.map(([k, v]) => (<div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}><span>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>))}</div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>☁️ Word Cloud — คำที่พูดถึงมากในช่องทางนี้ (คลิกคำเพื่อค้นหา)</h3>
            <WordCloud freq={cloud} basePath="/voc" />
          </div>

          <div className="card">
            <h3>เสียงลูกค้าล่าสุดในช่องทางนี้</h3>
            <table>
              <thead><tr><th>รหัส</th><th>แหล่ง</th><th>ประเด็น / เสียงลูกค้า</th><th>Sentiment</th><th>สถานะ</th></tr></thead>
              <tbody>{rows.slice(0, 20).map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}><Link href={'/voc/' + r.id} className="tag">{r.ref}</Link></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.source}</td>
                  <td><b>{r.topic}</b><div style={{ color: 'var(--muted)' }}>{r.voice}</div></td>
                  <td style={{ whiteSpace: 'nowrap', color: SENT_COLOR[r.sentiment], fontWeight: 600 }}>{SENT_TH[r.sentiment]}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.status}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
