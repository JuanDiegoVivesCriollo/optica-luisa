// Variables globales
let currentSection = 'fichas';
let fichas = [];
let deudas = [];
let currentFichaId = null;
let currentDeudaId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupFormHandlers();
    setupSearchHandler();
    setupImageUpload();
    setupDeudaHandlers();
    loadFichas();
    loadStats();
}

// Navegación
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
        });
    });
}

function showSection(section) {
    // Actualizar navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const navButton = document.querySelector(`[data-section="${section}"]`);
    if (navButton) {
        navButton.classList.add('active');
    }
    
    // Mostrar sección
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error(`Sección no encontrada: ${section}-section`);
        return;
    }
    
    currentSection = section;
      // Acciones específicas por sección
    if (section === 'fichas') {
        loadFichas();
    } else if (section === 'nueva-ficha') {
        resetForm();
    } else if (section === 'deudas') {
        loadDeudas();
    } else if (section === 'nueva-deuda') {
        resetDeudaForm();
    } else if (section === 'estadisticas') {
        loadStats();
    }
}

// Manejo de formularios
function setupFormHandlers() {
    const fichaForm = document.getElementById('fichaForm');
    
    fichaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitForm();
    });
}

async function submitForm() {
    const form = document.getElementById('fichaForm');
    const formData = new FormData(form);
    
    // Validar nombre obligatorio
    const nombre = formData.get('nombre');
    if (!nombre || !nombre.trim()) {
        showToast('El nombre es obligatorio', 'error');
        return;
    }
    
    showLoadingOverlay(true);
    
    try {
        const url = currentFichaId ? `/api/fichas/${currentFichaId}` : '/api/fichas';
        const method = currentFichaId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const message = currentFichaId ? 'Ficha actualizada exitosamente' : 'Ficha creada exitosamente';
            showToast(message, 'success');
            resetForm();
            showSection('fichas');
        } else {
            showToast(result.error || 'Error al guardar la ficha', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

function resetForm() {
    const form = document.getElementById('fichaForm');
    form.reset();
    removeImage();
    currentFichaId = null;
    
    // Actualizar título de la sección
    const title = document.querySelector('#nueva-ficha-section .section-header h2');
    title.innerHTML = '<i class="fas fa-plus-circle"></i> Nueva Ficha Óptica';
}

// Búsqueda
function setupSearchHandler() {
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                searchFichas(searchTerm);
            } else {
                loadFichas();
            }
        }, 300);
    });
}

