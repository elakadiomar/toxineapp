import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import PatientList from './components/Patients/PatientList';
import NewPatientForm from './components/Patients/NewPatientForm';
import AppointmentCalendar from './components/Appointments/AppointmentCalendar';
import InjectionForm from './components/Injections/InjectionForm';
import InjectionList from './components/Injections/InjectionList';
import FollowUpForm from './components/FollowUps/FollowUpForm';
import FollowUpList from './components/FollowUps/FollowUpList';
import ReportsPage from './components/Reports/ReportsPage';
import SettingsPage from './components/Settings/SettingsPage';
import UserManagement from './components/Settings/UserManagement';

const AppContent: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return (
          <div className="space-y-6">
            <PatientList />
          </div>
        );
      case 'appointments':
        return <AppointmentCalendar />;
      case 'injections':
        return (
          <div className="space-y-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('injection-form')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Nouvelle injection
              </button>
              <button
                onClick={() => setActiveTab('injection-list')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Historique
              </button>
            </div>
            {activeTab === 'injections' && <InjectionList />}
          </div>
        );
      case 'injection-form':
        return <InjectionForm />;
      case 'injection-list':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('injections')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <span>← Retour</span>
              </button>
            </div>
            <InjectionList />
          </div>
        );
      case 'follow-ups':
        return (
          <div className="space-y-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('follow-up-form')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Nouveau contrôle
              </button>
              <button
                onClick={() => setActiveTab('follow-up-list')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Historique
              </button>
            </div>
            {activeTab === 'follow-ups' && <FollowUpList />}
          </div>
        );
      case 'follow-up-form':
        return <FollowUpForm />;
      case 'follow-up-list':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveTab('follow-ups')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <span>← Retour</span>
              </button>
            </div>
            <FollowUpList />
          </div>
        );
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'user-management':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;