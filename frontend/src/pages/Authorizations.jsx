import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { triggerWorkflowNotification, logSystemActivity } from '../utils/rbac';
import { absenceApi } from '../services/api';

const ANNUAL_QUOTA = 5;

const normaliseAuth = (a) => ({
  id: a.id,
  employee: a.employe ? `${a.employe.prenom ?? ''} ${a.employe.nom ?? ''}`.trim() : '',
  dept: a.employe?.service?.nom ?? '',
  date: a.dateDebut ? a.dateDebut.substring(0, 10) : '',
  hours: a.nbHeures ?? 1,
  reason: a.motif ?? '',
  status: a.statut === 'JUSTIFIEE' ? 'approved'
        : a.statut === 'INJUSTIFIEE' ? 'refused'
        : a.statut === 'EN_ATTENTE_CHEF' ? 'validatedChef'
        : 'pending',
  submittedAt: a.dateDebut ? a.dateDebut.substring(0, 10) : '',
  approvedByChef: a.statut === 'EN_ATTENTE_CHEF' || a.statut === 'JUSTIFIEE',
  approvedByRH: a.statut === 'JUSTIFIEE',
});

const statusConfig = {
  'pending':       { color: '#F59E0B', bg: '#FFFBEB', icon: 'fas fa-clock' },
  'validatedChef': { color: '#3B82F6', bg: '#EFF6FF', icon: 'fas fa-user-check' },
  'approved':      { color: '#10B981', bg: '#ECFDF5', icon: 'fas fa-check-circle' },
  'refused':       { color: '#EF4444', bg: '#FEF2F2', icon: 'fas fa-times-circle' },
};

