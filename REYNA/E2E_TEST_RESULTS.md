# E2E Test Results — Reyna Bot v0.10

**Fecha de revisión:** 2026-05-05
**Versión:** v0.10 (galería .jpg + watermark diagonal + Diseñador 5 pasos + Bug 2 + Bug 5)
**Ejecutado por:** Luis Ángel Sánchez
**Instrucciones:** Para cada caso, usar `/reset` antes de iniciar (excepto Caso 5 y Caso 8). Anotar resultado real en columna Resultado y Evidencia.

---

## Cambios v0.10 vs v0.8

- **MAX_RENDERS = 3** (antes 2)
- **Diseñador: flujo de 5 pasos** (saludo + 8 muebles → estilo/color → detalles → render → cotización)
- **Watermark renders**: patrón diagonal repetido (`l_logo_djsdvp,w_180,o_18,fl_tiled,e_rotate:-30`)
- **Galería**: imágenes `.jpg` (antes `.avif` que WhatsApp no enviaba)
- **Bug 2**: cliente con Proyecto en Sheet → bot avisa, no ofrece diseño nuevo
- **Bug 5**: palabras bloqueadas se registran en Sheet `Palabras no admitidas`
- **Submenú galería**: 4 categorías (Cocinas, Puertas, Lavanetas, Muebles TV)
- **Chatwoot**: SALTADO en esta ronda (Caso 6)

---

## Casos E2E

### Caso 1 — Galería submenú

**Flujo esperado:** `/reset` → "hola" → menú principal 7 opciones → "1" (Ver Galería) → submenú 4 categorías → elige número → recibe foto(s)

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | `/reset` + "hola" | Menú principal con 7 opciones | | |
| 2 | "1" (Ver galería) | Submenú: 1-Cocinas / 2-Puertas / 3-Lavanetas / 4-Muebles TV | | |
| 3 | "1" (Cocinas) | **2 fotos** de cocinas (.jpg) llegan al WhatsApp | | |
| 4 | "/reset" + "hola" + "1" + "2" (Puertas) | 1 foto de puertas llega | | |
| 5 | "/reset" + "hola" + "1" + "3" (Lavanetas) | 1 foto de lavanetas llega | | |
| 6 | "/reset" + "hola" + "1" + "4" (Muebles TV) | 1 foto de mueble TV llega | | |

**Resultado caso:** `PASA` / `FALLA` / `PARCIAL`
**Notas:**

---

### Caso 2 — Diseñador 5 pasos + 3 renders + cotización

**Flujo esperado:** `/reset` → opción Diseñar → PASO 1 (saludo + 8 muebles) → PASO 2 (estilo+color) → PASO 3 (detalles) → render con watermark diagonal → ajustar → render 2 → ajustar → render 3 → bot dice "ya generamos 3" → cotización → lead completo

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | `/reset` + "hola" + opción Diseñar | Saludo Diseñador + submenú 8 muebles | | |
| 2 | "1" (Cocina integral) | Pregunta estilo+color con sugerencias | | |
| 3 | "moderna en blanco con detalles de madera" | Pregunta detalles (dimensiones, herrajes) | | |
| 4 | "3m x 2.5m, tiradores ocultos, LED" | **Render 1** llega con **logo en patrón diagonal repetido** (~18% opacidad, rotado -30°) | | |
| 5 | Verificar watermark visible pero sutil | Logo se ve repetido en diagonal, no tapa el render | | |
| 6 | Recibir menú post-render | "1-Ajustar / 2-Cotizar" | | |
| 7 | "1" (ajustar) | Bot pregunta qué ajustar | | |
| 8 | "más oscura con isla central" | Render 2 llega con watermark | | |
| 9 | "1" (ajustar) | Render 3 llega con watermark | | |
| 10 | "1" (intento de 4to render) | Bot dice "Ya generamos 3 versiones del diseño..." y pasa a cotización | | |
| 11 | Dar nombre, email, presupuesto | Lead completo confirmado | | |
| 12 | Verificar Sheet `Base de datos` | Estado=`Calificado`, todos los campos llenos | | |
| 13 | Verificar Sheet `Renders` | 3 nuevas filas con cloudinary_url | | |
| 14 | Abrir cualquier cloudinary_url | URL contiene `l_logo_djsdvp,w_180,o_18,fl_tiled,e_rotate:-30` | | |
| 15 | Verificar email a ventas | Llega email con datos del lead | | |

**Resultado caso:** `PASA` / `FALLA` / `PARCIAL`
**Notas:**

---

### Caso 3 — Diseñador → 1 render → cotizar directo

**Flujo esperado:** Diseñador, 1 render, cliente dice "2" (cotizar), salta a captura sin pedir más renders

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | `/reset` + "hola" + Diseñar + 5 pasos completos | Render 1 llega | | |
| 2 | "2" (cotizar) | Bot pasa directo a captura de datos | | |
| 3 | Dar nombre, email, presupuesto | Lead completo | | |
| 4 | Verificar Sheet `Renders` | 1 sola fila nueva | | |

**Resultado caso:** `PASA` / `FALLA` / `PARCIAL`
**Notas:**

---

### Caso 4 — Bypass de contenido bloqueado (Bug 5)

**Importante:** El nodo `Llamar Gemini Image` NO debe ejecutarse en estos casos.

#### 4a — Palabra bloqueada (`blocked_content`)

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | `/reset` + "hola" + Diseñar + completar 3 pasos | PASO 4 dispara render | | |
| 2 | En PASO 3 escribir: "una mesa con un coche encima" | Bot bypassa render con mensaje profesional | | |
| 3 | Verificar n8n execution | Nodo `Llamar Gemini Image` NO aparece | | |
| 4 | Verificar Sheet `Palabras no admitidas` | **Nueva fila con: Palabra="coche", Descripción, Teléfono, Timestamp, Motivo="blocked_content"** | | |

