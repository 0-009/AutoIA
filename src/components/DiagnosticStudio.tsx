import React, { useState } from 'react';
import { 
  Wrench, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Layers, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Info,
  Car,
  FileDown,
  ChevronDown
} from 'lucide-react';
import { AutomotiveSystem, DiagnosticResult, VehicleProfile } from '../types/auto';
import { generateAutomotivePDF } from '../utils/pdfGenerator';

interface DiagnosticStudioProps {
  activeVehicle: VehicleProfile | null;
  onOpenVehicleModal: () => void;
  onTransferToChat: (message: string, diagnostic?: DiagnosticResult) => void;
  onDiagnosticUpdated?: (diagnostic: DiagnosticResult) => void;
}

const COMMON_SYMPTOM_PRESETS = [
  {
    title: 'Cascabeleo / pistoneo en el motor al acelerar en subida',
    system: 'Motor' as AutomotiveSystem,
    conditions: 'Al acelerar bajo carga (subida o rebase), con motor a temperatura normal',
    warningLights: 'Ninguno o Check Engine intermitente'
  },
  {
    title: 'Pedal de freno esponjoso que se va hasta el fondo',
    system: 'Frenos' as AutomotiveSystem,
    conditions: 'Al frenar con fuerza o en frenadas sucesivas',
    warningLights: 'Testigo de Frenos (!) o ABS'
  },
  {
    title: 'Humo azul por el tubo de escape al acelerar tras estar en ralentí',
    system: 'Motor' as AutomotiveSystem,
    conditions: 'Al acelerar después de un semáforo o en arranque en frío',
    warningLights: 'Ninguno inicialmente'
  },
  {
    title: 'Vibración fuerte en el volante entre 80 y 110 km/h',
    system: 'Suspensión' as AutomotiveSystem,
    conditions: 'En carretera recta a velocidad constante de 90-100 km/h',
    warningLights: 'Ninguno'
  },
  {
    title: 'La aguja de temperatura sube al rojo en tráfico lento pero baja en carretera',
    system: 'Refrigeración' as AutomotiveSystem,
    conditions: 'En tráfico pesado o con el auto detenido con motor encendido',
    warningLights: 'Testigo de alta temperatura / Check Engine'
  },
  {
    title: 'Tironeo o retardo brusco al meter Drive o al pasar de 1ª a 2ª velocidad',
    system: 'Transmisión' as AutomotiveSystem,
    conditions: 'Al iniciar la marcha o en aceleración moderada',
    warningLights: 'Check Engine o testigo O/D / AT'
  },
  {
    title: 'Marcha pesada o chasquido rápido al girar la llave sin encender',
    system: 'Sistema Eléctrico' as AutomotiveSystem,
    conditions: 'Por las mañanas con motor frío o tras dejar el auto estacionado',
    warningLights: 'Testigo de Batería encendido'
  },
  {
    title: 'Zumbido continuo que aumenta con la velocidad en curvas',
    system: 'Suspensión' as AutomotiveSystem,
    conditions: 'A más de 40 km/h, se agrava al cargar peso hacia un lado en curva',
    warningLights: 'Ninguno'
  }
];

