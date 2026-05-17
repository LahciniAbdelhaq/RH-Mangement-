import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { jsPDF } from 'jspdf';
import { GraduationCap, Scale } from 'lucide-react';

const Compliance = () => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'Michael Brown',
      email: 'michael.b@company.com',
      initials: 'MB',
      avatarBg: '#F59E0B',
      requirement: 'Formation Anti-Harcèlement',
      status: 'En retard (2 j)',
      isLate: true,
      deadlineColor: '#E11D48',
      badgeBg: '#FFE4E6',
      badgeColor: '#E11D48'
    },
    {
      id: 2,
      name: 'Linda White',
      email: 'linda.w@company.com',
      initials: 'LW',
      avatarBg: '#2563EB',
      requirement: 'Cybersécurité',
      status: '15 Nov, 2026',
      isLate: false,
      deadlineColor: '#64748B',
      badgeBg: '#FEF3C7',
      badgeColor: '#D97706'
    }
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [reminderMessage, setReminderMessage] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [complianceStatus, setComplianceStatus] = useState('Non Conforme');
  const [certificateFile, setCertificateFile] = useState(null);

  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportRange, setExportRange] = useState('current');

  const openReminderModal = (employee) => {
    setSelectedEmployee(employee);
    setReminderMessage(`Bonjour ${employee.name},\n\nNous avons constaté que vous n'avez pas encore complété la formation obligatoire "${employee.requirement}".\n\nMerci de la finaliser avant la date limite.\n\nCordialement,\nL'équipe RH`);
    setIsReminderModalOpen(true);
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setCompletionDate('');
    setComplianceStatus('Non Conforme');
    setCertificateFile(null);
    setIsEditModalOpen(true);
  };

  const handleReminderSubmit = () => {
    showToast(`Rappel envoyé avec succès à ${selectedEmployee.email} !`, 'success');
    setIsReminderModalOpen(false);
  };

  const handleEditSubmit = () => {
    if (complianceStatus === 'Conforme') {
      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
      showToast(`Statut mis à jour : ${selectedEmployee.name} est désormais conforme.`, 'success');
    } else {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === selectedEmployee.id) {
          return {
            ...emp,
            status: complianceStatus === 'En Cours' ? 'En Cours' : emp.status,
            badgeBg: complianceStatus === 'En Cours' ? '#F3E8FF' : emp.badgeBg,
            badgeColor: complianceStatus === 'En Cours' ? '#9333EA' : emp.badgeColor
          };
        }
        return emp;
      }));
      showToast(`Statut mis à jour pour ${selectedEmployee.name}.`, 'info');
    }
    setIsEditModalOpen(false);
  };

  const handleExportSubmit = () => {
    showToast('Génération du rapport de conformité...', 'info');
    
    setTimeout(() => {
      if (exportFormat === 'pdf') {
        try {
          const doc = new jsPDF();
          
          // Header Banner
          doc.setFillColor(37, 99, 235); // Primary Blue
          doc.rect(0, 0, 210, 35, 'F');
          
          // Header Title
          doc.setFontSize(22);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("Rapport de Conformite", 20, 22);
          
          // Header Subtitle
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(219, 234, 254); // Light blue
          doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 20, 30);
          
          // Metadata Box
          doc.setFillColor(248, 250, 252); // Very light gray
          doc.rect(20, 45, 170, 25, 'F');
          doc.setDrawColor(226, 232, 240); // Border color
          doc.rect(20, 45, 170, 25);
          
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(71, 85, 105); // Slate gray
          doc.text("Période:", 25, 55);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
          doc.text(`${exportRange === 'current' ? 'Mai 2026' : exportRange}`, 45, 55);
          
          doc.setFont("helvetica", "bold");
          doc.setTextColor(71, 85, 105);
          doc.text("Format d'export:", 25, 63);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
          doc.text("PDF Document", 60, 63);
          
          // Content Title
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text("Employés non conformes", 20, 85);
          
          // Decorative line under title
          doc.setDrawColor(37, 99, 235);
          doc.setLineWidth(1);
          doc.line(20, 88, 80, 88);
          
          let y = 100;
          employees.forEach((emp) => {
            // Card background
            doc.setFillColor(255, 255, 255);
            doc.rect(20, y - 5, 170, 25, 'F');
            doc.setDrawColor(241, 245, 249);
            doc.rect(20, y - 5, 170, 25);
            
            // Left color bar
            const [barR, barG, barB] = emp.isLate ? [239, 68, 68] : [245, 158, 11];
            doc.setFillColor(barR, barG, barB);
            doc.rect(20, y - 5, 4, 25, 'F');
            
            // Employee Name
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(emp.name, 30, y + 3);
            
            // Employee Email
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(emp.email, 30, y + 8);
            
            // Requirement
            doc.setFont("helvetica", "bold");
            doc.setTextColor(71, 85, 105);
            doc.text("Exigence:", 30, y + 15);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 41, 59);
            doc.text(emp.requirement, 50, y + 15);
            
            // Status Badge
            const statusText = emp.status;
            const [bgR, bgG, bgB] = emp.isLate ? [254, 226, 226] : [254, 243, 199];
            doc.setFillColor(bgR, bgG, bgB);
            doc.rect(130, y, 50, 8, 'F');
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            const [textR, textG, textB] = emp.isLate ? [220, 38, 38] : [217, 119, 6];
            doc.setTextColor(textR, textG, textB);
            doc.text(statusText, 135, y + 5.5);
            
            y += 32;
          });
          
          doc.save(`Rapport_Conformite_${new Date().getTime()}.pdf`);
          showToast(`Rapport exporté avec succès !`, 'success');
        } catch (error) {
          console.error(error);
          showToast('Erreur lors de la génération du PDF', 'error');
        }
      } else {
        // For CSV/Excel, create a dummy CSV blob
        const content = `Rapport de Conformite\nPeriode: ${exportRange === 'current' ? 'Mai 2026' : exportRange}\nGenere le: ${new Date().toLocaleDateString()}\n\nNom,Email,Exigence,Statut\n` + 
          employees.map(emp => `"${emp.name}","${emp.email}","${emp.requirement}","${emp.status}"`).join('\n');
          
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Rapport_Conformite_${new Date().getTime()}.${exportFormat}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(`Rapport exporté avec succès !`, 'success');
      }
    }, 1200);
    
    setIsExportModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1>Suivi de la Conformité</h1>
          <p>Suivez la conformité de l'entreprise aux politiques et réglementations</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={() => setIsExportModalOpen(true)}>
            <i className="fas fa-file-export"></i> Exporter Rapport
          </button>
        </div>
      </header>

      <div className="compliance-grid">
        {/* Training Compliance */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '10px', background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
              <GraduationCap size={18} />
            </span>
            <span>Formations Obligatoires</span>
          </div>
          
          <div className="progress-item">
            <div className="progress-header">
              <span>Code de Conduite</span>
              <span style={{ color: 'var(--success)' }}>98%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '98%', backgroundColor: 'var(--success)' }}></div>
            </div>
          </div>

          <div className="progress-item">
            <div className="progress-header">
              <span>Sensibilisation Cybersécurité</span>
              <span style={{ color: 'var(--success)' }}>85%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '85%', backgroundColor: 'var(--success)' }}></div>
            </div>
          </div>

          <div className="progress-item" style={{ marginBottom: 0 }}>
            <div className="progress-header">
              <span>Formation Anti-Harcèlement</span>
              <span style={{ color: 'var(--warning)' }}>70%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '70%', backgroundColor: 'var(--warning)' }}></div>
            </div>
          </div>
        </div>

        {/* Legal & Regulatory */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <Scale size={18} />
            </span>
            <span>Légal & Réglementaire</span>
          </div>
          
          <div className="progress-item">
            <div className="progress-header">
              <span>RGPD / Protection des Données</span>
              <span style={{ color: 'var(--success)' }}>100%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '100%', backgroundColor: 'var(--success)' }}></div>
            </div>
          </div>

          <div className="progress-item">
            <div className="progress-header">
              <span>Sécurité au Travail (SST)</span>
              <span style={{ color: 'var(--warning)' }}>82%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '82%', backgroundColor: 'var(--warning)' }}></div>
            </div>
          </div>

          <div className="progress-item" style={{ marginBottom: 0 }}>
            <div className="progress-header">
              <span>Égalité des Chances</span>
              <span style={{ color: 'var(--success)' }}>95%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '95%', backgroundColor: 'var(--success)' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">
            <i className="fas fa-exclamation-triangle" style={{ color: '#E11D48', marginRight: '10px' }}></i>
            Employés Non Conformes
          </h3>
          <div className="filter-group">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Rechercher..." />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employé</th>
                <th>Exigence Manquante</th>
                <th>Date Limite</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-gray)' }}>
                    <i className="fas fa-check-circle" style={{ color: 'var(--success)', fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}></i>
                    Tous les employés sont conformes !
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-initials" style={{ background: emp.avatarBg }}>{emp.initials}</div>
                        <div>
                          <span className="user-info-name">{emp.name}</span>
                          <span className="user-info-sub">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="modern-status-badge" style={{ background: emp.badgeBg, color: emp.badgeColor }}>{emp.requirement}</span></td>
                    <td><span style={{ color: emp.deadlineColor, fontWeight: emp.isLate ? 700 : 600 }}>{emp.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="modern-action-btn" title="Envoyer Rappel" onClick={() => openReminderModal(emp)}>
                          <i className="fas fa-paper-plane"></i>
                        </button>
                        <button className="modern-action-btn" title="Mettre à jour" onClick={() => openEditModal(emp)}>
                          <i className="far fa-edit"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Modal */}
      <Modal 
        isOpen={isReminderModalOpen} 
        onClose={() => setIsReminderModalOpen(false)} 
        title="Envoyer un Rappel"
        icon="fas fa-paper-plane"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        submitText="Envoyer le rappel"
        onSubmit={handleReminderSubmit}
      >
        {selectedEmployee && (
          <form onSubmit={(e) => { e.preventDefault(); handleReminderSubmit(); }} style={{ padding: '4px 0' }}>
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block' }}>Destinataire</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--sidebar-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: selectedEmployee.avatarBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                  {selectedEmployee.initials}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-dark)', display: 'block', fontSize: '0.85rem' }}>{selectedEmployee.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', display: 'block' }}>{selectedEmployee.email}</span>
                </div>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Exigence Manquante</label>
              <input type="text" className="form-input" value={selectedEmployee.requirement} disabled style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--text-dark)' }} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Message de rappel</label>
              <textarea 
                className="form-input" 
                rows="4" 
                value={reminderMessage} 
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Écrivez le message de rappel..."
                style={{ resize: 'none', fontSize: '0.85rem', lineHeight: '1.4' }}
                required
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Conformity Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Mettre à jour la Conformité"
        icon="far fa-edit"
        iconColor="var(--warning)"
        iconBg="#FEF3C7"
        submitText="Enregistrer"
        onSubmit={handleEditSubmit}
      >
        {selectedEmployee && (
          <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} style={{ padding: '4px 0' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--sidebar-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: selectedEmployee.avatarBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                {selectedEmployee.initials}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-dark)', display: 'block', fontSize: '0.85rem' }}>{selectedEmployee.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', display: 'block' }}>{selectedEmployee.email}</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Exigence</label>
              <input type="text" className="form-input" value={selectedEmployee.requirement} disabled style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--text-dark)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Date de réalisation</label>
                <input type="date" className="form-input" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Statut de conformité</label>
                <select className="form-input" value={complianceStatus} onChange={(e) => setComplianceStatus(e.target.value)}>
                  <option value="Non Conforme">Non Conforme</option>
                  <option value="Conforme">Conforme</option>
                  <option value="En Cours">En Cours</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Certificat / Justificatif (Optionnel)</label>
              <div 
                style={{ 
                  border: '2px dashed var(--border-color)', 
                  padding: '12px', 
                  textAlign: 'center', 
                  borderRadius: 'var(--radius-md)', 
                  color: 'var(--text-gray)', 
                  cursor: 'pointer',
                  backgroundColor: 'var(--main-bg)'
                }} 
                onClick={() => document.getElementById('fileInputCompliance').click()}
              >
                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.5rem', marginBottom: '4px', color: 'var(--primary)' }}></i>
                <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{certificateFile ? certificateFile.name : 'Déposez ou sélectionnez un fichier (PDF, PNG)'}</div>
                <input id="fileInputCompliance" type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={(e) => setCertificateFile(e.target.files[0])} />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Export Report Modal */}
      <Modal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        title="Exporter le Rapport de Conformité"
        icon="fas fa-file-export"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        submitText="Générer & Télécharger"
        onSubmit={handleExportSubmit}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleExportSubmit(); }} style={{ padding: '0' }}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', fontWeight: 600, color: 'var(--text-dark)' }}>Format d'exportation</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {/* PDF */}
              <div 
                style={{ 
                  border: exportFormat === 'pdf' ? '2px solid #EF4444' : '1px solid var(--border-color)', 
                  padding: '10px 8px', 
                  textAlign: 'center', 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer',
                  background: exportFormat === 'pdf' ? 'linear-gradient(135deg, #FEE2E2 0%, #FFF1F2 100%)' : 'var(--sidebar-bg)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: exportFormat === 'pdf' ? '0 2px 8px rgba(239, 68, 68, 0.1)' : 'none'
                }}
                onClick={() => setExportFormat('pdf')}
              >
                {exportFormat === 'pdf' && (
                  <i className="fas fa-check-circle" style={{ position: 'absolute', top: '4px', right: '4px', color: '#EF4444', fontSize: '0.8rem' }}></i>
                )}
                <i className="fas fa-file-pdf" style={{ fontSize: '1.4rem', color: '#EF4444', marginBottom: '4px', display: 'block' }}></i>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: exportFormat === 'pdf' ? '#991B1B' : 'var(--text-dark)' }}>PDF Doc</span>
              </div>

              {/* Excel */}
              <div 
                style={{ 
                  border: exportFormat === 'xlsx' ? '2px solid #10B981' : '1px solid var(--border-color)', 
                  padding: '10px 8px', 
                  textAlign: 'center', 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer',
                  background: exportFormat === 'xlsx' ? 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)' : 'var(--sidebar-bg)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: exportFormat === 'xlsx' ? '0 2px 8px rgba(16, 185, 129, 0.1)' : 'none'
                }}
                onClick={() => setExportFormat('xlsx')}
              >
                {exportFormat === 'xlsx' && (
                  <i className="fas fa-check-circle" style={{ position: 'absolute', top: '4px', right: '4px', color: '#10B981', fontSize: '0.8rem' }}></i>
                )}
                <i className="fas fa-file-excel" style={{ fontSize: '1.4rem', color: '#10B981', marginBottom: '4px', display: 'block' }}></i>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: exportFormat === 'xlsx' ? '#065F46' : 'var(--text-dark)' }}>Excel (.xlsx)</span>
              </div>

              {/* CSV */}
              <div 
                style={{ 
                  border: exportFormat === 'csv' ? '2px solid var(--primary)' : '1px solid var(--border-color)', 
                  padding: '10px 8px', 
                  textAlign: 'center', 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer',
                  background: exportFormat === 'csv' ? 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)' : 'var(--sidebar-bg)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: exportFormat === 'csv' ? '0 2px 8px rgba(37, 99, 236, 0.1)' : 'none'
                }}
                onClick={() => setExportFormat('csv')}
              >
                {exportFormat === 'csv' && (
                  <i className="fas fa-check-circle" style={{ position: 'absolute', top: '4px', right: '4px', color: 'var(--primary)', fontSize: '0.8rem' }}></i>
                )}
                <i className="fas fa-file-csv" style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '4px', display: 'block' }}></i>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: exportFormat === 'csv' ? '#1E40AF' : 'var(--text-dark)' }}>CSV Data</span>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dark)' }}>Période du rapport</label>
            <div style={{ position: 'relative' }}>
              <i className="far fa-calendar-alt" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray)', fontSize: '0.85rem' }}></i>
              <select className="form-input" style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8rem' }} value={exportRange} onChange={(e) => setExportRange(e.target.value)}>
                <option value="current">Ce mois-ci (Mai 2026)</option>
                <option value="last3">3 derniers mois</option>
                <option value="ytd">Depuis le début de l'année (YTD)</option>
                <option value="custom">Période personnalisée</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dark)' }}>Options additionnelles</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'var(--sidebar-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-dark)', fontWeight: 500 }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                <span>Inclure les taux globaux par formation</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-dark)', fontWeight: 500 }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                <span>Inclure les détails des non-conformités</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-dark)', fontWeight: 500 }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                <span>Signer numériquement le rapport</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Compliance;
