const service = require("../services/reservaService");

// Função de boas-vindas simples para a rota raiz
exports.bemVindo = (req, res) => {
  res.send("Bem-vindo ao restaurante!");
};

// Função para criar uma nova reserva
exports.criarReserva = async (req, res) => {
  try {
    const {
      data,
      hora,
      numero_mesa,
      qtd_pessoas,
      nome_responsavel,
      garcom,
    } = req.body;

    if (
      !data ||
      !hora ||
      !numero_mesa ||
      !qtd_pessoas ||
      !nome_responsavel
    ) {
      console.error("Erro: Todos os campos obrigatórios (exceto garçom) devem ser preenchidos.");
      return res
        .status(400)
        .json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    await service.inserirReserva(
      req.db,
      data,
      hora,
      numero_mesa,
      qtd_pessoas,
      nome_responsavel,
      "Pendente", // Status definido como Pendente por padrão
      garcom
    );

    res.status(201).json({ message: "Reserva criada com sucesso!" });
  } catch (error) {
    console.error("Erro ao criar reserva:", error.message);
    // Erros específicos do serviço (como data inválida ou conflito de horário)
    if (error.message.includes("data passada") || error.message.includes("Já existe uma reserva")) {
      return res.status(400).json({
        error: "Erro na validação da reserva.",
        detalhe: error.message,
      });
    }
    res.status(500).json({
      error: "Erro interno ao criar reserva.",
      detalhe: error.message,
    });
  }
};

// Função para obter reservas em um período específico
exports.obterReservasPorPeriodo = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    if (!dataInicio || !dataFim) {
      console.error(
        "Erro: Informe a data inicial e a data final no formato YYYY-MM-DD."
      );
      return res.status(400).json({
        error: "Informe a data inicial e a data final no formato YYYY-MM-DD.",
      });
    }

    const reservas = await service.obterReservasPorPeriodo(
      req.db,
      dataInicio,
      dataFim
    );
    res.json({ message: "Relatório gerado com sucesso!", reservas });
  } catch (error) {
    console.error("Erro ao gerar relatório por período:", error.message);
    // Se não houver reservas encontradas, retorna 404
    if (error.message.includes("Nenhuma reserva encontrada")) {
        return res.status(404).json({
            error: "Relatório vazio.",
            detalhe: error.message,
        });
    }
    res.status(500).json({
      error: "Erro interno ao gerar relatório por período.",
      detalhe: error.message,
    });
  }
};

// Função para obter reservas por número de mesa
exports.obterReservasPorMesa = async (req, res) => {
  try {
    const numero_mesa = parseInt(req.params.numero_mesa, 10);
    if (isNaN(numero_mesa) || numero_mesa <= 0) {
      console.error("Erro: Número da mesa inválido.");
      return res.status(400).json({ error: "Número da mesa inválido." });
    }

    const reservas = await service.obterReservasPorMesa(req.db, numero_mesa);
    res.json({
      message: "Relatório gerado com sucesso! Verifique o diretório de logs.",
      reservas,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório por mesa:", error.message);
    // Se não houver reservas encontradas, retorna 404
    if (error.message.includes("Nenhuma reserva encontrada")) {
        return res.status(404).json({
            error: "Relatório vazio.",
            detalhe: error.message,
        });
    }
    res.status(500).json({
      error: "Erro interno ao gerar relatório por mesa.",
      detalhe: error.message,
    });
  }
};

// Função para obter mesas pelo status mais recente
exports.obterMesasPorStatus = async (req, res) => {
  try {
    const status = req.params.status;

    const mesas = await service.obterMesasPorStatus(req.db, status);

    res.json({
      message: "Relatório gerado com sucesso! Verifique o diretório de logs.",
      mesas,
    });
  } catch (error) {
    console.error("Erro ao buscar mesas por status:", error.message);
    if (error.message.includes("Nenhuma mesa encontrada")) {
      return res
        .status(404)
        .json({ message: error.message }); // Retorna a mensagem específica do serviço
    }
    res.status(500).json({
      error: "Erro interno ao buscar mesas por status.",
      detalhe: error.message,
    });
  }
};

// Função para confirmar uma reserva
exports.confirmarReserva = async (req, res) => {
  const { idReserva } = req.params;
  const { garcom } = req.body; 

  if (!garcom) {
    return res.status(400).json({ error: "Nome do garçom é obrigatório para confirmar a reserva." });
  }

  try {
     const result = await service.confirmarReserva(req.db, idReserva, garcom);
    if (result.sucesso) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (err) {
    console.error("Erro ao confirmar reserva:", err.message);
    res.status(500).json({ error: "Erro interno do servidor ao confirmar reserva.", detalhe: err.message });
  }
};

// Função para cancelar uma reserva
exports.cancelarReserva = async (req, res) => {
  try {
    const idReserva = parseInt(req.params.idReserva, 10);

    if (isNaN(idReserva)) {
      console.error("Erro: ID de reserva inválido.");
      return res.status(400).json({ error: "ID de reserva inválido." });
    }

    const resultado = await service.cancelarReserva(req.db, idReserva);

    if (resultado.sucesso) {
      res.json({ message: resultado.message });
    } else {
      return res.status(400).json({
        error: "Erro ao cancelar reserva.",
        detalhe: resultado.message,
      });
    }
  } catch (error) {
    console.error("Erro ao cancelar reserva:", error.message);
    res.status(500).json({
      error: "Erro interno ao cancelar reserva.",
      detalhe: error.message,
    });
  }
};

exports.obterConfirmadasPorGarcom = (req, res) => {
  const db = req.db;
  const { pegarMesasConfirmadasPorGarcom } = require("../services/reservaService");
  
  pegarMesasConfirmadasPorGarcom(db)
    .then(dados => res.send(dados))
    .catch(err => res.send({ erro: err.message }));
};

exports.obterReservaPorId = async (req, res) => {
  try {
    const idReserva = parseInt(req.params.idReserva, 10);
    if (isNaN(idReserva) || idReserva <= 0) {
      console.error("Erro: ID de reserva inválido.");
      return res.status(400).json({ error: "ID de reserva inválido." });
    }

    const reserva = await service.obterReservaPorId(req.db, idReserva);
    if (!reserva) {
      return res.status(404).json({ error: "Reserva não encontrada." });
    }

    res.json({ message: "Reserva encontrada com sucesso!", reserva });
  } catch (error) {
    console.error("Erro ao obter reserva por ID:", error.message);
    res.status(500).json({
      error: "Erro interno ao obter reserva por ID.",
      detalhe: error.message,
    });
  }
};