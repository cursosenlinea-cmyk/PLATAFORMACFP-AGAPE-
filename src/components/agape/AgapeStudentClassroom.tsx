import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Download,
  CheckCircle,
  UploadCloud,
  Award,
  ChevronRight,
  Layers,
  Sparkles,
  RefreshCw,
  Send,
  AlertCircle,
  Lightbulb,
  Check,
  RotateCcw,
  FlaskConical,
  FileCheck,
  Eye,
  FileText,
  Table2,
  Presentation,
  Film,
  X,
  ExternalLink,
  Clock,
  GraduationCap,
  Link as LinkIcon,
} from 'lucide-react';
import {
  Course,
  ResourceItem,
  AIPracticeExercise,
  AIEvaluationResult,
  DocCategory,
} from '../../types/lms';
import { useLms } from '../../context/LmsContext';
import { VideoPlayer } from '../common/VideoPlayer';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { AgapeSimulatorPlayer } from './AgapeSimulatorPlayer';
import { AgapeStudentTutorPanel } from './AgapeStudentTutorPanel';
import { compressImageFileToDataUrl } from '../../utils/imageUtils';

interface AgapeStudentClassroomProps {
  course: Course;
}

export const AgapeStudentClassroom: React.FC<AgapeStudentClassroomProps> = ({ course }) => {
  const {
    currentAuthUser,
    progress,
    isLessonCompleted,
    getLessonRequirementStatus,
    markLessonVideoWatched,
    getCourseProgressPercent,
    getModuleProgress,
    generateStudentExerciseAI,
    evaluateStudentAnswerAI,
    submitAssignmentWork,
    requestCertificate,
    openCertificate,
    recordSimulatorScore,
  } = useLms();

  // Navigation within course
  const [activeModuleId, setActiveModuleId] = useState<string>(course.modules[0]?.id || '');
  const [activeLessonId, setActiveLessonId] = useState<string>(
    course.modules[0]?.lessons[0]?.id || ''
  );

  const activeModule = course.modules.find((m) => m.id === activeModuleId) || course.modules[0];
  const activeLesson =
    activeModule?.lessons.find((l) => l.id === activeLessonId) || activeModule?.lessons[0];

  // Classroom tabs: 'theory' | 'materials' | 'ai-practice' | 'assignment' | 'simulator'
  const [activeTab, setActiveTab] = useState<'theory' | 'materials' | 'ai-practice' | 'assignment' | 'simulator'>(
    'theory'
  );

  // Sync active module/lesson when switching between enrolled courses
  useEffect(() => {
    setActiveModuleId(course.modules[0]?.id || '');
    setActiveLessonId(course.modules[0]?.lessons[0]?.id || '');
    setActiveTab('theory');
    setCurrentExercise(null);
    setEvaluationResult(null);
    setSelectedOption(null);
  }, [course.id]);

  // AI Practice Generator States
  const [isGeneratingExercise, setIsGeneratingExercise] = useState<boolean>(false);
  const [currentExercise, setCurrentExercise] = useState<AIPracticeExercise | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<AIEvaluationResult | null>(null);

  // Assignment file upload & cloud link state
  const assignmentFileInputRef = useRef<HTMLInputElement>(null);
  const [assignmentNotesInput, setAssignmentNotesInput] = useState<string>('');
  const [assignmentLinkCategory, setAssignmentLinkCategory] = useState<DocCategory | null>(null);
  const [assignmentCloudTitle, setAssignmentCloudTitle] = useState<string>('');
  const [assignmentCloudUrl, setAssignmentCloudUrl] = useState<string>('');

  // Document in-app preview state
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    category: DocCategory;
  } | null>(null);

  // Feedback toast
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const progressKey = `${currentAuthUser?.id || 'guest'}::${course.id}`;
  const courseProgress = progress[progressKey];
  const courseProgressPercent = getCourseProgressPercent(course.id);
  const isCompleted = activeLesson ? isLessonCompleted(course.id, activeLesson.id) : false;
  const activeReqStatus = activeLesson
    ? getLessonRequirementStatus(course.id, activeLesson.id)
    : null;
  const certRequest = courseProgress?.certificateRequest;

  // Simulator is visible ONLY if configured and explicitly enabled by Administrator
  const isSimulatorVisible = Boolean(
    activeLesson?.simulatorLab && activeLesson?.simulatorEnabledByAdmin === true
  );

  useEffect(() => {
    if (activeTab === 'simulator' && !isSimulatorVisible) {
      setActiveTab('theory');
    }
    if (activeTab === 'assignment' && !activeLesson?.assignment) {
      setActiveTab('theory');
    }
  }, [activeTab, isSimulatorVisible, activeLesson?.assignment]);

  const handleGenerateAIExercise = async () => {
    if (!activeLesson) return;
    setIsGeneratingExercise(true);
    setEvaluationResult(null);
    setSelectedOption(null);
    setShowHint(false);

    try {
      const exercise = await generateStudentExerciseAI(
        activeLesson.title,
        activeLesson.explanationText || activeLesson.summary || ''
      );
      setCurrentExercise(exercise);
      setActiveTab('ai-practice');
    } finally {
      setIsGeneratingExercise(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!currentExercise || selectedOption === null) return;
    setIsEvaluating(true);

    const studentAnswerText = currentExercise.options[selectedOption] || '';
    const correctAnswerText = currentExercise.options[currentExercise.correctOptionIndex] || '';

    try {
      const result = await evaluateStudentAnswerAI(
        currentExercise.question,
        studentAnswerText,
        correctAnswerText,
        currentExercise.explanation
      );
      setEvaluationResult(result);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDownloadResource = (res: ResourceItem) => {
    setDownloadNotice(`Abriendo material oficial: ${res.title}`);
    setTimeout(() => setDownloadNotice(null), 3500);

    if (res.url && res.url !== '#') {
      const a = document.createElement('a');
      a.href = res.url;
      a.download = res.title;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create a real downloadable text/document file for mock or newly created files
      const content = `CENTRO DE FORMACIÓN PROFESIONAL AGAPE (CFP AGAPE)\nDocumento de Práctica Técnica\n\nArchivo: ${res.title}\nDescripción: ${res.description || 'Guía técnica para prácticas en banco de trabajo.'}\nFecha: ${new Date().toLocaleDateString('es-SV')}\n\nInstrucciones Generales de Taller:\n1. Revisar normas de seguridad y equipo de protección personal.\n2. Efectuar los montajes y mediciones según el diagrama técnico.\n3. Presentar reporte de resultados al docente titular.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.title.includes('.') ? res.title : `${res.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          url={previewDoc.url}
          category={previewDoc.category}
        />
      )}

      {/* Toast Notification */}
      {downloadNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#3B2C73] text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-300 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Progress & Course Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4B3B8B] uppercase tracking-wider mb-1">
              <span className="bg-[#4B3B8B]/10 px-2.5 py-0.5 rounded-full">Aula Virtual del Alumno</span>
              <span>·</span>
              <span>CFP AGAPE</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#3B2C73]">
              {course.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Instructor titular: <strong className="text-slate-800">{course.instructor.name}</strong> ({course.instructor.title})
            </p>
          </div>

          {/* Global Progress Bar */}
          <div className="bg-[#FAFBFD] p-3.5 rounded-xl border border-slate-200 flex items-center gap-4 shrink-0">
            <div>
              <div className="text-xs font-bold text-slate-800">Progreso del Alumno</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {courseProgressPercent}% Completado
              </div>
            </div>

            <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] h-full rounded-full transition-all duration-300"
                style={{ width: `${courseProgressPercent}%` }}
              />
            </div>

            {courseProgressPercent === 100 && (
              <>
                {certRequest?.status === 'approved' ? (
                  <button
                    type="button"
                    onClick={() => openCertificate(course)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>⬇️ Descargar Certificado</span>
                  </button>
                ) : certRequest?.status === 'pending' ? (
                  <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs rounded-lg flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Solicitud Enviada (En Revisión)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        requestCertificate(course.id);
                        setDownloadNotice(
                          '¡Solicitud de certificado enviada al Administrador para verificación de notas!'
                        );
                        setTimeout(() => setDownloadNotice(null), 4000);
                      }}
                      className="px-3.5 py-2 bg-[#F2C94C] text-[#3B2C73] font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 hover:bg-amber-300 transition-colors cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>
                        {certRequest?.status === 'rejected'
                          ? '🎓 Volver a Solicitar Certificado'
                          : '🎓 Solicitar Certificado'}
                      </span>
                    </button>
                    {certRequest?.status === 'rejected' && certRequest.rejectionNote && (
                      <span className="text-[10px] text-rose-700 font-semibold max-w-[220px] text-right">
                        Observación: {certRequest.rejectionNote}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Classroom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Stage + Multi-Tab Content Deck (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Main Video Stage */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-950">
              <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-800">
                <VideoPlayer
                  src={
                    activeLesson?.videoUrl ||
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                  }
                  title={activeLesson?.title || 'Video de la Clase'}
                  onEnded={() => {
                    if (activeLesson) {
                      markLessonVideoWatched(course.id, activeLesson.id);
                      setDownloadNotice(
                        'Video reproducido hasta el final. Avance registrado automáticamente.'
                      );
                      setTimeout(() => setDownloadNotice(null), 3500);
                    }
                  }}
                />
              </div>
            </div>

            {/* Lesson Title & Automatic Progress Requirements */}
            <div className="p-5 border-b border-slate-200 flex flex-col gap-3 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#4B3B8B] font-semibold flex-wrap">
                    <Layers className="w-3.5 h-3.5 text-[#6080B8]" />
                    <span>{activeModule?.title || 'Módulo'}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span className="font-mono text-slate-500">
                      {activeLesson?.durationMinutes || 18} min
                    </span>
                    {activeLesson?.videoFileName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4F6F9] border border-slate-200 text-[10px] font-mono text-slate-600">
                        <Film className="w-3 h-3 text-[#4B3B8B]" />
                        <span className="truncate max-w-[180px]">{activeLesson.videoFileName}</span>
                        {activeLesson.videoFileSize && (
                          <strong className="text-[#4B3B8B]">({activeLesson.videoFileSize})</strong>
                        )}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {activeLesson?.title || 'Lección'}
                  </h2>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleGenerateAIExercise}
                    disabled={isGeneratingExercise}
                    className="px-3.5 py-2 bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 text-[#F2C94C] ${isGeneratingExercise ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingExercise ? 'Generando con IA...' : '✨ Generar Caso Práctico (IA)'}</span>
                  </button>

                  <span
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-[#FAFBFD] border-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle
                      className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}
                    />
                    <span>{isCompleted ? 'Lección Completada ✓' : 'Avance Automático'}</span>
                  </span>
                </div>
              </div>

              {/* Automatic Completion Checklist */}
              {activeReqStatus && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="text-slate-500 font-semibold mr-1">Requisitos para completar:</span>
                  {activeReqStatus.hasVideo && (
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-semibold border ${
                        activeReqStatus.videoWatched
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {activeReqStatus.videoWatched ? '✓ Video visto al final' : '○ Ver video hasta el final'}
                    </span>
                  )}
                  {activeReqStatus.hasAssignment && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('assignment')}
                      className={`px-2.5 py-0.5 rounded-md font-semibold border cursor-pointer ${
                        activeReqStatus.assignmentDone
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {activeReqStatus.assignmentDone ? '✓ Tarea entregada' : '○ Entregar tarea práctica'}
                    </button>
                  )}
                  {activeReqStatus.hasActiveSimulator && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('simulator')}
                      className={`px-2.5 py-0.5 rounded-md font-semibold border cursor-pointer ${
                        activeReqStatus.simulatorDone
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-purple-50 border-purple-200 text-[#4B3B8B] hover:bg-purple-100'
                      }`}
                    >
                      {activeReqStatus.simulatorDone
                        ? '✓ Simulador aprobado'
                        : '○ Aprobar simulador práctico'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content Tabs Navigation */}
            <div className="flex items-center px-6 border-b border-slate-200 bg-[#FAFBFD] overflow-x-auto gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('theory')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'theory'
                    ? 'border-[#4B3B8B] text-[#4B3B8B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Teoría y Guía de Taller</span>
              </button>

              {isSimulatorVisible && (
                <button
                  type="button"
                  onClick={() => setActiveTab('simulator')}
                  className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 relative ${
                    activeTab === 'simulator'
                      ? 'border-[#4B3B8B] text-[#4B3B8B] bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FlaskConical className="w-4 h-4 text-[#F2C94C]" />
                  <span>Laboratorio Virtual / Simulador</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('ai-practice')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 relative ${
                  activeTab === 'ai-practice'
                    ? 'border-[#4B3B8B] text-[#4B3B8B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#F2C94C]" />
                <span>Casos Prácticos con IA</span>
                {currentExercise && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('materials')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'materials'
                    ? 'border-[#4B3B8B] text-[#4B3B8B] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Materiales ({activeLesson?.resources?.length || 0})</span>
              </button>

              {activeLesson?.assignment && (
                <button
                  type="button"
                  onClick={() => setActiveTab('assignment')}
                  className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'assignment'
                      ? 'border-[#4B3B8B] text-[#4B3B8B] bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Tarea Práctica</span>
                </button>
              )}
            </div>

            {/* Tab Body: Teoría y Guía */}
            <div className="p-6 md:p-8">
              {activeTab === 'theory' && (
                <div className="space-y-6">
                  {/* Instructor Ribbon */}
                  <div className="flex items-center justify-between p-4 bg-[#FCF9EF] border border-[#EDE7D3] rounded-xl">
                    <div className="flex items-center gap-3">
                      <img
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-2xs"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {course.instructor.name}
                        </div>
                        <div className="text-[11px] text-[#4B3B8B] font-medium">
                          {course.instructor.title} · CFP AGAPE
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAIExercise}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#6080B8]/40 hover:bg-slate-50 text-[#4B3B8B] rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
                      <span>✨ Caso Práctico con IA</span>
                    </button>
                  </div>

                  {/* Written Theoretical Explanation */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#4B3B8B] uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#4B3B8B]" />
                      <span>Contenido de Clase & Protocolo Técnico</span>
                    </h3>

                    <div className="p-6 bg-[#FCF9EF]/60 border border-[#EDE7D3] rounded-xl text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans shadow-2xs">
                      {activeLesson?.explanationText ||
                        activeLesson?.summary ||
                        'Contenido teórico preparado por el docente del Centro de Formación Profesional AGAPE.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Body: Generador de Casos Prácticos con IA */}
              {activeTab === 'ai-practice' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#F2C94C]" />
                        <span>Generador de Casos Prácticos con IA</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        La IA analiza el contenido de la lección para formular un caso técnico real y evaluar tu respuesta al instante.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAIExercise}
                      disabled={isGeneratingExercise}
                      className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingExercise ? 'animate-spin' : ''}`} />
                      <span>{currentExercise ? 'Generar Otro Caso Práctico' : '✨ Generar Caso Práctico'}</span>
                    </button>
                  </div>

                  {/* Empty State before generating */}
                  {!currentExercise && !isGeneratingExercise && (
                    <div className="p-8 text-center bg-[#FAFBFD] border border-dashed border-[#6080B8]/40 rounded-2xl space-y-4">
                      <div className="w-12 h-12 rounded-full bg-[#4B3B8B]/10 text-[#4B3B8B] flex items-center justify-center mx-auto">
                        <Sparkles className="w-6 h-6 text-[#4B3B8B]" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">
                          ¿Listo para resolver un caso práctico interactivo?
                        </h4>
                        <p className="text-xs text-slate-500">
                          Presiona el botón para que el asistente de IA formule un problema de laboratorio basado en: <strong>{activeLesson?.title}</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateAIExercise}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-[#F2C94C]" />
                        <span>✨ Generar Caso Práctico (IA)</span>
                      </button>
                    </div>
                  )}

                  {/* Active Exercise Card */}
                  {currentExercise && (
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 animate-in fade-in duration-200">
                      <div>
                        <div className="inline-block px-2.5 py-0.5 bg-[#4B3B8B]/10 text-[#4B3B8B] text-[10px] font-bold uppercase rounded-md mb-2">
                          Caso Práctico en Taller
                        </div>
                        <h4 className="text-base font-extrabold text-[#3B2C73]">
                          {currentExercise.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                          {currentExercise.scenario}
                        </p>
                      </div>

                      {/* Question */}
                      <div className="space-y-3 pt-2">
                        <div className="text-xs font-bold text-slate-900">
                          {currentExercise.question}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {currentExercise.options.map((opt, idx) => {
                            const isSelected = selectedOption === idx;

                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (!evaluationResult) setSelectedOption(idx);
                                }}
                                className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? 'border-[#4B3B8B] bg-[#FCF9EF] shadow-2xs font-semibold'
                                    : 'border-slate-200 bg-white hover:border-[#6080B8] hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                      isSelected
                                        ? 'bg-[#4B3B8B] text-white'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>
                                  <span className="text-slate-800">{opt}</span>
                                </div>

                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-[#4B3B8B] text-white flex items-center justify-center shrink-0">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hint Bar */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setShowHint(!showHint)}
                          className="text-xs text-[#6080B8] hover:text-[#4B3B8B] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-[#F2C94C]" />
                          <span>{showHint ? 'Ocultar pista' : 'Ver pista técnica'}</span>
                        </button>

                        {!evaluationResult && (
                          <button
                            type="button"
                            onClick={handleEvaluateAnswer}
                            disabled={selectedOption === null || isEvaluating}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                              selectedOption !== null && !isEvaluating
                                ? 'bg-gradient-to-r from-[#3B2D73] to-[#4B3B8B] hover:opacity-95 text-white'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Send className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                            <span>{isEvaluating ? 'Evaluando con IA...' : 'Evaluar mi Respuesta'}</span>
                          </button>
                        )}
                      </div>

                      {showHint && currentExercise.hint && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2 animate-in fade-in">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>Pista: {currentExercise.hint}</span>
                        </div>
                      )}

                      {/* AI Instant Evaluation Feedback Card */}
                      {evaluationResult && (
                        <div
                          className={`p-5 rounded-xl border space-y-3 animate-in fade-in duration-300 ${
                            evaluationResult.isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                              : 'bg-rose-50/70 border-rose-300 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-sm">
                              {evaluationResult.isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-rose-600" />
                              )}
                              <span>{evaluationResult.feedbackTitle}</span>
                            </div>

                            <div className="px-3 py-1 bg-white rounded-lg font-mono font-bold text-xs shadow-2xs border border-slate-200">
                              Calificación: {evaluationResult.score}/100
                            </div>
                          </div>

                          <p className="text-xs leading-relaxed">
                            {evaluationResult.feedback}
                          </p>

                          <div className="p-3 bg-white/80 rounded-lg text-xs border border-slate-200">
                            <strong>Recomendación para Taller:</strong>{' '}
                            {evaluationResult.keyRecommendation}
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleGenerateAIExercise}
                              className="px-4 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Intentar Otro Caso Práctico</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Body: Materiales de Práctica */}
              {activeTab === 'materials' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Materiales de Práctica & Guías de Laboratorio
                    </h4>
                    <p className="text-xs text-slate-500">
                      Descarga los esquemas y guías preparados por el CFP ÁGAPE para tus prácticas de taller.
                    </p>
                  </div>

                  {(!activeLesson?.resources || activeLesson.resources.length === 0) ? (
                    <div className="p-8 text-center bg-[#FAFBFD] border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                      No hay archivos o guías adjuntas para esta lección todavía.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {activeLesson.resources.map((res) => (
                        <div
                          key={res.id}
                          className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:border-[#6080B8] transition-all shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs uppercase border shrink-0 ${
                              res.docCategory === 'spreadsheet' || res.type === 'gsheet' || res.type === 'excel'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : res.docCategory === 'presentation' || res.type === 'gslides' || res.type === 'ppt'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : res.type === 'pdf'
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                              {res.docCategory === 'spreadsheet'
                                ? '📊'
                                : res.docCategory === 'presentation'
                                ? '📽️'
                                : res.type === 'gdoc' || res.docCategory === 'document'
                                ? '📄'
                                : res.type || 'DOC'}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{res.title}</div>
                              <div className="text-[11px] text-slate-400 font-mono truncate">
                                {res.size || 'Recurso CFP ÁGAPE'} · {res.type.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {res.url && res.url !== '#' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    title: res.title,
                                    url: res.url,
                                    category: res.docCategory || 'document',
                                  })
                                }
                                className="px-2.5 py-1.5 bg-[#F7F2FD] hover:bg-[#EDE4FB] text-[#4B3B8B] border border-[#CBB8E8] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                title="Abrir dentro de la plataforma"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadResource(res)}
                              className="px-3 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Abrir</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Body: Tarea Práctica */}
              {activeTab === 'assignment' && activeLesson?.assignment && (() => {
                const assignment = activeLesson.assignment;
                const existingSubmission = courseProgress?.assignmentSubmissions?.[assignment.id];
                const deliveryType = assignment.deliveryType || 'both';
                const allowFile = deliveryType === 'file' || deliveryType === 'both';
                const allowLink = deliveryType === 'link' || deliveryType === 'both';

                const handleAssignmentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  const sizeStr =
                    file.size > 1048576
                      ? `${(file.size / 1048576).toFixed(1)} MB`
                      : `${Math.max(1, Math.round(file.size / 1024))} KB`;

                  let fileData: string | undefined;
                  try {
                    if (file.type.startsWith('image/')) {
                      fileData = await compressImageFileToDataUrl(file, 1024, 0.8);
                    } else if (file.size <= 2 * 1024 * 1024) {
                      fileData = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result || ''));
                        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
                        reader.readAsDataURL(file);
                      });
                    }
                  } catch {
                    fileData = undefined;
                  }

                  submitAssignmentWork(
                    course.id,
                    assignment.id,
                    file.name,
                    assignmentNotesInput.trim() || 'Reporte técnico entregado desde el Aula Virtual.',
                    sizeStr,
                    undefined,
                    undefined,
                    fileData
                  );
                  setDownloadNotice(`Entrega "${file.name}" registrada correctamente.`);
                  setTimeout(() => setDownloadNotice(null), 3500);
                };

                return (
                  <div className="space-y-4">
                    <input
                      ref={assignmentFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.txt"
                      className="hidden"
                      onChange={handleAssignmentFileChange}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{assignment.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        {assignment.dueDate && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            Fecha límite: {assignment.dueDate}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-[#4B3B8B]/10 text-[#4B3B8B] font-bold">
                          Ponderación: {assignment.maxPoints || 100} pts
                        </span>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-[#4B3B8B]">
                        Instrucciones de la Asignación:
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {assignment.instructions || assignment.description}
                      </p>
                    </div>

                    {existingSubmission && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-bold text-emerald-900 truncate">
                                Evidencia entregada: {existingSubmission.fileName}
                              </div>
                              <div className="text-[11px] text-emerald-700">
                                Registrado el {new Date(existingSubmission.submittedAt).toLocaleDateString('es-SV')} ·{' '}
                                Estado: {existingSubmission.status === 'graded' ? 'Calificada por Docente' : 'Entregada'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {existingSubmission.linkUrl && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDoc({
                                      title: existingSubmission.fileName,
                                      url: existingSubmission.linkUrl!,
                                      category: existingSubmission.docCategory || 'document',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Vista Previa</span>
                                </button>
                                <a
                                  href={existingSubmission.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Abrir</span>
                                </a>
                              </>
                            )}
                            {typeof existingSubmission.grade === 'number' ? (
                              <span className="px-3 py-1 bg-[#4B3B8B] text-white rounded-lg font-mono font-bold text-xs">
                                Nota: {existingSubmission.grade}/{assignment.maxPoints || 100}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]">
                                Recibido
                              </span>
                            )}
                          </div>
                        </div>
                        {existingSubmission.feedback && (
                          <div className="p-3 bg-white border border-emerald-200 rounded-lg text-[11px] text-slate-700">
                            <strong className="text-[#4B3B8B]">Retroalimentación del Docente:</strong>{' '}
                            {existingSubmission.feedback}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 text-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold">
                            {deliveryType === 'file'
                              ? 'Entrega mediante Archivo Local:'
                              : deliveryType === 'link'
                              ? 'Entrega mediante Enlace en la Nube / Web:'
                              : 'Entrega de Reporte o Enlace en la Nube:'}
                          </div>
                          <p className="text-sky-800 text-[11px]">
                            {deliveryType === 'file'
                              ? 'Sube tu archivo PDF, Word, Excel, ZIP o fotografía de taller.'
                              : deliveryType === 'link'
                              ? 'Vincula tu Documento, Hoja de Cálculo, Presentación o enlace web.'
                              : 'Sube un archivo local o vincula tu Documento, Hoja de Cálculo o Presentación en línea.'}
                          </p>
                        </div>

                        {allowFile && (
                          <button
                            type="button"
                            onClick={() => assignmentFileInputRef.current?.click()}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>{existingSubmission ? 'Reemplazar Archivo' : 'Subir Archivo Local'}</span>
                          </button>
                        )}
                      </div>

                      {allowLink && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignmentLinkCategory('document');
                              if (existingSubmission?.linkUrl) {
                                setAssignmentCloudTitle(existingSubmission.fileName);
                                setAssignmentCloudUrl(existingSubmission.linkUrl);
                              }
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-sky-100 border border-sky-200 text-sky-900 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>📄 Documento</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignmentLinkCategory('spreadsheet')}
                            className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Table2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>📊 Hoja de Cálculo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignmentLinkCategory('presentation')}
                            className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Presentation className="w-3.5 h-3.5 text-amber-600" />
                            <span>📽️ Presentación</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignmentLinkCategory('other')}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-[#4B3B8B]" />
                            <span>🔗 Enlace Web</span>
                          </button>
                        </div>
                      )}

                      {allowLink && assignmentLinkCategory && (
                        <div className="p-3 bg-white border border-sky-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#4B3B8B] text-[11px]">
                              {assignmentLinkCategory === 'spreadsheet'
                                ? '📊 Enviar enlace de Hoja de Cálculo (Google Sheets / Excel)'
                                : assignmentLinkCategory === 'presentation'
                                ? '📽️ Enviar enlace de Presentación (Google Slides / PPT)'
                                : assignmentLinkCategory === 'other'
                                ? '🔗 Enviar Enlace Web de Evidencia'
                                : '📄 Enviar enlace de Documento (Google Docs / Word / OneDrive)'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAssignmentLinkCategory(null)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Título de tu entrega..."
                              value={assignmentCloudTitle}
                              onChange={(e) => setAssignmentCloudTitle(e.target.value)}
                              className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                            />
                            <input
                              type="url"
                              placeholder="https://docs.google.com/... o enlace compartido"
                              value={assignmentCloudUrl}
                              onChange={(e) => setAssignmentCloudUrl(e.target.value)}
                              className="sm:col-span-2 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={!assignmentCloudUrl.trim()}
                              onClick={() => {
                                if (!assignmentCloudUrl.trim()) return;
                                const title =
                                  assignmentCloudTitle.trim() ||
                                  (assignmentLinkCategory === 'spreadsheet'
                                    ? 'Hoja de Cálculo Entregada'
                                    : assignmentLinkCategory === 'presentation'
                                    ? 'Presentación Entregada'
                                    : assignmentLinkCategory === 'other'
                                    ? 'Enlace Web Entregado'
                                    : 'Documento Entregado');
                                submitAssignmentWork(
                                  course.id,
                                  assignment.id,
                                  title,
                                  assignmentNotesInput.trim() ||
                                    'Evidencia en la nube vinculada desde el Aula Virtual.',
                                  'Enlace Cloud',
                                  assignmentCloudUrl.trim(),
                                  assignmentLinkCategory
                                );
                                setAssignmentLinkCategory(null);
                                setAssignmentCloudTitle('');
                                setAssignmentCloudUrl('');
                                setDownloadNotice(`Evidencia "${title}" enviada correctamente.`);
                                setTimeout(() => setDownloadNotice(null), 3500);
                              }}
                              className="px-4 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2D73] disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              {existingSubmission?.linkUrl ? 'Actualizar Enlace' : 'Entregar Enlace'}
                            </button>
                          </div>
                        </div>
                      )}

                      <textarea
                        rows={2}
                        value={assignmentNotesInput}
                        onChange={(e) => setAssignmentNotesInput(e.target.value)}
                        placeholder="Comentarios adicionales para el docente (opcional)..."
                        className="w-full p-2.5 bg-white border border-sky-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B] resize-none"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Tab Body: Laboratorio Virtual / Simulador (Render ONLY when enabled by Admin) */}
              {activeTab === 'simulator' && isSimulatorVisible && activeLesson?.simulatorLab && (
                <div className="space-y-4">
                  <AgapeSimulatorPlayer
                    simulator={activeLesson.simulatorLab}
                    onCompleted={(score) => {
                      const simLab = activeLesson?.simulatorLab;
                      if (simLab) {
                        recordSimulatorScore(
                          course.id,
                          simLab.id,
                          simLab.title,
                          score,
                          score >= (simLab.passingScore || 70)
                        );
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tutor IA Ágape + Module & Lessons Syllabus Navigator (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {activeLesson && (
            <AgapeStudentTutorPanel
              lessonId={activeLesson.id}
              lessonTitle={activeLesson.title}
              courseTitle={course.title}
              explanationText={activeLesson.explanationText || activeLesson.summary}
              lessonResources={activeLesson.resources}
            />
          )}

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Plan de Estudios & Lecciones
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {course.modules.flatMap((m) => m.lessons).length} clases
              </span>
            </div>

            <div className="space-y-4">
              {course.modules.map((mod, modIdx) => {
                const modProg = getModuleProgress(course.id, mod.id);

                return (
                  <div key={mod.id} className="space-y-2">
                    {/* Module Title & Progress */}
                    <div className="flex items-center justify-between text-xs font-bold text-[#4B3B8B]">
                      <span>{mod.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {modProg.completed}/{modProg.total}
                      </span>
                    </div>

                    {/* Lessons list */}
                    <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                      {mod.lessons.map((les) => {
                        const isCurrent = les.id === activeLessonId;
                        const isDone = isLessonCompleted(course.id, les.id);

                        return (
                          <div
                            key={les.id}
                            onClick={() => {
                              setActiveModuleId(mod.id);
                              setActiveLessonId(les.id);
                            }}
                            className={`p-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                              isCurrent
                                ? 'bg-[#FCF9EF] border border-[#EDE7D3] font-bold text-[#3B2C73] shadow-2xs'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div
                                title={
                                  isDone
                                    ? 'Lección completada automáticamente'
                                    : 'Se completa automáticamente al ver el video, entregar la tarea y aprobar el simulador'
                                }
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-300 bg-white'
                                }`}
                              >
                                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>

                              <span className="truncate">{les.title}</span>
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                              {les.durationMinutes || 15}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
