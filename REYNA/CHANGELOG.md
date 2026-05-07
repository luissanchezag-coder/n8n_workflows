# REYNA Bot — Historial de cambios

> Este CHANGELOG cubre cambios **propios** de Reyna. Para divergencias respecto al snapshot inicial de Bipolar, ver [CHANGELOG_FROM_BIPOLAR.md](CHANGELOG_FROM_BIPOLAR.md).

## v0.12 — 2026-05-06 — E2E Casos 3 y 5 PASA + bypass cliente Calificado determinista + MAX_RENDERS=2

Sesión de pruebas E2E. Validados Casos 3 (1 render + cotizar) y 5 (cliente ya Calificado). Se identificaron y corrigieron 4 bugs adicionales que aparecieron durante las pruebas. Cambio de regla de negocio: límite de renders bajado de 3 a 2 para reducir costo (~$1.50 MXN/cliente vs $2.30).

### Bugs corregidos

1. **Sheet `Renders` no guardaba teléfono ni descripción** — `Guardar URL Render` leía `$json.phoneNumber` pero el item ya había sido reemplazado por la respuesta de Cloudinary. Fix: leer desde `$('Buscar Top-3 Catálogo').item.json.*` y devolver objeto explícito (sin `...$json`).
2. **Diseñador interpretaba "2" post-render como nuevo render** — el LLM duplicaba el menú post-render dentro de su mensaje, y al recibir "2" del cliente alucinaba un nuevo `[RENDER_REQUEST]`. Fix prompt: PASO 3 dice "SOLO esto, sin menú, sin opciones"; PASO 3.1 nueva REGLA CRÍTICA "si último mensaje fue [RENDER_REQUEST] y cliente responde 2, JAMÁS emitas otro render, salta a PASO 4 preguntando nombre".
3. **Cliente Calificado degradado a Nuevo en cada turno** — `Detect Lead Complete` SIEMPRE construía `upsertParcial` con `Estado: 'Nuevo'`, sobrescribiendo Nombre/Email/Proyecto/Presupuesto en cada mensaje. Fix doble:
   - Nuevo nodo Code `Respuesta Cliente Calificado` que bypassea al LLM y construye respuesta determinista con nombre y proyecto del Sheet (porque Gemini Flash ignoraba la regla de prompt "no muestres menú si CONTEXTO INTERNO").
   - `Detect Lead Complete` ahora respeta flag `isCalificadoBypass`: si true → `upsertParcial = null` → `¿Guardar Parcial?` cae a FALSE → no se sobrescribe la fila.
4. **REGLA #1 nueva al inicio del prompt REYNA** — instrucción explícita "si mensaje empieza con [CONTEXTO INTERNO:, NO muestres menú, salúdalo por nombre, confirma que ya está registrado". (El bypass determinista del punto 3 hace innecesaria esta regla, pero queda como doble safety net si el flujo cambiara.)

### Cambio de negocio

- **MAX_RENDERS: 3 → 2.** Reduce costo de ~$2.30 a ~$1.50 MXN por cliente que use todos los intentos. Mensaje de cierre actualizado: "Ya generamos 2 versiones del diseño...".

### Casos E2E ejecutados

- ✅ **Caso 3 PASA** — 1 render + "2" (Cotizar) → captura de datos → lead Calificado en Sheet `Base de datos` → fila en `Renders` con teléfono y descripción correctos.
- 🟡 **Caso 4 PARCIAL** — el LLM Diseñador filtra contenido sensible ANTES de emitir tag de render (manda `[HUMAN_HANDOFF]` directo), por lo que el path `Validar Tema → ¿Registrar Palabra Bloqueada? → Guardar Palabra Bloqueada` no se ejecuta. Comportamiento del bot es correcto, pero el safety net del logger es redundante con el guardrail del LLM. No bloqueante.
- ✅ **Caso 5 PASA** — sin /reset, "hola" → bot responde con mensaje personalizado mencionando proyecto previo, NO muestra menú, fila NO se degrada.

---

## v0.11 — 2026-05-05 — Render funcional E2E + flujo Diseñador rediseñado + email rebrand

Sesión larga de debug aplicando systematic-debugging. Se identificaron y corrigieron 8 bugs en cadena que impedían que el render llegara al cliente. Se rediseñó el flujo del Diseñador, los menús de presupuesto, y el template del email a ventas. Workflow live `ar3Ea99IYmhmtmAq` activo y verificado en producción: render llega al WhatsApp del cliente con menú post-render funcional.

### Cambios adicionales aplicados al final de la sesión

- **Nodo nuevo `Enviar Menu Post-Render`** — después de `Enviar Imagen Render` se manda un segundo mensaje de texto con el menú "1️⃣ Ajustar / 2️⃣ Cotizar". El caption de la imagen quedó corto ("🎨 Aquí está su diseño personalizado.") porque WhatsApp puede cortar captions largos.
- **Mensaje "3 versiones agotadas"** ampliado: ahora "Para poder avanzar con su proyecto y no demorarnos más, continuemos con su cotización".
- **Presupuesto numerado con emojis** (Diseñador + REYNA cotización clásica): 1️⃣ Menos $30K / 2️⃣ $30-80K / 3️⃣ Más de $80K MXN. Antes era texto libre con bullets.
- **Tipo de mueble en negritas + mayúsculas** en mensaje del Diseñador PASO 2: "Perfecto, una *PUERTA*. Ahora cuénteme..." (antes "Perfecto, una puerta...").
- **Email a ventas rebrand**:
  - Sin emojis (🪵 🎨 💬 removidos del subject, h2, render block, botón).
  - Footer cambiado de "Est Studio — Sistema automatizado de captación de leads" a **EST STUDIO** — Where *AI* becomes your *professional advantage* (EST STUDIO en `<strong>`, AI y professional advantage en `<em>`).
- **Saludo Bienvenid@** en menú principal.
- **Submenú Diseñador 6 muebles** (quitados Bar y Plafón).

### Bugs corregidos (en orden cronológico)

