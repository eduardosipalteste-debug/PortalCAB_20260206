
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { HelpIcon, ExpandIcon, CheckIcon } from '../icons/AppIcons';
import { steps, sipalTeal } from '../../constants/app-constants';
import { generateTimeSlots } from '../../utils/app-utils';

export const Spinner = () => (
    <div className="spinner-container" aria-label="Carregando análise">
        <div className="spinner"></div>
    </div>
);

export const Tooltip = ({ text, children }: { text: string; children?: React.ReactNode }) => (
    <div className="tooltip-container">
        {children || <HelpIcon />}
        <span className="tooltip-text">{text}</span>
    </div>
);

export const WizardProgressBar = ({ currentStep, formData, completedSteps, onStepClick }: any) => {
    const visibleStepIndexes = useMemo(() => {
        if (!formData || !formData.informacoesGerais) return [0];
        const area = formData.informacoesGerais.areaAfetada;
        if (area === 'SAP') {
            return [0, 2, 8, 10, 11, 12];
        } else if (area === 'Infra') {
            return [0, 13, 14, 15, 11, 12];
        } else {
            return [0, 1, 3, 4, 5, 6, 7, 8, 9, 11, 12];
        }
    }, [formData?.informacoesGerais?.areaAfetada]);

    return (
        <div className="wizard-progress-bar">
            <div className="wizard-progress-inner">
                {visibleStepIndexes.map((stepIndex, index) => {
                    // O índice 12 é o passo de sucesso/finalização lógica, não deve aparecer na barra de progresso como item clicável
                    if (stepIndex === 12) return null;
                    const isActive = stepIndex === currentStep;
                    const isCompleted = !!completedSteps[stepIndex];
                    return (
                        <div key={stepIndex} className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`} onClick={() => onStepClick(stepIndex)}>
                            <div className="step-indicator">{(index + 1)}</div>
                            <span className="step-label">{steps[stepIndex]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const RequestList = ({ requests, kanbanStatuses = {} }: any) => (
    <div className="request-list">
        <table>
            <thead>
                <tr><th>ID</th><th>Título da Mudança</th><th>Líder</th><th>Classificação</th><th>Status</th></tr>
            </thead>
            <tbody>
                {requests && requests.map((req: any) => {
                    const statusClass = req.status ? req.status.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'unknown';
                    const statusText = kanbanStatuses[req.status] || req.status;
                    return (
                        <tr key={req.id}>
                            <td>{req.id}</td><td>{req.title}</td><td>{req.leader}</td><td>{req.classification}</td>
                            <td><span className={`status-badge status-${statusClass}`}>{statusText}</span></td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export const MultiSelect = ({ optionsData, selected, onChange, placeholder, className = '' }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        const currentSelected = Array.isArray(selected) ? selected : [];
        const newSelected = currentSelected.includes(option)
            ? currentSelected.filter(item => item !== option)
            : [...currentSelected, option];
        onChange(newSelected);
    };
    
    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const filteredOptions = useMemo(() => {
        if (!optionsData) return {};
        return Object.entries(optionsData).reduce((acc: any, [category, options]) => {
            const filtered = Array.isArray(options) ? options.filter((opt: string) => opt.toLowerCase().includes(searchTerm.toLowerCase())) : [];
            if (filtered.length > 0) acc[category] = filtered;
            return acc;
        }, {});
    }, [optionsData, searchTerm]);
    
    return (
        <div className="multi-select-container" ref={ref}>
            <div className={`multi-select-input-area ${isOpen ? 'open' : ''} ${className}`} onClick={() => setIsOpen(!isOpen)}>
                <div className="multi-select-tags">
                    {Array.isArray(selected) && selected.length > 0 ? (
                        selected.map((item: string) => (
                            <span key={item} className="multi-select-tag">
                                {item}
                                <button onClick={(e) => { e.stopPropagation(); handleSelect(item); }}>&times;</button>
                            </span>
                        ))
                    ) : (
                        <span className="multi-select-placeholder">{placeholder}</span>
                    )}
                </div>
                <div className="multi-select-arrow">▼</div>
            </div>
            {isOpen && (
                <div className="multi-select-dropdown">
                    <div className="multi-select-search">
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="multi-select-options-container">
                        {Object.entries(filteredOptions).map(([category, options]: [string, any]) => (
                            <div key={category} className="multi-select-category-group">
                                <button type="button" className="multi-select-category-header" onClick={() => toggleCategory(category)}>
                                    <span>{category}</span>
                                    <ExpandIcon isExpanded={!!expandedCategories[category]} />
                                </button>
                                {!!expandedCategories[category] && (
                                     <div className="multi-select-options-list">
                                        {Array.isArray(options) && options.map(option => (
                                            <div key={option} className="multi-select-option-item" onClick={() => handleSelect(option)}>
                                                <input type="checkbox" checked={(Array.isArray(selected) ? selected : []).includes(option)} readOnly />
                                                <span>{option}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const Modal = ({ isOpen, onClose, title, children, footer }: any) => {
    if (!isOpen) return null;
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
};
