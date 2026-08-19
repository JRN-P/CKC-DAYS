"use client";
import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Calendar, Heart, Clock, Umbrella,
  Plus, Briefcase, Baby, BookOpen, MoreHorizontal, Paperclip, FileText,
  CheckCircle2, XCircle, X, Upload, Users, Shield, RefreshCw, Trash2, User,
} from "lucide-react";
import { db } from "../lib/db";

const NAVY = "#152142";
const CREAM = "#F7F3EC";
const GOLD = "#C79A4B";

const LEAVE_TYPES = [
  { id: "sick", label: "ลาป่วย", desc: "เนื่องจากการเจ็บป่วย", icon: Heart, bg: "#FDE3E3", fg: "#E0605B" },
  { id: "personal", label: "ลากิจ", desc: "ธุระส่วนตัว / เหตุจำเป็น", icon: Briefcase, bg: "#FCEBD5", fg: "#D98C3A" },
  { id: "vacation", label: "ลาพักร้อน", desc: "พักผ่อน / ท่องเที่ยว", icon: Umbrella, bg: "#DCEAFB", fg: "#4C7FC7" },
  { id: "maternity", label: "ลาคลอด", desc: "สำหรับคุณแม่", icon: Baby, bg: "#E2E7FB", fg: "#6B72C9" },
  { id: "study", label: "ลาศึกษา / อบรม", desc: "เพื่อการศึกษา / พัฒนา", icon: BookOpen, bg: "#DDF0E4", fg: "#3F9E68" },
  { id: "late", label: "มาสาย", desc: "แจ้งเข้างานสาย", icon: Clock, bg: "#FCEBD5", fg: "#D98C3A" },
  { id: "other", label: "อื่นๆ", desc: "ลาประเภทอื่นๆ", icon: MoreHorizontal, bg: "#EDEAF5", fg: "#8C7CC2" },
];
const DURATION_OPTIONS = [
  { id: "full", label: "เต็มวัน" },
  { id: "half_am", label: "ครึ่งวันเช้า" },
  { id: "half_pm", label: "ครึ่งวันบ่าย" },
];
const durationLabel = (id) => (DURATION_OPTIONS.find((d) => d.id === id) || DURATION_OPTIONS[0]).label;
const typeMeta = (id) => LEAVE_TYPES.find((t) => t.id === id) || LEAVE_TYPES[LEAVE_TYPES.length - 1];
const ROLE_LABEL = { admin: "ผู้ดูแลระบบ", manager: "หัวหน้างาน", employee: "พนักงาน" };
const ROLE_BG = { admin: "#F0E6D2", manager: "#DCEAFB", employee: "#EDEAE2" };
const ROLE_FG = { admin: "#B8862F", manager: "#4C7FC7", employee: "#6B6558" };

