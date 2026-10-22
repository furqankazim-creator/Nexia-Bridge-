import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, Check, CheckCheck, Lock, Mic, Pause, Play, Send, Smile, Trash2, X } from 'lucide-react';
import type { MessageAttachment, MessageItem } from '../../../types';

/** What the chat list shows for a message: its text, or a label for a photo or voice note. */
export const messagePreview = (m: Pick<MessageItem, 'contentEn' | 'contentAr' | 'attachment'>, isAr: boolean): string => {
  const text = ((isAr ? m.contentAr : m.contentEn) || m.contentEn || '').split('\n')[0];
  if (text) return m.attachment ? `${m.attachment.kind === 'audio' ? '🎤' : '📷'} ${text}` : text;
  return m.attachment?.kind === 'audio' ? (isAr ? '🎤 رسالة صوتية' : '🎤 Voice message') : m.attachment ? (isAr ? '📷 صورة' : '📷 Photo') : '';
};

const MAX_DATA_URL = 200_000; // the server accepts up to 230 000 characters
const MAX_VOICE_SECONDS = 30;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** A voice note: play/pause, a progress bar and the length, like WhatsApp's. */
const VoiceNote: React.FC<{ src: string; seconds?: number; isAr: boolean }> = ({ src, seconds, isAr }) => {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(seconds ?? 0);
  return (
    <div className="flex items-center gap-2.5 min-w-[11.5rem] py-1" data-testid="voice-note">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0) setDur(d); }}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onEnded={() => { setPlaying(false); setPos(0); }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <button type="button" aria-label={playing ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')} onClick={() => { const a = audio.current; if (!a) return; if (a.paused) void a.play(); else a.pause(); }} className="w-9 h-9 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 active:scale-95">
        {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ms-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-black/15 dark:bg-white/20 overflow-hidden"><div className="h-full bg-[#00A884]" style={{ width: dur ? `${Math.min(100, (pos / dur) * 100)}%` : '0%' }} /></div>
        <p className="text-[11px] mt-1 text-[#667781] dark:text-[#8696A0] tabular-nums">{mmss(playing || pos > 0 ? pos : dur)}</p>
      </div>
    </div>
  );
};

const EMOJIS = ['😀', '😊', '🙂', '😍', '🥰', '😂', '🤗', '👍', '👏', '🙏', '💪', '🎉', '🌟', '❤️', '💛', '💚', '👋', '🙌', '✅', '⭐', '🎯', '📚', '🧩', '🎨', '🍎', '😴', '😢', '😮', '🤔', '👶', '👧', '👦', '🏠', '🏫', '🕐', '📅', '☀️', '🌈', '🎵', '🖍️'];


/** WhatsApp-like colours, in light and dark. */
export const WA = {
  header: 'bg-[#008069] dark:bg-[#202C33] text-white',
  wall: 'bg-[#EFE7DD] dark:bg-[#0B141A]',
  sent: 'bg-[#D9FDD3] dark:bg-[#005C4B] text-[#111B21] dark:text-[#E9EDEF]',
  recv: 'bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF]',
  staff: 'bg-[#FFF3C4] dark:bg-[#4A3F10] text-[#111B21] dark:text-[#F5E9B8]',
  send: 'bg-[#00A884] hover:bg-[#019575]',
  meta: 'text-[#667781] dark:text-[#8696A0]',
  tickRead: 'text-[#53BDEB]',
};
const WALLPAPER = { backgroundImage: 'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1.2px), radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1.2px)', backgroundSize: '22px 22px, 38px 38px', backgroundPosition: '0 0, 11px 11px' } as const;
const NAME_COLORS = ['#B4437D', '#1F7AA3', '#8B5E0C', '#5B6BC0', '#1B8A5A', '#C0392B', '#7D3C98'];
const nameColor = (n: string) => NAME_COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % NAME_COLORS.length];

const timeOf = (m: MessageItem) => {
  if (m.at) { const d = new Date(m.at); if (!Number.isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  return m.timestamp?.replace(/^Today( at)?,?\s*/i, '') ?? '';
};
const dayKey = (m: MessageItem) => (m.at ? new Date(m.at).toDateString() : '');
const dayLabel = (m: MessageItem, isAr: boolean) => {
  const d = new Date(m.at!);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return isAr ? 'اليوم' : 'Today';
  if (d.toDateString() === y.toDateString()) return isAr ? 'أمس' : 'Yesterday';
  return d.toLocaleDateString(isAr ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const Avatar: React.FC<{ initial: string; bg?: string; text?: string; size?: number; online?: boolean }> = ({ initial, bg = 'bg-[#DFE5E7]', text = 'text-[#54656F]', size = 40, online }) => (
  <span className="relative shrink-0" style={{ width: size, height: size }}>
    <span className={`w-full h-full rounded-full ${bg} ${text} font-bold flex items-center justify-center`} style={{ fontSize: size * 0.42 }}>{initial}</span>
    {online && <span className="absolute bottom-0 end-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-white dark:border-[#111B21]" />}
  </span>
);

/** The ticks under a message you sent: one grey = sent, two grey = delivered, two blue = read. */
const Ticks: React.FC<{ read: boolean }> = ({ read }) =>
  read ? <CheckCheck className={`w-4 h-4 ${WA.tickRead}`} aria-label="Read" /> : <CheckCheck className={`w-4 h-4 ${WA.meta}`} aria-label="Delivered" />;

interface ThreadProps {
  messages: MessageItem[];
  isMine: (m: MessageItem) => boolean;
  /** How many of my latest messages the other side has not read yet. */
  unreadByOther: number;
  isAr: boolean;
  /** Show the sender's name on messages from others (a thread with several people). */
  showNames?: boolean;
  emptyText: string;
  notice?: string;
  className?: string;
}

/** The message stream: wallpaper, date pills, grouped bubbles with tails, time and read ticks. */
export const ChatThread: React.FC<ThreadProps> = ({ messages, isMine, unreadByOther, isAr, showNames, emptyText, notice, className = '' }) => {
  const box = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const lastId = messages[messages.length - 1]?.id;
  const [lightbox, setLightbox] = useState<string | null>(null);
  const onOpenImage = setLightbox;

  // Open at the newest message, and follow new ones unless the reader has scrolled up.
  useLayoutEffect(() => {
    const el = box.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, messages.length]);
  useEffect(() => { const el = box.current; if (el) el.scrollTop = el.scrollHeight; }, []);

  const mineIdx = useMemo(() => messages.map((m, i) => (isMine(m) ? i : -1)).filter((i) => i >= 0), [messages, isMine]);
  const unreadFrom = mineIdx.length - Math.min(unreadByOther, mineIdx.length); // my messages at or after this position are unread

  return (
    <div className={`relative flex-1 min-h-0 ${className}`}>
      <div
        ref={box}
        onScroll={(e) => { const el = e.currentTarget; setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60); }}
        className={`h-full overflow-y-auto px-3 py-3 ${WA.wall}`}
        style={WALLPAPER}
        data-testid="chat-thread"
      >
        {notice && (
          <div className="flex justify-center mb-3">
            <p className="max-w-[88%] text-center text-[11px] leading-snug rounded-lg px-3 py-1.5 bg-[#FFEECD] dark:bg-[#182229] text-[#54656F] dark:text-[#FFD279] flex items-start gap-1.5 shadow-sm"><Lock className="w-3 h-3 mt-0.5 shrink-0" />{notice}</p>
          </div>
        )}
        {messages.length === 0 && <p className="text-center text-sm text-[#667781] dark:text-[#8696A0] py-10">{emptyText}</p>}
        {messages.map((m, i) => {
          const mine = isMine(m);
          const prev = messages[i - 1];
          const newDay = !!m.at && (!prev || dayKey(prev) !== dayKey(m));
          const first = !prev || newDay || isMine(prev) !== mine || prev.senderName !== m.senderName;
          const staffOnly = m.audience === 'staff';
          const myPos = mineIdx.indexOf(i);
          const read = mine && myPos >= 0 && myPos < unreadFrom;
          const text = (isAr ? m.contentAr : m.contentEn) || m.contentEn;
          return (
            <React.Fragment key={m.id}>
              {newDay && <div className="flex justify-center my-2.5"><span className="px-3 py-1 rounded-lg bg-white/95 dark:bg-[#182229] text-[11.5px] font-medium text-[#54656F] dark:text-[#8696A0] shadow-sm" data-testid="day-pill">{dayLabel(m, isAr)}</span></div>}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${first ? 'mt-2' : 'mt-0.5'}`} data-testid="chat-message" data-mine={mine ? 'true' : 'false'} data-staff={staffOnly ? 'true' : 'false'}>
                <div className={`relative max-w-[82%] px-2.5 pt-1.5 pb-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${staffOnly ? WA.staff : mine ? WA.sent : WA.recv} ${first ? (mine ? 'rounded-xl rounded-te-none' : 'rounded-xl rounded-ts-none') : 'rounded-xl'}`}>
                  {first && (
                    <svg viewBox="0 0 8 13" width="8" height="13" aria-hidden="true" className={`absolute top-0 ${mine ? '-end-[7px] scale-x-[-1] rtl:scale-x-100' : '-start-[7px] rtl:scale-x-[-1]'} ${staffOnly ? 'text-[#FFF3C4] dark:text-[#4A3F10]' : mine ? 'text-[#D9FDD3] dark:text-[#005C4B]' : 'text-white dark:text-[#202C33]'}`}>
                      <path fill="currentColor" d="M1.533 3.568L8 12.193V1H2.812C1.042 1.025.474 2.156 1.533 3.568z" />
                    </svg>
                  )}
                  {!mine && first && showNames && <p className="text-[12.5px] font-semibold leading-tight mb-0.5" style={{ color: nameColor(m.senderName) }} dir="auto">{m.senderName}</p>}
                  {staffOnly && <p className="text-[11px] font-semibold text-[#8B6B00] dark:text-[#FFD279] flex items-center gap-1 mb-0.5"><Lock className="w-3 h-3" /> {isAr ? 'للفريق فقط' : 'Team only'}</p>}
                  {m.goalTag && m.goalTag !== 'General Progress' && (
                    <p className="mb-1 ps-2 border-s-4 border-[#06CF9C] bg-black/[0.04] dark:bg-white/[0.06] rounded-sm text-[12px] py-0.5 pe-2 font-medium text-[#1F7A62] dark:text-[#06CF9C]" dir="auto">{m.goalTag}</p>
                  )}
                  {m.attachment?.kind === 'image' && (
                    <button type="button" onClick={() => onOpenImage(m.attachment!.src)} className="block mb-1 -mx-1 -mt-0.5 overflow-hidden rounded-lg" aria-label={isAr ? 'فتح الصورة' : 'Open photo'} data-testid="chat-image">
                      <img src={m.attachment.src} alt="" className="max-h-64 w-full object-cover" />
                    </button>
                  )}
                  {m.attachment?.kind === 'audio' && <VoiceNote src={m.attachment.src} seconds={m.attachment.seconds} isAr={isAr} />}
                  <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words" dir="auto">
                    {text}
                    {/* a hidden spacer keeps the last line clear of the time */}
                    <span className="inline-block w-[4.5rem]" aria-hidden="true" />
                  </p>
                  <span className={`float-end -mt-[15px] ms-2 flex items-center gap-0.5 text-[11px] leading-none ${WA.meta}`}>
                    {timeOf(m)}
                    {mine && <Ticks read={read} />}
                  </span>
                  <span className="clear-both block" />
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label={isAr ? 'الصورة' : 'Photo'} data-testid="lightbox">
          <button type="button" onClick={() => setLightbox(null)} aria-label={isAr ? 'إغلاق' : 'Close'} className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"><X className="w-5 h-5" /></button>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {!atBottom && (
        <button type="button" aria-label={isAr ? 'إلى آخر رسالة' : 'Scroll to latest'} onClick={() => { const el = box.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }} className="absolute bottom-3 end-3 w-9 h-9 rounded-full bg-white dark:bg-[#202C33] text-[#54656F] dark:text-[#AEBAC1] shadow-md flex items-center justify-center">
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/** The WhatsApp-style input: emoji, a rounded field that grows, and send (or record a voice note when empty). Text and voice only. */
export const ChatComposer: React.FC<{
  onSend: (text: string, attachment?: MessageAttachment) => void;
  placeholder: string;
  isAr: boolean;
  disabled?: boolean;
  label: string;
  notify?: (msg: string) => void;
}> = ({ onSend, placeholder, isAr, disabled, label, notify }) => {
  const [text, setText] = useState('');
  const [emojis, setEmojis] = useState(false);
  const [rec, setRec] = useState<null | { seconds: number }>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const sendAfterStop = useRef(true);
  const say = (m: string) => notify?.(m);
  const grow = () => { const el = ta.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; };
  useEffect(grow, [text]);
  useEffect(() => () => { sendAfterStop.current = false; if (timer.current) clearInterval(timer.current); stream.current?.getTracks().forEach((t) => t.stop()); }, []);

  const send = () => {
    const v = text.trim();
    if (!v || disabled) return;
    onSend(v);
    setText(''); setEmojis(false);
  };

  const stopTimer = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  const startVoice = async () => {
    if (disabled || rec) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { say(isAr ? 'التسجيل الصوتي غير متاح هنا.' : 'Voice notes are not available on this device.'); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = st;
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported?.(m));
      const mr = new MediaRecorder(st, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24000 });
      chunks.current = [];
      sendAfterStop.current = true;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        st.getTracks().forEach((t) => t.stop());
        stream.current = null;
        if (!sendAfterStop.current) return;
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const src = String(reader.result);
          if (src.length > MAX_DATA_URL) { say(isAr ? 'الرسالة الصوتية طويلة جداً.' : 'That voice note is too long.'); return; }
          onSend('', { kind: 'audio', src, seconds });
        };
        reader.readAsDataURL(blob);
      };
      recorder.current = mr;
      startedAt.current = Date.now();
      mr.start(500);
      setRec({ seconds: 0 });
      timer.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startedAt.current) / 1000);
        setRec({ seconds: sec });
        if (sec >= MAX_VOICE_SECONDS) endVoice(true);
      }, 250);
    } catch (e) {
      const n = (e as { name?: string })?.name;
      say(n === 'NotAllowedError' ? (isAr ? 'تم رفض إذن الميكروفون.' : 'Microphone permission was denied.') : (isAr ? 'لم يُعثر على ميكروفون.' : 'No microphone was found.'));
    }
  };
  const endVoice = (sendIt: boolean) => {
    stopTimer();
    sendAfterStop.current = sendIt;
    const mr = recorder.current;
    recorder.current = null;
    setRec(null);
    try { if (mr && mr.state !== 'inactive') mr.stop(); else stream.current?.getTracks().forEach((t) => t.stop()); } catch { /* already stopped */ }
  };

  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const hasContent = !!text.trim();
  return (
    <div className="bg-[#F0F2F5] dark:bg-[#202C33]" data-testid="chat-composer">
      {emojis && !rec && (
        <div className="px-3 pt-2 grid grid-cols-10 gap-0.5 text-[22px] leading-none max-h-28 overflow-y-auto" data-testid="emoji-panel">
          {EMOJIS.map((e) => <button key={e} type="button" onClick={() => { setText((t) => `${t}${e}`); ta.current?.focus(); }} className="py-1 rounded hover:bg-black/5 dark:hover:bg-white/10" aria-label={e}>{e}</button>)}
        </div>
      )}
      {rec ? (
        <div className="flex items-center gap-3 px-3 py-2" data-testid="voice-recording">
          <button type="button" onClick={() => endVoice(false)} aria-label={isAr ? 'إلغاء' : 'Cancel'} className="w-10 h-10 rounded-full text-[#54656F] dark:text-[#AEBAC1] flex items-center justify-center active:scale-95"><Trash2 className="w-5 h-5" /></button>
          <div className="flex-1 flex items-center gap-2 rounded-[22px] bg-white dark:bg-[#2A3942] px-4 py-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="tabular-nums text-[15px] text-[#111B21] dark:text-[#E9EDEF]" data-testid="voice-timer">{mmss(rec.seconds)}</span>
            <span className="text-xs text-[#667781] dark:text-[#8696A0] ms-auto">{isAr ? `الحد ${MAX_VOICE_SECONDS} ثانية` : `max ${MAX_VOICE_SECONDS}s`}</span>
          </div>
          <button type="button" onClick={() => endVoice(true)} aria-label={isAr ? 'إرسال الرسالة الصوتية' : 'Send voice note'} data-testid="voice-send" className={`w-11 h-11 rounded-full ${WA.send} text-white flex items-center justify-center shrink-0 active:scale-95`}><Send className="w-5 h-5 rtl:-scale-x-100" /></button>
        </div>
      ) : (
        <form className="flex items-end gap-1.5 px-2 py-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <div className="flex-1 min-w-0 flex items-end rounded-[22px] bg-white dark:bg-[#2A3942] shadow-sm">
            <button type="button" onClick={() => setEmojis((v) => !v)} aria-label={isAr ? 'الرموز التعبيرية' : 'Emoji'} aria-pressed={emojis} data-testid="emoji-toggle" className="w-10 h-11 shrink-0 text-[#54656F] dark:text-[#8696A0] flex items-center justify-center"><Smile className="w-6 h-6" /></button>
            <textarea
              ref={ta}
              rows={1}
              value={text}
              disabled={disabled}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !touch) { e.preventDefault(); send(); } }}
              dir="auto"
              aria-label={label}
              placeholder={placeholder}
              className="flex-1 min-w-0 resize-none bg-transparent text-[15px] leading-[20px] py-[11px] outline-none border-0 text-[#111B21] dark:text-[#E9EDEF] placeholder:text-[#667781] dark:placeholder:text-[#8696A0] disabled:opacity-60"
            />
          </div>
          {hasContent ? (
            <button type="submit" disabled={disabled} aria-label={isAr ? 'إرسال' : 'Send'} data-testid="chat-send" className={`w-11 h-11 rounded-full ${WA.send} text-white flex items-center justify-center shrink-0 active:scale-95 transition disabled:opacity-50`}>
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          ) : (
            <button type="button" onClick={() => void startVoice()} disabled={disabled} aria-label={isAr ? 'تسجيل رسالة صوتية' : 'Record a voice note'} data-testid="voice-start" className={`w-11 h-11 rounded-full ${WA.send} text-white flex items-center justify-center shrink-0 active:scale-95 transition disabled:opacity-50`}>
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}
    </div>
  );
};

/** The green bar at the top of a conversation. */
export const ChatHeader: React.FC<{ title: string; subtitle: string; avatar: React.ReactNode; onBack?: () => void; backLabel?: string; actions?: React.ReactNode }> = ({ title, subtitle, avatar, onBack, backLabel, actions }) => (
  <div className={`flex items-center gap-2 px-2.5 py-2 ${WA.header}`} data-testid="chat-header">
    {onBack && <button type="button" onClick={onBack} aria-label={backLabel ?? 'Back'} className="p-1.5 -ms-1 rounded-full hover:bg-white/10 active:scale-95"><ArrowLeft className="w-5 h-5 rtl:rotate-180" /></button>}
    {avatar}
    <div className="min-w-0 flex-1 leading-tight">
      <p className="font-semibold text-[16px] truncate" dir="auto">{title}</p>
      <p className="text-[12.5px] text-white/80 truncate" dir="auto">{subtitle}</p>
    </div>
    {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
  </div>
);

/** One row of the chat list: avatar, name, time, preview with ticks, unread badge. */
export const ChatListRow: React.FC<{ avatar: React.ReactNode; name: string; role: string; time: string; preview: string; unread: number; mineLast?: boolean; onClick: () => void }> = ({ avatar, name, role, time, preview, unread, mineLast, onClick }) => (
  <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-[#F5F6F6] dark:hover:bg-[#202C33] active:bg-[#EDEFF0] transition" data-testid="chat-row">
    {avatar}
    <span className="flex-1 min-w-0 border-b border-[#E9EDEF] dark:border-[#222D34] pb-3 -mb-3">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-[16px] text-[#111B21] dark:text-[#E9EDEF] truncate" dir="auto">{name}</span>
        <span className={`text-[12px] shrink-0 ${unread > 0 ? 'text-[#00A884] font-semibold' : WA.meta}`}>{time}</span>
      </span>
      <span className="block text-[12px] text-[#00A884] truncate" dir="auto">{role}</span>
      <span className="flex items-center justify-between gap-2 mt-0.5">
        <span className={`flex items-center gap-1 text-[14px] truncate ${WA.meta}`} dir="auto">
          {mineLast && <Check className="w-4 h-4 shrink-0" />}
          <span className="truncate">{preview}</span>
        </span>
        {unread > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#25D366] text-white text-[12px] font-bold flex items-center justify-center shrink-0" data-testid="chat-unread">{unread}</span>}
      </span>
    </span>
  </button>
);
