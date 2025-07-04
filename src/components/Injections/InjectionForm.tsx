import React, { useState } from 'react';
import { Save, Plus, Trash2, Search, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InjectedMuscle } from '../../types';

interface InjectionFormProps {
  onSuccess?: () => void;
}

const InjectionForm: React.FC<InjectionFormProps> = ({ onSuccess }) => {
  const { patients, configuration, addInjection, addAppointment, user } = useApp();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    product: '',
    guidanceType: [] as string[],
    postInjectionEvents: [] as string[],
    notes: '',
    followUpDate: ''
  });
  const [injectedMuscles, setInjectedMuscles] = useState<InjectedMuscle[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');

  const availablePatients = patients.filter(p => 
    user?.role === 'admin' || p.doctorId === user?.id
  );

  const filteredPatients = availablePatients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMuscles = selectedRegion 
    ? configuration.muscles.filter(m => m.region === selectedRegion)
    : configuration.muscles;

  const addMuscle = () => {
    setInjectedMuscles(prev => [...prev, {
      muscleId: '',
      dosage: 0,
      side: 'left'
    }]);
  };

  const updateMuscle = (index: number, field: keyof InjectedMuscle, value: string | number) => {
    setInjectedMuscles(prev => prev.map((muscle, i) => 
      i === index ? { ...muscle, [field]: value } : muscle
    ));
  };

  const removeMuscle = (index: number) => {
    setInjectedMuscles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEventChange = (event: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      postInjectionEvents: checked 
        ? [...prev.postInjectionEvents, event]
        : prev.postInjectionEvents.filter(e => e !== event)
    }));
  };

  const handleGuidanceChange = (guidance: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      guidanceType: checked 
        ? [...prev.guidanceType, guidance]
        : prev.guidanceType.filter(g => g !== guidance)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || injectedMuscles.length === 0) {
      // Utiliser une notification plus élégante
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Veuillez sélectionner un patient et au moins un muscle';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
      return;
    }

    if (formData.guidanceType.length === 0) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Veuillez sélectionner au moins un type de guidage';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
      return;
    }

    const handleSubmit = async (formData: YourFormDataType) => {
  const injectionDate = new Date(`${formData.date}T${formData.time}`);

  await addInjection({
    patientId: selectedPatient,
    date: injectionDate.toISOString(),
    product: formData.product,
    muscles: injectedMuscles.filter(m => m.muscleId && m.dosage > 0),
    guidanceType: formData.guidanceType,
    postInjectionEvents: formData.postInjectionEvents,
    notes: formData.notes,
    doctorId: user?.id || '',
    followUpDate: formData.followUpDate || undefined,
  });

  // optionally: show success, reset form, etc.
};

    // Créer automatiquement un RDV de contrôle si une date est spécifiée
    if (formData.followUpDate) {
      await addAppointment({
        patientId: selectedPatient,
        date: new Date(`${formData.followUpDate}T10:00:00`).toISOString(),
        type: 'followup',
        location: 'service',
        status: 'scheduled',
        notes: 'Contrôle post-injection programmé automatiquement',
        doctorId: user?.id || ''
      });
    }

    // Reset form
    setSelectedPatient('');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      product: '',
      guidanceType: [],
      postInjectionEvents: [],
      notes: '',
      followUpDate: ''
    });
    setInjectedMuscles([]);
    setSearchTerm('');
    
    // Notification de succès
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = 'Injection enregistrée avec succès !';
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 3000);
    
    // Rediriger vers la liste des injections
    if (onSuccess) {
      onSuccess();
    }
  };

  const getTotalDosage = () => {
    return injectedMuscles.reduce((total, muscle) => total + (muscle.dosage || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle injection</h1>
        <p className="text-gray-600">Enregistrer une séance d'injection</p>
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

        {/* Injection Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Détails de l'injection</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Produit</label>
              <select
                required
                value={formData.product}
                onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un produit</option>
                {configuration.products.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date de contrôle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Date de contrôle prévue (optionnel)</label>
            <div className="mt-1 relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {formData.followUpDate && (
              <p className="mt-2 text-sm text-blue-600">
                Un rendez-vous de contrôle sera automatiquement créé pour le {new Date(formData.followUpDate).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          {/* Type de guidage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Type de guidage (sélection multiple possible)</label>
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
        </div>

        {/* Muscles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Muscles injectés</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Total: <span className="font-medium">{getTotalDosage()} UI</span>
              </span>
              <button
                type="button"
                onClick={addMuscle}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Filtrer par région</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="mt-1 block w-full md:w-64 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les régions</option>
              {configuration.regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {injectedMuscles.map((muscle, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Muscle</label>
                  <select
                    value={muscle.muscleId}
                    onChange={(e) => updateMuscle(index, 'muscleId', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    {filteredMuscles.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.region})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Côté</label>
                  <select
                    value={muscle.side}
                    onChange={(e) => updateMuscle(index, 'side', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="left">Gauche</option>
                    <option value="right">Droit</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dosage (UI)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={muscle.dosage}
                    onChange={(e) => updateMuscle(index, 'dosage', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeMuscle(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {injectedMuscles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun muscle sélectionné. Cliquez sur "Ajouter" pour commencer.
              </div>
            )}
          </div>
        </div>

        {/* Post-injection Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Événements post-injection</h3>
          
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

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
          
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notes additionnelles sur l'injection..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedPatient || injectedMuscles.length === 0 || formData.guidanceType.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>Enregistrer l'injection</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default InjectionForm;
