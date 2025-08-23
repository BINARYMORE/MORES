const express = require("express")
const fileUpload = require("express-fileupload")
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js")
const qrcode = require("qrcode")
const XLSX = require("xlsx")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = 3000

// Configuración de Express
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  }),
)

// Servir archivos estáticos
const publicPath = path.join(__dirname, "public")
console.log(`📁 Sirviendo archivos estáticos desde: ${publicPath}`)
app.use(express.static(publicPath))

// Variables globales
let client
let qrString = ""
let isClientReady = false
let connectionStatus = "disconnected"

const DATA_FILE = path.join(__dirname, "data", "contacts.json")
const CONFIG_FILE = path.join(__dirname, "data", "config.json")

// Crear directorio de datos si no existe
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"))
}

// Funciones de persistencia
function loadContacts() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8")
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("Error cargando contactos:", error)
  }
  return []
}

function saveContacts(contacts) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2))
    console.log(`💾 Contactos guardados: ${contacts.length} registros`)
  } catch (error) {
    console.error("Error guardando contactos:", error)
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8")
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("Error cargando configuración:", error)
  }
  return { messageDelay: 10 }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error("Error guardando configuración:", error)
  }
}

// Inicializar cliente de WhatsApp
function initializeWhatsAppClient() {
  // Limpiar cliente anterior si existe
  if (client) {
    try {
      client.removeAllListeners()
      client.destroy()
    } catch (error) {
      console.log("Cliente anterior limpiado")
    }
  }

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "whatsapp-sender-v2",
      dataPath: path.join(__dirname, "data", "whatsapp-session"),
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-default-apps",
        "--disable-hang-monitor",
        "--disable-prompt-on-repost",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--no-default-browser-check",
        "--safebrowsing-disable-auto-update",
        "--enable-automation",
        "--password-store=basic",
        "--use-mock-keychain",
      ],
      executablePath: undefined, // Usar Chrome/Chromium del sistema
      timeout: 60000,
    },
    webVersionCache: {
      type: "remote",
      remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    takeoverOnConflict: true,
    takeoverTimeoutMs: 60000,
  })

  client.on("qr", (qr) => {
    console.log("📱 QR Code generado, escanea con WhatsApp")
    qrString = qr
    connectionStatus = "qr_ready"
  })

  client.on("ready", () => {
    console.log("✅ Cliente de WhatsApp listo!")
    isClientReady = true
    connectionStatus = "connected"
    qrString = ""
  })

  client.on("authenticated", () => {
    console.log("🔐 Cliente autenticado")
    connectionStatus = "authenticated"
  })

  client.on("auth_failure", (msg) => {
    console.error("❌ Error de autenticación:", msg)
    connectionStatus = "auth_failed"
    isClientReady = false

    // Limpiar sesión corrupta
    const sessionPath = path.join(__dirname, "data", "whatsapp-session")
    if (fs.existsSync(sessionPath)) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true })
        console.log("🗑️ Sesión corrupta eliminada")
      } catch (error) {
        console.error("Error eliminando sesión:", error)
      }
    }

    setTimeout(() => {
      console.log("🔄 Reintentando conexión...")
      initializeWhatsAppClient()
    }, 10000)
  })

  client.on("disconnected", (reason) => {
    console.log("🔌 Cliente desconectado:", reason)
    isClientReady = false
    connectionStatus = "disconnected"

    setTimeout(() => {
      console.log("🔄 Reintentando conexión...")
      initializeWhatsAppClient()
    }, 5000)
  })

  client.on("error", (error) => {
    console.error("❌ Error del cliente WhatsApp:", error.message)

    if (
      error.message.includes("Execution context was destroyed") ||
      error.message.includes("Target closed") ||
      error.message.includes("Session closed")
    ) {
      console.log("🔄 Reiniciando cliente por error de contexto...")
      isClientReady = false
      connectionStatus = "error"

      setTimeout(() => {
        initializeWhatsAppClient()
      }, 8000)
    }
  })

  const initPromise = client.initialize()

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Timeout de inicialización")), 120000) // 2 minutos
  })

  Promise.race([initPromise, timeoutPromise]).catch((error) => {
    console.error("❌ Error inicializando cliente:", error.message)
    isClientReady = false
    connectionStatus = "error"

    setTimeout(() => {
      console.log("🔄 Reintentando inicialización...")
      initializeWhatsAppClient()
    }, 15000)
  })
}

