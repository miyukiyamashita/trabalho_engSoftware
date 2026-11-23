/**
 * Semente de demonstração (T27). Recria backend/database/db.json com uma escola
 * completa para as 4 personas do trabalho. As senhas são gravadas apenas em hash.
 *
 * Uso (com o json-server PARADO):
 *   SEED_PASSWORD=<senha-das-contas-demo> node database/seed.js
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const senha = process.env.SEED_PASSWORD;
if (!senha || senha.length < 8) {
  console.error('Defina SEED_PASSWORD (mínimo 8 caracteres) com a senha das contas de demonstração.');
  process.exit(1);
}
const hash = bcrypt.hashSync(senha, 10);
const agora = new Date();
const dia = (offset) => {
  const d = new Date(agora);
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
};

const ESC = 'esc-crescer';
const db = {
  usuarios: [
    { id: 'u-alfredo', nome: 'Alfredo Martins', email: 'alfredo@cresce.test', senha: hash, tipo: 'admin_sistema', escolaId: null, perfilId: null },
    { id: 'u-michele', nome: 'Michele Andrade', email: 'michele@cresce.test', senha: hash, tipo: 'admin_escolar', escolaId: ESC, perfilId: 'adm-michele' },
    { id: 'u-lorenza', nome: 'Lorenza Prado', email: 'lorenza@cresce.test', senha: hash, tipo: 'prof', escolaId: ESC, perfilId: 'prof-lorenza' },
    { id: 'u-breno', nome: 'Breno Souza', email: 'breno@cresce.test', senha: hash, tipo: 'responsavel', escolaId: ESC, perfilId: null },
    { id: 'u-carla', nome: 'Carla Lima', email: 'carla@cresce.test', senha: hash, tipo: 'responsavel', escolaId: ESC, perfilId: null },
  ],
  escolas: [
    {
      id: ESC,
      nome: 'Escola Municipal Crescer',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua das Acácias, 120 - Centro',
      telefone: '(32) 3215-4000',
      email: 'contato@crescer.test',
      setorEducacional: 'fundamental',
      numeroAlunos: '101-500',
      dataRegistro: dia(60) + 'T12:00:00.000Z',
      alunos: ['123.456.789-09', '987.654.321-00'],
      professores: ['111.444.777-35'],
      disciplinas: ['MAT501', 'POR501'],
      turmas: ['5º Ano A'],
      avisos: [dia(2) + 'T13:00:00.000Z'],
    },
  ],
  administradoresEscolares: [
    { id: 'adm-michele', nome: 'Michele Andrade', email: 'michele@cresce.test', cargo: 'Diretora', cpf: '529.982.247-25', escolaId: ESC },
  ],
  professores: [
    {
      id: 'prof-lorenza',
      nome: 'Lorenza Prado',
      email: 'lorenza@cresce.test',
      cpf: '111.444.777-35',
      telefone: '(32) 99999-1234',
      dataNascimento: '1988-03-14',
      formacao: 'Licenciatura em Pedagogia',
      escolaId: ESC,
    },
  ],
  alunos: [
    {
      id: 'aluno-ana',
      nomeAluno: 'Ana Souza',
      cpfAluno: '123.456.789-09',
      dataNascimentoAluno: '2016-05-20',
      nomeResponsavel: 'Breno Souza',
      emailResponsavel: 'breno@cresce.test',
      telefoneResponsavel: '(32) 98888-1111',
      escolaId: ESC,
    },
    {
      id: 'aluno-pedro',
      nomeAluno: 'Pedro Lima',
      cpfAluno: '987.654.321-00',
      dataNascimentoAluno: '2016-09-02',
      nomeResponsavel: 'Carla Lima',
      emailResponsavel: 'carla@cresce.test',
      telefoneResponsavel: '(32) 98888-2222',
      escolaId: ESC,
    },
  ],
  responsaveis: [],
  disciplinas: [
    { id: 'disc-mat', nomeDisciplina: 'Matemática', codigo: 'MAT501', cargaHoraria: 5, areaConhecimento: 'Exatas', descricao: 'Números, operações e geometria do 5º ano.', professorId: 'prof-lorenza', escolaId: ESC },
    { id: 'disc-por', nomeDisciplina: 'Língua Portuguesa', codigo: 'POR501', cargaHoraria: 5, areaConhecimento: 'Linguagens', descricao: 'Leitura, escrita e interpretação de textos.', professorId: 'prof-lorenza', escolaId: ESC },
  ],
  turmas: [
    { id: 'turma-5a', nomeTurma: '5º Ano A', capacidade: 30, anoSerie: '5', turno: 'Manhã', alunos: ['aluno-ana', 'aluno-pedro'], disciplinas: ['disc-mat', 'disc-por'], escolaId: ESC },
  ],
  notas: [
    { id: 'n1', turmaId: 'turma-5a', disciplinaId: 'disc-mat', alunoId: 'aluno-ana', escolaId: ESC, bim1: 20, bim2: 18.5, bim3: 21, bim4: null },
    { id: 'n2', turmaId: 'turma-5a', disciplinaId: 'disc-por', alunoId: 'aluno-ana', escolaId: ESC, bim1: 22, bim2: 21, bim3: 23, bim4: null },
    { id: 'n3', turmaId: 'turma-5a', disciplinaId: 'disc-mat', alunoId: 'aluno-pedro', escolaId: ESC, bim1: 14, bim2: 16, bim3: 15.5, bim4: null },
    { id: 'n4', turmaId: 'turma-5a', disciplinaId: 'disc-por', alunoId: 'aluno-pedro', escolaId: ESC, bim1: 19, bim2: 17, bim3: 18, bim4: null },
  ],
  frequencia: [],
  avisos: [
    {
      id: 'aviso-reuniao',
      publico: ['turma-5a'],
      tipoAviso: 'alerta',
      tituloAviso: 'Reunião de pais e responsáveis',
      descricao: 'Reunião na próxima sexta-feira, às 18h, no auditório. Assuntos: resultados do 3º bimestre e passeio escolar.',
      dataCriacao: dia(2) + 'T13:00:00.000Z',
      escolaId: ESC,
      remetenteId: 'u-michele',
      tipoRemetente: 'admin_escolar',
      nomeRemetente: 'Michele Andrade',
      responsaveisQueLeram: [],
    },
  ],
  relatorios: [],
  solicitacoesCadastro: [
    {
      id: 'sol-horizonte',
      nomeInstituicao: 'Escola Estadual Horizonte',
      cnpj: '98.765.432/0001-10',
      endereco: 'Av. Brasil, 900 - Bairro Novo',
      telefone: '(32) 3222-5555',
      emailInstituicao: 'secretaria@horizonte.test',
      setorEducacional: 'fundamental',
      nomeRepresentante: 'Roberto Alves',
      cpfRepresentante: '390.533.447-05',
      emailRepresentante: 'roberto@horizonte.test',
      cargo: 'Diretor',
      numeroAlunos: '501-1000',
      status: 'PENDENTE',
      dataSolicitacao: dia(1) + 'T10:00:00.000Z',
    },
    {
      id: 'sol-aurora',
      nomeInstituicao: 'Colégio Aurora',
      cnpj: '11.222.333/0001-81',
      endereco: 'Rua Sete, 45',
      telefone: '(32) 3233-1010',
      emailInstituicao: 'contato@aurora.test',
      setorEducacional: 'infantil',
      nomeRepresentante: 'Sônia Reis',
      cpfRepresentante: '714.602.380-01',
      emailRepresentante: 'sonia@aurora.test',
      cargo: 'Coordenadora',
      numeroAlunos: '0-100',
      status: 'REJEITADA',
      dataSolicitacao: dia(10) + 'T10:00:00.000Z',
      dataDecisao: dia(8) + 'T10:00:00.000Z',
    },
  ],
  solicitacoesEdicao: [],
  solicitacoesRemocao: [],
};

// Chamadas: 6 aulas por disciplina; Pedro falta em algumas aulas.
const faltasPedro = { 'disc-mat': [1, 4], 'disc-por': [2] };
for (const disciplinaId of ['disc-mat', 'disc-por']) {
  for (let i = 0; i < 6; i++) {
    db.frequencia.push({
      id: `f-${disciplinaId}-${i}`,
      turmaId: 'turma-5a',
      disciplinaId,
      data: dia(3 + i * 2),
      escolaId: ESC,
      chamada: [
        { alunoId: 'aluno-ana', presente: !(disciplinaId === 'disc-mat' && i === 3) },
        { alunoId: 'aluno-pedro', presente: !faltasPedro[disciplinaId].includes(i) },
      ],
    });
  }
}

fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2) + '\n');
console.log('db.json recriado com a semente de demonstração.');
