import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink, FileText, Image as ImageIcon, Lock, Paperclip, Plus, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { MedicalCategory, MedicalFileRef, MedicalRecord, MedicalSharing, ShareRole } from '../../types';
import { FILE_ACCEPT, MAX_FILES_PER_RECORD, MEDICAL_CATEGORIES, SHARE_ROLE_LIST, categoryOf, sharingLabel } from '../../data/medicalCategories';
import { deleteFile, fileProblem, getFileBlob, prettySize, putFile } from '../../utils/medicalFiles';
import { BTN, BTN_DANGER, BTN_GHOST, CARD, Chip, Field, INPUT, Sheet } from '../admin/adminUi';

const today = () => new Date().toISOString().slice(0, 10);
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const dateText = (iso: string, isAr: boolean) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(isAr ? 'ar' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ShareChip: React.FC<{ s: MedicalSharing; isAr: boolean }> = ({ s, isAr }) => {
  const priv = s.mode === 'private';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priv ? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'}`}>
      {priv ? <Lock className="w-3 h-3" /> : <Users className="w-3 h-3" />}
      <span className="truncate max-w-[200px]">{sharingLabel(s, isAr)}</span>
    </span>
  );
};

/* ---------------------------------------------------------------- viewer */

const FileViewer: React.FC<{ file: MedicalFileRef; onClose: () => void; isAr: boolean }> = ({ file, onClose, isAr }) => {
  const { fileStore } = useApp();
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let made: string | null = null;
    let live = true;
    getFileBlob(fileStore, file.id)
      .then((b) => { if (live) { made = URL.createObjectURL(b); setUrl(made); } })
      .catch((e) => live && setErr(e instanceof Error ? e.message : 'Could not open the file.'));
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [file.id, fileStore]);
  const isImg = file.mime.startsWith('image/');
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col" role="dialog" aria-modal="true" aria-label={file.name} data-testid="file-viewer">
      <div className="flex items-center gap-2 p-3 text-white">
        <p className="flex-1 min-w-0 truncate text-sm font-bold">{file.name}</p>
        {url && (
          <>
            <a href={url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/10" aria-label={isAr ? 'فتح في نافذة جديدة' : 'Open in a new tab'}><ExternalLink className="w-4 h-4" /></a>
            <a href={url} download={file.name} className="p-2 rounded-lg bg-white/10" aria-label={isAr ? 'تنزيل' : 'Download'}><Download className="w-4 h-4" /></a>
          </>
        )}
        <button type="button" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'} className="p-2 rounded-lg bg-white/10"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center p-3">
        {err ? <p className="text-white text-sm bg-rose-600/80 rounded-xl px-4 py-3">{err}</p>
          : !url ? <p className="text-white/80 text-sm">{isAr ? 'جارٍ الفتح…' : 'Opening…'}</p>
          : isImg ? <img src={url} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg bg-white" />
          : <iframe title={file.name} src={url} className="w-full h-full rounded-lg bg-white" />}
      </div>
    </div>
  );
};