function empFromRow(r) { return { id: r.id, name: r.name, role: r.role, managerId: r.manager_id }; }
function reqFromRow(r) {
  return {
    id: r.id, employeeId: r.employee_id, approverId: r.approver_id, typeId: r.leave_type,
    label: typeMeta(r.leave_type).label,
    date: r.end_date && r.end_date !== r.start_date ? `${r.start_date} – ${r.end_date}` : r.start_date,
    duration: r.duration || "full",
    reason: r.reason, returnDate: r.return_date, file: r.file_url, status: r.status,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function StatusPill({ status }) {
  const map = {
    approved: { bg: "#DDF0E4", fg: "#3F9E68", label: "อนุมัติแล้ว" },
    pending: { bg: "#FCEBD5", fg: "#D98C3A", label: "รออนุมัติ" },
    rejected: { bg: "#FDE3E3", fg: "#E0605B", label: "ไม่อนุมัติ" },
  };
  const s = map[status] || map.pending;
  return <span className="text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0" style={{ background: s.bg, color: s.fg }}>{s.label}</span>;
}
function RoleBadge({ role }) {
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: ROLE_BG[role], color: ROLE_FG[role] }}>{ROLE_LABEL[role]}</span>;
}
function TopBar({ title, onBack }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-4 shrink-0">
      {onBack ? <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 -ml-2"><ChevronLeft size={22} color={NAVY} /></button> : <div className="w-9" />}
      {title && <h1 className="text-[15px] font-semibold" style={{ color: NAVY }}>{title}</h1>}
      <div className="w-9" />
    </div>
  );
}
function StepDots({ step }) {
  const steps = ["ประเภทการลา", "รายละเอียด", "เอกสาร", "ยืนยัน"];
  return (
    <div className="flex items-center justify-between px-6 pb-5 shrink-0">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold" style={{ background: i + 1 <= step ? NAVY : "#EDEAE2", color: i + 1 <= step ? "#fff" : "#9B9689" }}>
              {i + 1 < step ? <CheckCircle2 size={15} /> : i + 1}
            </div>
            <span className="text-[10px] whitespace-nowrap" style={{ color: i + 1 === step ? NAVY : "#A9A498" }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-[1.5px] mx-1 mb-4" style={{ background: i + 1 < step ? NAVY : "#EDEAE2" }} />}
        </div>
      ))}
    </div>
  );
}
function Loading() {
  return <div className="h-full w-full flex flex-col items-center justify-center gap-2" style={{ background: CREAM }}><RefreshCw size={20} color={NAVY} className="animate-spin" /><span className="text-[12px]" style={{ color: "#9B9689" }}>กำลังโหลดข้อมูล...</span></div>;
}

function PickUserScreen({ employees, onPick, onSettings }) {
  return (
    <div className="h-full flex flex-col" style={{ background: CREAM }}>
      <div className="px-6 pt-10 pb-6 text-center shrink-0">
        <div className="text-2xl tracking-[0.3em] font-light" style={{ color: NAVY }}>DAYS</div>
        <p className="text-[12px] mt-3" style={{ color: "#9B9689" }}>เลือกว่าตอนนี้คุณกำลังใช้งานในฐานะใคร</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 space-y-2.5">
        {employees.map((e) => (
          <button key={e.id} onClick={() => onPick(e.id)} className="w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 text-left">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: ROLE_BG[e.role] }}><User size={18} color={ROLE_FG[e.role]} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium" style={{ color: NAVY }}>{e.name}</div>
              <div className="text-[11px]" style={{ color: "#9B9689" }}>{e.managerId ? `หัวหน้า: ${employees.find((m) => m.id === e.managerId)?.name || "-"}` : "ไม่มีหัวหน้า"}</div>
            </div>
            <RoleBadge role={e.role} />
          </button>
        ))}
      </div>
      <div className="px-5 pb-6 pt-3 shrink-0">
        <button onClick={onSettings} className="w-full py-3 rounded-2xl text-[13px] font-medium border flex items-center justify-center gap-2" style={{ color: NAVY, borderColor: "#DAD5C8" }}><Users size={15} /> จัดการรายชื่อพนักงาน</button>
      </div>
    </div>
  );
}

