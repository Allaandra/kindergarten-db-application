import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';

const EducatorDashboard = ({ user, onLogout, type }) => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  // Стейт для відкриття вікна з батьками
  const [viewParents, setViewParents] = useState(null);
  
  const auth = { username: user.username, password: user.password };

  // --- ЗАВАНТАЖЕННЯ ДАНИХ ---
  useEffect(() => {
    const fetchData = async () => {
        if (type === 'menu') return;
        setData([]);
        setLoading(true);
        try {
            let url = '';
            let payload = { auth };

            if (type === 'groups') {
                url = 'http://localhost:3000/api/educator/my-groups';
            } 
            else if (type === 'attendance') {
                url = 'http://localhost:3000/api/educator/group-children';
                payload.groupId = id; 
            } 
            else if (type === 'schedule') {
                url = 'http://localhost:3000/api/educator/schedule';
            }

            if (!url) {
                setLoading(false);
                return;
            }

            const res = await axios.post(url, payload);

            if (type === 'groups') {
                setData(res.data.groups);
            } 
            else if (type === 'attendance') {
                const mapped = res.data.children.map(c => ({
                    ...c,
                    status: c.current_status || 'Присутній',
                    reason: c.current_reason || '',
                    // Важливо: якщо relatives прийде null, замінимо на порожній масив []
                    relatives: c.relatives || [] 
                }));
                setData(mapped);
            } 
            else if (type === 'schedule') {
                setData(res.data.schedule);
            }

        } catch (err) {
            console.error("Помилка запиту:", err);
            // Не показуємо алерт, якщо це просто скасування
            if (err.name !== "CanceledError" && err.response) {
                 alert(`Помилка: ${err.response.data.error || err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [type, id]);


  // --- ФУНКЦІЇ ДЛЯ ТАБЕЛЯ ---
  const toggleStatus = (childId) => {
    setData(prev => prev.map(child => {
        if (child.id === childId) {
            const newStatus = child.status === 'Присутній' ? 'Відсутній' : 'Присутній';
            return { ...child, status: newStatus, reason: newStatus === 'Присутній' ? '' : child.reason };
        }
        return child;
    }));
  };

  const handleReasonChange = (childId, val) => {
    setData(prev => prev.map(c => c.id === childId ? { ...c, reason: val } : c));
  };

  const handleSaveAttendance = async () => {
    try {
        const payload = data.map(c => ({ childId: c.id, status: c.status, reason: c.reason }));
        await axios.post('http://localhost:3000/api/educator/save-attendance', { auth, attendanceData: payload });
        alert('Табель збережено! ✅');
    } catch (err) { alert('Помилка збереження'); }
  };


  // --- РЕНДЕР ---
  return (
    <div style={{minHeight: '100vh', background: '#e3f2fd', fontFamily: 'Arial, sans-serif'}}>
      
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
              {type === 'menu' && `👋 Вітаю, ${user.username}!`}
              {type === 'groups' && '🧸 Мої Групи'}
              {type === 'attendance' && '📝 Табель відвідування'}
              {type === 'schedule' && '📅 Мій Розклад'}
          </h2>

          <div>
            {type === 'menu' ? (
                <button 
                    onClick={onLogout} 
                    className="btn-pink"
                    onMouseOver={(e) => e.target.style.background = '#ffb3b3'}
                    onMouseOut={(e) => e.target.style.background = '#ffcccc'}
                >
                    Вийти
                </button>
            ) : (
                <Link to={type === 'attendance' ? "/educator/groups" : "/educator"} className="back-btn">
                    {type === 'attendance' ? '⬅ До списку груп' : '⬅ На головну'}
                </Link>
            )}
          </div>
      </div>

      {/* --- КОНТЕНТ --- */}
      <div style={{padding: '40px', maxWidth: '1200px', margin: '0 auto'}}>
        
        {loading && <p style={{textAlign:'center', color:'#666'}}>Завантаження даних...</p>}

        {/* 1. МЕНЮ */}
        {!loading && type === 'menu' && (
             <div style={{display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginTop: '50px'}}>
                <Link to="/educator/groups" className="dashboard-card" style={{textDecoration: 'none'}}>
                    <span className="card-icon">🧸</span>
                    <span className="card-title">Мої Групи</span>
                    <div style={{color: '#777', marginTop: '10px'}}>Відмітити присутність</div>
                </Link>

                <Link to="/educator/schedule" className="dashboard-card" style={{textDecoration: 'none'}}>
                    <span className="card-icon">📅</span>
                    <span className="card-title">Розклад</span>
                    <div style={{color: '#777', marginTop: '10px'}}>Графік занять</div>
                </Link>
            </div>
        )}

        {/* 2. СПИСОК ГРУП */}
        {!loading && type === 'groups' && (
            <div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap'}}>
                {data.length === 0 ? <p>Груп не знайдено</p> : data.map(g => (
                    <div key={g.id} onClick={() => navigate(`/educator/groups/${g.id}`)} style={{
                        background: 'white', padding: '30px', borderRadius: '15px', 
                        width: '250px', textAlign: 'center', cursor: 'pointer',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)', transition: '0.3s',
                        border: '2px solid transparent'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#0288d1'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                        <div style={{fontSize: '40px'}}>🏫</div>
                        <h3 style={{margin: '10px 0', color: '#0288d1'}}>{g.name}</h3>
                        <p style={{color: '#666'}}>{g.age_category}</p>
                        <div style={{background: '#e1f5fe', padding: '5px', borderRadius: '5px', color: '#0277bd', fontWeight: 'bold'}}>
                            Дітей: {g.child_count} / {g.max_capacity}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* 3. ТАБЕЛЬ */}
        {!loading && type === 'attendance' && (
            <div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', paddingBottom: '80px'}}>
                    {data.map(child => (
                        <div key={child.id} style={{
                            background: 'white', borderRadius: '15px', padding: '20px', 
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                            borderLeft: `8px solid ${child.status === 'Присутній' ? '#4caf50' : '#f44336'}`,
                            position: 'relative'
                        }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                                
                                {/* БЛОК ІМ'Я + КНОПКА БАТЬКІВ */}
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <div style={{fontWeight: 'bold', fontSize: '18px'}}>
                                        {child.last_name} {child.first_name}
                                    </div>
                                    <button 
                                        onClick={() => setViewParents(child.relatives)}
                                        title="Показати контакти батьків"
                                        style={{
                                            background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 5px'
                                        }}
                                    >
                                        (👁️)
                                    </button>
                                </div>

                                <button onClick={() => toggleStatus(child.id)} style={{
                                    padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white',
                                    background: child.status === 'Присутній' ? '#4caf50' : '#f44336',
                                    transition: '0.2s'
                                }}>
                                    {child.status}
                                </button>
                            </div>
                            {child.status === 'Відсутній' && (
                                <input placeholder="Причина..." value={child.reason} onChange={(e) => handleReasonChange(child.id, e.target.value)} style={{width: '90%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px'}} />
                            )}
                        </div>
                    ))}
                </div>
                {/* Плаваюча кнопка збереження */}
                <div style={{position: 'fixed', bottom: '30px', right: '30px'}}>
                    <button onClick={handleSaveAttendance} style={{
                        padding: '15px 40px', fontSize: '18px', fontWeight: 'bold', color: 'white', background: '#0288d1', border: 'none', borderRadius: '50px', boxShadow: '0 4px 15px rgba(2, 136, 209, 0.4)', cursor: 'pointer'
                    }}>💾 Зберегти</button>
                </div>
            </div>
        )}

        {/* 4. РОЗКЛАД */}
        {!loading && type === 'schedule' && (
            <div style={{background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}}>
                {data.length === 0 ? <p style={{textAlign: 'center'}}>Розкладу немає</p> : (
                    <table className="styled-table" style={{width: '100%'}}>
                        <thead>
                            <tr>
                                <th>День</th>
                                <th>Час</th>
                                <th>Заняття</th>
                                <th>Група</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx}>
                                    <td><b>{row.day_of_week}</b></td>
                                    {/* 👇 ОСЬ ЦЕЙ РЯДОК МИ ВИПРАВИЛИ 👇 */}
                                    <td>{row.time_start ? row.time_start.substring(0, 5) : '-'}</td>
                                    <td>{row.activity_name}</td>
                                    <td>{row.group_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )}

      </div>

      {/* --- МОДАЛКА БАТЬКІВ --- */}
      {viewParents && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }} onClick={() => setViewParents(null)}>
          <div style={{
              background: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '500px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            
            <h3 style={{marginTop: 0, color: '#34495e', borderBottom: '2px solid #3498db', paddingBottom: '10px'}}>
                👨‍👩‍👧 Контакти батьків
            </h3>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '60vh', overflowY: 'auto'}}>
                {viewParents.length === 0 ? <p style={{color: '#777'}}>Інформація відсутня</p> : viewParents.map((parent, idx) => (
                    <div key={idx} style={{
                        padding: '15px', border: '1px solid #eee', borderRadius: '10px', background: '#fafafa'
                    }}>
                        <div style={{fontWeight: 'bold', color: '#d63384', marginBottom: '5px'}}>
                            {parent.type}
                        </div>
                        <div style={{fontSize: '18px', marginBottom: '5px'}}>
                            {parent.name}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: '#333'}}>
                            📞 {parent.phone}
                        </div>
                        {parent.address && <div style={{fontSize: '13px', color: '#666', marginTop: '5px'}}>🏠 {parent.address}</div>}
                    </div>
                ))}
            </div>

            <button onClick={() => setViewParents(null)} style={{
                marginTop: '20px', width: '100%', padding: '12px', background: '#ff5252', color: 'white',
                border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px'
            }}>
                Закрити
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default EducatorDashboard;