import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { logSystemActivity } from '../utils/rbac';
import { User, Mail, Briefcase, Building2, Calendar, Phone, ShieldCheck, AlertTriangle } from 'lucide-react';
import { employeApi, serviceApi } from '../services/api';

const Employees = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { user, effectiveRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const AVATAR_COLORS = ['2563EB','10B981','F59E0B','9333EA','EF4444','0891B2','7C3AED','059669'];
  const normalise = (e) => {
    const nom = e.nom ?? '';
    const prenom = e.prenom ?? '';
    const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    const colorIdx = (e.id ?? 0) % AVATAR_COLORS.length;
    return {
      id: e.id,
      name: `${prenom} ${nom}`.trim(),
      nom,
      prenom,
      email: e.user?.email ?? '',
      role: e.poste ?? '',
      type: e.statut ?? 'ACTIF',
      dept: e.service?.nom ?? '',
      service_id: e.service?.id ?? '',
      date: e.dateRecrutement ? e.dateRecrutement.substring(0, 10) : '',
      status: e.statut === 'ACTIF' ? 'Actif' : e.statut === 'CONGE' ? 'En Congé' : e.statut ?? 'Actif',
      initials,
      bg: `#${AVATAR_COLORS[colorIdx]}`,
      matricule: e.matricule,
      grade: e.grade,
    };
  };

  const [services, setServices] = useState([]);
  useEffect(() => {
    employeApi.list()
      .then(r => setEmployees((r.data?.data ?? r.data ?? []).map(normalise)))
      .catch(() => showToast('Erreur chargement employés', 'error'))
      .finally(() => setLoadingList(false));
    serviceApi.list()
      .then(r => setServices(r.data?.data ?? r.data ?? []))
      .catch(() => {});
  }, []);

  const [addForm, setAddForm] = useState({ prenom: '', nom: '', email: '', poste: '', service_id: '', statut: 'ACTIF', password: '' });
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', poste: '', service_id: '' });

  // Evaluate RBAC permissions locally f the page
  const isHRManager = effectiveRole === 'HR_MANAGER';
  const isHRAgent = effectiveRole === 'HR_AGENT';
  const isDeptManager = effectiveRole === 'DEPARTMENT_MANAGER' || effectiveRole === 'INTERIM_MANAGER';

  const canCreate = isHRManager || isHRAgent;
  const canEdit = isHRManager || isHRAgent;
  const canDelete = isHRManager || isHRAgent;

  const handleAction = (type, employee) => {
    setSelectedEmployee(employee);
    if (type === 'view') setIsViewModalOpen(true);
    if (type === 'edit') {
      setEditForm({ nom: employee.nom, prenom: employee.prenom, poste: employee.role, service_id: employee.service_id ?? '' });
      setIsEditModalOpen(true);
    }
    if (type === 'delete') setIsDeleteModalOpen(true);
  };

  const onAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { nom: addForm.nom, prenom: addForm.prenom, email: addForm.email, poste: addForm.poste, statut: addForm.statut, password: addForm.password };
      if (addForm.service_id) payload.service_id = Number(addForm.service_id);
      const r = await employeApi.create(payload);
      const newEmp = normalise(r.data?.data ?? r.data);
      setEmployees(prev => [newEmp, ...prev]);
      showToast(`Employé ${addForm.prenom} ${addForm.nom} ajouté avec succès !`, 'success');
      logSystemActivity("Création d'employé", user?.name, `Création du profil: ${addForm.prenom} ${addForm.nom} (${addForm.poste})`);
      setIsAddModalOpen(false);
      setAddForm({ prenom: '', nom: '', email: '', poste: '', service_id: '', statut: 'ACTIF', password: '' });
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de la création', 'error');
    }
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { nom: editForm.nom, prenom: editForm.prenom, poste: editForm.poste };
      if (editForm.service_id) payload.service_id = Number(editForm.service_id);
      const r = await employeApi.update(selectedEmployee.id, payload);
      const updated = normalise(r.data?.data ?? r.data);
      setEmployees(prev => prev.map(emp => emp.id === selectedEmployee.id ? updated : emp));
      showToast('Profil mis à jour !', 'success');
      logSystemActivity("Modification d'employé", user?.name, `Modification de ${selectedEmployee.name} -> ${editForm.poste}`);
      setIsEditModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de la mise à jour', 'error');
    }
  };

  const onDeleteSubmit = async () => {
    try {
      await employeApi.delete(selectedEmployee.id);
      setEmployees(prev => prev.filter(e => e.id !== selectedEmployee.id));
      showToast('L\'employé a été retiré du système.', 'success');
      logSystemActivity("Suppression d'employé", user?.name, `Suppression de ${selectedEmployee.name}`);
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
    setIsDeleteModalOpen(false);
  };

  const filteredEmployees = employees.filter(emp => {
    if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !emp.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (isDeptManager) {
      // Must match exactly or match standard abbreviations
      const userDept = user?.dept?.toLowerCase() || '';
      const empDept = emp.dept.toLowerCase();
      // Match RH/Ressources Humaines, Ingénierie, Finance, etc.
      return empDept.includes(userDept) || userDept.includes(empDept);
    }
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1>{isDeptManager ? t('sidebar.myTeam') : t('employees.title')}</h1>
          <p>{isDeptManager ? "Visualisez et suivez les membres de votre département uniquement." : t('employees.subtitle')}</p>
        </div>
        <div className="header-actions">
          {canCreate && (
            <button className="action-btn primary" onClick={() => setIsAddModalOpen(true)}>
              <i className="fas fa-user-plus"></i> {t('employees.addEmployee')}
            </button>
          )}
        </div>
      </header>

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card blue-card">
          <div className="stat-header">
            <div className="stat-icon primary"><i className="fas fa-users"></i></div>
          </div>
          <div className="stat-value">{employees.filter(e => e.status === 'Actif').length}</div>
          <div className="stat-label">{t('employees.stats.active')}</div>
        </div>
        <div className="stat-card purple-card">
          <div className="stat-header">
            <div className="stat-icon success" style={{ background: '#E0E7FF', color: '#4F46E5' }}><i className="fas fa-user-plus"></i></div>
          </div>
          <div className="stat-value">{employees.filter(e => e.type === 'INTEGRATION').length}</div>
          <div className="stat-label">{t('employees.stats.onboarding')}</div>
        </div>
        <div className="stat-card amber-card">
          <div className="stat-header">
            <div className="stat-icon warning"><i className="fas fa-umbrella-beach"></i></div>
          </div>
          <div className="stat-value">{employees.filter(e => e.status === 'En Congé').length}</div>
          <div className="stat-label">{t('employees.stats.onLeave')}</div>
        </div>
        <div className="stat-card emerald-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#F3E8FF', color: '#9333EA' }}><i className="fas fa-building"></i></div>
          </div>
          <div className="stat-value">{new Set(employees.map(e => e.dept).filter(Boolean)).size}</div>
          <div className="stat-label">{t('employees.stats.departments')}</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">{isDeptManager ? `Membres - Département ${user?.dept}` : t('employees.title')}</h3>
          <div className="filter-group">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder={t('employees.filters.searchPlaceholder')} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            </div>
            <button className="filter-pill filter-pill-blue">{t('employees.filters.deptFilter')}</button>
            <button className="filter-pill filter-pill-green">{t('employees.filters.statusFilter')}</button>
          </div>
        </div>

        <div className="table-container table-responsive">
          <table>
            <thead>
              <tr>
                <th>{t('employees.table.employee')}</th>
                <th>{t('employees.table.role')}</th>
                <th>{t('employees.table.department')}</th>
                <th>{t('employees.table.hiredDate')}</th>
                <th>{t('employees.table.status')}</th>
                <th style={{ textAlign: 'center' }}>{t('employees.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingList && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-gray)' }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Chargement...
                </td></tr>
              )}
              {!loadingList && filteredEmployees.map((emp, i) => (
                <tr key={i}>
                  <td>
                    <div className="user-cell">
                      <img src={`https://ui-avatars.com/api/?name=${emp.name}&background=${emp.bg.replace('#','')}&color=fff`} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
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
                      <button className="modern-action-btn" onClick={() => handleAction('view', emp)} title={t('employees.table.view')}><i className="far fa-eye"></i></button>
                      
                      {canEdit && (
                        <button className="modern-action-btn" onClick={() => handleAction('edit', emp)} title={t('employees.table.edit')}><i className="far fa-edit"></i></button>
                      )}
                      
                      {canDelete && (
                        <button className="modern-action-btn" onClick={() => handleAction('delete', emp)} title={t('employees.table.delete')}><i className="far fa-trash-alt"></i></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loadingList && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-gray)' }}>
                    Aucun employé trouvé dans votre département.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage} 
          totalItems={filteredEmployees.length} 
          itemsPerPage={4} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Add Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title={t('employees.modals.addTitle')}
        icon="fas fa-user-plus"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        <form onSubmit={onAddSubmit} style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="var(--primary)" /> {t('employees.form.firstName')}
              </label>
              <input type="text" required value={addForm.prenom} onChange={(e) => setAddForm({ ...addForm, prenom: e.target.value })} className="form-input" placeholder="Ahmed" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} color="var(--primary)" /> {t('employees.form.lastName')}
              </label>
              <input type="text" required value={addForm.nom} onChange={(e) => setAddForm({ ...addForm, nom: e.target.value })} className="form-input" placeholder="Benali" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={12} color="var(--c-purple)" /> {t('employees.form.email')}
              </label>
              <input type="email" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="form-input" placeholder="ahmed@rh.ma" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={12} color="var(--c-orange)" /> {t('employees.form.role')}
              </label>
              <input type="text" required value={addForm.poste} onChange={(e) => setAddForm({ ...addForm, poste: e.target.value })} className="form-input" placeholder="Développeur" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={12} color="var(--success)" /> {t('employees.form.department')}
              </label>
              <select className="form-input" value={addForm.service_id} onChange={(e) => setAddForm({ ...addForm, service_id: e.target.value })}>
                <option value="">Sélectionner...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="var(--c-blue)" /> Mot de passe temporaire
              </label>
              <input type="password" required value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className="form-input" placeholder="••••••••" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="action-btn primary" disabled={!addForm.prenom || !addForm.nom || !addForm.email || !addForm.poste || !addForm.password} style={{ flex: 2, height: '42px', opacity: (!addForm.prenom || !addForm.nom || !addForm.email || !addForm.poste || !addForm.password) ? 0.5 : 1, cursor: (!addForm.prenom || !addForm.nom || !addForm.email || !addForm.poste || !addForm.password) ? 'not-allowed' : 'pointer' }}>{t('employees.form.createProfile')}</button>
            <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsAddModalOpen(false)}>{t('employees.form.cancel')}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title={t('employees.modals.viewTitle')}
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
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('employees.detail.email')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedEmployee.email}</span>
              </div>

              <div className="detail-box" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Building2 size={12} color="var(--c-purple)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('employees.detail.department')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedEmployee.dept}</span>
              </div>

              <div className="detail-box" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShieldCheck size={12} color="var(--c-orange)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('employees.detail.empId')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>#EMP-00{selectedEmployee.id}</span>
              </div>

              <div className="detail-box" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Calendar size={12} color="var(--success)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('employees.detail.hired')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedEmployee.date}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn primary" style={{ flex: 1, justifyContent: 'center', height: '40px', fontSize: '0.85rem' }} onClick={() => { showToast('Email de contact envoyé !', 'info'); setIsViewModalOpen(false); }}>
                {t('employees.detail.contact')}
              </button>
              <button className="action-btn" style={{ flex: 1, justifyContent: 'center', height: '40px', fontSize: '0.85rem' }} onClick={() => setIsViewModalOpen(false)}>
                {t('employees.detail.close')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={t('employees.modals.editTitle')}
        icon="far fa-edit"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        {selectedEmployee && (
          <form onSubmit={onEditSubmit} style={{ padding: '4px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} color="var(--primary)" /> {t('employees.form.firstName')}
                </label>
                <input type="text" className="form-input" required value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} color="var(--primary)" /> {t('employees.form.lastName')}
                </label>
                <input type="text" className="form-input" required value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={12} color="var(--c-orange)" /> {t('employees.form.role')}
                </label>
                <input type="text" className="form-input" required value={editForm.poste} onChange={(e) => setEditForm({ ...editForm, poste: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={12} color="var(--success)" /> {t('employees.form.department')}
                </label>
                <select className="form-input" value={editForm.service_id} onChange={(e) => setEditForm({ ...editForm, service_id: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="action-btn primary" disabled={!editForm.nom || !editForm.prenom || !editForm.poste} style={{ flex: 2, height: '42px', opacity: (!editForm.nom || !editForm.prenom || !editForm.poste) ? 0.5 : 1, cursor: (!editForm.nom || !editForm.prenom || !editForm.poste) ? 'not-allowed' : 'pointer' }}>{t('employees.form.saveChanges')}</button>
              <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsEditModalOpen(false)}>{t('employees.form.cancel')}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title={t('employees.modals.deleteTitle')}
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
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: '8px', fontWeight: 700 }}>{t('employees.delete.areYouSure')}</h4>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {t('employees.delete.confirmDescPre')} <strong>{selectedEmployee.name}</strong>. {t('employees.delete.confirmDescPost')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn" style={{ flex: 1, height: '42px', backgroundColor: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }} onClick={onDeleteSubmit}>
                {t('employees.delete.confirmBtn')}
              </button>
              <button className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsDeleteModalOpen(false)}>
                {t('employees.delete.cancelBtn')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Employees;
