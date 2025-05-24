import express from "express";
import { getTarjetasDeCuenta, getTarjetaById, createTarjeta, deleteTarjeta, generarFormularioPayU, actualizarSaldo  } from "../controllers/tarjetasController.js";

const router = express.Router();

router.get("/cuenta/:id", getTarjetasDeCuenta);
router.get("/:id", getTarjetaById);

router.post("/recarga/payu/:id", generarFormularioPayU);
router.post("/crearTarjeta/:idcuenta", createTarjeta);

//router.put("/:id", updateTarjeta);
router.delete("/eliminar/:id", deleteTarjeta);
router.post("/actualizarSaldo", actualizarSaldo);

export default router;

