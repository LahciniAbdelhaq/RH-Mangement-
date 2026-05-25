import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { jsPDF } from 'jspdf';
import { triggerWorkflowNotification, logSystemActivity } from '../utils/rbac';
import { attestationApi } from '../services/api';

const TYPE_MAP = {
  travail: 'Attestation de Travail',
  salaire: 'Attestation de Salaire',
  administratif: 'Bulletin de Paie',
};
const TYPE_API_MAP = {
  'Attestation de Travail': 'travail',
  'Attestation de Salaire': 'salaire',
  'Bulletin de Paie': 'administratif',
};

const normaliseAttestation = (a) => ({
  id: a.id,
  type: TYPE_MAP[a.type] ?? a.type,
  apiType: a.type,
  employee: a.employe ? `${a.employe.prenom ?? ''} ${a.employe.nom ?? ''}`.trim() : '',
  dept: a.employe?.service?.nom ?? '',
  requestedAt: a.dateDemande ? a.dateDemande.substring(0, 10) : '',
  status: a.statut === 'SIGNEE' ? 'available'
        : a.statut === 'GENEREE' ? 'waitingSignature'
        : a.statut === 'REFUSEE' ? 'refused' : 'processing',
  signedBy: a.signatureRH ? 'Agent RH' : null,
});

const DOC_TYPES = [
  { value: 'Attestation de Travail', icon: 'fas fa-briefcase', color: '#2563EB', bg: '#EFF6FF', filterValue: 'work' },
  { value: 'Attestation de Salaire', icon: 'fas fa-money-bill-wave', color: '#059669', bg: '#ECFDF5', filterValue: 'salary' },
  { value: 'Bulletin de Paie', icon: 'fas fa-file-invoice-dollar', color: '#7C3AED', bg: '#F5F3FF', filterValue: 'payslip' },
];

const statusConfig = {
  'available':        { color: '#10B981', bg: '#ECFDF5', icon: 'fas fa-check-circle' },
  'processing':       { color: '#F59E0B', bg: '#FFFBEB', icon: 'fas fa-hourglass-half' },
  'waitingSignature': { color: '#3B82F6', bg: '#EFF6FF', icon: 'fas fa-pen' },
};

