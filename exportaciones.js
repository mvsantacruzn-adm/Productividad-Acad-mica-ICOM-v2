// ============================================
// EXPORTACIONES.JS - Descarga PDF de Ficha CNA
// ============================================

/**
 * Descarga la Ficha Académica CNA como PDF
 * Ajustes:
 * 1. Cada tabla importante en nueva página
 * 2. Tablas ajustadas al ancho sin cortes
 * 3. Columnas CLP, TC, Observaciones ocultas en Proyectos
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
    
    // Crear clon para PDF (no toca el original)
    const clonePDF = elementOriginal.cloneNode(true);
    clonePDF.id = 'ficha-pdf-temporal';
    document.body.appendChild(clonePDF);
    
    try {
        // AJUSTE 1: Forzar nueva página para cada tabla importante
        forcePageBreaksEnTablas(clonePDF);
        
        // AJUSTE 2: Ajustar tablas al ancho disponible
        ajustarTablasAlAncho(clonePDF);
        
        // AJUSTE 3: Ocultar columnas en tabla de Proyectos
        ocultarColumnasProyectos(clonePDF);
        
        // Generar PDF
        const nombreArchivo = `Ficha_CNA_${window.profesorActualFicha.replace(/\s+/g, '_')}.pdf`;
        
        const opt = {
            margin: [10, 10, 10, 10],
            filename: nombreArchivo,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
                scale: 3, 
                useCORS: true,
                backgroundColor: '#ffffff'
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        };
        
        html2pdf().set(opt).from(clonePDF).save();
        
    } finally {
        // Limpiar clon temporal
        if (document.body.contains(clonePDF)) {
            document.body.removeChild(clonePDF);
        }
    }
}

/**
 * AJUSTE 1: Fuerza salto de página antes de cada tabla importante
 */
function forcePageBreaksEnTablas(elemento) {
    const h3s = elemento.querySelectorAll('h3');
    
    h3s.forEach((h3, idx) => {
        // No hacer salto de página en el primer título
        if (idx === 0) return;
        
        // Forzar página nueva antes de cada título (excepto el primero)
        h3.style.pageBreakBefore = 'always';
        h3.style.marginTop = '0';
    });
    
    // También forzar page-break-inside avoid en las tablas
    const tablas = elemento.querySelectorAll('table');
    tablas.forEach(tabla => {
        tabla.style.pageBreakInside = 'avoid';
    });
}

/**
 * AJUSTE 2: Ajusta tablas al ancho disponible
 */
function ajustarTablasAlAncho(elemento) {
    const tablas = elemento.querySelectorAll('table');
    
    tablas.forEach(tabla => {
        // Estilos para ajuste de ancho
        tabla.style.width = '100%';
        tabla.style.borderCollapse = 'collapse';
        tabla.style.tableLayout = 'fixed';  // Distribución uniforme
        tabla.style.marginBottom = '12px';
        
        // Headers
        const headers = tabla.querySelectorAll('th');
        headers.forEach(th => {
            th.style.padding = '3px';
            th.style.fontSize = '8px';
            th.style.fontWeight = 'bold';
            th.style.wordBreak = 'break-word';
            th.style.overflowWrap = 'break-word';
            th.style.whiteSpace = 'normal';
            th.style.lineHeight = '1.1';
        });
        
        // Celdas
        const celdas = tabla.querySelectorAll('td');
        celdas.forEach(td => {
            td.style.padding = '2px';
            td.style.fontSize = '8px';
            td.style.wordBreak = 'break-word';
            td.style.overflowWrap = 'break-word';
            td.style.whiteSpace = 'normal';
            td.style.lineHeight = '1.1';
        });
        
        // Filas
        const filas = tabla.querySelectorAll('tr');
        filas.forEach(fila => {
            fila.style.pageBreakInside = 'avoid';
        });
    });
}

/**
 * AJUSTE 3: Oculta columnas CLP, TC y Observaciones en tabla de Proyectos
 */
function ocultarColumnasProyectos(elemento) {
    const h3s = elemento.querySelectorAll('h3');
    let tablaProyectos = null;
    
    // Encontrar tabla de Proyectos de Investigación
    for (let h3 of h3s) {
        if (h3.textContent.includes('Proyectos de Investigación')) {
            tablaProyectos = h3.nextElementSibling;
            break;
        }
    }
    
    if (!tablaProyectos || tablaProyectos.tagName !== 'TABLE') {
        return;
    }
    
    // Encontrar índices de columnas a ocultar
    const headers = tablaProyectos.querySelectorAll('th');
    const columnasOcultar = [];
    
    headers.forEach((header, idx) => {
        const texto = header.textContent.trim();
        if (texto === 'CLP' || texto === 'TC' || texto === 'Observaciones') {
            columnasOcultar.push(idx);
            header.style.display = 'none';
        }
    });
    
    // Ocultar celdas correspondientes
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

// Exponer función globalmente
window.descargarPDF = descargarPDF;

console.log('✓ exportaciones.js cargado');
