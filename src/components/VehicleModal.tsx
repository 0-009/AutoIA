import React, { useState } from 'react';
import { 
  X, 
  Car, 
  Check, 
  Plus, 
  Trash2, 
  Info, 
  SlidersHorizontal,
  Flame,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { VehicleProfile, PRESET_VEHICLES } from '../types/auto';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVehicle: VehicleProfile | null;
  onSelectVehicle: (vehicle: VehicleProfile) => void;
  savedVehicles: VehicleProfile[];
  onSaveVehicle: (vehicle: VehicleProfile) => void;
  onDeleteVehicle: (id: string) => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  activeVehicle,
  onSelectVehicle,
  savedVehicles,
  onSaveVehicle,
  onDeleteVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  
  // Custom vehicle form state
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear() - 5);
  const [engine, setEngine] = useState('');
  const [transmission, setTransmission] = useState<'Manual' | 'Automática' | 'CVT' | 'DCT / Doble Embrague' | 'Otro'>('Automática');
  const [mileage, setMileage] = useState(85000);
  const [fuelType, setFuelType] = useState<'Gasolina' | 'Diésel' | 'Híbrido' | 'Eléctrico' | 'Gas LP/GNV'>('Gasolina');
  const [drivetrain, setDrivetrain] = useState<'FWD (Delantera)' | 'RWD (Trasera)' | 'AWD / 4x4'>('FWD (Delantera)');
  const [vin, setVin] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) return;

    const newVehicle: VehicleProfile = {
      id: `custom-${Date.now()}`,
      name: `${brand} ${model} ${year}`,
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      engine: engine.trim() || 'No especificado',
      transmission,
      mileage: Number(mileage) || 0,
      fuelType,
      drivetrain,
      vin: vin.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSaveVehicle(newVehicle);
    onSelectVehicle(newVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/60">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ficha Técnica del Vehículo</h2>
              <p className="text-xs text-slate-400">
                Selecciona o registra tu auto o camioneta para diagnósticos exactos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why this matters callout */}
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300">Regla de precisión de AutoIA:</strong> Las especificaciones de aceite, torques, calibración de bujías, compatibilidad de refacciones y códigos OBD-II varían según año, código de motor y transmisión.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 px-5 pt-3 bg-slate-900">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vehículos Populares y Guardados ({savedVehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            + Registrar Auto o Camioneta Nuevo
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'presets' ? (
            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Haz clic para activar en AutoIA:
              </div>

              {savedVehicles.map((v) => {
                const isSelected = activeVehicle?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      onSelectVehicle(v);
                      onClose();
                    }}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {v.brand} {v.model}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {v.year}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-amber-300 rounded border border-slate-700">
                          {v.transmission}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>🔧 {v.engine}</span>
                        <span>🛣️ {v.mileage.toLocaleString()} km</span>
                        <span>⛽ {v.fuelType}</span>
                        <span>⚙️ {v.drivetrain}</span>
                      </div>
                      {v.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-1">{v.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-bold text-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Activo</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-amber-400 flex items-center gap-1">
                          Seleccionar <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}

                      {!v.id.startsWith('preset-') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteVehicle(v.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors ml-1"
                          title="Eliminar vehículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Chevrolet, Toyota, Ford"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Aveo, Hilux, Ranger, Jetta"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Año *
                  </label>
                  <input
                    type="number"
                    required
                    min={1970}
                    max={2027}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Motor (Cilindrada / Válvulas / Código) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1.6L 4 cil DOHC 16V, 2.7L V6 EcoBoost"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transmisión *
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Manual">Manual / Estándar</option>
                    <option value="Automática">Automática convencional (Convertidor de par)</option>
                    <option value="CVT">CVT (Transmisión Variable Continua)</option>
                    <option value="DCT / Doble Embrague">DCT / DSG / Doble Embrague</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kilometraje actual (km) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Combustible
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Gasolina">Gasolina</option>
                    <option value="Diésel">Diésel</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                    <option value="Gas LP/GNV">Gas LP / GNV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tracción
                  </label>
                  <select
                    value={drivetrain}
                    onChange={(e) => setDrivetrain(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="FWD (Delantera)">FWD (Delantera)</option>
                    <option value="RWD (Trasera)">RWD (Trasera)</option>
                    <option value="AWD / 4x4">AWD / 4x4 / 4WD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Número VIN / Chasis (Opcional para refacciones exactas)
                  </label>
                  <input
                    type="text"
                    placeholder="17 dígitos (ej. 3N1AB7AP...)"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    maxLength={17}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notas o Modificaciones
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Uso en terracería, motor recién ajustado"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-md shadow-amber-400/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Guardar y Activar Vehículo
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
