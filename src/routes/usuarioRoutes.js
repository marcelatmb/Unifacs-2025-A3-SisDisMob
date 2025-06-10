const express = require('express');
const bcrypt = require('bcryptjs');
const { inserirUsuario, buscarUsuarioPorEmail } = require('../models/usuario');

const router = express.Router();

// Registro
router.post('/registrar', async (req, res) => {
    const { nome, email, senha, tipo } = req.body;
    if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({ erro: 'Preencha todos os campos!' });
    }
    try {
        const usuarioExistente = await buscarUsuarioPorEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ erro: 'Email já cadastrado!' });
        }
        const senhaHash = await bcrypt.hash(senha, 10);
        await inserirUsuario({ nome, email, senha: senhaHash, tipo });
        res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao registrar usuário.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos!' });
    }
    try {
        const usuario = await buscarUsuarioPorEmail(email);
        if (!usuario) {
            return res.status(400).json({ erro: 'Usuário não encontrado!' });
        }
        const senhaConfere = await bcrypt.compare(senha, usuario.senha);
        if (!senhaConfere) {
            return res.status(400).json({ erro: 'Senha inválida!' });
        }
        // Não envie a senha para o frontend
        delete usuario.senha;
        res.json({ usuario });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao fazer login.' });
    }
});

module.exports = router;