1. **`Inyectar Contexto Proyecto` syntax error** — comillas dobles dentro de single-quoted string + acentos. Limpiado a template literal con backticks (estilo idéntico a `Cliente Ya Existente`).
2. **`Generar Embedding Descripción` placeholder credential** — `__GEMINI_CREDENTIAL_ID__` no resuelto. Asignada credencial `Query Auth account 2` (Google AI Studio).
3. **`Generar Embedding Descripción` JSON inválido** — body construido con `{{ JSON.stringify(undefined) }}` cuando el campo no estaba en el item. Body cambiado a `String($('Validar Tema').item.json.descriptionFurniture || '')` para garantizar string no vacío.
4. **Patrón roto de propagación de contexto** — varios nodos HTTP entre `Validar Tema` y `Buscar Top-3 Catálogo` reemplazaban el item, perdiendo `descriptionFurniture/phoneNumber/queryEmbedding`. Soluciones:
   - `Generar Embedding`: lee `$('Validar Tema').item.json.*`
   - `Buscar Top-3 Catálogo`: cambiado a `runOnceForAllItems` y lee `$('Extraer Embedding Descripción').item.json` (antes era `runOnceForEachItem`, ejecutaba 1 vez por fila del catálogo).
5. **`Llamar Gemini Image` modelo inválido** — `gemini-2.5-flash-preview-04-17` y `gemini-2.0-flash-preview-image-generation` devolvían 404. Listamos modelos disponibles vía workflow temporal (`ListModels` API) y se cambió a `gemini-2.5-flash-image` (Nano Banana, soportado por la API key de Reyna).
6. **`Subir Render a Cloudinary` transformation inválida** — sintaxis `e_rotate:-30` no existe en Cloudinary (es `a_-30`). Removido el parámetro `transformation` inline. Watermark se gestionará vía `upload_preset` en Cloudinary console.
7. **`Append Sheet Renders` falta `columns.schema`** — typeVersion 4.5 requiere schema explícito de columnas. Agregado array de 6 entries (timestamp, telefono, descripcion, cloudinary_url, categoria_inferida, top_3_referencias) replicando el patrón de `Guardar Palabra Bloqueada`.
8. **`Enviar Imagen Render` mediaLink vacío** — `Append Sheet Renders` reemplazaba el item con sólo los campos mapeados, perdiendo `generatedImageUrl`. Cambiado a `$('Guardar URL Render').item.json.generatedImageUrl` (lectura explícita del nodo origen).

### Mejoras de flujo / UX

- **Re-arquitectura del menú "Diseñemos tu mueble"**: el menú de 6 muebles ahora se muestra por **REYNA** al elegir opción 2 (mismo mensaje con `[ROUTE_DESIGNER]`). El **Diseñador** arranca en PASO 1 con el mueble ya elegido y avanza directo a PASO 2 (estilo+color+detalles). Esto resuelve el bug arquitectónico de "REYNA emite ROUTE_DESIGNER sin texto + Diseñador no se ejecuta en la misma corrida → cliente queda esperando".
- **Diseñador menos exigente**: ahora dispara `[RENDER_REQUEST]` con cualquier dato mínimo (sólo estilo, sólo color, etc.). Antes requería los 3 campos (estilo + color + dimensiones).
- **Diseñador 4 pasos** (antes 5): PASO 2 (estilo+color) y PASO 3 (detalles) fusionados en un solo paso para reducir fricción.
- **Submenú Diseñador**: 6 opciones de mueble (antes 8 — quitados Bar y Plafón).
- **Menú principal opción 2**: simplificado a "Diseñemos tu mueble" (antes "Diseñemos tu mueble (diseño + cotización)").
- **Saludo inclusivo**: "Bienvenid@" (antes "Bienvenido/a").
- **Formato uniforme de menús**: todos los menús del flujo (REYNA y Diseñador) ahora usan emojis 1️⃣2️⃣3️⃣... — antes había mezcla `1 — texto` y `1️⃣ texto`.
- **Galería closing CTA simplificado**: "1️⃣ Ver más proyectos / 2️⃣ Diseñar mi mueble".
- **PASO 2 del Diseñador con formato compacto**: bullets sin espacio entre Colores y Dimensiones, cierre con "Entre más detallado, mejor quedará su diseño 🪵".

### Pendientes derivados (no bloquean activación)

- **Watermark / logo en renders** — DEFERIDO. Intentos múltiples fallaron:
  - Inline `e_rotate:-30` → sintaxis inválida en Cloudinary (rechazado).
  - Inline `a_-30` con `l_reyna_estilo_referencia:logo_djsdvp` → "Resource not found" (la subcarpeta no es parte del public_id).
  - Preset `reyna_renders` → quedó con transformación incorrecta vieja causando 400 persistente.
  Estado actual: **`Subir Render a Cloudinary` SIN parámetro `transformation`**, preset debe quedar **sin Incoming Transformation**. Render llega al cliente sin watermark. Para resolver: usar el constructor visual de Cloudinary console paso a paso, validar el public_id real del logo (`logo_djsdvp` sin prefijo de carpeta), aplicar SOLO en el preset (no inline en n8n).
- **Eliminar `/reset`** del nodo `Extract Message` antes de producción.
- **Cobertura E2E**: Caso 2 (Diseñador 5 pasos + 3 renders) ahora pasa en parte — render llega. Faltan validar Casos 3-9.

### Diferencias con repo GitHub `luissanchezag-coder/n8n_workflows`

El JSON del repo tenía:
- `gemini-2.5-flash-image-preview` (404 con tu key actual) → reemplazado por `gemini-2.5-flash-image`
- Subir Render Cloudinary SIN `transformation` inline → coincide con la versión actual post-fix
- Append Sheet Renders typeVersion 4.5 SIN schema → fallaba igual al ejecutar; el repo nunca se ejecutó después de exportar

---

## v0.10 — 2026-05-05 — Bug fixes + Diseñador 5 pasos + Galería numerada + Watermark diagonal

Sprint de fixes y mejoras UX. Aplicados directamente al workflow live (`ar3Ea99IYmhmtmAq`). Workflow activo, pendiente Caso 2 E2E (Diseñador) y activación final.

### Cambios aplicados

**Fixes de bugs (v0.10)**
- ✅ **Bug 1** — `MAX_RENDERS = 3` (antes 2) en nodo `Validar Tema`.
- ✅ **Bug 2** — Nodo nuevo `Inyectar Contexto Proyecto` antes de `Asistente REYNA` para clientes Nuevos en Sheet con campo Proyecto lleno: bot avisa que ya hay proyecto en progreso y no ofrece diseño nuevo. La rama `Cliente Ya Existente` (Calificados) ya tenía esta protección integrada en su template literal.
- ✅ **Bug 4** — System prompt del Diseñador actualizado: "Ya generamos 3 versiones del diseño..." (antes 2).
- ✅ **Bug 5** — IF `¿Registrar Palabra Bloqueada?` + nodo `Guardar Palabra Bloqueada` después de `Validar Tema`. Sheet `Palabras no admitidas` con headers: Palabra | Descripción | Teléfono | Timestamp | Motivo.

