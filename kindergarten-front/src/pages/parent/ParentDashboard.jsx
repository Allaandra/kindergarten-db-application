import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Підключаємо твій CSS, де лежить клас .dashboard-card
import '../admin/styles/Admin.css'; 

const ParentDashboard = ({ user, onLogout }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [details, setDetails] = useState({ medical: [], attendance: [], menu: null, schedule: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); 

  const auth = { username: user.username, password: user.password };

  // --- ЗАВАНТАЖЕННЯ ---
  useEffect(() => {
    const fetchChildren = async () => {
        try {
            const res = await axios.post('http://localhost:3000/api/parent/my-children', { auth });
            setChildren(res.data.rows);
            if (res.data.rows.length === 1) {
                handleSelectChild(res.data.rows[0]);
            }
        } catch (err) { console.error(err); }
    };
    fetchChildren();
  }, []);

  const handleSelectChild = async (child) => {
      setSelectedChild(child);
      setLoading(true);
      try {
          const res = await axios.post('http://localhost:3000/api/parent/child-details', { 
              auth, childId: child.id, groupId: child.group_id 
          });
          setDetails(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
  };

  return (
    // ФОН: Синій, як у Вихователя
    <div style={{minHeight: '100vh', background: '#e3f2fd', fontFamily: 'Arial, sans-serif', overflowY: 'auto'}}>
      
      {/* --- ШАПКА --- */}
      <div style={{
          background: 'white', 
          padding: '20px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          borderBottom: '1px solid #eee'
      }}>
          <h2 style={{
              margin: 0, 
              color: '#34495e', 
              fontSize: '24px', 
              borderBottom: '4px solid #3498db', 
              paddingBottom: '5px',
              display: 'inline-block'
          }}>
              👨‍👩‍👧 Кабінет Батьків
          </h2>
          
          <button 
                onClick={onLogout} 
                className="btn-pink"
                onMouseOver={(e) => e.target.style.background = '#ffb3b3'}
                onMouseOut={(e) => e.target.style.background = '#ffcccc'}
            >
                Вийти
          </button>
      </div>

      {/* --- КОНТЕНТ --- */}
      <div style={{padding: '40px', maxWidth: '1200px', margin: '0 auto'}}>

        {/* 1. ВИБІР ДИТИНИ (Використовуємо твій стиль карток) */}
        {!selectedChild && (
            <div style={{textAlign: 'center'}}>
                <h3 style={{color: '#34495e'}}>Оберіть дитину:</h3>
                
                {/* 👇 ТІ САМІ СТИЛІ, ЩО ТИ СКИНУЛА 👇 */}
                <div style={{display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginTop: '50px'}}>
                    {children.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => handleSelectChild(c)} 
                            className="dashboard-card" 
                            style={{cursor: 'pointer'}} // Додав курсор, бо це дів, а не лінк
                        >
                            <span className="card-icon">👶</span>
                            <span className="card-title">{c.first_name}</span>
                            <div style={{color: '#777', marginTop: '10px'}}>{c.group_name}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 2. ДЕТАЛІ ДИТИНИ */}
        {selectedChild && (
            <div>
                {/* Кнопка "Назад" */}
                {children.length > 1 && (
                     <button onClick={() => setSelectedChild(null)} style={{
                        background: 'white', color: '#3498db', padding: '10px 20px', 
                        borderRadius: '20px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center',
                        gap: '5px', border: '1px solid #eee', cursor: 'pointer', marginBottom: '20px'
                    }}>
                        ⬅ До списку дітей
                    </button>
                )}

                {/* КАРТКА ДИТИНИ (Шапка профілю) */}
                <div style={{
                    background: 'white', borderRadius: '20px', padding: '30px', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'
                }}>
                    <div>
                        <h1 style={{margin: 0, color: '#34495e'}}>{selectedChild.first_name} {selectedChild.last_name}</h1>
                        <p style={{margin: '5px 0', color: '#666', fontSize: '18px'}}>Група: <b style={{color: '#3498db'}}>{selectedChild.group_name}</b></p>
                    </div>
                    
                    <div style={{background: '#e1f5fe', padding: '20px', borderRadius: '15px', minWidth: '220px', border: '1px solid #b3e5fc'}}>
                        <div style={{fontSize: '12px', color: '#0277bd', fontWeight: 'bold', textTransform: 'uppercase', marginBottom:'5px'}}>📞 Ваш Вихователь</div>
                        <div style={{fontSize: '16px', color: '#333', marginBottom: '5px'}}>{selectedChild.educator_name || 'Не призначено'}</div>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#0288d1'}}>{selectedChild.educator_phone}</div>
                    </div>
                </div>

                <div style={{height: '30px'}}></div>

                {/* 🔥 ВКЛАДКИ (Рожеві акценти для активних) */}
                <div style={{display: 'flex', gap: '15px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px'}}>
                    {[
                        { id: 'info', icon: '📝', label: 'Табель' },
                        { id: 'medical', icon: '🏥', label: 'Мед. картка' },
                        { id: 'food', icon: '🍏', label: 'Меню' },
                        { id: 'schedule', icon: '📅', label: 'Розклад' },
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                padding: '12px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer',
                                fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                // Активна - Рожева (#ec407a), Неактивна - Біла
                                background: isActive ? '#ec407a' : 'white',
                                color: isActive ? 'white' : '#34495e',
                                boxShadow: isActive ? `0 4px 15px rgba(236, 64, 122, 0.4)` : '0 2px 5px rgba(0,0,0,0.05)',
                                transition: '0.3s'
                            }}>
                                <span>{tab.icon}</span> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* КОНТЕНТ (Білий контейнер) */}
                <div style={{background: 'white', borderRadius: '20px', padding: '30px', minHeight: '300px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}}>
                    
                    {/* 1. ТАБЕЛЬ */}
                    {activeTab === 'info' && (
                        <div>
                            <h3 style={{color: '#34495e', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px'}}>Історія відвідування</h3>
                            <table className="styled-table" style={{width: '100%'}}>
                                <thead><tr><th>Дата</th><th>Статус</th><th>Примітка</th></tr></thead>
                                <tbody>
                                    {details.attendance.length === 0 ? <tr><td colSpan="3" style={{textAlign: 'center'}}>Даних немає</td></tr> : details.attendance.map((a, i) => (
                                        <tr key={i}>
                                            <td>{a.date}</td>
                                            <td style={{fontWeight: 'bold', color: a.status === 'Присутній' ? '#4caf50' : '#f44336'}}>{a.status}</td>
                                            <td>{a.reason || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 2. МЕДИЦИНА */}
                    {activeTab === 'medical' && (
                        <div>
                             <h3 style={{color: '#34495e', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px'}}>Медична картка 🏥</h3>
                            <table className="styled-table" style={{width: '100%'}}>
                                <thead><tr><th>Дата</th><th>Тип</th><th>Опис</th></tr></thead>
                                <tbody>
                                    {details.medical.length === 0 ? <tr><td colSpan="3" style={{textAlign: 'center'}}>Записів немає</td></tr> : details.medical.map((m, i) => (
                                        <tr key={i}>
                                            <td>{m.date}</td>
                                            <td>
                                                <span style={{background: '#fce4ec', color: '#c2185b', padding: '5px 12px', borderRadius: '15px', fontSize: '13px', fontWeight: 'bold'}}>
                                                    {m.type}
                                                </span>
                                            </td>
                                            <td>{m.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 3. МЕНЮ */}
                    {activeTab === 'food' && (
                        <div>
                             <h3 style={{color: '#34495e', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px', textAlign: 'center'}}>Меню на сьогодні 🍲</h3>
                            {!details.menu ? <p style={{color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px'}}>Меню на сьогодні ще не складено</p> : (
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '25px', marginTop: '30px'}}>
                                    {[
                                        { label: 'Сніданок', val: details.menu.b, icon: '🥞' },
                                        { label: 'Обід', val: details.menu.l, icon: '🍲' },
                                        { label: 'Полуденок', val: details.menu.s, icon: '🍎' },
                                        { label: 'Вечеря', val: details.menu.d, icon: '🥗' }
                                    ].map((m, i) => (
                                        <div key={i} style={{background: '#f8f9fa', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #eee'}}>
                                            <div style={{fontSize: '35px', marginBottom: '15px'}}>{m.icon}</div>
                                            <div style={{color: '#666', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px'}}>{m.label}</div>
                                            <div style={{fontSize: '18px', fontWeight: 'bold', color: '#34495e'}}>{m.val || '-'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. РОЗКЛАД */}
                    {activeTab === 'schedule' && (
                        <div>
                            <h3 style={{color: '#34495e', marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px'}}>Розклад занять групи</h3>
                            <table className="styled-table" style={{width: '100%'}}>
                                <thead><tr><th>День</th><th>Час</th><th>Заняття</th></tr></thead>
                                <tbody>
                                    {details.schedule.length === 0 ? <tr><td colSpan="3" style={{textAlign: 'center'}}>Розкладу немає</td></tr> : details.schedule.map((s, i) => (
                                        <tr key={i}>
                                            <td><b>{s.day_of_week}</b></td>
                                            <td>{s.time_start ? s.time_start.substring(0,5) : '-'}</td>
                                            <td>{s.activity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;