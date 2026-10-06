/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VehicleModal } from './components/VehicleModal';
import { ReportModal } from './components/ReportModal';
import { ChatView } from './components/ChatView';
import { DiagnosticStudio } from './components/DiagnosticStudio';
import { OBDScanner } from './components/OBDScanner';
import { PartsCompatibilityLab } from './components/PartsCompatibilityLab';
import { MaintenancePlanner } from './components/MaintenancePlanner';
import { 
  ChatMessage, 
  DiagnosticResult, 
  PRESET_VEHICLES, 
  VehicleProfile 
} from './types/auto';
import { ShieldAlert, Car, Wrench } from 'lucide-react';

const APP_DEFAULT_MAINTENANCE_SCHEDULE = [
  { task: 'Cambio de Aceite de Motor y Filtro de Aceite (Sintético)', system: 'Motor', intervalKm: 10000, completed: true, importance: 'Crítico' },
  { task: 'Rotación de Llantas e Inspección de Espesor de Balatas', system: 'Frenos / Llantas', intervalKm: 10000, completed: true, importance: 'Recomendado' },
  { task: 'Reemplazo de Filtro de Aire de Motor y Filtro de Cabina', system: 'Motor / Aire', intervalKm: 20000, completed: false, importance: 'Recomendado' },
  { task: 'Reemplazo y Purga Completa de Líquido de Frenos (DOT 3 / DOT 4)', system: 'Frenos', intervalKm: 40000, completed: false, importance: 'Crítico' },
  { task: 'Drenado y Reemplazo de Líquido Refrigerante / Anticongelante OAT/HOAT', system: 'Refrigeración', intervalKm: 60000, completed: false, importance: 'Crítico' },
  { task: 'Servicio de Transmisión (Cambio de Fluido ATF / CVT / Valvulina)', system: 'Transmisión', intervalKm: 60000, completed: false, importance: 'Crítico' },
  { task: 'Cambio de Bujías de Encendido (Iridio / Platino)', system: 'Motor', intervalKm: 80000, completed: false, importance: 'Recomendado' },
  { task: 'Reemplazo de Banda de Distribución, Bomba de Agua y Accesorios', system: 'Motor', intervalKm: 100000, completed: false, importance: 'Crítico' },
  { task: 'Inspección de Amortiguadores, Rótulas y Bujes de Suspensión', system: 'Suspensión', intervalKm: 100000, completed: false, importance: 'Recomendado' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'diagnostic' | 'obd2' | 'parts' | 'maintenance'>('chat');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [lastDiagnostic, setLastDiagnostic] = useState<DiagnosticResult | null>(null);

  // Initialize saved vehicles from localStorage or default presets
  const [savedVehicles, setSavedVehicles] = useState<VehicleProfile[]>(() => {
    try {
      const stored = localStorage.getItem('autoia_saved_vehicles');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return PRESET_VEHICLES;
  });

  // Active vehicle state
  const [activeVehicle, setActiveVehicle] = useState<VehicleProfile | null>(() => {
    try {
      const storedActive = localStorage.getItem('autoia_active_vehicle');
      if (storedActive) {
        return JSON.parse(storedActive);
      }
    } catch (e) {
      console.error(e);
    }
    return PRESET_VEHICLES[0]; // Nissan Versa default
  });

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const storedChat = localStorage.getItem('autoia_chat_history');
      if (storedChat) {
        return JSON.parse(storedChat);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Persist saved vehicles
  useEffect(() => {
    try {
      localStorage.setItem('autoia_saved_vehicles', JSON.stringify(savedVehicles));
    } catch (e) {
      console.error(e);
    }
  }, [savedVehicles]);

  // Persist active vehicle
  useEffect(() => {
    try {
      if (activeVehicle) {
        localStorage.setItem('autoia_active_vehicle', JSON.stringify(activeVehicle));
      } else {
        localStorage.removeItem('autoia_active_vehicle');
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeVehicle]);

  // Persist chat history
  useEffect(() => {
    try {
      localStorage.setItem('autoia_chat_history', JSON.stringify(chatMessages.slice(-20)));
    } catch (e) {
      console.error(e);
    }
  }, [chatMessages]);

  const handleSaveVehicle = (vehicle: VehicleProfile) => {
    setSavedVehicles((prev) => {
      const filtered = prev.filter((v) => v.id !== vehicle.id);
      return [vehicle, ...filtered];
    });
  };

  const handleDeleteVehicle = (id: string) => {
    setSavedVehicles((prev) => prev.filter((v) => v.id !== id));
    if (activeVehicle?.id === id) {
      setActiveVehicle(null);
    }
  };

  const handleSelectVehicle = (vehicle: VehicleProfile) => {
    setActiveVehicle(vehicle);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantId = `msg-ai-${Date.now()}`;
    const assistantMsgPlaceholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg, assistantMsgPlaceholder]);
    setIsChatLoading(true);

    try {
      // First attempt fast streaming endpoint (SSE)
      const streamRes = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-6),
          vehicle: activeVehicle,
        }),
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let isFirstToken = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const rawData = line.replace('data: ', '').trim();
              if (rawData === '[DONE]') continue;
              try {
                const parsed = JSON.parse(rawData);
                if (parsed.chunk) {
                  if (isFirstToken) {
                    setIsChatLoading(false);
                    isFirstToken = false;
                  }
                  accumulated += parsed.chunk;
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: accumulated } : m
                    )
                  );
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // partial json or heartbeats can be ignored
              }
            }
          }
        }

        // Final verification
        if (accumulated.trim().length > 0) {
          return;
        }
      }

      // Fallback to non-streaming if stream was empty
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-6),
          vehicle: activeVehicle,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al comunicarse con AutoIA');
      }

      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: data.reply || 'No se recibió respuesta.' } : m
        )
      );
    } catch (error: any) {
      console.error('Error in chat response:', error);
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `⚠️ Ocurrió un error al procesar tu consulta automotriz: ${error.message || 'Error del servidor'}. Por favor intenta de nuevo.`,
              }
            : m
        )
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
  };

  const handleTransferToChat = (message: string, _diagnostic?: DiagnosticResult) => {
    setActiveTab('chat');
    handleSendMessage(message);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeVehicle={activeVehicle}
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' && (
          <ChatView
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            onClearChat={handleClearChat}
            activeVehicle={activeVehicle}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
          />
        )}

        {activeTab === 'diagnostic' && (
          <DiagnosticStudio
            activeVehicle={activeVehicle}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
            onTransferToChat={handleTransferToChat}
            onDiagnosticUpdated={(diag) => setLastDiagnostic(diag)}
          />
        )}

        {activeTab === 'obd2' && (
          <OBDScanner
            activeVehicle={activeVehicle}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
            onTransferToChat={handleTransferToChat}
          />
        )}

        {activeTab === 'parts' && (
          <PartsCompatibilityLab
            activeVehicle={activeVehicle}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
            onTransferToChat={handleTransferToChat}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenancePlanner
            activeVehicle={activeVehicle}
            onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
            onTransferToChat={handleTransferToChat}
          />
        )}
      </main>

      {/* Safety Notice & Technical Disclaimer Footer */}
      <footer className="border-t border-slate-850 bg-slate-950/80 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Seguridad Mecánica:</strong> Utiliza siempre torres de soporte (soportes de gato), no abras tapones de refrigerante caliente y desconecta la batería para trabajos eléctricos.
            </span>
          </div>
          <div className="text-[11px] text-slate-500 whitespace-nowrap">
            AutoIA • Asistente de Ingeniería Automotriz
          </div>
        </div>
      </footer>

      {/* Vehicle Profile Selection & Custom Manager Modal */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        activeVehicle={activeVehicle}
        onSelectVehicle={handleSelectVehicle}
        savedVehicles={savedVehicles}
        onSaveVehicle={handleSaveVehicle}
        onDeleteVehicle={handleDeleteVehicle}
      />

      {/* Technical PDF Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        activeVehicle={activeVehicle}
        lastDiagnostic={lastDiagnostic}
        maintenanceTasks={APP_DEFAULT_MAINTENANCE_SCHEDULE}
      />
    </div>
  );
}