**Mejoras de flujo / UX**
- **Diseñador 5 pasos**: PASO 1 (saludo + 8 muebles numerados) → PASO 2 (estilo + color combinado) → PASO 3 (detalles: dimensiones, herrajes) → PASO 4 (render + reacción ajustar/cotizar, máx 3) → PASO 5 (datos + cierre). Antes era flujo libre con saludo abierto.
- **Galería submenú**: 4 categorías numeradas (1-Cocinas / 2-Puertas / 3-Lavanetas / 4-Muebles TV). Mensaje de cierre simplificado: "¿Le gustaría ver más proyectos como este o prefiere diseñar el suyo a su medida?" — eliminadas opciones "Solicitar cotización directa" y "Ver otra categoría".
- **Galería con doble compatibilidad** número/letra (1=A=Cocinas, etc.).

**Assets**
- **Galería actualizada a `.jpg`** (antes `.avif`, formato no soportado por WhatsApp API). URLs reales de Cloudinary reemplazan placeholders. Cocinas envía 2 fotos, demás categorías 1 foto.
- **Watermark renders del Diseñador**: overlay de logo en patrón diagonal repetido (`l_logo_djsdvp,w_180,o_18,fl_tiled,e_rotate:-30`) aplicado en `Subir Render a Cloudinary`. Sutil (~18% opacidad), -30° rotación.
- **Logo Reyna** actualizado en Cloudinary (`logo_djsdvp`).

**Limpieza de sesión**
- `/reset` ahora también limpia `inDesignerMode[phoneNumber]` e `inDesignerModeAt[phoneNumber]` en Extract Message. Antes solo limpiaba humanMode → cliente quedaba atascado en modo Diseñador entre sesiones.

**Memory Diseñador**
- `sessionKey` simplificado a `={{ $json.sessionId }}`. Antes intentaba acceder a `$('Extract Message')` desde sub-nodo LangChain — falla en runtime.

### Sheets actualizadas

| Pestaña | Cambio |
|---------|--------|
| `Palabras no admitidas` | Headers ampliados a 5 columnas (antes solo `Palabra`) |
| `Panel de Clientes` | Verificada con datos reales (3 nuevos, 1 no completó) — formato OK |
| `Renders` | Sin cambios estructurales — futuros renders incluirán watermark |

### Estado de pruebas E2E (v0.10)

- ✅ **Caso 1** — Galería submenú 4 categorías + nuevo CTA de cierre
- ⏳ **Caso 2** — Diseñador 5 pasos + 3 renders + watermark (en curso)
- ⏳ **Casos 3-9** — pendientes
- ⏭️ **Caso 6 — Chatwoot** — saltado en esta ronda

### Pendientes para activación

1. Completar Casos 2-9 E2E
2. Eliminar `/reset` de Extract Message
3. Setup Chatwoot inboxId (deferido)
4. Desactivar Bipolar webhook → activar Reyna (Bot → Limpiador → Bridge)

---

## v0.9 — 2026-05-05 — Revisión Pre-MVP: snapshot baseline + code review + E2E plan

Sprint de revisión técnica completa antes de activar el bot con usuarios reales. No se aplicaron cambios al workflow live — todo es diagnóstico y documentación. Los bugs encontrados se corrigen en v0.10.

### Qué se hizo

**Fase 1 — Snapshot baseline**
- 3 JSONs de workflow exportados a `workflows/snapshots/2026-05-05-pre-mvp-review/`
- Sheet real auditada: `Base de datos` (2 leads de prueba), `Renders` (8 filas, columnas extra de sesión legacy limpiables), `Catalogo` (1 entrada con embedding)
- 50 ejecuciones recientes Bot WA: todas `success`, 0 errores. Limpiador: todas `success`. Bridge: 0 ejecuciones (inactivo, correcto).

**Fase 2 — E2E Test Plan**
- Creado `E2E_TEST_RESULTS.md` con 8 casos documentados paso a paso
- Caso 6 (Chatwoot Handoff) marcado **BLOQUEADO** — requiere setup inbox Reyna antes de ejecutar
- Casos 1-5 y 7-8 listos para ejecutar manualmente

**Fase 3 — Code Review (3 agentes paralelos)**

Ver detalle completo por reviewer abajo.

---

### Bugs críticos encontrados (Reviewer A — JS Code Nodes)

| Bug | Nodo | Impacto |
|-----|------|---------|
| **A-C1** — Retorno sin `{ json: }` | `Resolver Mode` | Diseñador nunca se activa — todos los mensajes van al Recepcionista |
| **A-C2** — `validRender` calculado pero no usado | `Validar Tema` | Límite de 2 renders completamente inefectivo |
| **A-C3** — `secure_url` undefined incrementa counter | `Guardar URL Render` | Cloudinary falla → counter sube igual, leadData.generatedImageUrl corrupto |
| **A-C4** — `runOnceForEachItem` + `$input.all()` | `Agrupar Referencias` | Gemini Image se llama N veces (una por imagen de referencia) |
| **A-I1** — URLs Google Drive thumbnail en WhatsApp API | `Detect Lead Complete (GALERIA_IMAGES)` | WhatsApp puede rechazar imágenes de galería (Content-Type: text/html) |
| **A-I2** — Historial con líneas vacías | `Detect Lead Complete` | Ruido en historial visible por agente en Chatwoot |
| **A-I3** — Sin guard `leadData.parseError` | `Cliente Interesado` | Lead calificado en Sheet con solo el teléfono si LLM emite JSON malformado |

### Bugs críticos encontrados (Reviewer B — System Prompts)

