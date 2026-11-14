import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle,
  FileText,
  Video,
  GripVertical,
  Layers,
  Sparkles,
  UserCheck,
  Link as LinkIcon,
  Clock,
  BookOpen,
  FileCode,
  ShieldCheck,
  Download,
  FlaskConical,
  Eye,
  Table2,
  Presentation,
  ExternalLink,
  X,
  Calendar,
} from 'lucide-react';
import {
  Course,
  CourseLevel,
  Lesson,
  ResourceItem,
  QuizQuestion,
  DocCategory,
  AssignmentDeliveryType,
} from '../../types/lms';
import { useLms } from '../../context/LmsContext';
import { VideoPlayer } from '../common/VideoPlayer';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { InstructorManagerModal } from './InstructorManagerModal';
import { SimulatorLabModal } from './SimulatorLabModal';
import { compressImageFileToDataUrl } from '../../utils/imageUtils';

interface CourseStructureEditorProps {
  course: Course;
}

export const CourseStructureEditor: React.FC<CourseStructureEditorProps> = ({ course }) => {
  const {
    updateCourse,
    addModule,
    updateModule,
    deleteModule,
    addLesson,
    updateLesson,
    deleteLesson,
    addResource,
    updateResource,
    deleteResource,
    saveQuiz,
    saveAssignment,
    deleteSimulatorLab,
    generateLessonExplanationAI,
    generatePracticeAI,
    role,
    toggleLessonSimulator,
  } = useLms();

  const [isGeneratingExplanationAI, setIsGeneratingExplanationAI] = useState<boolean>(false);
  const [isGeneratingPracticeAI, setIsGeneratingPracticeAI] = useState<boolean>(false);

  // Active Tab: Info. General | Estructura y Contenidos | Módulo Virtual / Simulador | Config. Avanzada
  const [activeTab, setActiveTab] = useState<'info' | 'structure' | 'virtual-simulator' | 'advanced'>('structure');

  // Dynamic Accordion & Selection state for modules and lessons
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>(() =>
    course.modules.map((m) => m.id)
  );
  const [activeModuleId, setActiveModuleId] = useState<string>(
    course.modules[0]?.id || ''
  );
  const [activeLessonId, setActiveLessonId] = useState<string>(
    course.modules[0]?.lessons[0]?.id || ''
  );

  const activeModule =
    course.modules.find((m) => m.id === activeModuleId) || course.modules[0];
  const activeLesson =
    activeModule?.lessons.find((l) => l.id === activeLessonId) || activeModule?.lessons[0];

  // Active Lesson editable buffers
  const [lessonTitle, setLessonTitle] = useState<string>(
    activeLesson?.title || 'Lección 1.1: Introducción a Circuitos'
  );
  const [lessonProgress, setLessonProgress] = useState<number>(68);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [videoSuccess, setVideoSuccess] = useState<boolean>(true);
  const [showVideoPreview, setShowVideoPreview] = useState<boolean>(false);

  // Video URL & File details
  const [videoUrl, setVideoUrl] = useState<string>(
    activeLesson?.videoUrl ||
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  );
  const [videoFileName, setVideoFileName] = useState<string>(
    activeLesson?.videoFileName || 'clase_01_introduccion_circuitos_hd.mp4'
  );
  const [videoFileSize, setVideoFileSize] = useState<string>(
    activeLesson?.videoFileSize || ''
  );
  const [videoDuration, setVideoDuration] = useState<string>('18 min 30 s');
  const [externalUrlInput, setExternalUrlInput] = useState<string>(
    activeLesson?.videoUrl && !activeLesson.videoUrl.startsWith('blob:')
      ? activeLesson.videoUrl
      : ''
  );

  // Cloud Document Linking, Editing & Preview States
  const [cloudLinkCategory, setCloudLinkCategory] = useState<DocCategory | null>(null);
  const [cloudLinkTitle, setCloudLinkTitle] = useState<string>('');
  const [cloudLinkUrl, setCloudLinkUrl] = useState<string>('');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    category: DocCategory;
  } | null>(null);

  // Lesson Explanation Text (Lectura / Guía teórica / Código)
  const defaultExplanation =
    activeLesson?.explanationText ||
    `OBJETIVOS DE LA CLASE:
1. Comprender la Ley de Ohm: V = I × R (Voltaje = Corriente × Resistencia).
2. Distinguir la diferencia entre corriente continua (DC) y corriente alterna (AC).
3. Interpretar el código de colores en resistores de 4 y 5 bandas.

GUÍA PRÁCTICA DE LABORATORIO EN PROTOBOARD:
- Paso 1: Conectar la fuente regulada a 5V DC en los rieles de alimentación del protoboard.
- Paso 2: Insertar un resistor limitador de 330Ω en serie con un diodo LED rojo (ánodo pata larga al polo positivo).
- Paso 3: Cerrar el circuito con un pulsador normalmente abierto.
- Paso 4: Medir con el multímetro digital la caída de tensión en el LED (~1.8V a 2.1V).

PRECAUCIÓN DE SEGURIDAD EN TALLER AGAPE:
Nunca energizar el circuito sin haber verificado la polaridad de los capacitores electrolíticos para evitar sobrecalentamiento.`;

  const [explanationText, setExplanationText] = useState<string>(defaultExplanation);

  // Trailer & Thumbnail uploads
  const [trailerName, setTrailerName] = useState<string>('trailer_circuitos_base.mp4');
  const [thumbnailName, setThumbnailName] = useState<string>('portada_electronica_hd.jpg');
  const [trailerUploading, setTrailerUploading] = useState<boolean>(false);
  const [thumbnailUploading, setThumbnailUploading] = useState<boolean>(false);

  // Assignment notes / Detalle de asignación
  const [assignmentNotes, setAssignmentNotes] = useState<string>(
    activeLesson?.assignment?.description || ''
  );

  // General course metadata for Info General tab
  const [courseTitle, setCourseTitle] = useState<string>(course.title);
  const [courseSubtitle, setCourseSubtitle] = useState<string>(course.subtitle || '');
  const [courseCategory, setCourseCategory] = useState<string>(course.category);
  const [courseLevel, setCourseLevel] = useState<CourseLevel>(course.level);
  const [courseDescription, setCourseDescription] = useState<string>(course.description || '');
  const [coursePrice, setCoursePrice] = useState<number>(course.price);

  // Modals
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState<boolean>(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState<boolean>(false);

  // Module Edit Modal State
  const [editingModuleModal, setEditingModuleModal] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);

  // Lesson Create / Edit Modal State
  const [lessonModal, setLessonModal] = useState<{
    mode: 'create' | 'edit';
    moduleId: string;
    lessonId?: string;
    title: string;
    summary: string;
    durationMinutes: number;
  } | null>(null);

  // Assignment Create / Edit Modal State
  const [showAssignmentModal, setShowAssignmentModal] = useState<boolean>(false);
  const [assignTitle, setAssignTitle] = useState<string>('');
  const [assignInstructions, setAssignInstructions] = useState<string>('');
  const [assignDueDate, setAssignDueDate] = useState<string>('2026-11-30');
  const [assignMaxPoints, setAssignMaxPoints] = useState<number>(100);
  const [assignDeliveryType, setAssignDeliveryType] = useState<AssignmentDeliveryType>('both');

  // Quiz Create / Edit Modal State
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);
  const [quizTitle, setQuizTitle] = useState<string>('Evaluación Rápida de Conocimientos');
  const [quizPassingScore, setQuizPassingScore] = useState<number>(70);
  const [quizQuestionText, setQuizQuestionText] = useState<string>('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '', '', '']);
  const [quizCorrectIdx, setQuizCorrectIdx] = useState<number>(0);
  const [quizExplanation, setQuizExplanation] = useState<string>('');

  // In-place dynamic module creation state
  const [isCreatingModule, setIsCreatingModule] = useState<boolean>(false);
  const [newModuleTitle, setNewModuleTitle] = useState<string>('');
  const [newModuleDesc, setNewModuleDesc] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync editor buffers whenever active course changes (multi-course support)
  useEffect(() => {
    const firstMod = course.modules[0];
    const firstLes = firstMod?.lessons[0];
    setExpandedModuleIds(course.modules.map((m) => m.id));
    setActiveModuleId(firstMod?.id || '');
    setActiveLessonId(firstLes?.id || '');
    setLessonTitle(firstLes?.title || '');
    setExplanationText(firstLes?.explanationText || firstLes?.summary || defaultExplanation);
    setVideoUrl(
      firstLes?.videoUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    );
    setVideoFileName(firstLes?.videoFileName || 'clase_video_hd.mp4');
    setVideoFileSize(firstLes?.videoFileSize || '');
    setExternalUrlInput(
      firstLes?.videoUrl && !firstLes.videoUrl.startsWith('blob:') ? firstLes.videoUrl : ''
    );
    setAssignmentNotes(firstLes?.assignment?.description || '');
    setCourseTitle(course.title);
    setCourseSubtitle(course.subtitle || '');
    setCourseCategory(course.category);
    setCourseLevel(course.level);
    setCourseDescription(course.description || '');
    setCoursePrice(course.price);
    setShowVideoPreview(false);
    setCloudLinkCategory(null);
    setEditingResourceId(null);
  }, [course.id]);

  // Switch active lesson & sync buffers
  const handleSelectLesson = (modId: string, les: Lesson) => {
    // Commit current buffer first if previous active existed
    if (activeModuleId && activeLessonId) {
      updateLesson(course.id, activeModuleId, activeLessonId, {
        title: lessonTitle,
        explanationText,
        videoUrl,
        videoFileName,
        videoFileSize: videoFileSize || undefined,
        ...(activeLesson?.assignment
          ? {
              assignment: {
                ...activeLesson.assignment,
                description: assignmentNotes || activeLesson.assignment.description,
                instructions: assignmentNotes || activeLesson.assignment.instructions,
              },
            }
          : {}),
      });
    }

    setActiveModuleId(modId);
    setActiveLessonId(les.id);
    setLessonTitle(les.title);
    setExplanationText(les.explanationText || les.summary || defaultExplanation);
    setVideoUrl(les.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setVideoFileName(les.videoFileName || 'clase_video_hd.mp4');
    setVideoFileSize(les.videoFileSize || '');
    setExternalUrlInput(les.videoUrl && !les.videoUrl.startsWith('blob:') ? les.videoUrl : '');
    setAssignmentNotes(les.assignment?.description || '');
    setShowVideoPreview(false);
    setCloudLinkCategory(null);
    setEditingResourceId(null);
  };

  // File input refs for real browser uploads
  const videoInputRef = useRef<HTMLInputElement>(null);
  const trailerInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [replaceDocId, setReplaceDocId] = useState<string | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState<boolean>(false);

  const handleUploadMainVideo = () => {
    videoInputRef.current?.click();
  };

  const handleUploadTrailer = () => {
    trailerInputRef.current?.click();
  };

  const handleUploadThumbnail = () => {
    thumbnailInputRef.current?.click();
  };

  const handleAddAttachment = () => {
    setReplaceDocId(null);
    documentInputRef.current?.click();
  };

  const toggleModule = (modId: string) => {
    setExpandedModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  // Video File Processing with URL.createObjectURL
  const handleProcessVideoFile = (file: File) => {
    setIsUploadingVideo(true);
    setLessonProgress(25);
    setVideoSuccess(false);

    const sizeStr =
      file.size > 1048576
        ? `${(file.size / 1048576).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    // Create real browser object URL for instant HTML5 playback
    const blobUrl = URL.createObjectURL(file);

    let curr = 25;
    const interval = setInterval(() => {
      curr += 25;
      if (curr >= 100) {
        setLessonProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsUploadingVideo(false);
          setVideoSuccess(true);
          setVideoUrl(blobUrl);
          setVideoFileName(file.name);
          setVideoFileSize(sizeStr);
          setShowVideoPreview(true);

          if (activeModuleId && activeLessonId) {
            updateLesson(course.id, activeModuleId, activeLessonId, {
              videoUrl: blobUrl,
              videoFileName: file.name,
              videoFileSize: sizeStr,
            });
          }
          showToast(`¡Video "${file.name}" (${sizeStr}) cargado y listo para reproducir!`);
        }, 180);
      } else {
        setLessonProgress(curr);
      }
    }, 80);
  };

  // Drag and drop video file handler
  const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessVideoFile(file);
    }
  };

  const handleApplyExternalVideoUrl = () => {
    if (!externalUrlInput.trim()) return;
    const url = externalUrlInput.trim();
    const displayLabel = /youtube\.com|youtu\.be/i.test(url)
      ? `Video YouTube (${url.slice(0, 34)}...)`
      : url.length > 42
      ? url.substring(0, 39) + '...'
      : url;
    setVideoUrl(url);
    setVideoFileName(displayLabel);
    setVideoFileSize('Enlace externo');
    setVideoSuccess(true);
    setShowVideoPreview(true);
    if (activeModuleId && activeLessonId) {
      updateLesson(course.id, activeModuleId, activeLessonId, {
        videoUrl: url,
        videoFileName: displayLabel,
        videoFileSize: 'Enlace externo',
      });
    }
    showToast('Enlace de video vinculado y listo para reproducción.');
  };

  const handleTrailerFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTrailerUploading(true);
    const blobUrl = URL.createObjectURL(file);
    setTimeout(() => {
      setTrailerUploading(false);
      setTrailerName(file.name);
      updateCourse(course.id, {
        trailerVideoUrl: blobUrl,
      });
      showToast(`Video introductorio "${file.name}" cargado exitosamente.`);
    }, 350);
    e.target.value = '';
  };

  const handleThumbnailFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setThumbnailUploading(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 720, 0.82);
      setThumbnailName(file.name);
      updateCourse(course.id, {
        coverImage: dataUrl,
      });
      showToast(`Imagen de portada "${file.name}" guardada correctamente.`);
    } catch {
      showToast('Error al procesar la imagen de portada.');
    } finally {
      setThumbnailUploading(false);
    }
  };

  // Document File Processing (PDF, Word, Excel, PPT, ZIP)
  const handleDocumentFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1048576
        ? (file.size / 1048576).toFixed(1) + ' MB'
        : Math.max(1, Math.round(file.size / 1024)) + ' KB';

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let docType: ResourceItem['type'] = 'pdf';
    let docCategory: DocCategory = 'document';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      docType = 'zip';
      docCategory = 'other';
    } else if (['doc', 'docx', 'odt'].includes(ext)) {
      docType = 'doc';
      docCategory = 'document';
    } else if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      docType = 'excel';
      docCategory = 'spreadsheet';
    } else if (['ppt', 'pptx', 'odp'].includes(ext)) {
      docType = 'ppt';
      docCategory = 'presentation';
    } else if (['js', 'ts', 'py', 'c', 'cpp', 'html', 'json'].includes(ext)) {
      docType = 'code';
      docCategory = 'other';
    }

    const fileUrl = URL.createObjectURL(file);

    if (activeModuleId && activeLessonId) {
      if (replaceDocId) {
        deleteResource(course.id, activeModuleId, activeLessonId, replaceDocId);
        setReplaceDocId(null);
      }
      addResource(course.id, activeModuleId, activeLessonId, {
        title: file.name,
        type: docType,
        size: sizeStr,
        url: fileUrl,
        docCategory,
        provider: 'file',
        description: 'Documento oficial adjunto para prácticas.',
      });
      showToast(`Archivo "${file.name}" (${sizeStr}) cargado correctamente.`);
    }

    e.target.value = '';
  };

  const handleSaveCloudDocumentLink = () => {
    if (!cloudLinkCategory || !cloudLinkUrl.trim() || !activeModuleId || !activeLessonId) return;
    const cleanUrl = cloudLinkUrl.trim();
    const defaultTitle =
      cloudLinkCategory === 'spreadsheet'
        ? 'Hoja de Cálculo en la Nube'
        : cloudLinkCategory === 'presentation'
        ? 'Presentación de Clase'
        : cloudLinkCategory === 'other'
        ? 'Enlace Web de Apoyo'
        : 'Documento Técnico en la Nube';
    const title = cloudLinkTitle.trim() || defaultTitle;
    const isGoogle = /docs\.google\.com|drive\.google\.com/i.test(cleanUrl);
    const isOneDrive = /onedrive\.live\.com|1drv\.ms|sharepoint\.com/i.test(cleanUrl);

    const resType: ResourceItem['type'] =
      cloudLinkCategory === 'spreadsheet'
        ? isGoogle
          ? 'gsheet'
          : 'excel'
        : cloudLinkCategory === 'presentation'
        ? isGoogle
          ? 'gslides'
          : 'ppt'
        : cloudLinkCategory === 'other' && !isGoogle && !isOneDrive
        ? 'link'
        : isGoogle
        ? 'gdoc'
        : 'doc';

    const resourcePayload: Omit<ResourceItem, 'id'> = {
      title,
      type: resType,
      size: isGoogle ? 'Google Workspace' : isOneDrive ? 'OneDrive' : 'Enlace Web',
      url: cleanUrl,
      docCategory: cloudLinkCategory,
      provider: isGoogle ? 'google' : isOneDrive ? 'onedrive' : 'external',
      description: 'Recurso en la nube vinculado para visualización integrada.',
    };

    if (editingResourceId) {
      updateResource(course.id, activeModuleId, activeLessonId, editingResourceId, resourcePayload);
      showToast(`Enlace "${title}" actualizado correctamente.`);
    } else {
      addResource(course.id, activeModuleId, activeLessonId, resourcePayload);
      showToast(`Recurso "${title}" vinculado correctamente.`);
    }

    setCloudLinkCategory(null);
    setCloudLinkTitle('');
    setCloudLinkUrl('');
    setEditingResourceId(null);
  };

  const openEditCloudLink = (res: ResourceItem) => {
    setEditingResourceId(res.id);
    setCloudLinkCategory(res.docCategory || (res.type === 'link' ? 'other' : 'document'));
    setCloudLinkTitle(res.title);
    setCloudLinkUrl(res.url === '#' ? '' : res.url);
  };

  const handleDownloadOrOpenResource = (res: ResourceItem) => {
    if (res.url && res.url !== '#') {
      const a = document.createElement('a');
      a.href = res.url;
      if (res.provider === 'file' || res.url.startsWith('blob:') || res.url.startsWith('data:')) {
        a.download = res.title;
      }
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `CENTRO DE FORMACIÓN PROFESIONAL AGAPE (CFP AGAPE)\n\nDocumento: ${res.title}\nDescripción: ${res.description || 'Guía de laboratorio.'}\nFecha: ${new Date().toLocaleDateString('es-SV')}`;
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

  const openAssignmentModal = () => {
    const current = activeLesson?.assignment;
    setAssignTitle(current?.title || `Tarea Práctica: ${lessonTitle}`);
    setAssignInstructions(current?.instructions || current?.description || assignmentNotes || '');
    setAssignDueDate(current?.dueDate || '2026-11-30');
    setAssignMaxPoints(current?.maxPoints || 100);
    setAssignDeliveryType(current?.deliveryType || 'both');
    setShowAssignmentModal(true);
  };

  const handleSaveAssignmentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModuleId || !activeLessonId || !assignTitle.trim()) return;
    const cleanInstructions = assignInstructions.trim() || 'Completar la práctica y adjuntar evidencia.';
    saveAssignment(course.id, activeModuleId, activeLessonId, {
      id: activeLesson?.assignment?.id || 'assign-' + activeLessonId,
      title: assignTitle.trim(),
      description: cleanInstructions,
      instructions: cleanInstructions,
      maxPoints: Math.max(1, Math.min(100, Number(assignMaxPoints) || 100)),
      dueDate: assignDueDate || '2026-11-30',
      deliveryType: assignDeliveryType,
    });
    setAssignmentNotes(cleanInstructions);
    setShowAssignmentModal(false);
    showToast(`Tarea "${assignTitle.trim()}" guardada y sincronizada.`);
  };

  const handleAddQuiz = () => {
    const existing = activeLesson?.quiz;
    const firstQ = existing?.questions?.[0];
    setQuizTitle(existing?.title || `Evaluación: ${lessonTitle}`);
    setQuizPassingScore(existing?.passingScore || 70);
    setQuizQuestionText(
      firstQ?.question || '¿Cuál es el procedimiento técnico correcto en esta lección?'
    );
    setQuizOptions(
      firstQ?.options && firstQ.options.length >= 4
        ? [...firstQ.options.slice(0, 4)]
        : [
            'Aplicar el protocolo de seguridad y medición verificada',
            'Omitir la calibración inicial del equipo',
            'Energizar sin comprobar polaridad o conexiones',
            'Ninguna de las anteriores',
          ]
    );
    setQuizCorrectIdx(firstQ?.correctOptionIndex ?? 0);
    setQuizExplanation(
      firstQ?.explanation || 'Verificar seguridad y protocolo técnico garantiza un resultado óptimo.'
    );
    setShowQuizModal(true);
  };

  const handleSaveQuizModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModuleId || !activeLessonId || !quizQuestionText.trim()) return;
    const existing = activeLesson?.quiz;
    const q: QuizQuestion = {
      id: existing?.questions?.[0]?.id || 'q-' + Date.now(),
      question: quizQuestionText.trim(),
      options: quizOptions.map((o, idx) => o.trim() || `Opción ${idx + 1}`),
      correctOptionIndex: quizCorrectIdx,
      explanation: quizExplanation.trim() || 'Respuesta verificada según normativa CFP ÁGAPE.',
    };
    const otherQuestions = existing?.questions?.slice(1) || [];
    saveQuiz(course.id, activeModuleId, activeLessonId, {
      id: existing?.id || 'quiz-' + Date.now(),
      title: quizTitle.trim() || 'Evaluación Rápida',
      passingScore: Math.max(10, Math.min(100, Number(quizPassingScore) || 70)),
      questions: [q, ...otherQuestions],
    });
    setShowQuizModal(false);
    showToast('Quiz interactivo guardado con éxito.');
  };

  // Unlimited Modules & Lessons (Modal-based, no window.prompt)
  const handleRenameModule = (modId: string, currentTitle: string, currentDesc = '') => {
    setEditingModuleModal({
      id: modId,
      title: currentTitle,
      description: currentDesc,
    });
  };

  const handleDeleteModuleConfirm = (modId: string, title: string) => {
    if (course.modules.length <= 1) {
      showToast('El curso debe contener al menos un módulo.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar "${title}" y todas sus lecciones?`)) {
      deleteModule(course.id, modId);
      showToast(`"${title}" eliminado del curso.`);
    }
  };

  const handleAddLesson = (moduleId: string) => {
    const mod = course.modules.find((m) => m.id === moduleId);
    const lesNum = (mod?.lessons.length || 0) + 1;
    setLessonModal({
      mode: 'create',
      moduleId,
      title: `Lección ${lesNum}: Procedimiento Técnico`,
      summary: 'Contenido técnico de la clase.',
      durationMinutes: 20,
    });
  };

  const openEditLessonModal = (moduleId: string, les: Lesson) => {
    setLessonModal({
      mode: 'edit',
      moduleId,
      lessonId: les.id,
      title: les.id === activeLessonId ? lessonTitle : les.title,
      summary: les.summary || '',
      durationMinutes: les.durationMinutes || 20,
    });
  };

  const handleSaveLessonModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonModal || !lessonModal.title.trim()) return;
    if (lessonModal.mode === 'create') {
      const created = addLesson(course.id, lessonModal.moduleId, {
        title: lessonModal.title.trim(),
        summary: lessonModal.summary.trim() || 'Contenido técnico de la clase.',
        durationMinutes: Math.max(1, Number(lessonModal.durationMinutes) || 20),
        type: 'video',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoFileName: 'clase_video_hd.mp4',
        explanationText: `OBJETIVOS DE APRENDIZAJE:\n1. Conocer los fundamentos de ${lessonModal.title.trim()}.\n2. Realizar las pruebas en el taller del CFP AGAPE.`,
        resources: [],
      });
      setActiveModuleId(lessonModal.moduleId);
      setActiveLessonId(created.id);
      setLessonTitle(created.title);
      setExplanationText(created.explanationText || '');
      showToast(`Lección "${lessonModal.title.trim()}" creada con éxito.`);
    } else if (lessonModal.lessonId) {
      updateLesson(course.id, lessonModal.moduleId, lessonModal.lessonId, {
        title: lessonModal.title.trim(),
        summary: lessonModal.summary.trim() || 'Contenido técnico de la clase.',
        durationMinutes: Math.max(1, Number(lessonModal.durationMinutes) || 20),
      });
      if (lessonModal.lessonId === activeLessonId) {
        setLessonTitle(lessonModal.title.trim());
      }
      showToast(`Lección "${lessonModal.title.trim()}" actualizada.`);
    }
    setLessonModal(null);
  };

  const handleDeleteLessonConfirm = (modId: string, lesId: string, title: string) => {
    const mod = course.modules.find((m) => m.id === modId);
    if (mod && mod.lessons.length <= 1) {
      showToast('Cada módulo debe contener al menos una lección.');
      return;
    }
    if (window.confirm(`¿Deseas eliminar la lección "${title}"?`)) {
      deleteLesson(course.id, modId, lesId);
      showToast(`Lección "${title}" eliminada.`);
    }
  };

  // Helper for inserting sample text into explanation
  const insertExplanationSnippet = (snippet: string) => {
    const newText = explanationText + '\n\n' + snippet;
    setExplanationText(newText);
    if (activeModuleId && activeLessonId) {
      updateLesson(course.id, activeModuleId, activeLessonId, {
        explanationText: newText,
      });
    }
    showToast('Fragmento técnico insertado en la explicación.');
  };

  // Dynamic Persistence: Guardar Borrador
  const handleSaveDraft = () => {
    if (activeModuleId && activeLessonId) {
      updateLesson(course.id, activeModuleId, activeLessonId, {
        title: lessonTitle,
        explanationText,
        videoUrl,
        videoFileName,
        videoFileSize: videoFileSize || undefined,
        ...(activeLesson?.assignment
          ? {
              assignment: {
                ...activeLesson.assignment,
                description: assignmentNotes || activeLesson.assignment.description,
                instructions: assignmentNotes || activeLesson.assignment.instructions,
              },
            }
          : {}),
      });
    }

    updateCourse(course.id, {
      status: 'Borrador',
      title: courseTitle,
    });
    showToast('Borrador guardado: Explicación teórica, videos y estructura sincronizados.');
  };

  // Dynamic Persistence: Publicar
  const handlePublish = () => {
    if (activeModuleId && activeLessonId) {
      updateLesson(course.id, activeModuleId, activeLessonId, {
        title: lessonTitle,
        explanationText,
        videoUrl,
        videoFileName,
        videoFileSize: videoFileSize || undefined,
        ...(activeLesson?.assignment
          ? {
              assignment: {
                ...activeLesson.assignment,
                description: assignmentNotes || activeLesson.assignment.description,
                instructions: assignmentNotes || activeLesson.assignment.instructions,
              },
            }
          : {}),
      });
    }

    updateCourse(course.id, {
      status: 'Publicado',
      title: courseTitle,
    });
    showToast(`¡Curso "${courseTitle}" publicado oficialmente en CFP AGAPE!`);
  };

  return (
    <div className="relative">
      {/* Hidden File Inputs for Native Browser Uploads */}
      <input
        type="file"
        ref={videoInputRef}
        accept="video/mp4,video/webm,video/ogg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProcessVideoFile(file);
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={trailerInputRef}
        accept="video/*"
        className="hidden"
        onChange={handleTrailerFileSelected}
      />
      <input
        type="file"
        ref={thumbnailInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleThumbnailFileSelected}
      />
      <input
        type="file"
        ref={documentInputRef}
        accept=".pdf,.doc,.docx,.zip,.rar,.7z,.txt,.xls,.xlsx,.ppt,.pptx"
        className="hidden"
        onChange={handleDocumentFileSelected}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#3B2C73] text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-3 border border-[#6080B8] animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-300 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Instructor Manager Modal (Admin only) */}
      {role === 'admin' && (
        <InstructorManagerModal
          isOpen={isInstructorModalOpen}
          onClose={() => setIsInstructorModalOpen(false)}
          courseId={course.id}
          currentInstructorId={course.instructor.id}
          onInstructorAssigned={(inst) => {
            showToast(`Docente "${inst.name}" asignado al curso exitosamente.`);
          }}
        />
      )}

      {/* Simulator Lab Modal for Docente */}
      <SimulatorLabModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        courseId={course.id}
        moduleId={activeModuleId}
        lessonId={activeLessonId}
        lessonTitle={lessonTitle}
        moduleTitle={activeModule?.title || 'Módulo 1: Fundamentos'}
        courseTitle={courseTitle}
        currentSimulator={activeLesson?.simulatorLab}
        onSaved={(sim) => {
          showToast(`¡Laboratorio/Simulador "${sim.title}" vinculado a la lección!`);
        }}
        onDeleted={() => {
          showToast('Laboratorio/Simulador eliminado de la lección.');
        }}
      />

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          url={previewDoc.url}
          category={previewDoc.category}
        />
      )}

      {/* Modal: Editar Módulo */}
      {editingModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#3B2C73] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#F2C94C]" />
                <h3 className="text-sm font-bold">Editar Módulo del Curso</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingModuleModal(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingModuleModal.title.trim()) return;
                updateModule(course.id, editingModuleModal.id, {
                  title: editingModuleModal.title.trim(),
                  description: editingModuleModal.description.trim(),
                });
                showToast(`Módulo "${editingModuleModal.title.trim()}" actualizado.`);
                setEditingModuleModal(null);
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Módulo:</label>
                <input
                  type="text"
                  required
                  value={editingModuleModal.title}
                  onChange={(e) =>
                    setEditingModuleModal((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  value={editingModuleModal.description}
                  onChange={(e) =>
                    setEditingModuleModal((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingModuleModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B3B8B] text-white font-bold rounded-lg cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Lección */}
      {lessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#3B2C73] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#F2C94C]" />
                <h3 className="text-sm font-bold">
                  {lessonModal.mode === 'create' ? 'Nueva Lección / Clase' : 'Editar Lección'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLessonModal(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveLessonModal} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Lección:</label>
                <input
                  type="text"
                  required
                  value={lessonModal.title}
                  onChange={(e) =>
                    setLessonModal((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Resumen / Objetivo breve:</label>
                <textarea
                  rows={2}
                  value={lessonModal.summary}
                  onChange={(e) =>
                    setLessonModal((prev) => (prev ? { ...prev, summary: e.target.value } : null))
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Duración estimada (minutos):</label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={lessonModal.durationMinutes}
                  onChange={(e) =>
                    setLessonModal((prev) =>
                      prev ? { ...prev, durationMinutes: Number(e.target.value) } : null
                    )
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLessonModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B3B8B] text-white font-bold rounded-lg cursor-pointer"
                >
                  {lessonModal.mode === 'create' ? 'Crear Lección' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Añadir / Editar Tarea */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#3B2C73] to-[#4B3B8B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F2C94C]" />
                <h3 className="text-sm font-bold">
                  {activeLesson?.assignment ? 'Editar Tarea Práctica' : 'Añadir Nueva Tarea Práctica'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignmentModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAssignmentModal} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Título de la Tarea: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Ej. Reporte de Medición de Resistencias"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Instrucciones detalladas para el estudiante: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="Describe paso a paso lo que el alumno debe realizar y entregar..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Límite:</label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ponderación (Pts):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={assignMaxPoints}
                    onChange={(e) => setAssignMaxPoints(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Entrega:</label>
                  <select
                    value={assignDeliveryType}
                    onChange={(e) => setAssignDeliveryType(e.target.value as AssignmentDeliveryType)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="both">Subir archivo o pegar enlace</option>
                    <option value="file">Solo subir archivo</option>
                    <option value="link">Solo pegar enlace</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white font-bold rounded-lg cursor-pointer"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Quiz */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-[#3B2C73] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#F2C94C]" />
                <h3 className="text-sm font-bold">
                  {activeLesson?.quiz ? 'Editar Quiz de la Lección' : 'Crear Quiz Interactivo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuizModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuizModal} className="p-5 space-y-3 text-xs max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Título del Quiz:</label>
                  <input
                    type="text"
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nota mínima (%):</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={quizPassingScore}
                    onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pregunta:</label>
                <textarea
                  rows={2}
                  required
                  value={quizQuestionText}
                  onChange={(e) => setQuizQuestionText(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Opciones (marca la correcta):</label>
                {quizOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quizCorrect"
                      checked={quizCorrectIdx === idx}
                      onChange={() => setQuizCorrectIdx(idx)}
                      className="text-[#4B3B8B]"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...quizOptions];
                        next[idx] = e.target.value;
                        setQuizOptions(next);
                      }}
                      className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Explicación técnica:</label>
                <input
                  type="text"
                  value={quizExplanation}
                  onChange={(e) => setQuizExplanation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B3B8B] text-white font-bold rounded-lg cursor-pointer"
                >
                  Guardar Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main White Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center px-6 pt-2 border-b border-slate-200/80 overflow-x-auto gap-4 md:gap-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'text-[#4B3B8B] font-bold border-b-2 border-[#4B3B8B]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Info. General
          </button>

          <button
            onClick={() => setActiveTab('structure')}
            className={`py-3.5 px-2 text-sm font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'structure'
                ? 'text-[#4B3B8B] font-bold border-b-2 border-[#4B3B8B]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Estructura y Contenidos</span>
          </button>

          <button
            onClick={() => setActiveTab('virtual-simulator')}
            className={`py-3.5 px-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'virtual-simulator'
                ? 'text-[#4B3B8B] font-bold border-b-2 border-[#4B3B8B]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-[#4B3B8B]" />
            <span>Módulo Virtual / Simulador</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-3.5 px-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'advanced'
                ? 'text-[#4B3B8B] font-bold border-b-2 border-[#4B3B8B]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Config. Avanzada
          </button>
        </div>

        {/* Tab Body: Estructura y Contenidos (Exact Recreation of Mockup) */}
        {activeTab === 'structure' && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Top Blue-Purple Course Banner */}
            <div className="bg-gradient-to-r from-[#4A3E8A] via-[#524497] to-[#6080B8] text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                {/* Square display icon from mockup */}
                <div className="w-5 h-5 rounded border-2 border-white/90 flex items-center justify-center">
                  <div className="w-2 h-2 border-b border-r border-white/90 -rotate-45" />
                </div>
                <span className="text-sm md:text-base font-bold tracking-tight">
                  Curso: {courseTitle}
                </span>
              </div>

              {/* Quick Assigned Teacher Indicator */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg text-xs border border-white/15">
                  <span className="text-slate-200">Docente:</span>
                  <span className="font-bold text-[#F2C94C]">{course.instructor.name}</span>
                </div>
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setIsInstructorModalOpen(true)}
                    className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Cambiar o dar de alta docentes"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#F2C94C]" />
                    <span>Gestionar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dashed Lilac Box for Adding Modules with Dynamic In-place Creation Card */}
            <div className="border border-dashed border-[#CBB8E8] bg-[#F7F2FD]/80 rounded-xl p-3.5 transition-all">
              {!isCreatingModule ? (
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingModule(true);
                      setNewModuleTitle(`Módulo ${course.modules.length + 1}: Control y Automatización`);
                      setNewModuleDesc('Módulo de formación técnica especializada en CFP AGAPE.');
                    }}
                    className="px-6 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir Módulo</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-[#CBB8E8] shadow-sm space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4B3B8B]">
                      <Layers className="w-4 h-4" />
                      <span>Nuevo Módulo del Curso (CFP AGAPE)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingModule(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Título del Módulo:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Módulo 2: Sensores y Automatización"
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Descripción del Módulo:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Prácticas de laboratorio y calibración..."
                        value={newModuleDesc}
                        onChange={(e) => setNewModuleDesc(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingModule(false)}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newModuleTitle.trim()) {
                          addModule(
                            course.id,
                            newModuleTitle.trim(),
                            newModuleDesc.trim() || 'Módulo de formación especializada en CFP AGAPE.'
                          );
                          setIsCreatingModule(false);
                          showToast(`Módulo "${newModuleTitle.trim()}" agregado dinámicamente.`);
                        }
                      }}
                      className="px-5 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                    >
                      Guardar Módulo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hierarchical Structure Tree Container */}
            <div className="relative pl-6 space-y-6">
              {/* Vertical Branch Connecting Line from Tree */}
              <div className="absolute left-2 top-4 bottom-8 w-0.5 bg-[#4B3B8B]/40" />

              {/* Dynamic Module Mapping */}
              {course.modules.map((mod, modIdx) => {
                const isExpanded = expandedModuleIds.includes(mod.id);

                return (
                  <div key={mod.id} className="relative">
                    {/* Horizontal branch marker arrow */}
                    <div className="absolute -left-4 top-4 text-[#4B3B8B] font-bold text-sm">
                      ➔
                    </div>

                    {/* Module Bar */}
                    <div
                      onClick={() => toggleModule(mod.id)}
                      className="bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] text-white px-4 py-3 rounded-xl flex items-center justify-between cursor-pointer shadow-2xs hover:opacity-95 transition-all select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">
                          {mod.title}
                        </span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                          {mod.lessons.length} {mod.lessons.length === 1 ? 'lección' : 'lecciones'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameModule(mod.id, mod.title, mod.description);
                          }}
                          className="p-1 hover:bg-white/20 text-white/90 rounded text-xs transition-colors cursor-pointer"
                          title="Editar módulo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModuleConfirm(mod.id, mod.title);
                          }}
                          className="p-1 hover:bg-rose-500/40 text-white/90 hover:text-white rounded text-xs transition-colors cursor-pointer"
                          title="Eliminar módulo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddLesson(mod.id);
                          }}
                          className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Añadir clase a este módulo"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="hidden sm:inline">Añadir Lección</span>
                        </button>

                        <div className="text-white/80 ml-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Module Body with Lessons */}
                    {isExpanded && (
                      <div className="mt-4 pl-6 relative space-y-4">
                        {/* Vertical connecting line for lessons inside module */}
                        <div className="absolute left-2 top-2 bottom-6 w-0.5 bg-[#4B3B8B]/30" />

                        {mod.lessons.map((les, lesIdx) => {
                          const isActive = activeLessonId === les.id && activeModuleId === mod.id;

                          return (
                            <div key={les.id} className="relative">
                              {/* Sub-branch arrow */}
                              <div className="absolute -left-4 top-3.5 text-xs text-[#4B3B8B]">
                                {isActive ? '▼' : '➔'}
                              </div>

                              {/* Lesson Header Bar */}
                              <div
                                onClick={() => handleSelectLesson(mod.id, les)}
                                className={`border border-slate-200/80 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-2xs ${
                                  isActive
                                    ? 'bg-[#E5EAF3] ring-1 ring-[#4B3B8B]'
                                    : 'bg-[#FAFBFD] hover:bg-[#E5EAF3]'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                                  <span className="text-xs md:text-sm font-bold text-[#1E293B]">
                                    {isActive ? lessonTitle : les.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Edit lesson button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditLessonModal(mod.id, les);
                                    }}
                                    className="px-2 py-1 hover:bg-white text-slate-600 hover:text-[#4B3B8B] rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Editar lección"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span className="hidden sm:inline">Editar</span>
                                  </button>

                                  {/* Delete lesson button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLessonConfirm(mod.id, les.id, les.title);
                                    }}
                                    className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                    title="Eliminar lección"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Purple circular checkmark from mockup */}
                                  <div className="w-5 h-5 rounded-full bg-[#4B3B8B] text-white flex items-center justify-center shadow-2xs">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                  <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                                </div>
                              </div>

                              {/* Expanded Active Lesson Editor (Warm cream container #FCF9EF) */}
                              {isActive && (
                                <div className="mt-3 bg-[#FCF9EF] border border-[#EDE7D3] rounded-xl p-5 space-y-5 shadow-2xs animate-in fade-in duration-200">
                                  {/* Editable Lesson Title Field */}
                                  <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-lg border border-[#EDE7D3]">
                                    <Edit2 className="w-4 h-4 text-[#4B3B8B] shrink-0" />
                                    <label className="text-[11px] font-bold text-slate-700 shrink-0">Título de la Lección:</label>
                                    <input
                                      type="text"
                                      value={lessonTitle}
                                      onChange={(e) => {
                                        setLessonTitle(e.target.value);
                                        updateLesson(course.id, mod.id, les.id, { title: e.target.value });
                                      }}
                                      className="flex-1 bg-transparent text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B] px-1.5 py-0.5 rounded"
                                    />
                                  </div>

                                  {/* Section: Video de la Clase (Archivo Local + Enlace YouTube) */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <span className="text-xs font-bold text-slate-800">
                                        Video de Clase (Archivo Local MP4/WebM/OGG o YouTube)
                                      </span>

                                      <div className="flex items-center gap-3">
                                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          <span>{videoDuration}</span>
                                        </span>

                                        {videoSuccess && (
                                          <button
                                            type="button"
                                            onClick={() => setShowVideoPreview(!showVideoPreview)}
                                            className="text-[11px] text-[#4B3B8B] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                          >
                                            <Video className="w-3.5 h-3.5" />
                                            <span>{showVideoPreview ? 'Ocultar Reproductor' : 'Ver Video de la Clase'}</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {/* Opción 1: Subir Video Local */}
                                      <div
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          setIsDraggingVideo(true);
                                        }}
                                        onDragLeave={() => setIsDraggingVideo(false)}
                                        onDrop={handleVideoDrop}
                                        className={`border border-dashed rounded-xl p-3.5 text-center transition-all flex flex-col justify-center ${
                                          isDraggingVideo
                                            ? 'border-[#4B3B8B] bg-[#E5EAF3] scale-[1.01]'
                                            : 'border-[#DCD5BD] bg-white/90 hover:bg-white'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={handleUploadMainVideo}
                                          className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-2 mx-auto transition-colors cursor-pointer"
                                        >
                                          <Upload className="w-4 h-4 text-[#F2C94C]" />
                                          <span>
                                            {isUploadingVideo
                                              ? 'Procesando video...'
                                              : 'Subir Video desde PC'}
                                          </span>
                                        </button>
                                        <p className="text-[10px] text-slate-500 mt-1.5">
                                          Formatos nativos: <strong>.mp4, .webm, .ogg</strong> (Reproducción HTML5)
                                        </p>
                                      </div>

                                      {/* Opción 2: Enlace de YouTube / Externo */}
                                      <div className="p-3.5 bg-white rounded-xl border border-[#EDE7D3] space-y-2 flex flex-col justify-center">
                                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                          <LinkIcon className="w-3.5 h-3.5 text-[#4B3B8B]" />
                                          <span>O pegar enlace de YouTube / Video Externo:</span>
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="url"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            value={externalUrlInput}
                                            onChange={(e) => setExternalUrlInput(e.target.value)}
                                            className="flex-1 p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                                          />
                                          <button
                                            type="button"
                                            onClick={handleApplyExternalVideoUrl}
                                            className="px-3.5 py-1.5 bg-[#6080B8] hover:bg-[#4B3B8B] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer transition-colors"
                                          >
                                            Vincular
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Animated Progress Bar */}
                                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                      <div
                                        className="bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] h-full rounded-full transition-all duration-300 shadow-2xs"
                                        style={{ width: `${lessonProgress}%` }}
                                      />
                                    </div>

                                    <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] bg-white/80 px-3 py-1.5 rounded-lg border border-[#EDE7D3]">
                                      <span className="text-slate-600 font-mono truncate">
                                        Archivo activo: <strong className="text-slate-900">{videoFileName}</strong>
                                      </span>
                                      {videoFileSize && (
                                        <span className="font-mono font-bold text-[#4B3B8B] bg-[#F7F2FD] px-2 py-0.5 rounded border border-[#CBB8E8]">
                                          Peso: {videoFileSize}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Video Player Preview if active */}
                                  {showVideoPreview && (
                                    <div className="rounded-xl overflow-hidden border border-slate-300">
                                      <VideoPlayer
                                        src={videoUrl}
                                        title={lessonTitle}
                                      />
                                    </div>
                                  )}

                                  {/* Two Columns: Trailer & Thumbnail */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Col 1: Video Demostrativo (Trailer) */}
                                    <div className="space-y-2">
                                      <span className="text-xs font-bold text-slate-800">
                                        Video Introductorio del Curso
                                      </span>
                                      <div className="border border-dashed border-[#DCD5BD] bg-white/70 rounded-xl p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={handleUploadTrailer}
                                          className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                                        >
                                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                                          <span>{trailerUploading ? 'Cargando...' : 'Subir de Archivo'}</span>
                                        </button>
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono text-center truncate">
                                        {trailerName}
                                      </div>
                                    </div>

                                    {/* Col 2: Imagen de Portada (Thumbnail) */}
                                    <div className="space-y-2">
                                      <span className="text-xs font-bold text-slate-800">
                                        Imagen de Portada (Thumbnail)
                                      </span>
                                      <div className="border border-dashed border-[#DCD5BD] bg-white/70 rounded-xl p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={handleUploadThumbnail}
                                          className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                                        >
                                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                                          <span>{thumbnailUploading ? 'Cargando...' : 'Subir de Archivo'}</span>
                                        </button>
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono text-center truncate">
                                        {thumbnailName}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Dedicated Section: Editor de Explicaciones de Texto (Lecturas, Teoría y Código) */}
                                  <div className="bg-[#FCF9EF] border border-[#EDE7D3] rounded-xl p-4 space-y-3 shadow-2xs">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-[#4B3B8B]" />
                                        <span className="text-xs font-bold text-slate-800">
                                          Explicación Teórica de la Lección (Lecturas, Guías o Código)
                                        </span>
                                      </div>

                                      {/* AI Generator & Quick Insertion Helpers */}
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            setIsGeneratingExplanationAI(true);
                                            try {
                                              const generated = await generateLessonExplanationAI(
                                                lessonTitle,
                                                mod.title,
                                                course.category,
                                                course.level
                                              );
                                              setExplanationText(generated);
                                              updateLesson(course.id, mod.id, les.id, {
                                                explanationText: generated,
                                              });
                                              showToast('¡Explicación técnica redactada con IA de Gemini!');
                                            } finally {
                                              setIsGeneratingExplanationAI(false);
                                            }
                                          }}
                                          disabled={isGeneratingExplanationAI}
                                          className="px-2.5 py-1 bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] hover:opacity-95 text-white text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                                        >
                                          <Sparkles className={`w-3.5 h-3.5 text-[#F2C94C] ${isGeneratingExplanationAI ? 'animate-spin' : ''}`} />
                                          <span>{isGeneratingExplanationAI ? 'Gemini Redactando...' : '✨ Generar Explicación (IA)'}</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => insertExplanationSnippet('FÓRMULA CLAVE: V = I × R (Ley de Ohm). Voltios = Amperios × Ohmios.')}
                                          className="px-2 py-0.5 bg-white border border-slate-300 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded"
                                        >
                                          + Ley de Ohm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => insertExplanationSnippet('PASO DE LABORATORIO: Verificar continuidad de pista con la función bip del multímetro.')}
                                          className="px-2 py-0.5 bg-white border border-slate-300 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 rounded"
                                        >
                                          + Paso Taller
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setExplanationText(defaultExplanation);
                                            updateLesson(course.id, mod.id, les.id, {
                                              explanationText: defaultExplanation,
                                            });
                                          }}
                                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 rounded"
                                          title="Restablecer plantilla inicial"
                                        >
                                          Restablecer
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <textarea
                                        rows={5}
                                        value={explanationText}
                                        onChange={(e) => {
                                          setExplanationText(e.target.value);
                                          updateLesson(course.id, mod.id, les.id, {
                                            explanationText: e.target.value,
                                          });
                                        }}
                                        className="w-full p-3.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B] leading-relaxed font-sans"
                                        placeholder="Redacta la explicación teórica, la guía de laboratorio o las indicaciones paso a paso..."
                                      />
                                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                                        <span>Esta explicación se integrará de inmediato en el aula virtual del alumno.</span>
                                        <span className="font-mono">{explanationText.length} caracteres</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Materiales de Práctica (Cream Box with trash icon) */}
                                  <div className="bg-[#FCF9EF] border border-[#EDE7D3] rounded-xl p-4 space-y-3.5 shadow-2xs">
                                    {/* Header with Trash Icon */}
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-800">
                                        Materiales de Práctica
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm('¿Deseas limpiar los materiales de práctica de esta lección?')) {
                                            setAssignmentNotes('');
                                            updateLesson(course.id, mod.id, les.id, {
                                              assignment: undefined,
                                            });
                                            showToast('Materiales reiniciados.');
                                          }
                                        }}
                                        className="text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Limpiar materiales"
                                      >
                                        <Trash2 className="w-4 h-4 text-[#4B3B8B]" />
                                      </button>
                                    </div>

                                    {/* Action Buttons Row including Gemini Practice Generator */}
                                    <div className="flex flex-wrap items-center gap-2.5">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          setIsGeneratingPracticeAI(true);
                                          try {
                                            const practice = await generatePracticeAI(lessonTitle, mod.title, course.title);
                                            setAssignmentNotes(practice);
                                            saveAssignment(course.id, mod.id, les.id, {
                                              id: les.assignment?.id || 'assign-' + les.id,
                                              title: les.assignment?.title || 'Práctica de Taller: ' + lessonTitle,
                                              description: practice,
                                              instructions: practice,
                                              maxPoints: les.assignment?.maxPoints || 100,
                                              dueDate: les.assignment?.dueDate || '2026-11-30',
                                              deliveryType: les.assignment?.deliveryType || 'both',
                                            });
                                            showToast('¡Actividad práctica de taller generada con IA!');
                                          } finally {
                                            setIsGeneratingPracticeAI(false);
                                          }
                                        }}
                                        disabled={isGeneratingPracticeAI}
                                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                                      >
                                        <Sparkles className={`w-3.5 h-3.5 text-[#F2C94C] ${isGeneratingPracticeAI ? 'animate-spin' : ''}`} />
                                        <span>{isGeneratingPracticeAI ? 'Generando Taller...' : '✨ Generar Práctica (IA)'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={handleAddAttachment}
                                        className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                                        <span>Subir PDF/Archivo</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingResourceId(null);
                                          setCloudLinkTitle('');
                                          setCloudLinkUrl('');
                                          setCloudLinkCategory('document');
                                        }}
                                        className="px-3 py-1.5 bg-white border border-sky-200 hover:bg-sky-50 text-sky-900 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-sky-600" />
                                        <span>📄 Documento</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingResourceId(null);
                                          setCloudLinkTitle('');
                                          setCloudLinkUrl('');
                                          setCloudLinkCategory('spreadsheet');
                                        }}
                                        className="px-3 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-900 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        <Table2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>📊 Hoja de Cálculo</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingResourceId(null);
                                          setCloudLinkTitle('');
                                          setCloudLinkUrl('');
                                          setCloudLinkCategory('presentation');
                                        }}
                                        className="px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-50 text-amber-900 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        <Presentation className="w-3.5 h-3.5 text-amber-600" />
                                        <span>📽️ Presentación</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingResourceId(null);
                                          setCloudLinkTitle('');
                                          setCloudLinkUrl('');
                                          setCloudLinkCategory('other');
                                        }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        <LinkIcon className="w-3.5 h-3.5 text-[#4B3B8B]" />
                                        <span>🔗 Enlace Web</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={openAssignmentModal}
                                        className="px-3.5 py-1.5 bg-white border border-[#4B3B8B]/40 hover:bg-[#FAF8FF] text-[#4B3B8B] text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        {les.assignment ? (
                                          <Edit2 className="w-3.5 h-3.5 text-[#4B3B8B]" />
                                        ) : (
                                          <Plus className="w-3.5 h-3.5 text-[#4B3B8B]" />
                                        )}
                                        <span>{les.assignment ? 'Editar Tarea' : 'Añadir Tarea'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={handleAddQuiz}
                                        className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                                        <span>{les.quiz ? 'Editar Quiz' : 'Crear Quiz'}</span>
                                      </button>

                                      {/* Generador de Simuladores Interactivos con IA */}
                                      <button
                                        type="button"
                                        onClick={() => setIsSimulatorModalOpen(true)}
                                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                                        title="Generar simulador interactivo por indicaciones con Gemini"
                                      >
                                        <FlaskConical className="w-3.5 h-3.5 text-[#F2C94C]" />
                                        <span>🧪 Simulador de Práctica IA</span>
                                      </button>
                                    </div>

                                    {/* Inline Cloud Link Form when adding OR editing an external link */}
                                    {cloudLinkCategory && (
                                      <div className="p-3.5 bg-white border border-[#CBB8E8] rounded-xl space-y-2.5 text-xs animate-in fade-in duration-150">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-[#4B3B8B]">
                                            {editingResourceId
                                              ? '✏️ Editar / Reemplazar Enlace Externo'
                                              : cloudLinkCategory === 'spreadsheet'
                                              ? '📊 Vincular Hoja de Cálculo (Google Sheets / Excel / OneDrive)'
                                              : cloudLinkCategory === 'presentation'
                                              ? '📽️ Vincular Presentación (Google Slides / PowerPoint / OneDrive)'
                                              : cloudLinkCategory === 'other'
                                              ? '🔗 Vincular Enlace Web de Apoyo'
                                              : '📄 Vincular Documento (Google Docs / Word / OneDrive / PDF)'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCloudLinkCategory(null);
                                              setEditingResourceId(null);
                                              setCloudLinkTitle('');
                                              setCloudLinkUrl('');
                                            }}
                                            className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                          <select
                                            value={cloudLinkCategory}
                                            onChange={(e) => setCloudLinkCategory(e.target.value as DocCategory)}
                                            className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                                          >
                                            <option value="document">📄 Documento</option>
                                            <option value="spreadsheet">📊 Hoja de Cálculo</option>
                                            <option value="presentation">📽️ Presentación</option>
                                            <option value="other">🔗 Enlace Web</option>
                                          </select>
                                          <input
                                            type="text"
                                            placeholder="Título visible para el alumno..."
                                            value={cloudLinkTitle}
                                            onChange={(e) => setCloudLinkTitle(e.target.value)}
                                            className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                                          />
                                          <input
                                            type="url"
                                            placeholder="https://docs.google.com/... o URL web"
                                            value={cloudLinkUrl}
                                            onChange={(e) => setCloudLinkUrl(e.target.value)}
                                            className="md:col-span-2 p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                                          />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCloudLinkCategory(null);
                                              setEditingResourceId(null);
                                              setCloudLinkTitle('');
                                              setCloudLinkUrl('');
                                            }}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold cursor-pointer"
                                          >
                                            Cancelar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleSaveCloudDocumentLink}
                                            disabled={!cloudLinkUrl.trim()}
                                            className="px-4 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2D73] disabled:opacity-50 text-white rounded-lg font-bold cursor-pointer"
                                          >
                                            {editingResourceId ? 'Guardar Cambios del Enlace' : 'Vincular a Lección'}
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Active Assignment Card */}
                                    {les.assignment && (
                                      <div className="p-3.5 bg-white border border-[#CBB8E8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                                        <div className="space-y-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2 py-0.5 rounded bg-[#4B3B8B]/10 text-[#4B3B8B] text-[10px] font-bold uppercase">
                                              Tarea Asignada
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              Límite: {les.assignment.dueDate || 'Sin fecha'}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                              Ponderación: {les.assignment.maxPoints || 100} pts
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                              Entrega:{' '}
                                              {les.assignment.deliveryType === 'file'
                                                ? 'Archivo'
                                                : les.assignment.deliveryType === 'link'
                                                ? 'Enlace'
                                                : 'Archivo o Enlace'}
                                            </span>
                                          </div>
                                          <div className="text-xs font-bold text-slate-900 truncate">
                                            {les.assignment.title}
                                          </div>
                                          <div className="text-[11px] text-slate-600 line-clamp-2">
                                            {les.assignment.instructions || les.assignment.description}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={openAssignmentModal}
                                            className="px-3 py-1.5 bg-[#F7F2FD] hover:bg-[#EDE4FB] text-[#4B3B8B] text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span>Editar Tarea</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm(`¿Eliminar la tarea "${les.assignment?.title}"?`)) {
                                                setAssignmentNotes('');
                                                updateLesson(course.id, mod.id, les.id, { assignment: undefined });
                                                showToast('Tarea eliminada de la lección.');
                                              }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                            title="Eliminar tarea"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Active Simulator Lab Card if present on lesson */}
                                    {les.simulatorLab && (
                                      <div className="p-3.5 bg-gradient-to-r from-[#F7F2FD] via-white to-[#FAFBFD] border-2 border-[#CBB8E8] rounded-xl flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-10 h-10 rounded-xl bg-[#4B3B8B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                            <FlaskConical className="w-5 h-5 text-[#F2C94C]" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-[#4B3B8B] uppercase tracking-wider bg-[#4B3B8B]/10 px-2 py-0.2 rounded font-mono">
                                                {les.simulatorLab.type === 'interactive_practice'
                                                  ? 'Práctica Interactiva IA'
                                                  : les.simulatorLab.type === 'case_scenario'
                                                  ? 'Simulador de Casos'
                                                  : les.simulatorLab.type === 'diagnostic_test'
                                                  ? 'Test de Diagnóstico'
                                                  : 'Laboratorio de Taller'}
                                              </span>
                                              <span className="text-[10px] text-slate-500 font-mono">
                                                Aprobación: {les.simulatorLab.passingScore}%
                                              </span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                              {les.simulatorLab.title}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">
                                              {les.simulatorLab.scenarioDescription}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setIsSimulatorModalOpen(true)}
                                            className="px-3 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                                          >
                                            <FlaskConical className="w-3.5 h-3.5 text-[#F2C94C]" />
                                            <span>Editar Simulador</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm('¿Deseas eliminar este laboratorio/simulador de la lección?')) {
                                                deleteSimulatorLab(course.id, mod.id, les.id);
                                                showToast('Laboratorio/Simulador eliminado.');
                                              }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title="Eliminar laboratorio"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Uploaded Documents & Cloud Links List */}
                                    {les.resources && les.resources.length > 0 && (
                                      <div className="space-y-2 pt-1">
                                        <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                          <span>Archivos y Enlaces Cargados ({les.resources.length}):</span>
                                          <span className="text-[10px] text-slate-500 font-normal">Disponibles de inmediato para los alumnos</span>
                                        </div>
                                        <div className="space-y-1.5">
                                          {les.resources.map((res) => {
                                            const isExternalLink =
                                              res.provider !== 'file' &&
                                              !(res.url || '').startsWith('blob:') &&
                                              !(res.url || '').startsWith('data:');

                                            return (
                                              <div
                                                key={res.id}
                                                className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200/90 rounded-lg p-2.5 text-xs shadow-2xs hover:border-[#6080B8] transition-colors"
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                  <div className="w-8 h-8 rounded-lg bg-[#FAFBFD] border border-slate-200 flex items-center justify-center shrink-0">
                                                    {res.type === 'pdf' ? (
                                                      <FileText className="w-4 h-4 text-rose-500" />
                                                    ) : res.type === 'zip' ? (
                                                      <Layers className="w-4 h-4 text-amber-500" />
                                                    ) : res.type === 'code' ? (
                                                      <FileCode className="w-4 h-4 text-emerald-600" />
                                                    ) : res.type === 'gsheet' || res.type === 'excel' ? (
                                                      <Table2 className="w-4 h-4 text-emerald-600" />
                                                    ) : res.type === 'gslides' || res.type === 'ppt' ? (
                                                      <Presentation className="w-4 h-4 text-amber-600" />
                                                    ) : isExternalLink ? (
                                                      <LinkIcon className="w-4 h-4 text-[#4B3B8B]" />
                                                    ) : (
                                                      <FileText className="w-4 h-4 text-blue-600" />
                                                    )}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="font-bold text-slate-800 truncate" title={res.title}>
                                                      {res.title}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
                                                      <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-semibold">
                                                        {res.size || (isExternalLink ? 'Enlace Web' : 'Archivo Local')}
                                                      </span>
                                                      <span className="uppercase text-[9px] bg-slate-100 px-1 py-0.2 rounded font-semibold text-slate-500">
                                                        {res.type}
                                                      </span>
                                                      {isExternalLink && res.url && res.url !== '#' && (
                                                        <span className="text-slate-400 font-mono truncate max-w-[180px]">
                                                          {res.url}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  {res.url && res.url !== '#' && (
                                                    <>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          setPreviewDoc({
                                                            title: res.title,
                                                            url: res.url,
                                                            category: res.docCategory || 'document',
                                                          })
                                                        }
                                                        className="px-2 py-1.5 bg-[#F7F2FD] hover:bg-[#EDE4FB] text-[#4B3B8B] rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="Vista previa en plataforma"
                                                      >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Vista Previa</span>
                                                      </button>
                                                      {isExternalLink && (
                                                        <a
                                                          href={res.url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="p-1.5 bg-slate-100 hover:bg-[#E5EAF3] text-slate-700 hover:text-[#4B3B8B] rounded transition-colors"
                                                          title="Abrir enlace en pestaña nueva"
                                                        >
                                                          <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                      )}
                                                    </>
                                                  )}

                                                  {!isExternalLink && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDownloadOrOpenResource(res)}
                                                      className="p-1.5 bg-slate-100 hover:bg-[#E5EAF3] text-slate-700 hover:text-[#4B3B8B] rounded transition-colors cursor-pointer"
                                                      title="Descargar / Abrir archivo"
                                                    >
                                                      <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}

                                                  {isExternalLink ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => openEditCloudLink(res)}
                                                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                      title="Editar o reemplazar enlace web sin subir archivo local"
                                                    >
                                                      <Edit2 className="w-3 h-3" />
                                                      <span>Editar / Reemplazar Enlace</span>
                                                    </button>
                                                  ) : (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setReplaceDocId(res.id);
                                                        documentInputRef.current?.click();
                                                      }}
                                                      className="px-2 py-1 bg-slate-100 hover:bg-[#E5EAF3] text-slate-700 hover:text-[#4B3B8B] rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                                      title="Reemplazar archivo local"
                                                    >
                                                      Reemplazar Archivo
                                                    </button>
                                                  )}

                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (window.confirm(`¿Eliminar "${res.title}" de esta lección?`)) {
                                                        deleteResource(course.id, mod.id, les.id, res.id);
                                                        if (editingResourceId === res.id) {
                                                          setEditingResourceId(null);
                                                          setCloudLinkCategory(null);
                                                        }
                                                        showToast(`"${res.title}" eliminado.`);
                                                      }
                                                    }}
                                                    className="px-2 py-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                                                    title="Eliminar enlace o archivo"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span className="hidden md:inline">Eliminar</span>
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Textarea for Detalle de asignación */}
                                    <div className="space-y-1.5 pt-1">
                                      <label className="block text-[11px] font-bold text-slate-700">
                                        Notas rápidas / Detalle de asignación práctica
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={assignmentNotes}
                                        onChange={(e) => {
                                          setAssignmentNotes(e.target.value);
                                          if (les.assignment) {
                                            updateLesson(course.id, mod.id, les.id, {
                                              assignment: {
                                                ...les.assignment,
                                                description: e.target.value,
                                                instructions: e.target.value,
                                              },
                                            });
                                          }
                                        }}
                                        className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B] resize-none"
                                        placeholder="Usa '+ Añadir Tarea' para definir título, fecha límite y tipo de entrega, o escribe aquí notas de apoyo..."
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add Lesson to this module button */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleAddLesson(mod.id)}
                            className="w-full py-2 bg-[#FAFBFD] hover:bg-[#F3EBFD] border border-dashed border-[#CBB8E8] text-[#4B3B8B] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir Lección a {mod.title}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                >
                  Guardar Borrador
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-7 py-2.5 bg-gradient-to-r from-[#3B2D73] to-[#4B3B8B] hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-md shadow-[#4B3B8B]/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Publicar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Body: Info. General (with Teacher Assignment Roster & Admin-only Price) */}
        {activeTab === 'info' && (
          <div className="p-6 md:p-8 space-y-6">
            <h3 className="text-base font-bold text-slate-900">Información General del Programa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Oficial del Curso:</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtítulo / Enfoque:</label>
                <input
                  type="text"
                  value={courseSubtitle}
                  onChange={(e) => setCourseSubtitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Especialidad / Categoría:</label>
                <input
                  type="text"
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nivel Académico:</label>
                <select
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(e.target.value as CourseLevel)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              {role === 'admin' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inversión / Costo ($ USD):</label>
                  <input
                    type="number"
                    min={0}
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Centro de Formación:</label>
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700 font-semibold">
                  Centro de Formación Profesional AGAPE (Sonsonate, El Salvador)
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Descripción General del Curso:</label>
                <textarea
                  rows={3}
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            {/* Docente Responsable Section */}
            <div className="p-5 bg-[#FCF9EF] border border-[#EDE7D3] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Docente Responsable Asignado
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Instructor institucional registrado en el CFP AGAPE
                  </p>
                </div>

                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setIsInstructorModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Gestionar / Asignar Docente</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-lg border border-slate-200">
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{course.instructor.name}</div>
                  <div className="text-[11px] text-[#4B3B8B] font-semibold">{course.instructor.title}</div>
                  {course.instructor.email && (
                    <div className="text-[10px] text-slate-500 font-mono">{course.instructor.email}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  updateCourse(course.id, {
                    title: courseTitle,
                    subtitle: courseSubtitle,
                    category: courseCategory,
                    level: courseLevel,
                    description: courseDescription,
                    ...(role === 'admin' ? { price: coursePrice } : {}),
                  });
                  showToast('Información general actualizada.');
                }}
                className="px-5 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Guardar Ficha
              </button>
            </div>
          </div>
        )}

        {/* Tab Body: Módulo Virtual / Simulador */}
        {activeTab === 'virtual-simulator' && (
          <div className="p-6 md:p-8 space-y-6 text-xs text-slate-700">
            {/* Header with Institutional Identity */}
            <div className="bg-gradient-to-r from-[#FAF8FF] via-white to-[#F4F6F9] p-5 rounded-2xl border border-[#4B3B8B]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4B3B8B] text-white">
                    Módulo Virtual & Simulador
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    CFP AGAPE · Educación para el Trabajo
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-extrabold text-[#3B2C73]">
                  Despliegue Curricular & Laboratorio Técnico con IA
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  En este módulo se integran los fundamentos teóricos oficiales, videos demostrativos de taller, guías de práctica y la propuesta de simulador interactivo.
                </p>
              </div>

              {/* Module Selector Pill */}
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto">
                <Layers className="w-4 h-4 text-[#4B3B8B]" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Módulo Activo</div>
                  <div className="text-xs font-bold text-slate-800">
                    {activeModule?.title || 'Módulo 1: Fundamentos'}
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Selector Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {activeModule?.lessons.map((l, idx) => {
                const isSelected = l.id === activeLessonId;
                return (
                  <button
                    key={l.id}
                    onClick={() => {
                      setActiveLessonId(l.id);
                      setLessonTitle(l.title);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#4B3B8B] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{l.title}</span>
                    {l.simulatorLab && (
                      <span className="w-2 h-2 rounded-full bg-[#F2C94C]" title="Tiene simulador configurado" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Four Functional Columns / Sections for the Lesson */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. TEXTO TEÓRICO */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#4B3B8B]" />
                    <h4 className="font-bold text-sm text-slate-900">1. Texto Teórico de la Lección</h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Fundamentos Oficiales
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Teoría técnica redactada para la comprensión previa del aprendiz antes de ingresar al banco de trabajo:
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans whitespace-pre-line leading-relaxed text-slate-800 max-h-64 overflow-y-auto">
                  {activeLesson?.explanationText ||
                    'Fundamentos Teóricos: Un circuito eléctrico es una trayectoria cerrada por la cual fluyen los electrones impulsados por una diferencia de potencial. Verifica las conexiones antes de energizar.'}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={async () => {
                      if (!activeLesson) return;
                      setIsGeneratingExplanationAI(true);
                      try {
                        const newText = await generateLessonExplanationAI(
                          activeLesson.title,
                          activeModule.title,
                          course.category
                        );
                        updateLesson(course.id, activeModule.id, activeLesson.id, {
                          explanationText: newText,
                        });
                      } finally {
                        setIsGeneratingExplanationAI(false);
                      }
                    }}
                    disabled={isGeneratingExplanationAI}
                    className="px-3 py-1.5 bg-purple-50 text-[#4B3B8B] hover:bg-purple-100 text-xs font-bold rounded-lg border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isGeneratingExplanationAI ? 'Generando con Gemini...' : 'Regenerar con IA'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('structure')}
                    className="text-xs text-[#4B3B8B] font-bold hover:underline"
                  >
                    Editar en Estructura →
                  </button>
                </div>
              </div>

              {/* 2. VIDEOS EXPLICATIVOS */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#4B3B8B]" />
                    <h4 className="font-bold text-sm text-slate-900">2. Video Explicativo de Taller</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {activeLesson?.durationMinutes || 25} min
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Clase grabada en alta definición con demostración paso a paso de mediciones y ensamblaje:
                </p>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video relative">
                  <VideoPlayer
                    src={
                      activeLesson?.videoUrl ||
                      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                    }
                    title={activeLesson?.title || 'Video de Clase'}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono truncate max-w-[200px]">
                    Archivo: {activeLesson?.videoFileName || 'clase_circuitos_base_1080p.mp4'}
                  </span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Disponible para Alumnos</span>
                  </span>
                </div>
              </div>

              {/* 3. ACTIVIDADES PRÁCTICAS Y MATERIALES */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4B3B8B]" />
                    <h4 className="font-bold text-sm text-slate-900">3. Actividades Prácticas y Taller</h4>
                  </div>
                  <span className="text-[10px] font-bold text-[#4B3B8B] bg-[#4B3B8B]/10 px-2 py-0.5 rounded">
                    Banco de Trabajo
                  </span>
                </div>

                {/* Assignment details */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-xs">
                    {activeLesson?.assignment?.title || 'Detalle de asignación en Electrónica de Base'}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
                    {activeLesson?.assignment?.instructions ||
                      '1. Realiza el montaje en protoboard.\n2. Mide las tensiones en cada nodo.\n3. Adjunta fotografías y tabla comparativa.'}
                  </p>
                </div>

                {/* Practical Resources */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Guías y Documentos de Práctica Adjuntos:
                  </span>
                  {activeLesson?.resources && activeLesson.resources.length > 0 ? (
                    activeLesson.resources.map((res) => (
                      <div
                        key={res.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Download className="w-3.5 h-3.5 text-[#4B3B8B]" />
                          <span className="font-semibold text-slate-800 truncate">{res.title}</span>
                          {res.size && (
                            <span className="text-[10px] text-slate-400 font-mono">({res.size})</span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{res.type}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">No hay archivos adjuntos aún.</div>
                  )}
                </div>
              </div>

              {/* 4. PROPUESTA DE SIMULADOR / EXAMEN CON IA (CONDICIONAL ADMINISTRADOR) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-sm text-slate-900">4. Propuesta de Simulador con IA</h4>
                  </div>
                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      activeLesson?.simulatorEnabledByAdmin
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {activeLesson?.simulatorEnabledByAdmin
                      ? '● Habilitado por Administrador'
                      : '○ Bloqueado / Oculto por Defecto'}
                  </span>
                </div>

                {/* Conditional Notice Box */}
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    activeLesson?.simulatorEnabledByAdmin
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {activeLesson?.simulatorEnabledByAdmin ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Visible en el Perfil del Alumno</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Aprobación del Administrador Requerida</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {activeLesson?.simulatorEnabledByAdmin
                      ? 'El Administrador ha aprobado esta prueba con IA. Los alumnos matriculados pueden acceder al simulador en su aula virtual y recibir retroalimentación instantánea.'
                      : 'Este laboratorio simulado NO está visible para los alumnos. Solo cuando el Administrador de la Plataforma active el switch correspondiente, la prueba se desplegará en el perfil del alumno.'}
                  </p>
                </div>

                {/* Simulator Lab Details if configured */}
                {activeLesson?.simulatorLab ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-800">
                      {activeLesson.simulatorLab.title}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {activeLesson.simulatorLab.scenarioDescription}
                    </p>
                    {activeLesson.simulatorLab.initialInstrumentState && (
                      <div className="text-[10px] font-mono text-slate-500 bg-white p-1 rounded border">
                        {activeLesson.simulatorLab.initialInstrumentState}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-center text-xs">
                    No se ha diseñado un simulador aún para esta lección.
                  </div>
                )}

                {/* Actions & Admin Controls */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSimulatorModalOpen(true)}
                      className="px-3 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
                    >
                      Configurar Simulador
                    </button>

                    {activeLesson?.simulatorLab && (
                      <button
                        onClick={() => setIsSimulatorModalOpen(true)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Revisar Simulador
                      </button>
                    )}
                  </div>

                  {/* If user is Admin, allow toggling right here */}
                  {role === 'admin' && activeLesson && (
                    <div className="flex items-center gap-2 bg-[#FAF8FF] px-2.5 py-1 rounded-lg border border-[#4B3B8B]/30">
                      <span className="text-[11px] font-bold text-[#4B3B8B]">
                        Switch Admin:
                      </span>
                      <button
                        onClick={() =>
                          toggleLessonSimulator(course.id, activeModule.id, activeLesson.id)
                        }
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          activeLesson.simulatorEnabledByAdmin ? 'bg-[#4B3B8B]' : 'bg-slate-300'
                        }`}
                        title="Conmutar visibilidad para alumnos"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-0.5 ${
                            activeLesson.simulatorEnabledByAdmin
                              ? 'translate-x-4.5'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Body: Config. Avanzada */}
        {activeTab === 'advanced' && (
          <div className="p-6 md:p-8 space-y-4 text-xs text-slate-700">
            <h3 className="text-base font-bold text-slate-900">Configuración Avanzada del Curso</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-[#4B3B8B] focus:ring-[#4B3B8B]" />
                <span>Emitir Certificado Institucional CFP AGAPE al alcanzar el 100% de asistencia y notas.</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-[#4B3B8B] focus:ring-[#4B3B8B]" />
                <span>Bloquear módulo posterior hasta aprobar el cuestionario de circuitos.</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
