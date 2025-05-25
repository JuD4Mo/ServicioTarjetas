import * as tarjetaService from "../service/tarjetaService.js"

export const crearTarjeta = async (req, res) => {
  try {
    const { idcuenta } = req.params
    const { numeroTarjeta } = req.body

    console.log("crearTarjeta called with:", { idcuenta, numeroTarjeta })

    if (!numeroTarjeta) {
      return res.status(400).json({
        error: { message: "El número de tarjeta es requerido" },
      })
    }

    // Verificar si la tarjeta existe en la BD
    const { data: tarjetaExiste, error: errorTarjeta } = await tarjetaService.tarjetaEnLaBD(numeroTarjeta)
    if (errorTarjeta) {
      console.error("Error checking card existence:", errorTarjeta)
      return res.status(500).json({
        error: { message: "Error al verificar la tarjeta" },
      })
    }

    if (!tarjetaExiste) {
      console.log("Card does not exist:", numeroTarjeta)
      return res.status(400).json({
        error: { message: "El número de tarjeta ingresado no existe" },
      })
    }

    console.log("Card found:", tarjetaExiste)

    // Verificar si la tarjeta ya está asignada - USAR EL IDTARJETA, NO EL NUMERO
    const { asignada, error: errorAsignada } = await tarjetaService.tarjetaYaAsignada(tarjetaExiste.idtarjeta)
    if (errorAsignada) {
      console.error("Error checking card assignment:", errorAsignada)
      return res.status(500).json({
        error: { message: "Error al verificar asignación de tarjeta", details: errorAsignada },
      })
    }

    if (asignada) {
      console.log("Card already assigned:", numeroTarjeta)
      return res.status(400).json({
        error: { message: "La tarjeta ya está asignada a una cuenta" },
      })
    }

    // Crear la tarjeta
    const { data, error } = await tarjetaService.crearTarjeta({ numeroTarjeta }, idcuenta)

    if (error) {
      console.error("Error creating card:", error)
      return res.status(500).json({
        error: { message: error.message || "Error al registrar la tarjeta" },
      })
    }

    console.log("Card created successfully:", data)
    res.status(201).json({
      message: "Tarjeta registrada exitosamente",
      data,
    })
  } catch (error) {
    console.error("Exception in crearTarjeta:", error)
    res.status(500).json({
      error: { message: "Error interno del servidor" },
    })
  }
}

export const getTarjetasDeCuenta = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await tarjetaService.getTarjetaCuentaId(id)
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

export const getTarjetaById = async (req, res) => {
  try {
    const { id } = req.params
    console.log("getTarjetaById controller called with ID:", id)

    const { data, error } = await tarjetaService.getTarjetaById(id)

    if (error) {
      console.error("Error in getTarjetaById controller:", error)
      return res.status(400).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: "Tarjeta no encontrada" })
    }

    console.log("Returning tarjeta data:", data)
    res.json(data)
  } catch (error) {
    console.error("Exception in getTarjetaById controller:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

export const deleteTarjeta = async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await tarjetaService.eliminarTarjetaById(id)
    if (error) return res.status(400).json({ error: error.message })
    res.status(200).json({ message: "Tarjeta eliminada" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const generarFormularioPayU = async (req, res) => {
  try {
    const { id } = req.params
    const { email, monto } = req.body

    if (!email || !monto) {
      return res.status(400).json({ message: "Email y monto son requeridos" })
    }

    const datosFormulario = await tarjetaService.generarDatosRecargaPayU(id, email, monto)
    res.status(200).json(datosFormulario)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const actualizarSaldo = async (req, res) => {
  try {
    const { idTarjeta, monto } = req.body

    if (!idTarjeta || typeof monto !== "number") {
      return res.status(400).json({ error: "Faltan datos o formato incorrecto" })
    }

    const { data, error } = await tarjetaService.actualizarSaldo(idTarjeta, monto)

    if (error) return res.status(500).json({ error: error.message })

    res.json({ mensaje: "Saldo actualizado", ...data })
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" })
  }
}
