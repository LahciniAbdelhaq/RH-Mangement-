import React, { useState } from 'react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { FileText, Clock, AlertTriangle, CheckCircle2, User, Building2, Calendar, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const Requests = () => {
  const { showToast } = useToast();

  const handleExportDocument = (row) => {
    let extension = 'txt';
    let mimeType = 'text/plain;charset=utf-8';
    let formatLabel = 'texte brut';

    const subLower = (row.sub || '').toLowerCase();
    
    // Check type or default to PDF
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
            fileContent = `==================================================\nRH MANAGEMENT SYSTEM - EXPORT SECURISE\n==================================================\nREF DOCUMENT : DOC-2026-REF-${Math.floor(1000 + Math.random() * 9000)}\nTYPE DOCUMENT: ${row.title.toUpperCase()}\nPROPRIÉTAIRE : ${row.owner || 'Non spécifié'}\nDÉPARTEMENT  : ${row.dept || 'Général'}\nSTATUT       : ${row.status || 'Non défini'}\nDATE D'EFFET : ${row.date || 'En attente'}`;
          }

          const file = new Blob([fileContent], { type: mimeType });
          element.href = URL.createObjectURL(file);
          element.download = `${row.title.toLowerCase().replace(/\s+/g, '_')}_export.${extension}`;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
        
        showToast(`Document "${row.title}" exporté en format ${formatLabel} !`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Erreur lors de la génération du fichier.', 'error');
      }
    }, 1000);
  };

  const [activeTab, setActiveTab] = useState('attente');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // --- New Request Form State ---
  const [newRequestForm, setNewRequestForm] = useState({ type: 'Attestation de Travail', priorite: 'Normale (Délai 48h)', description: '', fichier: null });
  const handleNewRequestChange = e => setNewRequestForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleNewRequestSubmit = () => {
    showToast('Votre demande a été soumise avec succès.', 'success');
    setNewRequestForm({ type: 'Attestation de Travail', priorite: 'Normale (Délai 48h)', description: '', fichier: null });
    setIsModalOpen(false);
  };

  const onApprove = () => {
    showToast('La demande a été approuvée.', 'success');
    setIsDetailsModalOpen(false);
  };

  const onReject = () => {
    showToast('La demande a été rejetée.', 'error');
    setIsDetailsModalOpen(false);
  };

  // --- Pagination state per tab ---
  const [pageAttente, setPageAttente] = useState(1);
  const [pageCours, setPageCours] = useState(1);
  const [pageTerminees, setPageTerminees] = useState(1);
  const TOTAL_ATTENTE   = 18;
  const TOTAL_COURS     = 5;
  const TOTAL_TERMINEES = 142;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1>Gestion des Demandes RH</h1>
          <p>Approuvez, rejetez et gérez les demandes administratives des employés</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Nouvelle Demande
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <div 
          onClick={() => setActiveTab('attente')}
          style={{ fontWeight: activeTab === 'attente' ? 600 : 500, color: activeTab === 'attente' ? 'var(--primary)' : 'var(--text-gray)', borderBottom: activeTab === 'attente' ? '2px solid var(--primary)' : 'none', paddingBottom: '12px', marginBottom: activeTab === 'attente' ? '-1px' : '0', cursor: 'pointer', transition: 'all 0.2s' }}>En Attente (18)</div>
        <div 
          onClick={() => setActiveTab('cours')}
          style={{ fontWeight: activeTab === 'cours' ? 600 : 500, color: activeTab === 'cours' ? 'var(--primary)' : 'var(--text-gray)', borderBottom: activeTab === 'cours' ? '2px solid var(--primary)' : 'none', paddingBottom: '12px', marginBottom: activeTab === 'cours' ? '-1px' : '0', cursor: 'pointer', transition: 'all 0.2s' }}>En Cours (5)</div>
        <div 
          onClick={() => setActiveTab('terminees')}
          style={{ fontWeight: activeTab === 'terminees' ? 600 : 500, color: activeTab === 'terminees' ? 'var(--primary)' : 'var(--text-gray)', borderBottom: activeTab === 'terminees' ? '2px solid var(--primary)' : 'none', paddingBottom: '12px', marginBottom: activeTab === 'terminees' ? '-1px' : '0', cursor: 'pointer', transition: 'all 0.2s' }}>Terminées (142)</div>
        <div 
          onClick={() => setActiveTab('rejetees')}
          style={{ fontWeight: activeTab === 'rejetees' ? 600 : 500, color: activeTab === 'rejetees' ? 'var(--primary)' : 'var(--text-gray)', borderBottom: activeTab === 'rejetees' ? '2px solid var(--primary)' : 'none', paddingBottom: '12px', marginBottom: activeTab === 'rejetees' ? '-1px' : '0', cursor: 'pointer', transition: 'all 0.2s' }}>Rejetées (12)</div>
      </div>

      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', marginBottom: 0 }}>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Rechercher une demande..." />
          </div>
        </div>

        {activeTab === 'attente' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Demande</th>
                  <th>Département</th>
                  <th>Propriétaire</th>
                  <th>Soumission</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="user-cell">
                      <div className="icon-box" style={{ background: '#F3E8FF', color: '#9333EA' }}>
                        <i className="fas fa-file-invoice"></i>
                      </div>
                      <div>
                        <span className="user-info-name">Attestation de Salaire</span>
                        <span className="user-info-sub">PDF • Demande urgente</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="dept-pill" style={{ background: '#EFF6FF', color: '#2563EB' }}>Opérations</span></td>
                  <td>
                    <div className="user-cell">
                      <img src="https://ui-avatars.com/api/?name=John+Davis&background=0D9488&color=fff" alt="User" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.85rem' }}>John Davis</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>Il y a 2h</td>

                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button onClick={() => setIsDetailsModalOpen(true)} className="modern-action-btn" title="Voir les détails"><i className="far fa-eye"></i></button>
                      <button className="modern-action-btn" title="Approuver" onClick={onApprove}><i className="fas fa-check"></i></button>
                      <button className="modern-action-btn" title="Rejeter" onClick={onReject}><i className="fas fa-times"></i></button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="user-cell">
                      <div className="icon-box" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                        <i className="fas fa-file-contract"></i>
                      </div>
                      <div>
                        <span className="user-info-name">Attestation de Travail</span>
                        <span className="user-info-sub">Document RH</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="dept-pill" style={{ background: '#CCFBF1', color: '#0D9488' }}>Conformité</span></td>
                  <td>
                    <div className="user-cell">
                      <img src="https://ui-avatars.com/api/?name=Maria+Chen&background=10B981&color=fff" alt="User" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.85rem' }}>Maria Chen</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>Il y a 5h</td>

                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button onClick={() => setIsDetailsModalOpen(true)} className="modern-action-btn" title="Voir les détails"><i className="far fa-eye"></i></button>
                      <button className="modern-action-btn" title="Approuver" onClick={onApprove}><i className="fas fa-check"></i></button>
                      <button className="modern-action-btn" title="Rejeter" onClick={onReject}><i className="fas fa-times"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              currentPage={pageAttente}
              totalItems={TOTAL_ATTENTE}
              itemsPerPage={5}
              onPageChange={setPageAttente}
            />
          </div>
        )}

        {activeTab === 'cours' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Demande</th>
                  <th>Propriétaire</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="user-cell">
                      <div className="icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                        <i className="fas fa-laptop-code"></i>
                      </div>
                      <div>
                        <span className="user-info-name">Renouvellement Matériel</span>
                        <span className="user-info-sub">Équipement IT</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      <img src="https://ui-avatars.com/api/?name=Lucas+Martin&background=F59E0B&color=fff" alt="User" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.85rem' }}>Lucas Martin</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', fontSize: '0.85rem' }}>

                      <i className="fas fa-spinner fa-spin" style={{ color: '#D97706' }}></i> Traitement manager
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button onClick={() => setIsDetailsModalOpen(true)} className="modern-action-btn" title="Voir les détails"><i className="far fa-eye"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              currentPage={pageCours}
              totalItems={TOTAL_COURS}
              itemsPerPage={5}
              onPageChange={setPageCours}
            />
          </div>
        )}

        {activeTab === 'terminees' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Demande</th>
                  <th>Propriétaire</th>
                  <th>Clôture</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="user-cell">
                      <div className="icon-box" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div>
                        <span className="user-info-name">Attestation de Travail</span>
                        <span className="user-info-sub">Clôturé avec succès</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="user-cell">
                      <img src="https://ui-avatars.com/api/?name=Emma+Wilson&background=2563EB&color=fff" alt="User" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.85rem' }}>Emma Wilson</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', fontSize: '0.85rem' }}>

                      <i className="fas fa-check-circle" style={{ color: '#16A34A' }}></i> Hier
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button onClick={() => setIsDetailsModalOpen(true)} className="modern-action-btn" title="Voir les détails"><i className="far fa-eye"></i></button>
                      <button className="modern-action-btn" title="Télécharger copie" onClick={() => handleExportDocument({
                        title: "Attestation de Travail",
                        owner: "Emma Wilson",
                        dept: "Opérations",
                        status: "Clôturé",
                        date: "Hier"
                      })}><i className="fas fa-download"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              currentPage={pageTerminees}
              totalItems={TOTAL_TERMINEES}
              itemsPerPage={5}
              onPageChange={setPageTerminees}
            />
          </div>
        )}

        {activeTab === 'rejetees' && (
          <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: 'var(--sidebar-bg)' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-blue)', color: 'var(--c-blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 20px' }}>
              <i className="fas fa-inbox"></i>
            </div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '8px', fontWeight: '600' }}>Aucune demande rejetée</h3>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 24px' }}>Toutes les demandes traitées récemment ont été approuvées ou sont encore en cours d'examen.</p>
            <button className="action-btn" onClick={() => setActiveTab('attente')} style={{ margin: '0 auto' }}>
              <i className="fas fa-arrow-left"></i> Retour aux demandes en attente
            </button>
          </div>
        )}
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
        {/* We use a custom footer inside the content for better design control */}
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>Attestation de Travail</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="filter-tag blue" style={{ padding: '2px 10px', fontSize: '0.7rem' }}>RH DOCUMENT</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Ref: #RQ-8842</span>
                </div>
              </div>
            </div>
            <span className="modern-status-badge badge-warning" style={{ padding: '6px 16px', fontSize: '0.75rem' }}>En Attente</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div className="detail-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <User size={14} color="var(--primary)" />
                <span className="detail-label">Demandeur</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>JD</div>
                <span className="detail-value" style={{ fontSize: '0.9rem' }}>John Davis</span>
              </div>
            </div>

            <div className="detail-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertTriangle size={14} color="var(--c-orange)" />
                <span className="detail-label">Priorité</span>
              </div>
              <span className="detail-value" style={{ fontSize: '0.9rem', color: 'var(--warning)' }}>Haute (Urgent)</span>
            </div>

            <div className="detail-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Calendar size={14} color="var(--success)" />
                <span className="detail-label">Date Soumise</span>
              </div>
              <span className="detail-value" style={{ fontSize: '0.9rem' }}>14 Nov 2026</span>
            </div>

            <div className="detail-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Clock size={14} color="var(--text-gray)" />
                <span className="detail-label">Délai Estimé</span>
              </div>
              <span className="detail-value" style={{ fontSize: '0.9rem' }}>24 Heures</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button className="action-btn" onClick={onReject} style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger-bg)', backgroundColor: 'var(--danger-bg)', height: '44px' }}>
              <i className="fas fa-times"></i> Rejeter
            </button>
            <button className="action-btn primary" onClick={onApprove} style={{ flex: 2, justifyContent: 'center', background: 'var(--success)', borderColor: 'var(--success)', height: '44px' }}>
              <CheckCircle2 size={18} style={{ marginRight: '8px' }} /> Approuver la demande
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Requests;
