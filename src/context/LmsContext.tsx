import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Course,
  Module,
  Lesson,
  ResourceItem,
  Quiz,
  Assignment,
  StudentProgress,
  UserProfile,
  UserRole,
  Instructor,
  AuthUser,
  AIPracticeExercise,
  AIEvaluationResult,
  SimulatorLab,
  SimulatorLabType,
  SimulatorEvaluationResult,
  DocCategory,
  TutorLinkedDocument,
  CSVStudentRow,
  CSVEnrollmentResult,
  InstitutionalYouth,
  InstitutionalAttendanceSession,
  InstitutionalLogEntry,
} from '../types/lms';
import {
  MASTER_ADMIN_EMAIL,
  INITIAL_COURSES,
  INITIAL_ADMIN_PROFILE,
  INITIAL_INSTRUCTOR_PROFILE,
  INITIAL_STUDENT_PROFILE,
  INITIAL_INSTRUCTORS,
  INITIAL_AUTH_USERS,
} from '../data/initialData';

export const isMasterAdminUser = (user?: Pick<AuthUser, 'email' | 'isMasterAdmin'> | null): boolean => {
  if (!user) return false;
  return user.isMasterAdmin === true || user.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL;
};

interface LmsContextType {
  role: UserRole;
  currentUser: UserProfile;
  courses: Course[];
  selectedCourseId: string;
  selectedCourse: Course | undefined;
  setSelectedCourseId: (id: string) => void;
  selectedLessonId: string;
  selectedLesson: Lesson | undefined;
  setSelectedLessonId: (id: string) => void;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;

  // Authentication & Session (Production Gate)
  registeredUsers: AuthUser[];
  currentAuthUser: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

  // AI Assistant for Teachers & Students (Gemini API)
  generateLessonExplanationAI: (
    lessonTitle: string,
    moduleTitle: string,
    courseCategory: string,
    targetLevel?: string
  ) => Promise<string>;
  generatePracticeAI: (
    lessonTitle: string,
    moduleTitle: string,
    courseTitle: string
  ) => Promise<string>;
  generateStudentExerciseAI: (
    lessonTitle: string,
    explanationText: string
  ) => Promise<AIPracticeExercise>;
  evaluateStudentAnswerAI: (
    question: string,
    studentAnswer: string,
    correctAnswer: string,
    explanation: string
  ) => Promise<AIEvaluationResult>;
  generateSimulatorLabAI: (
    lessonTitle: string,
    moduleTitle: string,
    courseTitle: string,
    labType?: SimulatorLabType,
    category?: string,
    promptInstructions?: string
  ) => Promise<SimulatorLab>;
  evaluateSimulatorPracticeAI: (payload: {
    simulator: SimulatorLab;
    responses: Record<string, { selectedOption?: string; writtenResponse: string }>;
  }) => Promise<SimulatorEvaluationResult>;
  askTutorAI: (payload: {
    question: string;
    lessonTitle: string;
    courseTitle: string;
    explanationText?: string;
    linkedDoc?: TutorLinkedDocument;
    history?: { sender: 'student' | 'tutor'; text: string }[];
  }) => Promise<{ reply: string; source?: string }>;

  // Modals
  trailerCourse: Course | null;
  openTrailer: (course: Course) => void;
  closeTrailer: () => void;
  certificateCourse: Course | null;
  openCertificate: (course: Course) => void;
  closeCertificate: () => void;

  // Student Actions & Progress
  progress: Record<string, StudentProgress>;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  toggleLessonCompleted: (courseId: string, lessonId: string) => void;
  getCourseProgressPercent: (courseId: string, userId?: string) => number;
  getModuleProgress: (
    courseId: string,
    moduleId: string
  ) => { completed: number; total: number; percentage: number };
  submitQuizAttempt: (
    courseId: string,
    quizId: string,
    score: number,
    answers: Record<string, number>,
    passed: boolean
  ) => void;
  submitAssignmentWork: (
    courseId: string,
    assignmentId: string,
    fileName: string,
    notes: string,
    fileSize?: string,
    linkUrl?: string,
    docCategory?: DocCategory
  ) => void;
  saveLessonNote: (courseId: string, lessonId: string, note: string) => void;
  getLessonNote: (courseId: string, lessonId: string) => string;
  recordSimulatorScore: (
    courseId: string,
    simulatorId: string,
    title: string,
    score: number,
    passed: boolean
  ) => void;
  openCoursePlayer: (courseId: string, lessonId?: string) => void;

  // Instructor Management
  instructors: Instructor[];
  registerInstructor: (inst: Omit<Instructor, 'id'>) => Instructor;
  assignInstructorToCourse: (courseId: string, instructorId: string) => void;
  assignTeachersToCourse: (courseId: string, teacherIds: string[]) => void;

  // Course & Content Management
  createCourse: (data: Partial<Course>) => Course;
  duplicateCourse: (courseId: string) => Course;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  updateCourseStatus: (courseId: string, status: Course['status']) => void;
  deleteCourse: (courseId: string) => void;
  addModule: (courseId: string, title: string, description: string) => Module;
  updateModule: (courseId: string, moduleId: string, updates: Partial<Module>) => void;
  deleteModule: (courseId: string, moduleId: string) => void;
  addLesson: (courseId: string, moduleId: string, lesson: Omit<Lesson, 'id'>) => Lesson;
  updateLesson: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    updates: Partial<Lesson>
  ) => void;
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => void;
  addResource: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    res: Omit<ResourceItem, 'id'>
  ) => void;
  deleteResource: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    resourceId: string
  ) => void;
  saveQuiz: (courseId: string, moduleId: string, lessonId: string, quiz: Quiz) => void;
  saveAssignment: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    assignment: Assignment
  ) => void;
  saveSimulatorLab: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    simulatorLab: SimulatorLab
  ) => void;
  deleteSimulatorLab: (courseId: string, moduleId: string, lessonId: string) => void;

  // Multi-Administrator Platform Controls
  createUser: (data: {
    name: string;
    institutionalCode?: string;
    email: string;
    password: string;
    role: UserRole;
    specialty?: string;
    position?: string;
    avatar?: string;
    courseIds?: string[];
  }) => { success: boolean; message?: string; user?: AuthUser };
  updateUser: (
    userId: string,
    updates: Partial<AuthUser>
  ) => { success: boolean; message?: string };
  resetUserPassword: (
    userId: string,
    newPassword: string
  ) => { success: boolean; message?: string };
  addTeacher: (data: {
    name: string;
    email: string;
    specialty: string;
    password?: string;
    institutionalCode?: string;
    avatar?: string;
  }) => { success: boolean; message?: string };
  toggleUserStatus: (userId: string) => { success: boolean; message?: string };
  deleteUser: (userId: string) => { success: boolean; message?: string };
  enrollStudent: (data: {
    name: string;
    email: string;
    password?: string;
    institutionalCode?: string;
    avatar?: string;
    courseIds: string[];
  }) => { success: boolean; message?: string };
  assignStudentToCourse: (userId: string, courseId: string) => void;
  removeStudentFromCourse: (userId: string, courseId: string) => void;
  bulkEnrollStudentsCSV: (courseId: string, rows: CSVStudentRow[]) => CSVEnrollmentResult;
  toggleCourseSimulator: (courseId: string) => void;
  toggleLessonSimulator: (courseId: string, moduleId: string, lessonId: string) => void;
  setLessonSimulatorEnabled: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    enabled: boolean
  ) => void;

  // Institutional Management / Coordinators (Presencial, Talleres, Asistencia y Bitácora)
  institutionalYouths: InstitutionalYouth[];
  institutionalAttendance: InstitutionalAttendanceSession[];
  institutionalLogs: InstitutionalLogEntry[];
  upsertInstitutionalYouth: (youth: InstitutionalYouth) => void;
  deleteInstitutionalYouth: (youthId: string) => void;
  saveInstitutionalAttendance: (session: InstitutionalAttendanceSession) => void;
  addInstitutionalLog: (entry: InstitutionalLogEntry) => void;
  deleteInstitutionalLog: (logId: string) => void;
}

const LmsContext = createContext<LmsContextType | undefined>(undefined);

const STORAGE_KEY_COURSES = 'cfp_agape_courses_prod_v2';
const STORAGE_KEY_PROGRESS = 'cfp_agape_progress_prod_v2';
const STORAGE_KEY_INSTRUCTORS = 'cfp_agape_instructors_prod_v2';
const STORAGE_KEY_USERS = 'cfp_agape_users_prod_v2';
const STORAGE_KEY_CURRENT_USER = 'cfp_agape_current_user_prod_v2';
const STORAGE_KEY_INST_YOUTHS = 'cfp_agape_inst_youths_prod_v1';
const STORAGE_KEY_INST_ATTENDANCE = 'cfp_agape_inst_attendance_prod_v1';
const STORAGE_KEY_INST_LOGS = 'cfp_agape_inst_logs_prod_v1';
const STORAGE_KEY_LOCAL_AUTH = 'cfp_agape_local_auth_v1';

const INSTITUTIONAL_DOMAIN = '@campus.agape.edu.sv';

const sanitizeUsersForCache = (list: AuthUser[]): AuthUser[] =>
  list.map(({ password: _pwd, ...rest }) => rest);

