import React, { useState } from 'react';
import { zonasOpciones, macroZonas, coloresGrafico } from '../../utils/constantes';
import TortaDistribucion from '../../components/charts/TortaDistribucion';
import MapaCobertura from '../../components/charts/MapaCobertura';

export default function DashboardStats({ 
  proveedores, 
  proveedoresAprobados, 
  categoriasDinamicas,
  abrirEditorProveedor,
  marcarProveedorActualizado
}) {
  const [tipoGraficoTorta, setTipoGraficoTorta] = useState('categoria'); 
  const [filtroTortaCat, setFiltroTortaCat] = useState(''); 
  const [filtroTortaSub, setFiltroTortaSub] = useState([]); 
  const [filtroTendenciaCat, setFiltroTendenciaCat] = useState(''); 
  const [filtroTendenciaSub, setFiltroTendenciaSub] = useState(''); 
  const [filtroTendenciaTiempo, setFiltroTendenciaTiempo] = useState('30'); 
  const [filtroMapaCat, setFiltroMapaCat] = useState(''); 
  const [filtroMapaSub, setFiltroMapaSub] = useState(''); 
  const [filtroMapaZona, setFiltroMapaZona] = useState('');

  // Estados para la ventana de proveedores que requieren actualización (>90 días)
  const [mostrarModalRenovacion, setMostrarModalRenovacion] = useState(false);
  const [busquedaRenovacion, setBusquedaRenovacion] = useState('');

  const statsDashboard = () => {
    const total = proveedores.length; let fechasOrdenadas = []; const fechasRaw = {}; const renovaciones = [];
    const hace90Dias = new Date(); hace90Dias.setDate(hace90Dias.getDate() - 90);
    let fechaLimite = new Date();
    
    if (filtroTendenciaTiempo !== 'all') {
      const dias = parseInt(filtroTendenciaTiempo);
      for (let i = dias - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        fechasOrdenadas.push(ds); fechasRaw[ds] = 0; 
      }
      fechaLimite.setDate(fechaLimite.getDate() - dias);
    }
    
    const proveedoresTendencia = proveedores.filter(p => (filtroTendenciaCat === '' || p.categoria === filtroTendenciaCat) && (filtroTendenciaSub === '' || p.subcategoria === filtroTendenciaSub) && (filtroTendenciaTiempo === 'all' || new Date(p.fecha_registro) >= fechaLimite));
    
    proveedoresTendencia.forEach(p => {
      const fechaCorta = new Date(p.fecha_registro).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (filtroTendenciaTiempo !== 'all') { if (fechasRaw[fechaCorta] !== undefined) fechasRaw[fechaCorta]++; } 
      else { fechasRaw[fechaCorta] = (fechasRaw[fechaCorta] || 0) + 1; }
    });
    
    if (filtroTendenciaTiempo === 'all') fechasOrdenadas = Object.keys(fechasRaw).sort((a,b) => new Date(`${a.split('-')[2]}-${a.split('-')[1]}-${a.split('-')[0]}`) - new Date(`${b.split('-')[2]}-${b.split('-')[1]}-${b.split('-')[0]}`));
    
    proveedores.forEach(p => { if(new Date(p.fecha_registro) < hace90Dias) renovaciones.push(p); });
    return { total, fechasRaw, fechasOrdenadas, renovaciones };
  };
  
  const stats = statsDashboard();

  // Generador del enlace mailto con el texto exacto solicitado
  const enviarCorreoConfirmacion = (prov) => {
    const destinatario = prov.email_principal || '';
    const asunto = encodeURIComponent('Confirmación y actualización de datos - Portal de Proveedores');
    const cuerpo = encodeURIComponent(
`Estimado proveedor: 

Dentro de nuestra base de proveedores contamos con la siguiente informacion de contacto de su empresa: 
${prov.razon_social || ''} - ${prov.rut || ''} - ${prov.nombre_contacto || ''} - ${prov.email_principal || ''}. 

Favor confirmar si esta información esta correcta. 

Saludos,`
    );
    window.location.href = `mailto:${destinatario}?subject=${asunto}&body=${cuerpo}`;
  };

  const renovacionesFiltradas = stats.renovaciones.filter(p => {
    if (!busquedaRenovacion.trim()) return true;
    const texto = `${p.razon_social || ''} ${p.nombre_fantasia || ''} ${p.rut || ''} ${p.categoria || ''} ${p.subcategoria || ''}`.toLowerCase();
    return texto.includes(busquedaRenovacion.toLowerCase().trim());
  });

  const chartWidth = 800; const chartHeight = 250; const padX = 40; const padY = 30;
  const maxReg = Math.max(...stats.fechasOrdenadas.map(f => stats.fechasRaw[f]), 1);
  const stepX = stats.fechasOrdenadas.length > 1 ? (chartWidth - 2 * padX) / (stats.fechasOrdenadas.length - 1) : 0;
  const puntosLinea = stats.fechasOrdenadas.map((f, i) => `${padX + i * stepX},${chartHeight - padY - ((stats.fechasRaw[f] / maxReg) * (chartHeight - 2 * padY))}`).join(' ');

  const proveedoresParaTorta = proveedoresAprobados.filter(p => (filtroTortaCat === '' || p.categoria === filtroTortaCat) && (filtroTortaSub.length === 0 || filtroTortaSub.includes(p.subcategoria)));
  const tortaData = {};
  proveedoresParaTorta.forEach(p => { const clave = tipoGraficoTorta === 'categoria' ? p.categoria : p.subcategoria; tortaData[clave] = (tortaData[clave] || 0) + 1; });
  let cumulativePercent = 0;
  const pieSlices = Object.entries(tortaData).map(([key, val], i) => {
    const percent = proveedoresParaTorta.length > 0 ? (val / proveedoresParaTorta.length) * 100 : 0;
    const slice = `${coloresGrafico[i % coloresGrafico.length]} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return { key, val, percent, color: coloresGrafico[i % coloresGrafico.length], slice };
  });
  const tortaGradient = proveedoresParaTorta.length > 0 ? `conic-gradient(${pieSlices.map(s => s.slice).join(', ')})` : '#e0e0e0';

  const statsMapa = () => {
    const conteo = {}; zonasOpciones.filter(z => z !== "Todo el País").forEach(z => conteo[z] = 0);
    const filtradosMapa = proveedoresAprobados.filter(p => {
      let zonaMatch = true;
      if (filtroMapaZona !== '') {
        const zProv = p.zonas_cobertura ? p.zonas_cobertura.split(',').map(z => z.trim()) : [];
        zonaMatch = zProv.includes('Todo el País') || zProv.includes(filtroMapaZona);
      }
      return (filtroMapaCat === '' || p.categoria === filtroMapaCat) && (filtroMapaSub === '' || p.subcategoria === filtroMapaSub) && zonaMatch;
    });
    filtradosMapa.forEach(p => {
      if (!p.zonas_cobertura) return;
      const zP = p.zonas_cobertura.split(',').map(z => z.trim());
      if (zP.includes('Todo el País')) Object.keys(conteo).forEach(z => conteo[z]++); else zP.forEach(z => { if (conteo[z] !== undefined) conteo[z]++; });
    });
    return { conteo, maxMapa: Math.max(...Object.values(conteo), 1), totalMapeados: filtradosMapa.length };
  };
  const mapStats = statsMapa();

  return (
    <div>
      {/* MODAL EMERGENTE: PROVEEDORES QUE REQUIEREN ACTUALIZACIÓN (>90 DÍAS) */}
      {mostrarModalRenovacion && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 900 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '92%', maxWidth: '1050px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ffc107', paddingBottom: '12px', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>Proveedores que Requieren Actualización (&gt;90 días)</h3>
                <span style={{ fontSize: '12px', color: '#666' }}>Total pendientes de revisión: <strong>{stats.renovaciones.length}</strong> registros</span>
              </div>
              <button 
                onClick={() => setMostrarModalRenovacion(false)} 
                style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                ✕ Cerrar
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <input 
                type="text" 
                placeholder="🔍 Filtrar por Razón Social, RUT o Categoría..." 
                value={busquedaRenovacion}
                onChange={(e) => setBusquedaRenovacion(e.target.value)}
                style={{ width: '100%', maxWidth: '380px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div style={{ overflowY: 'auto', border: '1px solid #ccc', borderRadius: '6px', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f0f0f0', zIndex: 1 }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Fecha Registro</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Razón Social / RUT</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Categoría / Subcategoría</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Contacto / Correo</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #ccc', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {renovacionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '25px', textAlign: 'center', color: '#777' }}>
                        No hay proveedores pendientes de actualización (&gt;90 días).
                      </td>
                    </tr>
                  ) : (
                    renovacionesFiltradas.map(prov => (
                      <tr key={prov.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', color: '#666' }}>
                          {prov.fecha_registro ? new Date(prov.fecha_registro).toLocaleDateString('es-CL') : 'N/A'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <strong style={{ color: '#222' }}>{prov.razon_social}</strong><br />
                          <span style={{ color: '#666', fontSize: '11px' }}>{prov.rut}</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span>{prov.categoria}</span><br />
                          <span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <strong>{prov.nombre_contacto || 'Sin nombre'}</strong><br />
                          <span style={{ color: '#004A99', fontSize: '11px' }}>{prov.email_principal || 'Sin correo'}</span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => marcarProveedorActualizado && marcarProveedorActualizado(prov)} 
                              style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                            >
                              Actualizado
                            </button>
                            <button 
                              onClick={() => enviarCorreoConfirmacion(prov)} 
                              style={{ padding: '5px 10px', backgroundColor: '#004A99', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                            >
                              Enviar Correo
                            </button>
                            <button 
                              onClick={() => abrirEditorProveedor && abrirEditorProveedor(prov)} 
                              style={{ padding: '5px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#004A99', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Total Proveedores</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{proveedores ? proveedores.length : 0}</p>
        </div>
        <div style={{ backgroundColor: '#EE2D24', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0', fontSize: '14px', textTransform: 'uppercase' }}>Aprobados en Base</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{proveedoresAprobados.length}</p>
        </div>
        {/* TARJETA INTERACTIVA: Al hacer clic abre el listado de proveedores >90 días */}
        <div 
          onClick={() => setMostrarModalRenovacion(true)}
          title="Haz clic para revisar los proveedores que requieren actualización"
          style={{ backgroundColor: '#ffc107', color: '#333', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}
        >
          <h3 style={{ margin: '0', fontSize: '14px', textTransform: 'uppercase' }}>Requieren Actualización (&gt;90 días)</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold' }}>{stats.renovaciones.length}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>Distribución Aprobados</h3>
            <select style={{ padding: '5px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setTipoGraficoTorta(e.target.value)} value={tipoGraficoTorta}>
              <option value="categoria">Ver por Categoría</option>
              <option value="subcategoria">Ver por Subcategoría</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
            <select style={{ padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '130px' }} onChange={e => {setFiltroTortaCat(e.target.value); setFiltroTortaSub([]);}} value={filtroTortaCat}>
              <option value="">Todas las Categorías</option>
              {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            
            <div style={{ flex: 1, padding: '5px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '55px', overflowY: 'auto', backgroundColor: '#fff', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {filtroTortaCat === '' ? <span style={{ fontSize: '11px', color: '#999', padding: '2px' }}>Seleccione una categoría para filtrar subcategorías...</span> : 
                categoriasDinamicas[filtroTortaCat]?.map(sub => (
                  <label key={sub} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '2px 6px', border: '1px solid #ccc', borderRadius: '12px' }}>
                    <input type="checkbox" checked={filtroTortaSub.includes(sub)} onChange={(e) => {
                      if (e.target.checked) setFiltroTortaSub([...filtroTortaSub, sub]);
                      else setFiltroTortaSub(filtroTortaSub.filter(s => s !== sub));
                    }} style={{ margin: 0, cursor: 'pointer' }} /> {sub}
                  </label>
                ))
              }
            </div>
          </div>

          {proveedoresParaTorta.length === 0 ? <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>No hay aprobados con estos filtros</p> : (
            <TortaDistribucion pieSlices={pieSlices} tortaGradient={tortaGradient} />
          )}
        </div>

        <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '16px' }}>Tendencia de Registros</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ padding: '5px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', maxWidth: '140px' }} onChange={e => {setFiltroTendenciaCat(e.target.value); setFiltroTendenciaSub('');}} value={filtroTendenciaCat}>
                <option value="">Categoría (Todas)</option>
                {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat.substring(0,20)}...</option>)}
              </select>
              <select disabled={!filtroTendenciaCat} style={{ padding: '5px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', maxWidth: '140px' }} onChange={e => setFiltroTendenciaSub(e.target.value)} value={filtroTendenciaSub}>
                <option value="">Subcat (Todas)</option>
                {filtroTendenciaCat && categoriasDinamicas[filtroTendenciaCat]?.map(sub => <option key={sub} value={sub}>{sub.substring(0,20)}...</option>)}
              </select>
              <select style={{ padding: '5px', fontSize: '11px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }} onChange={e => setFiltroTendenciaTiempo(e.target.value)} value={filtroTendenciaTiempo}>
                <option value="7">Últimos 7 días</option><option value="15">Últimos 15 días</option><option value="30">Últimos 30 días</option><option value="all">Histórico completo</option>
              </select>
            </div>
          </div>
          {stats.fechasOrdenadas.length === 0 ? <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>No hay registros para graficar</p> : (
            <div style={{ position: 'relative', width: '100%', height: '210px' }}>
              <svg width="100%" height="100%" viewBox={`0 0 800 250`} preserveAspectRatio="none">
                <line x1={40} y1={250 - 30} x2={800} y2={250 - 30} stroke="#ccc" strokeWidth="2" />
                <line x1={40} y1="0" x2={40} y2={250 - 30} stroke="#ccc" strokeWidth="2" />
                {stats.fechasOrdenadas.length > 1 && <polyline points={puntosLinea} fill="none" stroke="#004A99" strokeWidth="3" />}
                {stats.fechasOrdenadas.map((f, i) => {
                  const cx = 40 + i * stepX; const cy = 250 - 30 - ((stats.fechasRaw[f] / maxReg) * (250 - 2 * 30));
                  return (
                    <g key={f}>
                      <circle cx={cx} cy={cy} r="5" fill="#EE2D24" />
                      {stats.fechasRaw[f] > 0 && <text x={cx} y={cy - 10} fontSize="12" fill="#333" textAnchor="middle">{stats.fechasRaw[f]}</text>}
                      {i % Math.ceil(stats.fechasOrdenadas.length / 5) === 0 && <text x={cx} y={250 - 10} fontSize="11" fill="#666" textAnchor="middle">{f.substring(0, 5)}</text>}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '16px' }}>Mapa de Cobertura Regional (Aprobados)</h3>
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Visualización térmica de proveedores según filtros aplicados.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select style={{ padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => {setFiltroMapaCat(e.target.value); setFiltroMapaSub('');}} value={filtroMapaCat}>
              <option value="">Todas las Categorías</option>
              {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select disabled={!filtroMapaCat} style={{ padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFiltroMapaSub(e.target.value)} value={filtroMapaSub}>
              <option value="">Todas las Subcategorías</option>
              {filtroMapaCat && categoriasDinamicas[filtroMapaCat]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
            <select style={{ padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }} onChange={e => setFiltroMapaZona(e.target.value)} value={filtroMapaZona}>
              <option value="">Cualquier Zona</option>
              {zonasOpciones.filter(z => z !== 'Todo el País').map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        <MapaCobertura macroZonas={macroZonas} mapStats={mapStats} />

      </div>
    </div>
  );
}