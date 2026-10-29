import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse, updateCourse } from '../api/courses';

export default function CourseForm({ course, mode }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [visibility, setVisibility] = useState(course?.visibility || 'PUBLIC');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = mode === 'edit';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const courseData = { title, description, visibility };

      if (isEdit) {
        await updateCourse(course.id, courseData);
        navigate(`/courses/${course.id}`);
      } else {
        const newCourse = await createCourse(courseData);
        navigate(`/courses/${newCourse.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка сохранения курса');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <h1>{isEdit ? 'Редактирование курса' : 'Создание курса'}</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Название курса *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Видимость
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="PUBLIC">Публичный (виден всем)</option>
            <option value="PRIVATE">Приватный (только по приглашению)</option>
          </select>
          <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
            {visibility === 'PUBLIC'
              ? 'Курс будет виден в каталоге всем пользователям'
              : 'Курс будет доступен только по приглашению'}
          </small>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать курс'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
        </div>

        {!isEdit && (
          <p style={{ color: '#666', marginTop: '20px', fontSize: '14px' }}>
            После создания курс будет сохранён как черновик. Вы сможете опубликовать его позже.
          </p>
        )}
      </form>
    </div>
  );
}