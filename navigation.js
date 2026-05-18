// ============================================
// NAVIGATION.JS - Lógica de navegación y menú
// ============================================

// Manejar clicks en modales de profesores
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Abrir modal de profesor
function abrirModal(id) {
    document.getElementById(`modal-${id}`).classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de profesor
function cerrarModal(id) {
    document.getElementById(`modal-${id}`).classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Cambiar página/vista
function cambiarPagina(pagina) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`page-${pagina}`).classList.add('active');
    event.target.classList.add('active');
}

// Abrir/cerrar menú Reportería
function toggleMenuReporteria(event) {
    event.stopPropagation();
    const menuReporteria = document.getElementById("menu-reporteria");
    const submenuReporteria = document.getElementById("submenu-reporteria");
    
    submenuReporteria.style.display = submenuReporteria.style.display === "none" ? "block" : "none";
    menuReporteria.classList.toggle("active");
}

// Abrir/cerrar menú Control
function toggleMenuControl(event) {
    event.stopPropagation();
    const menuControl = document.getElementById("menu-control");
    const submenuControl = document.getElementById("submenu-control");
    
    submenuControl.style.display = submenuControl.style.display === "none" ? "block" : "none";
    menuControl.classList.toggle("active");
}

// Hacer funciones disponibles globalmente
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.cambiarPagina = cambiarPagina;
window.toggleMenuReporteria = toggleMenuReporteria;
window.toggleMenuControl = toggleMenuControl;
