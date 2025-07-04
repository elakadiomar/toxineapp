import React from 'react';
import { 
  Users, 
  Calendar, 
  Syringe, 
  BarChart3, 
  Settings, 
  FileText,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3, roles: ['admin', 'doctor'] },
    { id: 'patients', label: 'Patients', icon: Users, roles: ['admin', 'doctor'] },
    { id: 'appointments', label: 'Agenda', icon: Calendar, roles: ['admin', 'doctor'] },
    { id: 'injections', label: 'Injections', icon: Syringe, roles: ['admin', 'doctor'] },
    { id: 'follow-ups', label: 'Contrôles', icon: ClipboardList, roles: ['admin', 'doctor'] },
    { id: 'reports', label: 'Rapports', icon: FileText, roles: ['admin', 'doctor'] },
    { id: 'settings', label: 'Paramètres', icon: Settings, roles: ['admin'] },
    { id: 'user-management', label: 'Gestion utilisateurs', icon: UserCog, roles: ['admin'] }
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'doctor')
  );

  return (
    <div className="bg-gray-50 border-r border-gray-200 w-64 flex-shrink-0">
      <nav className="mt-8">
        <div className="px-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Navigation
          </h2>
        </div>
        <div className="mt-4 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;