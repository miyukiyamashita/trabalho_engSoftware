/**
 * Migração (T3/T5): converte senhas em texto puro de `usuarios` para hash bcrypt
 * e remove o campo `senha` das coleções de perfil. Pode ser executada várias vezes.
 * Uso: node database/migrar-senhas.js  (com o json-server PARADO)
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const arquivo = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
let convertidas = 0;

for (const usuario of db.usuarios || []) {
  if (typeof usuario.senha === 'string' && !usuario.senha.startsWith('$2')) {
    usuario.senha = bcrypt.hashSync(usuario.senha, 10);
    convertidas++;
  }
  if (usuario.email) usuario.email = String(usuario.email).trim().toLowerCase();
}

for (const colecao of ['alunos', 'professores', 'administradoresEscolares', 'responsaveis']) {
  for (const registro of db[colecao] || []) delete registro.senha;
}

fs.writeFileSync(arquivo, JSON.stringify(db, null, 2));
console.log(`Senhas convertidas para hash: ${convertidas}`);
