
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
          // Simplificação: Se não for rádio, contamos as locações ativas que referenciam um equipamento dessa categoria
          // Idealmente, a locação deveria ter o ID do equipamento diretamente
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
       {categories.slice(0, 4).map((cat) => {
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
       })}
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

// --- PASSWORD RECOVERY MODAL ---
interface PasswordRecoveryModalProps {
    onClose: () => void;
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ onClose }) => {
    const [pass, setPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(''); setIsError(false);

        if (pass.length < 6) {
            setMsg('A senha deve ter no mínimo 6 caracteres.'); setIsError(true); return;
        }
        if (pass !== confirm) {
            setMsg('As senhas não conferem.'); setIsError(true); return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: pass });
            if (error) throw error;
            
            setMsg('Senha redefinida com sucesso! Redirecionando...');
            setTimeout(() => {
                onClose();
                window.history.replaceState(null, '', window.location.pathname);
            }, 2000);
        } catch (e: any) {
            setMsg(e.message || 'Erro ao redefinir senha.'); setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 border-t-4 border-brand-500">
                <div className="p-6">
                    <div className="flex flex-col items-center mb-6 text-center">
                        <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mb-3">
                            <KeyRound size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Redefinição de Senha</h3>
                        <p className="text-gray-500 text-sm mt-1">Defina uma nova senha para acessar sua conta.</p>
                    </div>
                    
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-semibold">Nova Senha</label>
                            <input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500" value={pass} onChange={e => setPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-semibold">Confirmar Senha</label>
                            <input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" />
                        </div>
                        
                        {msg && (
                            <div className={`text-xs p-3 rounded-lg text-center font-bold ${isError ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                {msg}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg flex justify-center items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-70 mt-2">
                            {loading ? <Loader className="animate-spin" size={18} /> : 'Salvar Nova Senha'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- PROFILE MODAL COMPONENT ---
interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onUpdatePassword: (newPass: string) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdatePassword }) => {
    const [pass, setPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(''); setIsError(false);

        if (pass.length < 6) {
            setMsg('A senha deve ter no mínimo 6 caracteres.'); setIsError(true); return;
        }
        if (pass !== confirm) {
            setMsg('As senhas não conferem.'); setIsError(true); return;
        }

        setLoading(true);
        try {
            await onUpdatePassword(pass);
            setMsg('Senha atualizada com sucesso!');
            setPass(''); setConfirm('');
        } catch (e: any) {
            setMsg(e.message || 'Erro ao atualizar senha.'); setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <UserIcon className="text-brand-600" /> Meu Perfil
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                </div>
                <div className="p-6">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl font-bold border border-brand-200">
                            {user.avatarInitials}
                        </div>
                        <div>
                            <p className="font-bold text-lg text-gray-900">{user.name}</p>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 mt-1 inline-block">
                                {user.role === 'ADMIN' ? 'Administrador' : 'Operador'}
                            </span>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Alterar Senha</h4>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-semibold">Nova Senha</label>
                            <input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5" value={pass} onChange={e => setPass(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-semibold">Confirmar Senha</label>
                            <input type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5" value={confirm} onChange={e => setConfirm(e.target.value)} />
                        </div>
                        
                        {msg && (
                            <div className={`text-xs p-2 rounded text-center font-bold ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {msg}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg flex justify-center items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-70">
                            {loading ? <Loader className="animate-spin" size={16} /> : <><Lock size={16} /> Atualizar Senha</>}
                        </button>
                    </form>
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  
  // Data States
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  const defaultEvent = useMemo(() => events.filter(e => e.isActive).slice(-1)[0] || null, [events]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  
  const loadAndVerifyUser = async (session: any) => {
     if (!session?.user) return;
     try {
         let allUsers: User[] = [];
         try {
             allUsers = await api.fetchUsers();
         } catch (e) {
             console.warn("Could not fetch users.");
         }
         let profile = allUsers.find(u => u.id === session.user.id);
         if (!profile) {
             const isFirstUser = allUsers.length === 0;
             const recoveryProfile: User = {
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'Admin',
                email: session.user.email || '',
                role: isFirstUser ? 'ADMIN' : 'USER', 
                avatarInitials: (session.user.email || 'AD').substring(0,2).toUpperCase(),
                phone: '',
                preferredName: ''
             };
             try {
                 const created = await api.createProfile(recoveryProfile);
                 profile = created;
                 setUsers(prev => [...prev, created]);
             } catch (err: any) {
                 profile = { ...recoveryProfile, role: 'ADMIN' }; 
             }
         }
         setCurrentUser(profile);
     } catch (e) {
         console.error("Error loading user profile", e);
     }
  };

  useEffect(() => {
    const hash = window.location.hash;
    const isRecoveryHash = hash && hash.includes('type=recovery');
    if (isRecoveryHash) setIsRecoveryModalOpen(true);

    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      if (session?.user) loadAndVerifyUser(session);
    });

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: string, session: any) => {
      if (event === 'PASSWORD_RECOVERY' || isRecoveryHash) setIsRecoveryModalOpen(true);
      setSession(session);
      if (session?.user) loadAndVerifyUser(session);
      else setCurrentUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser?.id]); 

  const fetchData = async () => {
      setIsLoadingData(true);
      try {
          const loadSafe = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
              try { return await promise; } catch (e) { console.warn("Data load failed", e); return fallback; }
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
          if(loadedUsers.length > 0) setUsers(loadedUsers);
          
          if (currentUser) {
              const freshProfile = loadedUsers.find(u => u.id === currentUser.id);
              if (freshProfile && freshProfile.role !== currentUser.role) setCurrentUser(freshProfile);
          }

          const active = loadedEvents.find(e => e.isActive);
          if (active) setCurrentEventId(active.id);
          else if (loadedEvents.length > 0) setCurrentEventId(loadedEvents[0].id);
      } catch (error) {
          console.error("Erro fatal ao carregar dados.", error);
      } finally {
          setIsLoadingData(false);
      }
  };

  useEffect(() => {
     if (!currentEventId && defaultEvent) setCurrentEventId(defaultEvent.id);
  }, [defaultEvent, currentEventId]);

  const currentEvent = useMemo(() => events.find(e => e.id === currentEventId) || null, [events, currentEventId]);
  const eventRentals = useMemo(() => currentEventId ? rentals.filter(r => r.eventId === currentEventId) : rentals, [rentals, currentEventId]);

  const stats = useMemo(() => {
    const active = eventRentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE || r.status === RentalStatus.PARTIAL);
    const overdue = eventRentals.filter(r => r.status === RentalStatus.OVERDUE);
    const partial = eventRentals.filter(r => r.status === RentalStatus.PARTIAL);
    const completed = eventRentals.filter(r => r.status === RentalStatus.COMPLETED);
    const totalEquipment = equipmentList.length;
    const utilizationRate = totalEquipment > 0 ? Math.round((active.length / totalEquipment) * 100) : 0;
    return { totalActive: active.length, totalOverdue: overdue.length, totalPartial: partial.length, totalCompleted: completed.length, utilizationRate, inventorySize: totalEquipment };
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
  const handleLogout = async () => { await (supabase.auth as any).signOut(); setCurrentUser(null); setView('dashboard'); };
  const handleLogin = async (email: string, pass: string) => {
     const { error } = await (supabase.auth as any).signInWithPassword({ email, password: pass });
     if (error) throw error;
  };

  const handleCreateRental = async (data: Omit<Rental, 'id' | 'status'>) => {
    if (!currentUser) return;
    try {
        const newRental = await api.createRental(data, currentUser.id);
        setRentals(prev => [newRental, ...prev]);
        setView('rentals');
    } catch (error) {
        alert("Erro ao salvar locação.");
    }
  };

  const handleReturn = async (id: string, returnedItems: RentalAccessories) => {
    const r = rentals.find(item => item.id === id);
    if (!r) return;
    let isComplete = true;
    if (r.accessories) {
        (Object.keys(r.accessories) as Array<keyof RentalAccessories>).forEach(key => {
            if (r.accessories[key] && !returnedItems[key]) isComplete = false;
        });
    }
    const newStatus = isComplete ? RentalStatus.COMPLETED : RentalStatus.PARTIAL;
    try {
        const updatedRental = await api.returnRental(id, newStatus, returnedItems);
        setRentals(prev => prev.map(item => item.id === id ? updatedRental : item));
    } catch (error) {
        alert("Erro ao processar devolução.");
    }
  };

  // CRUD Equipment
  const handleAddEquipment = async (d: Omit<Equipment, 'id'>) => {
      const newItem = await api.createEquipment(d);
      setEquipmentList(prev => [...prev, newItem]);
  };
  const handleUpdateEquipment = async (d: Equipment) => {
      const updated = await api.updateEquipment(d);
      setEquipmentList(equipmentList.map(i => i.id === d.id ? updated : i));
  };
  const handleDeleteEquipment = async (id: string) => {
      await api.deleteEquipment(id);
      setEquipmentList(equipmentList.filter(i => i.id !== id));
  };

  // CRUD Category
  const handleAddCategory = async (name: string) => {
      const newItem = await api.createCategory(name);
      setCategories(prev => [...prev, newItem]);
  };
  const handleUpdateCategory = async (id: string, name: string) => {
      const updated = await api.updateCategory(id, name);
      setCategories(categories.map(c => c.id === id ? updated : c));
  };
  const handleDeleteCategory = async (id: string) => {
      await api.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
  };

  // CRUD Sector
  const handleAddSector = async (d: Omit<Sector, 'id'>) => {
      const newItem = await api.createSector(d);
      setSectors(prev => [...prev, newItem]);
  };
  const handleUpdateSector = async (d: Sector) => {
      const updated = await api.updateSector(d);
      setSectors(sectors.map(i => i.id === d.id ? updated : i));
  };
  const handleDeleteSector = async (id: string) => {
      await api.deleteSector(id);
      setSectors(sectors.filter(i => i.id !== id));
  };

  // CRUD Users
  const handleAddUser = async (d: Omit<User, 'id' | 'avatarInitials'> & { password?: string }) => {
      if (!d.password) return;
      try {
          const tempClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
          const { data: authData, error: authError } = await (tempClient.auth as any).signUp({ email: d.email, password: d.password });
          if (authError) throw authError;
          const newUser: User = { id: authData.user.id, name: d.name, email: d.email, role: d.role, phone: d.phone, preferredName: d.preferredName, avatarInitials: d.name.substring(0, 2).toUpperCase() };
          const createdProfile = await api.createProfile(newUser);
          setUsers(prev => [...prev, createdProfile]);
      } catch (error: any) { alert(`Erro: ${error.message}`); }
  };
  const handleUpdateUser = async (d: User) => {
      const updated = await api.updateProfile(d);
      setUsers(users.map(u => u.id === d.id ? updated : u));
  };

  // CRUD Events
  const handleAddEvent = async (d: Omit<Event, 'id'>) => {
      const newItem = await api.createEvent(d);
      setEvents(prev => [...prev, newItem]);
      if(newItem.isActive) setCurrentEventId(newItem.id);
  };
  const handleUpdateEvent = async (d: Event) => {
      const updated = await api.updateEvent(d);
      setEvents(events.map(i => i.id === d.id ? updated : i));
  };

  const renderContent = () => {
    if (isLoadingData) return <div className="h-full flex items-center justify-center text-gray-400 gap-2"><Loader className="animate-spin"/> Carregando...</div>;
    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
               <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
                  <p className="text-gray-500 mt-1 text-sm md:text-base">
                      {currentEvent ? <>Evento: <span className="text-brand-600 font-bold">{currentEvent.name}</span></> : "Selecione um evento"}
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
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2"><Zap size={18} className="text-brand-600" /> Inventário por Categoria</h3>
                <div className="flex-1 mt-2">
                   <InventoryStatusChart equipment={equipmentList} rentals={eventRentals} currentEvent={currentEvent} categories={categories} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-80">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><PieChart size={18} className="text-brand-600" /> Alocação por Setor</h3>
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
            equipmentList={equipmentList} onAddEquipment={handleAddEquipment} onUpdateEquipment={handleUpdateEquipment} onDeleteEquipment={handleDeleteEquipment}
            categoryList={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory}
            sectorList={sectors} onAddSector={handleAddSector} onUpdateSector={handleUpdateSector} onDeleteSector={handleDeleteSector}
            userList={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={() => {}} 
            eventList={events} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={() => {}}
        />;
      default: return <div>View not found</div>;
    }
  };

  if (!currentUser) return <><LoginScreen onLogin={handleLogin} />{isRecoveryModalOpen && <PasswordRecoveryModal onClose={() => { setIsRecoveryModalOpen(false); handleLogout(); }} />}</>;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans flex-col md:flex-row">
      <Sidebar currentView={view} onChangeView={setView} currentUser={currentUser} onLogout={handleLogout} onProfileClick={() => setIsProfileModalOpen(true)} currentEvent={currentEvent} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen"><div className="max-w-7xl mx-auto">{renderContent()}</div></main>
      {isProfileModalOpen && currentUser && <ProfileModal user={currentUser} onClose={() => setIsProfileModalOpen(false)} onUpdatePassword={async (p) => { await (supabase.auth as any).updateUser({ password: p }); }} />}
      {isRecoveryModalOpen && <PasswordRecoveryModal onClose={() => setIsRecoveryModalOpen(false)} />}
    </div>
  );
};
export default App;
