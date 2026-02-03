
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { RentalList } from './components/RentalList';
import { RentalForm } from './components/RentalForm';
import { ConfigurationView } from './components/ConfigurationView';
import { ReportView } from './components/ReportView';
import { ProfileView } from './components/ProfileView';
import { LoginScreen } from './components/LoginScreen';
import { PinsPatchesView } from './components/PinsPatchesView';
import { Rental, ViewState, RentalStatus, Equipment, User, Sector, Event, RentalAccessories, EquipmentItem, Channel, MerchandiseItem } from './types';
import { Radio, AlertTriangle, Activity, Package, PieChart, Headphones, Battery, Zap, CheckCircle, Loader, Lightbulb, RefreshCw, Menu, Tag, AlertCircle } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase, supabaseUrl, supabaseKey } from './services/supabaseClient';
import { api } from './services/database';
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_LOGO } from './constants';

const InventoryStatusChart = ({ equipment, rentals, items }: { equipment: Equipment[], rentals: Rental[], currentEvent: Event | null, items: EquipmentItem[] }) => {
  const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);

  const getStats = (itemName: string) => {
      // Total de equipamentos físicos cadastrados nesta categoria
      const totalInventory = equipment.filter(e => e.category === itemName).length;
      
      // Cálculo preciso de itens locados cruzando serialNumber (Patrimônio) com a categoria do equipamento original
      let totalRented = 0;
      activeRentals.forEach(rental => {
          const eq = equipment.find(e => e.inventoryNumber === rental.serialNumber);
          if (eq && eq.category === itemName) {
              totalRented++;
          }
      });

      const available = Math.max(0, totalInventory - totalRented);
      const percentUsed = totalInventory > 0 ? (totalRented / totalInventory) * 100 : 0;
      return { totalInventory, totalRented, available, percentUsed };
  };

  const getIcon = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('radio') || n.includes('rádio')) return Radio;
      if (n.includes('fone') || n.includes('headset')) return Headphones;
      if (n.includes('power') || n.includes('bateria')) return Battery;
      if (n.includes('luz') || n.includes('lanterna')) return Lightbulb;
      return Package;
  };

  return (
    <div className="flex flex-col justify-center h-full gap-5 px-2">
       {items.length > 0 ? items.slice(0, 4).map((item) => {
           const stats = getStats(item.name);
           const Icon = getIcon(item.name);
           return (
               <div key={item.id} className="space-y-2">
                   <div className="flex justify-between items-end">
                       <div className="flex items-center gap-2 text-gray-700">
                           <Icon size={16} className="text-brand-600" />
                           <span className="font-bold text-sm">{item.name}</span>
                       </div>
                       <div className="text-xs text-gray-500 font-mono">
                           <span className="text-brand-600 font-bold">{stats.totalRented}</span> em uso / <span className="text-gray-900">{stats.available}</span> disp.
                       </div>
                   </div>
                   <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300 relative">
                       <div className={`h-full rounded-full transition-all duration-700 ${stats.percentUsed > 90 ? 'bg-red-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(stats.percentUsed, 100)}%` }} />
                   </div>
                   <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                       <span>Estoque: {stats.totalInventory}</span>
                       <span>{Math.round(stats.percentUsed)}% Alocado</span>
                   </div>
               </div>
           );
       }) : <div className="text-center text-gray-400 text-sm py-10">Nenhum ITEM cadastrado.</div>}
    </div>
  );
};

const COLORS = ['#f59e0b', '#b45309', '#1f2937', '#6b7280', '#d97706', '#fbbf24', '#9ca3af', '#4b5563'];

