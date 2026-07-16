'use client';
// CaseActions — เครื่องมือส่งต่อ & ติดตามเรื่อง (แอดมิน/ผู้ปฏิบัติงานเท่านั้น = human-in-the-loop)
// - แอดมิน: ส่งต่อฝ่าย + อัปเดตสถานะ + บันทึกการดำเนินการ
// - ผู้ปฏิบัติงาน: อัปเดตสถานะ + บันทึกการดำเนินการ
// - ผู้บริหาร: อ่านอย่างเดียว (ไม่แสดงเครื่องมือ)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { CASE_STATUS, DEPTS } from '../../../lib/data';

const box: React.CSSProperties = { padding: '9px 11px', border: '1px solid #dfe6f0', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', background: '#fff' };

export default function CaseActions({ vocId, currentStatus, currentOwner }:
  { vocId: string; currentStatus: string; currentOwner: string }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);   // null = กำลังโหลด/ไม่ล็อกอิน
  const [status, setStatus] = useState(currentStatus);
  const [dept, setDept] = useState(currentOwner || DEPTS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase!.from('profiles').select('role').eq('id', data.user.id).single();
      setRole(p?.role ?? 'operator');
    });
  }, []);

  if (!supabase) {
    return <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>* โหมดข้อมูลจำลอง — เครื่องมือส่งต่อ/อัปเดตสถานะจะใช้ได้เมื่อเชื่อม Supabase</div>;
  }
  if (role === null) return null;               // ยังไม่ล็อกอิน/กำลังโหลด
  if (role === 'executive') {
    return <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>👁️ บทบาทผู้บริหาร — ดูข้อมูลอย่างเดียว (อัปเดตสถานะโดยแอดมิน/ผู้ปฏิบัติงาน)</div>;
  }

  async function save() {
    setBusy(true); setErr(''); setMsg('');
    try {
      const { data: u } = await supabase!.auth.getUser();
      const changes: string[] = [];
      const upd: any = {};
      if (status !== currentStatus) { upd.status = status; changes.push('เปลี่ยนสถานะเป็น "' + status + '"'); }
      if (role === 'admin' && dept !== currentOwner) { upd.owner_dept = dept; changes.push('ส่งต่อไปยัง ' + dept); }
      if (Object.keys(upd).length) {
        const { error } = await supabase!.from('voc_record').update(upd).eq('id', vocId);
        if (error) throw error;
      }
      const text = [...changes, note.trim()].filter(Boolean).join(' · ');
      if (text) {
        const { error } = await supabase!.from('action_log').insert({
          voc_id: vocId, action_text: text, status, acted_by: u.user?.id ?? null,
        });
        if (error) throw error;
      }
      if (!Object.keys(upd).length && !note.trim()) { setErr('ยังไม่มีอะไรเปลี่ยน — เลือกสถานะ/ฝ่าย หรือพิมพ์บันทึกก่อน'); setBusy(false); return; }
      setMsg('บันทึกเรียบร้อย'); setNote('');
      router.refresh();
    } catch (e: any) {
      setErr('บันทึกไม่สำเร็จ: ' + (e.message || String(e)));
    }
    setBusy(false);
  }

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginTop: 4 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>
        🛠️ ดำเนินการ ({role === 'admin' ? 'แอดมิน' : 'ผู้ปฏิบัติงาน'})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <label style={{ fontSize: 12.5 }}>สถานะ:&nbsp;
          <select style={box} value={status} onChange={e => setStatus(e.target.value)}>
            {CASE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        {role === 'admin' && (
          <label style={{ fontSize: 12.5 }}>ส่งต่อฝ่าย:&nbsp;
            <select style={box} value={dept} onChange={e => setDept(e.target.value)}>
              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <input style={{ ...box, flex: 1 }} value={note} onChange={e => setNote(e.target.value)}
          placeholder="บันทึกการดำเนินการ เช่น โทรแจ้งลูกค้าแล้ว / ส่งช่างเข้าตรวจ 18 ก.ค." />
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
      </div>
      {msg && <div style={{ color: '#15803d', fontSize: 12.5, marginTop: 8 }}>✓ {msg}</div>}
      {err && <div style={{ color: '#b91c1c', fontSize: 12.5, marginTop: 8 }}>{err}</div>}
    </div>
  );
}
