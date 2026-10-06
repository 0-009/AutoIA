import React, { useState } from 'react';
import { 
  X, 
  FileDown, 
  FileText, 
  CheckCircle2, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  Car,
  Layers,
  Calculator
} from 'lucide-react';
import { DiagnosticResult, OBDCodeItem, VehicleProfile } from '../types/auto';
import { generateAutomotivePDF, BudgetData } from '../utils/pdfGenerator';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVehicle: VehicleProfile | null;
  lastDiagnostic: DiagnosticResult | null;
  maintenanceTasks: Array<{
    task: string;
    system: string;
    intervalKm: number;
    completed: boolean;
    importance: string;
  }>;
  selectedObdCode?: OBDCodeItem | null;
  budgetData?: BudgetData | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  activeVehicle,
  lastDiagnostic,
  maintenanceTasks,
  selectedObdCode,
  budgetData,
}) => {
  const [reportType, setReportType] = useState<'completo' | 'diagnostico' | 'mantenimiento' | 'presupuesto'>('completo');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      generateAutomotivePDF({
        vehicle: activeVehicle,
        diagnosticResult: (reportType === 'completo' || reportType === 'diagnostico') ? lastDiagnostic : null,
        maintenanceTasks: (reportType === 'completo' || reportType === 'mantenimiento') ? maintenanceTasks : undefined,
        budgetData: (reportType === 'completo' || reportType === 'presupuesto') ? (budgetData || {
          currency: 'MXN',
          currencySymbol: '$',
          workshopType: 'Taller Independiente / Multimarca',
          items: maintenanceTasks.filter(m => !m.completed).map(m => ({
            task: m.task,
            system: m.system,
            intervalKm: m.intervalKm,
            partsCost: 650,
            laborCost: 350,
            total: 1000,
            importance: m.importance,
          })),
          totalParts: 650 * maintenanceTasks.filter(m => !m.completed).length,
          totalLabor: 350 * maintenanceTasks.filter(m => !m.completed).length,
          grandTotal: 1000 * maintenanceTasks.filter(m => !m.completed).length,
        }) : null,
        obdCode: selectedObdCode,
        reportType,
        customNotes: includeNotes ? notes : undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Ocurrió un error al generar el documento PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl shadow-black/70">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Generar Reporte Técnico PDF</h2>
              <p className="text-xs text-slate-400">
                Descarga y guarda el estado actual de tu vehículo en tu dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Active vehicle preview */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Car className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {activeVehicle ? `${activeVehicle.brand} ${activeVehicle.model} (${activeVehicle.year})` : 'Vehículo no seleccionado'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {activeVehicle ? `${activeVehicle.engine} • ${activeVehicle.mileage.toLocaleString()} km` : 'Se generará una plantilla genérica'}
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Listo
            </span>
          </div>

          {/* Report Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Tipo de Reporte a Descargar:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setReportType('completo')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  reportType === 'completo'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1 mb-1 text-amber-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Integral</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Ficha, diagnóstico y presupuesto.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType('diagnostico')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  reportType === 'diagnostico'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1 mb-1 text-amber-400">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Diagnóstico</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Síntomas y pruebas físicas.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType('mantenimiento')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  reportType === 'mantenimiento'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1 mb-1 text-amber-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Pauta</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Checklist preventivo por km.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType('presupuesto')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  reportType === 'presupuesto'
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1 mb-1 text-amber-400">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Presupuesto</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Costos de refacciones y mano de obra.
                </p>
              </button>
            </div>
          </div>

          {/* Status info */}
          {reportType !== 'mantenimiento' && !lastDiagnostic && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-2">
              <span className="text-blue-400">ℹ️</span>
              <p>
                Aún no has corrido un diagnóstico en esta sesión. Si descargas ahora, el reporte incluirá la ficha técnica y la pauta de mantenimiento.
              </p>
            </div>
          )}

          {/* Optional notes */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
              />
              <span>Agregar notas u observaciones adicionales al PDF</span>
            </label>

            {includeNotes && (
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Revisión realizada antes de salir a carretera; taller mecánico San Juan..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-400/20 flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGenerating ? 'Generando PDF...' : 'Descargar Archivo PDF'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
