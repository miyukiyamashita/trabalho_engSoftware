/**
 * Medição de RNF04 (operações comuns em até 5 s).
 * Requer API (3000) e json-server (3001) no ar com a semente de demonstração.
 * Uso: SEED_PASSWORD=<senha-demo> node test/medir-desempenho.js
 * Atenção: cria registros de teste (professor e solicitação). Rode a semente de novo depois.
 */
const API = process.env.API_URL ?? 'http://localhost:3000';
const SENHA = process.env.SEED_PASSWORD;
const REPETICOES = Number(process.env.REPETICOES ?? 5);
if (!SENHA) {
  console.error('Defina SEED_PASSWORD.');
  process.exit(1);
}

async function chamar(metodo, rota, token, corpo) {
  const inicio = performance.now();
  const r = await fetch(API + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  const ms = performance.now() - inicio;
  if (!r.ok) throw new Error(`${metodo} ${rota} -> ${r.status} ${JSON.stringify(dados)}`);
  return { ms, dados };
}

const login = async (email) => (await chamar('POST', '/auth/login', null, { email, senha: SENHA })).dados.access_token;
const cpf = (n) => {
  const d = String(100000000 + n).slice(-9).split('').map(Number);
  const dv = (arr) => {
    const s = arr.reduce((a, x, i) => a + x * (arr.length + 1 - i), 0);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  d.push(dv(d));
  d.push(dv(d));
  return d.join('');
};

(async () => {
  const resultados = {};
  const medir = async (nome, fn) => {
    resultados[nome] = [];
    for (let i = 0; i < REPETICOES; i++) resultados[nome].push(await fn(i));
  };

  await medir('Login', async () => (await chamar('POST', '/auth/login', null, { email: 'michele@cresce.test', senha: SENHA })).ms);

  const tProf = await login('lorenza@cresce.test');
  await medir('Salvar notas (turma de 2 alunos)', async () =>
    (await chamar('POST', '/notas/lancar', tProf, {
      turmaId: 'turma-5a',
      disciplinaId: 'disc-por',
      lancamentos: [
        { alunoId: 'aluno-ana', bim1: 22, bim2: 21, bim3: 23, bim4: null },
        { alunoId: 'aluno-pedro', bim1: 19, bim2: 17, bim3: 18, bim4: null },
      ],
    })).ms,
  );

  const tAdm = await login('michele@cresce.test');
  const base = Date.now() % 100000;
  await medir('Cadastrar professor', async (i) =>
    (await chamar('POST', '/professores', tAdm, {
      nome: `Professor Medição ${i}`,
      cpf: cpf(base * 10 + i),
      dataNascimento: '1990-01-01',
      email: `medicao${base}${i}@cresce.test`,
      telefone: '(32) 99999-0000',
      formacao: 'Licenciatura',
    })).ms,
  );

  const tSis = await login('alfredo@cresce.test');
  await medir('Aprovar solicitação (cria escola + admin)', async (i) => {
    const cnpj = String(10000000000000 + base * 100 + i).slice(-14);
    const { dados } = await chamar('POST', '/solicitacoes-cadastro', null, {
      nomeInstituicao: `Escola Medição ${i}`,
      cnpj,
      endereco: 'Rua Teste, 1',
      telefone: '(32) 3333-0000',
      emailInstituicao: `escola${base}${i}@cresce.test`,
      setorEducacional: 'fundamental',
      nomeRepresentante: 'Representante Teste',
      cpfRepresentante: cpf(base * 10 + 50 + i),
      emailRepresentante: `rep${base}${i}@cresce.test`,
      cargo: 'Diretor',
      numeroAlunos: '0-100',
    });
    return (await chamar('PATCH', `/solicitacoes-cadastro/${dados.id}/status`, tSis, { status: 'APROVADA' })).ms;
  });

  await medir('Gerar relatórios da escola', async () => (await chamar('POST', '/relatorios/gerar', tAdm)).ms);

  console.log('| Operação | Média (ms) | Máximo (ms) | ≤ 5 s? |');
  console.log('|---|---|---|---|');
  for (const [nome, tempos] of Object.entries(resultados)) {
    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    const max = Math.max(...tempos);
    console.log(`| ${nome} | ${media.toFixed(0)} | ${max.toFixed(0)} | ${max <= 5000 ? 'Sim' : 'NÃO'} |`);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
