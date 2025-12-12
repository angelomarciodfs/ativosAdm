import React, { useState } from 'react';
import { Equipment, EquipmentCategory, Sector, User, UserRole, Event } from '../types';
import { Plus, Search, Radio, Headphones, Battery, Trash2, Save, Users, Package, Pencil, Shield, Calendar, CheckCircle, Key, Lock } from 'lucide-react';

interface ConfigurationViewProps {
  equipmentList: Equipment[];
  onAddEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  onUpdateEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
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
  equipmentList, 
  onAddEquipment, onUpdateEquipment, onDeleteEquipment,
  sectorList, onAddSector, onUpdateSector, onDeleteSector,
  userList, onAddUser, onUpdateUser, onDeleteUser,
  eventList, onAddEvent, onUpdateEvent, onDeleteEvent,
  onResetUserPassword
}) => {
  const [activeTab, setActiveTab] = useState<'equipment' | 'sectors' | 'users' | 'events'>('equipment');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [eqFormData, setEqFormData] = useState({
    inventoryNumber: '',
    name: '',
    brand: '',
    model: '',
    category: 'Radio' as EquipmentCategory
  });

  const [sectorFormData, setSectorFormData] = useState({
    name: '',
    coordinatorName: '',
    coordinatorPhone: ''
  });

  const [userFormData, setUserFormData] = useState({
      name: '',
      preferredName: '',
      email: '',
      phone: '',
      role: 'USER' as UserRole,
      password: ''
  });

  const [eventFormData, setEventFormData] = useState({
      name: '',
      startDate: '',
      endDate: '',
      isActive: true
  });

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

  const handleEqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
       const original = equipmentList.find(e => e.id === editingId);
       if (original) onUpdateEquipment({ ...original, ...eqFormData });
    } else {
        onAddEquipment({ ...eqFormData, createdAt: new Date().toISOString().split('T')[0] });
    }
    resetForms();
  };

  const handleSectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
          onUpdateSector({ id: editingId, ...sectorFormData, name: sectorFormData.name.toUpperCase() });
      } else {
          onAddSector({ ...sectorFormData, name: sectorFormData.name.toUpperCase() });
      }
      resetForms();
  };

  const handleUserSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingId) {
          const original = userList.find(u => u.id === editingId);
          if (original) onUpdateUser({ ...original, ...userFormData });
      } else {
          // Passa a senha junto
          onAddUser(userFormData);
      }
      resetForms();
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        onUpdateEvent({ id: editingId, ...eventFormData });
    } else {
        onAddEvent(eventFormData);
    }
    resetForms();
  };

  const resetForms = () => {
    setEqFormData({ inventoryNumber: '', name: '', brand: '', model: '', category: 'Radio' });
    setSectorFormData({ name: '', coordinatorName: '', coordinatorPhone: '' });
    setUserFormData({ name: '', preferredName: '', email: '', phone: '', role: 'USER', password: '' });
    setEventFormData({ name: '', startDate: '', endDate: '', isActive: true });
    setIsAdding(false);
    setEditingId(null);
  };

  const startEditEquipment = (item: Equipment) => {
      setEqFormData({ inventoryNumber: item.inventoryNumber || '', name: item.name, brand: item.brand, model: item.model, category: item.category });
      setEditingId(item.id); setIsAdding(true); setActiveTab('equipment');
  };

  const startEditSector = (item: Sector) => {
      setSectorFormData({ name: item.name, coordinatorName: item.coordinatorName || '', coordinatorPhone: item.coordinatorPhone || '' });
      setEditingId(item.id); setIsAdding(true); setActiveTab('sectors');
  };

  const startEditUser = (item: User) => {
      setUserFormData({ name: item.name, preferredName: item.preferredName || '', email: item.email, phone: item.phone || '', role: item.role, password: '' });
      setEditingId(item.id); setIsAdding(true); setActiveTab('users');
  };

  const startEditEvent = (item: Event) => {
      setEventFormData({ name: item.name, startDate: item.startDate, endDate: item.endDate, isActive: item.isActive });
      setEditingId(item.id); setIsAdding(true); setActiveTab('events');
  };

  const filteredEquipment = equipmentList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inventoryNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSectors = sectorList.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = userList.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredEvents = eventList.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Configurações</h2>
          <p className="text-gray-500 mt-1">Gerenciamento de eventos, recursos e acessos.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); if(isAdding) resetForms(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm w-full md:w-auto justify-center ${
            isAdding 
              ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50' 
              : 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/20'
          }`}
        >
          {isAdding ? 'Cancelar' : <><Plus size={18} /> Novo Registro</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
        <button onClick={() => { setActiveTab('events'); resetForms(); }} className={`px-4 md:px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'events' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
          <Calendar size={16} /> Eventos
        </button>
        <button onClick={() => { setActiveTab('equipment'); resetForms(); }} className={`px-4 md:px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'equipment' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
          <Package size={16} /> Inventário
        </button>
        <button onClick={() => { setActiveTab('sectors'); resetForms(); }} className={`px-4 md:px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'sectors' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
          <Users size={16} /> Setores
        </button>
        <button onClick={() => { setActiveTab('users'); resetForms(); }} className={`px-4 md:px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${activeTab === 'users' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
          <Shield size={16} /> Usuários
        </button>
      </div>

      {/* Forms */}
      {isAdding && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-xl mb-6 animate-in slide-in-from-top-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                {editingId ? <Pencil size={20} className="text-brand-600" /> : <Plus size={20} className="text-brand-600" />}
                {editingId ? 'Editar' : 'Cadastrar'} {activeTab === 'events' ? 'Evento' : activeTab === 'equipment' ? 'Ativo' : activeTab === 'sectors' ? 'Setor' : 'Usuário'}
            </h3>
            
            {activeTab === 'events' && (
                <form onSubmit={handleEventSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-2 space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Nome do Evento</label>
                        <input required type="text" placeholder="Ex: TOP 1109 - Edição 54" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500" value={eventFormData.name} onChange={e => setEventFormData({...eventFormData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Data Início</label>
                        <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={eventFormData.startDate} onChange={e => setEventFormData({...eventFormData, startDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Data Fim</label>
                        <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={eventFormData.endDate} onChange={e => setEventFormData({...eventFormData, endDate: e.target.value})} />
                    </div>
                    <div className="space-y-1 flex items-center gap-3 py-3">
                         <label className="text-xs uppercase text-gray-500 font-bold">Status Ativo?</label>
                         <input type="checkbox" className="w-5 h-5 accent-brand-500 border-gray-300 rounded" checked={eventFormData.isActive} onChange={e => setEventFormData({...eventFormData, isActive: e.target.checked})} />
                    </div>
                    <div className="lg:col-span-1">
                        <button type="submit" className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"><Save size={18} /> Salvar</button>
                    </div>
                </form>
            )}

            {activeTab === 'equipment' && (
                <form onSubmit={handleEqSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    <div className="space-y-1 lg:col-span-1">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Categoria</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={eqFormData.category} onChange={e => setEqFormData({...eqFormData, category: e.target.value as EquipmentCategory})}>
                        <option value="Radio">Rádio</option><option value="Headset">Fone</option><option value="PowerBank">PowerBank</option>
                    </select>
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                        <label className="text-xs uppercase tracking-wider text-brand-600 font-bold">Patrimônio</label>
                        <input required type="text" placeholder="Ex: ADM 01" className="w-full bg-gray-50 border border-brand-200 rounded-lg p-2.5 text-gray-900 font-mono" value={eqFormData.inventoryNumber} onChange={e => setEqFormData({...eqFormData, inventoryNumber: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Nome</label>
                        <input required type="text" placeholder="Rádio 01" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={eqFormData.name} onChange={e => setEqFormData({...eqFormData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Marca</label>
                        <input required type="text" placeholder="Motorola" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={eqFormData.brand} onChange={e => setEqFormData({...eqFormData, brand: e.target.value})} />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Modelo</label>
                        <input required type="text" placeholder="T800" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={eqFormData.model} onChange={e => setEqFormData({...eqFormData, model: e.target.value})} />
                    </div>
                    <div className="lg:col-span-1">
                         <button type="submit" className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"><Save size={18} /> Salvar</button>
                    </div>
                </form>
            )}

            {activeTab === 'sectors' && (
                 <form onSubmit={handleSectorSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Nome Setor</label>
                        <input required type="text" placeholder="SEGURANÇA" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 uppercase" value={sectorFormData.name} onChange={e => setSectorFormData({...sectorFormData, name: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Coordenador</label>
                        <input type="text" placeholder="Nome do responsável" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={sectorFormData.coordinatorName} onChange={e => setSectorFormData({...sectorFormData, coordinatorName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Telefone</label>
                        <input type="text" placeholder="(00) 00000-0000" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={sectorFormData.coordinatorPhone} onChange={e => setSectorFormData({...sectorFormData, coordinatorPhone: e.target.value})} />
                    </div>
                    <div className="md:col-span-3">
                         <button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"><Save size={18} /> Salvar</button>
                    </div>
                 </form>
            )}

            {activeTab === 'users' && (
                <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Nome</label>
                        <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Email</label>
                        <input required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs uppercase text-gray-500 font-bold">Perfil</label>
                        <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}>
                            <option value="USER">Operador</option><option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    {/* Password Field - Only visible when adding new users */}
                    {!editingId && (
                        <div className="space-y-1 lg:col-span-1">
                            <label className="text-xs uppercase text-brand-600 font-bold flex items-center gap-1"><Lock size={12} /> Senha Inicial</label>
                            <input 
                                required 
                                type="text" 
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-gray-50 border border-brand-200 rounded-lg p-2.5 text-gray-900" 
                                value={userFormData.password} 
                                onChange={e => setUserFormData({...userFormData, password: e.target.value})} 
                                minLength={6}
                            />
                        </div>
                    )}
                     <div className="md:col-span-2 lg:col-span-3">
                         <button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"><Save size={18} /> {editingId ? 'Atualizar Usuário' : 'Criar Usuário'}</button>
                    </div>
                </form>
            )}
          </div>
      )}

      {/* Lists */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-lg md:text-xl font-bold text-gray-900">
            {activeTab === 'events' ? 'Eventos' : activeTab === 'equipment' ? 'Inventário' : activeTab === 'sectors' ? 'Setores' : 'Usuários'}
          </h3>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-brand-500 w-full md:w-64 transition-all" />
          </div>
        </div>

        <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[600px]">
                {/* Simplified rendering logic remains mostly same but wrapped in overflow-x-auto above */}
                {activeTab === 'events' && (
                    <>
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                            <th className="p-4 font-bold">Nome do Evento</th>
                            <th className="p-4 font-bold">Período</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredEvents.map(evt => (
                            <tr key={evt.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-900">{evt.name}</td>
                                <td className="p-4 text-gray-600 text-sm">{formatDate(evt.startDate)} até {formatDate(evt.endDate)}</td>
                                <td className="p-4">
                                    {evt.isActive ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                                            <CheckCircle size={12} /> ATIVO
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">ENCERRADO</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                     <button onClick={() => startEditEvent(evt)} className="p-2 text-gray-400 hover:text-blue-500 transition-all"><Pencil size={16}/></button>
                                     <button onClick={() => onDeleteEvent(evt.id)} className="p-2 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </>
                )}

                 {activeTab === 'equipment' && (
                     <>
                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500"><th className="p-4">Tag</th><th className="p-4">Modelo</th><th className="p-4 text-right">Ações</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredEquipment.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-brand-600 font-bold">{item.inventoryNumber}</td>
                                <td className="p-4 text-gray-900">{item.brand} {item.model}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => startEditEquipment(item)} className="p-2 text-gray-400 hover:text-blue-500"><Pencil size={16}/></button>
                                    <button onClick={() => onDeleteEquipment(item.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </>
                 )}
                 
                 {activeTab === 'sectors' && (
                     <>
                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500"><th className="p-4">Nome</th><th className="p-4">Coordenador</th><th className="p-4 text-right">Ações</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredSectors.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4 text-gray-900 font-bold">{item.name}</td>
                                <td className="p-4 text-gray-500">{item.coordinatorName}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => startEditSector(item)} className="p-2 text-gray-400 hover:text-blue-500"><Pencil size={16}/></button>
                                    <button onClick={() => onDeleteSector(item.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </>
                 )}

                 {activeTab === 'users' && (
                     <>
                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500"><th className="p-4">Nome</th><th className="p-4">Email</th><th className="p-4 text-right">Ações</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4 text-gray-900 font-bold">{item.name}</td>
                                <td className="p-4 text-gray-500">{item.email}</td>
                                <td className="p-4 text-right flex items-center justify-end gap-1">
                                    <button 
                                        onClick={() => onResetUserPassword && onResetUserPassword(item.email)} 
                                        className="p-2 text-gray-400 hover:text-orange-500" 
                                        title="Enviar email de redefinição de senha"
                                    >
                                        <Key size={16}/>
                                    </button>
                                    <button onClick={() => startEditUser(item)} className="p-2 text-gray-400 hover:text-blue-500"><Pencil size={16}/></button>
                                    <button onClick={() => onDeleteUser(item.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </>
                 )}
             </table>
        </div>
      </div>
    </div>
  );
};