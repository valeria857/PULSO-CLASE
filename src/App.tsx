/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PULSO CLASE - Versión optimizada para uso en celular (M3)
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
  Database,
  Inbox
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
// Contraste reforzado para visibilidad en luz solar y textos >= 16px
const VOTE_OPTIONS: {
  id: VoteType;
  label: string;
  sublabel: string;
  color: string;
  badgeBg: string;
  borderActive: string;
  barColor: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'entendi',
    label: 'Entendí',
    sublabel: 'Todo claro, puedo aplicarlo',
    color: 'text-emerald-900',
    badgeBg: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    borderActive: 'border-emerald-600 ring-2 ring-emerald-500 bg-emerald-50',
    barColor: 'bg-emerald-600',
    icon: CheckCircle2,
  },
  {
    id: 'dudas',
    label: 'Tengo dudas',
    sublabel: 'Entendí a medias o me faltó práctica',
    color: 'text-amber-950',
    badgeBg: 'bg-amber-100 text-amber-950 border border-amber-300',
    borderActive: 'border-amber-600 ring-2 ring-amber-500 bg-amber-50',
    barColor: 'bg-amber-500',
    icon: HelpCircle,
  },
  {
    id: 'perdi',
    label: 'Me perdí',
    sublabel: 'Necesito que repasemos este tema',
    color: 'text-rose-950',
    badgeBg: 'bg-rose-100 text-rose-950 border border-rose-300',
    borderActive: 'border-rose-600 ring-2 ring-rose-500 bg-rose-50',
    barColor: 'bg-rose-600',
    icon: AlertCircle,
  },
];

// Clave única en LocalStorage para no colisionar con otras apps
const STORAGE_KEY = 'pulso_clase_data_v1';

// Materia y Pregunta inicial predeterminada sugerida para docentes
const DEFAULT_SUBJECT = 'Matemática';
const DEFAULT_QUESTION = '¿Qué tan claro te quedó el tema principal visto en la clase de hoy?';

