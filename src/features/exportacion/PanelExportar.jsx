import React, { useMemo } from 'react';
import { zonasOpciones } from '../../utils/constantes';

const normalizarTexto = (t) => (t || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function PanelExportar({
  filtroRut, setFiltroRut, filtroNombre, setFiltroNombre,
  filtroCategoria, setFiltroCategoria, filtroSubcategoria, setFiltroSubcategoria,
  filtroExportarZona, setFiltroExportarZona, seleccionados, toggleSeleccion,
  toggleSeleccionarTodo, proveedoresFiltrados, abrirNuevoProcesoConSeleccionados,
  exportarCSV, exportarExcel, categoriasDinamicas
}) {
  // Asegura que las subcategorías mostradas correspondan estrictamente a la categoría seleccionada
  const subcategoriasDisponibles = useMemo(() => {
    if (!filtroCategoria) return [];
    const claveReal = Object.keys(categoriasDinamicas || {}).find(
      k => normalizarTexto(k) === normalizarTexto(filtroCategoria)
    );
    return claveReal ? (categoriasDinamicas[claveReal] || []) : [];
  }, [filtroCategoria, categoriasDinamicas]);

  // Verifica cuántos de los proveedores actualmente visibles están seleccionados
  const seleccionadosVisiblesCount = useMemo(() => {
    const idsVisibles = new Set(proveedoresFiltrados.map(p => p.id));
    return seleccionados.filter(id => idsVisibles.has(id)).length;
  }, [proveedoresFiltrados, seleccionados]);

  const todosVisiblesSeleccionados = proveedoresFiltrados.length > 0 && seleccionadosVisiblesCount === proveedoresFiltrados.length;

  return (
    <div>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Filtra y selecciona los proveedores aprobados para generar un archivo compatible o crear un nuevo proceso.</p>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Buscar por RUT</label><input placeholder="Ej: 12345678-9" value={filtroRut} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroRut(e.target.value)} /></div>
          <div><label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre de Fantasía</label><input placeholder="Buscar empresa..." value={filtroNombre} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroNombre(e.target.value)} /></div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Categoría</label>
            <select value={filtroCategoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => {setFiltroCategoria(e.target.value); setFiltroSubcategoria('');}}>
              <option value="">Todas</option>
              {Object.keys(categoriasDinamicas).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Subcategoría</label>
            <select value={filtroSubcategoria} disabled={!filtroCategoria} style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} onChange={e => setFiltroSubcategoria(e.target.value)}>
              <option value="">Todas</option>
              {subcategoriasDisponibles.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Zonas de Cobertura</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '5px' }}>
            <select style={{ padding: '8px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '180px', outline: 'none' }} onChange={e => {
              const val = e.target.value;
              if (val && !filtroExportarZona.includes(val)) setFiltroExportarZona([...filtroExportarZona, val]);
              e.target.value = ""; 
            }}>
              <option value="">Seleccionar zona...</option>
              {zonasOpciones.map(zona => <option key={zona} value={zona}>{zona}</option>)}
            </select>
            
            <div style={{ flex: 1, padding: '5px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '33px', maxHeight: '60px', overflowY: 'auto', backgroundColor: '#fff', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {filtroExportarZona.length === 0 ? <span style={{ fontSize: '12px', color: '#999', padding: '2px' }}>Todas las zonas...</span> : 
                filtroExportarZona.map(z => (
                  <label key={z} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', backgroundColor: '#f0f0f0', padding: '2px 6px', border: '1px solid #ccc', borderRadius: '12px' }}>
                    <input type="checkbox" checked={true} onChange={() => setFiltroExportarZona(filtroExportarZona.filter(s => s !== z))} style={{ margin: 0, cursor: 'pointer' }} /> {z}
                  </label>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#004A99' }}>Seleccionados: {seleccionadosVisiblesCount} de {proveedoresFiltrados.length}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={abrirNuevoProcesoConSeleccionados} style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: '#333', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>+ Nuevo Proceso</button>
          <button onClick={exportarCSV} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>Descargar CSV Clean</button>
          <button onClick={exportarExcel} style={{ padding: '10px 20px', backgroundColor: '#004A99', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>Descargar Excel (.xls)</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc', width: '40px', textAlign: 'center' }}><input type="checkbox" onChange={toggleSeleccionarTodo} checked={todosVisiblesSeleccionados} /></th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>RUT</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Nombre Fantasía (Empresa)</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Categoría / Sub</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Nombre Contacto</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #ccc' }}>Correo Electrónico</th>
            </tr>
          </thead>
          <tbody>
            {proveedoresFiltrados.length === 0 ? <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No hay resultados con estos filtros.</td></tr> : 
            proveedoresFiltrados.map(prov => (
              <tr key={prov.id} style={{ borderBottom: '1px solid #eee', backgroundColor: seleccionados.includes(prov.id) ? '#f0f8ff' : 'white' }}>
                <td style={{ padding: '12px', textAlign: 'center' }}><input type="checkbox" checked={seleccionados.includes(prov.id)} onChange={() => toggleSeleccion(prov.id)} /></td>
                <td style={{ padding: '12px' }}>{prov.rut}</td>
                <td style={{ padding: '12px' }}><strong>{prov.nombre_fantasia || prov.razon_social}</strong></td>
                <td style={{ padding: '12px' }}>{prov.categoria} <br/><span style={{ color: '#666', fontSize: '11px' }}>{prov.subcategoria}</span></td>
                <td style={{ padding: '12px' }}>{prov.nombre_contacto}</td>
                <td style={{ padding: '12px' }}>{prov.email_principal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}