import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api/courses';
import { useAuth } from '../context/AuthContext';

export default function CourseList() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      console.log('Загрузка курсов...');
      const data = await getCourses();
      console.log('Полученные данные курсов:', data);

      if (Array.isArray(data)) {
        setCourses(data);
      } else {
        console.error('Ожидался массив, получено:', data);
        setCourses([]);
      }
    } catch (err) {
      console.error('Ошибка загрузки курсов:', err);
      setError('Не удалось загрузить список курсов: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка каталога...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Каталог курсов</h1>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <Link
            to="/courses/new"
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            + Создать курс
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>Пока нет доступных курсов</p>
          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
            <Link to="/courses/new" style={{ color: '#007bff' }}>Создать первый курс</Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '24px',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#333' }}>
                  {course.title}
                </h3>

                <p style={{
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  marginBottom: '20px',
                  flex: 1
                }}>
                  {course.description || 'Без описания'}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #f0f0f0',
                  fontSize: '13px',
                  color: '#888'
                }}>
                  <span> {course.authorName || 'Неизвестный автор'}</span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: course.status === 'PUBLISHED' ? '#d4edda' : '#fff3cd',
                      color: course.status === 'PUBLISHED' ? '#155724' : '#856404',
                      fontWeight: '500',
                    }}
                  >
                    {course.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}