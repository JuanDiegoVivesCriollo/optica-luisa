const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'ficha-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
});

// Archivos JSON para almacenar los datos
const FICHAS_FILE = path.join(__dirname, 'data', 'fichas.json');
const DEUDAS_FILE = path.join(__dirname, 'data', 'deudas.json');

// Asegurar que existan los directorios necesarios
async function ensureDirectories() {
    await fs.ensureDir('uploads');
    await fs.ensureDir('data');
    
    // Crear archivo de fichas si no existe
    if (!await fs.pathExists(FICHAS_FILE)) {
        await fs.writeJson(FICHAS_FILE, []);
    }
    
    // Crear archivo de deudas si no existe
    if (!await fs.pathExists(DEUDAS_FILE)) {
        await fs.writeJson(DEUDAS_FILE, []);
    }
}

// Funciones para manejar el archivo JSON
async function readFichas() {
    try {
        return await fs.readJson(FICHAS_FILE);
    } catch (error) {
        console.error('Error leyendo fichas:', error);
        return [];
    }
}

async function writeFichas(fichas) {
    try {
        await fs.writeJson(FICHAS_FILE, fichas, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Error escribiendo fichas:', error);
        return false;
    }
}

// Funciones para manejar deudas
async function readDeudas() {
    try {
        return await fs.readJson(DEUDAS_FILE);
    } catch (error) {
        console.error('Error leyendo deudas:', error);
        return [];
    }
}

async function writeDeudas(deudas) {
    try {
        await fs.writeJson(DEUDAS_FILE, deudas, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Error escribiendo deudas:', error);
        return false;
    }
}

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Rutas API

// Obtener todas las fichas
app.get('/api/fichas', async (req, res) => {
    try {
        const fichas = await readFichas();
        
        // Ordenar por fecha de creación (más recientes primero)
        const fichasOrdenadas = fichas.sort((a, b) => 
            new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
        );
        
        // Formatear fechas para mostrar
        const fichasFormateadas = fichasOrdenadas.map(ficha => ({
            ...ficha,
            fecha_formateada: new Date(ficha.fecha_creacion).toLocaleString('es-ES')
        }));
        
        res.json(fichasFormateadas);
    } catch (error) {
        console.error('Error obteniendo fichas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener una ficha específica
app.get('/api/fichas/:id', async (req, res) => {
    try {
        const fichas = await readFichas();
        const ficha = fichas.find(f => f.id === req.params.id);
        
        if (!ficha) {
            return res.status(404).json({ error: 'Ficha no encontrada' });
        }
        
        res.json(ficha);
    } catch (error) {
        console.error('Error obteniendo ficha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear nueva ficha
app.post('/api/fichas', upload.single('imagen_ficha'), async (req, res) => {
    try {
        const {
            nombre, edad, direccion,
            od_esfera, od_cilindro, od_eje, od_av_cc,
            oi_esfera, oi_cilindro, oi_eje, oi_av_cc,
            vision_cerca_add, vision_intermedia_add,
            distancia_interpupilar, recomendaciones
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        const imagen_ficha = req.file ? req.file.filename : null;
        const id = generateId();

        const nuevaFicha = {
            id,
            nombre: nombre.trim(),
            edad: edad ? parseInt(edad) : null,
            direccion: direccion || null,
            fecha_creacion: new Date().toISOString(),
            
            // Ojo derecho
            od_esfera: od_esfera ? parseFloat(od_esfera) : null,
            od_cilindro: od_cilindro ? parseFloat(od_cilindro) : null,
            od_eje: od_eje ? parseInt(od_eje) : null,
            od_av_cc: od_av_cc || null,
            
            // Ojo izquierdo
            oi_esfera: oi_esfera ? parseFloat(oi_esfera) : null,
            oi_cilindro: oi_cilindro ? parseFloat(oi_cilindro) : null,
            oi_eje: oi_eje ? parseInt(oi_eje) : null,
            oi_av_cc: oi_av_cc || null,
            
            // Visión adicional
            vision_cerca_add: vision_cerca_add ? parseFloat(vision_cerca_add) : null,
            vision_intermedia_add: vision_intermedia_add ? parseFloat(vision_intermedia_add) : null,
            distancia_interpupilar: distancia_interpupilar ? parseInt(distancia_interpupilar) : null,
            
            // Extras
            recomendaciones: recomendaciones || null,
            imagen_ficha: imagen_ficha,
            updated_at: new Date().toISOString()
        };

        const fichas = await readFichas();
        fichas.push(nuevaFicha);
        
        const success = await writeFichas(fichas);
        
        if (success) {
            res.status(201).json({ 
                id: id, 
                message: 'Ficha creada exitosamente',
                imagen_ficha: imagen_ficha
            });
        } else {
            res.status(500).json({ error: 'Error al guardar la ficha' });
        }

    } catch (error) {
        console.error('Error creando ficha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar ficha
app.put('/api/fichas/:id', upload.single('imagen_ficha'), async (req, res) => {
    try {
        const {
            nombre, edad, direccion,
            od_esfera, od_cilindro, od_eje, od_av_cc,
            oi_esfera, oi_cilindro, oi_eje, oi_av_cc,
            vision_cerca_add, vision_intermedia_add,
            distancia_interpupilar, recomendaciones
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        const fichas = await readFichas();
        const fichaIndex = fichas.findIndex(f => f.id === req.params.id);
        
        if (fichaIndex === -1) {
            return res.status(404).json({ error: 'Ficha no encontrada' });
        }

        const fichaActual = fichas[fichaIndex];
        const imagen_ficha = req.file ? req.file.filename : fichaActual.imagen_ficha;

        const fichaActualizada = {
            ...fichaActual,
            nombre: nombre.trim(),
            edad: edad ? parseInt(edad) : null,
            direccion: direccion || null,
            
            // Ojo derecho
            od_esfera: od_esfera ? parseFloat(od_esfera) : null,
            od_cilindro: od_cilindro ? parseFloat(od_cilindro) : null,
            od_eje: od_eje ? parseInt(od_eje) : null,
            od_av_cc: od_av_cc || null,
            
            // Ojo izquierdo
            oi_esfera: oi_esfera ? parseFloat(oi_esfera) : null,
            oi_cilindro: oi_cilindro ? parseFloat(oi_cilindro) : null,
            oi_eje: oi_eje ? parseInt(oi_eje) : null,
            oi_av_cc: oi_av_cc || null,
            
            // Visión adicional
            vision_cerca_add: vision_cerca_add ? parseFloat(vision_cerca_add) : null,
            vision_intermedia_add: vision_intermedia_add ? parseFloat(vision_intermedia_add) : null,
            distancia_interpupilar: distancia_interpupilar ? parseInt(distancia_interpupilar) : null,
            
            // Extras
            recomendaciones: recomendaciones || null,
            imagen_ficha: imagen_ficha,
            updated_at: new Date().toISOString()
        };

        fichas[fichaIndex] = fichaActualizada;
        
        const success = await writeFichas(fichas);
        
        if (success) {
            res.json({ message: 'Ficha actualizada exitosamente' });
        } else {
            res.status(500).json({ error: 'Error al actualizar la ficha' });
        }

    } catch (error) {
        console.error('Error actualizando ficha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar ficha
app.delete('/api/fichas/:id', async (req, res) => {
    try {
        const fichas = await readFichas();
        const fichaIndex = fichas.findIndex(f => f.id === req.params.id);
        
        if (fichaIndex === -1) {
            return res.status(404).json({ error: 'Ficha no encontrada' });
        }

        // Eliminar imagen asociada si existe
        const ficha = fichas[fichaIndex];
        if (ficha.imagen_ficha) {
            const imagePath = path.join(__dirname, 'uploads', ficha.imagen_ficha);
            try {
                await fs.remove(imagePath);
            } catch (error) {
                console.log('No se pudo eliminar la imagen:', error.message);
            }
        }

        fichas.splice(fichaIndex, 1);
        
        const success = await writeFichas(fichas);
        
        if (success) {
            res.json({ message: 'Ficha eliminada exitosamente' });
        } else {
            res.status(500).json({ error: 'Error al eliminar la ficha' });
        }

    } catch (error) {
        console.error('Error eliminando ficha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Buscar fichas por nombre
app.get('/api/fichas/buscar/:nombre', async (req, res) => {
    try {
        const nombre = req.params.nombre.toLowerCase();
        const fichas = await readFichas();
        
        const fichasFiltradas = fichas.filter(ficha => 
            ficha.nombre.toLowerCase().includes(nombre)
        );
        
        // Ordenar por fecha de creación (más recientes primero)
        const fichasOrdenadas = fichasFiltradas.sort((a, b) => 
            new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
        );
        
        // Formatear fechas para mostrar
        const fichasFormateadas = fichasOrdenadas.map(ficha => ({
            ...ficha,
            fecha_formateada: new Date(ficha.fecha_creacion).toLocaleString('es-ES')
        }));
        
        res.json(fichasFormateadas);
    } catch (error) {
        console.error('Error buscando fichas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ========== RUTAS API PARA DEUDAS ==========

// Obtener todas las deudas
app.get('/api/deudas', async (req, res) => {
    try {
        const deudas = await readDeudas();
        
        // Calcular montos y ordenar por fecha de creación (más recientes primero)
        const deudasCalculadas = deudas.map(deuda => {
            const totalPagado = deuda.pagos ? deuda.pagos.reduce((sum, pago) => sum + pago.monto, 0) : 0;
            const saldoPendiente = deuda.monto_total - totalPagado;
            const porcentajePagado = deuda.monto_total > 0 ? Math.round((totalPagado / deuda.monto_total) * 100) : 0;
            
            return {
                ...deuda,
                total_pagado: totalPagado,
                saldo_pendiente: saldoPendiente,
                porcentaje_pagado: porcentajePagado,
                estado_calculado: saldoPendiente <= 0 ? 'Pagada' : 'Pendiente',
                fecha_formateada: new Date(deuda.fecha_creacion).toLocaleString('es-ES')
            };
        }).sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        
        res.json(deudasCalculadas);
    } catch (error) {
        console.error('Error obteniendo deudas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener una deuda específica con historial de pagos
app.get('/api/deudas/:id', async (req, res) => {
    try {
        const deudas = await readDeudas();
        const deuda = deudas.find(d => d.id === req.params.id);
        
        if (!deuda) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }
        
        // Calcular información adicional
        const totalPagado = deuda.pagos ? deuda.pagos.reduce((sum, pago) => sum + pago.monto, 0) : 0;
        const saldoPendiente = deuda.monto_total - totalPagado;
        const porcentajePagado = deuda.monto_total > 0 ? Math.round((totalPagado / deuda.monto_total) * 100) : 0;
        
        const deudaCompleta = {
            ...deuda,
            total_pagado: totalPagado,
            saldo_pendiente: saldoPendiente,
            porcentaje_pagado: porcentajePagado,
            estado_calculado: saldoPendiente <= 0 ? 'Pagada' : 'Pendiente',
            pagos_formateados: deuda.pagos ? deuda.pagos.map(pago => ({
                ...pago,
                fecha_formateada: new Date(pago.fecha).toLocaleString('es-ES')
            })) : []
        };
        
        res.json(deudaCompleta);
    } catch (error) {
        console.error('Error obteniendo deuda:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear nueva deuda
app.post('/api/deudas', async (req, res) => {
    try {
        const { nombre_persona, monto_total, descripcion, fecha_vencimiento } = req.body;

        // Validar campos obligatorios
        if (!nombre_persona || !nombre_persona.trim()) {
            return res.status(400).json({ error: 'El nombre de la persona es obligatorio' });
        }
        
        if (!monto_total || monto_total <= 0) {
            return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
        }

        const id = generateId();

        const nuevaDeuda = {
            id,
            nombre_persona: nombre_persona.trim(),
            monto_total: parseFloat(monto_total),
            descripcion: descripcion || null,
            fecha_creacion: new Date().toISOString(),
            fecha_vencimiento: fecha_vencimiento || null,
            pagos: [],
            updated_at: new Date().toISOString()
        };

        const deudas = await readDeudas();
        deudas.push(nuevaDeuda);
        
        const success = await writeDeudas(deudas);
        
        if (success) {
            res.status(201).json({ 
                id: id, 
                message: 'Deuda registrada exitosamente'
            });
        } else {
            res.status(500).json({ error: 'Error al guardar la deuda' });
        }

    } catch (error) {
        console.error('Error creando deuda:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Agregar pago a una deuda
app.post('/api/deudas/:id/pagos', async (req, res) => {
    try {
        const { monto, descripcion } = req.body;
        const deudaId = req.params.id;

        // Validar monto
        if (!monto || monto <= 0) {
            return res.status(400).json({ error: 'El monto del pago debe ser mayor a 0' });
        }

        const deudas = await readDeudas();
        const deudaIndex = deudas.findIndex(d => d.id === deudaId);
        
        if (deudaIndex === -1) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }

        const deuda = deudas[deudaIndex];
        
        // Calcular saldo actual
        const totalPagado = deuda.pagos ? deuda.pagos.reduce((sum, pago) => sum + pago.monto, 0) : 0;
        const saldoActual = deuda.monto_total - totalPagado;
          // Validar que el pago no exceda la deuda
        if (parseFloat(monto) > saldoActual) {
            return res.status(400).json({ 
                error: `El pago (S/${monto}) excede el saldo pendiente (S/${saldoActual.toFixed(2)})` 
            });
        }

        const nuevoPago = {
            id: generateId(),
            monto: parseFloat(monto),
            descripcion: descripcion || null,
            fecha: new Date().toISOString()
        };

        if (!deuda.pagos) {
            deuda.pagos = [];
        }
        
        deuda.pagos.push(nuevoPago);
        deuda.updated_at = new Date().toISOString();
        
        const success = await writeDeudas(deudas);
        
        if (success) {
            const nuevoSaldo = saldoActual - parseFloat(monto);
            res.json({ 
                message: 'Pago registrado exitosamente',
                nuevo_saldo: nuevoSaldo,
                pago_id: nuevoPago.id
            });
        } else {
            res.status(500).json({ error: 'Error al registrar el pago' });
        }

    } catch (error) {
        console.error('Error registrando pago:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar deuda
app.put('/api/deudas/:id', async (req, res) => {
    try {
        const { nombre_persona, monto_total, descripcion, fecha_vencimiento } = req.body;

        // Validar campos obligatorios
        if (!nombre_persona || !nombre_persona.trim()) {
            return res.status(400).json({ error: 'El nombre de la persona es obligatorio' });
        }
        
        if (!monto_total || monto_total <= 0) {
            return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
        }

        const deudas = await readDeudas();
        const deudaIndex = deudas.findIndex(d => d.id === req.params.id);
        
        if (deudaIndex === -1) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }

        const deudaActual = deudas[deudaIndex];

        const deudaActualizada = {
            ...deudaActual,
            nombre_persona: nombre_persona.trim(),
            monto_total: parseFloat(monto_total),
            descripcion: descripcion || null,
            fecha_vencimiento: fecha_vencimiento || null,
            updated_at: new Date().toISOString()
        };

        deudas[deudaIndex] = deudaActualizada;
        
        const success = await writeDeudas(deudas);
        
        if (success) {
            res.json({ message: 'Deuda actualizada exitosamente' });
        } else {
            res.status(500).json({ error: 'Error al actualizar la deuda' });
        }

    } catch (error) {
        console.error('Error actualizando deuda:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar deuda
app.delete('/api/deudas/:id', async (req, res) => {
    try {
        const deudas = await readDeudas();
        const deudaIndex = deudas.findIndex(d => d.id === req.params.id);
        
        if (deudaIndex === -1) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }

        deudas.splice(deudaIndex, 1);
        
        const success = await writeDeudas(deudas);
        
        if (success) {
            res.json({ message: 'Deuda eliminada exitosamente' });
        } else {
            res.status(500).json({ error: 'Error al eliminar la deuda' });
        }

    } catch (error) {
        console.error('Error eliminando deuda:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar un pago específico
app.delete('/api/deudas/:deudaId/pagos/:pagoId', async (req, res) => {
    try {
        const { deudaId, pagoId } = req.params;
        
        const deudas = await readDeudas();
        const deudaIndex = deudas.findIndex(d => d.id === deudaId);
        
        if (deudaIndex === -1) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }

        const deuda = deudas[deudaIndex];
        
        if (!deuda.pagos || deuda.pagos.length === 0) {
            return res.status(404).json({ error: 'No hay pagos registrados' });
        }

        const pagoIndex = deuda.pagos.findIndex(p => p.id === pagoId);
        
        if (pagoIndex === -1) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        deuda.pagos.splice(pagoIndex, 1);
        deuda.updated_at = new Date().toISOString();
        
        const success = await writeDeudas(deudas);
        
        if (success) {
            res.json({ message: 'Pago eliminado exitosamente' });
        } else {
            res.status(500).json({ error: 'Error al eliminar el pago' });
        }

    } catch (error) {
        console.error('Error eliminando pago:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Buscar deudas por nombre de persona
app.get('/api/deudas/buscar/:nombre', async (req, res) => {
    try {
        const nombre = req.params.nombre.toLowerCase();
        const deudas = await readDeudas();
        
        const deudasFiltradas = deudas.filter(deuda => 
            deuda.nombre_persona.toLowerCase().includes(nombre)
        );
        
        // Calcular montos y ordenar
        const deudasCalculadas = deudasFiltradas.map(deuda => {
            const totalPagado = deuda.pagos ? deuda.pagos.reduce((sum, pago) => sum + pago.monto, 0) : 0;
            const saldoPendiente = deuda.monto_total - totalPagado;
            const porcentajePagado = deuda.monto_total > 0 ? Math.round((totalPagado / deuda.monto_total) * 100) : 0;
            
            return {
                ...deuda,
                total_pagado: totalPagado,
                saldo_pendiente: saldoPendiente,
                porcentaje_pagado: porcentajePagado,
                estado_calculado: saldoPendiente <= 0 ? 'Pagada' : 'Pendiente',
                fecha_formateada: new Date(deuda.fecha_creacion).toLocaleString('es-ES')
            };
        }).sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        
        res.json(deudasCalculadas);
    } catch (error) {
        console.error('Error buscando deudas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Estadísticas básicas
app.get('/api/stats', async (req, res) => {
    try {
        const fichas = await readFichas();
        const deudas = await readDeudas();
        
        // Estadísticas de fichas
        const fichasStats = {
            total_fichas: fichas.length,
            fichas_con_imagen: fichas.filter(f => f.imagen_ficha).length,
            edades_promedio: fichas.filter(f => f.edad).length > 0 
                ? Math.round(fichas.filter(f => f.edad).reduce((sum, f) => sum + f.edad, 0) / fichas.filter(f => f.edad).length)
                : 0,
            ultima_creacion: fichas.length > 0 
                ? new Date(Math.max(...fichas.map(f => new Date(f.fecha_creacion)))).toLocaleString('es-ES')
                : null
        };
        
        // Estadísticas de deudas
        const deudasConCalculos = deudas.map(deuda => {
            const totalPagado = deuda.pagos ? deuda.pagos.reduce((sum, pago) => sum + pago.monto, 0) : 0;
            const saldoPendiente = deuda.monto_total - totalPagado;
            return {
                ...deuda,
                total_pagado: totalPagado,
                saldo_pendiente: saldoPendiente
            };
        });
        
        const deudasStats = {
            total_deudas: deudas.length,
            deudas_pendientes: deudasConCalculos.filter(d => d.saldo_pendiente > 0).length,
            deudas_pagadas: deudasConCalculos.filter(d => d.saldo_pendiente <= 0).length,
            monto_total_prestado: deudas.reduce((sum, d) => sum + d.monto_total, 0),
            monto_total_cobrado: deudasConCalculos.reduce((sum, d) => sum + d.total_pagado, 0),
            monto_pendiente_cobrar: deudasConCalculos.reduce((sum, d) => sum + Math.max(0, d.saldo_pendiente), 0),
            ultima_deuda: deudas.length > 0 
                ? new Date(Math.max(...deudas.map(d => new Date(d.fecha_creacion)))).toLocaleString('es-ES')
                : null
        };
        
        const stats = {
            fichas: fichasStats,
            deudas: deudasStats
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta principal - servir el HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores de multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande (máximo 5MB)' });
        }
    }
    res.status(500).json({ error: error.message });
});

// Inicializar servidor
async function startServer() {
    await ensureDirectories();
    
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📱 Sistema Administrativo - Óptica Luisa (Versión JSON)`);
        console.log(`📄 Archivo de datos: ${FICHAS_FILE}`);
    });
}

// Para desarrollo local
if (require.main === module) {
    startServer();
}

// Para Vercel (serverless)
module.exports = app;

// Asegurar directorios en serverless
ensureDirectories();
