import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();

// Restore original /api/* path when Vercel rewrites /api/(.*) -> /api/index?__path=/api/$1
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.url.startsWith('/api/index') && typeof req.query.__path === 'string') {
    const rawPath = req.query.__path.startsWith('/') ? req.query.__path : `/${req.query.__path}`;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (k === '__path') continue;
      if (Array.isArray(v)) {
        v.forEach((item) => params.append(k, String(item)));
      } else if (v !== undefined) {
        params.append(k, String(v));
      }
    }
    const qs = params.toString();
    req.url = qs ? `${rawPath}?${qs}` : rawPath;
  }
  next();
});

// Guard against pre-parsed req.body in serverless runtimes so express.json does not hang
app.use((req: Request & { _body?: boolean }, _res: Response, next: NextFunction) => {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // leave string as-is
      }
    } else if (Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString('utf8'));
      } catch {
        // leave buffer as-is
      }
    }
    req._body = true;
  }
  next();
});

app.use(express.json({ limit: '15mb' }));

// -------------------------------------------------------------
// Self-contained LMS Persistence Store (Cloud KV + Local/Tmp File)
// -------------------------------------------------------------
interface LmsAuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'coordinator' | 'instructor' | 'student';
  avatar: string;
  headline: string;
  institutionalCode?: string;
  position?: string;
  isMasterAdmin?: boolean;
  password?: string;
  specialty?: string;
  createdAt: string;
  isActive?: boolean;
  enrolledCourseIds?: string[];
}

interface LmsPersistedState {
  users: LmsAuthUser[];
  courses: any[];
  instructors: any[];
  progress: Record<string, any>;
  institutionalYouths: any[];
  institutionalAttendance: any[];
  institutionalLogs: any[];
  updatedAt: string;
}

const MASTER_ADMIN_EMAIL = 'cursosenlinea@campus.agape.edu.sv';
const KV_KEY = 'cfp_agape_lms_state_v2';

const SEED_MASTER_ADMIN: LmsAuthUser = {
  id: 'user-admin-cursosenlinea',
  name: 'Coordinación Cursos en Línea',
  email: 'cursosenlinea@campus.agape.edu.sv',
  role: 'admin',
  isMasterAdmin: true,
  institutionalCode: 'CFP-ADM-001',
  position: 'Administrador Maestro del Campus Virtual',
  avatar: '/assets/images/avatar_instructor_1793144141202.jpg',
  headline: 'Coordinación Académica CFP ÁGAPE',
  specialty: 'Dirección Académica & Plataforma',
  password: 'AgapeAdmin2026!',
  isActive: true,
  createdAt: '2026-01-01T08:00:00Z',
};

const SEED_COURSES: any[] = [
  {
    id: 'course-elec-101',
    title: 'Técnico en Electrónica de Base',
    subtitle: 'Formación Técnica en Circuitos Analógicos, Medición e Instrumentación',
    description:
      'Programa oficial de formación profesional en electrónica analógica y digital. Aprende los fundamentos de diseño y análisis de circuitos, leyes de Kirchhoff, medición con multímetro y osciloscopio, y construcción de prototipos en protoboard.',
    category: 'Electrónica & Mantenimiento',
    level: 'Principiante',
    price: 45,
    status: 'Publicado',
    trailerVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    coverImage: '/assets/images/course_cover_webdev_1793144124323.jpg',
    instructor: {
      id: 'user-admin-cursosenlinea',
      name: 'Por asignar (Coordinación CFP ÁGAPE)',
      title: 'Coordinación Académica CFP ÁGAPE',
      avatar: '/assets/images/avatar_instructor_1793144141202.jpg',
      email: 'cursosenlinea@campus.agape.edu.sv',
    },
    assignedTeacherIds: [],
    enrolledCount: 0,
    rating: 4.9,
    updatedAt: '2026-10-27',
    simulatorEnabledByAdmin: false,
    modules: [
      {
        id: 'mod-1',
        title: 'Módulo 1: Fundamentos',
        description: 'Leyes fundamentales de la electricidad, componentes pasivos y seguridad en el taller.',
        lessons: [
          {
            id: 'les-1-1',
            title: 'Lección 1.1: Introducción a Circuitos',
            summary: 'Conceptos de voltaje, corriente, resistencia y resolución de circuitos en serie y paralelo.',
            durationMinutes: 25,
            type: 'video',
            simulatorEnabledByAdmin: false,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            videoFileName: 'clase_circuitos_base_1080p.mp4',
            explanationText:
              'Fundamentos Teóricos de Circuitos Eléctricos:\n\nUn circuito eléctrico es una trayectoria cerrada por la cual fluyen los electrones impulsados por una diferencia de potencial (Voltaje). En esta sesión aprenderemos a calcular y medir experimentalmente:\n\n1. Ley de Ohm: V = I × R (Voltios = Amperios × Ohmios)\n2. Potencia Disipada: P = V × I = I² × R (Vatios)\n3. Reglas de Kirchhoff para Nodos (KCL) y Mallas (KVL)\n\nInstrucciones de Taller: Antes de energizar cualquier circuito en la protoboard, verifica la continuidad con el multímetro y asegúrate de que la fuente de poder regulada se encuentre a 5V con límite de corriente de 500mA.',
            resources: [
              {
                id: 'res-elec-1',
                title: 'Guía de Práctica 01 - Ley de Ohm y Circuitos (PDF)',
                type: 'pdf',
                size: '1.4 MB',
                url: '#',
                description: 'Cálculos de resistencia equivalente y ejercicios de laboratorio.',
              },
            ],
            assignment: {
              id: 'assign-elec-1',
              title: 'Práctica de Laboratorio: Divisor de Tensión',
              description:
                'Montaje de circuito divisor de tensión en protoboard y cálculo de disipación de potencia en resistores.',
              instructions:
                '1. Realiza el montaje en protoboard según el diagrama adjunto.\n2. Mide las tensiones en cada nodo con el multímetro digital.\n3. Adjunta fotografías y la tabla comparativa teórico vs medido.',
              maxPoints: 100,
              dueDate: '2026-11-15',
            },
            quiz: {
              id: 'quiz-elec-1',
              title: 'Quiz de Validación: Ley de Ohm y Potencia',
              passingScore: 70,
              questions: [
                {
                  id: 'q-elec-1',
                  question:
                    'Según la Ley de Ohm, ¿cuál es la relación correcta entre Voltaje (V), Corriente (I) y Resistencia (R)?',
                  options: ['V = I * R', 'V = I / R', 'V = R / I', 'V = I + R'],
                  correctOptionIndex: 0,
                  explanation:
                    'La Ley de Ohm establece que el voltaje es directamente proporcional al producto de la corriente por la resistencia.',
                },
              ],
            },
            simulatorLab: {
              id: 'sim-elec-1',
              title: 'Simulador Práctico: Diagnóstico Paso a Paso de Fallo Eléctrico en Fuente Regulada',
              type: 'interactive_practice',
              topic: 'Diagnóstico paso a paso de un fallo eléctrico',
              authorPrompt:
                'Diagnóstico paso a paso de un fallo eléctrico en fuente de alimentación de 12V a 5V con sobrecarga en etapa de salida.',
              scenarioDescription:
                'En el banco de trabajo del CFP ÁGAPE ingresa una fuente regulada de laboratorio (12V DC a 5V DC) que presenta 0.0 V en los bornes de salida y activa la alarma de sobrecorriente (1.85 A). Debes analizar las lecturas reales, redactar el procedimiento seguro de aislamiento y justificar cada medición hasta restablecer el sistema.',
              initialContextData:
                'EQUIPO: Módulo Regulador CFP-5V-REV2 | VIN nominal: 12.0 V DC | VOUT medido: 0.00 V | I_fuente_banco: 1.85 A (Límite térmico) | Síntoma adicional: Diodo de protección D1 (1N4007) presenta temperatura elevada al tacto tras 5 segundos.',
              initialInstrumentState:
                'Fuente DC: 12.0 V | Vout: 0.0 V | Amperímetro: 1.85 A (Límite Térmico) | Estado: ALARMA DE FALLA',
              toolsRequired: [
                'Multímetro Digital con sondas',
                'Fuente Regulada con limitador de corriente',
                'Diagrama Esquemático Etapa Primaria',
              ],
              passingScore: 70,
              learningOutcome:
                'Capacidad de analizar síntomas eléctricos, ejecutar procedimientos de descarte sin energizar en modo óhmetro y justificar la sustitución segura de semiconductores.',
              stations: [
                {
                  id: 'st-elec-1',
                  stationNumber: 1,
                  title: 'Estación 1: Protocolo de Aislamiento Seguro y Medición Primaria',
                  stationType: 'decision_and_justification',
                  prompt:
                    'La fuente del banco marca 1.85 A en corto al energizar el módulo. Selecciona la primera acción segura y redacta el procedimiento técnico exacto que ejecutarías antes de tocar cualquier componente.',
                  caseData:
                    'Lectura actual: Fuente en protección CC | Tensión en bornes de carga: 0.00 V | Temperatura D1: 68°C.',
                  sampleOptions: [
                    'Desenergizar el módulo, desconectar la carga secundaria y verificar la tensión de entrada en vacío.',
                    'Subir el límite de corriente de la fuente a 5 A para localizar visualmente qué componente falla.',
                    'Medir continuidad en la placa manteniendo la fuente encendida a 12 V.',
                  ],
                  requiresWrittenResponse: true,
                  expectedCriteria:
                    'Debe indicar desenergizar antes de medir resistencia/continuidad, aislar la etapa de carga de la fuente para confirmar que la fuente externa entrega 12V limpios, y evitar forzar corriente.',
                  hint: 'Nunca midas resistencia o continuidad con el circuito energizado ni eleves el límite de corriente ante sospecha de cortocircuito.',
                },
                {
                  id: 'st-elec-2',
                  stationNumber: 2,
                  title: 'Estación 2: Análisis de Mediciones en Semiconductores',
                  stationType: 'open_analysis',
                  prompt:
                    'Con el módulo desenergizado, realizas pruebas con el multímetro en función de diodo y obtienes los siguientes datos. Analiza las lecturas, identifica el componente defectuoso y explica por qué provoca los 0.00 V a la salida.',
                  caseData:
                    'MEDICIONES EN PLACA (SIN ENERGÍA):\n• Diodo D1 (protección inversa en paralelo a la entrada): 0.004 V en directa / 0.004 V en inversa.\n• Resistor R1 (serie 10 Ω): 10.1 Ω.\n• Regulador 7805 (pin IN a GND desacoplado): 4.2 kΩ.',
                  requiresWrittenResponse: true,
                  expectedCriteria:
                    'Debe identificar que el diodo D1 está en cortocircuito franco (0.004 V en ambos sentidos equivale a unión destruida), drenando toda la corriente de la fuente a tierra e impidiendo que llegue voltaje al regulador 7805.',
                  hint: 'Un diodo sano conduce ~0.6V–0.7V en directa y marca OL (circuito abierto) en inversa.',
                },
                {
                  id: 'st-elec-3',
                  stationNumber: 3,
                  title: 'Estación 3: Plan de Reparación y Verificación Post-Mantenimiento',
                  stationType: 'procedure_steps',
                  prompt:
                    'Describe paso a paso cómo reemplazarías el componente dañado y qué 3 verificaciones finales realizarías antes de entregar el módulo reparado en el taller del CFP ÁGAPE.',
                  caseData:
                    'Repuestos disponibles en almacén: Diodo 1N4007 (1A, 1000V), Diodo 1N4148 (señal 150mA).',
                  requiresWrittenResponse: true,
                  expectedCriteria:
                    'Debe seleccionar 1N4007 respetando polaridad de cátodo (banda plateada), verificar ausencia de corto en frío antes de energizar, limitar corriente inicial y comprobar 5.0 V estables en Vout bajo carga.',
                  hint: 'Verifica la capacidad de corriente del diodo de protección (1N4007 soporta 1A vs 150mA del 1N4148) y la orientación del cátodo.',
                },
              ],
            },
          },
          {
            id: 'les-1-2',
            title: 'Lección 1.2: Herramientas del Técnico',
            summary:
              'Manejo seguro de soldador de estaño, multímetro digital, pinzas de punta y fuentes de poder reguladas.',
            durationMinutes: 30,
            type: 'video',
            simulatorEnabledByAdmin: false,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            resources: [
              {
                id: 'res-elec-2',
                title: 'Manual de Seguridad en Taller Eléctrico (PDF)',
                type: 'pdf',
                size: '850 KB',
                url: '#',
                description: 'Normas de protección personal y manejo de instrumental.',
              },
            ],
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Módulo 2: Semiconductores y Diodos',
        description: 'Unión PN, rectificación de media onda y onda completa, diodos Zener y filtrado capacitivo.',
        lessons: [
          {
            id: 'les-2-1',
            title: 'Lección 2.1: El Diodo Rectificador y Fuentes Lineales',
            summary: 'Polarización directa e inversa, caída de tensión típica y curvas características.',
            durationMinutes: 28,
            type: 'video',
            simulatorEnabledByAdmin: false,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            resources: [],
          },
        ],
      },
    ],
  },
  {
    id: 'course-webdev-101',
    title: 'Desarrollo Web Full-Stack Moderno: De Cero a Producción',
    subtitle: 'Domina React 19, TypeScript, Node.js y Arquitecturas en la Nube con proyectos reales.',
    description:
      'Aprende a concebir, estructurar, desarrollar y desplegar aplicaciones web empresariales con buenas prácticas de arquitectura y seguridad.',
    category: 'Ingeniería de Software',
    level: 'Intermedio',
    price: 89,
    status: 'Publicado',
    trailerVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    coverImage: '/assets/images/course_cover_webdev_1793144124323.jpg',
    instructor: {
      id: 'user-admin-cursosenlinea',
      name: 'Por asignar (Coordinación CFP ÁGAPE)',
      title: 'Coordinación Académica CFP ÁGAPE',
      avatar: '/assets/images/avatar_instructor_1793144141202.jpg',
      email: 'cursosenlinea@campus.agape.edu.sv',
    },
    assignedTeacherIds: [],
    enrolledCount: 0,
    rating: 4.9,
    updatedAt: '2026-10-15',
    simulatorEnabledByAdmin: false,
    modules: [
      {
        id: 'mod-web-1',
        title: 'Módulo 1: Fundamentos de React 19, TypeScript y Estado',
        description:
          'Bases de la ingeniería frontend moderna: componentes funcionales, hooks personalizados y tipado riguroso sin errores.',
        lessons: [
          {
            id: 'les-web-1-1',
            title: '1.1 Introducción al Ecosistema Full-Stack y Vite',
            summary:
              'Revisión del tooling moderno de desarrollo, bundlers ultrarrápidos con Vite y estructura de un proyecto productivo.',
            durationMinutes: 18,
            type: 'video',
            simulatorEnabledByAdmin: false,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            explanationText:
              'En esta lección revisaremos la arquitectura moderna de aplicaciones SPA con Vite, React 19 y TypeScript estricto, asegurando mantenibilidad en producción.',
            resources: [
              {
                id: 'res-web-1',
                title: 'Guía de Inicio Rápido Full-Stack (PDF)',
                type: 'pdf',
                size: '2.4 MB',
                url: '#',
                description: 'Resumen ejecutivo con diagramas de flujo de datos y dependencias recomendadas.',
              },
            ],
          },
          {
            id: 'les-web-1-2',
            title: '1.2 Tipado Avanzado con TypeScript y Gestión de Estado',
            summary:
              'Diseño de contratos de datos con interfaces, generics y uso de useReducer / Context para un flujo predecible.',
            durationMinutes: 24,
            type: 'video',
            simulatorEnabledByAdmin: false,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            resources: [],
          },
        ],
      },
    ],
  },
  {
    id: 'course-uiux-202',
    title: 'Diseño de Sistemas UI/UX con Figma & Design Tokens',
    subtitle:
      'Crea bibliotecas escalables de componentes, variantes, auto-layout y tokens sincronizados con código frontend.',
    description:
      'Transforma tu flujo de trabajo de diseño construyendo un Design System completo desde cero respetando estándares de accesibilidad WCAG AA.',
    category: 'Diseño & Producto',
    level: 'Principiante',
    price: 69,
    status: 'Borrador',
    trailerVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    coverImage: '/assets/images/course_cover_uiux_1793144129456.jpg',
    instructor: {
      id: 'user-admin-cursosenlinea',
      name: 'Por asignar (Coordinación CFP ÁGAPE)',
      title: 'Coordinación Académica CFP ÁGAPE',
      avatar: '/assets/images/avatar_instructor_1793144141202.jpg',
      email: 'cursosenlinea@campus.agape.edu.sv',
    },
    assignedTeacherIds: [],
    enrolledCount: 0,
    rating: 4.8,
    updatedAt: '2026-10-20',
    simulatorEnabledByAdmin: false,
    modules: [
      {
        id: 'mod-ui-1',
        title: 'Módulo 1: Fundamentos de Design Tokens y Atomic Design',
        description:
          'Estructura de fundamentos visuales: escala modular de tipografía, paletas semánticas y retículas.',
        lessons: [
          {
            id: 'les-ui-1',
            title: '1.1 Arquitectura de Tokens: Global vs Semántico',
            summary:
              'Definición de tokens primitivos y tokens con significado de contexto en aplicaciones multiplataforma.',
            durationMinutes: 19,
            type: 'video',
            simulatorEnabledByAdmin: false,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            resources: [],
          },
        ],
      },
    ],
  },
];

function getKvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/+$/, ''), token };
  }
  return null;
}

