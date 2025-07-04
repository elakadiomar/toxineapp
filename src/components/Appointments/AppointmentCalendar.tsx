import React, { useState } from 'react';
import { Calendar, Plus, Clock, MapPin, User, AlertTriangle, Edit, Trash2, CheckCircle, Syringe, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Appointment, Patient } from '../../types';

const AppointmentCalendar: React.FC = () => {
  const { appointments, patients, user, addAppointment, updateAppointment } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showOverdueAction, setShowOverdueAction] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  const filteredAppointments = appointments.filter(appointment => 
    user?.role === 'admin' || appointment.doctorId === user?.id
  );

  const getAppointmentsForDate = (date: string) => {
    return filteredAppointments.filter(appointment => 
      appointment.date.split('T')[0] === date
    );
  };

  const getWeekDates = (startDate: string) => {
    const dates = [];
    const start = new Date(startDate);
    const startOfWeek = new Date(start.setDate(start.getDate() - start.getDay() + 1));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getMonthDates = (date: string) => {
    const year = new Date(date).getFullYear();
    const month = new Date(date).getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Start from Monday
    
    const dates = [];
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const displayDates = viewMode === 'day' ? [selectedDate] :
                     viewMode === 'week' ? getWeekDates(selectedDate) :
                     getMonthDates(selectedDate);
                     
  const todayAppointments = getAppointmentsForDate(new Date().toISOString().split('T')[0]);
  const overdueAppointments = filteredAppointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.date) < new Date()
  );

  const handleCompleteAppointment = (appointmentId: string) => {
    updateAppointment(appointmentId, { status: 'completed' });
  };

  const handleCancelAppointment = (appointmentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      updateAppointment(appointmentId, { status: 'cancelled' });
    }
  };

  const handleOverdueAction = (appointment: Appointment, action: 'injection' | 'followup') => {
    const patient = patients.find(p => p.id === appointment.patientId);
    if (!patient) return;

    if (action === 'injection') {
      // Rediriger vers le formulaire d'injection avec le patient pré-sélectionné
      alert(`Redirection vers le formulaire d'injection pour ${patient.firstName} ${patient.lastName}`);
    } else {
      // Rediriger vers le formulaire de contrôle avec le patient pré-sélectionné
      alert(`Redirection vers le formulaire de contrôle pour ${patient.firstName} ${patient.lastName}`);
    }
    
    // Marquer le RDV comme terminé
    handleCompleteAppointment(appointment.id);
    setShowOverdueAction(null);
  };

  const OverdueActionModal: React.FC<{ appointment: Appointment; onClose: () => void }> = ({ appointment, onClose }) => {
    const patient = patients.find(p => p.id === appointment.patientId);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Rendez-vous en retard
            </h3>
            <p className="text-sm text-gray-500">
              {patient?.firstName} {patient?.lastName} - {new Date(appointment.date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          
          <div className="p-6 space-y-3">
            {appointment.type === 'injection' && (
              <button
                onClick={() => handleOverdueAction(appointment, 'injection')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Syringe className="h-4 w-4" />
                <span>Remplir l'injection</span>
              </button>
            )}
            
            {appointment.type === 'followup' && (
              <button
                onClick={() => handleOverdueAction(appointment, 'followup')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Activity className="h-4 w-4" />
                <span>Remplir le contrôle</span>
              </button>
            )}
            
            <button
              onClick={() => handleCompleteAppointment(appointment.id)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Marquer comme terminé
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AppointmentFormModal: React.FC<{ 
    appointment?: Appointment; 
    onClose: () => void;
    onSave: (data: any) => void;
  }> = ({ appointment, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      patientId: appointment?.patientId || '',
      date: appointment?.date.split('T')[0] || selectedDate,
      time: appointment?.date ? new Date(appointment.date).toTimeString().slice(0, 5) : '10:00',
      type: appointment?.type || 'injection' as 'injection' | 'followup',
      location: appointment?.location || 'service' as 'service' | 'operating_room',
      notes: appointment?.notes || '',
      status: appointment?.status || 'scheduled' as 'scheduled' | 'completed' | 'cancelled'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const appointmentDate = new Date(`${formData.date}T${formData.time}`);
      
      onSave({
        ...formData,
        date: appointmentDate.toISOString(),
        doctorId: user?.id || ''
      });
      
      onClose();
    };

    const availablePatients = patients.filter(p => 
      user?.role === 'admin' || p.doctorId === user?.id
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Patient</label>
              <select
                required
                value={formData.patientId}
                onChange={(e) => {
                  const searchValue = e.target.value;
                  setFormData(prev => ({ ...prev, patientId: searchValue }));
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un patient</option>
                {availablePatients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'injection' | 'followup' }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="injection">Injection</option>
                <option value="followup">Contrôle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Lieu</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value as 'service' | 'operating_room' }))}
                disabled={formData.type === 'followup'}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="service">Service</option>
                {formData.type === 'injection' && <option value="operating_room">Bloc opératoire (avec anesthésie)</option>}
              </select>
            </div>

            {appointment && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Programmé</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {formData.patientId && (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white">
                {availablePatients
                  .filter(patient => 
                    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(formData.patientId.toLowerCase())
                  )
                  .map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, patientId: patient.id }))}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-gray-500">{patient.diagnosis}</div>
                    </button>
                  ))}
              </div>
            )}

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
                {appointment ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
    const patient = patients.find(p => p.id === appointment.patientId);
    const isOverdue = appointment.status === 'scheduled' && new Date(appointment.date) < new Date();
    
    return (
      <div className={`p-3 rounded-lg border-l-4 ${
        appointment.status === 'cancelled' ? 'border-red-500 bg-red-50 opacity-60' :
        appointment.status === 'completed' ? 'border-green-500 bg-green-50' :
        isOverdue ? 'border-red-500 bg-red-50' : 
        appointment.type === 'injection' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {patient?.firstName} {patient?.lastName}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(appointment.date).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                appointment.type === 'injection' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {appointment.type === 'injection' ? 'Injection' : 'Contrôle'}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {appointment.location === 'service' ? 'Service' : 'Bloc/CPA'}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {appointment.status === 'completed' ? 'Terminé' :
                 appointment.status === 'cancelled' ? 'Annulé' : 'Programmé'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {appointment.status === 'scheduled' && (
              <>
                <button
                  onClick={() => handleCompleteAppointment(appointment.id)}
                  className="text-green-600 hover:text-green-800"
                  title="Marquer comme terminé"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingAppointment(appointment)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCancelAppointment(appointment.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Annuler"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            {isOverdue && appointment.status === 'scheduled' && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gestion des rendez-vous</p>
        </div>
        <button
          onClick={() => setShowNewAppointment(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau RDV</span>
        </button>
      </div>

      {/* Alerts */}
      {overdueAppointments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-sm font-medium text-red-800">
              {overdueAppointments.length} rendez-vous en retard
            </h3>
          </div>
        </div>
      )}

      {/* View Mode Selector */}
      <div className="flex space-x-2">
        {(['day', 'week', 'month'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              viewMode === mode 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {viewMode === 'day' ? `Jour du ${new Date(selectedDate).toLocaleDateString('fr-FR')}` :
                   viewMode === 'week' ? `Semaine du ${new Date(displayDates[0]).toLocaleDateString('fr-FR')}` :
                   `Mois de ${new Date(selectedDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`}
                </h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                />
              </div>
            </div>
            
            <div className={`grid gap-px bg-gray-200 ${
              viewMode === 'day' ? 'grid-cols-1' :
              viewMode === 'week' ? 'grid-cols-7' :
              'grid-cols-7'
            }`}>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
              
              {displayDates.map(date => {
                const dayAppointments = getAppointmentsForDate(date);
                const isToday = date === new Date().toISOString().split('T')[0];
                const isCurrentMonth = viewMode !== 'month' || new Date(date).getMonth() === new Date(selectedDate).getMonth();
                
                return (
                  <div key={date} className={`bg-white p-2 min-h-[120px] ${
                    isToday ? 'bg-blue-50' : ''
                  } ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                    <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                      {new Date(date).getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.map(appointment => {
                        const patient = patients.find(p => p.id === appointment.patientId);
                        return (
                          <div
                            key={appointment.id}
                            className={`text-xs p-1 rounded cursor-pointer ${
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 opacity-60' :
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.type === 'injection' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}
                            onClick={() => setEditingAppointment(appointment)}
                          >
                            <div className="font-medium">
                              {new Date(appointment.date).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="truncate">
                              {patient?.firstName} {patient?.lastName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Aujourd'hui</h3>
            </div>
            <div className="p-4 space-y-3">
              {todayAppointments.length > 0 ? (
                todayAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <p className="text-gray-500 text-sm">Aucun rendez-vous aujourd'hui</p>
              )}
            </div>
          </div>

          {/* Overdue Appointments */}
          {overdueAppointments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-red-700">En retard</h3>
              </div>
              <div className="p-4 space-y-3">
                {overdueAppointments.slice(0, 5).map(appointment => (
                  <div key={appointment.id} className="space-y-2">
                    <AppointmentCard appointment={appointment} />
                    <div className="flex justify-center">
                      <button
                        onClick={() => setShowOverdueAction(appointment)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-xs"
                      >
                        Actions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <AppointmentFormModal 
          onClose={() => setShowNewAppointment(false)}
          onSave={(data) => {
            addAppointment(data);
            setShowNewAppointment(false);
          }}
        />
      )}

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <AppointmentFormModal 
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSave={(data) => {
            updateAppointment(editingAppointment.id, data);
            setEditingAppointment(null);
          }}
        />
      )}

      {/* Overdue Action Modal */}
      {showOverdueAction && (
        <OverdueActionModal
          appointment={showOverdueAction}
          onClose={() => setShowOverdueAction(null)}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar;