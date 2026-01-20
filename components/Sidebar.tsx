
import React from 'react';
import { LayoutDashboard, Radio, History, PlusCircle, Settings, LogOut, ClipboardList, Calendar, X, ArrowDownCircle, ChevronRight, Tag, Package } from 'lucide-react';
import { ViewState, User, Event } from '../types';
import { SYSTEM_LOGO } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
  onProfileClick?: () => void;
  currentEvent: Event | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout, onProfileClick, currentEvent, isOpen = false, onClose }) => {
  const isAdmin = currentUser?.role === 'ADMIN';

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

  const NavItem = ({ id, label, icon: Icon, visible = true, disabled = false }: { id: string, label: string, icon: any, visible?: boolean, disabled?: boolean }) => {
      if (!visible) return null;
      const isActive = currentView === id;
      return (
        <button
            onClick={() => !disabled && handleNavigation(id as ViewState)}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
            isActive 
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' 
                : disabled 
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
        >
            <Icon size={18} className={isActive ? 'text-white' : (disabled ? 'text-gray-300' : 'text-gray-500')} />
            {label}
        </button>
      );
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
        {/* LOGO SECTION - Centralizada */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-center relative">
          <img 
            src={SYSTEM_LOGO} 
            alt="Legendários" 
            className="h-16 w-auto object-contain" 
          />
          {/* Close Button for Mobile */}
          <button onClick={onClose} className="md:hidden absolute right-4 text-gray-400 hover:text-gray-700">
             <X size={24} />
          </button>
        </div>
        
        {/* Event Indicator */}
        <div className="px-4 pt-4 pb-2">
            <div className={`border rounded-lg p-3 transition-colors ${currentEvent ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-[10px] uppercase font-bold mb-1 flex items-center gap-1 ${currentEvent ? 'text-brand-600' : 'text-gray-400'}`}>
                    <Calendar size={10} />
                    {currentEvent ? 'Evento Ativo' : 'Status do Sistema'}
                </div>
                <div className={`text-sm font-bold truncate leading-tight ${currentEvent ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    {currentEvent ? currentEvent.name : 'Nenhum Evento Ativo'}
                </div>
                {currentEvent && (
                   <div className="text-[10px] text-gray-500 mt-1">
                      {formatDate(currentEvent.startDate)} até {formatDate(currentEvent.endDate)}
                   </div>
                )}
            </div>
        </div>

        <div className="flex-1 py-4 px-4 overflow-y-auto custom-scrollbar">
          
          {/* GRUPO 1: GESTÃO DO EVENTO */}
          <div className="mb-6">
              <p className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Operação de Evento</p>
              <div className="space-y-1">
                  <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
                  <NavItem id="rentals" label="Locações de Rádio" icon={Radio} disabled={!currentEvent} />
                  <NavItem id="reports" label="Relatório Evento" icon={ClipboardList} disabled={!currentEvent} />
              </div>

              {/* Ações Rápidas (Dependentes de Evento) */}
              <div className="pt-3 mt-2 space-y-2">
                <button
                    onClick={() => handleNavigation('new-rental')}
                    disabled={!currentEvent}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-bold bg-white border border-gray-200 text-brand-600 hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                    Nova Locação
                </button>

                <button
                    onClick={() => handleNavigation('rentals')}
                    disabled={!currentEvent}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-bold bg-white border border-gray-200 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <ArrowDownCircle size={18} />
                    Receber Devolução
                </button>
              </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* GRUPO 2: GESTÃO GLOBAL */}
          <div className="mb-4">
              <p className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gestão Global</p>
              <div className="space-y-1">
                  <NavItem id="pins-patches" label="Pins & Patches" icon={Tag} />
                  <NavItem id="history" label="Histórico Geral" icon={History} />
                  <NavItem id="settings" label="Configurações" icon={Settings} visible={isAdmin} />
              </div>
          </div>

        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200 cursor-pointer group"
            onClick={onProfileClick}
            title="Ver Perfil / Alterar Senha"
          >
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 border border-brand-200 shrink-0 group-hover:scale-105 transition-transform">
                  {currentUser?.avatarInitials || 'US'}
              </div>
              <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600 transition-colors">{currentUser?.name || 'Usuário'}</p>
                     <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-brand-500' : 'bg-blue-500'}`}></span>
                    <p className="text-xs text-gray-500 truncate capitalize">{currentUser?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</p>
                  </div>
              </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
             <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                 <LogOut size={14} /> Sair do Sistema
              </button>
          </div>
        </div>
      </aside>
    </>
  );
};
