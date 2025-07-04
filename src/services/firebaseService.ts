import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Patient, Injection, FollowUp, Appointment } from '../types';

// Collections
const COLLECTIONS = {
  PATIENTS: 'patients',
  INJECTIONS: 'injections',
  FOLLOW_UPS: 'followUps',
  APPOINTMENTS: 'appointments'
};

// Patients
export const addPatient = async (patient: Omit<Patient, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.PATIENTS), {
      ...patient,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
  try {
    const patientRef = doc(db, COLLECTIONS.PATIENTS, id);
    await updateDoc(patientRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

export const getPatients = async (doctorId?: string) => {
  try {
    let q = collection(db, COLLECTIONS.PATIENTS);
    if (doctorId) {
      q = query(collection(db, COLLECTIONS.PATIENTS), where('doctorId', '==', doctorId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Patient[];
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

// Injections
export const addInjection = async (injection: Omit<Injection, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.INJECTIONS), injection);
    return docRef.id;
  } catch (error) {
    console.error('Error adding injection:', error);
    throw error;
  }
};

export const updateInjection = async (id: string, updates: Partial<Injection>) => {
  try {
    const injectionRef = doc(db, COLLECTIONS.INJECTIONS, id);
    await updateDoc(injectionRef, updates);
  } catch (error) {
    console.error('Error updating injection:', error);
    throw error;
  }
};

export const getInjections = async (doctorId?: string) => {
  try {
    let q = collection(db, COLLECTIONS.INJECTIONS);
    if (doctorId) {
      q = query(collection(db, COLLECTIONS.INJECTIONS), where('doctorId', '==', doctorId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Injection[];
  } catch (error) {
    console.error('Error getting injections:', error);
    throw error;
  }
};

// Follow-ups
export const addFollowUp = async (followUp: Omit<FollowUp, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.FOLLOW_UPS), followUp);
    return docRef.id;
  } catch (error) {
    console.error('Error adding follow-up:', error);
    throw error;
  }
};

export const getFollowUps = async (doctorId?: string) => {
  try {
    let q = collection(db, COLLECTIONS.FOLLOW_UPS);
    if (doctorId) {
      q = query(collection(db, COLLECTIONS.FOLLOW_UPS), where('doctorId', '==', doctorId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FollowUp[];
  } catch (error) {
    console.error('Error getting follow-ups:', error);
    throw error;
  }
};

// Appointments
export const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), appointment);
    return docRef.id;
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw error;
  }
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
  try {
    const appointmentRef = doc(db, COLLECTIONS.APPOINTMENTS, id);
    await updateDoc(appointmentRef, updates);
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

export const getAppointments = async (doctorId?: string) => {
  try {
    let q = collection(db, COLLECTIONS.APPOINTMENTS);
    if (doctorId) {
      q = query(collection(db, COLLECTIONS.APPOINTMENTS), where('doctorId', '==', doctorId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Appointment[];
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
};