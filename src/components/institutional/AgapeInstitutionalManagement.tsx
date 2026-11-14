import React, { useMemo, useState } from 'react';
import {
  Building2,
  Users,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  Plus,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Edit3,
  Trash2,
  X,
  Phone,
  MapPin,
  Package,
  HeartHandshake,
  FileSpreadsheet,
  Save,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import {
  AttendanceStatus,
  InstitutionalLogEntry,
  InstitutionalLogType,
  InstitutionalYouth,
  YouthSex,
  YouthStatus,
} from '../../types/lms';

const PRESET_WORKSHOPS = [
  'Mecánica Automotriz',
  'Panadería y Repostería',
  'Inglés Comunicativo',
  'Electricidad Residencial e Industrial',
  'Habilidades Blandas y Empleabilidad',
  'Corte y Confección',
  'Informática y Ofimática',
];

const EL_SALVADOR_DEPARTMENTS = [
  'Sonsonate',
  'Santa Ana',
  'Ahuachapán',
  'La Libertad',
  'San Salvador',
  'Cuscatlán',
  'La Paz',
  'Cabañas',
  'San Vicente',
  'Usulután',
  'San Miguel',
  'Morazán',
  'La Unión',
  'Chalatenango',
];

const SHIFT_OPTIONS = [
  'Matutino (8:00 AM - 12:00 PM)',
  'Vespertino (1:00 PM - 5:00 PM)',
  'Sabatino (8:00 AM - 4:00 PM)',
  'Intensivo Semanal',
];

const PROGRAM_CATEGORIES = [
  'Programa Presencial CFP ÁGAPE',
  'Taller Comunitario',
  'Beca de Formación Técnica',
  'Curso Externo / Convenio',
];

type SubModuleTab = 'expedientes' | 'asistencia' | 'bitacora' | 'reportes';

export const AgapeInstitutionalManagement: React.FC = () => {
  const {
    currentAuthUser,
    institutionalYouths,
    institutionalAttendance,
    institutionalLogs,
    upsertInstitutionalYouth,
    deleteInstitutionalYouth,
    saveInstitutionalAttendance,
    addInstitutionalLog,
    deleteInstitutionalLog,
  } = useLms();

  const [subTab, setSubTab] = useState<SubModuleTab>('expedientes');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Dynamic list of all workshops (presets + any custom workshops entered in records)
  const allWorkshops = useMemo(() => {
    const set = new Set<string>(PRESET_WORKSHOPS);
    for (const y of institutionalYouths) {
      if (y.assignedWorkshop?.trim()) set.add(y.assignedWorkshop.trim());
    }
    return Array.from(set);
  }, [institutionalYouths]);

  // Helper: compute historical attendance stats for a youth
  const getYouthAttendanceStats = useMemo(() => {
    return (youthId: string, workshopFilter?: string) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let justified = 0;
      let total = 0;

      for (const session of institutionalAttendance) {
        if (workshopFilter && session.workshop !== workshopFilter) continue;
        const st = session.records?.[youthId];
        if (!st) continue;
        total++;
        if (st === 'present') present++;
        else if (st === 'absent') absent++;
        else if (st === 'late') late++;
        else if (st === 'justified') justified++;
      }

      const effectiveAttended = present + late + justified;
      const percentage = total > 0 ? Math.round((effectiveAttended / total) * 100) : 100;
      const hasAbsenceAlert = absent >= 2 || (total >= 3 && percentage < 75);

      return { present, absent, late, justified, total, percentage, hasAbsenceAlert };
    };
  }, [institutionalAttendance]);

  // =========================================================
  // SUB-MÓDULO 1: EXPEDIENTE GENERAL DE JÓVENES
  // =========================================================
  const [youthSearch, setYouthSearch] = useState<string>('');
  const [youthWorkshopFilter, setYouthWorkshopFilter] = useState<string>('all');
  const [youthStatusFilter, setYouthStatusFilter] = useState<'all' | YouthStatus>('all');
  const [confirmDeleteYouthId, setConfirmDeleteYouthId] = useState<string | null>(null);

  const [showYouthModal, setShowYouthModal] = useState<boolean>(false);
  const [editingYouth, setEditingYouth] = useState<InstitutionalYouth | null>(null);

  // Youth Form Fields
  const [yFullName, setYFullName] = useState<string>('');
  const [yAge, setYAge] = useState<string>('18');
  const [ySex, setYSex] = useState<YouthSex>('Femenino');
  const [yDui, setYDui] = useState<string>('');
  const [yDepartment, setYDepartment] = useState<string>('Sonsonate');
  const [yMunicipality, setYMunicipality] = useState<string>('');
  const [yCanton, setYCanton] = useState<string>('');
  const [yPersonalPhone, setYPersonalPhone] = useState<string>('');
  const [yGuardianPhone, setYGuardianPhone] = useState<string>('');
  const [yWorkshop, setYWorkshop] = useState<string>(PRESET_WORKSHOPS[0]);
  const [yCustomWorkshop, setYCustomWorkshop] = useState<string>('');
  const [yShift, setYShift] = useState<string>(SHIFT_OPTIONS[0]);
  const [yStatus, setYStatus] = useState<YouthStatus>('Activo');
  const [yProgramCategory, setYProgramCategory] = useState<string>(PROGRAM_CATEGORIES[0]);
  const [yNotes, setYNotes] = useState<string>('');

  const openNewYouthModal = () => {
    setEditingYouth(null);
    setYFullName('');
    setYAge('18');
    setYSex('Femenino');
    setYDui('');
    setYDepartment('Sonsonate');
    setYMunicipality('');
    setYCanton('');
    setYPersonalPhone('');
    setYGuardianPhone('');
    setYWorkshop(PRESET_WORKSHOPS[0]);
    setYCustomWorkshop('');
    setYShift(SHIFT_OPTIONS[0]);
    setYStatus('Activo');
    setYProgramCategory(PROGRAM_CATEGORIES[0]);
    setYNotes('');
    setShowYouthModal(true);
  };

  const openEditYouthModal = (youth: InstitutionalYouth) => {
    setEditingYouth(youth);
    setYFullName(youth.fullName);
    setYAge(String(youth.age));
    setYSex(youth.sex);
    setYDui(youth.duiOrBirthCert);
    setYDepartment(youth.department);
    setYMunicipality(youth.municipality);
    setYCanton(youth.cantonOrColonia);
    setYPersonalPhone(youth.personalPhone);
    setYGuardianPhone(youth.guardianPhone);
    if (PRESET_WORKSHOPS.includes(youth.assignedWorkshop)) {
      setYWorkshop(youth.assignedWorkshop);
      setYCustomWorkshop('');
    } else {
      setYWorkshop('__custom__');
      setYCustomWorkshop(youth.assignedWorkshop);
    }
    setYShift(youth.scheduleShift || SHIFT_OPTIONS[0]);
    setYStatus(youth.status);
    setYProgramCategory(youth.programCategory || PROGRAM_CATEGORIES[0]);
    setYNotes(youth.notes || '');
    setShowYouthModal(true);
  };

  const handleSaveYouthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWorkshop =
      yWorkshop === '__custom__' ? yCustomWorkshop.trim() || 'Taller Especial' : yWorkshop;
    if (!yFullName.trim()) return;

    const nowIso = new Date().toISOString();
    const youthPayload: InstitutionalYouth = {
      id: editingYouth ? editingYouth.id : `youth-${Date.now()}`,
      fullName: yFullName.trim(),
      age: Math.max(10, Math.min(99, parseInt(yAge, 10) || 18)),
      sex: ySex,
      duiOrBirthCert: yDui.trim() || 'Pendiente',
      department: yDepartment,
      municipality: yMunicipality.trim() || 'No especificado',
      cantonOrColonia: yCanton.trim() || 'No especificado',
      personalPhone: yPersonalPhone.trim() || '—',
      guardianPhone: yGuardianPhone.trim() || '—',
      assignedWorkshop: finalWorkshop,
      scheduleShift: yShift,
      status: yStatus,
      programCategory: yProgramCategory,
      enrollmentDate: editingYouth?.enrollmentDate || nowIso.slice(0, 10),
      notes: yNotes.trim() || undefined,
      createdBy: editingYouth?.createdBy || currentAuthUser?.name || 'Coordinación',
      createdAt: editingYouth?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    upsertInstitutionalYouth(youthPayload);
    showToast(
      editingYouth
        ? `Expediente de ${youthPayload.fullName} actualizado.`
        : `Joven ${youthPayload.fullName} registrado en ${finalWorkshop}.`
    );
    setShowYouthModal(false);
  };

  const filteredYouths = useMemo(() => {
    const q = youthSearch.trim().toLowerCase();
    return institutionalYouths.filter((y) => {
      const matchesWorkshop =
        youthWorkshopFilter === 'all' || y.assignedWorkshop === youthWorkshopFilter;
      const matchesStatus = youthStatusFilter === 'all' || y.status === youthStatusFilter;
      const matchesSearch =
        !q ||
        y.fullName.toLowerCase().includes(q) ||
        y.duiOrBirthCert.toLowerCase().includes(q) ||
        y.municipality.toLowerCase().includes(q) ||
        y.cantonOrColonia.toLowerCase().includes(q) ||
        y.assignedWorkshop.toLowerCase().includes(q);
      return matchesWorkshop && matchesStatus && matchesSearch;
    });
  }, [institutionalYouths, youthSearch, youthWorkshopFilter, youthStatusFilter]);

  // =========================================================
  // SUB-MÓDULO 2: TOMA Y CONTROL DE ASISTENCIA POR CURSO/TALLER
  // =========================================================
  const [attWorkshop, setAttWorkshop] = useState<string>(allWorkshops[0] || PRESET_WORKSHOPS[0]);
  const [attDate, setAttDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const sessionKey = `${attWorkshop}::${attDate}`;
  const existingAttSession = useMemo(
    () => institutionalAttendance.find((s) => s.id === sessionKey),
    [institutionalAttendance, sessionKey]
  );

  const [draftRecords, setDraftRecords] = useState<Record<string, AttendanceStatus>>({});
  const [draftObservations, setDraftObservations] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (existingAttSession) {
      setDraftRecords(existingAttSession.records || {});
      setDraftObservations(existingAttSession.observations || {});
    } else {
      setDraftRecords({});
      setDraftObservations({});
    }
  }, [sessionKey, existingAttSession]);

  const attRosterYouths = useMemo(() => {
    return institutionalYouths.filter(
      (y) =>
        y.assignedWorkshop === attWorkshop &&
        (y.status === 'Activo' || Boolean(draftRecords[y.id]))
    );
  }, [institutionalYouths, attWorkshop, draftRecords]);

  const handleMarkAttendance = (youthId: string, status: AttendanceStatus) => {
    setDraftRecords((prev) => ({ ...prev, [youthId]: status }));
  };

  const handleMarkAllPresent = () => {
    const next: Record<string, AttendanceStatus> = { ...draftRecords };
    for (const y of attRosterYouths) {
      next[y.id] = 'present';
    }
    setDraftRecords(next);
  };

  const handleSaveAttendanceSession = () => {
    saveInstitutionalAttendance({
      id: sessionKey,
      workshop: attWorkshop,
      date: attDate,
      records: draftRecords,
      observations: draftObservations,
      recordedBy: currentAuthUser?.name || 'Coordinador CFP ÁGAPE',
      updatedAt: new Date().toISOString(),
    });
    showToast(`Asistencia guardada para ${attWorkshop} (${attDate}).`);
  };

  const sessionCounts = useMemo(() => {
    let p = 0;
    let a = 0;
    let l = 0;
    let j = 0;
    for (const y of attRosterYouths) {
      const st = draftRecords[y.id];
      if (st === 'present') p++;
      else if (st === 'absent') a++;
      else if (st === 'late') l++;
      else if (st === 'justified') j++;
    }
    return { p, a, l, j };
  }, [attRosterYouths, draftRecords]);

  // =========================================================
  // SUB-MÓDULO 3: OTROS REGISTROS INSTITUCIONALES (BITÁCORA)
  // =========================================================
  const [logFilterType, setLogFilterType] = useState<'all' | InstitutionalLogType>('all');
  const [logSearch, setLogSearch] = useState<string>('');
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState<string | null>(null);

  const [lType, setLType] = useState<InstitutionalLogType>('supply_delivery');
  const [lDate, setLDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [lWorkshop, setLWorkshop] = useState<string>(allWorkshops[0] || PRESET_WORKSHOPS[0]);
  const [lYouthId, setLYouthId] = useState<string>('');
  const [lTitle, setLTitle] = useState<string>('');
  const [lQuantity, setLQuantity] = useState<string>('');
  const [lDetails, setLDetails] = useState<string>('');
  const [lResponsible, setLResponsible] = useState<string>(
    currentAuthUser?.name || 'Coordinación CFP ÁGAPE'
  );

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lTitle.trim() || !lDetails.trim()) return;
    const selectedYouth = institutionalYouths.find((y) => y.id === lYouthId);

    const newEntry: InstitutionalLogEntry = {
      id: `log-${Date.now()}`,
      type: lType,
      date: lDate,
      workshop:
        lType === 'group_minutes'
          ? lWorkshop
          : selectedYouth?.assignedWorkshop || lWorkshop || undefined,
      youthId: lType === 'group_minutes' ? undefined : selectedYouth?.id,
      youthName: lType === 'group_minutes' ? undefined : selectedYouth?.fullName,
      title: lTitle.trim(),
      quantity: lType === 'supply_delivery' ? lQuantity.trim() || '1 kit' : undefined,
      details: lDetails.trim(),
      responsible: lResponsible.trim() || currentAuthUser?.name || 'Coordinación',
      createdAt: new Date().toISOString(),
    };

    addInstitutionalLog(newEntry);
    showToast('Registro añadido a la bitácora institucional.');
    setLTitle('');
    setLQuantity('');
    setLDetails('');
  };

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return institutionalLogs.filter((entry) => {
      const matchesType = logFilterType === 'all' || entry.type === logFilterType;
      const matchesSearch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        (entry.youthName && entry.youthName.toLowerCase().includes(q)) ||
        (entry.workshop && entry.workshop.toLowerCase().includes(q)) ||
        entry.responsible.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [institutionalLogs, logFilterType, logSearch]);

  // =========================================================
  // SUB-MÓDULO 4: REPORTES Y EXPORTACIÓN EXCEL/CSV
  // =========================================================
  const [repWorkshop, setRepWorkshop] = useState<string>('all');
  const [repAgeRange, setRepAgeRange] = useState<
    'all' | '14-17' | '18-21' | '22-25' | '26+'
  >('all');
  const [repStatus, setRepStatus] = useState<'all' | YouthStatus>('all');
  const [repStartDate, setRepStartDate] = useState<string>('');
  const [repEndDate, setRepEndDate] = useState<string>('');

  const reportYouths = useMemo(() => {
    return institutionalYouths.filter((y) => {
      const matchesWorkshop = repWorkshop === 'all' || y.assignedWorkshop === repWorkshop;
      const matchesStatus = repStatus === 'all' || y.status === repStatus;
      const matchesAge =
        repAgeRange === 'all' ||
        (repAgeRange === '14-17' && y.age >= 14 && y.age <= 17) ||
        (repAgeRange === '18-21' && y.age >= 18 && y.age <= 21) ||
        (repAgeRange === '22-25' && y.age >= 22 && y.age <= 25) ||
        (repAgeRange === '26+' && y.age >= 26);
      const matchesDate =
        (!repStartDate || y.enrollmentDate >= repStartDate) &&
        (!repEndDate || y.enrollmentDate <= repEndDate);
      return matchesWorkshop && matchesStatus && matchesAge && matchesDate;
    });
  }, [institutionalYouths, repWorkshop, repStatus, repAgeRange, repStartDate, repEndDate]);

  const reportAttendanceSessions = useMemo(() => {
    return institutionalAttendance.filter((s) => {
      const matchesWorkshop = repWorkshop === 'all' || s.workshop === repWorkshop;
      const matchesDate =
        (!repStartDate || s.date >= repStartDate) && (!repEndDate || s.date <= repEndDate);
      return matchesWorkshop && matchesDate;
    });
  }, [institutionalAttendance, repWorkshop, repStartDate, repEndDate]);

  const reportLogs = useMemo(() => {
    return institutionalLogs.filter((l) => {
      const matchesWorkshop = repWorkshop === 'all' || l.workshop === repWorkshop;
      const matchesDate =
        (!repStartDate || l.date >= repStartDate) && (!repEndDate || l.date <= repEndDate);
      return matchesWorkshop && matchesDate;
    });
  }, [institutionalLogs, repWorkshop, repStartDate, repEndDate]);

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleExportYouthsCsv = () => {
    downloadCsv(
      `expediente_jovenes_cfp_agape_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Nombre Completo',
        'Edad',
        'Sexo',
        'DUI / Partida',
        'Departamento',
        'Municipio',
        'Canton / Colonia',
        'Tel. Personal',
        'Tel. Encargado',
        'Curso / Taller',
        'Turno / Horario',
        'Estado',
        'Asistencia (%)',
        'Inasistencias',
        'Fecha Ingreso',
      ],
      reportYouths.map((y) => {
        const stats = getYouthAttendanceStats(y.id, y.assignedWorkshop);
        return [
          y.fullName,
          y.age,
          y.sex,
          y.duiOrBirthCert,
          y.department,
          y.municipality,
          y.cantonOrColonia,
          y.personalPhone,
          y.guardianPhone,
          y.assignedWorkshop,
          y.scheduleShift,
          y.status,
          `${stats.percentage}%`,
          stats.absent,
          y.enrollmentDate,
        ];
      })
    );
    showToast('Listado de expedientes exportado en Excel/CSV.');
  };

  const handleExportAttendanceCsv = () => {
    const statusLabel: Record<AttendanceStatus, string> = {
      present: 'Presente',
      absent: 'Ausente',
      late: 'Tardanza',
      justified: 'Justificado',
    };
    const rows: (string | number)[][] = [];
    for (const session of reportAttendanceSessions) {
      for (const [yId, st] of Object.entries(session.records || {})) {
        const y = institutionalYouths.find((item) => item.id === yId);
        if (!y) continue;
        if (repStatus !== 'all' && y.status !== repStatus) continue;
        rows.push([
          session.date,
          session.workshop,
          y.fullName,
          y.duiOrBirthCert,
          statusLabel[st] || st,
          session.observations?.[yId] || '',
          session.recordedBy,
        ]);
      }
    }
    downloadCsv(
      `asistencia_institucional_cfp_agape_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Fecha',
        'Curso / Taller',
        'Nombre del Joven',
        'DUI / Partida',
        'Estado Asistencia',
        'Observacion',
        'Registrado Por',
      ],
      rows
    );
    showToast('Reporte de asistencia exportado en Excel/CSV.');
  };

  const handleExportLogsCsv = () => {
    const typeLabel: Record<InstitutionalLogType, string> = {
      supply_delivery: 'Entrega de Insumos/Kits',
      psychosocial_followup: 'Seguimiento Psicosocial / Llamada',
      group_minutes: 'Acta / Observacion de Grupo',
    };
    downloadCsv(
      `bitacora_institucional_cfp_agape_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Fecha', 'Tipo', 'Curso / Taller', 'Joven', 'Titulo / Motivo', 'Cantidad', 'Detalle / Acuerdos', 'Responsable'],
      reportLogs.map((l) => [
        l.date,
        typeLabel[l.type],
        l.workshop || 'General',
        l.youthName || 'Grupo',
        l.title,
        l.quantity || '—',
        l.details,
        l.responsible,
      ])
    );
    showToast('Bitácora institucional exportada en Excel/CSV.');
  };

  // High-level institutional counters
  const activeYouthCount = institutionalYouths.filter((y) => y.status === 'Activo').length;
  const graduatedCount = institutionalYouths.filter((y) => y.status === 'Egresado').length;
  const absenceAlertCount = institutionalYouths.filter(
    (y) => y.status === 'Activo' && getYouthAttendanceStats(y.id, y.assignedWorkshop).hasAbsenceAlert
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
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

      {/* Institutional Header Banner */}
      <div className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Coordinación de Programas Presenciales, Talleres Comunitarios y Becas</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Gestión Institucional · CFP ÁGAPE
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              Expediente general de jóvenes beneficiarios, toma de asistencia diaria por taller, entrega de kits, seguimiento psicosocial y reportes en Excel/CSV.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewYouthModal}
            className="px-4 py-2.5 bg-[#F2C94C] hover:bg-amber-300 text-[#3B2C73] text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Joven</span>
          </button>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5 mt-5 border-t border-white/20">
          <div className="bg-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-200 block">Jóvenes Registrados</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-white">
              {institutionalYouths.length}
            </span>
            <span className="text-[11px] text-emerald-300 block">
              {activeYouthCount} activos · {graduatedCount} egresados
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-200 block">Talleres / Cursos Activos</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-white">
              {allWorkshops.length}
            </span>
            <span className="text-[11px] text-slate-200 block">
              {institutionalAttendance.length} sesiones de asistencia
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-200 block">Alertas de Inasistencia</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-[#F2C94C]">
              {absenceAlertCount}
            </span>
            <span className="text-[11px] text-slate-200 block">
              Jóvenes con 2+ ausencias o &lt;75%
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-200 block">Registros en Bitácora</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-white">
              {institutionalLogs.length}
            </span>
            <span className="text-[11px] text-slate-200 block">
              Kits, monitoreo y actas
            </span>
          </div>
        </div>
      </div>

      {/* Sub-module Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1">
        {(
          [
            {
              id: 'expedientes',
              label: `Expediente de Jóvenes (${institutionalYouths.length})`,
              icon: Users,
            },
            {
              id: 'asistencia',
              label: 'Control de Asistencia',
              icon: CalendarCheck,
            },
            {
              id: 'bitacora',
              label: `Bitácora y Seguimiento (${institutionalLogs.length})`,
              icon: ClipboardList,
            },
            {
              id: 'reportes',
              label: 'Reportes y Exportación CSV',
              icon: BarChart3,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 min-w-[175px] py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#4B3B8B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SUB-MÓDULO 1: EXPEDIENTE GENERAL DE JÓVENES               */}
      {/* ========================================================= */}
      {subTab === 'expedientes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['all', 'Activo', 'Egresado', 'Desertor/Retirado'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setYouthStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      youthStatusFilter === st
                        ? 'bg-white text-[#3B2C73] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'Todos' : st}
                  </button>
                ))}
              </div>

              <select
                value={youthWorkshopFilter}
                onChange={(e) => setYouthWorkshopFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value="all">Todos los cursos/talleres</option>
                {allWorkshops.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 lg:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={youthSearch}
                  onChange={(e) => setYouthSearch(e.target.value)}
                  placeholder="Buscar por nombre, DUI, cantón..."
                  className="w-full lg:w-64 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                />
              </div>

              <button
                type="button"
                onClick={openNewYouthModal}
                className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Expediente</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Joven / Identificación</th>
                    <th className="py-3 px-4">Ubicación Exacta</th>
                    <th className="py-3 px-4">Teléfonos</th>
                    <th className="py-3 px-4">Curso / Taller y Turno</th>
                    <th className="py-3 px-4">Asistencia</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredYouths.map((y) => {
                    const stats = getYouthAttendanceStats(y.id, y.assignedWorkshop);
                    return (
                      <tr key={y.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{y.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                            {y.age} años · {y.sex} · DUI/Partida: {y.duiOrBirthCert}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-start gap-1 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-[#6080B8] shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold">
                                {y.municipality}, {y.department}
                              </div>
                              <div className="text-[11px] text-slate-500">{y.cantonOrColonia}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono tabular-nums text-[11px] text-slate-700">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>Pers: {y.personalPhone}</span>
                          </div>
                          <div className="text-slate-500">Enc: {y.guardianPhone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-[#3B2C73]">{y.assignedWorkshop}</div>
                          <div className="text-[11px] text-slate-500">{y.scheduleShift}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono tabular-nums font-bold text-slate-800">
                            {stats.total > 0 ? `${stats.percentage}%` : 'Sin sesiones'}
                          </div>
                          {stats.hasAbsenceAlert && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{stats.absent} ausencias</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                              y.status === 'Activo'
                                ? 'text-emerald-700'
                                : y.status === 'Egresado'
                                ? 'text-[#4B3B8B]'
                                : 'text-rose-700'
                            }`}
                          >
                            {y.status === 'Activo' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : y.status === 'Egresado' ? (
                              <FileText className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            <span>{y.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {confirmDeleteYouthId === y.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteInstitutionalYouth(y.id);
                                  setConfirmDeleteYouthId(null);
                                  showToast(`Expediente de ${y.fullName} eliminado.`);
                                }}
                                className="px-2 py-1 bg-rose-600 text-white text-[11px] font-bold rounded-md cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteYouthId(null)}
                                className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-md cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditYouthModal(y)}
                                className="p-1.5 text-slate-500 hover:text-[#4B3B8B] hover:bg-purple-50 rounded-lg cursor-pointer"
                                title="Editar expediente"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteYouthId(y.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Eliminar expediente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredYouths.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center space-y-3">
                        <Users className="w-9 h-9 text-slate-300 mx-auto" />
                        <div className="text-xs font-bold text-slate-700">
                          No hay expedientes registrados con estos criterios
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Registra a los jóvenes atendidos en cursos presenciales, talleres comunitarios o programas de becas del CFP ÁGAPE.
                        </p>
                        <button
                          type="button"
                          onClick={openNewYouthModal}
                          className="px-4 py-2 bg-[#4B3B8B] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Registrar Primer Joven</span>
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-MÓDULO 2: TOMA Y CONTROL DE ASISTENCIA                */}
      {/* ========================================================= */}
      {subTab === 'asistencia' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-2xl">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Curso / Taller Presencial
                </label>
                <select
                  value={attWorkshop}
                  onChange={(e) => setAttWorkshop(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
                >
                  {allWorkshops.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Fecha de Sesión
                </label>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={attRosterYouths.length === 0}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
              >
                Marcar Todos Presente
              </button>
              <button
                type="button"
                onClick={handleSaveAttendanceSession}
                disabled={attRosterYouths.length === 0}
                className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Asistencia</span>
              </button>
            </div>
          </div>

          {/* Live Session Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4 font-semibold">
              <span className="text-emerald-700 font-mono tabular-nums">
                Presentes: {sessionCounts.p}
              </span>
              <span className="text-rose-700 font-mono tabular-nums">
                Ausentes: {sessionCounts.a}
              </span>
              <span className="text-amber-700 font-mono tabular-nums">
                Tardanzas: {sessionCounts.l}
              </span>
              <span className="text-[#4B3B8B] font-mono tabular-nums">
                Justificados: {sessionCounts.j}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {existingAttSession
                ? `Última actualización: ${new Date(existingAttSession.updatedAt).toLocaleString()} por ${existingAttSession.recordedBy}`
                : 'Sesión pendiente de guardar'}
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Joven</th>
                    <th className="py-3 px-4">Histórico (%)</th>
                    <th className="py-3 px-4">Marcar Estado de Sesión</th>
                    <th className="py-3 px-4">Observación (Opcional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attRosterYouths.map((y) => {
                    const currentStatus = draftRecords[y.id];
                    const hist = getYouthAttendanceStats(y.id, attWorkshop);

                    return (
                      <tr key={y.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{y.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {y.duiOrBirthCert} · {y.scheduleShift}
                          </div>
                          {hist.hasAbsenceAlert && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 mt-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>
                                Alerta: {hist.absent} inasistencias acumuladas ({hist.percentage}%)
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono tabular-nums font-bold text-[#3B2C73]">
                            {hist.total > 0 ? `${hist.percentage}%` : '100%'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {hist.present}P · {hist.absent}A · {hist.late}T · {hist.justified}J
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(
                              [
                                {
                                  id: 'present',
                                  label: 'Presente',
                                  icon: CheckCircle2,
                                  activeCls: 'bg-emerald-600 text-white border-emerald-600',
                                },
                                {
                                  id: 'absent',
                                  label: 'Ausente',
                                  icon: XCircle,
                                  activeCls: 'bg-rose-600 text-white border-rose-600',
                                },
                                {
                                  id: 'late',
                                  label: 'Tardanza',
                                  icon: Clock,
                                  activeCls: 'bg-amber-500 text-white border-amber-500',
                                },
                                {
                                  id: 'justified',
                                  label: 'Justificado',
                                  icon: FileText,
                                  activeCls: 'bg-[#4B3B8B] text-white border-[#4B3B8B]',
                                },
                              ] as const
                            ).map((btn) => {
                              const Icon = btn.icon;
                              const isSelected = currentStatus === btn.id;
                              return (
                                <button
                                  key={btn.id}
                                  type="button"
                                  onClick={() => handleMarkAttendance(y.id, btn.id)}
                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                    isSelected
                                      ? btn.activeCls
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  <span>{btn.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={draftObservations[y.id] || ''}
                            onChange={(e) =>
                              setDraftObservations((prev) => ({
                                ...prev,
                                [y.id]: e.target.value,
                              }))
                            }
                            placeholder="Motivo o nota..."
                            className="w-full min-w-[160px] p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {attRosterYouths.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center space-y-2">
                        <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
                        <div className="text-xs font-bold text-slate-700">
                          No hay jóvenes activos inscritos en {attWorkshop}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Registra jóvenes en el taller desde la pestaña "Expediente de Jóvenes" para pasar lista aquí.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-MÓDULO 3: BITÁCORA Y SEGUIMIENTO INSTITUCIONAL        */}
      {/* ========================================================= */}
      {subTab === 'bitacora' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Form Column (5 cols) */}
          <form
            onSubmit={handleAddLogSubmit}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 text-xs"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#3B2C73]">
                Nuevo Registro en Bitácora Institucional
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Documenta entregas de kits, llamadas de monitoreo psicosocial o actas de grupo.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Tipo de Registro</label>
              <div className="grid grid-cols-1 gap-1.5">
                {(
                  [
                    {
                      id: 'supply_delivery',
                      label: 'Entrega de Insumos / Kits / Materiales',
                      icon: Package,
                    },
                    {
                      id: 'psychosocial_followup',
                      label: 'Seguimiento Psicosocial / Llamada de Monitoreo',
                      icon: HeartHandshake,
                    },
                    {
                      id: 'group_minutes',
                      label: 'Observación General / Acta de Grupo por Curso',
                      icon: ClipboardList,
                    },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLType(item.id)}
                      className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                        lType === item.id
                          ? 'border-[#4B3B8B] bg-[#FAF8FF] text-[#3B2C73]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={lDate}
                  onChange={(e) => setLDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Curso / Taller</label>
                <select
                  value={lWorkshop}
                  onChange={(e) => setLWorkshop(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  {allWorkshops.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {lType !== 'group_minutes' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Joven Beneficiario (Opcional si es entrega general)
                </label>
                <select
                  value={lYouthId}
                  onChange={(e) => setLYouthId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="">-- Seleccionar joven o dejar general --</option>
                  {institutionalYouths.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.fullName} ({y.assignedWorkshop})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={lType === 'supply_delivery' ? 'sm:col-span-2' : 'sm:col-span-3'}>
                <label className="block font-bold text-slate-700 mb-1">
                  {lType === 'supply_delivery'
                    ? 'Insumo / Kit Entregado *'
                    : lType === 'psychosocial_followup'
                    ? 'Motivo del Seguimiento *'
                    : 'Tema del Acta / Observación *'}
                </label>
                <input
                  type="text"
                  required
                  value={lTitle}
                  onChange={(e) => setLTitle(e.target.value)}
                  placeholder={
                    lType === 'supply_delivery'
                      ? 'Ej. Kit de herramientas eléctricas / Uniforme'
                      : lType === 'psychosocial_followup'
                      ? 'Ej. Llamada por 2 inasistencias consecutivas'
                      : 'Ej. Reunión semanal de avances de grupo'
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              {lType === 'supply_delivery' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad</label>
                  <input
                    type="text"
                    value={lQuantity}
                    onChange={(e) => setLQuantity(e.target.value)}
                    placeholder="Ej. 1 kit"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {lType === 'psychosocial_followup'
                  ? 'Acuerdos y Observaciones *'
                  : 'Descripción / Detalles *'}
              </label>
              <textarea
                rows={3}
                required
                value={lDetails}
                onChange={(e) => setLDetails(e.target.value)}
                placeholder="Detalla los acuerdos alcanzados, condición de entrega u observaciones..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Responsable</label>
              <input
                type="text"
                required
                value={lResponsible}
                onChange={(e) => setLResponsible(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white font-bold rounded-xl cursor-pointer"
            >
              Guardar en Bitácora Institucional
            </button>
          </form>

          {/* Feed Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'all', label: 'Todos' },
                    { id: 'supply_delivery', label: 'Insumos' },
                    { id: 'psychosocial_followup', label: 'Seguimiento' },
                    { id: 'group_minutes', label: 'Actas' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLogFilterType(f.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      logFilterType === f.id
                        ? 'bg-white text-[#3B2C73] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filtrar bitácora..."
                  className="w-full sm:w-52 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {filteredLogs.map((entry) => {
                const typeLabel =
                  entry.type === 'supply_delivery'
                    ? 'Entrega de Insumos / Kit'
                    : entry.type === 'psychosocial_followup'
                    ? 'Seguimiento Psicosocial'
                    : 'Acta / Observación de Grupo';

                return (
                  <div key={entry.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-semibold text-[#4B3B8B]">
                          {typeLabel} · <span className="font-mono tabular-nums">{entry.date}</span>
                          {entry.workshop ? ` · ${entry.workshop}` : ''}
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {entry.title}
                          {entry.quantity ? (
                            <span className="text-xs font-mono text-slate-600 ml-2">
                              ({entry.quantity})
                            </span>
                          ) : null}
                        </h4>
                      </div>

                      {confirmDeleteLogId === entry.id ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              deleteInstitutionalLog(entry.id);
                              setConfirmDeleteLogId(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white text-[11px] font-bold rounded cursor-pointer"
                          >
                            Eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteLogId(null)}
                            className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] rounded cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteLogId(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer shrink-0"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{entry.details}</p>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1">
                      {entry.youthName && (
                        <span>
                          Joven: <strong className="text-slate-700">{entry.youthName}</strong>
                        </span>
                      )}
                      <span>
                        Responsable: <strong className="text-slate-700">{entry.responsible}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="p-10 text-center space-y-2">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    Sin registros en la bitácora todavía
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Utiliza el formulario lateral para documentar entregas de insumos, llamadas de monitoreo o actas grupales.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-MÓDULO 4: REPORTES Y EXPORTACIÓN CSV / EXCEL          */}
      {/* ========================================================= */}
      {subTab === 'reportes' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#3B2C73]">
                Filtros de Reporte Institucional y Exportación a Excel / CSV
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Segmenta la población atendida por curso/taller, rango de edad, estado y fechas antes de descargar los reportes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Curso / Taller</label>
                <select
                  value={repWorkshop}
                  onChange={(e) => setRepWorkshop(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="all">Todos los talleres</option>
                  {allWorkshops.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rango de Edad</label>
                <select
                  value={repAgeRange}
                  onChange={(e) =>
                    setRepAgeRange(
                      e.target.value as 'all' | '14-17' | '18-21' | '22-25' | '26+'
                    )
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="all">Todas las edades</option>
                  <option value="14-17">14 a 17 años</option>
                  <option value="18-21">18 a 21 años</option>
                  <option value="22-25">22 a 25 años</option>
                  <option value="26+">26 años o más</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado</label>
                <select
                  value={repStatus}
                  onChange={(e) => setRepStatus(e.target.value as 'all' | YouthStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="all">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Egresado">Egresado</option>
                  <option value="Desertor/Retirado">Desertor/Retirado</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={repStartDate}
                  onChange={(e) => setRepStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={repEndDate}
                  onChange={(e) => setRepEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-[#FAFBFD] flex flex-col justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold text-[#3B2C73]">
                    Expediente General de Jóvenes
                  </div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
                    {reportYouths.length} registros
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Incluye datos sociodemográficos, teléfonos, taller asignado y % de asistencia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportYouthsCsv}
                  disabled={reportYouths.length === 0}
                  className="w-full py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Jóvenes (Excel/CSV)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-[#FAFBFD] flex flex-col justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold text-[#3B2C73]">
                    Control de Asistencia por Sesión
                  </div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
                    {reportAttendanceSessions.length} sesiones
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Detalle por fecha, taller y estado (Presente, Ausente, Tardanza, Justificado).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAttendanceCsv}
                  disabled={reportAttendanceSessions.length === 0}
                  className="w-full py-2 bg-[#6080B8] hover:bg-[#4e6ca1] disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Asistencia (Excel/CSV)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-[#FAFBFD] flex flex-col justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold text-[#3B2C73]">
                    Bitácora de Insumos y Seguimiento
                  </div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
                    {reportLogs.length} registros
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Historial completo de kits entregados, seguimiento psicosocial y actas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportLogsCsv}
                  disabled={reportLogs.length === 0}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Bitácora (Excel/CSV)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR / EDITAR EXPEDIENTE DE JOVEN             */}
      {/* ========================================================= */}
      {showYouthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-[#3B2C73] to-[#4B3B8B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F2C94C]" />
                <h3 className="text-sm font-bold">
                  {editingYouth
                    ? `Editar Expediente: ${editingYouth.fullName}`
                    : 'Registrar Nuevo Joven en Gestión Institucional'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowYouthModal(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveYouthSubmit}
              className="p-5 space-y-4 text-xs overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={yFullName}
                    onChange={(e) => setYFullName(e.target.value)}
                    placeholder="Nombre completo del joven"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Edad <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={99}
                    required
                    value={yAge}
                    onChange={(e) => setYAge(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-bold text-slate-700 mb-1">Sexo</label>
                  <select
                    value={ySex}
                    onChange={(e) => setYSex(e.target.value as YouthSex)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    DUI o Partida de Nacimiento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={yDui}
                    onChange={(e) => setYDui(e.target.value)}
                    placeholder="Ej. 05912834-2 o Partida #120"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono Personal</label>
                  <input
                    type="tel"
                    value={yPersonalPhone}
                    onChange={(e) => setYPersonalPhone(e.target.value)}
                    placeholder="Ej. 7845-1200"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono de Encargado
                  </label>
                  <input
                    type="tel"
                    value={yGuardianPhone}
                    onChange={(e) => setYGuardianPhone(e.target.value)}
                    placeholder="Ej. 7920-4501"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departamento</label>
                  <select
                    value={yDepartment}
                    onChange={(e) => setYDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {EL_SALVADOR_DEPARTMENTS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Municipio <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={yMunicipality}
                    onChange={(e) => setYMunicipality(e.target.value)}
                    placeholder="Ej. Sonsonate Centro"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cantón / Colonia / Dirección <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={yCanton}
                    onChange={(e) => setYCanton(e.target.value)}
                    placeholder="Ej. Col. Sensunapán, Psj. 3"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Curso o Taller Asignado <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={yWorkshop}
                    onChange={(e) => setYWorkshop(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {allWorkshops.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                    <option value="__custom__">+ Otro taller / curso personalizado...</option>
                  </select>
                  {yWorkshop === '__custom__' && (
                    <input
                      type="text"
                      required
                      value={yCustomWorkshop}
                      onChange={(e) => setYCustomWorkshop(e.target.value)}
                      placeholder="Nombre del curso o taller"
                      className="w-full mt-2 p-2.5 bg-white border border-[#4B3B8B] rounded-lg text-slate-900"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Turno / Horario</label>
                  <select
                    value={yShift}
                    onChange={(e) => setYShift(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {SHIFT_OPTIONS.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado del Joven</label>
                  <select
                    value={yStatus}
                    onChange={(e) => setYStatus(e.target.value as YouthStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Egresado">Egresado</option>
                    <option value="Desertor/Retirado">Desertor/Retirado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Modalidad / Programa
                  </label>
                  <select
                    value={yProgramCategory}
                    onChange={(e) => setYProgramCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {PROGRAM_CATEGORIES.map((pc) => (
                      <option key={pc} value={pc}>
                        {pc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observaciones Generales (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={yNotes}
                  onChange={(e) => setYNotes(e.target.value)}
                  placeholder="Información médica relevante, beca o notas iniciales..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowYouthModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B3B8B] hover:bg-[#3B2C73] text-white font-bold rounded-lg cursor-pointer"
                >
                  {editingYouth ? 'Guardar Cambios' : 'Guardar Expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
