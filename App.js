import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CreditCard, TrendingUp, Send, History, Smartphone, Apple, LogOut, DollarSign, Calendar, AlertCircle, Plus, Minus, UserPlus } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const BankingSystem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', name: '', email: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [transferForm, setTransferForm] = useState({ amount: '', destination: '', method: 'standard' });
  const [depositForm, setDepositForm] = useState({ accountId: '', amount: '' });
  const [withdrawForm, setWithdrawForm] = useState({ accountId: '', amount: '' });
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
      showNotification('Error de conexión con el servidor', 'error');
    }
  };

  const handleRegister = async () => {
    if (!registerForm.username || !registerForm.password || !registerForm.name || !registerForm.email) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('¡Registro exitoso! Ahora inicia sesión', 'success');
        setIsRegistering(false);
        setRegisterForm({ username: '', password: '', name: '', email: '' });
      } else {
        showNotification(data.message || 'Error al registrar', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión con el servidor', 'error');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        showNotification('¡Bienvenido! Has iniciado sesión correctamente', 'success');
      } else {
        showNotification(data.message || 'Error al iniciar sesión', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión con el servidor', 'error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
    setActiveTab('dashboard');
  };

  const handleDeposit = async () => {
    if (!depositForm.accountId || !depositForm.amount || parseFloat(depositForm.amount) <= 0) {
      showNotification('Por favor completa correctamente el formulario', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(depositForm)
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.user);
        setDepositForm({ accountId: '', amount: '' });
        showNotification('Depósito realizado exitosamente', 'success');
      } else {
        showNotification(data.message || 'Error al realizar depósito', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión con el servidor', 'error');
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.accountId || !withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) {
      showNotification('Por favor completa correctamente el formulario', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(withdrawForm)
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.user);
        setWithdrawForm({ accountId: '', amount: '' });
        showNotification('Retiro realizado exitosamente', 'success');
      } else {
        showNotification(data.message || 'Error al realizar retiro', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión con el servidor', 'error');
    }
    setLoading(false);
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferForm.amount);

    if (!amount || amount <= 0 || !transferForm.destination) {
      showNotification('Por favor completa correctamente el formulario', 'error');
      return;
    }

    if (amount > 1000) {
      setPendingTransaction({ amount, destination: transferForm.destination, method: transferForm.method });
      setShow2FA(true);
      showNotification('Por seguridad, se requiere verificación 2FA', 'info');
    } else {
      processTransfer(amount, transferForm.destination, transferForm.method);
    }
  };

  const verify2FA = () => {
    if (twoFACode === '123456') {
      processTransfer(pendingTransaction.amount, pendingTransaction.destination, pendingTransaction.method);
      setShow2FA(false);
      setTwoFACode('');
      setPendingTransaction(null);
    } else {
      showNotification('Código 2FA incorrecto. Usa 123456', 'error');
    }
  };

  const processTransfer = async (amount, destination, method) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, destination, method })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.user);
        setTransferForm({ amount: '', destination: '', method: 'standard' });
        showNotification(`Transferencia de $${amount.toFixed(2)} realizada`, 'success');
      } else {
        showNotification(data.message || 'Error al realizar transferencia', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión con el servidor', 'error');
    }
    setLoading(false);
  };

  const getTotalBalance = () => {
    if (!currentUser) return 0;
    return currentUser.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Banco Seguro</h1>
            <p className="text-gray-500 mt-2">
              {isRegistering ? 'Crea tu cuenta' : 'Accede a tu cuenta'}
            </p>
          </div>

          {!isRegistering ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Tu usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Tu contraseña"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>

              <button
                onClick={() => setIsRegistering(true)}
                className="w-full text-blue-600 py-2 text-sm hover:underline"
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="tu_usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>

              <button
                onClick={() => setIsRegistering(false)}
                className="w-full text-gray-600 py-2 text-sm hover:underline"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (show2FA) {
    return (
      <div className="min-h-screen bg-gray-900 bg-opacity-90 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="text-yellow-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Verificación 2FA</h2>
            <p className="text-gray-600 mt-2">Ingresa el código de autenticación</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código de 6 dígitos</label>
              <input
                type="text"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && verify2FA()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="000000"
                maxLength="6"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">Código demo: <span className="font-mono font-bold">123456</span></p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShow2FA(false);
                  setTwoFACode('');
                  setPendingTransaction(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={verify2FA}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Verificar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white flex items-center gap-2`}>
          <AlertCircle size={20} />
          {notification.message}
        </div>
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
                <Lock className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Banco Seguro</h1>
                <p className="text-sm text-gray-500">Bienvenido, {currentUser.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: CreditCard },
              { id: 'deposit', label: 'Depositar', icon: Plus },
              { id: 'withdraw', label: 'Retirar', icon: Minus },
              { id: 'transfer', label: 'Transferir', icon: Send },
              { id: 'statement', label: 'Movimientos', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <p className="text-blue-100 mb-2">Balance Total</p>
              <h2 className="text-4xl font-bold mb-6">${getTotalBalance().toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp size={16} />
                  <span>Tasa: 5% anual</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} />
                  <span>Intereses mensuales</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {currentUser.accounts.map(account => (
                <div key={account.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">{account.type}</p>
                      <p className="text-xs text-gray-400 mt-1">{account.id}</p>
                    </div>
                    <CreditCard className="text-gray-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">
                    ${account.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  {account.interestRate && (
                    <p className="text-sm text-green-600 mt-2">
                      +{(account.interestRate * 100).toFixed(1)}% anual
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-full">
                  <Plus className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Depositar Saldo</h2>
                  <p className="text-gray-500">Agrega fondos a tu cuenta</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta destino</label>
                  <select
                    value={depositForm.accountId}
                    onChange={(e) => setDepositForm({...depositForm, accountId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecciona una cuenta</option>
                    {currentUser.accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type} - ${acc.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto a depositar</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      step="0.01"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={20} />
                  {loading ? 'Procesando...' : 'Depositar Saldo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-100 p-3 rounded-full">
                  <Minus className="text-red-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Retirar Saldo</h2>
                  <p className="text-gray-500">Retira fondos de tu cuenta</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta origen</label>
                  <select
                    value={withdrawForm.accountId}
                    onChange={(e) => setWithdrawForm({...withdrawForm, accountId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecciona una cuenta</option>
                    {currentUser.accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type} - ${acc.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto a retirar</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      step="0.01"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Minus size={20} />
                  {loading ? 'Procesando...' : 'Retirar Saldo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Nueva Transferencia</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      step="0.01"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  {parseFloat(transferForm.amount) > 1000 && (
                    <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Requerirá verificación 2FA
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destinatario</label>
                  <input
                    type="text"
                    value={transferForm.destination}
                    onChange={(e) => setTransferForm({...transferForm, destination: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nombre o cuenta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTransferForm({...transferForm, method: 'standard'})}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        transferForm.method === 'standard'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Send size={20} />
                      Transferencia
                    </button>
                    <button
                      onClick={() => setTransferForm({...transferForm, method: 'apple-pay'})}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        transferForm.method === 'apple-pay'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Apple size={20} />
                      Apple Pay
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={20} />
                  {loading ? 'Procesando...' : 'Realizar Transferencia'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statement' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Estado de Cuenta</h2>
                <p className="text-gray-500 mt-1">Actualizado en tiempo real</p>
              </div>

              <div className="p-6">
                {currentUser.transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">No hay transacciones aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentUser.transactions.map(transaction => (
                      <div key={transaction._id || transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.amount > 0 ? (
                              <TrendingUp className="text-green-600" size={24} />
                            ) : (
                              <Send className="text-red-600" size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.date}</p>
                          </div>
                        </div>
                        <p className={`text-lg font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BankingSystem;