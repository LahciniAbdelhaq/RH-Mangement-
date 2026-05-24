import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { logSystemActivity, triggerWorkflowNotification } from '../utils/rbac';
import { jsPDF } from 'jspdf';

const DOCS_TO_SIGN = [
  { id: 'DOC-004', type: 'Attestation de Travail', employee: 'Karim Ouali', dept: 'Finance', requestedAt: '2026-05-18', validatedByRH: true, status: 'En attente signature' },
  { id: 'DOC-007', type: 'Attestation de Salaire', employee: 'Nadia Benmoussa', dept: 'Ingénierie', requestedAt: '2026-05-19', validatedByRH: true, status: 'En attente signature' },
  { id: 'DOC-008', type: 'Attestation de Travail', employee: 'Youssef Tazi', dept: 'RH', requestedAt: '2026-05-20', validatedByRH: true, status: 'En attente signature' },
];

const SIGNED_DOCS = [
  { id: 'DOC-001', type: 'Attestation de Travail', employee: 'Ali Benali', dept: 'Ingénierie', signedAt: '2026-05-10 14:32', status: 'Signé' },
  { id: 'DOC-003', type: 'Bulletin de Paie (Avril)', employee: 'Ali Benali', dept: 'Ingénierie', signedAt: '2026-05-01 09:15', status: 'Signé' },
  { id: 'DOC-005', type: 'Bulletin de Paie (Mars)', employee: 'Sara Hamidi', dept: 'Marketing', signedAt: '2026-04-30 16:45', status: 'Signé' },
];