// Rutas de la API

// Ruta principal - servir la interfaz
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html")
  console.log(`📄 Sirviendo index.html desde: ${indexPath}`)

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send(`
      <h1>Error: Archivos no encontrados</h1>
      <p>Ruta buscada: ${indexPath}</p>
      <p>Directorio actual: ${__dirname}</p>
      <p>Archivos disponibles: ${fs.readdirSync(__dirname).join(", ")}</p>
    `)
  }
})

// Obtener estado de conexión
app.get("/api/status", (req, res) => {
  res.json({
    status: connectionStatus,
    isReady: isClientReady,
    hasQR: qrString !== "",
  })
})

// Obtener QR code
app.get("/api/qr", async (req, res) => {
  if (qrString) {
    try {
      const qrImage = await qrcode.toDataURL(qrString)
      res.json({ qr: qrImage })
    } catch (error) {
      res.status(500).json({ error: "Error generando QR" })
    }
  } else {
    res.json({ qr: null })
  }
})

app.get("/api/contacts", (req, res) => {
  const contacts = loadContacts()
  res.json({ contacts, total: contacts.length })
})

app.get("/api/config", (req, res) => {
  const config = loadConfig()
  res.json(config)
})

app.post("/api/config", (req, res) => {
  const { messageDelay } = req.body
  const config = { messageDelay: Number.parseInt(messageDelay) || 10 }
  saveConfig(config)
  res.json({ success: true, config })
})

// Inicializar conexión
app.post("/api/initialize", (req, res) => {
  if (!client) {
    initializeWhatsAppClient()
    res.json({ message: "Inicializando cliente de WhatsApp..." })
  } else {
    res.json({ message: "Cliente ya inicializado" })
  }
})

// Enviar mensaje individual
app.post("/api/send-message", async (req, res) => {
  const { phone, message } = req.body

  if (!isClientReady) {
    return res.status(400).json({ error: "Cliente de WhatsApp no está listo" })
  }

  if (!phone || !message) {
    return res.status(400).json({ error: "Teléfono y mensaje son requeridos" })
  }

  try {
    // Formatear número de teléfono
    let formattedPhone = phone.replace(/\D/g, "")
    if (!formattedPhone.includes("@c.us")) {
      formattedPhone = formattedPhone + "@c.us"
    }

    await client.sendMessage(formattedPhone, message)
    console.log(`✅ Mensaje enviado a ${phone}`)
    res.json({ success: true, message: "Mensaje enviado correctamente" })
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error)
    res.status(500).json({ error: "Error enviando mensaje: " + error.message })
  }
})

// Enviar imagen
app.post("/api/send-image", async (req, res) => {
  const { phone, message } = req.body

  if (!isClientReady) {
    return res.status(400).json({ error: "Cliente de WhatsApp no está listo" })
  }

  if (!req.files || !req.files.image) {
    return res.status(400).json({ error: "No se encontró imagen" })
  }

  if (!phone) {
    return res.status(400).json({ error: "Número de teléfono requerido" })
  }

  try {
    const image = req.files.image
    const uploadPath = path.join(__dirname, "uploads", image.name)

    // Crear directorio si no existe
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"))
    }

    // Guardar imagen temporalmente
    await image.mv(uploadPath)

    // Formatear número de teléfono
    let formattedPhone = phone.replace(/\D/g, "")
    if (!formattedPhone.includes("@c.us")) {
      formattedPhone = formattedPhone + "@c.us"
    }

    // Crear media y enviar
    const media = MessageMedia.fromFilePath(uploadPath)
    await client.sendMessage(formattedPhone, media, { caption: message || "" })

    // Eliminar archivo temporal
    fs.unlinkSync(uploadPath)

    console.log(`✅ Imagen enviada a ${phone}`)
    res.json({ success: true, message: "Imagen enviada correctamente" })
  } catch (error) {
    console.error("❌ Error enviando imagen:", error)
    res.status(500).json({ error: "Error enviando imagen: " + error.message })
  }
})

