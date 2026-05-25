import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, Trash2,
  Calendar, AlertTriangle, FileText, Info,
  CheckCircle2, X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '../services/api';

const Notifications = () => {
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');

  const getTranslatedTitle = (title) => {
    if (i18n.language === 'en') {
      if (title === 'Nouvelle demande de congé') return 'New Leave Request';
      if (title === 'Document expiré') return 'Expired Document';
      if (title === 'Mise à jour du système') return 'System Update';
      if (title === 'Fiche de paie disponible') return 'Payslip Available';
      if (title === 'Alerte Absence') return 'Absence Alert';
      if (title === 'Nouveau message RH') return 'New HR Message';
    }
    return title;
  };

  const getTranslatedMessage = (msg) => {
    if (i18n.language === 'en') {
      if (msg.startsWith('Ali Benali a soumis')) return 'Ali Benali submitted a leave request for the period of May 20 to 25.';
      if (msg.startsWith('Le contrat de travail')) return 'The employment contract of Marc Leblanc expires in 15 days. Please plan for renewal.';
      if (msg.startsWith('La plateforme RH')) return 'The HR Management platform has been updated to version 2.4.0. Discover the news.';
      if (msg.startsWith('Votre fiche de paie')) return 'Your payslip for the month of April 2026 is now available for download.';
      if (msg.startsWith('Leïla Mansour est absente')) return 'Leïla Mansour is absent today without prior justification.';
      if (msg.startsWith('Un nouveau message')) return 'A new message has been posted in the general channel.';
    }
    return msg;
  };

  const getTranslatedTime = (time) => {
    if (i18n.language === 'en') {
      if (time === 'Il y a 10 min') return '10 min ago';
      if (time === 'Il y a 2h') return '2h ago';
      if (time === 'Hier') return 'Yesterday';
      if (time === '2 jours') return '2 days ago';
      if (time === '3 jours') return '3 days ago';
      if (time === '4 jours') return '4 days ago';
    }
    return time;
  };
  const [notifications, setNotifications] = useState([]);

  const normalise = (n) => ({
    id: n.id,
    title: n.titre,
    message: n.message,
    time: n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : '',
    date: n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR') : '',
    type: n.type === 'error' ? 'alert' : n.type === 'success' ? 'info' : 'info',
    unread: !n.isRead,
    category: 'general',
  });

  useEffect(() => {
    notificationApi.list()
      .then(r => setNotifications((r.data?.data ?? r.data ?? []).map(normalise)))
      .catch(() => {});
  }, []);

  const filteredNotifs = activeTab === 'all'
    ? notifications
    : (activeTab === 'unread' ? notifications.filter(n => n.unread) : notifications.filter(n => n.type === activeTab));

  const markAllRead = async () => {
    await notificationApi.markAllRead().catch(() => {});
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    showToast('Toutes les notifications marquées comme lues', 'success');
  };

  const deleteNotif = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    showToast('Notification supprimée');
  };

  const toggleRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (notif?.unread) {
      await notificationApi.markRead(id).catch(() => {});
    }
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'request': return <FileText size={20} style={{ color: 'var(--primary)' }} />;
      case 'alert': return <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />;
      default: return <Info size={20} style={{ color: 'var(--text-gray)' }} />;
    }
  };

  const getStatusStyle = (notif) => {
    if (notif.unread) {
      return {
        backgroundColor: 'var(--primary-bg)',
        borderColor: 'rgba(37, 99, 235, 0.2)',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.05)'
      };
    }
    return {
      backgroundColor: 'var(--main-bg)',
      borderColor: 'var(--border-color)',
    };
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', maxWidth: '900px', margin: '0 auto' }}>
      <header className="header" style={{ marginBottom: '24px', flexShrink: 0 }}>
        <div className="header-title">
          <h1>{i18n.language === 'fr' ? 'Centre de Notifications' : 'Notification Center'}</h1>
          <p>{i18n.language === 'fr' ? 'Gérez vos alertes et restez informé des activités RH' : 'Manage your alerts and stay informed of HR activities'}</p>
        </div>
        <div className="header-actions">
          <button onClick={markAllRead} className="action-btn" style={{ gap: '8px' }}>
            <CheckCircle2 size={16} /> {i18n.language === 'fr' ? 'Tout marquer lu' : 'Mark all as read'}
          </button>
        </div>
      </header>

      {/* Tabs / Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px', flexShrink: 0 }}>
        {[
          { id: 'all', label: i18n.language === 'fr' ? 'Toutes' : 'All', count: notifications.length },
          { id: 'unread', label: i18n.language === 'fr' ? 'Non lues' : 'Unread', count: notifications.filter(n => n.unread).length },
          { id: 'request', label: i18n.language === 'fr' ? 'Demandes' : 'Requests', count: notifications.filter(n => n.type === 'request').length },
          { id: 'alert', label: i18n.language === 'fr' ? 'Alertes' : 'Alerts', count: notifications.filter(n => n.type === 'alert').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 20px', 
              borderRadius: '12px', 
              fontSize: '14px', 
              fontWeight: 600, 
              cursor: 'pointer',
              border: '1px solid',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'var(--main-bg)',
              borderColor: activeTab === tab.id ? 'var(--primary)' : 'var(--border-color)',
              color: activeTab === tab.id ? 'white' : 'var(--text-gray)',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '99px', 
                fontSize: '11px', 
                backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--sidebar-bg)',
                color: activeTab === tab.id ? 'white' : 'var(--text-gray)'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', paddingBottom: '20px' }}>
        <AnimatePresence mode="popLayout">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((notif, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={notif.id}
                style={{ 
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: '1px solid', 
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '16px',
                  transition: 'all 0.2s',
                  ...getStatusStyle(notif)
                }}
                className="glass-card"
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: notif.type === 'alert' ? 'rgba(239, 68, 68, 0.1)' : (notif.type === 'request' ? 'rgba(37, 99, 235, 0.1)' : 'var(--sidebar-bg)'),
                  flexShrink: 0 
                }}>
                  {getIcon(notif.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>{getTranslatedTitle(notif.title)}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-light)' }}>
                      <Calendar size={12} />
                      {notif.date === '16 Mai 2026' && i18n.language === 'en' ? 'May 16, 2026' : notif.date}
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '14px', color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '16px' }}>
                    {getTranslatedMessage(notif.message)}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-light)' }}>{getTranslatedTime(notif.time)}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => toggleRead(notif.id)}
                        className="modern-action-btn"
                        style={{ color: notif.unread ? 'var(--primary)' : 'var(--text-gray)' }}
                        title="Marquer comme lu"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => deleteNotif(notif.id)}
                        className="modern-action-btn"
                        style={{ color: 'var(--danger)' }}
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '80px 20px', border: '2px dashed var(--border-color)', borderRadius: '24px' }}
            >
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Bell size={40} style={{ color: 'var(--text-light)' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>{i18n.language === 'fr' ? 'Aucune notification' : 'No notifications'}</h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '14px' }}>{i18n.language === 'fr' ? 'Vous êtes à jour ! Revenez plus tard pour de nouvelles alertes.' : 'You are up to date! Come back later for new alerts.'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notifications;
