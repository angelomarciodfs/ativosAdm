
import React, { useState } from 'react';
import { Rental, RentalStatus, Equipment, User, Event, Sector, RentalAccessories } from '../types';
import { Copy, Check, MessageCircle, AlertTriangle, Radio, Activity, Calendar, Users, AlertCircle, Package } from 'lucide-react';

interface ReportViewProps {
  rentals: Rental[];
  equipment: Equipment[];
  currentUser: User | null;
  currentEvent: Event | null;
  sectors: Sector[];
}

export const ReportView: React.FC<ReportViewProps> = ({ rentals, equipment, currentUser, currentEvent, sectors }) => {
  const [copied, setCopied] = useState(false);

  // --- FILTRO POR EVENTO ---
  const eventRentals = rentals.filter(r => r.eventId === currentEvent?.id);
  const activeRentals = eventRentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);
  const overdueRentals = eventRentals.filter(r => r.status === RentalStatus.OVERDUE);
  const partialRentals = eventRentals.filter(r => r.status === RentalStatus.PARTIAL);
  const completedRentals = eventRentals.filter(r => r.status === RentalStatus.COMPLETED);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    if (dateString.includes('T')) return new Date(dateString).toLocaleDateString('pt-BR');
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  // --- CÁLCULO DE INVENTÁRIO POR TIPO ---
  const inventoryByType = equipment.reduce((acc, eq) => {
    const category = eq.category || 'Outros';
    if (!acc[category]) {
      acc[category] = { total: 0, inUse: 0 };
    }
    acc[category].total++;
    // Verifica se esse equipamento específico está em uma locação ativa
    const isCurrentlyRented = activeRentals.some(r => r.serialNumber === eq.inventoryNumber);
    if (isCurrentlyRented) {
      acc[category].inUse++;
    }
    return acc;
  }, {} as Record<string, { total: number, inUse: number }>);

  // --- AGREGAÇÃO POR SETOR COM DETALHAMENTO DE ITENS ---
  const sectorDetails = eventRentals.reduce((acc, rental) => {
      const sectorName = rental.clientCompany || 'INDEFINIDO';
      if (!acc[sectorName]) {
          acc[sectorName] = { 
            rentals: [],
            counts: {} as Record<string, number> 
          };
      }
      acc[sectorName].rentals.push(rental);
      
      // Encontrar categoria do rádio original para contagem precisa por tipo
      const eq = equipment.find(e => e.inventoryNumber === rental.serialNumber);
      const category = eq?.category || 'Rádio';
      acc[sectorName].counts[category] = (acc[sectorName].counts[category] || 0) + 1;
      
      return acc;
  }, {} as Record<string, { rentals: Rental[], counts: Record<string, number> }>);

  const getCoordinatorName = (sectorName: string) => {
      const sector = sectors.find(s => s.name === sectorName);
      return sector?.coordinatorName || 'Não Informado';
  };

  const getMissingItemsList = (r: Rental) => {
      if (!r.accessories) return '';
      const missing: string[] = [];
      const returned = (r.returnedAccessories || {}) as Partial<RentalAccessories>;
      const labels: Record<string, string> = {
         charger: 'Carregador',
         powerBank: 'PowerBank',
         headset: 'Fone',
         antenna: 'Antena',
         clip: 'Clip'
      };
      (Object.keys(r.accessories) as Array<keyof RentalAccessories>).forEach(key => {
          if (r.accessories[key] && !returned[key]) {
              missing.push(labels[key]);
          }
      });
      return missing.join(', ');
  };

  // --- FORMATAÇÃO DA MENSAGEM WHATSAPP ---
  const generateMessage = () => {
    if (!currentEvent) return "Nenhum evento selecionado.";

    let message = `📊 *RELATÓRIO DO EVENTO: ${currentEvent.name}* 📊\n`;
    message += `📅 *Período:* ${formatDate(currentEvent.startDate)} a ${formatDate(currentEvent.endDate)}\n\n`;
    
    message += `*STATUS DO INVENTÁRIO (Geral)*\n`;
    Object.entries(inventoryByType).forEach(([category, stats]) => {
      const available = stats.total - stats.inUse;
      message += `📦 *${category}s:* ${stats.total} Total | ${available} Disp | ${stats.inUse} Uso\n`;
    });
    message += `--------------------------------\n\n`;

    message += `*MOVIMENTAÇÃO POR SETOR*\n`;
    const sortedSectors = Object.entries(sectorDetails).sort((a, b) => b[1].rentals.length - a[1].rentals.length);
    
    if (sortedSectors.length > 0) {
        sortedSectors.forEach(([name, data]) => {
            const countsStr = Object.entries(data.counts)
              .map(([cat, qty]) => `${qty} ${cat}${qty > 1 ? 's' : ''}`)
              .join(', ');
              
            message += `🏢 *${name}* (${countsStr})\n`;
            message += `   👤 Resp: ${getCoordinatorName(name)}\n`;
        });
    } else {
        message += `(Nenhuma movimentação registrada)\n`;
    }
    message += `\n`;

    if (partialRentals.length > 0) {
       message += `⚠️ *DEVOLUÇÕES PARCIAIS (Pendências)* ⚠️\n`;
       partialRentals.forEach(r => {
           const missing = getMissingItemsList(r);
           message += `🔸 *${r.clientName}* (${r.clientCompany})\n`;
           message += `   Coord: ${getCoordinatorName(r.clientCompany)}\n`;
           message += `   Falta: ${missing}\n`;
       });
       message += `\n`;
    }

    if (overdueRentals.length > 0) {
      message += `🚨 *ATENÇÃO - ATRASOS* 🚨\n`;
      overdueRentals.forEach(r => {
        message += `⛔ *${r.clientName}* (${r.clientCompany}) - ${r.serialNumber}\n`;
      });
      message += `\n`;
    } 

    if (overdueRentals.length === 0 && partialRentals.length === 0) {
        if (activeRentals.length === 0 && eventRentals.length > 0) {
             message += `✅ *Todos os equipamentos deste evento foram devolvidos.*\n\n`;
        } else if (activeRentals.length > 0) {
             message += `ℹ️ *Existem ${activeRentals.length} equipamentos em uso.*\n\n`;
        }
    }

    message += `_Sistema de Ativos ADM - Legendários_`;
    return message;
  };

  const handleCopy = () => {
    const text = generateMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentEvent) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Calendar size={48} className="mb-4 text-gray-500" />
              <p>Selecione um evento ativo nas configurações ou crie um novo para gerar relatórios.</p>
          </div>
      );
  }

  const sortedSectorsForUI = Object.entries(sectorDetails).sort((a, b) => b[1].rentals.length - a[1].rentals.length);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Relatório do Evento</h2>
          <p className="text-brand-600 mt-1 font-bold uppercase tracking-widest text-sm">{currentEvent.name}</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 uppercase font-bold">Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO: VISUALIZAÇÃO DOS INDICADORES */}
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-4">Status Geral de Locações</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                                <Radio size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Em Uso</p>
                                <p className="text-3xl font-black text-gray-900">{activeRentals.length}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold">Devolvidos</p>
                            <p className="text-2xl font-black text-gray-300">{completedRentals.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-3">Inventário Disponível</h3>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-2">
                        {Object.entries(inventoryByType).map(([cat, stats]) => (
                            <div key={cat} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1 last:border-0">
                                <span className="text-gray-600 font-bold">{cat}s</span>
                                <span className="font-mono text-brand-600 font-black">{stats.total - stats.inUse} na base</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DETALHAMENTO POR SETOR NA UI */}
            <div>
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-black mb-3 flex items-center gap-2">
                    <Users size={16} /> Detalhamento por Setor
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {sortedSectorsForUI.length > 0 ? (
                        sortedSectorsForUI.map(([sectorName, data]) => (
                            <div key={sectorName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:border-brand-300 transition-all">
                                <div className="p-4 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-brand-600 shadow-sm">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900 tracking-tighter">{sectorName}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Coord: {getCoordinatorName(sectorName)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex flex-wrap gap-1 justify-end">
                                            {Object.entries(data.counts).map(([cat, qty]) => (
                                                <span key={cat} className="bg-brand-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase">
                                                    {qty} {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Equipamentos Vinculados</p>
                                    <div className="flex flex-wrap gap-2">
                                        {data.rentals.map(r => (
                                            <div key={r.id} className="group relative bg-white border border-gray-200 px-3 py-2 rounded-lg flex flex-col hover:border-brand-500 transition-colors">
                                                <span className="text-xs font-black text-gray-800 font-mono">{r.serialNumber}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[100px]">{r.radioModel}</span>
                                                {/* Tooltip de status */}
                                                {r.status === RentalStatus.OVERDUE && (
                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl text-gray-400 italic font-medium">
                            Nenhuma movimentação registrada no evento atual.
                        </div>
                    )}
                </div>
            </div>
            
            {/* PENDÊNCIAS E ATRASOS */}
            {(partialRentals.length > 0 || overdueRentals.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {partialRentals.length > 0 && (
                         <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200">
                             <div className="flex items-center gap-2 text-orange-600 mb-3">
                                <AlertCircle size={20} />
                                <span className="font-black uppercase text-xs tracking-wider">Pendências Parciais</span>
                             </div>
                             <div className="space-y-3">
                                {partialRentals.map(r => (
                                    <div key={r.id} className="text-xs bg-white/50 p-2 rounded-lg border border-orange-100">
                                        <div className="font-black text-orange-900">{r.clientName} ({r.clientCompany})</div>
                                        <div className="text-orange-700 mt-1">Falta: <span className="font-bold">{getMissingItemsList(r)}</span></div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    {overdueRentals.length > 0 && (
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-200">
                             <div className="flex items-center gap-2 text-red-600 mb-3">
                                <AlertTriangle size={20} />
                                <span className="font-black uppercase text-xs tracking-wider">Equipamentos Atrasados</span>
                             </div>
                             <div className="space-y-3">
                                {overdueRentals.map(r => (
                                    <div key={r.id} className="text-xs bg-white/50 p-2 rounded-lg border border-red-100">
                                        <div className="font-black text-red-900">{r.clientName} ({r.clientCompany})</div>
                                        <div className="text-red-700 mt-1 font-mono">ID: {r.serialNumber}</div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* LADO DIREITO: PREVIEW WHATSAPP */}
        <div className="flex flex-col h-full">
            <h3 className="text-xs uppercase tracking-widest text-gray-500 font-black mb-3">Prévia da Mensagem (WhatsApp)</h3>
            
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 p-6 flex flex-col shadow-lg shadow-gray-200/50">
                 
                 <div className="bg-[#E7F3EF] p-5 rounded-2xl rounded-tl-none text-gray-800 text-sm font-mono whitespace-pre-line shadow-sm border border-emerald-100 relative z-10 overflow-y-auto max-h-[600px] custom-scrollbar flex-1 mb-6">
                    {generateMessage()}
                 </div>

                 <div className="shrink-0">
                     <button
                        onClick={handleCopy}
                        className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all duration-300 ${
                            copied 
                            ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]' 
                            : 'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-[#25D366]/30 active:scale-95'
                        }`}
                     >
                        {copied ? (
                            <>
                                <Check size={20} strokeWidth={3} />
                                Relatório Copiado!
                            </>
                        ) : (
                            <>
                                <MessageCircle size={20} fill="currentColor" />
                                Copiar para WhatsApp
                            </>
                        )}
                     </button>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};