function getStorageMode(): 'kv' | 'vercel-ephemeral' | 'local-file' {
  if (getKvConfig()) return 'kv';
  if (process.env.VERCEL) return 'vercel-ephemeral';
  return 'local-file';
}

function getLocalDbCandidates(): string[] {
  const tmpFile = path.join(os.tmpdir(), 'cfp-agape-db.json');
  if (process.env.VERCEL) {
    return [tmpFile];
  }
  return [path.resolve(process.cwd(), '.data', 'cfp-agape-db.json'), tmpFile];
}

function createInitialState(): LmsPersistedState {
  return {
    users: structuredClone([SEED_MASTER_ADMIN]),
    courses: structuredClone(SEED_COURSES),
    instructors: [],
    progress: {},
    institutionalYouths: [],
    institutionalAttendance: [],
    institutionalLogs: [],
    updatedAt: new Date().toISOString(),
  };
}

function isMasterAdmin(user?: Pick<LmsAuthUser, 'email' | 'isMasterAdmin'> | null): boolean {
  if (!user) return false;
  return (
    user.isMasterAdmin === true ||
    String(user.email || '').trim().toLowerCase() === MASTER_ADMIN_EMAIL
  );
}

function isValidInstitutionalEmail(email: string): boolean {
  return String(email || '').trim().toLowerCase().endsWith('@campus.agape.edu.sv');
}

function ensureMasterAdmin(users: LmsAuthUser[]): LmsAuthUser[] {
  const list = Array.isArray(users) ? [...users] : [];
  const idx = list.findIndex(
    (u) => String(u.email || '').trim().toLowerCase() === MASTER_ADMIN_EMAIL
  );
  if (idx === -1) {
    return [structuredClone(SEED_MASTER_ADMIN), ...list];
  }
  const existing = list[idx];
  list[idx] = {
    ...existing,
    id: existing.id || SEED_MASTER_ADMIN.id,
    email: MASTER_ADMIN_EMAIL,
    role: 'admin',
    isActive: true,
    isMasterAdmin: true,
    password: existing.password || SEED_MASTER_ADMIN.password,
  };
  return list;
}

function normalizeState(raw: Partial<LmsPersistedState> | null | undefined): LmsPersistedState {
  const base = createInitialState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    users: ensureMasterAdmin(Array.isArray(raw.users) ? raw.users : base.users),
    courses: Array.isArray(raw.courses) && raw.courses.length > 0 ? raw.courses : base.courses,
    instructors: Array.isArray(raw.instructors) ? raw.instructors : base.instructors,
    progress: raw.progress && typeof raw.progress === 'object' ? raw.progress : {},
    institutionalYouths: Array.isArray(raw.institutionalYouths) ? raw.institutionalYouths : [],
    institutionalAttendance: Array.isArray(raw.institutionalAttendance)
      ? raw.institutionalAttendance
      : [],
    institutionalLogs: Array.isArray(raw.institutionalLogs) ? raw.institutionalLogs : [],
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

function sanitizeUser(user: LmsAuthUser): LmsAuthUser {
  const { password: _pwd, ...rest } = user;
  return rest;
}

function sanitizeUsers(users: LmsAuthUser[]): LmsAuthUser[] {
  return users.map(sanitizeUser);
}

async function readFromKv(kv: { url: string; token: string }): Promise<LmsPersistedState | null> {
  const res = await fetch(kv.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kv.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['GET', KV_KEY]),
  });
  if (!res.ok) throw new Error(`KV GET failed (${res.status})`);
  const data = (await res.json()) as { result?: string | null };
  if (!data || !data.result) return null;
  const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  return normalizeState(parsed);
}

async function writeToKv(kv: { url: string; token: string }, state: LmsPersistedState): Promise<void> {
  const res = await fetch(kv.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kv.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', KV_KEY, JSON.stringify(state)]),
  });
  if (!res.ok) throw new Error(`KV SET failed (${res.status})`);
}

async function readFromFile(): Promise<LmsPersistedState | null> {
  for (const filePath of getLocalDbCandidates()) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      if (!content.trim()) continue;
      return normalizeState(JSON.parse(content));
    } catch {
      continue;
    }
  }
  return null;
}

async function writeToFile(state: LmsPersistedState): Promise<void> {
  const json = JSON.stringify(state, null, 2);
  for (const filePath of getLocalDbCandidates()) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const tmpPath = `${filePath}.tmp-${Date.now()}`;
      await fs.writeFile(tmpPath, json, 'utf-8');
      try {
        await fs.rename(tmpPath, filePath);
      } catch {
        await fs.writeFile(filePath, json, 'utf-8');
        await fs.unlink(tmpPath).catch(() => undefined);
      }
      return;
    } catch {
      continue;
    }
  }
}

let cachedState: LmsPersistedState | null = null;
let operationQueue: Promise<unknown> = Promise.resolve();

function runSerialized<T>(task: () => Promise<T>): Promise<T> {
  const next = operationQueue.then(task, task);
  operationQueue = next.catch(() => undefined);
  return next;
}

async function readLmsState(): Promise<LmsPersistedState> {
  return runSerialized(async () => {
    const kv = getKvConfig();
    if (kv) {
      try {
        const kvState = await readFromKv(kv);
        if (kvState) {
          cachedState = kvState;
          return kvState;
        }
        const seeded = cachedState ? normalizeState(cachedState) : createInitialState();
        await writeToKv(kv, seeded);
        cachedState = seeded;
        return seeded;
      } catch (err) {
        console.warn('[CFP AGAPE Store] KV read fallback:', err);
      }
    }

    const fileState = await readFromFile();
    if (fileState) {
      cachedState = fileState;
      return fileState;
    }

    const seeded = cachedState ? normalizeState(cachedState) : createInitialState();
    await writeToFile(seeded).catch(() => undefined);
    cachedState = seeded;
    return seeded;
  });
}

async function mutateLmsState<T>(
  mutator: (current: LmsPersistedState) => { nextState: LmsPersistedState; result: T }
): Promise<T> {
  return runSerialized(async () => {
    const kv = getKvConfig();
    let current: LmsPersistedState | null = null;
    if (kv) {
      try {
        current = await readFromKv(kv);
      } catch (err) {
        console.warn('[CFP AGAPE Store] KV read before mutate failed:', err);
      }
    }
    if (!current) {
      current = await readFromFile();
    }
    if (!current) {
      current = cachedState ? normalizeState(cachedState) : createInitialState();
    }

    const { nextState, result } = mutator(current);
    const normalized: LmsPersistedState = {
      ...normalizeState(nextState),
      updatedAt: new Date().toISOString(),
    };
    cachedState = normalized;

    if (kv) {
      await writeToKv(kv, normalized).catch((err) =>
        console.warn('[CFP AGAPE Store] KV write fallback:', err)
      );
    } else {
      await writeToFile(normalized).catch(() => undefined);
    }

    return result;
  });
}

type AuthUser = LmsAuthUser;
type Course = any;
type Instructor = any;
type StudentProgress = any;

// -------------------------------------------------------------
// 0. API: Persistencia Centralizada LMS (Multi-navegador / Multi-dispositivo)
// -------------------------------------------------------------
app.get('/api/lms/state', async (_req: Request, res: Response) => {
  try {
    const state = await readLmsState();
    return res.json({
      users: sanitizeUsers(state.users),
      courses: state.courses,
      instructors: state.instructors,
      progress: state.progress,
      institutionalYouths: state.institutionalYouths,
      institutionalAttendance: state.institutionalAttendance,
      institutionalLogs: state.institutionalLogs,
      updatedAt: state.updatedAt,
      storageMode: getStorageMode(),
    });
  } catch (error) {
    console.error('Error reading LMS state:', error);
    return res.status(500).json({ error: 'No se pudo cargar el estado de la plataforma.' });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    ok: true,
    storageMode: getStorageMode(),
    vercel: Boolean(process.env.VERCEL),
  });
});

app.post('/api/lms/login', async (req: Request, res: Response) => {
  const storageMode = getStorageMode();
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!isValidInstitutionalEmail(email)) {
      return res.status(403).json({
        success: false,
        storageMode,
        message:
          'Acceso Denegado: Solo se permite el ingreso con cuentas institucionales @campus.agape.edu.sv.',
      });
    }

    if (!password.trim()) {
      return res.status(400).json({
        success: false,
        storageMode,
        message: 'Debes ingresar tu contraseña institucional asignada.',
      });
    }

    const state = await readLmsState();
    const user = state.users.find((u) => u.email.trim().toLowerCase() === email);

    if (!user) {
      return res.status(404).json({
        success: false,
        storageMode,
        message:
          'Cuenta no registrada en el sistema. Solicita tu alta a la Administración del CFP ÁGAPE.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        storageMode,
        message:
          'Tu cuenta se encuentra suspendida. Comunícate con Coordinación Académica del CFP ÁGAPE.',
      });
    }

    const storedPassword = String(user.password || '');
    const passwordMatches =
      storedPassword === password ||
      (storedPassword === storedPassword.trim() && storedPassword === password.trim());

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        storageMode,
        message: 'Contraseña incorrecta. Verifica tus credenciales e intenta nuevamente.',
      });
    }

    return res.json({
      success: true,
      storageMode,
      user: sanitizeUser(user),
      state: {
        users: sanitizeUsers(state.users),
        courses: state.courses,
        instructors: state.instructors,
        progress: state.progress,
        institutionalYouths: state.institutionalYouths,
        institutionalAttendance: state.institutionalAttendance,
        institutionalLogs: state.institutionalLogs,
        updatedAt: state.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error during LMS login:', error);
    return res.status(500).json({
      success: false,
      storageMode,
      message: 'Error interno al validar credenciales en el servidor.',
    });
  }
});

