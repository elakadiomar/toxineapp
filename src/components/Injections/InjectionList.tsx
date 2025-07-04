import React, { useState } from 'react';
import { Search, Eye, FileText, Calendar, Edit, Plus, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Injection } from '../../types';
import { generateInjectionPDF } from '../../utils/pdfGenerator';

const InjectionList: React.FC = () => {
  const { injections, patients, configuration, user, updateInjection, addAppointment } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInjection, setSelectedInjection] = useState<Injection | null>(null);
  const [editingInjection, setEditingInjection] = useState<Injection | null>(null);

  const filteredInjections = injections
    .filter(injection => user?.role === 'admin' || injection.doctorId === user?.id)
    .filter(injection => {
      const patient = patients.find(p => p.id === injection.patientId);
      return patient && 
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleScheduleFollowUp = (injection: Injection) => {
    const patient = patients.find(p => p.id === injection.patientId);
    if (!patient) return;

    const followUpDate = new Date();
    followUpDate.setMonth(followUpDate.getMonth() + 3); // 3 mois après

    addAppointment({
      patientId: injection.patientId,
      date: followUpDate.toISOString(),
      type: 'followup',
      location: 'service',
      status: 'scheduled',
      notes: `Contrôle post-injection pour ${patient.firstName} ${patient.lastName}`,
      doctorId: user?.id || ''
    });

    alert(`Rendez-vous de contrôle programmé pour ${patient.firstName} ${patient.lastName} le ${followUpDate.toLocaleDateString('fr-FR')}`);
  };

  const handleUpdateFollowUpDate = (injection: Injection, newDate: string) => {
    updateInjection(injection.id, { followUpDate: newDate });
    setEditingInjection(null);
    alert('Date de contrôle mise à jour avec succès !');
  };

  const handleGeneratePDF = (injection: Injection) => {
    const patient = patients.find(p => p.id === injection.patientId);
    if (patient) {
      generateInjectionPDF(injection, patient, configuration.muscles);
    }
  };

  const EditInjectionModal: React.FC<{ injection: Injection; onClose: () => void }> = ({ injection, onClose }) => {
    const [formData, setFormData] = useState({
      product: injection.product,
      guidanceType: injection.guidanceType,
      postInjectionEvents: injection.postInjectionEvents,
      notes: injection.notes,
      muscles: injection.muscles
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateInjection(injection.id, formData);
      onClose();
      alert('Injection modifiée avec succès !');
    };

    const handleGuidanceChange = (guidance: string, checked: boolean) => {
      setFormData(prev => ({
        ...prev,
        guidanceType: checked 
          ? [...prev.guidanceType, guidance]
          : prev.guidanceType.filter(g => g !== guidance)
      }));
    };

    const handleEventChange = (event: string, checked: boolean) => {
      setFormData(prev => ({
        ...prev,
        postInjectionEvents: checked 
          ? [...prev.postInjectionEvents, event]
          : prev.postInjectionEvents.filter(e => e !== event)
      }));
    };

    const updateMuscle = (index: number, field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        muscles: prev.muscles.map((muscle, i) => 
          i === index ? { ...muscle, [field]: value } : muscle
        )
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Modifier l'injection
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(injection.date).toLocaleDateString('fr-FR')} - Note: La date de contrôle ne peut pas être modifiée ici
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Produit</label>
              <select
                required
                value={formData.product}
                onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {configuration.products.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Type de guidage</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {configuration.guidanceTypes.map(guidance => (
                  <label key={guidance} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.guidanceType.includes(guidance)}
                      onChange={(e) => handleGuidanceChange(guidance, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{guidance}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Muscles injectés</label>
              <div className="space-y-3">
                {formData.muscles.map((muscle, index) => {
                  const muscleInfo = configuration.muscles.find(m => m.id === muscle.muscleId);
                  return (
                    <div key={index} className="grid grid-cols-3 gap-4 p-4 border border-gray-200 rounded-md">
                      <div>
                        <span className="text-sm font-medium">{muscleInfo?.name}</span>
                        <div className="text-xs text-gray-500">{muscleInfo?.region}</div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Côté</label>
                        <select
                          value={muscle.side}
                          onChange={(e) => updateMuscle(index, 'side', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option value="left">Gauche</option>
                          <option value="right">Droit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Dosage (UI)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={muscle.dosage}
                          onChange={(e) => updateMuscle(index, 'dosage', parseFloat(e.target.value) || 0)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Événements post-injection</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {configuration.postInjectionEvents.map(event => (
                  <label key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.postInjectionEvents.includes(event)}
                      onChange={(e) => handleEventChange(event, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const InjectionModal: React.FC<{ injection: Injection; onClose: () => void }> = ({ injection, onClose }) => {
    const patient = patients.find(p => p.id === injection.patientId);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Détails de l'injection - {patient?.firstName} {patient?.lastName}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(injection.date).toLocaleDateString('fr-FR')} à {new Date(injection.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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

            {/* Injection Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Détails de l'injection</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Produit:</span>
                  <div className="font-medium">{injection.product}</div>
                </div>
                <div>
                  <span className="text-gray-600">Type de guidage:</span>
                  <div className="font-medium">{injection.guidanceType.join(', ')}</div>
                </div>
                <div>
                  <span className="text-gray-600">Dosage total:</span>
                  <div className="font-medium">
                    {injection.muscles.reduce((total, muscle) => total + muscle.dosage, 0)} UI
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Date de contrôle:</span>
                  <div className="font-medium">
                    {injection.followUpDate ? new Date(injection.followUpDate).toLocaleDateString('fr-FR') : 'Non définie'}
                  </div>
                </div>
              </div>
            </div>

            {/* Muscles */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Muscles injectés</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Muscle</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Région</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Côté</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dosage (UI)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {injection.muscles.map((injectedMuscle, index) => {
                      const muscle = configuration.muscles.find(m => m.id === injectedMuscle.muscleId);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{muscle?.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{muscle?.region}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {injectedMuscle.side === 'left' ? 'Gauche' : 'Droit'}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{injectedMuscle.dosage}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Post-injection Events */}
            {injection.postInjectionEvents.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Événements post-injection</h4>
                <div className="flex flex-wrap gap-2">
                  {injection.postInjectionEvents.map(event => (
                    <span key={event} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {injection.notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                  {injection.notes}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Fermer
            </button>
            <button 
              onClick={() => handleGeneratePDF(injection)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Rapport PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditFollowUpModal: React.FC<{ injection: Injection; onClose: () => void }> = ({ injection, onClose }) => {
    const [newDate, setNewDate] = useState(injection.followUpDate || '');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Modifier la date de contrôle</h3>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouvelle date de contrôle
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={() => handleUpdateFollowUpDate(injection, newDate)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Enregistrer
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
          <h1 className="text-2xl font-bold text-gray-900">Historique des injections</h1>
          <p className="text-gray-600">{filteredInjections.length} injection(s) trouvée(s)</p>
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

      {/* Injections Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date injection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Muscles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosage total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date contrôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guidage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInjections.map((injection) => {
                const patient = patients.find(p => p.id === injection.patientId);
                const totalDosage = injection.muscles.reduce((total, muscle) => total + muscle.dosage, 0);
                
                return (
                  <tr key={injection.id} className="hover:bg-gray-50">
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
                        {new Date(injection.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(injection.date).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {injection.product}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {injection.muscles.length} muscle(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{totalDosage} UI</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {injection.followUpDate ? (
                        <div className="text-sm text-green-600">
                          {new Date(injection.followUpDate).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non définie</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {injection.guidanceType.map(guidance => (
                          <span key={guidance} className={`px-2 py-1 text-xs font-medium rounded-full ${
                            guidance === 'Échographique' ? 'bg-green-100 text-green-800' :
                            guidance === 'Neurostimulation' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {guidance}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedInjection(injection)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleGeneratePDF(injection)}
                          className="text-green-600 hover:text-green-900"
                          title="Rapport PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedInjection(injection)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Modifier injection"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setEditingInjection(injection)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Modifier date de contrôle uniquement"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleScheduleFollowUp(injection)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Programmer contrôle"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Injection Details Modal */}
      {selectedInjection && (
        selectedInjection && typeof selectedInjection === 'object' && 'product' in selectedInjection ? (
          <EditInjectionModal
            injection={selectedInjection}
            onClose={() => setSelectedInjection(null)}
          />
        ) : (
          <InjectionModal
            injection={selectedInjection}
            onClose={() => setSelectedInjection(null)}
          />
        )
      )}

      {/* Edit Follow-up Date Modal */}
      {editingInjection && (
        <EditFollowUpModal
          injection={editingInjection}
          onClose={() => setEditingInjection(null)}
        />
      )}
    </div>
  );
};

export default InjectionList;