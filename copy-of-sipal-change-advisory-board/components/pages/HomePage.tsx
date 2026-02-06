
import React from 'react';
import { RequestList } from '../ui/AppUI';

export const HomePage = ({ requests, setActiveTab, kanbanStatuses }: any) => (
    <>
    <div className="card">
        <h2>🚀 CAB – Change Advisory Board</h2>
        <p className="subtitle">Governança das mudanças para uma operação estável e estratégica.</p>
        <p>O CAB (Change Advisory Board), ou Comitê de Avaliação de Mudanças, é uma estrutura de governança que visa avaliar, aprovar e acompanhar mudanças no ambiente de tecnologia, garantindo que alterações sejam realizadas com segurança, alinhamento e previsibilidade.</p>
        <p>Para iniciar um novo processo, clique no botão abaixo. Para acompanhar o andamento das suas solicitações, veja a lista de requisições recentes.</p>
        <div className="home-actions">
            <button className="submit-btn" onClick={() => setActiveTab('newRequest')}>+ Nova Requisição de Mudança</button>
        </div>
    </div>
    <div className="card">
        <div className="request-list-header">
            <h2>Requisições de Mudança Recentes</h2>
            <button className="submit-btn" onClick={() => setActiveTab('analysis')}>Ver Todas as Requisições</button>
        </div>
        <RequestList requests={requests.slice(0, 5)} kanbanStatuses={kanbanStatuses} />
    </div>
    </>
);