app.post('/api/lms/users/upsert', async (req: Request, res: Response) => {
  try {
    const incomingUser = req.body?.user as AuthUser | undefined;
    const isCreate = Boolean(req.body?.isCreate);
    const assignCourseIds = Array.isArray(req.body?.assignCourseIds)
      ? (req.body.assignCourseIds as string[])
      : undefined;

    if (!incomingUser || !incomingUser.id || !incomingUser.email) {
      return res.status(400).json({ success: false, message: 'Datos de usuario inválidos.' });
    }

    const cleanEmail = incomingUser.email.trim().toLowerCase();
    if (!isValidInstitutionalEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'El correo debe pertenecer al dominio @campus.agape.edu.sv.',
      });
    }

    const outcome = await mutateLmsState<{
      success: boolean;
      message?: string;
      user?: AuthUser;
      users?: AuthUser[];
      instructors?: Instructor[];
      courses?: Course[];
    }>((current) => {
      const existingById = current.users.find((u) => u.id === incomingUser.id);
      const duplicateByEmail = current.users.find(
        (u) => u.id !== incomingUser.id && u.email.trim().toLowerCase() === cleanEmail
      );

      if (duplicateByEmail) {
        return {
          nextState: current,
          result: {
            success: false,
            message: 'Ya existe una cuenta registrada con ese correo institucional.',
          },
        };
      }

      if (isCreate && !existingById) {
        if (!incomingUser.password || incomingUser.password.trim().length < 6) {
          return {
            nextState: current,
            result: {
              success: false,
              message: 'La contraseña asignada debe tener al menos 6 caracteres.',
            },
          };
        }

        const createdUser: AuthUser = {
          ...incomingUser,
          email: cleanEmail,
          isMasterAdmin: false,
          isActive: incomingUser.isActive ?? true,
        };

        const nextUsers = [createdUser, ...current.users];
        let nextInstructors = current.instructors;
        let nextCourses = current.courses;

        if (createdUser.role === 'instructor') {
          const newInst: Instructor = {
            id: createdUser.id,
            name: createdUser.name,
            specialty: createdUser.specialty || 'Especialidad Técnica',
            avatar: createdUser.avatar,
            email: cleanEmail,
            bio: `Docente del CFP ÁGAPE (${createdUser.specialty || 'Formación Profesional'}).`,
          };
          nextInstructors = [newInst, ...current.instructors.filter((i) => i.id !== createdUser.id)];

          if (assignCourseIds && assignCourseIds.length > 0) {
            nextCourses = current.courses.map((c) => {
              if (!assignCourseIds.includes(c.id)) return c;
              const teachers = c.assignedTeacherIds || [];
              if (teachers.includes(createdUser.id)) return c;
              return { ...c, assignedTeacherIds: [...teachers, createdUser.id] };
            });
          }
        }

        return {
          nextState: {
            ...current,
            users: nextUsers,
            instructors: nextInstructors,
            courses: nextCourses,
          },
          result: {
            success: true,
            user: sanitizeUser(createdUser),
            users: sanitizeUsers(nextUsers),
            instructors: nextInstructors,
            courses: nextCourses,
          },
        };
      }

      if (!existingById) {
        return {
          nextState: current,
          result: { success: false, message: 'Usuario no encontrado.' },
        };
      }

      const masterProtected = isMasterAdmin(existingById);
      const updatedUser: AuthUser = {
        ...existingById,
        ...incomingUser,
        email: masterProtected ? existingById.email : cleanEmail,
        password: incomingUser.password ? incomingUser.password : existingById.password,
        isMasterAdmin: masterProtected ? true : existingById.isMasterAdmin,
        role: masterProtected ? 'admin' : incomingUser.role || existingById.role,
        isActive: masterProtected ? true : incomingUser.isActive ?? existingById.isActive,
      };

      const nextUsers = current.users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      let nextInstructors = current.instructors;
      if (updatedUser.role === 'instructor') {
        const existsInst = nextInstructors.some((i) => i.id === updatedUser.id);
        if (!existsInst) {
          nextInstructors = [
            {
              id: updatedUser.id,
              name: updatedUser.name,
              specialty: updatedUser.specialty || 'Especialidad Técnica',
              avatar: updatedUser.avatar,
              email: updatedUser.email,
            },
            ...nextInstructors,
          ];
        } else {
          nextInstructors = nextInstructors.map((i) =>
            i.id === updatedUser.id
              ? {
                  ...i,
                  name: updatedUser.name,
                  specialty: updatedUser.specialty || i.specialty,
                  avatar: updatedUser.avatar,
                  email: updatedUser.email,
                }
              : i
          );
        }
      }

      return {
        nextState: {
          ...current,
          users: nextUsers,
          instructors: nextInstructors,
        },
        result: {
          success: true,
          user: sanitizeUser(updatedUser),
          users: sanitizeUsers(nextUsers),
          instructors: nextInstructors,
        },
      };
    });

    if (!outcome.success) {
      return res.status(400).json(outcome);
    }
    return res.json(outcome);
  } catch (error) {
    console.error('Error in /api/lms/users/upsert:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar usuario en el servidor.' });
  }
});

app.post('/api/lms/users/reset-password', async (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId || '');
    const newPassword = String(req.body?.newPassword || '').trim();
    const actorEmail = String(req.body?.actorEmail || '').trim().toLowerCase();

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
    }

    const outcome = await mutateLmsState<{ success: boolean; message?: string }>((current) => {
      const target = current.users.find((u) => u.id === userId);
      if (!target) {
        return { nextState: current, result: { success: false, message: 'Usuario no encontrado.' } };
      }
      if (isMasterAdmin(target) && actorEmail && actorEmail !== 'cursosenlinea@campus.agape.edu.sv') {
        return {
          nextState: current,
          result: {
            success: false,
            message: 'Solo el Super Administrador Maestro puede modificar su propia contraseña.',
          },
        };
      }

      const nextUsers = current.users.map((u) =>
        u.id === userId ? { ...u, password: newPassword } : u
      );
      return {
        nextState: { ...current, users: nextUsers },
        result: { success: true },
      };
    });

    if (!outcome.success) {
      return res.status(400).json(outcome);
    }
    return res.json(outcome);
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ success: false, message: 'Error al restablecer contraseña.' });
  }
});

app.post('/api/lms/users/toggle-status', async (req: Request, res: Response) => {
  try {
    const userId = String(req.body?.userId || '');
    const outcome = await mutateLmsState<{
      success: boolean;
      message?: string;
      users?: AuthUser[];
    }>((current) => {
      const target = current.users.find((u) => u.id === userId);
      if (!target) {
        return { nextState: current, result: { success: false, message: 'Usuario no encontrado.' } };
      }
      if (isMasterAdmin(target)) {
        return {
          nextState: current,
          result: {
            success: false,
            message:
              'Protección de Seguridad: La cuenta Super Administrador Maestro no puede ser desactivada.',
          },
        };
      }
      const nextUsers = current.users.map((u) =>
        u.id === userId ? { ...u, isActive: u.isActive === false ? true : false } : u
      );
      return {
        nextState: { ...current, users: nextUsers },
        result: { success: true, users: sanitizeUsers(nextUsers) },
      };
    });

    if (!outcome.success) {
      return res.status(400).json(outcome);
    }
    return res.json(outcome);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({ success: false, message: 'Error al cambiar estado del usuario.' });
  }
});

app.delete('/api/lms/users/:userId', async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId || '');
    const outcome = await mutateLmsState<{
      success: boolean;
      message?: string;
      users?: AuthUser[];
    }>((current) => {
      const target = current.users.find((u) => u.id === userId);
      if (!target) {
        return { nextState: current, result: { success: false, message: 'Usuario no encontrado.' } };
      }
      if (isMasterAdmin(target)) {
        return {
          nextState: current,
          result: {
            success: false,
            message:
              'Protección de Seguridad: La cuenta Super Administrador Maestro es inamovible y no puede ser eliminada.',
          },
        };
      }

      const nextUsers = current.users.filter((u) => u.id !== userId);
      const nextInstructors = current.instructors.filter((i) => i.id !== userId);
      const nextCourses = current.courses.map((c) => ({
        ...c,
        assignedTeacherIds: (c.assignedTeacherIds || []).filter((id: string) => id !== userId),
      }));

      return {
        nextState: {
          ...current,
          users: nextUsers,
          instructors: nextInstructors,
          courses: nextCourses,
        },
        result: { success: true, users: sanitizeUsers(nextUsers) },
      };
    });

    if (!outcome.success) {
      return res.status(400).json(outcome);
    }
    return res.json(outcome);
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar usuario.' });
  }
});

app.post('/api/lms/users/bulk-enroll', async (req: Request, res: Response) => {
  try {
    const newStudents = Array.isArray(req.body?.newStudents)
      ? (req.body.newStudents as AuthUser[])
      : [];
    const existingEnrollments = Array.isArray(req.body?.existingEnrollments)
      ? (req.body.existingEnrollments as { userId: string; courseId: string }[])
      : [];

    const users = await mutateLmsState<AuthUser[]>((current) => {
      let nextUsers = [...current.users];

      for (const item of existingEnrollments) {
        nextUsers = nextUsers.map((u) => {
          if (u.id !== item.userId) return u;
          const cur = u.enrolledCourseIds || [];
          if (cur.includes(item.courseId)) return u;
          return { ...u, enrolledCourseIds: [...cur, item.courseId] };
        });
      }

      for (const st of newStudents) {
        const cleanEmail = st.email?.trim().toLowerCase();
        if (!cleanEmail || !isValidInstitutionalEmail(cleanEmail)) continue;
        if (nextUsers.some((u) => u.email.trim().toLowerCase() === cleanEmail)) continue;
        nextUsers = [{ ...st, email: cleanEmail }, ...nextUsers];
      }

      return {
        nextState: { ...current, users: nextUsers },
        result: sanitizeUsers(nextUsers),
      };
    });

    return res.json({ success: true, users });
  } catch (error) {
    console.error('Error in bulk-enroll:', error);
    return res.status(500).json({ success: false, message: 'Error en matrícula masiva.' });
  }
});

app.put('/api/lms/courses-state', async (req: Request, res: Response) => {
  try {
    const courses = Array.isArray(req.body?.courses) ? (req.body.courses as Course[]) : undefined;
    const instructors = Array.isArray(req.body?.instructors)
      ? (req.body.instructors as Instructor[])
      : undefined;

    await mutateLmsState((current) => ({
      nextState: {
        ...current,
        courses: courses ?? current.courses,
        instructors: instructors ?? current.instructors,
      },
      result: true,
    }));

    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving courses state:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar cursos.' });
  }
});

app.put('/api/lms/progress', async (req: Request, res: Response) => {
  try {
    const key = String(req.body?.key || '');
    const entry = req.body?.entry as StudentProgress | undefined;
    if (!key || !entry) {
      return res.status(400).json({ success: false, message: 'Datos de progreso inválidos.' });
    }

    await mutateLmsState((current) => ({
      nextState: {
        ...current,
        progress: {
          ...current.progress,
          [key]: entry,
        },
      },
      result: true,
    }));

    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving progress:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar progreso.' });
  }
});

app.post('/api/lms/migrate-local', async (req: Request, res: Response) => {
  try {
    const localUsers = Array.isArray(req.body?.users) ? (req.body.users as AuthUser[]) : [];
    const localCourses = Array.isArray(req.body?.courses) ? (req.body.courses as Course[]) : [];
    const localInstructors = Array.isArray(req.body?.instructors)
      ? (req.body.instructors as Instructor[])
      : [];
    const localProgress =
      req.body?.progress && typeof req.body.progress === 'object'
        ? (req.body.progress as Record<string, StudentProgress>)
        : {};

    const merged = await mutateLmsState((current) => {
      // Only auto-merge local users if the server still only has the Master Admin
      const serverEmails = new Set(current.users.map((u) => u.email.trim().toLowerCase()));
      const extraLocalUsers = localUsers.filter(
        (u) =>
          u.email &&
          isValidInstitutionalEmail(u.email) &&
          !serverEmails.has(u.email.trim().toLowerCase()) &&
          Boolean(u.password)
      );

      const nextUsers =
        current.users.length <= 1 && extraLocalUsers.length > 0
          ? [...extraLocalUsers, ...current.users]
          : current.users;

      const existingInstIds = new Set(current.instructors.map((i) => i.id));
      const extraInst = localInstructors.filter((i) => i.id && !existingInstIds.has(i.id));
      const nextInstructors =
        current.instructors.length === 0 && extraInst.length > 0
          ? extraInst
          : current.instructors;

      const nextCourses =
        current.users.length <= 1 && extraLocalUsers.length > 0 && localCourses.length > 0
          ? localCourses
          : current.courses;

      const nextProgress =
        Object.keys(current.progress).length === 0 && Object.keys(localProgress).length > 0
          ? localProgress
          : current.progress;

      const nextState = {
        ...current,
        users: nextUsers,
        instructors: nextInstructors,
        courses: nextCourses,
        progress: nextProgress,
      };

      return {
        nextState,
        result: {
          users: sanitizeUsers(nextState.users),
          courses: nextState.courses,
          instructors: nextState.instructors,
          progress: nextState.progress,
          institutionalYouths: nextState.institutionalYouths,
          institutionalAttendance: nextState.institutionalAttendance,
          institutionalLogs: nextState.institutionalLogs,
        },
      };
    });

    return res.json({ success: true, ...merged });
  } catch (error) {
    console.error('Error in /api/lms/migrate-local:', error);
    return res.status(500).json({ success: false });
  }
});

// -------------------------------------------------------------
// 0.1 API: Gestión Institucional / Coordinación (Jóvenes, Asistencia y Bitácora)
// -------------------------------------------------------------
app.post('/api/lms/institutional/youths/upsert', async (req: Request, res: Response) => {
  try {
    const youth = req.body?.youth as Record<string, any> | undefined;
    if (!youth || !youth.id || !youth.fullName) {
      return res.status(400).json({ success: false, message: 'Datos de expediente inválidos.' });
    }

    const institutionalYouths = await mutateLmsState<any[]>((current) => {
      const exists = current.institutionalYouths.some((y: any) => y.id === youth.id);
      const nextYouths = exists
        ? current.institutionalYouths.map((y: any) => (y.id === youth.id ? youth : y))
        : [youth, ...current.institutionalYouths];
      return {
        nextState: { ...current, institutionalYouths: nextYouths },
        result: nextYouths,
      };
    });

    return res.json({ success: true, institutionalYouths });
  } catch (error) {
    console.error('Error saving institutional youth:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar expediente.' });
  }
});

