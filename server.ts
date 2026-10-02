import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Objeto JSON de prueba quemado (Mock data) para probar la interfaz sin gastar llamadas reales
export const MOCK_AI_RESPONSE = {
  puntos_repaso: [
    {
      titulo: 'Mínimo Común Múltiplo (m.c.m.) en denominadores distintos',
      descripcion: 'Varios alumnos mencionaron que se traban al buscar el denominador común cuando los números no son múltiplos directos. Conviene arrancar la próxima clase con 2 ejemplos paso a paso en el pizarrón.',
      prioridad: 'alta'
    },
    {
      titulo: 'Simplificación final de la fracción resultante',
      descripcion: 'Entienden el procedimiento de suma pero se pierden al reducir la fracción a su mínima expresión. Conviene repasar criterios básicos de divisibilidad (por 2, 3 y 5).',
      prioridad: 'media'
    },
    {
      titulo: 'Regla de signos en restas de fracciones',
      descripcion: 'Confusión aislada al operar signos negativos en el numerador. Un repaso rápido de 3 minutos al inicio bastará para fijar el concepto.',
      prioridad: 'baja'
    }
  ],
  resumen_animo: 'El grupo muestra buena predisposición y ganas de aprender, pero hay frustración puntual en el paso mecánico del cálculo del m.c.m. Con un breve repaso inicial recuperarán la seguridad rápidamente.'
};

// Endpoint seguro en el servidor para interactuar con Gemini
app.post('/api/analizar-clase', async (req, res) => {
  try {
    const { subject, question, comments, forceMock } = req.body;

    // Si el usuario solicita probar con datos de prueba quemados
    if (forceMock) {
      return res.json({
        success: true,
        data: MOCK_AI_RESPONSE,
        isMock: true,
      });
    }

    // Validación de cantidad de comentarios
    if (!Array.isArray(comments) || comments.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Se necesitan al menos 2 comentarios de los alumnos para que la IA pueda detectar patrones de dudas en la clase.',
      });
    }

    // Validación segura de la API Key en el entorno del servidor
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        success: false,
        error: 'No se encontró configurada la clave GEMINI_API_KEY en el servidor. Podés probar la interfaz usando el botón "Ver datos de ejemplo (Mock)" o configurar tu clave en el archivo .env.',
        needsApiKey: true,
      });
    }

    // Inicialización del cliente oficial @google/genai
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const commentsText = comments
      .map((c: any, i: number) => `${i + 1}. [Percepción: ${c.type || 'voto'}] "${c.comment}"`)
      .join('\n');

    const prompt = `Sos un asesor pedagógico experto en evaluación formativa para docentes.
Analizá los siguientes comentarios y percepciones anónimas de los alumnos sobre el tema "${subject || 'la clase'}" (Pregunta de salida: "${question || 'Ticket de salida'}").

Tu tarea obligatoria:
1. Identificar exactamente los 3 puntos concretos del tema que el docente debe repasar obligatoriamente en la siguiente clase para que ningún alumno se quede atrás.
2. Escribir un breve resumen del estado de ánimo general y actitud de los alumnos hacia el tema.

Comentarios anónimos de los alumnos:
${commentsText}`;

    // Llamada con structured output estricto (responseSchema)
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            puntos_repaso: {
              type: Type.ARRAY,
              description: 'Los 3 puntos concretos que el docente debe repasar en la siguiente clase.',
              items: {
                type: Type.OBJECT,
                properties: {
                  titulo: {
                    type: Type.STRING,
                    description: 'Título conciso del concepto o ejercicio a repasar.',
                  },
                  descripcion: {
                    type: Type.STRING,
                    description: 'Explicación clara de por qué causó confusión y sugerencia práctica para el docente.',
                  },
                  prioridad: {
                    type: Type.STRING,
                    description: 'Nivel de urgencia del repaso: alta, media o baja.',
                  },
                },
                required: ['titulo', 'descripcion', 'prioridad'],
              },
            },
            resumen_animo: {
              type: Type.STRING,
              description: 'Resumen empático y breve del estado de ánimo y comprensión global del grupo.',
            },
          },
          required: ['puntos_repaso', 'resumen_animo'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('La respuesta de Gemini fue vacía.');
    }

    const parsedData = JSON.parse(text);
    return res.json({
      success: true,
      data: parsedData,
      isMock: false,
    });
  } catch (error: any) {
    console.error('Error al analizar clase con Gemini:', error);
    return res.status(500).json({
      success: false,
      error: 'Hubo una dificultad al conectar con el servicio de Gemini. Verificá tu conexión a internet o intentá de nuevo en unos segundos.',
    });
  }
});

// Montaje de Vite o archivos estáticos
if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`PULSO CLASE server running on http://0.0.0.0:${PORT}`);
});
