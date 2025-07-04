import React, { useState } from 'react';
import { Save, Plus, Trash2, Edit } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Muscle } from '../../types';

const SettingsPage: React.FC = () => {
  const { configuration, updateConfiguration } = useApp();
  const [activeTab, setActiveTab] = useState('diagnoses');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [newMuscle, setNewMuscle] = useState<Omit<Muscle, 'id'>>({
    name: '',
    region: '',
    side: 'both'
  });

  const addDiagnosis = () => {
    if (newItem.trim()) {
      updateConfiguration({
        diagnoses: [...configuration.diagnoses, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removeDiagnosis = (diagnosis: string) => {
    updateConfiguration({
      diagnoses: configuration.diagnoses.filter(d => d !== diagnosis)
    });
  };

  const addProduct = () => {
    if (newItem.trim()) {
      updateConfiguration({
        products: [...configuration.products, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removeProduct = (product: string) => {
    updateConfiguration({
      products: configuration.products.filter(p => p !== product)
    });
  };

  const addRegion = () => {
    if (newItem.trim()) {
      updateConfiguration({
        regions: [...configuration.regions, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removeRegion = (region: string) => {
    updateConfiguration({
      regions: configuration.regions.filter(r => r !== region)
    });
  };

  const addGuidanceType = () => {
    if (newItem.trim()) {
      updateConfiguration({
        guidanceTypes: [...configuration.guidanceTypes, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removeGuidanceType = (guidanceType: string) => {
    updateConfiguration({
      guidanceTypes: configuration.guidanceTypes.filter(g => g !== guidanceType)
    });
  };

  const addMuscle = () => {
    if (newMuscle.name.trim() && newMuscle.region.trim()) {
      const muscle: Muscle = {
        ...newMuscle,
        id: Date.now().toString(),
        name: newMuscle.name.trim(),
        region: newMuscle.region.trim()
      };
      
      updateConfiguration({
        muscles: [...configuration.muscles, muscle]
      });
      
      setNewMuscle({ name: '', region: '', side: 'both' });
    }
  };

  const removeMuscle = (muscleId: string) => {
    updateConfiguration({
      muscles: configuration.muscles.filter(m => m.id !== muscleId)
    });
  };

  const addPostInjectionEvent = () => {
    if (newItem.trim()) {
      updateConfiguration({
        postInjectionEvents: [...configuration.postInjectionEvents, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const removePostInjectionEvent = (event: string) => {
    updateConfiguration({
      postInjectionEvents: configuration.postInjectionEvents.filter(e => e !== event)
    });
  };

  const tabs = [
    { id: 'diagnoses', label: 'Diagnostics' },
    { id: 'muscles', label: 'Muscles' },
    { id: 'regions', label: 'Régions' },
    { id: 'products', label: 'Produits' },
    { id: 'guidance', label: 'Types de guidage' },
    { id: 'events', label: 'Événements post-injection' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600">Configuration des listes et paramètres système</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Diagnoses Tab */}
      {activeTab === 'diagnoses' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnostics disponibles</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Nouveau diagnostic..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addDiagnosis()}
              />
              <button
                onClick={addDiagnosis}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {configuration.diagnoses.map(diagnosis => (
                <div key={diagnosis} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <span className="text-gray-900">{diagnosis}</span>
                  <button
                    onClick={() => removeDiagnosis(diagnosis)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Muscles Tab */}
      {activeTab === 'muscles' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Muscles disponibles</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                value={newMuscle.name}
                onChange={(e) => setNewMuscle(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom du muscle..."
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newMuscle.region}
                onChange={(e) => setNewMuscle(prev => ({ ...prev, region: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner région</option>
                {configuration.regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <select
                value={newMuscle.side}
                onChange={(e) => setNewMuscle(prev => ({ ...prev, side: e.target.value as 'left' | 'right' | 'both' }))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="both">Bilatéral</option>
                <option value="left">Gauche uniquement</option>
                <option value="right">Droit uniquement</option>
              </select>
              <button
                onClick={addMuscle}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Muscle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Région</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Côté</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {configuration.muscles.map(muscle => (
                    <tr key={muscle.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {muscle.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muscle.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {muscle.side === 'both' ? 'Bilatéral' : 
                         muscle.side === 'left' ? 'Gauche' : 'Droit'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeMuscle(muscle.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === 'regions' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Régions anatomiques</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Nouvelle région..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addRegion()}
              />
              <button
                onClick={addRegion}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {configuration.regions.map(region => (
                <div key={region} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <span className="text-gray-900">{region}</span>
                  <button
                    onClick={() => removeRegion(region)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Produits disponibles</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Nouveau produit..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addProduct()}
              />
              <button
                onClick={addProduct}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {configuration.products.map(product => (
                <div key={product} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <span className="text-gray-900">{product}</span>
                  <button
                    onClick={() => removeProduct(product)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guidance Types Tab */}
      {activeTab === 'guidance' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Types de guidage</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Nouveau type de guidage..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addGuidanceType()}
              />
              <button
                onClick={addGuidanceType}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {configuration.guidanceTypes.map(guidanceType => (
                <div key={guidanceType} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <span className="text-gray-900">{guidanceType}</span>
                  <button
                    onClick={() => removeGuidanceType(guidanceType)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Événements post-injection</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Nouvel événement..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addPostInjectionEvent()}
              />
              <button
                onClick={addPostInjectionEvent}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {configuration.postInjectionEvents.map(event => (
                <div key={event} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <span className="text-gray-900">{event}</span>
                  <button
                    onClick={() => removePostInjectionEvent(event)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;