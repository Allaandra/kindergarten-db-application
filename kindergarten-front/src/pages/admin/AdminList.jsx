import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './styles/Admin.css';

// Імпортуємо налаштування та форми
import { COLUMN_MAP, HIDDEN_FIELDS } from './config';
import GroupForm from './forms/GroupForm';
import EmployeeForm from './forms/EmployeeForm';
import RelativeForm from './forms/RelativeForm';
import ChildForm from './forms/ChildForm';

const AdminList = ({ user, type }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Довідники (для select-ів)
  const [educatorsList, setEducatorsList] = useState([]);
  const [positionsList, setPositionsList] = useState([]); 
  const [groupsList, setGroupsList] = useState([]); 

  // Стан для модалки
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Єдиний об'єкт для всіх форм (тримаємо тут, передаємо вниз)
  const [formData, setFormData] = useState({
    name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
    firstName: '', lastName: '', patronymic: '', phone: '+380', address: '', 
    positionId: '', dbUsername: '', password: '', birthDate: '', groupId: ""
  });

  // --- НАЛАШТУВАННЯ СТОРІНКИ ЗАЛЕЖНО ВІД ТИПУ ---
  const config = {
    groups:    { title: 'Групи', btn: 'Додати групу', endpoint: '/api/groups' },
    employees: { title: 'Співробітники', btn: 'Додати співробітника', endpoint: '/api/employees' },
    children:  { title: 'Діти', btn: 'Зарахувати дитину', endpoint: '/api/children' },
    relatives: { title: 'Батьки (Родичі)', btn: 'Додати родича', endpoint: '/api/relatives' },
  }[type];

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ
  const fetchData = async () => {
    if (!type) return;
    setLoading(true);
    try {
      // Зверни увагу: ми використовуємо config.endpoint
      const res = await axios.post(`http://localhost:3000${config.endpoint}`, {
        auth: { username: user.username, password: user.password }
      });
      setData(res.data.rows);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // 2. ЗАВАНТАЖЕННЯ ДОВІДНИКІВ
  useEffect(() => {
    const fetchHelpers = async () => {
      try {
        const auth = { username: user.username, password: user.password };
        // Завантажуємо тільки те, що треба для конкретної сторінки
        if (type === 'groups') {
             const res = await axios.post('http://localhost:3000/api/groups/educators', { auth });
             setEducatorsList(res.data.rows);
        }
        if (type === 'employees') {
             const res = await axios.post('http://localhost:3000/api/employees/positions', { auth });
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

  // 3. ОБРОБНИКИ ПОДІЙ
  const handleEdit = (row) => {
    setEditingId(row.id);
    // Заповнюємо форму даними з рядка (автоматично підтягує співпадіння імен)
    setFormData({
        ...formData, // лишаємо дефолтні значення
        ...row,      // переписуємо тим, що прийшло з бази
        // Специфічні поля (дату обрізаємо, null міняємо на "")
        educatorId: row.educator_id || "",
        ageCategory: row.age_category || formData.ageCategory,
        maxCapacity: row.max_capacity || 20,
        positionId: row.position_id || "",
        dbUsername: row.db_username || "",
        groupId: row.group_id || "",
        birthDate: row.birthday_date ? String(row.birthday_date).substring(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    // Очищення форми (просто скидаємо в дефолт)
    setFormData({
        name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
        firstName: '', lastName: '', patronymic: '', phone: '+380', address: '', 
        positionId: '', dbUsername: '', password: '', birthDate: '', groupId: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Формуємо URL: /api/groups + /create (або /update)
    const action = editingId ? '/update' : '/create';
    const url = `${config.endpoint}${action}`;

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
      if (!window.confirm('Видалити запис?')) return;
      try {
        await axios.post(`http://localhost:3000${config.endpoint}/delete`, {
          auth: { username: user.username, password: user.password },
          id: id
        });
        alert('Видалено!');
        fetchData();
      } catch (err) { alert('Помилка: ' + err.message); }
  };

  // Допоміжна функція малювання значень
  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return <span className="null-value">Не призначено</span>;
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) return new Date(val).toLocaleDateString('uk-UA');
    return val;
  };

  const visibleKeys = data.length > 0 ? Object.keys(data[0]).filter(key => !HIDDEN_FIELDS.includes(key)) : [];

  return (
    <div className="admin-page" style={{display: 'block'}}>
      <div className="admin-card-table">
        <div className="list-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <Link to="/admin" className="back-btn">⬅ Назад</Link>
            <h2 className="page-title">{config?.title}</h2>
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
                  {visibleKeys.length > 0 ? visibleKeys.map((key) => (
                    <th key={key}>{COLUMN_MAP[key] || key.toUpperCase()}</th>
                  )) : <th>Інформація</th>}
                  <th style={{textAlign: 'right', paddingRight: '55px'}}>ДІЇ</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? data.map((row, index) => (
                  <tr key={index}>
                    {visibleKeys.map((key) => <td key={key}>{formatValue(row[key])}</td>)}
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
            <h3 className="modal-title">{editingId ? 'Редагування' : config?.btn}</h3>
            
            <form onSubmit={handleSubmit}>
              {/* Рендеримо потрібну форму залежно від типу сторінки */}
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
                  <ChildForm formData={formData} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} groupsList={groupsList} />
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