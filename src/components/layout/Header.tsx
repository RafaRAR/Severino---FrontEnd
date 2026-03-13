import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import EditProfileModal from '../EditProfileModal';
import { Button } from '../ui/Button';

const Header = () => {
  const { user, logout, profile } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return '';
    const nameArray = name.split(' ');
    if (nameArray.length > 1) {
      return `${nameArray[0][0]}${nameArray[1][0]}`;
    }
    return nameArray[0][0];
  };

  return (
    <>
      <header className="bg-brand-navy p-4 text-white shadow-md">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            SeverinoApp
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center justify-center bg-gray-200 rounded-full w-10 h-10 text-blue-900 font-bold overflow-hidden"
                >
                  {profile?.imagemUrl ? (
                    <img
                      src={profile.imagemUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </button>
                <button
                  onClick={logout}
                  className="flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full w-10 h-10 text-white font-bold"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link to="/registrar">
                  <Button variant="brand">Cadastrar</Button>
                </Link>
              </div>
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
