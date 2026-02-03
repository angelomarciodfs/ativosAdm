
import React, { useState } from 'react';
import { Rental, RentalStatus, RentalAccessories } from '../types';
import { CheckCircle, AlertCircle, Clock, Search, RotateCcw, User, Phone, X, CheckSquare, Square, AlertTriangle, Printer } from 'lucide-react';
import { SYSTEM_LOGO } from '../constants';

interface RentalListProps {
  rentals: Rental[];
  onReturn: (id: string, returnedItems: RentalAccessories) => void;
  filter: 'active' | 'history';
}

export const RentalList: React.FC<RentalListProps> = ({ rentals, onReturn, filter }) => {
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showReprintModal, setShowReprintModal] = useState(false);
  
  const [checklist, setChecklist] = useState<RentalAccessories>({
    charger: false,
    powerBank: false,
    headset: false,
    antenna: false,
    clip: false
  });

  const filteredRentals = rentals
    .filter(r => {
        if (filter === 'active') return r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL;
        return r.status === RentalStatus.COMPLETED;
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.ACTIVE: return 'bg-blue-50 text-blue-700 border-blue-200';
      case RentalStatus.OVERDUE: return 'bg-red-50 text-red-700 border-red-200';
      case RentalStatus.PARTIAL: return 'bg-orange-50 text-orange-700 border-orange-200';
      case RentalStatus.COMPLETED: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.ACTIVE: return <Clock size={14} className="mr-1.5" />;
      case RentalStatus.OVERDUE: return <AlertCircle size={14} className="mr-1.5" />;
      case RentalStatus.PARTIAL: return <AlertTriangle size={14} className="mr-1.5" />;
      case RentalStatus.COMPLETED: return <CheckCircle size={14} className="mr-1.5" />;
      default: return null;
    }
  };

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

  const handleOpenReturnModal = (rental: Rental) => {
    setSelectedRental(rental);
    setChecklist(rental.returnedAccessories || {
        charger: false,
        powerBank: false,
        headset: false,
        antenna: false,
        clip: false
    });
    setReturnModalOpen(true);
  };

  const handleOpenReprintModal = (rental: Rental) => {
    setSelectedRental(rental);
    setShowReprintModal(true);
  };

  const toggleChecklistItem = (key: keyof RentalAccessories) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmReturn = () => {
    if (selectedRental) {
        onReturn(selectedRental.id, checklist);
        setReturnModalOpen(false);
        setSelectedRental(null);
    }
  };

  const isChecklistComplete = () => {
      if (!selectedRental) return false;
      const required = selectedRental.accessories;
      if (!required) return true; 

      if (required.antenna && !checklist.antenna) return false;
      if (required.clip && !checklist.clip) return false;
      if (required.charger && !checklist.charger) return false;
      if (required.headset && !checklist.headset) return false;
      if (required.powerBank && !checklist.powerBank) return false;

      return true;
  };

  return (
    <>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
             {filter === 'active' ? 'Em Andamento' : 'Histórico'}
             <span className="bg-gray-100 text-xs px-2 py-0.5 rounded-full text-gray-500 border border-gray-200">{filteredRentals.length}</span>
           </h3>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 w-full md:w-64 transition-all"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-bold">ID / Serial</th>
              <th className="p-4 font-bold">Equipamento</th>
              <th className="p-4 font-bold">Responsável</th>
              <th className="p-4 font-bold">Vigência</th>
              <th className="p-4 font-bold">Status</th>
              {filter === 'active' && <th className="p-4 font-bold text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRentals.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filteredRentals.map((rental) => (
                <tr key={rental.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="font-mono text-brand-600 font-black text-sm">{rental.id.split('-').slice(1).join('-')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{rental.serialNumber}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">{rental.radioModel}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">{rental.clientName}</div>
                    <div className="text-xs text-gray-500">{rental.clientCompany}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center text-gray-500">
                            <span className="w-10 text-xs uppercase font-semibold">Saiu</span>
                            <span className="text-gray-900">{formatDate(rental.startDate)}</span>
                        </div>
                        <div className={`flex items-center ${rental.status === RentalStatus.OVERDUE ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                            <span className="w-10 text-xs uppercase font-semibold">{filter === 'active' ? 'Prev' : 'Voltou'}</span>
                            <span className={rental.status === RentalStatus.OVERDUE ? 'text-red-600' : 'text-gray-900'}>{formatDate(filter === 'active' ? rental.expectedReturnDate : (rental.actualReturnDate || ''))}</span>
                        </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColor(rental.status)}`}>
                      {getStatusIcon(rental.status)}
                      {rental.status}
                    </span>
                  </td>
                  {filter === 'active' && (
                    <td className="p-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                            <button 
                                onClick={() => handleOpenReprintModal(rental)}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Reimprimir Recibo"
                            >
                                <Printer size={18} />
                            </button>
                            <button 
                                onClick={() => handleOpenReturnModal(rental)}
                                className="bg-white hover:bg-brand-500 hover:text-white text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 border border-gray-200 hover:border-brand-500 shadow-sm"
                            >
                                <RotateCcw size={14} />
                                {rental.status === RentalStatus.PARTIAL ? 'Continuar' : 'Baixar'}
                            </button>
                        </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* REPRINT MODAL */}
    {showReprintModal && selectedRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200 relative">
                <button onClick={() => setShowReprintModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 no-print">
                    <X size={24} />
                </button>
                <div className="text-center mb-6 no-print">
                    <Printer size={32} className="mx-auto text-gray-400 mb-2" />
                    <h3 className="text-xl font-bold">Reimprimir Recibo</h3>
                </div>

                <div id="receipt-print-area" className="bg-gray-50 p-4 font-mono text-xs text-black mb-6">
                    <div className="text-center mb-2">
                        <img src={SYSTEM_LOGO} alt="Logo" className="h-8 mx-auto mb-2 grayscale" />
                        <p className="font-bold text-sm uppercase">RECIBO DE ENTREGA</p>
                        <p>--------------------------------</p>
                    </div>
                    <div className="space-y-1 mb-4">
                        <p><strong>LOCAÇÃO:</strong> {selectedRental.id.split('-').pop()}</p>
                        <p><strong>RESP:</strong> {selectedRental.clientName}</p>
                        <p><strong>FONE:</strong> {selectedRental.clientPhone}</p>
                        <p><strong>SETOR:</strong> {selectedRental.clientCompany}</p>
                        <p><strong>SAIDA:</strong> {formatDate(selectedRental.startDate)}</p>
                        <p><strong>VOLTA:</strong> {formatDate(selectedRental.expectedReturnDate)}</p>
                    </div>
                    <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
                        <p><strong>EQUIPAMENTO:</strong></p>
                        <p>• {selectedRental.radioModel}</p>
                        <p className="pl-3 text-[10px]">Patrimônio: {selectedRental.serialNumber}</p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-dashed border-gray-400 text-center">
                        <p>________________________________</p>
                        <p className="mt-1 font-bold uppercase">{selectedRental.clientName}</p>
                        <p className="text-[9px]">Assinatura do Requerente</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 no-print">
                    <button 
                        onClick={() => window.print()}
                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
                    >
                        <Printer size={20} /> Confirmar Impressão
                    </button>
                    <button 
                        onClick={() => setShowReprintModal(false)}
                        className="w-full py-4 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    )}

    {/* RETURN MODAL */}
    {returnModalOpen && selectedRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Devolução</h3>
                        <p className="text-sm text-gray-500">{selectedRental.radioModel} - {selectedRental.clientName}</p>
                    </div>
                    <button onClick={() => setReturnModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <div>
                            <span className="font-bold">Confira os itens.</span> Itens desmarcados ficarão como pendentes e a locação ficará com status PARCIAL.
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs uppercase text-gray-500 font-bold mb-2">Checklist de Itens Retornados</p>
                        
                        {selectedRental.accessories ? Object.entries(selectedRental.accessories).map(([key, required]) => {
                             if (!required) return null; 
                             
                             const labels: Record<string, string> = {
                                 charger: 'Carregador',
                                 powerBank: 'Power Bank',
                                 headset: 'Fone',
                                 antenna: 'Antena',
                                 clip: 'Clip'
                             };
                             const isChecked = checklist[key as keyof RentalAccessories];

                             return (
                                <button
                                    key={key}
                                    onClick={() => toggleChecklistItem(key as keyof RentalAccessories)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isChecked ? 'bg-emerald-50 border-emerald-500/50 text-emerald-700 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <span className="font-medium">{labels[key]}</span>
                                    {isChecked ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} />}
                                </button>
                             );
                        }) : (
                            <p className="text-sm text-gray-500 italic">Nenhum acessório registrado.</p>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0">
                     <button 
                        onClick={() => setReturnModalOpen(false)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirmReturn}
                        className={`flex-1 py-3 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${isChecklistComplete() ? 'bg-brand-500 hover:bg-brand-400 shadow-brand-500/30' : 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/30'}`}
                    >
                        <RotateCcw size={18} />
                        {isChecklistComplete() ? 'Baixar Completo' : 'Baixar Parcial'}
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};
