'use client';
// จัดการระบบ (Admin Console) — เฉพาะบทบาทแอดมิน
// 1) ผู้ใช้งานและบทบาท (เปลี่ยนบทบาทได้) 2) การเชื่อมต่อ 8 ช่องทาง 3) Data Mapping & Dictionary
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ROLE_TH: Record<string, string> = { admin: 'แอดมิน', operator: 'ผู้ปฏิบัติงาน', executive: 'ผู้บริหาร' };
const ROLE_RIGHT: Record<string, string> = {
  admin: 'นำเข้า/ส่งออก/แก้ไข/จัดการระบบ',
  operator: 'ดู/ส่งออก/อัปเดตสถานะ/นำเข้า',
  executive: 'ดู/ส่งออก (อ่านอย่างเดียว)',
};
const CHANNELS = [
  { id: 'social', name: 'Social Media (Facebook / Line OA)', imp: 'API เรียลไทม์ + นำเข้าย้อนหลัง' },
  { id: 'web', name: 'Website / Email / DB', imp: 'อัปโหลดไฟล์ / เชื่อมฐานข้อมูล' },
  { id: 'sales', name: 'ทีมรณรงค์ขาย', imp: 'อัปโหลดไฟล์' },
  { id: 'hq', name: 'ฝ่ายงานสำนักงานใหญ่', imp: 'อัปโหลดไฟล์' },
  { id: 'branch', name: 'สำนักงานสาขาทั่วประเทศ', imp: 'อัปโหลดไฟล์' },
  { id: 'call', name: 'Call Center', imp: 'อัปโหลดไฟล์' },
  { id: 'complain', name: 'ระบบร้องเรียน/ข้อเสนอแนะ', imp: 'อัปโหลดไฟล์ / เชื่อมระบบ' },
  { id: 'survey', name: 'แบบประเมินความพึงพอใจ', imp: 'Google Forms / อัปโหลดไฟล์' },
];
const MAPPING = [
  ['วันที่เกิดเรื่อง (ต้นทาง)', 'occurred_at', 'วันที่ในไฟล์/ระบบต้นทาง — แก้ไขได้'],
  ['วันที่นำเข้าระบบ', 'imported_at', 'ระบบบันทึกอัตโนมัติ = วันที่กดนำเข้า'],
  ['ข้อความลูกค้า (เต็ม)', 'raw_text', 'จำเป็น — ใช้วิเคราะห์ AI'],
  ['หัวข้อ/ประเด็น', 'topic', 'ไม่บังคับ'],
  ['ช่องทาง', 'channel_id', 'social / web / sales / hq / branch / call / complain / survey'],
  ['แหล่งที่มาในช่องทาง', 'source', 'เช่น Facebook, Line OA, Website'],
  ['กลุ่มผลิตภัณฑ์', 'product_group', 'อาคารเพื่อขาย/เช่าซื้อ · อาคารเช่า · เช่าจัดประโยชน์'],
  ['โครงการ', 'project_id', 'อ้างตาราง project (ชื่อ + ประเภทโครงการ)'],
  ['ผลวิเคราะห์ AI', 'analysis.*', 'sentiment/confidence/หมวด/priority — เจ้าหน้าที่ยืนยันทับได้'],
  ['การส่งต่อ & ติดตาม', 'action_log.*', 'timeline ที่แอดมิน/ผู้ปฏิบัติงานบันทึก'],
];
const MOCK_USERS = [
  { id: 'm1', full_name: 'สมชาย (สาธิต)', email: 'somchai.a@nha.co.th', role: 'admin', dept: 'ฝ่ายเทคโนโลยีสารสนเทศ' },
  { id: 'm2', full_name: 'นิภา (สาธิต)', email: 'nipa.o@nha.co.th', role: 'operator', dept: 'ฝ่ายสื่อสารองค์กร' },
  { id: 'm3', full_name: 'ดิเรก (สาธิต)', email: 'direk.e@nha.co.th', role: 'executive', dept: 'ผู้บริหาร' },
];

interface Profile { id: string; full_name: string | null; email: string | null; role: string; dept: string | null }

