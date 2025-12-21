import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './styles/Admin.css';

// Импортируем формы
import GroupForm from './forms/GroupForm';
import EmployeeForm from './forms/EmployeeForm';
import RelativeForm from './forms/RelativeForm';
import ChildForm from './forms/ChildForm';
import { COLUMN_MAP, HIDDEN_FIELDS } from './config';

const AdminList = ({ user, type }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Справочники
  const [educatorsList, setEducatorsList] = useState([]);
  const [positionsList, setPositionsList] = useState([]); 
  const [groupsList, setGroupsList] = useState([]); 
  const [relativesList, setRelativesList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]); 
  const [dishesList, setDishesList] = useState([]);       

  // Фильтры
  const [filterGroupId, setFilterGroupId] = useState(null);
  // Дата по умолчанию - сегодня
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [isModalOpen, setModalOpen] = useState(false);
  const [viewParents, setViewParents] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', ageCategory: 'Молодша (3-4 роки)', maxCapacity: 20, educatorId: "",
    firstName: '', lastName: '', patronymic: '', phone: '+380', address: '', 
    positionId: '', dbUsername: '', password: '', birthDate: '', groupId: "",
    relatives: [{ relativeId: "", type: "Мати" }],
    activityId: "", day: "Понеділок", time: "09:00",
    calories: "", date: "", breakfastId: "", lunchId: "", snackId: "", dinnerId: ""
  });

  const config = {
    groups:    { title: 'Групи', btn: 'Додати групу', endpoint: '/api/groups' },
    employees: { title: 'Співробітники', btn: 'Додати співробітника', endpoint: '/api/employees' },
    children:  { title: 'Діти', btn: 'Зарахувати дитину', endpoint: '/api/children' },
    relatives: { title: 'Батьки', btn: 'Додати родича', endpoint: '/api/relatives' },
    schedule:  { title: 'Розклад занять', btn: 'Додати урок', endpoint: '/api/schedule' },
    dishes:    { title: 'Довідник страв', btn: 'Додати страву', endpoint: '/api/dishes' },
    menu:      { title: 'Меню харчування', btn: 'Скласти меню', endpoint: '/api/menu' },
    // Журнал (кнопки нет)
    attendance:{ title: 'Журнал відвідування', btn: '', endpoint: '/api/attendance' }
  }[type];

  const auth = { username: user.username, password: user.password };

  // 1. ЗАГРУЗКА ДАННЫХ
  const fetchData = async () => {
    if (!type || !config) return;
    setLoading(true);
    try {
      const payload = { 
          auth, 
          // Отправляем дату и группу (если выбраны)
          date: filterDate, 
          groupId: filterGroupId 
      };
      
      // Используем правильный endpoint
      const res = await axios.post(`http://localhost:3000${config.endpoint}`, payload);
      setData(res.data.rows);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Перезагрузка при смене даты или фильтров
  useEffect(() => {
      fetchData();
  }, [filterDate, filterGroupId, type]);

  // 2. ЗАГРУЗКА СПРАВОЧНИКОВ
  useEffect(() => {
    const fetchHelpers = async () => {
      try {
        if (type === 'groups') {
             const res = await axios.post('http://localhost:3000/api/groups/educators', { auth });
             setEducatorsList(res.data.rows);
        }
        if (type === 'employees') {
             const res = await axios.post('http://localhost:3000/api/employees/positions', { auth });
             setPositionsList(res.data.rows);
        }
        // Группы нужны везде, где есть списки или журнал
        if (['children', 'schedule', 'menu', 'attendance'].includes(type)) {
             const resGroups = await axios.post('http://localhost:3000/api/groups', { auth });
             setGroupsList(resGroups.data.rows);
        }
        if (type === 'children') {
             const resRelatives = await axios.post('http://localhost:3000/api/relatives', { auth });
             setRelativesList(resRelatives.data.rows);
        }
        if (type === 'schedule') {
             const resActiv = await axios.post('http://localhost:3000/api/schedule/activities', { auth });
             setActivitiesList(resActiv.data.rows);
        }
        if (type === 'menu') {
             const resDishes = await axios.post('http://localhost:3000/api/dishes', { auth });
             setDishesList(resDishes.data.rows);
        }
      } catch (err) { console.error(err); }
    };
    fetchHelpers();
  }, [type]);

  useEffect(() => {
    if (location.state?.filterGroupId && type === 'children') {
      setFilterGroupId(location.state.filterGroupId);
    } else if (type !== 'attendance') {
      // Для журнала фильтр не сбрасываем автоматически
      setFilterGroupId(null);
    }
  }, [location.state, type]);


  // --- ОБРАБОТЧИКИ ---

  const handleEdit = (row) => {
    // 1. Проверка на запрет редактирования
    if (['schedule', 'menu', 'attendance'].includes(type)) {
        alert("Редагування тут недоступне.");
        return;
    }

    // 2. Сначала ставим ID
    setEditingId(row.id);

    // 3. Один раз и правильно заполняем форму
    setFormData({
        ...formData, // Берем дефолтные значения
        ...row,      // Кидаем все, что пришло из базы (на всякий случай)
        
        // 👇 ВРУЧНУЮ ПЕРЕКЛАДЫВАЕМ ПОЛЯ (snake_case -> camelCase)
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        patronymic: row.patronymic || '', // Не забудь отчество
        phone: row.phone || '+380',
        
        educatorId: row.educator_id || "",
        positionId: row.position_id || "",
        groupId: row.group_id || "",
        dbUsername: row.db_username || "",
        
        ageCategory: row.age_category || formData.ageCategory,
        maxCapacity: row.max_capacity || 20,
        
        // Дату обрезаем, если она есть
        birthDate: row.birthday_date ? String(row.birthday_date).substring(0, 10) : '',
        
        // Родители
        relatives: (row.relatives && row.relatives.length > 0) 
            ? row.relatives 
            : [{ relativeId: "", type: "Мати" }]
    });

    // 4. Открываем модалку
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
        activityId: "", day: "Понеділок", time: "09:00",
        calories: "", date: "", breakfastId: "", lunchId: "", snackId: "", dinnerId: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = editingId ? '/update' : (['schedule','menu','dishes'].includes(type) ? '/add' : '/create');
    const url = `${config.endpoint}${action}`;

    try {
      await axios.post(`http://localhost:3000${url}`, {
        auth, ...formData, data: formData, id: editingId
      });
      alert('Успішно!');
      handleCloseModal();
      fetchData();
    } catch (err) { alert('Помилка: ' + (err.response?.data?.error || err.message)); }
  };

  const handleDelete = async (id) => {
      if (!window.confirm('Видалити?')) return;
      try {
        await axios.post(`http://localhost:3000${config.endpoint}/delete`, { auth, id });
        fetchData();
      } catch (err) { alert('Помилка: ' + (err.response?.data?.error || err.message)); }
  };

  const handleShowParents = (row) => {
    if (!row.relatives || row.relatives.length === 0) { alert("Немає даних"); return; }
    const details = row.relatives.map(link => ({ 
        ...link, 
        person: relativesList.find(r => r.id === link.relativeId) 
    }));
    setViewParents(details);
  };

  const formatValue = (val) => {
    if (!val) return <span className="null-value">-</span>;
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) return new Date(val).toLocaleDateString('uk-UA');
    return val;
  };

  // --- ОТОБРАЖЕНИЕ ---
  const filteredData = (type === 'children' && filterGroupId) 
    ? data.filter(i => i.group_id === filterGroupId) 
    : data;

  let visibleKeys = [];
  if (!['schedule', 'dishes', 'menu', 'attendance'].includes(type)) {
      visibleKeys = filteredData.length > 0 
        ? Object.keys(filteredData[0]).filter(key => !HIDDEN_FIELDS.includes(key)) 
        : [];
      if (type === 'children' && !visibleKeys.includes('parents_btn')) visibleKeys.push('parents_btn');
  }

  return (
    <div className="admin-page" style={{display: 'block'}}>
      <div className="admin-card-table">
        
        {/* ШАПКА */}
        <div className="list-header" style={{flexWrap: 'wrap', gap: '15px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap'}}>
            <Link 
                to={user.role === 'role_nurse' ? "/nurse" : "/admin"} 
                className="back-btn"
            >⬅ Назад</Link>
            <h2 className="page-title">{config?.title}</h2>
            
            {/* ФИЛЬТРЫ ЖУРНАЛА */}
            {type === 'attendance' && (
                <>
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={e => setFilterDate(e.target.value)}
                        style={{padding: '8px', borderRadius: '10px', border: '1px solid #ddd'}}
                    />
                    <select 
                        value={filterGroupId || ""} 
                        onChange={e => setFilterGroupId(e.target.value || null)}
                        style={{padding: '8px', borderRadius: '10px', border: '1px solid #ddd', width: '200px'}}
                    >
                        <option value="">Всі групи</option>
                        {groupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </>
            )}

            {filterGroupId && type === 'children' && (
                <button onClick={() => { setFilterGroupId(null); navigate(location.pathname, { state: {} }); }} style={{borderRadius:'20px', padding: '5px 10px', cursor:'pointer'}}>✕ Скинути фільтр</button>
            )}
          </div>
          
          {config?.btn && (
            <button className="btn-pink" onClick={() => { setEditingId(null); setModalOpen(true); }}>
                {config?.btn}
            </button>
          )}
        </div>

        {/* ТАБЛИЦА */}
        {loading ? <p>Завантаження...</p> : (
          <div style={{overflowX: 'auto'}}>
            <table className="styled-table">
              <thead>
                <tr>
                    {/* СТАРЫЕ */}
                    {!['schedule', 'dishes', 'menu', 'attendance'].includes(type) && visibleKeys.map(key => (
                        <th key={key}>{COLUMN_MAP[key] || key.toUpperCase()}</th>
                    ))}
                    
                    {/* НОВЫЕ (Включая Attendance) */}
                    {type === 'schedule' && <><th>ГРУПА</th><th>ДЕНЬ</th><th>ЧАС</th><th>ЗАНЯТТЯ</th></>}
                    {type === 'dishes' && <><th>НАЗВА</th><th>КАЛОРІЇ</th></>}
                    {type === 'menu' && <><th>ДАТА</th><th>ГРУПА</th><th>СНІДАНОК</th><th>ОБІД</th><th>ПОЛУДЕНОК</th><th>ВЕЧЕРЯ</th></>}
                    
                    {/* 👇 ВОТ ЭТО МЫ ДОБАВИЛИ */}
                    {type === 'attendance' && <><th>ПІБ ДИТИНИ</th><th>ГРУПА</th><th>СТАТУС</th><th>ПРИЧИНА</th></>}
                    
                    {/* Скрываем колонку действий для журнала */}
                    {type !== 'attendance' && <th style={{textAlign: 'right', paddingRight: '55px'}}>ДІЇ</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map((row, index) => (
                  <tr key={index}>
                    
                    {/* СТАРЫЕ ЯЧЕЙКИ */}
                    {!['schedule', 'dishes', 'menu', 'attendance'].includes(type) && visibleKeys.map((key) => {
                        if (type === 'groups' && key === 'name') {
                            return <td key={key}><span onClick={() => navigate('/admin/children', { state: { filterGroupId: row.id } })} className='hyperlink-table'>{formatValue(row[key])}</span></td>;
                        }
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
                        return <td key={key}>{formatValue(row[key])}</td>;
                    })}

                    {/* НОВЫЕ ЯЧЕЙКИ */}
                    {type === 'schedule' && <>
                        <td>{row.group_name}</td><td>{row.day_of_week}</td><td>{row.time_start}</td><td>{row.activity_name}</td>
                    </>}
                    {type === 'dishes' && <>
                        <td>{row.name}</td><td>{row.calories} ккал</td>
                    </>}
                    {type === 'menu' && <>
                        <td>{row.date}</td><td>{row.group_name}</td><td>{row.breakfast||'-'}</td><td>{row.lunch||'-'}</td><td>{row.snack||'-'}</td><td>{row.dinner||'-'}</td>
                    </>}
                    
                    {/* 👇 ЯЧЕЙКИ ЖУРНАЛА */}
                    {type === 'attendance' && <>
                        <td style={{fontWeight:'bold'}}>{row.full_name}</td>
                        <td>{row.group_name}</td>
                        <td style={{
                            color: row.status === 'Присутній' ? 'green' : (row.status === 'Відсутній' ? 'red' : 'gray'),
                            fontWeight: 'bold'
                        }}>
                            {row.status}
                        </td>
                        <td>{row.reason}</td>
                    </>}

                    {/* КНОПКИ ДЕЙСТВИЙ (Скрыты для журнала) */}
                    {type !== 'attendance' && (
                        <td style={{textAlign: 'right'}}>
                            {!['schedule', 'menu'].includes(type) && <span className="action-link" onClick={() => handleEdit(row)}>Ред.</span>}
                            <span className="action-link delete" onClick={() => handleDelete(row.id)}>Вид.</span>
                        </td>
                    )}
                  </tr>
                )) : <tr><td colSpan="10" style={{textAlign: 'center'}}>Записів немає</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* МОДАЛКИ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editingId ? 'Редагування' : config?.btn}</h3>
            <form onSubmit={handleSubmit}>
              {type === 'groups' && <GroupForm formData={formData} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} educatorsList={educatorsList} />}
              {type === 'employees' && <EmployeeForm formData={formData} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} positionsList={positionsList} editingId={editingId} />}
              {type === 'relatives' && <RelativeForm formData={formData} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} editingId={editingId} />}
              {type === 'children' && <ChildForm formData={formData} setFormData={setFormData} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} groupsList={groupsList} relativesList={relativesList} />}

              {type === 'schedule' && (
                  <><div className="form-group"><label>Група</label><select name="groupId" value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})} required><option value="">Оберіть...</option>{groupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div><div className="form-group"><label>Заняття</label><select name="activityId" value={formData.activityId} onChange={e => setFormData({...formData, activityId: e.target.value})} required><option value="">Оберіть...</option>{activitiesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div><div className="form-group"><label>День</label><select name="day" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} required>{['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця"].map(d => <option key={d} value={d}>{d}</option>)}</select></div><div className="form-group"><label>Час</label><input type="time" name="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required style={{width: '100%', padding: '10px'}} /></div></>
              )}
              {type === 'dishes' && (
                  <><div className="form-group"><label>Назва</label><input type="text" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{width: '100%', padding: '10px'}} /></div><div className="form-group"><label>Калорії</label><input type="number" name="calories" value={formData.calories} onChange={e => setFormData({...formData, calories: e.target.value})} required style={{width: '100%', padding: '10px'}} /></div></>
              )}
              {type === 'menu' && (
                  <><div className="form-group"><label>Дата</label><input type="date" name="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required style={{width: '100%', padding: '10px'}} /></div><div className="form-group"><label>Група</label><select name="groupId" value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})} required><option value="">Оберіть групу</option>{groupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div><div className="form-group"><label>Сніданок</label><select name="breakfastId" value={formData.breakfastId} onChange={e => setFormData({...formData, breakfastId: e.target.value})}><option value="">--</option>{dishesList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div className="form-group"><label>Обід</label><select name="lunchId" value={formData.lunchId} onChange={e => setFormData({...formData, lunchId: e.target.value})}><option value="">--</option>{dishesList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div className="form-group"><label>Полуденок</label><select name="snackId" value={formData.snackId} onChange={e => setFormData({...formData, snackId: e.target.value})}><option value="">--</option>{dishesList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div className="form-group"><label>Вечеря</label><select name="dinnerId" value={formData.dinnerId} onChange={e => setFormData({...formData, dinnerId: e.target.value})}><option value="">--</option>{dishesList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div></>
              )}
              <div className="modal-actions"><button type="button" className="btn-cancel" onClick={handleCloseModal}>Скасувати</button><button type="submit" className="btn-pink" style={{width: '100%'}}>Зберегти</button></div>
            </form>
          </div>
        </div>
      )}
      {viewParents && (
         <div className="modal-overlay" onClick={() => setViewParents(null)}><div className="modal-content"><h3 className="modal-title">Батьки</h3>{viewParents.map((item,i)=><div key={i} style={{borderBottom:'1px solid #eee', padding:'10px'}}><b>{item.type}</b>: {item.person ? `${item.person.last_name} ${item.person.first_name} (${item.person.phone})` : 'Видалено'}</div>)}<button className="btn-pink" style={{marginTop:'20px', width:'100%'}} onClick={() => setViewParents(null)}>Закрити</button></div></div>
      )}
    </div>
  );
};
export default AdminList;