app.delete('/api/lms/institutional/youths/:youthId', async (req: Request, res: Response) => {
  try {
    const youthId = String(req.params.youthId || '');
    const institutionalYouths = await mutateLmsState<any[]>((current) => {
      const nextYouths = current.institutionalYouths.filter((y: any) => y.id !== youthId);
      return {
        nextState: { ...current, institutionalYouths: nextYouths },
        result: nextYouths,
      };
    });

    return res.json({ success: true, institutionalYouths });
  } catch (error) {
    console.error('Error deleting institutional youth:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar expediente.' });
  }
});

app.post('/api/lms/institutional/attendance/save', async (req: Request, res: Response) => {
  try {
    const session = req.body?.session as Record<string, any> | undefined;
    if (!session || !session.id || !session.workshop || !session.date) {
      return res.status(400).json({ success: false, message: 'Sesión de asistencia inválida.' });
    }

    const institutionalAttendance = await mutateLmsState<any[]>((current) => {
      const exists = current.institutionalAttendance.some((s: any) => s.id === session.id);
      const nextAttendance = exists
        ? current.institutionalAttendance.map((s: any) => (s.id === session.id ? session : s))
        : [session, ...current.institutionalAttendance];
      return {
        nextState: { ...current, institutionalAttendance: nextAttendance },
        result: nextAttendance,
      };
    });

    return res.json({ success: true, institutionalAttendance });
  } catch (error) {
    console.error('Error saving institutional attendance:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar asistencia.' });
  }
});

app.post('/api/lms/institutional/logs/add', async (req: Request, res: Response) => {
  try {
    const entry = req.body?.entry as Record<string, any> | undefined;
    if (!entry || !entry.id || !entry.title) {
      return res.status(400).json({ success: false, message: 'Registro de bitácora inválido.' });
    }

    const institutionalLogs = await mutateLmsState<any[]>((current) => {
      const nextLogs = [entry, ...current.institutionalLogs.filter((l: any) => l.id !== entry.id)];
      return {
        nextState: { ...current, institutionalLogs: nextLogs },
        result: nextLogs,
      };
    });

    return res.json({ success: true, institutionalLogs });
  } catch (error) {
    console.error('Error adding institutional log:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar bitácora.' });
  }
});

app.delete('/api/lms/institutional/logs/:logId', async (req: Request, res: Response) => {
  try {
    const logId = String(req.params.logId || '');
    const institutionalLogs = await mutateLmsState<any[]>((current) => {
      const nextLogs = current.institutionalLogs.filter((l: any) => l.id !== logId);
      return {
        nextState: { ...current, institutionalLogs: nextLogs },
        result: nextLogs,
      };
    });

    return res.json({ success: true, institutionalLogs });
  } catch (error) {
    console.error('Error deleting institutional log:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar registro.' });
  }
});


// Initialize GoogleGenAI server-side client
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// 1. API: Generar Explicación Teórica con IA (Docente)
// -------------------------------------------------------------
app.post('/api/gemini/generate-explanation', async (req: Request, res: Response) => {
  const { lessonTitle, moduleTitle, courseCategory, targetLevel } = req.body;

  const prompt = `Eres un docente e instructor técnico senior del Centro de Formación Profesional AGAPE (CFP AGAPE), especializado en formación técnica profesional y educación para el trabajo.
Redacta una explicación teórica completa, estructurada y pedagógica para la siguiente lección:
- Título de la Lección: "${lessonTitle || 'Introducción a Circuitos'}"
- Módulo: "${moduleTitle || 'Módulo 1: Fundamentos'}"
- Categoría Técnica: "${courseCategory || 'Electrónica & Mantenimiento'}"
- Nivel: "${targetLevel || 'Principiante'}"

La explicación debe incluir:
1. OBJETIVOS DE APRENDIZAJE (3 puntos claros)
2. FUNDAMENTOS TEÓRICOS Y CONCEPTOS CLAVE (con fórmulas o leyes técnicas pertinentes, ej. Ley de Ohm, Kirchhoff, polaridad, mediciones)
3. GUÍA PRÁCTICA DE LABORATORIO PASO A PASO (para realizar en protoboard o banco de trabajo en el taller del CFP AGAPE)
4. NORMAS DE SEGURIDAD Y PRECAUCIONES TÉCNICAS (EPP, uso correcto de instrumentación, prevención de cortocircuitos)

Responde en español con un tono profesional, claro, didáctico y motivador para estudiantes técnicos. No uses markdown excesivo; mantén párrafos claros y ordenados con guiones o numeración.`;

  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const response = await genAI.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
      });

      if (response && response.text) {
        return res.json({ text: response.text, source: 'gemini' });
      }
    }
  } catch (error) {
    console.warn('Error calling Gemini API for explanation, using technical fallback:', error);
  }

  // High-fidelity fallback if key is not configured or network issue
  const fallbackText = `OBJETIVOS DE APRENDIZAJE:
1. Comprender la relación fundamental de la Ley de Ohm: Voltaje (V) = Corriente (I) × Resistencia (R).
2. Distinguir el comportamiento de componentes pasivos (resistores, capacitores, inductores) y activos (semiconductores) en corriente continua (DC).
3. Dominar la medición segura de magnitudes eléctricas con multímetro digital calibrado en el banco de trabajo del CFP AGAPE.

FUNDAMENTOS TEÓRICOS Y CONCEPTOS CLAVE:
- Tensión Eléctrica (V): Diferencia de potencial que impulsa los electrones a través del conductor; medida en Voltios (V).
- Intensidad de Corriente (I): Flujo de carga eléctrica por unidad de tiempo; medido en Amperios (A) o miliamperios (mA).
- Resistencia Eléctrica (R): Oposición que presenta un material al paso de la corriente; medida en Ohmios (Ω). Código de 4 bandas (ej. Marrón-Negro-Rojo-Oro = 1kΩ ±5%).
- Ley de Kirchhoff de Corrientes (LKC): La suma algebraica de corrientes que entran a un nodo es igual a la suma de las corrientes que salen.

GUÍA PRÁCTICA DE LABORATORIO PASO A PASO (TALLER AGAPE):
- Paso 1: Configurar la fuente de alimentación regulada a 5.0 V DC con limitación de corriente a 200 mA.
- Paso 2: Conectar en el riel central del protoboard un resistor de 330 Ω (Naranja-Naranja-Marrón) en serie con el ánodo de un diodo LED difuso de 5 mm.
- Paso 3: Cerrar el circuito hacia la referencia de masa (GND) mediante un pulsador normalmente abierto.
- Paso 4: Encender la fuente, presionar el pulsador y verificar la caída de tensión en el LED con las puntas del multímetro (~1.9V a 2.1V para LED rojo estándar).
- Paso 5: Registrar en la libreta técnica de laboratorio las mediciones de corriente en serie intercalando el multímetro en modo mA.

NORMAS DE SEGURIDAD Y PRECAUCIONES TÉCNICAS:
- Siempre desconectar la alimentación antes de insertar o remover componentes en el protoboard.
- Respetar la polaridad de capacitores electrolíticos y diodos para evitar averías térmicas.
- Utilizar gafas de seguridad al cortar terminales sobrantes de componentes con el alicate de corte diagonal.`;

  return res.json({ text: fallbackText, source: 'fallback' });
});

// -------------------------------------------------------------
// 2. API: Generar Práctica / Taller con IA (Docente)
// -------------------------------------------------------------
app.post('/api/gemini/generate-practice', async (req: Request, res: Response) => {
  const { lessonTitle, moduleTitle, courseTitle } = req.body;

  const prompt = `Actúa como Coordinador Técnico Pedagógico del Centro de Formación Profesional AGAPE.
Genera una Asignación de Práctica de Taller / Laboratorio completa para:
- Curso: "${courseTitle || 'Técnico en Electrónica de Base'}"
- Módulo: "${moduleTitle || 'Módulo 1: Fundamentos'}"
- Lección: "${lessonTitle || 'Lección 1.1: Introducción a Circuitos'}"

Estructura requerida:
- TÍTULO DE LA PRÁCTICA:
- OBJETIVO DEL TALLER:
- LISTA DE MATERIALES E INSTRUMENTOS REQUERIDOS:
- PROCEDIMIENTO PRÁCTICO (4 a 5 pasos concretos de ejecución en taller):
- CRITERIOS DE EVALUACIÓN Y ENTREGA (qué debe entregar el estudiante, ej. reporte con fotos del circuito y mediciones):

Responde en español de forma directa y clara.`;

  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const response = await genAI.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
      });

      if (response && response.text) {
        return res.json({ practice: response.text, source: 'gemini' });
      }
    }
  } catch (error) {
    console.warn('Error calling Gemini API for practice, using technical fallback:', error);
  }

  const fallbackPractice = `PRÁCTICA N° 1: ENSAMBLAJE Y MEDICIÓN DE CIRCUITO RESISTIVO SERIE-PARALELO
OBJETIVO:
Comprobar experimentalmente la Ley de Ohm y la división de tensión en protoboard utilizando componentes reales e instrumentación de medición.

LISTA DE MATERIALES E INSTRUMENTACIÓN:
- 1 Protoboard estándar de 830 puntos.
- 1 Fuente DC variable (0-12V) o eliminador regulado de 9V.
- Resistores de carbón de 1/4W: 220Ω, 470Ω, 1kΩ y 2.2kΩ.
- 1 Multímetro digital con cables tipo banana-caimán.
- Cables jumpers macho-macho para protoboard.

PROCEDIMIENTO DE EJECUCIÓN:
1. Calcular teóricamente la resistencia equivalente total y la corriente esperada del circuito según el diagrama entregado.
2. Armar la red resistiva en el protoboard asegurando que las pistas no generen cortocircuitos involuntarios.
3. Conectar la fuente a 9.0 V y medir la tensión en cada resistor registrando los valores en la tabla de datos.
4. Medir la corriente total del circuito abriendo una rama e intercalando el multímetro en escala de corriente DC.
5. Comparar los valores calculados teóricamente contra los medidos y determinar el porcentaje de error experimental.

CRITERIOS DE ENTREGA Y EVALUACIÓN:
- Subir reporte técnico en formato PDF con la tabla de mediciones comparadas, fotografía clara del circuito ensamblado y conclusiones técnicas del taller.`;

  return res.json({ practice: fallbackPractice, source: 'fallback' });
});

// -------------------------------------------------------------
// 3. API: Generar Ejercicio Práctico Interactivo con IA (Estudiante)
// -------------------------------------------------------------
app.post('/api/gemini/generate-exercise', async (req: Request, res: Response) => {
  const { lessonTitle, explanationText } = req.body;

  const prompt = `Eres el tutor virtual interactivo del Centro de Formación Profesional AGAPE.
Genera un caso práctico o problema técnico interactivo para evaluar los conocimientos del alumno sobre la siguiente clase:
- Título: "${lessonTitle || 'Circuito Eléctrico y Mediciones'}"
- Contenido visto en clase: "${(explanationText || '').substring(0, 500)}"

Genera un JSON con esta estructura exacta (únicamente el JSON válido, sin bloques de código ni texto adicional):
{
  "title": "Título breve del ejercicio técnico",
  "scenario": "Descripción de una situación técnica real o problema en taller (ej. un circuito no enciende, se mide un voltaje anormal o se debe calcular un componente)",
  "question": "¿Cuál es la causa del fallo o el valor correcto a seleccionar?",
  "options": [
    "Opción A",
    "Opción B",
    "Opción C",
    "Opción D"
  ],
  "correctOptionIndex": 0,
  "explanation": "Explicación detallada de por qué esa opción es la correcta según las leyes técnicas y buenas prácticas de CFP AGAPE.",
  "hint": "Pista técnica para orientar al alumno si tiene dudas."
}`;

  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const response = await genAI.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
      });

      if (response && response.text) {
        // Strip markdown backticks if present
        let clean = response.text.trim();
        if (clean.startsWith('```json')) clean = clean.substring(7);
        if (clean.startsWith('```')) clean = clean.substring(3);
        if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
        clean = clean.trim();

        try {
          const parsed = JSON.parse(clean);
          return res.json({ exercise: parsed, source: 'gemini' });
        } catch {
          // If json parse failed, fall through to fallback
        }
      }
    }
  } catch (error) {
    console.warn('Error calling Gemini for exercise generation:', error);
  }

  // Reliable Fallback Exercise
  const fallbackExercise = {
    title: 'Diagnóstico de Caída de Tensión y Resistor Limitador',
    scenario:
      'En el taller de electrónica de CFP AGAPE, un aprendiz conecta un diodo LED rojo (caída típica de 2.0 V a 20 mA) a una fuente de alimentación de 12 V DC. Al energizar el circuito sin resistor limitador, el diodo emite un destello instantáneo y se quema de inmediato.',
    question:
      '¿Qué valor de resistor comercial debió conectarse en serie para alimentar el LED con seguridad a 20 mA desde los 12 V?',
    options: [
      '500 Ω (o valor estándar comercial más cercano de 510 Ω / 1/2W)',
      '100 Ω (provocaría sobrecorriente de más de 100 mA)',
      '10 kΩ (la corriente sería menor a 1 mA y el LED apenas iluminaría)',
      '22 Ω (la corriente excedería por mucho el límite térmico del semiconductor)',
    ],
    correctOptionIndex: 0,
    explanation:
      'Aplicando la Ley de Ohm: R = (V_fuente - V_led) / I = (12V - 2V) / 0.020A = 10V / 0.020A = 500 Ω. El valor comercial estándar de la serie E24 es 510 Ω. Con este resistor la corriente queda exactamente limitada a ~19.6 mA.',
    hint: 'Resta el voltaje del LED al voltaje total de la fuente antes de dividir entre los 20 mA (0.020 A).',
  };

  return res.json({ exercise: fallbackExercise, source: 'fallback' });
});

