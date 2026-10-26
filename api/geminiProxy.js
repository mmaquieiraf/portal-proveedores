import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No autorizado.' });
    const token = authHeader.replace('Bearer ', '').trim();

    // Soporta tanto VITE_SUPABASE_ANON_KEY como VITE_SUPABASE_PUBLISHABLE_KEY o SUPABASE_ANON_KEY
    const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
    const supabaseKey = (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ''
    ).trim();

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: 'Configuración incompleta en Vercel: Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.' });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Validamos token si existe una sesión JWT válida de Supabase Auth
    if (token && token !== 'null' && token !== 'undefined') {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !user) {
        console.warn('Aviso: Token de Supabase Auth no activo, continuando con sesión interna del portal.');
      }
    }

    const serverApiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
    if (!serverApiKey) {
      return res.status(400).json({ error: 'Falta configurar la variable GEMINI_API_KEY en Vercel.' });
    }

    const { payload } = req.body;
    if (!payload || !payload.contents || !payload.contents[0]) {
      return res.status(400).json({ error: 'Payload inválido para el servicio de IA.' });
    }
    
    // --- BODEGA DE TRÁNSITO: RECOGER Y CONVERTIR ARCHIVOS ---
    const contents = payload.contents[0];
    const resolvedParts = [];

    for (const part of (contents.parts || [])) {
      if (part.text) {
        resolvedParts.push({ text: part.text });
      } else if (part.inlineData) {
        resolvedParts.push({ inlineData: part.inlineData });
      } else if (part.storagePath) {
        // 1. Descargamos el archivo pesado desde Supabase
        const { data: fileData, error: downloadError } = await supabaseClient.storage.from('archivos_ia').download(part.storagePath);
        if (downloadError) throw new Error("Error descargando archivo de tránsito.");
        
        // 2. Lo convertimos a formato legible para la IA en la memoria del servidor
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        resolvedParts.push({ inlineData: { mimeType: part.mimeType, data: base64Data } });
        
        // 3. Destruimos el archivo de Supabase para mantener tu almacenamiento en cero
        await supabaseClient.storage.from('archivos_ia').remove([part.storagePath]);
      }
    }

    // Normalización segura de systemInstruction para la API REST v1beta de Gemini
    let normalizedSystemInstruction = undefined;
    if (payload.systemInstruction) {
      if (typeof payload.systemInstruction === 'string') {
        normalizedSystemInstruction = { parts: [{ text: payload.systemInstruction }] };
      } else if (payload.systemInstruction.parts) {
        normalizedSystemInstruction = payload.systemInstruction;
      } else if (payload.systemInstruction.text) {
        normalizedSystemInstruction = { parts: [{ text: payload.systemInstruction.text }] };
      }
    }

    const finalPayload = {
      ...(normalizedSystemInstruction ? { systemInstruction: normalizedSystemInstruction } : {}),
      contents: [{ role: 'user', parts: resolvedParts }]
    };
    // --------------------------------------------------------

    // Modelos vigentes soportados en v1beta para generateContent
    const modelosDisponibles = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro'
    ];

    let erroresPorModelo = [];

    for (const modelo of modelosDisponibles) {
      try {
        const respuestaApi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${serverApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload)
        });
        
        const datosRecibidos = await respuestaApi.json();

        if (respuestaApi.status === 429 || respuestaApi.status === 503) {
          erroresPorModelo.push(`${modelo}: saturado (${respuestaApi.status})`);
          continue;
        }

        if (!respuestaApi.ok) {
          const msg = datosRecibidos.error?.message || `Error HTTP ${respuestaApi.status}`;
          erroresPorModelo.push(`${modelo}: ${msg}`);
          continue;
        }

        const textoGenerado = datosRecibidos?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textoGenerado) {
          erroresPorModelo.push(`${modelo}: respuesta vacía`);
          continue;
        }
        
        return res.status(200).json({ text: textoGenerado });
      } catch (errInterno) {
        erroresPorModelo.push(`${modelo}: ${errInterno.message}`);
        console.error(errInterno);
      }
    }

    throw new Error(erroresPorModelo[0] || "Alta demanda en servidores gratuitos.");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}