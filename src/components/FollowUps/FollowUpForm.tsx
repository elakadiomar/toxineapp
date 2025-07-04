import React, { useState } from 'react';
import { Save, Search, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface FollowUpFormProps {
  onSuccess?: () => void;
}

const FollowUpForm: React.FC<FollowUpFormProps> = ({ onSuccess }) => {
  const { patients, injections, addFollowUp, addAppointment, user } = useApp();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedInjection, setSelectedInjection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    objectiveAchieved: 'achieved' as 'achieved' | 'partial' | 'not_achieved',
    comments: '',
    nextAppointment: '',
    nextAppointmentTime: ''
  });

  const availablePatients = patients.filter(p => 
    user?.role === 'admin' || p.doctorId === user?.id
  );

  const filteredPatients = availablePatients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const patientInjections = selectedPatient 
    ? injections.filter(injection => injection.patientId === selectedPatient)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !selectedInjection) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Veuillez sélectionner un patient et une injection';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
      return;
    }

    const followUpDate = new Date(`${formData.date}T${formData.time}`);
    
    // Add follow-up
    addFollowUp({
      patientId: selectedPatient,
      injectionId: selectedInjection,
      date: followUpDate.toISOString(),
      objectiveAchieved: formData.objectiveAchieved,
      comments: formData.comments,
      nextAppointment: formData.nextAppointment || undefined,
      doctorId: user?.id || ''
    }).then(() => {
      // Add next appointment if scheduled
      if (formData.nextAppointment && formData.nextAppointmentTime) {
        const nextAppointmentDate = new Date(`${formData.nextAppointment}T${formData.nextAppointmentTime}`);
        return addAppointment({
          patientId: selectedPatient,
          date: nextAppointmentDate.toISOString(),
          type: 'injection',
          location: 'service',
          status: 'scheduled',
          notes: 'RDV programmé suite au contrôle',
          doctorId: user?.id || ''
        });
      }
    }).then(() => {
      // Reset form
      setSelectedPatient('');
      setSelectedInjection('');
      setSearchTerm('');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        objectiveAchieved: 'achieved',
        comments: '',
        nextAppointment: '',
        nextAppointmentTime: ''
      });
      
      // Notification de succès
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Contrôle enregistré avec succès !';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
      
      // Rediriger vers la liste des contrôles
      if (onSuccess) {
        onSuccess();
      }
    }).catch((error) => {
      console.error('Error saving follow-up:', error);
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Erreur lors de l\'enregistrement du contrôle';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    });
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau contrôle</h1>
        <p className="text-gray-600">Enregistrer un contrôle post-injection</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sélection du patient</h3>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {filteredPatients.map(patient => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(patient.id);
                      setSearchTerm(`${patient.firstName} ${patient.lastName}`);
                      setSelectedInjection(''); // Reset injection selection
                    }}
                    className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedPatient === patient.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                    <div className="text-sm text-gray-500">{patient.diagnosis}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Injection Selection */}
        {selectedPatient && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sélection de l'injection</h3>
            
            {patientInjections.length > 0 ? (
              <div className="space-y-2">
                {patientInjections.map(injection => (
                  <label key={injection.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                    <input
                      type="radio"
                      name="injection"
                      value={injection.id}
                      checked={selectedInjection === injection.id}
                      onChange={(e) => setSelectedInjection(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(injection.date).toLocaleDateString('fr-FR')} - {injection.product}
                          </div>
                          <div className="text-sm text-gray-500">
                            {injection.muscles.length} muscle(s) - {injection.muscles.reduce((total, m) => total + m.dosage, 0)} UI
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(injection.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucune injection trouvée pour ce patient
              </div>
            )}
          </div>
        )}

        {/* Follow-up Details */}
        {selectedInjection && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Détails du contrôle</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date du contrôle</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Heure</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Objectif atteint</label>
                <div className="space-y-2">
                  {[
                    { value: 'achieved', label: 'Objectif atteint', color: 'text-green-600' },
                    { value: 'partial', label: 'Partiellement atteint', color: 'text-yellow-600' },
                    { value: 'not_achieved', label: 'Non atteint', color: 'text-red-600' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="objective"
                        value={option.value}
                        checked={formData.objectiveAchieved === option.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, objectiveAchieved: e.target.value as any }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Commentaires</label>
                <textarea
                  required
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez l'évolution du patient, l'efficacité du traitement, les effets secondaires observés..."
                />
              </div>
            </div>

            {/* Next Appointment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Prochain rendez-vous (optionnel)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.nextAppointment}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextAppointment: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Heure</label>
                  <input
                    type="time"
                    value={formData.nextAppointmentTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextAppointmentTime: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {formData.nextAppointment && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-blue-700">
                      Un rendez-vous sera automatiquement créé pour le {new Date(formData.nextAppointment).toLocaleDateString('fr-FR')}
                      {formData.nextAppointmentTime && ` à ${formData.nextAppointmentTime}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer le contrôle</span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default FollowUpForm;
