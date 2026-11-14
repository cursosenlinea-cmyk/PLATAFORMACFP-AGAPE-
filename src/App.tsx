/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, GraduationCap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { LmsProvider, useLms } from './context/LmsContext';
import { AgapeSidebar } from './components/agape/AgapeSidebar';
import { AgapeHeader } from './components/agape/AgapeHeader';
import { CourseStructureEditor } from './components/agape/CourseStructureEditor';
import { AgapeStudentClassroom } from './components/agape/AgapeStudentClassroom';
import { AgapeLoginPortal } from './components/auth/AgapeLoginPortal';
import { AgapeAdminDashboard } from './components/admin/AgapeAdminDashboard';
import {
  AgapeStudentsView,
  AgapeAnalyticsView,
  AgapeBrandingView,
} from './components/agape/AgapeViews';
import { CertificateModal } from './components/common/CertificateModal';

const AgapeLmsWorkspace: React.FC = () => {
  const {
    role,
    currentAuthUser,
    courses,
    selectedCourseId,
    setSelectedCourseId,
    certificateCourse,
    closeCertificate,
    getCourseProgressPercent,
  } = useLms();

  // Tab state synced to authenticated role
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (role === 'admin') return 'admin-users';
    if (role === 'instructor') return 'courses';
    return 'classroom';
  });

  // Reset default tab whenever authenticated user or role changes
  useEffect(() => {
    if (!currentAuthUser) return;
    if (currentAuthUser.role === 'admin') {
      setCurrentTab('admin-users');
    } else if (currentAuthUser.role === 'instructor') {
      setCurrentTab('courses');
    } else {
      setCurrentTab('classroom');
    }
  }, [currentAuthUser?.id, currentAuthUser?.role]);

  // Filter courses strictly by role and institutional assignments
  const accessibleCourses = useMemo(() => {
    if (!currentAuthUser) return [];
    if (currentAuthUser.role === 'admin') {
      return courses;
    }
    if (currentAuthUser.role === 'instructor') {
      const userEmail = currentAuthUser.email.trim().toLowerCase();
      return courses.filter(
        (c) =>
          (c.assignedTeacherIds || []).includes(currentAuthUser.id) ||
          c.instructor.email?.trim().toLowerCase() === userEmail
      );
    }
    const enrolled = currentAuthUser.enrolledCourseIds || [];
    return courses.filter((c) => enrolled.includes(c.id));
  }, [currentAuthUser, courses]);

  // Keep selectedCourseId synchronized to an accessible course
  const currentCourse = useMemo(() => {
    if (accessibleCourses.length === 0) return undefined;
    return accessibleCourses.find((c) => c.id === selectedCourseId) || accessibleCourses[0];
  }, [accessibleCourses, selectedCourseId]);

  useEffect(() => {
    if (currentCourse && currentCourse.id !== selectedCourseId) {
      setSelectedCourseId(currentCourse.id);
    }
  }, [currentCourse?.id, selectedCourseId, setSelectedCourseId]);

  // Mandatory Production Entry Gate: unauthenticated users only see the institutional Login Portal
  if (!currentAuthUser) {
    return <AgapeLoginPortal />;
  }

  const showCourseSwitcher =
    accessibleCourses.length > 1 &&
    (currentTab === 'courses' ||
      currentTab === 'classroom' ||
      currentTab === 'analytics' ||
      currentTab === 'dashboard');

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex relative overflow-x-hidden font-sans">
      {/* Institutional Certificate Modal */}
      <CertificateModal course={certificateCourse} onClose={closeCertificate} />

      {/* Subtle Geometric Background Vector Lines (CFP ÁGAPE Watermark) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.22] z-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="0" y1="800" x2="400" y2="1050" stroke="#6080B8" strokeWidth="1.5" />
        <line x1="30" y1="720" x2="380" y2="980" stroke="#4B3B8B" strokeWidth="1" />
        <line x1="900" y1="0" x2="1600" y2="400" stroke="#6080B8" strokeWidth="1.5" />
        <line x1="980" y1="-50" x2="1650" y2="350" stroke="#4B3B8B" strokeWidth="1" />
        <line x1="1200" y1="600" x2="1700" y2="1100" stroke="#6080B8" strokeWidth="1" />
        <polygon points="50,900 200,850 150,980" fill="none" stroke="#6080B8" strokeWidth="0.8" />
      </svg>

      {/* Left Sidebar Navigation with CFP AGAPE Logo */}
      <AgapeSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col p-6 md:p-8 max-w-6xl mx-auto w-full relative z-10 space-y-4">
        {/* Top Header with Breadcrumbs, Title and Authenticated Profile */}
        <AgapeHeader
          courseTitle={currentCourse?.title || 'Campus Virtual CFP ÁGAPE'}
          onNavigateToCourses={() =>
            setCurrentTab(
              role === 'admin' ? 'admin-courses' : role === 'instructor' ? 'courses' : 'classroom'
            )
          }
        />

        {/* Multi-Course Selector Bar (shown whenever user has > 1 course) */}
        {showCourseSwitcher && (
          <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-2.5 shadow-2xs flex items-center gap-3 overflow-x-auto">
            <span className="text-[11px] font-bold text-[#4B3B8B] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{role === 'student' ? 'Mis Cursos:' : 'Cambiar Curso:'}</span>
            </span>
            <div className="flex items-center gap-2">
              {accessibleCourses.map((c) => {
                const isSelected = currentCourse?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCourseId(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#4B3B8B] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Main Views */}
        <main className="flex-1">
          {/* ========================================================= */}
          {/* 1. SUPER ADMINISTRATOR & DELEGATED ADMINISTRATORS VIEWS   */}
          {/* ========================================================= */}
          {role === 'admin' &&
            (currentTab === 'admin-users' ||
              currentTab === 'admin-courses' ||
              currentTab === 'simulators' ||
              currentTab === 'admin-certificates') && (
              <AgapeAdminDashboard
                initialTab={
                  currentTab === 'admin-courses'
                    ? 'courses'
                    : currentTab === 'simulators'
                    ? 'simulators'
                    : currentTab === 'admin-certificates'
                    ? 'certificates'
                    : 'users'
                }
                onNavigateToCourseEdit={(cId) => {
                  setSelectedCourseId(cId);
                  setCurrentTab('courses');
                }}
              />
            )}

          {role === 'admin' && currentTab === 'courses' && (
            currentCourse ? (
              <CourseStructureEditor course={currentCourse} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <p className="text-sm font-bold text-slate-800">
                  No hay cursos creados en la plataforma todavía.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentTab('admin-courses')}
                  className="px-4 py-2 bg-[#4B3B8B] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Crear Primer Curso
                </button>
              </div>
            )
          )}

          {/* ========================================================= */}
          {/* 2. DOCENTE / INSTRUCTOR VIEWS                             */}
          {/* ========================================================= */}
          {role === 'instructor' && currentTab === 'courses' && (
            currentCourse ? (
              <CourseStructureEditor course={currentCourse} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center space-y-3">
                <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
                <h2 className="text-lg font-extrabold text-[#3B2C73]">
                  Sin Cursos Asignados Actualmente
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Tu cuenta docente está activa, pero aún no tienes programas formativos asignados. Solicita a la Administración del CFP ÁGAPE tu asignación en el panel de cursos.
                </p>
              </div>
            )
          )}

          {role === 'instructor' && currentTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-bold text-[#3B2C73]">
                    Panel Curricular del Docente · CFP ÁGAPE
                  </h2>
                  <span className="px-3 py-1 bg-[#4B3B8B]/10 text-[#4B3B8B] text-xs font-bold rounded-full">
                    {accessibleCourses.length}{' '}
                    {accessibleCourses.length === 1 ? 'Curso Asignado' : 'Cursos Asignados'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Bienvenido al portal docente del <strong>Centro de Formación Profesional ÁGAPE</strong>. Administra tus módulos, redacta contenido teórico, adjunta guías de taller y diseña simuladores técnicos sujetos a habilitación administrativa.
                </p>

                {accessibleCourses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {accessibleCourses.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl border border-slate-200 bg-[#FAFBFD] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{c.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {c.category} · {c.modules.length} módulos · Estado: {c.status}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(c.id);
                            setCurrentTab('courses');
                          }}
                          className="px-3.5 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                        >
                          Editar Curso
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {currentCourse && <AgapeAnalyticsView course={currentCourse} />}
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. ALUMNO / ESTUDIANTE VIEWS                              */}
          {/* ========================================================= */}
          {role === 'student' && currentTab === 'classroom' && (
            currentCourse ? (
              <AgapeStudentClassroom course={currentCourse} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center space-y-3">
                <GraduationCap className="w-10 h-10 text-[#4B3B8B] mx-auto" />
                <h2 className="text-lg font-extrabold text-[#3B2C73]">
                  Aún No Estás Matriculado en Cursos
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Tu cuenta institucional está verificada, pero no registra matrículas activas. Comunícate con la Coordinación Académica del CFP ÁGAPE para completar tu inscripción.
                </p>
              </div>
            )
          )}

          {role === 'student' && currentTab === 'courses' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#3B2C73]">
                    Mis Programas Formativos Matriculados
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Accede a tus cursos activos, materiales descargables y progreso de certificación.
                  </p>
                </div>
                {currentCourse && (
                  <button
                    type="button"
                    onClick={() => setCurrentTab('classroom')}
                    className="px-4 py-2 bg-[#4B3B8B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#3B2D73] cursor-pointer"
                  >
                    Ir al Aula Virtual
                  </button>
                )}
              </div>

              {accessibleCourses.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  No registras cursos matriculados por el momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accessibleCourses.map((c) => {
                    const pct = getCourseProgressPercent(c.id);
                    return (
                      <div
                        key={c.id}
                        className="p-5 rounded-xl border border-slate-200 bg-[#FCF9EF] space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B3B8B]">
                              {c.category}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Matriculado</span>
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">{c.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {c.description}
                          </p>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                              <span>Avance actual</span>
                              <span className="font-mono text-[#4B3B8B]">{pct}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourseId(c.id);
                              setCurrentTab('classroom');
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                          >
                            Entrar al Aula de Clases
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. COMMON & AUXILIARY VIEWS                               */}
          {/* ========================================================= */}
          {role !== 'admin' && currentTab === 'students' && (
            <AgapeStudentsView courses={accessibleCourses} />
          )}

          {currentTab === 'analytics' && currentCourse && (
            <AgapeAnalyticsView course={currentCourse} />
          )}

          {currentTab === 'branding' && <AgapeBrandingView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LmsProvider>
      <AgapeLmsWorkspace />
    </LmsProvider>
  );
}
