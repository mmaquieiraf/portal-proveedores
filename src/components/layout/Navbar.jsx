import React from 'react';

export default function Navbar({ usuarioActual, vista, setVista, setTabAdmin, setUsuarioActual }) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', padding: '15px 20px', borderRadius: '8px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Espacio reservado para mantener la altura original de 50px sin usar una imagen */}
        <div style={{ height: '50px', display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.5px', zIndex: 10 }}>Portal de Proveedores</span>
        </div>
      </div>
      <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: '15px' }}>
        {usuarioActual && <span style={{ fontSize: '14px', color: '#cce5ff', borderRight: '1px solid rgba(255,255,255,0.3)', paddingRight: '15px' }}>👤 {usuarioActual.usuario}</span>}
        {['login', 'pre_login', 'recuperar'].includes(vista) && <button onClick={() => setVista('registro')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Ir a Registro</button>}
        {vista === 'registro' && <button onClick={() => setVista('pre_login')} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Acceso Interno</button>}
        {vista === 'panel' && <button onClick={() => {setUsuarioActual(null); setVista('registro'); setTabAdmin('dashboard');}} style={{ background: '#EE2D24', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cerrar Sesión</button>}
      </div>
    </div>
  );
}