# Documentação do Projeto Backend – API de Reservas para Restaurante

## Integrantes

* Marco Antonio Malandra de Araujo – 12725163977
* Duilio do Nascimento Brandao – 12724216242
* Fillype da Silva Araujo – 12724145904
* Isadora Lopes Carneiro – 12724112679
* Marcela Tourinho Machado Barreto – 12724139040
* Bruna de Jesus Matos – 12724163167

---

## 1. Introdução

Este projeto consiste no desenvolvimento do backend de uma API para gerenciamento de reservas de um restaurante. A API permite consultar reservas por período, por mesa, por status, por garçom e por ID de reserva.

---

## 2. Tecnologias Utilizadas

* Node.js (JavaScript/TypeScript)
* Express.js (Framework web)
* Banco de dados (exemplo: MySQL, PostgreSQL ou SQLite) — depende da implementação específica
* Fetch API para comunicação do frontend com backend (consumidores da API)

---

## 3. Endpoints da API

### 3.1. Relatório de reservas por período

**Endpoint:** `GET /reservas/relatorio?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD`

**Descrição:** Retorna uma lista de reservas no intervalo de datas informado.

**Resposta:**
Lista de objetos com informações de reserva (id, nome do responsável, data, hora, número da mesa, status, garçom).

---

### 3.2. Relatório de reservas por número da mesa

**Endpoint:** `GET /reservas/mesa/:numeroMesa`

**Descrição:** Retorna as reservas relacionadas à mesa especificada.

**Parâmetro:**

* `numeroMesa`: número da mesa (inteiro)

---

### 3.3. Relatório de reservas por status

**Endpoint:** `GET /reservas/status/:status`

**Descrição:** Retorna mesas com reservas que possuem o status informado.

**Parâmetro:**

* `status`: status da reserva (exemplo: "confirmada", "cancelada", etc.)

---

### 3.4. Relatório de reservas confirmadas por garçom

**Endpoint:** `GET /reservas/confirmadas/por-garcom`

**Descrição:** Retorna as reservas confirmadas agrupadas por garçom.

---

### 3.5. Relatório de reserva por ID

**Endpoint:** `GET /reservas/id/:idReserva`

**Descrição:** Retorna os dados de uma reserva específica pelo seu ID.

---

## 4. Tratamento de Erros

* Todos os endpoints retornam mensagens claras em caso de erro, incluindo erros de validação de parâmetros e erros internos do servidor.
* Mensagens de erro são retornadas em formato JSON, com propriedades como `detalhe` ou `error`.

---

## 5. Funcionamento Interno

* As funções assíncronas utilizam `fetch` para requisições HTTP.
* Cada função valida os parâmetros recebidos e exibe mensagens de alerta caso estejam inválidos.
* As respostas são exibidas formatadas no frontend, mas o foco principal deste backend é disponibilizar os dados via API.

---

## 6. Considerações Finais

Este backend é essencial para o funcionamento do sistema de reservas, facilitando consultas detalhadas e específicas que auxiliam na gestão do restaurante.
