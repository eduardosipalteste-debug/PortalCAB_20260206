
import React from 'react';
import { SipalLogo } from '../icons/AppIcons';

export const AppHeader = ({ user, onLogout }: { user: any, onLogout: () => void }) => (
    <header className="app-header">
        <div className="logo-container">
            <SipalLogo />
            <h1>Change Advisory Board</h1>
        </div>
        {user && (
            <div className="user-info">
                <span>Bem-vindo(a), <strong>{user.name}</strong></span>
                <button onClick={onLogout} className="logout-btn">Sair</button>
            </div>
        )}
    </header>
);

export const Tabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
    <nav className="tabs">
        <button
            className={`tab-button ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
            aria-current={activeTab === 'home' ? 'page' : undefined}
        >
            Início
        </button>
        <button
            className={`tab-button ${activeTab === 'newRequest' ? 'active' : ''}`}
            onClick={() => setActiveTab('newRequest')}
            aria-current={activeTab === 'newRequest' ? 'page' : undefined}
        >
            Nova Requisição de Mudança
        </button>
        <button
            className={`tab-button ${activeTab === 'myRequests' ? 'active' : ''}`}
            onClick={() => setActiveTab('myRequests')}
            aria-current={activeTab === 'myRequests' ? 'page' : undefined}
        >
            Controle das Minhas Solicitações
        </button>
        <button
            className={`tab-button ${(activeTab === 'analysis' || activeTab === 'dashboard') ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
            aria-current={(activeTab === 'analysis' || activeTab === 'dashboard') ? 'page' : undefined}
        >
            Controle Governança
        </button>
    </nav>
);
