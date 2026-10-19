import { supabase } from '../../supabase';
import { sanitizarYCapitalizar } from '../../utils/formato';

export const cargarProveedoresService = async () => {
  let todosLosProveedores = [];
  let desde = 0;
  let hasta = 999;
  let seguirCargando = true;

  while (seguirCargando) {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('fecha_registro', { ascending: false })
      .order('id', { ascending: true })
      .range(desde, hasta);

    if (error) {
      console.error("Error al cargar proveedores:", error);
      break;
    }

    if (data && data.length > 0) {
      todosLosProveedores = [...todosLosProveedores, ...data];
      if (data.length < 1000) {
        seguirCargando = false; 
      } else {
        desde += 1000;
        hasta += 1000;
      }
    } else {
      seguirCargando = false;
    }
  }
  return todosLosProveedores;
};

export const verificarDuplicadoProveedorService = async (rutLimpio) => {
  return await supabase.rpc('verificar_duplicado_proveedor', { p_rut: rutLimpio });
};

export const insertarProveedoresService = async (registrosAInsertar) => {
  return await supabase.from('proveedores').insert(registrosAInsertar);
};

export const actualizarProveedorService = async (proveedorEditando, zonasFinales) => {
  return await supabase.from('proveedores').update({
    razon_social: sanitizarYCapitalizar(proveedorEditando.razon_social), 
    nombre_fantasia: sanitizarYCapitalizar(proveedorEditando.nombre_fantasia),
    rut: proveedorEditando.rut.replace(/[<>]/g, ''), 
    domicilio_comercial: sanitizarYCapitalizar(proveedorEditando.domicilio_comercial),
    categoria: proveedorEditando.categoria, 
    subcategoria: proveedorEditando.subcategoria,
    email_principal: proveedorEditando.email_principal.replace(/[<>]/g, '').toLowerCase().trim(), 
    email_secundario: proveedorEditando.email_secundario ? proveedorEditando.email_secundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
    nombre_contacto: sanitizarYCapitalizar(proveedorEditando.nombre_contacto), 
    cargo: sanitizarYCapitalizar(proveedorEditando.cargo),
    telefono: proveedorEditando.telefono.replace(/[<>]/g, '').trim(), 
    zonas_cobertura: zonasFinales.join(', '), 
    website: proveedorEditando.website.replace(/[<>]/g, '').trim()
  }).eq('id', proveedorEditando.id);
};

export const cambiarEstadoProveedorService = async (id, estado, aprobado_por = null, fecha_aprobacion = null) => {
  const payload = { estado };
  if (aprobado_por !== null) payload.aprobado_por = aprobado_por;
  if (fecha_aprobacion !== null) payload.fecha_aprobacion = fecha_aprobacion;
  return await supabase.from('proveedores').update(payload).eq('id', id);
};

// Actualiza TODOS los registros (todas las categorías/subcategorías) de uno o varios proveedores según su RUT
export const marcarProveedoresActualizadosPorRutService = async (rutsArray, fechaActual) => {
  return await supabase
    .from('proveedores')
    .update({ fecha_registro: fechaActual })
    .in('rut', rutsArray);
};

export const eliminarProveedorService = async (id) => {
  return await supabase.from('proveedores').delete().eq('id', id);
};