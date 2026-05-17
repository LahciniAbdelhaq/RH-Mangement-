import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Settings = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profil');

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  return (
    <>
      <header className="header">
        <div className="header-title">
          <h1>Paramètres de la Plateforme</h1>
          <p>Gérez votre compte, les préférences de l'organisation et les intégrations</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={() => showToast('Modifications enregistrées !', 'success')}>
            <i className="fas fa-save"></i> Enregistrer les modifications
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Settings Menu */}
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column' }}>
          <button className={`settings-nav-item ${activeTab === 'profil' ? 'active' : ''}`} onClick={() => setActiveTab('profil')}>
            <i className="far fa-user-circle"></i> <span>Modifier le Profil</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'organisation' ? 'active' : ''}`} onClick={() => setActiveTab('organisation')}>
            <i className="far fa-building"></i> <span>Organisation</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <i className="far fa-bell"></i> <span>Notifications</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'securite' ? 'active' : ''}`} onClick={() => setActiveTab('securite')}>
            <i className="fas fa-shield-alt"></i> <span>Sécurité</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>
            <i className="fas fa-plug"></i> <span>Intégrations</span>
          </button>
        </div>

        {/* Settings Content Container */}
        <div className="card" style={{ flex: 1 }}>
          
          {/* Pane: Profil */}
          {activeTab === 'profil' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Modifier le Profil</h3>
              
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <img src="https://ui-avatars.com/api/?name=Sarah+Connor&background=2563EB&color=fff&size=128" alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="action-btn">Télécharger une photo</button>
                    <button className="action-btn" style={{ color: 'var(--danger)' }}>Supprimer</button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>JPG, GIF ou PNG. Taille max 800K</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Prénom</label>
                  <input type="text" defaultValue="Sarah" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Nom</label>
                  <input type="text" defaultValue="Connor" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Adresse Email</label>
                  <input type="email" defaultValue="sarah.connor@entreprise.com" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Rôle / Titre</label>
                  <input type="text" defaultValue="Directrice RH" disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none', background: 'var(--sidebar-bg)', color: 'var(--text-gray)' }} />
                </div>
              </div>
            </div>
          )}

          {/* Pane: Organisation */}
          {activeTab === 'organisation' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Paramètres de l'Organisation</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Nom de l'Entreprise</label>
                  <input type="text" defaultValue="Acme Corp" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Secteur d'Activité</label>
                  <input type="text" defaultValue="Technologies" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Taille de l'Entreprise</label>
                <select defaultValue="201-500 employés" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }}>
                  <option value="1-50 employés">1-50 employés</option>
                  <option value="51-200 employés">51-200 employés</option>
                  <option value="201-500 employés">201-500 employés</option>
                  <option value="500+ employés">500+ employés</option>
                </select>
              </div>
            </div>
          )}

          {/* Pane: Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>Préférences de Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
                  Recevoir un résumé hebdomadaire par email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
                  M'avertir des nouvelles demandes d'employés
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem' }}>
                  <input type="checkbox" style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
                  Alertes de conformité (Immédiat)
                </label>
              </div>
            </div>
          )}

          {/* Pane: Sécurité */}
          {activeTab === 'securite' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Sécurité & Mot de passe</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Mot de passe actuel</label>
                  <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Nouveau mot de passe</label>
                    <input type="password" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Confirmer le mot de passe</label>
                    <input type="password" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', outline: 'none' }} />
                  </div>
                </div>
              </div>
              <button className="action-btn primary" style={{ marginBottom: '16px' }} onClick={() => showToast('Mot de passe mis à jour !', 'success')}>Mettre à jour le mot de passe</button>
              
              <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Authentification à Deux Facteurs (2FA)</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Sécurisez votre compte</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Ajoute une couche de sécurité supplémentaire.</div>
                </div>
                <button className="action-btn">Activer 2FA</button>
              </div>
            </div>
          )}

          {/* Pane: Intégrations */}
          {activeTab === 'integrations' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>Intégrations</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <i className="fab fa-slack" style={{ fontSize: '2rem', color: '#E01E5A' }}></i>
                    <div>
                      <div style={{ fontWeight: 500 }}>Slack</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Recevez les notifications RH sur Slack.</div>
                    </div>
                  </div>
                  <button className="action-btn" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>Connecté</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <i className="fab fa-google" style={{ fontSize: '2rem', color: '#4285F4' }}></i>
                    <div>
                      <div style={{ fontWeight: 500 }}>Google Workspace</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Synchronisez les employés et calendriers.</div>
                    </div>
                  </div>
                  <button className="action-btn primary">Connecter</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Settings;
