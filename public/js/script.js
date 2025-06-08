// Função para mostrar o formulário baseado no tipo de usuário selecionado
function mostrarFormulario() {
  const tipo = document.getElementById("tipoUsuario").value;
  document.querySelectorAll(".formulario").forEach(el => el.style.display = "none");

  if (tipo === "atendente") {
    document.getElementById("formAtendente").style.display = "block";
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById("data").min = `${yyyy}-${mm}-${dd}`;
  }
  if (tipo === "garcom") {
    document.getElementById("formGarcom").style.display = "block";
  }
  if (tipo === "cancelar") {
    document.getElementById("formCancelar").style.display = "block";
  }
  // ALTERAÇÃO: Apenas um formulário de Gerente agora, com opções internas
  if (tipo === "gerente") {
    document.getElementById("formGerente").style.display = "block";
    mostrarCamposRelatorio(); // Chama para inicializar a exibição correta dos campos
  }
}

// NOVA FUNÇÃO: Controla quais campos de relatório são visíveis dentro do formGerente
function mostrarCamposRelatorio() {
  const tipoRelatorio = document.getElementById("tipoRelatorio").value;
  
  // Esconde todos os campos de relatório por padrão
  document.getElementById("camposPeriodo").style.display = "none";
  document.getElementById("camposMesa").style.display = "none";
  document.getElementById("camposStatus").style.display = "none";

  // Zera os resultados dos relatórios anteriores
  document.getElementById("relatorioPeriodo").textContent = '';
  document.getElementById("relatorioMesa").textContent = '';
  document.getElementById("relatorioStatusResult").textContent = '';

  // Mostra apenas os campos relevantes para o tipo de relatório selecionado
  if (tipoRelatorio === "periodo") {
    document.getElementById("camposPeriodo").style.display = "block";
  } else if (tipoRelatorio === "mesa") {
    document.getElementById("camposMesa").style.display = "block";
  } else if (tipoRelatorio === "status") {
    document.getElementById("camposStatus").style.display = "block";
  }
}


// Função assíncrona para cadastrar uma nova reserva
async function cadastrarReserva() {
  const dataInput = document.getElementById("data");
  const hora = document.getElementById("hora").value;
  const numero_mesa = parseInt(document.getElementById("numeroMesa").value, 10);
  const qtd_pessoas = parseInt(document.getElementById("qtdPessoas").value, 10);
  const nome_responsavel = document.getElementById("nomeResponsavel").value;
  const status = "Pendente";
  const garcom = "";

  if (!dataInput.value || !hora || isNaN(numero_mesa) || isNaN(qtd_pessoas) || !nome_responsavel) {
    alert("Por favor, preencha todos os campos obrigatórios corretamente.");
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataReserva = new Date(dataInput.value);
  dataReserva.setHours(0, 0, 0, 0);

  if (dataReserva < hoje) {
    alert("Não é possível cadastrar uma reserva para uma data passada.");
    return;
  }

  const payload = { 
    data: dataInput.value, 
    hora, 
    numero_mesa, 
    qtd_pessoas, 
    nome_responsavel, 
    status, 
    garcom 
  };

  try {
    const response = await fetch("http://localhost:3000/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const res = await response.json(); 
    
    if (response.ok) {
      alert("Reserva cadastrada com sucesso!");
      dataInput.value = '';
      document.getElementById("hora").value = '';
      document.getElementById("numeroMesa").value = '';
      document.getElementById("qtdPessoas").value = '';
      document.getElementById("nomeResponsavel").value = '';
      document.getElementById("garcom").value = '';
    } else {
      alert("Erro ao cadastrar reserva: " + (res.detalhe || res.error || "Erro desconhecido."));
    }
  } catch (err) {
    alert("Erro de conexão ao cadastrar reserva: " + err.message);
  }
}

async function confirmarReserva() {
  const id = document.getElementById("idReservaConfirma").value;
  const garcom = document.getElementById("garcom").value;

  if (!id) {
    alert("Por favor, informe o ID da reserva para confirmar.");
    return;
  }
  if (!garcom) {
    alert("Por favor, informe o nome do garçom que está confirmando.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/reservas/confirmar/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ garcom: garcom })
    });

    const res = await response.json();

    if (response.ok) {
      alert("Reserva confirmada com sucesso!");
      document.getElementById("idReservaConfirma").value = '';
      document.getElementById("garcom").value = '';
    } else {
      alert("Erro ao confirmar reserva: " + (res.detalhe || res.error || "Erro desconhecido."));
    }
  } catch (err) {
    alert("Erro de conexão ao confirmar reserva: " + err.message);
  }
}

async function cancelarReserva() {
  const id = document.getElementById("idReservaCancela").value;
  if (!id) {
    alert("Por favor, informe o ID da reserva para cancelar.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/reservas/cancelar/${id}`, {
      method: "PUT"
    });

    const res = await response.json();

    if (response.ok) {
      alert("Reserva cancelada com sucesso!");
      document.getElementById("idReservaCancela").value = '';
    } else {
      alert("Erro ao cancelar reserva: " + (res.detalhe || res.error || "Erro desconhecido."));
    }
  } catch (err) {
    alert("Erro de conexão ao cancelar reserva: " + err.message);
  }
}

