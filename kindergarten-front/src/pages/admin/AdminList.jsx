import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './styles/Admin.css';

// 1. Додаємо гарну назву для нової колонки
const COLUMN_MAP = {
  id: 'ID', 
  name: 'Назва групи', 
  age_category: 'Категорія', 
  max_capacity: 'Місць',
  
  educator_name: 'Вихователь', // <--- НОВЕ: Красиве ім'я
  educator_id: 'ID Вих.',      // Це ми сховаємо, назва не важлива
  
  // ... інші поля (first_name, phone тощо) залишаються як були
  first_name: "Ім'я",
  last_name: 'Прізвище',
  patronymic: 'По батькові',
  phone: 'Телефон',
  address: 'Адреса',
  position_name: 'Посада',
  position_id: 'Посада (ID)',
  db_username: 'Логін'
};

// 2. Ховаємо технічні ID, щоб таблиця була чистою
// Додай сюди 'educator_id'
const HIDDEN_FIELDS = ['position_id', 'db_username', 'educator_id'];

const AdminList = ({ user, type }) => {
  const [data, setData] = useState([]);
  
  // Списки для выпадающих меню
  const [educatorsList, setEducatorsList] = useState([]);
  const [positionsList, setPositionsList] = useState([]); // <--- НОВОЕ: список должностей

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Единое состояние для формы (добавили поля сотрудника)
  const [formData, setFormData] = useState({
    // Поля группы
    name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
    // Поля сотрудника
    firstName: '', lastName: '', patronymic: '', 
    phone: '+380', address: '', positionId: '', dbUsername: '', password: ''
  });

  let pageTitle = '';
  let addButtonText = '';
  let apiEndpoint = '';

  if (type === 'groups') {
    pageTitle = 'Групи'; addButtonText = 'Додати групу'; apiEndpoint = '/api/groups';
  } else if (type === 'employees') {
    pageTitle = 'Співробітники'; addButtonText = 'Додати співробітника'; apiEndpoint = '/api/employees';
  }else if (type === 'relatives') {
    pageTitle = 'Родичі'; addButtonText = 'Додати родича'; apiEndpoint = '/api/relatives';
  } else if (type === 'children') {
    pageTitle = 'Діти'; addButtonText = 'Зарахувати дитину'; apiEndpoint = '/api/children';
  }

  // Загрузка данных
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

  // Загрузка справочников (должности и воспитатели)
  useEffect(() => {
    const fetchHelpers = async () => {
      try {
        const auth = { username: user.username, password: user.password };
        
        // Если мы в Группах - нужны воспитатели
        if (type === 'groups') {
             const res = await axios.post('http://localhost:3000/api/educators', { auth });
             setEducatorsList(res.data.rows);
        }
        
        // Если мы в Сотрудниках - нужны должности
        if (type === 'employees') {
             const res = await axios.post('http://localhost:3000/api/positions', { auth });
             setPositionsList(res.data.rows);
        }

      } catch (err) { console.error(err); }
    };
    fetchData();
    fetchHelpers();
  }, [type]);

  
  // Підготовка колонок для відображення (фільтруємо сховані)
  const visibleKeys = data.length > 0 
    ? Object.keys(data[0]).filter(key => !HIDDEN_FIELDS.includes(key)) 
    : [];
  
  // Обработчик открытия окна
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
            positionId: row.position_id, // Беремо прихований ID для форми
            dbUsername: row.db_username || '' // Беремо прихований логін
        });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    // Сброс формы
    setFormData({
        name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
        firstName: '', lastName: '', patronymic: '', 
        phone: '+380', address: '', positionId: '', dbUsername: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let url = '';
    
    // ЛОГИКА ВЫБОРА URL
    if (type === 'groups') {
        url = editingId ? '/api/groups/update' : '/api/groups/create';
    } else if (type === 'employees') {
        url = editingId ? '/api/employees/update' : '/api/employees/create';
    }

    if (!url) { alert('Редагування для співробітників ще в розробці'); return; }

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
      if (!window.confirm('Ви точно хочете видалити цей запис? Це також закриє доступ до системи.')) return;
      
      let deleteEndpoint = '';
      
      // Вибираємо правильну адресу залежно від того, на якій ми вкладці
      if (type === 'groups') {
          deleteEndpoint = '/api/groups/delete';
      } else if (type === 'employees') {
          deleteEndpoint = '/api/employees/delete'; // <--- Додали це
      } else if (type === 'children') {
          // deleteEndpoint = '/api/children/delete'; // Це зробимо пізніше
      }
      
      if (!deleteEndpoint) {
          alert('Видалення для цього розділу ще не налаштовано');
          return;
      }
  
      try {
        await axios.post(`http://localhost:3000${deleteEndpoint}`, {
          auth: { username: user.username, password: user.password },
          id: id
        });
        
        alert('Успішно видалено!');
        fetchData(); // Оновлюємо таблицю
      } catch (err) {
        alert('Помилка: ' + (err.response?.data?.error || err.message));
      }
  };

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return <span className="null-value">NULL</span>;
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
                    {/* Малюємо тільки ВИДИМІ колонки */}
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
              
              {/* === ФОРМА ДЛЯ ГРУПП === */}
              {type === 'groups' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Назва групи</label>
                    <input name="name" required value={formData.name} onChange={handleInputChange} />
                  </div>
                  {/* ... остальные поля групп (категория, воспитатель, места) ... */}
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

              {/* === НОВОЕ: ФОРМА ДЛЯ СОТРУДНИКОВ === */}
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
                        <option key={pos.id} value={pos.id}>
                            {pos.name} (ID: {pos.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Адреса</label>
                    <input name="address" value={formData.address} onChange={handleInputChange} />
                  </div>

                  <div className="form-group" style={{background: '#e8f6f3', padding: '10px', borderRadius: '10px'}}>
                    <label className="form-label" style={{color: '#16a085'}}>🔗 Системний логін (db_username)</label>
                    <input 
                        name="dbUsername" 
                        placeholder="Наприклад: maria_educator" 
                        required 
                        value={formData.dbUsername} 
                        onChange={handleInputChange} 
                    />
                  </div>

                  <div className="form-group" style={{background: '#e8f6f3', padding: '10px', borderRadius: '10px', marginTop: '10px'}}>
                    <label className="form-label" style={{color: '#16a085'}}>🔑 Пароль для входу</label>
                    <input 
                        type="password"
                        name="password" 
                        placeholder={editingId ? "Залиште пустим, якщо не міняєте" : "Введіть пароль"} 
                        required={!editingId} // Обов'язковий тільки при створенні
                        value={formData.password || ''} 
                        onChange={handleInputChange} 
                    />
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
    </div>
  );
};

export default AdminList;