import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourse, publishCourse, deleteCourse } from '../api/courses';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const data = await getCourse(id);
      setCourse(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Курс не найден');
      } else if (err.response?.status === 403) {
        setError('У вас нет доступа к этому курсу');
      } else {
        setError('Не удалось загрузить курс');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const handlePublish = async () => {
  if (!window.confirm('Опубликовать курс? Он станет доступен всем пользователям.')) {
    return;
  }
  try {
    await publishCourse(course.id);
    setCourse({ ...course, status: 'PUBLISHED' });
    // Перенаправляем на каталог, чтобы обновить список
    navigate('/courses');
  } catch (err) {
    alert(err.response?.data?.message || 'Ошибка публикации');
    console.error(err);
  }
};

  const handleDelete = async () => {
    if (!window.confirm('Удалить курс? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await deleteCourse(course.id);
      navigate('/courses');
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка удаления');
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Загрузка...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (!course) return null;

  const isAuthor = user && course.authorId === user.id;
  const isAdmin = user && user.role === 'ADMIN';
  const canEdit = isAuthor || isAdmin;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <Link to="/courses" style={{ color: '#007bff', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
        ← Назад к каталогу
      </Link>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>{course.title}</h1>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              backgroundColor: course.status === 'PUBLISHED' ? '#d4edda' : '#fff3cd',
              color: course.status === 'PUBLISHED' ? '#155724' : '#856404',
              fontSize: '14px',
            }}
          >
            {course.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
          </span>
        </div>

        <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
          {course.description || 'Без описания'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <div>
            <strong>Автор:</strong> {course.authorName}
          </div>
          <div>
            <strong>Видимость:</strong> {course.visibility === 'PUBLIC' ? 'Публичный' : 'Приватный'}
          </div>
          <div>
            <strong>Уроков:</strong> {course.lessonsCount || 0}
          </div>
          <div>
            <strong>Студентов:</strong> {course.studentsCount || 0}
          </div>
        </div>

        {canEdit && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <Link
                to={`/courses/${course.id}/edit`}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                }}
              >
                Редактировать
              </Link>
              {course.status !== 'PUBLISHED' && (
                <button
                  onClick={handlePublish}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Опубликовать
                </button>
              )}
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Удалить
              </button>
            </div>
          )}
      </div>
    </div>
  );
}