// Função assíncrona para gerar e exibir um relatório de reservas por período
async function gerarRelatorio() {
  // ALTERAÇÃO: Aponta para a área de resultado específica para este relatório
  const relDiv = document.getElementById("relatorioPeriodo");
  const dataInicio = document.getElementById("relatorioDataInicio").value; 
  const dataFim = document.getElementById("relatorioDataFim").value;

  // Limpa outras áreas de relatório quando este é ativado
  document.getElementById("relatorioMesa").textContent = '';
  document.getElementById("relatorioStatusResult").textContent = '';

  if (!dataInicio || !dataFim) {
    relDiv.textContent = "Por favor, informe a Data Início e a Data Fim para o relatório.";
    alert("Por favor, informe a Data Início e a Data Fim para o relatório.");
    return;
  }

  if (new Date(dataFim) < new Date(dataInicio)) {
    relDiv.textContent = "A Data Fim não pode ser anterior à Data Início.";
    alert("A Data Fim não pode ser anterior à Data Início.");
    return;
  }

  relDiv.textContent = "Carregando relatório por período...";

  try {
    const response = await fetch(`http://localhost:3000/reservas/relatorio?dataInicio=${dataInicio}&dataFim=${dataFim}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detalhe || errorData.error || `Erro HTTP: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const reservas = json.reservas || [];

    if (reservas.length > 0) {
        relDiv.textContent = reservas.map(r =>
          `ID: ${r.id}\nNome: ${r.nome_responsavel}\nData: ${r.data}\nHora: ${r.hora}\nMesa: ${r.numero_mesa}\nStatus: ${r.status}\nGarçom: ${r.garcom || 'N/A'}\n---`
        ).join("\n");
    } else {
        relDiv.textContent = "Nenhuma reserva encontrada para o período especificado.";
    }
  } catch (err) {
    relDiv.textContent = "Erro ao carregar relatório: " + err.message;
    console.error("Erro no relatório:", err);
  }
}

// Função assíncrona para gerar e exibir um relatório de reservas por número de mesa
async function gerarRelatorioPorMesa() {
    // ALTERAÇÃO: Aponta para a área de resultado específica para este relatório
    const relDivMesa = document.getElementById("relatorioMesa");
    const numeroMesa = document.getElementById("relatorioNumeroMesa").value;

    // Limpa outras áreas de relatório quando este é ativado
    document.getElementById("relatorioPeriodo").textContent = '';
    document.getElementById("relatorioStatusResult").textContent = '';

    if (!numeroMesa || isNaN(parseInt(numeroMesa, 10)) || parseInt(numeroMesa, 10) <= 0) {
        relDivMesa.textContent = "Por favor, informe um número de mesa válido.";
        alert("Por favor, informe um número de mesa válido.");
        return;
    }

    relDivMesa.textContent = "Carregando relatório por mesa...";

    try {
        const response = await fetch(`http://localhost:3000/reservas/mesa/${numeroMesa}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detalhe || errorData.error || `Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        const reservas = json.reservas || [];

        if (reservas.length > 0) {
            relDivMesa.textContent = reservas.map(r =>
              `ID: ${r.id}\nNome: ${r.nome_responsavel}\nData: ${r.data}\nHora: ${r.hora}\nMesa: ${r.numero_mesa}\nStatus: ${r.status}\nGarçom: ${r.garcom || 'N/A'}\n---`
            ).join("\n");
        } else {
            relDivMesa.textContent = `Nenhuma reserva encontrada para a mesa ${numeroMesa}.`;
        }
    } catch (err) {
        relDivMesa.textContent = "Erro ao carregar relatório por mesa: " + err.message;
        console.error("Erro no relatório por mesa:", err);
    }
}

// Função assíncrona para gerar e exibir um relatório de mesas por status
async function gerarRelatorioPorStatus() {
    const relDivStatus = document.getElementById("relatorioStatusResult");
    const statusSelecionado = document.getElementById("relatorioStatus").value;

    // Limpa outras áreas de relatório quando este é ativado
    document.getElementById("relatorioPeriodo").textContent = '';
    document.getElementById("relatorioMesa").textContent = '';


    if (!statusSelecionado) {
        relDivStatus.textContent = "Por favor, selecione um status para o relatório.";
        alert("Por favor, selecione um status para o relatório.");
        return;
    }

    relDivStatus.textContent = "Carregando relatório por status...";

    try {
        const response = await fetch(`http://localhost:3000/reservas/status/${statusSelecionado}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detalhe || errorData.error || `Erro HTTP: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        const mesas = json.mesas || [];

        if (mesas.length > 0) {
            relDivStatus.textContent = mesas.map(m =>
              `Mesa: ${m.numero_mesa}\nStatus: ${m.status}\n---`
            ).join("\n");
        } else {
            relDivStatus.textContent = `Nenhuma mesa encontrada com o status ${statusSelecionado}.`;
        }
    } catch (err) {
        relDivStatus.textContent = "Erro ao carregar relatório por status: " + err.message;
        console.error("Erro no relatório por status:", err);
    }
}