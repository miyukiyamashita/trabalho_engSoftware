# Sistema CRESCE — Material para a apresentação

Este documento reúne as duas entregas pedidas no final do trabalho de Engenharia de Software:

- **(a) Exemplos para a apresentação**: onde cada requisito funcional, a separação de perfis e cada heurística de Nielsen aparecem no sistema, com o caminho para reproduzir e a captura correspondente.
- **(b) Avaliação de usabilidade por persona**: roteiro no formato PERSONA → TAREFA → AVALIAÇÃO. **As colunas de resultado estão em branco**: elas devem ser preenchidas pela equipe ao aplicar o teste com usuários. Nenhum resultado foi inventado.

As capturas estão em [`docs/capturas/`](capturas/). Elas foram tiradas com a semente de demonstração, a 1366×768 (desktop) e 375×812 (celular).

---

## 0. Preparação da demonstração

1. Siga o [README](../README.md) para subir o json-server, a API e o frontend.
2. Rode a semente (`npm run seed` no `backend`, com `SEED_PASSWORD` definido) e **reinicie o json-server** em seguida.
3. Contas da semente (a senha é a mesma para todas e foi combinada com a equipe):

| Persona | Perfil | E-mail |
|---|---|---|
| Alfredo | Administrador do Sistema | `alfredo@cresce.test` |
| Michele | Administradora Escolar (Escola Municipal Crescer) | `michele@cresce.test` |
| Lorenza | Professora (Matemática e Língua Portuguesa do 5º Ano A) | `lorenza@cresce.test` |
| Breno | Responsável pela aluna Ana Souza | `breno@cresce.test` |
| (apoio) | Responsável pelo aluno Pedro Lima | `carla@cresce.test` |

A semente também traz: uma solicitação de cadastro **pendente** (Escola Estadual Horizonte) e uma **rejeitada** (Colégio Aurora), notas dos 3 primeiros bimestres, 6 chamadas por disciplina e 1 aviso não lido.

> Sem SMTP configurado, o sistema está em **modo demonstração**: quando alguém é cadastrado, a senha gerada aparece **uma única vez** para quem cadastrou (captura 06).

---

## 1. (a) Exemplos para a apresentação

### 1.1 Requisitos funcionais

