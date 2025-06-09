const express = require("express");
const controller = require("../controllers/reservasController");

const router = express.Router();

router.get("/", controller.bemVindo);

router.post("/", controller.criarReserva);

router.get("/relatorio", controller.obterReservasPorPeriodo);

router.get("/mesa/:numero_mesa", controller.obterReservasPorMesa);

router.get("/status/:status", controller.obterMesasPorStatus);

router.put("/confirmar/:idReserva", controller.confirmarReserva);

router.put("/cancelar/:idReserva", controller.cancelarReserva);

router.get("/confirmadas/por-garcom", controller.obterConfirmadasPorGarcom);


module.exports = router;