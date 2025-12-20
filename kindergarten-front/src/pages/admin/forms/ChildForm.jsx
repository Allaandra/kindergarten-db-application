import React from 'react';

const ChildForm = ({ formData, onChange, groupsList }) => {
  return (
    <>
      <div style={{display: 'flex', gap: '10px'}}>
          <div className="form-group" style={{flex: 1}}>
            <label className="form-label">Ім'я дитини</label>
            <input name="firstName" required value={formData.firstName} onChange={onChange} />
          </div>
          <div className="form-group" style={{flex: 1}}>
            <label className="form-label">Прізвище дитини</label>
            <input name="lastName" required value={formData.lastName} onChange={onChange} />
          </div>
      </div>
      <div className="form-group">
        <label className="form-label">По батькові дитини</label>
        <input name="patronymic" value={formData.patronymic} onChange={onChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Дата народження</label>
        <input type="date" name="birthDate" required value={formData.birthDate} onChange={onChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Група</label>
        <select name="groupId" value={formData.groupId} onChange={onChange}>
          <option value="">-- Не призначено --</option>
          {groupsList.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.occupancy})</option>
          ))}
        </select>
      </div>
    </>
  );
};

export default ChildForm;