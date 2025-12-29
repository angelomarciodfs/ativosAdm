
import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Lock, Mail, Phone, Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ProfileViewProps {
  user: User | null;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateProfile, onUpdatePassword }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    preferredName: user?.preferredName || '',
    phone: user?.phone || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await onUpdateProfile(formData);
      setMessage({ type: 'success', text: 'Informações atualizadas com sucesso!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Falha ao atualizar informações.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await onUpdatePassword(passwordData.newPassword);
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao alterar senha.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Meu Perfil</h2>
        <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest">Gerencie suas informações e segurança de acesso.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Informações Pessoais */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg"><UserIcon size={20} /></div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Dados Pessoais</h3>
          </div>

          <form onSubmit={handleUpdateInfo} className="space-y-6">
             <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Email (Não editável)</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-lg text-gray-500">
                    <Mail size={16} />
                    <span className="text-sm font-medium">{user.email}</span>
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
             </div>

             <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Nome de Guerra / Apelido</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={formData.preferredName}
                  onChange={e => setFormData({...formData, preferredName: e.target.value})}
                />
             </div>

             <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">WhatsApp / Telefone</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="tel" 
                        className="w-full bg-white border border-gray-200 p-3 pl-10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
             </div>

             <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-3 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase text-xs tracking-widest"
             >
                {loading ? <Loader className="animate-spin" size={18} /> : <><Save size={18} /> Salvar Alterações</>}
             </button>
          </form>
        </div>

        {/* Segurança / Senha */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg"><Lock size={20} /></div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Segurança</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
             <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Nova Senha</label>
                <input 
                  type="password" 
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                />
             </div>

             <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  placeholder="Repita a senha"
                  className="w-full bg-white border border-gray-200 p-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
             </div>

             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed">
                    Sua senha é pessoal e intransferível. <br/>
                    Ao alterá-la, você será mantido logado nesta sessão.
                </p>
             </div>

             <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-black text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] uppercase text-xs tracking-widest"
             >
                {loading ? <Loader className="animate-spin" size={18} /> : <><Lock size={18} /> Atualizar Senha</>}
             </button>
          </form>
        </div>
      </div>
    </div>
  );
};
