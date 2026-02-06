
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppHeader, Tabs } from './components/layout/AppLayout';
import { AuthPage } from './components/pages/AuthPage';
import { HomePage } from './components/pages/HomePage';
import { NewRequestPage } from './components/pages/NewRequestPage';
import { MyRequestsPage } from './components/pages/MyRequestsPage';
import { AnalysisPage } from './components/pages/AnalysisPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { kanbanStatuses, WIZARD_STORAGE_KEY, USER_SESSION_KEY, REMEMBER_ME_KEY } from './constants/app-constants';

const App = () => {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('home');
    const [requests, setRequests] = useState<any[]>([]);
    const [drafts, setDrafts] = useState<any[]>([]);
    
    useEffect(() => {
        const storedRequests = localStorage.getItem('cab-requests');
        if (storedRequests) setRequests(JSON.parse(storedRequests));
        
        const storedDrafts = localStorage.getItem('cab-drafts');
        if (storedDrafts) setDrafts(JSON.parse(storedDrafts));
        
        // Verificação de sessão persistente (Auto-login)
        const storedUser = localStorage.getItem(USER_SESSION_KEY);
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // Tentar login automático se houver credenciais salvas em "Lembrar-me"
            const remembered = localStorage.getItem(REMEMBER_ME_KEY);
            if (remembered) {
                const { email, password } = JSON.parse(remembered);
                handleLogin(email, password, true);
            }
        }
    }, []);

    const handleLogin = (email: string, password: any, remember: boolean = false) => {
        // Mock de validação: password 123456
        if (password === '123456') {
            const userData = { name: email.split('@')[0], email };
            setUser(userData);
            
            // Salvar sessão (sempre)
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
            
            // Gerenciar "Lembrar-me"
            if (remember) {
                localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({ email, password }));
            } else {
                localStorage.removeItem(REMEMBER_ME_KEY);
            }
            
            return true;
        }
        return false;
    };

    const handleLogout = () => { 
        setUser(null); 
        localStorage.removeItem(USER_SESSION_KEY); 
        localStorage.removeItem(REMEMBER_ME_KEY); // Limpar credenciais automáticas no logout manual
        setActiveTab('home'); 
    };

    const addRequest = (formData: any, draftIdToDelete: string | null = null) => {
        const newId = `CAB-REQ-${Date.now()}`;
        const newRequest = { id: newId, title: formData.informacoesGerais.motivoMudanca, leader: formData.informacoesGerais.liderMudanca, classification: formData.informacoesGerais.classificacao, status: 'Submitted', formData, solicitanteEmail: user.email };
        const updated = [newRequest, ...requests];
        setRequests(updated);
        localStorage.setItem('cab-requests', JSON.stringify(updated));
        if (draftIdToDelete) {
            const updatedDrafts = drafts.filter(d => d.id !== draftIdToDelete);
            setDrafts(updatedDrafts);
            localStorage.setItem('cab-drafts', JSON.stringify(updatedDrafts));
        }
        return newId;
    };

    const saveDraft = (formData: any, existingId: string | null = null) => {
        const draftId = existingId || `DRAFT-${Date.now()}`;
        const newDraft = { id: draftId, title: formData.informacoesGerais.motivoMudanca || '(Sem título)', savedAt: new Date().toISOString(), formData, solicitanteEmail: user.email };
        const updated = [newDraft, ...drafts.filter(d => d.id !== draftId)];
        setDrafts(updated);
        localStorage.setItem('cab-drafts', JSON.stringify(updated));
        return draftId;
    };

    if (!user) return <AuthPage onLogin={handleLogin} onRegister={() => true} onRecover={() => '123456'} />;

    return (
        <>
            <AppHeader user={user} onLogout={handleLogout} />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="container">
                {activeTab === 'home' && <HomePage requests={requests} setActiveTab={setActiveTab} kanbanStatuses={kanbanStatuses} />}
                {activeTab === 'newRequest' && <NewRequestPage addRequest={addRequest} currentUser={user} onSaveDraft={saveDraft} onAutoSaveDraft={saveDraft} />}
                {activeTab === 'myRequests' && <MyRequestsPage requests={requests} currentUser={user} kanbanStatuses={kanbanStatuses} drafts={drafts} onContinueDraft={(id:string) => { localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(drafts.find(d=>d.id===id))); setActiveTab('newRequest'); }} onDeleteDraft={(id:string) => setDrafts(drafts.filter(d=>d.id!==id))} onCreateFromCopy={(r:any) => { localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(r)); setActiveTab('newRequest'); }} onAdminNewRequest={() => setActiveTab('newRequest')} />}
                {activeTab === 'analysis' && <AnalysisPage requests={requests} kanbanStatuses={kanbanStatuses} onAdminNewRequest={() => setActiveTab('newRequest')} onNavigateToDashboard={() => setActiveTab('dashboard')} />}
                {activeTab === 'dashboard' && <DashboardPage onBack={() => setActiveTab('analysis')} />}
            </main>
        </>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
