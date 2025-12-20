import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Імпорт сторінок
import Dashboard from './pages/admin/Dashboard';
import AdminList from './pages/admin/AdminList';

// Імпорт стилів
import './pages/admin/styles/Admin.css';
import './styles/Login.css';

function App() {
  // 1. Ініціалізація користувача з LocalStorage (щоб не злітало при F5)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Стан для форми входу
  const [username, setUsername] = useState('admin_user');
  const [password, setPassword] = useState('admin_pass');
  //const [username, setUsername] = useState('maria_coval');
  //const [password, setPassword] = useState('maria_coval_pass');

  // 2. Слідкуємо за змінами user і зберігаємо в LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // 3. Функція Входу
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Відправляємо запит на сервер
      const res = await axios.post('http://localhost:3000/api/auth/login', { username, password });
      
      // Сервер повертає об'єкт { user: { username: '...', role: '...' } }
      // Ми додаємо туди пароль (він треба для запитів до БД) і зберігаємо в стан
      setUser({ ...res.data.user, password });
    } catch (err) {
      alert('Невірний логін або пароль!');
      console.error(err);
    }
  };

  // 4. Функція Виходу
  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    localStorage.removeItem('user');
  };

  // --- КОМПОНЕНТ ЗАХИСТУ РОУТІВ ---
  const ProtectedRoute = ({ children }) => {
    // Якщо користувач не залогінився — відправляємо на вхід
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Перевірка прав доступу
    const isMainAdmin = user.username === 'admin_user'; // Твій головний акаунт
    const isRoleAdmin = user.role === 'role_admin';     // Завідувачі (Марія, Ольга...)

    // Якщо це не головний адмін І не завідувач — блокуємо
    if (!isMainAdmin && !isRoleAdmin) {
       return (
         <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            fontFamily: 'Arial, sans-serif'
         }}>
            <h1 style={{color: '#c0392b', fontSize: '3rem'}}>⛔ Доступ заборонено</h1>
            <p style={{fontSize: '1.2rem'}}>Ця панель доступна тільки для адміністраторів.</p>
            
            <div style={{background: '#eee', padding: '10px 20px', borderRadius: '8px', margin: '20px 0'}}>
                <strong>Ваш логін:</strong> {user.username} <br/>
                <strong>Ваша роль:</strong> {user.role || 'Невизначена (NULL)'}
            </div>

            <button 
                className="btn-pink" 
                onClick={handleLogout}
                style={{padding: '10px 30px', cursor: 'pointer'}}
            >
                Вийти з акаунту
            </button>
         </div>
       );
    }
    
    // Якщо все ок — показуємо сторінку
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        
        {/* СТОРІНКА ВХОДУ */}
        <Route path="/" element={
          user ? <Navigate to="/admin" /> : (
            <div className="login-page">
              <div className="login-card">
                <h2 style={{marginBottom: '30px', color: '#34495e'}}>Вхід у систему</h2>
                
                <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', textAlign: 'left'}}>
                  <div style={{marginBottom: '5px', color: '#666', fontSize: '14px'}}>Логін</div>
                  <input 
                    type="text"
                    placeholder="Введіть логін" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required
                  />
                  
                  <div style={{marginBottom: '5px', color: '#666', fontSize: '14px', marginTop: '15px'}}>Пароль</div>
                  <input 
                    type="password" 
                    placeholder="Введіть пароль" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required
                  />
                  
                  <button type="submit" className="btn-pink" style={{marginTop: '25px', width: '100%'}}>Увійти</button>
                </form>
              </div>
            </div>
          )
        } />

        {/* ЗАХИЩЕНІ МАРШРУТИ АДМІНКИ */}
        <Route path="/admin" element={
            <ProtectedRoute>
                <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
        } />
        
        <Route path="/admin/groups" element={
            <ProtectedRoute>
                <AdminList user={user} type="groups" />
            </ProtectedRoute>
        } />
        
        <Route path="/admin/employees" element={
            <ProtectedRoute>
                <AdminList user={user} type="employees" />
            </ProtectedRoute>
        } />
        
        <Route path="/admin/relatives" element={
            <ProtectedRoute>
                <AdminList user={user} type="relatives" />
            </ProtectedRoute>
        } />
        
        <Route path="/admin/children" element={
            <ProtectedRoute>
                <AdminList user={user} type="children" />
            </ProtectedRoute>
        } />

        {/* Усі інші шляхи перекидають на головну */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;