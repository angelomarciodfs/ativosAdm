
import React, { useState, useEffect, useCallback } from 'react';
import { MerchandiseItem, Legendario, ImportPreviewData, User } from '../types';
import { api } from '../services/database';
import { Search, Upload, CheckCircle, Circle, AlertTriangle, X, Check, Loader, FileSpreadsheet } from 'lucide-react';
// @ts-ignore
import readXlsxFile from 'read-excel-file';

interface PinsPatchesViewProps {
  currentUser: User | null;
}

export const PinsPatchesView: React.FC<PinsPatchesViewProps> = ({ currentUser }) => {
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [legendarios, setLegendarios] = useState<Legendario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewData[]>([]);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleToggleDelivery = async (legendario: Legendario, item: MerchandiseItem) => {
    if (!currentUser) return;
    const isDelivered = !!legendario.deliveries?.[item.id];

    try {
        if (isDelivered) {
            // Lógica de Cancelamento (Undo)
            await api.undoDelivery(legendario.id, item.id);
            
            // Atualização Otimista: Remove a entrega e devolve estoque
            setLegendarios(prev => prev.map(l => {
                if (l.id === legendario.id) {
                    const newDeliveries = { ...l.deliveries };
                    delete newDeliveries[item.id];
                    return { ...l, deliveries: newDeliveries };
                }
                return l;
            }));
            
            setMerchandise(prev => prev.map(m => {
                if (m.id === item.id) return { ...m, currentStock: m.currentStock + 1 };
                return m;
            }));

        } else {
            // Lógica de Entrega
            await api.deliverItem(legendario.id, item.id, currentUser.id);
            
            // Atualização Otimista: Adiciona entrega e baixa estoque
            const now = new Date().toISOString();
            setLegendarios(prev => prev.map(l => {
                if (l.id === legendario.id) {
                    return {
                        ...l,
                        deliveries: { ...l.deliveries, [item.id]: now }
                    };
                }
                return l;
            }));

            setMerchandise(prev => prev.map(m => {
                if (m.id === item.id) return { ...m, currentStock: m.currentStock - 1 };
                return m;
            }));
        }
    } catch (error: any) {
        alert(error.message || "Erro ao processar a ação.");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Pins & Patches</h2>
          <p className="text-gray-500 mt-1 text-sm font-medium uppercase tracking-wider">Gestão de entregas e estoque de materiais.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <label className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-3 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 cursor-pointer transition-all active:scale-95">
                <Upload size={18} /> Importar (CSV / XLSX)
                <input type="file" accept=".csv, .xlsx" className="hidden" onChange={handleFileUpload} />
            </label>
        </div>
      </div>

      {/* SEARCH & STOCK SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 shrink-0">
          <div className="lg:col-span-2 relative">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <input 
                type="text" 
                placeholder="Pesquisar por Nome, CPF ou Nº Legendário..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          {/* Stock List - Improved scrolling and spacing */}
          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 overflow-x-auto custom-scrollbar min-h-[90px]">
              {merchandise.length === 0 ? (
                  <div className="text-xs text-gray-400 w-full text-center">Nenhum item de estoque.</div>
              ) : (
                  merchandise.map(item => (
                      <div key={item.id} className="min-w-[90px] flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                          <span className="text-[10px] uppercase font-bold text-gray-400 text-center leading-tight h-6 overflow-hidden flex items-center">{item.name}</span>
                          <span className={`text-xl font-black ${item.currentStock < item.minThreshold ? 'text-red-500' : 'text-gray-800'}`}>
                              {item.currentStock}
                          </span>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* RESULTS LIST */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-0">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resultados da Busca</span>
             <span className="text-xs font-bold text-gray-400">
                {loading ? 'Carregando...' : `${legendarios.length} encontrados`}
             </span>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
             {legendarios.length === 0 && !loading ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 min-h-[200px]">
                     <Search size={48} className="mb-4" />
                     <p className="font-medium text-center px-4">Nenhum legendário encontrado.</p>
                 </div>
             ) : (
                 <div className="space-y-2">
                     {legendarios.map(leg => (
                         <div key={leg.id} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 hover:border-brand-200 hover:shadow-md transition-all">
                             {/* Informações do Legendário */}
                             <div className="flex-1 min-w-0 text-center md:text-left w-full md:w-auto">
                                 <h4 className="text-lg font-bold text-gray-900 truncate">{leg.name}</h4>
                                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                     <span className="font-mono bg-gray-100 px-1.5 rounded text-xs text-gray-600 font-bold">{leg.cpf}</span>
                                     <span className="truncate max-w-[200px]">{leg.email}</span>
                                     {leg.registrationNumber && <span className="text-brand-600 font-bold">#{leg.registrationNumber}</span>}
                                 </div>
                             </div>
                             
                             {/* Botões de Entrega (Flags) - Alinhados à direita */}
                             <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end w-full md:w-auto">
                                 {merchandise.map(item => {
                                     const isDelivered = !!leg.deliveries?.[item.id];
                                     const deliveryDate = isDelivered ? new Date(leg.deliveries![item.id]).toLocaleString('pt-BR') : '';

                                     return (
                                         <button
                                            key={item.id}
                                            onClick={() => handleToggleDelivery(leg, item)}
                                            // Desabilitado apenas se não estiver entregue E não tiver estoque. Se já estiver entregue, permite clicar para desfazer.
                                            disabled={!isDelivered && item.currentStock <= 0}
                                            title={isDelivered ? `Entregue em: ${deliveryDate} (Clique para desfazer)` : (item.currentStock <= 0 ? 'Sem Estoque' : `Entregar ${item.name}`)}
                                            className={`
                                                relative group flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200
                                                w-14 h-14 md:w-16 md:h-16
                                                ${isDelivered 
                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 hover:bg-red-50 hover:border-red-500 hover:text-red-500' // Hover vermelho para indicar cancelamento
                                                    : (item.currentStock <= 0 
                                                        ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                                                        : 'bg-white border-gray-200 text-gray-400 hover:border-brand-500 hover:text-brand-500 hover:shadow-lg hover:scale-105 active:scale-95')
                                                }
                                            `}
                                         >
                                             {isDelivered ? <CheckCircle size={20} className="mb-1 group-hover:hidden" /> : <Circle size={20} className="mb-1" />}
                                             {/* Ícone de X aparece no hover quando já está entregue */}
                                             {isDelivered && <X size={20} className="mb-1 hidden group-hover:block" />}
                                             
                                             <span className="text-[8px] md:text-[9px] font-bold text-center leading-tight px-0.5 line-clamp-2 uppercase tracking-tight">{item.name}</span>
                                             
                                             {/* Tooltip for Date */}
                                             {isDelivered && (
                                                 <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                                                     {deliveryDate}
                                                 </div>
                                             )}
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

      {/* IMPORT MODAL */}
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
