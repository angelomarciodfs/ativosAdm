import React from 'react';
import { LayoutDashboard, Radio, History, PlusCircle, Settings, LogOut, ClipboardList, Calendar, X, ArrowDownCircle } from 'lucide-react';
import { ViewState, User, Event } from '../types';
import { SYSTEM_LOGO } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
  currentEvent: Event | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout, currentEvent, isOpen = false, onClose }) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'rentals', label: 'Locações Ativas', icon: Radio, visible: true },
    { id: 'reports', label: 'Relatório Evento', icon: ClipboardList, visible: true },
    { id: 'history', label: 'Histórico', icon: History, visible: true },
    { id: 'settings', label: 'Configurações', icon: Settings, visible: isAdmin }, // Only Admin
  ];

  // Helper para formatar data sem conversão de fuso horário
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

  const handleNavigation = (view: ViewState) => {
      onChangeView(view);
      if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:shadow-sm
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <img 
            src={SYSTEM_LOGO} 
            alt="Legendários" 
            className="h-16 w-auto object-contain" 
          />
          {/* Close Button for Mobile */}
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-700">
             <X size={24} />
          </button>
        </div>
        
        {/* Event Indicator */}
        <div className="px-4 pt-4 pb-2">
            <div className="bg-brand-500/10 border border-brand-500/30 rounded-lg p-3">
                <div className="text-[10px] uppercase text-brand-600 font-bold mb-1 flex items-center gap-1">
                    <Calendar size={10} />
                    Evento Ativo
                </div>
                <div className="text-sm font-bold text-gray-900 truncate leading-tight">
                    {currentEvent ? currentEvent.name : 'Nenhum Evento Selecionado'}
                </div>
                {currentEvent && (
                   <div className="text-[10px] text-gray-500 mt-1">
                      {formatDate(currentEvent.startDate)} até {formatDate(currentEvent.endDate)}
                   </div>
                )}
            </div>
        </div>

        <div className="flex-1 py-4 px-4 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Principal</p>
          {menuItems.filter(i => i.visible).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id as ViewState)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
          
          <div className="pt-6 mt-4 border-t border-gray-100 space-y-2">
               <button
                onClick={() => handleNavigation('new-rental')}
                disabled={!currentEvent}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-bold bg-white border border-gray-200 text-brand-600 hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                Nova Locação
              </button>

              <button
                onClick={() => handleNavigation('rentals')}
                disabled={!currentEvent}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-bold bg-white border border-gray-200 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ArrowDownCircle size={18} />
                Receber Devolução
              </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 border border-brand-200 shrink-0">
                  {currentUser?.avatarInitials || 'US'}
              </div>
              <div className="flex-1 overflow-hidden min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'Usuário'}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-brand-500' : 'bg-blue-500'}`}></span>
                    <p className="text-xs text-gray-500 truncate capitalize">{currentUser?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
                  </div>
              </div>
              <button 
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0"
                title="Sair"
              >
                 <LogOut size={16} />
              </button>
          </div>
        </div>
      </aside>
    </>
  );
};