| RF | Tela / rota | Passos para reproduzir | O que mostrar | Captura |
|---|---|---|---|---|
| **RF01** Solicitar cadastro da instituição | `/telacadastro` (sem login) | Início → "Solicitar cadastro da escola" → enviar com CNPJ incompleto e campos vazios | Erros abaixo de cada campo; ao enviar correto, janela com protocolo e situação "Pendente" | `02-cadastro-erros-por-campo.jpg` |
| **RF02** Login | `/login` | Entrar com cada conta da semente | Cada perfil cai no seu painel; senha errada mostra "E-mail ou senha inválidos" | `01-login.jpg` |
| **RF03** Analisar/aprovar/rejeitar solicitações | `/admin-sistema/solicitacoes` (Alfredo) | Aba Cadastro → card da Escola Estadual Horizonte → Aprovar → confirmar | Filtro "Somente pendentes", contador na aba, resumo antes de aprovar, mensagem verde, senha do novo admin (modo demonstração) | `04`, `05`, `06` |
| **RF04** Cadastrar/editar/remover escola | `/admin-sistema/escolas` (Alfredo) | "Nova escola" / "Editar" / "Excluir" | Formulário com dados da escola e do admin escolar; confirmação de exclusão em cascata | `07`, `08` |
| **RF05** Pedir edição/remoção da escola | `/admin-escolar/escola` (Michele) | Aba Edição → escolher "Telefone" → ver o valor atual → digitar o novo → Enviar | Dica "Valor atual", mensagem de envio; na aba Remoção, confirmação em vermelho | — (tirar na hora) |
| **RF06** Professores | `/admin-escolar/professores` | Cadastrar → Visualizar → Editar → Excluir | Formulário de edição com resumo antes de salvar; exclusão bloqueada se o professor dá aula | — |
| **RF07** Turmas e vínculos | `/admin-escolar/turmas` e `/admin-escolar/turmas/turma-5a` | Visualizar → "Ver detalhes" → "Retirar" aluno / "Editar" para incluir | Alunos e disciplinas com professor; capacidade validada | `13-turma-detalhes.jpg` |
| **RF08** Disciplinas | `/admin-escolar/disciplinas` | Visualizar → Editar → trocar o professor → confirmar | Resumo "Professor: A → B"; código duplicado gera mensagem no campo | — |
| **RF09** Alunos e responsáveis | `/admin-escolar/alunos` | Visualizar → Editar Pedro Lima → trocar o CPF pelo da Ana → Salvar | Resumo da alteração e o erro "Este CPF já está cadastrado" vindo do backend | `10`, `11`, `12` |
| **RF10** Enviar avisos | `/admin-escolar/avisos` (Michele) ou `/prof/avisos` (Lorenza) | Escolher turma, tipo, título e mensagem → Enviar aviso | Seleção de turmas; tipos Informativo/Alerta (navegáveis por teclado) | `14-envio-aviso.jpg` |
| **RF11** Lançar/atualizar notas | `/prof/notas` (Lorenza) | Turma 5º Ano A → Matemática → digitar 28 no 4º bimestre → corrigir para 22 → Salvar notas | Erro "Use um valor de 0 a 25"; confirmação "Substituir notas já lançadas?" com o antes → depois; mensagem verde | `18`, `19`, `20` |
| **RF12** Registrar frequência | `/prof/frequencia` (Lorenza) | Turma → disciplina → data → desmarcar Pedro → Salvar frequência | Contador "1 de 2 presentes", Marcar/Desmarcar todos, coluna CPF | `21-frequencia-chamada.jpg` |
| **RF13** Confirmar leitura | `/responsavel/avisos` (Breno) | Aba "Não lidos" → Confirmar leitura | Mensagem de confirmação; no admin, "1/2 responsáveis leram" | `25`, `31`, `15` |
| **RF14** Gerar e baixar relatório final | `/admin-escolar/relatoriofinal` (Michele) e `/responsavel/relatoriofinal` (Breno) | Breno antes da geração → Michele gera → Breno baixa | "Relatório ainda não disponível" → geração confirmada → situação por aluno (com tamanho ≤ 5 MB) → download | `26`, `16`, `17`, `27` |

### 1.2 Separação de perfis (RNF01/RNF02)

| Exemplo | Como reproduzir | O que mostrar |
|---|---|---|
| Menus diferentes por perfil | Entrar com cada conta | Capturas 03, 09, 20 (menu do professor) e 22 lado a lado |
| Rota de outro perfil na interface | Logado como Lorenza, digitar `/admin-escolar/alunos` | Volta para o início (bloqueio de rota) |
| Bloqueio no **backend** (o mais importante) | Terminal: `curl -i http://localhost:3000/alunos` | `401 Unauthorized` sem token |
| Perfil errado no backend | Rodar `npm run test:e2e` no `backend` | Testes "sem token → 401" e "perfil errado → 403" passando (professor tentando listar escolas, responsável lançando nota, admin escolar aprovando solicitação, admin do sistema gerando relatório) |
| Dono do dado | Com o token da Lorenza, `GET /alunos` sem `turmaId` | `403`: o professor só lista alunos das próprias turmas |
| Logout real | Clicar em "Sair" e usar o botão Voltar do navegador | Volta para o login; o token foi apagado |

### 1.3 As 10 heurísticas de Nielsen (aplicação descrita no documento do trabalho)