const FileRow: React.FC<{ file: MedicalFileRef; onOpen: () => void; onRemove?: () => void; isAr: boolean }> = ({ file, onOpen, onRemove, isAr }) => (
  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E]">
    {file.mime.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-[#4F46E5] shrink-0" /> : <FileText className="w-5 h-5 text-rose-500 shrink-0" />}
    <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-start">
      <p className="text-xs font-bold truncate">{file.name}</p>
      <p className="text-[10px] text-[#6B6785]">{prettySize(file.size)} · {isAr ? 'اضغط للعرض' : 'Tap to view'}</p>
    </button>
    {onRemove && <button type="button" onClick={onRemove} aria-label={isAr ? 'إزالة الملف' : 'Remove file'} className="p-1.5 text-gray-400 hover:text-rose-500"><X className="w-4 h-4" /></button>}
  </div>
);

/* ---------------------------------------------------------------- sharing picker */

const SharingPicker: React.FC<{ value: MedicalSharing; onChange: (s: MedicalSharing) => void; isAr: boolean }> = ({ value, onChange, isAr }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const modes: { id: MedicalSharing['mode']; en: string; ar: string; hEn: string; hAr: string }[] = [
    { id: 'private', en: 'Only me', ar: 'أنا فقط', hEn: 'Nobody else can see it.', hAr: 'لا يراه أحد غيري.' },
    { id: 'roles', en: 'Choose people', ar: 'اختر الأشخاص', hEn: 'Only the roles you tick.', hAr: 'الأدوار التي تحددها فقط.' },
    { id: 'team', en: 'Whole care team', ar: 'كل فريق الرعاية', hEn: 'Every therapist, teacher and supervisor of your child.', hAr: 'كل أخصائي ومعلم ومشرف لطفلك.' },
  ];
  const toggle = (r: ShareRole) => onChange({ mode: 'roles', roles: value.roles.includes(r) ? value.roles.filter((x) => x !== r) : [...value.roles, r] });
  return (
    <div className="space-y-2" data-testid="sharing-picker">
      <div className="grid gap-1.5">
        {modes.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={value.mode === m.id} onClick={() => onChange({ mode: m.id, roles: m.id === 'roles' ? value.roles : [] })}
            className={`text-start rounded-xl border px-3 py-2 transition ${value.mode === m.id ? 'border-[#4F46E5] bg-indigo-50/60 dark:bg-indigo-950/30' : 'border-[#E8E2D9] dark:border-[#38325E]'}`}>
            <span className="block text-xs font-bold">{t(m.en, m.ar)}</span>
            <span className="block text-[11px] text-[#6B6785]">{t(m.hEn, m.hAr)}</span>
          </button>
        ))}
      </div>
      {value.mode === 'roles' && (
        <div className="flex flex-wrap gap-1.5">
          {SHARE_ROLE_LIST.map((r) => <Chip key={r.id} on={value.roles.includes(r.id)} onClick={() => toggle(r.id)}>{isAr ? r.ar : r.en}</Chip>)}
        </div>
      )}
      <p className="text-[11px] text-[#6B6785]">{t('You can change this any time. Administrators never see medical records.', 'يمكنك تغيير ذلك في أي وقت. المسؤولون لا يرون السجلات الطبية أبداً.')}</p>
    </div>
  );
};

/* ---------------------------------------------------------------- add / edit */

