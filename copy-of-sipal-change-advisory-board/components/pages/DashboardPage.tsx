
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadIcon } from '../icons/AppIcons';

export const DashboardPage = ({ onBack }: { onBack: () => void }) => {
    const [fileName, setFileName] = useState('');
    const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0, emergency: 0, standard: 0 });

    const processExcel = (data: any) => {
        const worksheet = data.Sheets[data.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        const rows = jsonData.slice(1);
        let approved = 0, rejected = 0, pending = 0, emergency = 0, standard = 0;
        rows.forEach(row => {
            const rowStr = JSON.stringify(row).toLowerCase();
            if (rowStr.includes('aprovado') || rowStr.includes('approved')) approved++;
            else if (rowStr.includes('rejeitado') || rowStr.includes('rejected')) rejected++;
            else pending++;
            if (rowStr.includes('emergencial') || rowStr.includes('emergency')) emergency++;
            else standard++;
        });
        setStats({ total: rows.length, approved, rejected, pending, emergency, standard });
    };

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = (evt.target as any).result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            processExcel(wb);
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="dashboard-page">
            <div className="card">
                <div className="request-list-header">
                    <div><h2>📊 Dashboard de Indicadores</h2><span className="subtitle">Faça upload de uma planilha para visualizar as métricas</span></div>
                    <button onClick={onBack} className="nav-button secondary">Voltar</button>
                </div>
                <div className="upload-container">
                    <input type="file" id="excel-upload" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{display: 'none'}} />
                    <label htmlFor="excel-upload" className="upload-box">
                        <UploadIcon />
                        <p>{fileName ? `Arquivo selecionado: ${fileName}` : "Arraste seu arquivo Excel aqui ou clique para selecionar"}</p>
                        <span className="upload-hint">Suporta .xlsx, .xls e .csv</span>
                    </label>
                </div>
            </div>
            {stats.total > 0 && (
                <div className="dashboard-content">
                    <div className="kpi-grid">
                        <div className="kpi-card total"><h3>Total de Requisições</h3><div className="kpi-value">{stats.total}</div></div>
                        <div className="kpi-card approved"><h3>Aprovadas</h3><div className="kpi-value">{stats.approved}</div><span className="kpi-percent">{((stats.approved / stats.total) * 100).toFixed(1)}%</span></div>
                        <div className="kpi-card rejected"><h3>Rejeitadas</h3><div className="kpi-value">{stats.rejected}</div><span className="kpi-percent">{((stats.rejected / stats.total) * 100).toFixed(1)}%</span></div>
                        <div className="kpi-card pending"><h3>Pendentes</h3><div className="kpi-value">{stats.pending}</div></div>
                    </div>
                    <div className="charts-grid">
                        <div className="card chart-card"><h3>Distribuição por Status</h3>
                            <div className="simple-bar-chart">
                                {[
                                    { label: 'Aprovado', val: stats.approved, class: 'approved' },
                                    { label: 'Rejeitado', val: stats.rejected, class: 'rejected' },
                                    { label: 'Pendente', val: stats.pending, class: 'pending' }
                                ].map(s => (
                                    <div key={s.label} className="bar-group"><div className="bar-label">{s.label}</div><div className="bar-track"><div className={`bar-fill ${s.class}`} style={{width: `${(s.val / stats.total) * 100}%`}}></div></div><div className="bar-value">{s.val}</div></div>
                                ))}
                            </div>
                        </div>
                        <div className="card chart-card"><h3>Classificação das Mudanças</h3>
                             <div className="simple-bar-chart">
                                {[
                                    { label: 'Padrão', val: stats.standard, class: 'standard' },
                                    { label: 'Emergencial', val: stats.emergency, class: 'emergency' }
                                ].map(s => (
                                    <div key={s.label} className="bar-group"><div className="bar-label">{s.label}</div><div className="bar-track"><div className={`bar-fill ${s.class}`} style={{width: `${(s.val / stats.total) * 100}%`}}></div></div><div className="bar-value">{s.val}</div></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
