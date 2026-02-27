import { useAuth } from '../../context/AuthContext';
import { User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
      >
        <Menu size={22} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name || user.email}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <User className="w-8 h-8 p-1 bg-gray-200 rounded-full text-gray-600" />
        )}
        <span className="text-sm text-gray-700 font-medium hidden sm:inline">
          {user?.name || user?.email}
        </span>
      </div>
    </header>
  );
}
