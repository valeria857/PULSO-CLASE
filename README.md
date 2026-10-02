# 📊 PULSO CLASE — Manual de la Aplicación y Registro de Prompts

> **Ticket de salida escolar en tiempo real con Inteligencia Artificial estructurada.**  
> *Resuelve el problema crítico en el aula: "El docente no sabe quién se quedó perdido hasta que llega el examen."*

---

## 📖 Índice

1. [¿Qué es PULSO CLASE?](#-qué-es-pulso-clase)
2. [Manual de Uso](#-manual-de-uso)
   * [Para el Alumno (Votación anónima)](#1-para-el-alumno-votación-anónima)
   * [Para el Docente (Panel de control y diagnóstico)](#2-para-el-docente-panel-de-control-y-diagnóstico)
   * [Acceso desde el Celular / Proyección con QR](#3-acceso-desde-el-celular--proyección-con-qr)
3. [Registro Cronológico de Prompts y Evolución (Hitos P0 a M6)](#-registro-cronológico-de-prompts-y-evolución-hitos-p0-a-m6)
   * [P0: Primera versión funcional generada con IA](#hito-p0-primera-versión-funcional-generada-con-ia)
   * [M1: Reinicio de sesión y selección de tema](#hito-m1-reinicio-de-sesión-y-selección-de-tema)
   * [M2: Persistencia de datos y exportación](#hito-m2-persistencia-de-datos-y-exportación)
   * [M3: Experiencia de uso en celular (UX/UI estricta)](#hito-m3-experiencia-de-uso-en-celular-uxui-estricta)
   * [M4: Pruebas de QA implacable, validaciones y defensas](#hito-m4-pruebas-de-qa-implacable-validaciones-y-defensas)
   * [M5 (Cross-Browser): Corrección integral de errores](#hito-m5-cross-browser-corrección-integral-de-errores)
   * [M5 (IA): Diagnóstico pedagógico con Gemini 3.8 Flash](#hito-m5-ia-diagnóstico-pedagógico-con-gemini-38-flash)
   * [M6: Enlace directo y Código QR proyectable](#hito-m6-enlace-directo-y-código-qr-proyectable)
4. [Arquitectura Técnica y Seguridad](#-arquitectura-técnica-y-seguridad)
5. [Instalación y Configuración](#-instalación-y-configuración)

---

## 🎯 ¿Qué es PULSO CLASE?

**PULSO CLASE** es una herramienta pedagógica diseñada para aplicarse en los últimos 5 a 10 minutos de una clase. A través de un "Ticket de Salida" anónimo, los estudiantes eligen entre tres opciones intuitivas:
* **Entendí:** Todo claro, puedo aplicarlo.
* **Tengo dudas:** Entendí a medias o faltó práctica.
* **Me perdí:** Necesito repasar el tema.

El docente visualiza instantáneamente el termómetro de comprensión del aula, lee los comentarios anónimos de los alumnos sin sesgo de timidez, y utiliza **Gemini 3.8 Flash** con salida estructurada para determinar exactamente los **3 puntos prioritarios que debe repasar en la siguiente clase**.

---

## 📱 Manual de Uso

### 1. Para el Alumno (Votación anónima)
1. **Abrir la app:** Escanear el código QR proyectado por el docente o ingresar al enlace web.
2. **Leer la pregunta:** Consultar la materia y la pregunta de salida fijada para la clase.
3. **Elegir la respuesta:** Tocar una de las tres opciones grandes (*Entendí*, *Tengo dudas*, *Me perdí*).
4. **Comentario voluntario:** Escribir en el campo anónimo si algo en particular causó confusión (máximo 280 caracteres, 100% privado).
5. **Enviar voto:** Presionar el botón destacado **"Enviar mi voto a la clase"**. El voto se suma de inmediato al gráfico colectivo.

### 2. Para el Docente (Panel de control y diagnóstico)
1. **Configurar la clase:** Tocar el botón *Cambiar* en el encabezado de tema (ej. *Matemática: Fracciones*, *Física*, *Historia*) y editar la pregunta de salida.
2. **Proyectar el gráfico:** Mostrar el *Resumen de la Clase* en la pantalla o proyector del aula para ver la distribución porcentual en vivo.
3. **Inspeccionar comentarios:** Filtrar los comentarios anónimos por tipo de voto para comprender qué ejercicio o explicación generó más trabas.
4. **Ejecutar el Diagnóstico con IA:**
   * Tocar **"Analizar con IA"** para que Gemini procese los comentarios y devuelva los **3 puntos de repaso obligatorios** ordenados por prioridad (*Alta*, *Media*, *Baja*) y un resumen del ánimo del grupo.
   * Si no se dispone de conexión o se quiere probar sin gastar tokens, usar **"Datos de prueba (Mock)"**.
5. **Cerrar y archivar:**
   * Al finalizar el grupo, presionar **"Nueva Sesión"**. Los votos actuales se guardan automáticamente en el historial con fecha y hora, y la pantalla queda limpia para el siguiente curso.
   * Presionar **"Exportar"** para descargar una planilla compatible con Excel (`.CSV`) o una copia íntegra de seguridad (`.JSON`).

### 3. Acceso desde el Celular / Proyección con QR
* En la parte superior de la aplicación, hacer clic en el botón **"Abrir en mi celular / QR"**.
* Se despliega un código QR de alta resolución listo para proyectar en el pizarrón o escanear con la cámara de cualquier teléfono Android o iPhone.

---

## 🛠 Registro Cronológico de Prompts y Evolución (Hitos P0 a M6)

A continuación se detalla cada prompt brindado durante el ciclo de vida del proyecto, qué objetivo perseguía, qué cambios técnicos introdujo y su commit correspondiente:

---

### Hito P0: Primera versión funcional generada con IA
* **Commit:** `22daebd` — `P0: primera version generada con IA`
* **Prompt inicial del usuario:**
  > Crear una primera versión funcional de PULSO CLASE para resolver la falta de feedback docente en tiempo real antes de los exámenes.
* **Qué hace:**
  * Creó la estructura base de React con TypeScript y Tailwind CSS.
  * Formulario con las tres opciones esenciales: *Entendí* (verde), *Tengo dudas* (ámbar) y *Me perdí* (rojo).
  * Campo de comentario anónimo opcional con conteo de caracteres.
  * Gráfico de barras interactivo con cálculo automático de porcentajes en tiempo real.
  * Muro de comentarios recibidos con filtrado por categoría de voto.

---

### Hito M1: Reinicio de sesión y selección de tema
* **Commit:** `1ae4202` — `M1: funcion reiniciar sesion y tema de clase`
* **Prompt del usuario:**
  > Agregar la capacidad de que el docente pueda cambiar el tema de la clase actual y reiniciar la sesión de votos para usar la app con un nuevo grupo.
* **Qué hace:**
  * Incorporó la sección de edición rápida del tema de la clase con sugerencias populares (*Matemática*, *Historia*, *Lengua*, *Física*, etc.).
  * Agregó el botón de **"Nueva Sesión"** con diálogo modal de confirmación para evitar reseteos accidentales en medio de la clase.
  * Notificaciones visuales tipo Toast para informar al docente de cada cambio de estado.

---

### Hito M2: Persistencia de datos y exportación
* **Commit:** `4104a0d` — `M2: persistencia de datos`
* **Prompt del usuario:**
  > Hacer que los votos y sesiones no se pierdan al recargar la página. Agregar historial de clases archivadas y exportación de reportes.
* **Qué hace:**
  * Persistencia automática en el almacenamiento del navegador (`localStorage`) para la clase en curso y las sesiones archivadas.
  * Historial navegable de clases anteriores con estadísticas guardadas (porcentajes de entendimiento por fecha y hora).
  * Función de **Exportar a CSV** (compatible con Microsoft Excel y Google Sheets mediante prefijo UTF-8 BOM).
  * Función de **Exportar a JSON** para respaldar íntegramente los datos de la aplicación.

---

### Hito M3: Experiencia de uso en celular (UX/UI estricta)
* **Commit:** `1e681b5` — `M3: experiencia de uso en celular`
* **Prompt del usuario:**
  > Ajustar la interfaz de PULSO CLASE con 6 requisitos de UX/UI sin cambiar la lógica:
  > 1. Pantallas desde 320 px de ancho, uso con una sola mano sin zoom.
  > 2. Contraste suficiente para luz solar; textos nunca menores a 16 px.
  > 3. Todos los campos con etiquetas visibles (<label>), no solo placeholders.
  > 4. Un solo botón principal destacado por pantalla ("Enviar Voto"); los demás secundarios.
  > 5. Estado vacío amigable cuando el docente abre una nueva clase con 0 votos.
  > 6. Mensajes de éxito y confirmación en español claro sin tecnicismos.
* **Qué hace:**
  * Se eliminaron todas las clases de texto pequeño (`text-xs`, `text-sm`, `10px`, `11px`). Absolutamente todos los elementos pasaron a tener un tamaño mínimo de 16 px (`text-base`), evitando que iOS Safari haga zoom involuntario.
  * Alto contraste solar (paleta Slate-900 / Blanco / bordes definidos de 2 px).
  * Etiquetas `<label htmlFor="...">` vinculadas formalmente a cada campo.
  * Jerarquía visual estricta: un único botón dominante (**"Enviar mi voto a la clase"**) y botones secundarios con estilo outline/neutral.
  * Nuevo estado vacío pedagógico con icono ilustrativo y texto motivador al registrar 0 votos.

---

### Hito M4: Pruebas de QA implacable, validaciones y defensas
* **Commit:** `067cfee` — `M4: validaciones y manejo de errores`
* **Prompt del usuario:**
  > Actuar como un tester de software (QA) implacable y encontrar 10 formas concretas de romper la app desde la UI (envíos sin opción, comentarios de más de 1.000 caracteres, doble clic rápido, nombres vacíos o caracteres raros, etc.), indicando qué pasaba, qué debía pasar y aplicando el código mínimo para solucionarlo.
* **Qué hace:**
  * **Validación de voto obligatorio:** Alerta roja visible si intentan enviar sin elegir opción.
  * **Prevención de Spam / Doble clic rápido:** Debounce de 2 segundos mediante `useRef` para evitar votos duplicados en conexiones lentas.
  * **Sanitización de comentarios:** Corte estricto a 280 caracteres y eliminación de caracteres de control invisibles en memoria.
  * **Protección contra CSV / Excel Formula Injection:** Neutralización de caracteres disparadores (`=`, `+`, `-`, `@`) con comilla simple `'` para evitar ejecución de macros maliciosas al abrir reportes en Excel.
  * **Validación de longitud:** Exige un mínimo de 2 caracteres en el tema y 5 en la pregunta, bloqueando entradas de puros espacios.
  * **Manejo de QuotaExceededError:** Detección de límite de almacenamiento lleno en `localStorage` con aviso preventivo al docente.
  * **Confirmación de borrado en historial:** Diálogo de seguridad previo a eliminar cualquier clase archivada.

---

### Hito M5 (Cross-Browser): Corrección integral de errores
* **Commit:** `b1c1cac` — `M5: correccion integral de errores y compatibilidad cross-browser`
* **Prompt del usuario:**
  > Si la app tiene errores, solucionalos cada uno de ellos para que funcione al 100%.
* **Qué hace:**
  * **Descargas universales:** Reescritura del disparador de descargas para Firefox y navegadores móviles (iOS Safari / Android Chrome) anclando el elemento `<a>` temporalmente en `document.body` y difiriendo `URL.revokeObjectURL` para evitar descargas abortadas.
  * **Gestión de memoria:** Limpieza de timers huérfanos (`clearTimeout`) al desmontar componentes React.
  * **Accesibilidad de teclado:** Soporte global para cerrar modales y cancelar ediciones pulsando la tecla `Escape`.
  * **Cierre táctil:** Cierre de modales tocando el fondo oscuro exterior (*backdrop click*).
  * **Filtrado defensivo:** Protección contra objetos `null` o cadenas vacías en `localStorage`.

---

### Hito M5 (IA): Diagnóstico pedagógico con Gemini 3.8 Flash
* **Commit:** `513770a` — `M5: inteligencia con salida estructurada`
* **Prompt del usuario:**
  > Integrar la API de Gemini para analizar la lista de comentarios anónimos y determinar los 3 puntos concretos de tema que el docente debe repasar obligatoriamente en la siguiente clase.
  > 1. Respuesta obligatoria en JSON con esquema fijo (`responseSchema`): `puntos_repaso` (título, descripción, prioridad) y `resumen_animo`.
  > 2. Renderizado en pantalla como tarjetas visuales, no texto plano.
  > 3. API Key segura leída desde `.env` en el servidor sin exponerse al navegador.
  > 4. Manejo amigable de fallos (demora, sin conexión, comentarios insuficientes).
  > 5. Objeto JSON mock para probar la interfaz sin gastar llamadas reales.
* **Qué hace:**
  * Creó el servidor backend `server.ts` con Express y el SDK oficial `@google/genai`.
  * Endpoint seguro `POST /api/analizar-clase` que no expone la API Key al cliente.
  * Invocación a `gemini-3.8-flash` con `responseMimeType: 'application/json'` y `responseSchema` estricto con `Type.OBJECT` y `Type.ARRAY`.
  * Interfaz con tarjetas visuales clasificadas por prioridad (*Alta*, *Media*, *Baja*) y tarjeta de clima grupal.
  * Botón de **"Datos de prueba (Mock)"** con datos pedagógicos predefinidos para evaluar la interfaz sin costo ni configuración previa.

---

### Hito M6: Enlace directo y Código QR proyectable
* **Commit:** `0afb7fe` — `M6: acceso directo y codigo QR para celular`
* **Prompt del usuario:**
  > Crear el link para ver la app en mi teléfono.
* **Qué hace:**
  * Agregó el botón destacado **"Abrir en mi celular / QR"** en el encabezado principal de la aplicación.
  * Modal interactivo que genera en tiempo real un código QR escaneable por cualquier cámara de celular.
  * Botón para copiar el enlace directo al portapapeles y enlace para abrir en nueva pestaña.
  * Genera el enlace público optimizado para dispositivos móviles:
    `https://ais-pre-vf3l5ikxyzfodfugrkeros-518393992949.us-east1.run.app`

---

## 🔒 Arquitectura Técnica y Seguridad

* **Frontend:** React 19 SPA montado sobre Vite con Tailwind CSS 4.
* **Backend Proxy:** Node.js + Express (`server.ts`) ejecutado en dev mediante `tsx server.ts`.
* **Motor de IA:** `@google/genai` utilizando el modelo `gemini-3.8-flash`.
* **Seguridad de Claves:** La clave `GEMINI_API_KEY` reside exclusivamente en las variables de entorno del servidor; el navegador jamás tiene acceso a credenciales privadas.
* **Prevención de Inyecciones:**
  * Sanitización contra ataques de inyección de fórmulas en hojas de cálculo (CSV Injection).
  * Sanitización de cadenas y normalización de espacios en textos de entrada.

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone <url-del-repositorio>
cd applet
npm install
```

### 2. Configurar la clave de Gemini (Opcional para llamadas reales)
Crear un archivo `.env` en la raíz del proyecto (basado en `.env.example`):
```env
GEMINI_API_KEY="AIzaSy..."
PORT=3000
```
*(Nota: Si no se configura la clave, la app funciona plenamente utilizando el botón "Datos de prueba (Mock)").*

### 3. Iniciar el entorno de desarrollo
```bash
npm run dev
```
La aplicación quedará disponible en `http://localhost:3000`.

### 4. Compilar para producción
```bash
npm run build
npm start
```

---

*PULSO CLASE — Evaluación formativa ágil, humana y sin fricciones.*
