import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Users, Tag, Clock } from 'lucide-react';

export default function Calendar() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Standard Moroccan official public holidays list for rendering
  const moroccanHolidays = [
    { month: 0, day: 1, nameFr: "Nouvel An", nameEn: "New Year's Day" },
    { month: 0, day: 11, nameFr: "Manifeste de l'Indépendance", nameEn: "Independence Manifesto" },
    { month: 4, day: 1, nameFr: "Fête du Travail", nameEn: "Labour Day" },
    { month: 6, day: 30, nameFr: "Fête du Trône", nameEn: "Throne Day" },
    { month: 7, day: 14, nameFr: "Allégeance Oued Eddahab", nameEn: "Oued Eddahab Day" },
    { month: 7, day: 20, nameFr: "Révolution du Roi et du Peuple", nameEn: "Revolution of the King & People" },
    { month: 7, day: 21, nameFr: "Fête de la Jeunesse", nameEn: "Youth Day" },
    { month: 10, day: 6, nameFr: "Marche Verte", nameEn: "Green March Day" },
    { month: 10, day: 18, nameFr: "Fête de l'Indépendance", nameEn: "Independence Day" }
  ];

  // Simulated active employee absence/leave planner events
  const leaveEvents = [
    { day: 5, month: 4, type: 'paid', employee: 'Sarah Connor', labelFr: 'Congé Annuel', labelEn: 'Annual Leave' },
    { day: 12, month: 4, type: 'sick', employee: 'Ali Benali', labelFr: 'Congé Maladie', labelEn: 'Sick Leave' },
    { day: 15, month: 4, type: 'remote', employee: 'Yassine Mansouri', labelFr: 'Télétravail', labelEn: 'Remote Work' },
    { day: 19, month: 4, type: 'paid', employee: 'Marc Leblanc', labelFr: 'Congé Annuel', labelEn: 'Annual Leave' },
    { day: 22, month: 4, type: 'remote', employee: 'Salma Alami', labelFr: 'Télétravail', labelEn: 'Remote Work' },
    { day: 8, month: 5, type: 'paid', employee: 'Karim Bennani', labelFr: 'Congé Annuel', labelEn: 'Annual Leave' }
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust so Monday is first day of the week
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyBoxes = Array.from({ length: adjustedFirstDay });

  // Get active holidays for current date context
  const getHolidayForDay = (d) => moroccanHolidays.find(h => h.month === month && h.day === d);
  const getLeaveForDay = (d) => leaveEvents.filter(l => l.month === month && l.day === d);

  // Month Translation helpers
  const getMonthName = () => {
    return currentDate.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });
  };

  const weekdays = i18n.language === 'fr' 
    ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Selected Day Details
  const selectedDayHolidays = getHolidayForDay(selectedDay);
  const selectedDayLeaves = getLeaveForDay(selectedDay);

  const getEventBadgeColor = (type) => {
    switch (type) {
      case 'paid': return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' };
      case 'sick': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' };
      case 'remote': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' };
      default: return { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {i18n.language === 'fr' ? 'Planificateur & Événements' : 'Planner & Public Events'}
          </h2>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            {i18n.language === 'fr' ? 'Planifiez et visualisez les congés, absences et jours fériés officiels.' : 'Plan and visualize employee leaves and official public holidays.'}
          </p>
        </div>
        
        {/* Navigation Month Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDark ? '#1e293b' : '#ffffff', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, padding: '6px 12px', borderRadius: '12px', boxShadow: 'var(--shadow-card)' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-gray)', cursor: 'pointer', display: 'flex', padding: 4 }}><ChevronLeft style={{ width: 18, height: 18 }} /></button>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', textTransform: 'capitalize', minWidth: '130px', textAlign: 'center' }}>{getMonthName()}</span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-gray)', cursor: 'pointer', display: 'flex', padding: 4 }}><ChevronRight style={{ width: 18, height: 18 }} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }} className="calendar-layout-grid">
        {/* Left Side: Calendar Grid Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Calendar Weekday Names Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', borderBottom: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, paddingBottom: '12px' }}>
            {weekdays.map((day, idx) => (
              <span key={idx} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase' }}>{day}</span>
            ))}
          </div>

          {/* Calendar Body Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', flex: 1 }}>
            {emptyBoxes.map((_, idx) => (
              <div key={`empty-${idx}`} style={{ minHeight: '60px', opacity: 0.15 }}></div>
            ))}
            
            {daysArr.map((day) => {
              const holiday = getHolidayForDay(day);
              const dayLeaves = getLeaveForDay(day);
              const isSelected = selectedDay === day;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

              return (
                <div 
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    minHeight: '75px',
                    padding: '8px',
                    borderRadius: '12px',
                    border: isSelected 
                      ? '1.5px solid #2563eb' 
                      : `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    background: isSelected 
                      ? 'rgba(37,99,235,0.05)' 
                      : (isToday ? 'rgba(37,99,235,0.02)' : (isDark ? '#1e293b' : '#ffffff')),
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 8px 20px -6px rgba(37,99,235,0.15)' : 'none',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span 
                      style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: 700, 
                        color: isSelected ? '#2563eb' : (isDark ? '#cbd5e1' : '#1e293b'),
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isToday ? '#2563eb' : 'transparent',
                        color: isToday ? '#ffffff' : (isSelected ? '#2563eb' : 'inherit')
                      }}
                    >
                      {day}
                    </span>
                    {holiday && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 700 }}>🇲🇦</span>
                    )}
                  </div>

                  {/* Leave Events list badges inside day */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                    {dayLeaves.map((l, idx) => {
                      const colorTokens = getEventBadgeColor(l.type);
                      return (
                        <div 
                          key={idx}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: colorTokens.bg,
                            color: colorTokens.color,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {l.employee.split(' ')[0]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Day Events Card Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, paddingBottom: '12px', margin: 0 }}>
              <CalendarIcon style={{ width: 18, height: 18, color: '#2563eb' }} />
              {selectedDay} {getMonthName()}
            </h3>

            {/* Public Holiday Details */}
            {selectedDayHolidays ? (
              <div 
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)', 
                  border: '1.5px solid rgba(245,158,11,0.2)' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <Tag style={{ width: 14, height: 14 }} />
                  {i18n.language === 'fr' ? 'Jour Férié Officiel' : 'Official Public Holiday'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b' }}>
                  {i18n.language === 'fr' ? selectedDayHolidays.nameFr : selectedDayHolidays.nameEn}
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#f59e0b', marginTop: '6px', fontWeight: 600 }}>
                  <MapPin style={{ width: 12, height: 12 }} /> Maroc (Royaume Entier)
                </span>
              </div>
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', border: `1px dashed ${isDark ? '#475569' : '#cbd5e1'}`, borderRadius: '12px', color: 'var(--text-gray)', fontSize: '0.85rem' }}>
                {i18n.language === 'fr' ? "Aucun jour férié aujourd'hui" : "No public holiday today"}
              </div>
            )}

            {/* Absences / Leaves List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gray)' }}>
                {i18n.language === 'fr' ? 'Absences & Plannings' : 'Leaves & Remote Work'}
              </div>

              {selectedDayLeaves.length > 0 ? (
                selectedDayLeaves.map((event, idx) => {
                  const colors = getEventBadgeColor(event.type);
                  return (
                    <div 
                      key={idx}
                      style={{
                        padding: '14px',
                        border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        background: isDark ? '#1e293b' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users style={{ width: 14, height: 14, color: '#2563eb' }} />
                          {event.employee}
                        </span>
                        <span 
                          style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            background: colors.bg, 
                            color: colors.color, 
                            textTransform: 'uppercase' 
                          }}
                        >
                          {i18n.language === 'fr' ? event.labelFr : event.labelEn}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', border: `1.5px dashed ${isDark ? '#475569' : '#cbd5e1'}`, borderRadius: '12px', color: 'var(--text-gray)', fontSize: '0.85rem', textAlign: 'center' }}>
                  {i18n.language === 'fr' ? "Aucun collaborateur absent aujourd'hui." : "All employees are present today."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive layout CSS rules */}
      <style>{`
        @media (max-width: 1024px) {
          .calendar-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