// Agregar nuevo contacto
app.post("/api/contacts/add", (req, res) => {
  const { name, phone } = req.body

  if (!name || !phone) {
    return res.status(400).json({ error: "Nombre y teléfono son requeridos" })
  }

  try {
    const contacts = loadContacts()

    // Verificar si el contacto ya existe
    const existingContact = contacts.find((c) => c.phone === phone.toString())
    if (existingContact) {
      return res.status(400).json({ error: "Este número ya existe en los contactos" })
    }

    const newContact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.toString().trim(),
      addedDate: new Date().toISOString(),
      source: "manual",
    }

    contacts.push(newContact)
    saveContacts(contacts)

    res.json({
      success: true,
      message: "Contacto agregado correctamente",
      contact: newContact,
      total: contacts.length,
    })
  } catch (error) {
    console.error("Error agregando contacto:", error)
    res.status(500).json({ error: "Error agregando contacto" })
  }
})

// Eliminar contacto
app.delete("/api/contacts/delete", (req, res) => {
  const { contactIds } = req.body

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return res.status(400).json({ error: "IDs de contactos requeridos" })
  }

  try {
    let contacts = loadContacts()
    const initialCount = contacts.length

    // Filtrar contactos que no están en la lista de IDs a eliminar
    contacts = contacts.filter((contact) => !contactIds.includes(contact.id))

    const deletedCount = initialCount - contacts.length
    saveContacts(contacts)

    res.json({
      success: true,
      message: `${deletedCount} contacto(s) eliminado(s) correctamente`,
      deletedCount,
      remainingCount: contacts.length,
    })
  } catch (error) {
    console.error("Error eliminando contactos:", error)
    res.status(500).json({ error: "Error eliminando contactos" })
  }
})

// Importar contactos desde archivo
app.post("/api/contacts/import", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No se encontró archivo" })
  }

  try {
    const file = req.files.file
    const uploadPath = path.join(__dirname, "uploads", file.name)

    // Crear directorio si no existe
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"))
    }

    // Guardar archivo temporalmente
    await file.mv(uploadPath)

    let data = []
    const fileExtension = path.extname(file.name).toLowerCase()

    if (fileExtension === ".csv") {
      // Procesar CSV
      const csvContent = fs.readFileSync(uploadPath, "utf8")
      const lines = csvContent.split("\n")
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",")
          const row = {}
          headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : ""
          })
          data.push(row)
        }
      }
    } else {
      // Procesar Excel
      const workbook = XLSX.readFile(uploadPath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)
    }

    const existingContacts = loadContacts()
    const newContacts = []
    let duplicateCount = 0

    for (const row of data) {
      // Buscar campos de nombre y teléfono con diferentes variaciones
      const name = row.nombre || row.name || row.Name || row.NOMBRE || ""
      const phone =
        row.telefono ||
        row.phone ||
        row.numero ||
        row.celular ||
        row.Phone ||
        row.TELEFONO ||
        row.NUMERO ||
        row.CELULAR ||
        ""

      if (phone) {
        const phoneStr = phone.toString().trim()

        // Verificar si ya existe
        const exists = existingContacts.some((c) => c.phone === phoneStr)
        if (!exists && !newContacts.some((c) => c.phone === phoneStr)) {
          newContacts.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: name.toString().trim() || "Sin nombre",
            phone: phoneStr,
            addedDate: new Date().toISOString(),
            source: "import",
          })
        } else {
          duplicateCount++
        }
      }
    }

    // Agregar nuevos contactos a los existentes
    const allContacts = [...existingContacts, ...newContacts]
    saveContacts(allContacts)

    // Eliminar archivo temporal
    fs.unlinkSync(uploadPath)

    res.json({
      success: true,
      message: `Importación completada: ${newContacts.length} contactos nuevos agregados`,
      imported: newContacts.length,
      duplicates: duplicateCount,
      total: allContacts.length,
      contacts: newContacts,
    })
  } catch (error) {
    console.error("Error importando contactos:", error)
    res.status(500).json({ error: "Error procesando archivo: " + error.message })
  }
})

