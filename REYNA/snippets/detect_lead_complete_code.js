// ============================================================
// Detect Lead Complete — Parser unificado de tags
// Compatible con salida de Agente 1 (Recepcionista) y Agente 2 (Diseñador)
// Pegar en: REYNA — Bot WhatsApp → nodo "Detect Lead Complete" → jsCode
// ============================================================

const staticData = $getWorkflowStaticData('global');
const phoneNumber = $('Extract Message').item.json.phoneNumber;

// 1. Obtener el texto de salida del agente
const rawText = $json.output || $json.text || $json.message || '';

// 2. Inicializar flags de routing
let routeDesigner       = false;
let renderRequest       = false;
let descriptionFurniture = null;
let backToRecep         = false;
let humanHandoff        = false;
let leadComplete        = false;
let leadData            = null;
let galeriaCocinas      = false;
let galeriaClosets      = false;
let galeriaBares        = false;

// 3. Parseo de tags

// --- [ROUTE_DESIGNER] ---
if (rawText.includes('[ROUTE_DESIGNER]')) {
  routeDesigner = true;
  if (!staticData.inDesignerMode) staticData.inDesignerMode = {};
  if (!staticData.inDesignerModeAt) staticData.inDesignerModeAt = {};
  staticData.inDesignerMode[phoneNumber] = true;
  staticData.inDesignerModeAt[phoneNumber] = Date.now();
}

// --- [RENDER_REQUEST]...[/RENDER_REQUEST] ---
const renderMatch = rawText.match(/\[RENDER_REQUEST\]([\s\S]*?)\[\/RENDER_REQUEST\]/);
if (renderMatch) {
  renderRequest = true;
  descriptionFurniture = renderMatch[1].trim();
}

// --- [BACK_TO_RECEPCIONISTA] ---
if (rawText.includes('[BACK_TO_RECEPCIONISTA]')) {
  backToRecep = true;
}

// --- [HUMAN_HANDOFF] ---
if (rawText.includes('[HUMAN_HANDOFF]')) {
  humanHandoff = true;
}

// --- [LEAD_COMPLETE]{...}[/LEAD_COMPLETE] ---
const leadMatch = rawText.match(/\[LEAD_COMPLETE\]([\s\S]*?)\[\/LEAD_COMPLETE\]/);
if (leadMatch) {
  leadComplete = true;
  try {
    leadData = JSON.parse(leadMatch[1].trim());
    // Inyectar generatedImageUrl desde staticData si existe
    const renderData = staticData.renderData?.[phoneNumber];
    if (renderData?.generatedImageUrl) {
      leadData.generatedImageUrl = renderData.generatedImageUrl;
    } else {
      leadData.generatedImageUrl = null;
    }
  } catch (e) {
    leadData = { parseError: true, raw: leadMatch[1].trim() };
  }
}

// --- Galería ---
if (rawText.includes('[GALERIA_COCINAS]'))  galeriaCocinas = true;
if (rawText.includes('[GALERIA_CLOSETS]'))  galeriaClosets = true;
if (rawText.includes('[GALERIA_BARES]'))    galeriaBares   = true;

// 4. TTL de inDesignerMode (24h)
const modeAt = staticData.inDesignerModeAt?.[phoneNumber] || 0;
const expired = (Date.now() - modeAt) > 86400000;
if (expired && staticData.inDesignerMode?.[phoneNumber]) {
  staticData.inDesignerMode[phoneNumber] = false;
}

// 5. Limpiar el texto de todos los tags (para enviar al cliente)
const cleanText = rawText
  .replace(/\[ROUTE_DESIGNER\]/g, '')
  .replace(/\[RENDER_REQUEST\][\s\S]*?\[\/RENDER_REQUEST\]/g, '')
  .replace(/\[BACK_TO_RECEPCIONISTA\]/g, '')
  .replace(/\[HUMAN_HANDOFF\]/g, '')
  .replace(/\[LEAD_COMPLETE\][\s\S]*?\[\/LEAD_COMPLETE\]/g, '')
  .replace(/\[GALERIA_COCINAS\]/g, '')
  .replace(/\[GALERIA_CLOSETS\]/g, '')
  .replace(/\[GALERIA_BARES\]/g, '')
  .trim();

// 6. Retornar objeto con todos los campos para los IFs subsiguientes
return {
  routeDesigner,
  renderRequest,
  descriptionFurniture,
  backToRecep,
  humanHandoff,
  leadComplete,
  galeriaCocinas,
  galeriaClosets,
  galeriaBares,
  leadData,
  cleanText,
  phoneNumber,
  inDesignerMode: staticData.inDesignerMode?.[phoneNumber] === true,
  rawAgentText: rawText,
};
