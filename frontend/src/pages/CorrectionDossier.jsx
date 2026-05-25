import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { correctionApi, employeApi } from '../services/api';
import { CheckCircle2, ArrowRight, ArrowLeft, Upload, Eye, Send, FileEdit } from 'lucide-react';

const TYPES_CORRECTION = [
  { key: 'informations_personnelles', label: 'Informations Personnelles', icon: '👤', desc: 'Nom, prénom, CIN, téléphone, adresse, situation familiale...' },
  { key: 'informations_administratives', label: 'Informations Administratives', icon: '🏢', desc: 'Grade, échelle, poste, statut...' },
];

const STEPS = [
  'Type de correction',
  'Informations actuelles',
  'Nouvelles informations',
  'Justificatifs',
  'Aperçu',
  'Confirmation',
];

const FIELD_LABELS = {
  nom: 'Nom',
  prenom: 'Prénom',
  cin: 'CIN',
  telephone: 'Téléphone',
  adresse: 'Adresse',
  sexe: 'Sexe',
  situationFamiliale: 'Situation Familiale',
  conjoint: 'Conjoint(e)',
  nombreEnfants: 'Nombre d\'enfants',
  matricule: 'Matricule',
  poste: 'Poste',
  grade: 'Grade',
  echelle: 'Échelle',
  statut: 'Statut',
};

