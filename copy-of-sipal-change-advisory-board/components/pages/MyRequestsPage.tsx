
import React, { useState } from 'react';
import { Modal } from '../ui/AppUI';
import { TrashIcon, EditIcon, DownloadIcon, CopyIcon } from '../icons/AppIcons';
import { generateAndUploadPdf } from '../../utils/app-utils';

export const MyRequestsPage = ({ requests, currentUser, kanbanStatuses, drafts, onContinueDraft, onDeleteDraft, onCreateFromCopy, onAdminNewRequest }: any) => {
    const myRequests = Array.isArray(requests) ? requests.filter((req: any) => req.solicitanteEmail === currentUser.email) : [];
    const [isAdmModalOpen, setIsAdmModalOpen] = useState(false);
    const [admPassword, setAdmPassword] = useState('');
    const [admError, setAdmError] = useState('');

    const handleAdminAccess = () => {
        if (admPassword === 'PMO@2025') {
            setAdmPassword(''); setAdmError(''); setIsAdmModalOpen(false); onAdminNewRequest();
        } else setAdmError('Senha incorreta. Tente novamente.');
    };

    return (
        <div className="my-requests-page">
            <div className="card">
                <div className="request-list-header"><h2>Controle das Minhas Solicitações</h2></div>
                <p>Visualize e gerencie todas as requisições de mudança que você submeteu, continue rascunhos salvos ou envie um relatório PDF para o sistema de controle.</p>
            </div>
            <div className="card">
                <div className="request-list-header"><h3>Rascunhos</h3><button onClick={() => setIsAdmModalOpen(true)} className="admin-access-btn">ADM</button></div>
                <div className="request-list">
                    <table>
                        <thead><tr><th>Título do Rascunho</th><th>Salvo em</th><th>Ações</th></tr></thead>
                        <tbody>
                            {drafts && drafts.length > 0 ? drafts.map((draft: any) => (
                                <tr key={draft.id}><td>{draft.title}</td><td>{new Date(draft.savedAt).toLocaleString('pt-BR')}</td><td className="actions-cell">
                                    <button onClick={() => onContinueDraft(draft.id)} className="btn-continue-draft"><EditIcon />Continuar</button>
                                    <button onClick={() => onDeleteDraft(draft.id)} className="action-button remove-row-btn" style={{ marginLeft: '10px' }}><TrashIcon /></button>
                                </td></tr>
                            )) : <tr><td colSpan={3} style={{textAlign: 'center'}}>Nenhum rascunho salvo.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="card"><h3>Solicitações Enviadas</h3>
                <div className="request-list">
                    <table>
                        <thead><tr><th>Nº Acompanhamento</th><th>Título da Solicitação</th><th>Status</th><th>Ações</th></tr></thead>
                        <tbody>
                            {myRequests.length > 0 ? myRequests.map((req: any) => {
                                const statusClass = req.status.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                return (
                                    <tr key={req.id}><td>{req.id}</td><td>{req.title}</td><td><span className={`status-badge status-${statusClass}`}>{kanbanStatuses[req.status] || req.status}</span></td><td className="actions-cell">
                                        <button onClick={() => generateAndUploadPdf(req.formData, req.id)} className="action-button download-btn" title="Enviar Relatório PDF" style={{ marginRight: '0.5rem' }}><DownloadIcon /></button>
                                        <button onClick={() => onCreateFromCopy(req)} className="btn-copy-request"><CopyIcon />Criar com Cópia</button>
                                    </td></tr>
                                );
                            }) : <tr><td colSpan={4} style={{textAlign: 'center'}}>Nenhuma requisição encontrada.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isAdmModalOpen} onClose={() => setIsAdmModalOpen(false)} title="Acesso Administrativo" footer={<><button onClick={() => setIsAdmModalOpen(false)} className="nav-button secondary">Cancelar</button><button onClick={handleAdminAccess} className="submit-btn">Acessar</button></>}>
                <p>Digite a senha para criar uma nova requisição limpa.</p>
                <div className="form-field" style={{marginTop: '1.5rem'}}><label>Senha</label><input type="password" value={admPassword} onChange={(e) => { setAdmPassword(e.target.value); setAdmError(''); }} onKeyPress={(e) => e.key === 'Enter' && handleAdminAccess()} autoFocus />{admError && <p className="auth-error" style={{marginTop: '1rem', padding: '0.5rem'}}>{admError}</p>}</div>
            </Modal>
        </div>
    );
};
