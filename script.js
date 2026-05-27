let datosBase = {};
let datosProduccion = {};
let profesorActualFicha = null;

// ============================================
// FUNCIONES DE ORDEN VISUAL Y FILTRO
// ============================================

function ordenarPorAnoYRenumerar(filas, headers) {
    if (!filas || filas.length === 0) return filas;
    
    // Encontrar índice de columna Año
    const indiceAno = headers.indexOf('Año');
    if (indiceAno === -1) return filas;
    
    // Crear copia y ordenar
    const filasOrdenadas = JSON.parse(JSON.stringify(filas));
    
    filasOrdenadas.sort((a, b) => {
        const anoA = parseInt(a['Año'] || 0);
        const anoB = parseInt(b['Año'] || 0);
        return anoB - anoA;
    });
    
    // Reenumerar N°
    filasOrdenadas.forEach((fila, idx) => {
        fila['N°'] = String(idx + 1);
    });
    
    return filasOrdenadas;
}

function filtrarDesde2020(filas) {
    if (!filas || filas.length === 0) return filas;
    
    return filas.filter(fila => {
        const ano = parseInt(fila['Año'] || 0);
        return ano >= 2020;
    });
}

// Cargar datos desde los JSONs
async function cargarDatos() {
    try {
        const resBase = await fetch('profesores-base.json');
        const resProd = await fetch('profesores-produccion.json');
        
        datosBase = await resBase.json();
        datosProduccion = await resProd.json();
        
        inicializar();
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Los 4 profesores sin ficha
const sinFicha = [
    { nombre: 'Hugo Benedetti', resumen: 'Finanzas. Por completar datos.' },
    { nombre: 'María José Bosch', resumen: 'Management. Por completar datos.' },
    { nombre: 'Matias Braun', resumen: 'Finanzas Corporativas. Por completar datos.' },
    { nombre: 'Natalia Yankovic', resumen: 'Investigación de Operaciones. Por completar datos.' }
];

function inicializar() {
    const profesoresConDatos = Object.keys(datosBase).map((nombre, idx) => ({
        id: `prof${String(idx + 1).padStart(2, '0')}`,
        nombre: nombre,
        nombres: datosBase[nombre].nombres || nombre,
        grado: datosBase[nombre].grado || '',
        nombreVisual: datosBase[nombre].nombre_visual || nombre,
        origen: datosBase[nombre].origen || 'FCEE',
        linea: datosBase[nombre].linea || '',
        sexo: datosBase[nombre].sexo || '',
        tieneDatos: true
    }));
    
    const profesoresSinDatos = sinFicha.map((p, idx) => ({
        id: `prof${String(Object.keys(datosBase).length + idx + 1).padStart(2, '0')}`,
        nombre: p.nombre,
        nombres: p.nombre,
        grado: '',
        nombreVisual: p.nombre,
        origen: p.origen || 'FCEE',
        linea: p.linea || '',
        sexo: p.sexo || '',
        tieneDatos: false
    }));
    
    const profesores = [...profesoresConDatos, ...profesoresSinDatos];
    
    generarListado(profesores);
    generarModales(profesoresConDatos);
    poblarSelectorProfesores();
    
    // Mostrar/ocultar Control según MODO_ADMIN
    const botonesControl = document.querySelectorAll('.menu-control');
    botonesControl.forEach(boton => {
        boton.style.display = MODO_ADMIN ? 'block' : 'none';
    });
}

function generarListado(profesores) {
    const lista = document.getElementById('profesor-list');
    
    // Separar por facultad
    const porFacultad = { 'FCEE': [], 'ESE': [] };
    
    for (const p of profesores) {
        const origen = p.origen || 'FCEE';
        if (porFacultad[origen]) {
            porFacultad[origen].push(p);
        } else {
            porFacultad['FCEE'].push(p);
        }
    }
    
    // Ordenar cada facultad alfabéticamente por primer nombre (ignorando tildes)
    Object.keys(porFacultad).forEach(origen => {
        porFacultad[origen].sort((a, b) => {
            // Función para remover tildes
            const removeTildes = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            const nombreA = removeTildes((a.nombre || a.nombreVisual || '').split(' ')[0].toLowerCase());
            const nombreB = removeTildes((b.nombre || b.nombreVisual || '').split(' ')[0].toLowerCase());
            return nombreA.localeCompare(nombreB);
        });
    });
    
    // Construir lista: FCEE primero, luego ESE
    let profesoresOrdenados = [...porFacultad['FCEE'], ...porFacultad['ESE']];
    
    // Generar enumeración por facultad
    let contadores = { 'FCEE': 0, 'ESE': 0 };
    
    lista.innerHTML = profesoresOrdenados.map(p => {
        const origen = p.origen || 'FCEE';
        const numero = ++contadores[origen];
        
        // Colores sutiles
        const colorBg = origen === 'FCEE' ? '#E8F4F8' : '#FFF4E6';
        const colorBorde = origen === 'FCEE' ? '#4A90E2' : '#FF9800';
        
        const nombreVisual = p.nombreVisual || p.nombre || 'N/D';
        const grado = p.grado || 'N/D';
        
        return `
        <div class="profesor-row ${!p.tieneDatos ? 'sin-ficha' : ''}" onclick="${p.tieneDatos ? `abrirModal('${p.id}')` : ''}">
            <div class="profesor-badge" style="background-color: ${colorBg}; border: 2px solid ${colorBorde}; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; color: ${colorBorde}; min-width: 70px; text-align: center; margin-right: 12px;">
                ${numero} - ${origen}
            </div>
            <div class="profesor-info">
                <div class="profesor-nombre">${nombreVisual}</div>
                <div class="profesor-resumen">${grado}</div>
            </div>
            <div class="profesor-arrow">${p.tieneDatos ? '→' : ''}</div>
        </div>
        `;
    }).join('');
}

function poblarSelectorProfesores() {
    const select = document.getElementById('profesor-select');
    const profesoresOrdenados = Object.keys(datosBase).sort();
    
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    profesoresOrdenados.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
}

function generarFichaCNA() {
    const select = document.getElementById('profesor-select');
    const nombreProfesor = select.value;
    const preview = document.getElementById('ficha-cna-preview');
    const btnDescargaPDF = document.getElementById('btn-descargar-pdf');
    const btnDescargaExcel = document.getElementById('btn-descargar-ficha-excel-cna');
    
    if (!nombreProfesor) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <p>Selecciona un profesor para visualizar su ficha</p>
            </div>
        `;
        btnDescargaPDF.style.display = 'none';
        btnDescargaExcel.style.display = 'none';
        return;
    }
    
    const base = datosBase[nombreProfesor];
    const produccion = datosProduccion[nombreProfesor];
    
    if (!base || !produccion) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <p>No se encontraron datos para este profesor</p>
            </div>
        `;
        btnDescargaPDF.style.display = 'none';
        btnDescargaExcel.style.display = 'none';
        return;
    }
    
    profesorActualFicha = nombreProfesor;
    const fichaHTML = construirFichaCNA(nombreProfesor, base, produccion);
    preview.innerHTML = fichaHTML;
    btnDescargaPDF.style.display = 'inline-block';
    btnDescargaExcel.style.display = 'inline-block';
}

function construirFichaCNA(nombreProfesor, base, produccion) {
    const secciones = produccion?.secciones || {};
    let html = `
        <div id="ficha-pdf-content" style="background: white; padding: 20px; border-radius: 8px; font-family: Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.5;">
            
            <h1 style="font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Ficha Académica CNA</h1>
            
            <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 12px;">${nombreProfesor}</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
                <tbody>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; width: 30%; border: 1px solid #ddd;">Nombre</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.nombre || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Vínculo</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.vinculo || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Título Profesional</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.titulo || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Grado Académico Máximo</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.grado || 'N/D'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background: #f0f0f0; font-weight: bold; border: 1px solid #ddd;">Líneas de Investigación</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${base.lineas || 'N/D'}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-bottom: 20px;"></div>
    `;
    
    // Mapeo de nombres normalizados
    const titulosOficiales = {
        'tesis_magister_guia': 'Tesis Magíster (Profesor Guía)',
        'tesis_magister_coguia': 'Tesis Magíster (Profesor Co-Guía)',
        'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
        'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-Guía)',
        'publicaciones_indexadas': 'Publicaciones Indexadas',
        'libros': 'Libros',
        'capitulos': 'Capítulos de Libro',
        'patentes': 'Patentes',
        'proyectos': 'Proyectos de Investigación'
    };
    
    // Orden definido de secciones (SIN publicaciones_no_indexadas)
    const ordenSecciones = [
        'tesis_magister_guia',
        'tesis_magister_coguia',
        'tesis_doctorado_guia',
        'tesis_doctorado_coguia',
        'publicaciones_indexadas',
        'libros',
        'capitulos',
        'patentes',
        'proyectos'
    ];
    
    // Procesar secciones en orden
    for (const tipo of ordenSecciones) {
        const seccion = secciones[tipo];
        
        // Omitir Publicaciones No Indexadas
        if (tipo === 'publicaciones_no_indexadas') continue;
        
        // Procesar si existe y tiene filas
        if (seccion && seccion.filas && seccion.filas.length > 0) {
            // Filtrar desde 2020
            const filasFiltradas = filtrarDesde2020(seccion.filas);
            
            // Si no hay registros desde 2020, omitir tabla
            if (filasFiltradas.length === 0) continue;
            
            // Ordenar por año descendente y reenumerar
            const filasOrdenadas = ordenarPorAnoYRenumerar(filasFiltradas, seccion.headers);
            
            // Agregar tabla
            html += construirTabla(titulosOficiales[tipo], seccion.headers, filasOrdenadas);
        }
    }
    
    html += `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 9px;">
                <p>Reporte generado automáticamente desde el Sistema de Productividad Académica - UANDES</p>
            </div>
        </div>
    `;
    
    return html;
}

function construirTabla(titulo, headers, filas) {
    if (!filas || filas.length === 0) return '';
    
    let html = `
        <h3 style="font-size: 11px; font-weight: bold; color: #333; margin-top: 18px; margin-bottom: 8px;">${titulo}</h3>
        <table class="ficha-table" style="width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid #ddd; font-size: 10px;">
            <thead>
                <tr style="background: #f0f0f0;">
    `;
    
    // Crear headers con N° al inicio si no existe
    const headersConNumero = !headers.includes('N°') ? ['N°', ...headers] : headers;
    
    headersConNumero.forEach(header => {
        html += `<th style="padding: 6px; text-align: left; font-weight: bold; border: 1px solid #ddd; background: #f0f0f0; color: black;">${header}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    filas.forEach((fila, idx) => {
        html += `<tr>`;
        
        // Agregar número si no existe
        if (!headers.includes('N°')) {
            html += `<td style="padding: 6px; border: 1px solid #ddd; background: #fafafa;">${idx + 1}</td>`;
        }
        
        headersConNumero.forEach(header => {
            if (header !== 'N°') {
                const valor = fila[header] || 'N/D';
                html += `<td style="padding: 6px; border: 1px solid #ddd;">${valor}</td>`;
            } else if (header === 'N°') {
                html += `<td style="padding: 6px; border: 1px solid #ddd; background: #fafafa;">${fila['N°'] || idx + 1}</td>`;
            }
        });
        
        html += `</tr>`;
    });
    
    html += `</tbody></table><div style="margin-bottom: 10px;"></div>`;
    
    return html;
}

function descargarPDF() {
    if (!profesorActualFicha) {
        alert('Por favor genera la ficha primero');
        return;
    }
    
    const element = document.getElementById('ficha-pdf-content');
    const nombreArchivo = `Ficha_CNA_${profesorActualFicha.replace(/\s+/g, '_')}.pdf`;
    
    const opt = {
        margin: 8,
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
}

function generarModales(profesores) {
    const container = document.getElementById('modales-container');
    container.innerHTML = profesores.map(p => {
        const nombre = p.nombre;
        const base = datosBase[nombre];
        const produccion = datosProduccion[nombre];
        const secciones = produccion?.secciones || {};
        
        let seccionesHTML = '';
        const ordenSecciones = [
            'publicaciones_indexadas', 'publicaciones_no_indexadas', 
            'libros', 'capitulos', 'proyectos',
            'tesis_doctorado_guia', 'tesis_doctorado_coguia',
            'tesis_magister_guia', 'tesis_magister_coguia'
        ];
        
        for (const tipo of ordenSecciones) {
            const seccion = secciones[tipo];
            if (!seccion || !seccion.filas || seccion.filas.length === 0) continue;
            
            const titulo = traducirTipo(tipo);
            const headers = seccion.headers;
            
            // Aplicar orden visual por Año
            const filasOrdenadas = ordenarPorAnoYRenumerar(seccion.filas, headers);

            
            seccionesHTML += `
                <div class="info-section">
                    <div class="section-title">${titulo} (${seccion.filas.length} registros)</div>
                    <div class="table-container">
                        <table>
                            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                            <tbody>${filasOrdenadas.map(fila => `
                                <tr>${headers.map(h => `<td>${fila[h] || 'N/A'}</td>`).join('')}</tr>
                            `).join('')}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        return `
            <div id="modal-${p.id}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h2>${base.nombre}</h2>
                            <p>Vínculo: ${base.vinculo}</p>
                        </div>
                        <button class="close-btn" onclick="cerrarModal('${p.id}')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="info-section">
                            <div class="section-title">Perfil Académico</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Título Profesional</div>
                                    <div class="info-value">${base.titulo}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Grado Académico</div>
                                    <div class="info-value">${base.grado}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Líneas de Investigación</div>
                                    <div class="info-value">${base.lineas}</div>
                                </div>
                            </div>
                        </div>
                        ${seccionesHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function traducirTipo(tipo) {
    const t = {
        'publicaciones_indexadas': 'Publicaciones Indexadas',
        'publicaciones_no_indexadas': 'Publicaciones No Indexadas',
        'libros': 'Libros',
        'capitulos': 'Capítulos de Libro',
        'proyectos': 'Proyectos de Investigación',
        'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
        'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-guía)',
        'tesis_magister_guia': 'Tesis Magister (Profesor Guía)',
        'tesis_magister_coguia': 'Tesis Magister (Profesor Co-guía)'
    };
    return t[tipo] || tipo;
}

function abrirModal(id) {
    document.getElementById(`modal-${id}`).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(id) {
    document.getElementById(`modal-${id}`).classList.remove('active');
    document.body.style.overflow = 'auto';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function cambiarPagina(pagina) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`page-${pagina}`).classList.add('active');
    event.target.classList.add('active');
}

// Cargar datos al iniciar
// ============================================
// FUNCIONES DE MENÚ EXPANDIBLE
// ============================================

cargarDatos();

// ============================================
// MENÚ EXPANDIBLE
// ============================================

function toggleSubmenu(event) {
    const parent = event.currentTarget;
    const submenu = parent.nextElementSibling;
    
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
        parent.classList.toggle('active');
    }
}

// ============================================
// CONTROL DE ESTRUCTURA - VALIDACIÓN
// ============================================

function obtenerDatosValidacion() {
    const tipos_tabla = [
        'publicaciones_indexadas',
        'publicaciones_no_indexadas',
        'libros',
        'capitulos',
        'proyectos',
        'tesis_magister_guia',
        'tesis_magister_coguia',
        'tesis_doctorado_guia',
        'tesis_doctorado_coguia',
        'patentes'
    ];
    
    let tablasData = [];
    
    for (const nombreProfesor of Object.keys(datosProduccion)) {
        const profesor = datosProduccion[nombreProfesor];
        const base = datosBase[nombreProfesor] || {};
        
        if (!profesor.secciones) continue;
        
        for (const tipo of tipos_tabla) {
            if (tipo in profesor.secciones) {
                const seccion = profesor.secciones[tipo];
                const headers = seccion.headers || [];
                const filas = seccion.filas || [];
                
                const titulo = getTituloTabla(tipo);
                
                tablasData.push({
                    profesor: nombreProfesor,
                    nombre_visual: base.nombre_visual || nombreProfesor,
                    tipo: tipo,
                    titulo: titulo,
                    headers: headers.join(' | '),
                    numColumnas: headers.length,
                    numRegistros: filas.length
                });
            }
        }
    }
    
    return tablasData;
}

function getTituloTabla(tipo) {
    const titulos = {
        'publicaciones_indexadas': 'Publicaciones Indexadas',
        'publicaciones_no_indexadas': 'Publicaciones No Indexadas',
        'libros': 'Libros',
        'capitulos': 'Capítulos de Libro',
        'proyectos': 'Proyectos de Investigación',
        'tesis_magister_guia': 'Tesis Magíster (Profesor Guía)',
        'tesis_magister_coguia': 'Tesis Magíster (Profesor Co-Guía)',
        'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
        'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-Guía)',
        'patentes': 'Patentes'
    };
    return titulos[tipo] || tipo;
}

function generarValidacion() {
    console.log('🔍 generarValidacion() ejecutada');
    const container = document.getElementById('control-tabla');
    console.log('📦 container:', container);
    
    const tablasData = obtenerDatosValidacion();
    console.log('📊 tablasData:', tablasData);
    console.log('📈 Total tablas:', tablasData.length);
    
    if (!container) {
        console.error('❌ ERROR: No se encontró elemento con id="control-tabla"');
        return;
    }
    
    if (tablasData.length === 0) {
        console.warn('⚠️ AVISO: No hay datos para mostrar');
        container.innerHTML = '<p>No hay datos disponibles</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Profesor</th>
                    <th>Categoría / Tabla</th>
                    <th>Headers Detectados</th>
                    <th>Columnas</th>
                    <th>Registros</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (const tabla of tablasData) {
        html += `
            <tr>
                <td>${tabla.nombre_visual}</td>
                <td><strong>${tabla.titulo}</strong></td>
                <td style="font-family: monospace; font-size: 9px; word-break: break-all;">${tabla.headers}</td>
                <td style="text-align: center;">${tabla.numColumnas}</td>
                <td style="text-align: center;">${tabla.numRegistros}</td>
            </tr>
        `;
    }
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    console.log('✅ Tabla generada correctamente');
}


function generarNormalizacion() {
    const container = document.getElementById('normalizacion-container');
    container.innerHTML = `
        <div style="padding: 30px; text-align: center; color: #666;">
            <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">⚙️ Módulo de Corrección y Normalización</p>
            <p style="font-size: 12px; color: #999;">Herramienta para gestionar inconsistencias de estructura.</p>
        </div>
    `;
}

// ============================================
// INICIALIZACIÓN MEJORADA
// ============================================

function inicializarMejorado() {
    const profesoresConDatos = Object.keys(datosBase).map((nombre, idx) => ({
        id: `prof${String(idx + 1).padStart(2, '0')}`,
        nombre: nombre,
        nombres: datosBase[nombre].nombres || nombre,
        grado: datosBase[nombre].grado || '',
        nombreVisual: datosBase[nombre].nombre_visual || nombre,
        tieneDatos: true
    }));
    
    const profesoresSinDatos = sinFicha.map((p, idx) => ({
        id: `prof${String(Object.keys(datosBase).length + idx + 1).padStart(2, '0')}`,
        nombre: p.nombre,
        nombres: p.nombre,
        grado: '',
        nombreVisual: p.nombre,
        tieneDatos: false
    }));
    
    const profesores = [...profesoresConDatos, ...profesoresSinDatos];
    
    generarListado(profesores);
    generarModales(profesoresConDatos);
    poblarSelectorProfesores();
    
    // Mostrar/ocultar Control según MODO_ADMIN
    const botonesControl = document.querySelectorAll('.menu-control');
    
    if (MODO_ADMIN) {
        // Mostrar Control
        botonesControl.forEach(boton => {
            boton.style.display = 'block';
        });
    } else {
        // Ocultar Control completamente
        botonesControl.forEach(boton => {
            boton.style.display = 'none';
        });
    }
    
    // Generar contenido si es necesario
    if (MODO_ADMIN) {
        generarValidacion();
        generarNormalizacion();
    }
}

function cambiarPaginaMejorado(pagina) {
    // Cerrar submenú si es necesario
    if (!pagina.startsWith('control')) {
        document.querySelectorAll('.submenu').forEach(menu => {
            menu.style.display = 'none';
            const parent = menu.previousElementSibling;
            if (parent) parent.classList.remove('active');
        });
    }
    
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.submenu-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`page-${pagina}`).classList.add('active');
    event.target.classList.add('active');
    
    // Generar contenido si es necesario
    if (pagina === 'control-validacion') {
        generarValidacion();
    } else if (pagina === 'control-normalizacion') {
        generarNormalizacion();
    }
}

// Sobrescribir función cambiarPagina original
const cambiarPaginaOriginal = cambiarPagina;
window.cambiarPagina = function(pagina) {
    cambiarPaginaMejorado(pagina);
};

// Sobrescribir función inicializar original
const inicializarOriginal = inicializar;
window.inicializar = function() {
    inicializarMejorado();
};

// ============================================
// DATOS PROFESORES - REPORTE FLEXIBLE
// ============================================

let filtrosSeleccionados = {
    profesores: [],
    tablas: []
};

const mapeoTablas = {
    'publicaciones_indexadas': 'Publicaciones Indexadas',
    'publicaciones_no_indexadas': 'Publicaciones No Indexadas',
    'libros': 'Libros',
    'capitulos': 'Capítulos de Libro',
    'proyectos': 'Proyectos de Investigación',
    'tesis_magister_guia': 'Tesis Magíster (Profesor Guía)',
    'tesis_magister_coguia': 'Tesis Magíster (Profesor Co-Guía)',
    'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
    'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-Guía)',
    'patentes': 'Patentes'
};

function inicializarFiltrosDatosProfesores() {
    // Generar checkboxes de profesores
    const listaProfesores = document.getElementById('lista-profesores');
    const profesoresOrdenados = Object.keys(datosBase).sort();
    
    listaProfesores.innerHTML = profesoresOrdenados.map(nombre => {
        const base = datosBase[nombre];
        const nombreVisual = base.nombre_visual || nombre;
        return `
            <label class="checkbox-label">
                <input type="checkbox" data-profesor="${nombre}" onchange="actualizarFiltros()">
                ${nombreVisual}
            </label>
        `;
    }).join('');
    
    // Generar checkboxes de tablas
    const listaTablas = document.getElementById('lista-tablas');
    listaTablas.innerHTML = Object.entries(mapeoTablas).map(([clave, nombre]) => `
        <label class="checkbox-label">
            <input type="checkbox" data-tabla="${clave}" onchange="actualizarFiltros()">
            ${nombre}
        </label>
    `).join('');
}

function toggleTodosProfesores() {
    const checkboxTodos = document.getElementById('checkbox-todos-profesores');
    const checkboxesProfesores = document.querySelectorAll('#lista-profesores input[type="checkbox"]');
    
    checkboxesProfesores.forEach(cb => {
        cb.checked = checkboxTodos.checked;
    });
    
    actualizarFiltros();
}

function actualizarFiltros() {
    // Recopilar profesores seleccionados
    const checkboxesProfesores = document.querySelectorAll('#lista-profesores input[type="checkbox"]:checked');
    filtrosSeleccionados.profesores = Array.from(checkboxesProfesores).map(cb => cb.getAttribute('data-profesor'));
    
    // Recopilar tablas seleccionadas
    const checkboxesTablas = document.querySelectorAll('#lista-tablas input[type="checkbox"]:checked');
    filtrosSeleccionados.tablas = Array.from(checkboxesTablas).map(cb => cb.getAttribute('data-tabla'));
    
    // Actualizar estado del checkbox "Todos"
    const checkboxTodos = document.getElementById('checkbox-todos-profesores');
    const totalProfesores = Object.keys(datosBase).length;
    checkboxTodos.checked = filtrosSeleccionados.profesores.length === totalProfesores;
}

function generarReporteDatosProfesores() {
    const preview = document.getElementById('datos-reporte-preview');
    const btnDescargar = document.getElementById('btn-descargar-datos-excel');
    
    if (filtrosSeleccionados.profesores.length === 0 || filtrosSeleccionados.tablas.length === 0) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <p>Selecciona al menos un profesor y una tabla para generar el reporte</p>
            </div>
        `;
        btnDescargar.style.display = 'none';
        return;
    }
    
    const reporte = construirReporteDatos();
    preview.innerHTML = reporte.html;
    btnDescargar.style.display = 'inline-block';
}

function construirReporteDatos() {
    // Recopilar todos los headers únicos
    const headersUnicos = new Set();
    const headersPorTabla = {};
    
    // Fase 1: Identificar todos los headers
    for (const nombreProfesor of filtrosSeleccionados.profesores) {
        const produccion = datosProduccion[nombreProfesor];
        if (!produccion || !produccion.secciones) continue;
        
        for (const tipoTabla of filtrosSeleccionados.tablas) {
            if (produccion.secciones[tipoTabla]) {
                const headers = produccion.secciones[tipoTabla].headers || [];
                if (!headersPorTabla[tipoTabla]) {
                    headersPorTabla[tipoTabla] = new Set();
                }
                headers.forEach(h => {
                    headersPorTabla[tipoTabla].add(h);
                    headersUnicos.add(h);
                });
            }
        }
    }
    
    // Fase 2: Construir filas del reporte
    const filasReporte = [];
    const columnasBase = ['RUT', 'Apellido paterno', 'Apellido materno', 'Nombres', 'Nombre visual', 'Vínculo'];
    
    for (const nombreProfesor of filtrosSeleccionados.profesores) {
        const base = datosBase[nombreProfesor];
        const produccion = datosProduccion[nombreProfesor];
        
        if (!base || !produccion || !produccion.secciones) continue;
        
        for (const tipoTabla of filtrosSeleccionados.tablas) {
            if (!produccion.secciones[tipoTabla]) continue;
            
            const seccion = produccion.secciones[tipoTabla];
            const headers = seccion.headers || [];
            const filas = seccion.filas || [];
            
            // Aplicar orden visual por Año
            const filasOrdenadas = ordenarPorAnoYRenumerar(filas, headers);
            for (const fila of filasOrdenadas) {
                const filaReporte = {
                    'RUT': base.rut || 'N/D',
                    'Apellido paterno': base.apellido_paterno || 'N/D',
                    'Apellido materno': base.apellido_materno || 'N/D',
                    'Nombres': base.nombres || 'N/D',
                    'Nombre visual': base.nombre_visual || nombreProfesor,
                    'Vínculo': base.vinculo || 'N/D',
                    'Tipo de tabla': mapeoTablas[tipoTabla] || tipoTabla
                };
                
                // Agregar datos de la tabla
                for (const header of headersUnicos) {
                    if (headers.includes(header)) {
                        filaReporte[header] = fila[header] || '';
                    }
                }
                
                filasReporte.push(filaReporte);
            }
        }
    }
    
    // Fase 3: Construir HTML de la tabla
    let html = `<div class="reporte-tabla-container">`;
    
    if (filasReporte.length === 0) {
        html += `<div class="reporte-tabla-resumida">No se encontraron registros con los filtros seleccionados</div>`;
    } else {
        html += `<table class="reporte-tabla">`;
        
        // Headers
        html += `<thead><tr>`;
        columnasBase.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += `<th class="reporte-tabla-columna-tipo">Tipo de tabla</th>`;
        
        // Headers dinámicos
        Array.from(headersUnicos).sort().forEach(header => {
            html += `<th>${header}</th>`;
        });
        
        html += `</tr></thead>`;
        
        // Datos
        html += `<tbody>`;
        filasReporte.forEach(fila => {
            html += `<tr>`;
            columnasBase.forEach(col => {
                html += `<td>${fila[col] || ''}</td>`;
            });
            html += `<td class="reporte-tabla-columna-tipo">${fila['Tipo de tabla']}</td>`;
            
            Array.from(headersUnicos).sort().forEach(header => {
                html += `<td>${fila[header] || ''}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody>`;
        
        html += `</table>`;
    }
    
    html += `</div>`;
    
    return {
        html: html,
        filas: filasReporte,
        columnasBase: columnasBase,
        headersUnicos: Array.from(headersUnicos).sort()
    };
}


// ============================================
// MENÚ EXPANDIBLE REPORTERÍA
// ============================================

function toggleSubmenuReporteria(event) {
    const parent = event.currentTarget;
    const submenu = parent.nextElementSibling;
    
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
        parent.classList.toggle('active');
    }
}

// ============================================
// SOBRESCRIBIR CAMBIAR PÁGINA
// ============================================

const cambiarPaginaAnterior = cambiarPagina;

window.cambiarPagina = function(pagina) {
    // Cerrar submenús
    document.querySelectorAll('.submenu').forEach(menu => {
        menu.style.display = 'none';
        const parent = menu.previousElementSibling;
        if (parent) parent.classList.remove('active');
    });
    
    // Cambiar página
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.submenu-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`page-${pagina}`).classList.add('active');
    event.target.classList.add('active');
    
    // Inicializar sección si es necesario
    if (pagina === 'reporteria-datos-profesores') {
        inicializarFiltrosDatosProfesores();
    } else if (pagina === 'cna-resumen-claustro') {
        generarResumenClaustro();
    } else if (pagina === 'resumen-academico') {
        generarResumenAcademico();
    } else if (pagina === 'control-validacion') {
        // Ejecutar con pequeño delay para asegurar que datos estén listos
        setTimeout(() => {
            if (typeof generarValidacion === 'function') {
                generarValidacion();
            }
        }, 100);
    } else if (pagina === 'control-normalizacion') {
        // Ejecutar con pequeño delay para asegurar que datos estén listos
        setTimeout(() => {
            if (typeof generarNormalizacion === 'function') {
                generarNormalizacion();
            }
        }, 100);
    }
};

// ============================================
// ACTUALIZAR FUNCIÓN CAMBIAR PÁGINA
// ============================================

// Sobrescribir para mejorar manejo de menús
const cambiarPaginaAnteriorFunc = typeof cambiarPagina !== 'undefined' ? cambiarPagina : function() {};

function cambiarPaginaMejorada(pagina) {
    // Validar acceso a Control según MODO_ADMIN
    if (!MODO_ADMIN && (pagina.startsWith('control-') || pagina === 'control-validacion' || pagina === 'control-normalizacion')) {
        console.warn('Acceso denegado: Control requiere MODO_ADMIN = true');
        return;
    }
    
    // Cerrar TODOS los submenús
    document.querySelectorAll('.submenu').forEach(menu => {
        menu.style.display = 'none';
        const menuPadre = menu.previousElementSibling;
        if (menuPadre) {
            menuPadre.classList.remove('active');
        }
    });
    
    // Cambiar página activa
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const pageElement = document.getElementById(`page-${pagina}`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Actualizar items activos del menú
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.submenu-item').forEach(el => el.classList.remove('active'));
    
    // Marcar como activo si es submenu-item
    if (event && event.target && event.target.classList.contains('submenu-item')) {
        event.target.classList.add('active');
    }
    
    // Generar contenido dinámico si es necesario
    if (pagina === 'reporteria-datos-profesores') {
        if (typeof inicializarFiltrosDatosProfesores === 'function') {
            inicializarFiltrosDatosProfesores();
        }
    } else if (pagina === 'cna-resumen-claustro') {
        if (typeof generarResumenClaustro === 'function') {
            generarResumenClaustro();
        }
    } else if (pagina === 'control-validacion') {
        if (MODO_ADMIN && typeof generarValidacion === 'function') {
            generarValidacion();
        }
    } else if (pagina === 'control-normalizacion') {
        if (MODO_ADMIN && typeof generarNormalizacion === 'function') {
            generarNormalizacion();
        }
    }
}

// Hacer disponible globalmente

// ============================================
// TODAS LAS TABLAS - REPORTE PERSONALIZADO
// ============================================

function toggleTodasTablas() {
    const checkboxTodas = document.getElementById('checkbox-todas-tablas');
    const checkboxesTablas = document.querySelectorAll('#lista-tablas input[type="checkbox"]');
    
    checkboxesTablas.forEach(cb => {
        cb.checked = checkboxTodas.checked;
    });
    
    actualizarFiltros();
}

// ============================================
// DESCARGAR FICHA CNA EN EXCEL
// ============================================


function construirReporteDatos() {
    // Recopilar todos los headers únicos
    const headersUnicos = new Set();
    const headersPorTabla = {};
    
    // Fase 1: Identificar todos los headers
    for (const nombreProfesor of filtrosSeleccionados.profesores) {
        const produccion = datosProduccion[nombreProfesor];
        if (!produccion || !produccion.secciones) continue;
        
        for (const tipoTabla of filtrosSeleccionados.tablas) {
            if (produccion.secciones[tipoTabla]) {
                const headers = produccion.secciones[tipoTabla].headers || [];
                if (!headersPorTabla[tipoTabla]) {
                    headersPorTabla[tipoTabla] = new Set();
                }
                headers.forEach(h => {
                    headersPorTabla[tipoTabla].add(h);
                    headersUnicos.add(h);
                });
            }
        }
    }
    
    // Fase 2: Construir filas del reporte
    const filasReporte = [];
    const columnasBase = ['RUT', 'Apellido paterno', 'Apellido materno', 'Nombres', 'Nombre visual', 'Vínculo'];
    
    for (const nombreProfesor of filtrosSeleccionados.profesores) {
        const base = datosBase[nombreProfesor];
        const produccion = datosProduccion[nombreProfesor];
        
        if (!base || !produccion || !produccion.secciones) continue;
        
        for (const tipoTabla of filtrosSeleccionados.tablas) {
            if (!produccion.secciones[tipoTabla]) continue;
            
            const seccion = produccion.secciones[tipoTabla];
            const headers = seccion.headers || [];
            const filas = seccion.filas || [];
            
            // Aplicar orden visual por Año
            const filasOrdenadas = ordenarPorAnoYRenumerar(filas, headers);
            for (const fila of filasOrdenadas) {
                const filaReporte = {
                    'RUT': base.rut || 'N/D',
                    'Apellido paterno': base.apellido_paterno || 'N/D',
                    'Apellido materno': base.apellido_materno || 'N/D',
                    'Nombres': base.nombres || 'N/D',
                    'Nombre visual': base.nombre_visual || nombreProfesor,
                    'Vínculo': base.vinculo || 'N/D',
                    'Tipo de tabla': mapeoTablas[tipoTabla] || tipoTabla
                };
                
                // Agregar datos de la tabla
                for (const header of headersUnicos) {
                    if (headers.includes(header)) {
                        filaReporte[header] = fila[header] || '';
                    }
                }
                
                filasReporte.push(filaReporte);
            }
        }
    }
    
    // Fase 3: Construir HTML de la tabla con TODOS los datos visibles
    let html = `<div class="reporte-tabla-container-completo">`;
    
    if (filasReporte.length === 0) {
        html += `<div class="reporte-tabla-resumida">No se encontraron registros con los filtros seleccionados</div>`;
    } else {
        html += `<table class="reporte-tabla">`;
        
        // Headers
        html += `<thead><tr>`;
        columnasBase.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += `<th class="reporte-tabla-columna-tipo">Tipo de tabla</th>`;
        
        // Headers dinámicos
        Array.from(headersUnicos).sort().forEach(header => {
            html += `<th>${header}</th>`;
        });
        
        html += `</tr></thead>`;
        
        // Datos - SIN TRUNCAMIENTO
        html += `<tbody>`;
        filasReporte.forEach(fila => {
            html += `<tr>`;
            columnasBase.forEach(col => {
                const valor = fila[col] || '';
                html += `<td style="white-space: normal; word-break: break-word;">${valor}</td>`;
            });
            html += `<td class="reporte-tabla-columna-tipo" style="white-space: normal; word-break: break-word;">${fila['Tipo de tabla']}</td>`;
            
            Array.from(headersUnicos).sort().forEach(header => {
                const valor = fila[header] || '';
                html += `<td style="white-space: normal; word-break: break-word;">${valor}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody>`;
        
        html += `</table>`;
    }
    
    html += `</div>`;
    
    return {
        html: html,
        filas: filasReporte,
        columnasBase: columnasBase,
        headersUnicos: Array.from(headersUnicos).sort()
    };
}

// Hacer descargarFichaExcel disponible globalmente

// ============================================
// FUNCIÓN AUXILIAR: EXPORTAR CSV COMO RESPALDO
// ============================================

function exportarCSV(datos, nombreArchivo) {
    if (!datos || datos.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    try {
        // Obtener headers del primer objeto
        const headers = Object.keys(datos[0]);
        
        // Crear contenido CSV
        let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
        
        datos.forEach(fila => {
            const valores = headers.map(header => {
                const valor = fila[header] || '';
                // Escapar comillas y envolver en comillas
                return `"${String(valor).replace(/"/g, '""')}"`;
            });
            csvContent += valores.join(',') + '\n';
        });
        
        // Crear blob y descargar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', nombreArchivo);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error al exportar CSV:', error);
        alert('Error al exportar CSV: ' + error.message);
    }
}





// ============================================
// EXPORTACIÓN XLSX - VERSIÓN CORREGIDA
// ============================================

function descargarFichaExcel() {
    console.log('=== descargarFichaExcel INICIADO ===');
    
    // Verificar XLSX disponible
    if (typeof XLSX === 'undefined') {
        console.error('❌ XLSX no está disponible');
        alert('Error: Librería XLSX no cargó correctamente. Recarga la página.');
        return;
    }
    
    // Validar profesor
    if (!profesorActualFicha) {
        console.warn('❌ No hay profesor seleccionado');
        alert('Primero genera la ficha CNA antes de descargar.');
        return;
    }
    
    console.log('✓ Profesor:', profesorActualFicha);
    
    const base = datosBase[profesorActualFicha];
    const produccion = datosProduccion[profesorActualFicha];
    
    if (!base || !produccion) {
        console.warn('❌ Datos incompletos');
        alert('Primero genera la ficha CNA antes de descargar.');
        return;
    }
    
    console.log('✓ Datos encontrados');
    
    try {
        const secciones = produccion.secciones || {};
        const datos = [];
        
        // Información personal
        datos.push({
            'Sección': 'Información Personal',
            'Campo': 'Nombre',
            'Valor': base.nombre || ''
        });
        datos.push({
            'Sección': 'Información Personal',
            'Campo': 'Vínculo',
            'Valor': base.vinculo || ''
        });
        datos.push({
            'Sección': 'Información Personal',
            'Campo': 'Título Profesional',
            'Valor': base.titulo || ''
        });
        datos.push({
            'Sección': 'Información Personal',
            'Campo': 'Grado Académico',
            'Valor': base.grado || ''
        });
        datos.push({
            'Sección': 'Información Personal',
            'Campo': 'Líneas de Investigación',
            'Valor': base.lineas || ''
        });
        
        // Datos de secciones académicas
        for (const tipoSeccion in secciones) {
            const seccion = secciones[tipoSeccion];
            if (!seccion || !seccion.filas) continue;
            
            console.log(`✓ Procesando: ${tipoSeccion} (${seccion.filas.length} registros)`);
            
            for (let i = 0; i < seccion.filas.length; i++) {
                const fila = seccion.filas[i];
                const headers = seccion.headers || [];
                
                for (const header of headers) {
                    datos.push({
                        'Sección': tipoSeccion,
                        'Registro': String(i + 1),
                        'Campo': header,
                        'Valor': String(fila[header] || '')
                    });
                }
            }
        }
        
        console.log(`✓ Total de registros: ${datos.length}`);
        
        if (datos.length === 0) {
            console.warn('❌ Sin datos para exportar');
            alert('Primero genera la ficha CNA antes de descargar.');
            return;
        }
        
        // Generar XLSX
        generarXLSX(datos, 'ReporteVSC_FichaCNA.xlsx');
        console.log('=== descargarFichaExcel COMPLETADO ✓ ===');
        
    } catch (error) {
        console.error('❌ Error en descargarFichaExcel:', error);
        alert('Error: ' + error.message);
    }
}

function descargarDatosExcel() {
    console.log('=== descargarDatosExcel INICIADO ===');
    
    // Verificar XLSX disponible
    if (typeof XLSX === 'undefined') {
        console.error('❌ XLSX no está disponible');
        alert('Error: Librería XLSX no cargó correctamente. Recarga la página.');
        return;
    }
    
    try {
        const reporte = construirReporteDatos();
        
        console.log(`✓ Reporte construido con ${reporte.filas.length} filas`);
        
        if (!reporte.filas || reporte.filas.length === 0) {
            console.warn('❌ Sin datos en reporte');
            alert('Primero genera el reporte antes de descargar.');
            return;
        }
        
        console.log(`✓ Columnas base: ${reporte.columnasBase.length}`);
        console.log(`✓ Headers dinámicos: ${reporte.headersUnicos.length}`);
        
        // Generar XLSX
        generarXLSX(reporte.filas, 'ReporteVSC_Personalizado.xlsx');
        console.log('=== descargarDatosExcel COMPLETADO ✓ ===');
        
    } catch (error) {
        console.error('❌ Error en descargarDatosExcel:', error);
        alert('Error: ' + error.message);
    }
}

function descargarValidacionExcel() {
    console.log('=== descargarValidacionExcel INICIADO ===');
    
    // Verificar XLSX disponible
    if (typeof XLSX === 'undefined') {
        console.error('❌ XLSX no está disponible');
        alert('Error: Librería XLSX no cargó correctamente. Recarga la página.');
        return;
    }
    
    try {
        const tablasData = obtenerDatosValidacion();
        
        console.log(`✓ Datos de validación: ${tablasData.length} tablas`);
        
        if (!tablasData || tablasData.length === 0) {
            console.warn('❌ Sin datos de validación');
            alert('Primero genera el reporte antes de descargar.');
            return;
        }
        
        const datos = tablasData.map(tabla => ({
            'Profesor': tabla.nombre_visual,
            'Categoría': tabla.titulo,
            'Headers': tabla.headers,
            'Columnas': tabla.numColumnas,
            'Registros': tabla.numRegistros
        }));
        
        console.log(`✓ Datos transformados: ${datos.length} registros`);
        
        // Generar XLSX
        generarXLSX(datos, 'ReporteVSC_ControlEstructura.xlsx');
        console.log('=== descargarValidacionExcel COMPLETADO ✓ ===');
        
    } catch (error) {
        console.error('❌ Error en descargarValidacionExcel:', error);
        alert('Error: ' + error.message);
    }
}

function generarXLSX(datos, nombreArchivo) {
    console.log('→ generarXLSX:', nombreArchivo);
    console.log('→ Registros a procesar:', datos.length);
    
    if (!datos || datos.length === 0) {
        throw new Error('No hay datos para generar XLSX');
    }
    
    // Verificar XLSX nuevamente
    if (typeof XLSX === 'undefined' || !XLSX.utils || !XLSX.utils.json_to_sheet) {
        throw new Error('XLSX no disponible - recarga la página');
    }
    
    console.log('✓ XLSX verificado');
    
    try {
        // 1. Crear hoja desde JSON
        console.log('→ XLSX.utils.json_to_sheet()...');
        const worksheet = XLSX.utils.json_to_sheet(datos);
        console.log('✓ Hoja creada');
        
        // 2. Crear workbook
        console.log('→ XLSX.utils.book_new()...');
        const workbook = XLSX.utils.book_new();
        console.log('✓ Workbook creado');
        
        // 3. Agregar hoja al workbook
        console.log('→ XLSX.utils.book_append_sheet()...');
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
        console.log('✓ Hoja agregada al workbook');
        
        // 4. Ajustar ancho de columnas
        console.log('→ Ajustando ancho de columnas...');
        const colWidths = calcularAnchoColumnas(datos);
        worksheet['!cols'] = colWidths;
        console.log('✓ Columnas ajustadas:', colWidths.length);
        
        // 5. Descargar
        console.log('→ XLSX.writeFile()...');
        console.log('→ Archivo:', nombreArchivo);
        
        XLSX.writeFile(workbook, nombreArchivo);
        
        console.log(`✅ DESCARGA EXITOSA: ${nombreArchivo}`);
        
    } catch (error) {
        console.error('❌ Error en generarXLSX:', error);
        throw error;
    }
}

function calcularAnchoColumnas(datos) {
    if (!datos || datos.length === 0) {
        return [];
    }
    
    const headers = Object.keys(datos[0]);
    const ANCHO_MIN = 12;
    const ANCHO_MAX = 50;
    
    const colWidths = [];
    
    for (const header of headers) {
        let maxLength = header.length;
        
        // Encontrar longitud máxima en la columna
        for (const row of datos) {
            const valor = String(row[header] || '');
            const longitud = valor.split('\n').reduce((max, linea) => {
                return Math.max(max, linea.length);
            }, 0);
            maxLength = Math.max(maxLength, longitud);
        }
        
        // Aplicar límites
        const ancho = Math.min(Math.max(maxLength + 2, ANCHO_MIN), ANCHO_MAX);
        colWidths.push({ wch: ancho });
    }
    
    return colWidths;
}

// ============================================
// INICIALIZACIÓN Y DISPONIBILIDAD GLOBAL
// ============================================

// Esperar a que XLSX esté disponible
function verificarXLSX() {
    if (typeof XLSX !== 'undefined') {
        console.log('✅ XLSX cargado correctamente');
        console.log('   - XLSX.utils:', typeof XLSX.utils !== 'undefined' ? '✓' : '❌');
        console.log('   - XLSX.utils.json_to_sheet:', typeof XLSX.utils.json_to_sheet !== 'undefined' ? '✓' : '❌');
        console.log('   - XLSX.utils.book_new:', typeof XLSX.utils.book_new !== 'undefined' ? '✓' : '❌');
        console.log('   - XLSX.utils.book_append_sheet:', typeof XLSX.utils.book_append_sheet !== 'undefined' ? '✓' : '❌');
        console.log('   - XLSX.writeFile:', typeof XLSX.writeFile !== 'undefined' ? '✓' : '❌');
        return true;
    } else {
        console.warn('⚠ XLSX aún no está disponible');
        return false;
    }
}

// Hacer funciones disponibles globalmente
window.descargarFichaExcel = descargarFichaExcel;
window.descargarDatosExcel = descargarDatosExcel;
window.descargarValidacionExcel = descargarValidacionExcel;

// Verificar XLSX cuando se carga el script
console.log('');
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║   SISTEMA DE EXPORTACIÓN XLSX INICIALIZADO        ║');
console.log('╠═══════════════════════════════════════════════════╣');
console.log('║ Verificando XLSX...                               ║');

if (verificarXLSX()) {
    console.log('║                                                   ║');
    console.log('║ Estado: LISTO PARA USAR ✓                        ║');
} else {
    console.log('║                                                   ║');
    console.log('║ ⚠ XLSX no está disponible aún                    ║');
    console.log('║ Esperando carga...                                ║');
    
    // Esperar con timeout
    let intentos = 0;
    const esperar = setInterval(() => {
        intentos++;
        if (verificarXLSX()) {
            console.log('║ ✅ XLSX cargado después de', intentos, 'intentos      ║');
            clearInterval(esperar);
        } else if (intentos > 50) {
            console.log('║ ❌ XLSX no cargó después de intentos         ║');
            console.log('║ Posible error: recarga la página              ║');
            clearInterval(esperar);
        }
    }, 100);
}

console.log('╠═══════════════════════════════════════════════════╣');
console.log('║ Funciones disponibles:                            ║');
console.log('║  • descargarFichaExcel()                          ║');
console.log('║  • descargarDatosExcel()                          ║');
console.log('║  • descargarValidacionExcel()                     ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');


// ============================================
// DESCARGAR FICHA CNA EN EXCEL
// ============================================

function descargarFichaCNAExcel() {
    console.log('=== descargarFichaCNAExcel INICIADO ===');
    
    // Verificar XLSX disponible
    if (typeof XLSX === 'undefined') {
        console.error('❌ XLSX no está disponible');
        alert('Error: Librería XLSX no cargó correctamente. Recarga la página.');
        return;
    }
    
    // Validar profesor
    if (!profesorActualFicha) {
        console.warn('❌ No hay profesor seleccionado');
        alert('Primero genera la Ficha CNA antes de descargar.');
        return;
    }
    
    console.log('✓ Profesor:', profesorActualFicha);
    
    const base = datosBase[profesorActualFicha];
    const produccion = datosProduccion[profesorActualFicha];
    
    if (!base || !produccion) {
        console.warn('❌ Datos incompletos');
        alert('Primero genera la Ficha CNA antes de descargar.');
        return;
    }
    
    try {
        const secciones = produccion.secciones || {};
        
        // Crear workbook
        const workbook = XLSX.utils.book_new();
        
        // Crear filas para la hoja
        const filas = [];
        
        // Título
        filas.push(['Ficha Académica CNA']);
        filas.push([]);
        filas.push([profesorActualFicha]);
        filas.push([]);
        
        // Datos base
        filas.push(['INFORMACIÓN PERSONAL']);
        filas.push(['Nombre', base.nombre || '']);
        filas.push(['Vínculo', base.vinculo || '']);
        filas.push(['Título Profesional', base.titulo || '']);
        filas.push(['Grado Académico Máximo', base.grado || '']);
        filas.push(['Líneas de Investigación', base.lineas || '']);
        filas.push([]);
        filas.push([]);
        
        // Mapeo de nombres normalizados
        const titulosOficiales = {
            'tesis_magister_guia': 'Tesis Magíster (Profesor Guía)',
            'tesis_magister_coguia': 'Tesis Magíster (Profesor Co-Guía)',
            'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
            'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-Guía)',
            'publicaciones_indexadas': 'Publicaciones Indexadas',
            'libros': 'Libros',
            'capitulos': 'Capítulos de Libro',
            'patentes': 'Patentes',
            'proyectos': 'Proyectos de Investigación'
        };
        
        // Orden de secciones (SIN publicaciones_no_indexadas)
        const ordenSecciones = [
            'tesis_magister_guia',
            'tesis_magister_coguia',
            'tesis_doctorado_guia',
            'tesis_doctorado_coguia',
            'publicaciones_indexadas',
            'libros',
            'capitulos',
            'patentes',
            'proyectos'
        ];
        
        // Procesar secciones
        for (const tipo of ordenSecciones) {
            const seccion = secciones[tipo];
            
            if (tipo === 'publicaciones_no_indexadas') continue;
            
            if (seccion && seccion.filas && seccion.filas.length > 0) {
                // Filtrar desde 2020
                const filasFiltradas = filtrarDesde2020(seccion.filas);
                if (filasFiltradas.length === 0) continue;
                
                // Ordenar
                const filasOrdenadas = ordenarPorAnoYRenumerar(filasFiltradas, seccion.headers);
                
                // Agregar título de sección
                filas.push([titulosOficiales[tipo]]);
                filas.push(seccion.headers);
                
                // Agregar datos
                for (const fila of filasOrdenadas) {
                    const fila_array = seccion.headers.map(h => fila[h] || '');
                    filas.push(fila_array);
                }
                
                filas.push([]);
                filas.push([]);
            }
        }
        
        // Crear hoja
        console.log('→ Creando hoja...');
        const worksheet = XLSX.utils.aoa_to_sheet(filas);
        console.log('✓ Hoja creada');
        
        // Agregar al workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ficha CNA');
        console.log('✓ Hoja agregada');
        
        // Formatear columnas
        const colWidths = [];
        colWidths.push({ wch: 30 });
        colWidths.push({ wch: 50 });
        for (let i = 2; i < 20; i++) {
            colWidths.push({ wch: 25 });
        }
        worksheet['!cols'] = colWidths;
        console.log('✓ Columnas formateadas');
        
        // Descargar
        console.log('→ Descargando...');
        XLSX.writeFile(workbook, 'ReporteVSC_FichaCNA.xlsx');
        console.log('✅ DESCARGADO: ReporteVSC_FichaCNA.xlsx');
        console.log('=== descargarFichaCNAExcel COMPLETADO ✓ ===');
        
    } catch (error) {
        console.error('❌ Error en descargarFichaCNAExcel:', error);
        alert('Error: ' + error.message);
    }
}

// Hacer disponible globalmente
window.descargarFichaCNAExcel = descargarFichaCNAExcel;

console.log('✓ Función descargarFichaCNAExcel disponible globalmente');



// ============================================
// REPORTE: PROYECTOS VIGENTES DEL CLAUSTRO
// ============================================

function generarReporteProyectosVigentes() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║ 🔵 CLICK DETECTADO: generarReporteProyectosVigentes║');
    console.log('╚════════════════════════════════════════════════════╝');
    
    try {
        console.log('→ Paso 1: Verificar datos cargados');
        console.log('  datosProduccion:', typeof datosProduccion !== 'undefined' ? '✓' : '❌');
        console.log('  datosBase:', typeof datosBase !== 'undefined' ? '✓' : '❌');
        
        if (!datosProduccion || !datosBase) {
            console.error('❌ Datos no cargados');
            alert('Error: Los datos no se han cargado correctamente. Recarga la página.');
            return;
        }
        
        console.log('→ Paso 2: Obtener proyectos vigentes');
        const proyectosVigentes = [];
        
        // Recorrer todos los profesores
        for (const nombreProfesor of Object.keys(datosProduccion)) {
            console.log(`  Procesando profesor: ${nombreProfesor}`);
            
            const produccion = datosProduccion[nombreProfesor];
            const base = datosBase[nombreProfesor];
            
            if (!produccion || !produccion.secciones) {
                console.log(`    ⚠ Sin secciones`);
                continue;
            }
            
            const seccionProyectos = produccion.secciones.proyectos;
            if (!seccionProyectos || !seccionProyectos.filas) {
                console.log(`    ⚠ Sin tabla proyectos`);
                continue;
            }
            
            const filas = seccionProyectos.filas;
            console.log(`    Proyectos en tabla: ${filas.length}`);
            
            // Recorrer proyectos
            for (let i = 0; i < filas.length; i++) {
                const fila = filas[i];
                const periodo = fila['Período de ejecución'] || '';
                
                // Verificar vigencia
                if (!esProyectoVigente(periodo)) {
                    console.log(`      Fila ${i}: NO vigente (${periodo})`);
                    continue;
                }
                
                console.log(`      Fila ${i}: VIGENTE (${periodo}) ✓`);
                
                // Clasificar
                const titulo = fila['Título'] || '';
                const fuente = fila['Fuente de financiamiento'] || '';
                const clasificacion = clasificarProyecto(titulo, fuente);
                
                console.log(`        Clasificación: ${clasificacion}`);
                
                proyectosVigentes.push({
                    profesor: base?.nombre_visual || nombreProfesor,
                    titulo: titulo,
                    fuente: fuente,
                    anoAdjudicacion: fila['Año de adjudicación'] || '',
                    periodo: periodo,
                    rol: fila['Rol en el proyecto'] || '',
                    clasificacion: clasificacion
                });
            }
        }
        
        console.log(`✓ Total proyectos vigentes encontrados: ${proyectosVigentes.length}`);
        
        // Clasificar
        const internos = proyectosVigentes.filter(p => p.clasificacion === 'INTERNO');
        const externos = proyectosVigentes.filter(p => p.clasificacion === 'EXTERNO');
        
        console.log(`✓ Clasificados:`);
        console.log(`  - Internos: ${internos.length}`);
        console.log(`  - Externos: ${externos.length}`);
        
        // Obtener elemento preview
        const preview = document.getElementById('proyectos-vigentes-preview');
        console.log('→ Paso 3: Buscar elemento preview');
        console.log('  proyectos-vigentes-preview:', preview ? '✓ encontrado' : '❌ NO encontrado');
        
        if (!preview) {
            console.error('❌ No encontrado elemento proyectos-vigentes-preview');
            return;
        }
        
        // Validar que existan proyectos
        if (proyectosVigentes.length === 0) {
            console.warn('⚠️ Sin proyectos vigentes - mostrando mensaje');
            preview.innerHTML = `
                <div class="preview-placeholder" style="padding: 40px; text-align: center; background: white; border-radius: 8px;">
                    <p style="font-size: 14px; color: #666;">No se encontraron proyectos vigentes según los filtros definidos.</p>
                </div>
            `;
            document.getElementById('btn-descargar-proyectos-excel').style.display = 'none';
            console.log('✅ Mensaje "sin proyectos" mostrado');
            return;
        }
        
        // Generar HTML
        console.log('→ Paso 4: Generar HTML del reporte');
        let html = `
            <div style="background: white; padding: 20px; border-radius: 8px; font-family: Arial, sans-serif; font-size: 12px; color: #333;">
                <h1 style="font-size: 16px; font-weight: bold; margin-bottom: 20px;">Proyectos vigentes del claustro - 2026</h1>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #667eea;">${proyectosVigentes.length}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">Total vigentes</div>
                    </div>
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${internos.length}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">Internos</div>
                    </div>
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #2196f3;">${externos.length}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">Externos</div>
                    </div>
                </div>
                
                <h2 style="font-size: 13px; font-weight: bold; margin-bottom: 10px;">Detalle de proyectos</h2>
                
                <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #667eea; color: white;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #667eea;">Profesor</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #667eea;">Título</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #667eea;">Fuente de financiamiento</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #667eea;">Año adjudicación</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #667eea;">Período ejecución</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #667eea;">Rol</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #667eea;">Clasificación</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Agregar filas
        for (const proyecto of proyectosVigentes) {
            const bgColor = proyecto.clasificacion === 'INTERNO' ? '#e8f5e9' : '#e3f2fd';
            const colorClasif = proyecto.clasificacion === 'INTERNO' ? '#4caf50' : '#2196f3';
            
            html += `
                            <tr style="background: ${bgColor};">
                                <td style="padding: 8px; border: 1px solid #ddd;">${proyecto.profesor}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${proyecto.titulo}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${proyecto.fuente}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${proyecto.anoAdjudicacion}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${proyecto.periodo}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${proyecto.rol}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${colorClasif};">${proyecto.clasificacion}</td>
                            </tr>
            `;
        }
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Mostrar
        console.log('→ Paso 5: Renderizar HTML');
        preview.innerHTML = html;
        console.log('✓ HTML renderizado en preview');
        
        // Mostrar botón de descarga
        const btnDescargar = document.getElementById('btn-descargar-proyectos-excel');
        if (btnDescargar) {
            btnDescargar.style.display = 'inline-block';
            console.log('✓ Botón descarga visible');
        }
        
        // Guardar datos para descarga
        window.datosProyectosVigentes = {
            total: proyectosVigentes.length,
            internos: internos.length,
            externos: externos.length,
            proyectos: proyectosVigentes
        };
        console.log('✓ Datos guardados para descarga');
        
        console.log('');
        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║ ✅ REPORTE GENERADO EXITOSAMENTE                  ║');
        console.log('╚════════════════════════════════════════════════════╝');
        console.log('');
        
    } catch (error) {
        console.error('');
        console.error('╔════════════════════════════════════════════════════╗');
        console.error('║ ❌ ERROR EN REPORTE                               ║');
        console.error('╚════════════════════════════════════════════════════╝');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        console.error('');
        alert('Error: ' + error.message);
    }
}

function esProyectoVigente(periodo) {
    if (!periodo) return false;
    
    periodo = String(periodo).trim();
    
    // Caso 1: Año único (ej: 2026)
    if (/^\d{4}$/.test(periodo)) {
        return periodo === '2026';
    }
    
    // Caso 2: Rango de años (ej: 2022-2026 o 2024–2026)
    const rangoMatch = periodo.match(/(\d{4})\s*[-–]\s*(\d{4})/);
    if (rangoMatch) {
        const anoTermino = rangoMatch[2];
        return anoTermino === '2026';
    }
    
    // Caso 3: Fechas exactas (ej: 01/03/2024 – 20/12/2026)
    const fechasMatch = periodo.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (fechasMatch) {
        const diaTermino = parseInt(fechasMatch[4]);
        const mesTermino = parseInt(fechasMatch[5]);
        const anoTermino = parseInt(fechasMatch[6]);
        
        // Verificar si está en 2026
        if (anoTermino !== 2026) return false;
        
        // Verificar si es igual o anterior al 29 de diciembre de 2026
        const fechaTermino = new Date(anoTermino, mesTermino - 1, diaTermino);
        const limite = new Date(2026, 11, 29); // 29 de diciembre de 2026
        
        return fechaTermino <= limite;
    }
    
    return false;
}

function clasificarProyecto(titulo, fuente) {
    titulo = String(titulo || '').toUpperCase();
    fuente = String(fuente || '').toUpperCase();
    
    const esInterno = titulo.includes('FAI') || titulo.includes('UNIVERSIDAD DE LOS ANDES') ||
                      fuente.includes('FAI') || fuente.includes('UNIVERSIDAD DE LOS ANDES');
    
    return esInterno ? 'INTERNO' : 'EXTERNO';
}

function descargarProyectosVigentesExcel() {
    console.log('=== descargarProyectosVigentesExcel INICIADO ===');
    
    if (typeof XLSX === 'undefined') {
        alert('Error: Librería XLSX no disponible.');
        return;
    }
    
    if (!window.datosProyectosVigentes) {
        alert('Primero genera el reporte antes de descargar.');
        return;
    }
    
    try {
        const datos = window.datosProyectosVigentes;
        const filas = [];
        
        // Título
        filas.push(['Proyectos vigentes del claustro - 2026']);
        filas.push([]);
        
        // Resumen
        filas.push(['RESUMEN']);
        filas.push(['Total proyectos vigentes', datos.total]);
        filas.push(['Proyectos internos', datos.internos]);
        filas.push(['Proyectos externos', datos.externos]);
        filas.push([]);
        filas.push([]);
        
        // Detalle
        filas.push(['DETALLE DE PROYECTOS']);
        filas.push([
            'Profesor',
            'Título',
            'Fuente de financiamiento',
            'Año adjudicación',
            'Período ejecución',
            'Rol',
            'Clasificación'
        ]);
        
        // Proyectos
        for (const proyecto of datos.proyectos) {
            filas.push([
                proyecto.profesor,
                proyecto.titulo,
                proyecto.fuente,
                proyecto.anoAdjudicacion,
                proyecto.periodo,
                proyecto.rol,
                proyecto.clasificacion
            ]);
        }
        
        // Crear hoja
        const worksheet = XLSX.utils.aoa_to_sheet(filas);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos Vigentes');
        
        // Ajustar columnas
        const colWidths = [
            { wch: 20 },  // Profesor
            { wch: 40 },  // Título
            { wch: 25 },  // Fuente
            { wch: 15 },  // Año
            { wch: 20 },  // Período
            { wch: 20 },  // Rol
            { wch: 15 }   // Clasificación
        ];
        worksheet['!cols'] = colWidths;
        
        // Descargar
        XLSX.writeFile(workbook, 'ReporteVSC_ProyectosVigentes.xlsx');
        console.log('✅ DESCARGADO: ReporteVSC_ProyectosVigentes.xlsx');
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
}

// Hacer funciones disponibles globalmente
// ============================================
// CNA RESUMEN CLAUSTRO
// ============================================

function generarResumenClaustro() {
    const contenedor = document.getElementById('cna-resumen-contenido');
    if (!contenedor) return;
    
    // 1. ACADÉMICOS CLAUSTRO
    const academicos_claustro = Object.keys(datosBase).filter(prof => datosBase[prof].vinculo === 'Claustro').length;
    
    // 2. PUBLICACIONES INDEXADAS 2020+
    let pub_indexadas_2020 = 0;
    for (const prof in datosProduccion) {
        const secciones = datosProduccion[prof].secciones || {};
        const filas = secciones.publicaciones_indexadas?.filas || [];
        filas.forEach(fila => {
            try {
                if (parseInt(fila['Año']) >= 2020) {
                    pub_indexadas_2020++;
                }
            } catch (e) {}
        });
    }
    
    // 3. PROYECTOS VIGENTES (10-jun-2026 <= término <= 30-dic-2040)
    let proyectos_vigentes = 0;
    const fecha_inicio_vigencia = new Date(2026, 5, 10); // 10-jun-2026
    const fecha_fin_vigencia = new Date(2040, 11, 30); // 30-dic-2040
    for (const prof in datosProduccion) {
        const secciones = datosProduccion[prof].secciones || {};
        const filas = secciones.proyectos?.filas || [];
        filas.forEach(fila => {
            try {
                const termino = fila['Término'] || '';
                if (termino) {
                    const partes = termino.split('-');
                    if (partes.length === 2) {
                        const mes_str = partes[0].toLowerCase();
                        const año_str = partes[1];
                        const meses = {'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
                                       'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12};
                        const mes = meses[mes_str];
                        if (mes) {
                            const año = parseInt(`20${año_str}`);
                            const fecha_termino = new Date(año, mes - 1, 1);
                            if (fecha_termino >= fecha_inicio_vigencia && fecha_termino <= fecha_fin_vigencia) {
                                proyectos_vigentes++;
                            }
                        }
                    }
                }
            } catch (e) {}
        });
    }
    
    // 4. TESIS MAGISTER 2020+
    let tesis_magister_2020 = 0;
    for (const prof in datosProduccion) {
        const secciones = datosProduccion[prof].secciones || {};
        ['tesis_magister_guia', 'tesis_magister_coguia'].forEach(tipo => {
            const filas = secciones[tipo]?.filas || [];
            filas.forEach(fila => {
                try {
                    if (parseInt(fila['Año']) >= 2020) {
                        tesis_magister_2020++;
                    }
                } catch (e) {}
            });
        });
    }
    
    // 5. TESIS DOCTORADO 2020+
    let tesis_doctorado_2020 = 0;
    for (const prof in datosProduccion) {
        const secciones = datosProduccion[prof].secciones || {};
        ['tesis_doctorado_guia', 'tesis_doctorado_coguia'].forEach(tipo => {
            const filas = secciones[tipo]?.filas || [];
            filas.forEach(fila => {
                try {
                    if (parseInt(fila['Año']) >= 2020) {
                        tesis_doctorado_2020++;
                    }
                } catch (e) {}
            });
        });
    }
    
    // 6. LIBROS 2020+
    let libros_2020 = 0;
    for (const prof in datosProduccion) {
        const secciones = datosProduccion[prof].secciones || {};
        const filas = secciones.libros?.filas || [];
        filas.forEach(fila => {
            try {
                if (parseInt(fila['Año']) >= 2020) {
                    libros_2020++;
                }
            } catch (e) {}
        });
    }
    
    // 7. CAPÍTULOS 2020+
    let capitulos_2020 = 0;
    for (const prof in datosProduccion) {
        const secciones = datosProduccion[prof].secciones || {};
        const filas = secciones.capitulos?.filas || [];
        filas.forEach(fila => {
            try {
                if (parseInt(fila['Año']) >= 2020) {
                    capitulos_2020++;
                }
            } catch (e) {}
        });
    }
    
    // GENERAR HTML DE TABLA
    const html = `
        <div class="reporteria-card">
            <div class="card-header">
                <h2 class="card-title">Indicadores de Productividad Académica</h2>
                <p class="card-subtitle">Año 2020 en adelante</p>
            </div>
            <div class="table-container">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #f0f0f0;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">KPI</th>
                            <th style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: white;">
                            <td style="padding: 12px; border: 1px solid #ddd;">Académicos Claustro</td>
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">${academicos_claustro}</td>
                        </tr>
                        <tr style="background: #f8f8f8;">
                            <td style="padding: 12px; border: 1px solid #ddd;">Publicaciones Indexadas 2020+</td>
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">${pub_indexadas_2020}</td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 12px; border: 1px solid #ddd;">Proyectos Vigentes</td>
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">${proyectos_vigentes}</td>
                        </tr>
                        <tr style="background: #f8f8f8;">
                            <td style="padding: 12px; border: 1px solid #ddd;">Tesis Magíster Dirigidas 2020+</td>
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">${tesis_magister_2020}</td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 12px; border: 1px solid #ddd;">Tesis Doctorado Dirigidas 2020+</td>
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">${tesis_doctorado_2020}</td>
                        </tr>
                        <tr style="background: #f8f8f8;">
                            <td style="padding: 12px; border: 1px solid #ddd;">Libros 2020+</td>
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">${libros_2020}</td>
                        </tr>
                        <tr style="background: white;">
                            <td style="padding: 12px; border: 1px solid #ddd;">Capítulos 2020+</td>
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 14px;">${capitulos_2020}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    contenedor.innerHTML = html;
    console.log('✓ Resumen Claustro CNA generado correctamente');
}

// ============================================
// RESUMEN POR ACADÉMICO
// ============================================

function generarResumenAcademico() {
    const container = document.getElementById('resumen-academico-contenido');
    
    // Recopilar datos de todos los profesores
    const datosResumen = [];
    
    for (const nombreProfesor of Object.keys(datosBase)) {
        const base = datosBase[nombreProfesor];
        const produccion = datosProduccion[nombreProfesor];
        
        // Inicializar conteos
        let pub_indexadas_2020 = 0;
        let pub_no_indexadas_2020 = 0;
        let libros_2020 = 0;
        let capitulos_2020 = 0;
        let proyectos_2020 = 0;
        let tesis_magister_2020 = 0;
        let tesis_doctorado_2020 = 0;
        let proyectos_vigentes = [];
        
        // Si existe producción, contar
        if (produccion && produccion.secciones) {
            // Publicaciones Indexadas 2020+
            if (produccion.secciones.publicaciones_indexadas && produccion.secciones.publicaciones_indexadas.filas) {
                pub_indexadas_2020 = produccion.secciones.publicaciones_indexadas.filas.filter(f => parseInt(f['Año']) >= 2020).length;
            }
            
            // Publicaciones No Indexadas 2020+
            if (produccion.secciones.publicaciones_no_indexadas && produccion.secciones.publicaciones_no_indexadas.filas) {
                pub_no_indexadas_2020 = produccion.secciones.publicaciones_no_indexadas.filas.filter(f => parseInt(f['Año']) >= 2020).length;
            }
            
            // Libros 2020+
            if (produccion.secciones.libros && produccion.secciones.libros.filas) {
                libros_2020 = produccion.secciones.libros.filas.filter(f => parseInt(f['Año']) >= 2020).length;
            }
            
            // Capítulos 2020+
            if (produccion.secciones.capitulos && produccion.secciones.capitulos.filas) {
                capitulos_2020 = produccion.secciones.capitulos.filas.filter(f => parseInt(f['Año']) >= 2020).length;
            }
            
            // Proyectos 2020+ y vigentes
            if (produccion.secciones.proyectos && produccion.secciones.proyectos.filas) {
                const fecha_inicio_vigencia = new Date(2026, 5, 10); // 10-jun-2026
                
                for (const proyecto of produccion.secciones.proyectos.filas) {
                    const ano = parseInt(proyecto['Año']) || 0;
                    if (ano >= 2020) {
                        proyectos_2020++;
                        
                        // Verificar si es vigente
                        const termine = proyecto['Término'] || '';
                        if (termine) {
                            const [mes, anno] = termine.split('-');
                            const mesMap = {'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11};
                            const mesNum = mesMap[mes.toLowerCase()] || 0;
                            const annoNum = 2000 + parseInt(anno);
                            const fecha_termino = new Date(annoNum, mesNum, 1);
                            
                            if (fecha_termino >= fecha_inicio_vigencia) {
                                proyectos_vigentes.push(proyecto);
                            }
                        }
                    }
                }
            }
            
            // Tesis Magíster 2020+ (Guía + Co-Guía)
            if (produccion.secciones.tesis_magister_guia && produccion.secciones.tesis_magister_guia.filas) {
                tesis_magister_2020 += produccion.secciones.tesis_magister_guia.filas.filter(f => parseInt(f['Año']) >= 2020).length;
            }
            if (produccion.secciones.tesis_magister_coguia && produccion.secciones.tesis_magister_coguia.filas) {
                tesis_magister_2020 += produccion.secciones.tesis_magister_coguia.filas.filter(f => parseInt(f['Año']) >= 2020).length;
            }
            
            // Tesis Doctorado 2020+ (Guía + Co-Guía)
            if (produccion.secciones.tesis_doctorado_guia && produccion.secciones.tesis_doctorado_guia.filas) {
                tesis_doctorado_2020 += produccion.secciones.tesis_doctorado_guia.filas.filter(f => parseInt(f['Año']) >= 2020).length;
            }
            if (produccion.secciones.tesis_doctorado_coguia && produccion.secciones.tesis_doctorado_coguia.filas) {
                tesis_doctorado_2020 += produccion.secciones.tesis_doctorado_coguia.filas.filter(f => parseInt(f['Año']) >= 2020).length;
            }
        }
        
        datosResumen.push({
            profesor: nombreProfesor,
            nombre_visual: base.nombre_visual || nombreProfesor,
            vinculo: base.vinculo || 'N/D',
            pub_indexadas_2020: pub_indexadas_2020,
            pub_no_indexadas_2020: pub_no_indexadas_2020,
            libros_2020: libros_2020,
            capitulos_2020: capitulos_2020,
            proyectos_2020: proyectos_2020,
            tesis_magister_2020: tesis_magister_2020,
            tesis_doctorado_2020: tesis_doctorado_2020,
            proyectos_vigentes_count: proyectos_vigentes.length,
            tiene_proyectos_vigentes: proyectos_vigentes.length > 0
        });
    }
    
    // Construir tabla HTML
    let html = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd; font-size: 12px;">
            <thead>
                <tr style="background: #f0f0f0;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Profesor</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Vínculo</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Pub. Indexadas 2020+</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Pub. No Indexadas 2020+</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Libros 2020+</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Capítulos 2020+</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Proyectos 2020+</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Tesis Magíster 2020+</th>
                    <th style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">Tesis Doctorado 2020+</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Agregar filas y calcular totales
    let totales = {
        pub_indexadas_2020: 0,
        pub_no_indexadas_2020: 0,
        libros_2020: 0,
        capitulos_2020: 0,
        proyectos_2020: 0,
        tesis_magister_2020: 0,
        tesis_doctorado_2020: 0
    };
    
    for (const fila of datosResumen) {
        const bgColor = fila.tiene_proyectos_vigentes ? '#FFF9E6' : 'white';
        const bgAlternate = fila.tiene_proyectos_vigentes ? '#FFFBF0' : '#f8f8f8';
        
        html += `
            <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #ddd;">${fila.nombre_visual}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${fila.vinculo}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${fila.pub_indexadas_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${fila.pub_no_indexadas_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${fila.libros_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${fila.capitulos_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${fila.proyectos_2020}${fila.tiene_proyectos_vigentes ? ` <span style="background: #FFD700; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 10px;">${fila.proyectos_vigentes_count} vigentes</span>` : ''}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${fila.tesis_magister_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${fila.tesis_doctorado_2020}</td>
            </tr>
        `;
        
        // Acumular totales
        totales.pub_indexadas_2020 += fila.pub_indexadas_2020;
        totales.pub_no_indexadas_2020 += fila.pub_no_indexadas_2020;
        totales.libros_2020 += fila.libros_2020;
        totales.capitulos_2020 += fila.capitulos_2020;
        totales.proyectos_2020 += fila.proyectos_2020;
        totales.tesis_magister_2020 += fila.tesis_magister_2020;
        totales.tesis_doctorado_2020 += fila.tesis_doctorado_2020;
    }
    
    // Agregar fila de totales
    html += `
            <tr style="background: #f0f0f0; font-weight: bold;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">TOTAL</td>
                <td style="padding: 10px; border: 1px solid #ddd;"></td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totales.pub_indexadas_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totales.pub_no_indexadas_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totales.libros_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totales.capitulos_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totales.proyectos_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totales.tesis_magister_2020}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totales.tesis_doctorado_2020}</td>
            </tr>
    `;
    
    html += `
            </tbody>
        </table>
        <div style="font-size: 11px; color: #666; margin-top: 15px;">
            <p><strong>Nota:</strong> Los colores amarillos indican profesores con proyectos vigentes (término después del 1 de julio de 2026).</p>
        </div>
    `;
    
    container.innerHTML = html;
    console.log('✓ Resumen Académico generado correctamente');
}

// Hacer funciones disponibles globalmente
window.generarReporteProyectosVigentes = generarReporteProyectosVigentes;
window.descargarProyectosVigentesExcel = descargarProyectosVigentesExcel;
window.generarResumenClaustro = generarResumenClaustro;
window.generarResumenAcademico = generarResumenAcademico;

console.log('✓ Funciones disponibles globalmente');