// -------------------------------------------------------------
// 4. API: Evaluar Respuesta del Alumno con Retroalimentación IA
// -------------------------------------------------------------
app.post('/api/gemini/evaluate-exercise', async (req: Request, res: Response) => {
  const { question, studentAnswer, correctAnswer, explanation } = req.body;

  const prompt = `Eres el tutor evaluador del Centro de Formación Profesional AGAPE.
Un estudiante ha respondido una pregunta técnica de evaluación práctica:
- Pregunta: "${question}"
- Respuesta elegida por el estudiante: "${studentAnswer}"
- Respuesta correcta esperada: "${correctAnswer}"
- Explicación base: "${explanation}"

Evalúa la respuesta y genera un JSON con esta estructura exacta (solo el JSON válido):
{
  "isCorrect": true/false,
  "score": 100 o 0 (o entre 0 y 100 si fue parcialmente acertada),
  "feedbackTitle": "¡Excelente Dominio Técnico! o Revisión de Conceptos Necesaria",
  "feedback": "Retroalimentación personalizada, constructiva y profesional en 2-3 oraciones que explique el porqué y felicite o indique qué repasar en los laboratorios de CFP AGAPE.",
  "keyRecommendation": "Consejo técnico puntual para su práctica en protoboard o banco de trabajo."
}`;

  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const response = await genAI.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
      });

      if (response && response.text) {
        let clean = response.text.trim();
        if (clean.startsWith('```json')) clean = clean.substring(7);
        if (clean.startsWith('```')) clean = clean.substring(3);
        if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
        clean = clean.trim();

        try {
          const parsed = JSON.parse(clean);
          return res.json({ evaluation: parsed, source: 'gemini' });
        } catch {
          // fall through
        }
      }
    }
  } catch (error) {
    console.warn('Error evaluating student exercise with Gemini:', error);
  }

  // Fallback evaluation
  const isMatch = studentAnswer?.trim() === correctAnswer?.trim();
  const fallbackEval = {
    isCorrect: isMatch,
    score: isMatch ? 100 : 0,
    feedbackTitle: isMatch ? '¡Excelente Razonamiento Técnico!' : 'Respuesta Incorrecta - Revisemos el Cálculo',
    feedback: isMatch
      ? 'Has aplicado correctamente la Ley de Ohm y considerado el voltaje umbral del diodo. Este criterio garantiza la durabilidad y estabilidad de los circuitos que ensambles en el taller.'
      : 'Ten en cuenta que para calcular la resistencia limitadora, primero debes restar la caída de tensión propia del componente activo (2.0V) de la tensión de la fuente (12V) antes de dividir por la corriente nominal.',
    keyRecommendation: isMatch
      ? 'En montajes industriales, siempre calcula también la potencia disipada: P = I² × R para seleccionar resistores de 1/4W, 1/2W o 1W.'
      : 'Repasa el código de colores de resistores y realiza la comprobación con el multímetro en el laboratorio presencial de CFP AGAPE.',
  };

  return res.json({ evaluation: fallbackEval, source: 'fallback' });
});

