import jsPDF from 'jspdf';
import { DiagnosticResult, OBDCodeItem, VehicleProfile } from '../types/auto';

export interface BudgetItem {
  task: string;
  system: string;
  intervalKm: number;
  partsCost: number;
  laborCost: number;
  total: number;
  importance: string;
}

export interface BudgetData {
  currency: string;
  currencySymbol: string;
  workshopType: string;
  items: BudgetItem[];
  totalParts: number;
  totalLabor: number;
  grandTotal: number;
}

export interface ReportOptions {
  vehicle: VehicleProfile | null;
  diagnosticResult?: DiagnosticResult | null;
  maintenanceTasks?: Array<{
    task: string;
    system: string;
    intervalKm: number;
    completed: boolean;
    importance: string;
  }>;
  budgetData?: BudgetData | null;
  obdCode?: OBDCodeItem | null;
  reportType?: 'completo' | 'diagnostico' | 'mantenimiento' | 'presupuesto';
  customNotes?: string;
}

export function generateAutomotivePDF(options: ReportOptions) {
  const {
    vehicle,
    diagnosticResult,
    maintenanceTasks,
    budgetData,
    obdCode,
    reportType = 'completo',
    customNotes,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 15;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      drawHeaderSmall();
    }
  };

  const drawHeaderSmall = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('AutoIA - Reporte Técnico Automotriz Resumido', margin, 12);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
  };

  // 1. TOP HEADER (BRANDING)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent bar
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 32, pageWidth, 2, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Auto', margin, 18);
  const autoWidth = doc.getTextWidth('Auto');
  doc.setTextColor(245, 158, 11);
  doc.text('IA', margin + autoWidth, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Asistente Inteligente de Ingeniería y Diagnóstico Automotriz', margin, 24);

  // Date and Report Code (Right aligned)
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = today.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const reportId = `RPT-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`ID: ${reportId}`, pageWidth - margin, 16, { align: 'right' });
  doc.text(`Fecha: ${dateFormatted} - ${timeFormatted}`, pageWidth - margin, 22, { align: 'right' });

  currentY = 42;

  // 2. VEHICLE PROFILE CARD
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD');

  // Vehicle Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('FICHA TÉCNICA DEL VEHÍCULO', margin + 5, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  if (vehicle) {
    const col1X = margin + 5;
    const col2X = margin + 65;
    const col3X = margin + 125;

    // Row 1
    doc.text(`Marca y Modelo: ${vehicle.brand} ${vehicle.model}`, col1X, currentY + 15);
    doc.text(`Año de Fabricación: ${vehicle.year}`, col2X, currentY + 15);
    doc.text(`Kilometraje: ${vehicle.mileage.toLocaleString()} km`, col3X, currentY + 15);

    // Row 2
    doc.text(`Motor: ${vehicle.engine || 'No especificado'}`, col1X, currentY + 22);
    doc.text(`Transmisión: ${vehicle.transmission}`, col2X, currentY + 22);
    doc.text(`Tracción: ${vehicle.drivetrain}`, col3X, currentY + 22);

    // Row 3
    doc.text(`Combustible: ${vehicle.fuelType}`, col1X, currentY + 29);
    doc.text(`VIN / Chasis: ${vehicle.vin || 'No registrado'}`, col2X, currentY + 29);
    if (vehicle.notes) {
      doc.text(`Notas: ${vehicle.notes.substring(0, 30)}`, col3X, currentY + 29);
    }
  } else {
    doc.setTextColor(180, 83, 9);
    doc.text('Vehículo genérico no asignado (sin datos de motor o kilometraje especificados).', margin + 5, currentY + 18);
  }

  currentY += 40;

  // 3. CRITICAL NOTICE: HIPÓTESIS VS DIAGNÓSTICO CONFIRMADO
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('PRINCIPIO FUNDAMENTAL AUTOIA: HIPÓTESIS PRELIMINAR VS DIAGNÓSTICO CONFIRMADO', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  doc.text('Las causas señaladas en este reporte representan hipótesis técnicas basadas en síntomas reportados. Nunca reemplace', margin + 4, currentY + 9);
  doc.text('refacciones sin comprobar físicamente con instrumental (multímetro, manómetro, escáner) el estado real de la pieza.', margin + 4, currentY + 12);

  currentY += 19;

  // 4. DIAGNOSTIC SECTION (If available)
  if (diagnosticResult && (reportType === 'completo' || reportType === 'diagnostico')) {
    checkPageBreak(50);

    // Section title
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('1. EVALUACIÓN DE SÍNTOMAS Y DIAGNÓSTICO METÓDICO', margin + 4, currentY + 5);

    currentY += 11;

    // Severity & Summary box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Síntoma Resumido:', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.text(diagnosticResult.symptomSummary, margin + 35, currentY);

    // Severity badge
    const sev = diagnosticResult.severity;
    let sevColor = [16, 185, 129]; // green
    let sevText = 'Riesgo: Leve';
    if (sev === 'critico') {
      sevColor = [239, 68, 68]; // red
      sevText = 'Riesgo: Crítico (No Conducir)';
    } else if (sev === 'moderado') {
      sevColor = [245, 158, 11]; // amber
      sevText = 'Riesgo: Moderado (Precaución)';
    }

    doc.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
    doc.roundedRect(pageWidth - margin - 52, currentY - 4, 52, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(sevText, pageWidth - margin - 26, currentY, { align: 'center' });

    currentY += 6;

    if (diagnosticResult.severityExplanation) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const splitExp = doc.splitTextToSize(`Explicación de severidad: ${diagnosticResult.severityExplanation}`, contentWidth);
      doc.text(splitExp, margin, currentY);
      currentY += splitExp.length * 3.5 + 2;
    }

    // Probable Causes Table/List
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Causas Probables Identificadas:', margin, currentY);
    currentY += 4;

    diagnosticResult.probableCauses.forEach((pc, idx) => {
      checkPageBreak(12);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 10, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${pc.cause} (${pc.system})`, margin + 3, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(pc.probability === 'Alta' ? 220 : 100, pc.probability === 'Alta' ? 38 : 116, pc.probability === 'Alta' ? 38 : 139);
      doc.text(`Probabilidad: ${pc.probability}`, pageWidth - margin - 4, currentY + 4.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const splitReason = doc.splitTextToSize(pc.reasoning, contentWidth - 8);
      doc.text(splitReason[0] || '', margin + 3, currentY + 8);

      currentY += 12;
    });

    // Inspection Steps
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Pasos Metódicos de Inspección y Comprobación:', margin, currentY);
    currentY += 4;

    diagnosticResult.inspectionSteps.forEach((step) => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9);
      doc.text(`Paso ${step.step}: ${step.target}`, margin + 2, currentY + 3.5);

      if (step.tools) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Herramienta: ${step.tools}`, pageWidth - margin - 2, currentY + 3.5, { align: 'right' });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const splitInst = doc.splitTextToSize(step.instruction, contentWidth - 4);
      doc.text(splitInst, margin + 2, currentY + 7.5);

      currentY += 7.5 + splitInst.length * 3.5;
    });

    currentY += 4;
  }

  // 5. OBD-II CODE SECTION (If present)
  if (obdCode && (reportType === 'completo' || reportType === 'diagnostico')) {
    checkPageBreak(35);
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('2. CÓDIGO DE DIAGNÓSTICO OBD-II / DTC', margin + 4, currentY + 5);

    currentY += 11;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(245, 158, 11);
    doc.text(`${obdCode.code} - ${obdCode.title}`, margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    currentY += 4;
    const splitDesc = doc.splitTextToSize(obdCode.description, contentWidth);
    doc.text(splitDesc, margin, currentY);
    currentY += splitDesc.length * 3.5 + 2;

    if (obdCode.liveDataPIDs && obdCode.liveDataPIDs.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Parámetros en vivo (Freeze Frame) a monitorear:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129);
      doc.text(obdCode.liveDataPIDs.join('  •  '), margin + 65, currentY);
      currentY += 6;
    }
  }

  // 6. MAINTENANCE CHECKLIST SECTION
  if (maintenanceTasks && (reportType === 'completo' || reportType === 'mantenimiento')) {
    checkPageBreak(45);
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('3. ESTADO DE PAUTA DE MANTENIMIENTO PREVENTIVO', margin + 4, currentY + 5);

    currentY += 11;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Control de servicios según kilometraje actual (${vehicle ? vehicle.mileage.toLocaleString() + ' km' : 'No esp.'}):`, margin, currentY);
    currentY += 5;

    // Header row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('ESTADO', margin + 2, currentY + 3.5);
    doc.text('TAREA DE MANTENIMIENTO', margin + 24, currentY + 3.5);
    doc.text('SISTEMA', margin + 110, currentY + 3.5);
    doc.text('INTERVALO', margin + 140, currentY + 3.5);

    currentY += 5.5;

    maintenanceTasks.forEach((m) => {
      checkPageBreak(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      if (m.completed) {
        doc.setTextColor(16, 185, 129);
        doc.text('[x] Hecho', margin + 2, currentY + 3.5);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('[ ] Pendiente', margin + 2, currentY + 3.5);
      }

      doc.setTextColor(15, 23, 42);
      doc.text(m.task.length > 55 ? m.task.substring(0, 52) + '...' : m.task, margin + 24, currentY + 3.5);

      doc.setTextColor(100, 116, 139);
      doc.text(m.system, margin + 110, currentY + 3.5);
      doc.text(`${m.intervalKm.toLocaleString()} km`, margin + 140, currentY + 3.5);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + 5, pageWidth - margin, currentY + 5);
      currentY += 5.5;
    });

    currentY += 4;
  }

  // 6.1 ESTIMATED BUDGET SECTION
  if (budgetData && (reportType === 'completo' || reportType === 'presupuesto')) {
    checkPageBreak(50);
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('PRESUPUESTO ESTIMADO DE MANTENIMIENTOS PENDIENTES', margin + 4, currentY + 5);

    currentY += 11;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Estimación orientativa para: ${budgetData.workshopType}  •  Moneda: ${budgetData.currency}`, margin, currentY);
    currentY += 5;

    // 3 KPI summary cards (Refacciones, Mano de obra, Total)
    const kpiWidth = (contentWidth - 6) / 3;

    // KPI 1: Refacciones
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, kpiWidth, 14, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('REFACCIONES ESTIMADAS', margin + 3, currentY + 4);
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${budgetData.currencySymbol} ${budgetData.totalParts.toLocaleString()}`, margin + 3, currentY + 10.5);

    // KPI 2: Mano de Obra
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + kpiWidth + 3, currentY, kpiWidth, 14, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('MANO DE OBRA ESTIMADA', margin + kpiWidth + 6, currentY + 4);
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${budgetData.currencySymbol} ${budgetData.totalLabor.toLocaleString()}`, margin + kpiWidth + 6, currentY + 10.5);

    // KPI 3: Gran Total
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin + (kpiWidth + 3) * 2, currentY, kpiWidth, 14, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(180, 83, 9);
    doc.text('GRAN TOTAL ESTIMADO', margin + (kpiWidth + 3) * 2 + 3, currentY + 4);
    doc.setFontSize(10.5);
    doc.setTextColor(180, 83, 9);
    doc.text(`${budgetData.currencySymbol} ${budgetData.grandTotal.toLocaleString()}`, margin + (kpiWidth + 3) * 2 + 3, currentY + 10.5);

    currentY += 18;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('SERVICIO / TAREA', margin + 2, currentY + 4);
    doc.text('SISTEMA', margin + 85, currentY + 4);
    doc.text('REFACCIONES', margin + 115, currentY + 4);
    doc.text('M. OBRA', margin + 142, currentY + 4);
    doc.text('SUBTOTAL', pageWidth - margin - 2, currentY + 4, { align: 'right' });

    currentY += 6.5;

    budgetData.items.forEach((item) => {
      checkPageBreak(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);

      const title = item.task.length > 48 ? item.task.substring(0, 46) + '...' : item.task;
      doc.text(title, margin + 2, currentY + 4);

      doc.setTextColor(100, 116, 139);
      doc.text(item.system, margin + 85, currentY + 4);

      doc.setTextColor(51, 65, 85);
      doc.text(`${budgetData.currencySymbol} ${item.partsCost.toLocaleString()}`, margin + 115, currentY + 4);
      doc.text(`${budgetData.currencySymbol} ${item.laborCost.toLocaleString()}`, margin + 142, currentY + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text(`${budgetData.currencySymbol} ${item.total.toLocaleString()}`, pageWidth - margin - 2, currentY + 4, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + 5.5, pageWidth - margin, currentY + 5.5);
      currentY += 6;
    });

    currentY += 3;

    // Market Disclaimer Callout
    checkPageBreak(15);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 12, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('NOTA SOBRE PRECIOS DE MERCADO:', margin + 3, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('Valores calculados con precios promedio de refacciones de equipo original (OEM) o repuesto certificado (Tier 1)', margin + 3, currentY + 7.5);
    doc.text('y tarifas promedio de mano de obra en taller. Los precios finales dependen de la refaccionaria y taller que elija el cliente.', margin + 3, currentY + 10.5);

    currentY += 16;
  }

  // 7. CUSTOM USER / MECHANIC NOTES
  if (customNotes && customNotes.trim()) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Observaciones y Notas del Taller:', margin, currentY);
    currentY += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1, 1, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(customNotes, contentWidth - 6);
    doc.text(splitNotes, margin + 3, currentY + 4.5);

    currentY += 18;
  }

  // 8. LEGAL DISCLAIMER & FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'AutoIA • Asistente de Ingeniería Automotriz. Información para propósitos de asistencia y orientación técnica. Verifique especificaciones con manual de taller oficial.',
      margin,
      pageHeight - 9
    );

    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  }

  // Trigger download in browser
  const filename = vehicle
    ? `AutoIA_Reporte_${vehicle.brand}_${vehicle.model}_${today.toISOString().slice(0, 10)}.pdf`
    : `AutoIA_Reporte_Tecnico_${today.toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}