| Bug | Dónde | Impacto |
|-----|-------|---------|
| **B-C1** — Archivos `.md` locales NO sincronizados con n8n | Ambos prompts | Ediciones futuras desde disco sobreescriben fixes de v0.8 (presupuesto numérico, bullets) |
| **B-C2** — `[LEAD_PARTIAL]` ausente en REYNA local | `system_prompt_recepcionista.md` | Nombres capturados antes de menú no llegan al Sheet |
| **B-C3** — `[LEAD_PARTIAL]` ausente en Diseñador local | `system_prompt_disenador.md` | Leads abandonados sin datos aprovechables |
| **B-C4** — renderCount: LLM no puede inferirlo con certeza | Diseñador | Posible tercer render sin instrucción explícita de conteo en historial |
| **B-I1** — Pregunta post-render duplicada | Diseñador PASO 3 vs nodo n8n | Cliente recibe SÍ/NO dos veces |
| **B-I2** — Galería case-insensitive no instruccionada | REYNA sección Galería | Cliente escribe "a" y la galería no se envía |
| **B-I3** — "diseño IA" en menú, prohibido en instrucción | REYNA menú | Contradicción interna |
| **B-I4** — Tono "te/ti" en un mensaje de REYNA | REYNA opción 2 handoff | Tuteo en empresa formal de 37 años |

### Bugs críticos encontrados (Reviewer C — HTTP/Sheets/Servicios)

| Bug | Nodo | Impacto |
|-----|------|---------|
| **C-C1** — Sin `continueOnFail`, timeout 60s (no 120s) | `Llamar Gemini Image` | Timeout de red corta el flujo entero, fallback no se ejecuta |
| **C-C2** — Sin guardia `renderFailed` antes de Cloudinary | `Subir Render a Cloudinary` | `data:undefined;base64,null` → 400, sin fallback |
| **C-C3** — `payload[0].id` TypeError si contacto no existe | `Chatwoot - Crear Conversación` | `onError` no protege de runtime error en expresión — handoff silenciosamente roto |
| **C-C4** — `inbox_id: 1` hardcoded (inbox de Bipolar) | Todas las URLs Chatwoot | Handoffs de Reyna llegan al inbox de Bipolar |
| **C-I1** — Sin `continueOnFail` | `Email a Ventas` | OAuth expirado → flujo falla después de guardar el lead |
| **C-I2** — `$('Preparar Prompt Render').first().json.top3Refs` | `Append Sheet Renders` | `top3Refs` no existe en ese nodo — campo siempre vacío en Sheet Renders |
| **C-I3** — `Sheets - Momento 1` sobreescribe con strings vacíos | `Sheets - Momento 1 (Nuevo)` | Si lead ya existe y pasa por este nodo, borra Nombre/Email/Proyecto |
| **C-I4** — URLs Google Drive en `Enviar Imagen Galería` | Nodo WA galería | Mismo problema que A-I1 — WhatsApp Cloud rechaza si Content-Type incorrecto |

---

### Resumen de decisiones para v0.10

| Item | Acción |
|------|--------|
| Bugs A-C1 a A-C4 | Fix en workflow live |
| Bugs C-C1 a C-C4 | Fix en workflow live |
| Bug B-C1 | Sincronizar archivos .md locales desde n8n antes de editar |
| Bug B-I1 (doble SÍ/NO) | Decidir: eliminar PASO 3 del Diseñador o eliminar nodo Pregunta Post-Render |
| Galería URLs Google Drive | Migrar a Cloudinary o verificar permisos públicos |
| `/reset` en producción | Bloquear o eliminar en `Extract Message` |
| `top3Refs` en Sheet Renders | Verificar la cadena de propagación del campo |

### Pendientes pre-activación (estado al 2026-05-05)

1. ✅ Snapshots + E2E plan documentado
2. ❌ E2E manual (8 casos) — **Luis ejecuta, pendiente**
3. ❌ Bugs A-C1 a A-C4 y C-C1 a C-C4 — **pendiente fix en n8n**
4. ❌ Fotos reales en `GALERIA_IMAGES` (reemplazar URLs Google Drive)
5. ❌ Pestaña `Panel de Clientes` en Sheet
6. ❌ `inboxId` Chatwoot Reyna actualizado en Bridge
7. ❌ `/reset` eliminado de `Extract Message`
8. ❌ Archivos `.md` sincronizados con n8n live

---

## v0.3 — 2026-05-03

### Galería de Bares — segunda foto + descubrimiento de doble CTA

**Contexto:** durante prueba E2E del bot se detectó que la galería de Bares solo enviaba una foto, y que el flujo de galería en general manda **un CTA antes y otro después** de las imágenes (CTA → foto → foto → CTA), lo cual confunde al cliente.

#### Cambio aplicado
- **`Detect Lead Complete` → `GALERIA_IMAGES.BARES`**: añadida segunda URL.
  ```js
  BARES: [
    'https://drive.google.com/thumbnail?id=1MLyprumzWVSNaUAPKsUjkcyj5umm5RtI&sz=w800',
    'https://drive.google.com/thumbnail?id=1v6STdETu68_0eIouOWD8VHm2Z5kJVcLT&sz=w800'  // NUEVA
  ],
  ```
- Foto local: `Multimedia/Bares/bares_.jpg` (subida también a Drive).
- Aplicado vía `n8n_update_partial_workflow` (patchNodeField). Verificado en n8n.

#### Pendiente (NO aplicado todavía — requiere decisión)
- **Doble CTA en galería:** el flujo actual `¿Galería? → Responder WA Texto Galería → Split Imágenes → Enviar Imagen Galería → Consolidar CTA → CTA Cotizar` produce: texto/CTA del LLM **antes** de las fotos + CTA fijo **después**. El usuario percibe "foto → CTA → foto" cuando son varias imágenes.
- **Propuesta:** reordenar conexiones para que las imágenes salgan primero, mover el texto del LLM (con CTA) al final, y eliminar el nodo `CTA Cotizar` (redundante con el `cleanMessage` del LLM).
- **Decisión pendiente:** ¿conservar CTA del LLM (contextual por categoría), CTA fijo (incluye instrucción "escribe 4"), o fusionar ambos?
- **Riesgo de orden:** WhatsApp no garantiza orden estricto entre mensajes consecutivos rápidos — al implementar, validar que las fotos lleguen en secuencia correcta.

---

## v0.8 — 2026-05-05 — Watermark Reyna + flujo post-render + bullets + numérico

Sprint largo: render pipeline completo con identidad visual, ampliación del filtro de contenido, y reorganización del flujo conversacional post-render.

### Cambios aplicados al workflow `ar3Ea99IYmhmtmAq`

