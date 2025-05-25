import { supabase } from "../db/supaClient.js"

export const tarjetaEnLaBD = async (numTarjeta) => {
  try {
    const result = await supabase
      .from("tarjetas_registradas")
      .select("idtarjeta, numero_tarjeta") // Necesitamos el idtarjeta también
      .eq("numero_tarjeta", numTarjeta)
      .maybeSingle()

    console.log("tarjetaEnLaBD result:", result)
    return result
  } catch (error) {
    console.error("Error in tarjetaEnLaBD:", error)
    return { error }
  }
}

export const tarjetaYaAsignada = async (idTarjeta) => {
  try {
    console.log("Checking if card is assigned with idTarjeta:", idTarjeta)

    const result = await supabase
      .from("tarjetas")
      .select("idtarjeta")
      .eq("idTarjetaExistente", idTarjeta) // Usar el idtarjeta (integer)
      .maybeSingle()

    console.log("tarjetaYaAsignada result:", result)

    if (result.error) {
      console.error("Database error in tarjetaYaAsignada:", result.error)
      return { error: result.error }
    }

    return { asignada: !!result.data }
  } catch (error) {
    console.error("Exception in tarjetaYaAsignada:", error)
    return { error }
  }
}

export const crearTarjeta = async (info, idcuenta) => {
  try {
    const numeroTarjeta = info.numeroTarjeta
    console.log("Creating card:", { numeroTarjeta, idcuenta })

    // Verificar si existe en BD y obtener su idtarjeta
    const { data: tarjetaData, error: errorTarjeta } = await tarjetaEnLaBD(numeroTarjeta)
    if (errorTarjeta) {
      console.error("Error checking card existence:", errorTarjeta)
      return { error: errorTarjeta }
    }
    if (!tarjetaData) {
      console.log("Card does not exist in database")
      return { error: new Error("El número de tarjeta ingresado no existe") }
    }

    // AQUÍ ESTABA EL ERROR - usar tarjetaData.idtarjeta correctamente
    const idTarjetaRegistrada = tarjetaData.idtarjeta
    console.log("Found card with idtarjeta:", idTarjetaRegistrada)

    // Verificar si ya está asignada usando el idtarjeta (INTEGER)
    const { asignada, error: errorAsignada } = await tarjetaYaAsignada(idTarjetaRegistrada)
    if (errorAsignada) {
      console.error("Error checking card assignment:", errorAsignada)
      return { error: errorAsignada }
    }
    if (asignada) {
      console.log("Card is already assigned")
      return { error: new Error("La tarjeta ya está asignada a una cuenta") }
    }

    // Crear la asignación usando el idtarjeta como idTarjetaExistente
    const ultimarecarga = null
    const idTarjetaExistente = idTarjetaRegistrada // Este debe ser el INTEGER

    console.log("Inserting assignment:", { ultimarecarga, idcuenta, idTarjetaExistente })

    const result = await supabase.from("tarjetas").insert([{ ultimarecarga, idcuenta, idTarjetaExistente }]).select("*")

    console.log("Card creation result:", result)
    return result
  } catch (error) {
    console.error("Exception in crearTarjeta:", error)
    return { error }
  }
}

export const getTarjetaCuentaId = async (cuentaId) => {
  try {
    // Hacer join directo para obtener ambos IDs
    const result = await supabase
      .from("tarjetas")
      .select(`
        idtarjeta,
        tarjetas_registradas!idTarjetaExistente (
          idtarjeta,
          numero_tarjeta,
          saldo,
          fechaExpedicion
        )
      `)
      .eq("idcuenta", cuentaId)

    if (result.error) {
      return { error: result.error }
    }

    // Transformar los datos al formato esperado
    const transformedData =
      result.data?.map((item) => ({
        idtarjeta_asignacion: item.idtarjeta, // ID de la tabla tarjetas (para eliminar)
        idtarjeta: item.tarjetas_registradas.idtarjeta, // ID de tarjetas_registradas (para recargar)
        numero_tarjeta: item.tarjetas_registradas.numero_tarjeta,
        saldo: item.tarjetas_registradas.saldo,
        fechaExpedicion: item.tarjetas_registradas.fechaExpedicion,
      })) || []

    return { data: transformedData, error: null }
  } catch (error) {
    console.error("Error in getTarjetaCuentaId:", error)
    return { error }
  }
}

export const getTarjetaById = async (tarjetaId) => {
  try {
    console.log("getTarjetaById called with:", tarjetaId)

    const result = await supabase
      .from("tarjetas_registradas") // Usar la tabla directa en lugar de la vista
      .select("idtarjeta, fechaExpedicion, numero_tarjeta, saldo")
      .eq("idtarjeta", tarjetaId)
      .single() // Usar single() en lugar de maybeSingle() para obtener un objeto

    console.log("getTarjetaById result:", result)

    if (result.error) {
      return { error: result.error }
    }

    // Asegurar que saldo sea un número
    if (result.data) {
      result.data.saldo = Number(result.data.saldo) || 0
    }

    return result
  } catch (error) {
    console.error("Error in getTarjetaById:", error)
    return { error }
  }
}

export const eliminarTarjetaById = async (tarjetaId) => {
  try {
    return await supabase.from("tarjetas").delete().eq("idtarjeta", tarjetaId).single()
  } catch (error) {
    console.error("Error in eliminarTarjetaById:", error)
    return { error }
  }
}

export const actualizarSaldo = async (idTarjeta, monto) => {
  try {
    if (typeof monto !== "number" || isNaN(monto)) {
      return { error: new Error("El monto debe ser un número válido") }
    }

    if (monto < 0) {
      return { error: new Error("No se puede agregar un monto negativo") }
    }

    // Obtener saldo actual desde tarjetas_registradas
    const { data: tarjeta, error: errGet } = await supabase
      .from("tarjetas_registradas")
      .select("saldo")
      .eq("idtarjeta", idTarjeta)
      .single()

    if (errGet || !tarjeta) {
      return { error: errGet || new Error("Tarjeta no encontrada") }
    }

    const nuevoSaldo = Number(tarjeta.saldo || 0) + monto

    const { error: errUpdate } = await supabase
      .from("tarjetas_registradas")
      .update({ saldo: nuevoSaldo })
      .eq("idtarjeta", idTarjeta)

    return errUpdate ? { error: errUpdate } : { data: { idTarjeta, nuevoSaldo } }
  } catch (error) {
    console.error("Error in actualizarSaldo:", error)
    return { error }
  }
}

export const generarDatosRecargaPayU = async (idtarjeta, email, monto) => {
  try {
    const referencia = `recarga-${Date.now()}-${idtarjeta}`
    const signature = "7ee7cf808ce6a39b17481c54f2c57acc" // hardcoded o cámbialo

    return {
      merchantId: "508029",
      accountId: "512321",
      description: "Recarga tarjeta transporte",
      referenceCode: referencia,
      amount: monto,
      tax: "0",
      taxReturnBase: "0",
      currency: "COP",
      signature,
      test: "1",
      buyerEmail: email,
      responseUrl: "http://localhost:3005/confirmacion",
      confirmationUrl: "http://localhost:3005/confirmacion",
    }
  } catch (error) {
    console.error("Error in generarDatosRecargaPayU:", error)
    return { error }
  }
}
