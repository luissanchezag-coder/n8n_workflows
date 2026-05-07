# REYNA Bot — Guía de Fixes v0.10

**Fecha**: 2026-05-06  
**Estado**: Pendiente de upload y testing  
**Autor**: Claude Code

---

## Resumen de Bugs a Fijar

| # | Bug | Estado | Cómo hacerlo |
|----|-----|--------|-----------|
| 1 | Permitir 3 renders en lugar de 2 | ✅ COMPLETADO | `Validar Tema` - MAX_RENDERS = 3 |
| 2 | Verificar Proyecto no vacío antes de render | ⏳ PENDIENTE | Leer Sheet + IF en ambos bots |
| 3 | Designer lanza menú completo sesión 2 | 📋 VERIFICAR | Memory Diseñador + sessionId |
| 4 | Mensaje completo "Ya generamos 3 versiones..." | ✅ COMPLETADO | System prompt Diseñador actualizado |
| 5 | Log palabras bloqueadas en Sheet | ⏳ PENDIENTE | IF + Google Sheets append |

---

## ✅ Bugs Completados

### Bug 1 — MAX_RENDERS = 3
**Archivo**: `workflows/REYNA — Bot WhatsApp NUEVO.json`  
**Nodo**: `Validar Tema` (línea ~1332)  
**Cambio**:
```javascript
const MAX_RENDERS = 3; // Era 2
```

✅ **Estado**: Completado en archivo local

---

### Bug 4 — Mensaje "Ya generamos 3 versiones..."
**Archivo**: `workflows/REYNA — Bot WhatsApp NUEVO.json`  
**Nodo**: `Asistente Diseñador` (system prompt, línea ~1248)  
**Cambio**:
```
PASO 4 — ITERACIÓN (máximo 3 renders totales) [era 2]
Si ya usó 3 renders y pide otro: "Ya generamos 3 versiones del diseño..." [era 2]
```

✅ **Estado**: Completado en archivo local

---

## ⏳ Bugs Pendientes de Implementar

### Bug 2 — Verificar Proyecto no vacío antes de permitir render

**Propósito**: Si un cliente ya tiene un proyecto registrado (Proyecto != vacío), no debe poder hacer nuevo render. Protege contra rework innecesario.

**Implementación**:

#### Paso 1 — En **Asistente REYNA**
Modificar el system prompt para añadir:

```
## PROTECCIÓN: CLIENTE CON PROYECTO EXISTENTE

Si el contexto contiene "[CONTEXTO INTERNO: Proyecto ya existe]":
- No ofrezcas diseño nuevo
- Responde: "Veo que ya tenemos un proyecto en progreso para usted. 
  Nuestro equipo está trabajando en ello. ¿Hay algo que quiera ajustar del diseño actual?"
```

#### Paso 2 — En **Asistente Diseñador**
Añadir el mismo bloque al system prompt.

#### Paso 3 — Antes de ambos asistentes
Crear un nodo **"Leer Proyecto Cliente"** (Google Sheets read con filter):
- Lee `Base de datos` sheet
- Filtra por Teléfono = phoneNumber actual
- Extrae columna `Proyecto`
- Si no vacío → añade `[CONTEXTO INTERNO: Proyecto ya existe]` al chatInput del LLM

**Nodo a crear**:
```
Name: Leer Proyecto Cliente
Type: Google Sheets
Operation: Read
Filter: Teléfono = $('Extract Message').item.json.phoneNumber
```

---

### Bug 3 — Verificar Designer menú completo sesión 2

**Propósito**: Confirmar que en la segunda sesión del Diseñador, el LLM emite el PASO 1 completo (saludo + menú).

**Investigación necesaria**:

El nodo `Memory Diseñador` usa:
```javascript
sessionKey: phoneNumber + '-dise-' + inDesignerModeAt
```

Esto significa que cada vez que se entra a Designer (`inDesignerModeAt` timestamp), la sesión se reinicia → la Memory se limpia.