// Enviar mensaje masivo a contactos seleccionados
app.post("/api/send-bulk-selected", async (req, res) => {
  if (!isClientReady) {
    return res.status(400).json({ error: "Cliente de WhatsApp no está listo" })
  }

  const { message, selectedContacts, messageDelay } = req.body
  const delay = Number.parseInt(messageDelay) || 10

  if (!message) {
    return res.status(400).json({ error: "Mensaje es requerido" })
  }

  if (!selectedContacts || selectedContacts.length === 0) {
    return res.status(400).json({ error: "Debe seleccionar al menos un contacto" })
  }

  try {
    const allContacts = loadContacts()
    const contactsToSend = allContacts.filter((contact) => selectedContacts.includes(contact.id))

    if (contactsToSend.length === 0) {
      return res.status(400).json({ error: "No se encontraron contactos válidos" })
    }

    let media = null
    let imagePath = null

    // Procesar imagen si se envió
    if (req.files && req.files.image) {
      const image = req.files.image
      imagePath = path.join(__dirname, "uploads", `bulk_${Date.now()}_${image.name}`)

      if (!fs.existsSync(path.join(__dirname, "uploads"))) {
        fs.mkdirSync(path.join(__dirname, "uploads"))
      }

      await image.mv(imagePath)
      media = MessageMedia.fromFilePath(imagePath)
    }

    let successCount = 0
    let errorCount = 0
    const results = []

    // Procesar cada contacto seleccionado
    for (let i = 0; i < contactsToSend.length; i++) {
      const contact = contactsToSend[i]

      try {
        // Formatear número
        let formattedPhone = contact.phone.toString().replace(/\D/g, "")
        if (!formattedPhone.includes("@c.us")) {
          formattedPhone = formattedPhone + "@c.us"
        }

        // Personalizar mensaje con nombre
        let personalizedMessage = message
        if (contact.name && contact.name !== "Sin nombre") {
          personalizedMessage = message.replace(/\{nombre\}/g, contact.name)
        }

        // Enviar mensaje con o sin imagen
        if (media) {
          await client.sendMessage(formattedPhone, media, { caption: personalizedMessage })
        } else {
          await client.sendMessage(formattedPhone, personalizedMessage)
        }

        successCount++
        results.push({
          phone: contact.phone,
          name: contact.name,
          status: "success",
        })

        console.log(`✅ Mensaje enviado a ${contact.phone} (${i + 1}/${contactsToSend.length})`)

        // Pausa configurable entre mensajes
        if (i < contactsToSend.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * 1000))
        }
      } catch (error) {
        errorCount++
        results.push({
          phone: contact.phone,
          name: contact.name,
          status: "error",
          error: error.message,
        })
        console.error(`❌ Error enviando a ${contact.phone}:`, error)
      }
    }

    // Eliminar imagen temporal si existe
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }

    res.json({
      success: true,
      message: `Envío completado: ${successCount} exitosos, ${errorCount} errores`,
      results,
      successCount,
      errorCount,
      total: contactsToSend.length,
    })
  } catch (error) {
    console.error("❌ Error en envío masivo:", error)
    res.status(500).json({ error: "Error en envío masivo: " + error.message })
  }
})