export const DiagnosticStudio: React.FC<DiagnosticStudioProps> = ({
  activeVehicle,
  onOpenVehicleModal,
  onTransferToChat,
  onDiagnosticUpdated,
}) => {
  const [selectedSystem, setSelectedSystem] = useState<AutomotiveSystem>('Motor');
  const [symptomDescription, setSymptomDescription] = useState('');
  const [operatingConditions, setOperatingConditions] = useState('');
  const [warningLights, setWarningLights] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyPreset = (preset: typeof COMMON_SYMPTOM_PRESETS[0]) => {
    setSelectedSystem(preset.system);
    setSymptomDescription(preset.title);
    setOperatingConditions(preset.conditions);
    setWarningLights(preset.warningLights);
  };

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomDescription.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptom: symptomDescription,
          system: selectedSystem,
          operatingConditions,
          warningLights,
          vehicle: activeVehicle,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el diagnóstico');
      }

      setDiagnosticResult(data.result);
      onDiagnosticUpdated?.(data.result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Ocurrió un error inesperado al contactar con AutoIA.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner de advertencia vehicular si no hay auto activo */}
      {!activeVehicle && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">
                No tienes un vehículo seleccionado
              </p>
              <p className="text-xs text-slate-400">
                Para diagnósticos exactos sobre motores, transmisiones y refacciones específicas, AutoIA necesita marca, modelo, año y kilometraje.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVehicleModal}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0"
          >
            Configurar mi Vehículo
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Form Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Analizador de Síntomas y Fallas
              </h2>
            </div>

            {/* Quick symptom presets */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Casos y síntomas comunes (selecciona uno como plantilla):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {COMMON_SYMPTOM_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 transition-colors"
                  >
                    {preset.title.length > 45 ? preset.title.substring(0, 45) + '...' : preset.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleDiagnose} className="space-y-4">
              {/* System selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sistema Principal Asociado
                </label>
                <select
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value as AutomotiveSystem)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Motor">Motor & Inyección / Encendido</option>
                  <option value="Transmisión">Transmisión & Embrague / Caja de Cambios</option>
                  <option value="Frenos">Frenos & Sistema ABS / Hidráulico</option>
                  <option value="Suspensión">Suspensión & Amortiguación</option>
                  <option value="Dirección">Dirección (Hidráulica o Eléctrica EPS)</option>
                  <option value="Sistema Eléctrico">Sistema Eléctrico & Batería / Alternador</option>
                  <option value="Refrigeración">Sistema de Refrigeración & Enfriamiento</option>
                  <option value="Sensores">Sensores & Electrónica / ECU</option>
                  <option value="Escape / Emisiones">Escape, Catalizador & Emisiones</option>
                  <option value="General">General / No estoy seguro</option>
                </select>
              </div>

              {/* Symptom description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción del Síntoma o Ruido *
                </label>
                <textarea
                  required
                  rows={3}
                  value={symptomDescription}
                  onChange={(e) => setSymptomDescription(e.target.value)}
                  placeholder="Describe qué hace el auto: ruidos (chillido, golpeteo metálico, zumbido), vibraciones, olor, humo, pérdida de fuerza..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ¿Bajo qué condiciones ocurre?
                </label>
                <input
                  type="text"
                  value={operatingConditions}
                  onChange={(e) => setOperatingConditions(e.target.value)}
                  placeholder="Ej. En frío por las mañanas, al acelerar a fondo, al frenar, con el clima puesto..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Warning lights */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ¿Hay testigos encendidos en el tablero?
                </label>
                <input
                  type="text"
                  value={warningLights}
                  onChange={(e) => setWarningLights(e.target.value)}
                  placeholder="Ej. Check Engine parpadeando, testigo ABS, testigo de batería, ninguno..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !symptomDescription.trim()}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isLoading || !symptomDescription.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>AutoIA está analizando síntomas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Analizar Fallas y Metodología de Inspección</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Diagnostic Results Column */}
        <div className="lg:col-span-7 space-y-4">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error al procesar el diagnóstico</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {!diagnosticResult && !isLoading && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-amber-400">
                <Wrench className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">
                  Diagnóstico Técnico Metódico
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingresa los síntomas de tu vehículo a la izquierda o selecciona uno de los ejemplos preconfigurados. AutoIA desglosará las causas probables, qué inspeccionar con herramientas físicas y qué precauciones tomar antes de comprar refacciones.
                </p>
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left max-w-lg mx-auto">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-amber-400 block mb-1">1. Hipótesis Probables</strong>
                  Descarte ordenado del componente más económico al más complejo.
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-amber-400 block mb-1">2. Prueba Física</strong>
                  Comprobación con multímetro, escáner o inspección ocular.
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-amber-400 block mb-1">3. Cero Alucinación</strong>
                  No inventamos piezas; confirmamos datos de compatibilidad.
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                <Car className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Analizando parámetros y cinemática de la falla...
                </p>
                <p className="text-xs text-slate-400">
                  Contrastando síntomas con historial técnico para {activeVehicle ? `${activeVehicle.brand} ${activeVehicle.model}` : 'vehículos similares'}
                </p>
              </div>
            </div>
          )}

          {diagnosticResult && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Critical Notice: Hipótesis vs Diagnóstico Confirmado */}
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-amber-400">
                    Diferenciación Fundamental de AutoIA
                  </span>
                </div>
                <p className="text-xs font-semibold text-amber-200">
                  ESTO ES UNA HIPÓTESIS PRELIMINAR, NO UN DIAGNÓSTICO CONFIRMADO.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {diagnosticResult.whatNotToAssume}
                </p>
              </div>

              {/* Severity Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Resumen del Síntoma:
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                      diagnosticResult.severity === 'critico'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : diagnosticResult.severity === 'moderado'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      Riesgo: {diagnosticResult.severity === 'critico' ? 'Crítico / No Conducir' : diagnosticResult.severity === 'moderado' ? 'Moderado / Precaución' : 'Bajo / Atender'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {diagnosticResult.symptomSummary}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {diagnosticResult.severityExplanation}
                  </p>
                </div>
              </div>

              {/* Missing vehicle info warning */}
              {diagnosticResult.whatInfoIsMissing && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-300">Información técnica necesaria para mayor precisión:</strong>
                    <p className="mt-0.5 text-slate-300">{diagnosticResult.whatInfoIsMissing}</p>
                  </div>
                </div>
              )}

              {/* Probable Causes */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Posibles Causas (Ordenadas por Probabilidad)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {diagnosticResult.probableCauses.length} causas identificadas
                  </span>
                </div>

                <div className="space-y-2">
                  {diagnosticResult.probableCauses.map((pc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">
                            {idx + 1}. {pc.cause}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {pc.system}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          pc.probability === 'Alta'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : pc.probability === 'Media'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          Probabilidad {pc.probability}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {pc.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspection Steps */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Procedimiento de Inspección Técnica (Paso a Paso)
                </h4>

                <div className="space-y-3">
                  {diagnosticResult.inspectionSteps.map((step, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center text-[10px]">
                            {step.step || idx + 1}
                          </span>
                          {step.target}
                        </span>
                        {step.tools && (
                          <span className="text-[10px] text-slate-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-700">
                            🧰 {step.tools}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {step.instruction}
                      </p>
                      {step.caution && (
                        <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Precaución de seguridad:</strong> {step.caution}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Refacciones & Compatibilidad Advice */}
              {diagnosticResult.partsCompatibilityAdvice && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-400" />
                    Datos Requeridos para Refacciones
                  </h4>
                  <p className="text-xs text-slate-300">
                    {diagnosticResult.partsCompatibilityAdvice.criticalAdvice}
                  </p>
                  {diagnosticResult.partsCompatibilityAdvice.requiredVehicleData?.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <strong className="text-slate-300 block mb-1">Antes de comprar, comprueba:</strong>
                      <ul className="list-disc list-inside space-y-0.5">
                        {diagnosticResult.partsCompatibilityAdvice.requiredVehicleData.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    generateAutomotivePDF({
                      vehicle: activeVehicle,
                      diagnosticResult,
                      reportType: 'diagnostico',
                    });
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/50 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  title="Descargar este diagnóstico en formato PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descargar Reporte PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const message = `Quiero profundizar en el diagnóstico de: "${diagnosticResult.symptomSummary}". ¿Qué pruebas eléctricas específicas o valores de resistencia debo medir con el multímetro?`;
                    onTransferToChat(message, diagnosticResult);
                  }}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-amber-400/20"
                >
                  <span>Consultar detalles en el Chat de AutoIA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
