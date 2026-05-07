# REYNA — Bot WhatsApp

Bot de calificación de leads para **Reyna Cocinas y Carpinterías Finas** (Monterrey, [dreina.com](https://www.dreina.com)). Clonado del bot de BIPOLAR el 2026-05-03 y adaptado al negocio de carpintería fina.

## Estado actual
🟢 **ACTIVO en pruebas** — v0.13. Demo lista para cliente. Chatwoot integración E2E funcionando (handoff + toggle Resolve/Reopen + log mensajes en pausa). Catálogo embeddings eliminado (era código muerto). Sheet rebrand: columna WhatsApp clickeable. Email sin footer EST STUDIO. Cierre automático tras 2do render.

### Dónde nos quedamos (sesión 2026-05-07 mañana)

✅ Chatwoot handoff funciona E2E (cliente → bot → handoff → Chatwoot → agente responde → llega a WA)
✅ Toggle bot ON/OFF vía Resolve/Reopen en Chatwoot (sin slash commands)
✅ Mensajes del cliente en pausa se postean a la conversación abierta de Chatwoot (lookup automático)
✅ Eliminado nodo `Responder En Atención` — bot no manda mensaje auto cuando humano atiende
✅ Catálogo embeddings eliminado (4 nodos retirados, era código muerto: URLs en texto que Gemini no leía)
✅ Sheet `Base de datos`: nueva columna B `WhatsApp` clickeable (HYPERLINK a wa.me/)
✅ Email a Ventas: removido footer EST STUDIO
✅ Detect Lead Complete: detecta Nombre/Email en tiempo real → Sheet se llena conforme cliente responde
✅ Bug 2do render-menú redundante: ahora tras render #2 va directo a "¿Cuál es su nombre completo?"
✅ Re-validados Caso 3 y Caso 5

⏸️ **Pendiente** (en orden):
1. Caso 8 — `/reset` borra estado
2. Caso 2 — Diseñador con 2 renders + ajustes (validar nuevo cierre auto post-2do-render)
3. Caso 1 — Galería submenú
4. Caso 5b, Caso 7, Caso 9
5. Borrar pestaña `Catalogo` del Sheet manualmente
6. Watermark / logo en renders (deferred)
7. Eliminar `/reset` de `Extract Message` antes de producción
8. Desactivar Bipolar webhook si Reyna se queda con número propio (actualmente comparten)
9. Demo al cliente

| Workflow | n8n ID | Estado |
|----------|--------|--------|
| `REYNA — Bot WhatsApp` | [`ar3Ea99IYmhmtmAq`](https://n8n.est-studio.co/workflow/ar3Ea99IYmhmtmAq) | Inactivo |
| `REYNA — Limpiador de Leads` | [`WfGYwyd89zU4rB7j`](https://n8n.est-studio.co/workflow/WfGYwyd89zU4rB7j) | Activo (cron) |
| `REYNA — Chatwoot WA Bridge` | [`YQXUVjiBk4z9i30r`](https://n8n.est-studio.co/workflow/YQXUVjiBk4z9i30r) | Inactivo |

> **Importante — un solo bot activo a la vez:** Reyna comparte número WhatsApp con Bipolar. Solo uno puede tener el webhook activo. Antes de activar Reyna, desactivar el de Bipolar (`Y2SJ2fB9APdgxadn`).

## Qué hace
1. Saluda con menú de **7 opciones** según el tipo de proyecto.
2. Si el cliente elige una categoría (1-5) → envía 2-3 imágenes del catálogo + transición a calificación.
3. Si elige cotizar (6) → recopila tipo de proyecto + descripción + nombre + email + presupuesto.
4. Registra el lead en Google Sheets (upsert idempotente por `Teléfono` = número WhatsApp normalizado).
5. Notifica al equipo de ventas por email.
6. Detecta cliente ya registrado: lo saluda por nombre sin volver a calificar.
7. Marca como "No completó información" leads inactivos > 8 horas (cron cada 30 min).
8. Opción 7: handoff bidireccional a un asesor humano vía Chatwoot.

## Categorías de producto

| # | Categoría | Tag galería |
|---|-----------|-------------|
| 1 | Cocinas | `[GALERIA_COCINAS]` |
| 2 | Closets y Vestidores | `[GALERIA_CLOSETS]` |
| 3 | Plafones | `[GALERIA_PLAFONES]` |
| 4 | Puertas | `[GALERIA_PUERTAS]` |
| 5 | Muebles de TV / Bares / Lavanetas | `[GALERIA_MUEBLES_TV]` / `[GALERIA_BARES]` / `[GALERIA_LAVANETAS]` |
| 6 | Cotizar mi proyecto | (calificación directa) |
| 7 | Hablar con un asesor | `[HUMAN_HANDOFF]` |

El mapa de URLs por categoría vive en el nodo `Detect Lead Complete` (objeto `GALERIA_IMAGES`). **Hoy son placeholders `placehold.co`** — pendiente subir fotos reales de Reyna.

## Estados del pipeline

| Estado | Descripción |
|--------|-------------|
| `Nuevo` | Lead que inició el chat pero no completó |
| `Calificado` | Lead que completó todos los datos |
| `No completó información` | Nuevo sin actividad por más de **8 horas** |

## Comandos especiales

**Cliente (desde WhatsApp):**
- `/reset` — inicia conversación nueva, sobrescribe la fila como `Nuevo`. ⚠️ Solo para pruebas; quitar antes de producción.
- `/volver` — al estar en handoff, regresa el control al bot (LLM con sesión limpia).

**Agente (desde Chatwoot, nota privada):**
- `/resume` — devuelve el control al bot. El cliente no ve el comando.

## Archivos del proyecto

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Este archivo |
| `CHANGELOG.md` | Historial de cambios técnicos de Reyna |
| `CHANGELOG_FROM_BIPOLAR.md` | Tracking de divergencias respecto al snapshot de Bipolar |
| `workflows/REYNA — Bot WhatsApp.json` | Workflow principal (37 nodos) |
| `workflows/REYNA — Chatwoot WA Bridge.json` | Bridge Chatwoot → WhatsApp |
| `workflows/REYNA — Limpiador de Leads.json` | Cron cada 30 min — marca abandonados |
| `Reyna - Pipeline.gsheet` | Acceso directo al Google Sheet |

## Google Sheet

[Reyna - Pipeline](https://docs.google.com/spreadsheets/d/1M17krae73v3cS00tQTWV-kJcxo8k1txzXaR8mv0dA8c/edit) — ID: `1M17krae73v3cS00tQTWV-kJcxo8k1txzXaR8mv0dA8c`

### Pestañas

**`Base de datos`** (gid `1001783326`) — registro de leads (9 columnas):

| Columna | Nombre | Notas |
|---------|--------|-------|
| A | Teléfono | Clave primaria (número WhatsApp normalizado a dígitos) |
| B | Nombre | |
| C | Email | |
| D | Proyecto | Tipo + descripción libre |
| E | Presupuesto | |
| F | Estado | `Nuevo` / `Calificado` / `No completó información` |
| G | Última Interacción | Fecha legible (ej. `03 may 2026`) |
| H | Transcripción | Últimos 4 mensajes del usuario |
| I | Timestamp | ISO 8601 — usada por el Limpiador |

> No insertar columnas intermedias sin actualizar fórmulas del Panel y workflows.

**`Panel de Clientes`** — vista ejecutiva por status. **Pendiente de crear** (referencia: `CLIENTES/BIPOLAR/README.md` sección Panel + `CHANGELOG.md` Bipolar v4.2/v5.2).

## Pendientes para activar (orden)

> **Estado al 2026-05-05:** v0.11 con render funcional E2E confirmado en producción. 8 bugs en cadena resueltos. Render llega al cliente sin watermark.

### Bugs corregidos en v0.11 (sesión de debugging E2E)
1. [x] `Inyectar Contexto Proyecto` syntax error → template literal
2. [x] `Generar Embedding Descripción` credencial placeholder → `Query Auth account 2`
3. [x] `Generar Embedding Descripción` body JSON inválido → lectura explícita desde `Validar Tema`
4. [x] `Buscar Top-3 Catálogo` modo `runOnceForEachItem` → `runOnceForAllItems` + lectura desde `Extraer Embedding Descripción`
5. [x] `Llamar Gemini Image` modelo 404 → `gemini-2.5-flash-image` (Nano Banana)
6. [x] `Subir Render a Cloudinary` transformation inválida (`e_rotate:-30`) → removido inline
7. [x] `Append Sheet Renders` falta `columns.schema` → schema de 6 columnas agregado
8. [x] `Enviar Imagen Render` `mediaLink` vacío → lectura desde `Guardar URL Render`
9. [x] **Re-arquitectura ROUTE_DESIGNER**: REYNA muestra menú 6 muebles + Diseñador arranca en PASO 2
10. [x] **Diseñador menos exigente**: dispara render con cualquier dato mínimo

### Mejoras UX adicionales en v0.11
11. [x] Saludo "Bienvenid@" inclusivo
12. [x] Menú principal opción 2 simplificada
13. [x] Submenú Diseñador 6 muebles (quitados Bar y Plafón)
14. [x] Formato uniforme de menús con emojis 1️⃣2️⃣3️⃣
15. [x] PASO 2 Diseñador formato compacto + cierre "Entre más detallado, mejor quedará su diseño 🪵"

### Bloqueantes / pendientes antes de producción
16. [ ] **Watermark / logo en renders** — pendiente. Intentos con transformación inline (`l_logo_djsdvp,w_180,g_north_west,...`) y vía `upload_preset` en Cloudinary fallaron por errores de sintaxis / asset path. Render funciona sin watermark. Para resolver con calma: probar paso a paso desde Cloudinary console con el constructor visual de transformaciones, validar que el public_id del logo es exactamente `logo_djsdvp` (sin subcarpeta), guardar el preset y NO mantener `transformation` inline en el nodo `Subir Render a Cloudinary` simultáneamente.
17. [ ] **Eliminar `/reset`** de `Extract Message` antes de producción
18. [ ] **Test E2E completo** — Casos 3-9 en `E2E_TEST_RESULTS.md`
19. [ ] **Desactivar Bipolar webhook** y activar Reyna en orden: Bot → Limpiador → Bridge

### Saltado / deferido
- **Caso 6 — Chatwoot inboxId** — pendiente setup en Chatwoot, no bloquea soft-launch

## Diferencias clave vs Bipolar

| Aspecto | Bipolar | Reyna |
|---------|---------|-------|
| Industria | Agencia creativa | Carpintería fina |
| Menú | 5 opciones (showreel + casos) | 7 opciones (categorías + cotizar + asesor) |
| Visual | 1 video showreel (Cloudinary) | 2-3 imágenes por categoría |
| Tono | Audaz / "Es normal ser bipolar" | Profesional / oficio / 37 años |
| Sheet ID | `1KKO788ra...` | `1M17krae...` |
| Webhook Chatwoot | `chatwoot-bridge` | `chatwoot-bridge-reyna` |
| Resume URL | `bot-resume` | `bot-resume-reyna` |
| Inbox Chatwoot | `1` (Bipolar) | **pendiente** |
| Email ventas | `luis.sanchezag@gmail.com` | `luis.sanchezag@gmail.com` (mismo, por ahora) |

Detalles completos en [CHANGELOG_FROM_BIPOLAR.md](CHANGELOG_FROM_BIPOLAR.md).