// -------------------------------------------------------------
// 5. API: Generar Laboratorio / Simulador Interactivo con IA (Docente)
// -------------------------------------------------------------
app.post('/api/gemini/generate-simulator', async (req: Request, res: Response) => {
  const {
    lessonTitle,
    moduleTitle,
    courseTitle,
    labType = 'interactive_practice',
    category = 'Formación Técnica',
    promptInstructions = '',
  } = req.body;

  const trimmedPrompt = (promptInstructions || '').trim();

  const typeDesc =
    labType === 'interactive_practice'
      ? 'Simulador Interactivo de Caso Práctico basado en estaciones secuenciales donde el estudiante analiza datos reales, redacta sus procedimientos, justifica decisiones y resuelve problemas abiertos.'
      : labType === 'case_scenario'
      ? 'Simulador de Casos Prácticos con toma de decisiones secuenciales, consecuencias en tiempo real y lecturas de instrumentación de taller.'
      : labType === 'diagnostic_test'
      ? 'Prueba / Test de Diagnóstico Técnico auto-evaluable con casos de estudio, preguntas analíticas de opción múltiple y retroalimentación técnica inmediata.'
      : 'Laboratorio de Pasos Guiados con lista interactiva de verificación (checklist), procedimientos de montaje en banco de trabajo y mediciones esperadas.';

  const prompt = `Eres el Director de Innovación Pedagógica y Laboratorios del Centro de Formación Profesional ÁGAPE (CFP ÁGAPE).
Crea un componente interactivo educativo de tipo "${labType}" (${typeDesc}) para:
- Curso: "${courseTitle || 'Programa Formativo CFP ÁGAPE'}"
- Módulo: "${moduleTitle || 'Módulo 1: Fundamentos'}"
- Lección: "${lessonTitle || 'Lección 1.1'}"
- Especialidad: "${category}"
${trimmedPrompt ? `- INDICACIONES DEL DOCENTE / ADMINISTRADOR (OBLIGATORIO SEGUIR AL PIE DE LA LETRA): "${trimmedPrompt}"` : ''}

Genera ÚNICAMENTE un objeto JSON válido (sin backticks de markdown ni texto introductorio) con esta estructura exacta según el tipo:

${
  labType === 'interactive_practice'
    ? `{
  "id": "sim-${Date.now()}",
  "title": "Simulador de Práctica Interactiva: [Título específico acorde a las indicaciones]",
  "type": "interactive_practice",
  "topic": "${lessonTitle || 'Práctica Aplicada'}",
  "authorPrompt": "${trimmedPrompt.replace(/"/g, '\\"')}",
  "scenarioDescription": "Descripción inmersiva del escenario o situación problemática real que enfrentará el estudiante.",
  "initialContextData": "Datos iniciales clave del caso (valores, registros, reporte del cliente, hoja de costos, lecturas o condiciones del entorno).",
  "initialInstrumentState": "Estado Inicial del Caso: En análisis | Condición: Listo para intervención",
  "toolsRequired": ["Herramienta o criterio 1", "Herramienta o criterio 2", "Herramienta o criterio 3"],
  "passingScore": 70,
  "learningOutcome": "Competencia profesional demostrada por el estudiante al completar las estaciones.",
  "stations": [
    {
      "id": "st-1",
      "stationNumber": 1,
      "title": "Estación 1: Análisis Inicial y Detección de Hallazgos",
      "stationType": "open_analysis",
      "prompt": "Pregunta o reto abierto donde el estudiante debe analizar los datos iniciales, identificar errores/fallas o describir su diagnóstico inicial.",
      "caseData": "Evidencia o registro específico observable en esta estación.",
      "expectedCriteria": "Criterios técnicos o conceptuales concretos que la respuesta del estudiante debe cubrir para ser evaluada como correcta.",
      "requiresWrittenResponse": true,
      "hint": "Pista pedagógica para orientar el análisis sin dar la respuesta literal."
    },
    {
      "id": "st-2",
      "stationNumber": 2,
      "title": "Estación 2: Decisión Operativa y Justificación",
      "stationType": "decision_and_justification",
      "prompt": "Situación de toma de decisión crítica donde el estudiante elige una ruta de acción y justifica por escrito su procedimiento.",
      "caseData": "Nueva información o reacción tras la etapa anterior.",
      "sampleOptions": [
        "Opción de acción A (profesional / segura / normativa)",
        "Opción de acción B (incompleta o riesgosa)",
        "Opción de acción C (incorrecta)"
      ],
      "expectedCriteria": "Elección de la alternativa adecuada y justificación fundamentada del porqué.",
      "requiresWrittenResponse": true,
      "hint": "Evalúa las consecuencias técnicas, de seguridad o de servicio de cada alternativa."
    },
    {
      "id": "st-3",
      "stationNumber": 3,
      "title": "Estación 3: Procedimiento de Resolución y Cierre",
      "stationType": "procedure_steps",
      "prompt": "Solicita al estudiante redactar paso a paso el procedimiento final de solución, corrección o verificación de calidad.",
      "caseData": "Condición previa al cierre del caso práctico.",
      "expectedCriteria": "Secuencia ordenada de pasos, medidas de verificación final y cumplimiento de estándares del CFP ÁGAPE.",
      "requiresWrittenResponse": true,
      "hint": "Ordena tus pasos de forma cronológica e incluye cómo comprobarías el resultado final."
    }
  ]
}`
    : labType === 'case_scenario'
    ? `{
  "id": "sim-${Date.now()}",
  "title": "Simulador de Caso Práctico: [Título descriptivo del problema]",
  "type": "case_scenario",
  "topic": "${lessonTitle || 'Diagnóstico de Circuito'}",
  "scenarioDescription": "Descripción inmersiva de la avería o desafío en el taller técnico del CFP AGAPE.",
  "initialInstrumentState": "Fuente DC: 12.0 V | Multímetro: 0.0 V (Sin salida) | Estado: Dispositivo Bloqueado",
  "toolsRequired": ["Multímetro Digital", "Puntas de Prueba", "Fuente Regulada", "Manual Técnico"],
  "passingScore": 70,
  "learningOutcome": "Habilidad adquirida por el estudiante al completar la simulación.",
  "steps": [
    {
      "stepNumber": 1,
      "stageTitle": "Paso 1: Diagnóstico Inicial y Aislamiento de Etapa",
      "situation": "Detalle de lo que observa el técnico al encender el banco de trabajo.",
      "options": [
        {
          "id": "opt-1",
          "actionText": "Acción técnica 1 (ej. Medir voltaje de entrada en bornes)",
          "consequenceText": "Consecuencia en tiempo real tras ejecutar la acción.",
          "isOptimal": true,
          "scoreImpact": 35,
          "instrumentReading": "Lectura: 12.0 V presentes. Alimentación principal correcta.",
          "technicalExplanation": "Justificación técnica del procedimiento."
        },
        {
          "id": "opt-2",
          "actionText": "Acción técnica 2 (ej. Reemplazar el fusible sin medir)",
          "consequenceText": "El fusible nuevo se funde instantáneamente.",
          "isOptimal": false,
          "scoreImpact": -10,
          "instrumentReading": "Lectura: 0.0 V | Alerta: Falla franca en etapa de carga.",
          "technicalExplanation": "Nunca se debe sustituir una protección sin antes verificar cortocircuitos."
        },
        {
          "id": "opt-3",
          "actionText": "Acción técnica 3 (Acción subóptima)",
          "consequenceText": "Consecuencia de la acción.",
          "isOptimal": false,
          "scoreImpact": 10,
          "instrumentReading": "Lectura: Parámetros indeterminados.",
          "technicalExplanation": "Explicación técnica."
        }
      ]
    },
    {
      "stepNumber": 2,
      "stageTitle": "Paso 2: Localización del Componente Dañado",
      "situation": "Situación tras el primer paso.",
      "options": [
        {
          "id": "opt-4",
          "actionText": "Acción técnica óptima",
          "consequenceText": "Resultado favorable con lectura normalizada.",
          "isOptimal": true,
          "scoreImpact": 35,
          "instrumentReading": "Lectura: Resistencia = 0.2 Ω en diodo D1 (Diodo en cortocircuito).",
          "technicalExplanation": "Se identifica el semiconductor con fallo de avalancha."
        },
        {
          "id": "opt-5",
          "actionText": "Acción incorrecta",
          "consequenceText": "Resultado erróneo.",
          "isOptimal": false,
          "scoreImpact": 0,
          "instrumentReading": "Lectura: Sin variación.",
          "technicalExplanation": "Explicación."
        }
      ]
    },
    {
      "stepNumber": 3,
      "stageTitle": "Paso 3: Reparación y Prueba de Carga Final",
      "situation": "Procedimiento de reemplazo y puesta a punto.",
      "options": [
        {
          "id": "opt-6",
          "actionText": "Sustituir componente por especificación idéntica y energizar progresivamente",
          "consequenceText": "El circuito entra en operación nominal estable a 5.0 V / 450 mA.",
          "isOptimal": true,
          "scoreImpact": 30,
          "instrumentReading": "Lectura: Vout = 5.02 V | Corriente = 420 mA | Estado: Operativo",
          "technicalExplanation": "Prueba de banco superada con éxito según normas CFP AGAPE."
        },
        {
          "id": "opt-7",
          "actionText": "Puente con alambre de cobre para saltar la protección",
          "consequenceText": "Se daña el transformador por falta de protección.",
          "isOptimal": false,
          "scoreImpact": -30,
          "instrumentReading": "Lectura: Humo y sobrecalentamiento crítico.",
          "technicalExplanation": "Infracción grave a las normas de seguridad de taller."
        }
      ]
    }
  ]
}`
    : labType === 'diagnostic_test'
    ? `{
  "id": "sim-${Date.now()}",
  "title": "Prueba de Diagnóstico Técnico: [Tema]",
  "type": "diagnostic_test",
  "topic": "${lessonTitle || 'Diagnóstico Técnico'}",
  "scenarioDescription": "Caso de estudio de taller para evaluar la capacidad de deducción técnica del alumno.",
  "passingScore": 75,
  "learningOutcome": "Capacidad analítica para deducir anomalías eléctricas.",
  "questions": [
    {
      "id": "dq-1",
      "question": "Enunciado de la primera pregunta técnica basada en síntomas reales",
      "options": ["Opción A (Correcta)", "Opción B", "Opción C", "Opción D"],
      "correctOptionIndex": 0,
      "technicalFeedback": "Retroalimentación técnica detallada sobre la solución correcta."
    },
    {
      "id": "dq-2",
      "question": "Segunda pregunta de cálculo o análisis de parámetros",
      "options": ["Opción A", "Opción B (Correcta)", "Opción C", "Opción D"],
      "correctOptionIndex": 1,
      "technicalFeedback": "Explicación de las fórmulas y fundamentos aplicados."
    },
    {
      "id": "dq-3",
      "question": "Tercera pregunta de diagnóstico de instrumentación",
      "options": ["Opción A", "Opción B", "Opción C (Correcta)", "Opción D"],
      "correctOptionIndex": 2,
      "technicalFeedback": "Criterio de medición correcto en el CFP AGAPE."
    }
  ]
}`
    : `{
  "id": "sim-${Date.now()}",
  "title": "Laboratorio de Taller Guiado: [Tema]",
  "type": "guided_workshop",
  "topic": "${lessonTitle || 'Práctica Guiada'}",
  "scenarioDescription": "Guía práctica interactiva de taller con verificación de pasos y mediciones en banco de trabajo.",
  "toolsRequired": ["Protoboard", "Multímetro Digital", "Fuente de Tensión Regulada", "Cables Puente"],
  "passingScore": 80,
  "learningOutcome": "Dominio de la secuencia de montaje y verificación de laboratorio.",
  "workshopSteps": [
    {
      "id": "ws-1",
      "stepNumber": 1,
      "checklistLabel": "Inspección de seguridad y desconexión de energía",
      "instruction": "Comprobar que la llave general de la mesa de trabajo esté desenergizada antes de iniciar el conexionado.",
      "warningAlert": "No manipular herramientas con manos húmedas ni calzado no aislante.",
      "expectedMeasurement": "Lectura en bornes: 0.00 V AC/DC"
    },
    {
      "id": "ws-2",
      "stepNumber": 2,
      "checklistLabel": "Montaje de componentes pasivos en protoboard",
      "instruction": "Insertar los resistores asegurando que las terminales queden firmes en la misma columna de 5 orificios.",
      "expectedMeasurement": "Resistencia total calculada: 1.5 kΩ ±5%"
    },
    {
      "id": "ws-3",
      "stepNumber": 3,
      "checklistLabel": "Calibración de la fuente de poder",
      "instruction": "Ajustar la perilla de voltaje fino a exactamente 5.0 V DC con limitador de corriente a 200 mA.",
      "warningAlert": "Verificar la escala del multímetro en Voltios DC antes de medir.",
      "expectedMeasurement": "Tensión regulada: 5.00 V ± 0.05 V"
    },
    {
      "id": "ws-4",
      "stepNumber": 4,
      "checklistLabel": "Medición de caídas de tensión por nodo",
      "instruction": "Colocar la punta negra en GND y la roja en cada nodo intermedio para registrar los valores de división resistiva.",
      "expectedMeasurement": "Nodo 1: 3.33 V | Nodo 2: 1.67 V"
    }
  ]
}`
}
`;

  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const response = await genAI.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
      });

      if (response && response.text) {
        let clean = response.text.trim();
        if (clean.startsWith('```json')) clean = clean.substring(7);
        if (clean.startsWith('```')) clean = clean.substring(3);
        if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
        clean = clean.trim();

        try {
          const parsed = JSON.parse(clean);
          return res.json({ simulator: parsed, source: 'gemini' });
        } catch {
          // fall through to high quality fallback
        }
      }
    }
  } catch (error) {
    console.warn('Error calling Gemini for simulator generation, using technical fallback:', error);
  }

  // High quality specialized fallback for each type
  let fallbackSimulator;
  const nowId = 'sim-' + Date.now();

  if (labType === 'interactive_practice') {
    const lowerPrompt = trimmedPrompt.toLowerCase();
    const isCustomerService = /cliente|recepci|atenci|servicio|queja|hospital/.test(lowerPrompt);
    const isBudget = /presupuest|contab|costo|excel|finanz|error.*ocult|hoja/.test(lowerPrompt);
    const isElectrical = /el[eé]ctric|circuito|voltaje|fallo|motor|tablero|mult[ií]metro/.test(lowerPrompt);

    if (isCustomerService) {
      fallbackSimulator = {
        id: nowId,
        title: `Simulador Interactivo: ${trimmedPrompt ? trimmedPrompt.slice(0, 68) : 'Atención al Cliente Difícil en Recepción'}`,
        type: 'interactive_practice',
        topic: lessonTitle || 'Atención al Cliente',
        authorPrompt: trimmedPrompt || 'Simula una atención al cliente difícil en recepción.',
        scenarioDescription:
          'Un usuario visiblemente molesto se acerca al área de recepción exigiendo un reembolso inmediato por un servicio que asegura fue entregado con retraso y sin explicación previa, elevando el tono de voz frente a otros visitantes.',
        initialContextData:
          'Registro en sistema: Orden #AG-408 | Estado: Retraso de 45 min por falla logística notificada por correo hace 2 horas | Política institucional: Reprogramación prioritaria o nota de crédito tras verificación de identidad.',
        initialInstrumentState: 'Nivel de Tensión: Alto | Otros clientes esperando: 3 | Protocolo Activo: Escucha Activa CFP ÁGAPE',
        toolsRequired: ['Protocolo de Escucha Activa', 'Bitácora de Recepción', 'Política de Garantía Institucional'],
        passingScore: 70,
        learningOutcome: 'Manejo asertivo de conflictos, contención emocional y resolución conforme a políticas institucionales.',
        stations: [
          {
            id: 'st-1',
            stationNumber: 1,
            title: 'Estación 1: Contención Inicial y Lenguaje Corporal',
            stationType: 'open_analysis',
            prompt:
              '¿Qué palabras iniciales exactas utilizarías en los primeros 20 segundos para desescalar la molestia del cliente sin ponerlo a la defensiva y proteger el ambiente de recepción?',
            caseData: 'El cliente golpea suavemente el mostrador diciendo: "¡Nadie me resuelve nada aquí y perdí toda mi mañana!"',
            expectedCriteria:
              'Saludo respetuoso, validación empática de la frustración sin discutir, invitación a conversar en tono calmo y solicitud amable de datos para revisar el caso.',
            requiresWrittenResponse: true,
            hint: 'Evita frases como "cálmese" o "no es nuestra culpa". Valida su tiempo y muestra disposición inmediata.',
          },
          {
            id: 'st-2',
            stationNumber: 2,
            title: 'Estación 2: Decisión de Manejo según Política',
            stationType: 'decision_and_justification',
            prompt:
              'Tras revisar el expediente (#AG-408), verificas que sí se envió aviso hace 2 horas, pero el cliente no revisó su correo. El cliente exige hablar con gerencia o recibir efectivo en el acto. Selecciona la ruta de acción y justifica tu criterio.',
            caseData: 'Caja chica de recepción no está autorizada para emitir reembolsos en efectivo sin autorización escrita.',
            sampleOptions: [
              'Explicar con transparencia el registro enviado, ofrecer solución inmediata (reprogramación VIP o trámite formal de nota de crédito en 24h) y documentar el caso.',
              'Discutir mostrando la pantalla del correo para demostrar que el cliente estaba equivocado.',
              'Entregar dinero de caja chica sin recibo para que el cliente se retire rápido.',
            ],
            expectedCriteria:
              'Selección de la alternativa transparente y ajustada a normativa, evitando confrontación y presentando opciones concretas de solución.',
            requiresWrittenResponse: true,
            hint: 'Nunca busques "ganar la discusión"; ofrece soluciones viables dentro del reglamento.',
          },
          {
            id: 'st-3',
            stationNumber: 3,
            title: 'Estación 3: Cierre del Caso y Registro Preventivo',
            stationType: 'procedure_steps',
            prompt:
              'Redacta paso a paso cómo cerrarías la atención con el cliente y qué registro dejarías en bitácora para evitar recurrencia.',
            caseData: 'El cliente acepta la alternativa propuesta y solicita comprobante del acuerdo.',
            expectedCriteria:
              'Confirmación escrita del acuerdo, entrega de comprobante/folio, despedida cordial, registro completo en bitácora y notificación al área operativa.',
            requiresWrittenResponse: true,
            hint: 'Incluye tanto la confirmación con el cliente como el seguimiento interno.',
          },
        ],
      };
    } else if (isBudget) {
      fallbackSimulator = {
        id: nowId,
        title: `Simulador Interactivo: ${trimmedPrompt ? trimmedPrompt.slice(0, 68) : 'Auditoría de Presupuesto con Errores Ocultos'}`,
        type: 'interactive_practice',
        topic: lessonTitle || 'Gestión Presupuestaria',
        authorPrompt: trimmedPrompt || 'Elaboración y auditoría de un presupuesto con errores ocultos.',
        scenarioDescription:
          'Recibes una hoja de presupuesto preliminar para un proyecto técnico del CFP ÁGAPE antes de enviarla a aprobación final. Contiene inconsistencias ocultas en cantidades, impuestos y fórmulas que podrían provocar un déficit financiero.',
        initialContextData:
          'Partida A (Materiales): 12 kits × $45.00 = $540.00 | Partida B (Mano de Obra): 30 hrs × $18.00 = $540.00 | Partida C (Imprevistos 10%): $54.00 | IVA (13% sobre subtotal): $140.40 | Total Reportado: $1,220.40',
        initialInstrumentState: 'Estado de Auditoría: Revisión Pendiente | Margen de Error Tolerado: 0%',
        toolsRequired: ['Calculadora / Hoja de Cálculo', 'Criterios Fiscales (IVA 13%)', 'Matriz de Costos Directos'],
        passingScore: 70,
        learningOutcome: 'Detección precisa de errores aritméticos, omisiones porcentuales y corrección de presupuestos reales.',
        stations: [
          {
            id: 'st-1',
            stationNumber: 1,
            title: 'Estación 1: Detección de Errores Ocultos',
            stationType: 'open_analysis',
            prompt:
              'Analiza los datos iniciales del presupuesto y enumera exactamente qué errores aritméticos o conceptuales detectas en las partidas y en el cálculo del total.',
            caseData: 'Observa el cálculo de Imprevistos (10%) y la suma de Subtotal + IVA.',
            expectedCriteria:
              'Identificar que el 10% de imprevistos sobre $1,080 es $108.00 (no $54.00 que equivale solo al 5%), y que el Total correcto incluyendo imprevistos e IVA cambia sustancialmente.',
            requiresWrittenResponse: true,
            hint: 'Suma Materiales + Mano de Obra ($540 + $540 = $1,080) y verifica si el 10% de imprevistos corresponde a $54.00.',
          },
          {
            id: 'st-2',
            stationNumber: 2,
            title: 'Estación 2: Decisión sobre Base Imponible e Imprevistos',
            stationType: 'decision_and_justification',
            prompt:
              'El coordinador te pide presentar la corrección antes de la reunión. Elige el criterio contable correcto y justifica cómo afecta el flujo de caja del proyecto.',
            caseData: 'Si no se corrige el error, el proyecto arrancaría con fondos insuficientes para contingencias e impuestos.',
            sampleOptions: [
              'Recalcular Subtotal base ($1,080), ajustar imprevistos al 10% ($108.00) -> Base $1,188.00, aplicar IVA 13% según normativa y emitir tabla corregida con nota aclaratoria.',
              'Dejar el monto en $1,220.40 para no incomodar al comité y cubrir la diferencia después.',
              'Eliminar la partida de imprevistos para que el total coincida con el monto reportado.',
            ],
            expectedCriteria:
              'Elección del recálculo transparente completo, justificando la integridad financiera y cumplimiento fiscal.',
            requiresWrittenResponse: true,
            hint: 'Nunca ocultes un déficit; documenta el ajuste técnico antes de aprobar.',
          },
          {
            id: 'st-3',
            stationNumber: 3,
            title: 'Estación 3: Procedimiento de Validación en Hoja de Cálculo',
            stationType: 'procedure_steps',
            prompt:
              'Describe los pasos y fórmulas de verificación que implementarías en una hoja de cálculo para evitar futuros errores manuales en presupuestos.',
            caseData: 'Se requiere estandarizar la plantilla para otros cursos del CFP ÁGAPE.',
            expectedCriteria:
              'Uso de fórmulas dinámicas (=SUMA, referencia a celdas de tasa de IVA e imprevistos), validación de datos, bloqueo de celdas formuladas y revisión cruzada.',
            requiresWrittenResponse: true,
            hint: 'Menciona el uso de celdas de parámetros y fórmulas dinámicas en lugar de números digitados a mano.',
          },
        ],
      };
    } else if (isElectrical || !trimmedPrompt) {
      fallbackSimulator = {
        id: nowId,
        title: `Simulador Interactivo: ${trimmedPrompt ? trimmedPrompt.slice(0, 68) : `Práctica de Diagnóstico en ${lessonTitle || 'Taller Eléctrico'}`}`,
        type: 'interactive_practice',
        topic: lessonTitle || 'Diagnóstico Eléctrico Paso a Paso',
        authorPrompt: trimmedPrompt || 'Diagnóstico paso a paso de un fallo eléctrico en banco de trabajo.',
        scenarioDescription:
          'En el banco de pruebas del CFP ÁGAPE, un tablero didáctico de alimentación monofásica presenta disparo intermitente de la protección térmica a los 10 segundos de conectar la carga nominal.',
        initialContextData:
          'Tensión en entrada principal: 120.4 V AC | Corriente nominal esperada: 4.5 A | Corriente medida antes del disparo: 11.8 A | Temperatura en borne L1: 68 °C.',
        initialInstrumentState: 'Breaker: Disparado (OFF) | Multímetro: Listo | Pinza Amperimétrica: En espera',
        toolsRequired: ['Multímetro Digital', 'Pinza Amperimétrica', 'Equipo de Protección Personal (EPP)', 'Esquema Unifilar'],
        passingScore: 70,
        learningOutcome: 'Aplicación rigurosa de seguridad eléctrica, análisis de mediciones y resolución de sobrecorrientes.',
        stations: [
          {
            id: 'st-1',
            stationNumber: 1,
            title: 'Estación 1: Análisis de Datos y Riesgos Iniciales',
            stationType: 'open_analysis',
            prompt:
              'Observando los datos iniciales (11.8 A frente a 4.5 A nominales y 68 °C en el borne L1), ¿qué dos anomalías técnicas identificas y qué primera regla de seguridad debes aplicar antes de abrir el tablero?',
            caseData: 'El usuario anterior intentó rearmar el breaker 3 veces seguidas sin inspeccionar.',
            expectedCriteria:
              'Identificar sobrecorriente severa (más del doble de la nominal) y punto caliente por falso contacto/sobrecarga en borne L1; aplicar bloqueo y etiquetado (desenergizar y verificar ausencia de tensión) antes de manipular.',
            requiresWrittenResponse: true,
            hint: 'Compara la corriente medida vs. nominal y recuerda qué protocolo es obligatorio antes de tocar conductores.',
          },
          {
            id: 'st-2',
            stationNumber: 2,
            title: 'Estación 2: Decisión de Aislamiento y Prueba',
            stationType: 'decision_and_justification',
            prompt:
              'Con el circuito desenergizado y bloqueado, ¿cuál es la acción técnica óptima para localizar el origen exacto de la sobrecorriente y el calentamiento?',
            caseData: 'El circuito alimenta dos ramales paralelos (Ramal A de control y Ramal B de potencia).',
            sampleOptions: [
              'Desconectar ambos ramales, medir resistencia de aislamiento/continuidad individualmente y reapretar bornes con torquímetro calibrado.',
              'Cambiar el breaker de 10 A por uno de 20 A para que soporte los 11.8 A sin dispararse.',
              'Energizar directamente saltando el breaker para observar dónde sale humo.',
            ],
            expectedCriteria:
              'Elegir el aislamiento por ramales y medición sin tensión + corrección de torque en bornes, explicando por qué sobredimensionar la protección causaría incendio.',
            requiresWrittenResponse: true,
            hint: 'La protección térmica protege al conductor; nunca aumentes su capacidad sin rediseñar el calibre.',
          },
          {
            id: 'st-3',
            stationNumber: 3,
            title: 'Estación 3: Procedimiento de Reparación y Verificación Final',
            stationType: 'procedure_steps',
            prompt:
              'Redacta paso a paso tu procedimiento desde la corrección del fallo detectado hasta la entrega segura del tablero en operación normal.',
            caseData: 'En el Ramal B se detectó un terminal flojo sulfatado y aislamiento rozado en el conductor neutro.',
            expectedCriteria:
              'Saneamiento/reemplazo de conductor y terminal, verificación de apriete, medición de continuidad/aislamiento sin energía, energización controlada y verificación final de corriente (<=4.5 A) y temperatura estable.',
            requiresWrittenResponse: true,
            hint: 'Incluye pruebas en frío antes de energizar y mediciones finales con carga.',
          },
        ],
      };
    } else {
      fallbackSimulator = {
        id: nowId,
        title: `Simulador Interactivo: ${trimmedPrompt.slice(0, 72)}`,
        type: 'interactive_practice',
        topic: lessonTitle || 'Caso Práctico Aplicado',
        authorPrompt: trimmedPrompt,
        scenarioDescription: `Escenario práctico diseñado según las indicaciones docentes: "${trimmedPrompt}". Analiza los datos de entrada, toma decisiones técnicas fundamentadas y documenta tus procedimientos en cada estación.`,
        initialContextData: `Contexto operativo del curso "${courseTitle || 'CFP ÁGAPE'}" (${moduleTitle || 'Módulo Activo'}): Caso real preparado para evaluación de competencias prácticas.`,
        initialInstrumentState: 'Modo Práctica Abierta | Evaluación Inteligente CFP ÁGAPE Activa',
        toolsRequired: ['Criterio Técnico Profesional', 'Guía de Lección', 'Protocolo CFP ÁGAPE'],
        passingScore: 70,
        learningOutcome: 'Resolución estructurada de situaciones reales aplicando pensamiento crítico y procedimientos normativos.',
        stations: [
          {
            id: 'st-1',
            stationNumber: 1,
            title: 'Estación 1: Diagnóstico y Análisis Situacional',
            stationType: 'open_analysis',
            prompt: `Considerando el escenario ("${trimmedPrompt}"), ¿cuáles son los puntos críticos iniciales que debes identificar y verificar antes de intervenir?`,
            caseData: 'Revisa los antecedentes del caso y las condiciones iniciales reportadas.',
            expectedCriteria:
              'Identificación clara del problema principal, variables relevantes del contexto y medidas preventivas o iniciales coherentes.',
            requiresWrittenResponse: true,
            hint: 'Desglosa qué información tienes, qué falta comprobar y qué riesgos existen.',
          },
          {
            id: 'st-2',
            stationNumber: 2,
            title: 'Estación 2: Toma de Decisión y Justificación Técnica',
            stationType: 'decision_and_justification',
            prompt:
              'Selecciona la estrategia de intervención más adecuada y redacta una justificación técnica defendiendo tu decisión frente a las alternativas.',
            caseData: 'Debes priorizar efectividad, seguridad y cumplimiento de estándares profesionales.',
            sampleOptions: [
              'Aplicar protocolo sistemático verificando causa raíz antes de ejecutar cambios definitivos.',
              'Improvisar una solución rápida sin documentar ni validar parámetros.',
              'Ignorar las condiciones iniciales y proceder directamente al cierre.',
            ],
            expectedCriteria:
              'Selección de la metodología sistemática y argumentación sólida vinculada al caso práctico planteado.',
            requiresWrittenResponse: true,
            hint: 'Explica qué consecuencias evitarías al seguir el método profesional.',
          },
          {
            id: 'st-3',
            stationNumber: 3,
            title: 'Estación 3: Plan de Ejecución y Verificación de Calidad',
            stationType: 'procedure_steps',
            prompt:
              'Describe paso a paso el procedimiento completo que ejecutarías para resolver el caso y cómo validarías que el resultado cumple con el estándar del CFP ÁGAPE.',
            caseData: 'Etapa final de resolución y entrega.',
            expectedCriteria:
              'Secuencia lógica de pasos ejecutables, criterios de comprobación final y cierre documentado.',
            requiresWrittenResponse: true,
            hint: 'Asegúrate de incluir tanto los pasos de ejecución como la verificación final.',
          },
        ],
      };
    }
  } else if (labType === 'case_scenario') {
    fallbackSimulator = {
      id: nowId,
      title: `Simulador de Diagnóstico: Avería en ${lessonTitle || 'Circuito de Potencia'}`,
      type: 'case_scenario',
      topic: lessonTitle || 'Diagnóstico de Fallas',
      scenarioDescription:
        'En el laboratorio de electrónica del CFP AGAPE se ha recibido un módulo de alimentación estabilizada que no entrega voltaje de salida (0.0 V). La luz de advertencia de la fuente de alimentación parpadea indicando sobreconsumo en la etapa primaria. Tu misión como técnico es diagnosticar y restablecer la operación sin provocar daños colaterales.',
      initialInstrumentState: 'Fuente DC: 12.0 V | Vout: 0.0 V | Amperímetro: 1.85 A (Límite Térmico) | Estado: ALERTA DE FALLA',
      toolsRequired: ['Multímetro Digital con sondas', 'Punta Lógica', 'Fuente Regulada de Taller', 'Diagrama Esquemático CFP'],
      passingScore: 70,
      learningOutcome: 'Capacidad para aislar cortocircuitos y fallas de avalancha térmica en componentes activos y pasivos.',
      steps: [
        {
          stepNumber: 1,
          stageTitle: 'Fase 1: Aislamiento Seguro y Comprobación de Tensión Primaria',
          situation:
            'La fuente de poder del banco de trabajo emite un leve zumbido de protección. Tienes el multímetro digital listo para la primera intervención.',
          options: [
            {
              id: 'opt-1-1',
              actionText: 'Desconectar la carga y medir tensión en bornes de entrada del circuito',
              consequenceText:
                'La tensión de entrada se estabiliza en 12.0 V al desacoplar la etapa averiada. Confirmas que la fuente externa se encuentra en perfecto estado.',
              isOptimal: true,
              scoreImpact: 35,
              instrumentReading: 'Multímetro: 12.05 V DC | Corriente: 15 mA (En reposo)',
              technicalExplanation:
                'Aislar etapas permite descartar averías en la fuente de alimentación antes de sospechar de componentes en placa.',
            },
            {
              id: 'opt-1-2',
              actionText: 'Aumentar el límite de corriente de la fuente a 5 Amperios para forzar la salida',
              consequenceText:
                'Se genera un chispazo en la pista de cobre y un olor a sobrecalentamiento. Riesgo de destrucción total.',
              isOptimal: false,
              scoreImpact: -20,
              instrumentReading: 'Multímetro: 0.0 V | Alarma: Pista de circuito impreso carbonizada',
              technicalExplanation:
                'Forzar corriente en una condición de corto destruye pistas de circuito impreso y semiconductores adyacentes.',
            },
            {
              id: 'opt-1-3',
              actionText: 'Revisar continuidad con el multímetro en escala de Ohmios sin desconectar la energía',
              consequenceText:
                'El multímetro activa el fusible interno de protección por medir resistencia en un circuito energizado.',
              isOptimal: false,
              scoreImpact: -10,
              instrumentReading: 'Multímetro: PANTALLA EN ERROR - FUSIBLE INSTRUMENTAL DISPARADO',
              technicalExplanation:
                'Regla de oro de CFP AGAPE: Las pruebas de continuidad y resistencia NUNCA se realizan con el circuito energizado.',
            },
          ],
        },
        {
          stepNumber: 2,
          stageTitle: 'Fase 2: Medición de Componentes en Banco de Pruebas',
          situation:
            'Con el circuito desenergizado, realizas el test de diodos y resistencia en los semiconductores de la etapa rectificadora y de regulación.',
          options: [
            {
              id: 'opt-2-1',
              actionText: 'Efectuar prueba de juntura PN en el diodo de protección inversa D1',
              consequenceText:
                'El multímetro emite pitido continuo en ambos sentidos indicando 0.01 V de caída. ¡Has detectado el diodo en cortocircuito franco!',
              isOptimal: true,
              scoreImpact: 35,
              instrumentReading: 'Test Diodo: 0.008 V en polarización directa e inversa (Juntura Destruida)',
              technicalExplanation:
                'El diodo de protección absorbió un transitorio de sobretensión y quedó en corto franco a tierra para salvar el resto del circuito.',
            },
            {
              id: 'opt-2-2',
              actionText: 'Desoldar todos los capacitores electrolíticos al azar para medirlos uno a uno',
              consequenceText:
                'Pierdes tiempo innecesario y fatigas térmicamente los pads del circuito impreso con el soldador.',
              isOptimal: false,
              scoreImpact: 5,
              instrumentReading: 'Medición: Capacitores en rango nominal (470 uF OK)',
              technicalExplanation:
                'El método sistemático de diagnóstico en CFP AGAPE prioriza medir semiconductores antes de desoldar pasivos.',
            },
          ],
        },
        {
          stepNumber: 3,
          stageTitle: 'Fase 3: Reemplazo de Componente y Verificación Funcional',
          situation:
            'Has desoldado el diodo averiado. Ahora debes seleccionar el reemplazo técnico adecuado del almacén de CFP AGAPE y probar el funcionamiento.',
          options: [
            {
              id: 'opt-3-1',
              actionText: 'Instalar diodo rectificador rápido 1N4007 respetando polaridad de cátodo (franja plateada)',
              consequenceText:
                'Al energizar nuevamente a 12V, el circuito regula perfectamente entregando 5.02 V limpios sin calentamiento.',
              isOptimal: true,
              scoreImpact: 30,
              instrumentReading: 'Vout: 5.02 V DC | Corriente de Carga: 380 mA | Ripple: 8 mV | ESTADO: OPERATIVO',
              technicalExplanation:
                'Excelente intervención técnica. El reemplazo con componente original y verificación de polaridad garantiza confiabilidad.',
            },
            {
              id: 'opt-3-2',
              actionText: 'Dejar el circuito sin diodo de protección para no perder tiempo',
              consequenceText:
                'El circuito funciona temporalmente pero queda completamente vulnerable a cualquier inversión de polaridad futura.',
              isOptimal: false,
              scoreImpact: 0,
              instrumentReading: 'Vout: 5.0 V | Advertencia: Circuito desprotegido',
              technicalExplanation:
                'Nunca se debe omitir un componente de protección técnica previsto en el diseño original.',
            },
          ],
        },
      ],
    };
  } else if (labType === 'diagnostic_test') {
    fallbackSimulator = {
      id: nowId,
      title: `Prueba de Diagnóstico Técnico: ${lessonTitle || 'Análisis de Circuitos y Mediciones'}`,
      type: 'diagnostic_test',
      topic: lessonTitle || 'Diagnóstico Técnico',
      scenarioDescription:
        'Cuestionario técnico interactivo de taller con casos de estudio reales para validar tu capacidad de diagnóstico, cálculo de magnitudes y resolución de fallas según el estándar del CFP AGAPE.',
      passingScore: 75,
      learningOutcome: 'Capacidad para deducir causas raíz de fallas en circuitos mediante interpretación de instrumentos.',
      questions: [
        {
          id: 'dq-1',
          question:
            'Al medir con el voltímetro entre los terminales de un resistor en serie obtienes 0.0 V, pero la fuente entrega 12 V al circuito completo. ¿Cuál es la causa más probable?',
          options: [
            'El circuito está abierto en otro punto de la serie, por lo que no circula corriente (I = 0 A)',
            'El resistor ha incrementado su valor a 1 Megaohmio',
            'La fuente de alimentación está en cortocircuito interno',
            'El voltímetro tiene las puntas invertidas',
          ],
          correctOptionIndex: 0,
          technicalFeedback:
            'Correcto. Según la Ley de Ohm, si no circula corriente a través del resistor (I = 0), la caída de tensión V = I × R será exactamente 0 V.',
        },
        {
          id: 'dq-2',
          question:
            'Un multímetro digital muestra "O.L" (Over Limit) al medir resistencia en los terminales de un fusible de 2 Amperios desenergizado. ¿Qué dictamen técnico emites?',
          options: [
            'El fusible está quemado/abierto y debe ser reemplazado de inmediato',
            'El fusible está en perfecto estado conduciendo corriente',
            'La batería interna del multímetro está descargada',
            'El fusible tiene resistencia cero (continuidad ideal)',
          ],
          correctOptionIndex: 0,
          technicalFeedback:
            'Exacto. Un fusible en buen estado debe mostrar una resistencia cercana a 0.0 Ω (continuidad). O.L significa resistencia infinita (circuito abierto).',
        },
        {
          id: 'dq-3',
          question:
            'Si en un divisor de tensión con dos resistores iguales de 1kΩ alimentados a 10V DC, mides 9.8V en el punto medio en lugar de 5.0V, ¿qué avería ocurrió?',
          options: [
            'El resistor inferior conectado a GND se abrió o perdió contacto en el protoboard',
            'El resistor superior aumentó su resistencia al doble',
            'La fuente está descalibrada entregando 20V',
            'El multímetro alteró la impedancia de entrada',
          ],
          correctOptionIndex: 0,
          technicalFeedback:
            'Muy bien razonado. Al abrirse el resistor inferior a tierra, el punto medio queda en circuito abierto conectado únicamente al positivo a través de R1.',
        },
      ],
    };
  } else {
    fallbackSimulator = {
      id: nowId,
      title: `Laboratorio Guiado de Taller: ${lessonTitle || 'Procedimiento de Ensamblaje y Calibración'}`,
      type: 'guided_workshop',
      topic: lessonTitle || 'Laboratorio de Taller',
      scenarioDescription:
        'Protocolo técnico paso a paso para el montaje, calibración y comprobación de parámetros eléctricos en el banco de pruebas del CFP AGAPE con lista de verificación interactiva.',
      toolsRequired: ['Protoboard de 830 puntos', 'Multímetro Digital calibrado', 'Fuente DC regulada 0-15V', 'Alicates de corte diagonal', 'Juego de jumpers'],
      passingScore: 80,
      learningOutcome: 'Destreza en montaje limpio, verificación con instrumentación y buenas prácticas de taller.',
      workshopSteps: [
        {
          id: 'ws-1',
          stepNumber: 1,
          checklistLabel: 'Revisión de Seguridad y EPP de Laboratorio',
          instruction:
            'Verificar el uso de gafas de protección técnica, pulsera antiestática conectada a tierra y calzado con suela dieléctrica en el área de trabajo.',
          warningAlert: 'No conectar ningún equipo sin haber recibido autorización previa del docente responsable.',
          expectedMeasurement: 'Mesa de trabajo libre de virutas metálicas y humedad.',
        },
        {
          id: 'ws-2',
          stepNumber: 2,
          checklistLabel: 'Comprobación de Valores Pasivos con Multímetro',
          instruction:
            'Medir con el óhmetro cada resistor antes de insertarlo en el protoboard y verificar que se encuentre dentro de la tolerancia de ±5%.',
          expectedMeasurement: 'R1 (1kΩ): 995 Ω - 1005 Ω | R2 (2.2kΩ): 2.18 kΩ - 2.22 kΩ',
        },
        {
          id: 'ws-3',
          stepNumber: 3,
          checklistLabel: 'Ensamblaje del Circuito y Calibración de Fuente',
          instruction:
            'Insertar los componentes en el protoboard según el esquema técnico. Ajustar la fuente regulada a 9.0 V con límite de corriente a 150 mA.',
          warningAlert: 'Evitar cruzar terminales descubiertas para prevenir cortocircuitos.',
          expectedMeasurement: 'Voltaje en bornes de alimentación: 9.00 V DC exactos.',
        },
        {
          id: 'ws-4',
          stepNumber: 4,
          checklistLabel: 'Medición de Corriente Total del Circuito',
          instruction:
            'Abrir la línea positiva del circuito e intercalar las puntas del multímetro configurado en la escala de 200 mA DC.',
          expectedMeasurement: 'Corriente total medida: 2.81 mA DC (± 0.1 mA).',
        },
      ],
    };
  }

  return res.json({ simulator: fallbackSimulator, source: 'fallback' });
});

