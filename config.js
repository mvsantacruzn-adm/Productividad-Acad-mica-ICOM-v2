// ============================================
// CONFIG.JS - Constantes de Configuración
// ============================================
// Este archivo contiene constantes globales reutilizables
// Sin cambios funcionales, solo organización

// ============================================
// PROFESORES SIN FICHA ACADÉMICA
// ============================================
const PROFESORES_SIN_FICHA = [
    { nombre: 'Hugo Benedetti', resumen: 'Finanzas. Por completar datos.' },
    { nombre: 'María José Bosch', resumen: 'Management. Por completar datos.' },
    { nombre: 'Matias Braun', resumen: 'Finanzas Corporativas. Por completar datos.' },
    { nombre: 'Natalia Yankovic', resumen: 'Investigación de Operaciones. Por completar datos.' }
];

// ============================================
// MAPEO DE TABLAS ACADÉMICAS
// ============================================
const MAPEO_TABLAS = {
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

// ============================================
// NOMBRES DE SECCIONES ACADÉMICAS
// ============================================
const NOMBRES_SECCIONES = {
    'publicaciones_indexadas': 'Publicaciones Indexadas',
    'publicaciones_no_indexadas': 'Publicaciones No Indexadas',
    'libros': 'Libros',
    'capitulos': 'Capítulos de Libro',
    'patentes': 'Patentes',
    'proyectos': 'Proyectos de Investigación',
    'tesis_magister_guia': 'Tesis Magíster (Profesor Guía)',
    'tesis_magister_coguia': 'Tesis Magíster (Profesor Co-Guía)',
    'tesis_doctorado_guia': 'Tesis Doctorado (Profesor Guía)',
    'tesis_doctorado_coguia': 'Tesis Doctorado (Profesor Co-Guía)'
};

// ============================================
// RUTAS DE ARCHIVOS DE DATOS
// ============================================
const ARCHIVOS_DATOS = {
    base: 'profesores-base.json',
    produccion: 'profesores-produccion.json'
};

// ============================================
// IDs DE ELEMENTOS HTML CLAVE
// ============================================
const IDS_ELEMENTOS = {
    listaProfesores: 'lista-profesores',
    listaTablas: 'lista-tablas',
    checkboxTodosProfesores: 'checkbox-todos-profesores',
    checkboxTodasTablas: 'checkbox-todas-tablas',
    profesorSelect: 'profesor-select',
    profesorList: 'profesor-list',
    fichaPreview: 'ficha-cna-preview',
    datosReportePreview: 'datos-reporte-preview',
    proyectosVigentesPreview: 'proyectos-vigentes-preview'
};

// ============================================
// MODO ADMINISTRADOR
// ============================================
// Nota: MODO_ADMIN está en index.html como variable global
// Se usa: if (MODO_ADMIN) { mostrar Control }
// Valor por defecto: true (desde index.html)

console.log('✓ config.js cargado - constantes disponibles');
