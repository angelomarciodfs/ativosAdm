
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { RentalList } from './components/RentalList';
import { RentalForm } from './components/RentalForm';
import { ConfigurationView } from './components/ConfigurationView';
import { ReportView } from './components/ReportView';
import { LoginScreen } from './components/LoginScreen';
import { SYSTEM_LOGO } from './constants';
import { Rental, ViewState, RentalStatus, Equipment, User, Sector, Event, RentalAccessories, Category } from './types';
import { Radio, AlertTriangle, Activity, Package, PieChart, Headphones, Battery, Zap, Menu, CheckCircle, Loader, X, Lock, Save, User as UserIcon, KeyRound, Tags, Lightbulb } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase, isConfigured, supabaseUrl, supabaseKey } from './services/supabaseClient';
import { api } from './services/database';
import { createClient } from '@supabase/supabase-js';

const InventoryStatusChart = ({ equipment, rentals, currentEvent, categories }: { equipment: Equipment[], rentals: Rental[], currentEvent: Event | null, categories: Category[] }) => {
  const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);

  const getStats = (categoryName: string) => {
      const totalInventory = equipment.filter(e => e.category === categoryName).length;
      let totalRented = 0;
      
      if (categoryName === 'Radio') {
          totalRented = activeRentals.length; 
      } else {
          totalRented = activeRentals.filter(r => r.radioModel.includes(categoryName)).length;
      }
      
      const available = Math.max(0, totalInventory - totalRented);
      const percentUsed = totalInventory > 0 ? (totalRented / totalInventory) * 100 : 0;
      return { totalInventory, totalRented, available, percentUsed };
  };

  const getIcon = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('radio')) return Radio;
      if (n.includes('fone') || n.includes('headset')) return Headphones;
      if (n.includes('power') || n.includes('bateria')) return Battery;
      if (n.includes('luz') || n.includes('lanterna')) return Lightbulb;
      return Package;
  };

  return (
    <div className="flex flex-col justify-center h-full gap-5 px-2">
       {categories.length > 0 ? categories.slice(0, 4).map((cat) => {
           const stats = getStats(cat.name);
           const Icon = getIcon(cat.name);
           return (
               <div key={cat.id} className="space-y-2">
                   <div className="flex justify-between items-end">
                       <div className="flex items-center gap-2 text-gray-700">
                           <Icon size={16} className="text-brand-600" />
                           <span className="font-bold text-sm">{cat.name}</span>
                       </div>
                       <div className="text-xs text-gray-500 font-mono">
                           <span className="text-brand-600 font-bold">{stats.totalRented}</span> em uso / <span className="text-gray-900">{stats.available}</span> disp.
                       </div>
                   </div>
                   
                   <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300 relative">
                       <div 
                         className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-1 ${stats.percentUsed > 90 ? 'bg-red-500' : 'bg-brand-500'}`}
                         style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
                       >
                       </div>
                   </div>
                   <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                       <span>Estoque: {stats.totalInventory}</span>
                       <span>{Math.round(stats.percentUsed)}% Alocado</span>
                   </div>
               </div>
           );
       }) : (
           <div className="text-center text-gray-400 text-sm py-10">Cadastre Itens para ver métricas.</div>
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
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="count" stroke="none">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} itens`, 'Qtd']} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
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

// --- PASSWORD RECOVERY MODAL ---
interface PasswordRecoveryModalProps { onClose: () => void; }
const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ onClose }) => {
    const [pass, setPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(''); setIsError(false);
        if (pass.length < 6) { setMsg('Mínimo 6 caracteres.'); setIsError(true); return; }
        if (pass !== confirm) { setMsg('Senhas não conferem.'); setIsError(true); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: pass });
            if (error) throw error;
            setMsg('Senha redefinida com sucesso!');
            setTimeout(() => { onClose(); window.history.replaceState(null, '', window.location.pathname); }, 2000);
        } catch (e: any) { setMsg(e.message || 'Erro ao redefinir.'); setIsError(true); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 border-t-4 border-brand-500">
                <div className="text-center mb-6"><h3 className="text-xl font-bold">Nova Senha</h3></div>
                <form onSubmit={handleSave} className="space-y-4">
                    <input type="password" required className="w-full bg-gray-50 border p-3 rounded-lg" value={pass} onChange={e => setPass(e.target.value)} placeholder="Nova Senha" />
                    <input type="password" required className="w-full bg-gray-50 border p-3 rounded-lg" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmar Senha" />
                    {msg && <div className={`p-3 rounded-lg text-xs font-bold text-center ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}
                    <button type="submit" disabled={loading} className="w-full py-3 bg-brand-500 text-white font-bold rounded-lg">{loading ? <Loader className="animate-spin m-auto"/> : 'Redefinir Senha'}</button>
                </form>
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  
  // Data States
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  
  const loadAndVerifyUser = async (session: any) => {
     if (!session?.user) return;
     try {
         const allUsers = await api.fetchUsers();
         let profile = allUsers.find(u => u.id === session.user.id);
         if (!profile) {
             const isFirstUser = allUsers.length === 0;
             const recoveryProfile: User = { id: session.user.id, name: session.user.email?.split('@')[0] || 'Admin', email: session.user.email || '', role: isFirstUser ? 'ADMIN' : 'USER', avatarInitials: (session.user.email || 'AD').substring(0,2).toUpperCase() };
             try { profile = await api.createProfile(recoveryProfile); setUsers(prev => [...prev, profile!]); } catch { profile = { ...recoveryProfile, role: 'ADMIN' }; }
         }
         setCurrentUser(profile);
     } catch (e) { console.error("Error profile", e); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session?.user) loadAndVerifyUser(session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) loadAndVerifyUser(session);
      else setCurrentUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser?.id]); 

  const fetchData = async () => {
      setIsLoadingData(true);
      try {
          const loadSafe = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => { 
              try { 
                  const result = await promise; 
                  return result || fallback;
              } catch (e) { 
                  console.error("Fetch failure", e);
                  return fallback; 
              } 
          };

          const [loadedEvents, loadedEq, loadedSectors, loadedRentals, loadedUsers, loadedCats] = await Promise.all([
              loadSafe(api.fetchEvents(), []),
              loadSafe(api.fetchEquipment(), []),
              loadSafe(api.fetchSectors(), []),
              loadSafe(api.fetchRentals(), []),
              loadSafe(api.fetchUsers(), []),
              loadSafe(api.fetchCategories(), [])
          ]);

          setEvents(loadedEvents);
          setEquipmentList(loadedEq);
          setSectors(loadedSectors);
          setRentals(loadedRentals);
          setCategories(loadedCats);
          setUsers(loadedUsers);
          
          const active = loadedEvents.find(e => e.isActive) || (loadedEvents.length > 0 ? loadedEvents[0] : null);
          if (active) setCurrentEventId(active.id);
      } catch (error) { 
          console.error("General Fetch Data Error", error); 
      } finally { 
          setIsLoadingData(false); 
      }
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
    try { const newRental = await api.createRental(data, currentUser.id); setRentals(prev => [newRental, ...prev]); setView('rentals'); } catch { alert("Erro ao salvar."); }
  };

  const handleReturn = async (id: string, returnedItems: RentalAccessories) => {
    const r = rentals.find(item => item.id === id);
    if (!r) return;
    let isComplete = true;
    if (r.accessories) { Object.keys(r.accessories).forEach((key: any) => { if (r.accessories[key as keyof RentalAccessories] && !returnedItems[key as keyof RentalAccessories]) isComplete = false; }); }
    try { const updated = await api.returnRental(id, isComplete ? RentalStatus.COMPLETED : RentalStatus.PARTIAL, returnedItems); setRentals(prev => prev.map(item => item.id === id ? updated : item)); } catch { alert("Erro na devolução."); }
  };

  const renderContent = () => {
    if (isLoadingData) return <div className="h-full flex items-center justify-center text-brand-600 gap-4"><Loader className="animate-spin" size={32}/> <span className="font-bold font-mono tracking-tighter">SINCRONIZANDO COM O SERVIDOR...</span></div>;
    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
               <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Central</h2>
                  <p className="text-gray-500 mt-1 text-sm md:text-base">
                      {currentEvent ? <>Evento Selecionado: <span className="text-brand-600 font-black">{currentEvent.name}</span></> : "Selecione um evento nas configurações."}
                  </p>
               </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <StatCard title="Em Uso" value={stats.totalActive} icon={<Radio size={20} />} color="brand" />
              <StatCard title="Atrasos" value={stats.totalOverdue} icon={<AlertTriangle size={20} />} color="red" />
              <StatCard title="Parciais" value={stats.totalPartial} icon={<CheckCircle size={20} />} color="blue" />
              <StatCard title="% Utilização" value={`${stats.utilizationRate}%`} icon={<Activity size={20} />} color="green" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-80">
                <h3 className="text-[11px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2 tracking-widest"><Zap size={14} className="text-brand-600" /> Inventário por ITEM</h3>
                <div className="flex-1 mt-2"><InventoryStatusChart equipment={equipmentList} rentals={eventRentals} currentEvent={currentEvent} categories={categories} /></div>
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
      case 'settings':
        return <ConfigurationView 
            equipmentList={equipmentList} 
            onAddEquipment={async (d) => { await api.createEquipment(d); fetchData(); }} 
            onUpdateEquipment={async (d) => { await api.updateEquipment(d); fetchData(); }} 
            onDeleteEquipment={async (id) => { await api.deleteEquipment(id); fetchData(); }}
            categoryList={categories} 
            onAddCategory={async (n) => { if(currentUser) await api.createCategory(n, currentUser.id); fetchData(); }} 
            onUpdateCategory={async (id, n) => { await api.updateCategory(id, n); fetchData(); }} 
            onDeleteCategory={async (id) => { await api.deleteCategory(id); fetchData(); }}
            sectorList={sectors} 
            onAddSector={async (d) => { await api.createSector(d); fetchData(); }} 
            onUpdateSector={async (d) => { await api.updateSector(d); fetchData(); }} 
            onDeleteSector={async (id) => { await api.deleteSector(id); fetchData(); }}
            userList={users} 
            onAddUser={async (d) => { 
                const tempClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
                const { data } = await tempClient.auth.signUp({ email: d.email, password: d.password! });
                if (data.user) await api.createProfile({ id: data.user.id, name: d.name, email: d.email, role: d.role, avatarInitials: d.name.substring(0,2).toUpperCase() });
                fetchData();
            }} 
            onUpdateUser={async (d) => { await api.updateProfile(d); fetchData(); }} 
            onDeleteUser={() => {}} 
            eventList={events} 
            onAddEvent={async (d) => { await api.createEvent(d); fetchData(); }} 
            onUpdateEvent={async (d) => { await api.updateEvent(d); fetchData(); }} 
            onDeleteEvent={() => {}}
        />;
      default: return <div>View not found</div>;
    }
  };

  if (!currentUser) return <LoginScreen onLogin={async (e, p) => { const { error } = await supabase.auth.signInWithPassword({ email: e, password: p }); if (error) throw error; }} />;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row">
      <Sidebar currentView={view} onChangeView={setView} currentUser={currentUser} onLogout={() => supabase.auth.signOut()} onProfileClick={() => setIsProfileModalOpen(true)} currentEvent={currentEvent} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen"><div className="max-w-7xl mx-auto">{renderContent()}</div></main>
      {isRecoveryModalOpen && <PasswordRecoveryModal onClose={() => setIsRecoveryModalOpen(false)} />}
    </div>
  );
};
export default App;