// -------------------------------------------------------------
// 6. API: Evaluar Práctica Interactiva Abierta con IA (Estudiante)
// -------------------------------------------------------------
app.post('/api/gemini/evaluate-simulator', async (req: Request, res: Response) => {
  const { simulator, responses } = req.body;

  const stations = Array.isArray(simulator?.stations) ? simulator.stations : [];
  const formattedResponses = stations.map((st: any) => {
    const resp = responses?.[st.id] || {};
    return {
      stationNumber: st.stationNumber,
      title: st.title,
      prompt: st.prompt,
      expectedCriteria: st.expectedCriteria,
      studentSelectedOption: resp.selectedOption || 'N/A',
      studentWrittenResponse: resp.writtenResponse || '',
    };
  });

  const prompt = `Eres un evaluador técnico senior del Centro de Formación Profesional ÁGAPE (CFP ÁGAPE).
Evalúa el desempeño real de un estudiante en el siguiente Simulador Interactivo de Práctica:

- Título del Simulador: "${simulator?.title || 'Práctica Interactiva'}"
- Indicaciones Originales del Docente (Prompt): "${simulator?.authorPrompt || simulator?.scenarioDescription || ''}"
- Escenario Inicial: "${simulator?.scenarioDescription || ''}"
- Datos Iniciales del Caso: "${simulator?.initialContextData || ''}"
- Puntaje Mínimo de Aprobación: ${simulator?.passingScore || 70}%

Respuestas enviadas por el estudiante por estación:
${JSON.stringify(formattedResponses, null, 2)}

Instrucciones de evaluación:
1. Evalúa la coherencia técnica, procedimiento, seguridad, razonamiento y cumplimiento de las indicaciones del docente.
2. Si el estudiante escribió respuestas vacías, demasiado cortas o sin sentido, califica bajo con retroalimentación clara sobre qué le faltó desarrollar.
3. Si el estudiante demostró análisis sólido y procedimientos correctos aunque con sus propias palabras, evalúa con justicia y destaca fortalezas y mejoras concretas.
4. Responde en español profesional y formativo.`;

  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const response = await genAI.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              passed: { type: Type.BOOLEAN },
              overallFeedback: { type: Type.STRING },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              areasToImprove: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              stationFeedback: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stationNumber: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    comment: { type: Type.STRING },
                  },
                  required: ['stationNumber', 'title', 'score', 'comment'],
                },
              },
            },
            required: [
              'score',
              'passed',
              'overallFeedback',
              'strengths',
              'areasToImprove',
              'stationFeedback',
            ],
          },
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ evaluation: parsed, source: 'gemini' });
      }
    }
  } catch (error) {
    console.warn('Error evaluating interactive simulator with Gemini, using heuristic evaluation:', error);
  }

  // Deterministic, criteria-aware fallback evaluation
  const passingScore = Number(simulator?.passingScore || 70);
  const stationFeedback = formattedResponses.map((st: any) => {
    const text = (st.studentWrittenResponse || '').trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    const criteriaTokens = (st.expectedCriteria || '')
      .toLowerCase()
      .split(/[^a-záéíóúñ0-9]+/i)
      .filter((w: string) => w.length > 4);
    const lowerResp = (text + ' ' + (st.studentSelectedOption || '')).toLowerCase();
    const matchedTokens = criteriaTokens.filter((tok: string) => lowerResp.includes(tok));
    const tokenRatio = criteriaTokens.length > 0 ? matchedTokens.length / Math.min(6, criteriaTokens.length) : 0.5;

    let stScore = 0;
    let comment = '';
    if (wordCount < 4) {
      stScore = 25;
      comment = `Respuesta muy breve en "${st.title}". Es necesario desarrollar el análisis técnico y detallar tu procedimiento paso a paso.`;
    } else if (wordCount < 12) {
      stScore = Math.min(82, Math.round(55 + tokenRatio * 27));
      comment = `Planteamiento inicial aceptable, aunque conviene profundizar en los criterios esperados: ${st.expectedCriteria}`;
    } else {
      stScore = Math.min(98, Math.round(72 + Math.min(1, tokenRatio) * 24));
      comment = `Buen nivel de argumentación y secuencia práctica para "${st.title}". Tu enfoque aborda adecuadamente los puntos clave del caso.`;
    }

    return {
      stationNumber: st.stationNumber,
      title: st.title,
      score: stScore,
      comment,
    };
  });

  const avgScore =
    stationFeedback.length > 0
      ? Math.round(
          stationFeedback.reduce((acc: number, item: any) => acc + item.score, 0) /
            stationFeedback.length
        )
      : 75;
  const passed = avgScore >= passingScore;

  return res.json({
    evaluation: {
      score: avgScore,
      passed,
      overallFeedback: passed
        ? `¡Buen trabajo! Alcanzaste ${avgScore}/100 en esta práctica interactiva, demostrando capacidad de análisis y criterio técnico acorde al estándar del CFP ÁGAPE.`
        : `Obtuviste ${avgScore}/100 (mínimo requerido: ${passingScore}%). Te recomendamos detallar con mayor precisión técnica tus procedimientos y justificaciones en cada estación.`,
      strengths: [
        'Participación en las estaciones secuenciales del caso práctico.',
        avgScore >= 75
          ? 'Claridad y estructura lógica en la redacción de procedimientos.'
          : 'Identificación de la situación problemática inicial.',
      ],
      areasToImprove: [
        avgScore >= 85
          ? 'Continuar integrando métricas de verificación y normativas preventivas en cada cierre.'
          : 'Ampliar la justificación técnica vinculando datos del caso con las normas de calidad o seguridad.',
      ],
      stationFeedback,
    },
    source: 'fallback',
  });
});

