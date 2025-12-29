
import React, { useState } from 'react';
import { Equipment, Sector, User, UserRole, Event, Category } from '../types';
import { Plus, Search, Trash2, Save, Users, Package, Pencil, Shield, Calendar, Key, Tags, ChevronRight, LayoutGrid } from 'lucide-react';

interface ConfigurationViewProps {
  equipmentList: Equipment[];
  onAddEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  onUpdateEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
  categoryList: Category[];
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  sectorList: Sector[];
  onAddSector: (sector: Omit<Sector, 'id'>) => void;
  onUpdateSector: (sector: Sector) => void;
  onDeleteSector: (id: string) => void;
  userList: User[];
  onAddUser: (user: Omit<User, 'id' | 'avatarInitials'> & { password?: string }) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  eventList: Event[];
  onAddEvent: (event: Omit<Event, 'id'>) => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  onResetUserPassword?: (email: string) => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  equipmentList, onAddEquipment, onUpdateEquipment, onDeleteEquipment,
  categoryList, onAddCategory, onUpdateCategory, onDeleteCategory,
  sectorList, onAddSector, onUpdateSector, onDeleteSector,
  userList, onAddUser, onUpdateUser, onDeleteUser,
  eventList, onAddEvent, onUpdateEvent, onDeleteEvent,
  onResetUserPassword
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'inventory' | 'sectors' | 'users'>('events');
  const [inventorySubTab, setInventorySubTab] = useState<'ativos' | 'itens'>('ativos');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [eqFormData, setEqFormData] = useState({ inventoryNumber: '', name: '', brand: '', model: '', category: '' });
  const [catFormData, setCatFormData] = useState({ name: '' });
  const [sectorFormData, setSectorFormData] = useState({ name: '', coordinatorName: '', coordinatorPhone: '' });
  const [userFormData, setUserFormData] = useState({ name: '', preferredName: '', email: '', phone: '', role: 'USER' as UserRole, password: '' });
  const [eventFormData, setEventFormData] = useState({ name: '', startDate: '', endDate: '', isActive: true });