const RecordForm: React.FC<{ record: MedicalRecord | null; childId: string; defaultCategory: MedicalCategory | null; onClose: () => void; isAr: boolean }> = ({ record, childId, defaultCategory, onClose, isAr }) => {
  const { saveMedicalRecord, fileStore, showNotification } = useApp();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [category, setCategory] = useState<MedicalCategory>(record?.category ?? defaultCategory ?? 'doctor');
  const [title, setTitle] = useState(record?.title ?? '');
  const [date, setDate] = useState(record?.date ?? today());
  const [provider, setProvider] = useState(record?.provider ?? '');
  const [notes, setNotes] = useState(record?.notes ?? '');
  const [kept, setKept] = useState<MedicalFileRef[]>(record?.files ?? []);
  const [added, setAdded] = useState<File[]>([]);
  const [sharing, setSharing] = useState<MedicalSharing>(record?.sharing ?? { mode: 'private', roles: [] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = useRef<HTMLInputElement>(null);
  const total = kept.length + added.length;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    for (const f of Array.from(list)) {
      const p = fileProblem(f, fileStore.server, isAr);
      if (p) { setErr(`${f.name}: ${p}`); continue; }
      ok.push(f);
    }
    if (kept.length + added.length + ok.length > MAX_FILES_PER_RECORD) { setErr(t(`You can attach up to ${MAX_FILES_PER_RECORD} files to one record.`, `يمكن إرفاق ${MAX_FILES_PER_RECORD} ملفات كحد أقصى لكل سجل.`)); return; }
    if (ok.length) setErr('');
    setAdded((a) => [...a, ...ok]);
    if (pick.current) pick.current.value = '';
  };

  const save = async () => {
    if (title.trim().length < 2) { setErr(t('Give the record a title.', 'أعطِ السجل عنواناً.')); return; }
    if (!date) { setErr(t('Choose the date of the report.', 'اختر تاريخ التقرير.')); return; }
    if (sharing.mode === 'roles' && sharing.roles.length === 0) { setErr(t('Tick at least one person to share with, or choose "Only me".', 'حدد شخصاً واحداً على الأقل للمشاركة، أو اختر «أنا فقط».')); return; }
    setBusy(true);
    setErr('');
    const uploaded: MedicalFileRef[] = [];
    try {
      for (const f of added) uploaded.push(await putFile(fileStore, childId, uid('mf'), f));
    } catch (e) {
      await Promise.all(uploaded.map((u) => deleteFile(fileStore, u.id)));
      setErr(e instanceof Error ? e.message : t('Could not save the file.', 'تعذر حفظ الملف.'));
      setBusy(false);
      return;
    }
    // In the practice version the files taken off a record are removed here; the server does it for itself.
    if (record && !fileStore.server) await Promise.all(record.files.filter((f) => !kept.some((k) => k.id === f.id)).map((f) => deleteFile(fileStore, f.id)));
    const now = new Date().toISOString();
    saveMedicalRecord({
      id: record?.id ?? uid('med'), childId, category, title: title.trim(), date, provider: provider.trim(), notes: notes.trim(),
      files: [...kept, ...uploaded], sharing, createdAt: record?.createdAt ?? now, updatedAt: now,
    });
    showNotification(t('Medical record saved', 'تم حفظ السجل الطبي'));
    onClose();
  };

  return (
    <Sheet title={record ? t('Edit medical record', 'تعديل السجل الطبي') : t('Add a medical record', 'إضافة سجل طبي')} onClose={onClose}>
      <div className="space-y-3" data-testid="record-form">
        <Field label={t('Category', 'التصنيف')} hint={isAr ? categoryOf(category).hintAr : categoryOf(category).hintEn}>
          <select className={INPUT} value={category} onChange={(e) => setCategory(e.target.value as MedicalCategory)} aria-label={t('Category', 'التصنيف')}>
            {MEDICAL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{isAr ? c.ar : c.en}</option>)}
          </select>
        </Field>
        <Field label={t('Title', 'العنوان')}><input className={INPUT} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder={t('e.g. EEG report', 'مثال: تقرير تخطيط الدماغ')} aria-label={t('Title', 'العنوان')} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t('Date of report', 'تاريخ التقرير')} hint={t('Old reports are fine.', 'التقارير القديمة مقبولة.')}><input type="date" className={INPUT} value={date} max={today()} onChange={(e) => setDate(e.target.value)} aria-label={t('Date of report', 'تاريخ التقرير')} /></Field>
          <Field label={t('Doctor or centre', 'الطبيب أو المركز')}><input className={INPUT} value={provider} maxLength={120} onChange={(e) => setProvider(e.target.value)} aria-label={t('Doctor or centre', 'الطبيب أو المركز')} /></Field>
        </div>
        <Field label={t('Notes (optional)', 'ملاحظات (اختياري)')}><textarea className={`${INPUT} min-h-[72px]`} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder={t('What did the report say? Doses, results, advice…', 'ماذا قال التقرير؟ الجرعات، النتائج، النصائح…')} aria-label={t('Notes', 'ملاحظات')} /></Field>

        <div>
          <span className="text-xs font-bold block mb-1">{t('Files (PDF or photos)', 'الملفات (PDF أو صور)')}</span>
          <div className="space-y-1.5">
            {kept.map((f) => <FileRow key={f.id} file={f} isAr={isAr} onOpen={() => undefined} onRemove={() => setKept((k) => k.filter((x) => x.id !== f.id))} />)}
            {added.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
                <Paperclip className="w-4 h-4 text-[#4F46E5] shrink-0" />
                <p className="flex-1 min-w-0 text-xs font-bold truncate">{f.name} <span className="font-normal text-[#6B6785]">· {prettySize(f.size)}</span></p>
                <button type="button" onClick={() => setAdded((a) => a.filter((_, j) => j !== i))} aria-label={t('Remove file', 'إزالة الملف')} className="p-1 text-gray-400"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <input ref={pick} type="file" accept={FILE_ACCEPT} multiple className="hidden" data-testid="file-input" onChange={(e) => addFiles(e.target.files)} />
          <button type="button" onClick={() => pick.current?.click()} disabled={total >= MAX_FILES_PER_RECORD} className={`${BTN_GHOST} mt-2 inline-flex items-center gap-1.5`}>
            <Paperclip className="w-3.5 h-3.5" />{t('Add a file or take a photo', 'أضف ملفاً أو التقط صورة')}
          </button>
        </div>

        <div>
          <span className="text-xs font-bold block mb-1">{t('Who can see this?', 'من يمكنه رؤية هذا؟')}</span>
          <SharingPicker value={sharing} onChange={setSharing} isAr={isAr} />
        </div>

        {err && <p role="alert" className="text-xs font-semibold text-rose-600">{err}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={save} disabled={busy} className={`${BTN} flex-1`}>{busy ? t('Saving…', 'جارٍ الحفظ…') : t('Save record', 'حفظ السجل')}</button>
          <button type="button" onClick={onClose} className={BTN_GHOST}>{t('Cancel', 'إلغاء')}</button>
        </div>
      </div>
    </Sheet>
  );
};

/* ---------------------------------------------------------------- detail */

const RecordDetail: React.FC<{ record: MedicalRecord; canEdit: boolean; onEdit: () => void; onClose: () => void; isAr: boolean }> = ({ record, canEdit, onEdit, onClose, isAr }) => {
  const { saveMedicalRecord, removeMedicalRecord, showNotification } = useApp();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [view, setView] = useState<MedicalFileRef | null>(null);
  const [confirm, setConfirm] = useState(false);
  const cat = categoryOf(record.category);
  // "Choose people" shows its tick list straight away; the choice is saved as soon as one person is ticked.
  const [draft, setDraft] = useState<MedicalSharing>(record.sharing);
  const share = (s: MedicalSharing) => {
    setDraft(s);
    if (s.mode === 'roles' && s.roles.length === 0) return;
    saveMedicalRecord({ ...record, sharing: s, updatedAt: new Date().toISOString() });
  };
  return (
    <>
      <Sheet title={record.title} onClose={onClose}>
        <div className="space-y-3" data-testid="record-detail">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.color}`}>{isAr ? cat.ar : cat.en}</span>
            <span className="text-xs text-[#6B6785]">{dateText(record.date, isAr)}</span>
          </div>
          {record.provider && <p className="text-sm"><span className="text-xs font-bold text-[#6B6785]">{t('Doctor or centre', 'الطبيب أو المركز')}: </span>{record.provider}</p>}
          {record.notes && <p className="text-sm whitespace-pre-wrap rounded-xl bg-[#F8FAFC] dark:bg-[#252044] p-3">{record.notes}</p>}
          <div className="space-y-1.5">
            {record.files.length === 0 && <p className="text-xs text-[#6B6785]">{t('No file attached.', 'لا يوجد ملف مرفق.')}</p>}
            {record.files.map((f) => <FileRow key={f.id} file={f} isAr={isAr} onOpen={() => setView(f)} />)}
          </div>
          {canEdit ? (
            <div>
              <span className="text-xs font-bold block mb-1">{t('Who can see this?', 'من يمكنه رؤية هذا؟')}</span>
              <SharingPicker value={draft} onChange={share} isAr={isAr} />
              {draft.mode === 'roles' && draft.roles.length === 0 && <p role="status" className="text-[11px] font-semibold text-amber-600 mt-1">{t('Tick at least one person. Until then this record stays private.', 'حدد شخصاً واحداً على الأقل. حتى ذلك الحين يبقى السجل خاصاً.')}</p>}
            </div>
          ) : (
            <p className="text-[11px] text-[#6B6785] flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" />{t('Shared with you by the family. View only.', 'تمت مشاركته معك من الأسرة. للعرض فقط.')}</p>
          )}
          {canEdit && (
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onEdit} className={`${BTN} flex-1`}>{t('Edit', 'تعديل')}</button>
              {!confirm ? (
                <button type="button" onClick={() => setConfirm(true)} className={`${BTN_DANGER} inline-flex items-center gap-1.5`}><Trash2 className="w-3.5 h-3.5" />{t('Delete', 'حذف')}</button>
              ) : (
                <button type="button" onClick={() => { removeMedicalRecord(record.id); showNotification(t('Record deleted', 'تم حذف السجل')); onClose(); }} className={BTN_DANGER}>{t('Yes, delete it', 'نعم، احذفه')}</button>
              )}
            </div>
          )}
        </div>
      </Sheet>
      {view && <FileViewer file={view} onClose={() => setView(null)} isAr={isAr} />}
    </>
  );
};

/* ---------------------------------------------------------------- the page */

/** `childId` shows another child than the active one; `embedded` drops the page heading (used inside a sheet). */
export const MedicalRecordsPanel: React.FC<{ mode: 'parent' | 'staff'; childId?: string; embedded?: boolean }> = ({ mode, childId, embedded }) => {
  const { language, activeChild: current, childrenList, medicalRecords } = useApp();
  const activeChild = (childId && childrenList.find((c) => c.id === childId)) || current;
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const parent = mode === 'parent';
  const [cat, setCat] = useState<MedicalCategory | 'all'>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ record: MedicalRecord | null } | null>(null);

  const mine = useMemo(() => medicalRecords.filter((r) => r.childId === activeChild.id), [medicalRecords, activeChild.id]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    mine.forEach((r) => m.set(r.category, (m.get(r.category) ?? 0) + 1));
    return m;
  }, [mine]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return mine
      .filter((r) => (cat === 'all' || r.category === cat) && (!needle || `${r.title} ${r.provider} ${r.notes}`.toLowerCase().includes(needle)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [mine, cat, q]);
  const years = useMemo(() => {
    const g = new Map<string, MedicalRecord[]>();
    shown.forEach((r) => (g.get(r.date.slice(0, 4)) ?? g.set(r.date.slice(0, 4), []).get(r.date.slice(0, 4))!).push(r));
    return [...g.entries()];
  }, [shown]);
  const open = mine.find((r) => r.id === openId) ?? null;
  const sharedCount = mine.filter((r) => r.sharing.mode !== 'private').length;

  return (
    <div className={`space-y-4 animate-in fade-in ${embedded ? '' : 'pb-28'}`} data-testid="medical-records">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {!embedded && <h2 className="font-heading text-[28px] leading-tight font-bold text-[#0F2A27] dark:text-white">{t('Medical records', 'السجلات الطبية')}</h2>}
          <p className="text-sm text-[#5C706C] dark:text-[#A5A0C2] mt-1">
            {parent
              ? t(`Reports and history for ${activeChild.name}. Only you decide who else sees them.`, `تقارير وتاريخ ${activeChild.name}. أنت وحدك تقرر من يراها.`)
              : t(`Reports the family chose to share about ${activeChild.name}. View only.`, `تقارير اختارت الأسرة مشاركتها عن ${activeChild.name}. للعرض فقط.`)}
          </p>
        </div>
        {parent && <button type="button" onClick={() => setForm({ record: null })} className={`${BTN} shrink-0 inline-flex items-center gap-1.5`} data-testid="add-record"><Plus className="w-4 h-4" />{t('Add', 'إضافة')}</button>}
      </div>

      {parent && mine.length > 0 && (
        <div className={`${CARD} flex items-center gap-3`}>
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs text-[#5C706C] dark:text-[#A5A0C2]">
            {t(`${mine.length} saved · ${sharedCount} shared with your care team · ${mine.length - sharedCount} private.`, `${mine.length} محفوظ · ${sharedCount} مشارَك مع الفريق · ${mine.length - sharedCount} خاص.`)}
          </p>
        </div>
      )}

      {mine.length > 0 && (
        <>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
            <input className={`${INPUT} ps-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search title, doctor or notes', 'ابحث بالعنوان أو الطبيب أو الملاحظات')} aria-label={t('Search records', 'بحث في السجلات')} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label={t('Categories', 'التصنيفات')}>
            <Chip on={cat === 'all'} onClick={() => setCat('all')}>{t('All', 'الكل')} · {mine.length}</Chip>
            {MEDICAL_CATEGORIES.filter((c) => counts.has(c.id)).map((c) => <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>{isAr ? c.ar : c.en} · {counts.get(c.id)}</Chip>)}
          </div>
        </>
      )}

      {mine.length === 0 && (
        <div className={`${CARD} text-center space-y-2 py-8`}>
          <FileText className="w-8 h-8 mx-auto text-[#4F46E5]" />
          <p className="font-bold text-sm">{parent ? t('No medical records yet', 'لا توجد سجلات طبية بعد') : t('Nothing shared yet', 'لم تتم مشاركة شيء بعد')}</p>
          <p className="text-xs text-[#6B6785] max-w-xs mx-auto">
            {parent
              ? t('Keep reports from the last years in one safe place: diagnosis, EEG, medication, lab tests, school reports. Then share only what each therapist needs.', 'احتفظ بتقارير السنوات الماضية في مكان آمن واحد: التشخيص وتخطيط الدماغ والأدوية والتحاليل وتقارير المدرسة. ثم شارك لكل أخصائي ما يحتاجه فقط.')
              : t('The family has not shared any medical records with your role. They choose what each person can see.', 'لم تشارك الأسرة أي سجلات طبية مع دورك. هم من يختار ما يراه كل شخص.')}
          </p>
          {parent && <button type="button" onClick={() => setForm({ record: null })} className={`${BTN} mt-2`}>{t('Add the first record', 'أضف أول سجل')}</button>}
        </div>
      )}

      {mine.length > 0 && shown.length === 0 && <p className="text-sm text-[#6B6785] text-center py-6">{t('Nothing matches. Try another word or category.', 'لا توجد نتائج. جرّب كلمة أو تصنيفاً آخر.')}</p>}

      {years.map(([year, list]) => (
        <section key={year} aria-label={year} className="space-y-2">
          <h3 className="text-xs font-bold tracking-wider text-[#6B6785] uppercase">{year}</h3>
          {list.map((r) => {
            const c = categoryOf(r.category);
            return (
              <button key={r.id} type="button" onClick={() => setOpenId(r.id)} data-testid="record-card" className={`${CARD} w-full text-start space-y-1.5 hover:border-[#4F46E5]/50 transition`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-sm leading-snug">{r.title}</p>
                  {r.files.length > 0 && <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-[#6B6785]"><Paperclip className="w-3 h-3" />{r.files.length}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.color}`}>{isAr ? c.ar : c.en}</span>
                  <span className="text-[11px] text-[#6B6785]">{dateText(r.date, isAr)}</span>
                  {r.provider && <span className="text-[11px] text-[#6B6785] truncate max-w-[180px]">· {r.provider}</span>}
                </div>
                {parent && <ShareChip s={r.sharing} isAr={isAr} />}
              </button>
            );
          })}
        </section>
      ))}

      {open && !form && <RecordDetail record={open} canEdit={parent} isAr={isAr} onClose={() => setOpenId(null)} onEdit={() => setForm({ record: open })} />}
      {form && <RecordForm record={form.record} childId={activeChild.id} defaultCategory={cat === 'all' ? null : cat} isAr={isAr} onClose={() => setForm(null)} />}
    </div>
  );
};
