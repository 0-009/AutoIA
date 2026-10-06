import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Car, 
  AlertTriangle, 
  Check, 
  Copy, 
  Wrench, 
  ShieldAlert,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, VehicleProfile } from '../types/auto';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onClearChat: () => void;
  activeVehicle: VehicleProfile | null;
  onOpenVehicleModal: () => void;
}

const QUICK_PROMPTS = [
  '¿Qué aceite de motor y viscosidad recomienda el fabricante para mi auto?',
  'Mi auto cascabelea o pistonea al acelerar con fuerza en una subida',
  'Siento una vibración en el volante al frenar a más de 80 km/h',
  'La transmisión automática da un tirón brusco al entrar la 2ª velocidad',
  '¿Por qué el pedal de embrague (clutch) está demasiado duro al pisar?',
  'Huele a gasolina cruda al encender en las mañanas, ¿qué reviso?'
];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
  activeVehicle,
  onOpenVehicleModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format AI response cleanly
  const renderFormattedContent = (content: string) => {
    // Split into paragraphs / lines
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Headings
      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        const text = trimmed.replace(/^#{2,3}\s+/, '');
        return (
          <h4 key={idx} className="text-sm font-bold text-amber-400 mt-3 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {text}
          </h4>
        );
      }

      if (trimmed.startsWith('# ')) {
        const text = trimmed.replace(/^#\s+/, '');
        return (
          <h3 key={idx} className="text-base font-extrabold text-white mt-4 mb-2">
            {text}
          </h3>
        );
      }

      // Warning or Important notes
      if (trimmed.toLowerCase().includes('advertencia') || trimmed.toLowerCase().includes('precaución') || trimmed.toLowerCase().includes('peligro') || trimmed.toLowerCase().includes('atención')) {
        return (
          <div key={idx} className="p-2.5 my-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            {line}
          </div>
        );
      }

      // Bullets
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^[-*]\s+/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-300 my-0.5 leading-relaxed">
            {renderBoldText(bulletText)}
          </li>
        );
      }

      // Numbered items
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={idx} className="text-xs text-slate-300 my-1 font-medium leading-relaxed">
            {renderBoldText(trimmed)}
          </div>
        );
      }

      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-xs text-slate-300 my-1 leading-relaxed">
          {renderBoldText(trimmed)}
        </p>
      );
    });
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Top Bar inside Chat */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              Asistente Automotriz AutoIA
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeVehicle
                ? `Contexto activo: ${activeVehicle.brand} ${activeVehicle.model} ${activeVehicle.year} (${activeVehicle.engine})`
                : 'Sin vehículo asignado (AutoIA te pedirá los datos cuando sean requeridos)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!activeVehicle && (
            <button
              onClick={onOpenVehicleModal}
              className="text-[11px] px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1"
            >
              <Car className="w-3 h-3" />
              <span>Fijar Auto</span>
            </button>
          )}

          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Limpiar conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/5">
              <Car className="w-8 h-8 stroke-[1.8]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">
                ¡Hola! Soy AutoIA, tu asistente técnico automotriz.
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Especializado en automóviles y camionetas de cualquier marca, modelo y año. Pregúntame sobre diagnóstico metódico, códigos OBD-II, ruidos anómalos, mantenimiento preventivo y compatibilidad de refacciones.
              </p>
            </div>

            {/* Principles Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left max-w-xl mx-auto text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                  1. Diferenciación
                </span>
                <p className="text-slate-400 text-[11px]">
                  Diferencio siempre entre una causa probable y un diagnóstico confirmado.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                  2. Honestidad Técnica
                </span>
                <p className="text-slate-400 text-[11px]">
                  No invento especificaciones ni números de parte cuando falten datos del vehículo.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                  3. Pasos de Comprobación
                </span>
                <p className="text-slate-400 text-[11px]">
                  Te indico qué probar con multímetro o herramientas antes de cambiar piezas.
                </p>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Consultas rápidas para comenzar:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(prompt)}
                    className="text-left text-xs px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition-all shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Wrench className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : !msg.content ? (
                    <div className="flex items-center gap-2 py-1 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="italic">AutoIA está respondiendo...</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {renderFormattedContent(msg.content)}

                      {/* Copy action */}
                      <div className="pt-2 mt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500">
                        <span>AutoIA Asistente</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar respuesta</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Car className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (!messages.length || messages[messages.length - 1].role === 'user') && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>AutoIA está analizando el caso técnico y consultando especificaciones...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/80">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={
              activeVehicle
                ? `Pregunta sobre ${activeVehicle.brand} ${activeVehicle.model} (${activeVehicle.year})...`
                : 'Pregunta sobre fallas, códigos OBD2, ruidos, mantenimiento o refacciones...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-400/20 flex items-center gap-1.5 shrink-0"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};