const SectorAllocationChart = ({ data }: { data: { name: string, count: number }[] }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400 text-xs">Sem dados de alocação</div>;
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  return (
    <div className="h-full w-full flex items-center gap-2">
       <div className="w-1/2 h-full relative">
         <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="count" stroke="none">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} itens`, 'Qtd']} />
            </RechartsPieChart>
         </ResponsiveContainer>
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-xl font-bold text-gray-900">{total}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</div>
         </div>
       </div>
       <div className="w-1/2 h-[85%] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
            {data.map((item, index) => (
               <div key={index} className="flex items-center justify-between text-xs group p-1 hover:bg-gray-50 rounded transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-gray-600 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{Math.round((item.count/total)*100)}%</span>
               </div>
            ))}
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [configTab, setConfigTab] = useState<'events' | 'inventory' | 'sectors' | 'users' | 'channels' | 'stock' | 'system'>('events');
  const [configInventorySubTab, setConfigInventorySubTab] = useState<'ativos' | 'itens'>('ativos');

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [merchandiseList, setMerchandiseList] = useState<MerchandiseItem[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  
  const loadAndVerifyUser = async (session: any) => {
     if (!session?.user) {
        setIsAuthLoading(false);
        return;
     }
     try {
         const allUsers = await api.fetchUsers();
         let profile = allUsers.find(u => u.id === session.user.id);
         if (!profile) {
             const isFirstUser = allUsers.length === 0;
             const recoveryProfile: User = { 
                id: session.user.id, 
                name: session.user.email?.split('@')[0] || 'Admin', 
                email: session.user.email || '', 
                role: isFirstUser ? 'ADMIN' : 'USER', 
                avatarInitials: (session.user.email || 'AD').substring(0,2).toUpperCase(),
                isActive: true
             };
             try { 
                profile = await api.createProfile(recoveryProfile); 
                setUsers(prev => [...prev, profile!]); 
             } catch { 
                profile = { ...recoveryProfile, role: isFirstUser ? 'ADMIN' : 'USER' }; 
             }
         }
         
         if (profile && !profile.isActive) {
             alert("Sua conta está desativada. Entre em contato com o administrador.");
             await supabase.auth.signOut();
             setCurrentUser(null);
         } else {
             setCurrentUser(profile || null);
         }
     } catch (e) { 
         console.error("Error profile", e); 
     } finally {
         setIsAuthLoading(false);
     }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { 
        if (session?.user) loadAndVerifyUser(session); 
        else setIsAuthLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadAndVerifyUser(session);
      else {
          setCurrentUser(null);
          setIsAuthLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser?.id]); 

  const fetchData = async () => {
      setIsLoadingData(true);
      try {
          const loadSafe = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => { 
              try { return await promise || fallback; } catch (e) { return fallback; } 
          };
          const [loadedEvents, loadedEq, loadedSectors, loadedRentals, loadedUsers, loadedItems, loadedChannels, loadedMerch] = await Promise.all([
              loadSafe(api.fetchEvents(), []),
              loadSafe(api.fetchEquipment(), []),
              loadSafe(api.fetchSectors(), []),
              loadSafe(api.fetchRentals(), []),
              loadSafe(api.fetchUsers(), []),
              loadSafe(api.fetchItems(), []),
              loadSafe(api.fetchChannels(), []),
              loadSafe(api.fetchMerchandise(), [])
          ]);
          setEvents(loadedEvents);
          setEquipmentList(loadedEq);
          setSectors(loadedSectors);
          setRentals(loadedRentals);
          setItems(loadedItems);
          setUsers(loadedUsers);
          setChannels(loadedChannels);
          setMerchandiseList(loadedMerch);
          const active = loadedEvents.find(e => e.isActive) || (loadedEvents.length > 0 ? loadedEvents[0] : null);
          if (active) setCurrentEventId(active.id);
      } finally { setIsLoadingData(false); }
  };

  const currentEvent = useMemo(() => events.find(e => e.id === currentEventId) || null, [events, currentEventId]);
  const eventRentals = useMemo(() => currentEventId ? rentals.filter(r => r.eventId === currentEventId) : rentals, [rentals, currentEventId]);
  
  const stats = useMemo(() => {
    const active = eventRentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);
    const totalEquipment = equipmentList.length;
    return {
      totalActive: active.length,
      totalOverdue: eventRentals.filter(r => r.status === RentalStatus.OVERDUE).length,
      totalPartial: eventRentals.filter(r => r.status === RentalStatus.PARTIAL).length,
      utilizationRate: totalEquipment > 0 ? Math.round((active.length / totalEquipment) * 100) : 0
    };
  }, [eventRentals, equipmentList]);

  const sectorAllocation = useMemo(() => {
    const counts: Record<string, number> = {};
    eventRentals.filter(r => r.status !== RentalStatus.COMPLETED).forEach(r => { counts[r.clientCompany] = (counts[r.clientCompany] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [eventRentals]);

  const handleCreateRental = async (data: Omit<Rental, 'id' | 'status'>) => {
    if (!currentUser) return;
    try { 
        const newRental = await api.createRental(data, currentUser.id); 
        setRentals(prev => [newRental, ...prev]); 
    } catch { 
        alert("Erro ao salvar."); 
    }
  };

  const handleReturn = async (id: string, returnedItems: RentalAccessories) => {
    const r = rentals.find(item => item.id === id);
    if (!r) return;
    let isComplete = true;
    if (r.accessories) { Object.keys(r.accessories).forEach((key: any) => { if (r.accessories[key as keyof RentalAccessories] && !returnedItems[key as keyof RentalAccessories]) isComplete = false; }); }
    try { const updated = await api.returnRental(id, isComplete ? RentalStatus.COMPLETED : RentalStatus.PARTIAL, returnedItems); setRentals(prev => prev.map(item => item.id === id ? updated : item)); } catch { alert("Erro na devolução."); }
  };

  const renderContent = () => {
    if (isLoadingData && rentals.length === 0) return <div className="h-full flex items-center justify-center text-brand-600 gap-4"><Loader className="animate-spin" size={32}/> <span className="font-bold font-mono tracking-tighter uppercase">Sincronizando Banco de Dados...</span></div>;
    
    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 relative">
            {isLoadingData && <div className="absolute top-0 right-0 p-2 text-brand-500 flex items-center gap-2 text-xs font-bold animate-pulse"><RefreshCw className="animate-spin" size={14}/> Sincronizando...</div>}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
               <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Central</h2>
                  <p className="text-gray-500 mt-1 text-sm md:text-base">{currentEvent ? <>Evento Selecionado: <span className="text-brand-600 font-black">{currentEvent.name}</span></> : "Selecione um evento nas configurações."}</p>
               </div>
            </div>
            
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <StatCard title="Em Uso" value={stats.totalActive} icon={<Radio size={20} />} color="brand" />
              <StatCard title="Atrasos" value={stats.totalOverdue} icon={<AlertTriangle size={20} />} color="red" />
              <StatCard title="Parciais" value={stats.totalPartial} icon={<CheckCircle size={20} />} color="blue" />
              <StatCard title="% Utilização" value={`${stats.utilizationRate}%`} icon={<Activity size={20} />} color="green" />
            </div>

            {/* MERCHANDISE STOCK SECTION */}
            <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
                    <Tag size={16} /> Estoque de Materiais
                </h3>
                {merchandiseList.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {merchandiseList.map(item => {
                            const isLow = item.currentStock <= item.minThreshold;
                            return (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-brand-300 transition-colors">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.name}</p>
                                        <div className="flex items-end gap-1.5">
                                            <p className={`text-2xl font-black ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                                                {item.currentStock}
                                            </p>
                                            {isLow && <AlertCircle size={14} className="text-red-500 mb-1.5 animate-pulse" />}
                                        </div>
                                    </div>
                                    <div className={`p-2.5 rounded-lg ${isLow ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                                        <Package size={20} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-6 text-center text-gray-400 text-sm">
                        Nenhum item de estoque cadastrado. Vá em Configurações &gt; Estoque.
                    </div>
                )}
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-80">
                <h3 className="text-[11px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2 tracking-widest"><Zap size={14} className="text-brand-600" /> Inventário por ITEM</h3>
                <div className="flex-1 mt-2"><InventoryStatusChart equipment={equipmentList} rentals={eventRentals} currentEvent={currentEvent} items={items} /></div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-80">
                 <h3 className="text-[11px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2 tracking-widest"><PieChart size={14} className="text-brand-600" /> Alocação por Setor</h3>
                 <div className="flex-1 overflow-hidden h-full"><SectorAllocationChart data={sectorAllocation} /></div>
              </div>
            </div>
          </div>
        );
      case 'rentals': return <RentalList rentals={eventRentals} onReturn={handleReturn} filter="active" />;
      case 'history': return <RentalList rentals={eventRentals} onReturn={handleReturn} filter="history" />;
      case 'reports': return <ReportView rentals={rentals} equipment={equipmentList} currentUser={currentUser} currentEvent={currentEvent} sectors={sectors} />;
      case 'new-rental': return <RentalForm onCancel={() => setView('rentals')} onSubmit={handleCreateRental} availableEquipment={equipmentList} sectors={sectors} activeEventId={currentEventId || ''} />;
      case 'pins-patches': return <PinsPatchesView currentUser={currentUser} />;
      case 'settings':
        return <ConfigurationView 
            equipmentList={equipmentList} 
            onAddEquipment={async (d) => { await api.createEquipment(d); fetchData(); }} 
            onUpdateEquipment={async (d) => { await api.updateEquipment(d); fetchData(); }} 
            onDeleteEquipment={async (id) => { await api.deleteEquipment(id); fetchData(); }}
            itemList={items} 
            onAddItem={async (n) => { if (currentUser) { await api.createItem(n, currentUser.id); await fetchData(); } }} 
            onUpdateItem={async (id, n) => { await api.updateItem(id, n); await fetchData(); }} 
            onDeleteItem={async (id) => { await api.deleteItem(id); await fetchData(); }}
            sectorList={sectors} 
            onAddSector={async (d) => { await api.createSector(d); await fetchData(); }} 
            onUpdateSector={async (d) => { await api.updateSector(d); await fetchData(); }} 
            onDeleteSector={async (id) => { await api.deleteSector(id); await fetchData(); }}
            channelList={channels}
            onAddChannel={async (d) => { await api.createChannel(d); await fetchData(); }}
            onUpdateChannel={async (d) => { await api.updateChannel(d); await fetchData(); }}
            onDeleteChannel={async (id) => { await api.deleteChannel(id); await fetchData(); }}
            userList={users} 
            onAddUser={async (d) => { 
                const tempClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
                const { data } = await tempClient.auth.signUp({ email: d.email, password: d.password! });
                if (data.user) await api.createProfile({ id: data.user.id, name: d.name, email: d.email, role: d.role, avatarInitials: d.name.substring(0,2).toUpperCase(), isActive: d.isActive });
                fetchData();
            }} 
            onUpdateUser={async (d) => { 
                await api.updateProfile(d);
                if (d.password) {
                   if (d.id === currentUser?.id) {
                      await supabase.auth.updateUser({ password: d.password });
                   } else {
                      alert("Nota: A troca de senha de terceiros requer integração administrativa dedicada.");
                   }
                }
                await fetchData(); 
            }} 
            onDeleteUser={() => {}} 
            eventList={events} 
            onAddEvent={async (d) => { await api.createEvent(d); await fetchData(); }} 
            onUpdateEvent={async (d) => { await api.updateEvent(d); await fetchData(); }} 
            onDeleteEvent={() => {}}
            activeTab={configTab}
            setActiveTab={setConfigTab}
            inventorySubTab={configInventorySubTab}
            setInventorySubTab={setConfigInventorySubTab}
        />;
      case 'profile':
        return <ProfileView 
            user={currentUser} 
            onUpdateProfile={async (data) => { 
              await api.updateProfile({ ...currentUser!, ...data });
              fetchData();
            }}
            onUpdatePassword={async (newPassword) => {
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) throw error;
            }}
        />;
      default: return <div>View not found</div>;
    }
  };

  if (isAuthLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-brand-600 gap-3"><Loader className="animate-spin" size={32}/> <span className="font-bold font-mono uppercase tracking-tighter">Autenticando...</span></div>;

  if (!currentUser) return <LoginScreen onLogin={async (email, password) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; }} />;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row">
      {/* MOBILE TOP BAR */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:text-brand-600 transition-colors">
                  <Menu size={24} />
              </button>
              <img src={SYSTEM_LOGO} alt="Logo" className="h-8 w-auto" />
          </div>
          <div className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-1 rounded border border-brand-100">
              {currentUser.role}
          </div>
      </header>

      <Sidebar 
        currentView={view} 
        onChangeView={setView} 
        currentUser={currentUser} 
        onLogout={() => supabase.auth.signOut()} 
        currentEvent={currentEvent} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onProfileClick={() => { setView('profile'); setIsSidebarOpen(false); }}
      />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto min-h-[calc(100vh-64px)] md:h-screen relative">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};
export default App;
