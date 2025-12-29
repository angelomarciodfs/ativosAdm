
import React, { useState } from 'react';
import { Equipment, Sector, User, UserRole, Event, EquipmentItem } from '../types';
import { Plus, Search, Trash2, Save, Users, Package, Pencil, Shield, Calendar, Clock, UserCheck, Key } from 'lucide-react';

interface ConfigurationViewProps {
  equipmentList: Equipment[];
  onAddEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  onUpdateEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
  itemList: EquipmentItem[];
  onAddItem: (name: string) => void;
  onUpdateItem: (id: string, name: string) => void;
  onDeleteItem: (id: string) => void;
  sectorList: Sector[];
  onAddSector: (sector: Omit<Sector, 'id'>) => void;
  onUpdateSector: (sector: Sector) => void;
  onDeleteSector: (id: string) => void;
  userList: User[];
  onAddUser: (user: Omit<User, 'id' | 'avatarInitials'> & { password?: string }) => void;
  onUpdateUser: (user: User & { password?: string }) => void;
  onDeleteUser: (id: string) => void;
  eventList: Event[];
  onAddEvent: (event: Omit<Event, 'id'>) => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  activeTab: 'events' | 'inventory' | 'sectors' | 'users';
  setActiveTab: (tab: any) => void;
  inventorySubTab: 'ativos' | 'itens';
  setInventorySubTab: (tab: any) => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  equipmentList, onAddEquipment, onUpdateEquipment, onDeleteEquipment,
  itemList, onAddItem, onUpdateItem, onDeleteItem,
  sectorList, onAddSector, onUpdateSector, onDeleteSector,
  userList, onAddUser, onUpdateUser, onDeleteUser,
  eventList, onAddEvent, onUpdateEvent, onDeleteEvent,
  activeTab, setActiveTab, inventorySubTab, setInventorySubTab
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [eqFormData, setEqFormData] = useState({ inventoryNumber: '', brand: '', model: '', category: '' });
  const [itemFormData, setItemFormData] = useState({ name: '' });
  const [sectorFormData, setSectorFormData] = useState({ name: '', coordinatorName: '', coordinatorPhone: '' });
  const [userFormData, setUserFormData] = useState({ name: '', preferredName: '', email: '', phone: '', role: 'USER' as UserRole, password: '' });
  const [eventFormData, setEventFormData] = useState({ name: '', startDate: '', endDate: '', isActive: true });

