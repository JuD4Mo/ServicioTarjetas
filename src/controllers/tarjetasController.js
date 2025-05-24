import { supabase } from "../db/supaClient.js";
import * as tarjetaService from "../service/tarjetaService.js"

export const createTarjeta = async (req, res) => {
    try {
        const info = req.body;
        const {idcuenta} = req.params;
        const {data, error} = await tarjetaService.crearTarjeta(info, idcuenta);
        if (error) return res.status(400).json(error);
        res.status(201).json(data);   
    } catch (error) {
        res.status(400).json({message: error.message})
    }
};

export const getTarjetasDeCuenta = async (req, res) => {
    const {id} = req.params;
    const { data, error } = await tarjetaService.getTarjetaCuentaId(id);
    if (error) return res.status(400).json(error);
    res.json(data);
};

export const getTarjetaById = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await tarjetaService.getTarjetaById(id);
    if (error) return res.status(400).json(error);
    res.json(data);
};

/* export const updateTarjeta = async (req, res) => {
//     const { id } = req.params;
//     const { saldo, ultimaRecarga } = req.body;
//     const { data, error } = await supabase.from('tarjetas').update({ saldo, ultimaRecarga }).eq('idTarjeta', id).select('*');
//     if (error) return res.status(400).json(error);
//     res.json(data);
};*/

export const deleteTarjeta = async (req, res) => {
   try {
    const { id } = req.params;
    const { error } = await tarjetaService.eliminarTarjetaById(id);
    if (error) return res.status(400).json(error);
    res.status(200).json({ message: 'Tarjeta eliminada' });
   } catch (error) {
    res.status(400).json({message: error.message});
   }
};


import { generarDatosRecargaPayU } from "../service/tarjetaService.js";

export const generarFormularioPayU = async (req, res) => {
  try {
    const { id } = req.params; // ID de la tarjeta
    const { email, monto } = req.body;

    if (!email || !monto) {
      return res.status(400).json({ message: "Email y monto son requeridos" });
    }

    const datosFormulario = await generarDatosRecargaPayU(id, email, monto);

    res.status(200).json(datosFormulario); // El frontend construirá el formulario
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export async function actualizarSaldo(req, res) {
  try {
    const { idTarjeta, monto } = req.body;

    if (!idTarjeta || typeof monto !== "number") {
      return res.status(400).json({ error: "Faltan datos o formato incorrecto" });
    }

    // Obtener saldo actual
    const { data: tarjeta, error: errGet } = await supabase
      .from("tarjetas")
      .select("saldo")
      .eq("idTarjeta", idTarjeta)
      .single();

    if (errGet) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    const nuevoSaldo = Number(tarjeta.saldo) + monto;

    // Actualizar saldo
    const { error: errUpdate } = await supabase
      .from("tarjetas")
      .update({ saldo: nuevoSaldo })
      .eq("idTarjeta", idTarjeta);

    if (errUpdate) {
      return res.status(500).json({ error: "Error actualizando saldo" });
    }

    return res.json({ mensaje: "Saldo actualizado", idTarjeta, nuevoSaldo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}