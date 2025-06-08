const express = require("express");
const controller = require("../controllers/reservasController");

const router = express.Router();

router.get("/", controller.bemVindo);

router.post("/", controller.criarReserva);

router.get("/relatorio", controller.obterReservasPorPeriodo);

router.get("/mesa/:numero_mesa", controller.obterReservasPorMesa);

router.get("/status/:status", controller.obterMesasPorStatus);

router.put("/confirmar/:idReserva", controller.confirmarReserva);

// ALTERAÇÃO: Mudança do método PUT para DELETE para a rota de cancelamento,
// que é mais semanticamente correta para excluir ou "desativar" um recurso.
// O parâmetro na URL foi ajustado para ':id' para ser mais genérico,
// alinhando com a prática comum de DELETE por ID.
router.delete("/:id", controller.cancelarReserva);

module.exports = router;