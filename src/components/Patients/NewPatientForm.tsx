import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NewPatientFormProps {
  onSuccess?: () => void;
}

const NewPatientForm: React.FC<NewPatientFormProps> = ({ onSuccess }) => {
  const { addPatient, configuration, user } = useApp();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'female' as 'male' | 'female' | 'other',
    diagnosis: '',
    problem: '',
    referringDoctor: '',
    sedationRequired: false,
    cpaManaged: false,
    injectionObjective: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addPatient({
        ...formData,
        doctorId: user?.id || ''
      });

      // Notification de succès
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Patient créé avec succès !';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'female',
        diagnosis: '',
        problem: '',
        referringDoctor: '',
        sedationRequired: false,
        cpaManaged: false,
        injectionObjective: ''
      });
    } catch (error) {
      console.error('Error adding patient:', error);
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = 'Erreur lors de la création du patient';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau patient</h1>
        <p className="text-gray-600">Créer un nouveau dossier patient</p>
      </div>


      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Prénom *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Nom *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date de naissance *
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Sexe *
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="female">Féminin</option>
                <option value="male">Masculin</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                Diagnostic *
              </label>
              <select
                id="diagnosis"
                name="diagnosis"
                required
                value={formData.diagnosis}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un diagnostic</option>
                {configuration.diagnoses.map(diagnosis => (
                  <option key={diagnosis} value={diagnosis}>
                    {diagnosis}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="referringDoctor" className="block text-sm font-medium text-gray-700">
                Médecin référent *
              </label>
              <input
                type="text"
                id="referringDoctor"
                name="referringDoctor"
                required
                value={formData.referringDoctor}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="sedationRequired"
                name="sedationRequired"
                checked={formData.sedationRequired}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sedationRequired" className="ml-2 block text-sm text-gray-700">
                Injection avec sédation (anesthésie)
              </label>
            </div>

            {formData.sedationRequired && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cpaManaged"
                  name="cpaManaged"
                  checked={formData.cpaManaged}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="cpaManaged" className="ml-2 block text-sm text-gray-700">
                  CPA géré (anesthésie organisée)
                </label>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-gray-700">
              Problématique *
            </label>
            <textarea
              id="problem"
              name="problem"
              required
              rows={3}
              value={formData.problem}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Décrivez la problématique du patient..."
            />
          </div>

          <div>
            <label htmlFor="injectionObjective" className="block text-sm font-medium text-gray-700">
              Objectif de l'injection *
            </label>
            <textarea
              id="injectionObjective"
              name="injectionObjective"
              required
              rows={3}
              value={formData.injectionObjective}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Décrivez l'objectif thérapeutique..."
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setFormData({
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                diagnosis: '',
                problem: '',
                referringDoctor: '',
                sedationRequired: false,
                injectionObjective: ''
              });
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="h-4 w-4 mr-2 inline" />
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            {isSubmitting ? 'Enregistrement...' : 'Créer le patient'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPatientForm;