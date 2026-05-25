import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { logSystemActivity } from '../utils/rbac';
import { absenceApi, employeApi } from '../services/api';

const TYPE_CONFIG = {
  'absence': { color: '#EF4444', bg: '#FEF2F2', icon: 'fas fa-user-times' },
  'late':    { color: '#F59E0B', bg: '#FFFBEB', icon: 'fas fa-clock' },
};
const STATUS_CONFIG = {
  'unjustified':      { color: '#EF4444', bg: '#FEF2F2' },
  'justified':        { color: '#10B981', bg: '#ECFDF5' },
  'justifiedMedical': { color: '#3B82F6', bg: '#EFF6FF' },
  'inProgress':       { color: '#F59E0B', bg: '#FFFBEB' },
};

const normaliseAbsence = (a) => ({
  id: a.id,
  idLabel: `ABS-${String(a.id).padStart(3, '0')}`,
  employee: a.employe ? `${a.employe.prenom ?? ''} ${a.employe.nom ?? ''}`.trim() : '',
  employe_id: a.employe?.id,
  dept: a.employe?.service?.nom ?? '',
  type: a.type === 'RETARD' ? 'late' : 'absence',
  date: a.dateDebut ? a.dateDebut.substring(0, 10) : '',
  hours: a.nbHeures ?? 8,
  reason: a.motif ?? '',
  justificatif: a.justificatif ?? null,
  status: a.statut === 'JUSTIFIEE' ? 'justified' : a.statut === 'INJUSTIFIEE' ? 'unjustified' : 'inProgress',
  warning: a.statut === 'INJUSTIFIEE' && a.type === 'ABSENCE',
});

