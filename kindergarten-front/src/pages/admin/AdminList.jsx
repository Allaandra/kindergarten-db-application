import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './styles/Admin.css';

// Імпортуємо форми для інших типів
import GroupForm from './forms/GroupForm';
import EmployeeForm from './forms/EmployeeForm';
import RelativeForm from './forms/RelativeForm';
import ChildForm from './forms/ChildForm';

const AdminList = ({ user, type }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Довідники (для select-ів)
  const [educatorsList, setEducatorsList] = useState([]);
  const [positionsList, setPositionsList] = useState([]); 
  const [groupsList, setGroupsList] = useState([]); 
  const [relativesList, setRelativesList] = useState([]);
  // НОВЕ: Список занять для розкладу
  const [activitiesList, setActivitiesList] = useState([]); 

  const [filterGroupId, setFilterGroupId] = useState(null);

  // Стан для модалки
  const [isModalOpen, setModalOpen] = useState(false);
  const [viewParents, setViewParents] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Єдиний об'єкт для всіх форм
  const [formData, setFormData] = useState({
    // Для Груп
    name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
    // Для Співробітників / Родичів
    firstName: '', lastName: '', patronymic: '', phone: '+380', address: '', 
    positionId: '', dbUsername: '', password: '', 
    // Для Дітей
    birthDate: '', groupId: "", relatives: [{ relativeId: "", type: "Мати" }],
    // НОВЕ: Для Розкладу
    activityId: "", day: "Понеділок", time: "09:00"
  });

  // --- НАЛАШТУВАННЯ СТОРІНКИ (Конфігурація) ---
  const config = {
    groups: { 
        title: 'Групи садочка', 
        btn: 'Додати групу', 
        endpoint: '/api/groups',
        // Які колонки показувати в таблиці
        cols: ['Назва', 'Вікова категорія', 'Дітей', 'Вихователь'], 
        keys: ['name', 'age_category', 'child_count', 'educator_name']
    },
    employees: { 
        title: 'Співробітники', 
        btn: 'Додати співробітника', 
        endpoint: '/api/employees',
        cols: ['ПІБ', 'Телефон', 'Посада', 'Логін'], 
        keys: ['full_name', 'phone', 'position_name', 'db_username']
    },
    relatives: { 
        title: 'Батьки (Родичі)', 
        btn: 'Додати родича', 
        endpoint: '/api/relatives',
        cols: ['ПІБ', 'Телефон', 'Адреса'], 
        keys: ['full_name', 'phone', 'address']
    },
    children: { 
        title: 'Діти', 
        btn: 'Зарахувати дитину', 
        endpoint: '/api/children',
        cols: ['ПІБ', 'Дата народження', 'Група', 'Батьки'], 
        keys: ['full_name', 'birthday_date', 'group_name', 'parents_btn'] // parents_btn - спец. ключ
    },
    // НОВЕ: Розклад
    schedule: {
        title: 'Розклад занять',
        btn: 'Додати урок',
        endpoint: '/api/schedule',
        cols: ['Група', 'День', 'Час', 'Заняття'],
        keys: ['group_name', 'day_of_week', 'time_start', 'activity_name']
    }
  }[type];

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ
  const fetchData = async () => {
    if (!type) return;
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:3000${config.endpoint}`, {
        auth: { username: user.username, password: user.password }
      });
      setData(res.data.rows);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Ефект фільтру (якщо прийшли з Груп у Діти)
  useEffect(() => {
    if (location.state?.filterGroupId && type === 'children') {
      setFilterGroupId(location.state.filterGroupId);
    } else {
      setFilterGroupId(null);
    }
  }, [location.state, type]);

  // 2. ЗАВАНТАЖЕННЯ ДОВІДНИКІВ
  useEffect(() => {
    const fetchHelpers = async () => {
      try {
        const auth = { username: user.username, password: user.password };
        
        if (type === 'groups') {
             const res = await axios.post('http://localhost:3000/api/groups/educators', { auth });
             setEducatorsList(res.data.rows);
        }
        if (type === 'employees') {
             const res = await axios.post('http://localhost:3000/api/employees/positions', { auth });
             setPositionsList(res.data.rows);
        }
        if (type === 'children') {
             const resGroups = await axios.post('http://localhost:3000/api/groups', { auth });
             setGroupsList(resGroups.data.rows);
             const resRelatives = await axios.post('http://localhost:3000/api/relatives', { auth });
             setRelativesList(resRelatives.data.rows);
        }
        // НОВЕ: Для розкладу треба Групи і Заняття
        if (type === 'schedule') {
             const resGroups = await axios.post('http://localhost:3000/api/groups', { auth });
             setGroupsList(resGroups.data.rows);
             const resActiv = await axios.post('http://localhost:3000/api/schedule/activities', { auth });
             setActivitiesList(resActiv.data.rows);
        }
      } catch (err) { console.error(err); }
    };
    fetchData();
    fetchHelpers();
  }, [type]);

  // 3. ОБРОБНИКИ ПОДІЙ
  const handleEdit = (row) => {
    if (type === 'schedule') {
        alert("Редагування розкладу поки недоступне. Видаліть і створіть заново.");
        return;
    }

    setEditingId(row.id);
    setFormData({
        ...formData, 
        ...row,
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        educatorId: row.educator_id || "",
        ageCategory: row.age_category || formData.ageCategory,
        maxCapacity: row.max_capacity || 20,
        positionId: row.position_id || "",
        dbUsername: row.db_username || "",
        groupId: row.group_id || "",
        birthDate: row.birthday_date ? String(row.birthday_date).substring(0, 10) : '',
        relatives: (row.relatives && row.relatives.length > 0) 
            ? row.relatives 
            : [{ relativeId: "", type: "Мати" }]
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({
        name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
        firstName: '', lastName: '', patronymic: '', phone: '+380', address: '', 
        positionId: '', dbUsername: '', password: '', birthDate: '', groupId: "",
        relatives: [{ relativeId: "", type: "Мати" }],
        activityId: "", day: "Понеділок", time: "09:00"
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === 'children') {
        const hasParent = formData.relatives && formData.relatives.some(r => r.relativeId && r.relativeId !== "");
        if (!hasParent) {
            alert("Помилка: Ви повинні вказати хоча б одного родича або опікуна!");
            return;
        }
    }

    const action = editingId ? '/update' : (type === 'schedule' ? '/add' : '/create'); // Для schedule у нас /add
    const url = `${config.endpoint}${action}`;

    try {
      await axios.post(`http://localhost:3000${url}`, {
        auth: { username: user.username, password: user.password },
        // Для розкладу ми передаємо поля прямо, для інших - у об'єкті data. 
        // Але наш бек для розкладу чекає прямі поля. 
        // Давай уніфікуємо: відправимо все розгорнуто, це не завадить.
        ...formData, 
        data: formData,
        id: editingId
      });
      alert('Успішно!');
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert('Помилка: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
      if (!window.confirm('Видалити запис?')) return;
      try {
        await axios.post(`http://localhost:3000${config.endpoint}/delete`, {
          auth: { username: user.username, password: user.password },
          id: id
        });
        alert('Видалено!');
        fetchData();
      } catch (err) { alert('Помилка: ' + (err.response?.data?.error || err.message)); }
  };

  const handleShowParents = (row) => {
    if (!row.relatives || row.relatives.length === 0) {
        alert("Родичі не вказані");
        return;
    }
    const details = row.relatives.map(link => {
        const person = relativesList.find(r => r.id === link.relativeId);
        return { ...link, person };
    });
    setViewParents(details);
  };

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return <span className="null-value">Не призначено</span>;
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) return new Date(val).toLocaleDateString('uk-UA');
    return val;
  };

  // Фільтрація
  const filteredData = (type === 'children' && filterGroupId)
    ? data.filter(item => item.group_id === filterGroupId)
    : data;

  return (
    <div className="admin-page" style={{display: 'block'}}>
      <div className="admin-card-table">
        <div className="list-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <Link to="/admin" className="back-btn">⬅ Назад</Link>
            <h2 className="page-title">{config?.title}</h2>
            
            {filterGroupId && type === 'children' && (
                <button 
                    onClick={() => { setFilterGroupId(null); navigate(location.pathname, { state: {} }); }}
                    style={{padding: '5px 10px', fontSize: '12px', background: '#e0f7fa', border: '1px solid #00acc1', borderRadius: '20px', cursor: 'pointer', color: '#006064'}}
                >
                    ✕ Фільтр: Тільки ця група
                </button>
            )}
          </div>
          <button className="btn-pink" onClick={() => { setEditingId(null); setModalOpen(true); }}>
            {config?.btn}
          </button>
        </div>

        {loading ? <p>Завантаження...</p> : (
          <div style={{overflowX: 'auto'}}>
            <table className="styled-table">
              <thead>
                <tr>
                  {/* Заголовки з конфіга */}
                  {config?.cols.map((col, idx) => <th key={idx}>{col}</th>)}
                  <th style={{textAlign: 'right', paddingRight: '55px'}}>ДІЇ</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map((row, index) => (
                  <tr key={index}>
                    {config?.keys.map((key) => {
                        // 1. Клік по групі (фільтр)
                        if (type === 'groups' && key === 'name') {
                            return (
                                <td key={key}>
                                    <span 
                                        onClick={() => navigate('/admin/children', { state: { filterGroupId: row.id } })}
                                        className='hyperlink-table'
                                        title="Подивитися дітей цієї групи"
                                    >
                                        {formatValue(row[key])}
                                    </span>
                                </td>
                            );
                        }
                        // 2. Кнопка "Батьки"
                        if (type === 'children' && key === 'parents_btn') {
                          const count = row.relatives ? row.relatives.length : 0;
                          return (
                              <td key={key} style={{textAlign: 'left'}}>
                                  {count > 0 ? (
                                      <button onClick={() => handleShowParents(row)} style={{padding: '4px 8px', background: '#e8f6f3', color: '#16a085', border: '1px solid #16a085', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}>
                                          👁️ Показати ({count})
                                      </button>
                                  ) : <span style={{color: '#ccc', fontSize: '12px'}}>NULL</span>}
                              </td>
                          );
                        }
                        // Звичайний вивід
                        return <td key={key}>{formatValue(row[key])}</td>;
                    })}
                    
                    <td style={{textAlign: 'right'}}>
                        {/* Для розкладу показуємо тільки Видалити */}
                        {type !== 'schedule' && (
                            <span className="action-link" onClick={() => handleEdit(row)}>Ред.</span>
                        )}
                        <span className="action-link delete" onClick={() => handleDelete(row.id)}>Вид.</span>
                    </td>
                  </tr>
                )) : (
                    <tr>
                        <td colSpan="10" style={{textAlign: 'center'}}>
                            {filterGroupId ? 'У цій групі поки немає дітей' : 'Записів немає'}
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editingId ? 'Редагування' : config?.btn}</h3>
            
            <form onSubmit={handleSubmit}>
              
              {/* ФОРМИ ДЛЯ РІЗНИХ ТИПІВ */}
              
              {type === 'groups' && (
                  <GroupForm formData={formData} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} educatorsList={educatorsList} />
              )}
              {type === 'employees' && (
                  <EmployeeForm formData={formData} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} positionsList={positionsList} editingId={editingId} />
              )}
              {type === 'relatives' && (
                  <RelativeForm formData={formData} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} editingId={editingId} />
              )}
              {type === 'children' && (
                  <ChildForm 
                      formData={formData} 
                      setFormData={setFormData} 
                      onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} 
                      groupsList={groupsList} 
                      relativesList={relativesList}
                  />
              )}

              {/* ВБУДОВАНА ФОРМА ДЛЯ РОЗКЛАДУ */}
              {type === 'schedule' && (
                  <>
                    <div className="form-group">
                        <label className="form-label">Група</label>
                        <select name="groupId" value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})} required>
                            <option value="">Оберіть групу</option>
                            {groupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Заняття</label>
                        <select name="activityId" value={formData.activityId} onChange={e => setFormData({...formData, activityId: e.target.value})} required>
                            <option value="">-- Оберіть заняття --</option>
                            {activitiesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">День тижня</label>
                        <select name="day" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} required>
                            {['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця"].map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Час початку</label>
                        <input type="time" name="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required style={{width: '100%', padding: '10px'}} />
                    </div>
                  </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Скасувати</button>
                <button type="submit" className="btn-pink" style={{width: '100%'}}>Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewParents && (
        <div className="modal-overlay" onClick={() => setViewParents(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <h3 className="modal-title">Батьки / Опікуни</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px'}}>
                {viewParents.map((item, idx) => (
                    <div key={idx} style={{padding: '10px', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa'}}>
                        <div>
                            <div style={{fontWeight: 'bold', color: '#d63384', fontSize: '14px'}}>{item.type}</div>
                            <div style={{fontSize: '16px', margin: '2px 0'}}>
                                {item.person ? `${item.person.last_name} ${item.person.first_name}` : <span style={{color:'red'}}>Видалено</span>}
                            </div>
                            {item.person?.address && <div style={{fontSize: '12px', color: '#666'}}>🏠 {item.person.address}</div>}
                        </div>
                        <div style={{textAlign: 'right'}}>
                            <div style={{fontWeight: 'bold', fontSize: '14px'}}>{item.person?.phone || '-'}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="modal-actions" style={{marginTop: '20px'}}>
                <button className="btn-pink" onClick={() => setViewParents(null)} style={{width: '100%'}}>Закрити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;