// Enviar mensaje masivo avanzado
app.post("/api/send-bulk-advanced", async (req, res) => {
  if (!isClientReady) {
    return res.status(400).json({ error: "Cliente de WhatsApp no está listo" })
  }

  const { message, messageDelay } = req.body
  const delay = Number.parseInt(messageDelay) || 10

  if (!message) {
    return res.status(400).json({ error: "Mensaje es requerido" })
  }

  try {
    const contacts = loadContacts()

    if (contacts.length === 0) {
      return res.status(400).json({ error: "No hay contactos guardados" })
    }

    let media = null
    let imagePath = null

    // Procesar imagen si se envió
    if (req.files && req.files.image) {
      const image = req.files.image
      imagePath = path.join(__dirname, "uploads", `bulk_${Date.now()}_${image.name}`)

      if (!fs.existsSync(path.join(__dirname, "uploads"))) {
        fs.mkdirSync(path.join(__dirname, "uploads"))
      }

      await image.mv(imagePath)
      media = MessageMedia.fromFilePath(imagePath)
    }

    let successCount = 0
    let errorCount = 0
    const results = []

    // Procesar cada contacto
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      try {
        // Formatear número
        let formattedPhone = contact.phone.toString().replace(/\D/g, "")
        if (!formattedPhone.includes("@c.us")) {
          formattedPhone = formattedPhone + "@c.us"
        }

        // Personalizar mensaje si tiene nombre
        let personalizedMessage = message
        if (contact.name) {
          personalizedMessage = message.replace(/\{nombre\}/g, contact.name)
        }

        // Enviar mensaje con o sin imagen
        if (media) {
          await client.sendMessage(formattedPhone, media, { caption: personalizedMessage })
        } else {
          await client.sendMessage(formattedPhone, personalizedMessage)
        }

        successCount++
        results.push({
          phone: contact.phone,
          name: contact.name || "Sin nombre",
          status: "success",
        })

        console.log(`✅ Mensaje enviado a ${contact.phone} (${i + 1}/${contacts.length})`)

        // Pausa configurable entre mensajes
        if (i < contacts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * 1000))
        }
      } catch (error) {
        errorCount++
        results.push({
          phone: contact.phone,
          name: contact.name || "Sin nombre",
          status: "error",
          error: error.message,
        })
        console.error(`❌ Error enviando a ${contact.phone}:`, error)
      }
    }

    // Eliminar imagen temporal si existe
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }

    res.json({
      success: true,
      message: `Envío completado: ${successCount} exitosos, ${errorCount} errores`,
      results,
      successCount,
      errorCount,
      total: contacts.length,
    })
  } catch (error) {
    console.error("❌ Error en envío masivo:", error)
    res.status(500).json({ error: "Error en envío masivo: " + error.message })
  }
})

// Envío masivo desde Excel (mantener compatibilidad)
app.post("/api/send-bulk", async (req, res) => {
  if (!isClientReady) {
    return res.status(400).json({ error: "Cliente de WhatsApp no está listo" })
  }

  if (!req.files || !req.files.excel) {
    return res.status(400).json({ error: "No se encontró archivo Excel" })
  }

  try {
    const excelFile = req.files.excel
    const uploadPath = path.join(__dirname, "uploads", excelFile.name)

    // Crear directorio si no existe
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"))
    }

    // Guardar archivo temporalmente
    await excelFile.mv(uploadPath)

    // Leer archivo Excel
    const workbook = XLSX.readFile(uploadPath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    const contacts = []

    for (const row of data) {
      const phone = row.telefono || row.phone || row.numero || row.celular || Object.values(row)[0]
      const message = row.mensaje || row.message || row.texto || Object.values(row)[1]
      const name = row.nombre || row.name || ""

      if (phone) {
        contacts.push({
          phone: phone.toString(),
          message: message ? message.toString() : "",
          name: name.toString(),
          addedDate: new Date().toISOString(),
        })
      }
    }

    // Guardar contactos
    saveContacts(contacts)

    let successCount = 0
    let errorCount = 0
    const results = []

    // Procesar cada fila
    for (const contact of contacts) {
      try {
        if (!contact.phone || !contact.message) {
          errorCount++
          results.push({
            phone: contact.phone || "N/A",
            name: contact.name,
            status: "error",
            error: "Datos incompletos",
          })
          continue
        }

        // Formatear número
        let formattedPhone = contact.phone.replace(/\D/g, "")
        if (!formattedPhone.includes("@c.us")) {
          formattedPhone = formattedPhone + "@c.us"
        }

        // Enviar mensaje
        await client.sendMessage(formattedPhone, contact.message)
        successCount++
        results.push({
          phone: contact.phone,
          name: contact.name,
          status: "success",
        })
        console.log(`✅ Mensaje enviado a ${contact.phone}`)

        // Pausa entre mensajes para evitar spam
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        errorCount++
        results.push({
          phone: contact.phone || "N/A",
          name: contact.name,
          status: "error",
          error: error.message,
        })
        console.error(`❌ Error enviando a ${contact.phone}:`, error)
      }
    }

    // Eliminar archivo temporal
    fs.unlinkSync(uploadPath)

    res.json({
      success: true,
      message: `Envío completado: ${successCount} exitosos, ${errorCount} errores`,
      results,
      successCount,
      errorCount,
      contactsSaved: contacts.length,
    })
  } catch (error) {
    console.error("❌ Error en envío masivo:", error)
    res.status(500).json({ error: "Error procesando archivo: " + error.message })
  }
})