| Heurística | Aplicação prevista no documento | Onde mostrar no sistema | Passos | Captura |
|---|---|---|---|---|
| **H1** Visibilidade do status | Indicadores de carregamento e confirmação após salvar notas, frequência e cadastros | Notas, Frequência, Relatório Final, qualquer listagem | Salvar notas → botão "Salvando..." → mensagem verde; abrir listagens (indicador "Carregando...") | `20`, `17` |
| **H2** Correspondência com o mundo real | Conceitos escolares (turmas, disciplinas) | Boletim e Frequência do responsável; Solicitações | Ver bimestres, "Presente/Ausente", coluna "CPF" (antes "Matrícula"), status "Pendente/Aprovada/Rejeitada", segmento real "Ensino Fundamental I" | `23`, `24`, `04` |
| **H3** Controle e liberdade | Cancelar ou voltar sem salvar | Todos os formulários | "Cancelar" em cadastros, edições, avisos (antes comentado) e notas ("Cancelar alterações"); "← Voltar" na turma; Esc fecha a confirmação | `11`, `14` |
| **H4** Consistência e padrões | Mesmo padrão de botões, formulários e mensagens | Professores, Alunos, Turmas, Disciplinas | Mesmo par de abas, botões "Editar"/"Excluir" iguais, mesma janela de confirmação, datas em calendário; **uma única regra de nota final** em todas as telas e no PDF | `10`, `13`, `23` |
| **H5** Prevenção de erros | Campos obrigatórios, nota fora do intervalo, confirmação antes de excluir | Notas, cadastros, exclusões | Digitar 28 numa nota; tentar exceder a capacidade da turma; excluir escola (resumo do que será apagado) | `18`, `08` |
| **H6** Reconhecimento em vez de memorização | Ícones e símbolos familiares | Menu, tipos de aviso, seleção de alunos | Ícone + texto em todo o menu; turmas e alunos escolhidos pelo nome; valor atual mostrado ao pedir edição da escola | `14`, `09` |
| **H7** Eficiência e flexibilidade | Filtros por turma, disciplina e período | Notas (turma, disciplina, bimestre, busca), Frequência do responsável (disciplina, período), Solicitações (status), listas com busca | Filtrar o boletim pelo 2º bimestre; filtrar faltas por período; "Marcar todos presentes" | `23`, `24`, `04`, `21` |
| **H8** Estética e design minimalista | Paleta harmoniosa, sem excesso de informação | Painéis de cada perfil | Paleta azul consistente; só react-icons (emojis removidos); telas vazias/duplicadas removidas | `22`, `09` |
| **H9** Reconhecer, diagnosticar e corrigir erros | Mensagens que explicam o erro e como corrigir, como "CPF já cadastrado" | Alunos (edição), Solicitar cadastro | Trocar o CPF de Pedro pelo da Ana → "Este CPF já está cadastrado para outro aluno. Confira os números digitados." | `12`, `02` |
| **H10** Ajuda e documentação | Orientações sobre como realizar tarefas | Menu → "Como usar" (todos os perfis) | Abrir "Como usar": passo a passo por perfil e explicação da escala de notas | `28-como-usar.jpg` |

### 1.4 Responsividade e acessibilidade (RNF06/RNF08)

| Exemplo | Como reproduzir | Captura |
|---|---|---|
| Menu recolhível no celular | DevTools → modo dispositivo 375 px → botão "Menu" | `29`, `30` |
| Tabelas com rolagem própria, sem rolagem horizontal da página | Qualquer listagem no celular | — |
| Navegação por teclado | Tab pelos campos; nos tipos de aviso, setas ← → trocam a opção; Esc fecha confirmações | — |
| Leitor de tela | Mensagens de feedback em região `aria-live`; campos com `label` ligado e `aria-invalid` | — |

### 1.5 Requisitos não funcionais medidos

**RNF04 (até 5 s nas operações comuns).** Medido com `backend/test/medir-desempenho.js` (5 repetições, máquina de desenvolvimento, SMTP desligado):

| Operação | Média (ms) | Máximo (ms) | ≤ 5 s? |
|---|---|---|---|
| Login | 108 | 197 | Sim |
| Salvar notas (turma de 2 alunos) | 23 | 26 | Sim |
| Cadastrar professor | 108 | 114 | Sim |
| Aprovar solicitação (cria escola + admin) | 113 | 117 | Sim |
| Gerar relatórios da escola | 78 | 113 | Sim |

