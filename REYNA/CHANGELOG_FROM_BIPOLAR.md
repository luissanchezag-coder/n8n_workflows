# Reyna — Cambios desde el snapshot de Bipolar

Snapshot inicial copiado desde `CLIENTES/BIPOLAR/` el **2026-05-03**.

Este archivo registra **todo lo que diverge entre Reyna y el Bipolar original**: prompts, IDs de Sheet, credenciales, lógica de negocio específica del cliente, etc.

> **Regla:** cada cambio aplicado en Reyna se anota aquí en una línea. Si no se anota, no existe.

---

## Decisiones de cliente

- **WhatsApp:** mismo número que Bipolar → mismas credenciales (`whatsAppApi` + `whatsAppTriggerApi`).
- **Chatwoot:** instancia/cuenta distinta → requiere credenciales nuevas y reapuntar webhook.

## Workflows importados a n8n (todos `active: false`, tag `REYNA`)

| Workflow | ID n8n | Notas |
|----------|--------|-------|
| REYNA — Limpiador de Leads | `WfGYwyd89zU4rB7j` | Sheet ID puesto a `REEMPLAZAR_SHEET_ID_REYNA` para evitar escribir en Bipolar |
| REYNA — Chatwoot WA Bridge | `YQXUVjiBk4z9i30r` | Webhook path = `chatwoot-bridge-reyna`. URL resume = `bot-resume-reyna` |
| REYNA — Bot WhatsApp | `ar3Ea99IYmhmtmAq` | Sheet ID puesto a `REEMPLAZAR_SHEET_ID_REYNA`. Webhook resume path = `bot-resume-reyna` |

## Pendientes inmediatos post-copia

- [x] ~~Crear nuevo Google Sheet de Reyna (Pipeline + Panel de Clientes).~~ (2026-05-03) Sheet ID `1M17krae73v3cS00tQTWV-kJcxo8k1txzXaR8mv0dA8c`, pestaña `Base de datos` (gid `1001783326`).
- [x] ~~Reemplazar `REEMPLAZAR_SHEET_ID_REYNA` en los 3 workflows con el ID real del nuevo Sheet.~~ (2026-05-03)
- [x] ~~En `Limpiador de Leads`: actualizar `cachedResultName` ("Reyna - Base de datos") y `gid` al de la hoja real.~~ (2026-05-03)
- [ ] Crear pestaña `Panel de Clientes` con fórmulas (ver CHANGELOG.md de Bipolar v4.2/v4.7/v5.2).
- [ ] Crear credenciales de Chatwoot de Reyna en n8n (la cuenta/inbox de Reyna es distinta).
- [ ] Reapuntar webhook de Chatwoot Reyna a `https://n8n.est-studio.co/webhook/chatwoot-bridge-reyna`.
- [ ] Verificar que el `inboxId === 1` del filtro Chatwoot sigue siendo correcto en la cuenta de Reyna (probable que NO).
- [ ] Crear nuevo Google Doc de SPEC para Reyna.
- [x] ~~Ajustar prompts del bot al tono/negocio de Reyna.~~ (2026-05-03)
- [ ] **Subir fotos reales de proyectos a un host público** (Drive con `?export=view&id=...` o Cloudinary) y reemplazar los placeholders `https://placehold.co/...` en el nodo `Detect Lead Complete`, mapa `GALERIA_IMAGES` (un solo punto de cambio).
- [ ] Validar URLs públicas: WhatsApp Cloud API rechaza imágenes que requieran autenticación o que no expongan `Content-Type: image/*`. Probar primero con `placehold.co` (sirve PNG público), luego con Drive una por una.
- [ ] Adaptar README.md a Reyna.
- [ ] Activar workflows uno por uno después de validar.

---

## Cambios aplicados

