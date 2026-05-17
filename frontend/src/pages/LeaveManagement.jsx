import React, { useState } from 'react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { Calendar, Clock, Umbrella, HeartPulse, User, MapPin } from 'lucide-react';

const LeaveManagement = () => {
  const { showToast } = useToast();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);

  const handleAction = (type, absence) => {
    setSelectedAbsence(absence);
    if (type === 'view') setIsViewModalOpen(true);
    if (type === 'edit') setIsEditModalOpen(true);
  };

  const onLeaveSubmit = () => {
    showToast('Absence enregistrée avec succès !', 'success');
    setIsLeaveModalOpen(false);
  };

  const onEditSubmit = () => {
    showToast('Absence mise à jour !', 'info');
    setIsEditModalOpen(false);
  };

  const absencesData = [
    { name: "Emma Wilson", dept: "Dép. Ventes", type: "Congé Annuel", period: "15 Oct - 20 Oct", duration: "5 jours", status: "Approuvé", initials: "EW", bg: "#2563EB" },
    { name: "David Chen", dept: "Dép. Ingénierie", type: "Maladie", period: "01 Nov - 03 Nov", duration: "3 jours", status: "Approuvé", initials: "DC", bg: "#10B981" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="header">
        <div className="header-title">
          <h1>Gestion des Congés & Absences</h1>
          <p>Suivez la disponibilité de l'équipe, approuvez les demandes et gérez les jours fériés</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={() => setIsLeaveModalOpen(true)}>
            <i className="fas fa-calendar-plus"></i> Enregistrer une Absence
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card emerald-card">
          <div className="stat-header">
            <div className="stat-icon primary"><i className="fas fa-umbrella-beach"></i></div>
          </div>
          <div className="stat-value">12</div>
          <div className="stat-label">En Congé Aujourd'hui</div>
        </div>
        <div className="stat-card amber-card">
          <div className="stat-header">
            <div className="stat-icon warning"><i className="fas fa-hourglass-half"></i></div>
          </div>
          <div className="stat-value">5</div>
          <div className="stat-label">Demandes en Attente</div>
        </div>
        <div className="stat-card purple-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}><i className="fas fa-briefcase-medical"></i></div>
          </div>
          <div className="stat-value">3</div>
          <div className="stat-label">Arrêts Maladie (Cette Semaine)</div>
        </div>
        <div className="stat-card blue-card">
          <div className="stat-header">
            <div className="stat-icon success"><i className="fas fa-calendar-check"></i></div>
          </div>
          <div className="stat-value">84%</div>
          <div className="stat-label">Disponibilité du Personnel</div>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Calendar Preview Section */}
        <div className="card" style={{ height: '100%' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Calendrier de l'Équipe (Novembre 2026)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="action-btn" style={{ padding: '6px', border: 'none' }}><i className="fas fa-chevron-left"></i></button>
              <button className="action-btn" style={{ padding: '6px', border: 'none' }}><i className="fas fa-chevron-right"></i></button>
            </div>
          </div>
          {/* Mini Calendar Component */}
          <div style={{ padding: '16px 0', background: 'transparent' }}>
            {/* Weekdays Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <div key={`${day}-${index}`} style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-gray)', textAlign: 'center' }}>{day}</div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {/* Empty cells */}
              {Array(6).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
              
              {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                const isToday = day === 16;
                const hasAbsence = [3, 8, 12, 13, 20, 24].includes(day);
                const isWeekend = (day + 6) % 7 === 6 || (day + 6) % 7 === 0;

                return (
                  <div key={day} style={{ 
                    height: '32px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'white' : (isWeekend ? 'var(--text-light)' : 'var(--text-dark)'),
                    background: isToday ? 'var(--primary)' : 'transparent',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    {day}
                    {hasAbsence && !isToday && (
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '2px', 
                        width: '3px', 
                        height: '3px', 
                        borderRadius: '50%', 
                        background: day === 13 ? '#EF4444' : 'var(--primary)' 
                      }}></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', padding: '0 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-gray)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                Congé Approuvé
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-gray)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }}></div>
                Alerte / Maladie
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-gray)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-light)', opacity: 0.3 }}></div>
                Weekend
              </div>
            </div>
          </div>
        </div>

        {/* Leave Requests Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Demandes de Congé</h3>
            <a href="#" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Voir Tout</a>
          </div>
          
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="avatar-sm" style={{ background: 'var(--warning)', width: '32px', height: '32px' }}>SJ</div>
                <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Steve Jobs</span>
              </div>
              <span className="filter-tag blue">Annuel</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
              20 Déc, 2026 - 02 Jan, 2027 (14 jours)
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="action-btn" style={{ flex: 1, padding: '6px', justifyContent: 'center', color: 'var(--danger)' }}>Rejeter</button>
              <button className="action-btn primary" style={{ flex: 1, padding: '6px', justifyContent: 'center', background: 'var(--success)', borderColor: 'var(--success)' }}>Approuver</button>
            </div>
          </div>

          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="avatar-sm" style={{ background: '#9333EA', width: '32px', height: '32px' }}>AK</div>
                <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Alex Kim</span>
              </div>
              <span className="filter-tag purple" style={{ background: '#FEE2E2', color: '#EF4444' }}>Maladie</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
              13 Nov, 2026 - 14 Nov, 2026 (2 jours)
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="action-btn" style={{ flex: 1, padding: '6px', justifyContent: 'center', color: 'var(--danger)' }}>Rejeter</button>
              <button className="action-btn primary" style={{ flex: 1, padding: '6px', justifyContent: 'center', background: 'var(--success)', borderColor: 'var(--success)' }}>Approuver</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card glass-card" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <h3 className="modern-table-title">
            <i className="fas fa-list" style={{ color: '#2563EB', marginRight: '10px' }}></i>
            Toutes les Absences
          </h3>
          <div className="filter-group">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Rechercher..." />
            </div>
          </div>
        </div>

        <div className="table-container table-responsive">
          <table>
            <thead>
              <tr>
                <th>Employé</th>
                <th>Type</th>
                <th>Période</th>
                <th>Durée</th>
                <th>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {absencesData.map((abs, i) => (
                <tr key={i}>
                  <td>
                    <div className="user-cell">
                      {abs.initials === "EW" ? (
                        <img src={`https://ui-avatars.com/api/?name=${abs.name}&background=${abs.bg.replace('#','')}&color=fff`} alt={abs.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      ) : (
                        <div className="avatar-initials" style={{ background: abs.bg }}>{abs.initials}</div>
                      )}
                      <div>
                        <span className="user-info-name">{abs.name}</span>
                        <span className="user-info-sub">{abs.dept}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="dept-pill" style={{ background: abs.type === 'Maladie' ? '#FEE2E2' : '#EFF6FF', color: abs.type === 'Maladie' ? '#E11D48' : '#2563EB' }}>{abs.type}</span></td>
                  <td style={{ color: '#64748B', fontWeight: 500 }}>{abs.period}</td>
                  <td style={{ color: '#64748B' }}>{abs.duration}</td>
                  <td><span className="modern-status-badge badge-success">{abs.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button className="modern-action-btn" onClick={() => handleAction('view', abs)}><i className="far fa-eye"></i></button>
                      <button className="modern-action-btn" onClick={() => handleAction('edit', abs)}><i className="far fa-edit"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Absence Modal */}
      <Modal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        title="Enregistrer une Absence"
        icon="fas fa-calendar-alt"
        iconColor="#2563EB"
        iconBg="#DBEAFE"
        submitColor="#2563EB"
        onSubmit={onLeaveSubmit}
        submitText="Enregistrer l'absence"
      >
        <form onSubmit={e => e.preventDefault()}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Type d'absence</label>
            <select className="form-input">
              <option>Congé Annuel</option>
              <option>Congé Maladie</option>
              <option>Absence Non Justifiée</option>
              <option>Maternité / Paternité</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date de début</label>
              <input type="date" className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date de fin</label>
              <input type="date" className="form-input" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Motif / Justification</label>
            <textarea className="form-input" rows="3" placeholder="Raison de l'absence..."></textarea>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Détails de l'Absence"
        icon="far fa-calendar-check"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        {selectedAbsence && (
          <div style={{ padding: '4px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: selectedAbsence.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, margin: '0 auto 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', border: '3px solid var(--main-bg)' }}>
                {selectedAbsence.initials}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>{selectedAbsence.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="filter-tag blue" style={{ padding: '2px 10px', fontSize: '0.65rem' }}>{selectedAbsence.dept}</span>
                <span className="modern-status-badge badge-success" style={{ padding: '2px 10px', fontSize: '0.65rem' }}>{selectedAbsence.status}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              <div className="detail-box" style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {selectedAbsence.type === 'Maladie' ? <HeartPulse size={12} color="var(--danger)" /> : <Umbrella size={12} color="var(--primary)" />}
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>Type de Congé</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.85rem' }}>{selectedAbsence.type}</span>
              </div>
              
              <div className="detail-box" style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Clock size={12} color="var(--warning)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>Durée Totale</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.85rem' }}>{selectedAbsence.duration}</span>
              </div>

              <div className="detail-box" style={{ gridColumn: 'span 2', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Calendar size={12} color="var(--success)" />
                  <span className="detail-label" style={{ fontSize: '0.65rem' }}>Période d'absence</span>
                </div>
                <span className="detail-value" style={{ fontSize: '0.85rem' }}>{selectedAbsence.period}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="action-btn primary" style={{ flex: 1, justifyContent: 'center', height: '42px', fontSize: '0.85rem' }} onClick={() => setIsViewModalOpen(false)}>
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
        title="Modifier l'Absence"
        icon="far fa-edit"
        iconColor="var(--primary)"
        iconBg="var(--primary-bg)"
        showFooter={false}
      >
        {selectedAbsence && (
          <form style={{ padding: '4px 0' }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Umbrella size={12} color="var(--primary)" /> Type d'absence
              </label>
              <select className="form-input" defaultValue={selectedAbsence.type}>
                <option>Congé Annuel</option>
                <option>Maladie</option>
                <option>Télétravail</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} color="var(--c-purple)" /> Période
              </label>
              <input type="text" className="form-input" defaultValue={selectedAbsence.period} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="action-btn primary" style={{ flex: 2, height: '42px' }} onClick={onEditSubmit}>Mettre à jour</button>
              <button type="button" className="action-btn" style={{ flex: 1, height: '42px' }} onClick={() => setIsEditModalOpen(false)}>Annuler</button>
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
};

export default LeaveManagement;