Com SMTP real, cadastros e aprovações somam o tempo de envio do e-mail (depende do provedor).

**RNF05 (relatório ≤ 5 MB).** Cada PDF tem cerca de 2,1 KB; o backend recusa disponibilizar qualquer arquivo acima de 5 MB (captura 17 mostra o tamanho).

---

## 2. (b) Avaliação de usabilidade por persona

**Como aplicar:** 1 a 2 participantes por persona, usando as contas da semente (reiniciar a semente entre participantes). Leia o objetivo, sem explicar o caminho. Peça para pensar em voz alta. Anote sem ajudar. **Concluiu** = Sim / Com ajuda / Não. **Tempo** em segundos. **Erros** = cliques ou tentativas que não levaram ao objetivo.

> Os campos "Concluiu", "Tempo", "Erros" e "Comentários" estão vazios de propósito: devem ser preenchidos com o que for **observado**.

### Breno — Responsável

| ID | Objetivo | Pré-condições | Passos esperados | Resultado esperado | Critério de sucesso | Problemas a observar | Heurísticas | Concluiu | Tempo | Erros | Comentários |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B1 | Ver como a filha está na escola | Conta breno; semente | Login → ler o painel Início | Diz nome, turma, nota geral, frequência e avisos não lidos | Sem ajuda, ≤ 1 min | Entende a escala 0–100? | H1, H2, H8 | | | | |
| B2 | Descobrir a nota de Matemática no 2º bimestre e explicar a nota final | Notas lançadas | Menu Notas → filtro Bimestre (opcional) | Responde 18,5 e que a final é a soma | Resposta correta | Percebe o "(parcial)"? Lê a legenda? | H2, H4, H7, H10 | | | | |
| B3 | Ver em qual dia a filha faltou | Chamadas na semente | Menu Frequência → "Faltas no período" | Diz a data da falta em Matemática | Data correta, ≤ 1 min | Usa o filtro de período? | H7, H2 | | | | |
| B4 | Ler o aviso novo e avisar a escola que leu | 1 aviso não lido | Painel "Ver avisos" → Confirmar leitura | Aviso vai para "Lidos" | Concluir sem ajuda | Percebe a confirmação? | H1, H6 | | | | |
| B5 | Baixar o relatório final | (a) antes e (b) depois da geração pela Michele | Menu Relatório Final → Baixar | (a) entende que não está disponível; (b) baixa o PDF | (a) e (b) corretos | Confunde o botão desabilitado com erro? | H1, H9 | | | | |

### Lorenza — Professora

| ID | Objetivo | Pré-condições | Passos esperados | Resultado esperado | Critério de sucesso | Problemas a observar | Heurísticas | Concluiu | Tempo | Erros | Comentários |
|---|---|---|---|---|---|---|---|---|---|---|---|
| L1 | Lançar o 4º bimestre de Matemática dos dois alunos | Conta lorenza | Notas → turma → disciplina → (bimestre 4) → digitar → Salvar → confirmar | Mensagem verde e notas mantidas ao recarregar | Sem erro final, ≤ 2 min | Usa o filtro de bimestre? Entende a janela de confirmação? | H1, H5, H7 | | | | |
| L2 | Digitar 30 por engano e corrigir | L1 iniciada | Digitar 30 → ler a mensagem → corrigir | Corrige antes de salvar | Percebe o erro sozinha | A mensagem abaixo do campo é vista? | H5, H9 | | | | |
| L3 | Corrigir a nota de um aluno já lançada | Notas salvas | Buscar o aluno → alterar → Salvar → confirmar substituição | Nota substituída | Encontra o aluno sem rolar a lista | Usa a busca? Entende "Substituir notas já lançadas?" | H5, H6, H7 | | | | |
| L4 | Fazer a chamada de hoje com um ausente | Turma com alunos | Frequência → turma → disciplina → desmarcar → Salvar | Mensagem "1 presente(s) e 1 ausente(s)" | ≤ 1 min | Entende que todos começam presentes? | H1, H2, H7 | | | | |
| L5 | Avisar a turma sobre a prova | — | Avisos → turma → Alerta → título → mensagem → Enviar | Aviso aparece em Visualizar com "0/2" | Sem ajuda | Escolhe o tipo pelo teclado/mouse sem dificuldade? | H1, H6 | | | | |

