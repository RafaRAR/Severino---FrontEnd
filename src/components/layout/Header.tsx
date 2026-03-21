import { Wrench, MessageCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import EditProfileModal from "../EditProfileModal";
import { Button } from "../ui/Button";

export default function Header() {
  const { user, profile, logout, openModal, setOpenModal } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">SeverinoApp</span>
          </button>

          {/* Ações do Usuário */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Botão de Mensagens */}
                {/* <button
                  onClick={() => navigate("/mensagens")}
                  className="relative p-2 rounded-xl hover:bg-secondary transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-foreground" />
                  <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-primary" />
                </button> */}

                {/* Avatar / Editar Perfil */}
                <button
                  onClick={() => setOpenModal("editProfile")}
                  className="relative transition-transform hover:scale-105"
                >
                  <img
                    src={profile?.imagemUrl || "https://via.placeholder.com/150"} // Fallback caso não tenha imagem
                    alt={user?.name || "Usuário"}
                    className="w-10 h-10 rounded-full object-cover border border-border"
                  />
                </button>

                {/* Botão de Logout (Trazido da UI antiga, mas adaptado para o novo estilo) */}
                <button
                  onClick={logout}
                  className="flex items-center justify-center bg-destructive hover:bg-destructive/90 transition-colors rounded-full w-10 h-10 text-destructive-foreground ml-2"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setOpenModal("login")}>
                  Entrar
                </Button>
                <Button size="sm" onClick={() => setOpenModal("cadastro")}>
                  Cadastrar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Renderização do Modal de Perfil */}
      {user && (
        <EditProfileModal
          isOpen={openModal === "editProfile"}
          onClose={() => setOpenModal(null)}
          userId={user.id}
        />
      )}
    </>
  );
}