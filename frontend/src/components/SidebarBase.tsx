import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import { FiHelpCircle, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import "../styles/sidebar.css";

export type ItemMenu = { para: string; rotulo: string; icone: IconType; exato?: boolean };

/**
 * Menu lateral compartilhado pelos perfis.
 * - abaixo de 768 px vira um menu recolhível com botão "Menu" (RNF06/RNF08, T31);
 * - "Como usar" leva à ajuda do perfil (H10);
 * - "Sair" encerra a sessão de verdade (T10).
 */
export function SidebarBase({ itens, publico = false }: { itens: ItemMenu[]; publico?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setAberto(false), [location.pathname]);

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <button
        type="button"
        className="sidebar-alternar"
        aria-expanded={aberto}
        aria-controls="menu-principal"
        onClick={() => setAberto((v) => !v)}
      >
        {aberto ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        <span>{aberto ? "Fechar" : "Menu"}</span>
      </button>
      {aberto && <div className="sidebar-fundo" onClick={() => setAberto(false)} aria-hidden="true" />}

      <nav id="menu-principal" className={`sidebar ${aberto ? "aberta" : ""}`} aria-label="Menu principal">
        <p>MENU</p>
        {itens.map(({ para, rotulo, icone: Icone, exato }) => (
          <NavLink key={para} to={para} end={exato}>
            <Icone aria-hidden="true" />
            <span>{rotulo}</span>
          </NavLink>
        ))}

        {!publico && (
          <>
            <NavLink to="/ajuda" className="sidebar-ajuda">
              <FiHelpCircle aria-hidden="true" />
              <span>Como usar</span>
            </NavLink>
            <button type="button" className="logout" onClick={sair}>
              <FiLogOut aria-hidden="true" />
              <span>Sair</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
}
