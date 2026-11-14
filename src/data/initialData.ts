import { Course, StudentProgress, UserProfile, Instructor, AuthUser } from '../types/lms';

export const MASTER_ADMIN_EMAIL = 'cursosenlinea@campus.agape.edu.sv';

export const INITIAL_INSTRUCTORS: Instructor[] = [];

export const INITIAL_AUTH_USERS: AuthUser[] = [
  {
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
  },
];

export const INITIAL_ADMIN_PROFILE: UserProfile = INITIAL_AUTH_USERS[0];
export const INITIAL_INSTRUCTOR_PROFILE: UserProfile = INITIAL_AUTH_USERS[0];
export const INITIAL_STUDENT_PROFILE: UserProfile = INITIAL_AUTH_USERS[0];

export const INITIAL_COURSES: Course[] = [
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

export const INITIAL_STUDENT_PROGRESS: StudentProgress = {
  courseId: 'course-elec-101',
  completedLessonIds: [],
  quizAttempts: {},
  assignmentSubmissions: {},
  notesByLesson: {},
};
