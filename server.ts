import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client according to official guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// High-speed In-Memory Cache (reduces repeated queries from 3-6s to <5ms)
const apiCache = new Map<string, { data: any; expiry: number }>();
function getCached(key: string) {
  const item = apiCache.get(key);
  if (item && item.expiry > Date.now()) return item.data;
  if (item) apiCache.delete(key);
  return null;
}
function setCache(key: string, data: any, ttlSeconds = 1800) {
  if (apiCache.size > 300) {
    const oldestKey = apiCache.keys().next().value;
    if (oldestKey) apiCache.delete(oldestKey);
  }
  apiCache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

// Helper to generate content with low latency ThinkingLevel.LOW and fallback across models
async function generateWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  const optimizedConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    ...params.config,
  };

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: optimizedConfig,
      });
      return response;
    } catch (err: any) {
      console.warn(`Error using model ${model}:`, err?.message || err);
      lastError = err;
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  throw lastError;
}

const SYSTEM_INSTRUCTION_AUTOIA = `
Eres "AutoIA", un asistente inteligente de ingeniería mecánica automotriz especializado en automóviles y camionetas (pickups, SUVs, sedanes, hatchbacks, utilitarios) de cualquier marca, modelo y año.

Tus áreas de dominio abarcan:
1. Mantenimiento preventivo y correctivo (intervalos de servicio, fluidos, lubricación, bandas, cadenas de distribución, bujías, filtros).
2. Diagnóstico metódico de fallas (análisis de síntomas, ruidos, vibraciones, comportamientos anómalos).
3. Sistemas clave: Motor (combustión interna, inyección, encendido), Transmisión (manual, automática convencional, CVT, DCT), Frenos (ABS, discos, tambores, líquido hidráulico), Suspensión, Dirección (hidráulica, electroasistida EPS), Sistema Eléctrico (alternador, batería, motor de arranque, fusibles, red CAN bus), Sistema de Refrigeración (termostato, radiador, bomba de agua, anticongelante), Sensores y Actuadores (MAF, MAP, O2, CKP, CMP, TPS, IAT, IAC, etc.), y Sistema OBD-II (códigos DTC, lecturas de datos en vivo Freeze Frame).
4. Refacciones y Compatibilidad de piezas (OEM vs Aftermarket de calidad, verificación de parámetros de ajuste).

REGLAS OBLIGATORIAS:
1. VELOCIDAD Y AGILIDAD TÉCNICA:
   - Sé directo, conciso y técnico. Evita introducciones vacías o preámbulos decorativos.
   - Ve directo a los síntomas, causas y pruebas prácticas.

2. SOLICITUD DE DATOS ESPECÍFICOS:
   - Cuando la consulta requiera precisión (viscosidad de aceite, fluidos de caja, códigos DTC o compatibilidad de partes) y NO se cuente con los datos del vehículo, pide concisamente: MARCA, MODELO, AÑO, MOTOR, TRANSMISIÓN y KILOMETRAJE.
   - Si el vehículo activo ya está en el contexto, úsalo directamente sin volver a pedirlo.

3. DIFERENCIACIÓN RIGUROSA: HIPÓTESIS VS DIAGNÓSTICO CONFIRMADO:
   - NUNCA afirmes categóricamente que una refacción está dañada basándote solo en un síntoma o código DTC.
   - Diferencia siempre entre causas probables (hipótesis) y diagnóstico confirmado tras pruebas con multímetro, manómetro o inspección visual.

4. CERO ALUCINACIONES:
   - Nunca inventes números de parte o tolerancias exactas si varían por lote de fabricación o motor; indica qué dato físico verificar con la muestra.
`;

