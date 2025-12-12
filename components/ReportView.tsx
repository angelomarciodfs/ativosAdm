import React, { useState } from 'react';
import { Rental, RentalStatus, Equipment, User, Event, Sector, RentalAccessories } from '../types';
import { Copy, Check, MessageCircle, AlertTriangle, Radio, Activity, Calendar, Users, AlertCircle } from 'lucide-react';

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
  // Apenas locações deste evento
  const eventRentals = rentals.filter(r => r.eventId === currentEvent?.id);
  
  const activeRentals = eventRentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);
  const overdueRentals = eventRentals.filter(r => r.status === RentalStatus.OVERDUE);
  const partialRentals = eventRentals.filter(r => r.status === RentalStatus.PARTIAL);
  const completedRentals = eventRentals.filter(r => r.status === RentalStatus.COMPLETED);

  const totalRadios = equipment.filter(e => e.category === 'Radio').length;
  // Calculando disponíveis considerando apenas o que saiu neste evento (e ainda não voltou)
  const activeRadiosInEvent = activeRentals.length;
  const availableRadios = Math.max(0, totalRadios - activeRadiosInEvent);

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

  // --- AGREGAÇÃO POR SETOR ---
  const rentalsBySector = eventRentals.reduce((acc, rental) => {
      const sectorName = rental.clientCompany || 'INDEFINIDO';
      if (!acc[sectorName]) {
          acc[sectorName] = 0;
      }
      acc[sectorName]++;
      return acc;
  }, {} as Record<string, number>);

  const getCoordinatorName = (sectorName: string) => {
      const sector = sectors.find(s => s.name === sectorName);
      return sector?.coordinatorName || 'Não Informado';
  };

  const getMissingItemsList = (r: Rental) => {
      if (!r.accessories) return '';
      const missing: string[] = [];
      const returned = r.returnedAccessories || {};
      
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
    message += `📦 Equipamentos Total: ${totalRadios}\n`;
    message += `🟢 Disponíveis na Base: ${availableRadios}\n`;
    message += `🔴 Em Uso (Neste Evento): ${activeRadiosInEvent}\n`;
    message += `--------------------------------\n\n`;

    message += `*MOVIMENTAÇÃO POR SETOR*\n`;
    const sortedSectors = Object.entries(rentalsBySector).sort((a, b) => (b[1] as number) - (a[1] as number));
    
    if (sortedSectors.length > 0) {
        sortedSectors.forEach(([name, count]) => {
            message += `🏢 *${name}* (${count} Rádios)\n`;
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
             message += `ℹ️ *Ainda existem ${activeRentals.length} equipamentos em uso.*\n\n`;
        }
    }

    message += `_Sistema RadioTrack - Legendários_`;
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

  const sortedSectorsForUI = Object.entries(rentalsBySector).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Relatório do Evento</h2>
          <p className="text-brand-600 mt-1 font-bold">{currentEvent.name}</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 uppercase">Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LADO ESQUERDO: VISUALIZAÇÃO DOS INDICADORES */}
        <div className="space-y-6">
            <div>
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-2">Status Geral</h3>
                <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
                            <Radio size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Em Uso (Ativo)</p>
                            <p className="text-2xl font-bold text-gray-900">{activeRadiosInEvent}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Devolvidos</p>
                        <p className="text-xl font-bold text-gray-400">{completedRentals.length}</p>
                    </div>
                </div>
            </div>

            {/* Nova Seção: Detalhamento por Setor na UI */}
            <div>
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-2">Detalhamento por Setor</h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {sortedSectorsForUI.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {sortedSectorsForUI.map(([sectorName, count]) => (
                                <div key={sectorName} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Users size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{sectorName}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                                Coord: {getCoordinatorName(sectorName)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded">
                                            {count} un.
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Nenhuma movimentação registrada.
                        </div>
                    )}
                </div>
            </div>
            
            {partialRentals.length > 0 && (
                 <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mt-4">
                     <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <AlertCircle size={20} />
                        <span className="font-bold">Devoluções Parciais</span>
                     </div>
                     <p className="text-sm text-orange-800 mb-2">
                         Existem <strong>{partialRentals.length}</strong> locações com itens faltantes.
                     </p>
                     <div className="text-xs text-orange-700 space-y-1 pl-1">
                        {partialRentals.slice(0, 3).map(r => (
                            <div key={r.id}>• {r.clientName} (Falta: {getMissingItemsList(r)})</div>
                        ))}
                        {partialRentals.length > 3 && <div>... e mais {partialRentals.length - 3}</div>}
                     </div>
                </div>
            )}

            {overdueRentals.length > 0 ? (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200 mt-4">
                     <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle size={20} />
                        <span className="font-bold">Atenção Necessária</span>
                     </div>
                     <p className="text-sm text-red-800">
                         Existem <strong>{overdueRentals.length}</strong> equipamentos com devolução atrasada.
                     </p>
                </div>
            ) : null}
        </div>

        {/* LADO DIREITO: PREVIEW E AÇÃO */}
        <div className="flex flex-col h-full">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-2">Prévia da Mensagem (WhatsApp)</h3>
            
            <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 p-4 relative overflow-hidden flex flex-col shadow-inner">
                 
                 <div className="bg-white p-4 rounded-lg rounded-tl-none text-gray-800 text-sm font-mono whitespace-pre-line shadow-sm border border-gray-200 relative z-10 overflow-y-auto max-h-[500px] custom-scrollbar">
                    {generateMessage()}
                 </div>

                 <div className="mt-4 pt-4 border-t border-gray-200 relative z-10">
                     <button
                        onClick={handleCopy}
                        className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                            copied 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]' 
                            : 'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/30'
                        }`}
                     >
                        {copied ? (
                            <>
                                <Check size={20} />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <MessageCircle size={20} />
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