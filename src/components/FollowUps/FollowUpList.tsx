import React, { useState } from 'react';
import { Search, Eye, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FollowUp } from '../../types';

const FollowUpList: React.FC = () => {
  const { followUps, patients, injections, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

  const filteredFollowUps = followUps
    .filter(followUp => user?.role === 'admin' || followUp.doctorId === user?.id)
    .filter(followUp => {
      const patient = patients.find(p => p.id === followUp.patientId);
      return patient && 
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getObjectiveIcon = (objective: string) => {
    switch (objective) {
      case 'achieved':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'not_achieved':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getObjectiveLabel = (objective: string) => {
    switch (objective) {
      case 'achieved':
        return 'Atteint';
      case 'partial':
        return 'Partiel';
      case 'not_achieved':
        return 'Non atteint';
      default:
        return objective;
    }
  };

  const getObjectiveColor = (objective: string) => {
    switch (objective) {
      case 'achieved':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_achieved':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const FollowUpModal: React.FC<{ followUp: FollowUp; onClose: () => void }> = ({ followUp, onClose }) => {
    const patient = patients.find(p => p.id === followUp.patientId);
    const injection = injections.find(i => i.id === followUp.injectionId);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Détails du contrôle - {patient?.firstName} {patient?.lastName}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(followUp.date).toLocaleDateString('fr-FR')} à {new Date(followUp.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Patient Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Informations patient</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nom:</span> {patient?.lastName}
                </div>
                <div>
                  <span className="text-gray-600">Prénom:</span> {patient?.firstName}
                </div>
                <div>
                  <span className="text-gray-600">Diagnostic:</span> {patient?.diagnosis}
                </div>
                <div>
                  <span className="text-gray-600">Date de naissance:</span> {patient && new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>

            {/* Injection Reference */}
            {injection && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Injection de référence</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <div className="font-medium">{new Date(injection.date).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Produit:</span>
                    <div className="font-medium">{injection.product}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Dosage total:</span>
                    <div className="font-medium">
                      {injection.muscles.reduce((total, muscle) => total + muscle.dosage, 0)} UI
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Follow-up Results */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Résultats du contrôle</h4>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600">Objectif thérapeutique:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    {getObjectiveIcon(followUp.objectiveAchieved)}
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getObjectiveColor(followUp.objectiveAchieved)}`}>
                      {getObjectiveLabel(followUp.objectiveAchieved)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-600">Commentaires:</span>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {followUp.comments}
                  </div>
                </div>
              </div>
            </div>

            {/* Next Appointment */}
            {followUp.nextAppointment && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Prochain rendez-vous</h4>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">
                    Programmé pour le {new Date(followUp.nextAppointment).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contrôles post-injection</h1>
          <p className="text-gray-600">{filteredFollowUps.length} contrôle(s) trouvé(s)</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom de patient..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Follow-ups Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date contrôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Injection référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Objectif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prochain RDV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFollowUps.map((followUp) => {
                const patient = patients.find(p => p.id === followUp.patientId);
                const injection = injections.find(i => i.id === followUp.injectionId);
                
                return (
                  <tr key={followUp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {patient?.firstName} {patient?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{patient?.diagnosis}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(followUp.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(followUp.date).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {injection ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Date(injection.date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-sm text-gray-500">{injection.product}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non trouvée</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getObjectiveIcon(followUp.objectiveAchieved)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getObjectiveColor(followUp.objectiveAchieved)}`}>
                          {getObjectiveLabel(followUp.objectiveAchieved)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {followUp.nextAppointment ? (
                        <div className="flex items-center space-x-1 text-sm text-green-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(followUp.nextAppointment).toLocaleDateString('fr-FR')}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Aucun</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedFollowUp(followUp)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Details Modal */}
      {selectedFollowUp && (
        <FollowUpModal
          followUp={selectedFollowUp}
          onClose={() => setSelectedFollowUp(null)}
        />
      )}
    </div>
  );
};

export default FollowUpList;