export default function Signature() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [pendingDocs, setPendingDocs] = useState(DOCS_TO_SIGN);
  const [signedDocs, setSignedDocs] = useState(SIGNED_DOCS);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [signatureData, setSignatureData] = useState(null);

  // Canvas drawing logic
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    setIsDrawing(true);
    setLastPos(pos);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setLastPos(pos);
    setHasSignature(true);
  }, [isDrawing, lastPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    return () => {
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const openSignModal = (doc) => {
    setSelectedDoc(doc);
    setIsSignModalOpen(true);
    setHasSignature(false);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 100);
  };

  const handleSign = () => {
    if (!hasSignature) {
      showToast('Veuillez apposer votre signature avant de valider.', 'warning');
      return;
    }
    const canvas = canvasRef.current;
    const sigData = canvas ? canvas.toDataURL('image/png') : null;
    setSignatureData(sigData);

    const now = new Date();
    const signedAt = now.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    setPendingDocs(prev => prev.filter(d => d.id !== selectedDoc.id));
    setSignedDocs(prev => [{
      ...selectedDoc,
      status: 'Signé',
      signedAt,
    }, ...prev]);

    triggerWorkflowNotification(selectedDoc.employee, 'Document signé — disponible', `Votre ${selectedDoc.type} a été signé électroniquement par la Secrétaire Générale. Vous pouvez le télécharger.`, 'success');
    logSystemActivity('Signature Électronique', user?.name, `Document ${selectedDoc.id} signé pour ${selectedDoc.employee}`);
    showToast(`Document "${selectedDoc.type}" signé et transmis à ${selectedDoc.employee} !`, 'success');
    setIsSignModalOpen(false);
    clearSignature();
  };

  const downloadSignedPDF = (doc) => {
    showToast('Génération du document signé...', 'info');
    setTimeout(() => {
      const pdf = new jsPDF();
      const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

      // Header
      pdf.setFillColor(190, 24, 93);
      pdf.rect(0, 0, 210, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('RH MANAGEMENT', 105, 14, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Document signé électroniquement par la Secrétaire Générale', 105, 24, { align: 'center' });

      // Type strip
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 35, 210, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(doc.type.toUpperCase(), 105, 40.5, { align: 'center' });

      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(doc.type.toUpperCase(), 105, 70, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Je soussigné(e), Secrétaire Générale de la société RH MANAGEMENT S.A.,', 20, 90, { maxWidth: 170 });
      pdf.text('atteste que le présent document a été dûment vérifié et signé électroniquement.', 20, 103, { maxWidth: 170 });

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, 115, 170, 40, 4, 4, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.text('Bénéficiaire :', 25, 127);
      pdf.setFont('helvetica', 'normal');
      pdf.text(doc.employee, 75, 127);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Département :', 25, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text(doc.dept, 75, 139);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Réf :', 25, 151);
      pdf.setFont('helvetica', 'normal');
      pdf.text(doc.id, 75, 151);

      // Signature section
      pdf.setFillColor(253, 242, 248);
      pdf.roundedRect(20, 175, 170, 50, 4, 4, 'F');
      pdf.setDrawColor(190, 24, 93);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, 175, 170, 50, 4, 4, 'S');

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(190, 24, 93);
      pdf.setFontSize(11);
      pdf.text('✦ SIGNATURE ÉLECTRONIQUE', 105, 188, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Signé par : ${user?.name}`, 105, 200, { align: 'center' });
      pdf.text(`Titre : Secrétaire Générale`, 105, 208, { align: 'center' });
      pdf.text(`Date et heure : ${doc.signedAt || today}`, 105, 216, { align: 'center' });

      // Footer
      const ph = pdf.internal.pageSize.height;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, ph - 20, 210, 20, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.line(0, ph - 20, 210, ph - 20);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('Document signé électroniquement — Valeur juridique reconnue — RH MANAGEMENT S.A.', 105, ph - 12, { align: 'center' });
      pdf.text(`Réf: ${doc.id} | Signé le ${doc.signedAt || today}`, 105, ph - 6, { align: 'center' });

      pdf.save(`${doc.type.replace(/\s+/g, '_')}_SIGNE_${doc.id}.pdf`);
      showToast('Document signé téléchargé !', 'success');
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1>
            <i className="fas fa-pen-fancy" style={{ color: '#BE185D', marginRight: '10px' }}></i>
            Signature Électronique
          </h1>
          <p>Apposez votre signature électronique sur les documents validés par le département RH</p>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: '#FDF2F8', borderRadius: '12px', border: '1px solid #FBCFE8' }}>
            <img src={user?.avatar} alt={user?.name} style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#BE185D' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#9D174D' }}>Secrétaire Générale</div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card pink-card">
          <div className="stat-header"><div className="stat-icon" style={{ background: '#FDF2F8', color: '#BE185D' }}><i className="fas fa-clock"></i></div></div>
          <div className="stat-value">{pendingDocs.length}</div>
          <div className="stat-label">En attente de signature</div>
        </div>
        <div className="stat-card emerald-card">
          <div className="stat-header"><div className="stat-icon success"><i className="fas fa-check-circle"></i></div></div>
          <div className="stat-value">{signedDocs.length}</div>
          <div className="stat-label">Documents signés</div>
        </div>
        <div className="stat-card blue-card">
          <div className="stat-header"><div className="stat-icon primary"><i className="fas fa-file-alt"></i></div></div>
          <div className="stat-value">{pendingDocs.length + signedDocs.length}</div>
          <div className="stat-label">Total traités</div>
        </div>
        <div className="stat-card amber-card">
          <div className="stat-header"><div className="stat-icon warning"><i className="fas fa-exclamation-triangle"></i></div></div>
          <div className="stat-value">{pendingDocs.length > 0 ? 1 : 0}</div>
          <div className="stat-label">Priorité Haute</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('pending')}
          style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: activeTab === 'pending' ? '#BE185D' : 'var(--card-bg)', color: activeTab === 'pending' ? '#fff' : 'var(--text-dark)', transition: 'all 0.2s' }}>
          <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
          En attente <span style={{ background: activeTab === 'pending' ? 'rgba(255,255,255,0.3)' : '#FEF2F2', color: activeTab === 'pending' ? '#fff' : '#BE185D', padding: '1px 7px', borderRadius: '10px', marginLeft: '6px', fontSize: '0.75rem' }}>{pendingDocs.length}</span>
        </button>
        <button onClick={() => setActiveTab('signed')}
          style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: activeTab === 'signed' ? '#10B981' : 'var(--card-bg)', color: activeTab === 'signed' ? '#fff' : 'var(--text-dark)', transition: 'all 0.2s' }}>
          <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i>
          Signés <span style={{ background: activeTab === 'signed' ? 'rgba(255,255,255,0.3)' : '#ECFDF5', color: activeTab === 'signed' ? '#fff' : '#10B981', padding: '1px 7px', borderRadius: '10px', marginLeft: '6px', fontSize: '0.75rem' }}>{signedDocs.length}</span>
        </button>
      </div>

      {/* Documents List */}
      {activeTab === 'pending' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          {pendingDocs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-gray)' }}>
              <i className="fas fa-check-double" style={{ fontSize: '2.5rem', color: '#10B981', marginBottom: '12px', display: 'block' }}></i>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Tous les documents ont été signés !</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Aucun document en attente de signature.</div>
            </div>
          ) : pendingDocs.map(doc => (
            <motion.div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '18px 20px' }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BE185D', fontSize: '1.2rem', flexShrink: 0 }}>
                <i className="fas fa-file-alt"></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>{doc.type}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '3px' }}>
                  <i className="fas fa-user" style={{ marginRight: '5px', color: 'var(--primary)' }}></i>{doc.employee}
                  <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                  <i className="fas fa-building" style={{ marginRight: '5px', color: '#7C3AED' }}></i>{doc.dept}
                  <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                  <i className="fas fa-calendar" style={{ marginRight: '5px', color: '#059669' }}></i>{doc.requestedAt}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, color: '#3B82F6', backgroundColor: '#EFF6FF' }}>
                    <i className="fas fa-check"></i> Validé par RH — En attente signature SG
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-light)', padding: '4px 8px', background: 'var(--sidebar-bg)', borderRadius: '6px' }}>{doc.id}</span>
                <button onClick={() => openSignModal(doc)}
                  style={{ padding: '8px 18px', background: '#BE185D', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                  <i className="fas fa-pen-fancy"></i> Signer
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'signed' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-toolbar">
            <h3 className="modern-table-title">Historique des Signatures</h3>
          </div>
          <div className="table-container table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Type de document</th>
                  <th>Bénéficiaire</th>
                  <th>Département</th>
                  <th>Signé le</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {signedDocs.map(doc => (
                  <tr key={doc.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#BE185D', fontSize: '0.8rem' }}>{doc.id}</span></td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.type}</td>
                    <td>{doc.employee}</td>
                    <td><span className="filter-tag blue">{doc.dept}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{doc.signedAt}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#BE185D', backgroundColor: '#FDF2F8' }}>
                        <i className="fas fa-pen-fancy"></i> Signé SG
                      </span>
                    </td>
                    <td>
                      <button onClick={() => downloadSignedPDF(doc)}
                        style={{ background: '#ECFDF5', color: '#10B981', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        <i className="fas fa-download"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sign Modal */}
      {selectedDoc && (
        <Modal isOpen={isSignModalOpen} onClose={() => { setIsSignModalOpen(false); clearSignature(); }}
          title={`Signer : ${selectedDoc?.type}`}
          icon="fas fa-pen-fancy" iconColor="#BE185D" iconBg="#FDF2F8"
          submitColor="#BE185D" onSubmit={handleSign} submitText="Apposer ma signature">
          <div>
            {/* Document Info */}
            <div style={{ background: 'var(--sidebar-bg)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
              {[
                ['Document', selectedDoc?.type],
                ['Bénéficiaire', selectedDoc?.employee],
                ['Département', selectedDoc?.dept],
                ['Référence', selectedDoc?.id],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-gray)' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Canvas Signature */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                  <i className="fas fa-pen-fancy" style={{ color: '#BE185D', marginRight: '6px' }}></i>
                  Apposez votre signature ci-dessous
                </label>
                <button onClick={clearSignature}
                  style={{ background: 'none', border: 'none', color: 'var(--text-gray)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fas fa-undo"></i> Effacer
                </button>
              </div>
              <div style={{ border: '2px solid #FBCFE8', borderRadius: '12px', overflow: 'hidden', background: '#fff', position: 'relative' }}>
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={160}
                  style={{ width: '100%', height: '160px', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                {!hasSignature && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#FBCFE8', fontSize: '0.85rem', fontWeight: 500, pointerEvents: 'none', textAlign: 'center' }}>
                    <i className="fas fa-pen-fancy" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '6px' }}></i>
                    Signez ici en maintenant le clic
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '8px', textAlign: 'center' }}>
                <i className="fas fa-lock" style={{ marginRight: '4px', color: '#BE185D' }}></i>
                Signature numérique sécurisée — {new Date().toLocaleString('fr-FR')}
              </div>
            </div>

            {/* Legal Notice */}
            <div style={{ background: '#FDF2F8', borderRadius: '10px', padding: '10px 14px', fontSize: '0.78rem', color: '#9D174D', lineHeight: 1.5 }}>
              <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
              En apposant votre signature électronique, vous certifiez avoir vérifié et validé le contenu de ce document. Cette signature a valeur juridique conformément aux dispositions légales en vigueur.
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
