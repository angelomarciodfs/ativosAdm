
import React, { useState } from 'react';
import { Equipment, Sector, User, UserRole, Event, EquipmentItem, Channel, MerchandiseItem } from '../types';
import { Plus, Search, Trash2, Save, Users, Package, Pencil, Shield, Calendar, Clock, UserCheck, Key, Radio as RadioIcon, Activity, Phone, Power, Check, X, Tag, AlertTriangle, RefreshCw, Server } from 'lucide-react';
import { api } from '../services/database';

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
  channelList: Channel[];
  onAddChannel: (channel: Omit<Channel, 'id'>) => void;
  onUpdateChannel: (channel: Channel) => void;
  onDeleteChannel: (id: string) => void;
  userList: User[];
  onAddUser: (user: Omit<User, 'id' | 'avatarInitials'> & { password?: string }) => void;
  onUpdateUser: (user: User & { password?: string }) => void;
  onDeleteUser: (id: string) => void;
  eventList: Event[];
  onAddEvent: (event: Omit<Event, 'id'>) => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  activeTab: 'events' | 'inventory' | 'sectors' | 'users' | 'channels' | 'stock' | 'system';
  setActiveTab: (tab: any) => void;
  inventorySubTab: 'ativos' | 'itens';
  setInventorySubTab: (tab: any) => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  equipmentList, onAddEquipment, onUpdateEquipment, onDeleteEquipment,
  itemList, onAddItem, onUpdateItem, onDeleteItem,
  sectorList, onAddSector, onUpdateSector, onDeleteSector,
  channelList, onAddChannel, onUpdateChannel, onDeleteChannel,
  userList, onAddUser, onUpdateUser, onDeleteUser,
  eventList, onAddEvent, onUpdateEvent, onDeleteEvent,
  activeTab, setActiveTab, inventorySubTab, setInventorySubTab
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const [merchandiseList, setMerchandiseList] = useState<MerchandiseItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const [eqFormData, setEqFormData] = useState({ inventoryNumber: '', brand: '', model: '', category: '' });
  const [itemFormData, setItemFormData] = useState({ name: '' });
  const [sectorFormData, setSectorFormData] = useState({ name: '', coordinatorName: '', coordinatorPhone: '', channelId: '' });
  const [channelFormData, setChannelFormData] = useState({ name: '', frequency: '', type: 'VHF' });
  const [userFormData, setUserFormData] = useState({ name: '', preferredName: '', email: '', phone: '', role: 'USER' as UserRole, password: '', isActive: true });
  const [eventFormData, setEventFormData] = useState({ name: '', startDate: '', endDate: '', isActive: true });
  const [stockFormData, setStockFormData] = useState({ name: '', currentStock: 0, minThreshold: 10 });

  React.useEffect(() => {
    if (activeTab === 'stock') {
      setLoadingStock(true);
      api.fetchMerchandise().then(setMerchandiseList).finally(() => setLoadingStock(false));
    }
  }, [activeTab]);

  const maskChannel = (val: string) => {
      let clean = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (clean.length > 3) {
          return clean.substring(0, 3) + '-' + clean.substring(3, 5);
      }
      return clean;
  };

  const maskFrequency = (val: string) => {
      let clean = val.replace(/\D/g, '');
      if (clean.length > 3) {
          return clean.substring(0, 3) + '.' + clean.substring(3, 6);
      }
      return clean;
  };

  const resetForms = () => {
    setEqFormData({ inventoryNumber: '', brand: '', model: '', category: '' });
    setItemFormData({ name: '' });
    setSectorFormData({ name: '', coordinatorName: '', coordinatorPhone: '', channelId: '' });
    setChannelFormData({ name: '', frequency: '', type: 'VHF' });
    setUserFormData({ name: '', preferredName: '', email: '', phone: '', role: 'USER', password: '', isActive: true });
    setEventFormData({ name: '', startDate: '', endDate: '', isActive: true });
    setStockFormData({ name: '', currentStock: 0, minThreshold: 10 });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleResetRentals = async () => {
      if (!confirm("⚠️ ATENÇÃO: Isso irá apagar PERMANENTEMENTE todas as locações registradas. O histórico de Pins e Patches NÃO será afetado. Deseja continuar?")) return;
      
      const confirmText = prompt("Para confirmar a limpeza de todas as locações, digite: DELETAR");
      if (confirmText !== "DELETAR") {
          alert("Operação cancelada.");
          return;
      }

      setIsResetting(true);
      try {
          await api.resetAllRentals();
          alert("Histórico de locações limpo com sucesso! O dashboard agora refletirá zero locações ativas.");
          window.location.reload(); 
      } catch (err) {
          console.error(err);
          alert("Erro ao limpar dados de locação.");
      } finally {
          setIsResetting(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } else if (activeTab === 'channels') {
        if (editingId) onUpdateChannel({ id: editingId, ...channelFormData });
        else onAddChannel(channelFormData);
    } else if (activeTab === 'users') {
        if (editingId) onUpdateUser({ id: editingId, ...userFormData, avatarInitials: userFormData.name.substring(0, 2).toUpperCase() });
        else onAddUser(userFormData);
    } else if (activeTab === 'events') {
        if (editingId) onUpdateEvent({ id: editingId, ...eventFormData });
        else onAddEvent(eventFormData);
    } else if (activeTab === 'stock') {
        if (editingId) await api.updateMerchandise({ id: editingId, ...stockFormData });
        else await api.createMerchandise(stockFormData);
        api.fetchMerchandise().then(setMerchandiseList);
    }
    resetForms();
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'events') return eventList.filter(e => e.name.toLowerCase().includes(term));
    if (activeTab === 'sectors') return sectorList.filter(s => s.name.toLowerCase().includes(term));
    if (activeTab === 'channels') return channelList.filter(c => c.name.toLowerCase().includes(term) || c.frequency.includes(term));
    if (activeTab === 'users') return userList.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    if (activeTab === 'inventory') {
        if (inventorySubTab === 'ativos') return equipmentList.filter(eq => eq.inventoryNumber.toLowerCase().includes(term));
        return itemList.filter(c => c.name.toLowerCase().includes(term));
    }
    if (activeTab === 'stock') return merchandiseList.filter(m => m.name.toLowerCase().includes(term));
    return [];
  };

  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const resolveChannelInfo = (channelId?: string) => {
      if (!channelId) return null;
      return channelList.find(c => c.id === channelId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Configurações</h2>
          <p className="text-gray-500 mt-1 text-sm font-medium uppercase tracking-wider">Gestão centralizada do sistema.</p>
        </div>
        {activeTab !== 'system' && (
            <button 
                onClick={() => { setIsAdding(!isAdding); if(isAdding) resetForms(); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg w-full md:w-auto justify-center ${
                    isAdding ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50' : 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/20'
                }`}
            >
                {isAdding ? 'Cancelar' : <><Plus size={18} /> Novo Registro</>}
            </button>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar bg-white rounded-t-2xl px-2">
        {[
            { id: 'events', label: 'Eventos', icon: Calendar },
            { id: 'inventory', label: 'Inventário', icon: Package },
            { id: 'channels', label: 'Canais', icon: RadioIcon },
            { id: 'sectors', label: 'Setores', icon: Users },
            { id: 'users', label: 'Usuários', icon: Shield },
            { id: 'stock', label: 'Estoque', icon: Tag },
            { id: 'system', label: 'Sistema', icon: Server }
        ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); resetForms(); }} 
              className={`px-6 py-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'border-brand-500 text-brand-600 bg-brand-50/20' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
                <tab.icon size={18} /> {tab.label}
            </button>
        ))}
      </div>

      {/* SYSTEM TAB - EXCLUSIVO PARA RESET DE LOCAÇÕES */}
      {activeTab === 'system' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8 animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col md:flex-row items-start gap-6 border-l-4 border-red-500 bg-red-50 p-6 rounded-r-xl">
                  <div className="bg-red-100 p-3 rounded-full text-red-600">
                      <AlertTriangle size={32} />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-xl font-black text-red-900 uppercase">Zona de Perigo: Manutenção de Dados</h3>
                      <p className="text-red-700 mt-1 font-medium">Esta função permite limpar os dados de teste para iniciar o evento. Somente o histórico de locações será removido.</p>
                      
                      <button 
                        onClick={handleResetRentals}
                        disabled={isResetting}
                        className="mt-6 flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95 disabled:opacity-50"
                      >
                          {isResetting ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                          Zerar Todas as Locações
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Check size={16} className="text-emerald-500" /> O que SERÁ apagado:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                          <li>• Todas as locações ativas e encerradas</li>
                          <li>• Histórico de devoluções e pendências</li>
                          <li>• Logs de sistema temporários</li>
                      </ul>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <X size={16} className="text-red-500" /> O que NÃO será afetado:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                          <li>• <strong>Pins e Patches</strong> (Cadastro e Entregas)</li>
                          <li>• Cadastro de Rádios e Patrimônios</li>
                          <li>• Usuários, Senhas e Setores</li>
                          <li>• Estoque de materiais</li>
                      </ul>
                  </div>
              </div>
          </div>
      )}

      {/* RENDERIZAÇÃO DOS FORMULÁRIOS E LISTAS (SE NÃO FOR TAB DE SISTEMA) */}
      {activeTab !== 'system' && (
          <>
            {activeTab === 'inventory' && (
                <div className="flex gap-2 p-1.5 bg-gray-100 rounded-lg w-full md:w-fit shadow-inner">
                    <button onClick={() => { setInventorySubTab('ativos'); if(isAdding) resetForms(); }} className={`flex-1 md:flex-none px-5 py-2.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'ativos' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Ativos Físicos</button>
                    <button onClick={() => { setInventorySubTab('itens'); if(isAdding) resetForms(); }} className={`flex-1 md:flex-none px-5 py-2.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${inventorySubTab === 'itens' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Categorias / Itens</button>
                </div>
            )}

            {isAdding && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3 uppercase tracking-tighter">
                        <Plus size={20} className="text-brand-500" /> 
                        {editingId ? 'Editar' : 'Novo'} {activeTab === 'inventory' ? (inventorySubTab === 'ativos' ? 'Ativo' : 'ITEM') : (activeTab === 'stock' ? 'Item de Estoque' : activeTab.slice(0, -1).toUpperCase())}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {activeTab === 'stock' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Nome do Item</label><input required type="text" placeholder="Ex: Pin Global, Patch ADM..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-bold" value={stockFormData.name} onChange={e => setStockFormData({...stockFormData, name: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-brand-600 font-bold">Saldo Inicial</label><input required type="number" min="0" className="w-full bg-gray-50 border border-brand-200 rounded-lg p-3 font-mono font-bold text-brand-600" value={stockFormData.currentStock} onChange={e => setStockFormData({...stockFormData, currentStock: parseInt(e.target.value) || 0})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-400 font-bold">Estoque Mínimo (Alerta)</label><input required type="number" min="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={stockFormData.minThreshold} onChange={e => setStockFormData({...stockFormData, minThreshold: parseInt(e.target.value) || 0})} /></div>
                            </div>
                        )}
                        {activeTab === 'channels' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Nome do Canal</label><input required type="text" placeholder="Ex: TOP-01" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono" value={channelFormData.name} onChange={e => setChannelFormData({...channelFormData, name: maskChannel(e.target.value)})} maxLength={6} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Frequência</label><input required type="text" placeholder="Ex: 144.925" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono" value={channelFormData.frequency} onChange={e => setChannelFormData({...channelFormData, frequency: maskFrequency(e.target.value)})} maxLength={7} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Tipo</label><select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={channelFormData.type} onChange={e => setChannelFormData({...channelFormData, type: e.target.value})}><option value="VHF">VHF</option><option value="UHF">UHF</option></select></div>
                            </div>
                        )}
                        {activeTab === 'sectors' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Sigla do Setor</label><input required type="text" placeholder="Ex: ADM" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-bold uppercase" value={sectorFormData.name} onChange={e => setSectorFormData({...sectorFormData, name: e.target.value.toUpperCase()})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Canal Operacional</label><select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={sectorFormData.channelId} onChange={e => setSectorFormData({...sectorFormData, channelId: e.target.value})}><option value="">Sem Canal Definido</option>{channelList.map(ch => <option key={ch.id} value={ch.id}>{ch.name} - {ch.frequency} ({ch.type})</option>)}</select></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Coordenador</label><input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={sectorFormData.coordinatorName} onChange={e => setSectorFormData({...sectorFormData, coordinatorName: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">WhatsApp</label><input type="tel" placeholder="(00) 00000-0000" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={sectorFormData.coordinatorPhone} onChange={e => setSectorFormData({...sectorFormData, coordinatorPhone: e.target.value})} /></div>
                            </div>
                        )}
                        {activeTab === 'events' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Nome do Evento</label><input required type="text" placeholder="Ex: TOP 1109 - Ed. 55" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eventFormData.name} onChange={e => setEventFormData({...eventFormData, name: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Data Início</label><input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eventFormData.startDate} onChange={e => setEventFormData({...eventFormData, startDate: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Data Fim</label><input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eventFormData.endDate} onChange={e => setEventFormData({...eventFormData, endDate: e.target.value})} /></div>
                                <div className="flex items-center gap-2 py-2"><input type="checkbox" id="isActive" checked={eventFormData.isActive} onChange={e => setEventFormData({...eventFormData, isActive: e.target.checked})} className="w-5 h-5 accent-brand-500 rounded" /><label htmlFor="isActive" className="text-sm font-bold text-gray-700">Evento Ativo Atualmente</label></div>
                            </div>
                        )}
                        {activeTab === 'inventory' && inventorySubTab === 'ativos' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold flex justify-between items-center mb-1">CATEGORIA</label><select required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eqFormData.category} onChange={e => setEqFormData({...eqFormData, category: e.target.value})}><option value="">Selecione...</option>{itemList.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}</select></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-brand-600 font-bold">Patrimônio / ID</label><input required type="text" placeholder="Ex: R-01" className="w-full bg-gray-50 border border-brand-200 rounded-lg p-3 font-mono font-bold" value={eqFormData.inventoryNumber} onChange={e => setEqFormData({...eqFormData, inventoryNumber: e.target.value.toUpperCase()})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Marca</label><input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eqFormData.brand} onChange={e => setEqFormData({...eqFormData, brand: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Modelo</label><input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={eqFormData.model} onChange={e => setEqFormData({...eqFormData, model: e.target.value})} /></div>
                            </div>
                        )}
                        {activeTab === 'inventory' && inventorySubTab === 'itens' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Nome da Categoria</label><input required type="text" placeholder="Digite o nome..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-bold" value={itemFormData.name} onChange={e => setItemFormData({name: e.target.value})} /></div></div>
                        )}
                        {activeTab === 'users' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Nome Completo</label><input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Email</label><input required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} disabled={!!editingId} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">{editingId ? 'Nova Senha' : 'Senha Inicial'}</label><input type="password" placeholder="Mínimo 6 caracteres" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} required={!editingId} /></div>
                                <div className="space-y-1"><label className="text-xs uppercase text-gray-500 font-bold">Perfil</label><select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}><option value="USER">Operador</option><option value="ADMIN">Administrador</option></select></div>
                            </div>
                        )}
                        <div className="flex gap-4 pt-4 border-t border-gray-100"><button type="button" onClick={resetForms} className="flex-1 py-4 border border-gray-200 text-gray-600 font-black rounded-xl hover:bg-gray-50 transition-colors uppercase text-[10px] tracking-widest">Descartar</button><button type="submit" className="flex-1 py-4 bg-brand-500 text-white font-black rounded-xl hover:bg-brand-600 shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"><Save size={18} /> Salvar Registro</button></div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3"><h3 className="text-lg font-black text-gray-900 tracking-tight">Base de Dados</h3><span className="bg-gray-100 text-[10px] font-black text-gray-500 px-2.5 py-1 rounded-full border border-gray-200 uppercase tracking-tighter">{filteredData().length} Itens</span></div>
                <div className="relative w-full md:w-auto"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full md:w-72 focus:ring-1 focus:ring-brand-500 focus:outline-none" /></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead><tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-black"><th className="p-4 md:p-6">Identificação</th><th className="p-4 md:p-6 hidden md:table-cell">Status/Info</th><th className="p-4 md:p-6">Ações</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">{filteredData().length === 0 ? (<tr><td colSpan={3} className="p-16 text-center text-gray-400 italic font-medium">Nenhum registro encontrado.</td></tr>) : (filteredData().map((item: any) => (<tr key={item.id} className="hover:bg-brand-50/10 transition-colors group"><td className="p-4 md:p-6"><div className="font-bold text-gray-900">{item.name || item.inventoryNumber || item.email}</div></td><td className="p-4 md:p-6 hidden md:table-cell"><div className="text-xs text-gray-500">{item.category || item.role || formatDate(item.startDate)}</div></td><td className="p-4 md:p-6 text-right whitespace-nowrap"><button onClick={() => { setEditingId(item.id); setIsAdding(true); }} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg transition-all"><Pencil size={16}/></button><button onClick={() => { if(confirm('Excluir?')) { /* call delete logic */ } }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-all"><Trash2 size={16}/></button></td></tr>)))}</tbody>
                    </table>
                </div>
            </div>
          </>
      )}
    </div>
  );
};
