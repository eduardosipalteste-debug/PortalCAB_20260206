
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    initialFormData, steps, checklistItems, checklistItems as checklistItemsStandard, checklistSAPItems, WIZARD_STORAGE_KEY,
    servicosData, sistemasAfetadosData, frentesSAPData, espacosInfraData, filiaisSipalData, activityTemplate, contactTemplate, 
    empresasSipal, etapasMudanca, Anexo, gestoresSAP, coordenadoresSAP
} from '../../constants/app-constants';
import { generateAndUploadPdf, newId, generateTimeSlots } from '../../utils/app-utils';
import { 
    MultiSelect, WizardProgressBar, Tooltip, Modal
} from '../ui/AppUI';
import { 
    TrashIcon, ExpandIcon, CalendarIcon, CheckIcon, UploadIcon, AlertIcon, DownloadIcon, HelpIcon
} from '../icons/AppIcons';

const OCCUPIED_SLOTS_KEY = 'cab-occupied-slots';

const transportTemplate = {
    requestId: '',
    sequencing: '',
    requestType: 'Workbench',
    objective: '',
    technicalDescription: '',
    type: 'Normal',
    calmJira: '',
    goSipal: '',
    status: 'Liberado para Transporte',
    creationDate: '',
    creationResp: '',
    importResp: '',
    requester: '',
    testLink: '',
    rollbackPlan: '',
    observations: ''
};

const testTemplate = {
    nomeTeste: '',
    plano: 'Funcional',
    tipoTeste: 'TU - Teste Unitário',
    dataPlanejada: '',
    horaPlanejada: '',
    atividade: '',
    linkTeste: '',
    predecessora: '',
    responsavel: '',
    departamento: '',
    itemConfiguracao: '',
    tempoExecucao: ''
};

const communicationTemplate = {
    data: '',
    hora: '',
    status: '',
    meio: 'E-mail',
    atividadePublico: '',
    responsavel: '',
    contatoEscalonamento: '',
    observacao: ''
};

const riskTemplate = {
    tipoRisco: 'Técnico',
    risco: '',
    estrategia: 'Mitigar',
    acao: '',
    impacto: 'Médio',
    mitigacao: ''
};

const securityProfileTemplate = {
    nivelAcesso: 'Usuário',
    plataforma: '',
    ambiente: 'Produção',
    gruposAcesso: '',
    itemConfig: '',
    areaNegocio: '',
    usuarios: '',
    loginAcesso: '',
    justificativa: ''
};

const CategoryHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="category-header-group">
        <h3 className="category-title">{title}</h3>
        {subtitle && <p className="category-subtitle">{subtitle}</p>}
    </div>
);