  const resetForms = () => {
    setEqFormData({ inventoryNumber: '', brand: '', model: '', category: '' });
    setItemFormData({ name: '' });
    setSectorFormData({ name: '', coordinatorName: '', coordinatorPhone: '' });
    setUserFormData({ name: '', preferredName: '', email: '', phone: '', role: 'USER', password: '' });
    setEventFormData({ name: '', startDate: '', endDate: '', isActive: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'inventory' && inventorySubTab === 'itens') {
        if (editingId) onUpdateItem(editingId, itemFormData.name);
        else onAddItem(itemFormData.name);
    } else if (activeTab === 'inventory' && inventorySubTab === 'ativos') {
        const finalData = { ...eqFormData, name: eqFormData.inventoryNumber };
        if (editingId) {
            const original = equipmentList.find(item => item.id === editingId);
            onUpdateEquipment({ id: editingId, ...finalData, createdAt: original?.createdAt || new Date().toISOString().split('T')[0] });
        } else {
            onAddEquipment({ ...finalData, createdAt: new Date().toISOString().split('T')[0] });
        }
    } else if (activeTab === 'sectors') {
        if (editingId) onUpdateSector({ id: editingId, ...sectorFormData });
        else onAddSector(sectorFormData);
    } else if (activeTab === 'users') {
        if (editingId) onUpdateUser({ id: editingId, ...userFormData, avatarInitials: userFormData.name.substring(0, 2).toUpperCase() });
        else onAddUser(userFormData);
    } else if (activeTab === 'events') {
        if (editingId) onUpdateEvent({ id: editingId, ...eventFormData });
        else onAddEvent(eventFormData);
    }
    resetForms();
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'events') return eventList.filter(e => e.name.toLowerCase().includes(term));
    if (activeTab === 'sectors') return sectorList.filter(s => s.name.toLowerCase().includes(term));
    if (activeTab === 'users') return userList.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    if (activeTab === 'inventory') {
        if (inventorySubTab === 'ativos') return equipmentList.filter(eq => eq.inventoryNumber.toLowerCase().includes(term));
        return itemList.filter(c => c.name.toLowerCase().includes(term));
    }
    return [];
  };

  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const resolveCreatorName = (userIdOrName?: string) => {
      if (!userIdOrName) return 'Sistema';
      const user = userList.find(u => u.id === userIdOrName);
      return user ? user.name : userIdOrName;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Configurações</h2>
          <p className="text-gray-500 mt-1 text-sm font-medium uppercase tracking-wider">Controle central de ativos e acessos.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); if(isAdding) resetForms(); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg w-full md:w-auto justify-center ${
            isAdding ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50' : 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/20'
          }`}
        >
          {isAdding ? 'Cancelar' : <><Plus size={18} /> Novo Registro</>}
        </button>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar bg-white rounded-t-xl px-2">
        {[
            { id: 'events', label: 'Eventos', icon: Calendar },
            { id: 'inventory', label: 'Inventário', icon: Package },
            { id: 'sectors', label: 'Setores', icon: Users },
            { id: 'users', label: 'Usuários', icon: Shield }
        ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); resetForms(); }} 
              className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'border-brand-500 text-brand-600 bg-brand-50/20' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
                <tab.icon size={18} /> {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-lg w-fit shadow-inner">
              <button 
                onClick={() => { setInventorySubTab('ativos'); if(isAdding) resetForms(); }}
                className={`px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'ativos' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Ativos Físicos
              </button>
              <button 
                onClick={() => { setInventorySubTab('itens'); if(isAdding) resetForms(); }}
                className={`px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'itens' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Gerenciar ITENS
              </button>
          </div>
      )}

      {isAdding && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3 uppercase tracking-tighter">
                <Plus size={20} className="text-brand-500" /> 
                {editingId ? 'Editar' : 'Novo'} {activeTab === 'inventory' ? (inventorySubTab === 'ativos' ? 'Ativo' : 'ITEM') : activeTab.slice(0, -1).toUpperCase()}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'events' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Nome do Evento</label>
                            <input required type="text" placeholder="Ex: TOP 1109 - Ed. 55" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eventFormData.name} onChange={e => setEventFormData({...eventFormData, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Data Início</label>
                            <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eventFormData.startDate} onChange={e => setEventFormData({...eventFormData, startDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Data Fim</label>
                            <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eventFormData.endDate} onChange={e => setEventFormData({...eventFormData, endDate: e.target.value})} />
                        </div>
                        <div className="flex items-center gap-2 py-2">
                            <input type="checkbox" id="isActive" checked={eventFormData.isActive} onChange={e => setEventFormData({...eventFormData, isActive: e.target.checked})} className="w-5 h-5 accent-brand-500 rounded" />
                            <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Evento Ativo Atualmente</label>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && inventorySubTab === 'ativos' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold flex justify-between items-center mb-1">
                                ITEM
                                <button type="button" onClick={() => { setInventorySubTab('itens'); setIsAdding(true); setEditingId(null); }} className="text-brand-600 hover:text-brand-700 text-[9px] font-black border border-brand-200 px-1.5 rounded bg-brand-50 uppercase">NOVO ITEM +</button>
                            </label>
                            <select required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eqFormData.category} onChange={e => setEqFormData({...eqFormData, category: e.target.value})}>
                                <option value="">Selecione...</option>
                                {itemList.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-brand-600 font-bold">Patrimônio / ID</label>
                            <input required type="text" placeholder="Ex: R-01" className="w-full bg-gray-50 border border-brand-200 rounded-lg p-3 font-mono font-bold" value={eqFormData.inventoryNumber} onChange={e => setEqFormData({...eqFormData, inventoryNumber: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Marca</label>
                            <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eqFormData.brand} onChange={e => setEqFormData({...eqFormData, brand: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Modelo</label>
                            <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eqFormData.model} onChange={e => setEqFormData({...eqFormData, model: e.target.value})} />
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && inventorySubTab === 'itens' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Nome do ITEM (Ex: Lanterna, Rádio)</label>
                            <input required type="text" placeholder="Digite o nome..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-bold" value={itemFormData.name} onChange={e => setItemFormData({name: e.target.value})} />
                        </div>
                    </div>
                )}

                {activeTab === 'sectors' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Sigla do Setor</label>
                            <input required type="text" placeholder="Ex: ADM" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-bold uppercase" value={sectorFormData.name} onChange={e => setSectorFormData({...sectorFormData, name: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Coordenador</label>
                            <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={sectorFormData.coordinatorName} onChange={e => setSectorFormData({...sectorFormData, coordinatorName: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">WhatsApp</label>
                            <input type="tel" placeholder="(00) 00000-0000" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={sectorFormData.coordinatorPhone} onChange={e => setSectorFormData({...sectorFormData, coordinatorPhone: e.target.value})} />
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Nome Completo</label>
                            <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Email</label>
                            <input required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} disabled={!!editingId} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">{editingId ? 'Nova Senha (deixe vazio para não alterar)' : 'Senha Inicial'}</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="password" 
                                    placeholder="Mínimo 6 caracteres" 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10" 
                                    value={userFormData.password} 
                                    onChange={e => setUserFormData({...userFormData, password: e.target.value})} 
                                    required={!editingId}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Perfil</label>
                            <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}>
                                <option value="USER">Operador (Apenas Locações)</option>
                                <option value="ADMIN">Administrador (Total)</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button type="button" onClick={resetForms} className="flex-1 py-3 border border-gray-200 text-gray-600 font-black rounded-lg hover:bg-gray-50 transition-colors uppercase text-[10px] tracking-widest">Descartar</button>
                    <button type="submit" className="flex-1 py-3 bg-brand-500 text-white font-black rounded-lg hover:bg-brand-600 shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
                        <Save size={18} /> Salvar Registro
                    </button>
                </div>
            </form>
          </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <h3 className="text-lg font-black text-gray-900 tracking-tight">Listagem Sincronizada</h3>
             <span className="bg-gray-100 text-[10px] font-black text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-tighter">
                {filteredData().length} Total
             </span>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Filtrar nesta lista..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:ring-1 focus:ring-brand-500 focus:outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-black">
                        <th className="p-4">{activeTab === 'inventory' && inventorySubTab === 'itens' ? 'Nome do ITEM' : 'Patrimônio / ID'}</th>
                        <th className="p-4">{activeTab === 'inventory' && inventorySubTab === 'itens' ? 'Data de Criação' : 'NOME / INFO'}</th>
                        <th className="p-4">{activeTab === 'inventory' && inventorySubTab === 'itens' ? 'Criado por' : 'Status / Vínculo'}</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredData().length === 0 ? (
                        <tr><td colSpan={4} className="p-16 text-center text-gray-400 italic font-medium">Nenhum registro encontrado.</td></tr>
                    ) : (
                        filteredData().map((item: any) => (
                            <tr key={item.id} className="hover:bg-brand-50/20 transition-colors group">
                                <td className="p-4">
                                    {activeTab === 'events' && <div className="font-bold text-gray-900">{item.name}</div>}
                                    {activeTab === 'inventory' && inventorySubTab === 'ativos' && (
                                        <span className="font-mono text-brand-600 font-black text-sm">{item.inventoryNumber}</span>
                                    )}
                                    {activeTab === 'inventory' && inventorySubTab === 'itens' && <span className="font-bold text-gray-900">{item.name}</span>}
                                    {activeTab === 'sectors' && <div className="font-black text-gray-900 tracking-tighter">{item.name}</div>}
                                    {activeTab === 'users' && <div className="font-bold text-gray-900 text-sm">{item.name}</div>}
                                </td>
                                <td className="p-4 text-sm">
                                    {activeTab === 'events' && <div className="text-gray-600 font-medium">{formatDate(item.startDate)} - {formatDate(item.endDate)}</div>}
                                    {activeTab === 'inventory' && inventorySubTab === 'ativos' && <div className="text-xs text-gray-500 uppercase font-bold">{item.category} | {item.brand} {item.model}</div>}
                                    {activeTab === 'inventory' && inventorySubTab === 'itens' && <div className="text-gray-500 font-mono text-xs"><Clock size={12} className="inline mr-1"/> {formatDate(item.createdAt)}</div>}
                                    {activeTab === 'sectors' && <div className="text-xs text-gray-500">{item.coordinatorName || '-'}</div>}
                                    {activeTab === 'users' && <div className="text-xs font-black text-brand-600 uppercase">{item.role}</div>}
                                </td>
                                <td className="p-4">
                                    {activeTab === 'events' && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${item.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                            {item.isActive ? 'Ativo' : 'Finalizado'}
                                        </span>
                                    )}
                                    {activeTab === 'inventory' && inventorySubTab === 'ativos' && <div className="text-[10px] text-gray-400 italic">Cad. em {formatDate(item.createdAt)}</div>}
                                    {activeTab === 'inventory' && inventorySubTab === 'itens' && (
                                        <div className="flex items-center gap-2 text-gray-700 font-bold text-xs uppercase">
                                            <UserCheck size={14} className="text-brand-500" /> {resolveCreatorName(item.createdBy)}
                                        </div>
                                    )}
                                    {activeTab === 'users' && <div className="text-xs text-gray-400 font-mono">{item.email}</div>}
                                    {activeTab === 'sectors' && <div className="text-xs text-brand-600 font-bold">{item.coordinatorPhone || '-'}</div>}
                                </td>
                                <td className="p-4 text-right space-x-1">
                                    <button 
                                        onClick={() => {
                                            if (activeTab === 'events') setEventFormData({name: item.name, startDate: item.startDate, endDate: item.endDate, isActive: item.isActive});
                                            if (activeTab === 'inventory' && inventorySubTab === 'ativos') setEqFormData({inventoryNumber: item.inventoryNumber, brand: item.brand, model: item.model, category: item.category});
                                            if (activeTab === 'inventory' && inventorySubTab === 'itens') setItemFormData({name: item.name});
                                            if (activeTab === 'sectors') setSectorFormData({name: item.name, coordinatorName: item.coordinatorName || '', coordinatorPhone: item.coordinatorPhone || ''});
                                            if (activeTab === 'users') setUserFormData({name: item.name, preferredName: item.preferredName || '', email: item.email, phone: item.phone || '', role: item.role, password: ''});
                                            setEditingId(item.id);
                                            setIsAdding(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                    ><Pencil size={16}/></button>
                                    <button 
                                        onClick={() => {
                                            if (confirm('Deseja excluir permanentemente?')) {
                                                if (activeTab === 'events') onDeleteEvent(item.id);
                                                if (activeTab === 'inventory') {
                                                    if (inventorySubTab === 'ativos') onDeleteEquipment(item.id);
                                                    else onDeleteItem(item.id);
                                                }
                                                if (activeTab === 'sectors') onDeleteSector(item.id);
                                                if (activeTab === 'users') onDeleteUser(item.id);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    ><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
             </table>
        </div>
      </div>
    </div>
  );
};