// -------------------------------------------------------------
// 7. API: Tutor IA Ágape para Estudiantes (Orientación Pedagógica)
// -------------------------------------------------------------
app.post('/api/gemini/tutor-chat', async (req: Request, res: Response) => {
  const {
    question = '',
    lessonTitle = '',
    courseTitle = '',
    explanationText = '',
    linkedDoc,
    history = [],
  } = req.body;

  const cleanQuestion = String(question || '').trim();
  if (!cleanQuestion) {
    return res.status(400).json({ error: 'La consulta no puede estar vacía.' });
  }

  const systemInstruction = `Eres el "Tutor IA Ágape", asistente pedagógico oficial del Centro de Formación Profesional ÁGAPE (CFP ÁGAPE).
Tu misión es ayudar al estudiante a comprender los contenidos de la lección, analizar guías o documentos vinculados y aclarar dudas conceptuales o prácticas.

REGLAS ESTRICTAS DE INTEGRIDAD ACADÉMICA:
1. NUNCA entregues respuestas directas de exámenes, cuestionarios (quizzes), ni resuelvas literalmente los ejercicios evaluados o simuladores del alumno.
2. Si el estudiante pide directamente la respuesta correcta de un examen, quiz o simulador, rechaza amablemente dar la solución directa y guíalo mediante pistas, preguntas socráticas, ejemplos análogos o pasos de razonamiento para que él mismo llegue a la conclusión.
3. Mantén tus respuestas claras, concisas (máximo 180 palabras), motivadoras y en español técnico comprensible.
4. Contextualiza siempre en la lección actual y en el documento vinculado si el alumno adjuntó uno.`;

  const recentHistory = Array.isArray(history)
    ? history
        .slice(-4)
        .map((m: any) => `${m.sender === 'student' ? 'Estudiante' : 'Tutor IA Ágape'}: ${m.text}`)
        .join('\n')
    : '';

  const userPrompt = `CONTEXTO DEL AULA VIRTUAL:
- Curso: "${courseTitle || 'Curso Técnico CFP ÁGAPE'}"
- Lección actual: "${lessonTitle || 'Lección activa'}"
- Resumen teórico de la clase: "${String(explanationText || '').slice(0, 1200)}"
${
  linkedDoc
    ? `- Documento/Enlace vinculado por el estudiante: ${linkedDoc.title} (Categoría: ${linkedDoc.category}, URL: ${linkedDoc.url})`
    : ''
}
${recentHistory ? `\nCONVERSACIÓN RECIENTE:\n${recentHistory}\n` : ''}
PREGUNTA ACTUAL DEL ESTUDIANTE:
"${cleanQuestion}"`;

  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const response = await genAI.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });

      if (response && response.text) {
        return res.json({ reply: response.text, source: 'gemini' });
      }
    }
  } catch (error) {
    console.warn('Error calling Gemini for Tutor IA Ágape, using pedagogical fallback:', error);
  }

  const lowerQ = cleanQuestion.toLowerCase();
  const isAskingExamAnswer =
    /dame la respuesta|cu[aá]l es la respuesta|resuelve.*(examen|quiz|simulador|prueba)|qu[eé] opci[oó]n (es|marco)/i.test(
      lowerQ
    );

  const fallbackReply = isAskingExamAnswer
    ? `Como Tutor IA Ágape no puedo darte la respuesta directa del examen o simulador, pero sí puedo ayudarte a deducirla paso a paso:\n\n1. Revisa los datos iniciales de la lección "${lessonTitle || 'actual'}" y verifica qué variable o norma está en juego.\n2. Pregúntate qué consecuencia tendría cada alternativa en un entorno real de trabajo.\n3. Cuéntame cuál opción consideras más lógica y por qué, y revisamos juntos tu razonamiento.`
    : `¡Excelente pregunta sobre "${lessonTitle || 'la lección'}"! Para abordarla con claridad:\n\n• Punto clave: ${
        explanationText
          ? explanationText.slice(0, 220).replace(/\s+/g, ' ') + '...'
          : 'Aplica el método ordenado de análisis, verificación y seguridad estudiado en este módulo.'
      }\n${
        linkedDoc
          ? `• Sobre tu documento vinculado ("${linkedDoc.title}"): te sugiero contrastar los datos registrados en ese recurso con los objetivos de la clase.\n`
          : ''
      }• Siguiente paso sugerido: intenta explicar con tus propias palabras qué parte del procedimiento te genera duda para orientarte sin darte la solución directa.`;

  return res.json({ reply: fallbackReply, source: 'fallback' });
});

export default app;
