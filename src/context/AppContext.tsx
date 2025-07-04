import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Patient, Injection, FollowUp, Appointment, Configuration } from '../types';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AppContextType {
  user: User | null;
  patients: Patient[];
  injections: Injection[];
  followUps: FollowUp[];
  appointments: Appointment[];
  configuration: Configuration;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addInjection: (injection: Omit<Injection, 'id'>) => Promise<void>;
  updateInjection: (id: string, updates: Partial<Injection>) => Promise<void>;
  addFollowUp: (followUp: Omit<FollowUp, 'id'>) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  updateConfiguration: (config: Partial<Configuration>) => void;
  getPatientsByDoctor: (doctorId: string) => Patient[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  getStats: () => {
    totalPatients: number;
    injectedPatients: number;
    waitingPatients: number;
    overdueAppointments: number;
  };
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
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

  // Create default users if they don't exist
  const createDefaultUsers = async () => {
    try {
      const defaultUsers = [
        {
          email: 'admin@medical.com',
          password: 'defaultPassword123',
          name: 'Dr. Admin',
          role: 'admin' as const
        },
        {
          email: 'doctor@medical.com', 
          password: 'defaultPassword123',
          name: 'Dr. Martin',
          role: 'doctor' as const
        }
      ];

      for (const defaultUser of defaultUsers) {
        try {
          // Check if user already exists
          const signInMethods = await fetchSignInMethodsForEmail(auth, defaultUser.email);
          
          if (signInMethods.length === 0) {
            // User doesn't exist, create it
            const userCredential = await createUserWithEmailAndPassword(
              auth, 
              defaultUser.email, 
              defaultUser.password
            );
            
            // Save user data to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              id: userCredential.user.uid,
              email: defaultUser.email,
              name: defaultUser.name,
              role: defaultUser.role
            });
            
            console.log(`Created default user: ${defaultUser.email}`);
          }
        } catch (error: any) {
          // If user already exists, that's fine
          if (error.code !== 'auth/email-already-in-use') {
            console.error(`Error creating user ${defaultUser.email}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error creating default users:', error);
    }
  };

  // Firebase Authentication
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser({ ...userData, id: firebaseUser.uid });
        return true;
      } else {
        // Create default user data if not exists
        const defaultUser: User = {
          id: firebaseUser.uid,
          email: email,
          name: email.includes('admin') ? 'Dr. Admin' : 'Dr. Martin',
          role: email.includes('admin') ? 'admin' : 'doctor'
        };
        await setDoc(userDocRef, defaultUser);
        setUser(defaultUser);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setPatients([]);
      setInjections([]);
      setFollowUps([]);
      setAppointments([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Firebase CRUD operations
  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPatient: Omit<Patient, 'id'> = {
        ...patientData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cpaManaged: patientData.cpaManaged || false
      };
      
      const docRef = await addDoc(collection(db, 'patients'), newPatient);
      const patientWithId: Patient = { ...newPatient, id: docRef.id };
      setPatients(prev => [...prev, patientWithId]);
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      const patientRef = doc(db, 'patients', id);
      const updatedData = { ...updates, updatedAt: new Date().toISOString() };
      await updateDoc(patientRef, updatedData);
      
      setPatients(prev => 
        prev.map(patient => 
          patient.id === id ? { ...patient, ...updatedData } : patient
        )
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'patients', id));
      setPatients(prev => prev.filter(patient => patient.id !== id));
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  };

  const addInjection = async (injectionData: Omit<Injection, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'injections'), injectionData);
      const injectionWithId: Injection = { ...injectionData, id: docRef.id };
      setInjections(prev => [...prev, injectionWithId]);
    } catch (error) {
      console.error('Error adding injection:', error);
      throw error;
    }
  };

  const updateInjection = async (id: string, updates: Partial<Injection>) => {
    try {
      const injectionRef = doc(db, 'injections', id);
      await updateDoc(injectionRef, updates);
      
      setInjections(prev => 
        prev.map(injection => 
          injection.id === id ? { ...injection, ...updates } : injection
        )
      );
    } catch (error) {
      console.error('Error updating injection:', error);
      throw error;
    }
  };

  const addFollowUp = async (followUpData: Omit<FollowUp, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'followUps'), followUpData);
      const followUpWithId: FollowUp = { ...followUpData, id: docRef.id };
      setFollowUps(prev => [...prev, followUpWithId]);
    } catch (error) {
      console.error('Error adding follow-up:', error);
      throw error;
    }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      const appointmentWithId: Appointment = { ...appointmentData, id: docRef.id };
      setAppointments(prev => [...prev, appointmentWithId]);
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const appointmentRef = doc(db, 'appointments', id);
      await updateDoc(appointmentRef, updates);
      
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? { ...appointment, ...updates } : appointment
        )
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, 'defaultPassword123');
      const firebaseUser = userCredential.user;
      
      // Save user data to Firestore
      const newUser: User = {
        ...userData,
        id: firebaseUser.uid
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      alert('Compte médecin créé avec succès ! Mot de passe par défaut: defaultPassword123');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création du compte');
      throw error;
    }
  };

  const updateConfiguration = (config: Partial<Configuration>) => {
    setConfiguration(prev => ({ ...prev, ...config }));
  };

  const getPatientsByDoctor = (doctorId: string) => {
    return patients.filter(patient => patient.doctorId === doctorId);
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

  // Load data from Firebase when user changes
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          // Load patients
          const patientsQuery = user.role === 'admin' 
            ? collection(db, 'patients')
            : query(collection(db, 'patients'), where('doctorId', '==', user.id));
          
          const patientsSnapshot = await getDocs(patientsQuery);
          const patientsData = patientsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Patient[];
          setPatients(patientsData);

          // Load injections
          const injectionsQuery = user.role === 'admin'
            ? collection(db, 'injections')
            : query(collection(db, 'injections'), where('doctorId', '==', user.id));
          
          const injectionsSnapshot = await getDocs(injectionsQuery);
          const injectionsData = injectionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Injection[];
          setInjections(injectionsData);

          // Load follow-ups
          const followUpsQuery = user.role === 'admin'
            ? collection(db, 'followUps')
            : query(collection(db, 'followUps'), where('doctorId', '==', user.id));
          
          const followUpsSnapshot = await getDocs(followUpsQuery);
          const followUpsData = followUpsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FollowUp[];
          setFollowUps(followUpsData);

          // Load appointments
          const appointmentsQuery = user.role === 'admin'
            ? collection(db, 'appointments')
            : query(collection(db, 'appointments'), where('doctorId', '==', user.id));
          
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Appointment[];
          setAppointments(appointmentsData);

        } catch (error) {
          console.error('Error loading data:', error);
        }
      };

      loadData();
    }
  }, [user]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, id: firebaseUser.uid });
          } else {
            // Create default user data if not exists
            const defaultUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.email?.includes('admin') ? 'Dr. Admin' : 'Dr. Martin',
              role: firebaseUser.email?.includes('admin') ? 'admin' : 'doctor'
            };
            await setDoc(userDocRef, defaultUser);
            setUser(defaultUser);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        setPatients([]);
        setInjections([]);
        setFollowUps([]);
        setAppointments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Initialize default users on app start
  useEffect(() => {
    createDefaultUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

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
        getStats,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};