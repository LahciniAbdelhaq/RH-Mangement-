import React, { useState } from 'react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { User, Mail, Briefcase, Building2, Calendar, Phone, ShieldCheck, AlertTriangle } from 'lucide-react';

const Employees = () => {
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleAction = (type, employee) => {
    setSelectedEmployee(employee);
    if (type === 'view') setIsViewModalOpen(true);
    if (type === 'edit') setIsEditModalOpen(true);
    if (type === 'delete') setIsDeleteModalOpen(true);
  };

  const onAddSubmit = () => {
    showToast('Employé ajouté avec succès !', 'success');
    setIsAddModalOpen(false);
  };

  const onEditSubmit = () => {
    showToast('Profil mis à jour !', 'success');
    setIsEditModalOpen(false);
  };

  const onDeleteSubmit = () => {
    showToast('L\'employé a été retiré du système.', 'error');
    setIsDeleteModalOpen(false);
  };

  const employeesData = [
    { name: "Emma Wilson", email: "emma.w@company.com", role: "Chef de Produit Senior", type: "Temps plein", dept: "Produit", date: "15 Jan, 2024", status: "Actif", initials: "EW", bg: "#2563EB" },
    { name: "David Chen", email: "david.c@entreprise.com", role: "Développeur Frontend", type: "Temps plein", dept: "Ingénierie", date: "01 Mar, 2025", status: "Actif", initials: "DC", bg: "#10B981" },
    { name: "Sarah Miller", email: "sarah.m@entreprise.com", role: "Analyste Financière", type: "Temps partiel", dept: "Finance", date: "10 Nov, 2023", status: "En Congé", initials: "SM", bg: "#F59E0B" },
    { name: "Marcus Rowe", email: "marcus.r@entreprise.com", role: "Généraliste RH", type: "Temps plein", dept: "RH", date: "20 Oct, 2026", status: "Intégration", initials: "MR", bg: "#9333EA" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1>Annuaire des Employés</h1>
          <p>Gérez votre personnel, mettez à jour les profils et suivez les statuts</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={() => setIsAddModalOpen(true)}>
            <i className="fas fa-user-plus"></i> Ajouter un employé
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card blue-card">
          <div className="stat-header">
            <div className="stat-icon primary"><i className="fas fa-users"></i></div>
          </div>
          <div className="stat-value">452</div>
          <div className="stat-label">Employés Actifs</div>
        </div>
        <div className="stat-card purple-card">
          <div className="stat-header">
            <div className="stat-icon success" style={{ background: '#E0E7FF', color: '#4F46E5' }}><i className="fas fa-user-plus"></i></div>
          </div>
          <div className="stat-value">24</div>
          <div className="stat-label">Intégration</div>
        </div>
        <div className="stat-card amber-card">
          <div className="stat-header">
            <div className="stat-icon warning"><i className="fas fa-umbrella-beach"></i></div>
          </div>
          <div className="stat-value">12</div>
          <div className="stat-label">En Congé</div>
        </div>
        <div className="stat-card emerald-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#F3E8FF', color: '#9333EA' }}><i className="fas fa-building"></i></div>
          </div>
          <div className="stat-value">8</div>
          <div className="stat-label">Départements</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">Annuaire des Employés</h3>
          <div className="filter-group">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Rechercher par nom, rôle..." />
            </div>
            <button className="filter-pill filter-pill-blue">Dép: Ingénierie</button>
            <button className="filter-pill filter-pill-green">Statut: Actif</button>
          </div>
        </div>

        <div className="table-container table-responsive">
          <table>
            <thead>
              <tr>
                <th>Employé</th>
                <th>Poste / Rôle</th>
                <th>Département</th>
                <th>Date d'arrivée</th>
                <th>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeesData.map((emp, i) => (
                <tr key={i}>
                  <td>
                    <div className="user-cell">
                      {emp.initials === "EW" || emp.initials === "SM" ? (
                        <img src={`https://ui-avatars.com/api/?name=${emp.name}&background=${emp.bg.replace('#','')}&color=fff`} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      ) : (
                        <div className="avatar-initials" style={{ background: emp.bg }}>{emp.initials}</div>
                      )}
                      <div>
                        <span className="user-info-name">{emp.name}</span>
                        <span className="user-info-sub">{emp.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{emp.role}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>{emp.type}</div>
                  </td>
                  <td><span className="dept-pill" style={{ background: '#EFF6FF', color: '#2563EB' }}>{emp.dept}</span></td>
                  <td style={{ color: '#64748B' }}>{emp.date}</td>
                  <td><span className={`modern-status-badge ${emp.status === 'Actif' ? 'badge-success' : emp.status === 'En Congé' ? 'badge-warning' : 'badge-info'}`}>{emp.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button className="modern-action-btn" onClick={() => handleAction('view', emp)}><i className="far fa-eye"></i></button>
                      <button className="modern-action-btn" onClick={() => handleAction('edit', emp)}><i className="far fa-edit"></i></button>
                      <button className="modern-action-btn" onClick={() => handleAction('delete', emp)}><i className="far fa-trash-alt"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="pagination-bar">
          <span className="pagination-info">Affichage 1 à 4 sur 452 entrées</span>
          <div className="pagination-controls">
            <button className="pagination-btn">Précédent</button>
            <button className="pagination-btn page-num active">1</button>
            <button className="pagination-btn page-num">2</button>
            <div className="pagination-ellipsis">...</div>
            <button className="pagination-btn page-num">113</button>
            <button className="pagination-btn">Suivant</button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Nouveau Collaborateur"
        icon="fas fa-user-plus"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        <form style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="var(--primary)" /> Prénom
              </label>
              <input type="text" className="form-input" placeholder="Jean" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="var(--primary)" /> Nom
              </label>
              <input type="text" className="form-input" placeholder="Dupont" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={12} color="var(--c-purple)" /> Email
              </label>
              <input type="email" className="form-input" placeholder="jean.d@comp.com" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={12} color="var(--c-orange)" /> Poste
              </label>
              <input type="text" className="form-input" placeholder="Designer" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={12} color="var(--success)" /> Département
              </label>
              <select className="form-input">
                <option>Ingénierie</option>
                <option>Marketing</option>
                <option>RH</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="var(--c-blue)" /> Contrat
              </label>
              <select className="form-input">
                <option>CDI</option>
                <option>CDD</option>
                <option>Freelance</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="action-btn primary" style={{ flex: 2, height: '42px' }} onClick={onAddSubmit}>Créer le profil</button>
            <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsAddModalOpen(false)}>Annuler</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Détails de l'employé"
        icon="far fa-eye"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        {selectedEmployee && (
          <div style={{ padding: '0' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: selectedEmployee.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, margin: '0 auto 12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', border: '3px solid var(--main-bg)' }}>
                {selectedEmployee.initials}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '2px' }}>{selectedEmployee.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span className="filter-tag blue" style={{ padding: '2px 10px', fontSize: '0.65rem' }}>{selectedEmployee.role}</span>
                <span className="modern-status-badge badge-success" style={{ padding: '2px 10px', fontSize: '0.65rem' }}>{selectedEmployee.status}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div className="detail-box" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Mail size={12} color="var(--primary)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>Email Professionnel</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedEmployee.email}</span>
              </div>

              <div className="detail-box" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Building2 size={12} color="var(--c-purple)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>Département</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedEmployee.dept}</span>
              </div>

              <div className="detail-box" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShieldCheck size={12} color="var(--c-orange)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>ID Employé</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>#EMP-00{selectedEmployee.id}</span>
              </div>

              <div className="detail-box" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Calendar size={12} color="var(--success)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>Embauche</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>15 Jan 2024</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn primary" style={{ flex: 1, justifyContent: 'center', height: '40px', fontSize: '0.85rem' }} onClick={() => { showToast('Email de contact envoyé !', 'info'); setIsViewModalOpen(false); }}>
                Contacter
              </button>
              <button className="action-btn" style={{ flex: 1, justifyContent: 'center', height: '40px', fontSize: '0.85rem' }} onClick={() => setIsViewModalOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Modifier le Profil"
        icon="far fa-edit"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        {selectedEmployee && (
          <form style={{ padding: '4px 0' }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="var(--primary)" /> Nom Complet
              </label>
              <input type="text" className="form-input" defaultValue={selectedEmployee.name} />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={12} color="var(--c-purple)" /> Email Professionnel
              </label>
              <input type="email" className="form-input" defaultValue={selectedEmployee.email} />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={12} color="var(--c-orange)" /> Poste Actuel
              </label>
              <input type="text" className="form-input" defaultValue={selectedEmployee.role} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="action-btn primary" style={{ flex: 2, height: '42px' }} onClick={onEditSubmit}>Sauvegarder les modifications</button>
              <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsEditModalOpen(false)}>Annuler</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Supprimer définitivement"
        icon="fas fa-trash-alt"
        iconColor="var(--danger)"
        iconBg="var(--danger-bg)"
        showFooter={false}
      >
        {selectedEmployee && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 16px' }}>
              <AlertTriangle size={30} />
            </div>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: '8px', fontWeight: 700 }}>Êtes-vous absolument sûr ?</h4>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Cette action supprimera le profil de <strong>{selectedEmployee.name}</strong>. Cette opération est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn" style={{ flex: 1, height: '42px', backgroundColor: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }} onClick={onDeleteSubmit}>
                Oui, supprimer
              </button>
              <button className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsDeleteModalOpen(false)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Employees;
