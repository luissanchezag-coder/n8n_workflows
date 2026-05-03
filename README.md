# n8n Workflows — EST Studio

Backup versionado de los workflows de n8n productivo (`https://n8n.est-studio.co`).

## Estructura

```
n8n_workflows/
├── BIPOLAR/    # Workflows del cliente BIPOLAR
├── REYNA/      # Workflows del cliente REYNA
└── README.md
```

## Workflows actuales

| Cliente | Workflow | Active prod | ID n8n |
|---|---|---|---|
| BIPOLAR | Bot WhatsApp | ❌ | `Y2SJ2fB9APdgxadn` |
| BIPOLAR | Chatwoot WA Bridge | ✅ | `Qtv3cCoSuxJefl4n` |
| BIPOLAR | Limpiador de Leads | ✅ | `j0gIGkywVxzoyMkX` |
| REYNA | Bot WhatsApp | ✅ | `ar3Ea99IYmhmtmAq` |
| REYNA | Chatwoot WA Bridge | ❌ | `YQXUVjiBk4z9i30r` |
| REYNA | Limpiador de Leads | ✅ | `WfGYwyd89zU4rB7j` |

## Reglas de uso

**Fuente de verdad: n8n producción.** Este repo es un espejo, no la fuente.

- ✅ Editar workflows → en n8n UI o vía MCP/API
- ✅ Consultar historial / diff → aquí en GitHub
- ❌ NO editar JSONs aquí esperando que se apliquen — el sync es one-way (n8n → repo)

## Snapshot inicial

Snapshot tomado el 2026-05-03. Los JSONs están limpios de campos efímeros
(`id`, `versionId`, `shared`, `createdAt`, etc.) que rotan en cada cambio.

## Pendiente

- [ ] GitHub Action con cron para sync automático cada 6h desde n8n
- [ ] Decidir qué hacer con REYNA Chatwoot Bridge (inactivo en prod, ¿intencional?)
