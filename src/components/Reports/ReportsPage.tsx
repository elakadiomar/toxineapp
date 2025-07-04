import React, { useState } from 'react';
import { Download, FileText, BarChart3, Calendar, Users, Syringe } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ReportsPage: React.FC = () => {
  const { patients, injections, followUps, appointments, user, configuration } = useApp();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState('overview');

  const filteredData = {
    patients: patients.filter(p => user?.role === 'admin' || p.doctorId === user?.id),
    injections: injections.filter(i => {
      const inDateRange = new Date(i.date) >= new Date(dateRange.start) && 
                         new Date(i.date) <= new Date(dateRange.end);
      const hasAccess = user?.role === 'admin' || i.doctorId === user?.id;
      return inDateRange && hasAccess;
    }),
    followUps: followUps.filter(f => {
      const inDateRange = new Date(f.date) >= new Date(dateRange.start) && 
                         new Date(f.date) <= new Date(dateRange.end);
      const hasAccess = user?.role === 'admin' || f.doctorId === user?.id;
      return inDateRange && hasAccess;
    }),
    appointments: appointments.filter(a => {
      const inDateRange = new Date(a.date) >= new Date(dateRange.start) && 
                         new Date(a.date) <= new Date(dateRange.end);
      const hasAccess = user?.role === 'admin' || a.doctorId === user?.id;
      return inDateRange && hasAccess;
    })
  };

  const generateOverviewStats = () => {
    const totalPatients = filteredData.patients.length;
    const totalInjections = filteredData.injections.length;
    const totalFollowUps = filteredData.followUps.length;
    const totalAppointments = filteredData.appointments.length;

    const injectedPatients = new Set(filteredData.injections.map(i => i.patientId)).size;
    const averageInjectionInterval = totalInjections > 1 ? 
      Math.round((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24) / totalInjections) : 0;

    const successfulFollowUps = filteredData.followUps.filter(f => f.objectiveAchieved === 'achieved').length;
    const successRate = totalFollowUps > 0 ? Math.round((successfulFollowUps / totalFollowUps) * 100) : 0;

    // Statistiques démographiques
    const genderStats = {
      male: filteredData.patients.filter(p => p.gender === 'male').length,
      female: filteredData.patients.filter(p => p.gender === 'female').length,
      other: filteredData.patients.filter(p => p.gender === 'other').length
    };

    const averageAge = filteredData.patients.length > 0 ? 
      Math.round(filteredData.patients.reduce((sum, patient) => {
        const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
        return sum + age;
      }, 0) / filteredData.patients.length) : 0;

    return {
      totalPatients,
      totalInjections,
      totalFollowUps,
      totalAppointments,
      injectedPatients,
      averageInjectionInterval,
      successRate,
      genderStats,
      averageAge
    };
  };

  const generateProductStats = () => {
    const productUsage = configuration.products.map(product => {
      const injections = filteredData.injections.filter(i => i.product === product);
      const totalDosage = injections.reduce((sum, injection) => 
        sum + injection.muscles.reduce((muscleSum, muscle) => muscleSum + muscle.dosage, 0), 0
      );
      return {
        product,
        injections: injections.length,
        totalDosage,
        averageDosage: injections.length > 0 ? Math.round(totalDosage / injections.length) : 0
      };
    }).filter(stat => stat.injections > 0);

    return productUsage;
  };

  const generateDiagnosisStats = () => {
    const diagnosisStats = configuration.diagnoses.map(diagnosis => {
      const patientsWithDiagnosis = filteredData.patients.filter(p => p.diagnosis === diagnosis);
      const injectionsForDiagnosis = filteredData.injections.filter(i => {
        const patient = filteredData.patients.find(p => p.id === i.patientId);
        return patient?.diagnosis === diagnosis;
      });
      
      return {
        diagnosis,
        patients: patientsWithDiagnosis.length,
        injections: injectionsForDiagnosis.length,
        averageInjectionsPerPatient: patientsWithDiagnosis.length > 0 ? 
          Math.round((injectionsForDiagnosis.length / patientsWithDiagnosis.length) * 10) / 10 : 0
      };
    }).filter(stat => stat.patients > 0);

    return diagnosisStats;
  };

  const generateMuscleStats = () => {
    const muscleUsage = configuration.muscles.map(muscle => {
      const injections = filteredData.injections.filter(injection =>
        injection.muscles.some(m => m.muscleId === muscle.id)
      );
      
      const totalDosage = filteredData.injections.reduce((sum, injection) => {
        const muscleInjections = injection.muscles.filter(m => m.muscleId === muscle.id);
        return sum + muscleInjections.reduce((muscleSum, m) => muscleSum + m.dosage, 0);
      }, 0);

      return {
        muscle: muscle.name,
        region: muscle.region,
        injections: injections.length,
        totalDosage,
        averageDosage: injections.length > 0 ? Math.round(totalDosage / injections.length) : 0
      };
    }).filter(stat => stat.injections > 0)
      .sort((a, b) => b.injections - a.injections);

    return muscleUsage;
  };

  const generatePostInjectionEventStats = () => {
    const eventStats = configuration.postInjectionEvents.map(event => {
      const occurrences = filteredData.injections.filter(injection =>
        injection.postInjectionEvents.includes(event)
      ).length;
      
      return {
        event,
        occurrences,
        percentage: filteredData.injections.length > 0 ? 
          Math.round((occurrences / filteredData.injections.length) * 100) : 0
      };
    }).filter(stat => stat.occurrences > 0)
      .sort((a, b) => b.occurrences - a.occurrences);

    return eventStats;
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = generateOverviewStats();
  const productStats = generateProductStats();
  const diagnosisStats = generateDiagnosisStats();
  const muscleStats = generateMuscleStats();
  const eventStats = generatePostInjectionEventStats();

  const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon: React.ReactNode }> = 
    ({ title, value, subtitle, icon }) => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="p-3 rounded-full bg-blue-100">
            {icon}
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports et statistiques</h1>
          <p className="text-gray-600">Analyse de l'activité et export des données</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Période d'analyse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de début</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de fin</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Type de rapport</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 className="h-5 w-5" /> },
            { id: 'products', label: 'Produits', icon: <Syringe className="h-5 w-5" /> },
            { id: 'diagnosis', label: 'Diagnostics', icon: <FileText className="h-5 w-5" /> },
            { id: 'muscles', label: 'Muscles', icon: <Users className="h-5 w-5" /> },
            { id: 'events', label: 'Événements', icon: <FileText className="h-5 w-5" /> },
            { id: 'demographics', label: 'Démographie', icon: <Users className="h-5 w-5" /> }
          ].map(report => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`flex items-center space-x-2 p-3 rounded-md border ${
                selectedReport === report.id 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {report.icon}
              <span className="font-medium">{report.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Patients totaux"
              value={stats.totalPatients}
              icon={<Users className="h-6 w-6 text-blue-600" />}
            />
            <StatCard
              title="Injections réalisées"
              value={stats.totalInjections}
              icon={<Syringe className="h-6 w-6 text-green-600" />}
            />
            <StatCard
              title="Contrôles effectués"
              value={stats.totalFollowUps}
              icon={<FileText className="h-6 w-6 text-purple-600" />}
            />
            <StatCard
              title="Taux de succès"
              value={`${stats.successRate}%`}
              subtitle="Objectifs atteints"
              icon={<BarChart3 className="h-6 w-6 text-yellow-600" />}
            />
            <StatCard
              title="Âge moyen"
              value={`${stats.averageAge} ans`}
              icon={<Users className="h-6 w-6 text-purple-600" />}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par sexe</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.genderStats.female}</div>
                <div className="text-sm text-gray-500">Femmes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.genderStats.male}</div>
                <div className="text-sm text-gray-500">Hommes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.genderStats.other}</div>
                <div className="text-sm text-gray-500">Autre</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => exportToCSV([stats], 'rapport_general')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Products Report */}
      {selectedReport === 'products' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Utilisation des produits</h3>
            <button
              onClick={() => exportToCSV(productStats, 'rapport_produits')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Injections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage total (UI)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage moyen (UI)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productStats.map(stat => (
                  <tr key={stat.product}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{stat.product}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.injections}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.totalDosage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.averageDosage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diagnosis Report */}
      {selectedReport === 'diagnosis' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Répartition par diagnostic</h3>
            <button
              onClick={() => exportToCSV(diagnosisStats, 'rapport_diagnostics')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnostic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Injections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moy. injections/patient</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {diagnosisStats.map(stat => (
                  <tr key={stat.diagnosis}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{stat.diagnosis}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.patients}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.injections}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.averageInjectionsPerPatient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Muscles Report */}
      {selectedReport === 'muscles' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Utilisation des muscles</h3>
            <button
              onClick={() => exportToCSV(muscleStats, 'rapport_muscles')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Muscle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Région</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Injections</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage total (UI)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage moyen (UI)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {muscleStats.map(stat => (
                  <tr key={stat.muscle}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{stat.muscle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.region}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.injections}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.totalDosage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.averageDosage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Events Report */}
      {selectedReport === 'events' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Événements post-injection</h3>
            <button
              onClick={() => exportToCSV(eventStats, 'rapport_evenements')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occurrences</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pourcentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventStats.map(stat => (
                  <tr key={stat.event}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{stat.event}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.occurrences}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demographics Report */}
      {selectedReport === 'demographics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par sexe</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Femmes</span>
                  <span className="font-medium">{stats.genderStats.female}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Hommes</span>
                  <span className="font-medium">{stats.genderStats.male}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Autre</span>
                  <span className="font-medium">{stats.genderStats.other}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques d'âge</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Âge moyen</span>
                  <span className="font-medium">{stats.averageAge} ans</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Patients totaux</span>
                  <span className="font-medium">{stats.totalPatients}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => exportToCSV([{
                femmes: stats.genderStats.female,
                hommes: stats.genderStats.male,
                autre: stats.genderStats.other,
                age_moyen: stats.averageAge,
                total_patients: stats.totalPatients
              }], 'rapport_demographie')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;