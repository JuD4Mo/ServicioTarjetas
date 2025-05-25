import * as tarjetaService from "../service/tarjetaService.js"

export const crearTarjeta = async (req, res) => {
  try {
    const { idcuenta } = req.params
    const { numeroTarjeta } = req.body

    if (!numeroTarjeta) {
      return res.status(400).json({
        error: { message: "El número de tarjeta es requerido" },
      })
    }

    // Verificar si la tarjeta existe en la BD
    const { data: tarjetaExiste, error: errorTarjeta } = await tarjetaService.tarjetaEnLaBD(numeroTarjeta)
    if (errorTarjeta) {
      return res.status(500).json({
        error: { message: "Error al verificar la tarjeta" },
      })
    }

    if (!tarjetaExiste) {
      return res.status(400).json({
        error: { message: "El número de tarjeta ingresado no existe" },
      })
    }

    // Verificar si la tarjeta ya está asignada
    const { asignada, error: errorAsignada } = await tarjetaService.tarjetaYaAsignada(numeroTarjeta)
    if (errorAsignada) {
      return res.status(500).json({
        error: { message: "Error al verificar asignación de tarjeta" },
      })
    }

    if (asignada) {
      return res.status(400).json({
        error: { message: "La tarjeta ya está asignada a una cuenta" },
      })
    }

    // Crear la tarjeta
    const { data, error } = await tarjetaService.crearTarjeta({ numeroTarjeta }, idcuenta)

    if (error) {
      return res.status(500).json({
        error: { message: error.message || "Error al registrar la tarjeta" },
      })
    }

    res.status(201).json({
      message: "Tarjeta registrada exitosamente",
      data,
    })
  } catch (error) {
    console.error("Error en crearTarjeta:", error)
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
    const { data, error } = await tarjetaService.getTarjetaById(id)
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (error) {
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