**Validación manual**:
1. Enviar mensaje 1 al Designer → debe saludar completo
2. Enviar mensaje 2 al Designer (misma sesión) → debe continuar contexto anterior
3. Enviar `/reset` o cerrar sesión (> 24h) → enviar mensaje al Designer de nueva sesión
4. Debe saludar de nuevo

**Checklist**:
- [ ] Test sesión 1 — saludo completo recibido ✓
- [ ] Test sesión 2 — contexto previo recordado ✓
- [ ] Test sesión 3 (después de reset/24h) — saludo nuevo recibido ✓

---

### Bug 5 — Log palabras bloqueadas en Sheet

**Propósito**: Registrar qué palabras el bot detecta como "bloqueadas" para auditoría y mejora de reglas.

**Estado actual**:
- `Validar Tema` ahora extrae `blockedWord` y devuelve `shouldLogBlockedWord = true`
- Falta: nodo que guarde en Sheet

**Implementación**:

#### Paso 1 — Crear IF node después de `Validar Tema`
```
Name: ¿Registrar Palabra Bloqueada?
Condition: shouldLogBlockedWord == true
True branch: → nodo Google Sheets
False branch: → continuación normal
```

#### Paso 2 — Google Sheets append node
```
Name: Guardar Palabra Bloqueada
Type: Google Sheets
Operation: Append
Sheet: "Palabras no admitidas"
Columns:
  - Palabra: {{ $json.blockedWord }}
  - Descripción: {{ $json.descriptionFurniture }}
  - Teléfono: {{ $json.phoneNumber }}
  - Timestamp: {{ Date.now() }}
  - Motivo: {{ $json.bypassReason }}
```

#### Paso 3 — Reconectar flujo
```
Validar Tema
  ↓
¿Registrar Palabra Bloqueada?
  ├─ TRUE → Guardar Palabra Bloqueada → ¿Render Válido?
  └─ FALSE → ¿Render Válido?
```

---

## 📋 Checklist de Implementación

### Fase 1 — Upload y validación en n8n
- [ ] Subir JSON actualizado a n8n (`ar3Ea99IYmhmtmAq`)
- [ ] Validar workflow sin errores críticos
- [ ] Confirmar Bug 1 + 4 reflejados en n8n

### Fase 2 — Bugs 2, 3, 5 en n8n UI
- [ ] Crear nodo "Leer Proyecto Cliente"
- [ ] Conectar antes de Asistente REYNA y Diseñador
- [ ] Crear IF + Google Sheets para Bug 5
- [ ] Verificar sesiones Designer (Bug 3)

### Fase 3 — Testing E2E
- [ ] Test caso 1 — Proyecto nuevo, 3 renders permitidos
- [ ] Test caso 2 — Proyecto existente, render bloqueado
- [ ] Test caso 3 — Palabra bloqueada registrada en Sheet
- [ ] Test caso 4 — Designer sesión 2 retiene contexto

### Fase 4 — Activación
- [ ] Documentar cambios en README.md
- [ ] Backup workflows pre-v0.10
- [ ] Desactivar Bipolar webhook
- [ ] Activar Reyna Bot

---

## 🔗 Referencias

- **Workflow**: `ar3Ea99IYmhmtmAq` (n8n)
- **Sheet**: `1M17krae73v3cS00tQTWV-kJcxo8k1txzXaR8mv0dA8c`
- **Sheets a usar**:
  - `Base de datos` (gid=1001783326) — verificar Proyecto
  - `Palabras no admitidas` — guardar bloqueadas

---

## 📝 Notas

1. **Bug 2 + Bug 3**: Requieren cambios en n8n UI (no JSON)
2. **Bug 5**: Puede implementarse con IF + Google Sheets append
3. **Testing**: Usar casos E2E definidos en `E2E_TEST_RESULTS.md`
4. **Desactivar /reset**: Eliminar antes de producción (línea Extract Message)
