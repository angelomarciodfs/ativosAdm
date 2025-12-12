import React, { useState } from 'react';
import { Lock, User, ArrowRight, Loader } from 'lucide-react';
import { SYSTEM_LOGO } from '../constants';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err: any) {
      console.error('Login failed', err);
      let msg = 'Falha na autenticação.';
      if (err.message && err.message.includes('Invalid login credentials')) {
         msg = 'Email ou senha incorretos.';
      } else if (err.message) {
         msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />

      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-xl relative z-10 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center justify-center mb-8">
           <img 
            src={SYSTEM_LOGO} 
            alt="Legendários" 
            className="w-auto h-24 object-contain drop-shadow-md" 
           />
           <div className="text-center mt-4">
             <p className="text-gray-500 text-sm font-medium leading-tight">Controle de Ativos Adm</p>
             <p className="text-brand-600 text-sm font-bold leading-tight mt-1">Acesso ao Sistema</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold ml-1">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-400"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-bold ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-400"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs text-center animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="animate-spin" size={18} /> : <>Acessar <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};