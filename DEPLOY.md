# 🚀 Despliegue en Vercel - Óptica Luisa

## Pasos para desplegar en Vercel

### 1. **Preparar el repositorio**
```bash
# Si no tienes Git inicializado
git init
git add .
git commit -m "Sistema Óptica Luisa - Versión JSON completa"

# Subir a GitHub (crea un repo nuevo en GitHub primero)
git remote add origin https://github.com/TU_USUARIO/optica-luisa.git
git branch -M main
git push -u origin main
```

### 2. **Desplegar en Vercel**
1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con tu cuenta de GitHub
3. Clic en "New Project"
4. Importa tu repositorio de GitHub
5. Vercel detectará automáticamente que es un proyecto Node.js
6. Clic en "Deploy"

### 3. **Configuración automática**
Vercel usará estos archivos de configuración:
- `vercel.json` - Configuración de rutas y build
- `package.json` - Dependencias y scripts

### 4. **¡Listo!**
Tu aplicación estará disponible en una URL como:
`https://optica-luisa-xxx.vercel.app`

## ⚠️ Limitaciones en Vercel

### Almacenamiento de archivos
- **Problema**: Vercel no persiste archivos subidos (uploads)
- **Solución**: Las imágenes se perderán en cada deploy
- **Alternativa**: Usar un servicio como Cloudinary para imágenes

### Base de datos JSON
- **Funciona**: Los archivos JSON se mantienen entre requests
- **Limitación**: Se reinician en cada deploy
- **Recomendación**: Para producción, considera usar una base de datos real

## 🔧 Configuración adicional

### Variables de entorno (opcional)
En Vercel Dashboard > Settings > Environment Variables:
```
NODE_ENV=production
```

### Dominio personalizado
En Vercel Dashboard > Settings > Domains:
- Agregar tu dominio personalizado si tienes uno

## 📱 Uso después del despliegue

### Acceder al sistema
- Ir a tu URL de Vercel
- El sistema funciona igual que en local
- Los datos se mantienen mientras no hagas redeploy

### Hacer cambios
1. Editar código localmente
2. Hacer commit y push a GitHub
3. Vercel desplegará automáticamente

## 🆚 Comparación de opciones

### Vercel (Recomendado para pruebas)
- ✅ Gratis
- ✅ Fácil despliegue
- ✅ Auto-deploy desde GitHub
- ❌ No persiste archivos subidos
- ❌ JSON se reinicia en cada deploy

### Render (Mejor para producción)
- ✅ Gratis con persistencia de archivos
- ✅ Base de datos PostgreSQL gratis
- ✅ No se reinicia el sistema
- ❌ Más lento el despliegue inicial

### Railway
- ✅ Muy fácil de usar
- ✅ Persiste archivos
- ❌ Límites de uso más estrictos

## 🔄 Migrar a base de datos real (Futuro)

Si el sistema crece, puedes migrar fácilmente:
1. **Supabase** (PostgreSQL gratis)
2. **PlanetScale** (MySQL gratis)
3. **MongoDB Atlas** (MongoDB gratis)

Los datos JSON actuales se pueden importar fácilmente.

---

## 🎉 ¡Tu sistema estará online en 5 minutos!

Sigue los pasos de arriba y tendrás el sistema administrativo de Óptica Luisa funcionando en internet, accesible desde cualquier dispositivo.