function HomeScreen({ me, employees, requests, onOpenRecord, onNewLeave, onSwitchUser, onSettings }) {
  const myRequests = requests.filter((r) => r.employeeId === me.id).sort((a, b) => b.createdAt - a.createdAt);
  const pendingForMe = requests.filter((r) => r.status === "pending" && (r.approverId === me.id || (me.role === "admin" && !r.approverId))).sort((a, b) => b.createdAt - a.createdAt);
  const balances = [
    { label: "ลาพักร้อน", value: 15, icon: Calendar }, { label: "ลากิจ", value: 5, icon: Briefcase },
    { label: "ลาป่วย", value: 8, icon: Heart }, { label: "วันหยุดสะสม", value: 12, icon: Umbrella },
  ];
  return (
    <div className="h-full flex flex-col" style={{ background: CREAM }}>
      <div className="flex items-center justify-between px-5 pt-4 shrink-0">
        <div className="text-xl tracking-[0.3em] font-light" style={{ color: NAVY }}>DAYS</div>
        <div className="flex items-center gap-2">
          {me.role === "admin" && <button onClick={onSettings} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}><Shield size={16} color={NAVY} /></button>}
          <button onClick={onSwitchUser} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}><Users size={16} color={NAVY} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        <div className="pt-5 flex items-center justify-between">
          <div><h2 className="text-lg font-semibold" style={{ color: NAVY }}>สวัสดี, {me.name}</h2><p className="text-[12px] mt-0.5" style={{ color: "#9B9689" }}>สถานะปัจจุบันในระบบ</p></div>
          <RoleBadge role={me.role} />
        </div>
        <div className="mt-4 rounded-2xl p-4" style={{ background: NAVY }}>
          <span className="text-[12px] text-white/80">ยอดคงเหลือวันนี้ (ตัวอย่าง)</span>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {balances.map((b) => (<div key={b.label} className="flex flex-col items-center gap-1.5"><b.icon size={16} color={GOLD} /><span className="text-[10px] text-white/70 text-center leading-tight">{b.label}</span><span className="text-white text-base font-semibold">{b.value}</span><span className="text-[9px] text-white/50 -mt-1">วัน</span></div>))}
          </div>
        </div>
        {pendingForMe.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2"><span className="text-[13px] font-semibold" style={{ color: NAVY }}>รออนุมัติจากคุณ</span><span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: "#E0605B" }}>{pendingForMe.length}</span></div>
            <div className="space-y-2.5">
              {pendingForMe.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId); const meta = typeMeta(r.typeId); const Icon = meta.icon;
                return (<button key={r.id} onClick={() => onOpenRecord(r)} className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 text-left border" style={{ borderColor: "#F0D9B0" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}><Icon size={18} color={meta.fg} /></div>
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-medium" style={{ color: NAVY }}>{r.label} — {emp?.name || "-"}{r.duration !== "full" ? ` (${durationLabel(r.duration)})` : ""}</div><div className="text-[11px] truncate" style={{ color: "#9B9689" }}>วันที่ {r.date}</div></div>
                  <ChevronRight size={16} color="#C9C4B8" /></button>);
              })}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-6 pb-2"><span className="text-[13px] font-semibold" style={{ color: NAVY }}>รายการของฉัน</span></div>
        <div className="space-y-2.5 pb-3">
          {myRequests.length === 0 && <p className="text-[12px] text-center py-6" style={{ color: "#B9B4A8" }}>ยังไม่มีรายการลา</p>}
          {myRequests.map((r) => { const meta = typeMeta(r.typeId); const Icon = meta.icon;
            return (<button key={r.id} onClick={() => onOpenRecord(r)} className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}><Icon size={18} color={meta.fg} /></div>
              <div className="flex-1 min-w-0"><div className="text-[13px] font-medium" style={{ color: NAVY }}>{r.label}{r.duration !== "full" ? ` (${durationLabel(r.duration)})` : ""}</div><div className="text-[11px] truncate" style={{ color: "#9B9689" }}>วันที่ {r.date}</div></div>
              <StatusPill status={r.status} /></button>);
          })}
        </div>
      </div>
      <div className="px-5 pb-5 pt-2 shrink-0"><button onClick={onNewLeave} className="w-full py-3 rounded-2xl text-white text-[13px] font-medium flex items-center justify-center gap-2" style={{ background: NAVY }}><Plus size={16} /> บันทึกการลา</button></div>
    </div>
  );
}

function Field({ label, children }) { return <div><label className="text-[12px] font-medium block mb-1.5" style={{ color: "#8B8578" }}>{label}</label>{children}</div>; }

