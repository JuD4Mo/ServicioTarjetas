import { supabase } from "../db/supaClient.js";

export const crearTarjeta = async(info, idcuenta)=>{
    const fechaexpedicion = new Date().toISOString().split("T")[0];
    const ultimarecarga = null;
    const saldo = info.saldo;
    return await supabase.from('tarjetas').
    insert([{fechaexpedicion, ultimarecarga, saldo, idcuenta}]).select('*');
}

export const getTarjetaCuentaId = async(cuentaId) => {
    return await supabase.from('tarjetas').select('*').eq('idcuenta', cuentaId);
}

export const getTarjetaById = async(tarjetaId) => {
    return await supabase.from('tarjetas').select('*').eq('idtarjeta', tarjetaId).single();
}

export const eliminarTarjetaById = async(tarjetaId) => {
    return await supabase.from('tarjetas').delete('*').eq('idtarjeta', tarjetaId).single();
}

export const generarDatosRecargaPayU = async (idtarjeta, email, monto) => {
  const referencia = `recarga-${Date.now()}`;
  const signature = "7ee7cf808ce6a39b17481c54f2c57acc"; 

  const datos = {
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

  return datos;
};
