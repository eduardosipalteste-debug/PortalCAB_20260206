
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/AppUI';
import { CalendarIcon, DownloadIcon } from '../icons/AppIcons';
import { generateAndUploadPdf, generateTimeSlots } from '../../utils/app-utils';
import { sipalBlue } from '../../constants/app-constants';

const DayEditor = ({ date, data, onSave, onClose }: any) => {
    const [status, setStatus] = useState(data?.status || 'open');
    const [selectedSlots, setSelectedSlots] = useState(data?.slots || []);
    const allSlots = useMemo(() => generateTimeSlots(), []);
    const toggleSlot = (slot: string) => selectedSlots.includes(slot) ? setSelectedSlots(selectedSlots.filter(s => s !== slot)) : setSelectedSlots([...selectedSlots, slot]);
    const handleSave = () => onSave({ status, slots: status === 'meeting' ? selectedSlots : [] });

    return (
        <div className="day-editor">
            <h3>Configurar dia: {new Date(date).toLocaleDateString('pt-BR')}</h3>
            <div className="status-selector">
                <h4>Status do Dia</h4>
                <div className="radio-group-vertical">
                    {['open', 'freeze', 'meeting'].map(s => (
                        <label key={s} className={`status-option ${s} ${status === s ? 'selected' : ''}`}><input type="radio" checked={status === s} onChange={() => setStatus(s)} /><span className="status-label">{s === 'open' ? 'Janela Aberta' : s === 'freeze' ? 'Bloqueado (Freeze)' : 'Reunião CAB'}</span></label>
                    ))}
                </div>
            </div>
            {status === 'meeting' && (
                <div className="slots-config-section" style={{marginTop: '1.5rem', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #eee'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem'}}><h4 style={{margin:0, color:'#666'}}>Horários Disponíveis</h4></div>
                    <div className="slots-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px'}}>
                        {allSlots.map(slot => (
                            <button key={slot} className={`slot-toggle-btn`} onClick={() => toggleSlot(slot)} style={{padding: '0.4rem', fontSize: '0.75rem', border: selectedSlots.includes(slot) ? '1px solid var(--sipal-teal)' : '1px solid #ddd', backgroundColor: selectedSlots.includes(slot) ? '#e0f2f1' : '#f9f9f9', color: selectedSlots.includes(slot) ? 'var(--sipal-teal)' : '#666', borderRadius: '4px', cursor: 'pointer', fontWeight: selectedSlots.includes(slot) ? '600' : '400'}}>{slot}</button>
                        ))}
                    </div>
                </div>
            )}
            <div className="day-editor-actions"><button onClick={onClose} className="nav-button secondary">Cancelar</button><button onClick={handleSave} className="submit-btn">Salvar Alterações</button></div>
        </div>
    );
};

export const AnalysisPage = ({ requests, onAdminNewRequest, kanbanStatuses = {}, onNavigateToDashboard }: any) => {
    const [isAdmModalOpen, setIsAdmModalOpen] = useState(false);
    const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [admPassword, setAdmPassword] = useState('');
    const [admError, setAdmError] = useState('');
    const [isLocked, setIsLocked] = useState(true);
    const [pagePassword, setPagePassword] = useState('');
    const [pageError, setPageError] = useState('');
    const [currentMonth, setCurrentMonth] = useState(9); 
    const [currentYear, setCurrentYear] = useState(2025);
    const [calendarData, setCalendarData] = useState({});
    const [editingDate, setEditingDate] = useState(null);

    const scheduledMeetings = useMemo(() => {
        const groups: any = {};
        if (Array.isArray(requests)) {
            requests.forEach(req => {
                const agenda = req.formData?.informacoesGerais?.dataAgendaCAB;
                if (agenda && agenda.trim() !== '') {
                    if (!groups[agenda]) groups[agenda] = [];
                    groups[agenda].push(req);
                }
            });
        }
        return Object.entries(groups).sort((a: any, b: any) => {
            const parseDate = (str: string) => {
                try {
                    const [datePart, timeRange] = str.split(' '); 
                    if (!datePart || !timeRange) return new Date(0);
                    const [day, month, year] = datePart.split('/');
                    const startTime = timeRange.split('-')[0].trim();
                    return new Date(`${year}-${month}-${day}T${startTime}:00`);
                } catch (e) { return new Date(0); }
            };
            return parseDate(a[0]).getTime() - parseDate(b[0]).getTime();
        });
    }, [requests]);

    useEffect(() => {
        const storedCalendar = localStorage.getItem('cab-calendar-data');
        if (storedCalendar) setCalendarData(JSON.parse(storedCalendar));
    }, []);

    const saveCalendarData = (dateStr: string, newData: any) => {
        const updated = { ...calendarData, [dateStr]: newData };
        setCalendarData(updated);
        localStorage.setItem('cab-calendar-data', JSON.stringify(updated));
    };

    const handlePageUnlock = (e: any) => {
        e.preventDefault();
        if (pagePassword === 'PMO@2026') { setIsLocked(false); setPageError(''); }
        else setPageError('Senha de acesso incorreta.');
    };

    const handleAdminAccess = () => {
        if (admPassword === 'PMO@2025') { setAdmPassword(''); setAdmError(''); setIsAdmModalOpen(false); onAdminNewRequest(); }
        else setAdmError('Senha incorreta. Tente novamente.');
    };
    
    const handleExportToExcel = () => {
        if (!Array.isArray(requests) || requests.length === 0) { alert('Nenhuma requisição para exportar.'); return; }
        const headers = ['Nº Acompanhamento', 'Título da Solicitação', 'Solicitante (E-mail)'];
        const csvRows = requests.map(req => {
            const row = [req.id, req.title, (req as any).solicitanteEmail || req.formData?.informacoesGerais?.solicitante || 'N/A'];
            return row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',');
        });
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'CAB_Solicitacoes.csv';
        link.click();
    };

    const changeMonth = (offset: number) => {
        let newMonth = currentMonth + offset;
        let newYear = currentYear;
        if (newMonth > 11) { newMonth = 0; newYear++; }
        else if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newYear < 2025 || (newYear === 2025 && newMonth < 9)) return;
        if (newYear > 2026) return;
        setCurrentMonth(newMonth); setCurrentYear(newYear);
    };

    const renderCalendarGrid = () => {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const days: any[] = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = (calendarData as any)[dateStr] || { status: 'open' };
            days.push(<div key={day} className={`calendar-day day-status-${dayData.status}`} onClick={() => setEditingDate(dateStr as any)}><span className="day-number">{day}</span></div>);
        }
        return days;
    };

    if (isLocked) return (
        <div className="analysis-page"><div className="card"><div className="auth-container" style={{padding: '2rem 0', background: 'none'}}><div className="auth-card" style={{maxWidth: '400px', margin: '0 auto'}}><h2>Acesso Restrito</h2><form onSubmit={handlePageUnlock}><div className="form-field"><label>Senha de Acesso</label><input type="password" value={pagePassword} onChange={(e) => setPagePassword(e.target.value)} autoFocus /></div>{pageError && <p className="auth-error">{pageError}</p>}<button type="submit" className="submit-btn auth-btn">Entrar</button></form></div></div></div></div>
    );

    return (
        <div className="analysis-page">
            <div className="card">
                <div className="request-list-header">
                    <div><h2>Controle Governança</h2><span className="subtitle">Total: {requests.length} requisições</span></div>
                    <div className="header-actions">
                        <button onClick={onNavigateToDashboard} className="nav-button secondary">Dashboard</button>
                        <button onClick={() => setIsCalendarModalOpen(true)} className="nav-button secondary"><CalendarIcon />Calendário</button>
                        <button onClick={() => setIsRoadmapModalOpen(true)} className="nav-button secondary">Roadmap</button>
                        <button onClick={() => setIsAdmModalOpen(true)} className="admin-access-btn">ADM</button>
                        <button onClick={handleExportToExcel} className="submit-btn"><DownloadIcon />Exportar para Excel</button>
                    </div>
                </div>
            </div>
            {scheduledMeetings.length > 0 && (
                <div className="card meeting-cards-section"><h3 style={{color: sipalBlue, marginBottom: '1.5rem'}}>Agenda de Reuniões CAB</h3>
                    <div className="meeting-grid">
                        {scheduledMeetings.map(([dateString, reqs]) => (
                            <div key={dateString} className="meeting-card">
                                <div className="meeting-header"><span className="meeting-date">{dateString.split(' ')[0]}</span><span className="meeting-time">{dateString.split(' ')[1]}</span></div>
                                <div className="meeting-body">{(reqs as any[]).map((req, idx) => (<div key={idx} className="meeting-item"><span className="meeting-item-id">{req.id}</span><span className="meeting-item-title">{req.title}</span></div>))}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="card"><div className="request-list">
                <table>
                    <thead><tr><th>Nº Acompanhamento</th><th>Título da Solicitação</th><th>Solicitante</th><th>Classificação</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody>
                        {requests.map((req: any) => (
                            <tr key={req.id}><td>{req.id}</td><td>{req.title}</td><td>{req.formData?.informacoesGerais?.solicitante}</td><td>{req.classification}</td><td>{req.formData?.informacoesGerais?.dataMudanca}</td><td><span className={`status-badge status-${req.status.toLowerCase()}`}>{kanbanStatuses[req.status] || req.status}</span></td><td><button onClick={() => generateAndUploadPdf(req.formData, req.id)} className="action-button download-btn" title="Enviar Relatório PDF para o Governança"><DownloadIcon /></button></td></tr>
                        ))}
                    </tbody>
                </table>
            </div></div>
            <Modal isOpen={isCalendarModalOpen} onClose={() => { setIsCalendarModalOpen(false); setEditingDate(null); }} title="Calendário de Mudanças" footer={<button onClick={() => setIsCalendarModalOpen(false)} className="nav-button">Fechar</button>}>
                {editingDate ? <DayEditor date={editingDate} data={(calendarData as any)[editingDate]} onSave={(newData: any) => { saveCalendarData(editingDate!, newData); setEditingDate(null); }} onClose={() => setEditingDate(null)} /> : 
                <div className="calendar-container"><div className="calendar-controls"><button onClick={() => changeMonth(-1)}>&lt;</button><h3>{currentYear}</h3><button onClick={() => changeMonth(1)}>&gt;</button></div><div className="calendar-grid">{renderCalendarGrid()}</div></div>}
            </Modal>
        </div>
    );
};