const HighlightBox = ({ title, subtitle, children, color }: { title: string; subtitle: string; children?: React.ReactNode, color?: string }) => (
    <div style={{ 
        border: `1px solid ${color || 'var(--dynamic-color)'}`, 
        borderRadius: '8px', 
        padding: '1.5rem', 
        marginBottom: '1.5rem',
        backgroundColor: '#fdfdfd',
        transition: 'border-color 0.3s ease'
    }}>
        <h4 style={{ color: 'var(--sipal-blue)', margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700' }}>{title}</h4>
        <p style={{ fontSize: '0.9rem', color: '#444', marginBottom: '1rem' }}>{children ? null : subtitle}</p>
        {children}
    </div>
);

export const NewRequestPage = ({ addRequest, currentUser, onSaveDraft, onAutoSaveDraft }: any) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [expandedScopes, setExpandedScopes] = useState<Record<string, boolean>>({});
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
    const [submittedRequestId, setSubmittedRequestId] = useState(null);
    const [mailtoLink, setMailtoLink] = useState('');
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');
    const [uploadStatus, setUploadStatus] = useState<{success: boolean, message: string} | null>(null);
    const [showValidation, setShowValidation] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<any>(() => {
        const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const data = parsed.formData || parsed;
            if (currentUser?.name) data.informacoesGerais.liderMudanca = currentUser.name;
            return data;
        }
        const data = JSON.parse(JSON.stringify(initialFormData));
        
        data.planoImplantacao = [{ ...activityTemplate, id: newId() }];
        data.mapaTransporte = [{ ...transportTemplate, id: newId() }];
        data.planoRetorno = [{ ...activityTemplate, id: newId(), status: 'Não iniciado', tipo: 'Manual' }];
        data.planoComunicacao = [{ ...communicationTemplate, id: newId() }];
        data.planoRiscos = [{ ...riskTemplate, id: newId() }];
        data.cadernoTestes = [{ ...testTemplate, id: newId() }];
        data.segurancaAcessos.perfis = [{ ...securityProfileTemplate, id: newId() }];
        data.contatos = [{ ...contactTemplate, id: newId() }];

        if (currentUser?.name) {
            data.informacoesGerais.liderMudanca = currentUser.name;
            data.informacoesGerais.solicitante = currentUser.name;
        }
        return data;
    });

    const themeColor = useMemo(() => {
        const area = formData.informacoesGerais.areaAfetada;
        if (area === 'SAP') return '#b03a2e'; 
        if (area === 'Infra') return '#2e86c1'; 
        return '#008479'; 
    }, [formData.informacoesGerais.areaAfetada]);

    const visibleStepIndexes = useMemo(() => {
        const area = formData.informacoesGerais.areaAfetada;
        if (area === 'SAP') {
            return [0, 2, 8, 10, 11, 12];
        } else if (area === 'Infra') {
            return [0, 13, 14, 15, 11, 12];
        } else {
            return [0, 1, 3, 4, 5, 6, 7, 8, 9, 11, 12];
        }
    }, [formData.informacoesGerais.areaAfetada]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (formData.informacoesGerais.motivoMudanca.trim()) {
                const draftId = onAutoSaveDraft(formData, currentDraftId);
                setCurrentDraftId(draftId);
                setAutoSaveStatus('Rascunho salvo automaticamente!');
                setTimeout(() => setAutoSaveStatus(''), 5000);
            }
        }, 120000);
        return () => clearInterval(timer);
    }, [formData, currentDraftId, onAutoSaveDraft]);

    useEffect(() => {
        localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ formData, draftId: currentDraftId }));
    }, [formData, currentDraftId]);

    const isFieldEmpty = (val: any) => !val || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);

    const getInputClass = (val: any, isRequired: boolean = true) => {
        return (isRequired && showValidation && isFieldEmpty(val)) ? 'validation-error-field' : '';
    };

    const validateStep = (idx: number, fullCheck: boolean = false) => {
        const errors: any[] = [];
        const { informacoesGerais, infra, planoImplantacao, mapaTransporte, checklist, checklistSAP, cadernoTestes, planoRetorno, planoComunicacao, planoRiscos, segurancaAcessos, contatos } = formData;
        const currentArea = informacoesGerais.areaAfetada;

        const validateSpecificStep = (sIdx: number) => {
            if (sIdx === 0) {
                if (isFieldEmpty(informacoesGerais.dataMudanca)) errors.push({ message: 'Selecione a "Data da Mudança".' });
                if (isFieldEmpty(informacoesGerais.solicitante)) errors.push({ message: 'O campo "Solicitante" é obrigatório.' });
                if (currentArea === 'Infra') {
                    if (isFieldEmpty(infra.espaco)) errors.push({ message: 'O campo "Espaço" é obrigatório.' });
                    if (isFieldEmpty(infra.tipoTicket)) errors.push({ message: 'O campo "Tipo do Ticket" é obrigatório.' });
                    if (isFieldEmpty(infra.resumo)) errors.push({ message: 'O campo "Resumo" é obrigatório.' });
                    if (isFieldEmpty(infra.sistemaAfetado)) errors.push({ message: 'Selecione ao menos um "Sistema Afetado".' });
                } else {
                    if (isFieldEmpty(informacoesGerais.sistemasAfetados)) errors.push({ message: 'Selecione ao menos um "Sistema Afetado".' });
                    if (isFieldEmpty(informacoesGerais.motivoMudanca)) errors.push({ message: 'O campo "Motivo da Mudança" é obrigatório.' });
                    if (isFieldEmpty(informacoesGerais.impactoNaoRealizar)) errors.push({ message: 'O campo "Impacto de Não Realizar" é obrigatório.' });
                    if (currentArea === 'SAP' && isFieldEmpty(informacoesGerais.frentesSAP)) errors.push({ message: 'Selecione ao menos uma "Frente SAP".' });
                }
            }
            if (sIdx === 1) {
                if (planoImplantacao.length === 0) errors.push({ message: 'Plano de Implantação: Adicione ao menos uma atividade.' });
                else planoImplantacao.forEach((p:any, i:number) => {
                    if (isFieldEmpty(p.nomeAtividade)) errors.push({ message: `Plano Implantação #${i+1}: Nome é obrigatório.` });
                });
            }
            if (sIdx === 2) {
                if (mapaTransporte.length === 0) errors.push({ message: 'Mapa de Transporte: Adicione ao menos uma Request.' });
                else mapaTransporte.forEach((t: any, i: number) => {
                    if (isFieldEmpty(t.requestId)) errors.push({ message: `Request #${i+1}: ID da Request é obrigatório.` });
                });
            }
            if (sIdx === 3) {
                if (cadernoTestes.length === 0) errors.push({ message: 'Caderno de Testes: Adicione ao menos um teste.' });
                else cadernoTestes.forEach((t: any, i: number) => {
                    if (isFieldEmpty(t.nomeTeste)) errors.push({ message: `Teste #${i+1}: Nome é obrigatório.` });
                });
            }
            if (sIdx === 4) {
                if (planoRetorno.length === 0) errors.push({ message: 'Plano de Retorno: Adicione ao menos uma atividade.' });
                else planoRetorno.forEach((p: any, i: number) => {
                    if (isFieldEmpty(p.descricao)) errors.push({ message: `Rollback #${i+1}: Descrição é obrigatória.` });
                });
            }
            if (sIdx === 5) {
                if (planoComunicacao.length === 0) errors.push({ message: 'Plano de Comunicação: Adicione ao menos um item.' });
            }
            if (sIdx === 6) {
                if (planoRiscos.length === 0) errors.push({ message: 'Análise de Riscos: Adicione ao menos um risco.' });
            }
            if (sIdx === 7) {
                if (segurancaAcessos.perfis.length === 0) errors.push({ message: 'Segurança e Acessos: Adicione ao menos um perfil.' });
            }
            if (sIdx === 8) {
                if (contatos.length === 0) errors.push({ message: 'Matriz de Contatos: Adicione ao menos um contato.' });
                else contatos.forEach((c: any, i: number) => {
                    if (isFieldEmpty(c.nome)) errors.push({ message: `Contato #${i+1}: Nome é obrigatório.` });
                });
            }
            if (sIdx === 9) {
                if (checklist.some((i: any) => !i.answer)) errors.push({ message: 'Checklist: Responda todas as perguntas.' });
            }
            if (sIdx === 10) {
                if (checklistSAP.some((i: any) => !i.answer)) errors.push({ message: 'Checklist SAP: Responda todas as perguntas.' });
            }
            if (sIdx === 13) {
                if (isFieldEmpty(infra.descricao)) errors.push({ message: 'Descrição Detalhada é obrigatória.' });
                if (isFieldEmpty(infra.justificativa)) errors.push({ message: 'Justificativa é obrigatória.' });
                if (isFieldEmpty(infra.responsavel)) errors.push({ message: 'Responsável é obrigatório.' });
            }
            if (sIdx === 14) {
                if (isFieldEmpty(infra.dataInicio)) errors.push({ message: 'Data Início é obrigatória.' });
                if (isFieldEmpty(infra.dataFim)) errors.push({ message: 'Data Fim é obrigatória.' });
            }
            if (sIdx === 15) {
                if (isFieldEmpty(infra.modeloComputador)) errors.push({ message: 'Modelo do Computador é obrigatório.' });
                if (isFieldEmpty(infra.numeroSerie)) errors.push({ message: 'Número de Série é obrigatório.' });
            }
        };

        if (fullCheck) {
            visibleStepIndexes.forEach(stepIdx => {
                if (stepIdx !== 12 && stepIdx !== 11) validateSpecificStep(stepIdx);
            });
        } else {
            if (visibleStepIndexes.includes(idx)) validateSpecificStep(idx);
        }

        if (!fullCheck) {
            setCompletedSteps(prev => ({ ...prev, [idx]: errors.length === 0 }));
            setValidationErrors(errors);
        }
        return errors;
    };

    const handleNext = () => {
        setShowValidation(true);
        const errors = validateStep(currentStep);
        if (errors.length === 0) {
            setShowValidation(false);
            const curIdx = visibleStepIndexes.indexOf(currentStep);
            if (curIdx < visibleStepIndexes.length - 1) {
                setCurrentStep(visibleStepIndexes[curIdx + 1]);
                window.scrollTo(0, 0);
            }
        } else {
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        const curIdx = visibleStepIndexes.indexOf(currentStep);
        if (curIdx > 0) {
            setCurrentStep(visibleStepIndexes[curIdx - 1]);
            setValidationErrors([]);
            setShowValidation(false);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        setShowValidation(true);
        const allErrors = validateStep(-1, true);
        if (allErrors.length > 0) {
            setValidationErrors(allErrors);
            window.scrollTo(0, 0);
            return;
        }

        const newIdGenerated = addRequest(formData, currentDraftId);
        setSubmittedRequestId(newIdGenerated);
        setUploadStatus(null);
        const result = await generateAndUploadPdf(formData, newIdGenerated);
        setUploadStatus(result);
        setMailtoLink(`mailto:cab@sipal.com.br?subject=Nova RDM: ${newIdGenerated}`);
        setCurrentStep(12);
        localStorage.removeItem(WIZARD_STORAGE_KEY);
        window.scrollTo(0, 0);
    };

    const handleManualRetryUpload = async () => {
        if (!submittedRequestId) return;
        setUploadStatus(null);
        const result = await generateAndUploadPdf(formData, submittedRequestId);
        setUploadStatus(result);
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        const [section, field] = name.split('_');
        
        if (field === 'areaAfetada') {
            const sapVal = value === 'SAP' ? 'Sim' : 'Não';
            setFormData((prev: any) => ({ 
                ...prev, 
                informacoesGerais: { ...prev.informacoesGerais, areaAfetada: value, referenteSAP: sapVal } 
            }));
            setValidationErrors([]); 
            return;
        }

        setFormData((prev: any) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    const updateInfraField = (field: string, value: any) => {
        setFormData((prev: any) => {
            const newInfra = { ...prev.infra, [field]: value };
            if (field === 'espaco') {
                const tickets = espacosInfraData[value] || [];
                newInfra.tipoTicket = tickets.length > 0 ? tickets[0] : '';
            }
            return { ...prev, infra: newInfra };
        });
    };

    const updateChecklist = (section: string, idx: number, field: string, value: any) => {
        setFormData((prev: any) => {
            const newList = [...prev[section]];
            const items = section === 'checklist' ? checklistItemsStandard : checklistSAPItems;
            const targetQuestion = items[idx].question;
            const actualIdx = prev[section].findIndex((item:any) => item.question === targetQuestion);
            if (actualIdx !== -1) {
                newList[actualIdx] = { ...newList[actualIdx], [field]: value };
            }
            return { ...prev, [section]: newList };
        });
    };

    const addRow = (section: string, def: any) => {
        setFormData((prev: any) => {
            const parts = section.split('.');
            if (parts.length === 2) {
                return {
                    ...prev,
                    [parts[0]]: { 
                        ...prev[parts[0]], 
                        [parts[1]]: [...prev[parts[0]][parts[1]], { ...def, id: newId() }] 
                    }
                };
            }
            return { ...prev, [section]: [...prev[section], { ...def, id: newId() }] };
        });
    };

    const removeRow = (section: string, idx: number) => {
        setFormData((prev: any) => {
            const parts = section.split('.');
            if (parts.length === 2) {
                const newList = [...prev[parts[0]][parts[1]]];
                newList.splice(idx, 1);
                return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: newList } };
            }
            const newList = [...prev[section]];
            newList.splice(idx, 1);
            return { ...prev, [section]: newList };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles: Anexo[] = Array.from(e.target.files).map((file: any) => ({
            name: file.name,
            size: file.size,
            type: file.type
        }));
        setFormData((prev:any) => ({ ...prev, anexos: [...prev.anexos, ...newFiles] }));
    };

    const renderTransportCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.mapaTransporte];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, mapaTransporte: newList };
            });
        };

        return (
            <div key={item.id} className={`implementation-card ${showValidation && isFieldEmpty(item.requestId) ? 'validation-error-section' : ''}`}>
                <div className="implementation-card-header"> 
                    <h4>Request #{idx + 1}: Nova Request</h4> 
                    <button onClick={() => removeRow('mapaTransporte', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-field">
                        <label>ID da Request *</label>
                        <input type="text" className={getInputClass(item.requestId)} value={item.requestId || ''} onChange={(e) => updateField('requestId', e.target.value)} placeholder="S71K900..." />
                    </div>
                    <div className="form-field"><label>Sequenciamento</label><input type="text" value={item.sequencing || ''} onChange={(e) => updateField('sequencing', e.target.value)} /></div>
                    <div className="form-field">
                        <label>Tipo Request</label>
                        <select value={item.requestType || 'Workbench'} onChange={(e) => updateField('requestType', e.target.value)}>
                            <option value="Workbench">Workbench</option>
                            <option value="Customizing">Customizing</option>
                            <option value="Transport of Copies">Transport of Copies</option>
                        </select>
                    </div>
                    <div className="form-field full-width">
                        <label>Objetivo</label>
                        <input type="text" value={item.objective || ''} onChange={(e) => updateField('objective', e.target.value)} />
                    </div>
                    <div className="form-field full-width">
                        <label>Descrição Técnica</label>
                        <textarea value={item.technicalDescription || ''} onChange={(e) => updateField('technicalDescription', e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                    <div className="form-field">
                        <label>Tipo</label>
                        <select value={item.type || 'Normal'} onChange={(e) => updateField('type', e.target.value)}>
                            <option value="Normal">Normal</option>
                            <option value="Urgente">Urgente</option>
                        </select>
                    </div>
                    <div className="form-field"><label>Nº CALM/Jira</label><input type="text" value={item.calmJira || ''} onChange={(e) => updateField('calmJira', e.target.value)} /></div>
                    <div className="form-field"><label>GO - SIPAL</label><input type="text" value={item.goSipal || ''} onChange={(e) => updateField('goSipal', e.target.value)} /></div>
                    <div className="form-field">
                        <label>Status</label>
                        <select value={item.status || 'Liberado para Transporte'} onChange={(e) => updateField('status', e.target.value)}>
                            <option value="Liberado para Transporte">Liberado para Transporte</option>
                            <option value="Importado em QA">Importado em QA</option>
                            <option value="Erro de Importação">Erro de Importação</option>
                        </select>
                    </div>
                    <div className="form-field"><label>Data Criação</label><input type="date" value={item.creationDate || ''} onChange={(e) => updateField('creationDate', e.target.value)} /></div>
                    <div className="form-field"><label>Resp. Criação</label><input type="text" value={item.creationResp || ''} onChange={(e) => updateField('creationResp', e.target.value)} /></div>
                    <div className="form-field"><label>Resp. Importação</label><input type="text" value={item.importResp || ''} onChange={(e) => updateField('importResp', e.target.value)} /></div>
                    <div className="form-field"><label>Solicitante</label><input type="text" value={item.requester || ''} onChange={(e) => updateField('requester', e.target.value)} /></div>
                    <div className="form-field"></div>
                    <div className="form-field full-width">
                        <label>Link Evid. Teste</label>
                        <input type="text" value={item.testLink || ''} onChange={(e) => updateField('testLink', e.target.value)} />
                    </div>
                    <div className="form-field full-width">
                        <label>Plano Rollback SAP</label>
                        <textarea value={item.rollbackPlan || ''} onChange={(e) => updateField('rollbackPlan', e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                    <div className="form-field full-width">
                        <label>Observações</label>
                        <textarea value={item.observations || ''} onChange={(e) => updateField('observations', e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                </div>
            </div>
        );
    };

    const renderActivityCard = (section: string, item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const parts = section.split('.');
                const newList = parts.length === 2 ? [...prev[parts[0]][parts[1]]] : [...prev[section]];
                newList[idx] = { ...newList[idx], [field]: value };
                return parts.length === 2 ? { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: newList } } : { ...prev, [section]: newList };
            });
        };

        const isImplantacao = section.includes('Implantacao');
        const isRetorno = section.includes('Retorno');

        if (isRetorno) {
            return (
                <div key={item.id} className={`implementation-card ${showValidation && isFieldEmpty(item.descricao) ? 'validation-error-section' : ''}`}>
                    <div className="implementation-card-header"> 
                        <h4>Atividade #{idx + 1}</h4> 
                        <button onClick={() => removeRow(section, idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                    </div>
                    <div className="form-grid" style={{ padding: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="form-field">
                            <label>Data Planejada</label>
                            <input type="date" value={item.dataPlanejada || ''} onChange={(e) => updateField('dataPlanejada', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Hora Planejada</label>
                            <input type="time" value={item.horaPlanejada || ''} onChange={(e) => updateField('horaPlanejada', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Status</label>
                            <select value={item.status || 'Não iniciado'} onChange={(e) => updateField('status', e.target.value)}>
                                <option value="Não iniciado">Não iniciado</option>
                                <option value="Em andamento">Em andamento</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Data Realizada</label>
                            <input type="date" value={item.dataRealizada || ''} onChange={(e) => updateField('dataRealizada', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Hora Realizada</label>
                            <input type="time" value={item.horaRealizada || ''} onChange={(e) => updateField('horaRealizada', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Tipo</label>
                            <select value={item.tipo || 'Manual'} onChange={(e) => updateField('tipo', e.target.value)}>
                                <option value="Manual">Manual</option>
                                <option value="Automático">Automático</option>
                            </select>
                        </div>
                        <div className="form-field full-width">
                            <label>Descrição *</label>
                            <textarea className={getInputClass(item.descricao)} value={item.descricao || ''} onChange={(e) => updateField('descricao', e.target.value)} style={{ minHeight: '80px' }} />
                        </div>
                        <div className="form-field">
                            <label>Predecessora</label>
                            <input type="text" value={item.predecessora || ''} onChange={(e) => updateField('predecessora', e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label>Responsável</label>
                            <input type="text" value={item.responsavel || ''} onChange={(e) => updateField('responsavel', e.target.value)} />
                        </div>
                        <div className="form-field"></div>
                        <div className="form-field full-width">
                            <label>Observação</label>
                            <textarea value={item.observacao || ''} onChange={(e) => updateField('observacao', e.target.value)} style={{ minHeight: '80px' }} />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={item.id} className={`implementation-card ${showValidation && isImplantacao && isFieldEmpty(item.nomeAtividade) ? 'validation-error-section' : ''}`}>
                <div className="implementation-card-header"> 
                    <h4>Atividade #{idx + 1}: {item.nomeAtividade || item.descricao || 'Sem nome'}</h4> 
                    <button onClick={() => removeRow(section, idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-field full-width">
                        <label>Nome da Atividade *</label>
                        <input type="text" className={isImplantacao ? getInputClass(item.nomeAtividade) : ''} value={item.nomeAtividade || ''} onChange={(e) => updateField('nomeAtividade', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Etapa</label>
                        <select value={item.etapa || 'Pré Implantação'} onChange={(e) => updateField('etapa', e.target.value)}>
                            {etapasMudanca.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Status</label>
                        <input type="text" value={item.status || ''} onChange={(e) => updateField('status', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Data Planejada</label>
                        <input type="date" value={item.dataPlanejada || ''} onChange={(e) => updateField('dataPlanejada', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Hora Planejada</label>
                        <input type="time" value={item.horaPlanejada || ''} onChange={(e) => updateField('horaPlanejada', e.target.value)} />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}></div>
                    <div className="form-field full-width">
                        <label>Descrição</label>
                        <textarea value={item.descricao || ''} onChange={(e) => updateField('descricao', e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                    <div className="form-field">
                        <label>Responsável</label>
                        <input type="text" value={item.responsavel} onChange={(e) => updateField('responsavel', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Departamento</label>
                        <input type="text" value={item.departamento || ''} onChange={(e) => updateField('departamento', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Item de Configuração</label>
                        <input type="text" value={item.itemConfiguracao || ''} onChange={(e) => updateField('itemConfiguracao', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Tempo de Execução</label>
                        <input type="text" value={item.tempoExecucao || ''} onChange={(e) => updateField('tempoExecucao', e.target.value)} placeholder="Ex: 01:15" />
                    </div>
                </div>
            </div>
        );
    };

    const renderTestCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.cadernoTestes];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, cadernoTestes: newList };
            });
        };

        return (
            <div key={item.id} className={`implementation-card ${showValidation && isFieldEmpty(item.nomeTeste) ? 'validation-error-section' : ''}`}>
                <div className="implementation-card-header"> 
                    <h4>Teste #{idx + 1}: {item.nomeTeste || 'Novo Teste'}</h4> 
                    <button onClick={() => removeRow('cadernoTestes', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-field full-width">
                        <label>Nome do Teste *</label>
                        <input type="text" className={getInputClass(item.nomeTeste)} value={item.nomeTeste || ''} onChange={(e) => updateField('nomeTeste', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Plano</label>
                        <select value={item.plano || 'Funcional'} onChange={(e) => updateField('plano', e.target.value)}>
                            <option value="Funcional">Funcional</option>
                            <option value="Não Funcional">Não Funcional</option>
                            <option value="Regressão">Regressão</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Tipo de Teste</label>
                        <select value={item.tipoTeste || 'TU - Teste Unitário'} onChange={(e) => updateField('tipoTeste', e.target.value)}>
                            <option value="TU - Teste Unitário">TU - Teste Unitário</option>
                            <option value="TI - Teste Integrado">TI - Teste Integrado</option>
                            <option value="UAT - Teste de Aceite">UAT - Teste de Aceite</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Data Planejada</label>
                        <input type="date" value={item.dataPlanejada || ''} onChange={(e) => updateField('dataPlanejada', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Hora Planejada</label>
                        <input type="time" value={item.horaPlanejada || ''} onChange={(e) => updateField('horaPlanejada', e.target.value)} />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}></div>
                    <div className="form-field full-width">
                        <label>Atividade de Teste</label>
                        <textarea value={item.atividade || ''} onChange={(e) => updateField('atividade', e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                    <div className="form-field full-width">
                        <label>Link do Teste</label>
                        <input type="text" value={item.linkTeste || ''} onChange={(e) => updateField('linkTeste', e.target.value)} placeholder="Cole o link para a evidência do teste" />
                    </div>
                    <div className="form-field">
                        <label>Predecessora</label>
                        <input type="text" value={item.predecessora || ''} onChange={(e) => updateField('predecessora', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Responsável</label>
                        <input type="text" value={item.responsavel || ''} onChange={(e) => updateField('responsavel', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Departamento</label>
                        <input type="text" value={item.departamento || ''} onChange={(e) => updateField('departamento', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Item de Configuração</label>
                        <input type="text" value={item.itemConfiguracao || ''} onChange={(e) => updateField('itemConfiguracao', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Tempo de Execução</label>
                        <input type="text" value={item.tempoExecucao || ''} onChange={(e) => updateField('tempoExecucao', e.target.value)} placeholder="Ex: 02:30" />
                    </div>
                </div>
            </div>
        );
    };

    const renderCommunicationCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.planoComunicacao];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, planoComunicacao: newList };
            });
        };

        return (
            <div key={item.id} className="implementation-card">
                <div className="implementation-card-header"> 
                    <h4>Item #{idx + 1}</h4> 
                    <button onClick={() => removeRow('planoComunicacao', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-field">
                        <label>Data</label>
                        <input type="date" value={item.data || ''} onChange={(e) => updateField('data', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Hora</label>
                        <input type="time" value={item.hora || ''} onChange={(e) => updateField('hora', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Status</label>
                        <input type="text" value={item.status || ''} onChange={(e) => updateField('status', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Meio</label>
                        <select value={item.meio || 'E-mail'} onChange={(e) => updateField('meio', e.target.value)}>
                            <option value="E-mail">E-mail</option>
                            <option value="Teams">Teams</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Telefone">Telefone</option>
                        </select>
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}></div>
                    <div className="form-field full-width">
                        <label>Atividade/Público</label>
                        <input type="text" value={item.atividadePublico || ''} onChange={(e) => updateField('atividadePublico', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Responsável</label>
                        <input type="text" value={item.responsavel || ''} onChange={(e) => updateField('responsavel', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Contato Escalonamento</label>
                        <input type="text" value={item.contatoEscalonamento || ''} onChange={(e) => updateField('contatoEscalonamento', e.target.value)} />
                    </div>
                    <div className="form-field"></div>
                    <div className="form-field full-width">
                        <label>Observação</label>
                        <textarea value={item.observacao || ''} onChange={(e) => updateField('observacao', e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                </div>
            </div>
        );
    };

    const renderRiskCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.planoRiscos];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, planoRiscos: newList };
            });
        };

        return (
            <div key={item.id} className="implementation-card">
                <div className="implementation-card-header"> 
                    <h4>Risco #{idx + 1}</h4> 
                    <button onClick={() => removeRow('planoRiscos', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem' }}>
                    <div className="form-field">
                        <label>Tipo Risco</label>
                        <select value={item.tipoRisco || 'Técnico'} onChange={(e) => updateField('tipoRisco', e.target.value)}>
                            <option value="Técnico">Técnico</option>
                            <option value="Operacional">Operacional</option>
                            <option value="Negócio">Negócio</option>
                            <option value="Segurança">Segurança</option>
                        </select>
                    </div>
                    <div className="form-field full-width">
                        <label>Risco</label>
                        <input type="text" value={item.risco || ''} onChange={(e) => updateField('risco', e.target.value)} />
                    </div>
                    <div className="form-field full-width">
                        <label>Estratégia</label>
                        <select value={item.estrategia || 'Mitigar'} onChange={(e) => updateField('estrategia', e.target.value)}>
                            <option value="Mitigar">Mitigar</option>
                            <option value="Aceitar">Aceitar</option>
                            <option value="Transferir">Transferir</option>
                            <option value="Evitar">Evitar</option>
                        </select>
                    </div>
                    <div className="form-field full-width">
                        <label>Ação</label>
                        <textarea value={item.acao || ''} onChange={(e) => updateField('acao', e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                    <div className="form-field">
                        <label>Impacto</label>
                        <select value={item.impacto || 'Médio'} onChange={(e) => updateField('impacto', e.target.value)}>
                            <option value="Baixo">Baixo</option>
                            <option value="Médio">Médio</option>
                            <option value="Alto">Alto</option>
                            <option value="Crítico">Crítico</option>
                        </select>
                    </div>
                    <div className="form-field full-width">
                        <label>Mitigação</label>
                        <textarea value={item.mitigacao || ''} onChange={(e) => updateField('mitigacao', e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                </div>
            </div>
        );
    };

    const renderSecurityProfileCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.segurancaAcessos.perfis];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, segurancaAcessos: { ...prev.segurancaAcessos, perfis: newList } };
            });
        };

        return (
            <div key={item.id} className="implementation-card">
                <div className="implementation-card-header"> 
                    <h4>Perfil #{idx + 1}</h4> 
                    <button onClick={() => removeRow('segurancaAcessos.perfis', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-field">
                        <label>Nível de acesso</label>
                        <select value={item.nivelAcesso || 'Usuário'} onChange={(e) => updateField('nivelAcesso', e.target.value)}>
                            <option value="Usuário">Usuário</option>
                            <option value="Administrador">Administrador</option>
                            <option value="Suporte">Suporte</option>
                            <option value="Auditoria">Auditoria</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Plataforma</label>
                        <input type="text" value={item.plataforma || ''} onChange={(e) => updateField('plataforma', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Ambiente</label>
                        <select value={item.ambiente || 'Produção'} onChange={(e) => updateField('ambiente', e.target.value)}>
                            <option value="Produção">Produção</option>
                            <option value="Homologação">Homologação</option>
                            <option value="Desenvolvimento">Desenvolvimento</option>
                            <option value="QA">QA</option>
                        </select>
                    </div>
                    <div className="form-field full-width">
                        <label>Grupos de acesso</label>
                        <input type="text" value={item.gruposAcesso || ''} onChange={(e) => updateField('gruposAcesso', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Item de Configuração</label>
                        <input type="text" value={item.itemConfig || ''} onChange={(e) => updateField('itemConfig', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Área de Negócio</label>
                        <input type="text" value={item.areaNegocio || ''} onChange={(e) => updateField('areaNegocio', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Usuários</label>
                        <input type="text" value={item.usuarios || ''} onChange={(e) => updateField('usuarios', e.target.value)} />
                    </div>
                    <div className="form-field">
                        <label>Login de acesso</label>
                        <input type="text" value={item.loginAcesso || ''} onChange={(e) => updateField('loginAcesso', e.target.value)} />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}></div>
                    <div className="form-field full-width">
                        <label>Justificativa</label>
                        <input type="text" value={item.justificativa || ''} onChange={(e) => updateField('justificativa', e.target.value)} />
                    </div>
                </div>
            </div>
        );
    };

    const renderContactCard = (item: any, idx: number) => {
        const updateField = (field: string, value: any) => {
            setFormData((prev: any) => {
                const newList = [...prev.contatos];
                newList[idx] = { ...newList[idx], [field]: value };
                return { ...prev, contatos: newList };
            });
        };

        const isAreaSAP = formData.informacoesGerais.areaAfetada === 'SAP';

        return (
            <div key={item.id} className={`implementation-card ${showValidation && isFieldEmpty(item.nome) ? 'validation-error-section' : ''}`}>
                <div className="implementation-card-header"> 
                    <h4 style={{ color: 'var(--sipal-blue)' }}>Contato #{idx + 1}: {item.nome || 'Novo Contato'}</h4> 
                    <button onClick={() => removeRow('contatos', idx)} className="remove-row-btn" style={{ marginLeft: 'auto' }}> <TrashIcon /> </button> 
                </div>
                <div className="form-grid" style={{ padding: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-field"><label>Nome *</label><input type="text" className={getInputClass(item.nome)} value={item.nome || ''} onChange={(e) => updateField('nome', e.target.value)} /></div>
                    <div className="form-field"><label>Cargo</label><input type="text" value={item.cargo || ''} onChange={(e) => updateField('cargo', e.target.value)} /></div>
                    <div className="form-field"><label>E-mail</label><input type="email" value={item.email || ''} onChange={(e) => updateField('email', e.target.value)} /></div>
                    <div className="form-field"><label>Telefones</label><input type="text" value={item.telefones || ''} onChange={(e) => updateField('telefones', e.target.value)} /></div>
                    <div className="form-field"><label>Local Atuação</label><input type="text" value={item.localAtuacao || ''} onChange={(e) => updateField('localAtuacao', e.target.value)} /></div>
                    <div className="form-field"><label>Líder Imediato</label><input type="text" value={item.liderImediato || ''} onChange={(e) => updateField('liderImediato', e.target.value)} /></div>
                    <div className="form-field"><label>E-mail Líder</label><input type="email" value={item.emailLider || ''} onChange={(e) => updateField('emailLider', e.target.value)} /></div>
                    <div className="form-field"><label>Área</label><input type="text" value={item.area || ''} onChange={(e) => updateField('area', e.target.value)} /></div>
                    <div className="form-field"><label>Gestor da Área</label><input type="text" value={item.gestorArea || ''} onChange={(e) => updateField('gestorArea', e.target.value)} /></div>
                    
                    {isAreaSAP && (
                        <>
                            <div className="form-field">
                                <label>Gestor responsável (SAP)</label>
                                <select value={item.gestorResponsavel || ''} onChange={(e) => updateField('gestorResponsavel', e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {gestoresSAP.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Coordenador responsável (SAP)</label>
                                <select value={item.coordenadorResponsavel || ''} onChange={(e) => updateField('coordenadorResponsavel', e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {coordenadoresSAP.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <div className="form-field full-width"><label>Comunicação Envolvida</label><textarea value={item.comunEnvolvida || ''} onChange={(e) => updateField('comunEnvolvida', e.target.value)} style={{ minHeight: '60px' }} /></div>
                </div>
            </div>
        );
    };

    const renderChecklistSection = (sectionName: string, itemsList: any[]) => {
        const grouped = itemsList.reduce((acc:any, item) => { (acc[item.scope] = acc[item.scope] || []).push(item); return acc; }, {});
        return (
            <div className="accordion">
                {Object.entries(grouped).map(([scope, items]: [string, any]) => (
                    <div key={scope} className="accordion-item">
                        <button className="accordion-header" onClick={() => setExpandedScopes(prev => ({ ...prev, [scope]: !prev[scope] }))}>
                            <div className="accordion-title-wrapper"> <span>{scope}</span> </div>
                            <ExpandIcon isExpanded={!!expandedScopes[scope]} />
                        </button>
                        {expandedScopes[scope] && (
                            <div className="accordion-content">
                                {items.map((item: any) => {
                                    const actualGlobalIdx = itemsList.indexOf(item);
                                    const saved = formData[sectionName].find((f: any) => f.question === item.question) || { answer: '', justification: '' };
                                    return (
                                        <div key={item.question} className={`checklist-question-container ${showValidation && !saved.answer ? 'validation-error-section' : ''}`}>
                                            <div className="checklist-question-text">{item.question}</div>
                                            <div className="checklist-answer-buttons">
                                                {['Sim', 'Não', 'N/A'].map(opt => (
                                                    <button key={opt} className={`checklist-answer-btn ${opt === 'Sim' ? 'sim' : opt === 'Não' ? 'nao' : 'na'} ${saved.answer === opt ? 'selected' : ''}`} onClick={() => updateChecklist(sectionName, actualGlobalIdx, 'answer', opt)}>
                                                        {saved.answer === opt && <CheckIcon />} <span>{opt}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {saved.answer === 'Não' && (
                                                <div className="form-field" style={{ marginTop: '1.25rem' }}>
                                                    <label>Justificativa obrigatória:</label>
                                                    <textarea className={getInputClass(saved.justification)} value={saved.justification || ''} onChange={(e) => updateChecklist(sectionName, actualGlobalIdx, 'justification', e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const updateChecklistComunicacao = (field: string, val: string) => {
        setFormData((p: any) => ({
            ...p,
            comunicacaoChecklist: { ...p.comunicacaoChecklist, [field]: val }
        }));
    };

    const updateChecklistRisco = (field: string, val: string) => {
        setFormData((p: any) => ({
            ...p,
            riscosGerais: { ...p.riscosGerais, [field]: val }
        }));
    };

    return (
        <div className="card" style={{ '--dynamic-color': themeColor } as React.CSSProperties}>
            <h2>Nova Requisição de Mudança</h2>
            <WizardProgressBar currentStep={currentStep} formData={formData} completedSteps={completedSteps} onStepClick={(step: number) => { if (visibleStepIndexes.includes(step) && step <= currentStep) setCurrentStep(step); }} />
            
            {validationErrors.length > 0 && (
                <div className="error-message-box">
                    <div className="error-box-header"><AlertIcon /> Pendências Encontradas:</div>
                    <ul>{validationErrors.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
                    <p style={{ fontSize: '0.85rem', marginTop: '10px', opacity: 0.8 }}>* Para a área <strong>{formData.informacoesGerais.areaAfetada}</strong>, todas as categorias e campos destacados são obrigatórios para a finalização.</p>
                </div>
            )}

            <div className="step-container">
                {currentStep === 0 && (
                    <div className="step-content">
                        <CategoryHeader title="Informações Gerais" />
                        <HighlightBox title="Área Afetada" subtitle="Selecione a frente afetada para esta mudança." color={themeColor}>
                            <div className="radio-group">
                                {['Sistemas', 'SAP', 'Infra'].map(area => (
                                    <label key={area} className="radio-label">
                                        <input type="radio" name="informacoesGerais_areaAfetada" value={area} checked={formData.informacoesGerais.areaAfetada === area} onChange={handleChange} /> {area}
                                    </label>
                                ))}
                            </div>
                        </HighlightBox>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Solicitante *</label>
                                <input type="text" name="informacoesGerais_solicitante" className={getInputClass(formData.informacoesGerais.solicitante)} value={formData.informacoesGerais.solicitante} onChange={handleChange} />
                            </div>
                            <div className="form-field">
                                <label>Data da Mudança *</label>
                                <input type="date" name="informacoesGerais_dataMudanca" className={getInputClass(formData.informacoesGerais.dataMudanca)} value={formData.informacoesGerais.dataMudanca} onChange={handleChange} />
                            </div>
                        </div>
                        {formData.informacoesGerais.areaAfetada === 'Infra' ? (
                            <div className="form-grid" style={{ animation: 'fadeIn 0.3s', marginTop: '1.5rem' }}>
                                <div className="form-field">
                                    <label>Espaço *</label>
                                    <select className={getInputClass(formData.infra.espaco)} value={formData.infra.espaco} onChange={(e) => updateInfraField('espaco', e.target.value)}>
                                        <option value="">Selecione um espaço...</option>
                                        {Object.keys(espacosInfraData).map(esp => (
                                            <option key={esp} value={esp}>{esp}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Tipo do Ticket *</label>
                                    <select className={getInputClass(formData.infra.tipoTicket)} value={formData.infra.tipoTicket} onChange={(e) => updateInfraField('tipoTicket', e.target.value)} disabled={!formData.infra.espaco}>
                                        <option value="">Selecione um tipo...</option>
                                        {(espacosInfraData[formData.infra.espaco] || []).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Status</label>
                                    <input type="text" value={formData.infra.status} onChange={(e) => updateInfraField('status', e.target.value)} />
                                </div>
                                <div className="form-field full-width">
                                    <label>Resumo (Título) *</label>
                                    <input type="text" className={getInputClass(formData.infra.resumo)} value={formData.infra.resumo} onChange={(e) => updateInfraField('resumo', e.target.value)} />
                                </div>
                                <div className="form-field full-width">
                                    <label>Sistema Afetado *</label>
                                    <MultiSelect className={getInputClass(formData.infra.sistemaAfetado)} optionsData={sistemasAfetadosData} selected={formData.infra.sistemaAfetado} onChange={(val: any) => updateInfraField('sistemaAfetado', val)} placeholder="Selecione os sistemas..." />
                                </div>
                                <div className="form-field">
                                    <label>Versão</label>
                                    <input type="text" value={formData.infra.versao} onChange={(e) => updateInfraField('versao', e.target.value)} />
                                </div>
                                <div className="form-field">
                                    <label>Líder da Mudança</label>
                                    <input type="text" value={formData.informacoesGerais.liderMudanca} readOnly className="read-only-field" />
                                </div>
                            </div>
                        ) : (
                            <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                                {formData.informacoesGerais.areaAfetada === 'SAP' && (
                                    <div className="form-field full-width">
                                        <label>Frentes SAP *</label>
                                        <MultiSelect className={getInputClass(formData.informacoesGerais.frentesSAP)} optionsData={frentesSAPData} selected={formData.informacoesGerais.frentesSAP} onChange={(val: any) => setFormData((p: any) => ({ ...p, informacoesGerais: { ...p.informacoesGerais, frentesSAP: val } }))} placeholder="Selecione as frentes SAP..." />
                                    </div>
                                )}
                                <div className="form-field full-width">
                                    <label>Motivo da Mudança *</label>
                                    <textarea name="informacoesGerais_motivoMudanca" className={getInputClass(formData.informacoesGerais.motivoMudanca)} value={formData.informacoesGerais.motivoMudanca} onChange={handleChange} style={{ minHeight: '80px' }}></textarea>
                                </div>
                                <div className="form-field full-width">
                                    <label>Impacto de Não Realizar *</label>
                                    <textarea name="informacoesGerais_impactoNaoRealizar" className={getInputClass(formData.informacoesGerais.impactoNaoRealizar)} value={formData.informacoesGerais.impactoNaoRealizar} onChange={handleChange} style={{ minHeight: '80px' }}></textarea>
                                </div>
                                <div className="form-field full-width">
                                    <label>Sistemas Afetados *</label>
                                    <MultiSelect className={getInputClass(formData.informacoesGerais.sistemasAfetados)} optionsData={sistemasAfetadosData} selected={formData.informacoesGerais.sistemasAfetados} onChange={(val:any) => setFormData((p:any)=>({...p, informacoesGerais: {...p.informacoesGerais, sistemasAfetados: val}}))} placeholder="Selecione os sistemas..." />
                                </div>
                                <div className="form-field">
                                    <label>Líder da Mudança</label>
                                    <input type="text" value={formData.informacoesGerais.liderMudanca} readOnly className="read-only-field" />
                                </div>
                                <div className="form-field">
                                    <label>Classificação</label>
                                    <select name="informacoesGerais_classificacao" value={formData.informacoesGerais.classificacao} onChange={handleChange}>
                                        <option value="Padrão">Padrão</option>
                                        <option value="Planejado">Planejado</option>
                                        <option value="Emergencial">Emergencial</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {currentStep === 1 && <div className="step-content"><CategoryHeader title="Plano de Implantação" /><div className="implementation-plan-list">{formData.planoImplantacao.map((item:any, idx:number) => renderActivityCard('planoImplantacao', item, idx))}<button onClick={() => addRow('planoImplantacao', activityTemplate)} className="add-row-btn">+ Adicionar Atividade</button></div></div>}
                {currentStep === 2 && <div className="step-content"><CategoryHeader title="Mapa de Transporte" /><div className="implementation-plan-list">{formData.mapaTransporte.map((item: any, idx: number) => renderTransportCard(item, idx))}<button onClick={() => addRow('mapaTransporte', transportTemplate)} className="add-row-btn">+ Adicionar Request</button></div></div>}
                {currentStep === 3 && <div className="step-content"><CategoryHeader title="Caderno de Testes" /><div className="implementation-plan-list">{formData.cadernoTestes.map((item: any, idx: number) => renderTestCard(item, idx))}<button onClick={() => addRow('cadernoTestes', testTemplate)} className="add-row-btn">+ Adicionar Teste</button></div></div>}
                {currentStep === 4 && <div className="step-content"><CategoryHeader title="Plano de Retorno" /><div className="implementation-plan-list">{formData.planoRetorno.map((item: any, idx: number) => renderActivityCard('planoRetorno', item, idx))}<button onClick={() => addRow('planoRetorno', { ...activityTemplate, status: 'Não iniciado', tipo: 'Manual' })} className="add-row-btn">+ Adicionar Atividade</button></div></div>}
                {currentStep === 5 && (
                    <div className="step-content">
                        <CategoryHeader title="Plano de Comunicação" />
                        <div className="form-grid" style={{ marginBottom: '3rem', backgroundColor: '#fdfdfd', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
                            {[
                                { label: 'Partes envolvidas validaram o plano?', field: 'partesEnvolvidasValidaram' },
                                { label: 'Processo de acompanhamento comunicado?', field: 'processoAcompanhamentoComunicado' },
                                { label: 'Comunicação de retorno contemplada?', field: 'comunicacaoEventoRetorno' },
                                { label: 'Passo a passo para aplicação existe?', field: 'passoAPassoAplicacao' }
                            ].map(q => (
                                <div key={q.field} className="form-field">
                                    <label>{q.label}</label>
                                    <div className="radio-group" style={{ gap: '1rem' }}>
                                        {['Sim', 'Não'].map(opt => (
                                            <label key={opt} className="radio-label">
                                                <input type="radio" checked={formData.comunicacaoChecklist[q.field] === opt} onChange={() => updateChecklistComunicacao(q.field, opt)} /> {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <CategoryHeader title="Detalhamento da Comunicação" />
                        <div className="implementation-plan-list">
                            {formData.planoComunicacao.map((item: any, idx: number) => renderCommunicationCard(item, idx))}
                            <button onClick={() => addRow('planoComunicacao', communicationTemplate)} className="add-row-btn">+ Adicionar Comunicação</button>
                        </div>
                    </div>
                )}
                {currentStep === 6 && (
                    <div className="step-content">
                        <CategoryHeader title="Risco de Mudança" />
                        <div className="form-grid" style={{ marginBottom: '3rem', backgroundColor: '#fdfdfd', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee' }}>
                            {[
                                { label: 'Plano de implantação claro sobre riscos/gatilhos?', field: 'planoImplantacaoRiscoClaro' },
                                { label: 'Stakeholders consultados sobre riscos?', field: 'stakeholdersConsultados' }
                            ].map(q => (
                                <div key={q.field} className="form-field">
                                    <label>{q.label}</label>
                                    <div className="radio-group" style={{ gap: '1rem' }}>
                                        {['Sim', 'Não'].map(opt => (
                                            <label key={opt} className="radio-label">
                                                <input type="radio" checked={formData.riscosGerais[q.field] === opt} onChange={() => updateChecklistRisco(q.field, opt)} /> {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <CategoryHeader title="Detalhamento dos Riscos" />
                        <div className="implementation-plan-list">
                            {formData.planoRiscos.map((item: any, idx: number) => renderRiskCard(item, idx))}
                            <button onClick={() => addRow('planoRiscos', riskTemplate)} className="add-row-btn">+ Adicionar Risco</button>
                        </div>
                    </div>
                )}
                {currentStep === 7 && (
                    <div className="step-content">
                        <CategoryHeader title="Segurança e Acessos" />
                        <div className="implementation-plan-list">
                            {formData.segurancaAcessos.perfis.map((item: any, idx: number) => renderSecurityProfileCard(item, idx))}
                            <button onClick={() => addRow('segurancaAcessos.perfis', securityProfileTemplate)} className="add-row-btn">+ Adicionar Perfil</button>
                        </div>
                    </div>
                )}
                {currentStep === 13 && (
                    <div className="step-content">
                        <CategoryHeader title="Detalhes da Mudança (Infra)" />
                        <div className="form-grid">
                            <div className="form-field full-width"><label>Descrição Detalhada *</label><textarea className={getInputClass(formData.infra.descricao)} value={formData.infra.descricao} onChange={(e) => updateInfraField('descricao', e.target.value)} style={{ minHeight: '120px' }}></textarea></div>
                            <div className="form-field full-width"><label>Justificativa *</label><textarea className={getInputClass(formData.infra.justificativa)} value={formData.infra.justificativa} onChange={(e) => updateInfraField('justificativa', e.target.value)} style={{ minHeight: '100px' }}></textarea></div>
                            <div className="form-field"><label>Responsável *</label><input type="text" className={getInputClass(formData.infra.responsavel)} value={formData.infra.responsavel} onChange={(e) => updateInfraField('responsavel', e.target.value)} /></div>
                            <div className="form-field"><label>Origem</label><select value={formData.infra.origem} onChange={(e) => updateInfraField('origem', e.target.value)}><option value="Portal do cliente">Portal do cliente</option><option value="E-mail">E-mail</option><option value="Telefone">Telefone</option></select></div>
                            <div className="form-field"><label>Solicitação</label><select value={formData.infra.solicitacao} onChange={(e) => updateInfraField('solicitacao', e.target.value)}><option value="">Selecione...</option><option value="Bloqueio">Bloqueio</option><option value="liberação">liberação</option></select></div>
                            <div className="form-field full-width">
                                <label>Filial</label>
                                <MultiSelect className={getInputClass(formData.infra.filial, false)} optionsData={{ 'Filiais': filiaisSipalData }} selected={formData.infra.filial ? [formData.infra.filial] : []} onChange={(val: string[]) => updateInfraField('filial', val.length > 0 ? val[val.length - 1] : '')} placeholder="Pesquise ou selecione a filial..." />
                            </div>
                        </div>
                    </div>
                )}
                {currentStep === 14 && (
                    <div className="step-content">
                        <CategoryHeader title="Planejamento e Execução (Infra)" />
                        <div className="form-grid">
                            <div className="form-field"><label>Data Início *</label><input type="datetime-local" className={getInputClass(formData.infra.dataInicio)} value={formData.infra.dataInicio} onChange={(e) => updateInfraField('dataInicio', e.target.value)} /></div>
                            <div className="form-field"><label>Data Fim *</label><input type="datetime-local" className={getInputClass(formData.infra.dataFim)} value={formData.infra.dataFim} onChange={(e) => updateInfraField('dataFim', e.target.value)} /></div>
                            <div className="form-field"><label>Indisponibilidade Estimada (minutos)</label><input type="number" value={formData.infra.indisponibilidadeMin} onChange={(e) => updateInfraField('indisponibilidadeMin', e.target.value)} min="0" /></div>
                            <div className="form-field"><label>Tickets Vinculados</label><input type="text" value={formData.infra.ticketsVinculados} onChange={(e) => updateInfraField('ticketsVinculados', e.target.value)} placeholder="SD-0000, SD-1111..." /></div>
                        </div>
                    </div>
                )}
                {currentStep === 15 && (
                    <div className="step-content">
                        <CategoryHeader title="Ativos e Recursos (Infra)" />
                        <div className="form-grid">
                            <div className="form-field"><label>Modelo do Computador *</label><input type="text" className={getInputClass(formData.infra.modeloComputador)} value={formData.infra.modeloComputador} onChange={(e) => updateInfraField('modeloComputador', e.target.value)} /></div>
                            <div className="form-field"><label>Número de Série *</label><input type="text" className={getInputClass(formData.infra.numeroSerie)} value={formData.infra.numeroSerie} onChange={(e) => updateInfraField('numeroSerie', e.target.value)} /></div>
                        </div>
                    </div>
                )}
                {currentStep === 8 && <div className="step-content"><CategoryHeader title="Contatos" /><div className="implementation-plan-list">{formData.contatos.map((item: any, idx: number) => renderContactCard(item, idx))}<button onClick={() => addRow('contatos', contactTemplate)} className="add-row-btn">+ Adicionar Contato</button></div></div>}
                {currentStep === 9 && <div className="step-content"><CategoryHeader title="Checklist" />{renderChecklistSection('checklist', checklistItemsStandard)}</div>}
                {currentStep === 10 && <div className="step-content"><CategoryHeader title="Checklist SAP" />{renderChecklistSection('checklistSAP', checklistSAPItems)}</div>}
                {currentStep === 11 && (
                    <div className="step-content">
                        <CategoryHeader title="Anexos" />
                        <div className="upload-container">
                            <input type="file" multiple onChange={handleFileChange} id="file-upload" style={{display:'none'}} />
                            <label htmlFor="file-upload" className="upload-box"><UploadIcon /><p>Clique para anexar</p></label>
                        </div>
                    </div>
                )}
                {currentStep === 12 && submittedRequestId && (
                    <div className="step-content success-view" style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <h2 style={{ color: themeColor }}>Mudança Enviada!</h2>
                        <p>Protocolo: <strong>{submittedRequestId}</strong></p>
                    </div>
                )}
            </div>
            {currentStep !== 12 && (
                <div className="wizard-nav-sticky">
                    <span style={{color: themeColor, fontWeight: '600', fontSize: '0.9rem'}}>{autoSaveStatus}</span>
                    <div className="main-nav-buttons">
                        <button type="button" className="nav-button secondary" onClick={() => onSaveDraft(formData, currentDraftId)}>Rascunho</button>
                        <button type="button" onClick={handleBack} className="nav-button secondary" disabled={visibleStepIndexes.indexOf(currentStep) === 0}>Voltar</button>
                        <button type="button" onClick={visibleStepIndexes.indexOf(currentStep) === visibleStepIndexes.length - 2 ? handleSubmit : handleNext} className="nav-button">
                            {visibleStepIndexes.indexOf(currentStep) === visibleStepIndexes.length - 2 ? 'Finalizar' : 'Próximo'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
