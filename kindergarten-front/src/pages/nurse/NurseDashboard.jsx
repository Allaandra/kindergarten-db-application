import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../admin/styles/Admin.css'; // Переконайся, що шлях до CSS правильний

const NurseDashboard = ({ user, onLogout, type }) => {
  const [records, setRecords] = useState([]);
  const [childrenList, setChildrenList] = useState([]);
  const [typesList, setTypesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Форма
  const [formData, setFormData] = useState({ childId: "", typeId: "", description: "" });
  const [isModalOpen, setModalOpen] = useState(false);

  const auth = { username: user.username, password: user.password };

  // --- ЗАВАНТАЖЕННЯ ДАНИХ ---
  useEffect(() => {
    if (type === 'medical') {
        fetchData();
    }
  }, [type]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const resRec = await axios.post('http://localhost:3000/api/nurse/records', { auth });
        setRecords(resRec.data.rows);

        const resChild = await axios.post('http://localhost:3000/api/nurse/children', { auth });
        setChildrenList(resChild.data.rows);

        const resTypes = await axios.post('http://localhost:3000/api/nurse/types', { auth });
        setTypesList(resTypes.data.rows);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // --- ОБРОБНИКИ ---
  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          await axios.post('http://localhost:3000/api/nurse/records/add', { auth, ...formData });
          alert('Запис додано! 💖');
          setFormData({ childId: "", typeId: "", description: "" });
          setModalOpen(false);
          fetchData();
      } catch (err) { alert('Помилка збереження'); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm('Точно видалити?')) return;
      try {
          await axios.post('http://localhost:3000/api/nurse/records/delete', { auth, id });
          fetchData();
      } catch (err) { alert('Помилка видалення'); }
  };

  // --- РЕНДЕР ---
  return (
    <div className="admin-page">
      
      {/* 1. ШАПКА (ідентична до Admin/Educator) */}
      <div className="header-row">
          <h2 className="user-greeting">
              💅 Кабінет Медсестри
          </h2>
          <div>
            {type === 'menu' ? (
                <button 
                    onClick={onLogout} 
                    className="btn-pink"
                    // Додаємо інлайн стиль для кнопки виходу, як у Вихователя, щоб була рожевою
                    style={{
                        background: '#ffcccc', 
                        color: '#c0392b', 
                        border: 'none', 
                        padding: '10px 25px', 
                        borderRadius: '25px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#ffb3b3'}
                    onMouseOut={(e) => e.target.style.background = '#ffcccc'}
                >
                    Вийти
                </button>
            ) : (
                <Link to="/nurse" style={{
                    textDecoration: 'none', 
                    background: '#e1f5fe', 
                    color: '#0288d1', 
                    padding: '10px 20px', 
                    borderRadius: '20px', 
                    fontWeight: 'bold'
                }}>
                    ⬅ На головну
                </Link>
            )}
          </div>
      </div>

      {/* 2. КОНТЕНТ */}
      
        {/* ВАРІАНТ А: ГОЛОВНЕ МЕНЮ */}
        {type === 'menu' && (
            <div className="dashboard-content-centered">
                <div className="dashboard-grid">
                    <Link to="/nurse/medical" className="dashboard-card">
                        <span className="card-icon">🩺</span>
                        <span className="card-title">Мед. Карти</span>
                    </Link>
                    <Link to="/nurse/menu" className="dashboard-card">
                        <span className="card-icon">🍏</span>
                        <span className="card-title">Меню</span>
                    </Link>
                    <Link to="/nurse/dishes" className="dashboard-card">
                        <span className="card-icon">🍲</span>
                        <span className="card-title">Страви</span>
                    </Link>
                </div>
            </div>
        )}

        {/* ВАРІАНТ Б: ТАБЛИЦЯ МЕД. КАРТ */}
        {type === 'medical' && (
            <div className="admin-card-table">
                <div className="list-header">
                    <h2 className="page-title">Медичний журнал</h2>
                    {/* Кнопка додавання (стилізована під рожеву) */}
                    <button onClick={() => setModalOpen(true)} style={{
                        background: '#f48fb1', color: 'white', border: 'none', 
                        padding: '10px 20px', borderRadius: '20px', 
                        cursor: 'pointer', fontWeight: 'bold', fontSize: '16px'
                    }}>
                        + Новий запис
                    </button>
                </div>

                {loading ? <p style={{textAlign:'center'}}>Завантаження...</p> : (
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Дитина</th>
                                <th>Тип</th>
                                <th>Опис</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id}>
                                    <td>{r.record_date}</td>
                                    <td style={{fontWeight:'bold'}}>{r.child_name}</td>
                                    <td>
                                        <span style={{
                                            padding:'5px 10px', background:'#fce4ec', color:'#ad1457', 
                                            borderRadius:'15px', fontSize:'12px', fontWeight:'bold'
                                        }}>
                                            {r.type_name}
                                        </span>
                                    </td>
                                    <td>{r.description}</td>
                                    <td>
                                        <span className="action-link delete" onClick={() => handleDelete(r.id)}>
                                            Видалити
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )}

        {/* 3. МОДАЛКА (Використовує класи з Admin.css) */}
        {isModalOpen && (
            <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3 className="modal-title">✨ Новий запис</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Дитина</label>
                            <select value={formData.childId} onChange={e => setFormData({...formData, childId: e.target.value})} required>
                                <option value="">Оберіть малюка...</option>
                                {childrenList.map(c => <option key={c.id} value={c.id}>{c.last_name} {c.first_name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Тип запису</label>
                            <select value={formData.typeId} onChange={e => setFormData({...formData, typeId: e.target.value})} required>
                                <option value="">Що трапилось?</option>
                                {typesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Опис / Діагноз</label>
                            <textarea 
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                required 
                                style={{width:'100%', minHeight:'80px', padding:'10px', border:'1px solid #ddd', borderRadius:'10px'}}
                            ></textarea>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Скасувати</button>
                            <button type="submit" style={{
                                background: '#f48fb1', color: 'white', border: 'none', 
                                padding: '12px 25px', borderRadius: '12px', 
                                fontWeight: 'bold', cursor: 'pointer'
                            }}>Зберегти 💖</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

    </div>
  );
};

export default NurseDashboard;