export default function Attestations() {
  const { user, effectiveRole } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    attestationApi.list()
      .then(r => setDocs((r.data?.data ?? r.data ?? []).map(normaliseAttestation)))
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const isEmployee = effectiveRole === 'EMPLOYEE';
  const isHR = effectiveRole === 'HR_MANAGER' || effectiveRole === 'HR_AGENT';
  const isSecretary = effectiveRole === 'SECRETARY_GENERAL';

  const [form, setForm] = useState({ type: 'Attestation de Travail', note: '' });
  const handleFormChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleRequest = async () => {
    try {
      const apiType = TYPE_API_MAP[form.type] ?? 'travail';
      const r = await attestationApi.create({ type: apiType });
      const newDoc = normaliseAttestation(r.data?.data ?? r.data);
      setDocs(prev => [newDoc, ...prev]);
      triggerWorkflowNotification('Agent RH', 'Nouvelle demande d\'attestation', `${user?.name} a demandé : ${form.type}.`, 'request');
      showToast(t('attestations.toast.submitted'), 'success');
      setIsRequestModalOpen(false);
      setForm({ type: 'Attestation de Travail', note: '' });
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de la demande', 'error');
    }
  };

  const generatePDF = (doc) => {
    showToast(t('attestations.toast.generating'), 'info');
    setTimeout(() => {
      const pdf = new jsPDF();
      const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

      // Header
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, 210, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text('RH MANAGEMENT', 105, 15, { align: 'center' });
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Gestion des Ressources Humaines', 105, 25, { align: 'center' });

      // Document type strip
      const typeColor = doc.type.includes('Salaire') ? [5, 150, 105] : doc.type.includes('Bulletin') ? [124, 58, 237] : [37, 99, 235];
      pdf.setFillColor(...typeColor);
      pdf.rect(0, 35, 210, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(doc.type.toUpperCase(), 105, 40.5, { align: 'center' });

      // Date
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Casablanca, le ${today}`, 170, 55, { align: 'right' });

      // Title
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text(doc.type.toUpperCase(), 105, 75, { align: 'center' });
      pdf.setDrawColor(...typeColor);
      pdf.setLineWidth(0.8);
      const tw = pdf.getTextWidth(doc.type.toUpperCase());
      pdf.line(105 - tw / 2, 78, 105 + tw / 2, 78);

      // Body
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Je soussigné(e), Directeur des Ressources Humaines de la société RH MANAGEMENT S.A.,', 20, 95, { maxWidth: 170 });
      pdf.text('certifie et atteste par la présente que :', 20, 108);

      // Info box
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, 118, 170, 40, 4, 4, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(20, 118, 170, 40, 4, 4, 'S');

      pdf.setFont('helvetica', 'bold');
      pdf.text('Nom complet :', 25, 130);
      pdf.setFont('helvetica', 'normal');
      pdf.text(doc.employee, 75, 130);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Département :', 25, 142);
      pdf.setFont('helvetica', 'normal');
      pdf.text(doc.dept, 75, 142);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Réf. Document :', 25, 154);
      pdf.setFont('helvetica', 'normal');
      pdf.text(doc.id, 75, 154);

      pdf.text('Est régulièrement employé(e) au sein de notre établissement.', 20, 175);
      pdf.text('La présente attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit.', 20, 185, { maxWidth: 170 });

      // Signature block
      pdf.setFont('helvetica', 'bold');
      pdf.text('La Direction RH', 140, 215);
      if (doc.signedBy) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(190, 24, 93);
        pdf.text(`Signé électroniquement par : ${doc.signedBy}`, 105, 225, { align: 'center' });
      }

      // Seal
      pdf.setDrawColor(...typeColor);
      pdf.setTextColor(...typeColor);
      pdf.setLineWidth(0.5);
      pdf.circle(155, 230, 14);
      pdf.setFontSize(7);
      pdf.text('CACHET', 155, 228, { align: 'center' });
      pdf.text('OFFICIEL', 155, 233, { align: 'center' });

      // Footer
      const ph = pdf.internal.pageSize.height;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, ph - 20, 210, 20, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.line(0, ph - 20, 210, ph - 20);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('RH MANAGEMENT S.A. — Document généré électroniquement — Valeur juridique garantie', 105, ph - 12, { align: 'center' });
      pdf.text(`Réf: ${doc.id} | Généré le ${today}`, 105, ph - 6, { align: 'center' });

      pdf.save(`${doc.type.replace(/\s+/g, '_')}_${doc.employee.replace(/\s+/g, '_')}_${doc.id}.pdf`);
      showToast(t('attestations.toast.generated'), 'success');
      logSystemActivity('Génération PDF', user?.name, `Document ${doc.id} – ${doc.type} généré pour ${doc.employee}`);
    }, 800);
  };

  const tabs = ['all', 'work', 'salary', 'payslip'];
  
  const getTabFilterValue = (tab) => {
      if (tab === 'work') return 'Attestation de Travail';
      if (tab === 'salary') return 'Attestation de Salaire';
      if (tab === 'payslip') return 'Bulletin de Paie';
      return 'Tous';
  };

  const filtered = docs.filter(d => {
    if (isEmployee) return d.employee === user?.name;
    return true;
  }).filter(d => activeTab === 'all' || d.type.startsWith(getTabFilterValue(activeTab)));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1><i className="fas fa-file-alt" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
            {isEmployee ? t('attestations.myTitle') : isSecretary ? t('attestations.sgTitle') : t('attestations.title')}
          </h1>
          <p>
            {isEmployee ? t('attestations.mySubtitle')
              : isSecretary ? t('attestations.sgSubtitle')
              : t('attestations.subtitle')}
          </p>
        </div>
        <div className="header-actions">
          {isEmployee && (
            <button className="action-btn primary" onClick={() => setIsRequestModalOpen(true)}>
              <i className="fas fa-plus"></i> {t('attestations.requestDoc')}
            </button>
          )}
          {isHR && (
            <button className="action-btn primary" onClick={() => {
              attestationApi.list()
                .then(r => setDocs((r.data?.data ?? r.data ?? []).map(normaliseAttestation)))
                .catch(() => {});
              showToast(t('attestations.toast.generateMonthly'), 'info');
            }}>
              <i className="fas fa-sync-alt"></i> {t('attestations.generateMonthly')}
            </button>
          )}
        </div>
      </header>

      {/* Doc Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {DOC_TYPES.map(dt => {
          const count = docs.filter(d => d.type.startsWith(dt.value.split(' ')[0]) && (isEmployee ? d.employee === user?.name : true)).length;
          return (
            <div key={dt.value} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer', borderTop: `3px solid ${dt.color}` }}
              onClick={() => { setActiveTab(dt.filterValue); setPage(1); }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: dt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dt.color, fontSize: '1.1rem', flexShrink: 0 }}>
                <i className={dt.icon}></i>
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '2px' }}>{t(`attestations.filters.${dt.filterValue}`)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">{t('attestations.available')}</h3>
          <div className="filter-group">
            {tabs.map(t_id => (
              <button key={t_id} className={`filter-pill ${activeTab === t_id ? 'filter-pill-blue' : ''}`}
                onClick={() => { setActiveTab(t_id); setPage(1); }}>{t(`attestations.filters.${t_id}`)}</button>
            ))}
          </div>
        </div>
        <div className="table-container table-responsive">
          <table>
            <thead>
              <tr>
                <th>{t('attestations.table.ref')}</th>
                <th>{t('attestations.table.type')}</th>
                {!isEmployee && <th>{t('attestations.table.employee')}</th>}
                {!isEmployee && <th>{t('attestations.table.department')}</th>}
                <th>{t('attestations.table.requestedAt')}</th>
                <th>{t('attestations.table.status')}</th>
                <th>{t('attestations.table.signature')}</th>
                <th>{t('attestations.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingDocs ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>{t('attestations.table.noData')}</td></tr>
              ) : paginated.map(doc => {
                const cfg = statusConfig[doc.status] || statusConfig['processing'];
                return (
                  <tr key={doc.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: '0.8rem' }}>{doc.id}</span></td>
                    <td><span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.type}</span></td>
                    {!isEmployee && <td>{doc.employee}</td>}
                    {!isEmployee && <td><span className="filter-tag blue">{doc.dept}</span></td>}
                    <td>{doc.requestedAt}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: cfg.color, backgroundColor: cfg.bg }}>
                        <i className={cfg.icon}></i> {t(`attestations.${doc.status}`)}
                      </span>
                    </td>
                    <td>
                      {doc.signedBy
                        ? <span style={{ fontSize: '0.75rem', color: '#BE185D', fontWeight: 600 }}><i className="fas fa-pen-fancy"></i> {doc.signedBy}</span>
                        : <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{t('attestations.table.noSignature')}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {doc.status === 'available' && (
                          <button onClick={() => generatePDF(doc)}
                            style={{ background: '#ECFDF5', color: '#10B981', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            <i className="fas fa-download"></i>
                          </button>
                        )}
                        {isHR && doc.status === 'processing' && (
                          <button onClick={async () => {
                            try {
                              const r = await attestationApi.generate(doc.id);
                              const updated = normaliseAttestation(r.data?.data ?? r.data);
                              setDocs(prev => prev.map(d => d.id === doc.id ? updated : d));
                              showToast(t('attestations.toast.processed'), 'success');
                            } catch (err) {
                              showToast(err.response?.data?.message ?? 'Erreur', 'error');
                            }
                          }}
                            style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            <i className="fas fa-check"></i>
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

      {/* Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title={t('attestations.modal.requestTitle')}
        icon="fas fa-file-alt"
        iconColor="#7C3AED"
        iconBg="#F5F3FF"
        submitColor="#7C3AED"
        onSubmit={handleRequest}
        submitText={t('attestations.modal.submit')}
        isSubmitDisabled={!form.type}
      >
        <form onSubmit={e => { e.preventDefault(); handleRequest(); }}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-file-signature" style={{ color: '#7C3AED' }}></i> {t('attestations.modal.docType')} *
            </label>
            <select name="type" className="form-input" value={form.type} onChange={handleFormChange}>
              <option>Attestation de Travail</option>
              <option>Attestation de Salaire</option>
              <option>Bulletin de Paie</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-align-left" style={{ color: 'var(--text-gray)' }}></i> {t('attestations.modal.note')}
            </label>
            <textarea name="note" className="form-input" rows="3" placeholder={t('attestations.modal.notePlaceholder')} value={form.note} onChange={handleFormChange}></textarea>
          </div>
          <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '12px 16px', fontSize: '0.85rem', color: '#92400E', fontWeight: 500 }}>
            <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
            {t('attestations.modal.delay')}
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
