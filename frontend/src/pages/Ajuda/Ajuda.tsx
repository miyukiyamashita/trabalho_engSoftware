import "./Ajuda.css";
import { Link } from "react-router-dom";
import { useAuth, type Perfil } from "../../contexts/AuthContext";
import { SidebarAdminSistema } from "../AdminSistema/SidebarAdminSistema";
import { SidebarAdminEscolar } from "../AdminEscolar/SidebarAdminEscolar";
import { SidebarProfessor } from "../Prof/SidebarProfessor";
import { SidebarResponsavel } from "../Responsavel/SidebarResponsavel";
import { NOTA_MAX_BIMESTRE, NOTA_MAX_FINAL } from "../../utils/notas";

type Tarefa = { titulo: string; caminho?: string; passos: string[] };

const SIDEBARS: Record<Perfil, () => React.ReactElement> = {
  admin_sistema: SidebarAdminSistema,
  admin_escolar: SidebarAdminEscolar,
  prof: SidebarProfessor,
  responsavel: SidebarResponsavel,
};

const NOME_PERFIL: Record<Perfil, string> = {
  admin_sistema: "Administrador do sistema",
  admin_escolar: "Administrador escolar",
  prof: "Professor(a)",
  responsavel: "Responsável",
};

const TAREFAS: Record<Perfil, Tarefa[]> = {
  admin_sistema: [
    {
      titulo: "Analisar uma solicitação pendente",
      caminho: "/admin-sistema/solicitacoes",
      passos: [
        "Abra Solicitações no menu. A tela já mostra só as pendentes (o número aparece em cada aba).",
        "Escolha a aba: Cadastro (escola nova), Edição (mudança de dado) ou Remoção (exclusão da escola).",
        "Leia os dados do card e clique em Aprovar ou Rejeitar.",
        "Confira o resumo na janela de confirmação e confirme. Uma mensagem verde confirma a decisão.",
        "Use o filtro Mostrar para ver as solicitações já aprovadas ou rejeitadas.",
      ],
    },
    {
      titulo: "Cadastrar, editar ou excluir uma escola",
      caminho: "/admin-sistema/escolas",
      passos: [
        "Abra Escolas no menu. Use a busca para achar uma escola pelo nome ou CNPJ.",
        "Nova escola: preencha os dados da escola e do administrador escolar e clique em Cadastrar escola.",
        "Editar: altere os campos e confirme o resumo das alterações.",
        "Excluir: a confirmação avisa que todos os dados da escola serão apagados.",
      ],
    },
  ],
  admin_escolar: [
    {
      titulo: "Cadastrar ou corrigir professores e alunos",
      caminho: "/admin-escolar/alunos",
      passos: [
        "Abra Professores ou Alunos no menu. A aba Cadastrar mostra o formulário.",
        "Preencha todos os campos. Se algo estiver errado, a mensagem em vermelho abaixo do campo explica como corrigir.",
        "Ao salvar, o login é criado e a senha é enviada por e-mail (ou mostrada na tela, uma única vez).",
        "Para corrigir um cadastro, abra a aba Visualizar, clique em Editar, altere e confirme o resumo.",
      ],
    },
    {
      titulo: "Montar uma turma",
      caminho: "/admin-escolar/turmas",
      passos: [
        "Cadastre antes os alunos, os professores e as disciplinas.",
        "Em Turmas > Cadastrar, informe nome, capacidade, ano/série e turno.",
        "Escolha as disciplinas e os alunos. O número de alunos não pode passar da capacidade.",
        "Depois, use Editar para incluir ou retirar alunos e disciplinas.",
      ],
    },
    {
      titulo: "Enviar um aviso",
      caminho: "/admin-escolar/avisos",
      passos: [
        "Em Avisos > Enviar, escolha as turmas, o tipo (Informativo ou Alerta), o título e a mensagem.",
        "Na aba Visualizar, acompanhe quantos responsáveis já confirmaram a leitura.",
      ],
    },
    {
      titulo: "Disponibilizar o relatório final",
      caminho: "/admin-escolar/relatoriofinal",
      passos: [
        "Em Relatório Final, clique em Gerar e disponibilizar relatórios e confirme.",
        "A tabela mostra para quais alunos o relatório já está disponível aos responsáveis.",
      ],
    },
    {
      titulo: "Pedir alteração ou remoção dos dados da escola",
      caminho: "/admin-escolar/escola",
      passos: [
        "Em Escola > Edição, escolha a informação, veja o valor atual e digite o valor novo.",
        "O pedido é analisado pelo administrador do sistema antes de valer.",
      ],
    },
  ],
  prof: [
    {
      titulo: "Lançar ou corrigir notas",
      caminho: "/prof/notas",
      passos: [
        "Abra Notas, escolha a turma e a disciplina. Aparecem só as suas turmas e disciplinas.",
        `Digite as notas de cada bimestre (0 a ${NOTA_MAX_BIMESTRE}). Valores fora disso ficam em vermelho com a explicação.`,
        "Use o filtro Bimestre para mostrar só a coluna que você está lançando, e a busca para achar um aluno.",
        "Clique em Salvar notas. Se houver notas já salvas, a confirmação mostra o que vai mudar.",
      ],
    },
    {
      titulo: "Fazer a chamada",
      caminho: "/prof/frequencia",
      passos: [
        "Abra Frequência, escolha turma, disciplina e data da aula.",
        "Todos começam como presentes: desmarque quem faltou (ou use Marcar/Desmarcar todos).",
        "Clique em Salvar frequência. Se a data já tiver chamada, você confirma a substituição.",
      ],
    },
    {
      titulo: "Enviar um aviso para suas turmas",
      caminho: "/prof/avisos",
      passos: ["Em Avisos > Enviar, escolha as turmas, o tipo, o título e a mensagem, e clique em Enviar aviso."],
    },
  ],
  responsavel: [
    {
      titulo: "Acompanhar notas e frequência",
      caminho: "/responsavel/notas",
      passos: [
        "A tela Início mostra um resumo: nota geral, frequência geral e avisos não lidos.",
        "Em Notas, veja cada disciplina por bimestre. Filtre por disciplina ou bimestre.",
        "Em Frequência, veja a porcentagem por disciplina e as datas das faltas. Filtre por período.",
      ],
    },
    {
      titulo: "Ler e confirmar avisos",
      caminho: "/responsavel/avisos",
      passos: [
        "Em Avisos, a aba Não lidos mostra o que ainda falta ler.",
        "Depois de ler, clique em Confirmar leitura: a escola passa a ver que você leu.",
      ],
    },
    {
      titulo: "Baixar o relatório final",
      caminho: "/responsavel/relatoriofinal",
      passos: [
        "Em Relatório Final, veja se o relatório já foi disponibilizado pela escola.",
        "Quando estiver disponível, clique em Baixar relatório (PDF).",
      ],
    },
  ],
};

