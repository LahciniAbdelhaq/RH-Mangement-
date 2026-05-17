import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Skeleton } from '../components/Skeleton';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { User, Building2, Calendar, Fingerprint, FileText, Share2, Download, Mail, Briefcase, AlertTriangle, Umbrella } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Jan', requests: 40, absences: 24 },
  { name: 'Fév', requests: 30, absences: 13 },
  { name: 'Mar', requests: 20, absences: 58 },
  { name: 'Avr', requests: 27, absences: 39 },
  { name: 'Mai', requests: 18, absences: 48 },
  { name: 'Juin', requests: 23, absences: 38 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleRequestAction = (row) => {
    setSelectedRequest(row);
    setIsDetailsModalOpen(true);
  };

  const handleExportDocument = (row) => {
    let extension = 'txt';
    let mimeType = 'text/plain;charset=utf-8';
    let formatLabel = 'texte brut';

    const subLower = (row.sub || '').toLowerCase();
    
    // Check type or default to PDF
    if (subLower.includes('pdf') || subLower.includes('formulaire') || (row.title && row.title.toLowerCase().includes('attestation'))) {
      extension = 'pdf';
      formatLabel = 'PDF';
    } else if (subLower.includes('xlsx')) {
      extension = 'xlsx';
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      formatLabel = 'Excel (XLSX)';
    } else {
      extension = 'pdf';
      formatLabel = 'PDF';
    }

    showToast(`Préparation de l'export de "${row.title}" au format ${formatLabel}...`, 'info');
    
    setTimeout(() => {
      try {
        if (extension === 'pdf') {
          // Generate real PDF using jsPDF
          const doc = new jsPDF();
          const img = new Image();
          img.src = '/logo.png';
          
          const generatePDF = (logoLoaded) => {
            // === HEADER ===
            if (logoLoaded) {
              doc.addImage(img, 'PNG', 15, 15, 35, 35);
            }
            
            // Company Info (Right aligned)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(15, 23, 42); // Slate 900
            doc.text("RH MANAGEMENT S.A.", 195, 22, { align: "right" });
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139); // Slate 500
            doc.text("Quartier des Affaires, Casablanca, Maroc", 195, 30, { align: "right" });
            doc.text("Tél : +212 5 22 00 00 00", 195, 36, { align: "right" });
            doc.text("Email : contact@rh-management.com", 195, 42, { align: "right" });

            // Header Separator Line
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(15, 55, 195, 55);

            // === DATE & PLACE ===
            const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.text(`Fait à Casablanca, le ${today}`, 195, 70, { align: "right" });

            // === TITLE ===
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(37, 99, 235); // Blue Primary
            const titleText = (row.title ? row.title.toUpperCase() : 'ATTESTATION ADMINISTRATIVE');
            doc.text(titleText, 105, 95, { align: "center" });
            
            // Title underline
            doc.setDrawColor(37, 99, 235);
            const textWidth = doc.getTextWidth(titleText);
            doc.line(105 - (textWidth/2), 98, 105 + (textWidth/2), 98);

            // === BODY ===
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 41, 59); // Slate 800

            const titleLower = row.title ? row.title.toLowerCase() : "";
            
            if (titleLower.includes('salaire') || titleLower.includes('travail') || titleLower.includes('attestation')) {
              doc.text("Je soussigné(e), Directeur des Ressources Humaines de la société RH MANAGEMENT,", 20, 120);
              doc.text("certifie et atteste par la présente que :", 20, 128);
              
              // Highlighted employee details
              doc.setFillColor(248, 250, 252);
              doc.roundedRect(20, 140, 170, 35, 3, 3, 'F');
              
              doc.setFont("helvetica", "bold");
              doc.text(`Monsieur / Madame :`, 25, 152);
              doc.setFont("helvetica", "normal");
              doc.text(`${row.owner || 'Non spécifié'}`, 75, 152);
              
              doc.setFont("helvetica", "bold");
              doc.text(`Département :`, 25, 165);
              doc.setFont("helvetica", "normal");
              doc.text(`${row.dept || 'Général'}`, 75, 165);
              
              doc.text("Est régulièrement employé(e) au sein de notre établissement.", 20, 195);
              doc.text("La présente attestation est délivrée à la demande de l'intéressé(e) pour servir", 20, 205);
              doc.text("et valoir ce que de droit.", 20, 213);
              
            } else {
              // Generic administrative text
              doc.text(`Objet : ${titleText}`, 20, 120);
              doc.text(`Le présent document certifie les informations administratives suivantes concernant`, 20, 135);
              doc.text(`le collaborateur ci-dessous :`, 20, 143);
              
              // Highlighted details
              doc.setFillColor(248, 250, 252);
              doc.roundedRect(20, 155, 170, 45, 3, 3, 'F');
              
              doc.setFont("helvetica", "bold");
              doc.text(`Nom complet :`, 25, 167);
              doc.setFont("helvetica", "normal");
              doc.text(`${row.owner || 'Non spécifié'}`, 75, 167);
              
              doc.setFont("helvetica", "bold");
              doc.text(`Département :`, 25, 177);
              doc.setFont("helvetica", "normal");
              doc.text(`${row.dept || 'Général'}`, 75, 177);
              
              doc.setFont("helvetica", "bold");
              doc.text(`Statut :`, 25, 187);
              doc.setFont("helvetica", "normal");
              doc.text(`${row.status || 'Non défini'}`, 75, 187);
              
              doc.text("Document certifié et validé par le département des ressources humaines.", 20, 220);
            }

            // === SIGNATURE BLOCK ===
            doc.setFont("helvetica", "bold");
            doc.text("La Direction des Ressources Humaines", 120, 240);
            
            // Fake Stamp / Cachet
            doc.setDrawColor(37, 99, 235);
            doc.setTextColor(37, 99, 235);
            doc.setLineWidth(0.5);
            doc.circle(160, 260, 12);
            doc.circle(160, 260, 11.2);
            doc.setFontSize(8);
            doc.text("CACHET", 160, 259, { align: "center" });
            doc.text("OFFICIEL", 160, 263, { align: "center" });

            // === FOOTER ===
            const pageHeight = doc.internal.pageSize.height;
            doc.setDrawColor(226, 232, 240);
            doc.line(15, pageHeight - 20, 195, pageHeight - 20);
            
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.text("RH MANAGEMENT S.A. - RC: 12345 - IF: 678910 - ICE: 000001234567890", 105, pageHeight - 12, { align: "center" });
            doc.text("Ce document est généré électroniquement et possède la même valeur juridique qu'un document manuscrit.", 105, pageHeight - 7, { align: "center" });

            doc.save(`${row.title ? row.title.toLowerCase().replace(/\s+/g, '_') : 'document'}_export.pdf`);
          };

          img.onload = () => generatePDF(true);
          img.onerror = () => generatePDF(false);
        } else {
          const element = document.createElement("a");
          let fileContent = '';
          
          if (extension === 'xlsx') {
            fileContent = `ID_Document;Type_Document;Proprietaire;Departement;Statut;Date_Mise_A_Jour\nDOC-2026-REF-${Math.floor(1000 + Math.random() * 9000)};${row.title};${row.owner || 'Non spécifié'};${row.dept || 'Général'};${row.status};${row.date || 'En attente'}`;
          } else {
            fileContent = `==================================================\nRH MANAGEMENT SYSTEM - EXPORT SECURISE\n==================================================\nREF DOCUMENT : DOC-2026-REF-${Math.floor(1000 + Math.random() * 9000)}\nTYPE DOCUMENT: ${row.title ? row.title.toUpperCase() : 'DOCUMENT'}\nPROPRIÉTAIRE : ${row.owner || 'Non spécifié'}\nDÉPARTEMENT  : ${row.dept || 'Général'}\nSTATUT       : ${row.status || 'Non défini'}\nDATE D'EFFET : ${row.date || 'En attente'}`;
          }

          const file = new Blob([fileContent], { type: mimeType });
          element.href = URL.createObjectURL(file);
          element.download = `${row.title ? row.title.toLowerCase().replace(/\s+/g, '_') : 'document'}_export.${extension}`;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
        
        showToast(`Document "${row.title || 'Document'}" exporté en format ${formatLabel} !`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Erreur lors de la génération du fichier.', 'error');
      }
    }, 1000);
  };

  // --- Employee Form State ---
  const [employeeForm, setEmployeeForm] = useState({ prenom: '', nom: '', email: '', poste: '', departement: 'Ingénierie' });
  const handleEmployeeChange = e => setEmployeeForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleEmployeeSubmit = () => {
    showToast('Employé ajouté avec succès !', 'success');
    setEmployeeForm({ prenom: '', nom: '', email: '', poste: '', departement: 'Ingénierie' });
    setIsEmployeeModalOpen(false);
  };

  // --- Request Form State (Manager) ---
  const [requestForm, setRequestForm] = useState({ type: 'Attestation de Travail', priorite: 'Normale (Délai 48h)', description: '', fichier: null });
  const handleRequestChange = e => setRequestForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleRequestSubmit = () => {
    showToast('Votre demande a été soumise à l\'équipe RH.', 'info');
    setRequestForm({ type: 'Attestation de Travail', priorite: 'Normale (Délai 48h)', description: '', fichier: null });
    setIsRequestModalOpen(false);
  };

  // --- Leave Form State ---
  const [leaveForm, setLeaveForm] = useState({ employe: '', type: 'Congé Annuel', dateDebut: '', dateFin: '' });
  const handleLeaveChange = e => setLeaveForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleLeaveSubmit = () => {
    showToast('Absence enregistrée dans le système.', 'success');
    setLeaveForm({ employe: '', type: 'Congé Annuel', dateDebut: '', dateFin: '' });
    setIsLeaveModalOpen(false);
  };

  // --- Dashboard Table Pagination ---
  const [dashboardPage, setDashboardPage] = useState(1);
  const DASHBOARD_TOTAL = 452;

  // If Employee, show simple dashboard
  if (user?.role === 'EMPLOYEE') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <header className="header">
          <div className="header-title">
            <h1>{t('dashboard.myWorkspace')}</h1>
            <p>{t('dashboard.welcome')} {user.name}, {t('dashboard.welcomeDesc')}</p>
          </div>
          <div className="header-actions">
            <button className="action-btn primary" onClick={() => setIsRequestModalOpen(true)}>
              <i className="fas fa-plus"></i> {t('dashboard.newRequest')}
            </button>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card blue-card">
            <div className="stat-header">
              <div className="stat-icon primary"><i className="fas fa-calendar"></i></div>
            </div>
            <div className="stat-value">{t('dashboard.stats.days', { count: 18 })}</div>
            <div className="stat-label">{t('dashboard.stats.leavesBalance')}</div>
          </div>
          <div className="stat-card amber-card">
            <div className="stat-header">
              <div className="stat-icon warning"><i className="fas fa-clock"></i></div>
            </div>
            <div className="stat-value">2</div>
            <div className="stat-label">{t('dashboard.stats.pendingRequests')}</div>
          </div>
          <div className="stat-card emerald-card">
            <div className="stat-header">
              <div className="stat-icon success"><i className="fas fa-check"></i></div>
            </div>
            <div className="stat-value">4</div>
            <div className="stat-label">{t('dashboard.stats.approvedRequests')}</div>
          </div>
        </div>

        <Modal 
          isOpen={isRequestModalOpen} 
          onClose={() => setIsRequestModalOpen(false)} 
          title="Nouvelle Demande"
          icon="fas fa-file-alt"
          iconColor="var(--c-purple)"
          iconBg="var(--bg-purple)"
          submitColor="var(--c-purple)"
          onSubmit={handleRequestSubmit}
          submitText="Soumettre la demande"
        >
          <form onSubmit={e => { e.preventDefault(); handleRequestSubmit(); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Type de demande</label>
                <select name="type" className="form-input" value={requestForm.type} onChange={handleRequestChange}>
                  <option>Attestation de Travail</option>
                  <option>Attestation de Salaire</option>
                  <option>Demande d'avance</option>
                  <option>Renouvellement de matériel</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Priorité</label>
                <select name="priorite" className="form-input" value={requestForm.priorite} onChange={handleRequestChange}>
                  <option>Normale (Délai 48h)</option>
                  <option>Haute (Délai 24h)</option>
                  <option>Urgente (Immédiat)</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Description ou détails additionnels</label>
              <textarea name="description" className="form-input" rows="2" placeholder="Précisez la langue souhaitée, la période, ou toute information utile pour l'équipe RH..." value={requestForm.description} onChange={handleRequestChange}></textarea>
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">Pièces jointes (Optionnel)</label>
              <div style={{ border: '2px dashed var(--border-color)', padding: '16px', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-gray)', cursor: 'pointer' }} onClick={() => document.getElementById('fileInputEmployee').click()}>
                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.5rem', marginBottom: '4px', color: 'var(--primary)' }}></i>
                <div style={{ fontSize: '0.85rem' }}>{requestForm.fichier ? requestForm.fichier.name : 'Cliquez pour ajouter un fichier (PDF, JPG, PNG)'}</div>
                <input id="fileInputEmployee" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setRequestForm(p => ({ ...p, fichier: e.target.files[0] }))} />
              </div>
            </div>
          </form>
        </Modal>

        {/* Employee Modal (shown inside Employee view) */}
        <Modal 
          isOpen={isEmployeeModalOpen} 
          onClose={() => setIsEmployeeModalOpen(false)} 
          title="Ajouter un employé"
          icon="fas fa-user-plus"
          iconColor="var(--c-blue)"
          iconBg="var(--bg-blue)"
          submitColor="var(--c-blue)"
          onSubmit={handleEmployeeSubmit}
          submitText="Ajouter l'employé"
        >
          <form onSubmit={e => { e.preventDefault(); handleEmployeeSubmit(); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Prénom</label>
                <input type="text" name="prenom" className="form-input" placeholder="Ex: Jean" value={employeeForm.prenom} onChange={handleEmployeeChange} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nom</label>
                <input type="text" name="nom" className="form-input" placeholder="Ex: Dupont" value={employeeForm.nom} onChange={handleEmployeeChange} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Adresse Email</label>
              <input type="email" name="email" className="form-input" placeholder="jean.dupont@entreprise.com" value={employeeForm.email} onChange={handleEmployeeChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Poste</label>
                <input type="text" name="poste" className="form-input" placeholder="Développeur Front-end" value={employeeForm.poste} onChange={handleEmployeeChange} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Département</label>
                <select name="departement" className="form-input" value={employeeForm.departement} onChange={handleEmployeeChange}>
                  <option>Ingénierie</option>
                  <option>Marketing</option>
                  <option>Ventes</option>
                  <option>Ressources Humaines</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>

        {/* Leave Modal */}
        <Modal 
          isOpen={isLeaveModalOpen} 
          onClose={() => setIsLeaveModalOpen(false)} 
          title="Enregistrer une Absence"
          icon="fas fa-calendar-alt"
          iconColor="var(--c-orange)"
          iconBg="var(--bg-orange)"
          submitColor="var(--c-orange)"
          onSubmit={handleLeaveSubmit}
          submitText="Enregistrer l'absence"
        >
          <form onSubmit={e => { e.preventDefault(); handleLeaveSubmit(); }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Employé</label>
              <select name="employe" className="form-input" value={leaveForm.employe} onChange={handleLeaveChange} required>
                <option value="">Sélectionnez un employé...</option>
                <option value="john-davis">John Davis (Opérations)</option>
                <option value="maria-chen">Maria Chen (Conformité)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Type de congé</label>
              <select name="type" className="form-input" value={leaveForm.type} onChange={handleLeaveChange}>
                <option>Congé Annuel</option>
                <option>Congé Maladie</option>
                <option>Télétravail Exceptionnel</option>
                <option>Absence Non Justifiée</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date de début</label>
                <input type="date" name="dateDebut" className="form-input" value={leaveForm.dateDebut} onChange={handleLeaveChange} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date de fin</label>
                <input type="date" name="dateFin" className="form-input" value={leaveForm.dateFin} onChange={handleLeaveChange} required />
              </div>
            </div>
          </form>
        </Modal>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <header className="header">
        <div className="header-title">
          <h1>{t('dashboard.managerTitle', { role: user?.role === 'HR_MANAGER' ? t('auth.hrManager') : t('auth.manager') })}</h1>
          <p>{t('dashboard.managerSubtitle')}</p>
        </div>
      </header>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card blue-card">
          <div className="stat-header">
            <div className="stat-icon primary">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-trend positive"><i className="fas fa-arrow-up"></i> +12%</div>
          </div>
          <div className="stat-value">452</div>
          <div className="stat-label">{t('dashboard.stats.activeEmployees')}</div>
        </div>

        <div className="stat-card amber-card">
          <div className="stat-header">
            <div className="stat-icon warning"><i className="fas fa-clock"></i></div>
            <div className="stat-trend negative"><i className="fas fa-circle" style={{ fontSize: '8px' }}></i> Urgent</div>
          </div>
          <div className="stat-value">18</div>
          <div className="stat-label">{t('dashboard.stats.pendingVal')}</div>
        </div>

        <div className="stat-card emerald-card">
          <div className="stat-header">
            <div className="stat-icon success"><i className="fas fa-calendar-check"></i></div>
            <div className="stat-trend positive"><i className="fas fa-check"></i> À jour</div>
          </div>
          <div className="stat-value">8</div>
          <div className="stat-label">{t('dashboard.stats.onLeaveToday')}</div>
        </div>

        <div className="stat-card lime-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#ECFCCB', color: '#65A30D' }}><i className="fas fa-shield-alt"></i></div>
            <div className="stat-trend positive" style={{ color: 'var(--success)' }}>Optimal</div>
          </div>
          <div className="stat-value">87%</div>
          <div className="stat-label">{t('dashboard.stats.complianceRate')}</div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="middle-grid">
        {/* Department Quotas (Like Compliance Progress) */}
        <div className="card">
          <div className="card-title">
            <i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i>
            {t('dashboard.departmentBudgets')}
          </div>
          
          <div className="progress-item">
            <div className="progress-header">
              <span>Ingénierie</span>
              <span style={{ color: 'var(--success)' }}>92%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '92%', backgroundColor: 'var(--success)' }}></div>
            </div>
          </div>

          <div className="progress-item">
            <div className="progress-header">
              <span>Marketing</span>
              <span style={{ color: 'var(--success)' }}>88%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '88%', backgroundColor: 'var(--success)' }}></div>
            </div>
          </div>

          <div className="progress-item">
            <div className="progress-header">
              <span>Ventes</span>
              <span style={{ color: 'var(--warning)' }}>75%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '75%', backgroundColor: 'var(--warning)' }}></div>
            </div>
          </div>

          <div className="progress-item" style={{ marginBottom: 0 }}>
            <div className="progress-header">
              <span>Ressources Humaines</span>
              <span style={{ color: 'var(--success)' }}>95%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '95%', backgroundColor: 'var(--success)' }}></div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-title">
            <i className="far fa-clock" style={{ color: 'var(--primary)' }}></i>
            {t('dashboard.recentActivity')}
          </div>
          
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                <i className="fas fa-arrow-up"></i>
              </div>
              <div className="timeline-content">
                <h4>{t('dashboard.newRequestSubmitted')}</h4>
                <p>{t('dashboard.salaryCertificate')} • {t('dashboard.hoursAgo', { count: 2 })}</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon" style={{ background: '#DCFCE7', color: 'var(--success)' }}>
                <i className="fas fa-check"></i>
              </div>
              <div className="timeline-content">
                <h4>{t('dashboard.leaveApproved')}</h4>
                <p>{t('dashboard.leaveApprovedDesc')}</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon" style={{ background: '#F3E8FF', color: '#9333EA' }}>
                <i className="fas fa-sync"></i>
              </div>
              <div className="timeline-content">
                <h4>{t('dashboard.policyUpdate')}</h4>
                <p>{t('dashboard.policyUpdateDesc')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="card">
          <div className="card-title">
            <i className="fas fa-bolt" style={{ color: 'var(--primary)' }}></i>
            {t('dashboard.quickActions')}
          </div>
          
          <button className="quick-action-btn action-blue" onClick={() => setIsEmployeeModalOpen(true)}>
            <i className="fas fa-user-plus"></i> {t('dashboard.addEmployee')}
          </button>
          <button className="quick-action-btn action-purple" onClick={() => setIsRequestModalOpen(true)}>
            <i className="fas fa-file-alt"></i> {t('dashboard.createRequest')}
          </button>
          <button className="quick-action-btn action-orange" onClick={() => setIsLeaveModalOpen(true)}>
            <i className="fas fa-calendar-check"></i> {t('dashboard.manageLeaves')}
          </button>
          <button className="quick-action-btn primary" style={{ marginTop: '8px' }}>
            <i className="fas fa-download"></i> {t('dashboard.generatePayroll')}
          </button>
        </div>

        {/* Analytics Section - 2 columns */}
        {/* Area Chart: spans 2 columns */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">
            <i className="fas fa-chart-area" style={{ color: 'var(--primary)' }}></i>
            Évolution des Demandes et Absences
          </div>
          <div style={{ height: '220px', width: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbsences" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-gray)" />
                <YAxis stroke="var(--text-gray)" />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--main-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="requests" name="Demandes" stroke="var(--primary)" fillOpacity={1} fill="url(#colorRequests)" />
                <Area type="monotone" dataKey="absences" name="Absences" stroke="var(--warning)" fillOpacity={1} fill="url(#colorAbsences)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: spans 1 column */}
        <div className="card" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">
            <i className="fas fa-chart-pie" style={{ color: 'var(--c-purple)' }}></i>
            Distribution des Demandes
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', minHeight: '220px' }}>
            {/* Center Label */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -85%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1 }}>45</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', fontWeight: 500, marginTop: '4px' }}>Total</div>
            </div>
            
            {/* Chart */}
            <div style={{ height: '140px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Approuvées', value: 24, color: '#10B981' },
                      { name: 'En attente', value: 18, color: '#F59E0B' },
                      { name: 'Rejetées', value: 3, color: '#EF4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={62}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {[
                      { color: '#10B981' },
                      { color: '#F59E0B' },
                      { color: '#EF4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend / Status List */}
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '8px', padding: '0 12px', marginTop: '4px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#10B981', justifyContent: 'center' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  53%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-gray)', fontWeight: 500, marginTop: '2px' }}>Approuvées</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#F59E0B', justifyContent: 'center' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
                  40%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-gray)', fontWeight: 500, marginTop: '2px' }}>En attente</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', justifyContent: 'center' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
                  7%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-gray)', fontWeight: 500, marginTop: '2px' }}>Rejetées</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">{t('dashboard.recentRequests')}</h3>
          <div className="filter-group">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder={t('common.search')} />
            </div>
            <button className="filter-pill filter-pill-blue">{t('employees.filters.deptFilter')}</button>
            <button className="filter-pill filter-pill-green">{t('employees.filters.statusFilter')}</button>
            <button className="filter-pill filter-pill-purple">{t('requests.table.request')}</button>
          </div>
        </div>

        <div className="table-container table-responsive">
          <table>
            <thead>
              <tr>
                <th>{t('requests.table.request')}</th>
                <th>{t('requests.table.department')}</th>
                <th>{t('requests.table.owner')}</th>
                <th>{t('common.status')}</th>
                <th>{t('dashboard.updated')}</th>
                <th style={{ textAlign: 'center' }}>{t('requests.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { icon: 'fa-file-invoice', iconBg: '#DBEAFE', iconColor: '#2563EB', title: t('dashboard.salaryCertificate'), sub: `PDF • ${t('requests.table.request')}`, dept: 'Finance', initials: 'SM', avatarBg: '#2563EB', owner: 'Sarah Miller', status: t('requests.tabs.completed'), statusBg: '#DCFCE7', statusColor: '#16A34A', date: '10 Nov, 2026' },
                { icon: 'fa-plane-departure', iconBg: '#ECFCCB', iconColor: '#65A30D', title: t('requests.table.leave'), sub: `14 ${t('employees.stats.onLeave')} • Formulaire`, dept: 'Opérations', initials: 'JD', avatarBg: '#0D9488', owner: 'John Davis', status: t('requests.tabs.pending'), statusBg: '#FEF3C7', statusColor: '#D97706', date: '12 Nov, 2026' },
                { icon: 'fa-briefcase-medical', iconBg: '#F3E8FF', iconColor: '#9333EA', title: t('requests.table.medical'), sub: `Médical • PDF`, dept: 'RH', initials: 'AK', avatarBg: '#9333EA', owner: 'Alex Kim', status: t('requests.tabs.completed'), statusBg: '#DCFCE7', statusColor: '#16A34A', date: '08 Nov, 2026' },
                { icon: 'fa-shield-alt', iconBg: '#CCFBF1', iconColor: '#0D9488', title: t('requests.table.complianceChecklist'), sub: 'v1.5 • XLSX', dept: 'Conformité', initials: 'MC', avatarBg: '#10B981', owner: 'Maria Chen', status: t('requests.tabs.inProgress'), statusBg: '#FEF3C7', statusColor: '#D97706', date: '11 Nov, 2026' },
              ].map((row, i) => (
                <tr key={i}>
                  <td>
                    <div className="user-cell">
                      <div className="icon-box" style={{ background: row.iconBg, color: row.iconColor }}>
                        <i className={`fas ${row.icon}`}></i>
                      </div>
                      <div>
                        <span className="user-info-name">{row.title}</span>
                        <span className="user-info-sub">{row.sub}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="dept-pill" style={{ background: '#EFF6FF', color: '#2563EB' }}>{row.dept}</span></td>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-initials" style={{ background: row.avatarBg }}>{row.initials}</div>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{row.owner}</span>
                    </div>
                  </td>
                  <td><span className={`modern-status-badge ${row.status === 'Approuvé' ? 'badge-success' : row.status === 'En Attente' ? 'badge-warning' : 'badge-info'}`}>{row.status}</span></td>
                  <td style={{ color: '#64748B', fontSize: '0.9rem' }}>{row.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button className="modern-action-btn" onClick={() => handleRequestAction(row)}><i className="far fa-eye"></i></button>
                      <button className="modern-action-btn" title="Exporter" onClick={() => handleExportDocument(row)}><i className="fas fa-download"></i></button>
                      <button className="modern-action-btn" onClick={() => showToast('Lien de partage copié !', 'success')}><i className="fas fa-share-alt"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={dashboardPage}
          totalItems={DASHBOARD_TOTAL}
          itemsPerPage={4}
          onPageChange={setDashboardPage}
        />
      </div>

      {/* Employee Modal */}
      <Modal 
        isOpen={isEmployeeModalOpen} 
        onClose={() => setIsEmployeeModalOpen(false)} 
        title="Ajouter un Collaborateur"
        icon="fas fa-user-plus"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        <form onSubmit={e => { e.preventDefault(); handleEmployeeSubmit(); }} style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="var(--primary)" /> Prénom
              </label>
              <input type="text" name="prenom" className="form-input" placeholder="Ex: Jean" value={employeeForm.prenom} onChange={handleEmployeeChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="var(--primary)" /> Nom
              </label>
              <input type="text" name="nom" className="form-input" placeholder="Ex: Dupont" value={employeeForm.nom} onChange={handleEmployeeChange} required />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={12} color="var(--c-purple)" /> Email Professionnel
            </label>
            <input type="email" name="email" className="form-input" placeholder="jean.dupont@entreprise.com" value={employeeForm.email} onChange={handleEmployeeChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={12} color="var(--c-orange)" /> Poste
              </label>
              <input type="text" name="poste" className="form-input" placeholder="Développeur" value={employeeForm.poste} onChange={handleEmployeeChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={12} color="var(--success)" /> Département
              </label>
              <select name="departement" className="form-input" value={employeeForm.departement} onChange={handleEmployeeChange}>
                <option>Ingénierie</option>
                <option>Marketing</option>
                <option>Ventes</option>
                <option>RH</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="action-btn primary" style={{ flex: 2, justifyContent: 'center', height: '42px' }}>
              Enregistrer le profil
            </button>
            <button type="button" className="action-btn" style={{ flex: 1, justifyContent: 'center', height: '42px' }} onClick={() => setIsEmployeeModalOpen(false)}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
        title="Nouvelle Demande"
        icon="fas fa-file-signature"
        iconColor="var(--c-purple)"
        iconBg="var(--bg-purple)"
        showFooter={false}
      >
        <form onSubmit={e => { e.preventDefault(); handleRequestSubmit(); }} style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={12} color="var(--c-purple)" /> Type
              </label>
              <select name="type" className="form-input" value={requestForm.type} onChange={handleRequestChange}>
                <option>Attestation de Travail</option>
                <option>Attestation de Salaire</option>
                <option>Demande d'avance</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} color="var(--warning)" /> Priorité
              </label>
              <select name="priorite" className="form-input" value={requestForm.priorite} onChange={handleRequestChange}>
                <option>Normale</option>
                <option>Haute</option>
                <option>Urgente</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Description</label>
            <textarea name="description" className="form-input" rows="2" style={{ minHeight: '60px' }} placeholder="Détails du besoin..." value={requestForm.description} onChange={handleRequestChange}></textarea>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ border: '1px dashed var(--border-color)', padding: '12px', textAlign: 'center', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--sidebar-bg)' }} onClick={() => document.getElementById('fileInputDashboard').click()}>
              <Download size={16} color="var(--primary)" style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{requestForm.fichier ? requestForm.fichier.name : 'Ajouter un document'}</div>
              <input id="fileInputDashboard" type="file" style={{ display: 'none' }} onChange={e => setRequestForm(p => ({ ...p, fichier: e.target.files[0] }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="action-btn primary" style={{ flex: 2, background: 'var(--c-purple)', borderColor: 'var(--c-purple)', height: '42px' }}>
              Envoyer la demande
            </button>
            <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsRequestModalOpen(false)}>
              Fermer
            </button>
          </div>
        </form>
      </Modal>

      {/* Leave Modal */}
      <Modal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        title="Enregistrer une Absence"
        icon="fas fa-calendar-alt"
        iconColor="var(--c-orange)"
        iconBg="var(--bg-orange)"
        showFooter={false}
      >
        <form onSubmit={e => { e.preventDefault(); handleLeaveSubmit(); }} style={{ padding: '4px 0' }}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} color="var(--primary)" /> Collaborateur
            </label>
            <select name="employe" className="form-input" value={leaveForm.employe} onChange={handleLeaveChange} required>
              <option value="">Choisir un employé...</option>
              <option value="john-davis">John Davis</option>
              <option value="maria-chen">Maria Chen</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Umbrella size={12} color="var(--success)" /> Motif d'absence
            </label>
            <select name="type" className="form-input" value={leaveForm.type} onChange={handleLeaveChange}>
              <option>Congé Annuel</option>
              <option>Congé Maladie</option>
              <option>Télétravail</option>
              <option>Autre</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} color="var(--text-gray)" /> Début
              </label>
              <input type="date" name="dateDebut" className="form-input" value={leaveForm.dateDebut} onChange={handleLeaveChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} color="var(--text-gray)" /> Fin
              </label>
              <input type="date" name="dateFin" className="form-input" value={leaveForm.dateFin} onChange={handleLeaveChange} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="action-btn primary" style={{ flex: 2, background: 'var(--c-orange)', borderColor: 'var(--c-orange)', height: '42px' }}>
              Confirmer l'absence
            </button>
            <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsLeaveModalOpen(false)}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      {/* Request Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Détails de la Demande"
        icon="far fa-file-alt"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        {selectedRequest && (
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>{selectedRequest.title}</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ 
                      backgroundColor: '#2563EB', 
                      color: '#ffffff', 
                      padding: '3px 10px', 
                      borderRadius: '4px', 
                      fontSize: '0.65rem', 
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '60px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {selectedRequest.type || 'DOCUMENT'}
                    </span>
                    <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-color)' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', fontWeight: 500 }}>
                      Ref: <span style={{ color: 'var(--text-dark)' }}>#RQ-{selectedRequest.id * 1234 || 5843}</span>
                    </span>
                  </div>
                </div>
              </div>
              <span className={`modern-status-badge ${selectedRequest.status === 'Approuvé' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '6px 16px', fontSize: '0.75rem' }}>{selectedRequest.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div className="detail-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <User size={14} color="var(--primary)" />
                  <span className="detail-label">Propriétaire</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: selectedRequest.avatarBg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, border: '2px solid var(--main-bg)' }}>{selectedRequest.initials}</div>
                  <span className="detail-value" style={{ fontSize: '0.9rem' }}>{selectedRequest.owner}</span>
                </div>
              </div>

              <div className="detail-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Building2 size={14} color="var(--c-purple)" />
                  <span className="detail-label">Département</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.9rem' }}>{selectedRequest.dept}</span>
              </div>

              <div className="detail-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Calendar size={14} color="var(--c-orange)" />
                  <span className="detail-label">Mise à jour</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.9rem' }}>{selectedRequest.date}</span>
              </div>

              <div className="detail-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Fingerprint size={14} color="var(--text-gray)" />
                  <span className="detail-label">ID Traçabilité</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>#RH-{selectedRequest.id || 7130}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="action-btn primary" style={{ flex: 1, justifyContent: 'center', gap: '10px', height: '44px' }} onClick={() => { showToast('Traitement de la demande...', 'info'); setIsDetailsModalOpen(false); }}>
                <Share2 size={18} /> Actions Rapides
              </button>
              <button className="action-btn" style={{ flex: 1, justifyContent: 'center', height: '44px' }} onClick={() => setIsDetailsModalOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

    </motion.div>
  );
};

export default Dashboard;
