import React, { useState } from 'react';
import { 
  Gauge, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Car, 
  Flame, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  FileText,
  Activity,
  Layers,
  Info
} from 'lucide-react';
import { COMMON_OBD_CODES, OBDCodeItem, VehicleProfile } from '../types/auto';

interface OBDScannerProps {
  activeVehicle: VehicleProfile | null;
  onOpenVehicleModal: () => void;
  onTransferToChat: (message: string) => void;
}

export const OBDScanner: React.FC<OBDScannerProps> = ({
  activeVehicle,
  onOpenVehicleModal,
  onTransferToChat,
}) => {
  const [searchCode, setSearchCode] = useState('');
  const [selectedCode, setSelectedCode] = useState<OBDCodeItem>(COMMON_OBD_CODES[0]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const filteredPresets = COMMON_OBD_CODES.filter((item) =>
    item.code.toLowerCase().includes(searchCode.toLowerCase().trim()) ||
    item.title.toLowerCase().includes(searchCode.toLowerCase().trim()) ||
    item.system.toLowerCase().includes(searchCode.toLowerCase().trim())
  );

  const handleDeepScan = async (codeToScan: string) => {
    setIsLoadingAi(true);
    setAiAnalysis(null);

    try {
      const response = await fetch('/api/obd2/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToScan,
          vehicle: activeVehicle,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al analizar código OBD-II');
      }

      setAiAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAiAnalysis(`Error al consultar el desglose técnico: ${err.message}`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCustomCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    const upper = searchCode.trim().toUpperCase();
    const existing = COMMON_OBD_CODES.find((c) => c.code === upper);

    if (existing) {
      setSelectedCode(existing);
    } else {
      // Create a temporary item for custom code
      const customItem: OBDCodeItem = {
        code: upper,
        title: `Código de Falla ${upper}`,
        system: upper.startsWith('P') ? 'Motor' : upper.startsWith('C') ? 'Frenos' : upper.startsWith('B') ? 'General' : 'Sistema Eléctrico',
        severity: 'moderado',
        description: `Código DTC ${upper} introducido por el usuario. Haz clic en "Desglose Técnico con AutoIA" para obtener el análisis adaptado a tu vehículo.`,
        typicalCauses: ['Causa dependiente de la arquitectura y fabricante del vehículo'],
        symptoms: ['Luz Check Engine encendida en el cuadro de instrumentos'],
        liveDataPIDs: ['Freeze Frame DTC', 'RPM', 'Voltaje de batería', 'Temperatura']
      };
      setSelectedCode(customItem);
    }

    handleDeepScan(upper);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Explorador y Diagnóstico OBD-II / DTC
            </h2>
            <p className="text-xs text-slate-400">
              Interpretación precisa de códigos de falla, datos congelados (Freeze Frame) y lecturas en vivo
            </p>
          </div>
        </div>

        {/* Active vehicle badge */}
        <div className="flex items-center gap-2">
          {activeVehicle ? (
            <div className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
              <span className="text-slate-500">Vehículo actual:</span>{' '}
              <strong className="text-amber-400">{activeVehicle.brand} {activeVehicle.model} ({activeVehicle.year})</strong>
            </div>
          ) : (
            <button
              onClick={onOpenVehicleModal}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Configurar vehículo para fallas comunes</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Code search & presets */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <form onSubmit={handleCustomCodeSubmit} className="relative">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Buscar o ingresar código (ej. P0300, P0420, P0171)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-20 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] rounded-lg transition-colors"
              >
                Escanear
              </button>
            </form>

            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Códigos DTC Más Frecuentes
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredPresets.map((item) => {
                const isSelected = selectedCode.code === item.code;
                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      setSelectedCode(item);
                      setAiAnalysis(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-amber-400">
                        {item.code}
                      </span>
                      <span className={`px-2 py-0.2 text-[10px] font-bold rounded ${
                        item.severity === 'critico'
                          ? 'bg-red-500/20 text-red-400'
                          : item.severity === 'moderado'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Code Detailed Analysis */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            
            {/* Top header of selected code */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                    {selectedCode.code}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
                    Sistema: {selectedCode.system}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${
                    selectedCode.severity === 'critico'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedCode.severity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedCode.title}
                </h3>
              </div>

              <button
                onClick={() => handleDeepScan(selectedCode.code)}
                disabled={isLoadingAi}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-400/20 flex items-center gap-2 shrink-0"
              >
                {isLoadingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando con AutoIA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Desglose Técnico Personalizado</span>
                  </>
                )}
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Definición y Funcionamiento:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                {selectedCode.description}
              </p>
            </div>

            {/* Crucial Diagnostic Golden Rule */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Advertencia Profesional de AutoIA:</span>
              </div>
              <p className="text-slate-300">
                Un código DTC indica el circuito o subsistema donde la computadora detectó lecturas fuera de rango, <strong>NO significa automáticamente que el sensor esté quemado</strong>. Por ejemplo, un código de sensor de oxígeno suele ser provocado por fugas de vacío o problemas de inyectores antes de que el sensor falle.
              </p>
            </div>

            {/* Live Data / Freeze Frame PIDs */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Parámetros en Vivo que debes revisar con el Escáner (Freeze Frame Data):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedCode.liveDataPIDs.map((pid, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-white text-[11px]">{pid}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Typical Causes & Symptoms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Causas Típicas Comprobadas:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedCode.typicalCauses.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Síntomas Notables al Conducir:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedCode.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-950 p-2 rounded-lg border border-slate-850">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Deep Analysis Output */}
            {aiAnalysis && (
              <div className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Desglose Técnico Personalizado para {activeVehicle ? `${activeVehicle.brand} ${activeVehicle.model}` : 'este vehículo'}</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap space-y-2">
                  {aiAnalysis}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const query = `Tengo el código OBD-II "${selectedCode.code}: ${selectedCode.title}". ¿Cuáles son las tolerancias de voltaje y pasos de prueba exactos para confirmar la falla con un multímetro?`;
                  onTransferToChat(query);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Hacer preguntas técnicas sobre este código</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
