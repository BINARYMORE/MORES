# BLINKER 2.0 - Sistema Profesional de WhatsApp

**Creación por el equipo Lyntrax**

Sistema local avanzado de envío de mensajes de WhatsApp con interfaz web moderna y funcionalidades profesionales.

## 🚀 Características Principales

- ✅ **Interfaz moderna con navegación por pestañas**
- ✅ **Conexión local estable con WhatsApp Web**
- ✅ **Envío de mensajes individuales y masivos**
- ✅ **Gestión completa de contactos**
- ✅ **Envío de imágenes con descripción**
- ✅ **Importación desde Excel/CSV**
- ✅ **Persistencia local de datos**
- ✅ **Configuración de retrasos personalizables**
- ✅ **Sistema de notificaciones en tiempo real**
- ✅ **Interfaz responsive para móviles**
- ✅ **Manejo robusto de errores**

## 📋 Requisitos del Sistema

- **Node.js** (versión 16 o superior)
- **Google Chrome** o Chromium instalado
- **WhatsApp** en tu teléfono móvil
- **Windows 10/11**, **macOS** o **Linux**

## 🛠️ Instalación Paso a Paso

### 1. Preparar el entorno
\`\`\`bash
# Verificar que Node.js esté instalado
node --version
npm --version
\`\`\`

### 2. Instalar el sistema
\`\`\`bash
# Navegar a la carpeta del proyecto
cd blinker-whatsapp

# Instalar dependencias
npm install

# Iniciar el sistema
npm start
\`\`\`

### 3. Acceder al sistema
- Abrir navegador en: `http://localhost:3000`
- El sistema estará listo para usar

## 📱 Guía de Uso Completa

### 🔗 Conexión WhatsApp
1. Ir a la pestaña **"Conexión"**
2. Hacer clic en **"Conectar WhatsApp"**
3. Escanear el código QR con WhatsApp
4. Esperar confirmación de conexión

### 💬 Mensajes Individuales
1. Ir a la pestaña **"Mensaje Individual"**
2. **Para texto:**
   - Ingresar número con código de país (ej: +573001234567)
   - Escribir mensaje
   - Hacer clic en **"Enviar Mensaje"**
3. **Para imágenes:**
   - Ingresar número de teléfono
   - Seleccionar imagen
   - Agregar descripción (opcional)
   - Hacer clic en **"Enviar Imagen"**

### 👥 Gestión de Contactos
1. Ir a la pestaña **"Contactos"**
2. **Agregar manualmente:**
   - Completar nombre y teléfono
   - Hacer clic en **"Agregar"**
3. **Importar desde Excel/CSV:**
   - Preparar archivo con columnas: `nombre` y `telefono`
   - Seleccionar archivo
   - Hacer clic en **"Importar Contactos"**
4. **Gestionar contactos:**
   - Seleccionar contactos con checkboxes
   - Usar **"Seleccionar Todos"** o **"Eliminar Seleccionados"**

### 📤 Envío Masivo
1. Ir a la pestaña **"Envío Masivo"**
2. **A contactos seleccionados:**
   - Escribir mensaje (usar `{nombre}` para personalizar)
   - Adjuntar imagen (opcional)
   - Hacer clic en **"Enviar a Contactos Seleccionados"**
3. **A todos los contactos:**
   - Escribir mensaje
   - Adjuntar imagen (opcional)
   - Hacer clic en **"Enviar a Todos los Contactos"**

### ⚙️ Configuración
1. Ir a la pestaña **"Configuración"**
2. Ajustar **retraso entre mensajes** (5-60 segundos)
3. Hacer clic en **"Guardar Configuración"**

## 📊 Formato de Archivos

### Excel/CSV para importar contactos:
| nombre          | telefono      |
|-----------------|---------------|
| Juan Pérez      | +573001234567 |
| María González  | +573007654321 |

**Nombres de columnas aceptados:**
- **Nombres:** `nombre`, `name`, `Name`, `NOMBRE`
- **Teléfonos:** `telefono`, `phone`, `numero`, `celular`, `Phone`, `TELEFONO`

## 🔧 Solución de Problemas

### ❌ Error: "Execution context was destroyed"
**Solución:**
- Cerrar completamente el sistema (Ctrl+C)
- Reiniciar con `npm start`
- Volver a conectar WhatsApp

