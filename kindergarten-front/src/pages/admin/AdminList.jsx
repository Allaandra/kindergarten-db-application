import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './styles/Admin.css';

// Імпортуємо налаштування та форми
import { COLUMN_MAP, HIDDEN_FIELDS } from './config';
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

  const [filterGroupId, setFilterGroupId] = useState(null);

  // Стан для модалки
  const [isModalOpen, setModalOpen] = useState(false);
  const [viewParents, setViewParents] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Єдиний об'єкт для всіх форм (тримаємо тут, передаємо вниз)
  const [formData, setFormData] = useState({
    name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
    firstName: '', lastName: '', patronymic: '', phone: '+380', address: '', 
    positionId: '', dbUsername: '', password: '', birthDate: '', groupId: "",

    relatives: [{ relativeId: "", type: "Мати" }]
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

  // Ефект: Якщо ми прийшли сюди з "Груп" із фільтром -> активуємо його
  useEffect(() => {
    if (location.state?.filterGroupId && type === 'children') {
      setFilterGroupId(location.state.filterGroupId);
    } else {
      // Якщо просто переключили вкладку меню - скидаємо фільтр
      setFilterGroupId(null);
    }
  }, [location.state, type]);

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
             // Вантажимо групи
             const resGroups = await axios.post('http://localhost:3000/api/groups', { auth });
             setGroupsList(resGroups.data.rows);

             // НОВЕ: Вантажимо родичів (використовуємо той самий endpoint, що і для таблиці батьків)
             const resRelatives = await axios.post('http://localhost:3000/api/relatives', { auth });
             setRelativesList(resRelatives.data.rows);
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
    // Очищення форми (просто скидаємо в дефолт)
    setFormData({
        name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
        firstName: '', lastName: '', patronymic: '', phone: '+380', address: '', 
        positionId: '', dbUsername: '', password: '', birthDate: '', groupId: "",

        relatives: [{ relativeId: "", type: "Мати" }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === 'children') {
        // Проверяем, есть ли в массиве relatives хоть одна запись с заполненным ID
        const hasParent = formData.relatives && formData.relatives.some(r => r.relativeId && r.relativeId !== "");
        
        if (!hasParent) {
            alert("Помилка: Ви повинні вказати хоча б одного родича або опікуна!");
            return; // Останавливаем отправку, ничего не происходит
        }
    }

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
      } catch (err) { alert('Помилка: ' + (err.response?.data?.error || err.message)); }
  };

  const handleShowParents = (row) => {
    // row.relatives содержит [{ relativeId: 1, type: 'Мати' }]
    // relativesList содержит полную инфу о всех родителях [{ id: 1, first_name: '...', phone: '...' }]

    if (!row.relatives || row.relatives.length === 0) {
        alert("Родичі не вказані");
        return;
    }

    // Собираем полную инфу
    const details = row.relatives.map(link => {
        // Ищем данные человека в общем списке
        const person = relativesList.find(r => r.id === link.relativeId);
        return {
            ...link, // тут type (Мати)
            person   // тут имя, телефон и т.д.
        };
    });

    setViewParents(details); // Открываем модалку
};

  // Допоміжна функція малювання значень
  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return <span className="null-value">Не призначено</span>;
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) return new Date(val).toLocaleDateString('uk-UA');
    return val;
  };

  // --- ЛОГІКА ФІЛЬТРАЦІЇ ---
  // Якщо є фільтр по групі (тільки для дітей) - показуємо лише потрібних
  const filteredData = (type === 'children' && filterGroupId)
    ? data.filter(item => item.group_id === filterGroupId)
    : data;

  // Використовуємо filteredData замість data для визначення колонок
  // 1. Спочатку отримуємо реальні колонки з бази
  let visibleKeys = filteredData.length > 0 
    ? Object.keys(filteredData[0]).filter(key => !HIDDEN_FIELDS.includes(key)) 
    : [];

  // 2. Якщо це вкладка "Діти" — ПРИМУСОВО додаємо нашу віртуальну колонку
  if (type === 'children' && !visibleKeys.includes('parents_btn')) {
      visibleKeys.push('parents_btn');
  }

  return (
    <div className="admin-page" style={{display: 'block'}}>
      <div className="admin-card-table">
        <div className="list-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <Link to="/admin" className="back-btn">⬅ Назад</Link>
            <h2 className="page-title">{config?.title}</h2>
            
            {/* КНОПКА СКИДАННЯ ФІЛЬТРУ (З'являється тільки якщо ми фільтруємо дітей) */}
            {filterGroupId && type === 'children' && (
                <button 
                    onClick={() => { setFilterGroupId(null); navigate(location.pathname, { state: {} }); }}
                    style={{
                        padding: '5px 10px', 
                        fontSize: '12px', 
                        background: '#e0f7fa', 
                        border: '1px solid #00acc1', 
                        borderRadius: '20px',
                        cursor: 'pointer',
                        color: '#006064'
                    }}
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
                  {visibleKeys.length > 0 ? visibleKeys.map((key) => (
                    <th key={key}>{COLUMN_MAP[key] || key.toUpperCase()}</th>
                  )) : <th>Інформація</th>}
                  <th style={{textAlign: 'right', paddingRight: '55px'}}>ДІЇ</th>
                </tr>
              </thead>
              <tbody>
                {/* ВАЖЛИВО: Використовуємо filteredData замість data */}
                {filteredData.length > 0 ? filteredData.map((row, index) => (
                  <tr key={index}>
                    {visibleKeys.map((key) => {
                        // ЛОГІКА КЛІКУ ПО НАЗВІ ГРУПИ
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

                        if (type === 'children' && key === 'parents_btn') {
                          const count = row.relatives ? row.relatives.length : 0;
                          return (
                              <td key={key} style={{textAlign: 'left'}}>
                                  {count > 0 ? (
                                      <button 
                                          onClick={() => handleShowParents(row)}
                                          style={{
                                              padding: '4px 8px',
                                              background: '#e8f6f3',
                                              color: '#16a085',
                                              border: '1px solid #16a085',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontSize: '12px'
                                          }}
                                      >
                                          👁️ Показати ({count})
                                      </button>
                                  ) : (
                                      <span style={{color: '#ccc', fontSize: '12px'}}>NULL</span>
                                  )}
                              </td>
                          );
                        }

                        // Звичайний вивід
                        return <td key={key}>{formatValue(row[key])}</td>;
                    })}
                    
                    <td style={{textAlign: 'right'}}>
                      <span className="action-link" onClick={() => handleEdit(row)}>Ред.</span>
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
                  <ChildForm 
                      formData={formData} 
                      setFormData={setFormData} 
                      onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} 
                      groupsList={groupsList} 
                      relativesList={relativesList}
                  />
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
                    <div key={idx} style={{
                        padding: '10px', 
                        border: '1px solid #eee', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fafafa'
                    }}>
                        <div>
                            {/* Тип связи жирным (Мати, Батько) */}
                            <div style={{fontWeight: 'bold', color: '#d63384', fontSize: '14px'}}>
                                {item.type}
                            </div>
                            
                            {/* Имя родителя (проверка, вдруг родителя удалили из базы) */}
                            <div style={{fontSize: '16px', margin: '2px 0'}}>
                                {item.person 
                                    ? `${item.person.last_name} ${item.person.first_name} ${item.person.patronymic}` 
                                    : <span style={{color:'red'}}>Дані родича видалено</span>
                                }
                            </div>
                            
                            {/* Адрес, если есть */}
                            {item.person?.address && (
                                <div style={{fontSize: '12px', color: '#666'}}>🏠 {item.person.address}</div>
                            )}
                        </div>

                        {/* Телефон крупно */}
                        <div style={{textAlign: 'right'}}>
                            <div style={{fontWeight: 'bold', fontSize: '14px'}}>
                                {item.person?.phone || '-'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="modal-actions" style={{marginTop: '20px'}}>
                <button 
                    className="btn-pink" 
                    onClick={() => setViewParents(null)} 
                    style={{width: '100%'}}
                >
                    Закрити
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;