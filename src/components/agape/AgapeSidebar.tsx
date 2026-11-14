import React from 'react';
import {
  Home,
  BookOpen,
  Users,
  TrendingUp,
  Settings,
  GraduationCap,
  Briefcase,
  PlayCircle,
  ShieldCheck,
  FlaskConical,
  LogOut,
  FolderKanban,
  Award,
} from 'lucide-react';
import { useLms, isMasterAdminUser } from '../../context/LmsContext';

interface AgapeSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const AgapeSidebar: React.FC<AgapeSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { role, currentAuthUser, logout, progress } = useLms();
  const isMaster = isMasterAdminUser(currentAuthUser);

  const pendingCertCount = Object.values(progress).filter(
    (p) => p.certificateRequest?.status === 'pending'
  ).length;

  const adminMenuItems = [
    { id: 'admin-users', label: 'Usuarios y Admins', icon: Users },
    { id: 'admin-courses', label: 'Cursos y Matrículas', icon: FolderKanban },
    { id: 'simulators', label: 'Control Simuladores IA', icon: FlaskConical },
    {
      id: 'admin-certificates',
      label: 'Solicitudes Certificados',
      icon: Award,
      badge: pendingCertCount,
    },
    { id: 'courses', label: 'Editor de Contenidos', icon: BookOpen },
    { id: 'branding', label: 'Identidad Institucional', icon: Settings },
  ];

  const instructorMenuItems = [
    { id: 'courses', label: 'Mis Cursos Asignados', icon: BookOpen },
    { id: 'dashboard', label: 'Panel Docente', icon: Home },
    { id: 'students', label: 'Estudiantes Matriculados', icon: Users },
    { id: 'analytics', label: 'Analíticas', icon: TrendingUp },
    { id: 'branding', label: 'Campus CFP ÁGAPE', icon: Settings },
  ];

  const studentMenuItems = [
    { id: 'classroom', label: 'Mi Aula Virtual', icon: PlayCircle },
    { id: 'courses', label: 'Mis Cursos Matriculados', icon: BookOpen },
    { id: 'branding', label: 'Campus CFP ÁGAPE', icon: Settings },
  ];

  const menuItems: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] =
    role === 'admin'
      ? adminMenuItems
      : role === 'instructor'
      ? instructorMenuItems
      : studentMenuItems;

  const defaultHomeTab =
    role === 'admin' ? 'admin-users' : role === 'instructor' ? 'courses' : 'classroom';

  return (
    <aside className="w-64 bg-transparent shrink-0 flex flex-col p-6 space-y-6 select-none relative z-10">
      {/* Institutional Logo CFP ÁGAPE */}
      <div className="flex flex-col items-center sm:items-start pt-2">
        <div
          className="relative group cursor-pointer"
          onClick={() => onSelectTab(defaultHomeTab)}
        >
          <img
            src="/assets/aistudio/image_076e2ff0.png"
            alt="Centro de Formación Profesional ÁGAPE"
            className="w-32 h-32 md:w-36 md:h-36 object-contain rounded-full shadow-xs bg-white p-1 hover:scale-102 transition-transform duration-200"
          />
        </div>
      </div>

      {/* Authenticated Role Badge (No role switcher in production) */}
      <div className="px-3.5 py-2.5 rounded-xl bg-white/90 border border-slate-200/90 flex items-center gap-2.5 shadow-2xs">
        {role === 'admin' ? (
          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
        ) : role === 'instructor' ? (
          <Briefcase className="w-4 h-4 text-[#4B3B8B] shrink-0" />
        ) : (
          <GraduationCap className="w-4 h-4 text-[#4B3B8B] shrink-0" />
        )}
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
            {role === 'admin'
              ? isMaster
                ? 'Admin Maestro'
                : 'Administrador'
              : role === 'instructor'
              ? 'Portal Docente'
              : 'Aula Alumno'}
          </span>
          <span className="text-[10px] text-slate-500 block leading-tight truncate">
            {currentAuthUser?.institutionalCode || 'CFP ÁGAPE'}
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-1.5 pt-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (role === 'instructor' && item.id === 'courses' && currentTab === 'course-edit');

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] text-white shadow-md shadow-[#4B3B8B]/20 font-semibold'
                  : 'text-slate-700 hover:text-[#4B3B8B] hover:bg-white/60'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="tracking-tight text-left flex-1">{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${
                    isActive
                      ? 'bg-[#F2C94C] text-[#3B2C73]'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Institutional Footer & Logout */}
      <div className="mt-auto pt-4 border-t border-slate-200/70 space-y-3">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-white/80 hover:bg-rose-50 border border-slate-200/80 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Cerrar Sesión</span>
        </button>

        <div className="text-[11px] text-slate-400 space-y-0.5 px-1">
          <div className="font-semibold text-slate-600">CFP ÁGAPE</div>
          <div>Educación para el trabajo</div>
        </div>
      </div>
    </aside>
  );
};
