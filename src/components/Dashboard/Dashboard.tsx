import React from 'react';
import { Users, Syringe, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatCard from './StatCard';

const Dashboard: React.FC = () => {
  const { getStats, user, patients, injections, appointments } = useApp();
  const stats = getStats();

  const recentPatients = patients
    .filter(p => user?.role === 'admin' || p.doctorId === user?.id)
    .slice(-5)
    .reverse();

  const upcomingAppointments = appointments
    .filter(a => 
      a.status === 'scheduled' && 
      new Date(a.date) >= new Date() &&
      (user?.role === 'admin' || a.doctorId === user?.id)
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const recentInjections = injections
    .filter(i => user?.role === 'admin' || i.doctorId === user?.id)
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de l'activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Patients totaux"
          value={stats.totalPatients}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Patients injectés"
          value={stats.injectedPatients}
          icon={Syringe}
          color="bg-green-500"
        />
        <StatCard
          title="En attente"
          value={stats.waitingPatients}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="RDV en retard"
          value={stats.overdueAppointments}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Patients récents</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPatients.length > 0 ? (
              recentPatients.map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{patient.diagnosis}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                Aucun patient enregistré
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Prochains RDV</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => {
                const patient = patients.find(p => p.id === appointment.patientId);
                return (
                  <div key={appointment.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.type === 'injection' ? 'Injection' : 'Contrôle'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(appointment.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                Aucun RDV programmé
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Injections */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Injections récentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentInjections.length > 0 ? (
            recentInjections.map((injection) => {
              const patient = patients.find(p => p.id === injection.patientId);
              return (
                <div key={injection.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient?.firstName} {patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {injection.product} - {injection.muscles.length} muscle(s)
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(injection.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500">
              Aucune injection enregistrée
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;