async function searchFichas(nombre) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/fichas/buscar/${encodeURIComponent(nombre)}`);
        const fichas = await response.json();
        
        if (response.ok) {
            displayFichas(fichas);
        } else {
            showToast('Error al buscar fichas', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

// Carga de imágenes
function setupImageUpload() {
    const imageInput = document.getElementById('imagen_ficha');
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            previewImage(file);
        }
    });
}

function previewImage(file) {
    const reader = new FileReader();
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        preview.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

function removeImage() {
    const imageInput = document.getElementById('imagen_ficha');
    const preview = document.getElementById('imagePreview');
    
    imageInput.value = '';
    preview.style.display = 'none';
}

// Carga y visualización de fichas
async function loadFichas() {
    showLoading(true);
    
    try {
        const response = await fetch('/api/fichas');
        fichas = await response.json();
        
        if (response.ok) {
            displayFichas(fichas);
        } else {
            showToast('Error al cargar las fichas', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

function displayFichas(fichasData) {
    const grid = document.getElementById('fichasGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (fichasData.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = fichasData.map(ficha => createFichaCard(ficha)).join('');
}

function createFichaCard(ficha) {
    const edad = ficha.edad ? `${ficha.edad} años` : 'Edad no especificada';
    const direccion = ficha.direccion || 'Dirección no especificada';
    const imagen = ficha.imagen_ficha 
        ? `<img src="/uploads/${ficha.imagen_ficha}" alt="Ficha de ${ficha.nombre}">` 
        : '<i class="fas fa-file-medical"></i>';
    
    return `
        <div class="ficha-card" onclick="verFicha('${ficha.id}')">
            <div class="ficha-header">
                <div class="ficha-info">
                    <h3>${escapeHtml(ficha.nombre)}</h3>
                    <p>ID: ${ficha.id.substring(0, 8)}...</p>
                </div>
                <div class="ficha-image">
                    ${imagen}
                </div>
            </div>
            
            <div class="ficha-details">
                <div class="detail-item">
                    <i class="fas fa-birthday-cake"></i>
                    <span>${edad}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(direccion)}</span>
                </div>
            </div>
            
            <div class="ficha-footer">
                Creada: ${ficha.fecha_formateada}
            </div>
        </div>
    `;
}

// Ver detalles de ficha
async function verFicha(id) {
    showLoadingOverlay(true);
    
    try {
        const response = await fetch(`/api/fichas/${id}`);
        const ficha = await response.json();
        
        if (response.ok) {
            currentFichaId = id;
            displayFichaDetalles(ficha);
            showSection('ver-ficha');
        } else {
            showToast('Error al cargar la ficha', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

function displayFichaDetalles(ficha) {
    const container = document.getElementById('fichaDetalles');
    
    const formatValue = (value) => value || 'No especificado';
    const formatNumber = (value) => value !== null && value !== undefined ? value : 'No especificado';
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-ES');
    };
    
    container.innerHTML = `
        <!-- Información Personal -->
        <div class="detalle-section">
            <h3><i class="fas fa-user"></i> Información Personal</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <label>Nombre Completo</label>
                    <span>${escapeHtml(ficha.nombre)}</span>
                </div>
                <div class="detalle-item">
                    <label>Edad</label>
                    <span>${formatValue(ficha.edad ? ficha.edad + ' años' : null)}</span>
                </div>
                <div class="detalle-item">
                    <label>Dirección</label>
                    <span>${escapeHtml(formatValue(ficha.direccion))}</span>
                </div>
                <div class="detalle-item">
                    <label>Fecha de Creación</label>
                    <span>${formatDate(ficha.fecha_creacion)}</span>
                </div>
            </div>
        </div>

        <!-- Visión de Lejos -->
        <div class="detalle-section">
            <h3><i class="fas fa-eye"></i> Visión de Lejos</h3>
            
            <!-- Ojo Derecho -->
            <h4><i class="fas fa-circle"></i> Ojo Derecho (OD)</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <label>Esfera</label>
                    <span>${formatNumber(ficha.od_esfera)}</span>
                </div>
                <div class="detalle-item">
                    <label>Cilindro</label>
                    <span>${formatNumber(ficha.od_cilindro)}</span>
                </div>
                <div class="detalle-item">
                    <label>Eje</label>
                    <span>${formatNumber(ficha.od_eje)}</span>
                </div>
                <div class="detalle-item">
                    <label>AV.cc</label>
                    <span>${formatValue(ficha.od_av_cc)}</span>
                </div>
            </div>
            
            <!-- Ojo Izquierdo -->
            <h4><i class="fas fa-circle"></i> Ojo Izquierdo (OI)</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <label>Esfera</label>
                    <span>${formatNumber(ficha.oi_esfera)}</span>
                </div>
                <div class="detalle-item">
                    <label>Cilindro</label>
                    <span>${formatNumber(ficha.oi_cilindro)}</span>
                </div>
                <div class="detalle-item">
                    <label>Eje</label>
                    <span>${formatNumber(ficha.oi_eje)}</span>
                </div>
                <div class="detalle-item">
                    <label>AV.cc</label>
                    <span>${formatValue(ficha.oi_av_cc)}</span>
                </div>
            </div>
        </div>

        <!-- Visión Adicional -->
        <div class="detalle-section">
            <h3><i class="fas fa-low-vision"></i> Visión Adicional</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <label>Visión de Cerca (ADD)</label>
                    <span>${formatNumber(ficha.vision_cerca_add)}</span>
                </div>
                <div class="detalle-item">
                    <label>Visión Intermedia (ADD)</label>
                    <span>${formatNumber(ficha.vision_intermedia_add)}</span>
                </div>
                <div class="detalle-item">
                    <label>Distancia Interpupilar (mm)</label>
                    <span>${formatNumber(ficha.distancia_interpupilar)}</span>
                </div>
            </div>
        </div>

        <!-- Recomendaciones -->
        <div class="detalle-section">
            <h3><i class="fas fa-clipboard-list"></i> Recomendaciones</h3>
            <div class="detalle-item">
                <label>Notas y Recomendaciones</label>
                <span style="white-space: pre-wrap;">${escapeHtml(formatValue(ficha.recomendaciones))}</span>
            </div>
        </div>

        ${ficha.imagen_ficha ? `
        <!-- Imagen de la Ficha -->
        <div class="detalle-section">
            <h3><i class="fas fa-camera"></i> Imagen de la Ficha</h3>
            <div class="ficha-imagen">
                <img src="/uploads/${ficha.imagen_ficha}" alt="Ficha física de ${escapeHtml(ficha.nombre)}">
            </div>
        </div>
        ` : ''}
    `;
}

// Editar ficha
async function editarFicha() {
    if (!currentFichaId) return;
    
    try {
        const response = await fetch(`/api/fichas/${currentFichaId}`);
        const ficha = await response.json();
        
        if (response.ok) {
            // Llenar el formulario con los datos actuales
            document.getElementById('nombre').value = ficha.nombre || '';
            document.getElementById('edad').value = ficha.edad || '';
            document.getElementById('direccion').value = ficha.direccion || '';
            
            // Ojo derecho
            document.getElementById('od_esfera').value = ficha.od_esfera || '';
            document.getElementById('od_cilindro').value = ficha.od_cilindro || '';
            document.getElementById('od_eje').value = ficha.od_eje || '';
            document.getElementById('od_av_cc').value = ficha.od_av_cc || '';
            
            // Ojo izquierdo
            document.getElementById('oi_esfera').value = ficha.oi_esfera || '';
            document.getElementById('oi_cilindro').value = ficha.oi_cilindro || '';
            document.getElementById('oi_eje').value = ficha.oi_eje || '';
            document.getElementById('oi_av_cc').value = ficha.oi_av_cc || '';
            
            // Visión adicional
            document.getElementById('vision_cerca_add').value = ficha.vision_cerca_add || '';
            document.getElementById('vision_intermedia_add').value = ficha.vision_intermedia_add || '';
            document.getElementById('distancia_interpupilar').value = ficha.distancia_interpupilar || '';
            
            // Recomendaciones
            document.getElementById('recomendaciones').value = ficha.recomendaciones || '';
            
            // Actualizar título de la sección
            const title = document.querySelector('#nueva-ficha-section .section-header h2');
            title.innerHTML = '<i class="fas fa-edit"></i> Editar Ficha Óptica';
            
            showSection('nueva-ficha');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar los datos para editar: ' + error.message, 'error');
    }
}

// Eliminar ficha
async function eliminarFicha() {
    if (!currentFichaId) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta ficha? Esta acción no se puede deshacer.')) {
        return;
    }
    
    showLoadingOverlay(true);
    
    try {
        const response = await fetch(`/api/fichas/${currentFichaId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Ficha eliminada exitosamente', 'success');
            showSection('fichas');
            currentFichaId = null;
        } else {
            const result = await response.json();
            showToast(result.error || 'Error al eliminar la ficha', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

// Estadísticas
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        if (response.ok) {
            displayStats(stats);
        } else {
            showToast('Error al cargar estadísticas', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}

function displayStats(stats) {
    const container = document.getElementById('statsGrid');
    
    container.innerHTML = `
        <!-- Estadísticas de Fichas -->
        <div class="stat-card">
            <i class="fas fa-file-medical"></i>
            <h3>${stats.fichas.total_fichas}</h3>
            <p>Total de Fichas</p>
        </div>
        
        <div class="stat-card">
            <i class="fas fa-camera"></i>
            <h3>${stats.fichas.fichas_con_imagen}</h3>
            <p>Fichas con Imagen</p>
        </div>
        
        <div class="stat-card">
            <i class="fas fa-birthday-cake"></i>
            <h3>${stats.fichas.edades_promedio}</h3>
            <p>Edad Promedio</p>
        </div>
        
        <!-- Estadísticas de Deudas -->
        <div class="stat-card">
            <i class="fas fa-money-bill-wave"></i>
            <h3>${stats.deudas.total_deudas}</h3>
            <p>Total de Deudas</p>
        </div>
        
        <div class="stat-card">
            <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
            <h3>${stats.deudas.deudas_pagadas}</h3>
            <p>Deudas Pagadas</p>
        </div>
        
        <div class="stat-card">
            <i class="fas fa-clock" style="color: var(--warning-color);"></i>
            <h3>${stats.deudas.deudas_pendientes}</h3>
            <p>Deudas Pendientes</p>
        </div>
        
        <div class="stat-card">
            <i class="fas fa-dollar-sign" style="color: var(--success-color);"></i>
            <h3>$${stats.deudas.monto_total_cobrado.toFixed(2)}</h3>
            <p>Total Cobrado</p>
        </div>
        
        <div class="stat-card">
            <i class="fas fa-exclamation-triangle" style="color: var(--warning-color);"></i>
            <h3>$${stats.deudas.monto_pendiente_cobrar.toFixed(2)}</h3>
            <p>Pendiente por Cobrar</p>
        </div>
    `;
}

// ========== FUNCIONES PARA DEUDAS ==========

function setupDeudaHandlers() {
    const deudaForm = document.getElementById('deudaForm');
    const pagoForm = document.getElementById('pagoForm');
    const searchInputDeudas = document.getElementById('searchInputDeudas');
    
    // Formulario de deudas
    deudaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitDeudaForm();
    });
    
    // Formulario de pagos
    pagoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitPagoForm();
    });
    
    // Búsqueda de deudas
    let searchTimeout;
    searchInputDeudas.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                searchDeudas(searchTerm);
            } else {
                loadDeudas();
            }
        }, 300);
    });
}