// Helper to build contents for chat
function buildChatContents(message: string, history: any[], vehicle: any) {
  let vehicleContext = '';
  if (vehicle && vehicle.brand && vehicle.model) {
    vehicleContext = `
[VEHÍCULO ACTIVO]: ${vehicle.brand} ${vehicle.model} (${vehicle.year || 'año no esp.'}), Motor: ${vehicle.engine || 'no esp.'}, Transmisión: ${vehicle.transmission || 'no esp.'}, Km: ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : 'no esp.'}, Tracción: ${vehicle.drivetrain || 'no esp.'}.
`;
  } else {
    vehicleContext = `
[VEHÍCULO]: No especificado aún. Si la consulta exige datos de fábrica (aceites, tolerancias, refacciones), solicita marca, modelo, año y motor.
`;
  }

  const contents: any[] = [];
  if (Array.isArray(history) && history.length > 0) {
    for (const item of history.slice(-6)) {
      if (item.role === 'user' || item.role === 'assistant') {
        contents.push({
          role: item.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: item.content }],
        });
      }
    }
  }

  contents.push({
    role: 'user',
    parts: [{
      text: `${vehicleContext}\n\n[CONSULTA]: ${message}\n\nResponde directo al punto con estructura ordenada y clara.`
    }],
  });

  return contents;
}

// Endpoint: High-Speed Streaming Chat (SSE) for near-instant TTFT (<400ms)
app.post('/api/chat/stream', async (req, res) => {
  const { message, history = [], vehicle } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'El mensaje es requerido.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();

  const contents = buildChatContents(message, history, vehicle);

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_AUTOIA,
        temperature: 0.5,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.warn('Streaming error, attempting flash-latest fallback:', err?.message || err);
    try {
      const fallback = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_AUTOIA,
          temperature: 0.5,
        },
      });
      if (fallback.text) {
        res.write(`data: ${JSON.stringify({ chunk: fallback.text })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch (fallbackErr: any) {
      res.write(`data: ${JSON.stringify({ error: fallbackErr?.message || 'Error en respuesta.' })}\n\n`);
    } finally {
      res.end();
    }
  }
});

// Endpoint: General & Diagnostic Chat (Non-streaming fallback)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], vehicle } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El mensaje es requerido.' });
    }

    const contents = buildChatContents(message, history, vehicle);

    const response = await generateWithFallback({
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_AUTOIA,
        temperature: 0.5,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const text = response.text || 'No se pudo generar una respuesta en este momento.';
    res.json({ reply: text });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({
      error: 'Error al procesar la consulta automotriz.',
      details: error?.message || 'Error desconocido del servidor',
    });
  }
});

// Endpoint: Structured Symptom Diagnostic Engine (Optimized with Cache & Low Latency)
app.post('/api/diagnose', async (req, res) => {
  try {
    const {
      symptom,
      system,
      operatingConditions,
      warningLights,
      vehicle,
    } = req.body;

    if (!symptom) {
      return res.status(400).json({ error: 'Debe describir el síntoma a diagnosticar.' });
    }

    const cacheKey = `diag:${system || ''}:${symptom.trim().toLowerCase()}:${operatingConditions || ''}:${vehicle?.brand || ''}:${vehicle?.model || ''}:${vehicle?.engine || ''}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ result: cached, cached: true });
    }

    const vehicleStr = vehicle && vehicle.brand
      ? `${vehicle.brand} ${vehicle.model} (${vehicle.year || 'año no esp.'}), Motor: ${vehicle.engine || 'no esp.'}, Transmisión: ${vehicle.transmission || 'no esp.'}, Kilometraje: ${vehicle.mileage ? vehicle.mileage + ' km' : 'no esp.'}`
      : 'Vehículo no especificado por el usuario';

    const prompt = `
Analiza el siguiente caso de diagnóstico automotriz y genera una evaluación técnica y rigurosa en formato JSON estructurado:

[DATOS DEL VEHÍCULO]: ${vehicleStr}
[SISTEMA AFECTADO]: ${system || 'General / Desconocido'}
[SÍNTOMA DETALLADO]: ${symptom}
[CONDICIONES DE APARICIÓN]: ${operatingConditions || 'No especificadas'}
[TESTIGOS EN TABLERO]: ${warningLights || 'Ninguno o no especificado'}

REGLA CLAVE: Diferencia explícitamente entre causas posibles (hipótesis) y diagnóstico confirmado. No des por hecho que una refacción está dañada sin indicar la prueba física de confirmación.

Genera un JSON conciso con esta estructura exacta:
{
  "symptomSummary": "Resumen conciso y técnico del problema",
  "severity": "leve" | "moderado" | "critico",
  "severityExplanation": "Explicación de por qué tiene esta severidad y si es seguro circular",
  "isConfirmedDiagnosis": false,
  "whatNotToAssume": "Explicación contundente de por qué esto NO es un diagnóstico confirmado y qué errores comunes se cometen al cambiar piezas sin medir",
  "whatInfoIsMissing": "Datos del vehículo o pruebas que faltan para dar mayor certeza",
  "probableCauses": [
    {
      "cause": "Nombre de la causa probable",
      "probability": "Alta" | "Media" | "Baja",
      "reasoning": "Por qué este síntoma se relaciona con este componente",
      "system": "Motor" | "Transmisión" | "Frenos" | "Suspensión" | "Dirección" | "Sistema Eléctrico" | "Refrigeración" | "Sensores" | "Escape / Emisiones" | "General"
    }
  ],
  "inspectionSteps": [
    {
      "step": 1,
      "target": "Componente a inspeccionar",
      "instruction": "Paso a paso de cómo probar o inspeccionar física o eléctricamente",
      "tools": "Herramienta necesaria",
      "caution": "Medida de seguridad importante"
    }
  ],
  "partsCompatibilityAdvice": {
    "partsToCheck": ["pieza 1", "pieza 2"],
    "requiredVehicleData": ["datos indispensables para comprar la refacción correcta, ej. VIN, código de motor"],
    "criticalAdvice": "Consejo sobre refacciones originales vs alternativas"
  },
  "preventiveAdvice": "Recomendación para evitar que vuelva a suceder en el futuro"
}
`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_AUTOIA,
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('No se pudo parsear el resultado de diagnóstico.');
      }
    }

    setCache(cacheKey, parsedData, 3600);
    res.json({ result: parsedData });
  } catch (error: any) {
    console.error('Error en /api/diagnose:', error);
    res.status(500).json({
      error: 'Error al generar el diagnóstico estructurado.',
      details: error?.message || 'Error en el servidor',
    });
  }
});

