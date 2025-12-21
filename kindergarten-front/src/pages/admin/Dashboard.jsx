import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Admin.css';

const Dashboard = ({ onLogout }) => {
  return (
    <div className="admin-page">
      
      {/* ШАПКА: Текст зліва, Кнопка справа */}
      <div className="header-row">
        {/* Ім'я */}
        <h2 className="user-greeting">
          👋 Вітаємо, Адміністратор!
        </h2>
        
        {/* Кнопка Вийти */}
        <button className="btn-pink" style={{background: '#ffcccc'}} onClick={onLogout}>
          Вийти
        </button>
      </div>

      {/* ЦЕНТР */}
      <div className="dashboard-content-centered">
        
        <div className="section-title">
          Оберіть розділ для роботи:
        </div>
        
        <div className="dashboard-grid">
          <Link to="/admin/groups" className="dashboard-card">
            <span className="card-icon">🏫</span>
            <span className="card-title">Групи</span>
          </Link>

          <Link to="/admin/employees" className="dashboard-card">
            <span className="card-icon">👥</span>
            <span className="card-title">Співробітники</span>
          </Link>

          <Link to="/admin/relatives" className="dashboard-card">
            <span className="card-icon">🤷‍♀️</span>
            <span className="card-title">Родичі</span>
          </Link>

          <Link to="/admin/children" className="dashboard-card">
            <span className="card-icon">👶</span>
            <span className="card-title">Діти</span>
          </Link>

          <Link to="/admin/schedule" className="dashboard-card">
            <span className="card-icon">📅</span>
            <span className="card-title">Розклад</span>
          </Link>

          <Link to="/admin/dishes" className="dashboard-card">
            <span className="card-icon">🍲</span>
            <span className="card-title">Страви</span>
          </Link>

          <Link to="/admin/menu" className="dashboard-card">
            <span className="card-icon">📜</span>
            <span className="card-title">Меню</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;