async function submitDeudaForm() {
    const form = document.getElementById('deudaForm');
    const formData = new FormData(form);
    
    // Validar campos obligatorios
    const nombre_persona = formData.get('nombre_persona');
    const monto_total = formData.get('monto_total');
    
    if (!nombre_persona || !nombre_persona.trim()) {
        showToast('El nombre de la persona es obligatorio', 'error');
        return;
    }
    
    if (!monto_total || monto_total <= 0) {
        showToast('El monto debe ser mayor a 0', 'error');
        return;
    }
    
    showLoadingOverlay(true);
    
    try {
        const url = currentDeudaId ? `/api/deudas/${currentDeudaId}` : '/api/deudas';
        const method = currentDeudaId ? 'PUT' : 'POST';
        
        const deudaData = {
            nombre_persona: nombre_persona.trim(),
            monto_total: parseFloat(monto_total),
            descripcion: formData.get('descripcion') || null,
            fecha_vencimiento: formData.get('fecha_vencimiento') || null
        };
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deudaData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const message = currentDeudaId ? 'Deuda actualizada exitosamente' : 'Deuda registrada exitosamente';
            showToast(message, 'success');
            resetDeudaForm();
            showSection('deudas');
        } else {
            showToast(result.error || 'Error al guardar la deuda', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

async function submitPagoForm() {
    if (!currentDeudaId) {
        showToast('Error: No hay deuda seleccionada', 'error');
        return;
    }
    
    const form = document.getElementById('pagoForm');
    const formData = new FormData(form);
    
    const monto = formData.get('monto_pago');
    
    if (!monto || monto <= 0) {
        showToast('El monto del pago debe ser mayor a 0', 'error');
        return;
    }
    
    showLoadingOverlay(true);
    
    try {
        const pagoData = {
            monto: parseFloat(monto),
            descripcion: formData.get('descripcion_pago') || null
        };
        
        const response = await fetch(`/api/deudas/${currentDeudaId}/pagos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pagoData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Pago registrado exitosamente', 'success');
            form.reset();
            // Recargar los detalles de la deuda
            verDeuda(currentDeudaId);
        } else {
            showToast(result.error || 'Error al registrar el pago', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

function resetDeudaForm() {
    const form = document.getElementById('deudaForm');
    form.reset();
    currentDeudaId = null;
    
    // Actualizar título de la sección
    const title = document.querySelector('#nueva-deuda-section .section-header h2');
    title.innerHTML = '<i class="fas fa-plus-circle"></i> Nueva Deuda';
}

async function loadDeudas() {
    showLoadingDeudas(true);
    
    try {
        const response = await fetch('/api/deudas');
        deudas = await response.json();
        
        if (response.ok) {
            displayDeudas(deudas);
        } else {
            showToast('Error al cargar las deudas', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingDeudas(false);
    }
}

async function searchDeudas(nombre) {
    showLoadingDeudas(true);
    
    try {
        const response = await fetch(`/api/deudas/buscar/${encodeURIComponent(nombre)}`);
        const deudas = await response.json();
        
        if (response.ok) {
            displayDeudas(deudas);
        } else {
            showToast('Error al buscar deudas', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingDeudas(false);
    }
}

function displayDeudas(deudasData) {
    const grid = document.getElementById('deudasGrid');
    const emptyState = document.getElementById('emptyStateDeudas');
    
    if (deudasData.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = deudasData.map(deuda => createDeudaCard(deuda)).join('');
}

function createDeudaCard(deuda) {
    const isVencida = deuda.fecha_vencimiento && new Date(deuda.fecha_vencimiento) < new Date() && deuda.saldo_pendiente > 0;
    const isPagada = deuda.saldo_pendiente <= 0;
    
    let cardClass = 'deuda-card';
    if (isPagada) cardClass += ' pagada';
    else if (isVencida) cardClass += ' vencida';
    
    let statusClass = 'deuda-status ';
    let statusText = '';
    let statusIcon = '';
    
    if (isPagada) {
        statusClass += 'pagada';
        statusText = 'Pagada';
        statusIcon = 'fas fa-check-circle';
    } else if (isVencida) {
        statusClass += 'vencida';
        statusText = 'Vencida';
        statusIcon = 'fas fa-exclamation-triangle';
    } else {
        statusClass += 'pendiente';
        statusText = 'Pendiente';
        statusIcon = 'fas fa-clock';
    }
    
    const vencimiento = deuda.fecha_vencimiento 
        ? `<div class="detail-item">
             <i class="fas fa-calendar-alt"></i>
             <span>Vence: ${new Date(deuda.fecha_vencimiento).toLocaleDateString('es-ES')}</span>
           </div>`
        : '';
    
    return `
        <div class="${cardClass}" onclick="verDeuda('${deuda.id}')">
            <div class="ficha-header">
                <div class="ficha-info">
                    <h3>${escapeHtml(deuda.nombre_persona)}</h3>
                    <p>ID: ${deuda.id.substring(0, 8)}...</p>
                </div>
                <div class="ficha-image">
                    <i class="fas fa-dollar-sign" style="color: var(--warning-color);"></i>
                </div>
            </div>
            
            <!-- Barra de progreso -->
            <div class="deuda-progress">
                <div class="progress-bar">
                    <div class="progress-fill ${isPagada ? 'completed' : ''}" 
                         style="width: ${deuda.porcentaje_pagado}%"></div>
                </div>
                <div style="text-align: center; margin-top: 4px; font-size: 12px; color: var(--text-secondary);">
                    ${deuda.porcentaje_pagado}% pagado
                </div>
            </div>
            
            <!-- Montos -->
            <div class="deuda-amounts">
                <div class="amount-item">
                    <label>Total</label>
                    <div class="amount">$${deuda.monto_total.toFixed(2)}</div>
                </div>
                <div class="amount-item">
                    <label>Pendiente</label>
                    <div class="amount pending">$${deuda.saldo_pendiente.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="ficha-details">
                ${vencimiento}
                <div class="detail-item">
                    <i class="fas fa-calendar-plus"></i>
                    <span>Creada: ${deuda.fecha_formateada}</span>
                </div>
            </div>
            
            <div class="ficha-footer">
                <div class="${statusClass}">
                    <i class="${statusIcon}"></i>
                    ${statusText}
                </div>
            </div>
        </div>
    `;
}

async function verDeuda(id) {
    showLoadingOverlay(true);
    
    try {
        const response = await fetch(`/api/deudas/${id}`);
        const deuda = await response.json();
        
        if (response.ok) {
            currentDeudaId = id;
            displayDeudaDetalles(deuda);
            showSection('ver-deuda');
        } else {
            showToast('Error al cargar la deuda', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

function displayDeudaDetalles(deuda) {
    const container = document.getElementById('deudaDetalles');
    const historialContainer = document.getElementById('historialPagos');
    
    const formatValue = (value) => value || 'No especificado';
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-ES');
    };
    
    const isVencida = deuda.fecha_vencimiento && new Date(deuda.fecha_vencimiento) < new Date() && deuda.saldo_pendiente > 0;
    const isPagada = deuda.saldo_pendiente <= 0;
    
    let statusClass = 'deuda-status ';
    let statusText = '';
    let statusIcon = '';
    
    if (isPagada) {
        statusClass += 'pagada';
        statusText = 'Pagada Completamente';
        statusIcon = 'fas fa-check-circle';
    } else if (isVencida) {
        statusClass += 'vencida';
        statusText = 'Vencida';
        statusIcon = 'fas fa-exclamation-triangle';
    } else {
        statusClass += 'pendiente';
        statusText = 'Pendiente de Pago';
        statusIcon = 'fas fa-clock';
    }
    
    container.innerHTML = `
        <!-- Información de la Deuda -->
        <div class="detalle-section">
            <h3><i class="fas fa-user"></i> Información de la Deuda</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <label>Persona</label>
                    <span>${escapeHtml(deuda.nombre_persona)}</span>
                </div>
                <div class="detalle-item">
                    <label>Estado</label>
                    <span class="${statusClass}">
                        <i class="${statusIcon}"></i>
                        ${statusText}
                    </span>
                </div>
                <div class="detalle-item">
                    <label>Monto Total</label>
                    <span style="font-weight: 600; font-size: 18px;">$${deuda.monto_total.toFixed(2)}</span>
                </div>
                <div class="detalle-item">
                    <label>Saldo Pendiente</label>
                    <span style="font-weight: 600; font-size: 18px; color: ${isPagada ? 'var(--success-color)' : 'var(--warning-color)'};">
                        $${deuda.saldo_pendiente.toFixed(2)}
                    </span>
                </div>
                <div class="detalle-item">
                    <label>Total Pagado</label>
                    <span style="font-weight: 600; color: var(--success-color);">$${deuda.total_pagado.toFixed(2)}</span>
                </div>
                <div class="detalle-item">
                    <label>Porcentaje Pagado</label>
                    <span style="font-weight: 600;">${deuda.porcentaje_pagado}%</span>
                </div>
                <div class="detalle-item">
                    <label>Fecha de Creación</label>
                    <span>${formatDate(deuda.fecha_creacion)}</span>
                </div>
                <div class="detalle-item">
                    <label>Fecha de Vencimiento</label>
                    <span>${deuda.fecha_vencimiento ? new Date(deuda.fecha_vencimiento).toLocaleDateString('es-ES') : 'Sin fecha límite'}</span>
                </div>
            </div>
            
            ${deuda.descripcion ? `
            <div class="detalle-item" style="margin-top: 16px;">
                <label>Descripción</label>
                <span style="white-space: pre-wrap;">${escapeHtml(deuda.descripcion)}</span>
            </div>
            ` : ''}
            
            <!-- Barra de progreso detallada -->
            <div class="deuda-progress" style="margin-top: 20px;">
                <div class="progress-bar" style="height: 12px;">
                    <div class="progress-fill ${isPagada ? 'completed' : ''}" 
                         style="width: ${deuda.porcentaje_pagado}%"></div>
                </div>
                <div style="text-align: center; margin-top: 8px; font-weight: 500;">
                    Progreso de Pago: ${deuda.porcentaje_pagado}%
                </div>
            </div>
        </div>
    `;
    
    // Mostrar historial de pagos
    if (deuda.pagos_formateados && deuda.pagos_formateados.length > 0) {
        historialContainer.innerHTML = deuda.pagos_formateados.map(pago => `
            <div class="pago-item">
                <div class="pago-info">
                    <div class="pago-monto">$${pago.monto.toFixed(2)}</div>
                    ${pago.descripcion ? `<div class="pago-descripcion">${escapeHtml(pago.descripcion)}</div>` : ''}
                    <div class="pago-fecha">${pago.fecha_formateada}</div>
                </div>
                <div class="pago-actions">
                    <button class="btn btn-danger btn-small" onclick="eliminarPago('${deuda.id}', '${pago.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        historialContainer.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <i class="fas fa-receipt" style="font-size: 32px; margin-bottom: 16px; color: var(--text-secondary);"></i>
                <h4>No hay pagos registrados</h4>
                <p>Los pagos aparecerán aquí una vez que los registres</p>
            </div>
        `;
    }
    
    // Actualizar el campo de monto máximo para el nuevo pago
    const montoPagoInput = document.getElementById('monto_pago');
    if (montoPagoInput) {
        montoPagoInput.max = deuda.saldo_pendiente;
        montoPagoInput.placeholder = `Máximo: $${deuda.saldo_pendiente.toFixed(2)}`;
    }
}

async function editarDeuda() {
    if (!currentDeudaId) return;
    
    try {
        const response = await fetch(`/api/deudas/${currentDeudaId}`);
        const deuda = await response.json();
        
        if (response.ok) {
            // Llenar el formulario con los datos actuales
            document.getElementById('nombre_persona').value = deuda.nombre_persona || '';
            document.getElementById('monto_total').value = deuda.monto_total || '';
            document.getElementById('descripcion').value = deuda.descripcion || '';
            document.getElementById('fecha_vencimiento').value = deuda.fecha_vencimiento ? deuda.fecha_vencimiento.split('T')[0] : '';
            
            // Actualizar título de la sección
            const title = document.querySelector('#nueva-deuda-section .section-header h2');
            title.innerHTML = '<i class="fas fa-edit"></i> Editar Deuda';
            
            showSection('nueva-deuda');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar los datos para editar: ' + error.message, 'error');
    }
}

async function eliminarDeuda() {
    if (!currentDeudaId) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta deuda? Esta acción eliminará también todo el historial de pagos y no se puede deshacer.')) {
        return;
    }
    
    showLoadingOverlay(true);
    
    try {
        const response = await fetch(`/api/deudas/${currentDeudaId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Deuda eliminada exitosamente', 'success');
            showSection('deudas');
            currentDeudaId = null;
        } else {
            const result = await response.json();
            showToast(result.error || 'Error al eliminar la deuda', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

async function eliminarPago(deudaId, pagoId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este pago?')) {
        return;
    }
    
    showLoadingOverlay(true);
    
    try {
        const response = await fetch(`/api/deudas/${deudaId}/pagos/${pagoId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Pago eliminado exitosamente', 'success');
            // Recargar los detalles de la deuda
            verDeuda(deudaId);
        } else {
            const result = await response.json();
            showToast(result.error || 'Error al eliminar el pago', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

function showLoadingDeudas(show) {
    const loading = document.getElementById('loadingDeudas');
    const grid = document.getElementById('deudasGrid');
    
    if (show) {
        loading.style.display = 'block';
        grid.style.display = 'none';
    } else {
        loading.style.display = 'none';
        grid.style.display = 'grid';
    }
}

// Utilidades UI
function showLoading(show) {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('fichasGrid');
    
    if (show) {
        loading.style.display = 'block';
        grid.style.display = 'none';
    } else {
        loading.style.display = 'none';
        grid.style.display = 'grid';
    }
}

function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Funciones globales para los botones del HTML
window.showSection = showSection;
window.verFicha = verFicha;
window.editarFicha = editarFicha;
window.eliminarFicha = eliminarFicha;
window.resetForm = resetForm;
window.removeImage = removeImage;

// Funciones globales para deudas
window.verDeuda = verDeuda;
window.editarDeuda = editarDeuda;
window.eliminarDeuda = eliminarDeuda;
window.resetDeudaForm = resetDeudaForm;
window.eliminarPago = eliminarPago;
