export interface VehicleProfile {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  transmission: 'Manual' | 'Automática' | 'CVT' | 'DCT / Doble Embrague' | 'Otro';
  mileage: number; // in kilometers
  fuelType: 'Gasolina' | 'Diésel' | 'Híbrido' | 'Eléctrico' | 'Gas LP/GNV';
  drivetrain: 'FWD (Delantera)' | 'RWD (Trasera)' | 'AWD / 4x4';
  vin?: string;
  notes?: string;
}

export type AutomotiveSystem = 
  | 'Motor'
  | 'Transmisión'
  | 'Frenos'
  | 'Suspensión'
  | 'Dirección'
  | 'Sistema Eléctrico'
  | 'Refrigeración'
  | 'Sensores'
  | 'Escape / Emisiones'
  | 'General';

export type DiagnosticSeverity = 'leve' | 'moderado' | 'critico';

export interface ProbableCause {
  cause: string;
  probability: 'Alta' | 'Media' | 'Baja';
  reasoning: string;
  system: AutomotiveSystem;
}

export interface InspectionStep {
  step: number;
  target: string;
  instruction: string;
  tools?: string;
  caution?: string;
}

export interface DiagnosticResult {
  symptomSummary: string;
  severity: DiagnosticSeverity;
  severityExplanation: string;
  isConfirmedDiagnosis: boolean; // Always false by default to enforce differentiation
  whatNotToAssume: string;
  probableCauses: ProbableCause[];
  inspectionSteps: InspectionStep[];
  whatInfoIsMissing?: string;
  partsCompatibilityAdvice?: {
    partsToCheck: string[];
    requiredVehicleData: string[];
    criticalAdvice: string;
  };
  preventiveAdvice?: string;
}

export interface OBDCodeItem {
  code: string;
  title: string;
  system: AutomotiveSystem;
  severity: DiagnosticSeverity;
  description: string;
  typicalCauses: string[];
  symptoms: string[];
  liveDataPIDs: string[]; // e.g. STFT, LTFT, ECT, MAF
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  category?: 'diagnostico' | 'mantenimiento' | 'obd2' | 'refacciones' | 'general';
  structuredData?: DiagnosticResult;
  needsVehicleDataPrompt?: boolean;
}

export interface PartCheckRequest {
  partName: string;
  system: AutomotiveSystem;
  oemOrAftermarket: 'OEM' | 'Aftermarket' | 'Cualquiera';
  userNotes: string;
  vehicle: Partial<VehicleProfile>;
}

export interface PartCheckResult {
  partName: string;
  system: AutomotiveSystem;
  requiredSpecifications: string[];
  criticalFitmentFactors: string[];
  oemVsAftermarketRecommendation: string;
  verificationChecklist: string[];
  warningNote: string;
}

export const PRESET_VEHICLES: VehicleProfile[] = [
  {
    id: 'preset-1',
    name: 'Nissan Versa Advance',
    brand: 'Nissan',
    model: 'Versa',
    year: 2019,
    engine: '1.6L 4 cil DOHC 16V HR16DE (106 hp)',
    transmission: 'Automática',
    mileage: 94000,
    fuelType: 'Gasolina',
    drivetrain: 'FWD (Delantera)',
    notes: 'Uso mixto ciudad y carretera'
  },
  {
    id: 'preset-2',
    name: 'Toyota Hilux Doble Cabina',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2021,
    engine: '2.8L 4 cil Turbo Diésel 1GD-FTV (201 hp)',
    transmission: 'Manual',
    mileage: 68000,
    fuelType: 'Diésel',
    drivetrain: 'AWD / 4x4',
    notes: 'Vehículo de trabajo y carga'
  },
  {
    id: 'preset-3',
    name: 'Ford F-150 XLT',
    brand: 'Ford',
    model: 'F-150',
    year: 2018,
    engine: '3.5L V6 EcoBoost Twin-Turbo (375 hp)',
    transmission: 'Automática',
    mileage: 135000,
    fuelType: 'Gasolina',
    drivetrain: 'AWD / 4x4',
    notes: 'Camioneta familiar y remolque'
  },
  {
    id: 'preset-4',
    name: 'Volkswagen Jetta Trendline',
    brand: 'Volkswagen',
    model: 'Jetta',
    year: 2017,
    engine: '2.0L 4 cil 8V atmosférico (115 hp)',
    transmission: 'Manual',
    mileage: 142000,
    fuelType: 'Gasolina',
    drivetrain: 'FWD (Delantera)',
    notes: 'Mantenimiento regular al día'
  },
  {
    id: 'preset-5',
    name: 'Honda Civic EX',
    brand: 'Honda',
    model: 'Civic',
    year: 2020,
    engine: '1.5L Turbo 4 cil DOHC (174 hp)',
    transmission: 'CVT',
    mileage: 52000,
    fuelType: 'Gasolina',
    drivetrain: 'FWD (Delantera)',
    notes: 'Vehículo de uso personal diario'
  }
];

