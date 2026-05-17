import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { Search, HelpCircle, ChevronDown, Rocket, Calendar, Shield, LifeBuoy, Send, BookOpen } from 'lucide-react';

const Help = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: 'Technique',
    message: ''
  });

  const categories = [
    { id: 'all', name: 'Tous les sujets', icon: BookOpen, color: 'var(--primary)' },
    { id: 'started', name: 'Démarrage', icon: Rocket, color: 'var(--c-purple)' },
    { id: 'leave', name: 'Congés & Absences', icon: Calendar, color: 'var(--success)' },
    { id: 'security', name: 'Profil & Sécurité', icon: Shield, color: 'var(--c-orange)' },
    { id: 'tech', name: 'Support Technique', icon: LifeBuoy, color: 'var(--danger)' }
  ];

  const faqs = [
    {
      id: 1,
      q: "Comment soumettre une nouvelle demande de congé ?",
      a: "Pour soumettre une demande de congé, accédez à la page 'Absences' ou à votre Tableau de bord. Cliquez sur le bouton 'Nouvelle Demande', choisissez le type de congé (Annuel, Maladie, etc.), sélectionnez les dates et cliquez sur 'Soumettre'. Votre manager recevra immédiatement une notification pour approuver ou rejeter la demande.",
      cat: 'leave'
    },
    {
      id: 2,
      q: "Où puis-je consulter mon solde de congés restant ?",
      a: "Votre solde de congés restant est affiché en haut de votre tableau de bord personnel sous forme de carte statistique colorée ('Solde de congés restants'). Ce solde est mis à jour en temps réel dès qu'une demande est approuvée par l'équipe RH.",
      cat: 'leave'
    },
    {
      id: 3,
      q: "Comment modifier les informations de mon profil ?",
      a: "Cliquez sur votre photo de profil en haut à droite de l'écran, puis sélectionnez 'Mon Profil'. Vous serez redirigé vers l'onglet 'Profil' de la page des paramètres où vous pourrez mettre à jour vos coordonnées personnelles et professionnelles.",
      cat: 'security'
    },
    {
      id: 4,
      q: "Comment activer l'authentification à deux facteurs (2FA) ?",
      a: "Allez dans votre profil en haut à droite, cliquez sur 'Sécurité & Accès' (ou accédez à l'onglet Sécurité dans les Paramètres). Sous la section 'Authentification à Deux Facteurs (2FA)', cliquez sur 'Activer 2FA' et suivez les instructions de configuration.",
      cat: 'security'
    },
    {
      id: 5,
      q: "Qui approuve mes demandes de congés et d'absences ?",
      a: "Toutes les demandes de congés sont transmises à votre manager direct ou au Responsable RH de votre département. Ils reçoivent une notification en temps réel et peuvent approuver ou rejeter la demande à partir de leur panneau d'administration.",
      cat: 'started'
    },
    {
      id: 6,
      q: "La plateforme prend-elle en charge le mode sombre ?",
      a: "Oui, la plateforme prend entièrement en charge le mode sombre. Vous pouvez basculer entre le mode clair et le mode sombre à tout moment en cliquant sur l'icône de lune/soleil située dans la barre d'en-tête supérieure.",
      cat: 'started'
    },
    {
      id: 7,
      q: "Que faire en cas de problème d'affichage ou de bug technique ?",
      a: "Si vous rencontrez un problème technique, essayez d'abord de rafraîchir la page (Ctrl+F5). Si le problème persiste, vous pouvez soumettre un ticket via le formulaire de contact ci-dessous, ou envoyer un e-mail à l'adresse support@rhmanagement.com.",
      cat: 'tech'
    }
  ];

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportForm.subject || !supportForm.message) {
      showToast('Veuillez remplir tous les champs du formulaire.', 'error');
      return;
    }
    showToast('Votre ticket de support a été envoyé avec succès ! Nous vous répondrons sous 24h.', 'success');
    setSupportForm({ subject: '', category: 'Technique', message: '' });
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.cat === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header / Hero Section */}
      <header className="header" style={{ marginBottom: '24px' }}>
        <div className="header-title">
          <h1>Centre d'Aide & Support</h1>
          <p>Trouvez des réponses instantanées à vos questions ou contactez notre équipe</p>
        </div>
      </header>

      {/* Search Hero Card */}
      <div className="card glass-card" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px', background: 'linear-gradient(135deg, var(--sidebar-bg), rgba(37, 99, 235, 0.04))', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>Comment pouvons-nous vous aider ?</h2>
        <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '20px' }}>Recherchez dans notre base de connaissances ou parcourez les catégories ci-dessous</p>
        
        <div style={{ position: 'relative', maxWidth: '560px', margin: '0 auto' }}>
          <Search size={18} color="var(--text-gray)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Rechercher une question, un mot-clé (ex: congé, 2FA)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px 12px 44px', 
              fontSize: '0.95rem',
              borderRadius: '30px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--main-bg)', 
              color: 'var(--text-dark)',
              outline: 'none',
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.2s'
            }} 
          />
        </div>
      </div>

      {/* Categories Horizontal Selector */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: isSelected ? cat.color : 'var(--border-color)',
                backgroundColor: isSelected ? `${cat.color}15` : 'var(--main-bg)',
                color: isSelected ? cat.color : 'var(--text-dark)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Grid: FAQ & Contact Form */}
      <div className="two-col-grid">
        {/* FAQs Accordion Block */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
            <HelpCircle size={18} color="var(--primary)" />
            Questions Fréquentes (FAQ)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isActive = activeFaq === faq.id;
                return (
                  <div 
                    key={faq.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--sidebar-bg)' : 'transparent',
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    <button
                      onClick={() => setActiveFaq(isActive ? null : faq.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: 'var(--text-dark)',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown 
                        size={16} 
                        style={{ 
                          transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          color: isActive ? 'var(--primary)' : 'var(--text-gray)'
                        }} 
                      />
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div style={{ 
                            padding: '0 16px 16px', 
                            fontSize: '0.85rem', 
                            color: 'var(--text-gray)', 
                            lineHeight: 1.6,
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '12px'
                          }}>
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-gray)' }}>
                <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--border-color)' }}></i>
                <p style={{ fontSize: '0.9rem' }}>Aucune question ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support Ticket Form */}
        <div className="card">
          <div className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
            <LifeBuoy size={18} color="var(--c-purple)" />
            Soumettre un Ticket d'Assistance
          </div>

          <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Catégorie du problème</label>
              <select 
                className="form-input"
                value={supportForm.category}
                onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                style={{ width: '100%' }}
              >
                <option>Technique / Bug d'affichage</option>
                <option>Congés / Absences / Comptes</option>
                <option>Suggestions d'amélioration</option>
                <option>Autre question générale</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Sujet du message</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Ex: Problème d'affichage du calendrier"
                value={supportForm.subject}
                onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Description détaillée</label>
              <textarea 
                className="form-input"
                placeholder="Décrivez précisément ce qui se passe..."
                value={supportForm.message}
                onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                style={{ 
                  width: '100%', 
                  minHeight: '120px', 
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.5
                }}
              />
            </div>

            <button 
              type="submit" 
              className="action-btn primary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '42px' }}
            >
              <Send size={16} />
              <span>Envoyer le Ticket</span>
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Help;