### ❌ No se genera código QR
**Solución:**
- Verificar que Chrome esté instalado
- Limpiar cache: eliminar carpeta `data/whatsapp-session`
- Reiniciar el sistema

### ❌ Mensajes no se envían
**Solución:**
- Verificar conexión de WhatsApp (estado "Conectado")
- Usar números con código de país: `+573001234567`
- Verificar que WhatsApp no esté bloqueado

### ❌ Error al importar Excel
**Solución:**
- Usar formato `.xlsx` o `.csv`
- Verificar nombres de columnas correctos
- Asegurar que no haya celdas vacías en números

### ❌ Sistema lento o se cuelga
**Solución:**
- Aumentar retraso entre mensajes (15-30 segundos)
- Enviar en lotes más pequeños
- Reiniciar el sistema

## 📁 Estructura del Proyecto

\`\`\`
blinker-whatsapp/
├── index.js                 # Servidor principal con API
├── package.json            # Dependencias y configuración
├── README.md              # Documentación completa
├── .gitignore             # Archivos a ignorar
├── public/                # Interfaz web
│   ├── index.html         # Página principal con pestañas
│   ├── styles.css         # Estilos modernos y responsive
│   └── script.js          # Lógica del frontend
├── data/                  # Datos locales (se crea automáticamente)
│   ├── contacts.json      # Contactos guardados
│   ├── config.json        # Configuración del sistema
│   └── whatsapp-session/  # Sesión de WhatsApp
└── uploads/               # Archivos temporales
\`\`\`

## 🚚 Entrega e Instalación para Cliente

### Preparar entrega:
1. **Copiar carpeta completa** a USB o enviar por email
2. **Incluir instrucciones de instalación**
3. **Proporcionar soporte inicial**

### Instrucciones para el cliente:
1. **Instalar Node.js:**
   - Descargar desde: https://nodejs.org
   - Instalar versión LTS (recomendada)
   - Reiniciar computadora

2. **Instalar BLINKER 2.0:**
   - Descomprimir carpeta del proyecto
   - Abrir terminal/cmd en la carpeta
   - Ejecutar: `npm install`
   - Ejecutar: `npm start`
   - Abrir navegador en: `http://localhost:3000`

3. **Primer uso:**
   - Conectar WhatsApp escaneando QR
   - Importar contactos desde Excel
   - Configurar retraso de mensajes
   - ¡Listo para usar!

## ⚠️ Notas Importantes

### Límites y Recomendaciones:
- **Retraso mínimo:** 5 segundos entre mensajes
- **Retraso recomendado:** 10-15 segundos para uso normal
- **Lotes grandes:** Usar 20-30 segundos de retraso
- **Máximo diario:** Respetar límites de WhatsApp (~1000 mensajes)

### Seguridad y Privacidad:
- **Datos locales:** Todo se guarda en tu computadora
- **Sin internet:** Solo necesita internet para conexión inicial
- **Sesión persistente:** No necesita escanear QR repetidamente
- **Archivos temporales:** Se eliminan automáticamente

### Mantenimiento:
- **Backup:** Respaldar carpeta `data/` regularmente
- **Actualizaciones:** Contactar al equipo Lyntrax
- **Limpieza:** Eliminar archivos de `uploads/` ocasionalmente

## 🆘 Soporte Técnico

### Contacto del Equipo Lyntrax:
- **Email:** soporte@lyntrax.com
- **WhatsApp:** +57 300 123 4567
- **Horario:** Lunes a Viernes, 8:00 AM - 6:00 PM

### Antes de contactar soporte:
1. Verificar que Node.js esté instalado correctamente
2. Probar reiniciar el sistema
3. Revisar la consola del navegador (F12) para errores
4. Tener lista la descripción detallada del problema

## 📄 Licencia y Términos

- **Uso comercial:** Permitido
- **Modificaciones:** Permitidas
- **Redistribución:** Con autorización del equipo Lyntrax
- **Soporte:** Incluido por 6 meses
- **Actualizaciones:** Gratuitas por 1 año

---

## 🎉 ¡BLINKER 2.0 está listo para revolucionar tu comunicación por WhatsApp!

**Desarrollado con ❤️ por el equipo Lyntrax**

*Sistema profesional, confiable y fácil de usar para todas tus necesidades de mensajería masiva.*
