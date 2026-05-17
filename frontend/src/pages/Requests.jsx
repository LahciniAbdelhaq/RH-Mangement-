import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { logSystemActivity } from '../utils/rbac';
import { FileText, Clock, AlertTriangle, CheckCircle2, User, Building2, Calendar, Download, Eye, Check, X, FileSignature, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

const Requests = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { user, effectiveRole } = useAuth();
  
  const isEmployee = effectiveRole === 'EMPLOYEE';
  const isDeptManager = effectiveRole === 'DEPARTMENT_MANAGER' || effectiveRole === 'INTERIM_MANAGER';
  const isHR = effectiveRole === 'HR_MANAGER' || effectiveRole === 'HR_AGENT';

  const defaultRequests = [
    { id: 1, title: "Attestation de Salaire", sub: "PDF • Demande urgente", dept: "Opérations", owner: "John Davis", ownerBg: "0D9488", date: "Il y a 2h", status: "attente", icon: "fas fa-file-invoice", color: "#9333EA", bg: "#F3E8FF", priorite: "Urgente" },
    { id: 2, title: "Attestation de Travail", sub: "Document RH", dept: "Conformité", owner: "Maria Chen", ownerBg: "10B981", date: "Il y a 5h", status: "attente", icon: "fas fa-file-contract", color: "#2563EB", bg: "#DBEAFE", priorite: "Normale" },
    { id: 3, title: "Renouvellement Matériel", sub: "Équipement IT", dept: "Ingénierie", owner: "Lucas Martin", ownerBg: "F59E0B", date: "Il y a 1j", status: "cours", icon: "fas fa-laptop-code", color: "#D97706", bg: "#FEF3C7", priorite: "Haute" },
    { id: 4, title: "Attestation de Travail", sub: "Clôturé avec succès", dept: "Ressources Humaines", owner: "Emma Wilson", ownerBg: "2563EB", date: "Hier", status: "terminees", icon: "fas fa-check-circle", color: "#16A34A", bg: "#DCFCE7", priorite: "Normale" },
    { id: 5, title: "Demande de Congé", sub: "Congé Annuel", dept: "Finance", owner: "Sarah Miller", ownerBg: "EF4444", date: "Il y a 3j", status: "rejetees", icon: "fas fa-plane", color: "#EF4444", bg: "#FEE2E2", priorite: "Normale" }
  ];

  const [requests, setRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('system_requests');
      return saved ? JSON.parse(saved) : defaultRequests;
    } catch (e) {
      return defaultRequests;
    }
  });

  useEffect(() => {
    localStorage.setItem('system_requests', JSON.stringify(requests));
  }, [requests]);

  const [activeTab, setActiveTab] = useState('attente');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [newRequestForm, setNewRequestForm] = useState({ type: 'Attestation de Travail', priorite: 'Normale (Délai 48h)', description: '', fichier: null });

  const filteredByRole = requests.filter(req => {
    if (isEmployee) return req.owner === user?.name;
    if (isDeptManager) {
      const uDept = user?.dept?.toLowerCase() || '';
      return req.dept.toLowerCase().includes(uDept) || uDept.includes(req.dept.toLowerCase()) || req.owner === user?.name;
    }
    return true;
  });

  const filteredByTab = filteredByRole.filter(req => req.status === activeTab);
  
  // Stats
  const countAttente = filteredByRole.filter(r => r.status === 'attente').length;
  const countCours = filteredByRole.filter(r => r.status === 'cours').length;
  const countTerminees = filteredByRole.filter(r => r.status === 'terminees').length;
  const countRejetees = filteredByRole.filter(r => r.status === 'rejetees').length;

  const handleExportDocument = (row) => {
    let extension = 'txt';
    let mimeType = 'text/plain;charset=utf-8';
    let formatLabel = 'texte brut';

    const subLower = (row.sub || '').toLowerCase();
    
    if (subLower.includes('pdf') || subLower.includes('formulaire') || row.title.toLowerCase().includes('attestation')) {
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
    logSystemActivity("Génération PDF", user?.name, `Génération du document: ${row.title} pour ${row.owner}`);
    
    setTimeout(() => {
      try {
        if (extension === 'pdf') {
          const doc = new jsPDF();
          const img = new Image();
          img.src = '/logo.png';
          
          const generatePDF = (logoLoaded) => {
            if (logoLoaded) doc.addImage(img, 'PNG', 15, 15, 35, 35);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(15, 23, 42);
            doc.text("RH MANAGEMENT S.A.", 195, 22, { align: "right" });
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text("Quartier des Affaires, Casablanca, Maroc", 195, 30, { align: "right" });
            doc.text("Tél : +212 5 22 00 00 00", 195, 36, { align: "right" });
            doc.text("Email : contact@rh-management.com", 195, 42, { align: "right" });

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(15, 55, 195, 55);

            const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.text(`Fait à Casablanca, le ${today}`, 195, 70, { align: "right" });

            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(37, 99, 235);
            const titleText = (row.title ? row.title.toUpperCase() : 'ATTESTATION ADMINISTRATIVE');
            doc.text(titleText, 105, 95, { align: "center" });
            
            doc.setDrawColor(37, 99, 235);
            const textWidth = doc.getTextWidth(titleText);
            doc.line(105 - (textWidth/2), 98, 105 + (textWidth/2), 98);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 41, 59);

            const titleLower = row.title ? row.title.toLowerCase() : "";
            
            if (titleLower.includes('salaire') || titleLower.includes('travail') || titleLower.includes('attestation')) {
              doc.text("Je soussigné(e), Directeur des Ressources Humaines de la société RH MANAGEMENT,", 20, 120);
              doc.text("certifie et atteste par la présente que :", 20, 128);
              
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
              doc.text(`Objet : ${titleText}`, 20, 120);
              doc.text(`Le présent document certifie les informations administratives suivantes concernant`, 20, 135);
              doc.text(`le collaborateur ci-dessous :`, 20, 143);
              
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

            doc.setFont("helvetica", "bold");
            doc.text("La Direction des Ressources Humaines", 120, 240);
            
            doc.setDrawColor(37, 99, 235);
            doc.setTextColor(37, 99, 235);
            doc.setLineWidth(0.5);
            doc.roundedRect(120, 245, 60, 25, 2, 2);
            doc.setFontSize(10);
            doc.text("CACHET ET SIGNATURE", 150, 258, { align: "center" });

            doc.save(`${row.title.replace(/\s+/g, '_')}_${row.owner.replace(/\s+/g, '_')}.pdf`);
            showToast(`Document "${row.title}" téléchargé avec succès`, 'success');
          };

          img.onload = () => generatePDF(true);
          img.onerror = () => generatePDF(false);
          
        } else {
          const content = `DOCUMENT EXPORT\n\nTitre: ${row.title}\nDemandeur: ${row.owner}\nDépartement: ${row.dept}\nStatut: ${row.status}\nDate: ${row.date}\n\nGénéré le: ${new Date().toLocaleString()}`;
          const blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${row.title.replace(/\s+/g, '_')}_${row.owner.replace(/\s+/g, '_')}.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast(`Document "${row.title}" téléchargé avec succès`, 'success');
        }
      } catch (err) {
        showToast(`Erreur lors de la génération du document`, 'error');
        console.error(err);
      }
    }, 1200);
  };

  const handleNewRequestChange = e => setNewRequestForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleNewRequestSubmit = () => {
    const newReq = {
      id: Date.now(),
      title: newRequestForm.type,
      sub: newRequestForm.description || "Nouvelle demande",
      dept: user?.dept || "Général",
      owner: user?.name || "Employé",
      ownerBg: "2563EB",
      date: "À l'instant",
      status: "attente",
      icon: "fas fa-file",
      color: "#2563EB",
      bg: "#DBEAFE",
      priorite: newRequestForm.priorite
    };
    
    setRequests(prev => [newReq, ...prev]);
    showToast('Votre demande a été soumise avec succès.', 'success');
    logSystemActivity("Création Demande", user?.name, `Soumission de la demande: ${newReq.title}`);
    setNewRequestForm({ type: 'Attestation de Travail', priorite: 'Normale (Délai 48h)', description: '', fichier: null });
    setIsModalOpen(false);
  };

  const openDetails = (req) => {
    setSelectedRequest(req);
    setIsDetailsModalOpen(true);
  };

  const onApprove = () => {
    if (!selectedRequest) return;
    const nextStatus = isDeptManager ? 'cours' : 'terminees';
    
    setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: nextStatus, date: 'À l\'instant' } : r));
    showToast(isDeptManager ? 'Demande validée et transmise aux RH.' : 'La demande a été approuvée avec succès.', 'success');
    logSystemActivity(
      isDeptManager ? "Validation Demande (N+1)" : "Approbation Demande (RH)", 
      user?.name, 
      `Demande ${selectedRequest.title} de ${selectedRequest.owner} traitée.`
    );
    setIsDetailsModalOpen(false);
  };

  const onReject = () => {
    if (!selectedRequest) return;
    setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: 'rejetees', date: 'À l\'instant' } : r));
    showToast('La demande a été rejetée.', 'error');
    logSystemActivity("Rejet Demande", user?.name, `Demande ${selectedRequest.title} de ${selectedRequest.owner} rejetée.`);
    setIsDetailsModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1>{isEmployee ? "Mes Demandes" : t('requests.title')}</h1>
          <p>{isEmployee ? "Gérez vos attestations et demandes." : t('requests.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> {t('requests.newRequest')}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <div 
          onClick={() => { setActiveTab('attente'); setCurrentPage(1); }}
          style={{ fontWeight: activeTab === 'attente' ? 600 : 500, color: activeTab === 'attente' ? 'var(--primary)' : 'var(--text-gray)', borderBottom: activeTab === 'attente' ? '2px solid var(--primary)' : 'none', paddingBottom: '12px', marginBottom: activeTab === 'attente' ? '-1px' : '0', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{t('requests.tabs.pending')} ({countAttente})</div>
        <div 
          onClick={() => { setActiveTab('cours'); setCurrentPage(1); }}
          style={{ fontWeight: activeTab === 'cours' ? 600 : 500, color: activeTab === 'cours' ? 'var(--primary)' : 'var(--text-gray)', borderBottom: activeTab === 'cours' ? '2px solid var(--primary)' : 'none', paddingBottom: '12px', marginBottom: activeTab === 'cours' ? '-1px' : '0', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{t('requests.tabs.inProgress')} ({countCours})</div>
        <div 
          onClick={() => { setActiveTab('terminees'); setCurrentPage(1); }}
          style={{ fontWeight: activeTab === 'terminees' ? 600 : 500, color: activeTab === 'terminees' ? 'var(--primary)' : 'var(--text-gray)', borderBottom: activeTab === 'terminees' ? '2px solid var(--primary)' : 'none', paddingBottom: '12px', marginBottom: activeTab === 'terminees' ? '-1px' : '0', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{t('requests.tabs.completed')} ({countTerminees})</div>
        <div 
          onClick={() => { setActiveTab('rejetees'); setCurrentPage(1); }}
          style={{ fontWeight: activeTab === 'rejetees' ? 600 : 500, color: activeTab === 'rejetees' ? 'var(--primary)' : 'var(--text-gray)', borderBottom: activeTab === 'rejetees' ? '2px solid var(--primary)' : 'none', paddingBottom: '12px', marginBottom: activeTab === 'rejetees' ? '-1px' : '0', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{t('requests.tabs.rejected')} ({countRejetees})</div>
      </div>

      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', marginBottom: 0 }}>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder={t('requests.search')} />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('requests.table.request')}</th>
                <th>{t('requests.table.department')}</th>
                <th>{t('requests.table.owner')}</th>
                <th>Mise à jour</th>
                <th></th>
                <th style={{ textAlign: 'center' }}>{t('requests.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredByTab.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div className="user-cell">
                      <div className="icon-box" style={{ background: req.bg, color: req.color }}>
                        <i className={req.icon}></i>
                      </div>
                      <div>
                        <span className="user-info-name">{req.title}</span>
                        <span className="user-info-sub">{req.sub}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="dept-pill" style={{ background: '#EFF6FF', color: '#2563EB' }}>{req.dept}</span></td>
                  <td>
                    <div className="user-cell">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `#${req.ownerBg}`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                        {req.owner.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.85rem' }}>{req.owner}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{req.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    {req.status === 'cours' && (
                      <Loader2 size={16} style={{ color: '#D97706', animation: 'spin 1s linear infinite' }} />
                    )}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button onClick={() => openDetails(req)} className="modern-action-btn" title="Voir les détails"><Eye size={16} /></button>
                      
                      {!isEmployee && req.status === 'attente' && (
                        <>
                          <button className="modern-action-btn" title="Approuver" onClick={() => { setSelectedRequest(req); onApprove(); }}><Check size={16} /></button>
                          <button className="modern-action-btn" title="Rejeter" onClick={() => { setSelectedRequest(req); onReject(); }}><X size={16} /></button>
                        </>
                      )}
                      
                      {!isEmployee && req.status === 'cours' && isHR && (
                         <>
                         <button className="modern-action-btn" title="Approuver définitivement" onClick={() => { setSelectedRequest(req); onApprove(); }}><Check size={16} /></button>
                         <button className="modern-action-btn" title="Rejeter" onClick={() => { setSelectedRequest(req); onReject(); }}><X size={16} /></button>
                       </>
                      )}

                      {req.status === 'terminees' && (
                        <button className="modern-action-btn" title="Télécharger PDF" onClick={() => handleExportDocument(req)}><Download size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredByTab.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                    Aucune demande {activeTab} trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <Pagination
            currentPage={currentPage}
            totalItems={filteredByTab.length}
            itemsPerPage={5}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

       <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Créer une Demande RH"
        icon="fas fa-file-signature"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        <form onSubmit={e => { e.preventDefault(); handleNewRequestSubmit(); }} style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={12} color="var(--primary)" /> Type
              </label>
              <select name="type" className="form-input" value={newRequestForm.type} onChange={handleNewRequestChange}>
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
              <select name="priorite" className="form-input" value={newRequestForm.priorite} onChange={handleNewRequestChange}>
                <option>Normale</option>
                <option>Haute</option>
                <option>Urgente</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Description</label>
            <textarea name="description" className="form-input" rows="2" style={{ minHeight: '60px' }} placeholder="Détails du besoin..." value={newRequestForm.description} onChange={handleNewRequestChange}></textarea>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ border: '1px dashed var(--border-color)', padding: '12px', textAlign: 'center', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--sidebar-bg)' }} onClick={() => document.getElementById('fileInputRequests').click()}>
              <Download size={16} color="var(--primary)" style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{newRequestForm.fichier ? newRequestForm.fichier.name : 'Ajouter un document (PDF, Image)'}</div>
              <input id="fileInputRequests" type="file" style={{ display: 'none' }} onChange={e => setNewRequestForm(p => ({ ...p, fichier: e.target.files[0] }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="action-btn primary" style={{ flex: 2, height: '42px' }}>
              Soumettre la demande
            </button>
            <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsModalOpen(false)}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        title="Détails de la demande"
        icon="far fa-eye"
        iconColor="var(--c-blue)"
        iconBg="var(--bg-blue)"
        showFooter={false}
      >
        {selectedRequest && (
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: selectedRequest.bg, color: selectedRequest.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={selectedRequest.icon} style={{ fontSize: '24px' }}></i>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>{selectedRequest.title}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="filter-tag blue" style={{ padding: '2px 10px', fontSize: '0.7rem' }}>{selectedRequest.dept.toUpperCase()}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Ref: #RQ-00{selectedRequest.id}</span>
                </div>
              </div>
            </div>
            <span className={`modern-status-badge ${selectedRequest.status === 'terminees' ? 'badge-success' : selectedRequest.status === 'rejetees' ? 'badge-danger' : 'badge-warning'}`} style={{ padding: '6px 16px', fontSize: '0.75rem' }}>
              {selectedRequest.status === 'terminees' ? 'Terminée' : selectedRequest.status === 'rejetees' ? 'Rejetée' : selectedRequest.status === 'cours' ? 'En cours' : 'En Attente'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div className="detail-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <User size={14} color="var(--primary)" />
                <span className="detail-label">Demandeur</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `#${selectedRequest.ownerBg}`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  {selectedRequest.owner.split(' ').map(n=>n[0]).join('')}
                </div>
                <span className="detail-value" style={{ fontSize: '0.9rem' }}>{selectedRequest.owner}</span>
              </div>
            </div>

            <div className="detail-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertTriangle size={14} color="var(--c-orange)" />
                <span className="detail-label">Priorité</span>
              </div>
              <span className="detail-value" style={{ fontSize: '0.9rem', color: selectedRequest.priorite === 'Urgente' ? 'var(--danger)' : selectedRequest.priorite === 'Haute' ? 'var(--warning)' : 'var(--text-dark)' }}>
                {selectedRequest.priorite || 'Normale'}
              </span>
            </div>

            <div className="detail-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Calendar size={14} color="var(--success)" />
                <span className="detail-label">Date Soumise</span>
              </div>
              <span className="detail-value" style={{ fontSize: '0.9rem' }}>{selectedRequest.date}</span>
            </div>

            <div className="detail-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Clock size={14} color="var(--text-gray)" />
                <span className="detail-label">Détails</span>
              </div>
              <span className="detail-value" style={{ fontSize: '0.9rem' }}>{selectedRequest.sub}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {(!isEmployee && (selectedRequest.status === 'attente' || (selectedRequest.status === 'cours' && isHR))) ? (
              <>
                <button className="action-btn" onClick={onReject} style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger-bg)', backgroundColor: 'var(--danger-bg)', height: '44px' }}>
                  <X size={18} style={{ marginRight: '8px' }} /> Rejeter
                </button>
                <button className="action-btn primary" onClick={onApprove} style={{ flex: 2, justifyContent: 'center', background: 'var(--success)', borderColor: 'var(--success)', height: '44px' }}>
                  <CheckCircle2 size={18} style={{ marginRight: '8px' }} /> {isDeptManager ? 'Valider (N+1)' : 'Approuver (RH)'}
                </button>
              </>
            ) : selectedRequest.status === 'terminees' ? (
              <button className="action-btn primary" onClick={() => handleExportDocument(selectedRequest)} style={{ flex: 1, justifyContent: 'center', height: '44px' }}>
                <Download size={18} style={{ marginRight: '8px' }} /> Télécharger le document
              </button>
            ) : (
              <button className="action-btn" onClick={() => setIsDetailsModalOpen(false)} style={{ flex: 1, justifyContent: 'center', height: '44px' }}>
                Fermer
              </button>
            )}
          </div>
        </div>
        )}
      </Modal>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

export default Requests;