| # | Nodo / Campo | Antes | Después | Razón |
|---|--------------|-------|---------|-------|
| 1 | `Detect Lead Complete.parameters.jsCode` — Transcripción | `slice(-4)` | `slice(-10)` | Más contexto en el sheet para el equipo de ventas |
| 2 | `Asistente REYNA` — mensaje opción 2 | "¡Con gusto! Cuéntenos qué tiene en mente: tipo de mueble, material, color..." | Mensaje con bullets (🪵 Mueble / 🎨 Color / ✏️ Estilo / 📐 Medidas) | Cliente ve el formato correcto al primer mensaje, sin esperar al Diseñador |
| 3 | `Asistente Diseñador` — mensaje PASO 1 | Bullets con 🏠 al final | Bullets con 📸 al final | Emoji más asociado a "visualización" |
| 4 | `Asistente REYNA` + `Asistente Diseñador` — menú presupuesto | A/B/C/D | 1️⃣ 2️⃣ 3️⃣ 4️⃣ (numérico con emojis) | Eliminar fallos por mayúsculas/minúsculas — usuario reportó "puse `b` y se guardó como NO PROPORCIONADO" |
| 5 | `Validar Tema.parameters.jsCode` — ALLOWED regex | `cocina\|closet\|vestidor\|bar\|plafon\|puerta\|mueble\|tv\|lavaneta\|carpinteria\|...` | Ampliado: `mesa\|comedor\|silla\|escritorio\|banca\|estante\|cabecera\|cama\|recamara\|libreria\|barra\|cubierta\|tablero\|mostrador\|tocador\|buffet\|trinchador\|paño\|laminado\|nogal\|encino\|roble\|caoba\|cedro\|pino\|chap\|cómoda\|...` | "Mesa redonda" caía en bypass `not_furniture` y el bot respondía "mi especialidad es el diseño..." |
| 6 | `Subir Render a Cloudinary` — `bodyParameters` | Incluía `transformation: l_logo_leuwzi,w_180,o_70,g_south_east,x_20,y_20` | Eliminado `transformation` (4 fields: file, upload_preset, public_id, folder) | Cloudinary unsigned upload **rechaza** `transformation` con HTTP 400 — solo lo permite en upload_preset |
| 7 | `Guardar URL Render.parameters.jsCode` | Output: `secure_url` directo | Output: `secure_url.replace('/upload/', '/upload/<watermark>/')` | Aplicar watermark vía URL transformation on-the-fly (no requiere re-upload) |
| 8 | Watermark — sintaxis Cloudinary | Iteraciones: `l_logo_leuwzi,w_180,o_70,g_south_east` → `l_fetch:<base64>,w_260,o_70,g_north_west` → `l_<public_id>/f_png,w_312,o_70,g_north_west,x_20,y_20/fl_layer_apply` | Sintaxis final usa overlay local con conversión AVIF→PNG interna y `fl_layer_apply` | Logo subido como AVIF en Cloudinary; necesita conversión para componer overlay sobre PNG del render |
| 9 | + nodo `Pregunta Post-Render` (whatsApp text) | — | Nuevo nodo conectado a `Enviar Imagen Render → Pregunta Post-Render` | Después de mandar la imagen, automáticamente preguntar SÍ/NO para iterar o pasar a cotización |
| 10 | `Enviar Imagen Render.parameters.mediaLink` | `={{ $json.generatedImageUrl }}` | `={{ $('Guardar URL Render').first().json.generatedImageUrl }}` | `Append Sheet Renders` con `mappingMode: defineBelow` reduce el `$json` a las 6 columnas — `generatedImageUrl` ya no estaba en el contexto |
| 11 | `Append Sheet Renders` — mappingMode | `autoMapInputData` | `defineBelow` con expresiones explícitas (`timestamp`, `telefono`, `descripcion`, `cloudinary_url`, `categoria_inferida`, `top_3_referencias`) | El output de Cloudinary tenía llaves `asset_id, public_id, secure_url...` que no matcheaban con headers del sheet → filas vacías |

### Bugs descubiertos y resueltos en orden cronológico

1. **Cloudinary 400 — "Transformation parameter is not allowed when using unsigned upload"** → quitado del nodo, movido a URL transformation.
2. **WhatsApp 400 — "Either one of media ID or link must be present"** → cambio de `mediaLink` para tomar URL desde `Guardar URL Render` directamente.
3. **Sheet Renders vacío** — pestaña existía pero recibía datos del response Cloudinary (sin matching). Solución: cambio a `defineBelow` con expresiones explícitas.
4. **Watermark AVIF no se renderiza** — Cloudinary no soporta AVIF como overlay nativo. Solución intermedia: `l_fetch:<URL>` con `f_png` (lento, 5-15s primer fetch). Solución final: `l_<public_id>/f_png/.../fl_layer_apply` (overlay local con conversión interna).
5. **Mensaje viejo en routing opción 2** — el `Asistente REYNA` emitía mensaje de transición al Diseñador, "tapando" el PASO 1 del Diseñador que tiene los bullets. Solución: mover los bullets al system prompt del REYNA directamente.

### Layout del watermark final
```
l_logo_png__pnyd4t/f_png,w_312,o_70,g_north_west,x_20,y_20/fl_layer_apply
```
- **`l_logo_png__pnyd4t`** — public_id del logo (subido por Luis 2026-05-05)
- **`/f_png`** — fuerza conversión AVIF → PNG internamente
- **`w_312`** — 312px de ancho (~30% del render 1024×1024)
- **`o_70`** — opacity 70%
- **`g_north_west`** — gravity esquina superior izquierda
- **`x_20,y_20`** — margin 20px desde esquina
- **`/fl_layer_apply`** — flag para componer la capa

### Pendientes E2E (Luis)
- Verificar que el nuevo logo PNG se renderiza correctamente en WhatsApp.
- Confirmar que SÍ → segundo render funciona (renderCount máx 2).
- Confirmar que NO → flujo de cotización (nombre/email/presupuesto numérico) cierra `[LEAD_COMPLETE]`.

---

## v0.7 — 2026-05-05 — Fix `Validar Tema`: falso positivo en "personas"

### Problema
Descripción `"Una mesa de comedor redonda para 8 personas de madera"` era rechazada con `bypassReason: "blocked_content"`. Root cause: el regex `BLOCKED` incluía `persona` sin word boundaries — "8 **persona**s" (descripción funcional de cuántos comensales caben en el mueble) disparaba el filtro.

