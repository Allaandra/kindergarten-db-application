export const COLUMN_MAP = {
  id: 'ID', 
  // Групи
  name: 'Назва групи', 
  age_category: 'Категорія', 
  occupancy: 'Заповненість',
  educator_name: 'Вихователь',
  
  // Співробітники та Родичі
  first_name: "Ім'я",
  last_name: 'Прізвище',
  patronymic: 'По батькові',
  phone: 'Телефон',
  address: 'Адреса',
  position_name: 'Посада',
  db_username: 'Логін',

  // Діти
  birth_date: 'Дата народж.', 
  birthday_date: 'Дата народж.',
  group_name: 'Група',
  parent_name: 'Батьки',
  parent_phone: 'Телефон батьків'
};

export const HIDDEN_FIELDS = [
    'position_id', 
    'educator_id', 
    'max_capacity', 
    'group_id',
    'parent_name',
    'parent_phone'
];