/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PULSO CLASE - Primera versión funcional (P0)
 * Aplicación móvil y sencilla para docentes y sus grupos de clase.
 * Resuelve: "El docente no sabe quién se quedó perdido hasta que llega el examen."
 */

import React, { useState, useEffect, useId } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Send, 
  BarChart3, 
  MessageSquare, 
  RotateCcw, 
  Edit3, 
  Users, 
  Check, 
  Sparkles,
  ArrowDown,
  BookOpen,
  History,
  Download,
  Trash2,
  FileSpreadsheet,
  FileJson,
  Database
} from 'lucide-react';

// Tipos de voto estrictos para evitar inconsistencias de tipado
export type VoteType = 'entendi' | 'dudas' | 'perdi';

export interface VoteRecord {
  id: string;
  type: VoteType;
  subject: string; // Tema o materia de la clase en el momento del voto
  comment?: string;
  timestamp: number; // Fecha y hora exacta (epoch ms)
}

export interface SavedSession {
  id: string;
  subject: string;
  question: string;
  votes: VoteRecord[];
  timestamp: number;
}

export interface PollState {
  subject: string;
  question: string;
  votes: VoteRecord[];
  history: SavedSession[];
}

// Configuración visual y descriptiva de las 3 opciones de voto obligatorias
const VOTE_OPTIONS: {
  id: VoteType;
  label: string;
  sublabel: string;
  color: string;
  bgLight: string;
  borderActive: string;
  barColor: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'entendi',
    label: 'Entendí',
    sublabel: 'Todo claro, puedo aplicarlo',
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50 hover:bg-emerald-100/80',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50',
    barColor: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  {
    id: 'dudas',
    label: 'Tengo dudas',
    sublabel: 'Entendí a medias o me faltó práctica',
    color: 'text-amber-700',
    bgLight: 'bg-amber-50 hover:bg-amber-100/80',
    borderActive: 'border-amber-500 ring-2 ring-amber-400 bg-amber-50',
    barColor: 'bg-amber-500',
    icon: HelpCircle,
  },
  {
    id: 'perdi',
    label: 'Me perdí',
    sublabel: 'Necesito que repasemos este tema',
    color: 'text-rose-700',
    bgLight: 'bg-rose-50 hover:bg-rose-100/80',
    borderActive: 'border-rose-500 ring-2 ring-rose-400 bg-rose-50',
    barColor: 'bg-rose-500',
    icon: AlertCircle,
  },
];

// Clave única en LocalStorage para no colisionar con otras apps
const STORAGE_KEY = 'pulso_clase_data_v1';

// Materia y Pregunta inicial predeterminada sugerida para docentes
const DEFAULT_SUBJECT = 'Matemática';
const DEFAULT_QUESTION = '¿Qué tan claro te quedó el tema principal visto en la clase de hoy?';

// Registros de prueba precargados para que el docente pueda explorar de inmediato
const SAMPLE_INITIAL_DATA: PollState = {
  subject: 'Matemática: Fracciones',
  question: '¿Qué tan claro te quedó el tema de suma y resta con distinto denominador?',
  votes: [
    {
      id: 'demo-v1',
      type: 'entendi',
      subject: 'Matemática: Fracciones',
      comment: 'Todo claro usando el mínimo común múltiplo.',
      timestamp: Date.now() - 1000 * 60 * 18,
    },
    {
      id: 'demo-v2',
      type: 'dudas',
      subject: 'Matemática: Fracciones',
      comment: 'Me costó simplificar al final.',
      timestamp: Date.now() - 1000 * 60 * 10,
    },
    {
      id: 'demo-v3',
      type: 'perdi',
      subject: 'Matemática: Fracciones',
      comment: 'No entendí cuándo se multiplica cruzado.',
      timestamp: Date.now() - 1000 * 60 * 4,
    },
  ],
  history: [
    {
      id: 'sesion-demo-prev1',
      subject: 'Física: Leyes de Newton',
      question: '¿Quedó clara la diferencia entre masa y peso?',
      votes: [
        {
          id: 'demo-h1',
          type: 'entendi',
          subject: 'Física: Leyes de Newton',
          comment: 'Muy claro el ejemplo de la Luna.',
          timestamp: Date.now() - 1000 * 60 * 60 * 24,
        },
        {
          id: 'demo-h2',
          type: 'dudas',
          subject: 'Física: Leyes de Newton',
          comment: 'La aceleración de gravedad me generó dudas.',
          timestamp: Date.now() - 1000 * 60 * 60 * 23,
        },
      ],
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
    },
  ],
};

