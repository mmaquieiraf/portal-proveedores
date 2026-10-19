import { useState } from 'react';
import { cargarProveedoresService, verificarDuplicadoProveedorService, insertarProveedoresService, actualizarProveedorService, cambiarEstadoProveedorService, marcarProveedorActualizadoService, eliminarProveedorService } from '../../../services/supabase/proveedoresService';
import { registrarAuditoriaProvService } from '../../../services/supabase/auditoriaYAdminService';
import { validarRUT, sanitizarYCapitalizar } from '../../../utils/formato';

const normalizarComparacion = (texto) => {
  if (!texto) return '';
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const useProveedores = (usuarioActual, categoriasDinamicas) => {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [formData, setFormData] = useState({
    razonSocial: '', nombreFantasia: '', rut: '', domicilio: '',
    categoria: [], subcategoria: [], emailPrincipal: '', emailSecundario: '',
    contacto: '', cargo: '', telefono: '', zonasCobertura: [], terminos: false,
    poseeWebsite: 'si',
    websiteUrl: ''
  });

  const [filtroRut, setFiltroRut] = useState(''); 
  const [filtroNombre, setFiltroNombre] = useState(''); 
  const [filtroCategoria, setFiltroCategoria] = useState(''); 
  const [filtroSubcategoria, setFiltroSubcategoria] = useState(''); 
  const [filtroExportarZona, setFiltroExportarZona] = useState([]); 
  const [seleccionados, setSeleccionados] = useState([]);

  const [filtroGestionNombre, setFiltroGestionNombre] = useState('');
  const [filtroGestionCat, setFiltroGestionCat] = useState('');
  const [filtroGestionSub, setFiltroGestionSub] = useState('');
  const [filtroGestionZona, setFiltroGestionZona] = useState('');

  const [filtroPendienteRutRazon, setFiltroPendienteRutRazon] = useState('');
  const [filtroPendienteCatSubcat, setFiltroPendienteCatSubcat] = useState('');

  const cargarProveedores = async () => {
    const todosLosProveedores = await cargarProveedoresService();
    setProveedores(todosLosProveedores);
  };

  const aprobarProveedor = async (prov) => {
    if(!window.confirm("¿Aprobar este proveedor?")) return;
    const { error } = await cambiarEstadoProveedorService(prov.id, 'Aprobado', usuarioActual.usuario, new Date().toISOString());
    if (!error) { await registrarAuditoriaProvService(prov.rut, prov.razon_social, 'Aprobación', `Aprobado para ${prov.categoria} -> ${prov.subcategoria}`, usuarioActual.usuario); cargarProveedores(); }
  };

  const revocarProveedor = async (prov) => {
    if(!window.confirm("¿Cambiar el estado de este proveedor a Pendiente?")) return;
    const { error } = await cambiarEstadoProveedorService(prov.id, 'Pendiente', null, null);
    if (!error) { await registrarAuditoriaProvService(prov.rut, prov.razon_social, 'Revocación', `Devuelto a pendientes`, usuarioActual.usuario); cargarProveedores(); }
  };

  const rechazarProveedor = async (prov) => {
    if(!window.confirm("¿Rechazar y ELIMINAR a este proveedor?")) return;
    const { error } = await eliminarProveedorService(prov.id);
    if (!error) { await registrarAuditoriaProvService(prov.rut, prov.razon_social, 'Eliminación', `Proveedor eliminado del sistema`, usuarioActual.usuario); cargarProveedores(); }
  };

  // NUEVA FUNCIÓN: Marca al proveedor como actualizado y lo retira de la ventana de >90 días
  const marcarProveedorActualizado = async (prov) => {
    if(!window.confirm(`¿Confirmar que los datos de "${prov.razon_social}" (${prov.categoria} - ${prov.subcategoria}) están actualizados?`)) return;
    const { error } = await marcarProveedorActualizadoService(prov.id, new Date().toISOString());
    if (!error) {
      await registrarAuditoriaProvService(
        prov.rut,
        prov.razon_social,
        'Actualización >90 días',
        `Validado como actualizado (${prov.categoria} -> ${prov.subcategoria})`,
        usuarioActual?.usuario || 'Admin'
      );
      cargarProveedores();
    } else {
      alert("⚠️ Ocurrió un error al marcar el registro como actualizado.");
    }
  };

  const abrirEditorProveedor = (prov) => {
    const zonasArr = prov.zonas_cobertura ? prov.zonas_cobertura.split(',').map(z => z.trim()) : [];
    setProveedorEditando({ ...prov, zonas_cobertura_arr: zonasArr, website: prov.website || 'No posee' });
  };

  const guardarEdicionProveedor = async (e) => {
    e.preventDefault();
    if (!validarRUT(proveedorEditando.rut)) return alert("El RUT no es válido.");
    if (proveedorEditando.zonas_cobertura_arr.length === 0) return alert("Seleccione al menos una Zona.");
    let zonasFinales = proveedorEditando.zonas_cobertura_arr;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];
    
    const { error } = await actualizarProveedorService(proveedorEditando, zonasFinales);
    if (!error) { await registrarAuditoriaProvService(proveedorEditando.rut, proveedorEditando.razon_social, 'Edición', `Ficha editada`, usuarioActual.usuario); alert("✅ Actualizado."); setProveedorEditando(null); cargarProveedores(); }
  };

  const manejarCambioZona = (zona, checked, isEdit = false) => {
    if (isEdit) {
      let nuevasZonas = [...proveedorEditando.zonas_cobertura_arr];
      if (checked) nuevasZonas.push(zona); else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setProveedorEditando({ ...proveedorEditando, zonas_cobertura_arr: nuevasZonas });
    } else {
      let nuevasZonas = [...formData.zonasCobertura];
      if (checked) nuevasZonas.push(zona); else nuevasZonas = nuevasZonas.filter(z => z !== zona);
      setFormData({ ...formData, zonasCobertura: nuevasZonas });
    }
  };

  const manejarCambioCategoria = (cat, checked) => {
    let nuevasCat = [...formData.categoria]; let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasCat.push(cat);
    else {
      nuevasCat = nuevasCat.filter(c => c !== cat);
      const subsParaRemover = categoriasDinamicas[cat] || [];
      nuevasSub = nuevasSub.filter(s => {
        if (!subsParaRemover.includes(s)) return true;
        return nuevasCat.some(otraCat => (categoriasDinamicas[otraCat] || []).includes(s));
      });
    }
    setFormData({ ...formData, categoria: nuevasCat, subcategoria: nuevasSub });
  };

  const manejarCambioSubcategoria = (sub, checked) => {
    let nuevasSub = [...formData.subcategoria];
    if (checked) nuevasSub.push(sub); else nuevasSub = nuevasSub.filter(s => s !== sub);
    setFormData({ ...formData, subcategoria: nuevasSub });
  };

  const manejarEnvioRegistro = async (e) => {
    e.preventDefault();
    if (!validarRUT(formData.rut)) return alert("El RUT ingresado no es válido.");
    if (formData.categoria.length === 0) return alert("Debe seleccionar al menos una Categoría.");
    if (formData.subcategoria.length === 0) return alert("Debe seleccionar al menos una Subcategoría.");
    if (formData.zonasCobertura.length === 0) return alert("Debe seleccionar al menos una Zona de Cobertura.");
    
    if (formData.poseeWebsite === 'si' && formData.websiteUrl.trim() === '') {
      return alert("El enlace del sitio web es obligatorio al indicar que posee uno.");
    }

    let zonasFinales = formData.zonasCobertura;
    if (zonasFinales.includes("Todo el País")) zonasFinales = ["Todo el País"];

    const rutLimpio = formData.rut.replace(/[<>]/g, '');
    const { data: existentes, error: rpcError } = await verificarDuplicadoProveedorService(rutLimpio);
    if (rpcError) console.error("Error al verificar duplicados:", rpcError);

    const websiteFinal = formData.poseeWebsite === 'si' 
      ? formData.websiteUrl.replace(/[<>]/g, '').trim().toLowerCase() 
      : 'No posee';

    const registrosAInsertar = [];
    const duplicadosEncontrados = [];

    formData.subcategoria.forEach(sub => {
      const categoriasCoincidentes = formData.categoria.filter(cat => (categoriasDinamicas[cat] || []).includes(sub));
      const categoriasFinales = categoriasCoincidentes.length > 0 
        ? categoriasCoincidentes 
        : [Object.keys(categoriasDinamicas).find(key => (categoriasDinamicas[key] || []).includes(sub))].filter(Boolean);

      categoriasFinales.forEach(catAsociada => {
        const yaExiste = existentes?.some(ex => 
          normalizarComparacion(ex.categoria) === normalizarComparacion(catAsociada) && 
          normalizarComparacion(ex.subcategoria) === normalizarComparacion(sub)
        );
        if (yaExiste) {
          duplicadosEncontrados.push(`${catAsociada} -> ${sub}`);
        } else {
          registrosAInsertar.push({
            razon_social: sanitizarYCapitalizar(formData.razonSocial),
            nombre_fantasia: sanitizarYCapitalizar(formData.nombreFantasia),
            rut: rutLimpio,
            domicilio_comercial: sanitizarYCapitalizar(formData.domicilio),
            categoria: catAsociada,
            subcategoria: sub,       
            email_principal: formData.emailPrincipal.replace(/[<>]/g, '').toLowerCase().trim(), 
            email_secundario: formData.emailSecundario ? formData.emailSecundario.replace(/[<>]/g, '').toLowerCase().trim() : '',
            nombre_contacto: sanitizarYCapitalizar(formData.contacto),
            cargo: sanitizarYCapitalizar(formData.cargo),
            telefono: formData.telefono.replace(/[<>]/g, '').trim(),
            zonas_cobertura: zonasFinales.join(', '), 
            website: websiteFinal,
            terminos_aceptados: formData.terminos,
            estado: 'Pendiente'
          });
        }
      });
    });

    if (duplicadosEncontrados.length > 0) { alert(`❌ ATENCIÓN: El RUT ya se encuentra registrado para las siguientes subcategorías:\n\n${duplicadosEncontrados.join('\n')}\n\nPor favor, desmárquelas para poder continuar.`); return; }
    if (registrosAInsertar.length > 0) {
      const { error } = await insertarProveedoresService(registrosAInsertar);
      if (error) alert("⚠️ Error de sistema."); else { alert(`✅ Registro enviado con éxito.`); window.location.reload(); }
    }
  };

  const toggleSeleccion = (id) => setSeleccionados(seleccionados.includes(id) ? seleccionados.filter(i => i !== id) : [...seleccionados, id]);
  
  const proveedoresAprobados = proveedores.filter(p => normalizarComparacion(p.estado) === 'aprobado');

  const proveedoresFiltrados = proveedoresAprobados.filter(p => {
    const rutProv = normalizarComparacion(p.rut);
    const nombreProv = `${normalizarComparacion(p.nombre_fantasia)} ${normalizarComparacion(p.razon_social)}`;
    const catProv = normalizarComparacion(p.categoria);
    const subProv = normalizarComparacion(p.subcategoria);

    const matchRut = filtroRut.trim() === '' || rutProv.includes(normalizarComparacion(filtroRut));
    const matchNombre = filtroNombre.trim() === '' || nombreProv.includes(normalizarComparacion(filtroNombre));
    const matchCat = filtroCategoria === '' || catProv === normalizarComparacion(filtroCategoria);
    const matchSub = filtroSubcategoria === '' || subProv === normalizarComparacion(filtroSubcategoria);

    let matchZona = true;
    if (filtroExportarZona.length > 0) {
      const zProv = p.zonas_cobertura ? p.zonas_cobertura.split(',').map(z => normalizarComparacion(z)) : [];
      matchZona = filtroExportarZona.some(fz => 
        zProv.includes(normalizarComparacion(fz)) || zProv.includes(normalizarComparacion('Todo el País'))
      );
    }
    return matchRut && matchNombre && matchCat && matchSub && matchZona;
  });

  const toggleSeleccionarTodo = (e) => setSeleccionados(e.target.checked ? proveedoresFiltrados.map(p => p.id) : []);

  const proveedoresGestionFiltrados = proveedores.filter(p => {
    if (normalizarComparacion(p.estado) !== 'aprobado') return false;
    const textoEmpresa = `${normalizarComparacion(p.nombre_fantasia)} ${normalizarComparacion(p.razon_social)} ${normalizarComparacion(p.rut)}`;
    const matchNombre = filtroGestionNombre.trim() === '' || textoEmpresa.includes(normalizarComparacion(filtroGestionNombre));
    const matchCat = filtroGestionCat === '' || normalizarComparacion(p.categoria) === normalizarComparacion(filtroGestionCat);
    const matchSub = filtroGestionSub === '' || normalizarComparacion(p.subcategoria) === normalizarComparacion(filtroGestionSub);
    const matchZona = filtroGestionZona === '' || (p.zonas_cobertura ? normalizarComparacion(p.zonas_cobertura).includes(normalizarComparacion(filtroGestionZona)) : true);
    return matchNombre && matchCat && matchSub && matchZona;
  });

  const proveedoresPendientesFiltrados = proveedores.filter(p => {
    if (normalizarComparacion(p.estado) !== 'pendiente') return false;
    const infoIdentidad = `${normalizarComparacion(p.rut)} ${normalizarComparacion(p.razon_social)} ${normalizarComparacion(p.nombre_fantasia)}`;
    const infoCategoria = `${normalizarComparacion(p.categoria)} ${normalizarComparacion(p.subcategoria)}`;
    
    const matchRutRazon = infoIdentidad.includes(normalizarComparacion(filtroPendienteRutRazon));
    const matchCatSub = infoCategoria.includes(normalizarComparacion(filtroPendienteCatSubcat));
    
    return matchRutRazon && matchCatSub;
  });

  return {
    proveedores, cargarProveedores, proveedorEditando, setProveedorEditando,
    formData, setFormData, filtroRut, setFiltroRut, filtroNombre, setFiltroNombre,
    filtroCategoria, setFiltroCategoria, filtroSubcategoria, setFiltroSubcategoria,
    filtroExportarZona, setFiltroExportarZona, seleccionados, setSeleccionados,
    filtroGestionNombre, setFiltroGestionNombre, filtroGestionCat, setFiltroGestionCat,
    filtroGestionSub, setFiltroGestionSub, filtroGestionZona, setFiltroGestionZona,
    
    filtroPendienteRutRazon, setFiltroPendienteRutRazon,
    filtroPendienteCatSubcat, setFiltroPendienteCatSubcat,
    proveedoresPendientesFiltrados,

    aprobarProveedor, revocarProveedor, rechazarProveedor, marcarProveedorActualizado,
    abrirEditorProveedor, guardarEdicionProveedor, manejarCambioZona, manejarCambioCategoria,
    manejarCambioSubcategoria, manejarEnvioRegistro, toggleSeleccion,
    proveedoresAprobados, proveedoresFiltrados, toggleSeleccionarTodo, proveedoresGestionFiltrados
  };
};