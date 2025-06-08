const { abrirConexao } = require("./config/database");
const express = require("express");
const rotasApi = require("./routes/reservasRoutes");
const { criarTabelaReservas } = require("./services/reservaService");
const path = require("path");
const cors = require("cors");

const PORT = 3000;

(async () => {
  try {
    const db = await abrirConexao();
    await criarTabelaReservas(db);

    const app = express();

    app.use(express.json());

    // Middleware para disponibilizar a conexão do banco de dados no objeto de requisição (req)
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    app.use(express.static(path.join(__dirname, "../public")));
    app.use(cors());

    // Usa o router para as rotas da API de reservas
    app.use("/reservas", rotasApi);

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error("Erro ao iniciar o servidor:", err.message);
    process.exit(1); // Encerra o processo se houver um erro crítico na inicialização
  }
})();