export default function Absences() {
  const { user, effectiveRole } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [absences, setAbsences] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [employes, setEmployes] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAbs, setSelectedAbs] = useState(null);
  const [activeType, setActiveType] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const isDeptManager = effectiveRole === 'DEPARTMENT_MANAGER' || effectiveRole === 'INTERIM_MANAGER';
  const isHR = effectiveRole === 'HR_MANAGER' || effectiveRole === 'HR_AGENT';

  const [form, setForm] = useState({
    employe_id: '', type: 'ABSENCE', dateDebut: '', dateFin: '', motif: '', statut: 'INJUSTIFIEE'
  });
  const handleFormChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  useEffect(() => {
    absenceApi.list()
      .then(r => setAbsences((r.data?.data ?? r.data ?? []).map(normaliseAbsence)))
      .catch(() => showToast('Erreur chargement absences', 'error'))
      .finally(() => setLoadingList(false));
    if (isHR) {
      employeApi.list()
        .then(r => setEmployes(r.data?.data ?? r.data ?? []))
        .catch(() => {});
    }
  }, []);

  const handleCreate = async () => {
    if (!form.employe_id || !form.dateDebut || !form.dateFin) {
      showToast(t('absences.toast.missingFields'), 'warning');
      return;
    }
    try {
      const r = await absenceApi.create(form);
      const newAbs = normaliseAbsence(r.data?.data ?? r.data);
      setAbsences(prev => [newAbs, ...prev]);
      logSystemActivity('Enregistrement Absence', user?.name, `${form.type} enregistrée – ${form.dateDebut}`);
      showToast(t('absences.toast.recorded', { type: form.type === 'RETARD' ? 'retard' : 'absence' }), 'success');
      setIsCreateModalOpen(false);
      setForm({ employe_id: '', type: 'ABSENCE', dateDebut: '', dateFin: '', motif: '', statut: 'INJUSTIFIEE' });
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleUploadJustificatif = async (id) => {
    try {
      await absenceApi.update(id, { statut: 'JUSTIFIEE' });
      setAbsences(prev => prev.map(a =>
        a.id === id ? { ...a, justificatif: 'justificatif.pdf', status: 'justified', warning: false } : a
      ));
      showToast(t('absences.toast.justifAdded'), 'success');
    } catch {
      showToast('Erreur mise à jour', 'error');
    }
  };

  const typeFilters = ['all', 'absence', 'late'];
  const filtered = absences
    .filter(a => isDeptManager ? a.dept === user?.dept : true)
    .filter(a => activeType === 'all' || a.type === activeType);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalAbsences = absences.filter(a => a.type === 'absence').length;
  const totalRetards = absences.filter(a => a.type === 'late').length;
  const nonJustifiees = absences.filter(a => a.status === 'unjustified').length;
  const avecJustificatif = absences.filter(a => a.justificatif).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1><i className="fas fa-user-times" style={{ color: '#EF4444', marginRight: '10px' }}></i>
            {t('absences.title')}
          </h1>
          <p>{t('absences.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={() => setIsCreateModalOpen(true)}>
            <i className="fas fa-plus"></i> {t('absences.record')}
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card red-card">
          <div className="stat-header"><div className="stat-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}><i className="fas fa-user-times"></i></div></div>
          <div className="stat-value">{totalAbsences}</div>
          <div className="stat-label">{t('absences.totalAbsences')}</div>
        </div>
        <div className="stat-card amber-card">
          <div className="stat-header"><div className="stat-icon warning"><i className="fas fa-clock"></i></div></div>
          <div className="stat-value">{totalRetards}</div>
          <div className="stat-label">{t('absences.totalLate')}</div>
        </div>
        <div className="stat-card red-card">
          <div className="stat-header"><div className="stat-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}><i className="fas fa-exclamation-triangle"></i></div></div>
          <div className="stat-value">{nonJustifiees}</div>
          <div className="stat-label">{t('absences.unjustified')}</div>
        </div>
        <div className="stat-card emerald-card">
          <div className="stat-header"><div className="stat-icon success"><i className="fas fa-paperclip"></i></div></div>
          <div className="stat-value">{avecJustificatif}</div>
          <div className="stat-label">{t('absences.withDoc')}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">{t('absences.registry')}</h3>
          <div className="filter-group">
            {typeFilters.map(f => (
              <button key={f} className={`filter-pill ${activeType === f ? 'filter-pill-blue' : ''}`}
                onClick={() => { setActiveType(f); setPage(1); }}>{t(`absences.filters.${f}`)}</button>
            ))}
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('absences.table.ref')}</th>
                <th>{t('absences.table.employee')}</th>
                <th>{t('absences.table.department')}</th>
                <th>{t('absences.table.type')}</th>
                <th>{t('absences.table.date')}</th>
                <th>{t('absences.table.duration')}</th>
                <th>{t('absences.table.status')}</th>
                <th>{t('absences.table.warning')}</th>
                <th>{t('absences.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>{t('absences.table.noData')}</td></tr>
              ) : paginated.map(abs => {
                const typeCfg = TYPE_CONFIG[abs.type];
                const stsCfg = STATUS_CONFIG[abs.status] || STATUS_CONFIG['inProgress'];
                return (
                  <tr key={abs.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: '0.8rem' }}>{abs.idLabel}</span></td>
                    <td style={{ fontWeight: 600 }}>{abs.employee}</td>
                    <td><span className="filter-tag blue">{abs.dept}</span></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: typeCfg.color, backgroundColor: typeCfg.bg }}>
                        <i className={typeCfg.icon}></i> {t(`absences.modal.${abs.type}`)}
                      </span>
                    </td>
                    <td>{abs.date}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{abs.hours}h</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: stsCfg.color, backgroundColor: stsCfg.bg }}>
                        {t(`absences.status_values.${abs.status}`)}
                      </span>
                    </td>
                    <td>
                      {abs.warning
                        ? <span style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.8rem' }}><i className="fas fa-exclamation-triangle"></i> {t('absences.table.warningSent')}</span>
                        : <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{t('absences.table.noWarning')}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setSelectedAbs(abs); setIsDetailModalOpen(true); }}
                          style={{ background: 'var(--primary-bg)', color: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <i className="fas fa-eye"></i>
                        </button>
                        {!abs.justificatif && (
                          <button onClick={() => handleUploadJustificatif(abs.id)}
                            style={{ background: '#ECFDF5', color: '#10B981', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                            <i className="fas fa-paperclip"></i>
                          </button>
                        )}
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

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        title={t('absences.modal.createTitle')} icon="fas fa-user-times" iconColor="#EF4444" iconBg="#FEF2F2"
        submitColor="#EF4444" onSubmit={handleCreate} submitText={t('absences.modal.submit')}
        isSubmitDisabled={!form.employe_id || !form.dateDebut || !form.dateFin}>
        <form onSubmit={e => { e.preventDefault(); handleCreate(); }} style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-user" style={{ color: 'var(--primary)' }}></i> {t('absences.modal.employeeName')} *
              </label>
              <select name="employe_id" className="form-input" value={form.employe_id} onChange={handleFormChange} required>
                <option value="">Sélectionner...</option>
                {employes.map(e => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-tag" style={{ color: 'var(--c-purple)' }}></i> {t('absences.modal.type')} *
              </label>
              <select name="type" className="form-input" value={form.type} onChange={handleFormChange}>
                <option value="ABSENCE">{t('absences.modal.absence')}</option>
                <option value="RETARD">{t('absences.modal.late')}</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-info-circle" style={{ color: 'var(--primary)' }}></i> {t('absences.modal.statusLabel')}
              </label>
              <select name="statut" className="form-input" value={form.statut} onChange={handleFormChange}>
                <option value="INJUSTIFIEE">{t('absences.status_values.unjustified')}</option>
                <option value="JUSTIFIEE">{t('absences.status_values.justified')}</option>
                <option value="EN_ATTENTE">{t('absences.status_values.inProgress')}</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}></div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="far fa-calendar-alt" style={{ color: 'var(--success)' }}></i> {t('absences.modal.date')} * (début)
              </label>
              <input type="date" name="dateDebut" className="form-input" value={form.dateDebut} onChange={handleFormChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="far fa-calendar-check" style={{ color: 'var(--success)' }}></i> Date fin *
              </label>
              <input type="date" name="dateFin" className="form-input" value={form.dateFin} onChange={handleFormChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-align-left" style={{ color: 'var(--text-gray)' }}></i> {t('absences.modal.reason')}
              </label>
              <input type="text" name="motif" className="form-input" placeholder={t('absences.modal.reasonPlaceholder')} value={form.motif} onChange={handleFormChange} />
            </div>
          </div>
          {form.status === 'unjustified' && form.type === 'absence' && (
            <div style={{ background: '#FEF2F2', borderRadius: '10px', padding: '10px 14px', fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <i className="fas fa-exclamation-triangle"></i>
              {t('absences.modal.warningAlert')}
            </div>
          )}
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedAbs && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
          title={t('absences.modal.detailTitle', { id: selectedAbs.id })} icon="fas fa-user-times" iconColor="#EF4444" iconBg="#FEF2F2"
          submitColor={null} onSubmit={null} submitText={null}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              [t('absences.table.employee'), selectedAbs.employee], 
              [t('absences.table.department'), selectedAbs.dept],
              [t('absences.table.type'), t(`absences.modal.${selectedAbs.type}`)], 
              [t('absences.table.date'), selectedAbs.date],
              [t('absences.table.duration'), `${selectedAbs.hours}h`], 
              [t('absences.modal.reason'), selectedAbs.reason || '—'],
              [t('absences.table.status'), t(`absences.status_values.${selectedAbs.status}`)], 
              [t('absences.table.warning'), selectedAbs.warning ? t('absences.table.warningSent') : t('absences.table.noWarning')],
              ['Justificatif', selectedAbs.justificatif || t('absences.table.noJustif')],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value}</span>
              </div>
            ))}
            {!selectedAbs.justificatif && (
              <button onClick={() => { handleUploadJustificatif(selectedAbs.id); setIsDetailModalOpen(false); }}
                style={{ marginTop: '8px', padding: '10px', background: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                <i className="fas fa-paperclip"></i> {t('absences.modal.addJustif')}
              </button>
            )}
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
