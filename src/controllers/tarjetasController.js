import * as tarjetaService from "../service/tarjetaService.js";

export const crearTarjeta = async (info, idcuenta) => {
  const numeroTarjeta = info.numeroTarjeta;

  const { data, error: errorTarjeta } = await tarjetaEnLaBD(numeroTarjeta);
  if (errorTarjeta) return { error: errorTarjeta };
  if (!data) return { error: new Error("El número de tarjeta ingresado no existe") };

  const { asignada, error: errorAsignada } = await tarjetaYaAsignada(numeroTarjeta);
  if (errorAsignada) return { error: errorAsignada };
  if (asignada) return { error: new Error("La tarjeta ya está asignada a una cuenta") };

  const ultimarecarga = null;
  const idTarjetaExistente = numeroTarjeta;

  return await supabase
    .from('tarjetas')
    .insert([{ ultimarecarga, idcuenta, idTarjetaExistente }])
    .select('*');
};


export const getTarjetasDeCuenta = async (req, res) => {
  const { id } = req.params;
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

export const deleteTarjeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await tarjetaService.eliminarTarjetaById(id);
    if (error) return res.status(400).json(error);
    res.status(200).json({ message: 'Tarjeta eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generarFormularioPayU = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, monto } = req.body;

    if (!email || !monto) {
      return res.status(400).json({ message: "Email y monto son requeridos" });
    }

    const datosFormulario = await tarjetaService.generarDatosRecargaPayU(id, email, monto);
    res.status(200).json(datosFormulario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const actualizarSaldo = async (req, res) => {
  try {
    const { idTarjeta, monto } = req.body;

    if (!idTarjeta || typeof monto !== "number") {
      return res.status(400).json({ error: "Faltan datos o formato incorrecto" });
    }

    const { data, error } = await tarjetaService.actualizarSaldo(idTarjeta, monto);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ mensaje: "Saldo actualizado", ...data });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
