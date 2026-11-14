export type UserRole = 'admin' | 'coordinator' | 'instructor' | 'student';

export type CourseLevel = 'Principiante' | 'Intermedio' | 'Avanzado';

export type LessonType = 'video' | 'quiz' | 'assignment';

export type ResourceType =
  | 'pdf'
  | 'zip'
  | 'link'
  | 'code'
  | 'doc'
  | 'gdoc'
  | 'gsheet'
  | 'gslides'
  | 'excel'
  | 'ppt';

export type DocCategory = 'document' | 'spreadsheet' | 'presentation' | 'other';

export interface ResourceItem {
  id: string;
  title: string;
  type: ResourceType;
  size?: string;
  url: string;
  description?: string;
  fileData?: string;
  docCategory?: DocCategory;
  provider?: 'google' | 'onedrive' | 'file' | 'external';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  instructions?: string;
  passingScore: number; // e.g. 70 (%)
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, number>;
  passed: boolean;
  completedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  maxPoints: number;
  dueDate: string;
  templateUrl?: string;
  templateName?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentName: string;
  submittedAt: string;
  fileName: string;
  fileSize?: string;
  notes?: string;
  linkUrl?: string;
  docCategory?: DocCategory;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

export interface Instructor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  email: string;
  bio?: string;
}

export type SimulatorLabType =
  | 'interactive_practice'
  | 'case_scenario'
  | 'diagnostic_test'
  | 'guided_workshop';

export interface SimulatorStation {
  id: string;
  stationNumber: number;
  title: string;
  stationType: 'open_analysis' | 'procedure_steps' | 'decision_and_justification';
  prompt: string;
  caseData?: string;
  expectedCriteria: string;
  sampleOptions?: string[];
  requiresWrittenResponse: boolean;
  hint?: string;
}

export interface SimulatorEvaluationResult {
  score: number;
  passed: boolean;
  overallFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  stationFeedback: {
    stationNumber: number;
    title: string;
    score: number;
    comment: string;
  }[];
}

export interface SimulatorDecisionOption {
  id: string;
  actionText: string;
  consequenceText: string;
  isOptimal: boolean;
  scoreImpact: number;
  instrumentReading?: string;
  technicalExplanation: string;
}

export interface SimulatorStep {
  stepNumber: number;
  stageTitle: string;
  situation: string;
  options: SimulatorDecisionOption[];
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  technicalFeedback: string;
}

export interface GuidedWorkshopStep {
  id: string;
  stepNumber: number;
  instruction: string;
  checklistLabel: string;
  warningAlert?: string;
  expectedMeasurement?: string;
}

export interface SimulatorLab {
  id: string;
  title: string;
  type: SimulatorLabType;
  topic: string;
  authorPrompt?: string;
  scenarioDescription: string;
  initialContextData?: string;
  initialInstrumentState?: string;
  stations?: SimulatorStation[];
  steps?: SimulatorStep[];
  questions?: DiagnosticQuestion[];
  workshopSteps?: GuidedWorkshopStep[];
  toolsRequired?: string[];
  passingScore: number;
  learningOutcome: string;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  durationMinutes: number;
  type: LessonType;
  videoUrl?: string;
  videoFileName?: string;
  videoFileSize?: string;
  explanationText?: string;
  resources: ResourceItem[];
  quiz?: Quiz;
  assignment?: Assignment;
  simulatorLab?: SimulatorLab;
  simulatorEnabledByAdmin?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export type CourseStatus = 'Borrador' | 'Publicado' | 'En revisión';

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: CourseLevel;
  price: number;
  status: CourseStatus;
  trailerVideoUrl: string;
  coverImage: string;
  instructor: {
    id?: string;
    name: string;
    title: string;
    avatar: string;
    email?: string;
  };
  assignedTeacherIds?: string[];
  modules: Module[];
  enrolledCount: number;
  rating: number;
  updatedAt: string;
  simulatorEnabledByAdmin?: boolean;
}

export interface SimulatorAttemptRecord {
  simulatorId: string;
  title: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

export interface StudentProgress {
  courseId: string;
  completedLessonIds: string[];
  quizAttempts: Record<string, QuizAttempt>;
  assignmentSubmissions: Record<string, AssignmentSubmission>;
  notesByLesson: Record<string, string>;
  simulatorScores?: Record<string, SimulatorAttemptRecord>;
  certificateIssuedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  headline: string;
  institutionalCode?: string;
  position?: string;
  isMasterAdmin?: boolean;
}

export interface AuthUser extends UserProfile {
  password?: string;
  specialty?: string;
  createdAt: string;
  isActive?: boolean;
  enrolledCourseIds?: string[];
}

export interface CSVStudentRow {
  name: string;
  institutionalCode?: string;
  email: string;
  password?: string;
}

export interface CSVEnrollmentResult {
  added: number;
  enrolledExisting: number;
  skipped: number;
  errors: string[];
}

export interface AIPracticeExercise {
  id: string;
  lessonId: string;
  title: string;
  scenario: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  hint: string;
}

export interface AIEvaluationResult {
  isCorrect: boolean;
  score: number;
  feedbackTitle: string;
  feedback: string;
  keyRecommendation: string;
}

export interface TutorLinkedDocument {
  title: string;
  url: string;
  category: DocCategory;
}

export interface TutorChatMessage {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  timestamp: string;
  linkedDoc?: TutorLinkedDocument;
}

// -------------------------------------------------------------
// Gestión Institucional / Coordinación (Programas Presenciales & Jóvenes)
// -------------------------------------------------------------
export type YouthSex = 'Femenino' | 'Masculino';

export type YouthStatus = 'Activo' | 'Egresado' | 'Desertor/Retirado';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified';

export type InstitutionalLogType =
  | 'supply_delivery'
  | 'psychosocial_followup'
  | 'group_minutes';

export interface InstitutionalYouth {
  id: string;
  fullName: string;
  age: number;
  sex: YouthSex;
  duiOrBirthCert: string;
  department: string;
  municipality: string;
  cantonOrColonia: string;
  personalPhone: string;
  guardianPhone: string;
  assignedWorkshop: string;
  scheduleShift: string;
  status: YouthStatus;
  programCategory?: string;
  enrollmentDate: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionalAttendanceSession {
  id: string; // `${workshop}::${date}`
  workshop: string;
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // youthId -> status
  observations?: Record<string, string>; // youthId -> note
  recordedBy: string;
  updatedAt: string;
}

export interface InstitutionalLogEntry {
  id: string;
  type: InstitutionalLogType;
  date: string; // YYYY-MM-DD
  workshop?: string;
  youthId?: string;
  youthName?: string;
  title: string; // Motivo / Insumo / Tema del acta
  details: string; // Acuerdos / Descripción / Cantidad
  responsible: string;
  quantity?: string;
  createdAt: string;
}

