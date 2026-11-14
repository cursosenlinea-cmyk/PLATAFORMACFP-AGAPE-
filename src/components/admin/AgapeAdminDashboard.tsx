import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Briefcase,
  UserPlus,
  Power,
  Trash2,
  FlaskConical,
  Plus,
  Search,
  BookOpen,
  Lock,
  Check,
  X,
  Info,
  Camera,
  KeyRound,
  Edit3,
  Upload,
  FileSpreadsheet,
  FolderPlus,
  Sliders,
  BadgeCheck,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useLms, isMasterAdminUser } from '../../context/LmsContext';
import {
  AuthUser,
  Course,
  CourseLevel,
  CourseStatus,
  CSVEnrollmentResult,
  SimulatorLab,
  UserRole,
} from '../../types/lms';
import { AgapeSimulatorPlayer } from '../agape/AgapeSimulatorPlayer';
import { compressImageFileToDataUrl, parseStudentsCSV } from '../../utils/imageUtils';

interface AgapeAdminDashboardProps {
  initialTab?: 'users' | 'courses' | 'simulators';
  onNavigateToCourseEdit?: (courseId: string) => void;
}

export const AgapeAdminDashboard: React.FC<AgapeAdminDashboardProps> = ({
  initialTab = 'users',
  onNavigateToCourseEdit,
}) => {
  const {
    registeredUsers,
    currentAuthUser,
    createUser,
    updateUser,
    resetUserPassword,
    toggleUserStatus,
    deleteUser,
    courses,
    createCourse,
    updateCourse,
    updateCourseStatus,
    deleteCourse,
    assignTeachersToCourse,
    assignStudentToCourse,
    removeStudentFromCourse,
    bulkEnrollStudentsCSV,
    toggleCourseSimulator,
    toggleLessonSimulator,
    setSelectedCourseId,
  } = useLms();

  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'simulators'>(initialTab);

  // Sync external initialTab changes from sidebar
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Global feedback toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // =========================================================
  // TAB 1 STATE: USERS & MULTI-ADMINS
  // =========================================================
  const [userSearch, setUserSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Create / Edit User Modal
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [uName, setUName] = useState<string>('');
  const [uCode, setUCode] = useState<string>('');
  const [uEmail, setUEmail] = useState<string>('');
  const [uPassword, setUPassword] = useState<string>('');
  const [uRole, setURole] = useState<UserRole>('student');
  const [uSpecialty, setUSpecialty] = useState<string>('');
  const [uPosition, setUPosition] = useState<string>('');
  const [uAvatar, setUAvatar] = useState<string>('');
  const [uCourseIds, setUCourseIds] = useState<string[]>([]);
  const [userFormFeedback, setUserFormFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const userAvatarInputRef = useRef<HTMLInputElement>(null);

  // Reset Password Modal
  const [resetPwdUser, setResetPwdUser] = useState<AuthUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [resetPwdError, setResetPwdError] = useState<string | null>(null);

  // =========================================================
  // TAB 2 STATE: COURSES, TEACHERS & ENROLLMENTS
  // =========================================================
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [showCreateCourseModal, setShowCreateCourseModal] = useState<boolean>(false);
  const [cTitle, setCTitle] = useState<string>('');
  const [cSubtitle, setCSubtitle] = useState<string>('');
  const [cCategory, setCCategory] = useState<string>('Electrónica & Mantenimiento');
  const [cLevel, setCLevel] = useState<CourseLevel>('Principiante');
  const [cStatus, setCStatus] = useState<CourseStatus>('Publicado');
  const [cDescription, setCDescription] = useState<string>('');
  const [cCoverImage, setCCoverImage] = useState<string>(
    '/assets/images/course_cover_webdev_1793144124323.jpg'
  );
  const [cTeacherIds, setCTeacherIds] = useState<string[]>([]);
  const courseCoverInputRef = useRef<HTMLInputElement>(null);

  // Teacher Assignment Modal per Course
  const [assignTeachersCourse, setAssignTeachersCourse] = useState<Course | null>(null);
  const [tempTeacherIds, setTempTeacherIds] = useState<string[]>([]);

  // Per-Course Enrollment & CSV Modal
  const [enrollmentCourse, setEnrollmentCourse] = useState<Course | null>(null);
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<string>('');
  const [csvText, setCsvText] = useState<string>('');
  const [csvResult, setCsvResult] = useState<CSVEnrollmentResult | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================
  // TAB 3 STATE: SIMULATOR TECHNICAL INSPECTION
  // =========================================================
  const [inspectSimulatorLab, setInspectSimulatorLab] = useState<SimulatorLab | null>(null);

  // Derived collections
  const admins = registeredUsers.filter((u) => u.role === 'admin');
  const teachers = registeredUsers.filter((u) => u.role === 'instructor');
  const students = registeredUsers.filter((u) => u.role === 'student');

  const filteredUsers = registeredUsers.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = userSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.institutionalCode && u.institutionalCode.toLowerCase().includes(q)) ||
      (u.specialty && u.specialty.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const filteredCourses = courses.filter((c) => {
    const q = courseSearch.trim().toLowerCase();
    return (
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.instructor.name.toLowerCase().includes(q)
    );
  });

  const allLessonsWithSimulator = courses.flatMap((c) =>
    c.modules.flatMap((m) =>
      m.lessons
        .filter((l) => l.simulatorLab)
        .map((l) => ({ course: c, module: m, lesson: l }))
    )
  );
  const totalSimulators = allLessonsWithSimulator.length;
  const activeSimulatorsCount = allLessonsWithSimulator.filter(
    (item) => item.lesson.simulatorEnabledByAdmin === true
  ).length;

  // =========================================================
  // HANDLERS: USER MODAL & PHOTO UPLOAD
  // =========================================================
  const openCreateUserModal = (presetRole: UserRole = 'student') => {
    setEditingUser(null);
    setUName('');
    setUCode('');
    setUEmail('');
    setUPassword('');
    setURole(presetRole);
    setUSpecialty('');
    setUPosition('');
    setUAvatar(
      presetRole === 'student'
        ? '/assets/images/avatar_student_1793144128485.jpg'
        : '/assets/images/avatar_instructor_1793144141202.jpg'
    );
    setUCourseIds(presetRole === 'student' && courses[0] ? [courses[0].id] : []);
    setUserFormFeedback(null);
    setShowUserModal(true);
  };

  const openEditUserModal = (user: AuthUser) => {
    setEditingUser(user);
    setUName(user.name);
    setUCode(user.institutionalCode || '');
    setUEmail(user.email);
    setUPassword('');
    setURole(user.role);
    setUSpecialty(user.specialty || '');
    setUPosition(user.position || '');
    setUAvatar(user.avatar);
    setUCourseIds(user.enrolledCourseIds || []);
    setUserFormFeedback(null);
    setShowUserModal(true);
  };

  const handleUserAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 256, 0.82);
      setUAvatar(compressed);
    } catch (err) {
      setUserFormFeedback({
        type: 'error',
        message: 'No se pudo cargar la imagen seleccionada.',
      });
    }
    e.target.value = '';
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormFeedback(null);

    if (editingUser) {
      const res = updateUser(editingUser.id, {
        name: uName.trim(),
        institutionalCode: uCode.trim() || undefined,
        email: uEmail.trim().toLowerCase(),
        role: uRole,
        specialty: uSpecialty.trim() || undefined,
        position: uPosition.trim() || undefined,
        avatar: uAvatar || editingUser.avatar,
        enrolledCourseIds: uRole === 'student' ? uCourseIds : editingUser.enrolledCourseIds,
      });

      if (!res.success) {
        setUserFormFeedback({ type: 'error', message: res.message || 'Error al actualizar.' });
        return;
      }
      showToast(`Usuario "${uName.trim()}" actualizado correctamente.`);
      setShowUserModal(false);
    } else {
      const res = createUser({
        name: uName,
        institutionalCode: uCode,
        email: uEmail,
        password: uPassword,
        role: uRole,
        specialty: uSpecialty,
        position: uPosition,
        avatar: uAvatar,
        courseIds: uCourseIds,
      });

      if (!res.success) {
        setUserFormFeedback({ type: 'error', message: res.message || 'Error al crear cuenta.' });
        return;
      }
      showToast(`Cuenta institucional creada para ${uName.trim()} (${uRole.toUpperCase()}).`);
      setShowUserModal(false);
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUser) return;
    setResetPwdError(null);
    const res = resetUserPassword(resetPwdUser.id, newPasswordInput);
    if (!res.success) {
      setResetPwdError(res.message || 'Error al restablecer contraseña.');
      return;
    }
    showToast(`Contraseña actualizada para ${resetPwdUser.name}.`);
    setResetPwdUser(null);
    setNewPasswordInput('');
  };

  // =========================================================
  // HANDLERS: COURSES, COVER IMAGE & CSV ENROLLMENT
  // =========================================================
  const handleCourseCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file, 720, 0.82);
      setCCoverImage(compressed);
    } catch {
      showToast('No se pudo procesar la imagen de portada.', 'error');
    }
    e.target.value = '';
  };

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim()) return;
    const created = createCourse({
      title: cTitle.trim(),
      subtitle: cSubtitle.trim() || `Programa Técnico · ${cCategory}`,
      category: cCategory.trim() || 'Formación Técnica',
      level: cLevel,
      status: cStatus,
      description:
        cDescription.trim() ||
        'Programa oficial del Centro de Formación Profesional ÁGAPE.',
      coverImage: cCoverImage,
      assignedTeacherIds: cTeacherIds,
    });
    showToast(`Curso "${created.title}" creado exitosamente.`);
    setShowCreateCourseModal(false);
    setCTitle('');
    setCSubtitle('');
    setCDescription('');
    setCTeacherIds([]);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleDownloadCsvTemplate = () => {
    const template =
      'Nombre Completo,Codigo/DUI,Correo Institucional,Contrasena\n' +
      'Ana Sofía Morales,05912834-2,ana.morales@campus.agape.edu.sv,AgapeEst2026!\n' +
      'Luis Enrique Torres,06123984-9,luis.torres@campus.agape.edu.sv,AgapeEst2026!\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_matricula_cfp_agape.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleRunCsvEnrollment = () => {
    if (!enrollmentCourse || !csvText.trim()) return;
    const parsedRows = parseStudentsCSV(csvText);
    if (parsedRows.length === 0) {
      setCsvResult({
        added: 0,
        enrolledExisting: 0,
        skipped: 0,
        errors: [
          'No se detectaron filas válidas. Formato esperado: Nombre Completo, Código/DUI, Correo@campus.agape.edu.sv',
        ],
      });
      return;
    }
    const result = bulkEnrollStudentsCSV(enrollmentCourse.id, parsedRows);
    setCsvResult(result);
    if (result.added > 0 || result.enrolledExisting > 0) {
      showToast(
        `Matrícula masiva procesada: ${result.added} nuevos y ${result.enrolledExisting} vinculados.`
      );
    }
  };

  // Current course enrollments helper
  const getCourseEnrolledStudents = (courseId: string) =>
    students.filter((s) => (s.enrolledCourseIds || []).includes(courseId));

  const getCourseAssignedTeachers = (course: Course) => {
    const ids = course.assignedTeacherIds || [];
    const matched = teachers.filter((t) => ids.includes(t.id));
    return matched;
  };

  return (
    <div className="space-y-6">
      {/* Global Toast */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-[#3B2C73] text-white border-[#6080B8]'
              : 'bg-rose-700 text-white border-rose-500'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#F2C94C] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={userAvatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUserAvatarChange}
      />
      <input
        ref={courseCoverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCourseCoverChange}
      />
      <input
        ref={csvFileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleCsvFileUpload}
      />

      {/* Technical Inspection Modal for Simulator (Admin) */}
      {inspectSimulatorLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="bg-gradient-to-r from-[#3B2C73] to-[#4B3B8B] p-4 text-white flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#F2C94C]" />
                <div>
                  <h3 className="text-sm font-bold">
                    Inspección Técnica de Simulador (Administración)
                  </h3>
                  <p className="text-[11px] text-slate-200">
                    Revisión funcional del laboratorio antes de autorizar su despliegue a estudiantes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectSimulatorLab(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <AgapeSimulatorPlayer simulator={inspectSimulatorLab} />
            </div>
          </div>
        </div>
      )}

      {/* Admin Top Master Header */}
      <div className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-amber-300 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>
                {isMasterAdminUser(currentAuthUser)
                  ? 'Cuenta Maestra Inamovible · Super Administrador'
                  : 'Panel Multi-Administrador · CFP ÁGAPE'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Administración Central CFP ÁGAPE
            </h1>
            <p className="text-xs md:text-sm text-slate-200 max-w-2xl leading-relaxed">
              Delegación de administradores, control de credenciales @campus.agape.edu.sv, gestión multicurso, matrículas CSV y aprobación de simuladores con IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => openCreateUserModal('admin')}
              className="px-3.5 py-2 bg-white text-[#4B3B8B] hover:bg-slate-50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario / Admin</span>
            </button>

            <button
              onClick={() => setShowCreateCourseModal(true)}
              className="px-3.5 py-2 bg-[#F2C94C] hover:bg-amber-300 text-[#3B2C73] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Crear Nuevo Curso</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-4 border-t border-white/20">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-slate-200 block font-medium">
              Administradores
            </span>
            <span className="text-xl font-extrabold font-mono text-white">{admins.length}</span>
            <span className="text-[10px] text-amber-300 block mt-0.5">
              1 Maestro + {Math.max(0, admins.length - 1)} Delegados
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-slate-200 block font-medium">Docentes</span>
            <span className="text-xl font-extrabold font-mono text-white">{teachers.length}</span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">
              {teachers.filter((t) => t.isActive !== false).length} activos
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-slate-200 block font-medium">
              Estudiantes Autorizados
            </span>
            <span className="text-xl font-extrabold font-mono text-white">{students.length}</span>
            <span className="text-[10px] text-slate-200 block mt-0.5">
              {courses.length} programas formativos
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-slate-200 block font-medium">
              Simuladores con IA
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold font-mono text-[#F2C94C]">
                {activeSimulatorsCount}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                / {totalSimulators} Habilitados
              </span>
            </div>
            <span className="text-[10px] text-slate-200 block mt-0.5">
              {totalSimulators - activeSimulatorsCount} ocultos por defecto
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#4B3B8B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios y Multi-Administradores</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
            {registeredUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-[#4B3B8B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Cursos, Docentes y Matrículas</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
            {courses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('simulators')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'simulators'
              ? 'bg-[#4B3B8B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Control de Simuladores IA</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#F2C94C] text-[#3B2C73] font-mono font-extrabold">
            {activeSimulatorsCount}/{totalSimulators}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GESTIÓN INTEGRAL DE USUARIOS Y MULTI-ADMINISTRADORES */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: `Todos (${registeredUsers.length})` },
                  { id: 'admin', label: `Administradores (${admins.length})` },
                  { id: 'instructor', label: `Docentes (${teachers.length})` },
                  { id: 'student', label: `Estudiantes (${students.length})` },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setRoleFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    roleFilter === pill.id
                      ? 'bg-[#4B3B8B] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nombre, código o correo..."
                  className="w-full sm:w-64 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                />
              </div>

              <button
                onClick={() => openCreateUserModal(roleFilter === 'all' ? 'instructor' : roleFilter)}
                className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Usuario</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Usuario / Foto de Perfil</th>
                    <th className="py-3 px-4">Código / DUI</th>
                    <th className="py-3 px-4">Correo Institucional</th>
                    <th className="py-3 px-4">Rol & Cargo</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isMaster = isMasterAdminUser(u);
                    const isSelf = currentAuthUser?.id === u.id;
                    const isActive = u.isActive !== false;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{u.name}</span>
                                {isMaster && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                    <BadgeCheck className="w-3 h-3 text-amber-600" />
                                    ADMIN MAESTRO INAMOVIBLE
                                  </span>
                                )}
                                {isSelf && !isMaster && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                                    Sesión actual
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {u.specialty || u.position || u.headline}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {u.institutionalCode || '—'}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                          {u.email}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                              u.role === 'admin'
                                ? 'bg-[#4B3B8B]/12 text-[#4B3B8B]'
                                : u.role === 'instructor'
                                ? 'bg-[#6080B8]/15 text-[#2F4E85]'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {u.role === 'admin' ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : u.role === 'instructor' ? (
                              <Briefcase className="w-3 h-3" />
                            ) : (
                              <GraduationCap className="w-3 h-3" />
                            )}
                            <span>
                              {u.role === 'admin'
                                ? 'Administrador'
                                : u.role === 'instructor'
                                ? 'Docente'
                                : 'Estudiante'}
                            </span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {isMaster ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Lock className="w-3 h-3" />
                              <span>Activo Permanente</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                const res = toggleUserStatus(u.id);
                                if (!res.success && res.message) showToast(res.message, 'error');
                              }}
                              disabled={isSelf}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                isSelf
                                  ? 'opacity-70 cursor-not-allowed bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isActive
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span>{isActive ? 'Activo' : 'Suspendido'}</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditUserModal(u)}
                              className="p-1.5 text-slate-500 hover:text-[#4B3B8B] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar perfil / foto / rol"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setResetPwdUser(u);
                                setNewPasswordInput('');
                                setResetPwdError(null);
                              }}
                              disabled={isMaster && !isMasterAdminUser(currentAuthUser)}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Restablecer contraseña"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {!isMaster && !isSelf && (
                              <>
                                <button
                                  onClick={() => {
                                    const res = toggleUserStatus(u.id);
                                    if (!res.success && res.message) {
                                      showToast(res.message, 'error');
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isActive
                                      ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={isActive ? 'Suspender acceso' : 'Reactivar acceso'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `¿Confirmas eliminar definitivamente la cuenta de ${u.name}?`
                                      )
                                    ) {
                                      const res = deleteUser(u.id);
                                      if (!res.success && res.message) {
                                        showToast(res.message, 'error');
                                      } else {
                                        showToast(`Cuenta de ${u.name} eliminada.`);
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar cuenta"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No se encontraron usuarios con los criterios aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GESTIÓN MULTICURSO, DOCENTES Y MATRÍCULAS POR CURSO */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Buscar curso por título, categoría o docente..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
              />
            </div>

            <button
              onClick={() => setShowCreateCourseModal(true)}
              className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Curso</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredCourses.map((course) => {
              const assignedTeachers = getCourseAssignedTeachers(course);
              const enrolledStudents = getCourseEnrolledStudents(course.id);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col lg:flex-row gap-5"
                >
                  {/* Cover Thumbnail */}
                  <div className="w-full lg:w-52 h-36 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative border border-slate-200">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                        course.status === 'Publicado'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-400 text-slate-900'
                      }`}
                    >
                      {course.status === 'Publicado' ? 'Activo (Público)' : course.status}
                    </span>
                  </div>

                  {/* Course Details & Assignments */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#4B3B8B]">
                          <span>{course.category}</span>
                          <span>·</span>
                          <span className="text-slate-500">{course.level}</span>
                          <span>·</span>
                          <span className="text-slate-500 font-mono">
                            {course.modules.length} módulos
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#3B2C73] mt-0.5">
                          {course.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={course.status}
                          onChange={(e) =>
                            updateCourseStatus(course.id, e.target.value as CourseStatus)
                          }
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
                        >
                          <option value="Publicado">Activo / Publicado</option>
                          <option value="Borrador">Borrador (Oculto)</option>
                        </select>

                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Deseas eliminar el curso "${course.title}"? Esta acción no se puede deshacer.`
                              )
                            ) {
                              deleteCourse(course.id);
                              showToast(`Curso "${course.title}" eliminado.`);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Eliminar curso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{course.description}</p>

                    {/* Assigned Teachers & Enrolled Students Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 bg-[#FAFBFD] border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#4B3B8B]" />
                        <span className="text-slate-600 font-semibold">Docentes:</span>
                        {assignedTeachers.length > 0 ? (
                          <span className="font-bold text-slate-900">
                            {assignedTeachers.map((t) => t.name).join(', ')}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold">
                            Sin docente asignado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#FAFBFD] border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-slate-900">
                          {enrolledStudents.length}
                        </span>
                        <span className="text-slate-600">estudiantes matriculados</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setAssignTeachersCourse(course);
                          setTempTeacherIds(course.assignedTeacherIds || []);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-[#4B3B8B] text-slate-700 hover:text-[#4B3B8B] text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Asignar Docentes</span>
                      </button>

                      <button
                        onClick={() => {
                          setEnrollmentCourse(course);
                          setCsvText('');
                          setCsvResult(null);
                          setSelectedExistingStudentId('');
                        }}
                        className="px-3 py-1.5 bg-[#FAF8FF] border border-[#4B3B8B]/30 hover:bg-[#F3EBFD] text-[#4B3B8B] text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Estudiantes Matriculados / CSV</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          if (onNavigateToCourseEdit) {
                            onNavigateToCourseEdit(course.id);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] text-white text-xs font-bold rounded-lg shadow-xs hover:opacity-95 flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Administrar Contenidos</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONTROL Y HABILITACIÓN DE SIMULADORES / PRUEBAS CON IA */}
      {/* ========================================================================= */}
      {activeTab === 'simulators' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <FlaskConical className="w-5 h-5 text-amber-600" />
              <span>Control Maestro de Laboratorios y Evaluaciones con Simulador IA</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Los simuladores creados por los docentes permanecen <strong>ocultos para los estudiantes por defecto</strong>. Solo cuando un Administrador activa el switch correspondiente, la prueba simulada se habilita en el aula virtual de los alumnos matriculados.
            </p>
          </div>

          {courses.map((course) => {
            const courseSims = course.modules.flatMap((m) =>
              m.lessons
                .filter((l) => l.simulatorLab)
                .map((l) => ({ module: m, lesson: l }))
            );

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4"
              >
                <div className="bg-[#FAFBFD] p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4B3B8B] text-white">
                        {course.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {course.modules.length} Módulos
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold text-[#3B2C73]">{course.title}</h2>
                    <p className="text-xs text-slate-500">
                      Docente titular: <strong>{course.instructor.name}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">
                        Habilitar en todo el Curso:
                      </span>
                      <button
                        onClick={() => toggleCourseSimulator(course.id)}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          course.simulatorEnabledByAdmin ? 'bg-[#4B3B8B]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                            course.simulatorEnabledByAdmin ? 'translate-x-6.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  {courseSims.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No hay simuladores configurados aún en este curso.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {courseSims.map(({ module, lesson }) => {
                        const lab = lesson.simulatorLab!;
                        const isEnabled = lesson.simulatorEnabledByAdmin === true;

                        return (
                          <div
                            key={lesson.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isEnabled
                                ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                  {module.title}
                                </span>
                                <span className="text-[10px] font-bold text-[#4B3B8B]">
                                  {lesson.title}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    isEnabled
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {isEnabled
                                    ? '● Habilitado para Alumnos'
                                    : '○ Oculto por Defecto'}
                                </span>
                              </div>

                              <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                <FlaskConical className="w-4 h-4 text-[#4B3B8B]" />
                                <span>{lab.title}</span>
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-2">
                                {lab.scenarioDescription}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                              <button
                                onClick={() => setInspectSimulatorLab(lab)}
                                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-[#6080B8] text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <FlaskConical className="w-3.5 h-3.5 text-[#4B3B8B]" />
                                <span>Inspeccionar Laboratorio</span>
                              </button>

                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                <span
                                  className={`text-xs font-bold ${
                                    isEnabled ? 'text-emerald-700' : 'text-slate-500'
                                  }`}
                                >
                                  {isEnabled ? 'Habilitado' : 'Deshabilitado'}
                                </span>
                                <button
                                  onClick={() =>
                                    toggleLessonSimulator(course.id, module.id, lesson.id)
                                  }
                                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                    isEnabled ? 'bg-[#4B3B8B]' : 'bg-slate-300'
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                                      isEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR USUARIO (CON FOTO DE PERFIL Y DELEGACIÓN ADMIN) */}
      {/* ========================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-[#3B2C73] to-[#4B3B8B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#F2C94C]" />
                <h3 className="text-sm font-bold">
                  {editingUser
                    ? `Editar Cuenta: ${editingUser.name}`
                    : 'Registrar Cuenta Institucional CFP ÁGAPE'}
                </h3>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
              {userFormFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    userFormFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {userFormFeedback.message}
                </div>
              )}

              {/* Profile Photo Uploader */}
              <div className="flex items-center gap-4 p-3.5 bg-[#FAFBFD] border border-slate-200 rounded-xl">
                <div className="relative shrink-0">
                  <img
                    src={
                      uAvatar ||
                      (uRole === 'student'
                        ? '/assets/images/avatar_student_1793144128485.jpg'
                        : '/assets/images/avatar_instructor_1793144141202.jpg')
                    }
                    alt="Foto de perfil"
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#4B3B8B] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => userAvatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4B3B8B] text-white flex items-center justify-center shadow-md hover:bg-[#3B2C73] cursor-pointer"
                    title="Subir fotografía de perfil"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 flex-1">
                  <div className="font-bold text-slate-800">Fotografía de Perfil</div>
                  <p className="text-[11px] text-slate-500">
                    Sube una fotografía JPG/PNG desde tu equipo. Se guardará de forma persistente en la cuenta.
                  </p>
                  <button
                    type="button"
                    onClick={() => userAvatarInputRef.current?.click()}
                    className="px-3 py-1 bg-white border border-slate-300 hover:border-[#4B3B8B] text-slate-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Seleccionar Imagen</span>
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Rol Institucional en la Plataforma:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'admin', label: 'Administrador', icon: ShieldCheck },
                      { id: 'instructor', label: 'Docente', icon: Briefcase },
                      { id: 'student', label: 'Estudiante', icon: GraduationCap },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const disabled = editingUser ? isMasterAdminUser(editingUser) : false;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setURole(item.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          uRole === item.id
                            ? 'border-[#4B3B8B] bg-[#FAF8FF] text-[#4B3B8B] ring-1 ring-[#4B3B8B]'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        <span className="font-bold text-[11px] block">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre Completo: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uName}
                    onChange={(e) => setUName(e.target.value)}
                    placeholder="Ej. Ing. Roberto Solís"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código o DUI Institucional:
                  </label>
                  <input
                    type="text"
                    value={uCode}
                    onChange={(e) => setUCode(e.target.value)}
                    placeholder="Ej. 05482910-4 o CFP-ADM-002"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Correo (@campus.agape.edu.sv): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={editingUser ? isMasterAdminUser(editingUser) : false}
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                    placeholder="usuario@campus.agape.edu.sv"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B] disabled:opacity-60"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Contraseña Asignada: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={uPassword}
                      onChange={(e) => setUPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                    />
                  </div>
                )}

                {editingUser && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Cargo / Especialidad:
                    </label>
                    <input
                      type="text"
                      value={uSpecialty || uPosition}
                      onChange={(e) => {
                        setUSpecialty(e.target.value);
                        setUPosition(e.target.value);
                      }}
                      placeholder="Ej. Coordinación Técnica"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                    />
                  </div>
                )}
              </div>

              {!editingUser && (uRole === 'instructor' || uRole === 'admin') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {uRole === 'admin'
                      ? 'Cargo Administrativo:'
                      : 'Especialidad Técnica / Cátedra:'}
                  </label>
                  <input
                    type="text"
                    value={uRole === 'admin' ? uPosition : uSpecialty}
                    onChange={(e) =>
                      uRole === 'admin'
                        ? setUPosition(e.target.value)
                        : setUSpecialty(e.target.value)
                    }
                    placeholder={
                      uRole === 'admin'
                        ? 'Ej. Subdirector Académico'
                        : 'Ej. Electrónica Industrial & Automatización'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                  />
                </div>
              )}

              {(uRole === 'student' || (!editingUser && uRole === 'instructor')) && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {uRole === 'student'
                      ? 'Cursos Matriculados:'
                      : 'Asignar a Cursos (Opcional):'}
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {courses.map((c) => {
                      const checked = uCourseIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUCourseIds((prev) => [...prev, c.id]);
                              } else {
                                setUCourseIds((prev) => prev.filter((id) => id !== c.id));
                              }
                            }}
                            className="rounded text-[#4B3B8B]"
                          />
                          <span className="font-medium text-slate-800 truncate">{c.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Cuenta Institucional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESTABLECER CONTRASEÑA */}
      {/* ========================================================================= */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="bg-[#3B2C73] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F2C94C]" />
                <h3 className="text-sm font-bold">Restablecer Contraseña</h3>
              </div>
              <button
                onClick={() => setResetPwdUser(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Asigna una nueva contraseña para <strong>{resetPwdUser.name}</strong> (
                <span className="font-mono">{resetPwdUser.email}</span>).
              </p>
              {resetPwdError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-semibold">
                  {resetPwdError}
                </div>
              )}
              <input
                type="password"
                required
                minLength={6}
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4B3B8B] text-white font-bold rounded-lg cursor-pointer"
                >
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR NUEVO CURSO */}
      {/* ========================================================================= */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-[#3B2C73] to-[#4B3B8B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#F2C94C]" />
                <h3 className="text-sm font-bold">Crear Nuevo Programa / Curso CFP ÁGAPE</h3>
              </div>
              <button
                onClick={() => setShowCreateCourseModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Título del Programa: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  placeholder="Ej. Técnico en Energías Renovables y Paneles Solares"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría:</label>
                  <input
                    type="text"
                    value={cCategory}
                    onChange={(e) => setCCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nivel:</label>
                  <select
                    value={cLevel}
                    onChange={(e) => setCLevel(e.target.value as CourseLevel)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado:</label>
                  <select
                    value={cStatus}
                    onChange={(e) => setCStatus(e.target.value as CourseStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Publicado">Activo (Publicado)</option>
                    <option value="Borrador">Borrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción:</label>
                <textarea
                  rows={3}
                  value={cDescription}
                  onChange={(e) => setCDescription(e.target.value)}
                  placeholder="Objetivos y competencias profesionales que desarrollará el estudiante..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Imagen de Portada:</label>
                <div className="flex items-center gap-3">
                  <img
                    src={cCoverImage}
                    alt="Portada"
                    className="w-24 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => courseCoverInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Imagen de Portada</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Asignar Docentes Responsables:
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {teachers.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={cTeacherIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCTeacherIds((prev) => [...prev, t.id]);
                          } else {
                            setCTeacherIds((prev) => prev.filter((id) => id !== t.id));
                          }
                        }}
                        className="rounded text-[#4B3B8B]"
                      />
                      <span className="font-semibold text-slate-800">{t.name}</span>
                      <span className="text-[10px] text-slate-500">({t.specialty})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B3B8B] text-white font-bold rounded-lg cursor-pointer"
                >
                  Crear Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASIGNAR DOCENTES A CURSO */}
      {/* ========================================================================= */}
      {assignTeachersCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#3B2C73] p-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Docentes Asignados · {assignTeachersCourse.title}
              </h3>
              <button
                onClick={() => setAssignTeachersCourse(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Selecciona uno o más docentes autorizados para impartir y editar este curso:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {teachers.map((t) => {
                  const checked = tempTeacherIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer ${
                        checked
                          ? 'border-[#4B3B8B] bg-[#FAF8FF]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempTeacherIds((prev) => [...prev, t.id]);
                          } else {
                            setTempTeacherIds((prev) => prev.filter((id) => id !== t.id));
                          }
                        }}
                        className="rounded text-[#4B3B8B]"
                      />
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{t.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {t.email}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setAssignTeachersCourse(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    assignTeachersToCourse(assignTeachersCourse.id, tempTeacherIds);
                    showToast('Docentes asignados al curso correctamente.');
                    setAssignTeachersCourse(null);
                  }}
                  className="px-4 py-2 bg-[#4B3B8B] text-white font-bold rounded-lg cursor-pointer"
                >
                  Guardar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ESTUDIANTES MATRICULADOS & CARGA MASIVA CSV */}
      {/* ========================================================================= */}
      {enrollmentCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-[#3B2C73] to-[#4B3B8B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#F2C94C]" />
                <div>
                  <h3 className="text-sm font-bold">
                    Estudiantes Matriculados · {enrollmentCourse.title}
                  </h3>
                  <p className="text-[11px] text-slate-200">
                    Matrícula individual o carga masiva mediante archivo CSV institucional.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnrollmentCourse(null)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto text-xs">
              {/* Individual Enrollment Bar */}
              <div className="p-4 bg-[#FAFBFD] border border-slate-200 rounded-xl space-y-2.5">
                <div className="font-bold text-slate-800">
                  Matricular Estudiante Registrado Individualmente:
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedExistingStudentId}
                    onChange={(e) => setSelectedExistingStudentId(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="">Selecciona un estudiante disponible...</option>
                    {students
                      .filter(
                        (s) => !(s.enrolledCourseIds || []).includes(enrollmentCourse.id)
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedExistingStudentId}
                    onClick={() => {
                      if (!selectedExistingStudentId) return;
                      assignStudentToCourse(selectedExistingStudentId, enrollmentCourse.id);
                      setSelectedExistingStudentId('');
                      showToast('Estudiante matriculado en el curso.');
                    }}
                    className="px-4 py-2 bg-[#4B3B8B] text-white font-bold rounded-lg disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    + Matricular
                  </button>
                </div>
              </div>

              {/* Bulk CSV Enrollment */}
              <div className="p-4 bg-[#FAF8FF] border border-[#4B3B8B]/20 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-[#3B2C73]">
                    <FileSpreadsheet className="w-4 h-4 text-[#4B3B8B]" />
                    <span>Carga Masiva de Estudiantes por CSV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#4B3B8B] text-slate-700 font-semibold rounded-lg text-[11px] cursor-pointer"
                    >
                      Descargar Plantilla CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => csvFileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#4B3B8B] text-white font-semibold rounded-lg text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Cargar Archivo .CSV</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600">
                  Formato por fila:{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border">
                    Nombre Completo, Código/DUI, correo@campus.agape.edu.sv, Contraseña(opcional)
                  </code>
                </p>

                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={
                    'Ana Sofía Morales, 05912834-2, ana.morales@campus.agape.edu.sv, AgapeEst2026!\nLuis Enrique Torres, 06123984-9, luis.torres@campus.agape.edu.sv'
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] text-slate-800"
                />

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">
                    Solo se aceptarán correos terminados en @campus.agape.edu.sv.
                  </span>
                  <button
                    type="button"
                    disabled={!csvText.trim()}
                    onClick={handleRunCsvEnrollment}
                    className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white font-bold rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    Procesar Matrícula CSV
                  </button>
                </div>

                {csvResult && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                    <div className="font-bold text-slate-800">
                      Resultado: {csvResult.added} nuevos creados ·{' '}
                      {csvResult.enrolledExisting} existentes matriculados ·{' '}
                      {csvResult.skipped} omitidos
                    </div>
                    {csvResult.errors.length > 0 && (
                      <ul className="list-disc pl-4 text-rose-700 space-y-0.5 max-h-24 overflow-y-auto">
                        {csvResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Currently Enrolled Students List */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Listado Actual en este Curso</span>
                  <span className="font-mono text-[#4B3B8B]">
                    {getCourseEnrolledStudents(enrollmentCourse.id).length} alumnos
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {getCourseEnrolledStudents(enrollmentCourse.id).length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No hay estudiantes matriculados en este curso todavía.
                    </div>
                  ) : (
                    getCourseEnrolledStudents(enrollmentCourse.id).map((st) => (
                      <div
                        key={st.id}
                        className="p-3 bg-white flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{st.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              {st.email}
                              {st.institutionalCode ? ` · ${st.institutionalCode}` : ''}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStudentFromCourse(st.id, enrollmentCourse.id)}
                          className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-semibold text-[11px] cursor-pointer shrink-0"
                        >
                          Desmatricular
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