export const COMMON_OBD_CODES: OBDCodeItem[] = [
  {
    code: 'P0300',
    title: 'Fallo de encendido en cilindros múltiples o aleatorios',
    system: 'Motor',
    severity: 'critico',
    description: 'La computadora (PCM) detectó que más de un cilindro no está realizando la combustión de manera eficiente.',
    typicalCauses: [
      'Bujías desgastadas o con calibración incorrecta',
      'Bobinas de encendido (COP) defectuosas o con fuga de chispa',
      'Baja presión de combustible (bomba, regulador o filtro saturado)',
      'Fuga de vacío en el múltiple de admisión (entra aire no medido por el MAF)',
      'Inyectores sucios o goteando'
    ],
    symptoms: [
      'Luz Check Engine parpadeando (¡ALERTA: daño a convertidor catalítico!)',
      'Motor tiembla severamente al ralentí',
      'Pérdida de potencia y respuesta lenta al acelerar',
      'Olor a combustible crudo por el escape'
    ],
    liveDataPIDs: ['Short Term Fuel Trim (STFT)', 'Long Term Fuel Trim (LTFT)', 'Misfire Count Cilindros 1-4', 'MAF g/s']
  },
  {
    code: 'P0420',
    title: 'Eficiencia del sistema catalizador por debajo del umbral (Banco 1)',
    system: 'Escape / Emisiones',
    severity: 'moderado',
    description: 'El sensor de oxígeno downstream (sensor 2 después del catalizador) detecta una actividad similar al sensor upstream, indicando que el catalizador no está almacenando oxígeno eficientemente.',
    typicalCauses: [
      'Convertidor catalítico degradado por fallas previas de encendido o consumo de aceite/anticongelante',
      'Fuga de escape antes o cerca del catalizador',
      'Sensor de oxígeno 2 (post-catalizador) defectuoso o lento',
      'Mezcla rica prolongada no corregida'
    ],
    symptoms: [
      'Luz Check Engine encendida fija',
      'Posible olor a azufre/huevo podrido en el escape',
      'En casos severos, pérdida de potencia si el panal cerámico se obstruye'
    ],
    liveDataPIDs: ['O2 Sensor B1S1 Voltage', 'O2 Sensor B1S2 Voltage', 'Catalyst Temperature']
  },
  {
    code: 'P0171',
    title: 'Sistema demasiado pobre (Banco 1)',
    system: 'Motor',
    severity: 'moderado',
    description: 'Hay demasiado aire o muy poco combustible en la combustión; los ajustes de combustible (Fuel Trims) superaron el límite de compensación positiva (+15% a +25%).',
    typicalCauses: [
      'Sensor de flujo de masa de aire (MAF) sucio o defectuoso',
      'Manguera de vacío rota o junta de admisión con fuga',
      'Válvula PCV trabada abierta',
      'Filtro de combustible obstruido o bomba con baja presión',
      'Inyector(es) de combustible tapados'
    ],
    symptoms: [
      'Marcha mínima inestable o con vacilación al arrancar en frío',
      'Tironeos o falta de potencia al exigir aceleración',
      'Posible cascabeleo (detonación prematura) bajo carga'
    ],
    liveDataPIDs: ['LTFT B1', 'STFT B1', 'MAF Sensor Flow Rate', 'Fuel Rail Pressure']
  },
  {
    code: 'P0128',
    title: 'Temperatura del refrigerante por debajo de la temperatura de regulación del termostato',
    system: 'Refrigeración',
    severity: 'leve',
    description: 'El motor tarda demasiado tiempo en alcanzar la temperatura normal de operación (usualmente ~85°C - 90°C).',
    typicalCauses: [
      'Termostato de refrigeración trabado en posición abierta',
      'Sensor de temperatura del refrigerante (ECT) descalibrado',
      'Nivel bajo de anticongelante',
      'Motoventilador encendido permanentemente por relé pegado'
    ],
    symptoms: [
      'La aguja de temperatura en el tablero no sube al centro o sube muy lento',
      'La calefacción de la cabina sale tibia o fría',
      'Mayor consumo de gasolina (el motor se queda en bucle abierto/open loop)'
    ],
    liveDataPIDs: ['Engine Coolant Temperature (ECT)', 'Ambient Air Temperature']
  },
  {
    code: 'P0700',
    title: 'Sistema de control de transmisión (Solicitud de testigo MIL)',
    system: 'Transmisión',
    severity: 'critico',
    description: 'El módulo de control de la transmisión (TCM) detectó una anomalía interna e informó al ECM para encender el Check Engine.',
    typicalCauses: [
      'Nivel bajo o líquido de transmisión (ATF/CVT) degradado o quemado',
      'Solenoide de cambio o embrague de convertidor de par (TCC) defectuoso',
      'Sensor de velocidad de entrada o salida de la caja dañado',
      'Desgaste interno de embragues o bandas'
    ],
    symptoms: [
      'La transmisión entra en modo seguro / "Limp Mode" (se bloquea en 3ª o 4ª velocidad)',
      'Golpeteo o retardo severo al meter Drive o Reversa',
      'Patinamiento al exigir aceleración'
    ],
    liveDataPIDs: ['TCM DTCs', 'Transmission Fluid Temp (TFT)', 'Turbine Speed vs Output Speed', 'Gear Ratio']
  },
  {
    code: 'P0340',
    title: 'Circuito del sensor de posición del árbol de levas "A" (Banco 1)',
    system: 'Sensores',
    severity: 'moderado',
    description: 'La computadora no recibe una señal válida o coherente del sensor CMP que sincroniza la inyección y chispa con las válvulas.',
    typicalCauses: [
      'Sensor CMP defectuoso o conector sulfatado/con cables rotos',
      'Cadena o banda de distribución estirada o fuera de tiempo (salto de diente)',
      'Batería con bajo voltaje durante el arranque',
      'Rueda fónica sucia o golpeada'
    ],
    symptoms: [
      'Arranque prolongado (da marcha mucho tiempo antes de encender)',
      'Apagado repentino del motor en movimiento',
      'Pérdida notable de potencia'
    ],
    liveDataPIDs: ['Camshaft Position', 'Engine RPM', 'Cam/Crank Synchronization Status']
  }
];
