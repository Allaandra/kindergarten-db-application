import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../admin/styles/Admin.css'; // Твій спільний CSS

const ParentDashboard = ({ user, onLogout }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [details, setDetails] = useState({ medical: [], attendance: [], menu: null, schedule: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info, medical, food, schedule

  const auth = { username: user.username, password: user.password };

  // 1. Завантажуємо список дітей при вході
  useEffect(() => {
    const fetchChildren = async () => {
        try {
            const res = await axios.post('http://localhost:3000/api/parent/my-children', { auth });
            setChildren(res.data.rows);
            // Якщо дитина одна, одразу обираємо її
            if (res.data.rows.length === 1) {
                handleSelectChild(res.data.rows[0]);
            }
        } catch (err) { console.error(err); }
    };
    fetchChildren();
  }, []);

  // 2. Завантажуємо деталі обраної дитини
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
    <div className="admin-page" style={{ background: '#fff0f5', overflowY: 'auto' }}>
      
      {/* --- ШАПКА --- */}
      <div className="header-row" style={{
          position: 'relative', background: 'white', borderBottom: '1px solid #ffc1e3', marginBottom: '20px'
      }}>
          <h2 className="user-greeting" style={{ borderColor: '#f06292', color: '#d81b60' }}>
              👨‍👩‍👧 Кабінет Батьків
          </h2>
          <button onClick={onLogout} className="btn-pink" style={{
              background: '#ff80ab', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '25px', fontWeight: 'bold'
          }}>Вийти</button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 50px 20px' }}>

        {/* 1. ВИБІР ДИТИНИ (Якщо ще не обрана або їх декілька) */}
        {!selectedChild && (
            <div style={{textAlign: 'center', marginTop: '50px'}}>
                <h3 style={{color: '#880e4f'}}>Оберіть дитину:</h3>
                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
                    {children.map(c => (
                        <div key={c.id} onClick={() => handleSelectChild(c)} className="dashboard-card" style={{border: '2px solid #f8bbd0', cursor: 'pointer', width: '200px'}}>
                            <span style={{fontSize: '50px'}}>👶</span>
                            <h3>{c.first_name}</h3>
                            <p style={{color: '#666'}}>{c.group_name}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* 2. ДЕТАЛІ ДИТИНИ */}
        {selectedChild && (
            <div>
                {/* Кнопка "Назад до списку", якщо дітей > 1 */}
                {children.length > 1 && (
                    <button onClick={() => setSelectedChild(null)} style={{background:'none', border:'none', color:'#d81b60', cursor:'pointer', marginBottom:'10px', fontWeight:'bold'}}>
                        ⬅ До списку дітей
                    </button>
                )}

                {/* КАРТКА ДИТИНИ (Верхня частина) */}
                <div style={{background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 25px rgba(236, 64, 122, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'}}>
                    <div>
                        <h1 style={{margin: 0, color: '#880e4f'}}>{selectedChild.first_name} {selectedChild.last_name}</h1>
                        <p style={{margin: '5px 0', color: '#666'}}>Група: <b>{selectedChild.group_name}</b></p>
                    </div>
                    <div style={{background: '#fce4ec', padding: '15px', borderRadius: '15px', border: '1px solid #f8bbd0'}}>
                        <div style={{fontSize: '12px', color: '#ad1457', fontWeight: 'bold'}}>📞 ВАШ ВИХОВАТЕЛЬ</div>
                        <div style={{fontSize: '16px', color: '#333'}}>{selectedChild.educator_name || 'Не призначено'}</div>
                        <div style={{fontSize: '18px', fontWeight: 'bold', color: '#d81b60'}}>{selectedChild.educator_phone}</div>
                    </div>
                </div>

                {/* ВКЛАДКИ (МЕНЮ) */}
                <div style={{display: 'flex', gap: '15px', margin: '30px 0', overflowX: 'auto'}}>
                    {[
                        { id: 'info', icon: '📝', label: 'Табель' },
                        { id: 'food', icon: '🍏', label: 'Меню' },
                        { id: 'schedule', icon: '📅', label: 'Розклад' },
                        { id: 'medical', icon: '🩺', label: 'Здоров\'я' },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            padding: '12px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer',
                            fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                            background: activeTab === tab.id ? '#ec407a' : 'white',
                            color: activeTab === tab.id ? 'white' : '#666',
                            boxShadow: activeTab === tab.id ? '0 5px 15px rgba(236, 64, 122, 0.4)' : '0 2px 5px rgba(0,0,0,0.05)',
                            transition: '0.3s'
                        }}>
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {/* КОНТЕНТ ВКЛАДОК */}
                <div style={{background: 'white', borderRadius: '20px', padding: '30px', minHeight: '300px'}}>
                    
                    {/* 1. ТАБЕЛЬ */}
                    {activeTab === 'info' && (
                        <div>
                            <h3 style={{color: '#333'}}>Історія відвідування (останні 10 днів)</h3>
                            <table className="styled-table">
                                <thead><tr><th>Дата</th><th>Статус</th><th>Примітка</th></tr></thead>
                                <tbody>
                                    {details.attendance.map((a, i) => (
                                        <tr key={i}>
                                            <td>{a.date}</td>
                                            <td style={{fontWeight: 'bold', color: a.status === 'Присутній' ? 'green' : 'red'}}>{a.status}</td>
                                            <td>{a.reason || '-'}</td>
                                        </tr>
                                    ))}
                                    {details.attendance.length === 0 && <tr><td colSpan="3">Даних немає</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 2. МЕНЮ */}
                    {activeTab === 'food' && (
                        <div style={{textAlign: 'center'}}>
                            <h3 style={{color: '#333'}}>Меню на сьогодні 🍲</h3>
                            {!details.menu ? <p>Меню ще не складено</p> : (
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px'}}>
                                    {[
                                        { label: 'Сніданок', val: details.menu.b, icon: '🥞' },
                                        { label: 'Обід', val: details.menu.l, icon: '🍲' },
                                        { label: 'Полуденок', val: details.menu.s, icon: '🍎' },
                                        { label: 'Вечеря', val: details.menu.d, icon: '🥗' }
                                    ].map((m, i) => (
                                        <div key={i} style={{background: '#fff3e0', padding: '20px', borderRadius: '15px'}}>
                                            <div style={{fontSize: '30px'}}>{m.icon}</div>
                                            <div style={{color: '#ef6c00', fontWeight: 'bold', marginBottom: '5px'}}>{m.label}</div>
                                            <div>{m.val || '-'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. РОЗКЛАД */}
                    {activeTab === 'schedule' && (
                        <div>
                            <h3 style={{color: '#333'}}>Розклад занять групи</h3>
                            <table className="styled-table">
                                <thead><tr><th>День</th><th>Час</th><th>Заняття</th></tr></thead>
                                <tbody>
                                    {details.schedule.map((s, i) => (
                                        <tr key={i}>
                                            <td><b>{s.day_of_week}</b></td>
                                            <td>{s.time_start.substring(0,5)}</td>
                                            <td>{s.activity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 4. МЕДИЦИНА */}
                    {activeTab === 'medical' && (
                        <div>
                            <h3 style={{color: '#333'}}>Медична картка 🏥</h3>
                            <table className="styled-table">
                                <thead><tr><th>Дата</th><th>Тип</th><th>Опис</th></tr></thead>
                                <tbody>
                                    {details.medical.map((m, i) => (
                                        <tr key={i}>
                                            <td>{m.date}</td>
                                            <td><span style={{background: '#e3f2fd', color: '#1565c0', padding: '4px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold'}}>{m.type}</span></td>
                                            <td>{m.description}</td>
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