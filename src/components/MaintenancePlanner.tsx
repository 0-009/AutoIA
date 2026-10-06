import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertTriangle, 
  Droplet, 
  Car, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  ShieldCheck,
  Wrench,
  Clock,
  FileDown,
  DollarSign,
  Calculator,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  HelpCircle,
  Building2,
  Store,
  Layers
} from 'lucide-react';
import { VehicleProfile } from '../types/auto';
import { generateAutomotivePDF, BudgetItem, BudgetData } from '../utils/pdfGenerator';

interface MaintenancePlannerProps {
  activeVehicle: VehicleProfile | null;
  onOpenVehicleModal: () => void;
  onTransferToChat: (message: string) => void;
}

export interface MaintenanceTaskWithCost {
  id: string;
  intervalKm: number;
  intervalMonths: number;
  system: string;
  task: string;
  importance: 'Crítico' | 'Recomendado' | 'Inspección';
  details: string;
  partsBaseCost: number; // in MXN base
  laborBaseCost: number; // in MXN base
  partsIncluded: string;
  estimatedHours: number;
}

export const DEFAULT_MAINTENANCE_SCHEDULE: MaintenanceTaskWithCost[] = [
  {
    id: 'm1',
    intervalKm: 10000,
    intervalMonths: 6,
    system: 'Motor',
    task: 'Cambio de Aceite de Motor y Filtro de Aceite',
    importance: 'Crítico',
    details: 'Utilizar viscosidad recomendada en el manual del fabricante (ej. 0W-20 o 5W-30 100% sintético con norma API SP).',
    partsBaseCost: 850,
    laborBaseCost: 300,
    partsIncluded: 'Garrafa 5L aceite sintético + filtro de aceite OEM/Wix',
    estimatedHours: 0.8
  },
  {
    id: 'm2',
    intervalKm: 10000,
    intervalMonths: 6,
    system: 'Frenos / Llantas',
    task: 'Rotación de Llantas e Inspección de Espesor de Balatas',
    importance: 'Recomendado',
    details: 'Verificar desgaste parejo de neumáticos y grosor de pastillas (mínimo de seguridad: 3 mm).',
    partsBaseCost: 0,
    laborBaseCost: 250,
    partsIncluded: 'Inspección física y torquímetro de tuercas',
    estimatedHours: 0.5
  },
  {
    id: 'm3',
    intervalKm: 20000,
    intervalMonths: 12,
    system: 'Motor / Aire',
    task: 'Reemplazo de Filtro de Aire de Motor y Filtro de Cabina (Polen)',
    importance: 'Recomendado',
    details: 'Un filtro de aire saturado incrementa el consumo de combustible y fuerza al sensor MAF.',
    partsBaseCost: 480,
    laborBaseCost: 180,
    partsIncluded: 'Filtro de aire de motor + filtro de cabina electrostático',
    estimatedHours: 0.4
  },
  {
    id: 'm4',
    intervalKm: 40000,
    intervalMonths: 24,
    system: 'Frenos',
    task: 'Reemplazo y Purga Completa de Líquido de Frenos (DOT 3 / DOT 4)',
    importance: 'Crítico',
    details: 'El líquido de frenos es higroscópico (absorbe agua del ambiente), lo que baja su punto de ebullición y oxida los bombines y el módulo ABS.',
    partsBaseCost: 290,
    laborBaseCost: 450,
    partsIncluded: '2 envases líquido de frenos DOT 4 de alto punto de ebullición',
    estimatedHours: 1.0
  },
  {
    id: 'm5',
    intervalKm: 60000,
    intervalMonths: 36,
    system: 'Refrigeración',
    task: 'Drenado y Reemplazo de Líquido Refrigerante / Anticongelante',
    importance: 'Crítico',
    details: 'Usar anticongelante con la química adecuada para el bloque de motor (OAT, HOAT o Si-OAT). Nunca rellenar con agua de grifo.',
    partsBaseCost: 480,
    laborBaseCost: 350,
    partsIncluded: 'Garrafa anticongelante orgánico (OAT/HOAT) 50/50',
    estimatedHours: 0.8
  },
  {
    id: 'm6',
    intervalKm: 60000,
    intervalMonths: 36,
    system: 'Transmisión',
    task: 'Servicio de Transmisión (Cambio de Fluido ATF / CVT / Valvulina)',
    importance: 'Crítico',
    details: 'Las cajas automáticas y CVT sufren degradación térmica severa. Reemplazar fluido y filtro de cárter previene fallas de solenoides.',
    partsBaseCost: 1550,
    laborBaseCost: 850,
    partsIncluded: 'Fluido sintético específico (ATF/CVT) + filtro de cárter y junta',
    estimatedHours: 1.5
  },
  {
    id: 'm7',
    intervalKm: 80000,
    intervalMonths: 48,
    system: 'Motor',
    task: 'Cambio de Bujías de Encendido (Iridio / Platino)',
    importance: 'Recomendado',
    details: 'Calibrar la luz entre electrodos según especificación milimétrica si no vienen precalibradas de fábrica.',
    partsBaseCost: 960,
    laborBaseCost: 420,
    partsIncluded: 'Juego de 4 bujías de iridio larga duración (NGK / Denso / Bosch)',
    estimatedHours: 1.0
  },
  {
    id: 'm8',
    intervalKm: 100000,
    intervalMonths: 60,
    system: 'Motor',
    task: 'Reemplazo de Banda de Distribución, Bomba de Agua y Banda de Accesorios',
    importance: 'Crítico',
    details: 'En motores de interferencia, si la banda de tiempo se rompe, los pistones doblan las válvulas causando daño catastrófico al motor.',
    partsBaseCost: 2900,
    laborBaseCost: 1900,
    partsIncluded: 'Kit de distribución completo (banda + polea tensora + bomba de agua + banda poly-V)',
    estimatedHours: 3.5
  },
  {
    id: 'm9',
    intervalKm: 100000,
    intervalMonths: 60,
    system: 'Suspensión',
    task: 'Inspección de Amortiguadores, Bieletas, Terminales y Bujes de Horquilla',
    importance: 'Recomendado',
    details: 'Revisar fugas de aceite en vástagos de amortiguador y holgura en rótulas para evitar desgaste prematuro de llantas.',
    partsBaseCost: 380,
    laborBaseCost: 520,
    partsIncluded: 'Alineación computarizada 4 ruedas + plomos de balanceo',
    estimatedHours: 1.2
  }
];

