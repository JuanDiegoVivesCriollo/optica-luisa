# Óptica Luisa - Versión JSON

Sistema administrativo para la gestión de fichas ópticas usando **JSON como base de datos local**. ¡Completamente gratis y sin servicios externos!

## 🚀 Características

- ✅ **Sin base de datos externa** - Los datos se guardan en archivos JSON
- ✅ **Completamente gratuito** - Sin servicios pagos ni límites
- ✅ **Fácil de usar** - Solo necesitas Node.js
- ✅ **Almacenamiento de imágenes** local en la carpeta `uploads/`
- ✅ **Búsqueda rápida** por nombre de paciente
- ✅ **Estadísticas** del sistema
- ✅ **Diseño responsivo** para móvil y desktop
- ✅ **Funciones completas** de CRUD (Crear, Leer, Actualizar, Eliminar)

## 📋 Instalación

### 1. **Instalar dependencias**
```bash
cd json-version
npm install
```

### 2. **Iniciar el servidor**
```bash
# Modo desarrollo (con auto-reinicio)
npm run dev

# Modo producción
npm start
```

### 3. **Acceder al sistema**
Abre tu navegador en: `http://localhost:3000`

## 🗃️ Estructura de Datos

### Archivo: `data/fichas.json`
Los datos se almacenan en formato JSON:

```json
[
  {
    "id": "1674834567890abc123def",
    "nombre": "Juan Pérez",
    "edad": 30,
    "direccion": "Calle Falsa 123",
    "fecha_creacion": "2025-01-27T10:30:00.000Z",
    
    "od_esfera": 1.25,
    "od_cilindro": -0.50,
    "od_eje": 90,
    "od_av_cc": "20/20",
    
    "oi_esfera": 1.00,
    "oi_cilindro": -0.25,
    "oi_eje": 85,
    "oi_av_cc": "20/20",
    
    "vision_cerca_add": 2.00,
    "vision_intermedia_add": 1.00,
    "distancia_interpupilar": 62,
    
    "recomendaciones": "Usar gafas para leer",
    "imagen_ficha": "ficha-1674834567890-123456789.jpg",
    "updated_at": "2025-01-27T10:30:00.000Z"
  }
]
```

### Imágenes
Las imágenes se almacenan en la carpeta `uploads/` con nombres únicos.

## 🔧 API Endpoints

### Fichas
- `GET /api/fichas` - Obtener todas las fichas
- `GET /api/fichas/:id` - Obtener ficha específica
- `POST /api/fichas` - Crear nueva ficha (con imagen)
- `PUT /api/fichas/:id` - Actualizar ficha
- `DELETE /api/fichas/:id` - Eliminar ficha
- `GET /api/fichas/buscar/:nombre` - Buscar fichas por nombre

### Estadísticas
- `GET /api/stats` - Obtener estadísticas del sistema

## 📁 Estructura del Proyecto

```
json-version/
├── public/              # Frontend
│   ├── index.html      # Página principal
│   ├── styles.css      # Estilos CSS
│   └── app.js          # JavaScript del frontend
├── data/               # Base de datos JSON
│   └── fichas.json     # Archivo principal de datos
├── uploads/            # Imágenes subidas
├── server.js          # Servidor Node.js/Express
├── package.json       # Dependencias
└── README.md          # Este archivo
```

## 🎯 Ventajas de esta versión

### ✅ **Simplicidad**
- No necesitas configurar MySQL ni Firebase
- Solo archivos JSON simples
- Fácil de respaldar (copia la carpeta `data/`)

### ✅ **Costo cero**
- Sin servicios de terceros
- Sin límites de uso
- Sin mensualidades

### ✅ **Portabilidad**
- Copia la carpeta completa a cualquier servidor
- Funciona en cualquier hosting con Node.js
- Fácil de migrar

### ✅ **Control total**
- Tienes todos los datos localmente
- Puedes editarlos manualmente si es necesario
- Sin dependencias externas

## 🚀 Despliegue

### Para uso local
El sistema ya está listo para usar localmente en `http://localhost:3000`

### Para despliegue en producción
Puedes desplegar en cualquier hosting que soporte Node.js:
- **Render** (gratis)
- **Railway** (gratis con límites)
- **Heroku** (con plan gratis limitado)
- **VPS** (DigitalOcean, Linode, etc.)

## 📊 Limitaciones

### ⚠️ **Rendimiento**
- Para uso de 1 persona: Excelente
- Para 1000-3000 fichas: Muy bueno
- Para 10,000+ fichas: Considera migrar a MySQL

### ⚠️ **Concurrencia**
- Perfecto para 1 usuario
- Para múltiples usuarios simultáneos: Considera una base de datos real

### ⚠️ **Backup**
- Recuerda hacer copias de seguridad de la carpeta `data/` y `uploads/`

## 🔒 Seguridad

- Validación de archivos de imagen
- Límite de 5MB por imagen
- Sanitización de datos de entrada
- Protección contra inyección de HTML

## 📱 Uso del Sistema

### Crear Nueva Ficha
1. Clic en "Nueva Ficha"
2. Llenar información (solo nombre es obligatorio)
3. Opcionalmente subir imagen
4. Guardar

### Buscar Fichas
- Usar la barra de búsqueda
- Busca en tiempo real por nombre

### Ver/Editar/Eliminar
- Clic en cualquier ficha para ver detalles
- Botones para editar o eliminar

### Estadísticas
- Ver totales y promedios en la sección "Stats"

## 🛠️ Solución de Problemas

### El servidor no inicia
```bash
# Verificar que Node.js esté instalado
node --version

# Instalar dependencias
npm install

# Iniciar en modo debug
npm run dev
```

### Error de permisos
```bash
# En Windows, ejecutar como administrador
# En Linux/Mac:
sudo npm start
```

### Datos perdidos
- Verificar que exista la carpeta `data/`
- Verificar que `fichas.json` esté en `data/fichas.json`
- El sistema auto-crea los archivos si no existen

---

## 🎉 ¡Tu sistema está listo!

Este es el sistema más simple y directo para gestionar fichas ópticas:
- **Sin configuraciones complejas**
- **Sin servicios externos**
- **Sin costos**
- **Funcional al 100%**

¡Perfecto para uso personal de Óptica Luisa! 👓
