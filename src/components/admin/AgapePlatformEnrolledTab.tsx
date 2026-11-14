import React, { useMemo, useState } from 'react';
import {
  GraduationCap,
  Search,
  Download,
  Award,
  FlaskConical,
  CheckCircle2,
  Clock,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';

export const AgapePlatformEnrolledTab: React.FC = () => {
  const { registeredUsers, courses, progress, getCourseProgressPercent } = useLms();

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'certified' | 'in_progress' | 'inactive'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const platformStudents = useMemo(
    () => registeredUsers.filter((u) => u.role === 'student'),
    [registeredUsers]
  );

  // Build normalized enrollment rows: one row per (student, enrolled virtual course),
  // plus a row for students with credentials who don't yet have a course assigned.
  const enrollmentRows = useMemo(() => {
    const rows: {
      rowId: string;
      studentId: string;
      name: string;
      institutionalCode: string;
      email: string;
      avatar: string;
      isActive: boolean;
      courseId: string;
      courseTitle: string;
      courseCategory: string;
      progressPercent: number;
      simulatorSummary: string;
      simulatorNumericScore: number | null;
      certificationStatus: 'Certificado' | 'En Progreso' | 'Sin Iniciar' | 'Sin Matrícula';
    }[] = [];

    for (const st of platformStudents) {
      const enrolledIds = st.enrolledCourseIds || [];
      if (enrolledIds.length === 0) {
        rows.push({
          rowId: `${st.id}::none`,
          studentId: st.id,
          name: st.name,
          institutionalCode: st.institutionalCode || '—',
          email: st.email,
          avatar: st.avatar,
          isActive: st.isActive !== false,
          courseId: '',
          courseTitle: 'Sin curso virtual asignado',
          courseCategory: '—',
          progressPercent: 0,
          simulatorSummary: 'Sin simuladores',
          simulatorNumericScore: null,
          certificationStatus: 'Sin Matrícula',
        });
        continue;
      }

      for (const cid of enrolledIds) {
        const courseObj = courses.find((c) => c.id === cid);
        const pct = getCourseProgressPercent(cid, st.id);
        const progKey = `${st.id}::${cid}`;
        const studentProg = progress[progKey];
        const simScoresMap = studentProg?.simulatorScores || {};
        const simValues = Object.values(simScoresMap);
        const quizValues = Object.values(studentProg?.quizAttempts || {});

        let simulatorSummary = 'Pendiente';
        let simulatorNumericScore: number | null = null;
        if (simValues.length > 0) {
          const avgSim = Math.round(
            simValues.reduce((acc, s) => acc + s.score, 0) / simValues.length
          );
          simulatorNumericScore = avgSim;
          simulatorSummary = `${avgSim}/100 (${simValues.length} eval.)`;
        } else if (quizValues.length > 0) {
          const avgQuiz = Math.round(
            quizValues.reduce((acc, q) => acc + q.score, 0) / quizValues.length
          );
          simulatorSummary = `Quiz: ${avgQuiz}%`;
        }

        const isCertified = pct >= 100 || Boolean(studentProg?.certificateIssuedAt);
        const certStatus: 'Certificado' | 'En Progreso' | 'Sin Iniciar' = isCertified
          ? 'Certificado'
          : pct > 0 || simValues.length > 0 || quizValues.length > 0
          ? 'En Progreso'
          : 'Sin Iniciar';

        rows.push({
          rowId: `${st.id}::${cid}`,
          studentId: st.id,
          name: st.name,
          institutionalCode: st.institutionalCode || '—',
          email: st.email,
          avatar: st.avatar,
          isActive: st.isActive !== false,
          courseId: cid,
          courseTitle: courseObj?.title || cid,
          courseCategory: courseObj?.category || 'Virtual',
          progressPercent: pct,
          simulatorSummary,
          simulatorNumericScore,
          certificationStatus: certStatus,
        });
      }
    }

    return rows;
  }, [platformStudents, courses, progress, getCourseProgressPercent]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrollmentRows.filter((row) => {
      const matchesCourse =
        selectedCourseFilter === 'all' || row.courseId === selectedCourseFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'certified' && row.certificationStatus === 'Certificado') ||
        (statusFilter === 'in_progress' &&
          (row.certificationStatus === 'En Progreso' ||
            row.certificationStatus === 'Sin Iniciar')) ||
        (statusFilter === 'inactive' && !row.isActive);
      const matchesSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.institutionalCode.toLowerCase().includes(q) ||
        row.courseTitle.toLowerCase().includes(q);
      return matchesCourse && matchesStatus && matchesSearch;
    });
  }, [enrollmentRows, selectedCourseFilter, statusFilter, searchQuery]);

  const certifiedCount = enrollmentRows.filter(
    (r) => r.certificationStatus === 'Certificado'
  ).length;
  const avgProgress =
    enrollmentRows.length > 0
      ? Math.round(
          enrollmentRows.reduce((acc, r) => acc + r.progressPercent, 0) / enrollmentRows.length
        )
      : 0;
  const evaluatedSimCount = enrollmentRows.filter(
    (r) => r.simulatorNumericScore !== null
  ).length;

  const handleExportCsv = () => {
    const headers = [
      'Estudiante',
      'Codigo/DUI',
      'Correo Institucional',
      'Estado Cuenta',
      'Curso Virtual',
      'Avance (%)',
      'Nota Simuladores IA',
      'Certificacion',
    ];
    const escapeCsv = (val: string | number) =>
      `"${String(val).replace(/"/g, '""')}"`;

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...filteredRows.map((r) =>
        [
          r.name,
          r.institutionalCode,
          r.email,
          r.isActive ? 'Activo' : 'Suspendido',
          r.courseTitle,
          `${r.progressPercent}%`,
          r.simulatorSummary,
          r.certificationStatus,
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ];

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscritos_plataforma_cfp_agape_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#4B3B8B] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>Módulo Exclusivo de Cursos Virtuales · Aula en Línea</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#3B2C73] tracking-tight">
              Inscritos en Plataforma (@campus.agape.edu.sv)
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Control exclusivo de estudiantes con acceso al Aula Virtual, avance porcentual por curso en línea, notas de simuladores IA y estado de certificación digital.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredRows.length === 0}
            className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Listado CSV</span>
          </button>
        </div>

        {/* Clean Summary Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD]">
            <div className="text-[11px] font-semibold text-slate-500">
              Estudiantes con Credenciales
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-[#3B2C73] mt-0.5">
              {platformStudents.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {platformStudents.filter((s) => s.isActive !== false).length} cuentas activas
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD]">
            <div className="text-[11px] font-semibold text-slate-500">
              Matrículas en Cursos Virtuales
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-[#4B3B8B] mt-0.5">
              {enrollmentRows.filter((r) => r.courseId).length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Avance promedio {avgProgress}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD]">
            <div className="text-[11px] font-semibold text-slate-500">
              Simuladores IA Evaluados
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-[#6080B8] mt-0.5">
              {evaluatedSimCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Registros con calificación IA
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAFBFD]">
            <div className="text-[11px] font-semibold text-slate-500">
              Certificaciones Completadas
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 mt-0.5">
              {certifiedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              100% de avance curricular
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'certified', label: 'Certificados' },
                { id: 'in_progress', label: 'En Curso' },
                { id: 'inactive', label: 'Suspendidos' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#3B2C73] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B] cursor-pointer"
          >
            <option value="all">Todos los cursos virtuales ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar alumno, correo o curso..."
            className="w-full lg:w-72 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 text-[11px] font-bold">
              <tr>
                <th className="py-3 px-4">Estudiante (@campus.agape.edu.sv)</th>
                <th className="py-3 px-4">Código / DUI</th>
                <th className="py-3 px-4">Curso Virtual Matriculado</th>
                <th className="py-3 px-4">Avance (%)</th>
                <th className="py-3 px-4">Nota Simuladores IA</th>
                <th className="py-3 px-4">Certificación / Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.rowId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={row.avatar}
                        alt={row.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{row.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {row.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono tabular-nums text-[11px] text-slate-700">
                    {row.institutionalCode}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <BookOpen className="w-3.5 h-3.5 text-[#6080B8] shrink-0" />
                      <span className="truncate max-w-xs">{row.courseTitle}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{row.courseCategory}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-[#4B3B8B] rounded-full transition-all"
                          style={{ width: `${row.progressPercent}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums font-bold text-[#3B2C73]">
                        {row.progressPercent}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] font-semibold text-slate-700">
                      <FlaskConical className="w-3.5 h-3.5 text-[#4B3B8B] shrink-0" />
                      <span>{row.simulatorSummary}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          row.certificationStatus === 'Certificado'
                            ? 'text-emerald-700'
                            : row.certificationStatus === 'En Progreso'
                            ? 'text-[#4B3B8B]'
                            : 'text-slate-500'
                        }`}
                      >
                        {row.certificationStatus === 'Certificado' ? (
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                        ) : row.certificationStatus === 'En Progreso' ? (
                          <Clock className="w-3.5 h-3.5 text-[#4B3B8B]" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{row.certificationStatus}</span>
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          row.isActive ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {row.isActive ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Credencial activa
                          </span>
                        ) : (
                          'Acceso suspendido'
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center space-y-2">
                    <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">
                      No hay estudiantes inscritos en cursos virtuales con los filtros seleccionados
                    </div>
                    <div className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Los alumnos matriculados con cuenta institucional @campus.agape.edu.sv aparecerán aquí automáticamente con su avance y notas de simuladores.
                    </div>
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