export default function Authorizations() {
  const { user, effectiveRole } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [authorizations, setAuthorizations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    absenceApi.list({ type: 'RETARD' })
      .then(r => {
        const all = r.data?.data ?? r.data ?? [];
        setAuthorizations(all.filter(a => a.type === 'AUTORISATION' || a.nbHeures != null).map(normaliseAuth));
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const isEmployee = effectiveRole === 'EMPLOYEE';
  const isDeptManager = effectiveRole === 'DEPARTMENT_MANAGER' || effectiveRole === 'INTERIM_MANAGER';
  const isHR = effectiveRole === 'HR_MANAGER' || effectiveRole === 'HR_AGENT';

  const usedHours = authorizations
    .filter(a => a.employee === user?.name && a.status === 'approved')
    .reduce((sum, a) => sum + a.hours, 0);
  const remainingHours = ANNUAL_QUOTA - usedHours;

  const [form, setForm] = useState({ date: '', hours: 1, reason: '' });
  const handleFormChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.date || !form.reason) {
      showToast(t('authorizations.toast.missingFields'), 'warning');
      return;
    }
    try {
      const r = await absenceApi.create({
        type: 'ABSENCE',
        dateDebut: form.date,
        dateFin: form.date,
        nbHeures: Number(form.hours),
        motif: form.reason,
        statut: 'INJUSTIFIEE',
        employe_id: user?.employe_id,
      });
      const newAuth = normaliseAuth(r.data?.data ?? r.data);
      setAuthorizations(prev => [newAuth, ...prev]);
      triggerWorkflowNotification('Chef de Service', 'Nouvelle autorisation d\'absence', `${user?.name} a soumis une demande d'autorisation pour le ${form.date}.`, 'request');
      logSystemActivity('Demande Autorisation', user?.name, `Autorisation demandée pour ${form.date} (${form.hours}h)`);
      showToast(t('authorizations.toast.submitted'), 'success');
      setIsCreateModalOpen(false);
      setForm({ date: '', hours: 1, reason: '' });
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de la soumission', 'error');
    }
  };

  const handleApproveChef = async (auth) => {
    try {
      await absenceApi.update(auth.id, { statut: 'EN_ATTENTE_CHEF' });
      setAuthorizations(prev => prev.map(a =>
        a.id === auth.id ? { ...a, status: 'validatedChef', approvedByChef: true } : a
      ));
      triggerWorkflowNotification('Agent RH', 'Autorisation validée par chef', `Demande de ${auth.employee} validée — en attente RH.`, 'approval');
      showToast(t('authorizations.toast.validatedChef', { name: auth.employee }), 'success');
    } catch { showToast('Erreur lors de la validation', 'error'); }
    setIsDetailModalOpen(false);
  };

  const handleApproveRH = async (auth) => {
    try {
      await absenceApi.update(auth.id, { statut: 'JUSTIFIEE' });
      setAuthorizations(prev => prev.map(a =>
        a.id === auth.id ? { ...a, status: 'approved', approvedByRH: true } : a
      ));
      triggerWorkflowNotification(auth.employee, 'Autorisation approuvée', `Votre demande d'autorisation du ${auth.date} a été approuvée par le RH.`, 'success');
      showToast(t('authorizations.toast.approvedRH', { name: auth.employee }), 'success');
    } catch { showToast('Erreur lors de l\'approbation', 'error'); }
    setIsDetailModalOpen(false);
  };

  const handleRefuse = async (auth) => {
    try {
      await absenceApi.update(auth.id, { statut: 'INJUSTIFIEE' });
      setAuthorizations(prev => prev.map(a =>
        a.id === auth.id ? { ...a, status: 'refused' } : a
      ));
      triggerWorkflowNotification(auth.employee, 'Autorisation refusée', `Votre demande d'autorisation du ${auth.date} a été refusée.`, 'warning');
      showToast(t('authorizations.toast.refused', { name: auth.employee }), 'error');
    } catch { showToast('Erreur lors du refus', 'error'); }
    setIsDetailModalOpen(false);
  };

  const filters = ['all', 'pending', 'validatedChef', 'approved', 'refused'];
  const filtered = authorizations.filter(a => {
    if (isEmployee) return a.employee === user?.name;
    if (isDeptManager) return a.dept === user?.dept;
    return true;
  }).filter(a => activeFilter === 'all' || a.status === activeFilter);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1><i className="fas fa-user-check" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
            {isEmployee ? t('authorizations.myTitle') : t('authorizations.title')}
          </h1>
          <p>{isEmployee
            ? t('authorizations.mySubtitle', { quota: ANNUAL_QUOTA, used: usedHours, remaining: remainingHours })
            : t('authorizations.subtitle')}
          </p>
        </div>
        <div className="header-actions">
          {(isEmployee || isDeptManager) && (
            <button className="action-btn primary" onClick={() => setIsCreateModalOpen(true)}>
              <i className="fas fa-plus"></i> {t('authorizations.newRequest')}
            </button>
          )}
        </div>
      </header>

      {/* Quota Card (Employee only) */}
      {isEmployee && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card blue-card">
            <div className="stat-header">
              <div className="stat-icon primary"><i className="fas fa-clock"></i></div>
            </div>
            <div className="stat-value">{ANNUAL_QUOTA}h</div>
            <div className="stat-label">{t('authorizations.annualQuota')}</div>
          </div>
          <div className="stat-card amber-card">
            <div className="stat-header">
              <div className="stat-icon warning"><i className="fas fa-hourglass-half"></i></div>
            </div>
            <div className="stat-value">{usedHours}h</div>
            <div className="stat-label">{t('authorizations.usedHours')}</div>
          </div>
          <div className="stat-card emerald-card">
            <div className="stat-header">
              <div className="stat-icon success"><i className="fas fa-check"></i></div>
            </div>
            <div className="stat-value">{remainingHours}h</div>
            <div className="stat-label">{t('authorizations.remainingHours')}</div>
          </div>
        </div>
      )}

      {/* HR Stats */}
      {isHR && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card blue-card">
            <div className="stat-header"><div className="stat-icon primary"><i className="fas fa-list"></i></div></div>
            <div className="stat-value">{authorizations.length}</div>
            <div className="stat-label">{t('authorizations.total')}</div>
          </div>
          <div className="stat-card amber-card">
            <div className="stat-header"><div className="stat-icon warning"><i className="fas fa-clock"></i></div></div>
            <div className="stat-value">{authorizations.filter(a => a.status === 'pending').length}</div>
            <div className="stat-label">{t('authorizations.pending')}</div>
          </div>
          <div className="stat-card emerald-card">
            <div className="stat-header"><div className="stat-icon success"><i className="fas fa-check-circle"></i></div></div>
            <div className="stat-value">{authorizations.filter(a => a.status === 'approved').length}</div>
            <div className="stat-label">{t('authorizations.approved')}</div>
          </div>
          <div className="stat-card blue-card">
            <div className="stat-header"><div className="stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}><i className="fas fa-user-check"></i></div></div>
            <div className="stat-value">{authorizations.filter(a => a.status === 'validatedChef').length}</div>
            <div className="stat-label">{t('authorizations.validatedByChef')}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">{t('authorizations.history')}</h3>
          <div className="filter-group">
            {filters.map(f => (
              <button
                key={f}
                className={`filter-pill ${activeFilter === f ? 'filter-pill-blue' : ''}`}
                onClick={() => { setActiveFilter(f); setPage(1); }}
              >{t(`authorizations.filters.${f}`)}</button>
            ))}
          </div>
        </div>

        <div className="table-container table-responsive">
          <table>
            <thead>
              <tr>
                <th>{t('authorizations.ref')}</th>
                {!isEmployee && <th>{t('authorizations.employee')}</th>}
                {!isEmployee && <th>{t('authorizations.department')}</th>}
                <th>{t('authorizations.date')}</th>
                <th>{t('authorizations.duration')}</th>
                <th>{t('authorizations.reason')}</th>
                <th>{t('authorizations.status')}</th>
                <th>{t('authorizations.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>{t('authorizations.noData')}</td></tr>
              ) : paginated.map(auth => {
                const cfg = statusConfig[auth.status] || statusConfig['pending'];
                return (
                  <tr key={auth.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: '0.8rem' }}>{auth.id}</span></td>
                    {!isEmployee && <td><span style={{ fontWeight: 600 }}>{auth.employee}</span></td>}
                    {!isEmployee && <td><span className="filter-tag blue">{auth.dept}</span></td>}
                    <td>{auth.date}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{auth.hours}h</span></td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{auth.reason}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: cfg.color, backgroundColor: cfg.bg }}>
                        <i className={cfg.icon}></i> {t(`authorizations.status_values.${auth.status}`)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedAuth(auth); setIsDetailModalOpen(true); }}
                        style={{ background: 'var(--primary-bg)', color: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <i className="fas fa-eye"></i> {t('authorizations.details')}
                      </button>
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
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('authorizations.modal.newTitle')}
        icon="fas fa-user-check"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        submitColor="var(--primary)"
        onSubmit={handleCreate}
        submitText={t('authorizations.modal.submit')}
        isSubmitDisabled={!form.date || !form.reason}
      >
        <form onSubmit={e => { e.preventDefault(); handleCreate(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="far fa-calendar-alt" style={{ color: 'var(--success)' }}></i> {t('authorizations.modal.desiredDate')} *
              </label>
              <input type="date" name="date" className="form-input" value={form.date} onChange={handleFormChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-clock" style={{ color: '#E11D48' }}></i> {t('authorizations.modal.durationHours')} *
              </label>
              <select name="hours" className="form-input" value={form.hours} onChange={handleFormChange}>
                <option value={1}>1 heure</option>
                <option value={2}>2 heures</option>
                <option value={3}>3 heures</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-align-left" style={{ color: 'var(--text-gray)' }}></i> {t('authorizations.modal.reasonLabel')} *
            </label>
            <textarea name="reason" className="form-input" rows="3" placeholder={t('authorizations.modal.reasonPlaceholder')} value={form.reason} onChange={handleFormChange} required></textarea>
          </div>
          <div style={{ background: 'var(--primary-bg)', borderRadius: '10px', padding: '12px 16px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
            <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
            {t('authorizations.modal.quotaInfo', { remaining: remainingHours, quota: ANNUAL_QUOTA })}
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedAuth && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={t('authorizations.modal.detailTitle', { id: selectedAuth.id })}
          icon="fas fa-file-alt"
          iconColor="var(--primary)"
          iconBg="var(--primary-bg)"
          submitColor={null}
          onSubmit={null}
          submitText={null}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              [t('authorizations.employee'), selectedAuth.employee],
              [t('authorizations.department'), selectedAuth.dept],
              [t('authorizations.modal.desiredDate'), selectedAuth.date],
              [t('authorizations.duration'), `${selectedAuth.hours} heure(s)`],
              [t('authorizations.modal.submittedAt'), selectedAuth.submittedAt],
              [t('authorizations.reason'), selectedAuth.reason],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{t('authorizations.status')}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: statusConfig[selectedAuth.status]?.color, backgroundColor: statusConfig[selectedAuth.status]?.bg }}>
                <i className={statusConfig[selectedAuth.status]?.icon}></i> {t(`authorizations.status_values.${selectedAuth.status}`)}
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              {isDeptManager && selectedAuth.status === 'pending' && (
                <>
                  <button onClick={() => handleApproveChef(selectedAuth)} style={{ flex: 1, padding: '10px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    <i className="fas fa-check"></i> {t('authorizations.modal.validate')}
                  </button>
                  <button onClick={() => handleRefuse(selectedAuth)} style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    <i className="fas fa-times"></i> {t('authorizations.modal.refuse')}
                  </button>
                </>
              )}
              {isHR && selectedAuth.status === 'validatedChef' && (
                <>
                  <button onClick={() => handleApproveRH(selectedAuth)} style={{ flex: 1, padding: '10px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    <i className="fas fa-check-double"></i> {t('authorizations.modal.approveDefinitive')}
                  </button>
                  <button onClick={() => handleRefuse(selectedAuth)} style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    <i className="fas fa-times"></i> {t('authorizations.modal.refuse')}
                  </button>
                </>
              )}
              {isHR && selectedAuth.status === 'pending' && (
                <button onClick={() => handleRefuse(selectedAuth)} style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  <i className="fas fa-times"></i> {t('authorizations.modal.refuse')}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
