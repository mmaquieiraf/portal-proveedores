// IMPORTANTE: Asegúrate de tener SheetJS (xlsx) instalado en tu proyecto: npm install xlsx
import * as XLSX from 'xlsx';

export const exportarProcesosExcel = (procesosAExportar) => {
  if (procesosAExportar.length === 0) return alert("⚠️ No hay procesos para exportar con los filtros actuales.");
  let excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><style>table { border-collapse: collapse; font-family: Arial, sans-serif; } th { background-color: #004A99; color: white; font-weight: bold; border: 1px solid #cccccc; padding: 10px; text-align: left; } td { border: 1px solid #cccccc; padding: 8px; font-size: 13px; } .title { font-size: 18px; font-weight: bold; color: #004A99; padding-bottom: 15px; }</style></head><body><div class="title">Base Oficial de Procesos - Sodimac S.A.</div><table><thead><tr><th>Nombre del Proceso</th><th>Clasificación</th><th>Subgerencia</th><th>Solicitante</th><th>Tipo de Proceso</th><th>Tipo de Compra</th><th>Controller</th><th>Estado del proceso</th><th>Fecha de inicio</th><th>Fecha de Término</th><th>Proveedores Invitados</th><th>Cantidad de Ofertas</th><th>Proveedor Adjudicado</th><th>Baseline ($)</th><th>Monto Adjudicado ($)</th><th>Ahorro ($)</th></tr></thead><tbody>`;
  
  procesosAExportar.forEach(p => { 
    const ahorro = (p.baseline || 0) - (p.monto_adjudicado || 0);
    excelHtml += `<tr><td>${p.nombre || ''}</td><td>${p.clasificacion || ''}</td><td>${p.subgerencia || ''}</td><td>${p.solicitante || ''}</td><td>${p.tipo || ''}</td><td>${p.tipo_compra || ''}</td><td>${p.controller || ''}</td><td>${p.estado_proceso || ''}</td><td>${p.fecha_inicio || ''}</td><td>${p.fecha_termino || ''}</td><td>${p.proveedores_invitados || ''}</td><td>${p.cantidad_ofertas || ''}</td><td>${p.proveedor_adjudicado || ''}</td><td>${p.baseline || ''}</td><td>${p.monto_adjudicado || ''}</td><td>${ahorro}</td></tr>`; 
  });
  excelHtml += `</tbody></table></body></html>`;
  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' }); const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.setAttribute("download", "registro_procesos_sodimac.xls"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

// Genera un .xlsx real con la plantilla base
export const descargarPlantillaProcesos = () => {
  const data = [
    ["Nombre del Proceso", "Clasificación", "Subgerencia", "Solicitante", "Tipo de Proceso (RFI/Q/P)", "Tipo de Compra", "Controller", "Estado del proceso", "Fecha de inicio (YYYY-MM-DD)", "Fecha de Término (YYYY-MM-DD)", "Baseline (Presupuesto Base $)", "Monto Final Adjudicado ($)"],
    ["MM - Proceso de Ejemplo", "Opex", "Operaciones", "Juan Perez", "RFP", "Anualizado", "mmaquieiraf@sodimac.cl", "Adjudicado", "2026-08-01", "2026-08-20", "1500000", "1200000"]
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{wch: 35}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 25}, {wch: 15}, {wch: 25}, {wch: 30}, {wch: 28}, {wch: 28}, {wch: 30}, {wch: 30}];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla Procesos");
  XLSX.writeFile(wb, "Plantilla_Carga_Procesos.xlsx");
};

export const descargarPlantillaCSV = () => {
  let csvContent = "data:text/csv;charset=utf-8,\uFEFFRazon Social,Nombre de Fantasia,RUT,Domicilio Comercial,Categoria,Subcategoria,Zonas de Cobertura,Email Principal,Email Secundario,Nombre Contacto,Cargo,Telefono\n";
  const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "Plantilla_Carga.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

export const exportarProveedoresCSV = (dataAExportar) => {
  if (!dataAExportar || dataAExportar.length === 0) return alert("⚠️ Seleccione al menos un proveedor.");
  let csvC = "\uFEFFId,Nombre de la empresa*,Nombre del contacto,Correo electrónico*,Código del idioma,Código de Región\n";
  dataAExportar.forEach(p => {
    const empresa = (p.nombre_fantasia || p.razon_social || '').toString().replace(/"/g, '').replace(/,/g, ' ');
    const contacto = (p.nombre_contacto || '').toString().replace(/"/g, '').replace(/,/g, ' ');
    const email = (p.email_principal || '').toString().replace(/"/g, '').replace(/,/g, ' ');
    csvC += `,${empresa},${contacto},${email},,\n`;
  });
  // Uso de Blob para evitar que caracteres como '#' corten la exportación de filas
  const blob = new Blob([csvC], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "proveedores_clean.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportarProveedoresExcel = (dataAExportar) => {
  if (!dataAExportar || dataAExportar.length === 0) return alert("⚠️ Seleccione al menos un proveedor.");
  let excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8" /><style>table { border-collapse: collapse; font-family: Arial, sans-serif; } th { background-color: #004A99; color: white; font-weight: bold; border: 1px solid #cccccc; padding: 10px; text-align: left; } td { border: 1px solid #cccccc; padding: 8px; font-size: 13px; } .title { font-size: 18px; font-weight: bold; color: #004A99; padding-bottom: 15px; }</style></head><body><div class="title">Base Oficial de Proveedores Aprobados - Sodimac S.A.</div><table><thead><tr><th>RUT Empresa</th><th>Razón Social</th><th>Nombre Fantasía</th><th>Categoría</th><th>Subcategoría</th><th>Zonas de Cobertura</th><th>Email Principal</th><th>Nombre de Contacto</th><th>Cargo</th><th>Teléfono</th><th>Website</th><th>Fecha Registro</th><th>Aprobado Por</th></tr></thead><tbody>`;
  dataAExportar.forEach(p => { excelHtml += `<tr><td>${p.rut || ''}</td><td>${p.razon_social || ''}</td><td>${p.nombre_fantasia || ''}</td><td>${p.categoria || ''}</td><td>${p.subcategoria || ''}</td><td>${p.zonas_cobertura || ''}</td><td>${p.email_principal || ''}</td><td>${p.nombre_contacto || ''}</td><td>${p.cargo || ''}</td><td>${p.telefono || ''}</td><td>${p.website || ''}</td><td>${p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-CL') : ''}</td><td>${p.aprobado_por || ''}</td></tr>`; });
  excelHtml += `</tbody></table></body></html>`;
  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' }); const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.setAttribute("download", "proveedores_aprobados.xls"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  URL.revokeObjectURL(url);
};