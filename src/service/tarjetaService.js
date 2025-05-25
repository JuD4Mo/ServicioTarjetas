import { supabase } from "../db/supaClient.js";

export const tarjetaEnLaBD = async (numTarjeta) => {
  return await supabase
    .from('tarjetas_registradas')
    .select('numero_tarjeta')
    .eq('numero_tarjeta', numTarjeta)
    .maybeSingle();
};

export const crearTarjeta = async (info, idcuenta) => {
  const numeroTarjeta = info.numeroTarjeta;

  const { data, error: errorTarjeta } = await tarjetaEnLaBD(numeroTarjeta);
  if (errorTarjeta) return { error: errorTarjeta };
  if (!data) return { error: new Error("El número de tarjeta ingresado no existe") };

  const ultimarecarga = null;
  const idTarjetaExistente = numeroTarjeta;

  return await supabase
    .from('tarjetas')
    .insert([{ ultimarecarga, idcuenta, idTarjetaExistente }])
    .select('*');
};

export const getTarjetaCuentaId = async (cuentaId) => {
  return await supabase
    .from('tarjetas_registradas_por_cuenta') // vista
    .select('fechaExpedicion, numero_tarjeta, saldo')
    .eq('idcuenta', cuentaId);
};

export const getTarjetaById = async (tarjetaId) => {
  return await supabase
    .from('tarjetas_registradas_id_tarjeta') // otra vista
    .select('fechaExpedicion, numero_tarjeta, saldo')
    .eq('idtarjeta', tarjetaId);
};

export const eliminarTarjetaById = async (tarjetaId) => {
  return await supabase
    .from('tarjetas')
    .delete()
    .eq('idtarjeta', tarjetaId)
    .single();
};

export const actualizarSaldo = async (idTarjeta, monto) => {
  if (typeof monto !== "number" || isNaN(monto)) {
    return { error: new Error("El monto debe ser un número válido") };
  }

  if (monto < 0) {
    return { error: new Error("No se puede agregar un monto negativo") };
  }

  // Obtener saldo actual desde tarjetas_registradas
  const { data: tarjeta, error: errGet } = await supabase
    .from("tarjetas_registradas")
    .select("saldo")
    .eq("idtarjeta", idTarjeta)
    .single();

  if (errGet || !tarjeta) {
    return { error: errGet || new Error("Tarjeta no encontrada") };
  }

  const nuevoSaldo = Number(tarjeta.saldo || 0) + monto;

  const { error: errUpdate } = await supabase
    .from("tarjetas_registradas")
    .update({ saldo: nuevoSaldo })
    .eq("idtarjeta", idTarjeta);

  return errUpdate
    ? { error: errUpdate }
    : { data: { idTarjeta, nuevoSaldo } };
};


export const generarDatosRecargaPayU = async (idtarjeta, email, monto) => {
  const referencia = `recarga-${Date.now()}-${idtarjeta}`;
  const signature = "7ee7cf808ce6a39b17481c54f2c57acc"; // hardcoded o cámbialo

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
    confirmationUrl: "http://localhost:3005/confirmacion"
  };
};

export const tarjetaYaAsignada = async (numeroTarjeta) => {
  const { data, error } = await supabase
    .from('tarjetas')
    .select('idtarjeta')
    .eq('idTarjetaExistente', numeroTarjeta)
    .maybeSingle();

  if (error) return { error };
  return { asignada: !!data };
};