// Obtener contactos de WhatsApp con etiquetas
app.get("/api/whatsapp-contacts", async (req, res) => {
  if (!isClientReady) {
    return res.status(400).json({ error: "Cliente de WhatsApp no está listo" })
  }

  try {
    console.log("📱 Obteniendo contactos de WhatsApp...")

    // Obtener todos los contactos de WhatsApp
    const contacts = await client.getContacts()

    // Filtrar solo contactos (no grupos ni broadcasts)
    const realContacts = contacts.filter(
      (contact) =>
        contact.isMyContact && !contact.isGroup && !contact.isBroadcast && contact.name && contact.name !== "",
    )

    // Obtener etiquetas disponibles
    let labels = []
    try {
      labels = await client.getLabels()
      console.log(`🏷️ Etiquetas encontradas: ${labels.length}`)
    } catch (error) {
      console.log("⚠️ No se pudieron obtener etiquetas:", error.message)
    }

    // Organizar contactos por etiquetas
    const contactsByLabel = {}
    const contactsWithoutLabel = []

    for (const contact of realContacts) {
      try {
        // Obtener chats con etiquetas para este contacto
        const chat = await client.getChatById(contact.id._serialized)

        if (chat.labels && chat.labels.length > 0) {
          // Contacto tiene etiquetas
          for (const labelId of chat.labels) {
            const label = labels.find((l) => l.id === labelId)
            const labelName = label ? label.name : `Etiqueta ${labelId}`

            if (!contactsByLabel[labelName]) {
              contactsByLabel[labelName] = []
            }

            contactsByLabel[labelName].push({
              id: contact.id._serialized,
              name: contact.name || contact.pushname || "Sin nombre",
              phone: contact.number,
              profilePic: contact.profilePicUrl || null,
              isMyContact: contact.isMyContact,
              labels: chat.labels,
            })
          }
        } else {
          // Contacto sin etiquetas
          contactsWithoutLabel.push({
            id: contact.id._serialized,
            name: contact.name || contact.pushname || "Sin nombre",
            phone: contact.number,
            profilePic: contact.profilePicUrl || null,
            isMyContact: contact.isMyContact,
            labels: [],
          })
        }
      } catch (error) {
        // Si hay error obteniendo el chat, agregar a sin etiqueta
        contactsWithoutLabel.push({
          id: contact.id._serialized,
          name: contact.name || contact.pushname || "Sin nombre",
          phone: contact.number,
          profilePic: contact.profilePicUrl || null,
          isMyContact: contact.isMyContact,
          labels: [],
        })
      }
    }

    // Agregar contactos sin etiqueta si existen
    if (contactsWithoutLabel.length > 0) {
      contactsByLabel["Sin etiqueta"] = contactsWithoutLabel
    }

    console.log(`✅ Contactos organizados: ${Object.keys(contactsByLabel).length} grupos`)

    res.json({
      success: true,
      contactsByLabel,
      labels: labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color || "#000000",
      })),
      totalContacts: realContacts.length,
      totalLabels: labels.length,
    })
  } catch (error) {
    console.error("❌ Error obteniendo contactos de WhatsApp:", error)
    res.status(500).json({
      error: "Error obteniendo contactos: " + error.message,
      details: "Asegúrate de que WhatsApp esté conectado correctamente",
    })
  }
})

// Obtener contactos de una etiqueta específica
app.get("/api/whatsapp-contacts/label/:labelName", async (req, res) => {
  if (!isClientReady) {
    return res.status(400).json({ error: "Cliente de WhatsApp no está listo" })
  }

  const { labelName } = req.params

  try {
    // Obtener todas las etiquetas
    const labels = await client.getLabels()
    const targetLabel = labels.find((label) => label.name === labelName)

    if (!targetLabel) {
      return res.status(404).json({ error: "Etiqueta no encontrada" })
    }

    // Obtener chats con esta etiqueta
    const chats = await client.getChatsByLabelId(targetLabel.id)

    const contacts = []
    for (const chat of chats) {
      if (!chat.isGroup && chat.contact) {
        contacts.push({
          id: chat.contact.id._serialized,
          name: chat.contact.name || chat.contact.pushname || "Sin nombre",
          phone: chat.contact.number,
          profilePic: chat.contact.profilePicUrl || null,
          isMyContact: chat.contact.isMyContact,
        })
      }
    }

    res.json({
      success: true,
      labelName,
      contacts,
      total: contacts.length,
    })
  } catch (error) {
    console.error("❌ Error obteniendo contactos por etiqueta:", error)
    res.status(500).json({ error: "Error obteniendo contactos por etiqueta: " + error.message })
  }
})

