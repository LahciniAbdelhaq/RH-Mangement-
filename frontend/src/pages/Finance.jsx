import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { DollarSign, Printer, Download, Calculator, User, Briefcase, FileText, CheckCircle } from 'lucide-react';

export default function Finance() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const mockEmployees = [
    { id: 1, name: 'Sarah Connor', role: 'Director of HR', baseSalary: 18000, department: 'Ressources Humaines', contractType: 'CDI' },
    { id: 2, name: 'Ali Benali', role: 'Senior Web Developer', baseSalary: 14000, department: 'Ingénierie', contractType: 'CDI' },
    { id: 3, name: 'Marc Leblanc', role: 'UX Designer', baseSalary: 9500, department: 'Design', contractType: 'CDI' },
    { id: 4, name: 'Karim Bennani', role: 'Support Specialist', baseSalary: 6500, department: 'Support', contractType: 'CDD' },
    { id: 5, name: 'Salma Alami', role: 'HR Assistant', baseSalary: 7500, department: 'Ressources Humaines', contractType: 'CDI' }
  ];

  const [selectedEmpId, setSelectedEmpId] = useState(1);
  const [bonus, setBonus] = useState(1500);
  const [allowance, setAllowance] = useState(800); // Prime de transport/logement

  const currentEmp = mockEmployees.find(e => e.id === Number(selectedEmpId)) || mockEmployees[0];

  // Moroccan Tax Deductions Logic
  const baseSalary = currentEmp.baseSalary;
  const grossSalary = baseSalary + Number(bonus) + Number(allowance);

  // CNSS: 4.48% capped at 6000 DH baseline salary
  const cnssBase = Math.min(baseSalary, 6000);
  const cnssDeduction = Number((cnssBase * 0.0448).toFixed(2));

  // AMO: 2.26% on baseline salary (no ceiling)
  const amoDeduction = Number((baseSalary * 0.0226).toFixed(2));

  // IGR (Simulated Moroccan General Income Tax brackets)
  // Brackets based on Gross taxable income minus deductions
  const taxableSalary = grossSalary - cnssDeduction - amoDeduction;
  let igr = 0;
  if (taxableSalary > 15000) {
    igr = taxableSalary * 0.38 - 2033;
  } else if (taxableSalary > 10000) {
    igr = taxableSalary * 0.34 - 1433;
  } else if (taxableSalary > 8000) {
    igr = taxableSalary * 0.30 - 1033;
  } else if (taxableSalary > 6000) {
    igr = taxableSalary * 0.20 - 533;
  } else if (taxableSalary > 4000) {
    igr = taxableSalary * 0.10 - 250;
  }
  const igrDeduction = Number(Math.max(0, igr).toFixed(2));

  const totalDeductions = Number((cnssDeduction + amoDeduction + igrDeduction).toFixed(2));
  const netSalary = Number((grossSalary - totalDeductions).toFixed(2));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {i18n.language === 'fr' ? 'Salaires & Fiches de Paie' : 'Finance & Payroll Manager'}
          </h2>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            {i18n.language === 'fr' ? 'Calculez les charges patronales/salariales marocaines et générez des fiches de paie exportables.' : 'Calculate Moroccan taxes and generate exportable corporate payslips.'}
          </p>
        </div>

        <button 
          onClick={handlePrint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            transition: 'transform 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Printer style={{ width: 16, height: 16 }} />
          {i18n.language === 'fr' ? 'Imprimer la Fiche de Paie' : 'Print / Export PDF'}
        </button>
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '24px' }} className="finance-grid-layout">
        
        {/* Left Side: Parameters Form */}
        <div className="card no-print" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', borderBottom: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, paddingBottom: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator style={{ width: 18, height: 18, color: '#2563eb' }} />
            {i18n.language === 'fr' ? 'Simulateur Marocain (DH)' : 'Moroccan Simulator (MAD)'}
          </h3>

          {/* Employee Selector */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(37,99,235,.1)', color: '#2563eb' }}><User style={{ width: 12, height: 12 }} /></span>
              {i18n.language === 'fr' ? 'Sélectionner un collaborateur' : 'Select Employee'}
            </label>
            <select 
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                borderRadius: '10px',
                border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                color: isDark ? '#f1f5f9' : '#0f172a',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              {mockEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>

          {/* Baseline Salary Show */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(16,185,129,.1)', color: '#10b981' }}><DollarSign style={{ width: 12, height: 12 }} /></span>
              {i18n.language === 'fr' ? 'Salaire de Base' : 'Base Salary'}
            </label>
            <input 
              type="text" 
              value={`${currentEmp.baseSalary} DH`}
              disabled
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                borderRadius: '10px',
                border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                color: 'var(--text-gray)',
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* Prime inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                {i18n.language === 'fr' ? 'Primes & Bonus (DH)' : 'Primes & Bonus'}
              </label>
              <input 
                type="number"
                value={bonus}
                onChange={(e) => setBonus(Math.max(0, Number(e.target.value)))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                {i18n.language === 'fr' ? 'Indemnités (DH)' : 'Allowances'}
              </label>
              <input 
                type="number"
                value={allowance}
                onChange={(e) => setAllowance(Math.max(0, Number(e.target.value)))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Quick deductions info block */}
          <div style={{ background: isDark ? 'rgba(37,99,235,0.04)' : 'rgba(37,99,235,0.02)', padding: '16px', borderRadius: '12px', border: `1.5px dashed ${isDark ? '#3b82f6' : '#93c5fd'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2563eb' }}>Barème Social & Fiscal Maroc 🇲🇦</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-gray)' }}>
              <span>Cotisation CNSS (Salarié)</span>
              <span>4.48% (Plafond 6000 DH)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-gray)' }}>
              <span>Cotisation AMO</span>
              <span>2.26% (Sans Plafond)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-gray)' }}>
              <span>Impôt sur le Revenu (IGR)</span>
              <span>Progressif (Jusqu'à 38%)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Corporate Payslip Preview Sheet */}
        <div className="card payslip-print-sheet" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#ffffff', color: '#1e293b', border: '1.5px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e293b', paddingBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px' }} />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>RH MANAGEMENT S.A.R.L</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>12 Rue Al Hoceima, Casablanca, Maroc</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>R.C. 98452 - I.F. 1024520 - Patente 321450</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', margin: '0 0 6px 0' }}>BULLETIN DE PAIE</h4>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', color: '#475569' }}>
                {i18n.language === 'fr' ? 'Période : Mai 2026' : 'Period: May 2026'}
              </span>
            </div>
          </div>

          {/* Employee profile grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ marginBottom: '6px' }}><span style={{ color: '#64748b', fontWeight: 600 }}>Nom complet :</span> <strong style={{ color: '#0f172a' }}>{currentEmp.name}</strong></div>
              <div style={{ marginBottom: '6px' }}><span style={{ color: '#64748b', fontWeight: 600 }}>Poste occupé :</span> <strong style={{ color: '#0f172a' }}>{currentEmp.role}</strong></div>
              <div><span style={{ color: '#64748b', fontWeight: 600 }}>Département :</span> <strong style={{ color: '#0f172a' }}>{currentEmp.department}</strong></div>
            </div>
            <div>
              <div style={{ marginBottom: '6px' }}><span style={{ color: '#64748b', fontWeight: 600 }}>Type de contrat :</span> <strong style={{ color: '#0f172a' }}>{currentEmp.contractType}</strong></div>
              <div style={{ marginBottom: '6px' }}><span style={{ color: '#64748b', fontWeight: 600 }}>Matricule :</span> <strong style={{ color: '#0f172a' }}>EMP-2026-00{currentEmp.id}</strong></div>
              <div><span style={{ color: '#64748b', fontWeight: 600 }}>Devise :</span> <strong style={{ color: '#0f172a' }}>MAD (Dirham Marocain)</strong></div>
            </div>
          </div>

          {/* Earnings & Deductions Table Sheet */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0f172a', fontWeight: 700, color: '#0f172a' }}>
                <th style={{ padding: '8px 4px' }}>Désignation des éléments</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Gain (DH)</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Retenue (DH)</th>
              </tr>
            </thead>
            <tbody>
              {/* Gross elements */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 4px' }}>Salaire de Base</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>{baseSalary.toFixed(2)}</td>
                <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 4px' }}>Primes d'activité & Primes exceptionnelles</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>{Number(bonus).toFixed(2)}</td>
                <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 4px' }}>Indemnité de transport & représentation</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 600 }}>{Number(allowance).toFixed(2)}</td>
                <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
              </tr>

              {/* Deductions elements */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 4px', color: '#64748b' }}>Retenue Sociale CNSS (4.48%)</td>
                <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{cnssDeduction.toFixed(2)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 4px', color: '#64748b' }}>Retenue Assurance Maladie AMO (2.26%)</td>
                <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{amoDeduction.toFixed(2)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 4px', color: '#64748b' }}>Retenue Fiscale Impôt sur le Revenu (IGR)</td>
                <td style={{ padding: '10px 4px', textAlign: 'right' }}>-</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{igrDeduction.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Subtotals & Net Salary Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px solid #0f172a', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Total Salaire Brut</span>
              <span>{grossSalary.toFixed(2)} DH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
              <span>Total Retenues Salariales</span>
              <span>- {totalDeductions.toFixed(2)} DH</span>
            </div>
            
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '1.2rem', 
                fontWeight: 800, 
                color: '#ffffff', 
                background: '#0f172a', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginTop: '6px' 
              }}
            >
              <span>NET A PAYER :</span>
              <span>{netSalary.toFixed(2)} DH</span>
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '16px', fontSize: '0.75rem', color: '#64748b' }}>
            <div>
              <span style={{ display: 'block', fontWeight: 700, marginBottom: '40px', color: '#0f172a' }}>Signature du Salarié</span>
              <div style={{ borderTop: '1px dashed #cbd5e1', width: '120px' }}></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontWeight: 700, marginBottom: '40px', color: '#0f172a' }}>La Direction RH</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
                <CheckCircle style={{ width: 14, height: 14 }} /> Signature Électronique Certifiée
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS specific rules to formatting window print cleanly for physical sheets / PDF export */}
      <style>{`
        @media print {
          /* Hide sidebars, menus, navigation headers and action buttons */
          .sidebar, 
          .main-content > div:first-of-type,
          .header-actions,
          .date-pill,
          .mobile-toggle,
          .no-print {
            display: none !important;
          }
          
          /* Reset margins and fit page context */
          body, html {
            background: #ffffff !important;
            color: #1e293b !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .main-content {
            padding: 0 !important;
          }

          .payslip-print-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            width: 100% !important;
            margin: 0 !important;
          }

          .finance-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
