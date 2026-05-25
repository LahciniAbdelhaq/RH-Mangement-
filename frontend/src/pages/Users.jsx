import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { User, Mail, ShieldCheck, Key, Lock, AlertTriangle } from 'lucide-react';
import { MOROCCAN_CITIES } from '../utils/cities';
import { employeApi } from '../services/api';

const Users = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 5;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'EMPLOYEE', password: '', jobTitle: '', department: '', phone: '', hireDate: '', contractType: '', location: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', jobTitle: '', department: '', phone: '', hireDate: '', contractType: '', location: '' });

  const ROLE_COLORS = { HR_MANAGER: '#2563EB', HR_AGENT: '#10B981', DEPARTMENT_MANAGER: '#F59E0B', SECRETARY_GENERAL: '#DB2777', EMPLOYEE: '#9333EA' };
  const SYMFONY_TO_FRONTEND = { ROLE_ADMIN_RH: 'HR_MANAGER', ROLE_AGENT_RH: 'HR_AGENT', ROLE_CHEF_SERVICE: 'DEPARTMENT_MANAGER', ROLE_SECRETAIRE_GENERALE: 'SECRETARY_GENERAL', ROLE_EMPLOYE: 'EMPLOYEE' };
  const normaliseEmp = (e) => {
    const name = `${e.prenom ?? ''} ${e.nom ?? ''}`.trim();
    const roles = e.user?.roles ?? ['ROLE_EMPLOYE'];
    const priorityRoles = ['ROLE_ADMIN_RH','ROLE_SECRETAIRE_GENERALE','ROLE_AGENT_RH','ROLE_CHEF_SERVICE','ROLE_EMPLOYE'];
    const topRole = priorityRoles.find(r => roles.includes(r)) ?? 'ROLE_EMPLOYE';
    const role = SYMFONY_TO_FRONTEND[topRole] ?? 'EMPLOYEE';
    const bg = ROLE_COLORS[role] ?? '#2563EB';
    return {
      id: e.id,
      name,
      email: e.user?.email ?? '',
      role,
      status: e.statut === 'ACTIF' ? 'Actif' : 'Inactif',
      lastLogin: '—',
      initials: name.split(' ').map(n => n[0] ?? '').join('').substring(0, 2).toUpperCase(),
      bg,
      jobTitle: e.poste ?? '',
      department: e.service?.nom ?? '',
      phone: e.telephone ?? '',
      hireDate: e.dateRecrutement ? e.dateRecrutement.substring(0, 10) : '',
      contractType: '',
      location: e.adresse ?? '',
    };
  };

  const [users, setUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    employeApi.list()
      .then(r => setUsers((r.data?.data ?? r.data ?? []).map(normaliseEmp)))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginated = filteredUsers.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const roleLabels = {
    'HR_MANAGER': 'Administrateur RH',
    'HR_AGENT': 'Agent RH',
    'DEPARTMENT_MANAGER': 'Chef de Service',
    'INTERIM_MANAGER': 'Chef de Service (Int.)',
    'EMPLOYEE': 'Employé',
    'SECRETARY_GENERAL': 'Secrétaire Générale'
  };

  const handleToggleStatus = async (userId) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    const newStatut = userToUpdate.status === 'Actif' ? 'INACTIF' : 'ACTIF';
    try {
      await employeApi.update(userId, { statut: newStatut });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: u.status === 'Actif' ? 'Inactif' : 'Actif' } : u
      ));
      showToast(t('users.toast.updated', { name: userToUpdate.name }), 'success');
    } catch { showToast('Erreur mise à jour statut', 'error'); }
  };

  const handleAction = (type, user) => {
    setSelectedUser(user);
    if (type === 'view') setIsViewModalOpen(true);
    if (type === 'edit') {
      setEditForm({ 
        name: user.name, email: user.email, role: user.role,
        jobTitle: user.jobTitle || '', department: user.department || '', phone: user.phone || '',
        hireDate: user.hireDate || '', contractType: user.contractType || '', location: user.location || ''
      });
      setIsEditModalOpen(true);
    }
    if (type === 'delete') setIsDeleteModalOpen(true);
  };

  const FRONTEND_TO_SYMFONY = { HR_MANAGER: 'ROLE_ADMIN_RH', HR_AGENT: 'ROLE_AGENT_RH', DEPARTMENT_MANAGER: 'ROLE_CHEF_SERVICE', SECRETARY_GENERAL: 'ROLE_SECRETAIRE_GENERALE', EMPLOYEE: 'ROLE_EMPLOYE' };
  const onAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const nameParts = addForm.name.trim().split(' ');
      const prenom = nameParts[0] ?? '';
      const nom = nameParts.slice(1).join(' ') || prenom;
      const symRole = FRONTEND_TO_SYMFONY[addForm.role] ?? 'ROLE_EMPLOYE';
      const payload = { prenom, nom, email: addForm.email, poste: addForm.jobTitle, telephone: addForm.phone, adresse: addForm.location, statut: 'ACTIF', password: addForm.password, roles: [symRole] };
      if (addForm.hireDate) payload.dateRecrutement = addForm.hireDate;
      const r = await employeApi.create(payload);
      const newUser = normaliseEmp(r.data?.data ?? r.data);
      setUsers(prev => [newUser, ...prev]);
      showToast(t('users.toast.created', { name: newUser.name }), 'success');
      setIsAddModalOpen(false);
      setAddForm({ name: '', email: '', role: 'EMPLOYEE', password: '', jobTitle: '', department: '', phone: '', hireDate: '', contractType: '', location: '' });
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de la création', 'error');
    }
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const nameParts = editForm.name.trim().split(' ');
      const prenom = nameParts[0] ?? '';
      const nom = nameParts.slice(1).join(' ') || prenom;
      const payload = { prenom, nom, poste: editForm.jobTitle, telephone: editForm.phone, adresse: editForm.location };
      if (editForm.hireDate) payload.dateRecrutement = editForm.hireDate;
      const r = await employeApi.update(selectedUser.id, payload);
      const updated = normaliseEmp(r.data?.data ?? r.data);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
      showToast(t('users.toast.updated', { name: editForm.name }), 'success');
      setIsEditModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de la mise à jour', 'error');
    }
  };

  const onDeleteSubmit = async () => {
    try {
      await employeApi.delete(selectedUser.id);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      showToast(t('users.toast.deleted'), 'error');
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de la suppression', 'error');
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1>{t('users.title')}</h1>
          <p>{t('users.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={() => setIsAddModalOpen(true)}>
            <i className="fas fa-user-plus"></i> {t('users.addBtn')}
          </button>
        </div>
      </header>

      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">{t('users.tableTitle')}</h3>
          <div className="filter-group">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder={t('users.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button className="filter-pill filter-pill-blue">{t('users.allRoles')}</button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('users.table.user')}</th>
                <th>{t('users.table.role')}</th>
                <th>{t('users.table.phone')}</th>
                <th>{t('users.table.lastLogin')}</th>
                <th>{t('users.table.status')}</th>
                <th style={{ textAlign: 'center' }}>{t('users.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                    {t('users.table.noData')}
                  </td>
                </tr>
              ) : paginated.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.75rem' }}>
                        {u.initials}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="user-info-name" style={{ fontWeight: 600 }}>{u.name}</span>
                        <span className="user-info-sub">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                      <span className="dept-pill" style={{ background: '#F3E8FF', color: '#9333EA', fontWeight: 600 }}>{roleLabels[u.role] || u.role}</span>
                      <span style={{ color: 'var(--text-gray)', fontSize: '0.75rem', fontWeight: 500 }}>{u.department || '-'}</span>
                    </div>
                  </td>
                  <td><span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{u.phone || '-'}</span></td>
                  <td><span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{u.lastLogin}</span></td>
                  <td>
                    <span 
                      onClick={() => handleToggleStatus(u.id)}
                      className={`modern-status-badge ${u.status === 'Actif' ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}
                      title="Cliquez pour changer le statut"
                      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      {u.status === 'Actif' ? t('users.status.active') : t('users.status.inactive')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => handleAction('view', u)}
                        style={{ background: 'var(--primary-bg)', color: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>
                        <i className="fas fa-eye"></i>
                      </button>
                      <button onClick={() => handleAction('edit', u)}
                        style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleAction('delete', u)}
                        style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage} 
          totalItems={filteredUsers.length} 
          itemsPerPage={PER_PAGE} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('users.modal.addTitle')} icon="fas fa-user-plus" iconColor="var(--primary)" iconBg="var(--primary-bg)" showFooter={false}>
        <form onSubmit={onAddSubmit} style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} color="var(--primary)"/> {t('users.modal.fullName')}</label>
              <input type="text" className="form-input" required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="Jean Dupont" />
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} color="var(--c-purple)"/> {t('users.modal.email')}</label>
              <input type="email" className="form-input" required value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} placeholder="jean@entreprise.com" />
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} color="var(--c-orange)"/> {t('users.modal.systemRole')}</label>
              <select className="form-input" value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value})}>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-briefcase" style={{ color: 'var(--c-blue)' }}></i> Titre / Poste</label>
              <select className="form-input" value={addForm.jobTitle} onChange={e => setAddForm({...addForm, jobTitle: e.target.value})}>
                <option value="">Sélectionner...</option>
                <option value="Directeur">Directeur</option>
                <option value="Manager">Manager</option>
                <option value="Ingénieur">Ingénieur</option>
                <option value="Développeur">Développeur</option>
                <option value="Designer">Designer</option>
                <option value="Agent RH">Agent RH</option>
                <option value="Assistant(e)">Assistant(e)</option>
                <option value="Technicien">Technicien</option>
                <option value="Consultant">Consultant</option>
                <option value="Comptable">Comptable</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-building" style={{ color: 'var(--c-purple)' }}></i> {t('users.modal.department')}</label>
              <input type="text" className="form-input" value={addForm.department} onChange={e => setAddForm({...addForm, department: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-phone" style={{ color: 'var(--c-blue)' }}></i> {t('users.modal.phone')}</label>
              <input type="text" className="form-input" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-calendar-alt" style={{ color: 'var(--c-orange)' }}></i> {t('users.modal.hireDate')}</label>
              <input type="date" className="form-input" value={addForm.hireDate} onChange={e => setAddForm({...addForm, hireDate: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-file-contract" style={{ color: 'var(--c-teal)' }}></i> {t('users.modal.contract')}</label>
              <select className="form-input" value={addForm.contractType} onChange={e => setAddForm({...addForm, contractType: e.target.value})}>
                <option value="">Sélectionner...</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Anapec">Anapec</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-map-marker-alt" style={{ color: 'var(--text-gray)' }}></i> {t('users.modal.location')}</label>
              <select className="form-input" value={addForm.location} onChange={e => setAddForm({...addForm, location: e.target.value})}>
                <option value="">Sélectionner...</option>
                {MOROCCAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '10px', gridColumn: 'span 3' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Key size={14} color="var(--success)"/> {t('users.modal.tempPassword')}</label>
              <input type="password" className="form-input" required value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} placeholder="••••••••" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="action-btn primary" disabled={!addForm.name || !addForm.email || !addForm.password} style={{ flex: 2, height: '42px', opacity: (!addForm.name || !addForm.email || !addForm.password) ? 0.5 : 1, cursor: (!addForm.name || !addForm.email || !addForm.password) ? 'not-allowed' : 'pointer' }}>{t('users.modal.createBtn')}</button>
            <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsAddModalOpen(false)}>{t('users.modal.cancelBtn')}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('users.modal.editTitle')} icon="fas fa-edit" iconColor="var(--c-blue)" iconBg="var(--bg-blue)" showFooter={false}>
        {selectedUser && (
          <form onSubmit={onEditSubmit} style={{ padding: '4px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} color="var(--primary)"/> {t('users.modal.fullName')}</label>
                <input type="text" className="form-input" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} color="var(--c-purple)"/> {t('users.modal.email')}</label>
                <input type="email" className="form-input" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} color="var(--c-orange)"/> {t('users.modal.systemRole')}</label>
                <select className="form-input" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-briefcase" style={{ color: 'var(--c-blue)' }}></i> Titre / Poste</label>
                <select className="form-input" value={editForm.jobTitle} onChange={e => setEditForm({...editForm, jobTitle: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  <option value="Directeur">Directeur</option>
                  <option value="Manager">Manager</option>
                  <option value="Ingénieur">Ingénieur</option>
                  <option value="Développeur">Développeur</option>
                  <option value="Designer">Designer</option>
                  <option value="Agent RH">Agent RH</option>
                  <option value="Assistant(e)">Assistant(e)</option>
                  <option value="Technicien">Technicien</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Comptable">Comptable</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-building" style={{ color: 'var(--c-purple)' }}></i> {t('users.modal.department')}</label>
                <input type="text" className="form-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-phone" style={{ color: 'var(--c-blue)' }}></i> {t('users.modal.phone')}</label>
                <input type="text" className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-calendar-alt" style={{ color: 'var(--c-orange)' }}></i> {t('users.modal.hireDate')}</label>
                <input type="date" className="form-input" value={editForm.hireDate} onChange={e => setEditForm({...editForm, hireDate: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-file-contract" style={{ color: 'var(--c-teal)' }}></i> {t('users.modal.contract')}</label>
                <select className="form-input" value={editForm.contractType} onChange={e => setEditForm({...editForm, contractType: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Anapec">Anapec</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '10px', gridColumn: 'span 3' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fas fa-map-marker-alt" style={{ color: 'var(--text-gray)' }}></i> {t('users.modal.location')}</label>
                <select className="form-input" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {MOROCCAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="action-btn primary" disabled={!editForm.name || !editForm.email} style={{ flex: 2, height: '42px', opacity: (!editForm.name || !editForm.email) ? 0.5 : 1, cursor: (!editForm.name || !editForm.email) ? 'not-allowed' : 'pointer' }}>{t('users.modal.saveBtn')}</button>
              <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsEditModalOpen(false)}>{t('users.modal.cancelBtn')}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('users.modal.deleteTitle')} icon="fas fa-trash-alt" iconColor="var(--danger)" iconBg="var(--danger-bg)" showFooter={false}>
        {selectedUser && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 16px' }}>
              <AlertTriangle size={30} />
            </div>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: '8px', fontWeight: 700 }}>{t('users.modal.areYouSure')}</h4>
            <p 
              style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: t('users.modal.deleteWarning', { name: selectedUser.name }) }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn" style={{ flex: 1, height: '42px', backgroundColor: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }} onClick={onDeleteSubmit}>
                {t('users.modal.deleteBtn')}
              </button>
              <button className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsDeleteModalOpen(false)}>
                {t('users.modal.cancelBtn')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={t('users.modal.viewTitle')} icon="far fa-eye" iconColor="var(--primary)" iconBg="var(--primary-bg)" showFooter={false}>
        {selectedUser && (
          <div style={{ padding: '0' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: selectedUser.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, margin: '0 auto 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {selectedUser.initials}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '2px' }}>{selectedUser.name}</h3>
              {selectedUser.jobTitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', margin: '0 0 6px 0', fontWeight: 500 }}>{selectedUser.jobTitle}</p>}
              <span className="filter-tag purple" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>{roleLabels[selectedUser.role] || selectedUser.role}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div className="detail-box" style={{ padding: '6px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Mail size={10} color="var(--primary)" /> <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('users.modal.email')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedUser.email}</span>
              </div>
              <div className="detail-box" style={{ padding: '6px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <ShieldCheck size={10} color="var(--success)" /> <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('users.table.status')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem', color: selectedUser.status === 'Actif' ? 'var(--success)' : 'var(--danger)' }}>{selectedUser.status === 'Actif' ? t('users.status.active') : t('users.status.inactive')}</span>
              </div>
              <div className="detail-box" style={{ padding: '6px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <i className="fas fa-building" style={{ fontSize: '10px', color: 'var(--c-purple)' }}></i> <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('users.modal.department')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedUser.department || '-'}</span>
              </div>
              <div className="detail-box" style={{ padding: '6px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <i className="fas fa-phone" style={{ fontSize: '10px', color: 'var(--c-blue)' }}></i> <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('users.modal.phone')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedUser.phone || '-'}</span>
              </div>
              <div className="detail-box" style={{ padding: '6px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <i className="fas fa-calendar-alt" style={{ fontSize: '10px', color: 'var(--c-orange)' }}></i> <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('users.modal.hireDate')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedUser.hireDate || '-'}</span>
              </div>
              <div className="detail-box" style={{ padding: '6px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <i className="fas fa-file-contract" style={{ fontSize: '10px', color: 'var(--c-teal)' }}></i> <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('users.modal.contract')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedUser.contractType || '-'}</span>
              </div>
              <div className="detail-box" style={{ padding: '6px 10px', gridColumn: 'span 3' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <i className="fas fa-map-marker-alt" style={{ fontSize: '10px', color: 'var(--text-gray)' }}></i> <span className="detail-label" style={{ fontSize: '0.65rem' }}>{t('users.modal.location')}</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedUser.location || '-'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn primary" style={{ flex: 1, justifyContent: 'center', height: '40px' }} onClick={() => setIsViewModalOpen(false)}>
                {t('users.modal.closeBtn')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Users;
