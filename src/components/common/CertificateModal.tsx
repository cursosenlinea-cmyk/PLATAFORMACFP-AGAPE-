import React, { useMemo, useState } from 'react';
import {
  X,
  Award,
  Printer,
  Check,
  Copy,
  ShieldCheck,
  Lock,
  Download,
  Clock,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { Course } from '../../types/lms';
import { useLms } from '../../context/LmsContext';

interface CertificateModalProps {
  course: Course | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ course, onClose }) => {
  const {
    currentAuthUser,
    currentUser,
    getCourseProgressPercent,
    progress,
    requestCertificate,
  } = useLms();
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingPng, setDownloadingPng] = useState<boolean>(false);

  const studentName = currentAuthUser?.name || currentUser.name;
  const studentCode = currentAuthUser?.institutionalCode;

  const fallbackCertificateId = useMemo(() => {
    if (!course) return 'CFP-CERT';
    const userSuffix = (currentAuthUser?.id || 'EST').slice(-4).toUpperCase();
    return `CFP-${course.id.substring(0, 6).toUpperCase()}-${userSuffix}`;
  }, [course, currentAuthUser]);

  if (!course) return null;

  const progressKey = `${currentAuthUser?.id || 'guest'}::${course.id}`;
  const courseProgress = progress[progressKey];
  const certReq = courseProgress?.certificateRequest;
  const certStatus = certReq?.status || 'none';

  const progressPercent = getCourseProgressPercent(course.id);
  const isCompleted100 = progressPercent >= 100;
  const isApproved = isCompleted100 && certStatus === 'approved';
  const isPending = isCompleted100 && certStatus === 'pending';
  const isRejected = isCompleted100 && certStatus === 'rejected';

  const certificateId = certReq?.certificateFolio || fallbackCertificateId;

  const issueDateSource = certReq?.reviewedAt || courseProgress?.certificateIssuedAt;
  const issueDate = (issueDateSource ? new Date(issueDateSource) : new Date()).toLocaleDateString(
    'es-SV',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  const handlePrint = () => {
    if (!isApproved) return;
    window.print();
  };

  const handleCopyCredential = () => {
    if (!isApproved) return;
    navigator.clipboard?.writeText?.(
      `CFP ÁGAPE · Certificado Oficial ${certificateId} · ${studentName} · ${course.title}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCertificatePng = async () => {
    if (!isApproved || downloadingPng) return;
    setDownloadingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 990;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // White paper background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle outer cream margin
      ctx.fillStyle = '#FAFBFD';
      ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);

      // Double institutional borders
      ctx.strokeStyle = '#4B3B8B';
      ctx.lineWidth = 6;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.strokeStyle = '#F2C94C';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);

      // Corner ornaments
      const corners = [
        [68, 68, 1, 1],
        [canvas.width - 68, 68, -1, 1],
        [68, canvas.height - 68, 1, -1],
        [canvas.width - 68, canvas.height - 68, -1, -1],
      ];
      ctx.strokeStyle = '#4B3B8B';
      ctx.lineWidth = 3;
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * 36);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + dx * 36, cy);
        ctx.stroke();
      });

      // Load institutional logo gracefully
      const loadLogo = () =>
        new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = '/assets/aistudio/image_076e2ff0.png';
          setTimeout(() => resolve(null), 2000);
        });

      const logoImg = await loadLogo();
      if (logoImg) {
        ctx.drawImage(logoImg, canvas.width / 2 - 52, 78, 104, 104);
      }

      const centerX = canvas.width / 2;

      // Header text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4B3B8B';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('CENTRO DE FORMACIÓN PROFESIONAL ÁGAPE', centerX, 212);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 44px Georgia, serif';
      ctx.fillText('CERTIFICADO DE ACREDITACIÓN TÉCNICA', centerX, 268);

      // Gold bar
      ctx.fillStyle = '#F2C94C';
      ctx.fillRect(centerX - 90, 288, 180, 4);

      ctx.fillStyle = '#64748B';
      ctx.font = '600 18px sans-serif';
      ctx.fillText('SE OTORGA EL PRESENTE DIPLOMA INSTITUCIONAL A:', centerX, 342);

      // Student Name
      ctx.fillStyle = '#3B2C73';
      ctx.font = 'bold 52px Georgia, serif';
      ctx.fillText(studentName, centerX, 412);

      // Underline under name
      const nameWidth = Math.min(760, Math.max(360, ctx.measureText(studentName).width + 80));
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - nameWidth / 2, 430);
      ctx.lineTo(centerX + nameWidth / 2, 430);
      ctx.stroke();

      if (studentCode) {
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 17px monospace';
        ctx.fillText(`Código / DUI Institucional: ${studentCode}`, centerX, 464);
      }

      // Description paragraph
      ctx.fillStyle = '#334155';
      ctx.font = '21px sans-serif';
      ctx.fillText(
        'Por haber completado satisfactoriamente la totalidad de los módulos teóricos,',
        centerX,
        516
      );
      ctx.fillText(
        'prácticas de taller y evaluaciones aprobadas del programa formativo:',
        centerX,
        546
      );

      // Course box
      ctx.fillStyle = '#F4F6F9';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.fillRect(210, 578, canvas.width - 420, 114);
      ctx.strokeRect(210, 578, canvas.width - 420, 114);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 30px sans-serif';
      const truncatedTitle =
        course.title.length > 56 ? `${course.title.slice(0, 53)}...` : course.title;
      ctx.fillText(truncatedTitle, centerX, 626);

      ctx.fillStyle = '#4B3B8B';
      ctx.font = '600 18px sans-serif';
      ctx.fillText(
        `Nivel ${course.level}  ·  ${course.category}  ·  ${course.modules.length} Módulos Especializados`,
        centerX,
        666
      );

      // Divider above signatures
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 736);
      ctx.lineTo(canvas.width - 120, 736);
      ctx.stroke();

      // Left signature (Instructor)
      ctx.fillStyle = '#334155';
      ctx.font = 'italic 26px Georgia, serif';
      ctx.fillText(course.instructor.name, 330, 790);
      ctx.strokeStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(190, 804);
      ctx.lineTo(470, 804);
      ctx.stroke();
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(course.instructor.name, 330, 830);
      ctx.fillStyle = '#64748B';
      ctx.font = '14px sans-serif';
      ctx.fillText('Docente Titular CFP ÁGAPE', 330, 852);

      // Center Official Seal
      ctx.beginPath();
      ctx.arc(centerX, 798, 44, 0, Math.PI * 2);
      ctx.fillStyle = '#4B3B8B';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#F2C94C';
      ctx.stroke();
      ctx.fillStyle = '#F2C94C';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('OFICIAL', centerX, 795);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('CFP ÁGAPE', centerX, 813);

      ctx.fillStyle = '#475569';
      ctx.font = '14px monospace';
      ctx.fillText(issueDate, centerX, 868);

      // Right signature (Coordination)
      ctx.fillStyle = '#334155';
      ctx.font = 'italic 26px Georgia, serif';
      ctx.fillText('Coordinación Académica', canvas.width - 330, 790);
      ctx.strokeStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(canvas.width - 470, 804);
      ctx.lineTo(canvas.width - 190, 804);
      ctx.stroke();
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText('Coordinación Cursos en Línea', canvas.width - 330, 830);
      ctx.fillStyle = '#64748B';
      ctx.font = '14px sans-serif';
      ctx.fillText('Dirección CFP ÁGAPE', canvas.width - 330, 852);

      // Footer Verification Folio
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`FOLIO DE VERIFICACIÓN: ${certificateId}`, 80, 916);
      ctx.textAlign = 'right';
      ctx.fillText('CENTRO DE FORMACIÓN PROFESIONAL ÁGAPE · EL SALVADOR', canvas.width - 80, 916);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Certificado_CFP_AGAPE_${certificateId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 bg-[#3B2C73] text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F2C94C]" />
            <span className="font-bold text-sm tracking-wide">
              {isApproved
                ? 'Certificado Oficial Emitido · CFP ÁGAPE'
                : isPending
                ? 'Solicitud de Certificado en Revisión Administrativa'
                : isCompleted100
                ? 'Programa 100% Completado · Pendiente de Autorización'
                : `Progreso actual: ${progressPercent}% (Se requiere 100% para solicitar certificado)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isApproved && (
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
                  onClick={handleDownloadCertificatePng}
                  disabled={downloadingPng}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {downloadingPng ? 'Generando...' : 'Descargar Certificado (PNG)'}
                  </span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-[#F2C94C] hover:bg-amber-300 text-[#3B2C73] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
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

        {/* Certificate Content or Controlled Workflow States */}
        {!isCompleted100 ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-[#3B2C73]">
              Certificado Disponible al 100% de Avance Automático
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Has completado el <strong>{progressPercent}%</strong> del programa{' '}
              <strong>{course.title}</strong>. Reproduce todos los videos hasta el final, entrega las tareas asignadas y aprueba los simuladores habilitados para solicitar tu certificado.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#4B3B8B] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Volver al Aula Virtual
            </button>
          </div>
        ) : isPending ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-[#3B2C73]">
              Solicitud Enviada a Administración
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Tu solicitud para el curso <strong>{course.title}</strong> fue registrada correctamente. La Administración del CFP ÁGAPE revisará las calificaciones registradas por tu docente antes de autorizar la descarga de tu diploma.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#4B3B8B] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Entendido
            </button>
          </div>
        ) : !isApproved ? (
          <div className="p-10 text-center space-y-4">
            <div
              className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${
                isRejected
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-[#FAF8FF] border-[#4B3B8B]/20 text-[#4B3B8B]'
              }`}
            >
              {isRejected ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <GraduationCap className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-lg font-extrabold text-[#3B2C73]">
              {isRejected
                ? 'Solicitud Devuelta por Administración'
                : '¡100% Completado! Solicita tu Certificado'}
            </h3>
            {isRejected && certReq?.rejectionNote && (
              <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <strong>Observación administrativa:</strong> {certReq.rejectionNote}
              </div>
            )}
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Has cumplido el 100% de los requisitos automáticos de <strong>{course.title}</strong>. Envía tu solicitud para que Administración valide tus calificaciones y autorice la emisión oficial.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => requestCertificate(course.id)}
                className="px-5 py-2.5 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-[#F2C94C]" />
                <span>
                  {isRejected ? 'Volver a Solicitar Certificado' : 'Solicitar Certificado'}
                </span>
              </button>
            </div>
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
                Por haber completado satisfactoriamente la totalidad de los módulos teóricos, prácticas de taller y evaluaciones aprobadas del programa formativo:
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
