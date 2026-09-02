import React, { useState, useEffect } from 'react';
import { categoriasSodimacCompiladas, nuevasSubcategorias } from './utils/constantes';
import { sanitizarYCapitalizar } from './utils/formato';

// Hooks de Seguridad y Proceso (Alineados a tu estructura real en features/auth/hooks/)
import { useSecurityLock } from './features/auth/hooks/useSecurityLock';
import { useInactivityTimer } from './features/auth/hooks/useInactivityTimer';
import { useAuthProcess } from './features/auth/hooks/useAuthProcess';
import { useProveedores } from './features/auth/hooks/useProveedores';
import { useProcesos } from './features/auth/hooks/useProcesos';
import { useAdmin } from './features/auth/hooks/useAdmin';

// Servicios y Supabase
import { signOutService } from './services/supabase/authService';
import { exportarProcesosExcel, descargarPlantillaProcesos, exportarProveedoresCSV, exportarProveedoresExcel } from './services/export/excelExportService';
import { supabase } from './supabase'; // IMPORTACIÓN AÑADIDA PARA SINCRONIZAR

// Componentes
import Navbar from './components/layout/Navbar';
import ModalTerminos from './components/shared/ModalTerminos';
import ModalAuditoria from './components/shared/ModalAuditoria';
import TabMenu from './components/shared/TabMenu';
import PreLogin from './features/auth/PreLogin';
import Login from './features/auth/Login';
import RecuperarClave from './features/auth/RecuperarClave';
import RegistroPublico from './features/proveedores/RegistroPublico';
import AdminPendientes from './features/proveedores/AdminPendientes';
import AdminGestion from './features/proveedores/AdminGestion';
import ModalEdicionProveedor from './features/proveedores/ModalEdicionProveedor';
import PanelProcesos from './features/procesos/PanelProcesos';
import ModalProceso from './features/procesos/ModalProceso';
import ConfiguracionDocs from './features/admin/ConfiguracionDocs';
import DashboardStats from './features/admin/DashboardStats';
import GestionUsuarios from './features/admin/GestionUsuarios';
import ModalEdicionAdmin from './features/admin/ModalEdicionAdmin';
import PanelExportar from './features/exportacion/PanelExportar';
import GeneradorRFP from './generators/GeneradorRFP';
import GeneradorRFQ from './generators/GeneradorRFQ';
import GeneradorFT from './generators/GeneradorFT';