const sel: React.CSSProperties = { padding: '6px 9px', border: '1px solid #dfe6f0', borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', background: '#fff' };

export default function AdminPage() {
  const [role, setRole] = useState<string | null>(null);
  const [me, setMe] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!supabase) { setRole('mock'); setUsers(MOCK_USERS as any); return; }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setRole('none'); return; }
      setMe(data.user.id);
      const { data: p } = await supabase!.from('profiles').select('role').eq('id', data.user.id).single();
      const r = p?.role ?? 'operator';
      setRole(r);
      if (r !== 'admin') return;
      const { data: us } = await supabase!.from('profiles').select('id, full_name, email, role, dept').order('full_name');
      setUsers((us as Profile[]) ?? []);
      // นับจำนวนเรื่องต่อช่องทาง
      const c: Record<string, number> = {};
      await Promise.all(CHANNELS.map(async ch => {
        const { count } = await supabase!.from('voc_record').select('id', { count: 'exact', head: true }).eq('channel_id', ch.id);
        c[ch.id] = count ?? 0;
      }));
      setCounts(c);
    });
  }, []);

  async function changeRole(id: string, newRole: string) {
    setMsg(''); setErr('');
    if (role === 'mock') { setUsers(u => u.map(x => x.id === id ? { ...x, role: newRole } : x)); setMsg('เปลี่ยนบทบาท (สาธิต) เรียบร้อย'); return; }
    if (id === me && newRole !== 'admin' && !window.confirm('คุณกำลังลดสิทธิ์ของตัวเองจากแอดมิน — ยืนยัน?')) return;
    const { error } = await supabase!.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) { setErr('เปลี่ยนบทบาทไม่สำเร็จ: ' + error.message); return; }
    setUsers(u => u.map(x => x.id === id ? { ...x, role: newRole } : x));
    setMsg('เปลี่ยนบทบาทเรียบร้อย');
  }

  if (role === null) return <div className="content" style={{ padding: 24 }}>กำลังโหลด…</div>;
  if (role !== 'admin' && role !== 'mock') {
    return (
      <>
        <header className="top"><h1>จัดการระบบ (Admin Console)</h1></header>
        <div className="content"><div className="card">🔒 เมนูนี้สำหรับบทบาทแอดมินเท่านั้น</div></div>
      </>
    );
  }

  return (
    <>
      <header className="top"><h1>⚙️ จัดการระบบ (Admin Console)</h1><div className="sub">ผู้ใช้/บทบาท · การเชื่อมต่อช่องทาง · Data Mapping{role === 'mock' ? ' · (โหมดสาธิต)' : ''}</div></header>
      <div className="content">
        {msg && <div className="card" style={{ color: '#15803d' }}>✓ {msg}</div>}
        {err && <div className="card" style={{ color: '#b91c1c' }}>{err}</div>}

        {/* ผู้ใช้งานและบทบาท */}
        <div className="card">
          <h3>👥 ผู้ใช้งานและบทบาท</h3>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>ผู้ใช้ใหม่สมัครผ่านหน้า &ldquo;สมัครใช้งาน&rdquo; แล้วแอดมินปรับบทบาทที่นี่</div>
          <table>
            <thead><tr><th>ผู้ใช้</th><th>อีเมล</th><th>หน่วยงาน</th><th>บทบาท</th><th>สิทธิ์</th></tr></thead>
            <tbody>{users.map(u => (
              <tr key={u.id}>
                <td>{u.full_name || '-'}{u.id === me ? ' (คุณ)' : ''}</td>
                <td>{u.email || '-'}</td>
                <td>{u.dept || '-'}</td>
                <td>
                  <select style={sel} value={u.role} onChange={e => changeRole(u.id, e.target.value)}>
                    {Object.keys(ROLE_TH).map(r => <option key={r} value={r}>{ROLE_TH[r]}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12 }}>{ROLE_RIGHT[u.role] || '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        {/* การเชื่อมต่อช่องทาง */}
        <div className="card">
          <h3>🔗 การเชื่อมต่อช่องทาง (Data Sources)</h3>
          <table>
            <thead><tr><th>ช่องทาง</th><th>วิธีนำเข้า</th><th>จำนวนเรื่องในระบบ</th><th>สถานะ</th></tr></thead>
            <tbody>{CHANNELS.map(ch => (
              <tr key={ch.id}>
                <td>{ch.name}</td><td style={{ fontSize: 12.5 }}>{ch.imp}</td>
                <td>{role === 'mock' ? '—' : (counts[ch.id] ?? 0).toLocaleString()}</td>
                <td><span className="pill p-pos">พร้อมใช้งาน</span></td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>* นำเข้าข้อมูลจากทุกช่องทางได้ที่เมนู &ldquo;📤 นำเข้าข้อมูล&rdquo; — เรียลไทม์เฉพาะ Social (เชื่อม API ในเฟสถัดไป)</div>
        </div>

        {/* Data Mapping & Dictionary */}
        <div className="card">
          <h3>🗂️ Data Mapping &amp; Dictionary</h3>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>โครงสร้างข้อมูลกลาง — ทุกช่องทางถูก map เข้าตาราง voc_record + analysis + action_log</div>
          <table>
            <thead><tr><th>ข้อมูล</th><th>คอลัมน์ในระบบ</th><th>หมายเหตุ</th></tr></thead>
            <tbody>{MAPPING.map(m => (
              <tr key={m[1]}><td>{m[0]}</td><td><code style={{ fontSize: 12 }}>{m[1]}</code></td><td style={{ fontSize: 12.5 }}>{m[2]}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
