import React from 'react';

const RelativeForm = ({ formData, onChange, editingId }) => {
  return (
    <>
      <div style={{display: 'flex', gap: '10px'}}>
          <div className="form-group" style={{flex: 1}}>
            <label className="form-label">Ім'я</label>
            <input name="firstName" required value={formData.firstName} onChange={onChange} />
          </div>
          <div className="form-group" style={{flex: 1}}>
            <label className="form-label">Прізвище</label>
            <input name="lastName" required value={formData.lastName} onChange={onChange} />
          </div>
      </div>
      <div className="form-group">
        <label className="form-label">По батькові</label>
        <input name="patronymic" value={formData.patronymic} onChange={onChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Телефон (+380...)</label>
        <input name="phone" placeholder="+380..." required value={formData.phone} onChange={onChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Адреса проживання</label>
        <input name="address" value={formData.address} onChange={onChange} />
      </div>
      
      <div className="form-group" style={{background: '#e8f6f3', padding: '10px', borderRadius: '10px'}}>
        <label className="form-label" style={{color: '#16a085'}}>🔗 Системний логін</label>
        <input name="dbUsername" placeholder="Введіть логін" required value={formData.dbUsername} onChange={onChange} />
      </div>

      <div className="form-group" style={{background: '#e8f6f3', padding: '10px', borderRadius: '10px', marginTop: '10px'}}>
        <label className="form-label" style={{color: '#16a085'}}>🔑 Пароль</label>
        <input type="password" name="password" placeholder={editingId ? "Залиште пустим" : "Введіть пароль"} required={!editingId} value={formData.password || ''} onChange={onChange} />
      </div>
    </>
  );
};

export default RelativeForm;