| Fecha | Workflow / Archivo | Cambio | Notas |
|-------|--------------------|--------|-------|
| 2026-05-03 | (todos) | Snapshot inicial copiado de Bipolar | Sin Videos/. .gsheet y .gdoc no copiados (shortcuts de Drive) |
| 2026-05-03 | workflows/*.json | Renombrados `BIPOLAR —` → `REYNA —` (nombre de archivo) | Campo `name` dentro del JSON sin cambiar a nivel local |
| 2026-05-03 | n8n | 3 workflows importados con prefijo REYNA y tag REYNA, todos inactivos | Sheet ID reemplazado por placeholder; webhooks Chatwoot/resume con sufijo `-reyna` para no chocar con Bipolar |
| 2026-05-03 | REYNA — Bot WhatsApp / nodo Asistente | systemMessage reescrito 100% para Reyna (carpintería, 7 categorías, tono profesional). Nodo renombrado `Asistente BIPOLAR` → `Asistente REYNA` | Calificación de lead pide TIPO + descripción del proyecto. Si el cliente vino del menú, infiere tipo y solo pide descripción. |
| 2026-05-03 | REYNA — Bot WhatsApp / rama showreel | Refactorizada a `¿Galería?` por categoría. Nodos resultantes: `¿Galería?` → `Responder WA Texto Galería` → `Split Imágenes Galería` (Code) → `Enviar Imagen Galería` (loop por URL). Mapa `GALERIA_IMAGES` vive en el código de `Detect Lead Complete` (modular: 1 solo punto de cambio). | URLs hoy son placeholders `placehold.co`. |
| 2026-05-03 | REYNA — Bot WhatsApp / Email a Ventas | Subject cambiado a `🪵 Lead Reyna - {nombre}`. Cuerpo del email: header ahora dice "Reyna Cocinas y Carpinterías Finas". Destinatario `luis.sanchezag@gmail.com` (sin cambios). | |
| 2026-05-03 | REYNA — Bot WhatsApp / Responder En Atención | Texto del mensaje "agente de BIPOLAR" → "agente de Reyna". | Mensaje cuando el bot está pausado. |
| 2026-05-03 | REYNA — Bot WhatsApp / Sheets (3 nodos) | `cachedResultName` "Bipolar - Base de datos" → "Reyna - Base de datos". | Solo cosmético en UI; no afecta operación. |
| 2026-05-03 | (los 3 workflows) | Sheet ID real cargado (`1M17krae73v3cS00tQTWV-kJcxo8k1txzXaR8mv0dA8c`). `cachedResultName` "Reyna - Base de datos", gid 1001783326. | Bot WhatsApp + Limpiador apuntan al Sheet real. |
| 2026-05-03 | REYNA — Limpiador / `Detectar Abandonados` | `DOS_HORAS_MS` → `OCHO_HORAS_MS` (umbral abandono 2h → 8h). | **Port v5.2 BUG #4**: leads no se marcan abandonados antes de tiempo. |
| 2026-05-03 | REYNA — Chatwoot WA Bridge / `Llamar Resume Bot` | `jsonBody` corregido a `={{ JSON.stringify({ phoneNumber: $json.phone }) }}`. | **Port v5.1**: el formato anterior `={ "phoneNumber": "{{...}}" }` daba mal JSON al endpoint de resume. |
| 2026-05-03 | REYNA — Chatwoot WA Bridge / `name` + `path` + URL | `name` "BIPOLAR" → "REYNA"; webhook path `chatwoot-bridge` → `chatwoot-bridge-reyna`; resume URL `bot-resume` → `bot-resume-reyna`. | Aislamiento Chatwoot Bipolar/Reyna. |
| 2026-05-03 | REYNA — Bot WhatsApp / `Cliente Nuevo`, `Detect Lead Complete` | Timestamp en formato `new Date().toISOString()` (no `fechaCorta`). | **Port v5.2 BUG #1**: timestamp con hora real, no medianoche. |
| 2026-05-03 | REYNA — Bot WhatsApp / `Sheets - Parcial` | Mapping incluye `Timestamp: "={{ new Date().toISOString() }}"`. | **Port v5.2 BUG #4**: timestamp se actualiza en interacciones parciales. |
| 2026-05-03 | REYNA — Bot WhatsApp / `Sheets - M1`, `M2`, `Parcial` | `matchingColumns: ["Teléfono"]` (no `["ID"]`). Eliminado field `Teléfono` recopilado del mapping. | **Port v5.0/v5.2**: schema sin columna Teléfono manual. |
| 2026-05-03 | REYNA — Bot WhatsApp / claves JSON | Claves unificadas a `'Última Interacción'` y `'Transcripción'` (con tildes) en jsCode de `Cliente Nuevo`, `Cliente Interesado`, `Detect Lead Complete`. | **Port v5.2 BUG #6**: alineación entre claves JS y headers del Sheet. |
| 2026-05-03 | REYNA — Bot WhatsApp / `Cliente Interesado`, `Sheets - M2`, `Email a Ventas` | Eliminado field Teléfono recopilado manual; Email usa `$('Extract Message').item.json.phoneNumber` del trigger. | **Port v5.0**: el WhatsApp ya da el teléfono, no se pide al cliente. |
| 2026-05-03 | (los 3 workflows) | Pusheados a n8n vía MCP. | IDs: `ar3Ea99IYmhmtmAq` (Bot), `WfGYwyd89zU4rB7j` (Limpiador), `YQXUVjiBk4z9i30r` (Bridge). Todos `active: false`. |
| | | | |
