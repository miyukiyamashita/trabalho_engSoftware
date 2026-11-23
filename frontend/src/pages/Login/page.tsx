import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./page.css";
import logo from "../../assets/logo.png";
import { api } from "../../services/api";
import { ROTA_INICIAL, useAuth } from "../../contexts/AuthContext";
import { FiChevronLeft } from "react-icons/fi";
import { lerErro } from "../../utils/erros";
import { CampoErro, propsErro } from "../../components/Campos";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState(
    params.get("sessao") === "expirada" ? "Sua sessão expirou. Entre novamente para continuar." : ""
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    if (user) navigate(ROTA_INICIAL[user.tipo], { replace: true });
  }, [user, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setErros({});
    setEntrando(true);
    try {
      const response = await api.post("/auth/login", { email, senha: password });
      const usuario = await login(response.data.access_token);
      navigate(ROTA_INICIAL[usuario.tipo], { replace: true });
    } catch (error) {
      const { mensagem, campos } = lerErro(error, "E-mail ou senha inválidos.");
      setErro(mensagem);
      setErros(campos);
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div className="paginaLogin">
      <div className="topo">
        <button type="button" className="voltar" onClick={() => navigate("/")}>
          <FiChevronLeft aria-hidden="true" />
          <span>Voltar ao Início</span>
        </button>

        <img src={logo} alt="Logotipo do CRESCE" className="logo" />

        <div className="texto">
          <h1>CRESCE</h1>
          <p className="subtitulo">Controle e Registro Escolar de Suporte ao Comportamento e Evolução</p>
        </div>
      </div>

      <form className="quadrado" onSubmit={handleLogin} noValidate>
        <h2>Acesse com suas credenciais</h2>

        <label htmlFor="login-email" className="visualmente-oculto">E-mail</label>
        <input
          id="login-email"
          type="email"
          placeholder="E-mail"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          {...propsErro("email", erros)}
        />
        <CampoErro id="erro-email" mensagem={erros.email} />

        <label htmlFor="login-senha" className="visualmente-oculto">Senha</label>
        <input
          id="login-senha"
          type="password"
          placeholder="Senha"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...propsErro("senha", erros)}
        />
        <CampoErro id="erro-senha" mensagem={erros.senha} />

        {erro && (
          <p className="erro-login" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="entrar" disabled={entrando}>
          {entrando ? "Entrando..." : "Entrar"}
        </button>
        <p className="dica-campo">
          A senha é enviada por e-mail (ou exibida para quem fez o cadastro) quando a conta é criada.
        </p>
      </form>
    </div>
  );
}
