import React, { useState } from 'react';
import { Rental, Equipment, Sector } from '../types';
import { Save, X, Phone, Plug, Battery, Headphones, Signal, Paperclip, Search, CheckSquare, Square } from 'lucide-react';

interface RentalFormProps {
  onCancel: () => void;
  onSubmit: (rental: Omit<Rental, 'id' | 'status'>) => void;
  availableEquipment: Equipment[];
  sectors: Sector[];
  activeEventId: string;
}

export const RentalForm: React.FC<RentalFormProps> = ({ onCancel, onSubmit, availableEquipment, sectors, activeEventId }) => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const todayString = today.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientCompany: '',
    selectedEquipmentIds: [] as string[], // Changed to array for multiple selection
    startDate: todayString,
    expectedReturnDate: '',
    notes: ''
  });

  const [equipmentSearch, setEquipmentSearch] = useState('');

  const [accessories, setAccessories] = useState({
    charger: false,
    powerBank: false,
    headset: false,
    antenna: true,
    clip: true
  });

  // Toggle selection for multiple equipment
  const toggleEquipmentSelection = (eqId: string) => {
    setFormData(prev => {
      const currentIds = prev.selectedEquipmentIds;
      if (currentIds.includes(eqId)) {
        return { ...prev, selectedEquipmentIds: currentIds.filter(id => id !== eqId) };
      } else {
        return { ...prev, selectedEquipmentIds: [...currentIds, eqId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventId) {
        alert("Erro: Nenhum evento ativo selecionado.");
        return;
    }
    
    // Iterate over all selected IDs and submit individual rentals
    formData.selectedEquipmentIds.forEach(eqId => {
        const eq = availableEquipment.find(item => item.id === eqId);
        if (eq) {
            onSubmit({
              eventId: activeEventId,
              clientName: formData.clientName,
              clientPhone: formData.clientPhone,
              clientCompany: formData.clientCompany,
              radioModel: `${eq.brand} ${eq.model}`,
              serialNumber: eq.inventoryNumber || eq.id,
              startDate: formData.startDate,
              expectedReturnDate: formData.expectedReturnDate,
              notes: formData.notes,
              accessories: accessories
            });
        }
    });
  };

  const toggleAccessory = (key: keyof typeof accessories) => {
    setAccessories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter available equipment for the list
  const filteredEquipment = availableEquipment.filter(eq => 
    eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.inventoryNumber.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.model.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-8 max-w-3xl mx-auto shadow-xl animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nova Saída</h2>
          <p className="text-gray-500 text-sm mt-1">Registre locações para o evento ativo.</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Info */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Responsável</label>
            <input
              required
              type="text"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-400"
              placeholder="Ex: João Silva"
              value={formData.clientName}
              onChange={e => setFormData({ ...formData, clientName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Telefone</label>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  required
                  type="tel"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-400"
                  placeholder="(00) 00000-0000"
                  value={formData.clientPhone}
                  onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Setor / Departamento</label>
            <select
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              value={formData.clientCompany}
              onChange={e => setFormData({ ...formData, clientCompany: e.target.value })}
            >
              <option value="">-- Selecione o Setor --</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.name}>{sector.name}</option>
              ))}
            </select>
          </div>

          {/* Equipment Multi-Select */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold flex justify-between">
                <span>Selecionar Equipamentos</span>
                <span className="text-brand-600">{formData.selectedEquipmentIds.length} selecionado(s)</span>
            </label>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <Search size={16} className="text-gray-400 ml-1" />
                    <input 
                        type="text" 
                        placeholder="Filtrar por ID, nome ou modelo..." 
                        className="bg-transparent text-sm w-full focus:outline-none text-gray-700 placeholder-gray-400"
                        value={equipmentSearch}
                        onChange={(e) => setEquipmentSearch(e.target.value)}
                    />
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredEquipment.length > 0 ? (
                        filteredEquipment.map(eq => {
                            const isSelected = formData.selectedEquipmentIds.includes(eq.id);
                            return (
                                <div 
                                    key={eq.id}
                                    onClick={() => toggleEquipmentSelection(eq.id)}
                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors border ${
                                        isSelected 
                                        ? 'bg-brand-50 border-brand-200' 
                                        : 'bg-white border-transparent hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold font-mono ${isSelected ? 'text-brand-700' : 'text-gray-700'}`}>
                                            {eq.inventoryNumber || 'S/N'}
                                        </span>
                                        <span className="text-xs text-gray-500">{eq.name} - {eq.model}</span>
                                    </div>
                                    <div className={isSelected ? 'text-brand-500' : 'text-gray-300'}>
                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-4 text-center text-xs text-gray-400">Nenhum equipamento disponível encontrado.</div>
                    )}
                </div>
            </div>
            <p className="text-[10px] text-gray-400">Clique nos itens para selecionar. Você pode marcar múltiplos equipamentos para o mesmo responsável.</p>
          </div>

          {/* ACCESSORIES CHECKLIST */}
          <div className="md:col-span-2 p-5 bg-gray-50/50 rounded-xl border border-gray-200">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 block">Acessórios Inclusos (Padrão para todos)</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
               {[
                   { id: 'antenna', label: 'Antena', icon: Signal },
                   { id: 'clip', label: 'Clip', icon: Paperclip },
                   { id: 'charger', label: 'Carregador', icon: Plug },
                   { id: 'headset', label: 'Fone', icon: Headphones },
                   { id: 'powerBank', label: 'Power Bank', icon: Battery }
               ].map((item) => {
                   const isChecked = accessories[item.id as keyof typeof accessories];
                   const Icon = item.icon;
                   return (
                       <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleAccessory(item.id as keyof typeof accessories)}
                          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 shadow-sm ${
                              isChecked 
                              ? 'bg-brand-500 border-brand-600 text-white shadow-brand-500/30 transform scale-105' 
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                       >
                          <Icon size={20} />
                          <span className="text-xs font-bold">{item.label}</span>
                       </button>
                   );
               })}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Data Saída</label>
            <input
              required
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Previsão Devolução</label>
            <input
              required
              type="date"
              min={formData.startDate}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              value={formData.expectedReturnDate}
              onChange={e => setFormData({ ...formData, expectedReturnDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
           <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Observações</label>
           <textarea
             className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 h-20 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-gray-400"
             placeholder="Detalhes adicionais..."
             value={formData.notes}
             onChange={e => setFormData({ ...formData, notes: e.target.value })}
           />
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="flex-1 px-6 py-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold">Cancelar</button>
          <button 
            type="submit" 
            disabled={formData.selectedEquipmentIds.length === 0} 
            className="flex-1 px-6 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 font-bold flex justify-center items-center gap-2 shadow-lg shadow-brand-500/30"
          >
            <Save size={18} /> 
            {formData.selectedEquipmentIds.length > 1 
                ? `Confirmar Saída (${formData.selectedEquipmentIds.length})` 
                : 'Confirmar Saída'}
          </button>
        </div>
      </form>
    </div>
  );
};