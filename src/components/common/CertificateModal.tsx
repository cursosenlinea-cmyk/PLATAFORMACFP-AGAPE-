import React, { useMemo, useState } from 'react';
import { X, Award, Printer, Check, Copy, ShieldCheck, Lock } from 'lucide-react';
import { Course } from '../../types/lms';
import { useLms } from '../../context/LmsContext';

interface CertificateModalProps {
  course: Course | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ course, onClose }) => {
  const { currentAuthUser, currentUser, getCourseProgressPercent } = useLms();
  const [copied, setCopied] = useState<boolean>(false);

  const studentName = currentAuthUser?.name || currentUser.name;
  const studentCode = currentAuthUser?.institutionalCode;

  const certificateId = useMemo(() => {
    if (!course) return 'CFP-CERT';
    const userSuffix = (currentAuthUser?.id || 'EST').slice(-4).toUpperCase();
    return `CFP-${course.id.substring(0, 6).toUpperCase()}-${userSuffix}`;
  }, [course, currentAuthUser]);

  if (!course) return null;

  const progressPercent = getCourseProgressPercent(course.id);
  const isEligible = progressPercent >= 100;

  const issueDate = new Date().toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    if (!isEligible) return;
    window.print();
  };

  const handleCopyCredential = () => {
    if (!isEligible) return;
    navigator.clipboard?.writeText?.(
      `CFP ÁGAPE · Certificado Oficial ${certificateId} · ${studentName} · ${course.title}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#3B2C73] text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F2C94C]" />
            <span className="font-bold text-sm tracking-wide">
              {isEligible
                ? 'Certificado Institucional CFP ÁGAPE (100% Completado)'
                : `Progreso actual: ${progressPercent}% (Se requiere 100% para emitir certificado)`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isEligible && (
              <>
                <button
                  onClick={handleCopyCredential}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-medium rounded-lg text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Folio Copiado' : 'Copiar Folio'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-[#F2C94C] hover:bg-amber-300 text-[#3B2C73] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Descargar PDF</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Content or Locked Message */}
        {!isEligible ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-[#3B2C73]">
              Certificado Disponible al 100% de Avance
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Has completado el <strong>{progressPercent}%</strong> del programa{' '}
              <strong>{course.title}</strong>. Finaliza todas las lecciones y actividades para habilitar la descarga oficial de tu diploma.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#4B3B8B] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Volver al Aula Virtual
            </button>
          </div>
        ) : (
          <div className="p-8 md:p-12 bg-[#F4F6F9] flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white p-8 md:p-12 rounded-lg border-8 border-double border-[#4B3B8B]/30 shadow-lg relative text-center">
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#4B3B8B]/50" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#4B3B8B]/50" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#4B3B8B]/50" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#4B3B8B]/50" />

              {/* Institution Header */}
              <div className="mb-6 space-y-2">
                <img
                  src="/assets/aistudio/image_076e2ff0.png"
                  alt="CFP ÁGAPE"
                  className="w-16 h-16 mx-auto object-contain"
                />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4B3B8B] block">
                  Centro de Formación Profesional ÁGAPE
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  CERTIFICADO DE ACREDITACIÓN TÉCNICA
                </h2>
                <div className="w-24 h-0.5 bg-[#F2C94C] mx-auto mt-2" />
              </div>

              <p className="text-xs uppercase text-slate-500 tracking-wider mb-2">
                Se otorga el presente diploma institucional a:
              </p>

              {/* Authenticated Student Name */}
              <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#3B2C73] border-b-2 border-slate-200 inline-block px-8 py-2 mb-2">
                {studentName}
              </h3>
              {studentCode && (
                <div className="text-xs font-mono text-slate-500 mb-5">
                  Código / DUI Institucional: <strong>{studentCode}</strong>
                </div>
              )}

              <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed mb-6 mt-3">
                Por haber completado satisfactoriamente la totalidad de los módulos teóricos, prácticas de taller y evaluaciones del programa formativo:
              </p>

              {/* Course Title */}
              <div className="bg-[#FAFBFD] border border-slate-200 rounded-xl p-4 mb-8 max-w-xl mx-auto">
                <h4 className="text-lg md:text-xl font-bold text-slate-900 mb-1">
                  {course.title}
                </h4>
                <p className="text-xs text-slate-500">
                  Nivel {course.level} · {course.category} · {course.modules.length} Módulos Especializados
                </p>
              </div>

              {/* Signatures & Seal Row */}
              <div className="grid grid-cols-3 items-end pt-6 border-t border-slate-200 text-xs">
                <div className="text-center space-y-1">
                  <div className="font-serif italic text-base text-slate-700 h-8 flex items-center justify-center">
                    {course.instructor.name}
                  </div>
                  <div className="w-32 h-px bg-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800">{course.instructor.name}</p>
                  <p className="text-slate-500 text-[10px]">Docente Titular CFP ÁGAPE</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4B3B8B] to-[#6080B8] text-white flex items-center justify-center shadow-md p-1 border-2 border-[#F2C94C]">
                    <div className="w-full h-full rounded-full border border-white/40 flex flex-col items-center justify-center text-center p-1">
                      <ShieldCheck className="w-6 h-6 text-[#F2C94C] mb-0.5" />
                      <span className="text-[7px] font-black uppercase tracking-tighter">
                        OFICIAL
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-2">{issueDate}</span>
                </div>

                <div className="text-center space-y-1">
                  <div className="font-serif italic text-base text-slate-700 h-8 flex items-center justify-center">
                    Coordinación Académica
                  </div>
                  <div className="w-32 h-px bg-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800">Coordinación Cursos en Línea</p>
                  <p className="text-slate-500 text-[10px]">Dirección CFP ÁGAPE</p>
                </div>
              </div>

              {/* Certificate ID */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>FOLIO DE VERIFICACIÓN: {certificateId}</span>
                <span>CENTRO DE FORMACIÓN PROFESIONAL ÁGAPE</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
