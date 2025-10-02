// backend/server.js - VERSIÓN SIMPLIFICADA SIN MONGODB
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base de datos en memoria (temporal)
let users = [];

const JWT_SECRET = 'secretkey123';

console.log('🚀 Servidor backend iniciando...');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
};

// RUTA DE PRUEBA
app.get('/', (req, res) => {
  res.json({ message: '✅ Backend funcionando correctamente' });
});

// Registro de usuario
app.post('/api/register', async (req, res) => {
  try {
    console.log('📝 Intento de registro:', req.body);
    
    const { username, password, name, email } = req.body;

    if (!username || !password || !name || !email) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      name,
      email,
      accounts: [
        {
          id: `SA-${Date.now()}`,
          type: 'Cuenta de Ahorro',
          balance: 0,
          interestRate: 0.05,
          lastInterestDate: new Date()
        },
        {
          id: `CC-${Date.now() + 1}`,
          type: 'Cuenta Corriente',
          balance: 0
        }
      ],
      transactions: []
    };

    users.push(newUser);
    
    console.log('✅ Usuario registrado exitosamente:', username);
    console.log('📊 Total de usuarios:', users.length);
    
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('❌ Error al registrar:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Intento de login:', req.body.username);
    
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) {
      console.log('❌ Usuario no encontrado:', username);
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Contraseña incorrecta para:', username);
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login exitoso:', username);

    // No enviar la contraseña
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// Obtener datos del usuario
app.get('/api/user', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener datos' });
  }
});

// Depositar saldo
app.post('/api/deposit', authenticateToken, (req, res) => {
  try {
    console.log('💰 Depósito solicitado:', req.body);
    
    const { accountId, amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
    }

    const user = users.find(u => u.id === req.user.id);
    const account = user.accounts.find(acc => acc.id === accountId);

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    account.balance += parseFloat(amount);

    user.transactions.unshift({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: 'Depósito de saldo',
      amount: parseFloat(amount),
      type: 'deposit'
    });

    console.log('✅ Depósito realizado:', amount);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Depósito realizado exitosamente', user: userWithoutPassword });
  } catch (error) {
    console.error('❌ Error al depositar:', error);
    res.status(500).json({ message: 'Error al realizar depósito' });
  }
});

// Retirar saldo
app.post('/api/withdraw', authenticateToken, (req, res) => {
  try {
    const { accountId, amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
    }

    const user = users.find(u => u.id === req.user.id);
    const account = user.accounts.find(acc => acc.id === accountId);

    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: 'Saldo insuficiente' });
    }

    account.balance -= parseFloat(amount);

    user.transactions.unshift({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: 'Retiro de efectivo',
      amount: -parseFloat(amount),
      type: 'withdrawal'
    });

    console.log('✅ Retiro realizado:', amount);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Retiro realizado exitosamente', user: userWithoutPassword });
  } catch (error) {
    console.error('❌ Error al retirar:', error);
    res.status(500).json({ message: 'Error al realizar retiro' });
  }
});

// Transferir
app.post('/api/transfer', authenticateToken, (req, res) => {
  try {
    const { amount, destination, method } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
    }

    const user = users.find(u => u.id === req.user.id);
    const mainAccount = user.accounts[0];

    if (mainAccount.balance < amount) {
      return res.status(400).json({ message: 'Saldo insuficiente' });
    }

    mainAccount.balance -= parseFloat(amount);

    const methodLabel = method === 'apple-pay' ? 'Apple Pay' : 'Transferencia bancaria';
    user.transactions.unshift({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      description: `${methodLabel} a ${destination}`,
      amount: -parseFloat(amount),
      type: 'transfer'
    });

    console.log('✅ Transferencia realizada:', amount);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Transferencia realizada exitosamente', user: userWithoutPassword });
  } catch (error) {
    console.error('❌ Error al transferir:', error);
    res.status(500).json({ message: 'Error al realizar transferencia' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log('📝 Endpoints disponibles:');
  console.log('   POST /api/register - Registrar usuario');
  console.log('   POST /api/login - Iniciar sesión');
  console.log('   GET  /api/user - Obtener datos del usuario');
  console.log('   POST /api/deposit - Depositar saldo');
  console.log('   POST /api/withdraw - Retirar saldo');
  console.log('   POST /api/transfer - Transferir dinero');
  console.log('\n💡 El backend está usando datos en memoria (sin MongoDB)');
  console.log('⚠️  Los datos se perderán al reiniciar el servidor\n');
});