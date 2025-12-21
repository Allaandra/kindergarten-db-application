import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Імпорт сторінок
import Dashboard from './pages/admin/Dashboard';
import AdminList from './pages/admin/AdminList';
import EducatorDashboard from './pages/educator/EducatorDashboard';
import NurseDashboard from './pages/nurse/NurseDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

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
  // --- КОМПОНЕНТ ЗАХИСТУ РОУТІВ ---
  // --- КОМПОНЕНТ ЗАХИСТУ РОУТІВ ---
  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/" replace />;

    // Вихователь
    if (user.role === 'role_educator') {
       if (window.location.pathname.startsWith('/nurse') || window.location.pathname.startsWith('/admin')) {
          return <div>⛔ Доступ заборонено</div>;
       }
       return children;
    }

    // Медсестра
    if (user.role === 'role_nurse') {
        // Медсестрі можна в /nurse, /admin/menu, /admin/dishes
        const path = window.location.pathname;
        if (path.startsWith('/nurse') || path === '/admin/menu' || path === '/admin/dishes') {
            return children;
        }
        return <div>⛔ Тільки для Адміністратора</div>;
    }

    if (user.role === 'role_parent') {
      if (window.location.pathname.startsWith('/parent')) return children;
      return <div>⛔ Доступ заборонено (Це для батьків)</div>;
    }     

    // --- ЛОГІКА ДЛЯ АДМІНІВ ---
    const isMainAdmin = user.username === 'admin_user'; 
    const isRoleAdmin = user.role === 'role_admin';     

    if (!isMainAdmin && !isRoleAdmin) {
       return (
         <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial, sans-serif'
         }}>
            <h1 style={{color: '#c0392b', fontSize: '3rem'}}>⛔ Доступ заборонено</h1>
            <p style={{fontSize: '1.2rem'}}>У вас немає прав доступу до цієї сторінки.</p>
            <button className="btn-pink" onClick={handleLogout} style={{padding: '10px 30px', cursor: 'pointer'}}>Вийти</button>
         </div>
       );
    }
    
    // Адмінів пропускаємо всюди
    return children;
  };

  

  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. РОЗУМНА ПЕРЕАДРЕСАЦІЯ ПРИ ВХОДІ */}
        <Route path="/" element={
          user ? (
            // Если воспитатель -> /educator
            user.role === 'role_educator' ? <Navigate to="/educator" replace /> :
            
            // 👇 ДОБАВИЛИ ЭТУ ПРОВЕРКУ: Если медсестра -> /nurse
            user.role === 'role_nurse' ? <Navigate to="/nurse" replace /> :
            
            user.role === 'role_parent' ? <Navigate to="/parent" replace /> :
            
            // Иначе (админ) -> /admin
            <Navigate to="/admin" replace />
          ) : (
            <div className="login-page">
               {/* ... твій код форми входу (без змін) ... */}
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

        {/* 2. ДОДАЄМО НОВИЙ ШЛЯХ ДЛЯ ВИХОВАТЕЛЯ */}
                {/* Головне меню */}
        <Route path="/educator" element={
            <ProtectedRoute>
                <EducatorDashboard user={user} onLogout={handleLogout} type="menu" />
            </ProtectedRoute>
        } />

        {/* ЗАХИЩЕНІ МАРШРУТИ АДМІНКИ (Залишаються як були) */}
        <Route path="/admin" element={
            <ProtectedRoute>
                <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
        } />
        
        {/* ... твої інші роути (/admin/groups і т.д.) залишаються без змін ... */}
        <Route path="/admin/groups" element={<ProtectedRoute><AdminList user={user} type="groups" /></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute><AdminList user={user} type="employees" /></ProtectedRoute>} />
        <Route path="/admin/relatives" element={<ProtectedRoute><AdminList user={user} type="relatives" /></ProtectedRoute>} />
        <Route path="/admin/children" element={<ProtectedRoute><AdminList user={user} type="children" /></ProtectedRoute>} />
        <Route path="/admin/schedule" element={<ProtectedRoute><AdminList user={user} type="schedule" /></ProtectedRoute>} />
        <Route path="/admin/dishes" element={<ProtectedRoute><AdminList user={user} type="dishes" /></ProtectedRoute>} />
        <Route path="/admin/menu" element={<ProtectedRoute><AdminList user={user} type="menu" /></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute><AdminList user={user} type="attendance" /></ProtectedRoute>} />
        <Route path="/admin/medical" element={<ProtectedRoute><AdminList user={user} type="medical" /></ProtectedRoute>} />
        

        {/* Список груп */}
        <Route path="/educator/groups" element={
            <ProtectedRoute>
                <EducatorDashboard user={user} onLogout={handleLogout} type="groups" />
            </ProtectedRoute>
        } />

        {/* Табель конкретної групи (потрібен ID) */}
        <Route path="/educator/groups/:id" element={
            <ProtectedRoute>
                <EducatorDashboard user={user} onLogout={handleLogout} type="attendance" />
            </ProtectedRoute>
        } />

        {/* Розклад */}
        <Route path="/educator/schedule" element={
            <ProtectedRoute>
                <EducatorDashboard user={user} onLogout={handleLogout} type="schedule" />
            </ProtectedRoute>
        } />

        {/* Головна медсестри */}
        <Route path="/nurse" element={<ProtectedRoute><NurseDashboard user={user} onLogout={handleLogout} type="menu" /></ProtectedRoute>} />
        
        {/* Медичні карти */}
        <Route path="/nurse/medical" element={<ProtectedRoute><AdminList user={user} type="medical" /></ProtectedRoute>} />

        {/* ПЕРЕВИКОРИСТАННЯ АДМІНСЬКИХ СТОРІНОК ДЛЯ МЕДСЕСТРИ */}
        <Route path="/nurse/menu" element={<ProtectedRoute><AdminList user={user} type="menu" /></ProtectedRoute>} />
        <Route path="/nurse/dishes" element={<ProtectedRoute><AdminList user={user} type="dishes" /></ProtectedRoute>} />

        {/* Кабінет Батьків */}
        <Route path="/parent" element={<ProtectedRoute><ParentDashboard user={user} onLogout={handleLogout} /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;