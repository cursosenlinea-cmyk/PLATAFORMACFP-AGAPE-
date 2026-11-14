import React, { useState } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  ChevronRight,
  LogOut,
  BadgeCheck,
} from 'lucide-react';
import { useLms, isMasterAdminUser } from '../../context/LmsContext';

interface AgapeHeaderProps {
  courseTitle: string;
  showCourseTitle?: boolean;
  onNavigateToCourses: () => void;
}

export const AgapeHeader: React.FC<AgapeHeaderProps> = ({
  courseTitle,
  showCourseTitle = true,
  onNavigateToCourses,
}) => {
  const { role, currentUser, currentAuthUser, logout } = useLms();

  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  const activeName = currentAuthUser?.name || currentUser.name;
  const activeAvatar = currentAuthUser?.avatar || currentUser.avatar;
  const activeEmail = currentAuthUser?.email || currentUser.email;
  const activeCode = currentAuthUser?.institutionalCode;
  const isMaster = isMasterAdminUser(currentAuthUser);

  const roleLabel =
    role === 'admin'
      ? isMaster
        ? 'Super Administrador Maestro'
        : 'Administrador de Plataforma'
      : role === 'instructor'
      ? 'Docente Titular'
      : 'Estudiante Matriculado';

  return (
    <header className="flex flex-col gap-3 pb-2 relative z-20">
      {/* Top Bar with Breadcrumbs & Authenticated Profile Card */}
      <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <button
            onClick={onNavigateToCourses}
            className="hover:text-[#4B3B8B] transition-colors cursor-pointer"
          >
            {role === 'admin'
              ? 'Administración Central'
              : role === 'instructor'
              ? 'Mis Cursos Asignados'
              : 'Mis Cursos'}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">
            {role === 'admin'
              ? 'Gestión Multi-Administrador'
              : role === 'instructor'
              ? 'Panel Curricular Docente'
              : 'Aula Virtual'}
          </span>
        </div>

        {/* Authenticated User Profile Card */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-[#6080B8] transition-all"
          >
            <img
              src={activeAvatar}
              alt={activeName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 tracking-tight leading-tight flex items-center gap-1">
                <span>{activeName}</span>
                {isMaster && <BadgeCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>
              <div className="text-[10px] text-[#4B3B8B] font-semibold leading-none flex items-center gap-1 mt-0.5">
                {role === 'admin' && <ShieldCheck className="w-3 h-3 text-amber-500 inline" />}
                <span>{roleLabel}</span>
                {activeCode && (
                  <span className="text-slate-400 font-mono">· {activeCode}</span>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>

          {/* Clean Production Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in duration-150">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <img
                  src={activeAvatar}
                  alt={activeName}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{activeName}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {activeEmail}
                  </div>
                  {activeCode && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Código/DUI: {activeCode}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/70">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#4B3B8B]/10 text-[#4B3B8B]">
                  <ShieldCheck className="w-3 h-3 text-[#4B3B8B]" />
                  <span>CFP ÁGAPE · {roleLabel}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Page Header (hidden in Admin role so no course title leaks into general admin header) */}
      {role !== 'admin' && showCourseTitle && (
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#3B2C73] tracking-tight">
            {role === 'instructor' ? 'Gestión Curricular: ' : 'Aula de Aprendizaje: '}
            <span className="text-[#1E293B] font-bold">{courseTitle}</span>
          </h1>
        </div>
      )}
    </header>
  );
};