type Currency = 'MXN' | 'USD' | 'EUR';
type WorkshopTier = 'independiente' | 'especializado' | 'agencia';

const CURRENCY_CONFIG: Record<Currency, { symbol: string; rate: number; label: string }> = {
  MXN: { symbol: '$', rate: 1.0, label: 'MXN ($)' },
  USD: { symbol: '$', rate: 0.052, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.048, label: 'EUR (€)' },
};

const WORKSHOP_TIER_CONFIG: Record<WorkshopTier, { label: string; partsFactor: number; laborFactor: number; desc: string }> = {
  independiente: {
    label: 'Taller Independiente / Multimarca',
    partsFactor: 1.0,
    laborFactor: 1.0,
    desc: 'Precios de refaccionaria comercial y mano de obra estándar de taller local.'
  },
  especializado: {
    label: 'Taller Mecánico Especializado',
    partsFactor: 1.1,
    laborFactor: 1.35,
    desc: 'Equipo de diagnóstico avanzado, herramientas específicas y técnicos certificados.'
  },
  agencia: {
    label: 'Agencia / Concesionario Oficial',
    partsFactor: 1.45,
    laborFactor: 2.0,
    desc: 'Refacciones 100% de agencia y tarifas oficiales por hora de concesionaria.'
  }
};

