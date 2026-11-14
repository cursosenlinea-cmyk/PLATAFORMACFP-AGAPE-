import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Award,
  Activity,
  CheckSquare,
  Square,
  Wrench,
  Cpu,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Send,
  ClipboardCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SimulatorLab,
  SimulatorStep,
  DiagnosticQuestion,
  GuidedWorkshopStep,
  SimulatorEvaluationResult,
} from '../../types/lms';
import { useLms } from '../../context/LmsContext';

interface AgapeSimulatorPlayerProps {
  simulator: SimulatorLab;
  onCompleted?: (score: number) => void;
  isTeacherPreview?: boolean;
}

export const AgapeSimulatorPlayer: React.FC<AgapeSimulatorPlayerProps> = ({
  simulator,
  onCompleted,
  isTeacherPreview = false,
}) => {
  const { evaluateSimulatorPracticeAI } = useLms();

  // State for Interactive Practice (Prompt-Based)
  const [activeStationIdx, setActiveStationIdx] = useState<number>(0);
  const [practiceResponses, setPracticeResponses] = useState<
    Record<string, { selectedOption?: string; writtenResponse: string }>
  >({});
  const [showStationHint, setShowStationHint] = useState<Record<string, boolean>>({});
  const [isEvaluatingPractice, setIsEvaluatingPractice] = useState<boolean>(false);
  const [practiceEvalResult, setPracticeEvalResult] =
    useState<SimulatorEvaluationResult | null>(null);

  // State for Case Scenario
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedOptionIdByStep, setSelectedOptionIdByStep] = useState<Record<number, string>>({});
  const [accumulatedScore, setAccumulatedScore] = useState<number>(0);
  const [isScenarioFinished, setIsScenarioFinished] = useState<boolean>(false);
  const [activeTelemetry, setActiveTelemetry] = useState<string>(
    simulator.initialInstrumentState || 'Estado del Caso: Listo para intervención'
  );

  // State for Diagnostic Test
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, number>>({});

  // State for Guided Workshop
  const [completedWorkshopSteps, setCompletedWorkshopSteps] = useState<Record<string, boolean>>({});
  const [studentMeasurements, setStudentMeasurements] = useState<Record<string, string>>({});
  const [isWorkshopSubmitted, setIsWorkshopSubmitted] = useState<boolean>(false);

  const handleRestart = () => {
    setActiveStationIdx(0);
    setPracticeResponses({});
    setShowStationHint({});
    setPracticeEvalResult(null);
    setCurrentStepIndex(0);
    setSelectedOptionIdByStep({});
    setAccumulatedScore(0);
    setIsScenarioFinished(false);
    setActiveTelemetry(
      simulator.initialInstrumentState || 'Estado del Caso: Listo para intervención'
    );
    setDiagnosticAnswers({});
    setCompletedWorkshopSteps({});
    setStudentMeasurements({});
    setIsWorkshopSubmitted(false);
  };

  useEffect(() => {
    handleRestart();
  }, [simulator.id]);

  // -------------------------------------------------------------
  // Render: 0. Simulador Interactivo por Indicaciones (Estaciones Abiertas + Evaluación IA)
  // -------------------------------------------------------------
  if (simulator.type === 'interactive_practice') {
    const stations = simulator.stations || [];
    const currentStation = stations[activeStationIdx];
    const totalStations = stations.length;

    const allStationsAnswered =
      totalStations > 0 &&
      stations.every(
        (st) => (practiceResponses[st.id]?.writtenResponse || '').trim().length >= 3
      );

    const handleSubmitPracticeEvaluation = async () => {
      setIsEvaluatingPractice(true);
      try {
        const result = await evaluateSimulatorPracticeAI({
          simulator,
          responses: practiceResponses,
        });
        setPracticeEvalResult(result);
        if (onCompleted) {
          onCompleted(result.score);
        }
      } finally {
        setIsEvaluatingPractice(false);
      }
    };

    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Top Scenario & Initial Data Dashboard */}
        <div className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] rounded-2xl p-5 md:p-6 text-white shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#F2C94C] text-[#3B2C73] text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">
                  Simulador Práctico Interactivo IA
                </span>
                {isTeacherPreview && (
                  <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-semibold px-2 py-0.5 rounded">
                    Vista Previa Docente
                  </span>
                )}
              </div>
              <h3 className="text-base md:text-lg font-extrabold text-white tracking-tight">
                {simulator.title}
              </h3>
            </div>

            <div className="flex items-center gap-3 bg-white/10 border border-white/15 px-4 py-2 rounded-xl shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-slate-200 uppercase font-semibold">Estación</div>
                <div className="text-sm font-mono font-bold text-[#F2C94C]">
                  {practiceEvalResult
                    ? 'Evaluado'
                    : `${Math.min(activeStationIdx + 1, totalStations)} / ${totalStations}`}
                </div>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-right">
                <div className="text-[10px] text-slate-200 uppercase font-semibold">Mínimo</div>
                <div className="text-sm font-mono font-bold text-white">
                  {simulator.passingScore}%
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Context */}
          <div className="p-3.5 bg-white/10 border border-white/15 rounded-xl text-xs text-slate-100 leading-relaxed">
            <div className="font-bold text-[#F2C94C] uppercase text-[10px] tracking-wider mb-1">
              Escenario Inicial del Caso Práctico
            </div>
            <p>{simulator.scenarioDescription}</p>
          </div>

          {/* Initial Case Data */}
          {simulator.initialContextData && (
            <div className="p-3.5 bg-slate-950/60 border border-emerald-400/30 rounded-xl font-mono text-xs text-emerald-200 flex items-start gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">
                  Datos de Entrada / Evidencia del Caso:
                </div>
                <div className="leading-relaxed">{simulator.initialContextData}</div>
              </div>
            </div>
          )}

          {/* Tools / Criteria */}
          {simulator.toolsRequired && simulator.toolsRequired.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-slate-200 font-semibold">Recursos / Criterios:</span>
              {simulator.toolsRequired.map((tool, i) => (
                <span
                  key={i}
                  className="bg-white/15 border border-white/20 px-2.5 py-0.5 rounded-lg text-white font-medium"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Evaluation Result Screen */}
        {practiceEvalResult ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    practiceEvalResult.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                      practiceEvalResult.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {practiceEvalResult.passed
                      ? 'Competencia Acreditada'
                      : 'Requiere Reforzamiento'}
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-1">
                    Evaluación IA: {practiceEvalResult.score} / 100
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRestart}
                className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar Práctica</span>
              </button>
            </div>

            <div className="p-4 bg-[#FCF9EF] border border-[#EDE7D3] rounded-xl text-xs text-slate-800 leading-relaxed">
              <div className="font-bold text-[#4B3B8B] mb-1">Dictamen General del Evaluador IA:</div>
              <p>{practiceEvalResult.overallFeedback}</p>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Fortalezas Demostradas</span>
                </div>
                <ul className="space-y-1 text-emerald-900 list-disc pl-4">
                  {practiceEvalResult.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Oportunidades de Mejora</span>
                </div>
                <ul className="space-y-1 text-amber-900 list-disc pl-4">
                  {practiceEvalResult.areasToImprove.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Per-station breakdown */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800">
                Retroalimentación Detallada por Estación:
              </div>
              {practiceEvalResult.stationFeedback.map((sf) => (
                <div
                  key={sf.stationNumber}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{sf.title}</span>
                    <span className="font-mono font-bold text-[#4B3B8B] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {sf.score}/100
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{sf.comment}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Station Execution Stepper */
          currentStation && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5 shadow-sm">
              {/* Station Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {stations.map((st, idx) => {
                  const isFilled =
                    (practiceResponses[st.id]?.writtenResponse || '').trim().length >= 3;
                  const isActive = idx === activeStationIdx;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setActiveStationIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[#4B3B8B] text-white border-[#4B3B8B]'
                          : isFilled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Estación {st.stationNumber}</span>
                      {isFilled && !isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Current Station Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm md:text-base font-extrabold text-[#3B2C73] flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-[#4B3B8B]" />
                    <span>{currentStation.title}</span>
                  </h4>
                  <span className="text-[10px] font-mono uppercase bg-[#F4F6F9] text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {currentStation.stationType === 'open_analysis'
                      ? 'Análisis de Datos'
                      : currentStation.stationType === 'decision_and_justification'
                      ? 'Decisión y Justificación'
                      : 'Procedimiento Paso a Paso'}
                  </span>
                </div>

                {currentStation.caseData && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                    <strong className="text-slate-900">Evidencia de la estación:</strong>{' '}
                    {currentStation.caseData}
                  </div>
                )}

                <div className="p-4 bg-[#FCF9EF] border border-[#EDE7D3] rounded-xl text-xs md:text-sm font-medium text-slate-900 leading-relaxed">
                  {currentStation.prompt}
                </div>
              </div>

              {/* Optional Decision Selection */}
              {currentStation.sampleOptions && currentStation.sampleOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Selecciona tu alternativa de decisión antes de justificar:
                  </label>
                  <div className="space-y-2">
                    {currentStation.sampleOptions.map((opt, idx) => {
                      const isPicked =
                        practiceResponses[currentStation.id]?.selectedOption === opt;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setPracticeResponses((prev) => ({
                              ...prev,
                              [currentStation.id]: {
                                selectedOption: opt,
                                writtenResponse: prev[currentStation.id]?.writtenResponse || '',
                              },
                            }))
                          }
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                            isPicked
                              ? 'border-[#4B3B8B] bg-[#F7F2FD] text-[#3B2C73] font-bold'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                              isPicked
                                ? 'bg-[#4B3B8B] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Open Written Response */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Tu Análisis, Procedimiento o Justificación Escrita:
                </label>
                <textarea
                  rows={5}
                  value={practiceResponses[currentStation.id]?.writtenResponse || ''}
                  onChange={(e) =>
                    setPracticeResponses((prev) => ({
                      ...prev,
                      [currentStation.id]: {
                        selectedOption: prev[currentStation.id]?.selectedOption,
                        writtenResponse: e.target.value,
                      },
                    }))
                  }
                  placeholder="Redacta detalladamente tu análisis, pasos de ejecución, decisiones y verificaciones finales..."
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4B3B8B] leading-relaxed"
                />
              </div>

              {/* Hint toggle */}
              {currentStation.hint && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setShowStationHint((prev) => ({
                        ...prev,
                        [currentStation.id]: !prev[currentStation.id],
                      }))
                    }
                    className="text-xs font-semibold text-[#6080B8] hover:text-[#4B3B8B] flex items-center gap-1 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-[#F2C94C]" />
                    <span>
                      {showStationHint[currentStation.id]
                        ? 'Ocultar orientación'
                        : 'Ver pista de orientación'}
                    </span>
                  </button>
                  {showStationHint[currentStation.id] && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      {currentStation.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Station Navigation & AI Evaluation Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveStationIdx((i) => Math.max(0, i - 1))}
                  disabled={activeStationIdx === 0}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Estación Anterior</span>
                </button>

                <div className="flex items-center gap-2 justify-end">
                  {activeStationIdx + 1 < totalStations ? (
                    <button
                      type="button"
                      onClick={() => setActiveStationIdx((i) => i + 1)}
                      className="px-5 py-2.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Siguiente Estación</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitPracticeEvaluation}
                      disabled={!allStationsAnswered || isEvaluatingPractice}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Send className={`w-4 h-4 text-[#F2C94C] ${isEvaluatingPractice ? 'animate-spin' : ''}`} />
                      <span>
                        {isEvaluatingPractice
                          ? 'Evaluando Razonamiento con IA...'
                          : 'Enviar Práctica para Evaluación IA'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 1. Simulador de Casos Prácticos
  // -------------------------------------------------------------
  if (simulator.type === 'case_scenario') {
    const steps: SimulatorStep[] = simulator.steps || [];
    const currentStep = steps[currentStepIndex];
    const totalSteps = steps.length;
    const selectedOptionId = selectedOptionIdByStep[currentStepIndex];

    const handleSelectOption = (optId: string) => {
      if (selectedOptionId) return;
      const opt = currentStep.options.find((o) => o.id === optId);
      if (!opt) return;

      setSelectedOptionIdByStep((prev) => ({ ...prev, [currentStepIndex]: optId }));
      setAccumulatedScore(Math.max(0, accumulatedScore + opt.scoreImpact));
      if (opt.instrumentReading) setActiveTelemetry(opt.instrumentReading);
    };

    const handleNextStep = () => {
      if (currentStepIndex + 1 < totalSteps) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setIsScenarioFinished(true);
        if (onCompleted) {
          onCompleted(Math.min(100, Math.round(accumulatedScore)));
        }
      }
    };

    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="bg-gradient-to-r from-slate-900 via-[#1C1438] to-slate-900 border border-slate-700/80 rounded-2xl p-5 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-[#F2C94C]/20 border border-[#F2C94C]/40 text-[#F2C94C] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Simulador de Decisiones en Taller
              </span>
              <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                {simulator.title}
              </h3>
            </div>

            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Puntaje</div>
                <div className="text-lg font-mono font-bold text-[#F2C94C]">
                  {Math.min(100, Math.round(accumulatedScore))} / 100
                </div>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Progreso</div>
                <div className="text-sm font-mono font-bold text-slate-200">
                  {isScenarioFinished ? 'Finalizado' : `Paso ${currentStepIndex + 1} de ${totalSteps}`}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="truncate">
                <span className="text-emerald-400 font-bold uppercase mr-2">[TELEMETRÍA AGAPE]:</span>
                <span className="text-emerald-200">{activeTelemetry}</span>
              </div>
            </div>
            <Activity className="w-3.5 h-3.5 text-emerald-400 hidden sm:block" />
          </div>
        </div>

        {isScenarioFinished ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <Award className="w-12 h-12 text-[#4B3B8B] mx-auto" />
            <h4 className="text-xl font-bold text-slate-900">
              Puntuación Obtenida: {Math.min(100, Math.round(accumulatedScore))} / 100
            </h4>
            <p className="text-xs text-slate-600 max-w-lg mx-auto">
              {simulator.learningOutcome}
            </p>
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-2.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar Simulación</span>
            </button>
          </div>
        ) : (
          currentStep && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4B3B8B]">
                  <Cpu className="w-4 h-4" />
                  <span>{currentStep.stageTitle}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800">
                  {currentStep.situation}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentStep.options.map((option, idx) => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleSelectOption(option.id)}
                      className={`p-4 rounded-xl border text-xs transition-all ${
                        !selectedOptionId
                          ? 'bg-white hover:bg-slate-50 border-slate-200 cursor-pointer hover:border-[#6080B8]'
                          : isSelected
                          ? option.isOptimal
                            ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
                            : 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : 'bg-slate-50/50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="font-bold text-slate-800">{option.actionText}</div>
                          {isSelected && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-200 mt-2">
                              <div className="font-semibold">{option.consequenceText}</div>
                              <div className="p-2 bg-white rounded-lg text-[11px] border border-slate-200">
                                {option.technicalExplanation}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedOptionId && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentStepIndex + 1 < totalSteps ? 'Siguiente Fase' : 'Finalizar'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 2. Prueba / Test de Diagnóstico
  // -------------------------------------------------------------
  if (simulator.type === 'diagnostic_test') {
    const questions: DiagnosticQuestion[] = simulator.questions || [];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(diagnosticAnswers).length;
    const correctCount = questions.filter(
      (q) => diagnosticAnswers[q.id] === q.correctOptionIndex
    ).length;
    const finalScore =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] rounded-2xl p-5 text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="bg-[#F2C94C]/20 text-[#F2C94C] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Test de Diagnóstico Técnico
            </span>
            <span className="text-xs font-mono">
              {answeredCount} de {totalQuestions}
            </span>
          </div>
          <h3 className="text-lg font-bold">{simulator.title}</h3>
          <p className="text-xs text-slate-200">{simulator.scenarioDescription}</p>
        </div>

        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const selectedIdx = diagnosticAnswers[q.id];
            const isAnswered = selectedIdx !== undefined;
            const isCorrect = isAnswered && selectedIdx === q.correctOptionIndex;

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
              >
                <div className="font-bold text-xs md:text-sm text-slate-800">
                  {qIdx + 1}. {q.question}
                </div>
                <div className="space-y-2">
                  {q.options.map((optText, optIdx) => {
                    const isCorrectOption = optIdx === q.correctOptionIndex;
                    const isOptionSelected = selectedIdx === optIdx;
                    let cls = 'bg-slate-50 hover:bg-[#E5EAF3] text-slate-800 border-slate-200';
                    if (isAnswered) {
                      if (isCorrectOption) cls = 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold';
                      else if (isOptionSelected) cls = 'bg-rose-50 text-rose-900 border-rose-300';
                      else cls = 'bg-slate-50 text-slate-400 border-slate-200';
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() =>
                          setDiagnosticAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between ${cls}`}
                      >
                        <span>
                          {String.fromCharCode(65 + optIdx)}) {optText}
                        </span>
                        {isAnswered && isCorrectOption && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {isAnswered && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    {q.technicalFeedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {answeredCount === totalQuestions && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-3">
            <h4 className="text-lg font-bold text-slate-900">
              Resultado Final: {finalScore} / 100
            </h4>
            <button
              type="button"
              onClick={handleRestart}
              className="px-5 py-2 bg-[#4B3B8B] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repetir Diagnóstico</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 3. Laboratorio de Pasos Guiados
  // -------------------------------------------------------------
  const workshopSteps: GuidedWorkshopStep[] = simulator.workshopSteps || [];
  const totalWorkshopSteps = workshopSteps.length;
  const completedCount = Object.values(completedWorkshopSteps).filter(Boolean).length;
  const progressPercent =
    totalWorkshopSteps > 0 ? Math.round((completedCount / totalWorkshopSteps) * 100) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4B3B8B]">
            <Wrench className="w-4 h-4" />
            <span>Guía Interactiva de Taller</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            {completedCount}/{totalWorkshopSteps} ({progressPercent}%)
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900">{simulator.title}</h3>
        <p className="text-xs text-slate-600">{simulator.scenarioDescription}</p>
      </div>

      <div className="space-y-3">
        {workshopSteps.map((step) => {
          const isDone = !!completedWorkshopSteps[step.id];
          return (
            <div
              key={step.id}
              className={`border rounded-2xl p-4 space-y-2 ${
                isDone ? 'bg-[#FAFBFD] border-emerald-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCompletedWorkshopSteps((prev) => ({
                      ...prev,
                      [step.id]: !prev[step.id],
                    }))
                  }
                  className="mt-0.5 cursor-pointer"
                >
                  {isDone ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <div className="space-y-1 flex-1">
                  <div className="text-xs font-bold text-slate-900">
                    Paso {step.stepNumber}: {step.checklistLabel}
                  </div>
                  <p className="text-xs text-slate-600">{step.instruction}</p>
                  {step.expectedMeasurement && (
                    <input
                      type="text"
                      placeholder={`Medición esperada: ${step.expectedMeasurement}`}
                      value={studentMeasurements[step.id] || ''}
                      onChange={(e) =>
                        setStudentMeasurements((prev) => ({
                          ...prev,
                          [step.id]: e.target.value,
                        }))
                      }
                      className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg font-mono mt-1"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        {isWorkshopSubmitted ? (
          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            Reiniciar Protocolo
          </button>
        ) : (
          <button
            type="button"
            disabled={completedCount === 0}
            onClick={() => {
              setIsWorkshopSubmitted(true);
              if (onCompleted) onCompleted(progressPercent);
            }}
            className="px-5 py-2.5 bg-[#4B3B8B] text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            Finalizar Protocolo
          </button>
        )}
      </div>
    </div>
  );
};