// Endpoint: Spare Parts & Compatibility Verification Engine (with Caching & Low Latency)
app.post('/api/parts/compatibility', async (req, res) => {
  try {
    const { partName, system, oemOrAftermarket, userNotes, vehicle } = req.body;

    if (!partName) {
      return res.status(400).json({ error: 'Debe indicar el nombre de la refacción o componente.' });
    }

    const cacheKey = `part:${partName.trim().toLowerCase()}:${system || ''}:${oemOrAftermarket || ''}:${vehicle?.brand || ''}:${vehicle?.model || ''}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ result: cached, cached: true });
    }

    const vehicleStr = vehicle && vehicle.brand
      ? `${vehicle.brand} ${vehicle.model} (${vehicle.year || 'año no esp.'}), Motor: ${vehicle.engine || 'no esp.'}, Transmisión: ${vehicle.transmission || 'no esp.'}, Kilometraje: ${vehicle.mileage ? vehicle.mileage + ' km' : 'no esp.'}, Tracción: ${vehicle.drivetrain || 'no esp.'}`
      : 'Vehículo no proporcionado';

    const prompt = `
Actúa como experto en refacciones automotrices y compatibilidad de partes.
Analiza la siguiente refacción para el vehículo indicado y genera una guía concisa para determinar su compatibilidad exacta sin margen de error.

[REFACCIÓN]: ${partName}
[SISTEMA]: ${system || 'General'}
[PREFERENCIA]: ${oemOrAftermarket || 'Cualquiera'}
[NOTAS ADICIONALES DEL CLIENTE]: ${userNotes || 'Ninguna'}
[VEHÍCULO]: ${vehicleStr}

RECORDATORIO: NUNCA inventes números de parte de catálogo ni medidas si no hay certeza absoluta. En su lugar, enumera con exactitud qué especificaciones técnicas, números de chasis (VIN), códigos de motor grabados o medidas físicas debe verificar el usuario antes de comprar.

Genera un JSON con este formato:
{
  "partName": "${partName}",
  "system": "${system || 'General'}",
  "requiredSpecifications": [
    "Dato técnico 1 que define la compatibilidad (ej: diámetro exterior de disco, cantidad de barrenos)",
    "Dato técnico 2 (ej: conector de 3 o 4 pines, resistencia de bobina)"
  ],
  "criticalFitmentFactors": [
    "Factor crítico donde la gente suele equivocarse (ej: cambia entre versión americana y mexicana)",
    "Factor 2 (ej: varía si es transmisión automática o manual)"
  ],
  "oemVsAftermarketRecommendation": "Análisis objetivo y conciso de si conviene OEM o Aftermarket certificado (Tier 1).",
  "verificationChecklist": [
    "Paso 1 antes de pagar la pieza",
    "Paso 2 al recibir la pieza (comparación lado a lado con la desmontada)"
  ],
  "warningNote": "Advertencia importante de seguridad o montaje"
}
`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_AUTOIA,
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    setCache(cacheKey, parsed, 3600);
    res.json({ result: parsed });
  } catch (error: any) {
    console.error('Error en /api/parts/compatibility:', error);
    res.status(500).json({
      error: 'Error al comprobar compatibilidad de refacciones.',
      details: error?.message || 'Error en el servidor',
    });
  }
});

// Endpoint: OBD-II Code In-depth Analysis (with Fast Caching & Low Latency)
app.post('/api/obd2/analyze', async (req, res) => {
  try {
    const { code, vehicle } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Debe ingresar el código OBD-II (ej. P0300, P0420).' });
    }

    const upperCode = code.toUpperCase().trim();
    const cacheKey = `obd:${upperCode}:${vehicle?.brand || ''}:${vehicle?.model || ''}:${vehicle?.engine || ''}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ analysis: cached, cached: true });
    }

    const vehicleStr = vehicle && vehicle.brand
      ? `${vehicle.brand} ${vehicle.model} (${vehicle.year || 'año no esp.'}), Motor: ${vehicle.engine || 'no esp.'}`
      : 'Vehículo genérico (no especificado)';

    const prompt = `
Proporciona un desglose técnico ágil, conciso y ordenado para el código de diagnóstico OBD-II: "${upperCode}" en este vehículo: "${vehicleStr}".

Incluye:
1. **Título Oficial y Definición Técnica** (en español)
2. **Nivel de Gravedad y Riesgo de Circulación**
3. **Causas Frecuentes Ordenadas por Probabilidad** (de lo más sencillo/económico a lo más complejo)
4. **Pruebas Físicas/Eléctricas Paso a Paso** antes de comprar sensores
5. **Parámetros en Vivo (Freeze Frame)** clave a revisar en el escáner (STFT, LTFT, MAF, RPM, etc.)
6. **Error Común de Taller** a evitar.
`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_AUTOIA,
        temperature: 0.3,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const analysisText = response.text || '';
    setCache(cacheKey, analysisText, 7200);
    res.json({ analysis: analysisText });
  } catch (error: any) {
    console.error('Error en /api/obd2/analyze:', error);
    res.status(500).json({
      error: 'Error al analizar el código OBD-II.',
      details: error?.message || 'Error del servidor',
    });
  }
});

// Setup dev server with Vite or serve static dist
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoIA server running on port ${PORT} in ${isDev ? 'development' : 'production'} mode (Fast Low-Latency & Streaming enabled)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

