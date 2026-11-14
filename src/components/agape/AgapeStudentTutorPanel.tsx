import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  FileText,
  Table2,
  Presentation,
  Eye,
  X,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DocCategory,
  ResourceItem,
  TutorChatMessage,
  TutorLinkedDocument,
} from '../../types/lms';
import { useLms } from '../../context/LmsContext';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';

interface AgapeStudentTutorPanelProps {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  explanationText?: string;
  lessonResources?: ResourceItem[];
}

const QUOTA_STORAGE_KEY = 'cfp_agape_ai_quota_v1';
const MAX_DAILY_QUERIES = 5;

const getTodayKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const readUsedToday = (userId: string): number => {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const key = `${userId}::${getTodayKey()}`;
    return typeof parsed[key] === 'number' ? parsed[key] : 0;
  } catch {
    return 0;
  }
};

const writeUsedToday = (userId: string, count: number) => {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const key = `${userId}::${getTodayKey()}`;
    parsed[key] = count;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota errors
  }
};

export const AgapeStudentTutorPanel: React.FC<AgapeStudentTutorPanelProps> = ({
  lessonId,
  lessonTitle,
  courseTitle,
  explanationText,
  lessonResources = [],
}) => {
  const { currentUser, askTutorAI } = useLms();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [usedToday, setUsedToday] = useState<number>(() =>
    readUsedToday(currentUser.id)
  );
  const [messages, setMessages] = useState<TutorChatMessage[]>([
    {
      id: 'welcome',
      sender: 'tutor',
      text: `¡Hola ${currentUser.name.split(' ')[0]}! Soy el Tutor IA Ágape. Puedo ayudarte a entender la teoría, analizar tus guías o documentos vinculados y orientarte paso a paso (sin darte respuestas directas de exámenes).`,
      timestamp: new Date().toLocaleTimeString('es-SV', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Cloud doc linking inside Tutor IA
  const [activeLinkFormCategory, setActiveLinkFormCategory] =
    useState<DocCategory | null>(null);
  const [linkTitleInput, setLinkTitleInput] = useState<string>('');
  const [linkUrlInput, setLinkUrlInput] = useState<string>('');
  const [attachedDoc, setAttachedDoc] = useState<TutorLinkedDocument | null>(
    null
  );
  const [previewDoc, setPreviewDoc] = useState<TutorLinkedDocument | null>(
    null
  );

  useEffect(() => {
    setUsedToday(readUsedToday(currentUser.id));
  }, [currentUser.id]);

  // Keep subtle note when changing lesson
  useEffect(() => {
    setAttachedDoc(null);
  }, [lessonId]);

  const remaining = Math.max(0, MAX_DAILY_QUERIES - usedToday);
  const isQuotaExhausted = remaining <= 0;

  const handleAttachDoc = () => {
    if (!activeLinkFormCategory || !linkUrlInput.trim()) return;
    const defaultLabel =
      activeLinkFormCategory === 'spreadsheet'
        ? 'Hoja de Cálculo del Estudiante'
        : activeLinkFormCategory === 'presentation'
        ? 'Presentación del Estudiante'
        : 'Documento del Estudiante';
    setAttachedDoc({
      title: linkTitleInput.trim() || defaultLabel,
      url: linkUrlInput.trim(),
      category: activeLinkFormCategory,
    });
    setActiveLinkFormCategory(null);
    setLinkTitleInput('');
    setLinkUrlInput('');
  };

  const handleSendQuestion = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = inputQuestion.trim();
    if (!clean || isSending || isQuotaExhausted) return;

    const studentMsg: TutorChatMessage = {
      id: 'st-' + Date.now(),
      sender: 'student',
      text: clean,
      timestamp: new Date().toLocaleTimeString('es-SV', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      linkedDoc: attachedDoc || undefined,
    };

    const nextHistory = [...messages, studentMsg];
    setMessages(nextHistory);
    setInputQuestion('');
    setIsSending(true);

    // Increment daily quota cleanly
    const nextUsed = Math.min(MAX_DAILY_QUERIES, usedToday + 1);
    setUsedToday(nextUsed);
    writeUsedToday(currentUser.id, nextUsed);

    try {
      const res = await askTutorAI({
        question: clean,
        lessonTitle,
        courseTitle,
        explanationText,
        linkedDoc: attachedDoc || undefined,
        history: nextHistory.map((m) => ({ sender: m.sender, text: m.text })),
      });

      const tutorMsg: TutorChatMessage = {
        id: 'tu-' + Date.now(),
        sender: 'tutor',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('es-SV', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#CBB8E8] shadow-sm overflow-hidden">
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          url={previewDoc.url}
          category={previewDoc.category}
        />
      )}

      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] text-white px-4 py-3.5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#F2C94C]" />
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
              <span>Tutor IA Ágape</span>
              <Sparkles className="w-3 h-3 text-[#F2C94C]" />
            </div>
            <div className="text-[10px] text-slate-200">
              Orientación académica · Cero respuestas directas de examen
            </div>
          </div>
        </div>

        <button type="button" className="text-white/80 hover:text-white p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Visible Daily Quota Status Bar */}
      <div
        className={`px-4 py-2 text-[11px] font-bold flex items-center justify-between border-b ${
          isQuotaExhausted
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-[#F4F6F9] text-[#4B3B8B] border-slate-200'
        }`}
      >
        <span>Consultas IA disponibles hoy: {remaining}/5</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: MAX_DAILY_QUERIES }).map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx < remaining ? 'bg-[#4B3B8B]' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Quick link cloud document buttons */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Vincular recurso para consultar con el Tutor:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={isQuotaExhausted}
                onClick={() => setActiveLinkFormCategory('document')}
                className="px-2 py-1.5 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 border border-sky-200 text-sky-900 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <FileText className="w-3 h-3 text-sky-600 shrink-0" />
                <span>📄 Documento</span>
              </button>
              <button
                type="button"
                disabled={isQuotaExhausted}
                onClick={() => setActiveLinkFormCategory('spreadsheet')}
                className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200 text-emerald-900 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Table2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>📊 Hoja de Cálculo</span>
              </button>
              <button
                type="button"
                disabled={isQuotaExhausted}
                onClick={() => setActiveLinkFormCategory('presentation')}
                className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 border border-amber-200 text-amber-900 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Presentation className="w-3 h-3 text-amber-600 shrink-0" />
                <span>📽️ Presentación</span>
              </button>
            </div>

            {/* Quick pick from current lesson materials if available */}
            {lessonResources.length > 0 && !attachedDoc && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {lessonResources.slice(0, 2).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      setAttachedDoc({
                        title: r.title,
                        url: r.url,
                        category: r.docCategory || 'document',
                      })
                    }
                    className="text-[10px] px-2 py-0.5 bg-[#FAFBFD] hover:bg-[#F7F2FD] border border-slate-200 rounded text-[#4B3B8B] font-medium truncate max-w-[200px] cursor-pointer"
                    title={`Vincular material: ${r.title}`}
                  >
                    + {r.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inline Link Input */}
          {activeLinkFormCategory && (
            <div className="p-2.5 bg-[#FAFBFD] border border-[#CBB8E8] rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#4B3B8B] text-[11px]">
                  {activeLinkFormCategory === 'spreadsheet'
                    ? '📊 Enlace de Google Sheets / Excel'
                    : activeLinkFormCategory === 'presentation'
                    ? '📽️ Enlace de Google Slides / PPT'
                    : '📄 Enlace de Google Docs / Word / PDF'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveLinkFormCategory(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nombre breve (ej. Mi tabla de presupuesto)"
                value={linkTitleInput}
                onChange={(e) => setLinkTitleInput(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-[11px]"
              />
              <input
                type="url"
                placeholder="https://docs.google.com/... o enlace compartido"
                value={linkUrlInput}
                onChange={(e) => setLinkUrlInput(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-[11px]"
              />
              <button
                type="button"
                onClick={handleAttachDoc}
                disabled={!linkUrlInput.trim()}
                className="w-full py-1.5 bg-[#4B3B8B] disabled:opacity-50 text-white rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Adjuntar al Tutor IA
              </button>
            </div>
          )}

          {/* Attached Doc Pill */}
          {attachedDoc && (
            <div className="p-2 bg-[#F7F2FD] border border-[#CBB8E8] rounded-xl flex items-center justify-between gap-2 text-[11px]">
              <div className="truncate font-semibold text-[#3B2C73]">
                Adjunto: {attachedDoc.title}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(attachedDoc)}
                  className="p-1 bg-white rounded border border-slate-200 text-[#4B3B8B] hover:bg-slate-50 cursor-pointer"
                  title="Previsualizar dentro de la plataforma"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAttachedDoc(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Quitar adjunto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Chat Feed */}
          <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'student'
                    ? 'bg-[#4B3B8B] text-white ml-6'
                    : 'bg-[#F4F6F9] border border-slate-200 text-slate-800 mr-4'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                  <span className="font-bold">
                    {msg.sender === 'student' ? 'Tú' : 'Tutor IA Ágape'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                {msg.linkedDoc && (
                  <div className="mb-1.5 text-[10px] bg-white/15 px-2 py-1 rounded flex items-center justify-between gap-1">
                    <span className="truncate">{msg.linkedDoc.title}</span>
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(msg.linkedDoc!)}
                      className="underline shrink-0 cursor-pointer"
                    >
                      Ver
                    </button>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            ))}
            {isSending && (
              <div className="p-2.5 bg-[#F4F6F9] border border-slate-200 rounded-xl text-xs text-slate-500 mr-6 animate-pulse">
                Tutor IA Ágape está redactando su orientación...
              </div>
            )}
          </div>

          {/* Exhausted Lock OR Input Form */}
          {isQuotaExhausted ? (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">
                Has alcanzado tu límite diario de consultas gratuitas. Repasa tus guías o vuelve mañana
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendQuestion} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Pregunta una duda sobre la lección..."
                className="flex-1 p-2.5 bg-[#F4F6F9] border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4B3B8B]"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isSending}
                className="p-2.5 bg-[#4B3B8B] hover:bg-[#3B2D73] disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer transition-colors"
                title="Enviar consulta al Tutor IA Ágape"
              >
                <Send className="w-4 h-4 text-[#F2C94C]" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
