const sqlite3 = require('sqlite3').verbose();
const { abrirConexao } = require('../config/database');

async function criarTabelaUsuarios() {
    const db = await abrirConexao();
    await db.exec(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        tipo TEXT NOT NULL
    )`);
    await db.close();
}

async function inserirUsuario({ nome, email, senha, tipo }) {
    const db = await abrirConexao();
    await db.run('INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)', [nome, email, senha, tipo]);
    await db.close();
}

async function buscarUsuarioPorEmail(email) {
    const db = await abrirConexao();
    const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    await db.close();
    return usuario;
}

module.exports = {
    criarTabelaUsuarios,
    inserirUsuario,
    buscarUsuarioPorEmail
};