function NewLeaveFlow({ me, employees, onCancel, onSubmit }) {
  const [step, setStep] = useState(1);
  const [typeId, setTypeId] = useState(null);
  const [form, setForm] = useState({ startDate: "", endDate: "", returnDate: "", reason: "", file: null, duration: "full" });
  const meta = typeId ? typeMeta(typeId) : null;
  const approver = employees.find((e) => e.id === me.managerId);
  const approverName = approver ? `${approver.name} (${ROLE_LABEL[approver.role]})` : "ไม่มีผู้อนุมัติ — ส่งตรงถึงแอดมิน";
  const canNext = step === 1 ? !!typeId : step === 2 ? !!form.startDate && !!form.reason : true;
  const inputCls = "w-full bg-white rounded-xl px-3.5 py-3 text-[13px] outline-none border border-transparent focus:border-[#15214255]";
  const isSingleDay = !form.endDate || form.endDate === form.startDate;

  return (
    <div className="h-full flex flex-col" style={{ background: CREAM }}>
      <TopBar title="บันทึกการลา" onBack={onCancel} />
      <StepDots step={step} />
      <div className="flex-1 overflow-y-auto pb-3">
        {step === 1 && (
          <div className="px-5 space-y-2.5">
            {LEAVE_TYPES.map((t) => { const Icon = t.icon; const isSel = typeId === t.id;
              return (<button key={t.id} onClick={() => setTypeId(t.id)} className="w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 text-left border" style={{ borderColor: isSel ? NAVY : "transparent" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg }}><Icon size={20} color={t.fg} /></div>
                <div className="flex-1 min-w-0"><div className="text-[13.5px] font-medium" style={{ color: NAVY }}>{t.label}</div><div className="text-[11px]" style={{ color: "#9B9689" }}>{t.desc}</div></div>
                <ChevronRight size={16} color="#C9C4B8" /></button>);
            })}
          </div>
        )}
        {step === 2 && (
          <div className="px-5 space-y-4">
            <div className="text-[12px] px-3 py-2 rounded-xl" style={{ background: "#FCEBD5", color: "#D98C3A" }}>กำลังบันทึก: {meta?.label} • ผู้อนุมัติ: {approverName}</div>
            <Field label="วันที่ลา"><input type="date" className={inputCls} style={{ color: NAVY }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="ถึงวันที่ (ถ้าลาวันเดียว ปล่อยว่างหรือใส่วันเดียวกัน)"><input type="date" className={inputCls} style={{ color: NAVY }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
            {isSingleDay && (
              <Field label="ระยะเวลา">
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button key={d.id} type="button" onClick={() => setForm({ ...form, duration: d.id })}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-medium border"
                      style={{ background: form.duration === d.id ? NAVY : "#fff", color: form.duration === d.id ? "#fff" : NAVY, borderColor: form.duration === d.id ? NAVY : "#EDEAE2" }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <Field label="วันที่คาดว่าจะกลับมาทำงาน"><input type="date" className={inputCls} style={{ color: NAVY }} value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} /></Field>
            <Field label="เหตุผล"><textarea rows={3} className={inputCls + " resize-none"} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
          </div>
        )}
        {step === 3 && (
          <div className="px-5">
            <p className="text-[12px] mb-3" style={{ color: "#8B8578" }}>แนบเอกสารประกอบ (ถ้ามี)</p>
            <button onClick={() => setForm({ ...form, file: form.file ? null : "เอกสารแนบ.pdf" })} className="w-full border-2 border-dashed rounded-2xl py-8 flex flex-col items-center gap-2" style={{ borderColor: "#DAD5C8", background: "#fff" }}><Upload size={22} color="#9B9689" /><span className="text-[12px]" style={{ color: "#9B9689" }}>แตะเพื่อแนบไฟล์ (จำลอง)</span></button>
            {form.file && (<div className="mt-3 flex items-center gap-2 bg-white rounded-xl p-3"><FileText size={16} color={NAVY} /><span className="text-[12.5px] flex-1" style={{ color: NAVY }}>{form.file}</span><button onClick={() => setForm({ ...form, file: null })}><X size={15} color="#B9B4A8" /></button></div>)}
          </div>
        )}
        {step === 4 && (
          <div className="px-5">
            <div className="bg-white rounded-2xl divide-y divide-black/5 overflow-hidden">
              {[
                ["ประเภทการลา", meta?.label],
                ["วันที่ลา", form.startDate ? `${form.startDate} ถึง ${form.endDate || form.startDate}` : "-"],
                ["ระยะเวลา", isSingleDay ? durationLabel(form.duration) : "เต็มวัน (หลายวัน)"],
                ["วันที่คาดว่าจะกลับ", form.returnDate || "-"],
                ["เหตุผล", form.reason || "-"],
                ["เอกสารแนบ", form.file || "ไม่มี"],
                ["ส่งอนุมัติไปยัง", approverName],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3.5"><span className="text-[12px]" style={{ color: "#9B9689" }}>{k}</span><span className="text-[12.5px] font-medium text-right max-w-[60%]" style={{ color: NAVY }}>{v}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="px-5 pb-5 pt-2 flex gap-3 shrink-0">
        {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-2xl text-[13px] font-medium border" style={{ color: NAVY, borderColor: "#DAD5C8" }}>ย้อนกลับ</button>}
        <button disabled={!canNext} onClick={() => (step < 4 ? setStep(step + 1) : onSubmit({ typeId, ...form, duration: isSingleDay ? form.duration : "full", approverId: approver ? approver.id : null }))} className="flex-1 py-3 rounded-2xl text-[13px] font-medium text-white" style={{ background: canNext ? NAVY : "#C9C4B8" }}>{step < 4 ? "ถัดไป" : "ยืนยันการบันทึก"}</button>
      </div>
    </div>
  );
}

function SuccessScreen({ onDone }) {
  return (<div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center" style={{ background: CREAM }}>
    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#DDF0E4" }}><CheckCircle2 size={30} color="#3F9E68" /></div>
    <h2 className="text-base font-semibold" style={{ color: NAVY }}>ส่งคำขอลาสำเร็จ</h2>
    <p className="text-[12.5px]" style={{ color: "#9B9689" }}>รายการถูกส่งให้ผู้อนุมัติแล้ว รอการตรวจสอบ</p>
    <button onClick={onDone} className="mt-2 w-full py-3 rounded-2xl text-white text-[13px] font-medium" style={{ background: NAVY }}>กลับหน้าแรก</button>
  </div>);
}

function Row({ icon: Icon, label, value }) {
  return (<div className="flex items-center gap-3 px-4 py-3.5"><Icon size={15} color="#9B9689" /><span className="text-[12px] flex-1" style={{ color: "#9B9689" }}>{label}</span><span className="text-[12px] font-medium text-right max-w-[55%]" style={{ color: NAVY }}>{value}</span></div>);
}

function DetailScreen({ record, employees, me, onBack, onDecision }) {
  const [history, setHistory] = useState([]);
  useEffect(() => { db.getHistory(record.id).then((rows) => setHistory(rows || [])); }, [record.id]);
  const meta = typeMeta(record.typeId); const Icon = meta.icon;
  const emp = employees.find((e) => e.id === record.employeeId);
  const canDecide = record.status === "pending" && (record.approverId === me.id || (me.role === "admin" && !record.approverId));
  return (
    <div className="h-full flex flex-col" style={{ background: CREAM }}>
      <TopBar onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: meta.bg }}><Icon size={26} color={meta.fg} /></div>
          <h2 className="text-base font-semibold" style={{ color: NAVY }}>{record.label}</h2>
          <p className="text-[12px]" style={{ color: "#9B9689" }}>ผู้ยื่น: {emp?.name || "-"}</p>
          <StatusPill status={record.status} />
        </div>
        <div className="bg-white rounded-2xl mt-4 divide-y divide-black/5 overflow-hidden">
          <Row icon={Calendar} label="วันที่ลา" value={record.date} />
          <Row icon={Clock} label="ระยะเวลา" value={durationLabel(record.duration)} />
          <Row icon={Clock} label="วันที่คาดว่าจะกลับมาทำงาน" value={record.returnDate || "-"} />
          <Row icon={FileText} label="เหตุผล" value={record.reason || "-"} />
          {record.file && <Row icon={Paperclip} label="เอกสารแนบ" value={record.file} />}
        </div>
        <div className="mt-5">
          <h3 className="text-[13px] font-semibold mb-3" style={{ color: NAVY }}>ประวัติการดำเนินการ</h3>
          <div className="bg-white rounded-2xl p-4 space-y-3">
            {history.length === 0 && <p className="text-[12px]" style={{ color: "#B9B4A8" }}>ยังไม่มีประวัติ</p>}
            {history.map((h, i) => (<div key={h.id} className="flex gap-3"><div className="flex flex-col items-center"><CheckCircle2 size={15} color="#3F9E68" />{i < history.length - 1 && <div className="w-px flex-1 bg-black/10 mt-1" />}</div><div className="pb-3"><div className="text-[11.5px] font-medium" style={{ color: NAVY }}>{new Date(h.created_at).toLocaleString("th-TH")}</div><div className="text-[11px]" style={{ color: "#9B9689" }}>{h.note}</div></div></div>))}
          </div>
        </div>
      </div>
      {canDecide && (
        <div className="px-5 pb-5 pt-2 flex gap-3 shrink-0">
          <button onClick={() => onDecision(record, "rejected")} className="flex-1 py-3 rounded-2xl text-[13px] font-medium flex items-center justify-center gap-1.5 border" style={{ color: "#E0605B", borderColor: "#F3C6C4" }}><XCircle size={15} /> ไม่อนุมัติ</button>
          <button onClick={() => onDecision(record, "approved")} className="flex-1 py-3 rounded-2xl text-white text-[13px] font-medium flex items-center justify-center gap-1.5" style={{ background: "#3F9E68" }}><CheckCircle2 size={15} /> อนุมัติ</button>
        </div>
      )}
    </div>
  );
}

function SettingsScreen({ employees, onBack, onAdd, onUpdate, onRemove }) {
  const [form, setForm] = useState({ name: "", role: "employee", managerId: "" });
  const inputCls = "w-full bg-white rounded-xl px-3.5 py-3 text-[13px] outline-none border border-[#EDEAE2]";
  const possibleManagers = employees.filter((e) => e.role === "manager" || e.role === "admin");
  return (
    <div className="h-full flex flex-col" style={{ background: CREAM }}>
      <TopBar title="จัดการพนักงาน / สายอนุมัติ" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2.5">
        {employees.map((e) => (
          <div key={e.id} className="bg-white rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2"><span className="text-[13px] font-medium" style={{ color: NAVY }}>{e.name}</span><button onClick={() => onRemove(e.id)}><Trash2 size={15} color="#C9C4B8" /></button></div>
            <div className="flex gap-2">
              <select value={e.role} onChange={(ev) => onUpdate(e.id, { role: ev.target.value })} className="flex-1 text-[12px] bg-[#F7F3EC] rounded-lg px-2 py-2" style={{ color: NAVY }}>
                <option value="employee">พนักงาน</option><option value="manager">หัวหน้างาน</option><option value="admin">ผู้ดูแลระบบ</option>
              </select>
              <select value={e.managerId || ""} onChange={(ev) => onUpdate(e.id, { manager_id: ev.target.value || null })} className="flex-1 text-[12px] bg-[#F7F3EC] rounded-lg px-2 py-2" style={{ color: NAVY }}>
                <option value="">ไม่มีหัวหน้า</option>
                {employees.filter((m) => m.id !== e.id && (m.role === "manager" || m.role === "admin")).map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </div>
          </div>
        ))}
        <div className="bg-white rounded-2xl p-3.5 mt-4">
          <span className="text-[13px] font-semibold block mb-2" style={{ color: NAVY }}>เพิ่มพนักงานใหม่</span>
          <div className="space-y-2">
            <input placeholder="ชื่อ-นามสกุล" className={inputCls} style={{ color: NAVY }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} style={{ color: NAVY }}><option value="employee">พนักงาน</option><option value="manager">หัวหน้างาน</option><option value="admin">ผู้ดูแลระบบ</option></select>
            <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} className={inputCls} style={{ color: NAVY }}><option value="">ไม่มีหัวหน้า</option>{possibleManagers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <button onClick={() => { if (!form.name.trim()) return; onAdd({ name: form.name.trim(), role: form.role, manager_id: form.managerId || null }); setForm({ name: "", role: "employee", managerId: "" }); }} className="w-full py-2.5 rounded-xl text-white text-[12.5px] font-medium" style={{ background: NAVY }}>+ เพิ่มพนักงาน</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [meId, setMeId] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);

  async function reload() {
    const [emps, reqs] = await Promise.all([db.getEmployees(), db.getRequests()]);
    setEmployees((emps || []).map(empFromRow));
    setRequests((reqs || []).map(reqFromRow));
  }

  useEffect(() => {
    (async () => {
      let emps = await db.getEmployees();
      if (!emps || emps.length === 0) {
        const admin = (await db.addEmployee({ name: "แอดมิน ฝ่ายบุคคล", role: "admin" }))[0];
        const mgr = (await db.addEmployee({ name: "พี่สมชาย (หัวหน้าทีม)", role: "manager", manager_id: admin.id }))[0];
        await db.addEmployee({ name: "พิมพ์ชนก", role: "employee", manager_id: mgr.id });
        await db.addEmployee({ name: "ธนกร", role: "employee", manager_id: mgr.id });
        emps = await db.getEmployees();
      }
      const reqs = await db.getRequests();
      setEmployees(emps.map(empFromRow));
      setRequests((reqs || []).map(reqFromRow));
      const saved = typeof window !== "undefined" ? localStorage.getItem("days_me") : null;
      if (saved && emps.find((e) => e.id === saved)) { setMeId(saved); setScreen("home"); } else { setScreen("pickUser"); }
    })();
  }, []);

  function pickUser(id) { setMeId(id); localStorage.setItem("days_me", id); setScreen("home"); }

  async function handleSubmitLeave(data) {
    await db.addRequest({
      employee_id: meId, approver_id: data.approverId, leave_type: data.typeId,
      start_date: data.startDate, end_date: data.endDate || data.startDate, return_date: data.returnDate,
      duration: data.duration || "full",
      reason: data.reason, file_url: data.file, status: "pending",
    });
    const reqs = await db.getRequests();
    const newest = reqs[0];
    await db.addHistory({ request_id: newest.id, note: "ผู้ยื่นได้ทำการบันทึกคำขอลา" });
    await reload();
    setScreen("success");
  }

  async function handleDecision(record, decision) {
    await db.updateRequest(record.id, { status: decision });
    await db.addHistory({ request_id: record.id, note: decision === "approved" ? "ผู้อนุมัติได้อนุมัติคำขอ" : "ผู้อนุมัติไม่อนุมัติคำขอ" });
    await reload();
    setScreen("home");
  }

  async function handleAddEmployee(emp) { await db.addEmployee(emp); await reload(); }
  async function handleUpdateEmployee(id, patch) { await db.updateEmployee(id, patch); await reload(); }
  async function handleRemoveEmployee(id) { await db.deleteEmployee(id); await reload(); }

  const me = employees.find((e) => e.id === meId);

  return (
    <div className="w-full flex flex-col" style={{ height: "100dvh", background: CREAM }}>
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {screen === "loading" && <Loading />}
        {screen === "pickUser" && <PickUserScreen employees={employees} onPick={pickUser} onSettings={() => setScreen("settings")} />}
        {screen === "home" && me && <HomeScreen me={me} employees={employees} requests={requests} onOpenRecord={(r) => { setActiveRecord(r); setScreen("detail"); }} onNewLeave={() => setScreen("new")} onSwitchUser={() => setScreen("pickUser")} onSettings={() => setScreen("settings")} />}
        {screen === "new" && me && <NewLeaveFlow me={me} employees={employees} onCancel={() => setScreen("home")} onSubmit={handleSubmitLeave} />}
        {screen === "success" && <SuccessScreen onDone={() => setScreen("home")} />}
        {screen === "detail" && activeRecord && me && <DetailScreen record={activeRecord} employees={employees} me={me} onBack={() => setScreen("home")} onDecision={handleDecision} />}
        {screen === "settings" && <SettingsScreen employees={employees} onBack={() => setScreen(meId ? "home" : "pickUser")} onAdd={handleAddEmployee} onUpdate={handleUpdateEmployee} onRemove={handleRemoveEmployee} />}
      </div>
    </div>
  );
}