export default function CorrectionDossier() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [typeCorrection, setTypeCorrection] = useState(null);
  const [currentData, setCurrentData] = useState({});
  const [newData, setNewData] = useState({});
  const [justification, setJustification] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'

  // Load correction history
  useEffect(() => {
    correctionApi.list()
      .then(r => setHistory(r.data?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [submitted]);

  // When type is chosen, load current employee data
  useEffect(() => {
    if (!typeCorrection || !user?.employe_id) return;
    employeApi.show(user.employe_id)
      .then(r => {
        const e = r.data?.data ?? r.data;
        if (typeCorrection === 'informations_personnelles') {
          setCurrentData({
            nom: e.nom ?? '', prenom: e.prenom ?? '', cin: e.cin ?? '',
            telephone: e.telephone ?? '', adresse: e.adresse ?? '',
            sexe: e.sexe ?? '', situationFamiliale: e.situationFamiliale ?? '',
            conjoint: e.conjoint ?? '', nombreEnfants: e.nombreEnfants ?? '',
          });
        } else {
          setCurrentData({
            matricule: e.matricule ?? '', poste: e.poste ?? '', grade: e.grade ?? '',
            echelle: e.echelle ?? '', statut: e.statut ?? '',
          });
        }
        setNewData({});
      })
      .catch(() => showToast('Impossible de charger votre profil', 'error'));
  }, [typeCorrection]);

  const handleNewDataChange = (field, value) => {
    setNewData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!justification.trim()) {
      showToast('La justification est obligatoire', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await correctionApi.create({
        typeCorrection,
        nouvelleValeur: newData,
        justification,
      });
      setSubmitted(true);
      showToast('Demande de correction envoyée avec succès', 'success');
      // Reset wizard
      setStep(0);
      setTypeCorrection(null);
      setCurrentData({});
      setNewData({});
      setJustification('');
      setFiles([]);
      setActiveTab('history');
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur lors de l\'envoi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!typeCorrection;
    if (step === 2) return Object.keys(newData).some(k => newData[k] !== '' && newData[k] !== currentData[k]);
    if (step === 4) return !!justification.trim();
    return true;
  };

  const getStatusBadge = (statut) => {
    const cfg = {
      EN_ATTENTE: { label: 'En attente', color: '#f59e0b', bg: '#fffbeb' },
      APPROUVEE:  { label: 'Approuvée',  color: '#10b981', bg: '#ecfdf5' },
      REFUSEE:    { label: 'Refusée',    color: '#ef4444', bg: '#fef2f2' },
    };
    const c = cfg[statut] ?? cfg.EN_ATTENTE;
    return (
      <span style={{ background: c.bg, color: c.color, padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>
        {c.label}
      </span>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1><FileEdit size={20} style={{ display: 'inline', color: 'var(--primary)', marginRight: 8 }} />Correction Dossier Administratif</h1>
          <p>Demandez la correction de vos informations personnelles ou administratives</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[['new', 'Nouvelle demande'], ['history', 'Historique']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === key ? 700 : 400,
              color: activeTab === key ? 'var(--primary)' : 'var(--text-gray)',
              borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all .2s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'new' && (
        <div className="card" style={{ padding: 32 }}>
          {/* Progress steps */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 16, left: '5%', right: '5%', height: 2, background: 'var(--border)', zIndex: 0 }} />
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--border)',
                  color: i <= step ? '#fff' : 'var(--text-gray)',
                  fontWeight: 700, fontSize: 13, transition: 'all .3s',
                }}>
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span style={{ marginTop: 6, fontSize: 11, color: i === step ? 'var(--primary)' : 'var(--text-gray)', textAlign: 'center', maxWidth: 80 }}>
                  {s}
                </span>
              </div>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {/* Step 0: Type de correction */}
              {step === 0 && (
                <div>
                  <h3 style={{ marginBottom: 20 }}>Quel type de correction souhaitez-vous effectuer ?</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {TYPES_CORRECTION.map(t => (
                      <button key={t.key} onClick={() => setTypeCorrection(t.key)} style={{
                        padding: 24, border: `2px solid ${typeCorrection === t.key ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 12, background: typeCorrection === t.key ? 'var(--primary-bg)' : 'var(--card-bg)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all .2s',
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                        <div style={{ fontWeight: 700, marginBottom: 4, color: typeCorrection === t.key ? 'var(--primary)' : 'var(--text)' }}>{t.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-gray)' }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Informations actuelles */}
              {step === 1 && (
                <div>
                  <h3 style={{ marginBottom: 20 }}>Vos informations actuelles</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {Object.entries(currentData).map(([field, value]) => (
                      <div key={field} style={{ padding: '12px 16px', background: 'var(--sidebar-bg)', borderRadius: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 2 }}>{FIELD_LABELS[field] ?? field}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{value || <em style={{ color: 'var(--text-gray)' }}>Non renseigné</em>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Nouvelles informations */}
              {step === 2 && (
                <div>
                  <h3 style={{ marginBottom: 8 }}>Saisissez les nouvelles informations</h3>
                  <p style={{ color: 'var(--text-gray)', fontSize: 13, marginBottom: 20 }}>Ne remplissez que les champs que vous souhaitez modifier.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {Object.keys(currentData).map(field => (
                      <div key={field}>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-gray)', marginBottom: 4 }}>
                          {FIELD_LABELS[field] ?? field}
                        </label>
                        <input
                          type="text"
                          placeholder={String(currentData[field] || '')}
                          value={newData[field] ?? ''}
                          onChange={e => handleNewDataChange(field, e.target.value)}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Justificatifs */}
              {step === 3 && (
                <div>
                  <h3 style={{ marginBottom: 20 }}>Documents justificatifs (optionnel)</h3>
                  <div style={{
                    border: '2px dashed var(--border)', borderRadius: 12, padding: 40,
                    textAlign: 'center', cursor: 'pointer', background: 'var(--sidebar-bg)',
                  }}>
                    <Upload size={40} style={{ color: 'var(--text-gray)', marginBottom: 12 }} />
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Glissez vos fichiers ici</div>
                    <div style={{ fontSize: 13, color: 'var(--text-gray)' }}>PDF, JPG, PNG — 10 Mo max</div>
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFiles(Array.from(e.target.files))} style={{ marginTop: 12 }} />
                  </div>
                  {files.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      {files.map((f, i) => (
                        <div key={i} style={{ padding: '8px 12px', background: 'var(--primary-bg)', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                          📎 {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Aperçu comparaison */}
              {step === 4 && (
                <div>
                  <h3 style={{ marginBottom: 20 }}>Aperçu des modifications</h3>
                  <div style={{ marginBottom: 24 }}>
                    {Object.keys(currentData)
                      .filter(k => newData[k] !== undefined && newData[k] !== '' && newData[k] !== currentData[k])
                      .map(field => (
                        <div key={field} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{FIELD_LABELS[field] ?? field}</div>
                          <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 13, textDecoration: 'line-through' }}>
                            {String(currentData[field] || 'Vide')}
                          </div>
                          <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: 8, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
                            {newData[field]}
                          </div>
                        </div>
                      ))}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Justification <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <textarea
                      value={justification}
                      onChange={e => setJustification(e.target.value)}
                      placeholder="Expliquez pourquoi ces informations doivent être corrigées..."
                      rows={4}
                      className="form-input"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <CheckCircle2 size={64} style={{ color: 'var(--success)', marginBottom: 16 }} />
                  <h3 style={{ marginBottom: 8 }}>Prêt à envoyer votre demande</h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32 }}>
                    Votre demande de correction sera transmise à l'agent RH pour traitement.
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="action-btn primary"
                    style={{ padding: '12px 32px', fontSize: 16 }}
                  >
                    {submitting ? 'Envoi...' : <><Send size={16} style={{ marginRight: 8 }} />Envoyer la demande</>}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {step < 5 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="action-btn"
                style={{ opacity: step === 0 ? 0.4 : 1 }}
              >
                <ArrowLeft size={16} style={{ marginRight: 6 }} />Précédent
              </button>
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="action-btn primary"
                style={{ opacity: canProceed() ? 1 : 0.4 }}
              >
                Suivant<ArrowRight size={16} style={{ marginLeft: 6 }} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="card">
          <h3 style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', margin: 0 }}>Historique de mes demandes</h3>
          {loadingHistory ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-gray)' }}>Chargement...</div>
          ) : history.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-gray)' }}>Aucune demande de correction.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Traité le</th>
                  <th>Motif refus</th>
                </tr>
              </thead>
              <tbody>
                {history.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.typeCorrection}</td>
                    <td>{c.dateCreation ? new Date(c.dateCreation).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>{getStatusBadge(c.statut)}</td>
                    <td>{c.dateTraitement ? new Date(c.dateTraitement).toLocaleDateString('fr-FR') : '-'}</td>
                    <td style={{ color: 'var(--danger)', fontSize: 13 }}>{c.motifRefus ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </motion.div>
  );
}
