export interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'admin';
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  diagnosis: string;
  problem: string;
  referringDoctor: string;
  sedationRequired: boolean;
  cpaManaged: boolean; // Nouveau champ pour gérer le CPA
  injectionObjective: string;
  doctorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Muscle {
  id: string;
  name: string;
  region: string;
  side: 'left' | 'right' | 'both';
}

export interface Injection {
  id: string;
  patientId: string;
  date: string;
  product: string;
  muscles: InjectedMuscle[];
  guidanceType: string[]; // Changé pour permettre plusieurs types
  postInjectionEvents: string[];
  notes: string;
  doctorId: string;
  followUpDate?: string; // Ajouté pour la date de contrôle
}

export interface InjectedMuscle {
  muscleId: string;
  dosage: number;
  side: 'left' | 'right';
}

export interface FollowUp {
  id: string;
  patientId: string;
  injectionId: string;
  date: string;
  objectiveAchieved: 'achieved' | 'partial' | 'not_achieved';
  comments: string;
  nextAppointment?: string;
  doctorId: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  type: 'injection' | 'followup';
  location: 'service' | 'operating_room';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  doctorId: string;
}

export interface Configuration {
  diagnoses: string[];
  muscles: Muscle[];
  regions: string[];
  products: string[];
  postInjectionEvents: string[];
  guidanceTypes: string[]; // Ajouté pour les types de guidage
}