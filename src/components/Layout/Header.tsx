import React from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Header: React.FC = () => {
  const { user, logout } = useApp();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                MedInject Pro
              </h1>
              <p className="text-xs text-gray-500">
                Gestion des injections de toxine botulique
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {user?.role === 'admin' ? 'Admin' : 'Médecin'}
              </span>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;