
import jsPDF from 'jspdf';
import { steps, sipalBlue, sipalTeal } from '../constants/app-constants';

export const generateTimeSlots = () => {
    const slots = [];
    for(let h=8; h<18; h++) {
        for(let m=0; m<60; m+=20) {
            const sh = String(h).padStart(2,'0');
            const sm = String(m).padStart(2,'0');
            let eh = h; let em = m + 20;
            if(em >= 60) { eh++; em -= 60; }
            const seh = String(eh).padStart(2,'0');
            const sem = String(em).padStart(2,'0');
            slots.push(`${sh}:${sm} - ${seh}:${sem}`);
        }
    }
    return slots;
};

export const generateAndUploadPdf = async (formData: any, requestId: string | null = null) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let y = 0, rowStartY = 0, nextRowY = 0;
    let pageCount = 1;

    const areaAfetada = formData.informacoesGerais.areaAfetada || 'Sistemas';
    const isSAP = areaAfetada === 'SAP';
    const isInfra = areaAfetada === 'Infra';

    const drawPageHeader = (isFirstPage: boolean) => {
        doc.setFillColor(1, 33, 105); // Sipal Blue
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('SIPAL CAB', margin, 12);
        
        doc.setFontSize(9);
        doc.text(`RELATÓRIO DE MUDANÇA ${areaAfetada.toUpperCase()}`, margin, 20);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const protocolText = `PROTOCOLO: ${requestId || 'PENDENTE'}`;
        doc.text(protocolText, pageWidth - margin, 12, { align: 'right' });
        doc.text(`PÁGINA: ${pageCount}`, pageWidth - margin, 20, { align: 'right' });
        
        y = 35; 
        nextRowY = y;
        doc.setTextColor(0, 0, 0);
    };

    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 15) {
            pageCount++;
            doc.addPage(); 
            drawPageHeader(false);
            return true;
        }
        return false;
    };

    const drawSectionTitle = (title: string) => {
        y = Math.max(y, nextRowY); 
        checkPageBreak(15);
        y += 5; 
        doc.setFont('helvetica', 'bold'); 
        doc.setFontSize(12);
        doc.setTextColor(1, 33, 105); 
        doc.text(title.toUpperCase(), margin, y);
        y += 1.5; 
        doc.setDrawColor(0, 132, 121); // Sipal Teal
        doc.setLineWidth(0.6);
        doc.line(margin, y, margin + 25, y);
        y += 8; 
        nextRowY = y; 
        doc.setTextColor(0, 0, 0);
    };

    const drawField = (label: string, value: any, col: 1 | 2 = 1, isFullWidth: boolean = false) => {
        const safeValue = Array.isArray(value) ? value.join(', ') : String(value || '-').trim();
        const colWidth = isFullWidth ? contentWidth : (contentWidth / 2) - 4;
        const startX = col === 1 ? margin : margin + (contentWidth / 2) + 2;
        
        if (col === 1 || isFullWidth) { 
            y = Math.max(y, nextRowY); 
            rowStartY = y; 
        } else { 
            y = rowStartY; 
        }
        
        doc.setFontSize(8.5);
        const splitValue = doc.splitTextToSize(safeValue, colWidth);
        const fieldHeight = 4 + (splitValue.length * 4) + 2;
        
        if (checkPageBreak(fieldHeight)) {
            rowStartY = y;
        }
        
        doc.setFont('helvetica', 'bold'); 
        doc.setTextColor(50, 50, 50);
        doc.text(`${label}:`, startX, y);
        
        y += 4;
        doc.setFont('helvetica', 'normal'); 
        doc.setTextColor(0, 0, 0);
        doc.text(splitValue, startX, y);
        
        const currentFieldBottom = y + (splitValue.length * 4);
        nextRowY = Math.max(nextRowY, currentFieldBottom + 2);
        
        if (isFullWidth) y = nextRowY;
    };

    drawPageHeader(true);

    if (isInfra) {
        const infra = formData.infra;
        drawSectionTitle('1. Informações Gerais');
        drawField('Espaço', infra.espaco, 1);
        drawField('Tipo do ticket', infra.tipoTicket, 2);
        drawField('Status', infra.status, 1);
        drawField('Resumo', infra.resumo, 2);
        drawField('Sistemas afetados', infra.sistemaAfetado, 1, true);
        drawField('Versão', infra.versao, 1);

        drawSectionTitle('2. Detalhes da Mudança');
        drawField('Descrição Detalhada', infra.descricao, 1, true);
        drawField('Justificativa', infra.justificativa, 1, true);
        drawField('Responsável', infra.responsavel, 1);
        drawField('Origem', infra.origem, 2);
        drawField('Solicitação', infra.solicitacao, 1);
        drawField('Filial', infra.filial, 1, true);

        drawSectionTitle('3. Planejamento e Execução');
        drawField('Data Início', infra.dataInicio, 1);
        drawField('Data Fim', infra.dataFim, 2);
        drawField('Indisponibilidade (minutos)', infra.indisponibilidadeMin, 1);
        drawField('Tickets Vinculados', infra.ticketsVinculados, 2);

        drawSectionTitle('4. Ativos e Recursos');
        drawField('Modelo do Computador', infra.modeloComputador, 1);
        drawField('Número de Série', infra.numeroSerie, 2);
        
        if (formData.anexos && formData.anexos.length > 0) {
            drawSectionTitle('5. Anexos');
            const fileNames = formData.anexos.map((a: any) => a.name).join('; ');
            drawField('Arquivos Anexados', fileNames, 1, true);
        }
    } else {
        drawSectionTitle('1. Informações Gerais');
        const ig = formData.informacoesGerais;
        drawField('Líder da Mudança', ig.liderMudanca, 1);
        drawField('Solicitante', ig.solicitante, 2);
        drawField('Líder do Produto', ig.liderProduto, 1);
        drawField('Data da Mudança', ig.dataMudanca, 2);
        drawField('Classificação', ig.classificacao, 1);
        drawField('Risco Geral', ig.riscoGeral, 2);
        drawField('Indisponibilidade', ig.indisponibilidade, 1);
        drawField('Sistemas Afetados', ig.sistemasAfetados, 1, true);
        
        if (isSAP) {
            drawField('Mudança SAP', 'Sim', 1);
            drawField('Frentes SAP', ig.frentesSAP, 1, true);
        }
        
        drawField('Motivo da Mudança', ig.motivoMudanca, 1, true);
        drawField('Impacto de Não Realizar', ig.impactoNaoRealizar, 1, true);
        drawField('Restrições', ig.restricoesMudanca, 1, true);
        
        if (isSAP) {
            drawSectionTitle('2. Mapa de Transporte (Requests SAP)');
            formData.mapaTransporte.forEach((t:any, i:number) => {
                y = Math.max(y, nextRowY) + 2;
                checkPageBreak(20);
                doc.setFillColor(245, 247, 250);
                doc.rect(margin, y - 4, contentWidth, 6, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(1, 33, 105);
                doc.text(`REQUEST #${i+1}: ${t.requestId || 'SEM ID'}`, margin + 2, y);
                y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);

                drawField('ID Request', t.requestId, 1);
                drawField('Sequenciamento', t.sequencing, 2);
                drawField('Tipo Request', t.requestType, 1);
                drawField('Tipo (Urgência)', t.type, 2);
                drawField('Nº CALM/Jira', t.calmJira, 1);
                drawField('GO - SIPAL', t.goSipal, 2);
                drawField('Status', t.status, 1);
                drawField('Data Criação', t.creationDate, 2);
                drawField('Resp. Criação', t.creationResp, 1);
                drawField('Resp. Importação', t.importResp, 2);
                drawField('Solicitante Request', t.requester, 1);
                drawField('Link Evidência', t.testLink, 2);
                drawField('Objetivo', t.objective, 1, true);
                drawField('Descrição Técnica', t.technicalDescription, 1, true);
                drawField('Plano Rollback SAP', t.rollbackPlan, 1, true);
                drawField('Observações Adicionais', t.observations, 1, true);
                y = nextRowY + 3;
            });

            drawSectionTitle('3. Matriz de Contatos');
            formData.contatos.forEach((c: any, i: number) => {
                y = Math.max(y, nextRowY) + 2;
                checkPageBreak(12); 
                doc.setFillColor(245, 247, 250);
                doc.rect(margin, y - 4, contentWidth, 6, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(1, 33, 105);
                doc.text(`CONTATO #${i+1}: ${c.nome || 'SEM NOME'}`, margin + 2, y);
                y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);

                drawField('Nome', c.nome, 1);
                drawField('Cargo', c.cargo, 2);
                drawField('E-mail', c.email, 1);
                drawField('Telefones', c.telefones, 2);
                drawField('Local Atuação', c.localAtuacao, 1);
                drawField('Líder Imediato', c.liderImediato, 2);
                drawField('E-mail Líder', c.emailLider, 1);
                drawField('Área', c.area, 2);
                drawField('Gestor da Área', c.gestorArea, 1, true);
                
                if (c.gestorResponsavel) drawField('Gestor responsável', c.gestorResponsavel, 1);
                if (c.coordenadorResponsavel) drawField('Coordenador responsável', c.coordenadorResponsavel, 2);

                drawField('Comunicação Envolvida', c.comunEnvolvida, 1, true);
                y = nextRowY + 3;
            });

            drawSectionTitle('4. Checklist de Governança SAP');
            formData.checklistSAP.forEach((item: any) => {
                y = Math.max(y, nextRowY);
                const splitQ = doc.splitTextToSize(`• ${item.question}`, contentWidth);
                checkPageBreak((splitQ.length * 5) + 10);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
                doc.text(splitQ, margin, y);
                y += (splitQ.length * 4.5);
                doc.setFont('helvetica', 'bold');
                const isNo = item.answer === 'Não';
                doc.setTextColor(isNo ? 180 : 40, isNo ? 0 : 120, 0);
                doc.text(`RESPOSTA: ${String(item.answer || 'NÃO PREENCHIDO').toUpperCase()}`, margin + 5, y);
                doc.setTextColor(0, 0, 0);
                y += 5;
                if (item.justification) {
                    doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
                    const splitJ = doc.splitTextToSize(`Justificativa: ${item.justification}`, contentWidth - 10);
                    doc.text(splitJ, margin + 5, y);
                    y += (splitJ.length * 4.5);
                }
                y += 2; nextRowY = y;
            });
        } else {
            // Layout Sistemas Original
            if (formData.planoImplantacao && formData.planoImplantacao.length > 0) {
                drawSectionTitle('2. Plano de Implantação');
                formData.planoImplantacao.forEach((p: any, i: number) => {
                    y = Math.max(y, nextRowY) + 2; checkPageBreak(20);
                    doc.setFillColor(245, 247, 250); doc.rect(margin, y - 4, contentWidth, 6, 'F');
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(1, 33, 105);
                    doc.text(`ATIVIDADE #${i+1}: ${p.nomeAtividade || 'SEM NOME'}`, margin + 2, y);
                    y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);
                    drawField('Etapa', p.etapa, 1);
                    drawField('Status', p.status, 2);
                    drawField('Data Planejada', p.dataPlanejada, 1);
                    drawField('Hora Planejada', p.horaPlanejada, 2);
                    drawField('Responsável', p.responsavel, 1);
                    drawField('Departamento', p.departamento, 2);
                    drawField('Item Config.', p.itemConfiguracao, 1);
                    drawField('Tempo Execução', p.tempoExecucao, 2);
                    drawField('Descrição Técnica', p.descricao, 1, true);
                    y = nextRowY + 3;
                });
            }

            if (formData.cadernoTestes && formData.cadernoTestes.length > 0) {
                drawSectionTitle('3. Caderno de Testes');
                formData.cadernoTestes.forEach((t: any, i: number) => {
                    y = Math.max(y, nextRowY) + 2; checkPageBreak(20);
                    doc.setFillColor(245, 247, 250); doc.rect(margin, y - 4, contentWidth, 6, 'F');
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(1, 33, 105);
                    doc.text(`TESTE #${i+1}: ${t.nomeTeste || 'SEM NOME'}`, margin + 2, y);
                    y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);
                    drawField('Plano', t.plano, 1);
                    drawField('Tipo de Teste', t.tipoTeste, 2);
                    drawField('Data Planejada', t.dataPlanejada, 1);
                    drawField('Hora Planejada', t.horaPlanejada, 2);
                    drawField('Responsável', t.responsavel, 1);
                    drawField('Departamento', t.departamento, 2);
                    drawField('Atividade de Teste', t.atividade, 1, true);
                    drawField('Link do Teste', t.linkTeste, 1, true);
                    y = nextRowY + 3;
                });
            }

            if (formData.planoRetorno && formData.planoRetorno.length > 0) {
                drawSectionTitle('4. Plano de Retorno (Rollback)');
                formData.planoRetorno.forEach((p: any, i: number) => {
                    y = Math.max(y, nextRowY) + 2; checkPageBreak(20);
                    doc.setFillColor(245, 247, 250); doc.rect(margin, y - 4, contentWidth, 6, 'F');
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(1, 33, 105);
                    doc.text(`ATIVIDADE #${i+1}: ${p.descricao || 'SEM DESCRIÇÃO'}`, margin + 2, y);
                    y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);
                    drawField('Data Planejada', p.dataPlanejada, 1);
                    drawField('Status', p.status, 2);
                    drawField('Tipo', p.tipo, 1);
                    drawField('Responsável', p.responsavel, 2);
                    drawField('Descrição Técnica', p.descricao, 1, true);
                    y = nextRowY + 3;
                });
            }

            if (formData.planoComunicacao && formData.planoComunicacao.length > 0) {
                drawSectionTitle('5. Plano de Comunicação');
                const ck = formData.comunicacaoChecklist;
                drawField('Validado pelas partes', ck.partesEnvolvidasValidaram, 1);
                drawField('Acompanhamento comunicado', ck.processoAcompanhamentoComunicado, 2);
                drawField('Retorno contemplado', ck.comunicacaoEventoRetorno, 1);
                drawField('Passo a passo existe', ck.passoAPassoAplicacao, 2);
                
                formData.planoComunicacao.forEach((c: any, i: number) => {
                    y = Math.max(y, nextRowY) + 5; checkPageBreak(25);
                    doc.setFillColor(245, 247, 250); doc.rect(margin, y - 4, contentWidth, 6, 'F');
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(1, 33, 105);
                    doc.text(`COMUNICAÇÃO #${i+1}`, margin + 2, y);
                    y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);
                    drawField('Data', c.data, 1); drawField('Hora', c.hora, 2);
                    drawField('Status', c.status, 1); drawField('Meio', c.meio, 2);
                    drawField('Atividade/Público', c.atividadePublico, 1, true);
                    drawField('Responsável', c.responsavel, 1);
                    drawField('Contato Escalonamento', c.contatoEscalonamento, 2);
                    drawField('Observação', c.observacao, 1, true);
                    y = nextRowY + 3;
                });
            }

            if (formData.planoRiscos && formData.planoRiscos.length > 0) {
                drawSectionTitle('6. Análise de Riscos');
                const rg = formData.riscosGerais;
                drawField('Implantação clara sobre riscos/gatilhos', rg.planoImplantacaoRiscoClaro, 1);
                drawField('Stakeholders consultados', rg.stakeholdersConsultados, 2);
                formData.planoRiscos.forEach((r: any, i: number) => {
                    y = Math.max(y, nextRowY) + 5; checkPageBreak(30);
                    doc.setFillColor(245, 247, 250); doc.rect(margin, y - 4, contentWidth, 6, 'F');
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(1, 33, 105);
                    doc.text(`DETALHAMENTO DO RISCO #${i+1}`, margin + 2, y);
                    y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);
                    drawField('Tipo de Risco', r.tipoRisco, 1); drawField('Impacto', r.impacto, 2);
                    drawField('Estratégia', r.estrategia, 1); drawField('Risco Identificado', r.risco, 1, true);
                    drawField('Ação (Gatilho)', r.acao, 1, true); drawField('Mitigação', r.mitigacao, 1, true);
                    y = nextRowY + 3;
                });
            }

            if (formData.segurancaAcessos.perfis && formData.segurancaAcessos.perfis.length > 0) {
                drawSectionTitle('7. Segurança e Acessos');
                formData.segurancaAcessos.perfis.forEach((p: any, i: number) => {
                    y = Math.max(y, nextRowY) + 5; checkPageBreak(30);
                    doc.setFillColor(245, 247, 250); doc.rect(margin, y - 4, contentWidth, 6, 'F');
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(1, 33, 105);
                    doc.text(`PERFIL DE ACESSO #${i+1}`, margin + 2, y);
                    y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);
                    drawField('Nível de acesso', p.nivelAcesso, 1); drawField('Plataforma', p.plataforma, 2);
                    drawField('Ambiente', p.ambiente, 1); drawField('Item Config.', p.itemConfig, 2);
                    drawField('Área de Negócio', p.areaNegocio, 1); drawField('Usuários', p.usuarios, 2);
                    drawField('Login de acesso', p.loginAcesso, 1); drawField('Grupos de acesso', p.gruposAcesso, 1, true);
                    drawField('Justificativa', p.justificativa, 1, true);
                    y = nextRowY + 3;
                });
            }

            drawSectionTitle('8. Matriz de Contatos');
            formData.contatos.forEach((c: any, i: number) => {
                y = Math.max(y, nextRowY) + 5; checkPageBreak(25);
                doc.setFillColor(245, 247, 250); doc.rect(margin, y - 4, contentWidth, 6, 'F');
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(1, 33, 105);
                doc.text(`CONTATO #${i+1}: ${c.nome || 'SEM NOME'}`, margin + 2, y);
                y += 6; nextRowY = y; doc.setTextColor(0, 0, 0);
                drawField('Nome', c.nome, 1); drawField('Cargo', c.cargo, 2);
                drawField('E-mail', c.email, 1); drawField('Telefones', c.telefones, 2);
                drawField('Área', c.area, 1); drawField('Gestor da Área', c.gestorArea, 2);
                drawField('Comunicação Envolvida', c.comunEnvolvida, 1, true);
                y = nextRowY + 3;
            });

            drawSectionTitle('9. Checklist de Governança Geral');
            formData.checklist.forEach((item: any) => {
                y = Math.max(y, nextRowY);
                const splitQ = doc.splitTextToSize(`• ${item.question}`, contentWidth);
                checkPageBreak((splitQ.length * 5) + 12);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
                doc.text(splitQ, margin, y);
                y += (splitQ.length * 4.5);
                doc.setFont('helvetica', 'bold');
                const isNo = item.answer === 'Não';
                doc.setTextColor(isNo ? 180 : 40, isNo ? 0 : 120, 0);
                doc.text(`RESPOSTA: ${String(item.answer || 'NÃO PREENCHIDO').toUpperCase()}`, margin + 5, y);
                doc.setTextColor(0, 0, 0);
                y += 5;
                if (item.justification) {
                    doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
                    const splitJ = doc.splitTextToSize(`Justificativa: ${item.justification}`, contentWidth - 10);
                    doc.text(splitJ, margin + 5, y);
                    y += (splitJ.length * 4.5);
                }
                y += 2; nextRowY = y;
            });

            if (formData.anexos && formData.anexos.length > 0) {
                drawSectionTitle('10. Anexos');
                const fileNames = formData.anexos.map((a: any) => a.name).join('; ');
                drawField('Arquivos Anexados', fileNames, 1, true);
            }
        }
    }

    // Gerar Nomenclatura conforme padrão solicitado: CAB-W-AREA-Y-X_Z
    const areaCode = areaAfetada === 'Sistemas' ? 'STM' : areaAfetada.toUpperCase();
    
    // Obter Classificação (W)
    const rawClass = isInfra ? formData.infra.tipoMudanca : formData.informacoesGerais.classificacao;
    const wMap: Record<string, string> = { 'Padrão': 'PRD', 'Planejado': 'PLN', 'Emergencial': 'EMG' };
    const wCode = wMap[rawClass] || 'PRD';

    const today = new Date();
    const yStr = today.getFullYear().toString() + 
                 String(today.getMonth() + 1).padStart(2, '0') + 
                 String(today.getDate()).padStart(2, '0');
    const xStr = Math.floor(1000 + Math.random() * 9000).toString();
    const zStr = (formData.informacoesGerais.liderMudanca || 'SEM_LIDER').trim().replace(/[\s.]+/g, '_');
    
    const finalFileName = `CAB-${wCode}-${areaCode}-${yStr}-${xStr}_${zStr}.pdf`;

    doc.save(finalFileName);
    return { success: true, message: 'PDF gerado com sucesso.' };
};

export const newId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
