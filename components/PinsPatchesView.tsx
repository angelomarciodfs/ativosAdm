
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MerchandiseItem, Legendario, ImportPreviewData, User } from '../types';
import { api } from '../services/database';
import { Search, Upload, CheckCircle, Circle, AlertTriangle, X, Check, Loader, FileSpreadsheet, Download, Pencil, Eye, Save, Calendar, Mail, Phone, Hash, ChevronDown, FileText } from 'lucide-react';
// @ts-ignore
import readXlsxFile from 'read-excel-file';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

interface PinsPatchesViewProps {
  currentUser: User | null;
}

export const PinsPatchesView: React.FC<PinsPatchesViewProps> = ({ currentUser }) => {
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [legendarios, setLegendarios] = useState<Legendario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewData[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Edit & View State
  const [selectedLegendario, setSelectedLegendario] = useState<Legendario | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Legendario>>({});
  const [editDeliveryDates, setEditDeliveryDates] = useState<Record<string, string>>({});

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função centralizada para buscar legendários
  const fetchLegendarios = useCallback(async (term: string) => {
    try {
        setLoading(true);
        // Busca no banco. Se term for vazio, a API retorna os primeiros 50 registros por padrão.
        const data = await api.searchLegendarios(term);
        // Ordenação alfabética no front para garantir consistência visual
        const sortedData = data.sort((a: Legendario, b: Legendario) => a.name.localeCompare(b.name));
        setLegendarios(sortedData);
    } catch (error) {
        console.error("Erro ao buscar legendários", error);
    } finally {
        setLoading(false);
    }
  }, []);

  // Carregar dados iniciais (Estoque e Lista de Pessoas)
  useEffect(() => {
    const init = async () => {
        setLoading(true);
        try {
            const items = await api.fetchMerchandise();
            setMerchandise(items);
            // Carrega lista inicial vazia ou completa
            await fetchLegendarios(''); 
        } finally {
            setLoading(false);
        }
    };
    init();
  }, [fetchLegendarios]);

  // Efeito de Busca (Debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLegendarios(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchLegendarios]);

  // --- Lógica de Exportação ---
  
  const handleExportExcel = () => {
    if (legendarios.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    // 1. Cabeçalhos
    const headers = [
        "Nome",
        "Telefone",
        "CPF",
        "Email",
        "Nº LGND", 
        ...merchandise.map(m => m.name)
    ];

    // 2. Linhas de Dados
    const rows = legendarios.map(leg => {
        const baseData = [
            leg.name,
            leg.phone || "",
            leg.cpf || "",
            leg.email || "",
            leg.registrationNumber || ""
        ];

        const itemsData = merchandise.map(item => {
            const deliveryDateISO = leg.deliveries?.[item.id];
            if (deliveryDateISO) {
                const date = new Date(deliveryDateISO as string);
                return date.toLocaleDateString('pt-BR'); 
            }
            return "";
        });

        return [...baseData, ...itemsData];
    });

    const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `legendarios_entregas_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    if (legendarios.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const doc = new jsPDF();
    
    // Título e Data
    doc.setFontSize(16);
    doc.text("Relatório de Entregas - Pins & Patches", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 22);

    // Preparar dados para tabela
    const tableHead = [
        ['Nome', 'LGND', ...merchandise.map(m => m.name)]
    ];

    const tableBody = legendarios.map(leg => {
        return [
            leg.name,
            leg.registrationNumber || '-',
            ...merchandise.map(item => {
                const deliveryDateISO = leg.deliveries?.[item.id];
                return deliveryDateISO ? 'SIM' : ''; // Para PDF, "SIM" ou Data curta fica melhor que data cheia se houver muitas colunas
            })
        ];
    });

    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' }, // Brand Color (Orange-500 equivalent)
        alternateRowStyles: { fillColor: [250, 250, 250] },
        theme: 'grid'
    });

    doc.save(`relatorio_entregas_${new Date().toISOString().slice(0,10)}.pdf`);
    setIsExportMenuOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const candidates: ImportPreviewData[] = [];
    const seenCPFs = new Set<string>();

    try {
        if (file.name.endsWith('.xlsx')) {
            const rows = await readXlsxFile(file);
            const IDX_CPF = 5;      // Coluna F
            const IDX_NAME = 7;     // Coluna H
            const IDX_EMAIL = 8;    // Coluna I
            const IDX_PHONE = 9;    // Coluna J

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                const cpfRaw = row[IDX_CPF] ? String(row[IDX_CPF]).trim() : '';
                const name = row[IDX_NAME] ? String(row[IDX_NAME]).trim() : '';
                const email = row[IDX_EMAIL] ? String(row[IDX_EMAIL]).trim() : '';
                const phone = row[IDX_PHONE] ? String(row[IDX_PHONE]).trim() : '';

                if (cpfRaw && name) {
                    if (seenCPFs.has(cpfRaw)) continue;
                    seenCPFs.add(cpfRaw);
                    candidates.push({
                        cpf: cpfRaw,
                        name: name,
                        email: email,
                        phone: phone,
                        registrationNumber: '',
                        exists: false,
                        selected: true
                    });
                }
            }
        } else {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            for (let i = 1; i < lines.length; i++) { 
               const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
               if (cols.length < 2) continue; 
               const cpfRaw = cols[0] || '';
               const name = cols[1] || '';
               const email = cols[2] || '';
               const phone = cols[3] || '';
               if (cpfRaw && name) {
                   if (seenCPFs.has(cpfRaw)) continue;
                   seenCPFs.add(cpfRaw);
                   candidates.push({
                       cpf: cpfRaw,
                       name,
                       email,
                       phone,
                       registrationNumber: '',
                       exists: false,
                       selected: true
                   });
               }
            }
        }

        if (candidates.length === 0) {
            alert("Nenhum dado válido encontrado no arquivo.");
            return;
        }

        const cpfsToCheck = candidates.map(c => c.cpf);
        const existingCPFs = await api.checkExistingCPFs(cpfsToCheck);
        
        const processedCandidates = candidates.map(c => ({
            ...c,
            exists: existingCPFs.includes(c.cpf),
            selected: !existingCPFs.includes(c.cpf)
        })).sort((a, b) => a.name.localeCompare(b.name));

        setImportPreview(processedCandidates);
        setIsImportModalOpen(true);
        e.target.value = ''; 

    } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        alert("Erro ao ler o arquivo. Verifique se o formato está correto.");
    }
  };

  const validImportItems = importPreview.filter(i => !i.exists);
  const isAllSelected = validImportItems.length > 0 && validImportItems.every(i => i.selected);

  const toggleSelectAll = () => {
    const newState = !isAllSelected;
    setImportPreview(prev => prev.map(item => {
        if (item.exists) return item;
        return { ...item, selected: newState };
    }));
  };

  const confirmImport = async () => {
      setIsImporting(true);
      try {
          const toImport = importPreview.filter(c => c.selected);
          await api.importLegendarios(toImport);
          setIsImportModalOpen(false);
          setSearchTerm(''); // Limpa a busca para forçar recarregamento da lista completa
          fetchLegendarios(''); // Força refresh imediato
          alert(`${toImport.length} legendários importados com sucesso!`);
      } catch (err) {
          console.error(err);
          alert('Erro ao importar.');
      } finally {
          setIsImporting(false);
      }
  };

  // --- Handlers para View/Edit ---
  
  const handleEditClick = (legendario: Legendario) => {
    setEditFormData({
        name: legendario.name,
        cpf: legendario.cpf,
        email: legendario.email,
        phone: legendario.phone,
        registrationNumber: legendario.registrationNumber
    });
    // Populando as datas de entrega existentes para edição
    const dates: Record<string, string> = {};
    if (legendario.deliveries) {
        Object.entries(legendario.deliveries).forEach(([itemId, dateIso]) => {
            // Converter ISO para formato datetime-local (yyyy-MM-ddThh:mm)
            if (dateIso) {
                dates[itemId] = new Date(dateIso as string).toISOString().slice(0, 16);
            }
        });
    }
    setEditDeliveryDates(dates);
    setSelectedLegendario(legendario);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (legendario: Legendario) => {
    setSelectedLegendario(legendario);
    setIsViewModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLegendario) return;

    try {
        // 1. Atualizar dados do perfil
        await api.updateLegendario({ id: selectedLegendario.id, ...editFormData });
        
        // 2. Atualizar datas de entrega modificadas
        const promises = Object.entries(editDeliveryDates).map(async ([itemId, newDate]) => {
            const originalDate = selectedLegendario.deliveries?.[itemId];
            // Se a data mudou, atualiza no banco
            if (originalDate && new Date(originalDate as string).toISOString().slice(0, 16) !== newDate) {
                 await api.updateDeliveryDate(selectedLegendario.id, itemId, new Date(newDate as string).toISOString());
            }
        });

        await Promise.all(promises);

        // 3. Atualiza estado local (Recarregando para garantir integridade)
        await fetchLegendarios(searchTerm);
        
        setIsEditModalOpen(false);
        setSelectedLegendario(null);
    } catch (error) {
        console.error("Erro ao atualizar", error);
        alert("Erro ao salvar alterações.");
    }
  };

  const handleToggleDelivery = async (legendario: Legendario, item: MerchandiseItem) => {
    if (!currentUser) return;
    const isDelivered = !!legendario.deliveries?.[item.id];

    try {
        if (isDelivered) {
            // Lógica de Cancelamento (Undo)
            await api.undoDelivery(legendario.id, item.id);
            
            // Atualização Otimista: Remove a entrega e devolve estoque
            const updateState = (prevLegs: Legendario[], prevMerch: MerchandiseItem[]) => {
                const newLegs = prevLegs.map(l => {
                    if (l.id === legendario.id) {
                        const newDeliveries = { ...l.deliveries };
                        delete newDeliveries[item.id];
                        return { ...l, deliveries: newDeliveries };
                    }
                    return l;
                });
                const newMerch = prevMerch.map(m => {
                    if (m.id === item.id) return { ...m, currentStock: m.currentStock + 1 };
                    return m;
                });
                return { newLegs, newMerch };
            };

            // Atualiza Lista Principal
            setLegendarios(prev => {
                const { newLegs } = updateState(prev, merchandise);
                return newLegs;
            });
            setMerchandise(prev => {
                const { newMerch } = updateState(legendarios, prev);
                return newMerch;
            });

            // Atualiza Modal Selecionado se estiver aberto
            if (selectedLegendario && selectedLegendario.id === legendario.id) {
                 setSelectedLegendario(prev => {
                     if (!prev) return null;
                     const newDeliveries = { ...prev.deliveries };
                     delete newDeliveries[item.id];
                     return { ...prev, deliveries: newDeliveries };
                 });
            }

        } else {
            // Lógica de Entrega
            await api.deliverItem(legendario.id, item.id, currentUser.id);
            
            const now = new Date().toISOString();
            
            // Atualização Otimista
            const updateState = (prevLegs: Legendario[], prevMerch: MerchandiseItem[]) => {
                 const newLegs = prevLegs.map(l => {
                    if (l.id === legendario.id) {
                        return {
                            ...l,
                            deliveries: { ...l.deliveries, [item.id]: now }
                        };
                    }
                    return l;
                 });
                 const newMerch = prevMerch.map(m => {
                    if (m.id === item.id) return { ...m, currentStock: m.currentStock - 1 };
                    return m;
                 });
                 return { newLegs, newMerch };
            };

            setLegendarios(prev => {
                const { newLegs } = updateState(prev, merchandise);
                return newLegs;
            });
            setMerchandise(prev => {
                 const { newMerch } = updateState(legendarios, prev);
                 return newMerch;
            });

            if (selectedLegendario && selectedLegendario.id === legendario.id) {
                 setSelectedLegendario(prev => {
                     if (!prev) return null;
                     return { ...prev, deliveries: { ...prev.deliveries, [item.id]: now } };
                 });
            }
        }
    } catch (error: any) {
        alert(error.message || "Erro ao processar a ação.");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {/* HEADER SECTION (STICKY) */}
      <div className="sticky top-0 z-20 bg-gray-50 pt-1 pb-4 -mt-2 space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Pins & Patches</h2>
              <p className="text-gray-500 mt-1 text-sm font-medium uppercase tracking-wider">Gestão de entregas e estoque de materiais.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-auto" ref={exportMenuRef}>
                    <button 
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className="flex items-center justify-center w-full md:w-auto gap-2 px-4 py-3 rounded-xl font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95 shadow-sm"
                    >
                        <Download size={18} /> Exportar <ChevronDown size={14} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isExportMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-full md:w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                             <button onClick={handleExportExcel} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm font-bold text-gray-700">
                                 <FileSpreadsheet size={16} className="text-emerald-600" /> Excel (CSV)
                             </button>
                             <div className="border-t border-gray-100"></div>
                             <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm font-bold text-gray-700">
                                 <FileText size={16} className="text-red-600" /> PDF
                             </button>
                        </div>
                    )}
                </div>

                <label className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-3 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 cursor-pointer transition-all active:scale-95">
                    <Upload size={18} /> Importar (CSV / XLSX)
                    <input type="file" accept=".csv, .xlsx" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
          </div>

          {/* SEARCH & STOCK SUMMARY - Ajuste de Grid (Busca 60%, Estoque 40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 shrink-0">
              <div className="lg:col-span-3 relative">
                 <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              {/* Stock List */}
              <div className="lg:col-span-2 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 overflow-x-auto custom-scrollbar min-h-[90px]">
                  {merchandise.length === 0 ? (
                      <div className="text-xs text-gray-400 w-full text-center">Nenhum item de estoque.</div>
                  ) : (
                      merchandise.map(item => (
                          <div key={item.id} className="min-w-[100px] flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-100 shrink-0 shadow-sm">
                              <span className="text-[10px] uppercase font-bold text-gray-400 text-center leading-tight h-6 overflow-hidden flex items-center">{item.name}</span>
                              <span className={`text-xl font-black ${item.currentStock < item.minThreshold ? 'text-red-500' : 'text-gray-800'}`}>
                                  {item.currentStock}
                              </span>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* RESULTS LIST */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resultados da Busca</span>
             <span className="text-xs font-bold text-gray-400">
                {loading ? 'Carregando...' : `${legendarios.length} encontrados`}
             </span>
         </div>
         <div className="p-2">
             {legendarios.length === 0 && !loading ? (
                 <div className="flex flex-col items-center justify-center text-gray-400 opacity-50 min-h-[200px]">
                     <Search size={48} className="mb-4" />
                     <p className="font-medium text-center px-4">Nenhum legendário encontrado.</p>
                 </div>
             ) : (
                 <div className="space-y-2">
                     {legendarios.map(leg => (
                         <div key={leg.id} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 hover:border-brand-200 hover:shadow-md transition-all">
                             {/* Informações do Legendário */}
                             <div className="flex-1 min-w-0 text-center md:text-left w-full md:w-auto">
                                 <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <h4 className="text-lg font-bold text-gray-900 truncate">{leg.name}</h4>
                                    
                                    {/* Edit & View Buttons (Desktop/Inline) */}
                                    <div className="flex gap-1 ml-2">
                                        <button 
                                            onClick={() => handleViewClick(leg)}
                                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" 
                                            title="Ver Detalhes"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(leg)}
                                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" 
                                            title="Editar Cadastro"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </div>
                                 </div>

                                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-gray-500">
                                     <span className="font-mono bg-gray-100 px-1.5 rounded text-xs text-gray-600 font-bold">{leg.cpf}</span>
                                     <span className="truncate max-w-[200px]">{leg.email}</span>
                                     {leg.registrationNumber ? (
                                         <span className="text-brand-600 font-bold bg-brand-50 px-1.5 rounded border border-brand-100">LGND #{leg.registrationNumber}</span>
                                     ) : (
                                         <span className="text-gray-300 text-xs italic">Sem Nº LGND</span>
                                     )}
                                 </div>
                             </div>
                             
                             {/* Botões de Entrega (Flags) */}
                             <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end w-full md:w-auto">
                                 {merchandise.map(item => {
                                     const isDelivered = !!leg.deliveries?.[item.id];
                                     const deliveryDate = isDelivered ? new Date(leg.deliveries![item.id] as string).toLocaleString('pt-BR') : '';

                                     return (
                                         <button
                                            key={item.id}
                                            onClick={() => handleToggleDelivery(leg, item)}
                                            disabled={!isDelivered && item.currentStock <= 0}
                                            title={isDelivered ? `Entregue em: ${deliveryDate}` : (item.currentStock <= 0 ? 'Sem Estoque' : `Entregar ${item.name}`)}
                                            className={`
                                                relative group flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200
                                                w-14 h-14 md:w-16 md:h-16
                                                ${isDelivered 
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 hover:bg-red-50 hover:border-red-500 hover:text-red-500' 
                                                    : (item.currentStock <= 0 
                                                        ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                                                        : 'bg-white border-gray-200 text-gray-400 hover:border-brand-500 hover:text-brand-500 hover:shadow-lg hover:scale-105 active:scale-95')
                                                }
                                            `}
                                         >
                                             {isDelivered ? <CheckCircle size={20} className="mb-1 group-hover:hidden" /> : <Circle size={20} className="mb-1" />}
                                             {isDelivered && <X size={20} className="mb-1 hidden group-hover:block" />}
                                             <span className="text-[8px] md:text-[9px] font-bold text-center leading-tight px-0.5 line-clamp-2 uppercase tracking-tight">{item.name}</span>
                                         </button>
                                     );
                                 })}
                             </div>
                         </div>
                     ))}
                 </div>
             )}
         </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                     <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Pencil className="text-brand-500" size={20} /> Editar Legendário
                     </h3>
                     <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
                 </div>
                 <form onSubmit={handleSaveEdit} className="p-6 space-y-6 overflow-y-auto">
                     <div className="space-y-4">
                        <h4 className="text-xs uppercase font-bold text-gray-400 border-b border-gray-100 pb-2">Dados Cadastrais</h4>
                         <div>
                             <label className="text-xs uppercase font-bold text-gray-500">Nome Completo</label>
                             <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-bold" 
                                value={editFormData.name || ''} 
                                onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                                required 
                             />
                         </div>
                         <div>
                            <label className="text-xs uppercase font-bold text-brand-600">Nº LGND (Inscrição)</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-300" size={18} />
                                <input type="text" className="w-full bg-brand-50 border border-brand-200 rounded-lg p-3 pl-10 font-mono font-bold text-brand-800" 
                                    value={editFormData.registrationNumber || ''} 
                                    onChange={e => setEditFormData({...editFormData, registrationNumber: e.target.value})} 
                                    placeholder="Ex: 12345"
                                />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase font-bold text-gray-500">CPF</label>
                                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" 
                                    value={editFormData.cpf || ''} 
                                    onChange={e => setEditFormData({...editFormData, cpf: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase font-bold text-gray-500">Telefone</label>
                                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" 
                                    value={editFormData.phone || ''} 
                                    onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                                />
                            </div>
                         </div>
                         <div>
                            <label className="text-xs uppercase font-bold text-gray-500">Email</label>
                            <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" 
                                value={editFormData.email || ''} 
                                onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                            />
                         </div>
                     </div>

                     {/* Seção de Edição de Datas de Entrega */}
                     {Object.keys(editDeliveryDates).length > 0 && (
                         <div className="space-y-4">
                            <h4 className="text-xs uppercase font-bold text-gray-400 border-b border-gray-100 pb-2">Editar Datas de Entrega</h4>
                            <div className="space-y-3">
                                {merchandise.map(item => {
                                    if (!editDeliveryDates[item.id]) return null;
                                    return (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-gray-700 w-1/3">{item.name}</span>
                                            <input 
                                                type="datetime-local" 
                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-600"
                                                value={editDeliveryDates[item.id]}
                                                onChange={e => setEditDeliveryDates({...editDeliveryDates, [item.id]: e.target.value})}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                         </div>
                     )}

                     <div className="pt-4 sticky bottom-0 bg-white">
                         <button type="submit" className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
                             <Save size={18} /> Salvar Alterações
                         </button>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isViewModalOpen && selectedLegendario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                     <div>
                         <h3 className="text-xl font-black text-gray-900">{selectedLegendario.name}</h3>
                         <p className="text-sm text-brand-600 font-bold">
                             {selectedLegendario.registrationNumber ? `LGND #${selectedLegendario.registrationNumber}` : 'Sem número de inscrição'}
                         </p>
                     </div>
                     <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
                 </div>
                 <div className="p-6 space-y-6">
                     <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Hash size={16} className="text-gray-400" /> <span className="font-mono">{selectedLegendario.cpf || 'CPF não informado'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Mail size={16} className="text-gray-400" /> <span>{selectedLegendario.email || 'Email não informado'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Phone size={16} className="text-gray-400" /> <span>{selectedLegendario.phone || 'Telefone não informado'}</span>
                        </div>
                     </div>
                     
                     <div className="border-t border-gray-100 pt-4">
                         <h4 className="text-xs uppercase font-bold text-gray-500 mb-3 flex items-center gap-2">
                             <Calendar size={14} /> Histórico de Entregas
                         </h4>
                         <div className="space-y-2">
                             {merchandise.map(item => {
                                 const deliveredAt = selectedLegendario.deliveries?.[item.id];
                                 const isDelivered = !!deliveredAt;

                                 return (
                                     <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                                         <span className="font-bold text-gray-700 text-sm">{item.name}</span>
                                         
                                         {/* Botão de Toggle na Visualização */}
                                         <button 
                                            onClick={() => handleToggleDelivery(selectedLegendario, item)}
                                            disabled={!isDelivered && item.currentStock <= 0}
                                            className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                                ${isDelivered 
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                                                    : (item.currentStock <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-300 text-gray-500 hover:border-brand-500 hover:text-brand-500')}
                                            `}
                                         >
                                             {isDelivered ? (
                                                 <>
                                                     <CheckCircle size={14} />
                                                     <span>Entregue</span>
                                                     <span className="text-[9px] font-normal ml-1 hidden sm:inline">
                                                         {new Date(deliveredAt as string).toLocaleDateString('pt-BR')}
                                                     </span>
                                                 </>
                                             ) : (
                                                <>
                                                    <Circle size={14} />
                                                    <span>{item.currentStock <= 0 ? 'Sem Estoque' : 'Marcar'}</span>
                                                </>
                                             )}
                                         </button>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* IMPORT MODAL (Mantido igual, apenas renderizado no final) */}
      {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                             <FileSpreadsheet className="text-brand-500" />
                             Importação de Legendários
                          </h3>
                          <p className="text-sm text-gray-500">Confira os dados antes de confirmar.</p>
                      </div>
                      <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-0">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                              <tr className="text-xs uppercase font-bold text-gray-500">
                                  <th className="p-4 w-10 text-center">
                                      <input 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        disabled={validImportItems.length === 0}
                                        className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 cursor-pointer disabled:opacity-50"
                                      />
                                  </th>
                                  <th className="p-4">Nome</th>
                                  <th className="p-4">CPF</th>
                                  <th className="p-4">Email</th>
                                  <th className="p-4 text-center">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                              {importPreview.map((item, idx) => (
                                  <tr key={idx} className={item.exists ? 'bg-gray-50 opacity-60' : 'hover:bg-brand-50/10 transition-colors'}>
                                      <td className="p-4 text-center">
                                          <input 
                                            type="checkbox" 
                                            checked={item.selected} 
                                            onChange={() => {
                                                const updated = [...importPreview];
                                                updated[idx].selected = !updated[idx].selected;
                                                setImportPreview(updated);
                                            }}
                                            disabled={item.exists}
                                            className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 cursor-pointer disabled:opacity-50"
                                          />
                                      </td>
                                      <td className="p-4 font-bold text-gray-900">{item.name}</td>
                                      <td className="p-4 font-mono text-gray-600">{item.cpf}</td>
                                      <td className="p-4 text-gray-500 truncate max-w-[200px]">{item.email}</td>
                                      <td className="p-4 text-center">
                                          {item.exists ? (
                                              <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                                                  <AlertTriangle size={12} /> Duplicado
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                                  <Check size={12} /> Novo
                                              </span>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl shrink-0">
                      <div className="text-sm font-bold text-gray-600">
                          {importPreview.filter(i => i.selected).length} selecionados para importar
                      </div>
                      <div className="flex gap-4">
                          <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-white transition-colors">Cancelar</button>
                          <button 
                            onClick={confirmImport} 
                            disabled={isImporting || importPreview.filter(i => i.selected).length === 0}
                            className="px-6 py-3 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 transition-transform"
                          >
                             {isImporting && <Loader className="animate-spin" size={18} />}
                             Confirmar Importação
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
