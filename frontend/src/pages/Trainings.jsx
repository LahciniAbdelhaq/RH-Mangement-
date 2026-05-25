import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { formationApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOROCCAN_CITIES } from '../utils/cities';

const chartData = [
  { month: 'Jan', formations: 2 }, { month: 'Fév', formations: 1 },
  { month: 'Mar', formations: 3 }, { month: 'Avr', formations: 2 },
  { month: 'Mai', formations: 4 }, { month: 'Jun', formations: 2 },
];

const statusConfig = {
  'planned': { color: '#3B82F6', bg: '#EFF6FF', icon: 'fas fa-calendar' },
  'inProgress':  { color: '#F59E0B', bg: '#FFFBEB', icon: 'fas fa-spinner' },
  'done':  { color: '#10B981', bg: '#ECFDF5', icon: 'fas fa-check-circle' },
  'cancelled':   { color: '#EF4444', bg: '#FEF2F2', icon: 'fas fa-times-circle' },
};

const DOMAINS = ['Informatique', 'Management', 'Finance', 'RH', 'Commercial', 'Technique', 'Autre'];

export default function Trainings() {
  const { user, effectiveRole } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [trainings, setTrainings] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const isEmployee = effectiveRole === 'EMPLOYEE';
  const isHR = effectiveRole === 'HR_MANAGER' || effectiveRole === 'HR_AGENT';
  const canManage = isHR;

  const [form, setForm] = useState({
    titre: '', description: '', lieu: '', capacite: 15, dateDebut: '', dateFin: ''
  });
  const handleFormChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const resetForm = () => setForm({ titre: '', description: '', lieu: '', capacite: 15, dateDebut: '', dateFin: '' });

  // Normalise API formation to UI shape
  const normalise = (f) => ({
    id: f.id,
    title: f.titre,
    description: f.description,
    location: f.lieu,
    maxParticipants: f.capacite,
    startDate: f.dateDebut?.substring(0, 10),
    endDate: f.dateFin?.substring(0, 10),
    status: f.statut === 'PLANIFIEE' ? 'planned' : f.statut === 'EN_COURS' ? 'inProgress' : f.statut === 'TERMINEE' ? 'done' : 'cancelled',
    participants: (f.participants ?? []).map(p => `${p.prenom} ${p.nom}`),
    participantIds: (f.participants ?? []).map(p => p.id),
  });

  useEffect(() => {
    formationApi.list()
      .then(r => setTrainings((r.data?.data ?? r.data ?? []).map(normalise)))
      .catch(() => showToast('Erreur chargement formations', 'error'))
      .finally(() => setLoadingList(false));
  }, []);

  const handleCreate = async () => {
    if (!form.titre || !form.dateDebut || !form.dateFin) {
      showToast(t('trainings.toast.missingFields'), 'warning');
      return;
    }
    try {
      const r = await formationApi.create({ ...form, capacite: Number(form.capacite), statut: 'PLANIFIEE' });
      setTrainings(prev => [normalise(r.data?.data ?? r.data), ...prev]);
      showToast(t('trainings.toast.created'), 'success');
      setIsCreateModalOpen(false);
      resetForm();
    } catch {
      showToast('Erreur lors de la création', 'error');
    }
  };

  const handleEnroll = async (training) => {
    if (training.participants.includes(user?.name)) {
      showToast(t('trainings.toast.alreadyEnrolled'), 'warning');
      return;
    }
    if (training.participants.length >= training.maxParticipants) {
      showToast(t('trainings.toast.full'), 'error');
      return;
    }
    try {
      await formationApi.participer(training.id);
      setTrainings(prev => prev.map(f =>
        f.id === training.id ? { ...f, participants: [...f.participants, user?.name] } : f
      ));
      showToast(t('trainings.toast.enrolled', { title: training.title }), 'success');
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur inscription', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await formationApi.delete(id);
      setTrainings(prev => prev.filter(f => f.id !== id));
      showToast(t('trainings.toast.deleted'), 'success');
      setIsDetailModalOpen(false);
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const filters = ['all', 'planned', 'inProgress', 'done'];
  const myTrainings = trainings.filter(f => f.participantIds?.includes(user?.employe_id) || f.participants.includes(user?.name));
  const filtered = trainings.filter(t => activeFilter === 'all' || t.status === activeFilter);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1><i className="fas fa-graduation-cap" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
            {isEmployee ? t('trainings.myTitle') : t('trainings.title')}
          </h1>
          <p>{isEmployee ? t('trainings.mySubtitle') : t('trainings.subtitle')}</p>
        </div>
        <div className="header-actions">
          {canManage && (
            <button className="action-btn primary" onClick={() => setIsCreateModalOpen(true)}>
              <i className="fas fa-plus"></i> {t('trainings.newTraining')}
            </button>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card blue-card">
          <div className="stat-header"><div className="stat-icon primary"><i className="fas fa-book"></i></div></div>
          <div className="stat-value">{trainings.length}</div>
          <div className="stat-label">{t('trainings.total')}</div>
        </div>
        <div className="stat-card amber-card">
          <div className="stat-header"><div className="stat-icon warning"><i className="fas fa-spinner"></i></div></div>
          <div className="stat-value">{trainings.filter(t => t.status === 'inProgress').length}</div>
          <div className="stat-label">{t('trainings.inProgress')}</div>
        </div>
        <div className="stat-card emerald-card">
          <div className="stat-header"><div className="stat-icon success"><i className="fas fa-user-graduate"></i></div></div>
          <div className="stat-value">{isEmployee ? myTrainings.length : trainings.reduce((s, t) => s + t.participants.length, 0)}</div>
          <div className="stat-label">{isEmployee ? t('trainings.myEnrollments') : t('trainings.participants')}</div>
        </div>
        <div className="stat-card blue-card">
          <div className="stat-header"><div className="stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}><i className="fas fa-calendar-alt"></i></div></div>
          <div className="stat-value">{trainings.filter(t => t.status === 'planned').length}</div>
          <div className="stat-label">{t('trainings.planned')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Training cards */}
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button key={f} className={`filter-pill ${activeFilter === f ? 'filter-pill-blue' : ''}`}
                onClick={() => { setActiveFilter(f); setPage(1); }}>{t(`trainings.filters.${f}`)}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingList && (
              <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Chargement...
              </div>
            )}
            {!loadingList && paginated.map(training => {
              const cfg = statusConfig[training.status] || statusConfig['planned'];
              const isEnrolled = training.participants.includes(user?.name);
              const isFull = training.participants.length >= training.maxParticipants;
              const pct = Math.round(training.participants.length / training.maxParticipants * 100);
              return (
                <div key={training.id} className="card" style={{ padding: '16px', cursor: 'pointer' }}
                  onClick={() => { setSelectedTraining(training); setIsDetailModalOpen(true); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>{training.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{training.id} • {training.domain}</span>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, color: cfg.color, backgroundColor: cfg.bg, whiteSpace: 'nowrap' }}>
                      <i className={cfg.icon}></i> {t(`trainings.status.${training.status}`)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}><i className="fas fa-user-tie" style={{ marginRight: '5px', color: 'var(--primary)' }}></i>{training.trainer}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}><i className="fas fa-map-marker-alt" style={{ marginRight: '5px', color: '#7C3AED' }}></i>{training.location}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}><i className="fas fa-calendar" style={{ marginRight: '5px', color: '#059669' }}></i>{training.startDate} → {training.endDate}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{t('trainings.card.participants')}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{training.participants.length}/{training.maxParticipants}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isFull ? '#EF4444' : '#10B981', borderRadius: '10px', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                  {isEmployee && training.status === 'planned' && (
                    <button
                      onClick={e => { e.stopPropagation(); handleEnroll(training); }}
                      disabled={isFull}
                      style={{ padding: '6px 16px', background: isEnrolled ? '#ECFDF5' : isFull ? 'var(--border-color)' : 'var(--primary)', color: isEnrolled ? '#10B981' : isFull ? 'var(--text-gray)' : '#fff', border: 'none', borderRadius: '8px', cursor: isFull ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                      {isEnrolled ? t('trainings.card.enrolled') : isFull ? t('trainings.card.full') : t('trainings.card.enroll')}
                    </button>
                  )}
                </div>
              );
            })}
            {!loadingList && paginated.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                {t('common.noData')}
              </div>
            )}
            <Pagination currentPage={page} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
          </div>
        </div>

        {/* Chart */}
        <div className="card">
          <div className="card-title">
            <i className="fas fa-chart-bar" style={{ color: 'var(--primary)' }}></i> {t('trainings.perMonth')}
          </div>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-gray)" fontSize={11} />
                <YAxis stroke="var(--text-gray)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--main-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="formations" name="Formations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div className="card-title" style={{ marginBottom: '10px' }}><i className="fas fa-layer-group"></i> {t('trainings.byDomain')}</div>
            {['Informatique', 'Management', 'Finance'].map(domain => {
              const count = trainings.filter(t => t.domain === domain).length;
              return (
                <div key={domain} className="progress-item" style={{ marginBottom: '8px' }}>
                  <div className="progress-header"><span>{domain}</span><span style={{ fontWeight: 600 }}>{count}</span></div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${(count / trainings.length) * 100}%`, backgroundColor: 'var(--primary)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        title={t('trainings.modal.createTitle')} icon="fas fa-graduation-cap" iconColor="var(--primary)" iconBg="var(--primary-bg)"
        submitColor="var(--primary)" onSubmit={handleCreate} submitText={t('trainings.modal.submit')}
        isSubmitDisabled={!form.titre || !form.dateDebut || !form.dateFin}>
        <form onSubmit={e => { e.preventDefault(); handleCreate(); }} style={{ padding: '4px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-heading" style={{ color: 'var(--primary)' }}></i> {t('trainings.modal.titleLabel')} *
              </label>
              <input type="text" name="titre" className="form-input" placeholder={t('trainings.modal.titlePlaceholder')} value={form.titre} onChange={handleFormChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-map-marker-alt" style={{ color: '#E11D48' }}></i> {t('trainings.modal.location')}
              </label>
              <select name="lieu" className="form-input" value={form.lieu} onChange={handleFormChange}>
                <option value="">Sélectionner...</option>
                {MOROCCAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-users" style={{ color: 'var(--primary)' }}></i> {t('trainings.modal.maxPart')}
              </label>
              <input type="number" name="capacite" className="form-input" min="1" max="100" value={form.capacite} onChange={handleFormChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="far fa-calendar-alt" style={{ color: 'var(--success)' }}></i> {t('trainings.modal.startDate')} *
              </label>
              <input type="date" name="dateDebut" className="form-input" value={form.dateDebut} onChange={handleFormChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="far fa-calendar-check" style={{ color: 'var(--success)' }}></i> {t('trainings.modal.endDate')} *
              </label>
              <input type="date" name="dateFin" className="form-input" value={form.dateFin} onChange={handleFormChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-align-left" style={{ color: 'var(--text-gray)' }}></i> {t('trainings.modal.description')}
              </label>
              <input type="text" name="description" className="form-input" placeholder={t('trainings.modal.descPlaceholder')} value={form.description} onChange={handleFormChange} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedTraining && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
          title={selectedTraining.title} icon="fas fa-graduation-cap" iconColor="var(--primary)" iconBg="var(--primary-bg)"
          submitColor={null} onSubmit={null} submitText={null}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              [t('common.ref', 'Référence'), selectedTraining.id],
              [t('trainings.modal.domain'), selectedTraining.domain],
              [t('trainings.modal.trainer'), selectedTraining.trainer],
              [t('trainings.modal.location'), selectedTraining.location],
              [t('trainings.modal.startDate'), selectedTraining.startDate],
              [t('trainings.modal.endDate'), selectedTraining.endDate],
              [t('trainings.modal.participantsList'), `${selectedTraining.participants.length} / ${selectedTraining.maxParticipants}`],
              [t('trainings.status.planned', 'Statut'), t(`trainings.status.${selectedTraining.status}`)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value}</span>
              </div>
            ))}
            {selectedTraining.participants.length > 0 && (
              <div>
                <div style={{ color: 'var(--text-gray)', fontSize: '0.85rem', marginBottom: '8px' }}>{t('trainings.modal.participantsList')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedTraining.participants.map(p => (
                    <span key={p} style={{ padding: '4px 10px', background: 'var(--primary-bg)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            {canManage && (
              <button onClick={() => handleDelete(selectedTraining.id)}
                style={{ marginTop: '8px', padding: '10px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                <i className="fas fa-trash"></i> {t('trainings.modal.delete')}
              </button>
            )}
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