export default function App() {
  // Estado principal de la clase (Tema + Pregunta + Votos activos + Historial de sesiones guardadas)
  const [poll, setPoll] = useState<PollState>(() => {
    // PUNTO CRÍTICO DE ERROR: Manejo seguro de JSON.parse con fallback y migración retrocompatible
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.question === 'string' && Array.isArray(parsed.votes)) {
          // Si el usuario ya tiene datos o historial guardado, preservamos todo
          return {
            subject: typeof parsed.subject === 'string' && parsed.subject.trim() ? parsed.subject : DEFAULT_SUBJECT,
            question: parsed.question,
            votes: parsed.votes.map((v: any) => ({
              ...v,
              subject: v.subject || parsed.subject || DEFAULT_SUBJECT,
            })),
            history: Array.isArray(parsed.history) ? parsed.history : [],
          };
        }
      }
    } catch (e) {
      console.error('Error al recuperar datos de LocalStorage:', e);
    }
    // Si no había datos previos en el navegador, inicializamos con los registros de prueba
    return SAMPLE_INITIAL_DATA;
  });

  // Estado del formulario de votación actual
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [anonymousComment, setAnonymousComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const [sessionToast, setSessionToast] = useState<string | null>(null);

  // Filtro interactivo del gráfico de barras para ver comentarios asociados
  const [filterByType, setFilterByType] = useState<VoteType | 'todos'>('todos');

  // Modo edición de la pregunta y del tema
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [tempQuestion, setTempQuestion] = useState(poll.question);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [tempSubject, setTempSubject] = useState(poll.subject);

  // Modal para ver historial de sesiones guardadas
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Modal o confirmación para reiniciar clase / nueva sesión
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const commentInputId = useId();

  // PUNTO CRÍTICO: Persistencia garantizada cada vez que cambia 'poll'
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(poll));
    } catch (err) {
      console.error('No se pudo guardar en LocalStorage:', err);
    }
  }, [poll]);

  // Cálculos estadísticos derivados (memorizados o calculados al vuelo)
  const totalVotes = poll.votes.length;

  const counts: Record<VoteType, number> = {
    entendi: poll.votes.filter(v => v.type === 'entendi').length,
    dudas: poll.votes.filter(v => v.type === 'dudas').length,
    perdi: poll.votes.filter(v => v.type === 'perdi').length,
  };

  // PUNTO CRÍTICO DE ERROR: División por cero al calcular porcentajes
  // Si totalVotes es 0, debe retornar 0% y no NaN o Infinity.
  const percentages: Record<VoteType, number> = {
    entendi: totalVotes > 0 ? Math.round((counts.entendi / totalVotes) * 100) : 0,
    dudas: totalVotes > 0 ? Math.round((counts.dudas / totalVotes) * 100) : 0,
    perdi: totalVotes > 0 ? Math.round((counts.perdi / totalVotes) * 100) : 0,
  };

  // Manejador del envío del voto
  const handleSubmitVote = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVote) {
      return;
    }

    setIsSubmitting(true);

    const newVoteRecord: VoteRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: selectedVote,
      subject: poll.subject, // Guarda el tema o materia de la clase actual
      comment: anonymousComment.trim() ? anonymousComment.trim() : undefined,
      timestamp: Date.now(), // Guarda la fecha y hora exacta
    };

    // Actualizamos el estado agregando el voto nuevo al final
    setPoll(prev => ({
      ...prev,
      votes: [newVoteRecord, ...prev.votes],
    }));

    // Reset del formulario para permitir otra respuesta si se comparte dispositivo
    setSelectedVote(null);
    setAnonymousComment('');
    setIsSubmitting(false);
    setShowSuccessBadge(true);

    // Ocultar mensaje de éxito tras unos segundos
    setTimeout(() => {
      setShowSuccessBadge(false);
    }, 4500);

    // Scroll suave hacia el resumen para cumplir el criterio de aceptación visual
    const summarySection = document.getElementById('resumen-clase');
    if (summarySection) {
      summarySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Guardar la edición de la pregunta
  const handleSaveQuestion = () => {
    if (tempQuestion.trim()) {
      setPoll(prev => ({
        ...prev,
        question: tempQuestion.trim(),
      }));
    }
    setIsEditingQuestion(false);
  };

  // Guardar la edición del tema o materia
  const handleSaveSubject = (newSubject?: string) => {
    const value = (newSubject !== undefined ? newSubject : tempSubject).trim();
    if (value) {
      setPoll(prev => ({
        ...prev,
        subject: value,
      }));
      setTempSubject(value);
    }
    setIsEditingSubject(false);
  };

  // Iniciar Nueva Sesión / Reiniciar votos:
  // Limpia el gráfico y los comentarios en pantalla, pero guarda la sesión previa en history
  const handleResetVotes = () => {
    // Si la sesión actual tiene votos registrados, la archivamos
    const hasVotesToArchive = poll.votes.length > 0;
    const sessionToArchive: SavedSession = {
      id: `sesion-${Date.now()}`,
      subject: poll.subject,
      question: poll.question,
      votes: [...poll.votes],
      timestamp: Date.now(),
    };

    setPoll(prev => ({
      ...prev,
      votes: [],
      history: hasVotesToArchive 
        ? [sessionToArchive, ...(prev.history || [])] 
        : (prev.history || []),
    }));

    setShowResetConfirm(false);
    setSelectedVote(null);
    setAnonymousComment('');
    setFilterByType('todos');

    // Notificación clara para el docente
    if (hasVotesToArchive) {
      setSessionToast(`Sesión anterior de "${poll.subject}" archivada con éxito. Gráfico limpio para la nueva clase.`);
    } else {
      setSessionToast('Nueva sesión lista.');
    }

    setTimeout(() => {
      setSessionToast(null);
    }, 4500);
  };

  // Borrar los datos de una clase específica archivada
  const handleDeleteSession = (sessionId: string) => {
    setPoll(prev => ({
      ...prev,
      history: (prev.history || []).filter(s => s.id !== sessionId),
    }));
    setSessionToast('Clase eliminada del historial.');
    setTimeout(() => setSessionToast(null), 3500);
  };

  // Cargar/Restablecer registros de prueba
  const handleLoadDemoData = () => {
    setPoll(SAMPLE_INITIAL_DATA);
    setSessionToast('Datos de prueba cargados.');
    setTimeout(() => setSessionToast(null), 3500);
  };

  // Exportar respaldo en formato JSON
  const exportToJSON = () => {
    const backupData = {
      app: 'PULSO CLASE',
      exportedAt: new Date().toISOString(),
      activePoll: {
        subject: poll.subject,
        question: poll.question,
        votesCount: poll.votes.length,
        votes: poll.votes,
      },
      archivedSessions: poll.history || [],
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pulso-clase-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSessionToast('Respaldo JSON descargado con éxito.');
    setTimeout(() => setSessionToast(null), 3500);
  };

  // Exportar datos a formato CSV (Compatible con Microsoft Excel / Google Sheets con UTF-8 BOM)
  const exportToCSV = () => {
    const rows: {
      estado: string;
      materia: string;
      pregunta: string;
      fechaHora: string;
      voto: string;
      comentario: string;
    }[] = [];

    // Votos de la clase actual
    poll.votes.forEach(v => {
      rows.push({
        estado: 'Clase Actual (En curso)',
        materia: v.subject || poll.subject,
        pregunta: poll.question,
        fechaHora: new Date(v.timestamp).toLocaleString('es-AR'),
        voto: v.type === 'entendi' ? 'Entendí' : v.type === 'dudas' ? 'Tengo dudas' : 'Me perdí',
        comentario: v.comment || 'Sin comentario',
      });
    });

    // Votos de clases archivadas
    (poll.history || []).forEach(sess => {
      sess.votes.forEach(v => {
        rows.push({
          estado: `Archivada (${new Date(sess.timestamp).toLocaleDateString('es-AR')})`,
          materia: sess.subject,
          pregunta: sess.question,
          fechaHora: new Date(v.timestamp).toLocaleString('es-AR'),
          voto: v.type === 'entendi' ? 'Entendí' : v.type === 'dudas' ? 'Tengo dudas' : 'Me perdí',
          comentario: v.comment || 'Sin comentario',
        });
      });
    });

    if (rows.length === 0) {
      alert('No hay votos registrados para exportar.');
      return;
    }

    const headers = ['Estado Sesión', 'Tema o Materia', 'Pregunta de Salida', 'Fecha y Hora', 'Voto', 'Comentario Anónimo'];
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => [
        `"${r.estado.replace(/"/g, '""')}"`,
        `"${r.materia.replace(/"/g, '""')}"`,
        `"${r.pregunta.replace(/"/g, '""')}"`,
        `"${r.fechaHora.replace(/"/g, '""')}"`,
        `"${r.voto.replace(/"/g, '""')}"`,
        `"${r.comentario.replace(/"/g, '""')}"`,
      ].join(';')),
    ].join('\r\n');

    // \uFEFF fuerza a Excel a interpretar UTF-8 para tildes y caracteres en español
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pulso-clase-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSessionToast('Reporte CSV descargado con éxito.');
    setTimeout(() => setSessionToast(null), 3500);
  };

  // Filtrado de comentarios para inspección docente
  const commentsList = poll.votes.filter(v => Boolean(v.comment));
  const filteredComments = filterByType === 'todos' 
    ? commentsList 
    : commentsList.filter(v => v.type === filterByType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-800 flex flex-col items-center justify-start pb-16 px-4 pt-4 sm:pt-8">
      
      {/* HEADER / BRANDING */}
      <header className="w-full max-w-md mx-auto text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PULSO CLASE • Ticket de Salida</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pulso de la Clase
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          ¿Quién se quedó perdido? Descubrilo en tiempo real antes del examen.
        </p>
      </header>

      {/* CONTENEDOR PRINCIPAL MOBILE-FIRST (Máx. 448px, óptimo para celulares) */}
      <main className="w-full max-w-md mx-auto space-y-5">

        {/* NOTIFICACIÓN DE SESIÓN GUARDADA / REINICIADA */}
        {sessionToast && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl flex items-center justify-between gap-2 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold">{sessionToast}</span>
            </div>
            {poll.history && poll.history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="underline font-bold text-indigo-700 hover:text-indigo-900 shrink-0"
              >
                Ver historial
              </button>
            )}
          </div>
        )}

        {/* SELECTOR / CAMPO: TEMA O MATERIA DE LA CLASE */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tema o Materia de la clase</span>
            </span>
            {poll.history && poll.history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors"
                title="Ver sesiones anteriores archivadas"
              >
                <History className="w-3 h-3" />
                <span>Historial ({poll.history.length})</span>
              </button>
            )}
          </div>

          {!isEditingSubject ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  {poll.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempSubject(poll.subject);
                  setIsEditingSubject(true);
                }}
                className="shrink-0 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold py-1 px-2 rounded-md hover:bg-indigo-50 transition-colors"
                title="Cambiar materia o tema"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Cambiar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={tempSubject}
                onChange={(e) => setTempSubject(e.target.value)}
                placeholder="Ej. Matemática, Historia, Física..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveSubject();
                  }
                }}
              />
              {/* Opciones rápidas de materias comunes */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {['Matemática', 'Historia', 'Lengua', 'Biología', 'Física', 'Inglés', 'Química'].map((materia) => (
                  <button
                    key={materia}
                    type="button"
                    onClick={() => {
                      setTempSubject(materia);
                      handleSaveSubject(materia);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                      tempSubject === materia 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {materia}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingSubject(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubject()}
                  className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
                >
                  Guardar tema
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 1. SECCIÓN: PREGUNTA DE SALIDA */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pregunta de salida
            </span>
            {!isEditingQuestion ? (
              <button
                type="button"
                onClick={() => {
                  setTempQuestion(poll.question);
                  setIsEditingQuestion(true);
                }}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded-md hover:bg-indigo-50 transition-colors"
                title="Editar pregunta"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            ) : null}
          </div>

          {isEditingQuestion ? (
            <div className="space-y-3 pt-1">
              <textarea
                value={tempQuestion}
                onChange={(e) => setTempQuestion(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none font-medium"
                placeholder="Escribe la pregunta de salida para tus alumnos..."
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingQuestion(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Guardar pregunta
                </button>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {poll.question}
            </h2>
          )}
        </section>

        {/* 2. SECCIÓN: FORMULARIO DE VOTACIÓN Y COMENTARIO ANÓNIMO */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
          <form onSubmit={handleSubmitVote} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Tu respuesta (elegí una)
              </label>

              {/* Botones de selección de 3 opciones táctiles */}
              <div className="grid grid-cols-1 gap-2.5">
                {VOTE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedVote === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedVote(opt.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all active:scale-[0.99] touch-manipulation cursor-pointer ${
                        isSelected 
                          ? `${opt.borderActive} shadow-sm` 
                          : `border-slate-200 ${opt.bgLight} hover:border-slate-300`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white shadow-xs' : 'bg-white/80'}`}>
                          <Icon className={`w-5 h-5 ${opt.color}`} />
                        </div>
                        <div>
                          <span className={`block font-bold text-base ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                            {opt.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {opt.sublabel}
                          </span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comentario anónimo opcional */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor={commentInputId}
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Comentario anónimo (opcional)</span>
                </label>
                <span className="text-[11px] text-slate-400">100% privado</span>
              </div>
              <textarea
                id={commentInputId}
                value={anonymousComment}
                onChange={(e) => setAnonymousComment(e.target.value)}
                maxLength={280}
                rows={2}
                placeholder="¿En qué te trabaste o qué parte te gustaría repasar?"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
                <span>Tu nombre nunca se registra.</span>
                <span>{anonymousComment.length}/280</span>
              </div>
            </div>

            {/* Botón principal de envío */}
            <button
              type="submit"
              disabled={!selectedVote || isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md touch-manipulation cursor-pointer ${
                selectedVote && !isSubmitting
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-200 hover:shadow-indigo-300 transform active:scale-[0.99]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{selectedVote ? 'Enviar mi voto a la clase' : 'Elegí una opción arriba'}</span>
            </button>
          </form>

          {/* Feedback inmediato de confirmación */}
          {showSuccessBadge && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-fade-in">
              <div className="bg-emerald-600 text-white p-1 rounded-full shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-xs leading-tight">
                <p className="font-bold text-emerald-900">¡Voto registrado con éxito!</p>
                <p className="text-emerald-700">Tu respuesta ya se sumó al resumen de la clase abajo.</p>
              </div>
            </div>
          )}
        </section>

        {/* 3. SECCIÓN: RESUMEN VISUAL EN VIVO (GRÁFICO DE BARRAS INTERACTIVO) */}
        <section 
          id="resumen-clase"
          className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 scroll-mt-6"
        >
          {/* Header del Resumen con conteo y opciones de reseteo */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base leading-tight">
                  Resumen de la Clase
                </h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{totalVotes} {totalVotes === 1 ? 'voto registrado' : 'votos registrados'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {(totalVotes > 0 || (poll.history && poll.history.length > 0)) && (
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 active:scale-95 shadow-2xs"
                  title="Exportar reporte a Excel (CSV)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              )}

              {totalVotes > 0 && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 active:scale-95 shadow-xs"
                  title="Iniciar Nueva Sesión / Reiniciar Votos"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Nueva Sesión</span>
                </button>
              )}
            </div>
          </div>

          {/* Gráfico de Barras Interactivo */}
          <div className="mt-5 space-y-4">
            {VOTE_OPTIONS.map((opt) => {
              const count = counts[opt.id];
              const pct = percentages[opt.id];
              const isFilterActive = filterByType === opt.id;

              return (
                <div 
                  key={opt.id}
                  onClick={() => setFilterByType(prev => prev === opt.id ? 'todos' : opt.id)}
                  className={`group p-3 rounded-xl transition-all cursor-pointer border ${
                    isFilterActive 
                      ? 'border-indigo-400 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200' 
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50/70'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setFilterByType(prev => prev === opt.id ? 'todos' : opt.id);
                    }
                  }}
                  title={`Haz clic para ver comentarios de "${opt.label}"`}
                >
                  <div className="flex justify-between items-center text-sm font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-800">
                      <span className={`w-2.5 h-2.5 rounded-full ${opt.barColor}`} />
                      <span>{opt.label}</span>
                    </span>
                    <span className="text-slate-700 font-mono text-xs sm:text-sm">
                      <span className="font-bold text-slate-900">{count}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-500 font-bold">{pct}%</span>
                    </span>
                  </div>

                  {/* Barra visual con animación de ancho */}
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${opt.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnóstico rápido para el docente si hay votos */}
          {totalVotes > 0 && (
            <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <div className="shrink-0 text-indigo-600 mt-0.5">
                <ArrowDown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">
                  Termómetro del grupo:
                </span>
                {counts.perdi + counts.dudas > counts.entendi ? (
                  <span className="text-rose-700 font-medium">
                    ⚠️ La mayoría ({percentages.dudas + percentages.perdi}%) tiene dudas o se perdió. Conviene frenar 5 minutos y repasar los puntos clave.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    ✅ Buen ritmo: el {percentages.entendi}% de los alumnos siente que entendió el tema principal.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Listado de comentarios anónimos recibidos */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comentarios de la clase ({filteredComments.length})</span>
              </h4>

              {/* Selector de filtro rápido */}
              {commentsList.length > 0 && (
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFilterByType('todos')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      filterByType === 'todos' 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Todos
                  </button>
                  {VOTE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFilterByType(opt.id)}
                      className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                        filterByType === opt.id 
                          ? `${opt.barColor} text-white` 
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredComments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                {commentsList.length === 0 
                  ? 'Aún no se enviaron comentarios anónimos para esta pregunta.' 
                  : 'No hay comentarios con el filtro seleccionado.'}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredComments.map((record) => {
                  const opt = VOTE_OPTIONS.find(o => o.id === record.type);
                  return (
                    <div 
                      key={record.id} 
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          record.type === 'entendi' ? 'bg-emerald-100 text-emerald-800' :
                          record.type === 'dudas' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {opt?.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 font-normal leading-relaxed">
                        "{record.comment}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* MODAL DE CONFIRMACIÓN PARA NUEVA SESIÓN / REINICIAR (Guarda la sesión previa) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-slate-900 text-base">¿Iniciar Nueva Sesión?</h4>
              <p className="text-xs text-slate-600 mt-1">
                Se limpiará el gráfico y los comentarios en pantalla.
              </p>
              {poll.votes.length > 0 && (
                <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 text-left space-y-0.5">
                  <span className="font-bold text-slate-800 block text-xs">Se archivará en historial:</span>
                  <p>• <strong>Tema:</strong> {poll.subject}</p>
                  <p>• <strong>Votos:</strong> {poll.votes.length} registrados</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetVotes}
                className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
              >
                Guardar y Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / VISOR DE HISTORIAL DE SESIONES GUARDADAS */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-200 space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Historial de Clases ({poll.history?.length || 0})</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Herramientas de Exportación */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Descargar respaldo
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  title="Descargar tabla compatible con Excel y Google Sheets"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={exportToJSON}
                  className="py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  title="Descargar copia íntegra en JSON"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Copia (.JSON)</span>
                </button>
              </div>
            </div>

            {/* Listado de Sesiones Archivadas */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {(!poll.history || poll.history.length === 0) ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-slate-400">
                    No hay sesiones guardadas en el historial.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Database className="w-3 h-3" />
                    <span>Cargar registros de prueba</span>
                  </button>
                </div>
              ) : (
                poll.history.map((sess) => {
                  const sTotal = sess.votes.length;
                  const sEntendi = sess.votes.filter(v => v.type === 'entendi').length;
                  const sDudas = sess.votes.filter(v => v.type === 'dudas').length;
                  const sPerdi = sess.votes.filter(v => v.type === 'perdi').length;
                  const pEntendi = sTotal > 0 ? Math.round((sEntendi / sTotal) * 100) : 0;
                  const pDudas = sTotal > 0 ? Math.round((sDudas / sTotal) * 100) : 0;
                  const pPerdi = sTotal > 0 ? Math.round((sPerdi / sTotal) * 100) : 0;

                  return (
                    <div key={sess.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs relative group">
                      <div className="flex justify-between items-start gap-2">
                        <div className="pr-6">
                          <span className="font-bold text-slate-900 text-sm block">
                            {sess.subject}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(sess.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}{' '}
                            {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                            {sTotal} {sTotal === 1 ? 'voto' : 'votos'}
                          </span>
                          {/* Botón para borrar los datos de esta clase archivada */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(sess.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors ml-1"
                            title="Borrar esta clase del historial"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px] text-center pt-1 font-semibold">
                        <div className="bg-emerald-50 text-emerald-800 p-1 rounded-md">
                          Entendí: {pEntendi}% ({sEntendi})
                        </div>
                        <div className="bg-amber-50 text-amber-800 p-1 rounded-md">
                          Dudas: {pDudas}% ({sDudas})
                        </div>
                        <div className="bg-rose-50 text-rose-800 p-1 rounded-md">
                          Perdidos: {pPerdi}% ({sPerdi})
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleLoadDemoData}
                className="text-[11px] text-slate-400 hover:text-indigo-600 transition-colors"
                title="Restablecer datos de prueba"
              >
                Cargar datos de prueba
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="py-1.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-8 text-center text-xs text-slate-400">
        PULSO CLASE • Ticket de salida sencillo para educación activa
      </footer>
    </div>
  );
}
