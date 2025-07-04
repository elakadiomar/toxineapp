import { Patient, Injection, FollowUp } from '../types';

export const generateInjectionPDF = (
  injection: Injection, 
  patient: Patient, 
  muscles: any[]
) => {
  const content = `
RAPPORT D'INJECTION DE TOXINE BOTULIQUE

===========================================

INFORMATIONS PATIENT
===========================================
Nom: ${patient.lastName}
Prénom: ${patient.firstName}
Date de naissance: ${new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}
Diagnostic: ${patient.diagnosis}
Médecin référent: ${patient.referringDoctor}

DÉTAILS DE L'INJECTION
===========================================
Date d'injection: ${new Date(injection.date).toLocaleDateString('fr-FR')}
Heure: ${new Date(injection.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
Produit utilisé: ${injection.product}
Type de guidage: ${injection.guidanceType.join(', ')}

MUSCLES INJECTÉS
===========================================
${injection.muscles.map(m => {
  const muscle = muscles.find(muscle => muscle.id === m.muscleId);
  return `• ${muscle?.name || 'Muscle inconnu'} (${m.side === 'left' ? 'Gauche' : 'Droit'}): ${m.dosage} UI`;
}).join('\n')}

Dosage total: ${injection.muscles.reduce((total, m) => total + m.dosage, 0)} UI

ÉVÉNEMENTS POST-INJECTION
===========================================
${injection.postInjectionEvents.length > 0 ? injection.postInjectionEvents.join('\n• ') : 'Aucun événement signalé'}

NOTES MÉDICALES
===========================================
${injection.notes || 'Aucune note particulière'}

SUIVI PRÉVU
===========================================
Date de contrôle prévue: ${injection.followUpDate ? new Date(injection.followUpDate).toLocaleDateString('fr-FR') : 'Non définie'}

===========================================
Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
  `;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `injection_${patient.lastName}_${patient.firstName}_${new Date(injection.date).toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateCompleteMedicalRecordPDF = (
  patient: Patient,
  injections: Injection[],
  followUps: FollowUp[],
  muscles: any[]
) => {
  const sortedInjections = injections.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedFollowUps = followUps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const content = `
DOSSIER MÉDICAL COMPLET - TOXINE BOTULIQUE

===========================================

INFORMATIONS PATIENT
===========================================
Nom: ${patient.lastName}
Prénom: ${patient.firstName}
Date de naissance: ${new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}
Diagnostic: ${patient.diagnosis}
Médecin référent: ${patient.referringDoctor}
Problématique: ${patient.problem}
Objectif thérapeutique: ${patient.injectionObjective}
Sédation requise: ${patient.sedationRequired ? 'Oui' : 'Non'}

HISTORIQUE DES INJECTIONS
===========================================
${sortedInjections.length > 0 ? sortedInjections.map((injection, index) => `
INJECTION #${index + 1}
Date: ${new Date(injection.date).toLocaleDateString('fr-FR')}
Produit: ${injection.product}
Guidage: ${injection.guidanceType.join(', ')}
Muscles injectés:
${injection.muscles.map(m => {
  const muscle = muscles.find(muscle => muscle.id === m.muscleId);
  return `  • ${muscle?.name || 'Muscle inconnu'} (${m.side === 'left' ? 'Gauche' : 'Droit'}): ${m.dosage} UI`;
}).join('\n')}
Dosage total: ${injection.muscles.reduce((total, m) => total + m.dosage, 0)} UI
Événements: ${injection.postInjectionEvents.join(', ')}
Notes: ${injection.notes || 'Aucune'}
`).join('\n') : 'Aucune injection enregistrée'}

HISTORIQUE DES CONTRÔLES
===========================================
${sortedFollowUps.length > 0 ? sortedFollowUps.map((followUp, index) => {
  const relatedInjection = sortedInjections.find(inj => inj.id === followUp.injectionId);
  return `
CONTRÔLE #${index + 1}
Date: ${new Date(followUp.date).toLocaleDateString('fr-FR')}
Injection de référence: ${relatedInjection ? new Date(relatedInjection.date).toLocaleDateString('fr-FR') : 'Non trouvée'}
Objectif atteint: ${followUp.objectiveAchieved === 'achieved' ? 'Oui' : 
                   followUp.objectiveAchieved === 'partial' ? 'Partiellement' : 'Non'}
Commentaires: ${followUp.comments}
Prochain RDV: ${followUp.nextAppointment ? new Date(followUp.nextAppointment).toLocaleDateString('fr-FR') : 'Non programmé'}
`;
}).join('\n') : 'Aucun contrôle enregistré'}

RÉSUMÉ STATISTIQUE
===========================================
Nombre total d'injections: ${sortedInjections.length}
Nombre total de contrôles: ${sortedFollowUps.length}
Contrôles avec objectif atteint: ${sortedFollowUps.filter(f => f.objectiveAchieved === 'achieved').length}
Taux de succès: ${sortedFollowUps.length > 0 ? Math.round((sortedFollowUps.filter(f => f.objectiveAchieved === 'achieved').length / sortedFollowUps.length) * 100) : 0}%

===========================================
Dossier généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
  `;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dossier_complet_${patient.lastName}_${patient.firstName}_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};