async function computeCredentialHash(email: string, password: string): Promise<string> {
  const input = `agape-lms-v1:${email.trim().toLowerCase()}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}

function readLocalAuthHashes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore storage read error
  }
  return {};
}

async function saveLocalAuthHash(email: string, password: string): Promise<void> {
  if (!email || !password) return;
  try {
    const clean = email.trim().toLowerCase();
    const hash = await computeCredentialHash(clean, password);
    const current = readLocalAuthHashes();
    current[clean] = hash;
    localStorage.setItem(STORAGE_KEY_LOCAL_AUTH, JSON.stringify(current));
  } catch {
    // ignore storage write error
  }
}

function removeLocalAuthHash(email: string): void {
  if (!email) return;
  try {
    const clean = email.trim().toLowerCase();
    const current = readLocalAuthHashes();
    if (clean in current) {
      delete current[clean];
      localStorage.setItem(STORAGE_KEY_LOCAL_AUTH, JSON.stringify(current));
    }
  } catch {
    // ignore storage write error
  }
}

export const LmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 0. Users Roster (guarantees Master Admin exists & remains immutable)
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed: AuthUser[] = JSON.parse(saved);
        const hasMaster = parsed.some(
          (u) => u.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL
        );
        if (!hasMaster) {
          return sanitizeUsersForCache([INITIAL_AUTH_USERS[0], ...parsed]);
        }
        return sanitizeUsersForCache(
          parsed.map((u) =>
            u.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL
              ? { ...u, role: 'admin', isActive: true, isMasterAdmin: true }
              : u
          )
        );
      }
    } catch (e) {
      console.warn('Error reading users from storage:', e);
    }
    return sanitizeUsersForCache(INITIAL_AUTH_USERS);
  });

  const legacyLocalUsersRef = useRef<AuthUser[] | null>(null);
  if (legacyLocalUsersRef.current === null) {
    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY_USERS);
      legacyLocalUsersRef.current = rawLocal ? JSON.parse(rawLocal) : [];
    } catch {
      legacyLocalUsersRef.current = [];
    }
  }

  const registeredUsersRef = useRef<AuthUser[]>(registeredUsers);
  useEffect(() => {
    registeredUsersRef.current = registeredUsers;
    try {
      localStorage.setItem(
        STORAGE_KEY_USERS,
        JSON.stringify(sanitizeUsersForCache(registeredUsers))
      );
    } catch (e) {
      console.warn('Error persisting users cache:', e);
    }
  }, [registeredUsers]);

  // Mandatory Login Gate: null unless an authenticated session is already saved
  const [currentAuthUser, setCurrentAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) {
        const parsed: AuthUser = JSON.parse(saved);
        if (parsed && parsed.email) {
          const { password: _pwd, ...clean } = parsed;
          return clean;
        }
      }
    } catch (e) {
      console.warn('Error reading current user:', e);
    }
    return null;
  });

  // Sync currentAuthUser with latest registeredUsers entry (avatar, enrolled courses, active status)
  useEffect(() => {
    if (!currentAuthUser) return;
    const currentEmail = currentAuthUser.email.trim().toLowerCase();
    const latest = registeredUsers.find(
      (u) => u.id === currentAuthUser.id || u.email.trim().toLowerCase() === currentEmail
    );
    if (!latest) {
      if (currentEmail === MASTER_ADMIN_EMAIL) return;
      setCurrentAuthUser(null);
      return;
    }
    if (latest.isActive === false) {
      setCurrentAuthUser(null);
      return;
    }
    const { password: _pwd, ...cleanLatest } = latest;
    if (JSON.stringify(cleanLatest) !== JSON.stringify(currentAuthUser)) {
      setCurrentAuthUser(cleanLatest);
    }
  }, [registeredUsers, currentAuthUser]);

  useEffect(() => {
    try {
      if (currentAuthUser) {
        const { password: _pwd, ...clean } = currentAuthUser;
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(clean));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.warn('Error persisting current user:', e);
    }
  }, [currentAuthUser]);

  const role: UserRole = currentAuthUser?.role || 'student';

  const currentUser: UserProfile =
    currentAuthUser ||
    (role === 'admin'
      ? INITIAL_ADMIN_PROFILE
      : role === 'instructor'
      ? INITIAL_INSTRUCTOR_PROFILE
      : INITIAL_STUDENT_PROFILE);

  // 2. Courses State
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading courses from storage:', e);
    }
    return INITIAL_COURSES;
  });

  const coursesRef = useRef<Course[]>(courses);
  useEffect(() => {
    coursesRef.current = courses;
    try {
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
    } catch (e) {
      console.warn('Error persisting courses cache:', e);
    }
  }, [courses]);

  // 2.1 Instructors State (synced with active instructor accounts)
  const [instructors, setInstructors] = useState<Instructor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INSTRUCTORS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading instructors from storage:', e);
    }
    return INITIAL_INSTRUCTORS;
  });

  const instructorsRef = useRef<Instructor[]>(instructors);
  useEffect(() => {
    instructorsRef.current = instructors;
    try {
      localStorage.setItem(STORAGE_KEY_INSTRUCTORS, JSON.stringify(instructors));
    } catch (e) {
      console.warn('Error persisting instructors cache:', e);
    }
  }, [instructors]);

  // 3. Selection State
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return courses[0]?.id || 'course-elec-101';
  });

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const [selectedLessonId, setSelectedLessonId] = useState<string>(() => {
    return selectedCourse?.modules[0]?.lessons[0]?.id || 'les-1-1';
  });

  useEffect(() => {
    if (selectedCourse) {
      const allLessons = selectedCourse.modules.flatMap((m) => m.lessons);
      const exists = allLessons.some((l) => l.id === selectedLessonId);
      if (!exists && allLessons.length > 0) {
        setSelectedLessonId(allLessons[0].id);
      }
    }
  }, [selectedCourse, selectedLessonId]);

  const selectedLesson = selectedCourse?.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === selectedLessonId);

  const [activeNavTab, setActiveNavTab] = useState<string>('catalog');

  // Modals state
  const [trailerCourse, setTrailerCourse] = useState<Course | null>(null);
  const openTrailer = (course: Course) => setTrailerCourse(course);
  const closeTrailer = () => setTrailerCourse(null);

  const [certificateCourse, setCertificateCourse] = useState<Course | null>(null);
  const openCertificate = (course: Course) => setCertificateCourse(course);
  const closeCertificate = () => setCertificateCourse(null);

  // 4. Student Progress State (keyed by `${userId}::${courseId}`)
  const [progress, setProgress] = useState<Record<string, StudentProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading progress:', e);
    }
    return {};
  });

  const progressRef = useRef<Record<string, StudentProgress>>(progress);
  useEffect(() => {
    progressRef.current = progress;
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.warn('Error persisting progress cache:', e);
    }
  }, [progress]);

  // 4.1 Institutional Coordination State (Youths, Attendance & Logs)
  const [institutionalYouths, setInstitutionalYouths] = useState<InstitutionalYouth[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INST_YOUTHS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading institutional youths:', e);
    }
    return [];
  });
  const institutionalYouthsRef = useRef<InstitutionalYouth[]>(institutionalYouths);
  useEffect(() => {
    institutionalYouthsRef.current = institutionalYouths;
    try {
      localStorage.setItem(STORAGE_KEY_INST_YOUTHS, JSON.stringify(institutionalYouths));
    } catch (e) {
      console.warn('Error persisting institutional youths cache:', e);
    }
  }, [institutionalYouths]);

  const [institutionalAttendance, setInstitutionalAttendance] = useState<
    InstitutionalAttendanceSession[]
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INST_ATTENDANCE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading institutional attendance:', e);
    }
    return [];
  });
  const institutionalAttendanceRef = useRef<InstitutionalAttendanceSession[]>(
    institutionalAttendance
  );
  useEffect(() => {
    institutionalAttendanceRef.current = institutionalAttendance;
    try {
      localStorage.setItem(
        STORAGE_KEY_INST_ATTENDANCE,
        JSON.stringify(institutionalAttendance)
      );
    } catch (e) {
      console.warn('Error persisting institutional attendance cache:', e);
    }
  }, [institutionalAttendance]);

  const [institutionalLogs, setInstitutionalLogs] = useState<InstitutionalLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INST_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading institutional logs:', e);
    }
    return [];
  });
  const institutionalLogsRef = useRef<InstitutionalLogEntry[]>(institutionalLogs);
  useEffect(() => {
    institutionalLogsRef.current = institutionalLogs;
    try {
      localStorage.setItem(STORAGE_KEY_INST_LOGS, JSON.stringify(institutionalLogs));
    } catch (e) {
      console.warn('Error persisting institutional logs cache:', e);
    }
  }, [institutionalLogs]);

  // -------------------------------------------------------------
  // Centralized Server Hydration & Persistence Helpers
  // -------------------------------------------------------------
  const applyServerSnapshot = useCallback(
    (snapshot: {
      users?: AuthUser[];
      courses?: Course[];
      instructors?: Instructor[];
      progress?: Record<string, StudentProgress>;
      institutionalYouths?: InstitutionalYouth[];
      institutionalAttendance?: InstitutionalAttendanceSession[];
      institutionalLogs?: InstitutionalLogEntry[];
    }) => {
      if (Array.isArray(snapshot.users)) {
        const sanitized = sanitizeUsersForCache(snapshot.users);
        registeredUsersRef.current = sanitized;
        setRegisteredUsers(sanitized);
      }
      if (Array.isArray(snapshot.courses)) {
        coursesRef.current = snapshot.courses;
        setCourses(snapshot.courses);
      }
      if (Array.isArray(snapshot.instructors)) {
        instructorsRef.current = snapshot.instructors;
        setInstructors(snapshot.instructors);
      }
      if (snapshot.progress && typeof snapshot.progress === 'object') {
        progressRef.current = snapshot.progress;
        setProgress(snapshot.progress);
      }
      if (Array.isArray(snapshot.institutionalYouths)) {
        institutionalYouthsRef.current = snapshot.institutionalYouths;
        setInstitutionalYouths(snapshot.institutionalYouths);
      }
      if (Array.isArray(snapshot.institutionalAttendance)) {
        institutionalAttendanceRef.current = snapshot.institutionalAttendance;
        setInstitutionalAttendance(snapshot.institutionalAttendance);
      }
      if (Array.isArray(snapshot.institutionalLogs)) {
        institutionalLogsRef.current = snapshot.institutionalLogs;
        setInstitutionalLogs(snapshot.institutionalLogs);
      }
    },
    []
  );

  const pushCoursesAndInstructorsToServer = useCallback(
    (nextCourses: Course[], nextInstructors?: Instructor[]) => {
      fetch('/api/lms/courses-state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses: nextCourses,
          instructors: nextInstructors,
        }),
      }).catch((err) => console.warn('Error syncing courses to server:', err));
    },
    []
  );

  const updateCoursesState = useCallback(
    (updater: (prev: Course[]) => Course[]) => {
      const next = updater(coursesRef.current);
      coursesRef.current = next;
      setCourses(next);
      pushCoursesAndInstructorsToServer(next);
      return next;
    },
    [pushCoursesAndInstructorsToServer]
  );

  const pushProgressEntryToServer = useCallback((key: string, entry: StudentProgress) => {
    fetch('/api/lms/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, entry }),
    }).catch((err) => console.warn('Error syncing progress to server:', err));
  }, []);

  const serverStorageModeRef = useRef<'kv' | 'vercel-ephemeral' | 'local-file' | null>(null);

  const hydrateFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/lms/state', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.storageMode) {
        serverStorageModeRef.current = data.storageMode;
      }

      // One-time safe migration: if server still only has Master Admin, check captured legacy localStorage accounts with passwords
      const serverUsers: AuthUser[] = Array.isArray(data.users) ? data.users : [];
      if (serverUsers.length <= 1) {
        try {
          const parsedLocalUsers = legacyLocalUsersRef.current || [];
          const hasExtraWithPasswords = parsedLocalUsers.some(
            (u) =>
              u.email?.trim().toLowerCase() !== MASTER_ADMIN_EMAIL &&
              Boolean(u.password)
          );
          if (hasExtraWithPasswords) {
            const rawLocalCourses = localStorage.getItem(STORAGE_KEY_COURSES);
            const rawLocalInstructors = localStorage.getItem(STORAGE_KEY_INSTRUCTORS);
            const rawLocalProgress = localStorage.getItem(STORAGE_KEY_PROGRESS);
            const migrateRes = await fetch('/api/lms/migrate-local', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                users: parsedLocalUsers,
                courses: rawLocalCourses ? JSON.parse(rawLocalCourses) : [],
                instructors: rawLocalInstructors ? JSON.parse(rawLocalInstructors) : [],
                progress: rawLocalProgress ? JSON.parse(rawLocalProgress) : {},
              }),
            });
            if (migrateRes.ok) {
              const migratedData = await migrateRes.json();
              legacyLocalUsersRef.current = [];
              applyServerSnapshot(migratedData);
              return;
            }
          }
        } catch (migErr) {
          console.warn('Local migration skipped:', migErr);
        }

        // In ephemeral serverless mode (no KV), avoid wiping locally created users/courses when a fresh container cold-starts
        if (
          data.storageMode === 'vercel-ephemeral' &&
          registeredUsersRef.current.length > 1
        ) {
          pushCoursesAndInstructorsToServer(coursesRef.current, instructorsRef.current);
          return;
        }
      }

      applyServerSnapshot(data);
    } catch (err) {
      console.warn('Unable to hydrate LMS state from server:', err);
    }
  }, [applyServerSnapshot, pushCoursesAndInstructorsToServer]);

  useEffect(() => {
    hydrateFromServer();
    const handleFocus = () => {
      hydrateFromServer();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [hydrateFromServer]);

  const getProgressKey = (courseId: string, userId?: string): string => {
    const uid = userId || currentAuthUser?.id || 'guest';
    return `${uid}::${courseId}`;
  };

  const isLessonCompleted = (courseId: string, lessonId: string): boolean => {
    const key = getProgressKey(courseId);
    const courseProg = progress[key] || progress[courseId];
    return !!courseProg?.completedLessonIds.includes(lessonId);
  };

  const toggleLessonCompleted = (courseId: string, lessonId: string) => {
    const key = getProgressKey(courseId);
    const prev = progressRef.current;
    const currentCourseProg = prev[key] || {
      courseId,
      completedLessonIds: [],
      quizAttempts: {},
      assignmentSubmissions: {},
      notesByLesson: {},
    };

    const isCompleted = currentCourseProg.completedLessonIds.includes(lessonId);
    const newCompleted = isCompleted
      ? currentCourseProg.completedLessonIds.filter((id) => id !== lessonId)
      : [...currentCourseProg.completedLessonIds, lessonId];

    const updatedEntry: StudentProgress = {
      ...currentCourseProg,
      completedLessonIds: newCompleted,
    };

    const nextProgress = { ...prev, [key]: updatedEntry };
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    pushProgressEntryToServer(key, updatedEntry);
  };

  const getCourseProgressPercent = (courseId: string, userId?: string): number => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return 0;
    const allLessons = course.modules.flatMap((m) => m.lessons);
    if (allLessons.length === 0) return 0;
    const key = getProgressKey(courseId, userId);
    const completed = progress[key]?.completedLessonIds || [];
    const validCompleted = completed.filter((id) => allLessons.some((l) => l.id === id));
    return Math.round((validCompleted.length / allLessons.length) * 100);
  };

  const getModuleProgress = (courseId: string, moduleId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return { completed: 0, total: 0, percentage: 0 };
    const mod = course.modules.find((m) => m.id === moduleId);
    if (!mod || mod.lessons.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const key = getProgressKey(courseId);
    const completed = progress[key]?.completedLessonIds || [];
    const completedCount = mod.lessons.filter((l) => completed.includes(l.id)).length;
    const percentage = Math.round((completedCount / mod.lessons.length) * 100);
    return { completed: completedCount, total: mod.lessons.length, percentage };
  };

  const submitQuizAttempt = (
    courseId: string,
    quizId: string,
    score: number,
    answers: Record<string, number>,
    passed: boolean
  ) => {
    const key = getProgressKey(courseId);
    const prev = progressRef.current;
    const currentCourseProg = prev[key] || {
      courseId,
      completedLessonIds: [],
      quizAttempts: {},
      assignmentSubmissions: {},
      notesByLesson: {},
    };

    const currentLesson = coursesRef.current
      .find((c) => c.id === courseId)
      ?.modules.flatMap((m) => m.lessons)
      .find((l) => l.quiz?.id === quizId);

    const completedIds = new Set(currentCourseProg.completedLessonIds);
    if (passed && currentLesson) {
      completedIds.add(currentLesson.id);
    }

    const updatedEntry: StudentProgress = {
      ...currentCourseProg,
      completedLessonIds: Array.from(completedIds),
      quizAttempts: {
        ...currentCourseProg.quizAttempts,
        [quizId]: {
          quizId,
          score,
          totalQuestions: Object.keys(answers).length,
          answers,
          passed,
          completedAt: new Date().toISOString(),
        },
      },
    };

    const nextProgress = { ...prev, [key]: updatedEntry };
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    pushProgressEntryToServer(key, updatedEntry);
  };

  const submitAssignmentWork = (
    courseId: string,
    assignmentId: string,
    fileName: string,
    notes: string,
    fileSize: string = '1.8 MB',
    linkUrl?: string,
    docCategory?: DocCategory
  ) => {
    const key = getProgressKey(courseId);
    const prev = progressRef.current;
    const currentCourseProg = prev[key] || {
      courseId,
      completedLessonIds: [],
      quizAttempts: {},
      assignmentSubmissions: {},
      notesByLesson: {},
    };

    const currentLesson = coursesRef.current
      .find((c) => c.id === courseId)
      ?.modules.flatMap((m) => m.lessons)
      .find((l) => l.assignment?.id === assignmentId);

    const completedIds = new Set(currentCourseProg.completedLessonIds);
    if (currentLesson) {
      completedIds.add(currentLesson.id);
    }

    const updatedEntry: StudentProgress = {
      ...currentCourseProg,
      completedLessonIds: Array.from(completedIds),
      assignmentSubmissions: {
        ...currentCourseProg.assignmentSubmissions,
        [assignmentId]: {
          id: 'sub-' + Date.now(),
          assignmentId,
          studentName: currentUser.name,
          submittedAt: new Date().toISOString(),
          fileName,
          fileSize,
          notes,
          linkUrl,
          docCategory,
          status: 'submitted',
        },
      },
    };

    const nextProgress = { ...prev, [key]: updatedEntry };
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    pushProgressEntryToServer(key, updatedEntry);
  };

  const saveLessonNote = (courseId: string, lessonId: string, note: string) => {
    const key = getProgressKey(courseId);
    const prev = progressRef.current;
    const currentCourseProg = prev[key] || {
      courseId,
      completedLessonIds: [],
      quizAttempts: {},
      assignmentSubmissions: {},
      notesByLesson: {},
    };

    const updatedEntry: StudentProgress = {
      ...currentCourseProg,
      notesByLesson: {
        ...currentCourseProg.notesByLesson,
        [lessonId]: note,
      },
    };

    const nextProgress = { ...prev, [key]: updatedEntry };
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    pushProgressEntryToServer(key, updatedEntry);
  };

  const getLessonNote = (courseId: string, lessonId: string): string => {
    const key = getProgressKey(courseId);
    return progress[key]?.notesByLesson?.[lessonId] || '';
  };

  const recordSimulatorScore = (
    courseId: string,
    simulatorId: string,
    title: string,
    score: number,
    passed: boolean
  ) => {
    const key = getProgressKey(courseId);
    const prev = progressRef.current;
    const currentCourseProg = prev[key] || {
      courseId,
      completedLessonIds: [],
      quizAttempts: {},
      assignmentSubmissions: {},
      notesByLesson: {},
      simulatorScores: {},
    };

    const updatedEntry: StudentProgress = {
      ...currentCourseProg,
      simulatorScores: {
        ...(currentCourseProg.simulatorScores || {}),
        [simulatorId]: {
          simulatorId,
          title,
          score,
          passed,
          completedAt: new Date().toISOString(),
        },
      },
    };

    const nextProgress = { ...prev, [key]: updatedEntry };
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    pushProgressEntryToServer(key, updatedEntry);
  };

  const openCoursePlayer = (courseId: string, lessonId?: string) => {
    setSelectedCourseId(courseId);
    const targetCourse = courses.find((c) => c.id === courseId);
    if (lessonId) {
      setSelectedLessonId(lessonId);
    } else if (
      targetCourse &&
      targetCourse.modules.length > 0 &&
      targetCourse.modules[0].lessons.length > 0
    ) {
      setSelectedLessonId(targetCourse.modules[0].lessons[0].id);
    }
    setActiveNavTab('player');
  };

  // -------------------------------------------------------------
  // Strict Production Authentication & Session Management
  // -------------------------------------------------------------
  const attemptLocalEmergencyLogin = useCallback(
    async (
      cleanEmail: string,
      password: string
    ): Promise<{ success: boolean; message?: string } | null> => {
      // 1. Check seeded / legacy plaintext candidates first
      const candidates: AuthUser[] = [
        ...(legacyLocalUsersRef.current || []),
        ...INITIAL_AUTH_USERS,
      ];
      const matched = candidates.find(
        (u) => u.email?.trim().toLowerCase() === cleanEmail && Boolean(u.password)
      );
      if (matched) {
        if (matched.isActive === false) {
          return {
            success: false,
            message:
              'Tu cuenta se encuentra suspendida. Comunícate con Coordinación Académica del CFP ÁGAPE.',
          };
        }
        const storedPwd = String(matched.password || '');
        const pwdValid =
          storedPwd === password ||
          (storedPwd === storedPwd.trim() && storedPwd === password.trim());
        if (!pwdValid) {
          return {
            success: false,
            message: 'Contraseña incorrecta. Verifica tus credenciales e intenta nuevamente.',
          };
        }
        const { password: _pwd, ...cleanUser } = matched;
        const existingIndex = registeredUsersRef.current.findIndex(
          (u) => u.email.trim().toLowerCase() === cleanEmail
        );
        if (existingIndex === -1) {
          const nextUsers = [cleanUser, ...registeredUsersRef.current];
          registeredUsersRef.current = nextUsers;
          setRegisteredUsers(nextUsers);
        }
        setCurrentAuthUser(cleanUser);
        return { success: true };
      }

      // 2. Check locally cached registeredUsers against SHA-256 credential verifier
      const localUser = registeredUsersRef.current.find(
        (u) => u.email?.trim().toLowerCase() === cleanEmail
      );
      if (!localUser) return null;

      const hashes = readLocalAuthHashes();
      const storedHash = hashes[cleanEmail];
      if (!storedHash) return null;

      const candidateHashExact = await computeCredentialHash(cleanEmail, password);
      const candidateHashTrimmed = await computeCredentialHash(cleanEmail, password.trim());
      if (storedHash !== candidateHashExact && storedHash !== candidateHashTrimmed) {
        return {
          success: false,
          message: 'Contraseña incorrecta. Verifica tus credenciales e intenta nuevamente.',
        };
      }

      if (localUser.isActive === false) {
        return {
          success: false,
          message:
            'Tu cuenta se encuentra suspendida. Comunícate con Coordinación Académica del CFP ÁGAPE.',
        };
      }

      const { password: _pwd, ...cleanUser } = localUser;
      setCurrentAuthUser(cleanUser);

      // Re-sync user to warm ephemeral container in background
      fetch('/api/lms/users/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: { ...cleanUser, password },
          isCreate: true,
        }),
      }).catch(() => undefined);

      return { success: true };
    },
    []
  );

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith(INSTITUTIONAL_DOMAIN)) {
      return {
        success: false,
        message:
          'Acceso Denegado: Solo se permite el ingreso con cuentas institucionales @campus.agape.edu.sv.',
      };
    }

    if (!password || !password.trim()) {
      return {
        success: false,
        message: 'Debes ingresar tu contraseña institucional asignada.',
      };
    }

    try {
      const res = await fetch('/api/lms/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const rawText = await res.text();
      let data: {
        success?: boolean;
        storageMode?: 'kv' | 'vercel-ephemeral' | 'local-file';
        message?: string;
        user?: AuthUser;
        state?: {
          users?: AuthUser[];
          courses?: Course[];
          instructors?: Instructor[];
          progress?: Record<string, StudentProgress>;
          institutionalYouths?: InstitutionalYouth[];
          institutionalAttendance?: InstitutionalAttendanceSession[];
          institutionalLogs?: InstitutionalLogEntry[];
        };
      } | null = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (data?.storageMode) {
        serverStorageModeRef.current = data.storageMode;
      }

      if (res.ok && data?.success && data?.user) {
        void saveLocalAuthHash(cleanEmail, password);
        if (data.state) {
          const isEphemeralColdReset =
            data.storageMode === 'vercel-ephemeral' &&
            Array.isArray(data.state.users) &&
            data.state.users.length <= 1 &&
            registeredUsersRef.current.length > 1;
          if (!isEphemeralColdReset) {
            applyServerSnapshot(data.state);
          }
        }
        setCurrentAuthUser(data.user);
        return { success: true };
      }

      // If Vercel ephemeral container cold-started and returned 404, try local browser-verified fallback first
      if (res.status === 404 && data?.storageMode === 'vercel-ephemeral') {
        const ephemeralFallback = await attemptLocalEmergencyLogin(cleanEmail, password);
        if (ephemeralFallback) return ephemeralFallback;
      }

      const isExplicitAuthRejection = Boolean(
        data &&
          data.success === false &&
          typeof data.message === 'string' &&
          [400, 401, 403, 404].includes(res.status)
      );

      if (isExplicitAuthRejection && data) {
        return {
          success: false,
          message:
            data.message ||
            'Cuenta no registrada en el sistema. Solicita tu alta a la Administración del CFP ÁGAPE.',
        };
      }

      const fallbackResult = await attemptLocalEmergencyLogin(cleanEmail, password);
      if (fallbackResult) return fallbackResult;

      return {
        success: false,
        message:
          data?.message ||
          'No se pudo validar tu cuenta con el servidor del Campus Virtual. Intenta nuevamente.',
      };
    } catch (err) {
      console.error('Network error during login:', err);
      const fallbackResult = await attemptLocalEmergencyLogin(cleanEmail, password);
      if (fallbackResult) return fallbackResult;

      return {
        success: false,
        message:
          'No se pudo validar tu cuenta con el servidor del Campus Virtual. Intenta nuevamente.',
      };
    }
  };

  const logout = () => {
    setCurrentAuthUser(null);
  };

  // -------------------------------------------------------------
  // Multi-Administrator Platform Management Controls
  // -------------------------------------------------------------
  const createUser: LmsContextType['createUser'] = (data) => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!data.name.trim()) {
      return { success: false, message: 'El nombre completo es obligatorio.' };
    }
    if (!cleanEmail.endsWith(INSTITUTIONAL_DOMAIN)) {
      return {
        success: false,
        message: 'El correo institucional debe pertenecer al dominio @campus.agape.edu.sv.',
      };
    }
    if (!data.password || data.password.trim().length < 6) {
      return {
        success: false,
        message: 'La contraseña asignada debe tener al menos 6 caracteres.',
      };
    }
    if (registeredUsersRef.current.some((u) => u.email.trim().toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'Ya existe una cuenta registrada con ese correo institucional.',
      };
    }

    const defaultAvatar =
      data.role === 'student'
        ? '/assets/images/avatar_student_1793144128485.jpg'
        : '/assets/images/avatar_instructor_1793144141202.jpg';

    const newUserId = `user-${data.role}-${Date.now()}`;
    const newUserWithPwd: AuthUser = {
      id: newUserId,
      name: data.name.trim(),
      institutionalCode: data.institutionalCode?.trim() || undefined,
      email: cleanEmail,
      role: data.role,
      isMasterAdmin: false,
      avatar: data.avatar || defaultAvatar,
      position:
        data.position?.trim() ||
        (data.role === 'admin'
          ? 'Administrador Delegado CFP ÁGAPE'
          : data.role === 'coordinator'
          ? 'Coordinador Institucional CFP ÁGAPE'
          : data.role === 'instructor'
          ? `Docente · ${data.specialty || 'Formación Técnica'}`
          : 'Estudiante Matriculado CFP ÁGAPE'),
      headline:
        data.role === 'admin'
          ? 'Administrador de Plataforma · CFP ÁGAPE'
          : data.role === 'coordinator'
          ? 'Coordinación de Jóvenes y Programas · CFP ÁGAPE'
          : data.role === 'instructor'
          ? `Docente de ${data.specialty || 'Especialidad Técnica'} · CFP ÁGAPE`
          : 'Estudiante del Centro de Formación Profesional ÁGAPE',
      specialty: data.specialty?.trim() || undefined,
      password: data.password,
      isActive: true,
      enrolledCourseIds:
        data.role === 'student' ? data.courseIds || [] : undefined,
      createdAt: new Date().toISOString(),
    };

    const { password: _pwd, ...sanitizedNewUser } = newUserWithPwd;
    const nextUsers = [sanitizedNewUser, ...registeredUsersRef.current];
    registeredUsersRef.current = nextUsers;
    setRegisteredUsers(nextUsers);

    if (data.role === 'instructor') {
      const newInst: Instructor = {
        id: newUserId,
        name: newUserWithPwd.name,
        specialty: newUserWithPwd.specialty || 'Especialidad Técnica',
        avatar: newUserWithPwd.avatar,
        email: cleanEmail,
        bio: `Docente del CFP ÁGAPE (${newUserWithPwd.specialty || 'Formación Profesional'}).`,
      };
      const nextInst = [newInst, ...instructorsRef.current];
      instructorsRef.current = nextInst;
      setInstructors(nextInst);

      if (data.courseIds && data.courseIds.length > 0) {
        const nextCourses = coursesRef.current.map((c) => {
          if (!data.courseIds!.includes(c.id)) return c;
          const currentTeachers = c.assignedTeacherIds || [];
          if (currentTeachers.includes(newUserId)) return c;
          return {
            ...c,
            assignedTeacherIds: [...currentTeachers, newUserId],
          };
        });
        coursesRef.current = nextCourses;
        setCourses(nextCourses);
      }
    }

    void saveLocalAuthHash(cleanEmail, data.password);

    fetch('/api/lms/users/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: newUserWithPwd,
        isCreate: true,
        assignCourseIds: data.role === 'instructor' ? data.courseIds : undefined,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success) {
          const canApplyUsers =
            serverStorageModeRef.current !== 'vercel-ephemeral' ||
            (Array.isArray(res.users) && res.users.length >= registeredUsersRef.current.length);
          applyServerSnapshot({
            users: canApplyUsers ? res.users : undefined,
            instructors: res.instructors,
            courses: res.courses,
          });
        }
      })
      .catch((err) => console.warn('Error persisting created user to server:', err));

    return { success: true, user: sanitizedNewUser };
  };

  const updateUser: LmsContextType['updateUser'] = (userId, updates) => {
    const target = registeredUsersRef.current.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    if (isMasterAdminUser(target)) {
      if (updates.role && updates.role !== 'admin') {
        return {
          success: false,
          message:
            'Protección de Seguridad: La cuenta Super Administrador Maestro es inamovible y no puede ser degradada.',
        };
      }
      if (updates.isActive === false) {
        return {
          success: false,
          message:
            'Protección de Seguridad: La cuenta Super Administrador Maestro no puede ser suspendida.',
        };
      }
    }

    if (updates.email) {
      const cleanEmail = updates.email.trim().toLowerCase();
      if (!cleanEmail.endsWith(INSTITUTIONAL_DOMAIN)) {
        return {
          success: false,
          message: 'El correo debe pertenecer al dominio @campus.agape.edu.sv.',
        };
      }
      if (
        registeredUsersRef.current.some(
          (u) => u.id !== userId && u.email.trim().toLowerCase() === cleanEmail
        )
      ) {
        return {
          success: false,
          message: 'Ya existe otra cuenta con este correo institucional.',
        };
      }
    }

    const updatedUser: AuthUser = {
      ...target,
      ...updates,
      email: updates.email ? updates.email.trim().toLowerCase() : target.email,
      isMasterAdmin: isMasterAdminUser(target) ? true : target.isMasterAdmin,
      role: isMasterAdminUser(target) ? 'admin' : updates.role || target.role,
      isActive: isMasterAdminUser(target) ? true : updates.isActive ?? target.isActive,
    };

    const { password: _pwd, ...sanitizedUpdated } = updatedUser;
    const nextUsers = registeredUsersRef.current.map((u) =>
      u.id === userId ? sanitizedUpdated : u
    );
    registeredUsersRef.current = nextUsers;
    setRegisteredUsers(nextUsers);

    // Sync instructor roster if instructor profile changed
    if (target.role === 'instructor' || updates.role === 'instructor') {
      const exists = instructorsRef.current.some((i) => i.id === userId);
      const nextInst =
        !exists && updates.role === 'instructor'
          ? [
              {
                id: userId,
                name: updatedUser.name,
                specialty: updatedUser.specialty || 'Especialidad Técnica',
                avatar: updatedUser.avatar,
                email: updatedUser.email,
              },
              ...instructorsRef.current,
            ]
          : instructorsRef.current.map((i) =>
              i.id === userId
                ? {
                    ...i,
                    name: updatedUser.name,
                    specialty: updatedUser.specialty ?? i.specialty,
                    avatar: updatedUser.avatar,
                    email: updatedUser.email,
                  }
                : i
            );
      instructorsRef.current = nextInst;
      setInstructors(nextInst);
    }

    if (updates.password) {
      void saveLocalAuthHash(updatedUser.email, updates.password);
    }

    fetch('/api/lms/users/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updatedUser, isCreate: false }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success) {
          applyServerSnapshot({
            users: res.users,
            instructors: res.instructors,
          });
        }
      })
      .catch((err) => console.warn('Error syncing updated user:', err));

    return { success: true };
  };

  const resetUserPassword: LmsContextType['resetUserPassword'] = (userId, newPassword) => {
    const target = registeredUsersRef.current.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'Usuario no encontrado.' };

    if (
      isMasterAdminUser(target) &&
      currentAuthUser &&
      !isMasterAdminUser(currentAuthUser)
    ) {
      return {
        success: false,
        message:
          'Solo el Super Administrador Maestro puede modificar su propia contraseña.',
      };
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return {
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      };
    }

    void saveLocalAuthHash(target.email, newPassword.trim());

    fetch('/api/lms/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        newPassword: newPassword.trim(),
        actorEmail: currentAuthUser?.email || '',
      }),
    }).catch((err) => console.warn('Error resetting user password on server:', err));

    return { success: true };
  };

  const addTeacher: LmsContextType['addTeacher'] = (data) => {
    const res = createUser({
      name: data.name,
      email: data.email,
      password: data.password || 'docente123',
      role: 'instructor',
      specialty: data.specialty,
      institutionalCode: data.institutionalCode,
      avatar: data.avatar,
    });
    return { success: res.success, message: res.message };
  };

  const toggleUserStatus: LmsContextType['toggleUserStatus'] = (userId) => {
    const target = registeredUsersRef.current.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'Usuario no encontrado.' };

    if (isMasterAdminUser(target)) {
      return {
        success: false,
        message:
          'Protección de Seguridad: La cuenta Super Administrador Maestro no puede ser desactivada.',
      };
    }

    if (currentAuthUser && currentAuthUser.id === userId) {
      return {
        success: false,
        message: 'No puedes suspender tu propia sesión activa.',
      };
    }

    const nextUsers = registeredUsersRef.current.map((u) => {
      if (u.id !== userId) return u;
      return { ...u, isActive: u.isActive === false ? true : false };
    });
    registeredUsersRef.current = nextUsers;
    setRegisteredUsers(nextUsers);

    fetch('/api/lms/users/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch((err) => console.warn('Error toggling user status on server:', err));

    return { success: true };
  };

  const deleteUser: LmsContextType['deleteUser'] = (userId) => {
    const target = registeredUsersRef.current.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'Usuario no encontrado.' };

    if (isMasterAdminUser(target)) {
      return {
        success: false,
        message:
          'Protección de Seguridad: La cuenta Super Administrador Maestro es inamovible y no puede ser eliminada.',
      };
    }

    if (currentAuthUser && currentAuthUser.id === userId) {
      return {
        success: false,
        message: 'No puedes eliminar la cuenta con la que iniciaste sesión.',
      };
    }

    const nextUsers = registeredUsersRef.current.filter((u) => u.id !== userId);
    const nextInst = instructorsRef.current.filter((i) => i.id !== userId);
    const nextCourses = coursesRef.current.map((c) => ({
      ...c,
      assignedTeacherIds: (c.assignedTeacherIds || []).filter((id) => id !== userId),
    }));

    registeredUsersRef.current = nextUsers;
    instructorsRef.current = nextInst;
    coursesRef.current = nextCourses;
    setRegisteredUsers(nextUsers);
    setInstructors(nextInst);
    setCourses(nextCourses);

    removeLocalAuthHash(target.email);

    fetch(`/api/lms/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Error deleting user on server:', err));

    return { success: true };
  };

  const enrollStudent: LmsContextType['enrollStudent'] = (data) => {
    const res = createUser({
      name: data.name,
      email: data.email,
      password: data.password || 'alumno123',
      role: 'student',
      institutionalCode: data.institutionalCode,
      avatar: data.avatar,
      courseIds: data.courseIds,
    });
    return { success: res.success, message: res.message };
  };

  const assignStudentToCourse = (userId: string, courseId: string) => {
    const target = registeredUsersRef.current.find((u) => u.id === userId);
    if (!target) return;
    const current = target.enrolledCourseIds || [];
    if (current.includes(courseId)) return;
    updateUser(userId, { enrolledCourseIds: [...current, courseId] });
  };

  const removeStudentFromCourse = (userId: string, courseId: string) => {
    const target = registeredUsersRef.current.find((u) => u.id === userId);
    if (!target) return;
    const current = target.enrolledCourseIds || [];
    updateUser(userId, { enrolledCourseIds: current.filter((c) => c !== courseId) });
  };

  const bulkEnrollStudentsCSV = (
    courseId: string,
    rows: CSVStudentRow[]
  ): CSVEnrollmentResult => {
    let added = 0;
    let enrolledExisting = 0;
    let skipped = 0;
    const errors: string[] = [];

    let updatedUsers = [...registeredUsersRef.current];
    const newStudentsForServer: AuthUser[] = [];
    const existingEnrollmentsForServer: { userId: string; courseId: string }[] = [];

    rows.forEach((row, index) => {
      const cleanEmail = (row.email || '').trim().toLowerCase();
      const cleanName = (row.name || '').trim();

      if (!cleanName || !cleanEmail) {
        skipped++;
        errors.push(`Fila ${index + 1}: Falta nombre o correo institucional.`);
        return;
      }

      if (!cleanEmail.endsWith(INSTITUTIONAL_DOMAIN)) {
        skipped++;
        errors.push(
          `Fila ${index + 1} (${cleanEmail}): Correo rechazado por no pertenecer a ${INSTITUTIONAL_DOMAIN}.`
        );
        return;
      }

      const existingIdx = updatedUsers.findIndex(
        (u) => u.email.trim().toLowerCase() === cleanEmail
      );

      if (existingIdx >= 0) {
        const existingUser = updatedUsers[existingIdx];
        if (existingUser.role !== 'student') {
          skipped++;
          errors.push(
            `Fila ${index + 1} (${cleanEmail}): El correo pertenece a una cuenta ${existingUser.role}.`
          );
          return;
        }
        const currentCourses = existingUser.enrolledCourseIds || [];
        if (!currentCourses.includes(courseId)) {
          updatedUsers[existingIdx] = {
            ...existingUser,
            enrolledCourseIds: [...currentCourses, courseId],
          };
          existingEnrollmentsForServer.push({ userId: existingUser.id, courseId });
          enrolledExisting++;
        } else {
          skipped++;
        }
      } else {
        const newStudent: AuthUser = {
          id: `user-student-${Date.now()}-${index}`,
          name: cleanName,
          institutionalCode: row.institutionalCode?.trim() || undefined,
          email: cleanEmail,
          role: 'student',
          avatar: '/assets/images/avatar_student_1793144128485.jpg',
          position: 'Aprendiz CFP ÁGAPE',
          headline: 'Estudiante Matriculado CFP ÁGAPE',
          password: row.password?.trim() || 'AgapeEst2026!',
          isActive: true,
          enrolledCourseIds: [courseId],
          createdAt: new Date().toISOString(),
        };
        newStudentsForServer.push(newStudent);
        void saveLocalAuthHash(cleanEmail, newStudent.password || 'AgapeEst2026!');
        const { password: _pwd, ...sanitized } = newStudent;
        updatedUsers = [sanitized, ...updatedUsers];
        added++;
      }
    });

    registeredUsersRef.current = updatedUsers;
    setRegisteredUsers(updatedUsers);

    if (newStudentsForServer.length > 0 || existingEnrollmentsForServer.length > 0) {
      fetch('/api/lms/users/bulk-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStudents: newStudentsForServer,
          existingEnrollments: existingEnrollmentsForServer,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.success && Array.isArray(res.users)) {
            applyServerSnapshot({ users: res.users });
          }
        })
        .catch((err) => console.warn('Error in bulk-enroll server sync:', err));
    }

    return { added, enrolledExisting, skipped, errors };
  };

  const toggleCourseSimulator = (courseId: string) => {
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const nextEnabled = !c.simulatorEnabledByAdmin;
        return {
          ...c,
          simulatorEnabledByAdmin: nextEnabled,
          modules: c.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) => ({
              ...l,
              simulatorEnabledByAdmin: nextEnabled,
            })),
          })),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const toggleLessonSimulator = (courseId: string, moduleId: string, lessonId: string) => {
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: m.lessons.map((l) => {
                if (l.id !== lessonId) return l;
                return {
                  ...l,
                  simulatorEnabledByAdmin: !l.simulatorEnabledByAdmin,
                };
              }),
            };
          }),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const setLessonSimulatorEnabled = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    enabled: boolean
  ) => {
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: m.lessons.map((l) => {
                if (l.id !== lessonId) return l;
                return {
                  ...l,
                  simulatorEnabledByAdmin: enabled,
                };
              }),
            };
          }),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  // -------------------------------------------------------------
  // Gemini AI Assistant Methods
  // -------------------------------------------------------------
  const generateLessonExplanationAI = async (
    lessonTitle: string,
    moduleTitle: string,
    courseCategory: string,
    targetLevel: string = 'Principiante'
  ): Promise<string> => {
    try {
      const res = await fetch('/api/gemini/generate-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonTitle, moduleTitle, courseCategory, targetLevel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) return data.text;
      }
    } catch (e) {
      console.warn('API error in generateLessonExplanationAI, fallback activated:', e);
    }

    return `OBJETIVOS DE APRENDIZAJE:
1. Comprender los fundamentos técnicos de ${lessonTitle}.
2. Aplicar criterios de medición segura y análisis práctico en ${moduleTitle}.
3. Documentar resultados siguiendo los estándares del CFP ÁGAPE.

FUNDAMENTOS TEÓRICOS:
- Revisión conceptual y aplicación práctica dentro del área de ${courseCategory}.
- Protocolo de diagnóstico sistemático y verificación paso a paso en taller.

PRECAUCIONES TÉCNICAS:
- Verifica siempre las condiciones de seguridad antes de iniciar cualquier práctica.`;
  };

  const generatePracticeAI = async (
    lessonTitle: string,
    moduleTitle: string,
    courseTitle: string
  ): Promise<string> => {
    try {
      const res = await fetch('/api/gemini/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonTitle, moduleTitle, courseTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.practice) return data.practice;
      }
    } catch (e) {
      console.warn('API error in generatePracticeAI, fallback activated:', e);
    }

    return `PRÁCTICA DE TALLER: ${lessonTitle.toUpperCase()}
OBJETIVO:
Ejecutar los procedimientos técnicos de ${moduleTitle} en el programa ${courseTitle}.

PROCEDIMIENTO TÉCNICO:
1. Revisar el diagrama y guía adjunta por el docente.
2. Registrar mediciones o evidencias de ejecución paso a paso.
3. Subir reporte técnico en formato PDF para evaluación.`;
  };

  const generateStudentExerciseAI = async (
    lessonTitle: string,
    explanationText: string
  ): Promise<AIPracticeExercise> => {
    try {
      const res = await fetch('/api/gemini/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonTitle, explanationText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exercise) {
          return {
            ...data.exercise,
            id: 'ex-' + Date.now(),
            lessonId: selectedLessonId,
          };
        }
      }
    } catch (e) {
      console.warn('API error in generateStudentExerciseAI, fallback activated:', e);
    }

    return {
      id: 'ex-' + Date.now(),
      lessonId: selectedLessonId,
      title: 'Diagnóstico de Caída de Tensión y Resistor Limitador',
      scenario:
        'En el taller de electrónica del CFP ÁGAPE, un aprendiz conecta un diodo LED rojo (caída típica de 2.0 V a 20 mA) a una fuente de alimentación de 12 V DC. Al energizar el circuito sin resistor limitador, el diodo se quema instantáneamente.',
      question:
        '¿Qué valor de resistor comercial debió conectarse en serie para alimentar el LED con seguridad a 20 mA desde los 12 V?',
      options: [
        '500 Ω (o valor estándar comercial más cercano de 510 Ω / 1/2W)',
        '100 Ω (provocaría sobrecorriente destructiva de más de 100 mA)',
        '10 kΩ (la corriente sería menor a 1 mA y el LED apenas iluminaría)',
        '22 Ω (la corriente excedería por mucho el límite térmico del semiconductor)',
      ],
      correctOptionIndex: 0,
      explanation:
        'Aplicando la Ley de Ohm: R = (V_fuente - V_led) / I = (12V - 2V) / 0.020A = 500 Ω. El valor comercial estándar más cercano de la serie E24 es 510 Ω.',
      hint: 'Resta el voltaje del LED al voltaje total de la fuente antes de dividir entre los 20 mA (0.020 A).',
    };
  };

  const evaluateStudentAnswerAI = async (
    question: string,
    studentAnswer: string,
    correctAnswer: string,
    explanation: string
  ): Promise<AIEvaluationResult> => {
    try {
      const res = await fetch('/api/gemini/evaluate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, studentAnswer, correctAnswer, explanation }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.evaluation) return data.evaluation;
      }
    } catch (e) {
      console.warn('API error in evaluateStudentAnswerAI, fallback activated:', e);
    }

    const isMatch = studentAnswer.trim() === correctAnswer.trim();
    return {
      isCorrect: isMatch,
      score: isMatch ? 100 : 0,
      feedbackTitle: isMatch
        ? '¡Excelente Razonamiento Técnico!'
        : 'Respuesta Incorrecta - Revisemos el Cálculo',
      feedback: isMatch
        ? 'Has aplicado correctamente el criterio técnico de la lección.'
        : 'Revisa los fundamentos de la clase y vuelve a analizar los datos del caso.',
      keyRecommendation: explanation,
    };
  };

  const generateSimulatorLabAI = async (
    lessonTitle: string,
    moduleTitle: string,
    courseTitle: string,
    labType: SimulatorLabType = 'interactive_practice',
    category: string = 'Formación Técnica',
    promptInstructions: string = ''
  ): Promise<SimulatorLab> => {
    try {
      const res = await fetch('/api/gemini/generate-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle,
          moduleTitle,
          courseTitle,
          labType,
          category,
          promptInstructions,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.simulator) return data.simulator;
      }
    } catch (e) {
      console.warn('API error in generateSimulatorLabAI, fallback activated:', e);
    }

    if (labType === 'interactive_practice') {
      const cleanPrompt = promptInstructions.trim();
      return {
        id: 'sim-' + Date.now(),
        title: `Simulador Interactivo: ${cleanPrompt ? cleanPrompt.slice(0, 65) : lessonTitle || 'Práctica Aplicada'}`,
        type: 'interactive_practice',
        topic: lessonTitle || 'Práctica Aplicada',
        authorPrompt: cleanPrompt || `Caso práctico de ${lessonTitle}`,
        scenarioDescription:
          cleanPrompt ||
          `Escenario práctico de ${lessonTitle} diseñado para evaluar el criterio técnico y la toma de decisiones del estudiante.`,
        initialContextData:
          'Condiciones iniciales del caso: Revisión operativa requerida antes de aprobar la ejecución final.',
        initialInstrumentState: 'Modo Práctica Interactiva | Evaluación IA Activa',
        toolsRequired: ['Criterio Técnico', 'Guía de Clase', 'Normativa CFP ÁGAPE'],
        passingScore: 70,
        learningOutcome: 'Análisis de casos reales, toma de decisiones fundamentadas y redacción de procedimientos.',
        stations: [
          {
            id: 'st-1',
            stationNumber: 1,
            title: 'Estación 1: Análisis Inicial del Escenario',
            stationType: 'open_analysis',
            prompt: 'Identifica los hallazgos, anomalías o puntos críticos presentes en los datos iniciales del caso.',
            caseData: 'Antecedentes iniciales de la lección.',
            expectedCriteria: 'Identificación precisa de los factores críticos y riesgos iniciales.',
            requiresWrittenResponse: true,
            hint: 'Relaciona los datos del enunciado con los principios vistos en clase.',
          },
          {
            id: 'st-2',
            stationNumber: 2,
            title: 'Estación 2: Decisión Técnica y Justificación',
            stationType: 'decision_and_justification',
            prompt: 'Elige la ruta de acción más segura y efectiva, y justifica por escrito tu criterio.',
            sampleOptions: [
              'Aplicar el protocolo técnico verificando variables antes de intervenir.',
              'Ejecutar una acción rápida sin comprobar los parámetros iniciales.',
            ],
            expectedCriteria: 'Selección de la opción sistemática con justificación técnica coherente.',
            requiresWrittenResponse: true,
            hint: 'Prioriza siempre la seguridad, precisión y trazabilidad.',
          },
          {
            id: 'st-3',
            stationNumber: 3,
            title: 'Estación 3: Procedimiento Paso a Paso y Cierre',
            stationType: 'procedure_steps',
            prompt: 'Redacta paso a paso cómo resolverías el caso y cómo validarías la calidad final.',
            expectedCriteria: 'Secuencia clara de ejecución y comprobación final.',
            requiresWrittenResponse: true,
            hint: 'Ordena los pasos de principio a fin e incluye la validación final.',
          },
        ],
      };
    }

    return {
      id: 'sim-' + Date.now(),
      title: `Simulador de Diagnóstico: ${lessonTitle || 'Laboratorio Técnico'}`,
      type: labType,
      topic: lessonTitle || 'Diagnóstico de Fallas',
      scenarioDescription:
        'En el laboratorio del CFP ÁGAPE se ha recibido un caso técnico para diagnóstico. Aplica el método sistemático de verificación y seguridad.',
      initialInstrumentState: 'Estado Inicial: Verificación de parámetros nominales en banco',
      toolsRequired: ['Multímetro Digital', 'Fuente Regulada', 'Manual Técnico CFP'],
      passingScore: 70,
      learningOutcome: 'Capacidad para diagnosticar y validar soluciones técnicas de forma segura.',
      steps: [
        {
          stepNumber: 1,
          stageTitle: 'Paso 1: Aislamiento Seguro y Comprobación Inicial',
          situation: 'Se detecta una lectura anómala al energizar el sistema en el banco de trabajo.',
          options: [
            {
              id: 'opt-1',
              actionText: 'Aislar la carga y medir parámetros en entrada primaria',
              consequenceText: 'Lectura primaria nominal confirmada sin fallas externas.',
              isOptimal: true,
              scoreImpact: 50,
              instrumentReading: 'Lectura Primaria: NOMINAL (OK)',
              technicalExplanation: 'Aislar etapas evita daños adicionales y acota la falla.',
            },
            {
              id: 'opt-2',
              actionText: 'Forzar alimentación máxima sin desconectar carga',
              consequenceText: 'Sobrecarga peligrosa y disparo de protección.',
              isOptimal: false,
              scoreImpact: -15,
              instrumentReading: 'Alarma: SOBRECORRIENTE CRÍTICA',
              technicalExplanation: 'Nunca se debe forzar energía ante una falla sin diagnosticar.',
            },
          ],
        },
        {
          stepNumber: 2,
          stageTitle: 'Paso 2: Corrección y Verificación Final',
          situation: 'Identificado el componente defectuoso, ejecutas la calibración y prueba final.',
          options: [
            {
              id: 'opt-3',
              actionText: 'Reemplazar componente respetando especificaciones y validar salida',
              consequenceText: 'Sistema operando dentro de los parámetros nominales.',
              isOptimal: true,
              scoreImpact: 50,
              instrumentReading: 'Salida: OPERATIVA Y ESTABLE',
              technicalExplanation: 'Procedimiento conforme a normas del CFP ÁGAPE.',
            },
          ],
        },
      ],
    };
  };

  const evaluateSimulatorPracticeAI: LmsContextType['evaluateSimulatorPracticeAI'] = async ({
    simulator,
    responses,
  }) => {
    try {
      const res = await fetch('/api/gemini/evaluate-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulator, responses }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.evaluation) return data.evaluation;
      }
    } catch (e) {
      console.warn('API error in evaluateSimulatorPracticeAI, using local rubric:', e);
    }

    const stations = simulator.stations || [];
    const stationFeedback = stations.map((st) => {
      const text = (responses[st.id]?.writtenResponse || '').trim();
      const words = text ? text.split(/\s+/).length : 0;
      const stScore = words < 4 ? 30 : words < 12 ? 68 : 88;
      return {
        stationNumber: st.stationNumber,
        title: st.title,
        score: stScore,
        comment:
          words < 4
            ? 'Respuesta insuficiente. Detalla tu razonamiento y procedimiento técnico.'
            : 'Análisis y procedimiento presentados con claridad.',
      };
    });
    const avg =
      stationFeedback.length > 0
        ? Math.round(stationFeedback.reduce((a, b) => a + b.score, 0) / stationFeedback.length)
        : 75;
    return {
      score: avg,
      passed: avg >= (simulator.passingScore || 70),
      overallFeedback:
        avg >= (simulator.passingScore || 70)
          ? `¡Excelente práctica! Alcanzaste ${avg}/100 aplicando criterio técnico en todas las estaciones.`
          : `Puntaje obtenido: ${avg}/100. Desarrolla más a fondo el análisis y las justificaciones en cada estación.`,
      strengths: ['Participación completa en la simulación práctica.'],
      areasToImprove: ['Profundizar en la verificación final y criterios técnicos de cada etapa.'],
      stationFeedback,
    };
  };

  const askTutorAI: LmsContextType['askTutorAI'] = async (payload) => {
    try {
      const res = await fetch('/api/gemini/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return { reply: data.reply, source: data.source };
      }
    } catch (e) {
      console.warn('API error in askTutorAI, using local guidance:', e);
    }

    return {
      reply: `Sobre "${payload.lessonTitle}": recuerda revisar los fundamentos teóricos de la clase y analizar paso a paso los datos antes de tomar una decisión. No puedo darte respuestas directas de evaluaciones, pero si me cuentas tu razonamiento te ayudo a verificarlo.`,
      source: 'fallback',
    };
  };

  // Instructor Management Actions
  const registerInstructor = (inst: Omit<Instructor, 'id'>): Instructor => {
    const newInstructor: Instructor = {
      ...inst,
      id: 'inst-' + Date.now(),
      avatar: inst.avatar || '/assets/images/avatar_instructor_1793144141202.jpg',
    };
    const nextInst = [newInstructor, ...instructorsRef.current];
    instructorsRef.current = nextInst;
    setInstructors(nextInst);
    pushCoursesAndInstructorsToServer(coursesRef.current, nextInst);
    return newInstructor;
  };

  const assignInstructorToCourse = (courseId: string, instructorId: string) => {
    const teacherUser = registeredUsersRef.current.find(
      (u) => u.id === instructorId && u.role === 'instructor'
    );
    const targetInstructor =
      instructorsRef.current.find((i) => i.id === instructorId) ||
      (teacherUser
        ? {
            id: teacherUser.id,
            name: teacherUser.name,
            specialty: teacherUser.specialty || 'Docente CFP ÁGAPE',
            avatar: teacherUser.avatar,
            email: teacherUser.email,
          }
        : undefined);
    if (!targetInstructor) return;

    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const currentIds = c.assignedTeacherIds || [];
        const nextIds = currentIds.includes(targetInstructor.id)
          ? currentIds
          : [...currentIds, targetInstructor.id];
        return {
          ...c,
          assignedTeacherIds: nextIds,
          instructor: {
            id: targetInstructor.id,
            name: targetInstructor.name,
            title: targetInstructor.specialty,
            avatar: targetInstructor.avatar,
            email: targetInstructor.email,
          },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const assignTeachersToCourse = (courseId: string, teacherIds: string[]) => {
    const primaryTeacher = registeredUsersRef.current.find((u) => teacherIds.includes(u.id));
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          assignedTeacherIds: teacherIds,
          instructor: primaryTeacher
            ? {
                id: primaryTeacher.id,
                name: primaryTeacher.name,
                title: primaryTeacher.specialty || primaryTeacher.headline,
                avatar: primaryTeacher.avatar,
                email: primaryTeacher.email,
              }
            : c.instructor,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  // Course CRUD
  const createCourse = (data: Partial<Course>): Course => {
    const assignedIds = data.assignedTeacherIds || [];
    const primaryTeacher =
      registeredUsersRef.current.find((u) => assignedIds.includes(u.id)) ||
      (currentAuthUser?.role === 'instructor' ? currentAuthUser : undefined);

    const newCourse: Course = {
      id: 'course-' + Date.now(),
      title: data.title || 'Nuevo Programa Formativo',
      subtitle:
        data.subtitle || 'Descripción breve del contenido y competencias técnicas del programa.',
      description:
        data.description || 'Descripción completa del plan de estudios en el CFP ÁGAPE.',
      category: data.category || 'Formación Técnica',
      level: data.level || 'Principiante',
      price: data.price ?? 0,
      status: data.status || 'Publicado',
      trailerVideoUrl:
        data.trailerVideoUrl ||
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      coverImage: data.coverImage || '/assets/images/course_cover_webdev_1793144124323.jpg',
      instructor: primaryTeacher
        ? {
            id: primaryTeacher.id,
            name: primaryTeacher.name,
            title: primaryTeacher.specialty || primaryTeacher.headline,
            avatar: primaryTeacher.avatar,
            email: primaryTeacher.email,
          }
        : {
            id: currentUser.id,
            name: currentUser.name,
            title: currentUser.headline,
            avatar: currentUser.avatar,
            email: currentUser.email,
          },
      assignedTeacherIds:
        assignedIds.length > 0
          ? assignedIds
          : primaryTeacher
          ? [primaryTeacher.id]
          : [],
      enrolledCount: 0,
      rating: 5.0,
      updatedAt: new Date().toISOString().split('T')[0],
      simulatorEnabledByAdmin: false,
      modules: [
        {
          id: 'mod-' + Date.now(),
          title: 'Módulo 1: Fundamentos',
          description: 'Introducción técnica y primeros procedimientos del programa.',
          lessons: [
            {
              id: 'les-' + Date.now(),
              title: 'Lección 1.1: Bienvenida y Fundamentos',
              summary: 'Objetivos formativos y protocolo de trabajo en taller.',
              durationMinutes: 20,
              type: 'video',
              simulatorEnabledByAdmin: false,
              videoUrl:
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              videoFileName: 'clase_introduccion.mp4',
              explanationText:
                'Contenido teórico inicial del programa formativo en el Centro de Formación Profesional ÁGAPE.',
              resources: [],
            },
          ],
        },
      ],
    };

    updateCoursesState((prev) => [newCourse, ...prev]);
    setSelectedCourseId(newCourse.id);
    return newCourse;
  };

  const duplicateCourse = (courseId: string): Course => {
    const original = coursesRef.current.find((c) => c.id === courseId);
    if (!original) {
      return createCourse({ title: 'Copia de Curso' });
    }

    const timestamp = Date.now();
    const clonedCourse: Course = {
      ...original,
      id: 'course-' + timestamp,
      title: `${original.title} (Copia)`,
      status: 'Borrador',
      enrolledCount: 0,
      updatedAt: new Date().toISOString().split('T')[0],
      modules: original.modules.map((mod, mIdx) => ({
        ...mod,
        id: `mod-${timestamp}-${mIdx}`,
        lessons: mod.lessons.map((les, lIdx) => ({
          ...les,
          id: `les-${timestamp}-${mIdx}-${lIdx}`,
          simulatorEnabledByAdmin: false,
          resources: les.resources.map((res, rIdx) => ({
            ...res,
            id: `res-${timestamp}-${mIdx}-${lIdx}-${rIdx}`,
          })),
        })),
      })),
    };

    updateCoursesState((prev) => [clonedCourse, ...prev]);
    setSelectedCourseId(clonedCourse.id);
    return clonedCourse;
  };

  const updateCourse = (courseId: string, updates: Partial<Course>) => {
    updateCoursesState((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              ...updates,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : c
      )
    );
  };

  const updateCourseStatus = (courseId: string, status: Course['status']) => {
    updateCourse(courseId, { status });
  };

  const deleteCourse = (courseId: string) => {
    const remaining = updateCoursesState((prev) => prev.filter((c) => c.id !== courseId));
    if (selectedCourseId === courseId && remaining.length > 0) {
      setSelectedCourseId(remaining[0].id);
    }
  };

  const addModule = (courseId: string, title: string, description: string): Module => {
    const newModId = 'mod-' + Date.now();
    const newLessonId = 'les-' + Date.now();
    const initialLesson: Lesson = {
      id: newLessonId,
      title: `Lección 1: Introducción a ${title.replace(/^Módulo\s*\d*:\s*/i, '')}`,
      summary: 'Objetivos, fundamentos y protocolo técnico de la lección.',
      durationMinutes: 20,
      type: 'video',
      simulatorEnabledByAdmin: false,
      videoUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      videoFileName: 'clase_video_hd.mp4',
      explanationText: `OBJETIVOS DE APRENDIZAJE:\n1. Conocer los fundamentos teóricos y normativos de ${title}.\n2. Aplicar los criterios de montaje y medición en el banco de trabajo del CFP ÁGAPE.\n3. Ejecutar las buenas prácticas de seguridad e instrumentación.`,
      resources: [],
    };

    const newMod: Module = {
      id: newModId,
      title,
      description,
      lessons: [initialLesson],
    };

    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: [...c.modules, newMod],
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );

    return newMod;
  };

  const updateModule = (courseId: string, moduleId: string, updates: Partial<Module>) => {
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m)),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteModule = (courseId: string, moduleId: string) => {
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.filter((m) => m.id !== moduleId),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const addLesson = (
    courseId: string,
    moduleId: string,
    lesson: Omit<Lesson, 'id'>
  ): Lesson => {
    const newLesson: Lesson = {
      ...lesson,
      id: 'les-' + Date.now(),
      simulatorEnabledByAdmin: lesson.simulatorEnabledByAdmin ?? false,
      resources: lesson.resources || [],
    };

    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: [...m.lessons, newLesson],
            };
          }),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );

    return newLesson;
  };

  const updateLesson = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    updates: Partial<Lesson>
  ) => {
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
            };
          }),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteLesson = (courseId: string, moduleId: string, lessonId: string) => {
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: m.lessons.filter((l) => l.id !== lessonId),
            };
          }),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const addResource = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    res: Omit<ResourceItem, 'id'>
  ) => {
    const newResource: ResourceItem = {
      ...res,
      id: 'res-' + Date.now(),
    };

    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: m.lessons.map((l) => {
                if (l.id !== lessonId) return l;
                return {
                  ...l,
                  resources: [...l.resources, newResource],
                };
              }),
            };
          }),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteResource = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    resourceId: string
  ) => {
    updateCoursesState((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: m.lessons.map((l) => {
                if (l.id !== lessonId) return l;
                return {
                  ...l,
                  resources: l.resources.filter((r) => r.id !== resourceId),
                };
              }),
            };
          }),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const saveQuiz = (courseId: string, moduleId: string, lessonId: string, quiz: Quiz) => {
    updateLesson(courseId, moduleId, lessonId, {
      type: 'quiz',
      quiz,
    });
  };

  const saveAssignment = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    assignment: Assignment
  ) => {
    updateLesson(courseId, moduleId, lessonId, {
      type: 'assignment',
      assignment,
    });
  };

  const saveSimulatorLab = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    simulatorLab: SimulatorLab
  ) => {
    updateLesson(courseId, moduleId, lessonId, {
      simulatorLab,
    });
  };

  const deleteSimulatorLab = (courseId: string, moduleId: string, lessonId: string) => {
    updateLesson(courseId, moduleId, lessonId, {
      simulatorLab: undefined,
    });
  };

  // -------------------------------------------------------------
  // Institutional Coordination CRUD (Youths, Attendance, Logs)
  // -------------------------------------------------------------
  const upsertInstitutionalYouth = (youth: InstitutionalYouth) => {
    const prev = institutionalYouthsRef.current;
    const exists = prev.some((y) => y.id === youth.id);
    const next = exists ? prev.map((y) => (y.id === youth.id ? youth : y)) : [youth, ...prev];
    institutionalYouthsRef.current = next;
    setInstitutionalYouths(next);

    fetch('/api/lms/institutional/youths/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youth }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && Array.isArray(res.institutionalYouths)) {
          applyServerSnapshot({ institutionalYouths: res.institutionalYouths });
        }
      })
      .catch((err) => console.warn('Error syncing institutional youth:', err));
  };

  const deleteInstitutionalYouth = (youthId: string) => {
    const next = institutionalYouthsRef.current.filter((y) => y.id !== youthId);
    institutionalYouthsRef.current = next;
    setInstitutionalYouths(next);

    fetch(`/api/lms/institutional/youths/${encodeURIComponent(youthId)}`, {
      method: 'DELETE',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && Array.isArray(res.institutionalYouths)) {
          applyServerSnapshot({ institutionalYouths: res.institutionalYouths });
        }
      })
      .catch((err) => console.warn('Error deleting institutional youth:', err));
  };

  const saveInstitutionalAttendance = (session: InstitutionalAttendanceSession) => {
    const prev = institutionalAttendanceRef.current;
    const exists = prev.some((s) => s.id === session.id);
    const next = exists
      ? prev.map((s) => (s.id === session.id ? session : s))
      : [session, ...prev];
    institutionalAttendanceRef.current = next;
    setInstitutionalAttendance(next);

    fetch('/api/lms/institutional/attendance/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && Array.isArray(res.institutionalAttendance)) {
          applyServerSnapshot({ institutionalAttendance: res.institutionalAttendance });
        }
      })
      .catch((err) => console.warn('Error syncing attendance session:', err));
  };

  const addInstitutionalLog = (entry: InstitutionalLogEntry) => {
    const next = [entry, ...institutionalLogsRef.current.filter((l) => l.id !== entry.id)];
    institutionalLogsRef.current = next;
    setInstitutionalLogs(next);

    fetch('/api/lms/institutional/logs/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && Array.isArray(res.institutionalLogs)) {
          applyServerSnapshot({ institutionalLogs: res.institutionalLogs });
        }
      })
      .catch((err) => console.warn('Error syncing institutional log:', err));
  };

  const deleteInstitutionalLog = (logId: string) => {
    const next = institutionalLogsRef.current.filter((l) => l.id !== logId);
    institutionalLogsRef.current = next;
    setInstitutionalLogs(next);

    fetch(`/api/lms/institutional/logs/${encodeURIComponent(logId)}`, {
      method: 'DELETE',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && Array.isArray(res.institutionalLogs)) {
          applyServerSnapshot({ institutionalLogs: res.institutionalLogs });
        }
      })
      .catch((err) => console.warn('Error deleting institutional log:', err));
  };

  return (
    <LmsContext.Provider
      value={{
        role,
        currentUser,
        courses,
        selectedCourseId,
        selectedCourse,
        setSelectedCourseId,
        selectedLessonId,
        selectedLesson,
        setSelectedLessonId,
        activeNavTab,
        setActiveNavTab,

        // Production Auth
        registeredUsers,
        currentAuthUser,
        login,
        logout,

        // AI Assistant
        generateLessonExplanationAI,
        generatePracticeAI,
        generateStudentExerciseAI,
        evaluateStudentAnswerAI,
        generateSimulatorLabAI,
        evaluateSimulatorPracticeAI,
        askTutorAI,

        trailerCourse,
        openTrailer,
        closeTrailer,
        certificateCourse,
        openCertificate,
        closeCertificate,
        progress,
        isLessonCompleted,
        toggleLessonCompleted,
        getCourseProgressPercent,
        getModuleProgress,
        submitQuizAttempt,
        submitAssignmentWork,
        saveLessonNote,
        getLessonNote,
        recordSimulatorScore,
        openCoursePlayer,
        instructors,
        registerInstructor,
        assignInstructorToCourse,
        assignTeachersToCourse,
        createCourse,
        duplicateCourse,
        updateCourse,
        updateCourseStatus,
        deleteCourse,
        addModule,
        updateModule,
        deleteModule,
        addLesson,
        updateLesson,
        deleteLesson,
        addResource,
        deleteResource,
        saveQuiz,
        saveAssignment,
        saveSimulatorLab,
        deleteSimulatorLab,

        // Multi-Admin Methods
        createUser,
        updateUser,
        resetUserPassword,
        addTeacher,
        toggleUserStatus,
        deleteUser,
        enrollStudent,
        assignStudentToCourse,
        removeStudentFromCourse,
        bulkEnrollStudentsCSV,
        toggleCourseSimulator,
        toggleLessonSimulator,
        setLessonSimulatorEnabled,

        // Institutional Coordination Methods
        institutionalYouths,
        institutionalAttendance,
        institutionalLogs,
        upsertInstitutionalYouth,
        deleteInstitutionalYouth,
        saveInstitutionalAttendance,
        addInstitutionalLog,
        deleteInstitutionalLog,
      }}
    >
      {children}
    </LmsContext.Provider>
  );
};

export const useLms = () => {
  const context = useContext(LmsContext);
  if (!context) {
    throw new Error('useLms must be used within an LmsProvider');
  }
  return context;
};
