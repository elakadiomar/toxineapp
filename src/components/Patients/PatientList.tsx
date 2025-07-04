import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Calendar, FileText, Clock, Syringe, Activity, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Patient, Injection, FollowUp } from '../../types';
import { generateCompleteMedicalRecordPDF } from '../../utils/pdfGenerator';

import NewPatientForm from './NewPatientForm';

const PatientList: React.FC = () => {
  const { patients, injections, followUps, appointments, user, configuration, updatePatient, deletePatient } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

  const filteredPatients = patients
    .filter(patient => 
      user?.role === 'admin' || patient.doctorId === user?.id
    )
    .filter(patient =>
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getPatientTimeline = (patientId: string) => {
    const patientInjections = injections.filter(i => i.patientId === patientId);
    const patientFollowUps = followUps.filter(f => f.patientId === patientId);
    const patientAppointments = appointments.filter(a => a.patientId === patientId);

    const timeline = [
      ...patientInjections.map(i => ({ ...i, type: 'injection' as const })),
      ...patientFollowUps.map(f => ({ ...f, type: 'followup' as const })),
      ...patientAppointments.map(a => ({ ...a, type: 'appointment' as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  };

  const handleViewAppointments = (patient: Patient) => {
    alert(`Redirection vers l'agenda pour ${patient.firstName} ${patient.lastName}`);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
  };

  const handleDeletePatient = (patient: Patient) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.firstName} ${patient.lastName} ?`)) {
      deletePatient(patient.id);
    }
  };

  const handleGenerateCompletePDF = (patient: Patient) => {
    const patientInjections = injections.filter(i => i.patientId === patient.id);
    const patientFollowUps = followUps.filter(f => f.patientId === patient.id);
    generateCompleteMedicalRecordPDF(patient, patientInjections, patientFollowUps, configuration.muscles);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const PatientDetailModal: React.FC<{ patient: Patient; onClose: () => void }> = ({ patient, onClose }) => {
    const timeline = getPatientTimeline(patient.id);
    const patientInjections = injections.filter(i => i.patientId === patient.id);
    const patientFollowUps = followUps.filter(f => f.patientId === patient.id);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium text-gray-900">
                Dossier médical - {patient.firstName} {patient.lastName}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateCompletePDF(patient)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4" />
                  <span>Rapport complet</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informations patient */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Informations patient</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Nom:</span>
                      <div className="font-medium">{patient.lastName}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Prénom:</span>
                      <div className="font-medium">{patient.firstName}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Date de naissance:</span>
                      <div className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Âge:</span>
                      <div className="font-medium">{calculateAge(patient.dateOfBirth)} ans</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Sexe:</span>
                      <div className="font-medium">
                        {patient.gender === 'male' ? 'Masculin' : 
                         patient.gender === 'female' ? 'Féminin' : 'Autre'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Diagnostic:</span>
                      <div className="font-medium">{patient.diagnosis}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Médecin référent:</span>
                      <div className="font-medium">{patient.referringDoctor}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Sédation:</span>
                      <div className="font-medium">{patient.sedationRequired ? 'Oui' : 'Non'}</div>
                    </div>
                    {patient.sedationRequired && (
                      <div>
                        <span className="text-gray-600">CPA géré:</span>
                        <div className={`font-medium ${patient.cpaManaged ? 'text-green-600' : 'text-red-600'}`}>
                          {patient.cpaManaged ? 'Oui' : 'Non'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <span className="text-gray-600">Problématique:</span>
                    <div className="mt-2 p-3 bg-white rounded border text-sm">{patient.problem}</div>
                  </div>
                  
                  <div className="mt-4">
                    <span className="text-gray-600">Objectif thérapeutique:</span>
                    <div className="mt-2 p-3 bg-white rounded border text-sm">{patient.injectionObjective}</div>
                  </div>

                  {/* Statistiques */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{patientInjections.length}</div>
                      <div className="text-xs text-blue-600">Injections</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{patientFollowUps.length}</div>
                      <div className="text-xs text-green-600">Contrôles</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-900 mb-4">Timeline chronologique</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {timeline.length > 0 ? (
                    timeline.map((item, index) => (
                      <div key={`${item.type}-${item.id}`} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.type === 'injection' ? 'bg-blue-100' :
                            item.type === 'followup' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {item.type === 'injection' ? <Syringe className="h-4 w-4 text-blue-600" /> :
                             item.type === 'followup' ? <Activity className="h-4 w-4 text-green-600" /> :
                             <Clock className="h-4 w-4 text-yellow-600" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.type === 'injection' ? 'Injection' :
                                 item.type === 'followup' ? 'Contrôle' : 'Rendez-vous'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(item.date).toLocaleDateString('fr-FR')} à {new Date(item.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {item.type === 'injection' && (
                                <div className="mt-1">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {(item as Injection).product}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {(item as Injection).muscles.reduce((total, m) => total + m.dosage, 0)} UI
                                  </span>
                                </div>
                              )}
                              {item.type === 'followup' && (
                                <div className="mt-1">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    (item as FollowUp).objectiveAchieved === 'achieved' ? 'bg-green-100 text-green-800' :
                                    (item as FollowUp).objectiveAchieved === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {(item as FollowUp).objectiveAchieved === 'achieved' ? 'Objectif atteint' :
                                     (item as FollowUp).objectiveAchieved === 'partial' ? 'Partiellement atteint' :
                                     'Non atteint'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="mt-4 border-l-2 border-gray-200 ml-4 h-4"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Aucun événement médical enregistré
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditPatientModal: React.FC<{ patient: Patient; onClose: () => void; onSave: (updates: Partial<Patient>) => void }> = ({ patient, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      diagnosis: patient.diagnosis,
      problem: patient.problem,
      referringDoctor: patient.referringDoctor,
      sedationRequired: patient.sedationRequired,
      cpaManaged: patient.cpaManaged || false,
      injectionObjective: patient.injectionObjective
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Modifier le dossier - {patient.firstName} {patient.lastName}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prénom</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sexe</label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Masculin</option>
                  <option value="female">Féminin</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Diagnostic</label>
                <select
                  required
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {configuration.diagnoses.map(diagnosis => (
                    <option key={diagnosis} value={diagnosis}>{diagnosis}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Médecin référent</label>
                <input
                  type="text"
                  required
                  value={formData.referringDoctor}
                  onChange={(e) => setFormData(prev => ({ ...prev, referringDoctor: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sedationRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, sedationRequired: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sédation requise</span>
                </label>
              </div>
              {formData.sedationRequired && (
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.cpaManaged}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpaManaged: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">CPA géré</span>
                  </label>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Problématique</label>
              <textarea
                required
                rows={3}
                value={formData.problem}
                onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Objectif thérapeutique</label>
              <textarea
                required
                rows={3}
                value={formData.injectionObjective}
                onChange={(e) => setFormData(prev => ({ ...prev, injectionObjective: e.target.value }))}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">
            {filteredPatients.length} patient(s) trouvé(s)
          </p>
        </div>
        <button
          onClick={() => setShowNewPatientForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau patient</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* New Patient Form */}
      {showNewPatientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Nouveau patient</h3>
                <button
                  onClick={() => setShowNewPatientForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <NewPatientForm onSuccess={() => setShowNewPatientForm(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diagnostic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médecin référent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sédation/CPA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {calculateAge(patient.dateOfBirth)} ans - {patient.gender === 'male' ? 'H' : 'F'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {patient.diagnosis}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.referringDoctor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        patient.sedationRequired 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {patient.sedationRequired ? 'Sédation' : 'Sans sédation'}
                      </span>
                      {patient.sedationRequired && (
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            patient.cpaManaged 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            CPA {patient.cpaManaged ? 'géré' : 'à gérer'}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir le dossier complet"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditPatient(patient)}
                        className="text-green-600 hover:text-green-900"
                        title="Modifier le dossier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleViewAppointments(patient)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Voir RDV dans agenda"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleGenerateCompletePDF(patient)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Rapport dossier complet"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer le patient"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={(updates) => {
            updatePatient(editingPatient.id, updates);
            setEditingPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientList;