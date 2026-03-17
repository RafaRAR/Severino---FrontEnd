import { useState } from 'react';
import { LogOut, Wrench, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import EditProfileModal from '../EditProfileModal';
import { Button } from '../ui/Button';

const Header = () => {
  const { user, logout, profile } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">SeverinoApp</span>
          </button>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/mensagens")}
                  className="relative p-2 rounded-xl hover:bg-secondary transition-colors"
                >
                  {/* <MessageCircle className="w-5 h-5 text-foreground" /> */}
                  {/* <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-primary" /> */}
                </button>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="relative"
                >
                  <img
                    src={profile?.imagemUrl}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full object-cover border border-border"
                  />
                </button>
                <button
                  onClick={logout}
                  className="flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full w-10 h-10 text-white font-bold"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/registrar">
                  <Button size="sm">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {user && (
        <EditProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          userId={user.id}
        />
      )}
    </>
  );
};

export default Header;