### Fix aplicado
- **`Validar Tema`** (id: `9c9a757d-dba7-48cb-8c86-f373ebcb2694`): eliminados del regex BLOCKED los términos `persona`, `gente`, `cara`, `auto`, `animal` — todos pueden aparecer naturalmente en descripciones de muebles.

```js
// ANTES
const BLOCKED = /pornograf|sex|desnud|arma|droga|coche|carro|persona|gente|retrato|cara|rostro|auto|vehiculo|animal|mascota/;

// DESPUÉS
const BLOCKED = /pornograf|sex|desnud|arma|droga|coche|carro|retrato|rostro|vehiculo|mascota/;
```

- Aplicado vía `patchNodeField`. Verificado en n8n (`operationsApplied: 1`).

---

## v0.6 — 2026-05-05 — Fix Render Pipeline: native fetch en `Encode a Base64`

### Problema
`Encode a Base64` fallaba con "Unknown error" (JsTaskRunner). Causa raíz: `helpers.getBinaryDataBuffer` no está disponible en el subprocess separado del JsTaskRunner de n8n 2.x — la promesa rechaza con `undefined` y n8n lo envuelve como "Unknown error". Cambiar de `runOnceForEachItem` a `runOnceForAllItems` (fix anterior) no resolvió porque el problema era `getBinaryDataBuffer`, no el modo.

### Fix aplicado
- **`Encode a Base64`** (id: `a6bc6316-0f86-4455-9236-76d132d6651e`): reemplazado `helpers.getBinaryDataBuffer(item, 'data')` con `fetch(item.json.refUrl)` nativo de Node 18+. La URL de la imagen ya estaba disponible en `item.json.refUrl` del nodo anterior. Sin dependencia de n8n internals. Si falla el fetch, `refBase64: null` activa el branch de error existente.

```js
// ANTES (fallaba)
const buffer = await helpers.getBinaryDataBuffer(item, 'data');

// DESPUÉS (funciona)
const response = await fetch(refUrl);
const arrayBuffer = await response.arrayBuffer();
const base64 = Buffer.from(arrayBuffer).toString('base64');
```

---

## v0.5 — 2026-05-04 — Upsert Parcial + Contexto Asistente + A/B/C/D

### Cambios aplicados
- **`Detect Lead Complete`**: agrega parseo de nuevo tag `[LEAD_PARTIAL]{json}[/LEAD_PARTIAL]`. Cuando el Diseñador emite el tag, `upsertParcial` incluye Nombre, Email, Proyecto, Presupuesto.
- **`Aplanar Upsert`** (nodo nuevo): aplana `upsertParcial` al root del item para `autoMapInputData`.
- **`Sheets - Parcial`**: cambio a `mappingMode: autoMapInputData` — solo escribe los campos presentes, no sobreescribe con vacío.
- **`Asistente Diseñador`** (system prompt): agrega tag `[LEAD_PARTIAL]` en Paso 2 y 5, regla de reuso de contexto, instrucción "render falló → avanzar sin re-preguntar", menú A/B/C/D para presupuesto.
- **`Asistente REYNA`** (system prompt): agrega `[LEAD_PARTIAL]` en COTIZACIÓN CLÁSICA, regla de captura de nombre, tag en sección TAGS. Menú A/B/C/D para presupuesto.

---

## v0.4 — En progreso (2026-05-04) — Bot v2: Menú rediseñado + Render IA

### Objetivo
Rediseñar el menú a 4 opciones y agregar generación de renders personalizados con IA (RAG + Gemini 2.5 Flash Image).

### Nuevo menú
```
1️⃣ Ver ejemplos de nuestro trabajo
2️⃣ Diseñemos tu mueble / Cotizar mi proyecto
3️⃣ Ven a visitarnos
4️⃣ Hablar con un asesor de Reyna
```

### Arquitectura: RAG + Multimodal (NO fine-tuning)
- Catálogo de fotos en Google Sheet hoja "Catálogo" con embeddings (text-embedding-004)
- Búsqueda por similitud coseno → top 3 fotos de referencia
- Gemini 2.5 Flash Image genera render basado en descripción del cliente + fotos de referencia
- Fotos del catálogo alojadas en **Cloudinary** (no Drive, no servidor propio)

### Infraestructura de assets — decisión tomada
- **Cloudinary** elegido para hospedar fotos del catálogo de Reyna
- Razón: URLs públicas inmediatas sin DNS ni servidor, portable entre proyectos
- Tier gratuito: 25GB storage + 25GB bandwidth/mes
- URL formato: `https://res.cloudinary.com/<cuenta>/image/upload/<archivo>.jpg`
- **Descartado:** nginx en Hetzner (requería DNS y configuración de Traefik)
- **Descartado:** Google Drive (bloquea acceso directo por autenticación)

### Setup Hetzner (referencia, en pausa)
- Carpeta creada pero no usada: `/data/coolify/static/catalogo/reyna`
- Container nginx "Assets" creado en Coolify (puede eliminarse)
- Dominio `assets.est-studio.co` sin DNS configurado (en pausa)

### Estado actual
- [x] Plan aprobado
- [x] Cuenta Cloudinary creada
- [x] Hoja "Catalogo" creada en Sheet de Reyna (sin tilde — el MCP no parsea acentos)
- [~] Fotos subidas a Cloudinary — 1 fila cargada (`mdtv_1`, MueblesTV). Faltan ~15-20 más para variedad real
- [x] Embeddings generados — workflow `REYNA — Generador de Embeddings Catalogo` creado y corrido E2E (2026-05-04). Modelo `gemini-embedding-001` (3072 dims). Fila `mdtv_1` ya tiene su vector en el Sheet
- [ ] Menú actualizado en system prompt
- [ ] Pipeline RAG + Gemini Image construido en n8n

### Diseño del workflow "REYNA — Generador de Embeddings Catálogo" (pendiente de crear)

**Cuándo correrlo:** manual, cada vez que se agreguen filas nuevas al catálogo.

**Flujo (7 nodos):**

```
Manual Trigger
   └─ Leer Catalogo (Google Sheets read)
        └─ Filtrar Sin Embedding (Filter: embedding == "")
             └─ Armar Texto para Embedding (Code)
                  └─ Generar Embedding (HTTP → text-embedding-004)
                       └─ Extraer Vector (Code)
                            └─ Escribir Embedding en Sheet (Sheets update, match por id)
```

**Detalle de nodos clave:**

