import { useEffect, useMemo, useState } from 'react'
import { getCourses } from '../api/courses'
import type { Course as ApiCourse } from '../types/auth'
import '../App.css'

type Course = {
  id: number
  title: string
  category: string
  description: string
  level: string
  duration: string
  lessons: number
  color: string
  icon: string
  progress?: number
}

const courseColors = ['lavender', 'mint', 'peach', 'blue', 'pink', 'yellow']
const courseIcons = ['⌘', 'Py', '✳', '☕', '↗', 'JS']

function mapApiCourse(course: ApiCourse, index: number): Course {
  return {
    id: course.id,
    title: course.title,
    category: course.discipline || 'Общее',
    description: course.description || 'Описание этого курса пока не добавлено.',
    level: 'Уровень не указан',
    duration: 'Не указано',
    lessons: 0,
    color: courseColors[index % courseColors.length],
    icon: courseIcons[index % courseIcons.length],
  }
}

const categories = ['Все направления', 'Разработка', 'Программирование', 'Дизайн', 'Аналитика']

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [coursesError, setCoursesError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      setLoadingCourses(true)
      setCoursesError('')

      try {
        const result = await getCourses()
        if (!cancelled) {
          setCourses(result.map(mapApiCourse))
        }
      } catch (error) {
        if (!cancelled) {
          setCoursesError(
            error instanceof Error
              ? error.message
              : 'Не удалось загрузить курсы.',
          )
        }
      } finally {
        if (!cancelled) setLoadingCourses(false)
      }
    }

    void loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  const [activePage, setActivePage] = useState('Обзор')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Все направления')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase()

    return courses.filter((course) => {
      const matchesCategory =
        category === 'Все направления' || course.category === category
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [courses, search, category])

  const goToCourses = () => {
    setActivePage('Мои курсы')
    setSelectedCourse(null)
    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setActivePage('Обзор')}>
          <span className="brand-mark">e</span>
          <span>eduspace<span className="brand-dot">.</span></span>
        </button>

        <div className="side-label">МЕНЮ</div>
        <nav className="side-nav" aria-label="Основная навигация">
          <button
            className={`nav-item ${activePage === 'Обзор' ? 'active' : ''}`}
            onClick={() => setActivePage('Обзор')}
          >
            <span className="nav-icon">⌂</span> Обзор
          </button>
          <button
            className={`nav-item ${activePage === 'Мои курсы' ? 'active' : ''}`}
            onClick={goToCourses}
          >
            <span className="nav-icon">▤</span> Каталог курсов
          </button>
          <button
            className={`nav-item ${activePage === 'Мой прогресс' ? 'active' : ''}`}
            onClick={() => setActivePage('Мой прогресс')}
          >
            <span className="nav-icon">↗</span> Мой прогресс
          </button>
        </nav>

        <div className="side-label side-label-spaced">МОЁ ОБУЧЕНИЕ</div>
        <nav className="side-nav">
          <button className="nav-item" onClick={() => setActivePage('Избранное')}>
            <span className="nav-icon">♡</span> Избранное
          </button>
          <button className="nav-item" onClick={() => setActivePage('Расписание')}>
            <span className="nav-icon">▦</span> Расписание
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-spark">✳</span>
            <strong>Продолжай расти!</strong>
            <p>Каждый урок приближает тебя к цели.</p>
            <button onClick={goToCourses}>Продолжить обучение ↗</button>
          </div>
          <div className="profile">
            <div className="avatar">У</div>
            <div className="profile-copy">
              <strong>Мой профиль</strong>
              <span>Студент</span>
            </div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">Рабочее пространство <span>/</span> {activePage}</div>
          <div className="topbar-actions">
            <a className="auth-top-link" href="/login">Войти</a>
            <a className="auth-top-link auth-top-register" href="/register">Регистрация</a>
            <span className="today-label">ТВОЁ ПРОСТРАНСТВО ДЛЯ РОСТА</span>
            <button className="notification-button" aria-label="Уведомления">♧</button>
            <div className="avatar top-avatar">У</div>
          </div>
        </header>

        <div className="page-content">
          {selectedCourse ? (
            <section className="course-detail">
              <button className="back-link" onClick={() => setSelectedCourse(null)}>
                ← Назад к каталогу
              </button>
              <div className={`detail-art ${selectedCourse.color}`}>
                <span>{selectedCourse.icon}</span>
                <small>EDUSPACE · ПЛАН ОБУЧЕНИЯ</small>
              </div>
              <span className="eyebrow">{selectedCourse.category}</span>
              <h1>{selectedCourse.title}</h1>
              <p className="detail-description">{selectedCourse.description}</p>
              <div className="detail-facts">
                <span>◷ {selectedCourse.duration}</span>
                <span>▤ {selectedCourse.lessons} уроков</span>
                <span>◎ {selectedCourse.level} уровень</span>
              </div>
              <div className="detail-note">
                <strong>Курс пока демонстрационный</strong>
                <p>Следующим этапом подключим этот экран к backend и загрузим настоящие уроки.</p>
              </div>
              <button className="primary-button" onClick={() => alert('Подключение уроков добавим на следующем этапе.')}>
                Перейти к урокам <span>→</span>
              </button>
            </section>
          ) : (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> ТВОЙ ПУТЬ К НОВЫМ ЗНАНИЯМ</div>
                  <h1>{activePage === 'Обзор' ? <>Учись в своём<br /><span>ритме.</span> Расти каждый день.</> : activePage}</h1>
                  <p className="welcome-description">
                    Новые навыки начинаются с одного шага.<br className="desktop-break" />
                    Выбери направление и двигайся к своим целям.
                  </p>
                  <button className="primary-button" onClick={goToCourses}>
                    Исследовать курсы <span>→</span>
                  </button>
                </div>
                <div className="welcome-art" aria-label="Иллюстрация обучения">
                  <div className="art-orbit orbit-one" />
                  <div className="art-orbit orbit-two" />
                  <div className="art-sun">✳</div>
                  <div className="art-card art-card-top"><span>✦</span><div><strong>Новые знания</strong><small>Каждый день</small></div></div>
                  <div className="art-book">e.</div>
                  <div className="art-card art-card-bottom"><span className="art-check">✓</span><div><strong>Ты справишься!</strong><small>Шаг за шагом</small></div></div>
                </div>
              </section>

              <section className="stats-grid" aria-label="Статистика обучения">
                <div className="stat-card"><div className="stat-icon stat-violet">▤</div><div><span>Доступно курсов</span><strong>{loadingCourses ? "…" : courses.length.toString().padStart(2, "0")}</strong><small>Выбирай своё направление</small></div></div>
                <div className="stat-card"><div className="stat-icon stat-green">↗</div><div><span>Мой прогресс</span><strong>48%</strong><small>Продолжай в том же духе</small></div></div>
                <div className="stat-card"><div className="stat-icon stat-orange">✳</div><div><span>Цель на сегодня</span><strong>1 урок</strong><small>Маленький шаг — тоже шаг</small></div></div>
              </section>

              <section className="courses-section" id="courses">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">ТВОИ ВОЗМОЖНОСТИ</div>
                    <h2>Найди свой следующий курс<span>.</span></h2>
                    <p>Подборка направлений для твоего развития.</p>
                  </div>
                  <span className="course-count">{filteredCourses.length} курса</span>
                </div>

                <div className="course-toolbar">
                  <label className="search-box">
                    <span>⌕</span>
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Поиск курсов..."
                      aria-label="Поиск курсов"
                    />
                    {search && <button onClick={() => setSearch('')} aria-label="Очистить поиск">×</button>}
                  </label>
                  <div className="category-list">
                    {categories.map((item) => (
                      <button
                        key={item}
                        className={`category-chip ${category === item ? 'selected' : ''}`}
                        onClick={() => setCategory(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingCourses ? (
                  <div className="empty-state" role="status">
                    <h3>Загружаем курсы…</h3>
                    <p>Получаем список с сервера.</p>
                  </div>
                ) : coursesError ? (
                  <div className="empty-state" role="alert">
                    <h3>Не удалось загрузить курсы</h3>
                    <p>{coursesError}</p>
                    <button
                      className="secondary-button"
                      onClick={() => window.location.reload()}
                    >
                      Попробовать снова
                    </button>
                  </div>
                ) : filteredCourses.length > 0 ? (
                  <div className="course-grid">
                    {filteredCourses.map((course) => (
                      <article className="course-card" key={course.id}>
                        <button className={`course-art ${course.color}`} onClick={() => setSelectedCourse(course)} aria-label={`Открыть курс ${course.title}`}>
                          <span className="course-art-symbol">{course.icon}</span>
                          <span className="art-label">LEARN SOMETHING NEW</span>
                          <span className="art-number">0{course.id}</span>
                          <span className="art-decoration">✳</span>
                        </button>
                        <div className="course-card-body">
                          <div className="course-meta"><span>{course.category}</span><span>◷ {course.duration}</span></div>
                          <button className="course-title" onClick={() => setSelectedCourse(course)}>{course.title}</button>
                          <p className="course-description">{course.description}</p>
                          <div className="course-footer">
                            <span>▤ {course.lessons} уроков</span>
                            <span className="level-tag">{course.level}</span>
                          </div>
                          {course.progress !== undefined && (
                            <div className="progress-wrap">
                              <div className="progress-caption"><span>Твой прогресс</span><strong>{course.progress}%</strong></div>
                              <div className="progress-track"><div style={{ width: `${course.progress}%` }} /></div>
                            </div>
                          )}
                          <button className="course-open" onClick={() => setSelectedCourse(course)}>Подробнее <span>↗</span></button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span>⌕</span><h3>Ничего не нашлось</h3>
                    <p>Попробуй изменить запрос или выбрать другую категорию.</p>
                    <button className="secondary-button" onClick={() => { setSearch(''); setCategory('Все направления') }}>Сбросить фильтры</button>
                  </div>
                )}
              </section>
              <footer className="page-footer"><span>eduspace<span className="brand-dot">.</span></span><span>Учись. Создавай. Развивайся.</span><span>Курсы загружаются с сервера</span></footer>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

