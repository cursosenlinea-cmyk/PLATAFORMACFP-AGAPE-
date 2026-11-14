import React, { useState } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Layers,
  ShieldCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Clock,
  Info,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';

export const AgapeLoginPortal: React.FC = () => {
  const { login, courses, registeredUsers } = useLms();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [catalogNotice, setCatalogNotice] = useState<string | null>(null);

  const publishedCourses = courses.filter((c) => c.status === 'Publicado');

  const getCourseTeacherNames = (courseId: string, fallbackName: string): string => {
    const course = courses.find((c) => c.id === courseId);
    if (!course?.assignedTeacherIds || course.assignedTeacherIds.length === 0) {
      return fallbackName;
    }
    const names = course.assignedTeacherIds
      .map((tid) => registeredUsers.find((u) => u.id === tid)?.name)
      .filter((n): n is string => Boolean(n));
    return names.length > 0 ? names.join(', ') : fallbackName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(
          res.message ||
            'No fue posible iniciar sesión. Verifica tus credenciales institucionales.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 relative overflow-x-hidden font-sans flex flex-col">
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

      {/* Top Institutional Bar */}
      <header className="relative z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/assets/aistudio/image_076e2ff0.png"
              alt="Centro de Formación Profesional ÁGAPE"
              className="w-12 h-12 rounded-full object-contain bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
            />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-[#3B2C73] tracking-tight">
                Centro de Formación Profesional ÁGAPE
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Campus Virtual Oficial · Educación para el Trabajo
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#4B3B8B]/8 border border-[#4B3B8B]/20 text-xs font-bold text-[#4B3B8B]">
            <ShieldCheck className="w-4 h-4 text-[#4B3B8B]" />
            <span>Acceso Exclusivo @campus.agape.edu.sv</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Main Section: Public Read-Only Course Catalog */}
        <section className="lg:col-span-7 xl:col-span-8 space-y-6 order-2 lg:order-1">
          <div className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>Oferta Formativa Institucional</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Programas Técnicos del CFP ÁGAPE
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed max-w-2xl">
              Consulta los programas de formación profesional vigentes. Para ingresar al aula virtual, materiales de laboratorio y evaluaciones, inicia sesión con tu cuenta institucional asignada.
            </p>
          </div>

          {catalogNotice && (
            <div className="p-3.5 bg-[#FAF8FF] border border-[#4B3B8B]/25 rounded-xl text-xs text-[#3B2C73] font-semibold flex items-center gap-2.5 animate-in fade-in">
              <Info className="w-4 h-4 text-[#4B3B8B] shrink-0" />
              <span>{catalogNotice}</span>
            </div>
          )}

          {publishedCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
              Actualmente no hay programas públicos activos en cartelera.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {publishedCourses.map((course) => {
                const totalLessons = course.modules.reduce(
                  (acc, m) => acc + m.lessons.length,
                  0
                );
                const totalMinutes = course.modules.reduce(
                  (acc, m) =>
                    acc + m.lessons.reduce((lAcc, l) => lAcc + (l.durationMinutes || 0), 0),
                  0
                );
                const teacherNames = getCourseTeacherNames(course.id, course.instructor.name);

                return (
                  <article
                    key={course.id}
                    onClick={() =>
                      setCatalogNotice(
                        `El programa "${course.title}" es de solo lectura en el portal público. Inicia sesión con tu correo @campus.agape.edu.sv para acceder al aula.`
                      )
                    }
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#6080B8] transition-all overflow-hidden flex flex-col cursor-pointer group"
                  >
                    <div className="relative h-40 bg-slate-900 overflow-hidden">
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#4B3B8B] text-white text-[10px] font-bold shadow-xs">
                          {course.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/95 text-slate-800 text-[10px] font-bold">
                          {course.level}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="text-sm font-extrabold leading-snug line-clamp-2">
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-semibold text-[#4B3B8B]">
                            <Layers className="w-3.5 h-3.5" />
                            <span>
                              {course.modules.length} módulos · {totalLessons} lecciones
                            </span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{Math.max(1, Math.round(totalMinutes / 60))}h</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-700">
                          <BookOpen className="w-3.5 h-3.5 text-[#6080B8] shrink-0" />
                          <span className="truncate">
                            <strong>Docente:</strong> {teacherNames}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Sticky Section: Mandatory Institutional Login Card */}
        <section className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 lg:sticky lg:top-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] p-6 text-white text-center space-y-2">
              <img
                src="/assets/aistudio/image_076e2ff0.png"
                alt="Logo CFP ÁGAPE"
                className="w-16 h-16 rounded-full bg-white p-1 mx-auto shadow-md object-contain"
              />
              <div>
                <h2 className="text-base font-extrabold tracking-tight">
                  Iniciar Sesión Institucional
                </h2>
                <p className="text-[11px] text-slate-200 mt-0.5">
                  Administradores, Docentes y Estudiantes Matriculados
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Correo Institucional (@campus.agape.edu.sv)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@campus.agape.edu.sv"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4B3B8B]/30 focus:border-[#4B3B8B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña asignada"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4B3B8B]/30 focus:border-[#4B3B8B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] hover:opacity-95 disabled:opacity-60 text-white font-bold rounded-xl shadow-md shadow-[#4B3B8B]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {isSubmitting ? 'Validando acceso...' : 'Ingresar al Campus Virtual'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4B3B8B] shrink-0 mt-0.5" />
                <span>
                  El acceso está restringido únicamente a cuentas habilitadas por la Administración del Centro de Formación Profesional ÁGAPE.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200/80 bg-white/80 py-4 px-6 text-center text-[11px] text-slate-500">
        Centro de Formación Profesional ÁGAPE · Sonsonate, El Salvador · Plataforma Educativa Institucional
      </footer>
    </div>
  );
};