- **Armar Texto para Embedding** — concatena campos para enriquecer el vector:
  ```js
  const row = $input.item.json;
  const texto = [
    `Categoría: ${row.categoria || ''}`,
    `Descripción: ${row.descripcion || ''}`,
    `Materiales: ${row.materiales || ''}`,
    `Estilo: ${row.estilo || ''}`
  ].join('. ');
  return { ...row, texto_embedding: texto };
  ```

- **Generar Embedding (HTTP Request):**
  - URL: `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`
  - Method: POST
  - Auth: query auth con API key de Google AI Studio (credencial pendiente de crear en n8n)
  - Body raw JSON:
    ```json
    {
      "model": "models/text-embedding-004",
      "content": { "parts": [{ "text": "{{ $json.texto_embedding }}" }] }
    }
    ```

- **Extraer Vector** — saca el array de 768 floats y lo serializa para el Sheet:
  ```js
  const prev = $('Armar Texto para Embedding').item.json;
  const embedding = $input.item.json.embedding?.values || [];
  return {
    id: prev.id,
    embedding: JSON.stringify(embedding)
  };
  ```

- **Escribir Embedding en Sheet** — operation `update`, matchingColumns `["id"]`, mapea solo la columna `embedding`. Sheet ID `1M17krae73v3cS00tQTWV-kJcxo8k1txzXaR8mv0dA8c`, hoja `Catalogo`. Credencial Google Sheets `F5ulUZ2Ax6X8HpPv`.

**Pendiente antes de crear:**
- Crear credencial en n8n para Google AI Studio API key (httpQueryAuth con param `key`)
- Restablecer conexión MCP con n8n (reiniciar Claude Code para que tome la API key nueva)

---

## v0.2 — 2026-05-03

### Sincronización con Bipolar v5.2 + Sheet real cargado

**Contexto:** Reyna se clonó de Bipolar el 2026-05-03 cuando Bipolar estaba en estado pre-v5.0 a nivel de archivo local (aunque su producción ya estaba en v5.2). Esta versión trae a Reyna los fixes v5.0–v5.2 que vivían solo en el n8n productivo de Bipolar.

#### Sheet real conectado
- Sheet ID: `1M17krae73v3cS00tQTWV-kJcxo8k1txzXaR8mv0dA8c`
- Pestaña `Base de datos` (gid `1001783326`), 9 columnas (A=Teléfono ... I=Timestamp).
- Sustituido el placeholder `REEMPLAZAR_SHEET_ID_REYNA` en los 3 workflows.

#### Fixes portados desde Bipolar v5.0–v5.2
- **BUG #1 (timestamp medianoche):** `Cliente Nuevo` y `Detect Lead Complete` ahora escriben `Timestamp` con `new Date().toISOString()` (no `fechaCorta`). El Limpiador usaba ese timestamp y, sin hora, marcaba leads como abandonados antes de tiempo.
- **BUG #4 (timestamp en interacciones parciales):** `Sheets - Parcial` ahora incluye `Timestamp` en su mapping. Antes solo se actualizaba en creación y al calificar — leads con conversación larga eran marcados abandonados aunque tuvieran actividad reciente.
- **Umbral abandono 2h → 8h:** `Detectar Abandonados` (Limpiador) usa `OCHO_HORAS_MS` en lugar de `DOS_HORAS_MS`.
- **BUG #6 (claves con tildes):** unificadas `'Última Interacción'` y `'Transcripción'` en `Cliente Nuevo`, `Cliente Interesado`, `Detect Lead Complete` y los 3 nodos Sheets.
- **Schema sin columna Teléfono manual (v5.0):** `matchingColumns: ["Teléfono"]` en lugar de `["ID"]`. Eliminado el field Teléfono recopilado del mapping (el WhatsApp ya da el número).
- **`Email a Ventas`:** fila "Teléfono" cambiada a "WhatsApp" usando `$('Extract Message').item.json.phoneNumber`.
- **Bridge `jsonBody`:** corregido a `={{ JSON.stringify({ phoneNumber: $json.phone }) }}` (antes era sintaxis mezclada que enviaba JSON mal formado al endpoint de resume).

#### Aislamiento Reyna vs Bipolar (Chatwoot)
- `REYNA — Chatwoot WA Bridge`: webhook path `chatwoot-bridge` → `chatwoot-bridge-reyna`.
- Resume URL `bot-resume` → `bot-resume-reyna`.
- `name` del workflow en local actualizado a `REYNA — Chatwoot WA Bridge`.

#### Documentación
- README.md reescrito (era copia de Bipolar). Refleja menú de 7 opciones, categorías de carpintería, Sheet real, IDs n8n actuales, pendientes para activar.
- CHANGELOG_FROM_BIPOLAR.md actualizado con todos los cambios aplicados y pendientes restantes.
- PENDING_CHANGES.md (Bipolar) marca v5.0–v5.2 como `[portado]`.

---

## v0.1 — 2026-05-03 (snapshot inicial)

### Clon desde Bipolar + adaptación a carpintería fina

**Origen:** carpeta `CLIENTES/BIPOLAR/` copiada a `CLIENTES/Reyna/` excluyendo `Videos/`, `.gsheet` y `.gdoc` (shortcuts de Drive — copiarlos haría que Reyna apuntara al Drive de Bipolar).

#### Identidad de marca

| Aspecto | Valor |
|---------|-------|
| Negocio | Reyna Cocinas y Carpinterías Finas |
| Sitio | https://www.dreina.com |
| Ubicación | Loma Alta #220 Col. Loma Larga, Monterrey |
| Contacto | (81) 83220336, ventas@dreina.com |
| Horario | L-V 8-13 y 14-18 / Sáb 9-14 con cita previa |
| Trayectoria | 37 años fabricando muebles a medida |
| Tono | Profesional, cálido, oficio/calidad. Emojis moderados (🪵, ✨, 🏠) |

#### Workflow principal: `REYNA — Bot WhatsApp` (`ar3Ea99IYmhmtmAq`)

**System prompt reescrito 100%** (nodo `Asistente REYNA`, antes `Asistente BIPOLAR`):
- 8 secciones manteniendo arquitectura de Bipolar.
- **Menú nuevo de 7 opciones** (1 Cocinas, 2 Closets, 3 Plafones, 4 Puertas, 5 Muebles TV/Bares/Lavanetas, 6 Cotizar, 7 Asesor).
- **Calificación** (sec. 4): cuando el cliente vino por menú, infiere el tipo de proyecto y solo pide descripción libre. Si vino por opción 6, pide tipo + descripción primero.
- **Eliminada** la regla "preguntan quién es Cesar" (no aplica).
- **Sección 8 reemplazada:** showreel → galería por categoría con tags `[GALERIA_<CATEGORIA>]`.