### Michele — Administradora Escolar

| ID | Objetivo | Pré-condições | Passos esperados | Resultado esperado | Critério de sucesso | Problemas a observar | Heurísticas | Concluiu | Tempo | Erros | Comentários |
|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 | Cadastrar uma nova professora | Conta michele | Professores → Cadastrar → preencher → Salvar | Mensagem verde e senha exibida uma vez | Sem ajuda, ≤ 3 min | Erros de formato são entendidos? | H1, H5, H9 | | | | |
| M2 | Corrigir o telefone do responsável de Pedro | Aluno cadastrado | Alunos → Visualizar → Editar → alterar → Salvar → confirmar | Telefone atualizado | Encontra "Editar" sem ajuda | Lê o resumo da confirmação? | H3, H4, H6 | | | | |
| M3 | Cadastrar um aluno com CPF já existente | — | Alunos → Cadastrar com o CPF da Ana | Mensagem "Este CPF já está cadastrado" no campo | Entende o que corrigir | A mensagem é vista? | H9 | | | | |
| M4 | Criar a turma 5º Ano B com capacidade 1 e 2 alunos | Alunos sem turma | Turmas → Cadastrar → selecionar 2 alunos | Erro explicando a capacidade | Corrige sozinha | Entende a dica sobre alunos já matriculados? | H5, H9 | | | | |
| M5 | Trocar a professora de Língua Portuguesa | 2 professores | Disciplinas → Editar → trocar professor → confirmar | Professor trocado | Sem ajuda | — | H4, H6 | | | | |
| M6 | Pedir a correção do telefone da escola | — | Escola → Edição → Telefone → novo valor → Enviar | Mensagem de envio | Sem ajuda | Usa o "Valor atual"? | H6, H1 | | | | |
| M7 | Disponibilizar o relatório final | Notas lançadas | Relatório Final → Gerar → confirmar | Tabela "Disponível para o responsável" | Sem ajuda | Entende para quem foi gerado? | H1, H10 | | | | |

### Alfredo — Administrador do Sistema

| ID | Objetivo | Pré-condições | Passos esperados | Resultado esperado | Critério de sucesso | Problemas a observar | Heurísticas | Concluiu | Tempo | Erros | Comentários |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | Descobrir quantas solicitações aguardam análise | Semente | Painel Início | Responde "1" | ≤ 30 s | — | H1 | | | | |
| A2 | Aprovar a solicitação pendente | 1 pendente | Solicitações → Aprovar → confirmar | Status "Aprovada" e senha do novo admin | Sem aprovação por engano | Lê o resumo antes de confirmar? | H1, H5 | | | | |
| A3 | Ver a solicitação que foi rejeitada | 1 rejeitada | Solicitações → Mostrar "Rejeitadas" | Encontra o Colégio Aurora | ≤ 1 min | Encontra o filtro? | H7, H2 | | | | |
| A4 | Corrigir o endereço de uma escola diretamente | Escola cadastrada | Escolas → Editar → alterar → confirmar | Endereço atualizado | Sem ajuda | — | H3, H6 | | | | |
| A5 | Desistir de excluir uma escola | Escola cadastrada | Escolas → Excluir → Cancelar (ou Esc) | Nada é apagado | Entende o aviso de cascata | Foco inicial no "Cancelar" ajuda? | H3, H5 | | | | |

### Questionário final (sugestão)

Ao final de cada sessão, aplicar o **SUS** (System Usability Scale, 10 perguntas, escala de 1 a 5) e registrar a nota. Anotar também a frase do participante sobre "o que foi mais difícil".
