import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  FlaskConical,
  Settings,
  Eye,
  CheckCircle2,
  Trash2,
  RotateCcw,
  HelpCircle,
  Wrench,
  Cpu,
  MessageSquareText,
  ClipboardList,
  Plus,
} from 'lucide-react';
import {
  SimulatorLab,
  SimulatorLabType,
  SimulatorStation,
} from '../../types/lms';
import { useLms } from '../../context/LmsContext';
import { AgapeSimulatorPlayer } from './AgapeSimulatorPlayer';

interface SimulatorLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  courseTitle: string;
  currentSimulator?: SimulatorLab;
  onSaved: (sim: SimulatorLab) => void;
  onDeleted: () => void;
}

const EXAMPLE_PROMPTS = [
  'Simula una atención al cliente difícil en recepción con reclamo por demora',
  'Diagnóstico paso a paso de un fallo eléctrico con sobrecorriente en tablero',
  'Elaboración y auditoría de un presupuesto con errores ocultos de cálculo e IVA',
];

export const SimulatorLabModal: React.FC<SimulatorLabModalProps> = ({
  isOpen,
  onClose,
  courseId,
  moduleId,
  lessonId,
  lessonTitle,
  moduleTitle,
  courseTitle,
  currentSimulator,
  onSaved,
  onDeleted,
}) => {
  const { generateSimulatorLabAI, saveSimulatorLab, deleteSimulatorLab } = useLms();

  const [activeTab, setActiveTab] = useState<'configure' | 'preview'>('configure');
  const [selectedType, setSelectedType] = useState<SimulatorLabType>(
    currentSimulator?.type || 'interactive_practice'
  );
  const [promptInstructions, setPromptInstructions] = useState<string>(
    currentSimulator?.authorPrompt || ''
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [draftSimulator, setDraftSimulator] = useState<SimulatorLab | null>(
    currentSimulator || null
  );

  useEffect(() => {
    if (currentSimulator) {
      setDraftSimulator(currentSimulator);
      setSelectedType(currentSimulator.type);
      setPromptInstructions(currentSimulator.authorPrompt || '');
    } else {
      setDraftSimulator(null);
      setSelectedType('interactive_practice');
      setPromptInstructions('');
    }
    setConfirmDelete(false);
    setActiveTab('configure');
  }, [currentSimulator, lessonTitle, isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async (forcedType?: SimulatorLabType) => {
    setIsGenerating(true);
    const typeToUse = forcedType || selectedType;
    try {
      const generated = await generateSimulatorLabAI(
        lessonTitle,
        moduleTitle,
        courseTitle,
        typeToUse,
        'Formación Técnica',
        promptInstructions.trim()
      );
      setDraftSimulator({
        ...generated,
        authorPrompt: promptInstructions.trim() || generated.authorPrompt,
      });
      setSelectedType(typeToUse);
    } catch (e) {
      console.warn('Error generating simulator:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLesson = () => {
    if (!draftSimulator) return;
    saveSimulatorLab(courseId, moduleId, lessonId, draftSimulator);
    onSaved(draftSimulator);
    onClose();
  };

  const handleDeleteFromLesson = () => {
    deleteSimulatorLab(courseId, moduleId, lessonId);
    setDraftSimulator(null);
    setConfirmDelete(false);
    onDeleted();
    onClose();
  };

  const handleUpdateStation = (
    stationId: string,
    updates: Partial<SimulatorStation>
  ) => {
    setDraftSimulator((prev) => {
      if (!prev || !prev.stations) return prev;
      return {
        ...prev,
        stations: prev.stations.map((st) =>
          st.id === stationId ? { ...st, ...updates } : st
        ),
      };
    });
  };

  const handleAddStation = () => {
    setDraftSimulator((prev) => {
      if (!prev) return prev;
      const existing = prev.stations || [];
      const nextNum = existing.length + 1;
      const newStation: SimulatorStation = {
        id: 'st-' + Date.now(),
        stationNumber: nextNum,
        title: `Estación ${nextNum}: Nueva Etapa de Ejecución`,
        stationType: 'open_analysis',
        prompt: 'Describe el análisis o procedimiento que debe ejecutar el estudiante en esta estación.',
        caseData: 'Datos o condición de la estación.',
        expectedCriteria: 'Criterios técnicos o conceptuales que evaluará la IA.',
        requiresWrittenResponse: true,
        hint: 'Pista orientadora para el estudiante.',
      };
      return {
        ...prev,
        stations: [...existing, newStation],
      };
    });
  };

  const handleRemoveStation = (stationId: string) => {
    setDraftSimulator((prev) => {
      if (!prev || !prev.stations || prev.stations.length <= 1) return prev;
      const filtered = prev.stations
        .filter((s) => s.id !== stationId)
        .map((s, idx) => ({ ...s, stationNumber: idx + 1 }));
      return { ...prev, stations: filtered };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FlaskConical className="w-5 h-5 text-[#F2C94C]" />
            </div>
            <div>
              <div className="text-xs text-slate-200 font-semibold uppercase tracking-wider flex items-center gap-2">
                <span>Simulador de Práctica Interactiva por Indicaciones</span>
                <span className="text-[10px] bg-[#F2C94C] text-[#3B2C73] font-bold px-1.5 py-0.2 rounded">
                  CFP ÁGAPE
                </span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                {lessonTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between px-6 pt-2 border-b border-slate-200 bg-slate-50/60 overflow-x-auto">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('configure')}
              className={`py-3 px-2 text-xs md:text-sm font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'configure'
                  ? 'border-[#4B3B8B] text-[#4B3B8B]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Indicaciones y Estructura del Caso</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              disabled={!draftSimulator}
              className={`py-3 px-2 text-xs md:text-sm font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-[#4B3B8B] text-[#4B3B8B]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 disabled:opacity-40'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Probar Simulador</span>
              {draftSimulator && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>

          {draftSimulator && (
            <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
              Modo: <strong className="text-[#4B3B8B] uppercase">{draftSimulator.type}</strong>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'configure' ? (
            <div className="space-y-6">
              {/* Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  1. Modalidad del Simulador / Laboratorio:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div
                    onClick={() => setSelectedType('interactive_practice')}
                    className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      selectedType === 'interactive_practice'
                        ? 'border-[#4B3B8B] bg-[#F7F2FD] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#4B3B8B] text-white flex items-center justify-center">
                        <MessageSquareText className="w-4 h-4 text-[#F2C94C]" />
                      </div>
                      <span className="text-[9px] font-extrabold bg-[#F2C94C] text-[#3B2C73] px-1.5 py-0.5 rounded uppercase">
                        Recomendado
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      Práctica por Indicaciones (IA)
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Escenario abierto por estaciones: el alumno analiza datos, redacta procedimientos y recibe evaluación IA.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedType('case_scenario')}
                    className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      selectedType === 'case_scenario'
                        ? 'border-[#4B3B8B] bg-[#F7F2FD] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#4B3B8B]/10 text-[#4B3B8B] flex items-center justify-center mb-2">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      Decisiones en Taller
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Simulación con toma de decisiones secuenciales, consecuencias y telemetría.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedType('diagnostic_test')}
                    className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      selectedType === 'diagnostic_test'
                        ? 'border-[#4B3B8B] bg-[#F7F2FD] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#6080B8]/15 text-[#4B3B8B] flex items-center justify-center mb-2">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      Test de Diagnóstico
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Evaluación analítica con casos de estudio y retroalimentación inmediata.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedType('guided_workshop')}
                    className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      selectedType === 'guided_workshop'
                        ? 'border-[#4B3B8B] bg-[#F7F2FD] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      Pasos Guiados (Checklist)
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Protocolo de banco de trabajo con verificación de pasos y registro de mediciones.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prompt / Instructions Input Card */}
              <div className="p-5 bg-[#FCF9EF] border border-[#EDE7D3] rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-[#4B3B8B]" />
                    <span>2. Indicaciones del Escenario Práctico (Prompt para la IA):</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    La IA diseñará el caso y evaluará las respuestas del alumno según estas indicaciones
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={promptInstructions}
                  onChange={(e) => setPromptInstructions(e.target.value)}
                  placeholder='Ej. "Simula una atención al cliente difícil en recepción", "Diagnóstico paso a paso de un fallo eléctrico" o "Elaboración de un presupuesto con errores ocultos"...'
                  className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4B3B8B] leading-relaxed"
                />

                {/* Example chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 mr-1">Ejemplos rápidos:</span>
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPromptInstructions(ex)}
                      className="text-[10px] px-2.5 py-1 bg-white hover:bg-[#F7F2FD] border border-slate-200 hover:border-[#4B3B8B] rounded-lg text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={isGenerating}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 text-[#F2C94C] ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>
                      {isGenerating
                        ? 'Construyendo Simulador Interactivo...'
                        : '✨ Generar Simulador desde Indicaciones'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Editable Simulator Preview */}
              {draftSimulator && (
                <div className="border border-slate-200 rounded-2xl p-5 space-y-5 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Práctica Generada (Editable por Administrador / Docente)
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className="text-xs font-bold text-[#4B3B8B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ejecutar Vista Alumno</span>
                    </button>
                  </div>

                  {/* Title & Passing Score */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-2 space-y-1">
                      <label className="font-bold text-slate-700 block">Título de la Práctica:</label>
                      <input
                        type="text"
                        value={draftSimulator.title}
                        onChange={(e) =>
                          setDraftSimulator((prev) =>
                            prev ? { ...prev, title: e.target.value } : null
                          )
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">
                        Puntaje Mínimo de Aprobación (%):
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={draftSimulator.passingScore}
                        onChange={(e) =>
                          setDraftSimulator((prev) =>
                            prev ? { ...prev, passingScore: Number(e.target.value) } : null
                          )
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Scenario Description */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700 block">
                      Contexto y Escenario Inicial del Problema:
                    </label>
                    <textarea
                      rows={3}
                      value={draftSimulator.scenarioDescription}
                      onChange={(e) =>
                        setDraftSimulator((prev) =>
                          prev ? { ...prev, scenarioDescription: e.target.value } : null
                        )
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs leading-relaxed"
                    />
                  </div>

                  {/* Initial Context Data (if interactive_practice) */}
                  {draftSimulator.type === 'interactive_practice' && (
                    <div className="space-y-4">
                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-700 block">
                          Datos Iniciales del Caso (Registros, Mediciones o Valores que analiza el alumno):
                        </label>
                        <textarea
                          rows={2}
                          value={draftSimulator.initialContextData || ''}
                          onChange={(e) =>
                            setDraftSimulator((prev) =>
                              prev ? { ...prev, initialContextData: e.target.value } : null
                            )
                          }
                          className="w-full p-3 bg-[#FAFBFD] border border-slate-300 rounded-lg font-mono text-slate-800 text-xs"
                        />
                      </div>

                      {/* Editable Stations */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            Estaciones / Pasos de Ejecución ({draftSimulator.stations?.length || 0}):
                          </span>
                          <button
                            type="button"
                            onClick={handleAddStation}
                            className="px-3 py-1 bg-[#F7F2FD] hover:bg-[#EDE4FB] text-[#4B3B8B] border border-[#CBB8E8] rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir Estación</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(draftSimulator.stations || []).map((st) => (
                            <div
                              key={st.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={st.title}
                                  onChange={(e) =>
                                    handleUpdateStation(st.id, { title: e.target.value })
                                  }
                                  className="flex-1 p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                                />
                                {(draftSimulator.stations?.length || 0) > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStation(st.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                    title="Eliminar estación"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <textarea
                                rows={2}
                                value={st.prompt}
                                onChange={(e) =>
                                  handleUpdateStation(st.id, { prompt: e.target.value })
                                }
                                placeholder="Consigna o reto de esta estación..."
                                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                    Criterio de Evaluación IA:
                                  </label>
                                  <input
                                    type="text"
                                    value={st.expectedCriteria}
                                    onChange={(e) =>
                                      handleUpdateStation(st.id, {
                                        expectedCriteria: e.target.value,
                                      })
                                    }
                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-700"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                    Pista Opcional:
                                  </label>
                                  <input
                                    type="text"
                                    value={st.hint || ''}
                                    onChange={(e) =>
                                      handleUpdateStation(st.id, { hint: e.target.value })
                                    }
                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-700"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Legacy summary bar for other modes */}
                  {draftSimulator.type !== 'interactive_practice' && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        {draftSimulator.type === 'case_scenario' && (
                          <span>
                            {draftSimulator.steps?.length || 0} Fases de Decisión Técnica
                          </span>
                        )}
                        {draftSimulator.type === 'diagnostic_test' && (
                          <span>
                            {draftSimulator.questions?.length || 0} Preguntas de Diagnóstico
                          </span>
                        )}
                        {draftSimulator.type === 'guided_workshop' && (
                          <span>
                            {draftSimulator.workshopSteps?.length || 0} Pasos Guiados de Taller
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGenerate(draftSimulator.type)}
                        disabled={isGenerating}
                        className="text-xs text-[#4B3B8B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Regenerar</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center justify-between">
                <span>
                  <strong>Vista Previa Docente:</strong> Prueba las estaciones y la evaluación IA antes de guardar.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('configure')}
                  className="px-3 py-1 bg-white border border-indigo-300 text-indigo-800 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  Volver a Editar
                </button>
              </div>

              {draftSimulator && (
                <AgapeSimulatorPlayer simulator={draftSimulator} isTeacherPreview={true} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {currentSimulator && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar de esta Lección</span>
              </button>
            )}
            {confirmDelete && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-rose-700 font-semibold">¿Confirmar eliminación?</span>
                <button
                  type="button"
                  onClick={handleDeleteFromLesson}
                  className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 bg-white border border-slate-300 text-slate-600 rounded-lg cursor-pointer"
                >
                  No
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveToLesson}
              disabled={!draftSimulator}
              className="px-6 py-2.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F2C94C]" />
              <span>Guardar Simulador en la Lección</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
