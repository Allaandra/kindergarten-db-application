import React from 'react';

const ChildForm = ({ formData, setFormData, onChange, groupsList, relativesList }) => {

  // Якщо функція onChange не передана (бо ми використовуємо setFormData напряму для складних полів),
  // створимо просту обгортку для звичайних інпутів
  const handleSimpleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- ЛОГІКА ДЛЯ ДИНАМІЧНИХ РОДИЧІВ ---

  // Зміна конкретного рядка родича
  const handleRelativeChange = (index, field, value) => {
    const updatedRelatives = [...(formData.relatives || [])];
    updatedRelatives[index][field] = value;
    setFormData(prev => ({ ...prev, relatives: updatedRelatives }));
  };

  // Додати ще одного родича
  const addRelativeRow = () => {
    setFormData(prev => ({
      ...prev,
      relatives: [...(prev.relatives || []), { relativeId: "", type: "Батько" }]
    }));
  };

  // Видалити рядок (якщо натиснули помилково)
  const removeRelativeRow = (index) => {
    const updatedRelatives = [...(formData.relatives || [])];
    // Не даємо видалити останній рядок, щоб хоч один залишився (опціонально)
    if (updatedRelatives.length > 1) {
        updatedRelatives.splice(index, 1);
        setFormData(prev => ({ ...prev, relatives: updatedRelatives }));
    }
  };

  return (
    <>
      <div style={{display: 'flex', gap: '10px'}}>
          <div className="form-group" style={{flex: 1}}>
            <label className="form-label">Ім'я дитини</label>
            <input name="firstName" required value={formData.firstName} onChange={handleSimpleChange} />
          </div>
          <div className="form-group" style={{flex: 1}}>
            <label className="form-label">Прізвище дитини</label>
            <input name="lastName" required value={formData.lastName} onChange={handleSimpleChange} />
          </div>
      </div>

      <div className="form-group">
        <label className="form-label">По батькові дитини</label>
        <input name="patronymic" value={formData.patronymic} onChange={handleSimpleChange} />
      </div>

      <div className="form-group">
        <label className="form-label">Дата народження</label>
        <input type="date" name="birthDate" required value={formData.birthDate} onChange={handleSimpleChange} />
      </div>

      <div className="form-group">
        <label className="form-label">Група</label>
        <select name="groupId" value={formData.groupId} onChange={handleSimpleChange}>
          <option value="">-- Не призначено --</option>
          {groupsList.map(g => (
            <option key={g.id} value={g.id}>
              Група "{g.name}" - {g.age_category} ({g.occupancy})
            </option>
          ))}
        </select>
      </div>

      <hr style={{margin: '20px 0', border: '0', borderTop: '1px dashed #ccc'}} />
      
      <div style={{marginBottom: '10px', fontWeight: 'bold', color: '#555'}}>Родичі / Опікуни:</div>

      {/* Малюємо рядок для кожного родича */}
      {(formData.relatives || []).map((rel, index) => (
        <div key={index} style={{display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-end'}}>
            
            {/* Вибір людини зі списку */}
            <div style={{flex: 2}}>
                <label style={{fontSize: '12px'}}>Хто це?</label>
                <select 
                    value={rel.relativeId} 
                    onChange={(e) => handleRelativeChange(index, 'relativeId', e.target.value)}
                    style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                >
                    <option value="">-- Оберіть зі списку --</option>
                    {relativesList.map(r => (
                        <option key={r.id} value={r.id}>
                            {r.last_name} {r.first_name} {r.patronymic} ({r.phone})
                        </option>
                    ))}
                </select>
            </div>

            {/* Тип зв'язку */}
            <div style={{flex: 1}}>
                <label style={{fontSize: '12px'}}>Ким приходиться?</label>
                <select 
                    value={rel.type} 
                    onChange={(e) => handleRelativeChange(index, 'type', e.target.value)}
                    style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                >
                    <option value="Мати">Мати</option>
                    <option value="Батько">Батько</option>
                    <option value="Бабуся">Бабуся</option>
                    <option value="Дідусь">Дідусь</option>
                    <option value="Опікун">Опікун</option>
                    <option value="Інше">Інше</option>
                </select>
            </div>

            {/* Кнопка видалення рядка */}
            <button 
                type="button" 
                onClick={() => removeRelativeRow(index)}
                style={{background: '#ffdddd', border: 'none', color: 'red', cursor: 'pointer', padding: '0 10px', height: '35px', borderRadius: '4px'}}
                title="Прибрати"
            >
                ✕
            </button>
        </div>
      ))}

      <button 
        type="button" 
        onClick={addRelativeRow}
        style={{background: '#e8f6f3', color: '#16a085', border: '1px dashed #16a085', padding: '8px', width: '100%', borderRadius: '5px', cursor: 'pointer'}}
      >
        + Додати ще одного родича
      </button>

    </>
  );
};

export default ChildForm;