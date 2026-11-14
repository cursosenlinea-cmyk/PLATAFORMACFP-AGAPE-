import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Video,
  FileCheck,
  MessageSquare,
  Award,
  Layers,
  FlaskConical,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import { AuthUser, Course, DocCategory } from '../../types/lms';
import { useLms } from '../../context/LmsContext';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';

export const AgapeStudentsView: React.FC<{ courses: Course[] }> = ({ courses }) => {
  const {
    registeredUsers,
    getCourseProgressPercent,
    getModuleProgress,
    progress,
    gradeStudentAssignment,
  } = useLms();

  const [selectedEnrollment, setSelectedEnrollment] = useState<{
    student: AuthUser;
    course: Course;
  } | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<
    Record<string, { grade: string; feedback: string }>
  >({});
  const [savedNotices, setSavedNotices] = useState<Record<string, boolean>>({});
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    category?: DocCategory;
  } | null>(null);

  const courseIds = new Set(courses.map((c) => c.id));
  const enrolledRows = registeredUsers
    .filter(
      (u) =>
        u.role === 'student' &&
        (u.enrolledCourseIds || []).some((cid) => courseIds.has(cid))
    )
    .flatMap((student) =>
      (student.enrolledCourseIds || [])
        .filter((cid) => courseIds.has(cid))
        .map((cid) => {
          const courseObj = courses.find((c) => c.id === cid);
          const pct = getCourseProgressPercent(cid, student.id);
          return {
            key: `${student.id}-${cid}`,
            student,
            course: courseObj,
            courseTitle: courseObj?.title || cid,
            progress: pct,
          };
        })
    );

  const openStudentDossier = (student: AuthUser, course?: Course) => {
    if (!course) return;
    const progKey = `${student.id}::${course.id}`;
    const studentProg = progress[progKey];
    const initialDrafts: Record<string, { grade: string; feedback: string }> = {};
    course.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        if (l.assignment) {
          const sub = studentProg?.assignmentSubmissions?.[l.assignment.id];
          initialDrafts[l.assignment.id] = {
            grade: sub?.grade !== undefined ? String(sub.grade) : '',
            feedback: sub?.feedback || '',
          };
        }
      });
    });
    setGradeDrafts(initialDrafts);
    setSavedNotices({});
    setSelectedEnrollment({ student, course });
  };

  const handleSaveGrade = (studentId: string, courseId: string, assignmentId: string) => {
    const draft = gradeDrafts[assignmentId] || { grade: '0', feedback: '' };
    const numeric = Math.max(0, Math.min(100, Number(draft.grade || 0)));
    gradeStudentAssignment(studentId, courseId, assignmentId, numeric, draft.feedback.trim());
    setSavedNotices((prev) => ({ ...prev, [assignmentId]: true }));
    setTimeout(() => {
      setSavedNotices((prev) => ({ ...prev, [assignmentId]: false }));
    }, 2500);
  };

  const activeProgressKey = selectedEnrollment
    ? `${selectedEnrollment.student.id}::${selectedEnrollment.course.id}`
    : '';
  const activeStudentProg = activeProgressKey ? progress[activeProgressKey] : undefined;
  const activeOverallPercent = selectedEnrollment
    ? getCourseProgressPercent(selectedEnrollment.course.id, selectedEnrollment.student.id)
    : 0;

  return (
    <div className="space-y-6">
      {/* Document Preview Modal for student submitted links */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          url={previewDoc.url}
          category={previewDoc.category}
        />
      )}

      {/* Individual Student Tracking & Grading Dossier Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3B2C73] to-[#4B3B8B] p-5 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={selectedEnrollment.student.avatar}
                  alt={selectedEnrollment.student.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#F2C94C] shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    Panel de Seguimiento Individual · Docente CFP ÁGAPE
                  </span>
                  <h3 className="text-base font-extrabold truncate">
                    {selectedEnrollment.student.name}
                  </h3>
                  <p className="text-[11px] text-slate-200 font-mono truncate">
                    {selectedEnrollment.student.email}
                    {selectedEnrollment.student.institutionalCode
                      ? ` · DUI/Código: ${selectedEnrollment.student.institutionalCode}`
                      : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnrollment(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-xs bg-[#F4F6F9]">
              {/* Overall Course Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#4B3B8B]">
                    Programa Formativo
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {selectedEnrollment.course.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Videos vistos:{' '}
                    <strong className="text-slate-800">
                      {activeStudentProg?.watchedVideoLessonIds?.length || 0}
                    </strong>{' '}
                    · Tareas entregadas:{' '}
                    <strong className="text-slate-800">
                      {Object.keys(activeStudentProg?.assignmentSubmissions || {}).length}
                    </strong>
                  </div>
                </div>

                <div className="sm:w-56 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Avance Global Automático</span>
                    <span className="font-mono text-[#4B3B8B]">{activeOverallPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] rounded-full transition-all"
                      style={{ width: `${activeOverallPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Module-by-Module Progress & Watched Videos */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Layers className="w-4 h-4 text-[#4B3B8B]" />
                  <h4 className="text-sm font-bold text-[#3B2C73]">
                    Avance por Módulo y Videos Reproducidos
                  </h4>
                </div>

                <div className="space-y-3">
                  {selectedEnrollment.course.modules.map((mod, mIdx) => {
                    const modProg = getModuleProgress(
                      selectedEnrollment.course.id,
                      mod.id,
                      selectedEnrollment.student.id
                    );
                    return (
                      <div
                        key={mod.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="font-bold text-slate-900">
                            Módulo {mIdx + 1}: {mod.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-500">
                              {modProg.completed}/{modProg.total} lecciones
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#4B3B8B]/10 text-[#4B3B8B] font-mono font-bold text-[11px]">
                              {modProg.percentage}%
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4B3B8B] rounded-full"
                            style={{ width: `${modProg.percentage}%` }}
                          />
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {mod.lessons.map((les) => {
                            const hasVideo = Boolean(les.videoUrl && les.videoUrl.trim());
                            const videoSeen = Boolean(
                              activeStudentProg?.watchedVideoLessonIds?.includes(les.id)
                            );
                            const isLesDone = Boolean(
                              activeStudentProg?.completedLessonIds?.includes(les.id)
                            );
                            const simScore =
                              les.simulatorLab && les.simulatorEnabledByAdmin
                                ? activeStudentProg?.simulatorScores?.[les.simulatorLab.id]
                                : undefined;

                            return (
                              <div
                                key={les.id}
                                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200/80 text-[11px]"
                              >
                                <div className="flex items-center gap-2 font-semibold text-slate-800">
                                  {isLesDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span>{les.title}</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {hasVideo && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                                        videoSeen
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      <Video className="w-3 h-3" />
                                      <span>{videoSeen ? 'Video visto' : 'Video pendiente'}</span>
                                    </span>
                                  )}

                                  {les.simulatorLab && les.simulatorEnabledByAdmin && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                                        simScore?.passed
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-amber-50 text-amber-700'
                                      }`}
                                    >
                                      <FlaskConical className="w-3 h-3" />
                                      <span>
                                        {simScore
                                          ? `Simulador: ${simScore.score}%`
                                          : 'Simulador pendiente'}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submitted Assignments & Grading Panel */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-[#4B3B8B]" />
                    <h4 className="text-sm font-bold text-[#3B2C73]">
                      Tareas Entregadas y Evaluación Docente (0 – 100)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Las calificaciones emitidas son visibles para Administración al autorizar el certificado.
                  </span>
                </div>

                {(() => {
                  const lessonsWithAssignments = selectedEnrollment.course.modules.flatMap(
                    (m, mIdx) =>
                      m.lessons
                        .filter((l) => l.assignment)
                        .map((l) => ({
                          moduleTitle: `Mód. ${mIdx + 1}: ${m.title}`,
                          lessonTitle: l.title,
                          assignment: l.assignment!,
                        }))
                  );

                  if (lessonsWithAssignments.length === 0) {
                    return (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Este curso aún no tiene tareas prácticas configuradas en sus lecciones.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {lessonsWithAssignments.map(({ moduleTitle, lessonTitle, assignment }) => {
                        const submission =
                          activeStudentProg?.assignmentSubmissions?.[assignment.id];
                        const draft = gradeDrafts[assignment.id] || {
                          grade:
                            submission?.grade !== undefined ? String(submission.grade) : '',
                          feedback: submission?.feedback || '',
                        };
                        const justSaved = savedNotices[assignment.id];

                        return (
                          <div
                            key={assignment.id}
                            className="p-4 rounded-xl border border-slate-200 bg-[#FAFBFD] space-y-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="text-[10px] font-bold uppercase text-[#4B3B8B]">
                                  {moduleTitle} · {lessonTitle}
                                </div>
                                <div className="text-sm font-bold text-slate-900">
                                  {assignment.title}
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  submission?.status === 'graded'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : submission
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {submission?.status === 'graded'
                                  ? `Calificada: ${submission.grade}/100`
                                  : submission
                                  ? 'Entregada · Pendiente de Nota'
                                  : 'Sin entrega aún'}
                              </span>
                            </div>

                            {submission ? (
                              <div className="space-y-3">
                                {/* Submission Artifact Card */}
                                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-800 truncate">
                                          {submission.fileName}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                          Entregado:{' '}
                                          {new Date(submission.submittedAt).toLocaleString('es-SV')}
                                          {submission.fileSize ? ` · ${submission.fileSize}` : ''}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {submission.fileData && (
                                        <a
                                          href={submission.fileData}
                                          download={submission.fileName}
                                          className="px-2.5 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>Descargar Archivo</span>
                                        </a>
                                      )}

                                      {submission.linkUrl && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setPreviewDoc({
                                                title: submission.fileName || assignment.title,
                                                url: submission.linkUrl!,
                                                category: submission.docCategory,
                                              })
                                            }
                                            className="px-2.5 py-1.5 bg-[#FAF8FF] border border-[#4B3B8B]/30 text-[#4B3B8B] hover:bg-[#F3EBFD] rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Vista Previa</span>
                                          </button>
                                          <a
                                            href={submission.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-[#4B3B8B] text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Abrir Enlace</span>
                                          </a>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {submission.notes && (
                                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                      <strong>Nota del estudiante:</strong> {submission.notes}
                                    </p>
                                  )}
                                </div>

                                {/* Grading Form */}
                                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                                    <div>
                                      <label className="block font-bold text-slate-700 mb-1">
                                        Calificación (0–100):
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={draft.grade}
                                        onChange={(e) =>
                                          setGradeDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: {
                                              ...draft,
                                              grade: e.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Ej. 95"
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                                      />
                                    </div>

                                    <div className="sm:col-span-3">
                                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5 text-[#4B3B8B]" />
                                        <span>Retroalimentación para el Estudiante:</span>
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={draft.feedback}
                                        onChange={(e) =>
                                          setGradeDrafts((prev) => ({
                                            ...prev,
                                            [assignment.id]: {
                                              ...draft,
                                              feedback: e.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Observaciones técnicas sobre el trabajo entregado..."
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-1">
                                    <div className="text-[10px] text-slate-400">
                                      {submission.gradedAt && (
                                        <span>
                                          Última evaluación:{' '}
                                          {new Date(submission.gradedAt).toLocaleString('es-SV')}
                                          {submission.gradedBy ? ` por ${submission.gradedBy}` : ''}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {justSaved && (
                                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Calificación Guardada</span>
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        disabled={draft.grade === ''}
                                        onClick={() =>
                                          handleSaveGrade(
                                            selectedEnrollment.student.id,
                                            selectedEnrollment.course.id,
                                            assignment.id
                                          )
                                        }
                                        className="px-4 py-1.5 bg-[#4B3B8B] hover:bg-[#3B2C73] disabled:opacity-40 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                                      >
                                        <Award className="w-3.5 h-3.5 text-[#F2C94C]" />
                                        <span>Guardar Calificación</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-lg border border-dashed border-slate-200">
                                El estudiante aún no ha enviado esta tarea.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Enrolled Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#3B2C73]">
              Estudiantes Matriculados - CFP ÁGAPE
            </h2>
            <p className="text-xs text-slate-500">
              Haz clic sobre cualquier estudiante para abrir su Panel de Seguimiento Individual, revisar entregas y asignar calificaciones.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#4B3B8B] bg-[#4B3B8B]/10 px-3 py-1 rounded-full">
            {enrolledRows.length} Matrículas Activas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">Código / DUI</th>
                <th className="py-3 px-4">Curso Matriculado</th>
                <th className="py-3 px-4">Progreso</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Seguimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolledRows.map((row) => (
                <tr
                  key={row.key}
                  onClick={() => openStudentDossier(row.student, row.course)}
                  className="hover:bg-[#FAF8FF] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={row.student.avatar}
                        alt={row.student.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-[#4B3B8B] transition-colors">
                          {row.student.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {row.student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {row.student.institutionalCode || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{row.courseTitle}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#4B3B8B] h-full rounded-full"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums">{row.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.student.isActive === false
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {row.student.isActive === false ? 'Suspendido' : 'Activo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openStudentDossier(row.student, row.course);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF8FF] border border-[#4B3B8B]/30 text-[#4B3B8B] hover:bg-[#4B3B8B] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <span>Ver Expediente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {enrolledRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No hay estudiantes matriculados aún en los cursos seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const AgapeAnalyticsView: React.FC<{ course: Course }> = ({ course }) => {
  const { registeredUsers } = useLms();
  const realEnrolledCount = registeredUsers.filter(
    (u) => u.role === 'student' && (u.enrolledCourseIds || []).includes(course.id)
  ).length;
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const enabledSims = course.modules.reduce(
    (acc, m) =>
      acc +
      m.lessons.filter((l) => l.simulatorLab && l.simulatorEnabledByAdmin === true).length,
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
      <div className="pb-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-[#3B2C73]">Analíticas de Rendimiento Académico</h2>
        <p className="text-xs text-slate-500">
          Métricas reales del curso {course.title} · CFP ÁGAPE.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 block mb-1">Estudiantes Matriculados</span>
          <span className="text-2xl font-bold font-mono text-[#3B2C73]">{realEnrolledCount}</span>
          <span className="text-[11px] text-emerald-600 block mt-1">
            Matrícula verificada @campus.agape.edu.sv
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 block mb-1">Lecciones & Módulos</span>
          <span className="text-2xl font-bold font-mono text-[#6080B8]">
            {course.modules.length} / {totalLessons}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Módulos y lecciones estructuradas
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 block mb-1">Simuladores Habilitados</span>
          <span className="text-2xl font-bold font-mono text-emerald-700">{enabledSims}</span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Aprobados por Administración
          </span>
        </div>
      </div>
    </div>
  );
};

export const AgapeBrandingView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
      <div className="pb-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-[#3B2C73]">
          Identidad Institucional CFP ÁGAPE
        </h2>
        <p className="text-xs text-slate-500">
          Paleta oficial extraída del logotipo del Centro de Formación Profesional ÁGAPE.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="w-full h-16 rounded-lg bg-[#4B3B8B] shadow-inner" />
          <div className="font-bold text-xs text-slate-900">Púrpura / Violeta Primario</div>
          <div className="font-mono text-xs text-slate-500">#4B3B8B</div>
          <p className="text-[11px] text-slate-500">
            Botones de acción principales, acentos y elementos activos.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="w-full h-16 rounded-lg bg-[#6080B8] shadow-inner" />
          <div className="font-bold text-xs text-slate-900">Azul / Gris Azulado Secundario</div>
          <div className="font-mono text-xs text-slate-500">#6080B8</div>
          <p className="text-[11px] text-slate-500">
            Encabezados de módulos, pestañas y degradados institucionales.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="w-full h-16 rounded-lg bg-[#F2C94C] shadow-inner" />
          <div className="font-bold text-xs text-slate-900">Amarillo Acento</div>
          <div className="font-mono text-xs text-slate-500">#F2C94C</div>
          <p className="text-[11px] text-slate-500">
            Inspirado en el emblema del logotipo de CFP ÁGAPE para destacar insignias clave.
          </p>
        </div>
      </div>
    </div>
  );
};