// Registros de prueba precargados para explorar de inmediato
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
  // Estado principal de la clase
  const [poll, setPoll] = useState<PollState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.question === 'string' && Array.isArray(parsed.votes)) {
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

  // Modales
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // IDs accesibles para conectar <label> con inputs
  const subjectInputId = useId();
  const questionInputId = useId();
  const commentInputId = useId();

  // Persistencia garantizada en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(poll));
    } catch (err) {
      console.error('No se pudo guardar en LocalStorage:', err);
    }
  }, [poll]);

  // Cálculos estadísticos
  const totalVotes = poll.votes.length;

  const counts: Record<VoteType, number> = {
    entendi: poll.votes.filter(v => v.type === 'entendi').length,
    dudas: poll.votes.filter(v => v.type === 'dudas').length,
    perdi: poll.votes.filter(v => v.type === 'perdi').length,
  };

  // Cálculo seguro evitando división por cero
  const percentages: Record<VoteType, number> = {
    entendi: totalVotes > 0 ? Math.round((counts.entendi / totalVotes) * 100) : 0,
    dudas: totalVotes > 0 ? Math.round((counts.dudas / totalVotes) * 100) : 0,
    perdi: totalVotes > 0 ? Math.round((counts.perdi / totalVotes) * 100) : 0,
  };

  // Enviar el voto
  const handleSubmitVote = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVote) {
      return;
    }

    setIsSubmitting(true);

    const newVoteRecord: VoteRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: selectedVote,
      subject: poll.subject,
      comment: anonymousComment.trim() ? anonymousComment.trim() : undefined,
      timestamp: Date.now(),
    };

    setPoll(prev => ({
      ...prev,
      votes: [newVoteRecord, ...prev.votes],
    }));

    setSelectedVote(null);
    setAnonymousComment('');
    setIsSubmitting(false);
    setShowSuccessBadge(true);

    setTimeout(() => {
      setShowSuccessBadge(false);
    }, 5000);

    const summarySection = document.getElementById('resumen-clase');
    if (summarySection) {
      summarySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Guardar pregunta
  const handleSaveQuestion = () => {
    if (tempQuestion.trim()) {
      setPoll(prev => ({
        ...prev,
        question: tempQuestion.trim(),
      }));
    }
    setIsEditingQuestion(false);
  };

  // Guardar tema
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

  // Iniciar nueva sesión / reiniciar votos
  const handleResetVotes = () => {
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

    if (hasVotesToArchive) {
      setSessionToast(`¡Listo! La clase de "${poll.subject}" se guardó en el historial y la pantalla quedó lista para una nueva clase.`);
    } else {
      setSessionToast('Pantalla reiniciada para comenzar una nueva clase.');
    }

    setTimeout(() => {
      setSessionToast(null);
    }, 5000);
  };

  // Borrar clase archivada
  const handleDeleteSession = (sessionId: string) => {
    setPoll(prev => ({
      ...prev,
      history: (prev.history || []).filter(s => s.id !== sessionId),
    }));
    setSessionToast('La clase fue eliminada del historial.');
    setTimeout(() => setSessionToast(null), 4000);
  };

  // Cargar datos de prueba
  const handleLoadDemoData = () => {
    setPoll(SAMPLE_INITIAL_DATA);
    setSessionToast('Se cargaron los datos de ejemplo para probar la app.');
    setTimeout(() => setSessionToast(null), 4000);
  };

  // Exportar a JSON
  const exportToJSON = () => {
    const backupData = {
      aplicacion: 'PULSO CLASE',
      fechaExportacion: new Date().toISOString(),
      claseActual: {
        materia: poll.subject,
        pregunta: poll.question,
        totalVotos: poll.votes.length,
        votos: poll.votes,
      },
      clasesArchivadas: poll.history || [],
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pulso-clase-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSessionToast('Copia de seguridad en archivo JSON descargada correctamente.');
    setTimeout(() => setSessionToast(null), 4000);
  };

  // Exportar a CSV
  const exportToCSV = () => {
    const rows: {
      estado: string;
      materia: string;
      pregunta: string;
      fechaHora: string;
      voto: string;
      comentario: string;
    }[] = [];

    poll.votes.forEach(v => {
      rows.push({
        estado: 'Clase Actual',
        materia: v.subject || poll.subject,
        pregunta: poll.question,
        fechaHora: new Date(v.timestamp).toLocaleString('es-AR'),
        voto: v.type === 'entendi' ? 'Entendí' : v.type === 'dudas' ? 'Tengo dudas' : 'Me perdí',
        comentario: v.comment || 'Sin comentario',
      });
    });

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
      setSessionToast('Todavía no hay votos registrados para exportar.');
      setTimeout(() => setSessionToast(null), 4000);
      return;
    }

    const headers = ['Estado de la Sesión', 'Tema o Materia', 'Pregunta de Salida', 'Fecha y Hora', 'Voto', 'Comentario Anónimo'];
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

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pulso-clase-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSessionToast('Planilla de Excel (.CSV) descargada correctamente.');
    setTimeout(() => setSessionToast(null), 4000);
  };

  const commentsList = poll.votes.filter(v => Boolean(v.comment));
  const filteredComments = filterByType === 'todos' 
    ? commentsList 
    : commentsList.filter(v => v.type === filterByType);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-start pb-16 px-3.5 sm:px-4 pt-4 sm:pt-7 overflow-x-hidden">
      
      {/* ENCABEZADO / TÍTULO PRINCIPAL (Alto contraste solar) */}
      <header className="w-full max-w-md mx-auto text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-indigo-700 text-white font-extrabold px-3.5 py-1.5 rounded-full text-base tracking-wide mb-2 shadow-sm">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>PULSO CLASE • Ticket de salida</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Pulso de la Clase
        </h1>
        <p className="text-base font-semibold text-slate-700 mt-1 max-w-sm mx-auto">
          Sabé quién entendió y quién se quedó perdido antes del examen.
        </p>
      </header>

      {/* CONTENEDOR PRINCIPAL MOBILE-FIRST (Optimizado desde 320 px de ancho) */}
      <main className="w-full max-w-md mx-auto space-y-5">

        {/* MENSAJE DE CONFIRMACIÓN O INFORMACIÓN VISIBLE (Español claro) */}
        {sessionToast && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 rounded-2xl flex items-start justify-between gap-3 shadow-sm text-base font-bold animate-fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
              <span className="leading-snug">{sessionToast}</span>
            </div>
            {poll.history && poll.history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="underline text-emerald-900 hover:text-emerald-950 font-extrabold shrink-0 text-base py-1"
              >
                Ver historial
              </button>
            )}
          </div>
        )}

        {/* 1. SECCIÓN: TEMA O MATERIA DE LA CLASE (Con etiqueta visible y botones secundarios) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label 
              htmlFor={subjectInputId}
              className="text-base font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5 text-indigo-700 shrink-0" />
              <span>Tema o Materia de la clase</span>
            </label>
            {poll.history && poll.history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-1.5 text-base font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
                title="Ver clases anteriores guardadas"
              >
                <History className="w-4 h-4 text-indigo-700" />
                <span>Historial ({poll.history.length})</span>
              </button>
            )}
          </div>

          {!isEditingSubject ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="inline-block w-3.5 h-3.5 rounded-full bg-indigo-600 shrink-0" />
                <p className="text-lg font-extrabold text-slate-900 truncate">
                  {poll.subject}
                </p>
              </div>
              {/* Botón secundario con borde */}
              <button
                type="button"
                onClick={() => {
                  setTempSubject(poll.subject);
                  setIsEditingSubject(true);
                }}
                className="shrink-0 inline-flex items-center gap-1.5 text-base font-bold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 py-2 px-3 rounded-xl transition-colors active:scale-95"
                title="Cambiar materia o tema"
              >
                <Edit3 className="w-4 h-4 text-slate-700" />
                <span>Cambiar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <label htmlFor={subjectInputId} className="block text-base font-bold text-slate-800">
                Escribí el nuevo tema:
              </label>
              <input
                id={subjectInputId}
                type="text"
                value={tempSubject}
                onChange={(e) => setTempSubject(e.target.value)}
                placeholder="Ejemplo: Matemática: Fracciones"
                className="w-full rounded-xl border-2 border-slate-400 p-3 text-base font-semibold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveSubject();
                  }
                }}
              />
              {/* Opciones rápidas de materias */}
              <div>
                <span className="block text-base font-semibold text-slate-700 mb-1.5">
                  Sugerencias rápidas:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Matemática', 'Historia', 'Lengua', 'Biología', 'Física', 'Inglés', 'Química'].map((materia) => (
                    <button
                      key={materia}
                      type="button"
                      onClick={() => {
                        setTempSubject(materia);
                        handleSaveSubject(materia);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-base font-bold transition-colors border active:scale-95 ${
                        tempSubject === materia 
                          ? 'bg-indigo-700 text-white border-indigo-800' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      {materia}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSubject(false)}
                  className="px-4 py-2.5 text-base font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubject()}
                  className="px-4 py-2.5 text-base font-bold bg-slate-900 hover:bg-black text-white rounded-xl transition-colors shadow-sm"
                >
                  Guardar tema
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 2. SECCIÓN: PREGUNTA DE SALIDA (Con etiqueta visible) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label 
              htmlFor={questionInputId}
              className="text-base font-extrabold uppercase tracking-wide text-slate-900"
            >
              Pregunta de salida para el grupo
            </label>
            {!isEditingQuestion ? (
              <button
                type="button"
                onClick={() => {
                  setTempQuestion(poll.question);
                  setIsEditingQuestion(true);
                }}
                className="inline-flex items-center gap-1.5 text-base font-bold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 py-1.5 px-3 rounded-xl transition-colors active:scale-95"
                title="Editar la pregunta de salida"
              >
                <Edit3 className="w-4 h-4 text-slate-700" />
                <span>Editar</span>
              </button>
            ) : null}
          </div>

          {isEditingQuestion ? (
            <div className="space-y-3 pt-2">
              <label htmlFor={questionInputId} className="block text-base font-bold text-slate-800">
                Escribí la pregunta para tus alumnos:
              </label>
              <textarea
                id={questionInputId}
                value={tempQuestion}
                onChange={(e) => setTempQuestion(e.target.value)}
                rows={3}
                className="w-full rounded-xl border-2 border-slate-400 p-3 text-base font-semibold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none resize-none bg-white"
                placeholder="Ejemplo: ¿Qué parte del ejercicio resultó más difícil?"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingQuestion(false)}
                  className="px-4 py-2.5 text-base font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="px-4 py-2.5 text-base font-bold bg-slate-900 hover:bg-black text-white rounded-xl transition-colors shadow-sm"
                >
                  Guardar pregunta
                </button>
              </div>
            </div>
          ) : (
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug pt-1">
              {poll.question}
            </h2>
          )}
        </section>

        {/* 3. SECCIÓN: FORMULARIO DE VOTACIÓN Y COMENTARIO ANÓNIMO */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 sm:p-5">
          <form onSubmit={handleSubmitVote} className="space-y-5">
            <div>
              {/* Etiqueta visible obligatoria */}
              <label 
                id="opciones-voto-etiqueta"
                className="block text-base font-extrabold uppercase tracking-wide text-slate-900 mb-2.5"
              >
                Tu respuesta (elegí una opción):
              </label>

              {/* Botones de selección de 3 opciones táctiles (>= 48px de alto para una sola mano) */}
              <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-labelledby="opciones-voto-etiqueta">
                {VOTE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedVote === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedVote(opt.id)}
                      className={`w-full min-h-[58px] flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] touch-manipulation cursor-pointer ${
                        isSelected 
                          ? `${opt.borderActive} shadow-sm` 
                          : `border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white shadow-xs' : 'bg-white border border-slate-200'}`}>
                          <Icon className={`w-6 h-6 ${opt.color}`} />
                        </div>
                        <div>
                          <span className={`block font-extrabold text-lg leading-tight ${isSelected ? 'text-slate-950' : 'text-slate-900'}`}>
                            {opt.label}
                          </span>
                          <span className="text-base font-semibold text-slate-700 leading-snug">
                            {opt.sublabel}
                          </span>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                        isSelected 
                          ? 'border-indigo-700 bg-indigo-700 text-white' 
                          : 'border-slate-400 bg-white'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo de Comentario anónimo con etiqueta visible */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor={commentInputId}
                  className="text-base font-extrabold text-slate-900 flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5 text-indigo-700 shrink-0" />
                  <span>Comentario anónimo (opcional):</span>
                </label>
                <span className="text-base font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                  100% privado
                </span>
              </div>
              <textarea
                id={commentInputId}
                value={anonymousComment}
                onChange={(e) => setAnonymousComment(e.target.value)}
                maxLength={280}
                rows={3}
                placeholder="Escribí aquí en qué te trabaste o qué te gustaría repasar..."
                className="w-full rounded-xl border-2 border-slate-400 bg-white p-3.5 text-base font-medium text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
              />
              <div className="flex justify-between items-center text-base font-semibold text-slate-700 mt-1.5 px-1">
                <span>Tu nombre nunca se registra.</span>
                <span>{anonymousComment.length} / 280</span>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL DESTACADO ÚNICO DE LA PANTALLA (Jerarquía Primaria Dominante) */}
            <button
              type="submit"
              disabled={!selectedVote || isSubmitting}
              className={`w-full min-h-[56px] py-4 px-5 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2.5 transition-all shadow-md touch-manipulation cursor-pointer ${
                selectedVote && !isSubmitting
                  ? 'bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white shadow-indigo-300 ring-2 ring-indigo-500 transform active:scale-[0.98]'
                  : 'bg-slate-300 text-slate-600 border border-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Send className="w-5 h-5 shrink-0" />
              <span>{selectedVote ? 'Enviar mi voto a la clase' : 'Elegí una opción arriba para votar'}</span>
            </button>
          </form>

          {/* Feedback inmediato visible tras votar (Español claro sin tecnicismos) */}
          {showSuccessBadge && (
            <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 rounded-2xl flex items-start gap-3 animate-fade-in shadow-sm">
              <div className="bg-emerald-700 text-white p-1.5 rounded-full shrink-0 mt-0.5">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="leading-snug">
                <p className="font-extrabold text-lg text-emerald-950">¡Voto registrado con éxito!</p>
                <p className="text-base font-semibold text-emerald-900 mt-0.5">
                  Tu respuesta fue sumada al gráfico de la clase que podés ver abajo.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 4. SECCIÓN: RESUMEN VISUAL EN VIVO (Con estado vacío ilustrativo) */}
        <section 
          id="resumen-clase"
          className="bg-white rounded-2xl shadow-sm border border-slate-300 p-4 sm:p-5 scroll-mt-6"
        >
          {/* Cabecera del Resumen */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl border border-indigo-200">
                <BarChart3 className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight">
                  Resumen de la Clase
                </h3>
                <span className="text-base font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-indigo-700" />
                  <span>{totalVotes} {totalVotes === 1 ? 'voto registrado' : 'votos registrados'}</span>
                </span>
              </div>
            </div>

            {/* Botones secundarios en la cabecera */}
            <div className="flex items-center gap-2">
              {(totalVotes > 0 || (poll.history && poll.history.length > 0)) && (
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="text-base font-bold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 active:scale-95"
                  title="Descargar planilla compatible con Excel"
                >
                  <Download className="w-4 h-4 text-slate-700" />
                  <span>Exportar</span>
                </button>
              )}

              {totalVotes > 0 && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-base font-bold text-slate-800 hover:text-rose-900 bg-slate-100 hover:bg-rose-50 border border-slate-300 hover:border-rose-300 px-3 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 active:scale-95"
                  title="Guardar sesión y empezar una nueva clase"
                >
                  <RotateCcw className="w-4 h-4 text-slate-700" />
                  <span>Nueva Sesión</span>
                </button>
              )}
            </div>
          </div>

          {/* 5. ESTADO VACÍO (Cuando el docente abre una nueva clase y aún no hay votos) */}
          {totalVotes === 0 ? (
            <div className="mt-5 p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-800 rounded-2xl flex items-center justify-center mx-auto border border-indigo-200">
                <Inbox className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Esperando las primeras respuestas
              </h4>
              <p className="text-base font-semibold text-slate-700 max-w-sm mx-auto leading-relaxed">
                Todavía no hay votos en esta clase de <strong className="text-slate-900 font-extrabold">{poll.subject}</strong>. ¡Elegí una opción arriba y presioná <em>"Enviar mi voto a la clase"</em> para ver el termómetro en vivo!
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  className="text-base font-bold text-indigo-800 hover:text-indigo-950 underline inline-flex items-center gap-1.5 py-1"
                >
                  <Database className="w-4 h-4" />
                  <span>Ver datos de ejemplo para probar el gráfico</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Gráfico de Barras Interactivo con datos reales */}
              <div className="mt-5 space-y-4">
                {VOTE_OPTIONS.map((opt) => {
                  const count = counts[opt.id];
                  const pct = percentages[opt.id];
                  const isFilterActive = filterByType === opt.id;

                  return (
                    <div 
                      key={opt.id}
                      onClick={() => setFilterByType(prev => prev === opt.id ? 'todos' : opt.id)}
                      className={`p-3.5 rounded-2xl transition-all cursor-pointer border-2 ${
                        isFilterActive 
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setFilterByType(prev => prev === opt.id ? 'todos' : opt.id);
                        }
                      }}
                      title={`Toca para ver los comentarios de "${opt.label}"`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                          <span className={`w-3.5 h-3.5 rounded-full ${opt.barColor}`} />
                          <span>{opt.label}</span>
                        </span>
                        <span className="text-base font-bold text-slate-800 font-mono">
                          <span className="text-lg font-extrabold text-slate-950">{count}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-slate-800">{pct}%</span>
                        </span>
                      </div>

                      {/* Barra visual de progreso */}
                      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${opt.barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Diagnóstico pedagógico claro para el docente */}
              <div className="mt-5 p-4 rounded-2xl bg-slate-100 border border-slate-300 text-base text-slate-800 flex items-start gap-3">
                <div className="shrink-0 text-indigo-700 mt-1">
                  <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-950 text-base block mb-0.5">
                    Diagnóstico de la clase:
                  </span>
                  {counts.perdi + counts.dudas > counts.entendi ? (
                    <span className="text-rose-950 font-bold leading-relaxed">
                      ⚠️ Atención: La mayoría ({percentages.dudas + percentages.perdi}%) tiene dudas o se perdió. Conviene frenar 5 minutos y repasar este punto.
                    </span>
                  ) : (
                    <span className="text-emerald-950 font-bold leading-relaxed">
                      ✅ Buen ritmo: El {percentages.entendi}% de los alumnos entendió el tema principal de hoy.
                    </span>
                  )}
                </div>
              </div>

              {/* Listado de comentarios anónimos recibidos */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                  <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-700" />
                    <span>Comentarios recibidos ({filteredComments.length})</span>
                  </h4>

                  {/* Filtro secundario de comentarios */}
                  {commentsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilterByType('todos')}
                        className={`px-3 py-1 rounded-lg text-base font-bold transition-colors border ${
                          filterByType === 'todos' 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        Todos
                      </button>
                      {VOTE_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFilterByType(opt.id)}
                          className={`px-3 py-1 rounded-lg text-base font-bold transition-colors border ${
                            filterByType === opt.id 
                              ? `${opt.barColor} text-white border-transparent` 
                              : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {filteredComments.length === 0 ? (
                  <div className="text-center py-6 text-slate-600 text-base font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    {commentsList.length === 0 
                      ? 'Ningún alumno dejó comentario anónimo en esta clase.' 
                      : 'No hay comentarios anónimos con el filtro seleccionado.'}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {filteredComments.map((record) => {
                      const opt = VOTE_OPTIONS.find(o => o.id === record.type);
                      return (
                        <div 
                          key={record.id} 
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-base space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-full text-base ${opt?.badgeBg}`}>
                              {opt?.label}
                            </span>
                            <span className="text-base font-semibold text-slate-700">
                              {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-900 font-semibold leading-relaxed pt-0.5">
                            "{record.comment}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

      </main>

      {/* MODAL DE CONFIRMACIÓN PARA NUEVA SESIÓN (En español claro, sin tecnicismos) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border-2 border-slate-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-200">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-extrabold text-slate-900 text-xl">¿Empezar una nueva clase?</h4>
              <p className="text-base font-semibold text-slate-700 mt-2 leading-relaxed">
                Se limpiará la pantalla para el nuevo grupo.
              </p>
              {poll.votes.length > 0 && (
                <div className="mt-3 p-3 bg-slate-100 border border-slate-300 rounded-xl text-base text-slate-800 text-left space-y-1">
                  <span className="font-extrabold text-slate-950 block">Se archivará en tu Historial:</span>
                  <p>• <strong>Materia:</strong> {poll.subject}</p>
                  <p>• <strong>Votos:</strong> {poll.votes.length} registrados</p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleResetVotes}
                className="w-full py-3.5 px-4 text-base font-extrabold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl transition-colors shadow-sm"
              >
                Guardar y empezar nueva clase
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-3 px-4 text-base font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
              >
                Volver a la clase actual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / VISOR DE HISTORIAL DE SESIONES GUARDADAS */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border-2 border-slate-300 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-700" />
                <h4 className="font-extrabold text-slate-900 text-lg">Historial de Clases</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-600 hover:text-slate-900 text-base font-extrabold p-2 rounded-lg bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Botones secundarios de exportación */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-300 space-y-2">
              <span className="text-base font-extrabold text-slate-900 block">
                Descargar informe completo:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl text-base font-bold flex items-center justify-center gap-1.5 transition-colors"
                  title="Descargar tabla para Microsoft Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Excel (.CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={exportToJSON}
                  className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-xl text-base font-bold flex items-center justify-center gap-1.5 transition-colors"
                  title="Descargar copia íntegra en archivo JSON"
                >
                  <FileJson className="w-4 h-4 text-indigo-700" />
                  <span>Copia (.JSON)</span>
                </button>
              </div>
            </div>

            {/* Listado de Sesiones Archivadas */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {(!poll.history || poll.history.length === 0) ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-base text-slate-600 font-semibold">
                    Todavía no hay clases guardadas en el historial.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="text-base font-bold text-indigo-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    <Database className="w-4 h-4" />
                    <span>Cargar clases de ejemplo</span>
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
                    <div key={sess.id} className="p-3.5 bg-slate-50 border border-slate-300 rounded-2xl space-y-2 text-base">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-extrabold text-slate-950 text-base block">
                            {sess.subject}
                          </span>
                          <span className="text-base font-semibold text-slate-600">
                            {new Date(sess.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}{' '}
                            {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-base font-extrabold bg-indigo-100 text-indigo-950 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                            {sTotal} {sTotal === 1 ? 'voto' : 'votos'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(sess.id)}
                            className="text-slate-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Borrar esta clase del historial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-base text-center pt-1 font-bold">
                        <div className="bg-emerald-100 text-emerald-950 border border-emerald-300 p-1.5 rounded-lg text-sm sm:text-base">
                          {pEntendi}% <span className="font-normal block text-xs sm:text-sm">Entendí</span>
                        </div>
                        <div className="bg-amber-100 text-amber-950 border border-amber-300 p-1.5 rounded-lg text-sm sm:text-base">
                          {pDudas}% <span className="font-normal block text-xs sm:text-sm">Dudas</span>
                        </div>
                        <div className="bg-rose-100 text-rose-950 border border-rose-300 p-1.5 rounded-lg text-sm sm:text-base">
                          {pPerdi}% <span className="font-normal block text-xs sm:text-sm">Perdidos</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleLoadDemoData}
                className="text-base font-bold text-slate-700 hover:text-indigo-800 transition-colors"
                title="Restablecer datos de prueba"
              >
                Cargar ejemplos
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="py-2 px-4 text-base font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIE DE PÁGINA (Legible bajo luz solar con fuente base >= 16px) */}
      <footer className="mt-8 text-center text-base font-semibold text-slate-700">
        PULSO CLASE • Ticket de salida sencillo para educación activa
      </footer>
    </div>
  );
}
