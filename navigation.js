// ============================================
// NAVIGATION.JS - Delegación de navegación
// ============================================

// Las funciones de navegación están definidas en script.js
// Este archivo simplemente asegura que estén disponibles globalmente

// window.cambiarPagina - definida en script.js
// window.toggleMenuReporteria - definida en script.js
// window.toggleMenuControl - definida en script.js
// window.abrirModal - definida en script.js
// window.cerrarModal - definida en script.js

// Hacer disponibles globalmente cuando script.js se haya cargado
document.addEventListener('DOMContentLoaded', function() {
    // Las funciones ya están en window gracias a script.js
    console.log('✓ Navigation delegada a script.js');
});
