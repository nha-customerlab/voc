import Link from 'next/link';
import { listVOC } from '../../lib/data';
import { computeCloud } from '../../lib/cloud';
import WordCloud from '../components/WordCloud';

export const dynamic = 'force-dynamic';

export default async function VocList({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams?.q || '';
  const rows = await listVOC({ q });
  const cloud = computeCloud(await listVOC({}));
  return (
    <>
      <header className="top"><h1>รายการเสียงลูกค้า (VOC)</h1><div className="sub">ค้นหา + Word Cloud + ดูรายละเอียด</div></header>
      <div className="content">
        <div className="card">
          <h3>☁️ Word Cloud — คำที่ลูกค้าพูดถึงมาก (คลิกคำเพื่อค้นหา)</h3>
          <WordCloud freq={cloud} basePath="/voc" />
        </div>
        <div className="card">
          <form method="get" style={{ display:'flex', gap:8, marginBottom:14 }}>
            <input name="q" defaultValue={q} placeholder="🔎 ค้นหา เช่น จอง, ซ่อม, สินเชื่อ..." />
            <button className="btn" type="submit">ค้นหา</button>
            {q && <Link href="/voc" className="btn" style={{ background:'#64748b' }}>ล้างคำค้น</Link>}
          </form>
          {q && <div className="sub" style={{ marginBottom: 8 }}>กำลังค้นหา: <b style={{ color:'#1f3a93' }}>&ldquo;{q}&rdquo;</b></div>}
          <div className="sub" style={{marginBottom:10}}>พบ {rows.length} รายการ</div>
          <table>
            <thead><tr><th>รหัส</th><th>ช่องทาง</th><th>โครงการ</th><th>หัวข้อ</th><th>เสียงลูกค้า</th><th>Sentiment</th><th>ฝ่าย</th><th>สถานะ</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id}>
                <td><Link href={'/voc/'+r.id} className="tag">{r.ref}</Link></td>
                <td>{r.channel}</td><td>{r.project}</td><td>{r.topic}</td>
                <td style={{maxWidth:260,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={r.voice}>{r.voice}</td>
                <td><span className={'pill '+(r.sentiment==='Positive'?'p-pos':r.sentiment==='Negative'?'p-neg':'p-neu')}>{r.sentiment}</span></td>
                <td>{r.owner}</td><td>{r.status}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
