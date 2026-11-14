import React from 'react';
import { Course } from '../../types/lms';
import { useLms } from '../../context/LmsContext';

export const AgapeStudentsView: React.FC<{ courses: Course[] }> = ({ courses }) => {
  const { registeredUsers, getCourseProgressPercent } = useLms();

  const courseIds = new Set(courses.map((c) => c.id));
  const enrolledRows = registeredUsers
    .filter(
      (u) =>
        u.role === 'student' &&
        (u.enrolledCourseIds || []).some((cid) => courseIds.has(cid))
    )
    .flatMap((student) =>
      (student.enrolledCourseIds || [])
        .filter((cid) => courseIds.has(cid))
        .map((cid) => {
          const courseObj = courses.find((c) => c.id === cid);
          const progress = getCourseProgressPercent(cid, student.id);
          return {
            key: `${student.id}-${cid}`,
            student,
            courseTitle: courseObj?.title || cid,
            progress,
          };
        })
    );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-[#3B2C73]">
            Estudiantes Matriculados - CFP ÁGAPE
          </h2>
          <p className="text-xs text-slate-500">
            Listado oficial de aprendices asignados a tus cursos activos.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-[#4B3B8B] bg-[#4B3B8B]/10 px-3 py-1 rounded-full">
          {enrolledRows.length} Matrículas Activas
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Estudiante</th>
              <th className="py-3 px-4">Código / DUI</th>
              <th className="py-3 px-4">Curso Matriculado</th>
              <th className="py-3 px-4">Progreso</th>
              <th className="py-3 px-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrolledRows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={row.student.avatar}
                      alt={row.student.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-slate-800">{row.student.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {row.student.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                  {row.student.institutionalCode || '—'}
                </td>
                <td className="py-3 px-4 text-slate-700 font-medium">{row.courseTitle}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#4B3B8B] h-full rounded-full"
                        style={{ width: `${row.progress}%` }}
                      />
                    </div>
                    <span className="font-mono tabular-nums">{row.progress}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      row.student.isActive === false
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {row.student.isActive === false ? 'Suspendido' : 'Activo'}
                  </span>
                </td>
              </tr>
            ))}

            {enrolledRows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No hay estudiantes matriculados aún en los cursos seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AgapeAnalyticsView: React.FC<{ course: Course }> = ({ course }) => {
  const { registeredUsers } = useLms();
  const realEnrolledCount = registeredUsers.filter(
    (u) => u.role === 'student' && (u.enrolledCourseIds || []).includes(course.id)
  ).length;
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const enabledSims = course.modules.reduce(
    (acc, m) =>
      acc +
      m.lessons.filter((l) => l.simulatorLab && l.simulatorEnabledByAdmin === true).length,
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
      <div className="pb-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-[#3B2C73]">Analíticas de Rendimiento Académico</h2>
        <p className="text-xs text-slate-500">
          Métricas reales del curso {course.title} · CFP ÁGAPE.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 block mb-1">Estudiantes Matriculados</span>
          <span className="text-2xl font-bold font-mono text-[#3B2C73]">{realEnrolledCount}</span>
          <span className="text-[11px] text-emerald-600 block mt-1">
            Matrícula verificada @campus.agape.edu.sv
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 block mb-1">Lecciones & Módulos</span>
          <span className="text-2xl font-bold font-mono text-[#6080B8]">
            {course.modules.length} / {totalLessons}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Módulos y lecciones estructuradas
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 block mb-1">Simuladores Habilitados</span>
          <span className="text-2xl font-bold font-mono text-emerald-700">{enabledSims}</span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Aprobados por Administración
          </span>
        </div>
      </div>
    </div>
  );
};

export const AgapeBrandingView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
      <div className="pb-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-[#3B2C73]">
          Identidad Institucional CFP ÁGAPE
        </h2>
        <p className="text-xs text-slate-500">
          Paleta oficial extraída del logotipo del Centro de Formación Profesional ÁGAPE.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="w-full h-16 rounded-lg bg-[#4B3B8B] shadow-inner" />
          <div className="font-bold text-xs text-slate-900">Púrpura / Violeta Primario</div>
          <div className="font-mono text-xs text-slate-500">#4B3B8B</div>
          <p className="text-[11px] text-slate-500">
            Botones de acción principales, acentos y elementos activos.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="w-full h-16 rounded-lg bg-[#6080B8] shadow-inner" />
          <div className="font-bold text-xs text-slate-900">Azul / Gris Azulado Secundario</div>
          <div className="font-mono text-xs text-slate-500">#6080B8</div>
          <p className="text-[11px] text-slate-500">
            Encabezados de módulos, pestañas y degradados institucionales.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="w-full h-16 rounded-lg bg-[#F2C94C] shadow-inner" />
          <div className="font-bold text-xs text-slate-900">Amarillo Acento</div>
          <div className="font-mono text-xs text-slate-500">#F2C94C</div>
          <p className="text-[11px] text-slate-500">
            Inspirado en el emblema del logotipo de CFP ÁGAPE para destacar insignias clave.
          </p>
        </div>
      </div>
    </div>
  );
};