export const MaintenancePlanner: React.FC<MaintenancePlannerProps> = ({
  activeVehicle,
  onOpenVehicleModal,
  onTransferToChat,
}) => {
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(['m1', 'm2']);
  const [selectedForBudgetIds, setSelectedForBudgetIds] = useState<string[]>(() =>
    DEFAULT_MAINTENANCE_SCHEDULE.filter((t) => !['m1', 'm2'].includes(t.id)).map((t) => t.id)
  );

  const [currency, setCurrency] = useState<Currency>('MXN');
  const [workshopTier, setWorkshopTier] = useState<WorkshopTier>('independiente');
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(true);

  const currentMileage = activeVehicle ? activeVehicle.mileage : 85000;

  const toggleTaskCompleted = (id: string) => {
    setCompletedTaskIds((prev) => {
      const isNowCompleted = !prev.includes(id);
      const next = isNowCompleted ? [...prev, id] : prev.filter((item) => item !== id);
      
      // If task was marked completed, automatically uncheck from pending budget
      if (isNowCompleted) {
        setSelectedForBudgetIds((bPrev) => bPrev.filter((item) => item !== id));
      } else {
        // If uncompleted, re-add to budget selection
        setSelectedForBudgetIds((bPrev) => [...bPrev, id]);
      }
      return next;
    });
  };

  const toggleTaskInBudget = (id: string) => {
    setSelectedForBudgetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectOnlyDuePending = () => {
    const dueIds = DEFAULT_MAINTENANCE_SCHEDULE
      .filter((t) => !completedTaskIds.includes(t.id) && currentMileage >= t.intervalKm)
      .map((t) => t.id);
    setSelectedForBudgetIds(dueIds);
  };

  const selectAllPending = () => {
    const allPendingIds = DEFAULT_MAINTENANCE_SCHEDULE
      .filter((t) => !completedTaskIds.includes(t.id))
      .map((t) => t.id);
    setSelectedForBudgetIds(allPendingIds);
  };

  // Cost calculation
  const budgetCalculations = useMemo(() => {
    const curr = CURRENCY_CONFIG[currency];
    const tier = WORKSHOP_TIER_CONFIG[workshopTier];

    let totalParts = 0;
    let totalLabor = 0;
    let totalHours = 0;

    const items: BudgetItem[] = [];

    DEFAULT_MAINTENANCE_SCHEDULE.forEach((task) => {
      if (selectedForBudgetIds.includes(task.id)) {
        const partsCost = Math.round(task.partsBaseCost * tier.partsFactor * curr.rate);
        const laborCost = Math.round(task.laborBaseCost * tier.laborFactor * curr.rate);
        const total = partsCost + laborCost;

        totalParts += partsCost;
        totalLabor += laborCost;
        totalHours += task.estimatedHours;

        items.push({
          task: task.task,
          system: task.system,
          intervalKm: task.intervalKm,
          partsCost,
          laborCost,
          total,
          importance: task.importance,
        });
      }
    });

    const grandTotal = totalParts + totalLabor;
    const minRange = Math.round(grandTotal * 0.88);
    const maxRange = Math.round(grandTotal * 1.14);

    return {
      items,
      totalParts,
      totalLabor,
      grandTotal,
      minRange,
      maxRange,
      totalHours: Math.round(totalHours * 10) / 10,
      currencySymbol: curr.symbol,
      currencyCode: currency,
      workshopLabel: tier.label,
    };
  }, [selectedForBudgetIds, currency, workshopTier]);

  const handleExportBudgetPDF = () => {
    const budgetData: BudgetData = {
      currency: budgetCalculations.currencyCode,
      currencySymbol: budgetCalculations.currencySymbol,
      workshopType: budgetCalculations.workshopLabel,
      items: budgetCalculations.items,
      totalParts: budgetCalculations.totalParts,
      totalLabor: budgetCalculations.totalLabor,
      grandTotal: budgetCalculations.grandTotal,
    };

    generateAutomotivePDF({
      vehicle: activeVehicle,
      budgetData,
      reportType: 'presupuesto',
      customNotes: `Presupuesto calculado en AutoIA para ${selectedForBudgetIds.length} servicios de mantenimiento seleccionados. Nivel de taller: ${budgetCalculations.workshopLabel}.`,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Plan de Mantenimiento y Estimador de Presupuesto
            </h2>
            <p className="text-xs text-slate-400">
              Pauta por kilometraje, control de tareas y cotizador de costos promedio de mercado
            </p>
          </div>
        </div>

        {activeVehicle ? (
          <div className="flex items-center gap-2">
            <div className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
              <span className="text-slate-500">Kilometraje actual:</span>{' '}
              <strong className="text-amber-400">{activeVehicle.mileage.toLocaleString()} km</strong>
            </div>
            <button
              onClick={onOpenVehicleModal}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Modificar
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenVehicleModal}
            className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Configurar Vehículo y Kilometraje</span>
          </button>
        )}
      </div>

      {/* ESTIMATOR & BUDGET TOOL SECTION */}
      <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-5">
        
        {/* Estimator Header & Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
              <Calculator className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Estimador de Costos de Mantenimiento Pendiente
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/40">
                  Precios de Mercado
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calcula refacciones certificadas y mano de obra para las tareas pendientes de tu vehículo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBudgetPDF}
              disabled={selectedForBudgetIds.length === 0}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 text-xs font-bold rounded-lg transition-all shadow-md shadow-amber-400/20 flex items-center gap-1.5"
              title="Generar y descargar cotización formal en PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar Presupuesto PDF</span>
            </button>

            <button
              onClick={() => setIsEstimatorOpen(!isEstimatorOpen)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
              title={isEstimatorOpen ? 'Ocultar panel' : 'Mostrar panel'}
            >
              {isEstimatorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isEstimatorOpen && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Control Bar: Currency & Workshop Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
              
              {/* Currency Selector */}
              <div className="lg:col-span-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  Moneda:
                </span>
                <div className="flex items-center gap-1">
                  {(['MXN', 'USD', 'EUR'] as Currency[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        currency === c
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workshop Tier Selector */}
              <div className="lg:col-span-8 bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Tipo de Taller:
                </span>
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  {(['independiente', 'especializado', 'agencia'] as WorkshopTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setWorkshopTier(tier)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all whitespace-nowrap ${
                        workshopTier === tier
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                      title={WORKSHOP_TIER_CONFIG[tier].desc}
                    >
                      {tier === 'independiente' ? 'Taller Multimarca' : tier === 'especializado' ? 'Especializado' : 'Agencia Oficial'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Quick Filter Selection Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-medium">Cotizar:</span>
                <button
                  type="button"
                  onClick={selectOnlyDuePending}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-slate-300 text-[11px] transition-colors"
                >
                  ⚡ Solo urgentes por kilometraje ({DEFAULT_MAINTENANCE_SCHEDULE.filter(t => !completedTaskIds.includes(t.id) && currentMileage >= t.intervalKm).length})
                </button>
                <button
                  type="button"
                  onClick={selectAllPending}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-slate-300 text-[11px] transition-colors"
                >
                  📋 Todas las pendientes ({DEFAULT_MAINTENANCE_SCHEDULE.filter(t => !completedTaskIds.includes(t.id)).length})
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                Seleccionadas: <strong className="text-amber-400">{selectedForBudgetIds.length}</strong> de {DEFAULT_MAINTENANCE_SCHEDULE.length - completedTaskIds.length} pendientes
              </span>
            </div>

            {/* 3 Metric Cards for Total Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Refacciones Subtotal */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  Refacciones & Fluidos:
                </span>
                <div className="text-lg font-black font-mono text-white">
                  {budgetCalculations.currencySymbol} {budgetCalculations.totalParts.toLocaleString()} {budgetCalculations.currencyCode}
                </div>
                <p className="text-[10px] text-slate-500">
                  Aceites sintéticos, bujías, filtros y refacciones certificadas
                </p>
              </div>

              {/* Mano de Obra Subtotal */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                  Mano de Obra Estimada:
                </span>
                <div className="text-lg font-black font-mono text-white">
                  {budgetCalculations.currencySymbol} {budgetCalculations.totalLabor.toLocaleString()} {budgetCalculations.currencyCode}
                </div>
                <p className="text-[10px] text-slate-500">
                  ~{budgetCalculations.totalHours} horas de trabajo técnico calificado
                </p>
              </div>

              {/* Total Hero Budget */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/50 space-y-1">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  Total Presupuestado:
                </span>
                <div className="text-xl font-black font-mono text-amber-400">
                  {budgetCalculations.currencySymbol} {budgetCalculations.grandTotal.toLocaleString()} {budgetCalculations.currencyCode}
                </div>
                <p className="text-[10px] text-amber-200/80">
                  Rango de mercado: {budgetCalculations.currencySymbol}{budgetCalculations.minRange.toLocaleString()} - {budgetCalculations.currencySymbol}{budgetCalculations.maxRange.toLocaleString()}
                </p>
              </div>

            </div>

            {/* Practical Advice & Chat Shortcut */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300 space-y-0.5">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  ¿Cómo optimizar este presupuesto?
                </p>
                <p className="text-slate-400 text-[11px]">
                  Llevar tus propios fluidos y filtros de marca reconocida al taller puede ahorrar hasta un 25% sin perder calidad.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const itemsList = budgetCalculations.items.map((it) => `- ${it.task} (~${budgetCalculations.currencySymbol}${it.total})`).join('\n');
                  const query = `Tengo un presupuesto estimado de ${budgetCalculations.currencySymbol}${budgetCalculations.grandTotal.toLocaleString()} ${budgetCalculations.currencyCode} para los siguientes servicios pendientes:\n${itemsList}\n¿En cuáles de estos mantenimientos me conviene comprar refacciones Aftermarket Tier 1 de calidad y en cuáles es indispensable acudir a la agencia?`;
                  onTransferToChat(query);
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-amber-500/50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Consultar Ahorro con AutoIA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Droplet className="w-4 h-4" />
            <span>Aceite de Motor</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Nunca uses aditivos espesantes para disimular fugas o desgaste. Respeta siempre la viscosidad y especificación indicada en el tapón de aceite o manual.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Líquido de Frenos</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Un líquido oscuro o con más del 3% de humedad debe cambiarse inmediatamente; de lo contrario el pedal se tornará esponjoso en frenadas continuas.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Wrench className="w-4 h-4" />
            <span>Banda o Cadena de Distribución</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Si tu vehículo tiene banda de goma dentada, su cambio es preventivo estricto (cada 80k-100k km). Si tiene cadena, vigilar la tensión y cambio de aceite puntual.
          </p>
        </div>
      </div>

      {/* Maintenance Tasks List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Checklist de Servicios y Cotización Unitaria
            </h3>
            <p className="text-xs text-slate-400">
              Marca las tareas completadas o incluye cada servicio en tu presupuesto estimado
            </p>
          </div>

          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            Realizadas: <strong className="text-emerald-400">{completedTaskIds.length}</strong> • Pendientes: <strong className="text-amber-400">{DEFAULT_MAINTENANCE_SCHEDULE.length - completedTaskIds.length}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {DEFAULT_MAINTENANCE_SCHEDULE.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            const isDueOrPast = currentMileage >= task.intervalKm;
            const isInBudget = selectedForBudgetIds.includes(task.id);

            // Unit cost for this specific item in current currency & workshop tier
            const curr = CURRENCY_CONFIG[currency];
            const tier = WORKSHOP_TIER_CONFIG[workshopTier];
            const itemPartsCost = Math.round(task.partsBaseCost * tier.partsFactor * curr.rate);
            const itemLaborCost = Math.round(task.laborBaseCost * tier.laborFactor * curr.rate);
            const itemTotal = itemPartsCost + itemLaborCost;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                  isCompleted
                    ? 'bg-slate-950/40 border-slate-850 opacity-60'
                    : isDueOrPast
                    ? 'bg-slate-950 border-amber-500/40 hover:border-amber-500/70 shadow-sm'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Completion button */}
                    <button
                      type="button"
                      onClick={() => toggleTaskCompleted(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-amber-400 transition-colors"
                      title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completado'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                          {task.task}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-850 text-slate-300 rounded border border-slate-700">
                          {task.system}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          task.importance === 'Crítico'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {task.importance}
                        </span>

                        {isDueOrPast && !isCompleted && (
                          <span className="px-2 py-0.2 text-[9px] font-extrabold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                            ¡Toca por km!
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {task.details}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-amber-400 block">
                      Cada {task.intervalKm.toLocaleString()} km
                    </span>
                    <span className="text-[11px] text-slate-500">
                      o cada {task.intervalMonths} meses
                    </span>
                  </div>
                </div>

                {/* Bottom cost breakdown bar per task */}
                <div className="pt-2 border-t border-slate-850/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>
                      Refacciones: <strong className="text-slate-200">{curr.symbol}{itemPartsCost.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      M. Obra: <strong className="text-slate-200">{curr.symbol}{itemLaborCost.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Total estimado: <strong className="text-amber-400 font-mono font-bold">{curr.symbol}{itemTotal.toLocaleString()} {currency}</strong>
                    </span>
                  </div>

                  {!isCompleted && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={isInBudget}
                        onChange={() => toggleTaskInBudget(task.id)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
                      />
                      <span>Incluir en presupuesto</span>
                    </label>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Ask AutoIA about maintenance & Export PDF */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleExportBudgetPDF}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            title="Descargar presupuesto de mantenimiento en PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar Presupuesto PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const query = `¿Cuál es la pauta de afinación mayor (servicio de bujías, filtros, lavado de inyectores y cuerpo de aceleración) para mi vehículo con ${currentMileage.toLocaleString()} km?`;
              onTransferToChat(query);
            }}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-amber-400/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Consultar Servicio Mayor con AutoIA</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
