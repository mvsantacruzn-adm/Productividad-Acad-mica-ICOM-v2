// ============================================
// EXPORTACIONES.JS - Lógica de Exportación PDF
// ============================================
// Maneja la exportación PDF de Ficha Académica CNA
// Separa la lógica de exportación del código principal

/**
 * Descarga la Ficha Académica CNA como PDF
 * Optimizado para evitar cortes y mejorar formato
 */
function descargarPDF() {
    if (!window.profesorActualFicha) {
        alert('Por favor genera la ficha primero');
        return;
    }
    
    const elementOriginal = document.getElementById('ficha-pdf-content');
    if (!elementOriginal) {
        alert('Error: no se encontró la ficha para exportar');
        return;
    }
    
    // CREAR CLON TEMPORAL PARA PDF
    const clonePDF = elementOriginal.cloneNode(true);
    clonePDF.id = 'ficha-pdf-temporal';
    
    // Aplicar estilos optimizados para PDF al clon
    aplicarEstilosPDF(clonePDF);
    
    // Ocultar columnas específicas en tabla de Proyectos
    ocultarColumnasProyectos(clonePDF);
    
    // Agregar el clon temporalmente al DOM (necesario para html2canvas)
    document.body.appendChild(clonePDF);
    
    // Generar PDF desde el clon
    const nombreArchivo = `Ficha_CNA_${window.profesorActualFicha.replace(/\s+/g, '_')}.pdf`;
    
    const opt = {
        margin: [10, 10, 10, 10],
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
            scale: 3, 
            useCORS: true,
            backgroundColor: '#ffffff',
            letterRendering: true,
            allowTaint: false
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        }
    };
    
    html2pdf()
        .set(opt)
        .from(clonePDF)
        .save()
        .then(() => {
            // Eliminar el clon temporal después de generar PDF
            document.body.removeChild(clonePDF);
        })
        .catch(error => {
            console.error('Error al generar PDF:', error);
            // Eliminar el clon en caso de error
            if (document.body.contains(clonePDF)) {
                document.body.removeChild(clonePDF);
            }
            alert('Error al generar el PDF');
        });
}

/**
 * Aplica estilos CSS optimizados para PDF al clon
 * @param {HTMLElement} elemento - Elemento a estilizar
 */
function aplicarEstilosPDF(elemento) {
    // Estilos inline generales
    elemento.style.width = '210mm';
    elemento.style.padding = '12mm';
    elemento.style.margin = '0';
    elemento.style.backgroundColor = 'white';
    elemento.style.fontSize = '11px';
    
    // Aplicar estilos a tablas
    const tablas = elemento.querySelectorAll('table');
    tablas.forEach(tabla => {
        tabla.style.width = '100%';
        tabla.style.borderCollapse = 'collapse';
        tabla.style.tableLayout = 'auto';
        tabla.style.marginBottom = '12px';
        tabla.style.pageBreakInside = 'auto';
    });
    
    // Aplicar estilos a headers de tabla
    const ths = elemento.querySelectorAll('th');
    ths.forEach(th => {
        th.style.padding = '4px';
        th.style.fontSize = '9px';
        th.style.fontWeight = 'bold';
        th.style.wordBreak = 'break-word';
        th.style.overflowWrap = 'break-word';
        th.style.whiteSpace = 'normal';
        th.style.lineHeight = '1.2';
    });
    
    // Aplicar estilos a celdas de tabla
    const tds = elemento.querySelectorAll('td');
    tds.forEach(td => {
        td.style.padding = '4px';
        td.style.fontSize = '9px';
        td.style.wordBreak = 'break-word';
        td.style.overflowWrap = 'break-word';
        td.style.whiteSpace = 'normal';
        td.style.lineHeight = '1.2';
    });
    
    // Aplicar estilos a filas para evitar cortes
    const trs = elemento.querySelectorAll('tr');
    trs.forEach(tr => {
        tr.style.pageBreakInside = 'avoid';
    });
    
    // Aplicar estilos a títulos de secciones
    const h3s = elemento.querySelectorAll('h3');
    h3s.forEach(h3 => {
        h3.style.pageBreakAfter = 'avoid';
        h3.style.marginTop = '12px';
        h3.style.marginBottom = '8px';
        h3.style.fontSize = '10px';
    });
    
    // Espacios entre tablas
    const separadores = elemento.querySelectorAll('div[style*="margin-bottom"]');
    separadores.forEach(sep => {
        if (sep.style.marginBottom === '10px') {
            sep.style.marginBottom = '6px';
        }
    });
}

/**
 * Oculta columnas CLP, TC y Observaciones en la tabla de Proyectos de Investigación
 * @param {HTMLElement} elemento - Elemento que contiene la tabla
 */
function ocultarColumnasProyectos(elemento) {
    // Encontrar el título "Proyectos de Investigación"
    const h3s = elemento.querySelectorAll('h3');
    let tablaProyectos = null;
    
    for (let h3 of h3s) {
        if (h3.textContent.includes('Proyectos de Investigación')) {
            // La tabla siguiente al h3 es la tabla de proyectos
            tablaProyectos = h3.nextElementSibling;
            break;
        }
    }
    
    if (!tablaProyectos || tablaProyectos.tagName !== 'TABLE') {
        return; // No se encontró tabla de proyectos
    }
    
    // Encontrar los índices de las columnas a ocultar
    const headers = tablaProyectos.querySelectorAll('th');
    const columnasOcultar = [];
    
    headers.forEach((header, idx) => {
        const texto = header.textContent.trim();
        if (texto === 'CLP' || texto === 'TC' || texto === 'Observaciones') {
            columnasOcultar.push(idx);
            header.style.display = 'none'; // Ocultar header
        }
    });
    
    // Ocultar celdas correspondientes en cada fila
    const filas = tablaProyectos.querySelectorAll('tbody tr');
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        columnasOcultar.forEach(idx => {
            if (celdas[idx]) {
                celdas[idx].style.display = 'none';
            }
        });
    });
}

// Exponer función globalmente para llamadas desde HTML
window.descargarPDF = descargarPDF;

console.log('✓ exportaciones.js cargado - PDF mejorado disponible');
