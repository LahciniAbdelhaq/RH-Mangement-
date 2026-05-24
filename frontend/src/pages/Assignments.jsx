import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { logSystemActivity } from '../utils/rbac';

const DEPARTMENTS = ['Ingénierie', 'Marketing', 'Finance', 'Ressources Humaines', 'Commercial', 'Direction'];

const MOCK_EMPLOYEES = [
  { id: 1, name: 'Ali Benali', email: 'ali.benali@rh.ma', poste: 'Développeur Senior', dept: 'Ingénierie', assignedSince: '2024-01-15', status: 'Actif' },
  { id: 2, name: 'Sara Hamidi', email: 'sara.hamidi@rh.ma', poste: 'Chef de Projet Marketing', dept: 'Marketing', assignedSince: '2023-06-01', status: 'Actif' },
  { id: 3, name: 'Karim Ouali', email: 'karim.ouali@rh.ma', poste: 'Analyste Financier', dept: 'Finance', assignedSince: '2024-03-20', status: 'Actif' },
  { id: 4, name: 'Nadia Benmoussa', email: 'nadia.benmoussa@rh.ma', poste: 'Ingénieure QA', dept: 'Ingénierie', assignedSince: '2025-01-10', status: 'Actif' },
  { id: 5, name: 'Youssef Tazi', email: 'youssef.tazi@rh.ma', poste: 'Chargé RH', dept: 'Ressources Humaines', assignedSince: '2023-09-01', status: 'Actif' },
  { id: 6, name: 'Imane Chraibi', email: 'imane.chraibi@rh.ma', poste: 'Commercial Senior', dept: 'Commercial', assignedSince: '2024-07-01', status: 'Actif' },
];

const DEPT_COLORS = {
  'Ingénierie':         '#2563EB',
  'Marketing':          '#7C3AED',
  'Finance':            '#059669',
  'Ressources Humaines':'#DC2626',
  'Commercial':         '#D97706',
  'Direction':          '#0F172A',
};

export default function Assignments() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [activeDept, setActiveDept] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const [editForm, setEditForm] = useState({ dept: '', poste: '' });
  const handleEditChange = e => setEditForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openEdit = (emp) => {
    setSelectedEmp(emp);
    setEditForm({ dept: emp.dept, poste: emp.poste });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    setEmployees(prev => prev.map(e =>
      e.id === selectedEmp.id ? { ...e, dept: editForm.dept, poste: editForm.poste, assignedSince: new Date().toISOString().split('T')[0] } : e
    ));
    logSystemActivity('Modification Affectation', user?.name, `${selectedEmp.name} → ${editForm.dept} (${editForm.poste})`);
    showToast(t('assignments.toast.updated', { name: selectedEmp.name }), 'success');
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    setEmployees(prev => prev.filter(e => e.id !== selectedEmp.id));
    logSystemActivity('Suppression Affectation', user?.name, `Affectation de ${selectedEmp.name} supprimée`);
    showToast(t('assignments.toast.deleted', { name: selectedEmp.name }), 'success');
    setIsDeleteModalOpen(false);
  };

  const deptCounts = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = employees.filter(e => e.dept === dept).length;
    return acc;
  }, {});

  const filtered = employees
    .filter(e => activeDept === 'all' || e.dept === activeDept)
    .filter(e => !searchTerm || e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.poste.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1><i className="fas fa-sitemap" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
            {t('assignments.title')}
          </h1>
          <p>{t('assignments.subtitle')}</p>
        </div>
      </header>

      {/* Dept Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {DEPARTMENTS.map(dept => {
          const color = DEPT_COLORS[dept] || 'var(--primary)';
          const count = deptCounts[dept] || 0;
          return (
            <div key={dept} className="card" onClick={() => { setActiveDept(dept === activeDept ? 'all' : dept); setPage(1); }}
              style={{ padding: '14px', cursor: 'pointer', borderTop: `3px solid ${color}`, transition: 'all 0.2s', transform: activeDept === dept ? 'scale(1.02)' : 'scale(1)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>{count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '2px' }}>{dept}</div>
              <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: color, opacity: 0.3, marginTop: '8px' }}></div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">{t('assignments.listTitle')}</h3>
          <div className="filter-group">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder={t('common.search', 'Rechercher...')} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
            </div>
            <button className={`filter-pill ${activeDept === 'all' ? 'filter-pill-blue' : ''}`} onClick={() => setActiveDept('all')}>{t('assignments.allDepts')}</button>
          </div>
        </div>
        <div className="table-container table-responsive">
          <table>
            <thead>
              <tr>
                <th>{t('assignments.table.employee')}</th>
                <th>{t('assignments.table.email')}</th>
                <th>{t('assignments.table.position')}</th>
                <th>{t('assignments.table.department')}</th>
                <th>{t('assignments.table.since')}</th>
                <th>{t('assignments.table.status')}</th>
                <th>{t('assignments.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>{t('assignments.table.noData')}</td></tr>
              ) : paginated.map(emp => {
                const deptColor = DEPT_COLORS[emp.dept] || 'var(--primary)';
                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={`https://ui-avatars.com/api/?name=${emp.name.replace(/\s+/g, '+')}&background=2563EB&color=fff&size=32`} alt={emp.name}
                          style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-gray)' }}>{emp.email}</td>
                    <td style={{ fontSize: '0.85rem' }}>{emp.poste}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: deptColor, backgroundColor: deptColor + '18', border: `1px solid ${deptColor}30` }}>
                        {emp.dept}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{emp.assignedSince}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#10B981', backgroundColor: '#ECFDF5' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(emp)}
                          style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => { setSelectedEmp(emp); setIsDeleteModalOpen(true); }}
                          style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        title={t('assignments.modal.editTitle', { name: selectedEmp?.name })}
        icon="fas fa-edit" iconColor="#2563EB" iconBg="#EFF6FF"
        submitColor="#2563EB" onSubmit={handleSaveEdit} submitText={t('assignments.modal.saveBtn')}
        isSubmitDisabled={!editForm.dept || !editForm.poste}>
        <form onSubmit={e => { e.preventDefault(); handleSaveEdit(); }}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-building" style={{ color: 'var(--c-purple)' }}></i> {t('assignments.modal.department')}
            </label>
            <select name="dept" className="form-input" value={editForm.dept} onChange={handleEditChange}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-briefcase" style={{ color: 'var(--c-blue)' }}></i> {t('assignments.modal.position')}
            </label>
            <input type="text" name="poste" className="form-input" value={editForm.poste} onChange={handleEditChange} placeholder={t('assignments.modal.positionPlaceholder')} />
          </div>
          <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '12px 16px', fontSize: '0.85rem', color: '#92400E', fontWeight: 500 }}>
            <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
            {t('assignments.modal.dateNote')}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {selectedEmp && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}
          title={t('assignments.modal.deleteTitle')} icon="fas fa-trash" iconColor="#EF4444" iconBg="#FEF2F2"
          submitColor="#EF4444" onSubmit={handleDelete} submitText={t('assignments.modal.deleteBtn')}>
          <p style={{ color: 'var(--text-dark)', margin: 0, lineHeight: 1.6 }}>
            {t('assignments.modal.deleteDesc', { name: selectedEmp?.name })}
            <br /><span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{t('assignments.modal.deleteWarn')}</span>
          </p>
        </Modal>
      )}
    </motion.div>
  );
}
