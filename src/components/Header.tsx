import React from 'react';
import { 
  Car, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  Settings2, 
  Sparkles,
  Layers,
  FileDown,
  ChevronRight
} from 'lucide-react';
import { VehicleProfile } from '../types/auto';

interface HeaderProps {
  activeTab: 'chat' | 'diagnostic' | 'obd2' | 'parts' | 'maintenance';
  setActiveTab: (tab: 'chat' | 'diagnostic' | 'obd2' | 'parts' | 'maintenance') => void;
  activeVehicle: VehicleProfile | null;
  onOpenVehicleModal: () => void;
  onOpenReportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeVehicle,
  onOpenVehicleModal,
  onOpenReportModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-lg shadow-amber-500/20">
              <Car className="w-5 h-5 stroke-[2.2]" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center border border-amber-400">
                <Wrench className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white flex items-center">
                  Auto<span className="text-amber-400">IA</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded-md">
                  Ingeniería Automotriz
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Diagnóstico técnico, mantenimiento, OBD-II y refacciones
              </p>
            </div>
          </div>

          {/* Action buttons on top right */}
          <div className="flex items-center gap-2">
            {/* PDF Report Trigger Button */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500/60 bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-amber-300 text-xs font-semibold transition-all shadow-sm"
              title="Descargar reporte resumido en PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Reporte PDF</span>
            </button>

            {/* Active Vehicle Badge / Switcher */}
            <button
              onClick={onOpenVehicleModal}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                activeVehicle
                  ? 'bg-slate-900/90 hover:bg-slate-850 border-amber-500/30 text-slate-200 hover:border-amber-500/60 shadow-sm'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
              }`}
              title="Configurar vehículo activo"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <div className="text-left max-w-[200px] sm:max-w-xs truncate">
                {activeVehicle ? (
                  <div>
                    <span className="font-semibold text-white">
                      {activeVehicle.brand} {activeVehicle.model} ({activeVehicle.year})
                    </span>
                    <span className="text-slate-400 ml-1.5 text-[11px] hidden md:inline">
                      • {activeVehicle.engine.split(' ')[0]} • {activeVehicle.mileage.toLocaleString()} km
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Seleccionar Vehículo</span>
                  </div>
                )}
              </div>
              <Settings2 className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400 transition-colors ml-1" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-850 no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Asistente General</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'diagnostic'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Diagnóstico de Síntomas</span>
          </button>

          <button
            onClick={() => setActiveTab('obd2')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'obd2'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Escáner OBD-II / DTC</span>
          </button>

          <button
            onClick={() => setActiveTab('parts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'parts'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Refacciones & Compatibilidad</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'maintenance'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pauta de Mantenimiento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
