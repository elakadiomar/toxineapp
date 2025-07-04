import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Patient, Injection, FollowUp, Appointment, Configuration } from '../types';
import * as firebaseService from '../services/firebaseService';

interface AppContextType {
  user: User | null;
  patients: Patient[];
  injections: Injection[];
  followUps: FollowUp[];
  appointments: Appointment[];
  configuration: Configuration;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addInjection: (injection: Omit<Injection, 'id'>) => void;
  updateInjection: (id: string, updates: Partial<Injection>) => void;
  addFollowUp: (followUp: Omit<FollowUp, 'id'>) => void;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  updateConfiguration: (config: Partial<Configuration>) => void;
  getPatientsByDoctor: (doctorId: string) => Patient[];
  addUser: (user: Omit<User, 'id'>) => void;
  getStats: () => {
    totalPatients: number;
    injectedPatients: number;
    waitingPatients: number;
    overdueAppointments: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [injections, setInjections] = useState<Injection[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [configuration, setConfiguration] = useState<Configuration>({
    diagnoses: [
      'Dystonie cervicale',
      'Spasticité post-AVC',
      'Spasticité cérébrale',
      'Migraine chronique',
      'Hypersialorrhée',
      'Vessie hyperactive',
      'Autre'
    ],
    muscles: [
      { id: '1', name: 'Sterno-cléido-mastoïdien', region: 'Cou', side: 'both' },
      { id: '2', name: 'Splénius', region: 'Cou', side: 'both' },
      { id: '3', name: 'Trapèze', region: 'Cou', side: 'both' },
      { id: '4', name: 'Biceps brachial', region: 'Membre supérieur', side: 'both' },
      { id: '5', name: 'Fléchisseurs des doigts', region: 'Membre supérieur', side: 'both' },
      { id: '6', name: 'Gastrocnémiens', region: 'Membre inférieur', side: 'both' },
      { id: '7', name: 'Ischio-jambiers', region: 'Membre inférieur', side: 'both' },
      { id: '8', name: 'Temporal', region: 'Visage', side: 'both' },
      { id: '9', name: 'Masséter', region: 'Visage', side: 'both' }
    ],
    regions: ['Cou', 'Membre supérieur', 'Membre inférieur', 'Visage'],
    products: ['Botox', 'Dysport'],
    guidanceTypes: ['Échographique', 'Neurostimulation', 'Anatomique'],
    postInjectionEvents: [
      'Douleur au site d\'injection',
      'Hématome',
      'Faiblesse musculaire',
      'Troubles de la déglutition',
      'Sécheresse buccale',
      'Aucun événement'
    ]
  });

  // Mock authentication
  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@medical.com' && password === 'admin123') {
      setUser({
        id: '1',
        email: 'admin@medical.com',
        name: 'Dr. Admin',
        role: 'admin'
      });
      return true;
    }
    
    if (email === 'doctor@medical.com' && password === 'doctor123') {
      setUser({
        id: '2',
        email: 'doctor@medical.com',
        name: 'Dr. Martin',
        role: 'doctor'
      });
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPatient: Patient = {
        ...patientData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cpaManaged: false // Nouveau champ pour gérer le CPA
      };
      setPatients(prev => [...prev, newPatient]);
      // firebaseService.addPatient(newPatient);
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    try {
      setPatients(prev => 
        prev.map(patient => 
          patient.id === id 
            ? { ...patient, ...updates, updatedAt: new Date().toISOString() }
            : patient
        )
      );
      // firebaseService.updatePatient(id, updates);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const deletePatient = (id: string) => {
    try {
      setPatients(prev => prev.filter(patient => patient.id !== id));
      // firebaseService.deletePatient(id);
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const addInjection = (injectionData: Omit<Injection, 'id'>) => {
    try {
      const newInjection: Injection = {
        ...injectionData,
        id: Date.now().toString()
      };
      setInjections(prev => [...prev, newInjection]);
      // firebaseService.addInjection(newInjection);
    } catch (error) {
      console.error('Error adding injection:', error);
    }
  };

  const updateInjection = (id: string, updates: Partial<Injection>) => {
    setInjections(prev => 
      prev.map(injection => 
        injection.id === id 
          ? { ...injection, ...updates }
          : injection
      )
    );
  };

  const addFollowUp = (followUpData: Omit<FollowUp, 'id'>) => {
    try {
      const newFollowUp: FollowUp = {
        ...followUpData,
        id: Date.now().toString()
      };
      setFollowUps(prev => [...prev, newFollowUp]);
      // firebaseService.addFollowUp(newFollowUp);
    } catch (error) {
      console.error('Error adding follow-up:', error);
    }
  };

  const addAppointment = (appointmentData: Omit<Appointment, 'id'>) => {
    try {
      const newAppointment: Appointment = {
        ...appointmentData,
        id: Date.now().toString()
      };
      setAppointments(prev => [...prev, newAppointment]);
      // firebaseService.addAppointment(newAppointment);
    } catch (error) {
      console.error('Error adding appointment:', error);
    }
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(appointment => 
        appointment.id === id 
          ? { ...appointment, ...updates }
          : appointment
      )
    );
  };

  const updateConfiguration = (config: Partial<Configuration>) => {
    setConfiguration(prev => ({ ...prev, ...config }));
  };

  const getPatientsByDoctor = (doctorId: string) => {
    return patients.filter(patient => patient.doctorId === doctorId);
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    try {
      const newUser: User = {
        ...userData,
        id: Date.now().toString()
      };
      // Ici vous pourriez ajouter l'utilisateur à Firebase Auth
      console.log('New user created:', newUser);
      alert('Compte médecin créé avec succès !');
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const getStats = () => {
    const userPatients = user?.role === 'admin' 
      ? patients 
      : patients.filter(p => p.doctorId === user?.id);
    
    const userInjections = user?.role === 'admin' 
      ? injections 
      : injections.filter(i => i.doctorId === user?.id);
    
    const userAppointments = user?.role === 'admin' 
      ? appointments 
      : appointments.filter(a => a.doctorId === user?.id);

    const totalPatients = userPatients.length;
    const injectedPatients = new Set(userInjections.map(i => i.patientId)).size;
    const waitingPatients = userPatients.filter(p => 
      !userInjections.some(i => i.patientId === p.id)
    ).length;
    
    const now = new Date();
    const overdueAppointments = userAppointments.filter(a => 
      a.status === 'scheduled' && new Date(a.date) < now
    ).length;

    return {
      totalPatients,
      injectedPatients,
      waitingPatients,
      overdueAppointments
    };
  };

  useEffect(() => {
    // Initialize with some sample data
    const samplePatients: Patient[] = [
      {
        id: '1',
        firstName: 'Marie',
        lastName: 'Dubois',
        dateOfBirth: '1975-05-15',
        gender: 'female',
        diagnosis: 'Dystonie cervicale',
        problem: 'Torticolis spasmodique',
        referringDoctor: 'Dr. Laurent',
        sedationRequired: false,
        cpaManaged: false,
        injectionObjective: 'Réduction des spasmes cervicaux',
        doctorId: '2',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        firstName: 'Jean',
        lastName: 'Martin',
        dateOfBirth: '1962-08-22',
        gender: 'male',
        diagnosis: 'Spasticité post-AVC',
        problem: 'Spasticité membre supérieur droit',
        referringDoctor: 'Dr. Moreau',
        sedationRequired: true,
        cpaManaged: true,
        injectionObjective: 'Amélioration mobilité bras droit',
        doctorId: '2',
        createdAt: '2024-01-10T14:30:00Z',
        updatedAt: '2024-01-10T14:30:00Z'
      }
    ];
    
    const sampleInjections: Injection[] = [
      {
        id: '1',
        patientId: '1',
        date: '2024-01-20T14:00:00Z',
        product: 'Botox',
        muscles: [
          { muscleId: '1', dosage: 50, side: 'left' },
          { muscleId: '2', dosage: 30, side: 'right' }
        ],
        guidanceType: ['Échographique'],
        postInjectionEvents: ['Aucun événement'],
        notes: 'Injection bien tolérée',
        doctorId: '2',
        followUpDate: '2024-02-20'
      }
    ];

    const sampleAppointments: Appointment[] = [
      {
        id: '1',
        patientId: '1',
        date: '2024-02-20T10:00:00Z',
        type: 'followup',
        location: 'service',
        status: 'scheduled',
        notes: 'Contrôle post-injection',
        doctorId: '2'
      },
      {
        id: '2',
        patientId: '2',
        date: '2024-01-25T15:00:00Z',
        type: 'injection',
        location: 'operating_room',
        status: 'scheduled',
        notes: 'Première injection avec sédation',
        doctorId: '2'
      }
    ];
    
    setPatients(samplePatients);
    setInjections(sampleInjections);
    setAppointments(sampleAppointments);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        patients,
        injections,
        followUps,
        appointments,
        configuration,
        login,
        logout,
        addPatient,
        updatePatient,
        deletePatient,
        addInjection,
        updateInjection,
        addFollowUp,
        addAppointment,
        updateAppointment,
        updateConfiguration,
        getPatientsByDoctor,
        addUser,
        getStats
      }}
    >
      {children}
    </AppContext.Provider>
  );
};