// Enviar mensaje masivo a contactos de WhatsApp seleccionados
app.post("/api/send-bulk-whatsapp", async (req, res) => {
  if (!isClientReady) {
    return res.status(400).json({ error: "Cliente de WhatsApp no está listo" })
  }

  const { message, selectedContacts, messageDelay } = req.body
  const delay = Number.parseInt(messageDelay) || 10

  if (!message) {
    return res.status(400).json({ error: "Mensaje es requerido" })
  }

  if (!selectedContacts || selectedContacts.length === 0) {
    return res.status(400).json({ error: "Debe seleccionar al menos un contacto" })
  }

  try {
    let media = null
    let imagePath = null

    // Procesar imagen si se envió
    if (req.files && req.files.image) {
      const image = req.files.image
      imagePath = path.join(__dirname, "uploads", `whatsapp_bulk_${Date.now()}_${image.name}`)

      if (!fs.existsSync(path.join(__dirname, "uploads"))) {
        fs.mkdirSync(path.join(__dirname, "uploads"))
      }

      await image.mv(imagePath)
      media = MessageMedia.fromFilePath(imagePath)
    }

    let successCount = 0
    let errorCount = 0
    const results = []

    // Procesar cada contacto seleccionado
    for (let i = 0; i < selectedContacts.length; i++) {
      const contactData = selectedContacts[i]

      try {
        // Personalizar mensaje con nombre si está disponible
        let personalizedMessage = message
        if (contactData.name && contactData.name !== "Sin nombre") {
          personalizedMessage = message.replace(/\{nombre\}/g, contactData.name)
        }

        // Enviar mensaje con o sin imagen
        if (media) {
          await client.sendMessage(contactData.id, media, { caption: personalizedMessage })
        } else {
          await client.sendMessage(contactData.id, personalizedMessage)
        }

        successCount++
        results.push({
          phone: contactData.phone,
          name: contactData.name,
          status: "success",
        })

        console.log(`✅ Mensaje enviado a ${contactData.name} (${i + 1}/${selectedContacts.length})`)

        // Pausa configurable entre mensajes
        if (i < selectedContacts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * 1000))
        }
      } catch (error) {
        errorCount++
        results.push({
          phone: contactData.phone,
          name: contactData.name,
          status: "error",
          error: error.message,
        })
        console.error(`❌ Error enviando a ${contactData.name}:`, error)
      }
    }

    // Eliminar imagen temporal si existe
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }

    res.json({
      success: true,
      message: `Envío completado: ${successCount} exitosos, ${errorCount} errores`,
      results,
      successCount,
      errorCount,
      total: selectedContacts.length,
    })
  } catch (error) {
    console.error("❌ Error en envío masivo de WhatsApp:", error)
    res.status(500).json({ error: "Error en envío masivo: " + error.message })
  }
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`)
  console.log(`📁 Directorio de trabajo: ${__dirname}`)
  console.log(`📂 Archivos disponibles: ${fs.readdirSync(__dirname).join(", ")}`)

  const publicExists = fs.existsSync(path.join(__dirname, "public"))
  console.log(`📁 Carpeta public existe: ${publicExists}`)

  if (publicExists) {
    const publicFiles = fs.readdirSync(path.join(__dirname, "public"))
    console.log(`📄 Archivos en public: ${publicFiles.join(", ")}`)
  }

  console.log("📱 Sistema de WhatsApp listo para usar")

  setTimeout(() => {
    initializeWhatsAppClient()
  }, 1000)
})

// Manejar cierre graceful
process.on("SIGINT", async () => {
  console.log("\n🔄 Cerrando aplicación...")
  if (client) {
    await client.destroy()
  }
  process.exit(0)
})
