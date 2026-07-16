import Link from 'next/link';
import { getVOC, getTimeline, CASE_STATUS } from '../../../lib/data';
import { notFound } from 'next/navigation';
import CaseActions from './CaseActions';

export const dynamic = 'force-dynamic';

export default async function VocDetail({ params }: { params: { id: string } }) {
  const r = await getVOC(params.id);
  if (!r) return notFound();
  const timeline = await getTimeline(r);
  const curIdx = CASE_STATUS.indexOf(r.status);
  const sp = r.sentiment==='Positive'?'p-pos':r.sentiment==='Negative'?'p-neg':'p-neu';
  return (
    <>
      <header className="top"><h1>รายละเอียด {r.ref}</h1><div className="sub"><Link href="/voc">← กลับรายการ VOC</Link></div></header>
      <div className="content">
        <div className="card">
          <div style={{background:'#f5f7ff',border:'1px solid #c7d2fe',borderRadius:10,padding:13,fontSize:15,lineHeight:1.6}}>
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:5}}>💬 เสียงลูกค้า (ข้อความเต็ม)</div>“{r.voice}”
          </div>
          <table style={{marginTop:14}}>
            <tbody>
              <tr><th>ช่องทาง</th><td>{r.channel}{r.source!==r.channel?' › '+r.source:''}</td><th>วันที่เกิดเรื่อง</th><td>{r.occurredAt}{r.imported?' · นำเข้า '+r.importedAt+' (ไฟล์)':' · เรียลไทม์'}</td></tr>
              <tr><th>กลุ่มผลิตภัณฑ์</th><td>{r.product}</td><th>โครงการ</th><td>{r.project}</td></tr>
              <tr><th>หัวข้อ</th><td>{r.topic}</td><th>Journey</th><td>{r.journey}</td></tr>
              <tr><th>Sentiment</th><td><span className={'pill '+sp}>{r.sentiment}</span></td><th>Priority</th><td>{r.priority}</td></tr>
              <tr><th>ผู้รับผิดชอบ</th><td>{r.owner}</td><th>สถานะ</th><td>{r.status}</td></tr>
              <tr><th>หมวด AI (ผลิตภัณฑ์)</th><td>{r.catProduct}</td><th>หมวด AI (สนับสนุนขาย)</th><td>{r.catSales}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Case Pipeline — สถานะเรื่อง */}
        <div className="card">
          <h3>🚩 สถานะเรื่อง (Case Pipeline)</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
            {CASE_STATUS.map((s, i) => (
              <div key={s} style={{
                flex:'1 1 130px', textAlign:'center', fontSize:12, padding:'8px 6px', borderRadius:8,
                background: i < curIdx ? '#e0e7ff' : i === curIdx ? '#1f3a93' : '#f1f5f9',
                color: i === curIdx ? '#fff' : i < curIdx ? '#1f3a93' : '#94a3b8',
                fontWeight: i === curIdx ? 700 : 500 }}>
                {i + 1}. {s}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline การดำเนินการ */}
        <div className="card">
          <h3>🕒 Timeline การดำเนินการ</h3>
          <div style={{ marginTop: 8 }}>
            {timeline.map((t, i) => (
              <div key={i} style={{ display:'flex', gap:12 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', marginTop:4,
                    background: i === timeline.length - 1 ? '#1f3a93' : '#94a3b8' }} />
                  {i < timeline.length - 1 && <div style={{ width:2, flex:1, background:'#e2e8f0' }} />}
                </div>
                <div style={{ paddingBottom:16 }}>
                  <div style={{ fontSize:13.5, fontWeight:600 }}>{t.status}</div>
                  <div style={{ fontSize:13, color:'#334155' }}>{t.text}</div>
                  <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:2 }}>โดย {t.by} · {t.at}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>* เมื่อเชื่อม Supabase แล้ว timeline นี้อ่านจากตาราง action_log จริง (แอดมินเป็นผู้บันทึก — human-in-the-loop)</div>
          <CaseActions vocId={r.id} currentStatus={r.status} currentOwner={r.owner} />
        </div>
      </div>
    </>
  );
}
