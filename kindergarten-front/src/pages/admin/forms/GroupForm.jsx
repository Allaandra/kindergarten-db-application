import React from 'react';

const GroupForm = ({ formData, onChange, educatorsList }) => {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Назва групи</label>
        <input name="name" required value={formData.name} onChange={onChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Вікова категорія</label>
        <select name="ageCategory" value={formData.ageCategory} onChange={onChange}>
          <option value="Ясельна (2-3 роки)">Ясельна (2-3 роки)</option>
          <option value="Молодша (3-4 роки)">Молодша (3-4 роки)</option>
          <option value="Середня (4-5 років)">Середня (4-5 років)</option>
          <option value="Старша (5-6 років)">Старша (5-6 років)</option>
          <option value="Підготовча (6-7 років)">Підготовча (6-7 років)</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Вихователь</label>
        <select name="educatorId" value={formData.educatorId} onChange={onChange}>
          <option value="">-- Не призначено --</option>
          {educatorsList.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.last_name} {emp.first_name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Місць</label>
        <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={onChange} />
      </div>
    </>
  );
};

export default GroupForm;