#### Refactor showreel → galería

Rama `¿Showreel?` → `Responder WA Video` → `Responder WA Texto Showreel` reemplazada por:

```
Detect Lead Complete
   └─ ¿Galería? (TRUE)
        ├─ Responder WA Texto Galería  (texto sin tag)
        └─ Split Imágenes Galería       (Code: array → items individuales)
             └─ Enviar Imagen Galería    (loop WhatsApp por URL)
```

- Mapa `GALERIA_IMAGES` vive en el nodo `Detect Lead Complete` (objeto JS): un solo punto de cambio cuando se actualicen las URLs.
- Categorías: `COCINAS`, `CLOSETS`, `PLAFONES`, `PUERTAS`, `MUEBLES_TV`, `BARES`, `LAVANETAS`.
- Cada tag emisible máximo 1 vez por conversación (mismo patrón anti-repetición de showreel).
- URLs hoy son **placeholders `placehold.co`** — pendiente subir fotos reales.

#### Otros cambios cosméticos

- `Email a Ventas`: subject `🪵 Lead Reyna - {nombre}`, header del cuerpo "Reyna Cocinas y Carpinterías Finas".
- `Responder En Atención`: "agente de BIPOLAR" → "agente de Reyna".
- `Sheets` (3 nodos): `cachedResultName` "Bipolar - Base de datos" → "Reyna - Base de datos".

#### Workflows secundarios

- `REYNA — Limpiador de Leads` (`WfGYwyd89zU4rB7j`): clon directo, Sheet ID actualizado.
- `REYNA — Chatwoot WA Bridge` (`YQXUVjiBk4z9i30r`): clon directo, paths con sufijo `-reyna` para no chocar con el Bridge de Bipolar (mismo n8n).

#### Decisiones de cliente fijadas

- **WhatsApp:** mismo número que Bipolar → mismas credenciales (`whatsAppApi` + `whatsAppTriggerApi`). Solo un bot puede tener el webhook activo a la vez.
- **Chatwoot:** instancia/cuenta distinta → requiere credenciales nuevas + reapuntar webhook (pendiente).
- **Email ventas:** `luis.sanchezag@gmail.com` (mismo de Bipolar, por ahora).
- **Handoff humano:** idéntico a Bipolar, sin nombre de personas internas.

---

## Estructura del workflow `REYNA — Bot WhatsApp` (37 nodos)

```
1.  WhatsApp Trigger
2.  Extract Message              ← /reset, /volver, /resume, sessionId con epoch
3.  Lookup Lead                  ← HTTP GET Sheets API rango A:I
4.  Process Lookup               ← parsea response, normaliza teléfono
5.  ¿Ya Calificado?              ← IF: Estado=Calificado AND no /reset
6.  Cliente Ya Existente         ← (TRUE) inyecta contexto al Asistente
7.  ¿Existe en Sheet?            ← IF: si ya existe como Nuevo, saltar M1
8.  Cliente Nuevo                ← (FALSE) prepara fila + Timestamp ISO
9.  Sheets — Momento 1 (Nuevo)   ← appendOrUpdate por Teléfono
10. Asistente REYNA              ← AI Agent (Gemini)
11. Google Gemini Model
12. Memory                       ← contextWindowLength=10
13. Detect Lead Complete         ← partialLeads, GALERIA_IMAGES, tags
14. ¿Lead?                       ← IF: leadComplete=true
15. Sheets - Parcial             ← upsert parcial (incluye Timestamp)
16. Cliente Interesado           ← upsertCalificado + Timestamp
17. Sheets — Momento 2           ← appendOrUpdate Estado=Calificado
18. Email a Ventas
19. Responder WhatsApp
20. Check Pausa                  ← lee humanMode[phoneNumber]
21. ¿En Pausa?                   ← IF: silencia bot si hay agente activo
22. Responder En Atención        ← mensaje de cortesía durante handoff
23. ¿Galería?                    ← IF: detecta galeria notEmpty
24. Responder WA Texto Galería   ← envía texto de transición
25. Split Imágenes Galería       ← Code: array → items
26. Enviar Imagen Galería        ← WhatsApp loop por URL
27. ¿Handoff?                    ← IF: humanHandoff=true
28. Prep Handoff                 ← marca humanMode, arma contexto
29. Chatwoot - Crear Contacto
30. Chatwoot - Buscar Contacto
31. Chatwoot - Crear Conversación
32. Chatwoot - Enviar Historial  ← nota privada con historial
33. Responder WA Handoff         ← mensaje de transición
34. Webhook Resume               ← /bot-resume-reyna
35. Limpiar humanMode            ← bumpea resetEpochs
36. Respond Resume OK
37. (settings)
```

## Datos persistidos en `staticData`

| Campo | Descripción |
|-------|-------------|
| `resetEpochs[phoneNumber]` | Timestamp del último `/reset`, `/volver` o `/resume` |
| `history[phoneNumber]` | Últimos 12 turnos (`U: ...` / `B: ...`) |
| `partialLeads[phoneNumber]` | Datos acumulados antes de cerrar (nombre, email) |
| `humanMode[phoneNumber]` | Flag de handoff activo (silencia el bot) |

⚠️ `staticData` puede resetearse al hacer PUT al workflow. Tras cambios mayores, usar `/reset` para forzar limpieza.

## Próximos sprints

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Crear `Panel de Clientes` en el Sheet (3 secciones por estado) | Pendiente |
| 2 | Subir fotos reales por categoría → reemplazar `GALERIA_IMAGES` placeholders | Pendiente |
| 3 | Test E2E manual del bot (sin activar) | Pendiente |
| 4 | Chatwoot: crear inbox Reyna, obtener inboxId, configurar webhook | Pendiente |
| 5 | Validar URLs públicas para WhatsApp Cloud API | Pendiente |
| 6 | Activar workflows uno a uno tras desactivar Bipolar | Pendiente |
| 7 | Verificar `/volver` y `/resume` E2E (fix v5.1 portado, sin probar todavía) | Pendiente |
