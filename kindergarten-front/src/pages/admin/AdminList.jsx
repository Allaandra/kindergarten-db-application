import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './styles/Admin.css';

// КАРТА КОЛОНОК
const COLUMN_MAP = {
  id: 'ID', 
  // Групи
  name: 'Назва групи', 
  age_category: 'Категорія', 
  occupancy: 'Заповненість',
  educator_name: 'Вихователь',
  
  // Співробітники
  first_name: "Ім'я",
  last_name: 'Прізвище',
  patronymic: 'По батькові',
  phone: 'Телефон',
  address: 'Адреса',
  position_name: 'Посада',
  db_username: 'Логін',

  // ДІТИ
  birth_date: 'Дата народж.', 
  birthday_date: 'Дата народж.',
  group_name: 'Група',
  
  // Ці поля залишаємо в таблиці, але поки вони будуть пусті
  parent_name: 'Батьки',
  parent_phone: 'Телефон батьків'
};

// СХОВАНІ ПОЛЯ
const HIDDEN_FIELDS = [
    'position_id', 
    'db_username', 
    'educator_id', 
    'max_capacity', 
    'group_id',
    'parent_name',
    'parent_phone'
];

const AdminList = ({ user, type }) => {
  const [data, setData] = useState([]);
  
  // Списки для випадаючих меню
  const [educatorsList, setEducatorsList] = useState([]);
  const [positionsList, setPositionsList] = useState([]); 
  const [groupsList, setGroupsList] = useState([]); 

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Єдиний стан для форми
  const [formData, setFormData] = useState({
    // Групи
    name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
    // Співробітники
    firstName: '', lastName: '', patronymic: '', 
    phone: '+380', address: '', positionId: '', dbUsername: '', password: '',
    // Діти (батьків прибрали)
    birthDate: '', groupId: ""
  });

  let pageTitle = '';
  let addButtonText = '';
  let apiEndpoint = '';

  if (type === 'groups') {
    pageTitle = 'Групи'; addButtonText = 'Додати групу'; apiEndpoint = '/api/groups';
  } else if (type === 'employees') {
    pageTitle = 'Співробітники'; addButtonText = 'Додати співробітника'; apiEndpoint = '/api/employees';
  } else if (type === 'children') {
    pageTitle = 'Діти'; addButtonText = 'Зарахувати дитину'; apiEndpoint = '/api/children';
  }

  // Завантаження даних
  const fetchData = async () => {
    if (!type) return;
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:3000${apiEndpoint}`, {
        auth: { username: user.username, password: user.password }
      });
      setData(res.data.rows);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Завантаження довідників
  useEffect(() => {
    const fetchHelpers = async () => {
      try {
        const auth = { username: user.username, password: user.password };
        
        if (type === 'groups') {
             const res = await axios.post('http://localhost:3000/api/educators', { auth });
             setEducatorsList(res.data.rows);
        }
        if (type === 'employees') {
             const res = await axios.post('http://localhost:3000/api/positions', { auth });
             setPositionsList(res.data.rows);
        }
        if (type === 'children') {
             const res = await axios.post('http://localhost:3000/api/groups', { auth });
             setGroupsList(res.data.rows);
        }
      } catch (err) { console.error(err); }
    };
    fetchData();
    fetchHelpers();
  }, [type]);

  
  const visibleKeys = data.length > 0 
    ? Object.keys(data[0]).filter(key => !HIDDEN_FIELDS.includes(key)) 
    : [];
  
  // ВІДКРИТТЯ РЕДАГУВАННЯ
  const handleEdit = (row) => {
    setEditingId(row.id);
    
    if (type === 'groups') {
        setFormData({
            name: row.name, ageCategory: row.age_category, 
            maxCapacity: row.max_capacity, educatorId: row.educator_id || ""
        });
    } else if (type === 'employees') {
        setFormData({
            firstName: row.first_name, 
            lastName: row.last_name, 
            patronymic: row.patronymic || '',
            phone: row.phone, 
            address: row.address || '', 
            positionId: row.position_id, 
            dbUsername: row.db_username || ''
        });
    } else if (type === 'children') {
        setFormData({
            firstName: row.first_name,
            lastName: row.last_name,
            patronymic: row.patronymic || '',
            birthDate: row.birthday_date ? String(row.birthday_date).substring(0, 10) : '', 
            groupId: row.group_id || ""
        });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({
        name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
        firstName: '', lastName: '', patronymic: '', 
        phone: '+380', address: '', positionId: '', dbUsername: '', password: '',
        birthDate: '', groupId: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let url = '';
    
    if (type === 'groups') {
        url = editingId ? '/api/groups/update' : '/api/groups/create';
    } else if (type === 'employees') {
        url = editingId ? '/api/employees/update' : '/api/employees/create';
    } else if (type === 'children') {
        url = editingId ? '/api/children/update' : '/api/children/create';
    }

    try {
      await axios.post(`http://localhost:3000${url}`, {
        auth: { username: user.username, password: user.password },
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
      if (!window.confirm('Ви точно хочете видалити цей запис?')) return;
      
      let deleteEndpoint = '';
      if (type === 'groups') deleteEndpoint = '/api/groups/delete';
      else if (type === 'employees') deleteEndpoint = '/api/employees/delete';
      else if (type === 'children') deleteEndpoint = '/api/children/delete';
      
      try {
        await axios.post(`http://localhost:3000${deleteEndpoint}`, {
          auth: { username: user.username, password: user.password },
          id: id
        });
        
        alert('Успішно видалено!');
        fetchData();
      } catch (err) {
        alert('Помилка: ' + (err.response?.data?.error || err.message));
      }
  };

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return <span className="null-value">NULL</span>;
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return new Date(val).toLocaleDateString('uk-UA');
    }
    return val;
  };

  return (
    <div className="admin-page" style={{display: 'block'}}>
      <div className="admin-card-table">
        <div className="list-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <Link to="/admin" className="back-btn">⬅ Назад</Link>
            <h2 className="page-title">{pageTitle}</h2>
          </div>
          <button className="btn-pink" onClick={() => { setEditingId(null); setModalOpen(true); }}>
            {addButtonText}
          </button>
        </div>

        {loading ? <p>Завантаження...</p> : (
          <div style={{overflowX: 'auto'}}>
            <table className="styled-table">
              <thead>
                <tr>
                  {visibleKeys.length > 0 ? visibleKeys.map((key) => (
                    <th key={key}>{COLUMN_MAP[key] || key.toUpperCase()}</th>
                  )) : <th>Інформація</th>}
                  <th style={{textAlign: 'right', paddingRight: '55px'}}>ДІЇ</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? data.map((row, index) => (
                  <tr key={index}>
                    {visibleKeys.map((key) => (
                         <td key={key}>{formatValue(row[key])}</td>
                    ))}
                    <td style={{textAlign: 'right'}}>
                      <span className="action-link" onClick={() => handleEdit(row)}>Ред.</span>
                      <span className="action-link delete" onClick={() => handleDelete(row.id)}>Вид.</span>
                    </td>
                  </tr>
                )) : <tr><td colSpan="10" style={{textAlign: 'center'}}>Записів немає</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editingId ? 'Редагування' : addButtonText}</h3>
            
            <form onSubmit={handleSubmit}>
              
              {/* === ГРУПИ === */}
              {type === 'groups' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Назва групи</label>
                    <input name="name" required value={formData.name} onChange={handleInputChange} />
                  </div>
                   <div className="form-group">
                    <label className="form-label">Вікова категорія</label>
                    <select name="ageCategory" value={formData.ageCategory} onChange={handleInputChange}>
                      <option value="Ясельна (2-3 роки)">Ясельна (2-3 роки)</option>
                      <option value="Молодша (3-4 роки)">Молодша (3-4 роки)</option>
                      <option value="Середня (4-5 років)">Середня (4-5 років)</option>
                      <option value="Старша (5-6 років)">Старша (5-6 років)</option>
                      <option value="Підготовча (6-7 років)">Підготовча (6-7 років)</option>
                    </select>
                  </div>
                   <div className="form-group">
                    <label className="form-label">Вихователь</label>
                    <select name="educatorId" value={formData.educatorId} onChange={handleInputChange}>
                      <option value="">-- Не призначено --</option>
                      {educatorsList.map(emp => <option key={emp.id} value={emp.id}>{emp.last_name} {emp.first_name} {emp.patronymic}</option>)}
                    </select>
                  </div>
                   <div className="form-group">
                    <label className="form-label">Місць</label>
                    <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} />
                  </div>
                </>
              )}

              {/* === СПІВРОБІТНИКИ === */}
              {type === 'employees' && (
                <>
                  <div style={{display: 'flex', gap: '10px'}}>
                      <div className="form-group" style={{flex: 1}}>
                        <label className="form-label">Ім'я</label>
                        <input name="firstName" required value={formData.firstName} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{flex: 1}}>
                        <label className="form-label">Прізвище</label>
                        <input name="lastName" required value={formData.lastName} onChange={handleInputChange} />
                      </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">По батькові</label>
                    <input name="patronymic" value={formData.patronymic} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Телефон (+380...)</label>
                    <input name="phone" placeholder="+380991234567" required value={formData.phone} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Посада</label>
                    <select name="positionId" required value={formData.positionId} onChange={handleInputChange}>
                      <option value="">-- Оберіть посаду --</option>
                      {positionsList.map(pos => (
                        <option key={pos.id} value={pos.id}>{pos.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Адреса</label>
                    <input name="address" value={formData.address} onChange={handleInputChange} />
                  </div>
                  <div className="form-group" style={{background: '#e8f6f3', padding: '10px', borderRadius: '10px'}}>
                    <label className="form-label" style={{color: '#16a085'}}>🔗 Системний логін</label>
                    <input name="dbUsername" required value={formData.dbUsername} onChange={handleInputChange} />
                  </div>
                  <div className="form-group" style={{background: '#e8f6f3', padding: '10px', borderRadius: '10px', marginTop: '10px'}}>
                    <label className="form-label" style={{color: '#16a085'}}>🔑 Пароль</label>
                    <input type="password" name="password" placeholder={editingId ? "Залиште пустим, якщо не міняєте" : ""} required={!editingId} value={formData.password || ''} onChange={handleInputChange} />
                  </div>
                </>
              )}

              {/* === ДІТИ (СПРОЩЕНА ТА ГАРНА ФОРМА) === */}
              {type === 'children' && (
                <>
                  {/* Рядок 1: Ім'я та Прізвище поруч */}
                  <div style={{display: 'flex', gap: '10px'}}>
                      <div className="form-group" style={{flex: 1}}>
                        <label className="form-label">Ім'я дитини</label>
                        <input name="firstName" required value={formData.firstName} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{flex: 1}}>
                        <label className="form-label">Прізвище дитини</label>
                        <input name="lastName" required value={formData.lastName} onChange={handleInputChange} />
                      </div>
                  </div>

                  {/* Рядок 2: По батькові */}
                  <div className="form-group">
                    <label className="form-label">По батькові дитини</label>
                    <input name="patronymic" value={formData.patronymic} onChange={handleInputChange} />
                  </div>

                  {/* Рядок 3: Дата народження */}
                  <div className="form-group">
                    <label className="form-label">Дата народження</label>
                    <input type="date" name="birthDate" required value={formData.birthDate} onChange={handleInputChange} />
                  </div>

                  {/* Рядок 4: Група */}
                  <div className="form-group">
                    <label className="form-label">Група</label>
                    <select name="groupId" value={formData.groupId} onChange={handleInputChange}>
                      <option value="">-- Не призначено --</option>
                      {groupsList.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.occupancy})</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Блок з батьками прибрали, зробимо його пізніше */}
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
    </div>
  );
};

export default AdminList;