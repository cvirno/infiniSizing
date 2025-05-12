import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Globe, HelpCircle, ExternalLink } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState('pt');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password); // Chama diretamente o onLogin sem validação
  };

  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 1;
    if (pass.length < 8) return 2;
    if (pass.length < 10) return 3;
    return 4;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthTexts = ['Muito Fraca', 'Fraca', 'Média', 'Forte', 'Muito Forte'];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Logo e Título */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-500 mb-2">infiniSizing</h1>
        <p className="text-slate-400">Sistema de Dimensionamento de Data Center</p>
        <p className="text-slate-500 text-sm mt-2">Desenvolvido por Cesar Virno</p>
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-slate-700/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Login</h2>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <Globe size={20} />
            <span>{language === 'pt' ? 'PT' : 'EN'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Campo de Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 rounded-lg pl-10 pr-12 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400" />
                )}
              </button>
            </div>

            {/* Indicador de Força da Senha */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 h-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full ${
                        i < passwordStrength
                          ? strengthColors[passwordStrength - 1]
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {strengthTexts[passwordStrength - 1]}
                </p>
              </div>
            )}
          </div>

          {/* Opções Adicionais */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-500 rounded border-slate-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-300">Lembrar-me</span>
            </label>
            <a
              href="#"
              className="text-sm text-blue-500 hover:text-blue-400"
            >
              Esqueceu a senha?
            </a>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Botão de Login */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>

        {/* Links de Ajuda */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <HelpCircle size={16} />
              <span className="text-sm">Ajuda</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ExternalLink size={16} />
              <span className="text-sm">Documentação</span>
            </a>
          </div>
        </div>
      </div>

      {/* Versão e Copyright */}
      <div className="mt-8 text-center text-slate-500 text-sm">
        <p>Versão 2.0.0</p>
        <p className="mt-1">© 2024 infiniSizing. Todos os direitos reservados.</p>
      </div>
    </div>
  );
};

export default Login; 