#### 4b — Otra palabra bloqueada

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | `/reset` → Diseñador → en PASO 3 escribir "armas decorativas" | Bypass | | |
| 2 | Verificar Sheet `Palabras no admitidas` | Nueva fila con Palabra="armas" | | |

**Resultado caso 4:** `PASA` / `FALLA` / `PARCIAL`
**Notas:**

---

### Caso 5 — Cliente ya calificado (sin /reset)

**Pre-condición:** Mismo número del Caso 2 con Estado=`Calificado` y Proyecto lleno en Sheet.

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | "hola" (sin /reset, mismo número) | Bot saluda por nombre, NO re-pide datos | | |
| 2 | "quiero un diseño nuevo" o equivalente | Bot responde: "Veo que ya tenemos un proyecto en progreso para usted..." (NO ofrece render) | | |
| 3 | Verificar n8n execution | Nodo `Cliente Ya Existente` ejecutado, contexto incluye `Proyecto ya existe` | | |

**Resultado caso:** `PASA` / `FALLA` / `PARCIAL`
**Notas:**

---

### Caso 5b — Cliente Nuevo con Proyecto pre-llenado (Bug 2)

**Pre-condición:** Manualmente meter un teléfono nuevo al Sheet con Estado=`Nuevo` y Proyecto="cocina blanca lacada" lleno.

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | Desde ese teléfono mandar "hola" | REYNA saluda | | |
| 2 | Pedir "quiero diseñar un mueble" | Bot avisa que ya hay proyecto en progreso, NO ofrece render | | |
| 3 | Verificar n8n execution | Nodo `Inyectar Contexto Proyecto` ejecutado correctamente | | |

**Resultado caso:** `PASA` / `FALLA` / `PARCIAL`
**Notas:**

---

### Caso 6 — Handoff Chatwoot

**Estado:** `SALTADO` en v0.10 — pendiente setup Chatwoot Reyna (inboxId).

---

### Caso 7 — Limpiador 8h

**Pre-condición:** Lead con Estado=`Nuevo` y Timestamp >8h.

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | Lead Nuevo + Timestamp >8h | Limpiador lo encuentra | | |
| 2 | Disparar manualmente o esperar cron | Estado cambia a `No completó información` | | |
| 3 | Verificar no duplicación | Solo fila existente actualizada | | |
| 4 | Verificar no email | NO llega email a ventas | | |

**Resultado caso:** `PASA` / `FALLA` / `PARCIAL`
**Notas:**

---

### Caso 8 — `/reset` borra todo el estado

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | Cliente con sesión activa en Diseñador manda `/reset` | Confirmación reset | | |
| 2 | "hola" | Menú principal limpio | | |
| 3 | Verificar staticData | `history`, `renderData`, `humanMode`, `inDesignerMode`, `inDesignerModeAt` del teléfono = eliminados | | |

**Resultado caso:** `PASA` / `FALLA` / `PARCIAL`
**Notas:** ⚠️ `/reset` debe removerse antes de producción.

---

### Caso 9 — Estado `Calificado` persiste tras cron

**Pre-condición:** Número de prueba sin registro previo.

| # | Paso | Esperado | Resultado | Evidencia |
|---|------|----------|-----------|-----------|
| 1 | `/reset` + flujo Diseñador completo hasta lead | Bot confirma "registramos su solicitud" | | |
| 2 | Verificar Sheet `Base de datos` | Estado=`Calificado` inmediatamente | | |
| 3 | Esperar 30 min (o disparar Limpiador) | Estado sigue siendo `Calificado` | | |
| 4 | Repetir con flujo clásico (galería → cotizar) | Mismo resultado | | |

**Resultado caso:** `PASA` / `FALLA` / `PARCIAL`
**Notas:**

---

## Resumen de resultados

| Caso | Descripción | Resultado |
|------|-------------|-----------|
| 1 | Galería submenú 4 categorías | |
| 2 | Diseñador 5 pasos + 2 renders (era 3) | |
| 3 | Diseñador 1 render + cotizar | ✅ PASA (re-validado 2026-05-07) |
| 4a | Bypass palabra bloqueada → log Sheet | 🟡 PARCIAL — LLM filtra antes del logger; no bloqueante |
| 4b | Bypass otra palabra bloqueada → log Sheet | 🟡 PARCIAL — mismo motivo que 4a |
| 5 | Cliente ya Calificado con proyecto | ✅ PASA (re-validado 2026-05-07) |
| 5b | Cliente Nuevo con proyecto pre-llenado | |
| 6 | Handoff Chatwoot + toggle Resolve | ✅ PASA (2026-05-07) — handoff + agente responde + Resolve reactiva bot + cliente reabre conversación |
| 7 | Limpiador 8h | |
| 8 | /reset borra estado | |
| 9 | Estado Calificado persiste tras cron | |

---

## Bugs encontrados durante E2E

| Bug | Nodo afectado | Severidad | Reproducción | Fix propuesto |
|-----|--------------|-----------|--------------|---------------|
| | | | | |

---

## Decisión go/no-go

**Casos bloqueantes (todos deben pasar para activar):** 1, 2, 3, 4a, 4b, 5, 5b, 7, 8, 9
**Caso no bloqueante:** 6 (Chatwoot saltado)

**Fecha de ejecución E2E:** ___________
**Decisión:** `GO` / `NO-GO` / `GO con condiciones`
**Condiciones (si aplica):**
