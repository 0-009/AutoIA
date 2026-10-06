import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Car, 
  HelpCircle, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  FileCheck2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { AutomotiveSystem, PartCheckResult, VehicleProfile } from '../types/auto';

interface PartsCompatibilityLabProps {
  activeVehicle: VehicleProfile | null;
  onOpenVehicleModal: () => void;
  onTransferToChat: (message: string) => void;
}

const COMMON_PARTS_PRESETS = [
  {
    name: 'Pastillas / Balatas de Freno Delanteras',
    system: 'Frenos' as AutomotiveSystem,
    notes: 'Quiero saber si cambia según versión con o sin ABS o tamaño de rin'
  },
  {
    name: 'Kit de Distribución (Banda de Tiempo + Bomba de Agua + Tensor)',
    system: 'Motor' as AutomotiveSystem,
    notes: 'Tengo duda de cuántos dientes lleva la banda y si la bomba es accionada por la misma banda'
  },
  {
    name: 'Amortiguadores Delanteros con Bases',
    system: 'Suspensión' as AutomotiveSystem,
    notes: 'Quiero saber si son compatibles con la versión estándar o si cambian por el peso del motor'
  },
  {
    name: 'Sensor de Oxígeno Superior (Banco 1 Sensor 1 - Upstream)',
    system: 'Sensores' as AutomotiveSystem,
    notes: 'Hay opciones universales baratas de 4 cables vs original con arnés directo'
  },
  {
    name: 'Kit de Embrague / Clutch Completo (Disco, Plato y Collarín)',
    system: 'Transmisión' as AutomotiveSystem,
    notes: '¿Se requiere cambiar también el volante bimasa o rectificar el volante motriz?'
  },
  {
    name: 'Radiador de Enfriamiento del Motor',
    system: 'Refrigeración' as AutomotiveSystem,
    notes: '¿Cambia el radiador si el auto es transmisión automática con enfriador de aceite de caja integrado?'
  }
];

export const PartsCompatibilityLab: React.FC<PartsCompatibilityLabProps> = ({
  activeVehicle,
  onOpenVehicleModal,
  onTransferToChat,
}) => {
  const [partName, setPartName] = useState('Pastillas / Balatas de Freno Delanteras');
  const [system, setSystem] = useState<AutomotiveSystem>('Frenos');
  const [oemOrAftermarket, setOemOrAftermarket] = useState<'OEM' | 'Aftermarket' | 'Cualquiera'>('Cualquiera');
  const [userNotes, setUserNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PartCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPreset = (preset: typeof COMMON_PARTS_PRESETS[0]) => {
    setPartName(preset.name);
    setSystem(preset.system);
    setUserNotes(preset.notes);
  };

  const handleCheckCompatibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/parts/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partName,
          system,
          oemOrAftermarket,
          userNotes,
          vehicle: activeVehicle,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar compatibilidad de refacciones.');
      }

      setResult(data.result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al comprobar compatibilidad');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Asesor de Refacciones y Compatibilidad
            </h2>
            <p className="text-xs text-slate-400">
              Verificación rigurosa de parámetros técnicos, ajuste OEM vs repuesto certificado antes de comprar
            </p>
          </div>
        </div>

        {activeVehicle ? (
          <div className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <span className="text-slate-500">Evaluando para:</span>{' '}
            <strong className="text-amber-400">{activeVehicle.brand} {activeVehicle.model} ({activeVehicle.year})</strong>
          </div>
        ) : (
          <button
            onClick={onOpenVehicleModal}
            className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Asignar Vehículo para Refacciones Exactas</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              Pieza o Componente a Consultar
            </h3>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">
                Plantillas de refacciones frecuentes:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {COMMON_PARTS_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCheckCompatibility} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Refacción o Parte *
                </label>
                <input
                  type="text"
                  required
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="Ej. Bomba de agua, Sensor MAF, Amortiguadores delanteros..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sistema Automotriz
                  </label>
                  <select
                    value={system}
                    onChange={(e) => setSystem(e.target.value as AutomotiveSystem)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Frenos">Frenos</option>
                    <option value="Motor">Motor & Distribución</option>
                    <option value="Suspensión">Suspensión</option>
                    <option value="Transmisión">Transmisión & Embrague</option>
                    <option value="Sensores">Sensores & Electrónica</option>
                    <option value="Refrigeración">Refrigeración</option>
                    <option value="Sistema Eléctrico">Sistema Eléctrico</option>
                    <option value="Escape / Emisiones">Escape / Emisiones</option>
                    <option value="Dirección">Dirección</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preferencia de Repuesto
                  </label>
                  <select
                    value={oemOrAftermarket}
                    onChange={(e) => setOemOrAftermarket(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cualquiera">Comparar OEM vs Aftermarket</option>
                    <option value="OEM">Original de Agencia (OEM)</option>
                    <option value="Aftermarket">Genérica / Aftermarket de Calidad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dudas Específicas o Datos del Vendedor
                </label>
                <textarea
                  rows={2}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Ej. Me ofrecen una marca económica, ¿vale la pena? o ¿cambia según si el motor tiene turbo?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !partName.trim()}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isLoading || !partName.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verificando Requisitos de Ajuste...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Comprobar Qué Datos Necesito para Compatibilidad</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-4">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {!result && !isLoading && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-amber-400">
                <FileCheck2 className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">
                  Laboratorio de Compatibilidad de Refacciones
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evita comprar piezas equivocadas que luego no entran o no funcionan. AutoIA comprueba qué mediciones, números de chasis o códigos de motor exactos requieres antes de pagar.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs text-slate-300 max-w-lg mx-auto space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cero Alucinaciones en AutoIA</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  No inventamos números de parte de catálogo que puedan no coincidir. Te brindamos la lista exacta de comprobaciones físicas y técnicas que debes contrastar con tu pieza desmontada y el catálogo oficial del fabricante.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                <Layers className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-white">
                Analizando tolerancias y requerimientos de ajuste...
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Top Banner */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Refacción Analizada:
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {result.partName}
                  </h3>
                  <span className="text-xs text-amber-400">
                    Sistema: {result.system}
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-950 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Guía Técnica</span>
                </div>
              </div>

              {/* Warning note */}
              {result.warningNote && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Aviso importante de instalación y seguridad:</strong>
                    <p className="mt-0.5 text-slate-300">{result.warningNote}</p>
                  </div>
                </div>
              )}

              {/* Required Specifications */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  Especificaciones Técnicas que Definen la Compatibilidad
                </h4>
                <div className="space-y-1.5">
                  {result.requiredSpecifications.map((spec, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Fitment Factors */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Factores Críticos de Ajuste (Donde Ocurren los Errores)
                </h4>
                <div className="space-y-1.5">
                  {result.criticalFitmentFactors.map((factor, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-red-400 font-bold">⚠️</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OEM vs Aftermarket Analysis */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ¿Conviene Comprar OEM (Agencia) o Aftermarket (Genérica Certificada)?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {result.oemVsAftermarketRecommendation}
                </p>
              </div>

              {/* Verification Checklist Before Buying */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Checklist Obligatorio Antes de Pagar la Refacción
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.verificationChecklist.map((step, i) => (
                    <li key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-start gap-2">
                      <span className="font-bold text-amber-400">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Action */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const q = `Tengo dudas sobre la refacción "${result.partName}". ¿Qué marcas Aftermarket Tier 1 recomendadas existen para mi vehículo que ofrezcan calidad de equipo original?`;
                    onTransferToChat(q);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Preguntar a AutoIA sobre marcas recomendadas</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