/** H10: orientações sobre como realizar as tarefas principais de cada perfil. */
export function Ajuda() {
  const { user } = useAuth();
  if (!user) return null;
  const Sidebar = SIDEBARS[user.tipo];
  const mostraNotas = user.tipo !== "admin_sistema";

  return (
    <>
      <Sidebar />
      <main className="conteudo-ajuda">
        <h1 className="titulo-pagina">Como usar o CRESCE</h1>
        <p className="texto-ajuda">
          Perfil: <strong>{NOME_PERFIL[user.tipo]}</strong>. Passo a passo das tarefas principais.
        </p>

        {TAREFAS[user.tipo].map((tarefa) => (
          <section className="ajuda-tarefa" key={tarefa.titulo}>
            <h2>{tarefa.titulo}</h2>
            <ol>
              {tarefa.passos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            {tarefa.caminho && (
              <Link to={tarefa.caminho} className="botao-editar">
                Ir para a tela
              </Link>
            )}
          </section>
        ))}

        {mostraNotas && (
          <section className="ajuda-tarefa">
            <h2>Como a nota é calculada</h2>
            <ul>
              <li>Cada bimestre vale de 0 a {NOTA_MAX_BIMESTRE} pontos.</li>
              <li>
                A <strong>nota final</strong> da disciplina é a soma dos 4 bimestres, de 0 a {NOTA_MAX_FINAL} pontos.
              </li>
              <li>Enquanto algum bimestre não foi lançado, a nota aparece como <em>parcial</em>.</li>
              <li>A <strong>nota geral</strong> do aluno é a média das notas finais das disciplinas.</li>
              <li>Frequência: 90% ou mais é excelente, de 75% a 89% pede atenção e abaixo de 75% é crítica.</li>
            </ul>
          </section>
        )}

        <section className="ajuda-tarefa">
          <h2>Dicas gerais</h2>
          <ul>
            <li>Mensagens verdes confirmam que a operação deu certo; vermelhas explicam o que corrigir.</li>
            <li>Antes de editar ou excluir, o sistema mostra um resumo e pede confirmação. Use Cancelar para desistir.</li>
            <li>Em celulares, toque em Menu no canto superior para abrir as opções.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
