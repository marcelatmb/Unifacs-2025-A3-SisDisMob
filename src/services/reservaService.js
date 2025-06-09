const fs = require('fs/promises');
const path = require('path');

// Array de status válidos para as reservas
const STATUS_VALIDOS = ['Pendente', 'Confirmada', 'Cancelada'];

// Função para criar a tabela de reservas no banco de dados, se ela não existir
async function criarTabelaReservas(db) {
    const sql = `
        CREATE TABLE IF NOT EXISTS reservas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            hora TEXT NOT NULL,
            numero_mesa INTEGER NOT NULL,
            qtd_pessoas INTEGER NOT NULL,
            nome_responsavel TEXT NOT NULL,
            status TEXT NOT NULL,
            garcom TEXT
        );
    `;
    await db.exec(sql);
    console.log("Tabela 'reservas' criada com sucesso.");
}

// Função para inserir uma nova reserva no banco de dados
async function inserirReserva(db, data, hora, numeroMesa, qtdPessoas, nomeResponsavel, status, garcom) {
    // Validação do status: garante que apenas status válidos sejam usados
    if (!STATUS_VALIDOS.includes(status)) {
        throw new Error(`Status inválido: ${status}. Use apenas: ${STATUS_VALIDOS.join(', ')}`);
    }

    // ALTERAÇÃO: Validação para impedir reservas em datas passadas.
    const hoje = new Date();
    // Zera a hora para comparar apenas a data (dia, mês, ano)
    hoje.setHours(0, 0, 0, 0); 
    const dataReserva = new Date(data);
    dataReserva.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

    if (dataReserva < hoje) {
        throw new Error("Não é possível cadastrar uma reserva para uma data passada.");
    }

    // Consulta para verificar se já existe uma reserva confirmada ou pendente para a mesma mesa e horário
    const sqlVerifica = `
        SELECT * FROM reservas WHERE data = ? AND hora = ? AND numero_mesa = ? AND status != 'Cancelada'
    `;
    const conflito = await db.get(sqlVerifica, [data, hora, numeroMesa]);

    // Se houver conflito, lança um erro
    if (conflito) {
        throw new Error(`Já existe uma reserva para a mesa ${numeroMesa} neste horário.`);
    }

    // SQL para inserir a nova reserva
    const sql = `
        INSERT INTO reservas (data, hora, numero_mesa, qtd_pessoas, nome_responsavel, status, garcom)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.run(sql, [data, hora, numeroMesa, qtdPessoas, nomeResponsavel, status, garcom]);
    console.log(`Reserva inserida com ID: ${result.lastID}`);
    // Retorna o ID da nova reserva
    return { id: result.lastID, message: "Reserva criada com sucesso!" };
}

// Função para confirmar uma reserva
async function confirmarReserva(db, id, garcom) {
  try {
    const reservaExistente = await db.get("SELECT * FROM reservas WHERE id = ?", id);
    if (!reservaExistente) {
      return { sucesso: false, message: `Reserva ${id} não encontrada.` };
    }
    if (reservaExistente.status !== "Pendente") {
      return { sucesso: false, message: `Somente reservas pendentes podem ser confirmadas. Status atual: ${reservaExistente.status}.` };
    }

    await db.run("UPDATE reservas SET status = ?, garcom = ? WHERE id = ?", "Confirmada", garcom, id);
    return { sucesso: true, message: `Reserva ${id} confirmada com sucesso pelo garçom ${garcom}.` };
  } catch (error) {
    console.error("Erro ao confirmar reserva no DB:", error.message);
    throw error;
  }
}

// Função para cancelar uma reserva
async function cancelarReserva(db, idReserva) {
    const reserva = await db.get(`SELECT status FROM reservas WHERE id = ?`, [idReserva]);
    
    // ALTERAÇÃO: Retorna objeto de sucesso/falha para o controller, em vez de lançar erro diretamente.
    if (!reserva) {
        return { sucesso: false, message: `Reserva não encontrada.` };
    }

    const result = await db.run(`UPDATE reservas SET status = 'Cancelada' WHERE id = ?`, [idReserva]);
    if (result.changes === 0) {
        // Isso pode acontecer se a reserva foi alterada entre a seleção e a atualização
        return { sucesso: false, message: `Nenhuma reserva foi atualizada (ID não encontrado ou status já alterado).` };
    }
    console.log(`Reserva ID ${idReserva} cancelada.`);
    return { sucesso: true, message: `Reserva ${idReserva} cancelada com sucesso!` };
}

// Função para obter reservas em um período e registrar em log
async function obterReservasPorPeriodo(db, dataInicio, dataFim) {
    const sql = `SELECT * FROM reservas WHERE data BETWEEN ? AND ?`;
    const rows = await db.all(sql, [dataInicio, dataFim]);

    // Se nenhuma reserva for encontrada, lança um erro
    if (rows.length === 0) {
        throw new Error("Nenhuma reserva encontrada no período especificado.");
    }

    // Geração do log
    const now = new Date();
    const dataHoje = now.toISOString().slice(0, 10);
    const horaAgora = now.toLocaleTimeString();
    const logDir = path.join(__dirname, 'logs');
    const logPath = path.join(logDir, `relatorio_${dataHoje}.log`);
    await fs.mkdir(logDir, { recursive: true });

    let logEntry = `\n====================\n${dataHoje} ${horaAgora}\nTipo: Consulta por período (${dataInicio} a ${dataFim})\n--------------------\n`;
    for (const row of rows) {
        logEntry += `ID: ${row.id}\n`;
        logEntry += `Data: ${row.data}\n`;
        logEntry += `Hora: ${row.hora}\n`;
        logEntry += `Mesa: ${row.numero_mesa}\n`;
        logEntry += `Pessoas: ${row.qtd_pessoas}\n`;
        logEntry += `Responsável: ${row.nome_responsavel}\n`;
        logEntry += `Status: ${row.status}\n`;
        logEntry += `Garçom: ${row.garcom || 'N/A'}\n`;
        logEntry += `-----------------------\n`;
    }
    logEntry += `Total de reservas encontradas: ${rows.length}\n=======================\n`;
    await fs.appendFile(logPath, logEntry, 'utf8');
    console.log(`\x1b[32m[Reservas]\x1b[0m Relatório atualizado: ${logPath}`);

    return rows;
}

// Função para obter reservas por número de mesa e registrar em log
async function obterReservasPorMesa(db, numero_mesa) {
    const sql = `SELECT * FROM reservas WHERE numero_mesa = ?`;
    const rows = await db.all(sql, [numero_mesa]);

    // Se nenhuma reserva for encontrada, lança um erro
    if (rows.length === 0) {
        throw new Error(`Nenhuma reserva encontrada para a mesa ${numero_mesa}.`);
    }

    // Geração do log
    const now = new Date();
    const dataHoje = now.toISOString().slice(0, 10);
    const horaAgora = now.toLocaleTimeString();
    const logDir = path.join(__dirname, 'logs');
    const logPath = path.join(logDir, `relatorio_${dataHoje}.log`);
    await fs.mkdir(logDir, { recursive: true });

    let logEntry = `\n====================\n${dataHoje} ${horaAgora}\nTipo: Consulta por mesa (${numero_mesa})\n--------------------\n`;
    for (const row of rows) {
        logEntry += `ID: ${row.id}\n`;
        logEntry += `Data: ${row.data}\n`;
        logEntry += `Hora: ${row.hora}\n`;
        logEntry += `Mesa: ${row.numero_mesa}\n`;
        logEntry += `Pessoas: ${row.qtd_pessoas}\n`;
        logEntry += `Responsável: ${row.nome_responsavel}\n`;
        logEntry += `Status: ${row.status}\n`;
        logEntry += `Garçom: ${row.garcom || 'N/A'}\n`;
        logEntry += `-----------------------\n`;
    }
    logEntry += `Total de reservas encontradas: ${rows.length}\n=======================\n`;
    await fs.appendFile(logPath, logEntry, 'utf8');
    console.log(`\x1b[32m[Reservas]\x1b[0m Relatório atualizado: ${logPath}`);

    return rows;
}

// Função para obter o status mais recente das mesas e registrar em log
async function obterMesasPorStatus(db, status) {
    // Validação do status: garante que apenas status válidos sejam usados
    if (!STATUS_VALIDOS.includes(status)) {
        throw new Error(`Status inválido: ${status}. Use apenas: ${STATUS_VALIDOS.join(', ')}`);
    }

    // SQL para obter o status mais recente de cada mesa
    const sql = `
        SELECT r1.numero_mesa, r1.status
        FROM reservas r1
        JOIN (
            SELECT numero_mesa, MAX(data || ' ' || hora) AS max_datetime
            FROM reservas
            GROUP BY numero_mesa
        ) r2
        ON r1.numero_mesa = r2.numero_mesa
        AND (r1.data || ' ' || r1.hora) = r2.max_datetime
        WHERE r1.status = ?;
    `;

    const rows = await db.all(sql, [status]);

    // Se nenhuma mesa for encontrada com o status especificado, lança um erro
    if (rows.length === 0) {
        throw new Error(`Nenhuma mesa encontrada com status mais recente: ${status}.`);
    }

    // Geração do log
    const now = new Date();
    const dataHoje = now.toISOString().slice(0, 10);
    const horaAgora = now.toLocaleTimeString();
    const logDir = path.join(__dirname, 'logs');
    const logPath = path.join(logDir, `relatorio_${dataHoje}.log`);
    await fs.mkdir(logDir, { recursive: true });

    let logEntry = `\n====================\n${dataHoje} ${horaAgora}\nTipo: Consulta por status (${status})\n--------------------\n`;
    for (const row of rows) {
        logEntry += `Mesa: ${row.numero_mesa}\n`;
        logEntry += `Status: ${row.status}\n`;
        logEntry += `-----------------------\n`;
    }
    logEntry += `Total de mesas encontradas: ${rows.length}\n=======================\n`;
    await fs.appendFile(logPath, logEntry, 'utf8');
    console.log(`\x1b[32m[Reservas]\x1b[0m Relatório atualizado: ${logPath}`);

    return rows;

    
}

async function pegarMesasConfirmadasPorGarcom(db) {
    const sql = "SELECT garcom, numero_mesa, data, hora FROM reservas WHERE status = 'Confirmada' AND garcom != '' ORDER BY garcom";
    const resultado = await db.all(sql);
    if (!resultado || resultado.length === 0) {
        throw new Error("Nada encontrado.");
    }
    return resultado;
}



// Exporta todas as funções para serem usadas em outros módulos
module.exports = {
    criarTabelaReservas,
    inserirReserva,
    confirmarReserva,
    cancelarReserva,
    obterReservasPorPeriodo,
    obterReservasPorMesa,
    obterMesasPorStatus,
    pegarMesasConfirmadasPorGarcom
};