  const resetForms = () => {
    setEqFormData({ inventoryNumber: '', name: '', brand: '', model: '', category: '' });
    setCatFormData({ name: '' });
    setSectorFormData({ name: '', coordinatorName: '', coordinatorPhone: '' });
    setUserFormData({ name: '', preferredName: '', email: '', phone: '', role: 'USER', password: '' });
    setEventFormData({ name: '', startDate: '', endDate: '', isActive: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'inventory' && inventorySubTab === 'itens') {
        if (editingId) onUpdateCategory(editingId, catFormData.name);
        else onAddCategory(catFormData.name);
    } else if (activeTab === 'inventory' && inventorySubTab === 'ativos') {
        if (editingId) {
            const original = equipmentList.find(item => item.id === editingId);
            onUpdateEquipment({ id: editingId, ...eqFormData, createdAt: original?.createdAt || new Date().toISOString().split('T')[0] });
        } else {
            onAddEquipment({ ...eqFormData, createdAt: new Date().toISOString().split('T')[0] });
        }
    } else if (activeTab === 'sectors') {
        if (editingId) onUpdateSector({ id: editingId, ...sectorFormData, name: sectorFormData.name.toUpperCase() });
        else onAddSector({ ...sectorFormData, name: sectorFormData.name.toUpperCase() });
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
        if (inventorySubTab === 'ativos') return equipmentList.filter(eq => eq.inventoryNumber.toLowerCase().includes(term) || eq.name.toLowerCase().includes(term));
        return categoryList.filter(c => c.name.toLowerCase().includes(term));
    }
    return [];
  };

  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Configurações</h2>
          <p className="text-gray-500 mt-1 text-sm">Gerencie eventos, inventário e usuários.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => { setIsAdding(!isAdding); if(isAdding) resetForms(); }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg flex-1 md:flex-none justify-center ${
                isAdding ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50' : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
            >
              {isAdding ? 'Cancelar' : <><Plus size={18} /> Novo Registro</>}
            </button>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS */}
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
                activeTab === tab.id ? 'border-brand-500 text-brand-600 bg-brand-50/10' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
                <tab.icon size={18} /> {tab.label}
            </button>
        ))}
      </div>

      {/* SUB-TABS INVENTÁRIO */}
      {activeTab === 'inventory' && (
          <div className="flex gap-1 p-1 bg-gray-200 rounded-lg w-fit shadow-inner">
              <button 
                onClick={() => { setInventorySubTab('ativos'); if(isAdding) setIsAdding(false); }}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'ativos' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Ativos Físicos
              </button>
              <button 
                onClick={() => { setInventorySubTab('itens'); if(isAdding) setIsAdding(false); }}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'itens' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Gerenciar ITENS
              </button>
          </div>
      )}

      {/* FORMULÁRIO DINÂMICO */}
      {isAdding && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
             <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <Plus size={20} className="text-brand-500" /> 
                    {editingId ? 'Editar' : 'Novo'} 
                    <span className="text-gray-400 font-medium">| {activeTab === 'inventory' ? (inventorySubTab === 'ativos' ? 'Ativo' : 'ITEM') : activeTab}</span>
                </h3>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                 {activeTab === 'events' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome do Evento</label>
                            <input required type="text" className="w-full bg-gray-50 border p-3 rounded-lg" value={eventFormData.name} onChange={e => setEventFormData({...eventFormData, name: e.target.value})} placeholder="Ex: TOP 1109 - Ed. 55" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Início</label>
                            <input required type="date" className="w-full bg-gray-50 border p-3 rounded-lg" value={eventFormData.startDate} onChange={e => setEventFormData({...eventFormData, startDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Fim</label>
                            <input required type="date" className="w-full bg-gray-50 border p-3 rounded-lg" value={eventFormData.endDate} onChange={e => setEventFormData({...eventFormData, endDate: e.target.value})} />
                        </div>
                        <div className="flex items-center gap-2 py-4">
                            <input type="checkbox" id="evActive" checked={eventFormData.isActive} onChange={e => setEventFormData({...eventFormData, isActive: e.target.checked})} className="w-5 h-5 accent-brand-500" />
                            <label htmlFor="evActive" className="text-sm font-bold text-gray-700">Evento Ativo Atualmente</label>
                        </div>
                     </div>
                 )}

                 {activeTab === 'inventory' && inventorySubTab === 'ativos' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                ITEM (Tipo)
                                <button type="button" onClick={() => setInventorySubTab('itens')} className="text-brand-600 hover:underline text-[10px]">Gerenciar Itens</button>
                            </label>
                            <select required className="w-full bg-gray-50 border p-3 rounded-lg" value={eqFormData.category} onChange={e => setEqFormData({...eqFormData, category: e.target.value})}>
                                <option value="">Selecione...</option>
                                {categoryList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-600 uppercase">Patrimônio / Tag</label>
                            <input required type="text" className="w-full bg-gray-50 border border-brand-200 p-3 rounded-lg font-mono font-bold" value={eqFormData.inventoryNumber} onChange={e => setEqFormData({...eqFormData, inventoryNumber: e.target.value.toUpperCase()})} placeholder="Ex: R-01" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome / Descrição</label>
                            <input required type="text" className="w-full bg-gray-50 border p-3 rounded-lg" value={eqFormData.name} onChange={e => setEqFormData({...eqFormData, name: e.target.value})} placeholder="Ex: Rádio Coordenação" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Marca</label>
                            <input required type="text" className="w-full bg-gray-50 border p-3 rounded-lg" value={eqFormData.brand} onChange={e => setEqFormData({...eqFormData, brand: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Modelo</label>
                            <input required type="text" className="w-full bg-gray-50 border p-3 rounded-lg" value={eqFormData.model} onChange={e => setEqFormData({...eqFormData, model: e.target.value})} />
                        </div>
                     </div>
                 )}

                 {activeTab === 'inventory' && inventorySubTab === 'itens' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome do ITEM (Tipo de Ativo)</label>
                            <input required type="text" className="w-full bg-gray-50 border p-3 rounded-lg" value={catFormData.name} onChange={e => setCatFormData({name: e.target.value})} placeholder="Ex: Lanterna, PowerBank, etc" />
                        </div>
                     </div>
                 )}

                 {activeTab === 'sectors' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Sigla do Setor</label>
                            <input required type="text" className="w-full bg-gray-50 border p-3 rounded-lg font-bold" value={sectorFormData.name} onChange={e => setSectorFormData({...sectorFormData, name: e.target.value.toUpperCase()})} placeholder="Ex: ADM, LOG" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Coordenador</label>
                            <input type="text" className="w-full bg-gray-50 border p-3 rounded-lg" value={sectorFormData.coordinatorName} onChange={e => setSectorFormData({...sectorFormData, coordinatorName: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label>
                            <input type="tel" className="w-full bg-gray-50 border p-3 rounded-lg" value={sectorFormData.coordinatorPhone} onChange={e => setSectorFormData({...sectorFormData, coordinatorPhone: e.target.value})} placeholder="(00) 00000-0000" />
                        </div>
                     </div>
                 )}

                 {activeTab === 'users' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                            <input required type="text" className="w-full bg-gray-50 border p-3 rounded-lg" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                            <input required type="email" className="w-full bg-gray-50 border p-3 rounded-lg" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} disabled={!!editingId} />
                        </div>
                        {!editingId && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Senha Temporária</label>
                                <input required type="password" px-3 className="w-full bg-gray-50 border p-3 rounded-lg" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} placeholder="Mín. 6 dígitos" />
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Perfil</label>
                            <select className="w-full bg-gray-50 border p-3 rounded-lg" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}>
                                <option value="USER">Operador (Locações)</option>
                                <option value="ADMIN">Administrador (Total)</option>
                            </select>
                        </div>
                     </div>
                 )}

                 <div className="flex gap-4 pt-6 border-t border-gray-100">
                    <button type="button" onClick={resetForms} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors">Descartar</button>
                    <button type="submit" className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-lg hover:bg-brand-600 shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar Registro
                    </button>
                 </div>
             </form>
          </div>
      )}

      {/* LISTAGEM DE REGISTROS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <h3 className="text-lg font-black text-gray-900 tracking-tight">Listagem</h3>
             <span className="bg-gray-100 text-[10px] font-black text-gray-400 px-2 py-0.5 rounded-full border border-gray-200">
                {filteredData().length} Total
             </span>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-50 border rounded-lg text-sm w-full md:w-64 focus:ring-1 focus:ring-brand-500 focus:outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-black tracking-widest text-gray-400">
                        <th className="p-4">{activeTab === 'inventory' && inventorySubTab === 'itens' ? 'Nome do ITEM' : 'Identificação'}</th>
                        <th className="p-4">{activeTab === 'inventory' && inventorySubTab === 'itens' ? 'Data Criação' : 'Detalhes / Status'}</th>
                        <th className="p-4">{activeTab === 'inventory' && inventorySubTab === 'itens' ? 'Criado por' : 'Vinculo'}</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredData().length === 0 ? (
                        <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic">Nenhum registro encontrado.</td></tr>
                    ) : (
                        filteredData().map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    {activeTab === 'events' && <div className="font-bold text-gray-900">{item.name}</div>}
                                    {activeTab === 'inventory' && inventorySubTab === 'ativos' && (
                                        <div className="flex flex-col">
                                            <span className="font-mono text-brand-600 font-black text-sm">{item.inventoryNumber}</span>
                                            <span className="text-xs text-gray-900 font-bold">{item.name}</span>
                                        </div>
                                    )}
                                    {activeTab === 'inventory' && inventorySubTab === 'itens' && <div className="font-black text-gray-900">{item.name}</div>}
                                    {activeTab === 'sectors' && <div className="font-black text-gray-900">{item.name}</div>}
                                    {activeTab === 'users' && <div className="font-bold text-gray-900">{item.name}</div>}
                                </td>
                                <td className="p-4 text-sm">
                                    {activeTab === 'events' && <div className="text-gray-500">{formatDate(item.startDate)} - {formatDate(item.endDate)}</div>}
                                    {activeTab === 'inventory' && inventorySubTab === 'ativos' && <div className="text-xs font-bold text-gray-400 uppercase">{item.category}</div>}
                                    {activeTab === 'inventory' && inventorySubTab === 'itens' && <div className="text-xs text-gray-500 font-mono">{formatDate(item.createdAt)}</div>}
                                    {activeTab === 'sectors' && <div className="text-xs text-gray-500">{item.coordinatorName || '-'}</div>}
                                    {activeTab === 'users' && <div className="text-xs text-brand-600 font-bold uppercase">{item.role}</div>}
                                </td>
                                <td className="p-4">
                                    {activeTab === 'events' && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${item.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                            {item.isActive ? 'Ativo' : 'Finalizado'}
                                        </span>
                                    )}
                                    {activeTab === 'inventory' && inventorySubTab === 'ativos' && <div className="text-[10px] text-gray-400 italic">Cad. em {formatDate(item.createdAt)}</div>}
                                    {activeTab === 'inventory' && inventorySubTab === 'itens' && <div className="text-xs font-bold text-gray-700">{item.createdBy || 'Sistema'}</div>}
                                    {activeTab === 'users' && <div className="text-xs text-gray-400">{item.email}</div>}
                                </td>
                                <td className="p-4 text-right space-x-1">
                                    <button 
                                        onClick={() => {
                                            if (activeTab === 'events') setEventFormData({name: item.name, startDate: item.startDate, endDate: item.endDate, isActive: item.isActive});
                                            if (activeTab === 'inventory' && inventorySubTab === 'ativos') setEqFormData({inventoryNumber: item.inventoryNumber, name: item.name, brand: item.brand, model: item.model, category: item.category});
                                            if (activeTab === 'inventory' && inventorySubTab === 'itens') setCatFormData({name: item.name});
                                            if (activeTab === 'sectors') setSectorFormData({name: item.name, coordinatorName: item.coordinatorName || '', coordinatorPhone: item.coordinatorPhone || ''});
                                            if (activeTab === 'users') setUserFormData({name: item.name, preferredName: item.preferredName || '', email: item.email, phone: item.phone || '', role: item.role, password: ''});
                                            
                                            setEditingId(item.id);
                                            setIsAdding(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-brand-600 transition-colors"
                                    >
                                        <Pencil size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (confirm('Excluir permanentemente?')) {
                                                if (activeTab === 'events') onDeleteEvent(item.id);
                                                if (activeTab === 'inventory') {
                                                    if (inventorySubTab === 'ativos') onDeleteEquipment(item.id);
                                                    else onDeleteCategory(item.id);
                                                }
                                                if (activeTab === 'sectors') onDeleteSector(item.id);
                                                if (activeTab === 'users') onDeleteUser(item.id);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
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