export default function App() {
  const [vista, setVista] = useState('registro'); 
  const [tabAdmin, setTabAdmin] = useState('dashboard');
  const [mostrarTerminos, setMostrarTerminos] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  // 1. Inicializa con compilado duro, pero se actualizará desde la nube enseguida
  const [categoriasDinamicas, setCategoriasDinamicas] = useState(categoriasSodimacCompiladas);
  const [nuevaCatInput, setNuevaCatInput] = useState('');
  const [nuevasSubInputs, setNuevasSubInputs] = useState({});

  const { bloqueoSeguridad, intentosFallidos, registrarIntentoFallido, resetearIntentos } = useSecurityLock();
  
  useInactivityTimer(usuarioActual, async () => {
    await signOutService();
    setUsuarioActual(null);
    setVista('login');
    alert("🔒 Por tu seguridad, la sesión se ha cerrado automáticamente tras 20 minutos de inactividad.");
  });

  const {
    administradoresDb, nuevoAdmin, setNuevoAdmin, adminEditando, setAdminEditando,
    cargarAdministradores, crearAdministrador, eliminarAdmin, guardarEdicionAdmin,
    mostrarModalAuditoria, setMostrarModalAuditoria, logsAuditoriaProv,
    logsAuditoria, cargarLogsAuditoriaProv, cargarLogsAuditoria
  } = useAdmin(usuarioActual);

  // EXTRAEMOS LOS NUEVOS PROPS DEL HOOK DE PROVEEDORES
  const {
    proveedores, cargarProveedores, proveedorEditando, setProveedorEditando, formData, setFormData,
    filtroRut, setFiltroRut, filtroNombre, setFiltroNombre, filtroCategoria, setFiltroCategoria,
    filtroSubcategoria, setFiltroSubcategoria, filtroExportarZona, setFiltroExportarZona, seleccionados, setSeleccionados,
    filtroGestionNombre, setFiltroGestionNombre, filtroGestionCat, setFiltroGestionCat,
    filtroGestionSub, setFiltroGestionSub, filtroGestionZona, setFiltroGestionZona,
    
    // Filtros de la pestaña pendientes que agregamos antes
    filtroPendienteRutRazon, setFiltroPendienteRutRazon,
    filtroPendienteCatSubcat, setFiltroPendienteCatSubcat,
    proveedoresPendientesFiltrados,

    aprobarProveedor, revocarProveedor, rechazarProveedor, abrirEditorProveedor,
    guardarEdicionProveedor, manejarCambioZona, manejarCambioCategoria,
    manejarCambioSubcategoria, manejarEnvioRegistro, toggleSeleccion, proveedoresAprobados,
    proveedoresFiltrados, toggleSeleccionarTodo, proveedoresGestionFiltrados
  } = useProveedores(usuarioActual, categoriasDinamicas);

  const {
    procesos, cargarProcesos, modalProceso, setModalProceso, procesoActual, setProcesoActual,
    filtroProcesosController, setFiltroProcesosController, filtroProcesosEstado, setFiltroProcesosEstado,
    filtroProcesosMesAno, setFiltroProcesosMesAno, filtroDocsEmitidos, setFiltroDocsEmitidos,
    guardarProceso, eliminarProceso, marcarAcuerdoFinalizado, abrirNuevoProcesoConSeleccionados,
    editarProceso, removerProveedorInvitado, agregarProveedorInvitado, removerProveedorAdjudicado,
    agregarProveedorAdjudicado, handleDetalleAdjudicacionChange, manejarCargaMasivaProcesos,
    controllersUnicos, mesesAnosUnicos, procesosFiltradosDashboard, totalBaselineProcesos,
    procesosRecuentoCount, countSpot, countAnualizado, ahorroTotalProcesos, ahorroPorcentajeProcesos,
    procesosConAlertaFinalizacion, alertasContratos, alertasRenovacion, totalMontoAdjudicadoKpi
  } = useProcesos(usuarioActual, proveedoresFiltrados, seleccionados, setTabAdmin);

  const {
    preLoginPin, setPreLoginPin, credenciales, setCredenciales, resetStep, resetData, setResetData,
    manejarPreLogin, manejarLogin, buscarCorreo, actualizarPassword
  } = useAuthProcess({
    bloqueoSeguridad, intentosFallidos, registrarIntentoFallido, resetearIntentos,
    setVista, setUsuarioActual, cargarProveedores, cargarProcesos, cargarAdministradores
  });

  // ===============================================================
  // LÓGICA DE SINCRONIZACIÓN EN LA NUBE (REEMPLAZA A LOCALSTORAGE)
  // ===============================================================

  // A. Carga inicial desde Supabase al entrar a la página
  useEffect(() => {
    const fetchCategoriasNube = async () => {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('categorias')
        .eq('id', 1)
        .single();
      
      if (!error && data && Object.keys(data.categorias).length > 0) {
        setCategoriasDinamicas(data.categorias);
      }
    };
    fetchCategoriasNube();
  }, []);

  // B. Función para actualizar el estado y subir a la nube
  const sincronizarConNube = async (nuevasCategorias) => {
    setCategoriasDinamicas(nuevasCategorias); // Actualiza UI de inmediato
    
    // Impacta la nube para el resto de usuarios
    const { error } = await supabase
      .from('configuracion_sistema')
      .update({ categorias: nuevasCategorias })
      .eq('id', 1);
      
    if (error) {
      console.error("Fallo al guardar en la nube:", error);
      alert("⚠️ Hubo un problema sincronizando las categorías con el servidor general.");
    }
  };

  // C. Manejadores actualizados
  const handleAgregarCategoria = (e) => { 
    e.preventDefault(); 
    const cat = sanitizarYCapitalizar(nuevaCatInput); 
    if(cat && !categoriasDinamicas[cat]) { 
      sincronizarConNube({...categoriasDinamicas, [cat]: []}); 
      setNuevaCatInput(''); 
    } 
  };
  
  const handleEliminarCategoria = (cat) => { 
    if(window.confirm(`¿Eliminar "${cat}"?`)) { 
      const copia = {...categoriasDinamicas}; 
      delete copia[cat]; 
      sincronizarConNube(copia); 
    } 
  };
  
  const handleAgregarSubcategoria = (e, cat) => { 
    e.preventDefault(); 
    const sub = sanitizarYCapitalizar(nuevasSubInputs[cat]); 
    if(sub && !categoriasDinamicas[cat].includes(sub)) { 
      sincronizarConNube({ ...categoriasDinamicas, [cat]: [...categoriasDinamicas[cat], sub] }); 
      setNuevasSubInputs({...nuevasSubInputs, [cat]: ''}); 
    } 
  };
  
  const handleEliminarSubcategoria = (cat, sub) => { 
    if(window.confirm(`¿Eliminar "${sub}"?`)) {
      sincronizarConNube({ ...categoriasDinamicas, [cat]: categoriasDinamicas[cat].filter(s => s !== sub) });
    }
  };

  useEffect(() => { if (tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl') cargarLogsAuditoria(); }, [tabAdmin, usuarioActual]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      <Navbar usuarioActual={usuarioActual} vista={vista} setVista={setVista} setTabAdmin={setTabAdmin} setUsuarioActual={setUsuarioActual} />
      
      {mostrarModalAuditoria && <ModalAuditoria setMostrarModalAuditoria={setMostrarModalAuditoria} logsAuditoriaProv={logsAuditoriaProv} />}
      <ModalProceso modalProceso={modalProceso} setModalProceso={setModalProceso} procesoActual={procesoActual} setProcesoActual={setProcesoActual} guardarProceso={guardarProceso} removerProveedorInvitado={removerProveedorInvitado} proveedoresAprobados={proveedoresAprobados} agregarProveedorInvitado={agregarProveedorInvitado} removerProveedorAdjudicado={removerProveedorAdjudicado} agregarProveedorAdjudicado={agregarProveedorAdjudicado} handleDetalleAdjudicacionChange={handleDetalleAdjudicacionChange} />
      <ModalEdicionProveedor proveedorEditando={proveedorEditando} setProveedorEditando={setProveedorEditando} guardarEdicionProveedor={guardarEdicionProveedor} manejarCambioZona={manejarCambioZona} categoriasDinamicas={categoriasDinamicas} bloqueoSeguridad={bloqueoSeguridad} />
      <ModalEdicionAdmin adminEditando={adminEditando} setAdminEditando={setAdminEditando} guardarEdicionAdmin={guardarEdicionAdmin} bloqueoSeguridad={bloqueoSeguridad} />
      {mostrarTerminos && <ModalTerminos setMostrarTerminos={setMostrarTerminos} />}

      {vista === 'registro' && <RegistroPublico formData={formData} setFormData={setFormData} manejarEnvioRegistro={manejarEnvioRegistro} categoriasDinamicas={categoriasDinamicas} manejarCambioCategoria={manejarCambioCategoria} manejarCambioSubcategoria={manejarCambioSubcategoria} manejarCambioZona={manejarCambioZona} setMostrarTerminos={setMostrarTerminos} bloqueoSeguridad={bloqueoSeguridad} />}
      {vista === 'pre_login' && <PreLogin preLoginPin={preLoginPin} setPreLoginPin={setPreLoginPin} manejarPreLogin={manejarPreLogin} bloqueoSeguridad={bloqueoSeguridad} setVista={setVista} />}
      {vista === 'login' && <Login credenciales={credenciales} setCredenciales={setCredenciales} manejarLogin={manejarLogin} bloqueoSeguridad={bloqueoSeguridad} setVista={setVista} />}
      {vista === 'recuperar' && <RecuperarClave resetStep={resetStep} resetData={resetData} setResetData={setResetData} buscarCorreo={buscarCorreo} actualizarPassword={actualizarPassword} bloqueoSeguridad={bloqueoSeguridad} setVista={setVista} />}

      {vista === 'panel' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <TabMenu tabAdmin={tabAdmin} setTabAdmin={setTabAdmin} usuarioActual={usuarioActual} cargarProcesos={cargarProcesos} cargarLogsAuditoria={cargarLogsAuditoria} setSeleccionados={setSeleccionados} />
          
          {tabAdmin === 'dashboard' && <DashboardStats proveedores={proveedores} proveedoresAprobados={proveedoresAprobados} categoriasDinamicas={categoriasDinamicas} />}
          
          {/* SECCIÓN ACTUALIZADA CON LOS NUEVOS PROPS Y LA LISTA FILTRADA */}
          {tabAdmin === 'pendientes' && (
            <AdminPendientes 
              proveedoresPendientesFiltrados={proveedoresPendientesFiltrados} 
              cargarProveedores={cargarProveedores} 
              aprobarProveedor={aprobarProveedor} 
              abrirEditorProveedor={abrirEditorProveedor} 
              rechazarProveedor={rechazarProveedor}
              filtroPendienteRutRazon={filtroPendienteRutRazon}
              setFiltroPendienteRutRazon={setFiltroPendienteRutRazon}
              filtroPendienteCatSubcat={filtroPendienteCatSubcat}
              setFiltroPendienteCatSubcat={setFiltroPendienteCatSubcat}
            />
          )}

          {tabAdmin === 'gestion' && <AdminGestion proveedoresGestionFiltrados={proveedoresGestionFiltrados} cargarProveedores={cargarProveedores} cargarLogsAuditoriaProv={cargarLogsAuditoriaProv} setMostrarModalAuditoria={setMostrarModalAuditoria} filtroGestionNombre={filtroGestionNombre} setFiltroGestionNombre={setFiltroGestionNombre} filtroGestionCat={filtroGestionCat} setFiltroGestionCat={setFiltroGestionCat} filtroGestionSub={filtroGestionSub} setFiltroGestionSub={setFiltroGestionSub} filtroGestionZona={filtroGestionZona} setFiltroGestionZona={setFiltroGestionZona} categoriasDinamicas={categoriasDinamicas} abrirEditorProveedor={abrirEditorProveedor} revocarProveedor={revocarProveedor} rechazarProveedor={rechazarProveedor} />}
          {tabAdmin === 'actualizacion_form' && <ConfiguracionDocs categoriasDinamicas={categoriasDinamicas} nuevaCatInput={nuevaCatInput} setNuevaCatInput={setNuevaCatInput} handleAgregarCategoria={handleAgregarCategoria} handleEliminarCategoria={handleEliminarCategoria} nuevasSubInputs={nuevasSubInputs} setNuevasSubInputs={setNuevasSubInputs} handleAgregarSubcategoria={handleAgregarSubcategoria} handleEliminarSubcategoria={handleEliminarSubcategoria} />}
          {tabAdmin === 'exportar' && <PanelExportar filtroRut={filtroRut} setFiltroRut={setFiltroRut} filtroNombre={filtroNombre} setFiltroNombre={setFiltroNombre} filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria} filtroSubcategoria={filtroSubcategoria} setFiltroSubcategoria={setFiltroSubcategoria} filtroExportarZona={filtroExportarZona} setFiltroExportarZona={setFiltroExportarZona} seleccionados={seleccionados} toggleSeleccion={toggleSeleccion} toggleSeleccionarTodo={toggleSeleccionarTodo} proveedoresFiltrados={proveedoresFiltrados} abrirNuevoProcesoConSeleccionados={abrirNuevoProcesoConSeleccionados} exportarCSV={() => exportarProveedoresCSV(proveedoresFiltrados.filter(p => seleccionados.includes(p.id)))} exportarExcel={() => exportarProveedoresExcel(proveedoresFiltrados.filter(p => seleccionados.includes(p.id)))} categoriasDinamicas={categoriasDinamicas} />}
          {tabAdmin === 'procesos' && <PanelProcesos procesos={procesos} procesosFiltradosDashboard={procesosFiltradosDashboard} usuarioActual={usuarioActual} descargarPlantillaProcesos={descargarPlantillaProcesos} manejarCargaMasivaProcesos={manejarCargaMasivaProcesos} exportarProcesosExcel={() => exportarProcesosExcel(procesosFiltradosDashboard)} setProcesoActual={setProcesoActual} setModalProceso={setModalProceso} marcarAcuerdoFinalizado={marcarAcuerdoFinalizado} procesosConAlertaFinalizacion={procesosConAlertaFinalizacion} alertasContratos={alertasContratos} alertasRenovacion={alertasRenovacion} filtroProcesosController={filtroProcesosController} setFiltroProcesosController={setFiltroProcesosController} controllersUnicos={controllersUnicos} filtroProcesosEstado={filtroProcesosEstado} setFiltroProcesosEstado={setFiltroProcesosEstado} filtroProcesosMesAno={filtroProcesosMesAno} setFiltroProcesosMesAno={setFiltroProcesosMesAno} mesesAnosUnicos={mesesAnosUnicos} filtroDocsEmitidos={filtroDocsEmitidos} setFiltroDocsEmitidos={setFiltroDocsEmitidos} procesosRecuentoCount={procesosRecuentoCount} countSpot={countSpot} countAnualizado={countAnualizado} totalBaselineProcesos={totalBaselineProcesos} ahorroTotalProcesos={ahorroTotalProcesos} ahorroPorcentajeProcesos={ahorroPorcentajeProcesos} totalMontoAdjudicadoKpi={totalMontoAdjudicadoKpi} editarProceso={editarProceso} eliminarProceso={eliminarProceso} />}
          {tabAdmin === 'crear_admin' && <GestionUsuarios nuevoAdmin={nuevoAdmin} setNuevoAdmin={setNuevoAdmin} crearAdministrador={crearAdministrador} bloqueoSeguridad={bloqueoSeguridad} usuarioActual={usuarioActual} administradoresDb={administradoresDb} setAdminEditando={setAdminEditando} eliminarAdmin={eliminarAdmin} />}
          
          {tabAdmin === 'generador_rfp' && <GeneradorRFP />}
          {tabAdmin === 'generador_rfq' && <GeneradorRFQ />}
          {tabAdmin === 'generador_ft' && <GeneradorFT />}

          {tabAdmin === 'auditoria' && usuarioActual?.usuario === 'mmaquieiraf@sodimac.cl' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #EE2D24', paddingBottom: '10px' }}>
                <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>Registro de Auditoría de Accesos</h3>
                <button onClick={cargarLogsAuditoria} style={{ padding: '6px 15px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Actualizar Registros</button>
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Fecha y Hora</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Tipo de Evento</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Usuario / Input</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsAuditoria.length === 0 ? <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay registros de auditoría aún.</td></tr> : 
                    logsAuditoria.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #eee', backgroundColor: log.estado === 'Fallido' ? '#fff5f5' : 'white' }}>
                        <td style={{ padding: '12px' }}>{new Date(log.created_at).toLocaleString('es-CL')}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#004A99' }}>{log.tipo}</td>
                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>{log.usuario_intentado}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: log.estado === 'Éxito' ? '#d4edda' : '#f8d7da', color: log.estado === 'Éxito' ? '#155724' : '#721c24' }}>{log.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}