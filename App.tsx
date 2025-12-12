import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { RentalList } from './components/RentalList';
import { RentalForm } from './components/RentalForm';
import { ConfigurationView } from './components/ConfigurationView';
import { ReportView } from './components/ReportView';
import { LoginScreen } from './components/LoginScreen';
import { SYSTEM_LOGO } from './constants';
import { Rental, ViewState, RentalStatus, Equipment, User, Sector, Event, RentalAccessories } from './types';
import { Radio, AlertTriangle, Activity, Package, PieChart, Headphones, Battery, Zap, Menu, CheckCircle, Loader } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase, isConfigured } from './services/supabaseClient';
import { api } from './services/database';

const InventoryStatusChart = ({ equipment, rentals, currentEvent }: { equipment: Equipment[], rentals: Rental[], currentEvent: Event | null }) => {
  const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);

  const getStats = (category: string, rentalAccessoryKey?: keyof typeof activeRentals[0]['accessories']) => {
      const totalInventory = equipment.filter(e => e.category === category).length;
      let totalRented = 0;
      if (category === 'Radio') {
          totalRented = activeRentals.length; 
      } else if (rentalAccessoryKey) {
          totalRented = activeRentals.filter(r => {
              const wasAllocated = r.accessories && r.accessories[rentalAccessoryKey];
              const wasReturned = r.returnedAccessories && r.returnedAccessories[rentalAccessoryKey];
              return wasAllocated && !wasReturned;
          }).length;
      }
      const available = Math.max(0, totalInventory - totalRented);
      const percentUsed = totalInventory > 0 ? (totalRented / totalInventory) * 100 : 0;
      return { totalInventory, totalRented, available, percentUsed };
  };

  const categories = [
      { id: 'Radio', label: 'Rádios', icon: Radio, stats: getStats('Radio') },
      { id: 'Headset', label: 'Fones', icon: Headphones, stats: getStats('Headset', 'headset') },
      { id: 'PowerBank', label: 'Power Banks', icon: Battery, stats: getStats('PowerBank', 'powerBank') },
  ];

  return (
    <div className="flex flex-col justify-center h-full gap-5 px-2">
       {categories.map((cat) => (
           <div key={cat.id} className="space-y-2">
               <div className="flex justify-between items-end">
                   <div className="flex items-center gap-2 text-gray-700">
                       <cat.icon size={16} className="text-brand-600" />
                       <span className="font-bold text-sm">{cat.label}</span>
                   </div>
                   <div className="text-xs text-gray-500 font-mono">
                       <span className="text-brand-600 font-bold">{cat.stats.totalRented}</span> em uso / <span className="text-gray-900">{cat.stats.available}</span> disp.
                   </div>
               </div>
               
               <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300 relative">
                   <div 
                     className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-1 ${cat.stats.percentUsed > 90 ? 'bg-red-500' : 'bg-brand-500'}`}
                     style={{ width: `${Math.min(cat.stats.percentUsed, 100)}%` }}
                   >
                   </div>
               </div>
               <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                   <span>Total Estoque: {cat.stats.totalInventory}</span>
                   <span>{Math.round(cat.stats.percentUsed)}% Alocado</span>
               </div>
           </div>
       ))}
       {!currentEvent && (
           <div className="text-center text-xs text-red-500 mt-2 bg-red-50 p-1 rounded border border-red-100">
               * Nenhum evento selecionado. Mostrando dados globais.
           </div>
       )}
    </div>
  );
};

const COLORS = ['#f59e0b', '#b45309', '#1f2937', '#6b7280', '#d97706', '#fbbf24', '#9ca3af', '#4b5563'];

const SectorAllocationChart = ({ data }: { data: { name: string, count: number }[] }) => {
  if (!data || data.length === 0) {
     return <div className="h-full flex items-center justify-center text-gray-400 text-xs">Sem dados de alocação</div>;
  }
  
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="h-full w-full flex items-center gap-2">
       <div className="w-1/2 h-full relative">
         <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="count"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 formatter={(value: number) => [`${value} itens`, 'Qtd']}
                 contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                 labelStyle={{ display: 'none' }}
              />
            </RechartsPieChart>
         </ResponsiveContainer>
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-xl font-bold text-gray-900">{total}</div>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</div>
         </div>
       </div>

       <div className="w-1/2 h-[85%] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col gap-2">
            {data.map((item, index) => (
               <div key={index} className="flex items-center justify-between text-xs group p-1 hover:bg-gray-50 rounded transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-gray-600 font-medium truncate" title={item.name}>{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">{Math.round((item.count/total)*100)}%</span>
               </div>
            ))}
          </div>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Data States
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  const defaultEvent = useMemo(() => events.filter(e => e.isActive).slice(-1)[0] || null, [events]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  
  useEffect(() => {
    // Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
          setCurrentUser({
              id: session.user.id,
              name: session.user.email || 'Usuário',
              email: session.user.email || '',
              role: 'ADMIN', // Default para admin
              avatarInitials: (session.user.email || 'US').substring(0,2).toUpperCase()
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
          setCurrentUser({
              id: session.user.id,
              name: session.user.email || 'Usuário',
              email: session.user.email || '',
              role: 'ADMIN',
              avatarInitials: (session.user.email || 'US').substring(0,2).toUpperCase()
          });
      } else {
          setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data on Auth
  useEffect(() => {
    if (currentUser) {
        fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
      setIsLoadingData(true);
      try {
          // Tentamos buscar do banco
          const [loadedEvents, loadedEq, loadedSectors, loadedRentals, loadedUsers] = await Promise.all([
              api.fetchEvents(),
              api.fetchEquipment(),
              api.fetchSectors(),
              api.fetchRentals(),
              api.fetchUsers()
          ]);
          
          setEvents(loadedEvents);
          setEquipmentList(loadedEq);
          setSectors(loadedSectors);
          setRentals(loadedRentals);
          if(loadedUsers.length > 0) setUsers(loadedUsers);
          
          const active = loadedEvents.find(e => e.isActive);
          if (active) setCurrentEventId(active.id);
          else if (loadedEvents.length > 0) setCurrentEventId(loadedEvents[0].id);

      } catch (error) {
          console.error("Erro ao carregar dados. Verifique a conexão com o Supabase.", error);
          // Fallback silencioso para UI não quebrar completamente
          setEvents([]);
      } finally {
          setIsLoadingData(false);
      }
  };

  useEffect(() => {
     if (!currentEventId && defaultEvent) {
         setCurrentEventId(defaultEvent.id);
     }
  }, [defaultEvent, currentEventId]);

  const currentEvent = useMemo(() => events.find(e => e.id === currentEventId) || null, [events, currentEventId]);

  const eventRentals = useMemo(() => {
      if (!currentEventId) return rentals; 
      return rentals.filter(r => r.eventId === currentEventId);
  }, [rentals, currentEventId]);

  const stats = useMemo(() => {
    const active = eventRentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);
    const overdue = eventRentals.filter(r => r.status === RentalStatus.OVERDUE);
    const partial = eventRentals.filter(r => r.status === RentalStatus.PARTIAL);
    const completed = eventRentals.filter(r => r.status === RentalStatus.COMPLETED);
    
    const totalEquipment = equipmentList.length;
    const utilizationRate = totalEquipment > 0 ? Math.round((active.length / totalEquipment) * 100) : 0;

    return {
      totalActive: active.length,
      totalOverdue: overdue.length,
      totalPartial: partial.length,
      totalCompleted: completed.length,
      utilizationRate,
      inventorySize: totalEquipment
    };
  }, [eventRentals, equipmentList]);

  const sectorAllocation = useMemo(() => {
    const counts: Record<string, number> = {};
    const activeRentals = eventRentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);
    activeRentals.forEach(r => {
      const sectorName = r.clientCompany || 'Outros';
      counts[sectorName] = (counts[sectorName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [eventRentals]);

  // Handlers
  const handleLogout = async () => { 
      await supabase.auth.signOut();
      setCurrentUser(null); 
      setView('dashboard'); 
  };
  
  const handleLogin = async (email: string, pass: string) => {
     const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
     if (error) throw error;
  };

  const handleRegister = async (email: string, pass: string) => {
      const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
      });
      if (error) throw error;
      if (data.user) {
          alert('Conta criada com sucesso! Se o login automático não ocorrer, tente entrar com suas credenciais.');
      }
  };

  const handleCreateRental = async (data: Omit<Rental, 'id' | 'status'>) => {
    if (!currentUser) return;
    try {
        const newRental = await api.createRental(data, currentUser.id);
        setRentals(prev => [newRental, ...prev]);
        setView('rentals');
    } catch (error) {
        console.error("Erro ao criar locação", error);
        alert("Erro ao salvar locação.");
    }
  };

  const handleReturn = async (id: string, returnedItems: RentalAccessories) => {
    const r = rentals.find(item => item.id === id);
    if (!r) return;

    let isComplete = true;
    if (r.accessories) {
        (Object.keys(r.accessories) as Array<keyof RentalAccessories>).forEach(key => {
            if (r.accessories[key] && !returnedItems[key]) {
                isComplete = false;
            }
        });
    }

    const newStatus = isComplete ? RentalStatus.COMPLETED : RentalStatus.PARTIAL;

    try {
        const updatedRental = await api.returnRental(id, newStatus, returnedItems);
        setRentals(prev => prev.map(item => item.id === id ? updatedRental : item));
    } catch (error) {
        console.error("Erro ao devolver", error);
        alert("Erro ao processar devolução.");
    }
  };

  const handleAddEquipment = async (d: Omit<Equipment, 'id'>) => {
      const newItem = await api.createEquipment(d);
      setEquipmentList(prev => [...prev, newItem]);
  };
  const handleUpdateEquipment = (d: Equipment) => setEquipmentList(equipmentList.map(i => i.id === d.id ? d : i));
  const handleDeleteEquipment = (id: string) => setEquipmentList(equipmentList.filter(i => i.id !== id));

  const handleAddSector = async (d: Omit<Sector, 'id'>) => {
      const newItem = await api.createSector(d);
      setSectors(prev => [...prev, newItem]);
  };
  const handleUpdateSector = (d: Sector) => setSectors(sectors.map(i => i.id === d.id ? d : i));
  const handleDeleteSector = (id: string) => setSectors(sectors.filter(i => i.id !== id));

  const handleAddUser = (d: Omit<User, 'id' | 'avatarInitials'>) => setUsers([...users, {...d, id: `temp-${Math.random()}`, avatarInitials: '??'}]); 
  const handleUpdateUser = (d: User) => setUsers(users.map(i => i.id === d.id ? d : i));
  const handleDeleteUser = (id: string) => setUsers(users.filter(i => i.id !== id));

  const handleAddEvent = async (d: Omit<Event, 'id'>) => {
      const newItem = await api.createEvent(d);
      setEvents(prev => [...prev, newItem]);
      if(newItem.isActive) setCurrentEventId(newItem.id);
  };
  const handleUpdateEvent = async (d: Event) => {
      const updated = await api.updateEvent(d);
      setEvents(events.map(i => i.id === d.id ? updated : i));
  };
  const handleDeleteEvent = (id: string) => setEvents(events.filter(i => i.id !== id));

  const handleViewChange = (newView: ViewState) => {
    setView(newView);
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    if (isLoadingData) {
        return <div className="h-full flex items-center justify-center text-gray-400 gap-2"><Loader className="animate-spin"/> Carregando dados...</div>;
    }

    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
               <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
                  <p className="text-gray-500 mt-1 text-sm md:text-base">
                      {currentEvent 
                        ? <>Evento: <span className="text-brand-600 font-bold">{currentEvent.name}</span></> 
                        : "Selecione um evento para ver métricas"}
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <StatCard title="Em Uso" value={stats.totalActive} icon={<Radio size={20} />} color="brand" />
              <StatCard title="Atrasos" value={stats.totalOverdue} icon={<AlertTriangle size={20} />} color="red" trend={stats.totalOverdue > 0 ? "!" : ""} trendUp={false} />
              <StatCard title="Parciais" value={stats.totalPartial} icon={<CheckCircle size={20} />} color="blue" />
              <StatCard title="% Uso" value={`${stats.utilizationRate}%`} icon={<Activity size={20} />} color={stats.utilizationRate > 80 ? 'red' : 'green'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-80">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2"><Zap size={18} className="text-brand-600" /> Status do Inventário</h3>
                <div className="flex-1 mt-2">
                   <InventoryStatusChart equipment={equipmentList} rentals={eventRentals} currentEvent={currentEvent} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-80">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><PieChart size={18} className="text-brand-600" /> Alocação por Setor</h3>
                 <div className="flex-1 overflow-hidden h-full"><SectorAllocationChart data={sectorAllocation} /></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setView('new-rental')} disabled={!currentEvent} className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-left transition-all group flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                    <div><span className="text-brand-600 font-bold block mb-1">Nova Saída →</span><span className="text-gray-500 text-sm">Registrar saída para {currentEvent?.name || 'Evento'}</span></div>
                    <Radio className="text-gray-400 group-hover:text-brand-500 transition-colors" />
                </button>
                <button onClick={() => setView('rentals')} className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-left transition-all group flex items-center justify-between shadow-sm">
                    <div><span className="text-blue-600 font-bold block mb-1">Receber Devolução →</span><span className="text-gray-500 text-sm">Baixar equipamentos retornados</span></div>
                    <Package className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
            </div>
          </div>
        );
      case 'rentals':
        return <RentalList rentals={eventRentals} onReturn={handleReturn} filter="active" />;
      case 'history':
        return <RentalList rentals={eventRentals} onReturn={handleReturn} filter="history" />;
      case 'reports':
        return <ReportView rentals={rentals} equipment={equipmentList} currentUser={currentUser} currentEvent={currentEvent} sectors={sectors} />;
      case 'new-rental':
        if (!currentEventId) return <div className="p-8 text-center text-gray-500">Selecione ou crie um evento ativo nas configurações primeiro.</div>;
        return <RentalForm onCancel={() => setView('rentals')} onSubmit={handleCreateRental} availableEquipment={equipmentList} sectors={sectors} activeEventId={currentEventId} />;
      case 'settings':
        if (currentUser?.role !== 'ADMIN') return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return <ConfigurationView 
            equipmentList={equipmentList} onAddEquipment={handleAddEquipment} onUpdateEquipment={handleUpdateEquipment} onDeleteEquipment={handleDeleteEquipment}
            sectorList={sectors} onAddSector={handleAddSector} onUpdateSector={handleUpdateSector} onDeleteSector={handleDeleteSector}
            userList={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser}
            eventList={events} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent}
        />;
      default: return <div>View not found</div>;
    }
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row">
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <img src={SYSTEM_LOGO} alt="Logo" className="h-8 w-auto" />
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
             <Menu size={24} />
          </button>
      </div>

      <Sidebar 
        currentView={view} 
        onChangeView={handleViewChange} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        currentEvent={currentEvent}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-[calc(100vh-65px)] md:h-screen">
        {!isConfigured && (
             <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700 font-bold">Configuração Necessária</p>
                <p className="text-sm text-red-600">As variáveis de ambiente do Supabase (URL e Key) não foram encontradas.</p>
             </div>
        )}
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;