import { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import EditProfileModal from '../EditProfileModal';

const Header = () => {
  const { user } = useAuth();
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
          <div className="text-2xl font-bold">SeverinoApp</div>
          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center justify-center bg-gray-200 rounded-full w-10 h-10 text-blue-900 font-bold"
              >
                {getInitials(user.name)}
              </button>
            ) : (
              <User className="text-blue-900" />
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
