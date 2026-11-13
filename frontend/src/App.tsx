import { FormEvent, useEffect, useMemo, useState } from 'react'

type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

type Course = {
  id: number
  title: string
  description: string | null
  coverUrl: string | null
  discipline: string | null
  status: CourseStatus
  visibility: 'PUBLIC' | 'PRIVATE'
  authorId: number
  authorName: string
  updatedAt: string | null
}

type User = {
  id: number
  email: string
  fullName: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
}

type CourseMetrics = Record<number, { lessons: number; students: number; averageProgress: number | null }>

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'
const TOKEN_KEY = 'education_access_token'
const USER_KEY = 'education_current_user'

const demoCourses: Course[] = [
  {
    id: 1,
    title: 'Основы Java',
    description: 'От синтаксиса и ООП до первых Spring Boot-приложений.',
    coverUrl: null,
    discipline: 'Программирование',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    authorId: 0,
    authorName: 'Вы',
    updatedAt: '2026-11-12T12:00:00',
  },
  {
    id: 2,
    title: 'SQL: запросы и базы данных',
    description: 'Черновик практического курса для второго семестра.',
    coverUrl: null,
    discipline: 'Базы данных',
    status: 'DRAFT',
    visibility: 'PRIVATE',
    authorId: 0,
    authorName: 'Вы',
    updatedAt: '2026-11-10T12:00:00',
  },
  {
    id: 3,
    title: 'Git без паники',
    description: 'Небольшой курс о ветках, коммитах и командной работе.',
    coverUrl: null,
    discipline: 'Инструменты разработчика',
    status: 'DRAFT',
    visibility: 'PUBLIC',
    authorId: 0,
    authorName: 'Вы',
    updatedAt: '2026-11-07T12:00:00',
  },
]

function request<T>(path: string, token?: string, options?: RequestInit): Promise<T> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.message ?? 'Не удалось выполнить запрос')
    }
    return response.json() as Promise<T>
  })
}

function formatDate(value: string | null): string {
  if (!value) return 'сегодня'
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(value))
}

function statusLabel(status: CourseStatus): string {
  return status === 'PUBLISHED' ? 'Опубликован' : status === 'ARCHIVED' ? 'Архив' : 'Черновик'
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(() => {
    const value = localStorage.getItem(USER_KEY)
    return value ? (JSON.parse(value) as User) : null
  })
  const [courses, setCourses] = useState<Course[]>(demoCourses)
  const [metrics, setMetrics] = useState<CourseMetrics>({})
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !user) return
    void loadDashboard(token, user)
  }, [])

  const totals = useMemo(() => ({
    courses: courses.length,
    published: courses.filter((course) => course.status === 'PUBLISHED').length,
    lessons: Object.values(metrics).reduce((sum, item) => sum + item.lessons, 0),
  }), [courses, metrics])

  async function loadDashboard(activeToken: string, activeUser: User) {
    setLoading(true)
    try {
      const allCourses = await request<Course[]>('/courses', activeToken)
      const visibleCourses = allCourses.filter((course) => course.authorId === activeUser.id)
      setCourses(visibleCourses)

      const metricPairs = await Promise.all(
        visibleCourses.map(async (course) => {
          const lessons = await request<Array<unknown>>(`/courses/${course.id}/lessons`, activeToken).catch(() => [])
          const progress = await request<Array<{ percentage: number }>>(
            `/teacher/courses/${course.id}/students`,
            activeToken,
          ).catch(() => [])
          const averageProgress = progress.length
            ? Math.round(progress.reduce((sum, item) => sum + item.percentage, 0) / progress.length)
            : null
          return [course.id, { lessons: lessons.length, students: progress.length, averageProgress }] as const
        }),
      )
      setMetrics(Object.fromEntries(metricPairs))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось загрузить курсы')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    setLoading(true)
    try {
      const result = await request<{ token: string; email: string; fullName: string; role: User['role'] }>('/auth/login', undefined, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      const nextUser = await request<User>('/auth/me', result.token)
      localStorage.setItem(TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      setToken(result.token)
      setUser(nextUser)
      setShowLogin(false)
      setNotice(null)
      await loadDashboard(result.token, nextUser)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setCourses(demoCourses)
    setMetrics({})
  }

  function showNextStep(message: string) {
    setNotice(message)
  }

  const canCreate = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Кампус: в начало">
          <span className="brand-mark">K</span>
          <span>Кампус</span>
        </a>
        <nav className="navigation" aria-label="Основная навигация">
          <a className="nav-item active" href="#courses"><span>▦</span> Мои курсы</a>
          <button className="nav-item" onClick={() => showNextStep('Раздел аналитики появится после редактора курсов.')}><span>◔</span> Аналитика</button>
          <button className="nav-item" onClick={() => showNextStep('Настройки профиля будут добавлены отдельным этапом.')}><span>⚙</span> Настройки</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span>✦</span><p>Нужна помощь с первым курсом?</p><button onClick={() => showNextStep('Подсказки конструктора появятся в следующем этапе.')}>Открыть гайд</button></div>
          {user ? <button className="account" onClick={logout}><span className="avatar">{user.fullName.slice(0, 1).toUpperCase()}</span><span><strong>{user.fullName}</strong><small>Выйти</small></span></button> : <button className="account" onClick={() => setShowLogin(true)}><span className="avatar">?</span><span><strong>Демо-режим</strong><small>Войти в аккаунт</small></span></button>}
        </div>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <div className="crumb">Преподаватель <span>/</span> Мои курсы</div>
          <button className="login-link" onClick={() => user ? logout() : setShowLogin(true)}>{user ? 'Выйти' : 'Войти'}</button>
        </header>

        <div className="page-heading">
          <div><p className="eyebrow">ВАША РАБОЧАЯ ОБЛАСТЬ</p><h1>Мои курсы</h1><p className="subtitle">Создавайте понятные занятия и следите, как студенты осваивают материал.</p></div>
          <button className="primary-button" disabled={!canCreate && Boolean(user)} onClick={() => showNextStep('Мастер создания курса — следующий этап. Здесь откроется форма названия, описания и доступа.')}><span>＋</span> Создать курс</button>
        </div>

        {user && !canCreate && <div className="role-note">У вас роль «студент». Создание курсов доступно преподавателю или администратору.</div>}
        {notice && <div className="notice" role="status">{notice}<button aria-label="Закрыть уведомление" onClick={() => setNotice(null)}>×</button></div>}

        <section className="stats" aria-label="Сводка по курсам">
          <article><span className="stat-icon purple">▦</span><div><strong>{totals.courses}</strong><p>Всего курсов</p></div></article>
          <article><span className="stat-icon green">↗</span><div><strong>{totals.published}</strong><p>Опубликовано</p></div></article>
          <article><span className="stat-icon orange">▤</span><div><strong>{totals.lessons || '—'}</strong><p>Уроков в курсах</p></div></article>
        </section>

        <section id="courses" className="courses-section">
          <div className="section-heading"><h2>Ваши курсы</h2><span>{loading ? 'Загружаем…' : `${courses.length} ${courses.length === 1 ? 'курс' : courses.length < 5 ? 'курса' : 'курсов'}`}</span></div>
          <div className="course-grid">
            {courses.map((course, index) => <CourseCard key={course.id} course={course} metrics={metrics[course.id]} accent={index % 3} onOpen={() => showNextStep('Редактор курса будет следующим экраном.')} />)}
            {canCreate && <button className="new-course-card" onClick={() => showNextStep('Мастер создания курса — следующий этап.')}><span>＋</span><strong>Новый курс</strong><small>Начните с названия и описания</small></button>}
          </div>
        </section>
      </section>

      {showLogin && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowLogin(false)}><section className="login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}><button className="close-modal" onClick={() => setShowLogin(false)} aria-label="Закрыть">×</button><span className="dialog-icon">K</span><h2 id="login-title">Войти в Кампус</h2><p>Введите данные преподавателя из backend.</p><form onSubmit={handleLogin}><label>Email<input name="email" type="email" placeholder="teacher@college.ru" required /></label><label>Пароль<input name="password" type="password" placeholder="Не менее 8 символов" required /></label><button className="primary-button full" disabled={loading}>{loading ? 'Входим…' : 'Войти и загрузить курсы'}</button></form></section></div>}
    </main>
  )
}

function CourseCard({ course, metrics, accent, onOpen }: { course: Course; metrics?: CourseMetrics[number]; accent: number; onOpen: () => void }) {
  return <article className="course-card">
    <div className={`course-cover accent-${accent}`} style={course.coverUrl ? { backgroundImage: `linear-gradient(120deg, rgba(17,27,52,.28), rgba(17,27,52,.66)), url(${course.coverUrl})` } : undefined}>
      <span className={`status ${course.status.toLowerCase()}`}>{statusLabel(course.status)}</span>
      <button aria-label={`Действия с курсом ${course.title}`} onClick={onOpen}>•••</button>
      {!course.coverUrl && <span className="cover-glyph">{accent === 0 ? '⌘' : accent === 1 ? '◈' : '↗'}</span>}
    </div>
    <div className="course-body">
      <p className="discipline">{course.discipline || 'Без дисциплины'} <span>•</span> обновлён {formatDate(course.updatedAt)}</p>
      <h3>{course.title}</h3>
      <p className="description">{course.description || 'Добавьте описание, чтобы студентам было понятнее, о чём этот курс.'}</p>
      <div className="course-meta"><span>▤ {metrics?.lessons ?? '—'} уроков</span><span>◉ {metrics?.students ?? '—'} студентов</span></div>
      <div className="progress-line"><span style={{ width: `${metrics?.averageProgress ?? 0}%` }} /></div>
      <div className="course-footer"><small>{metrics?.averageProgress == null ? 'Прогресс появится после начала обучения' : `Средний прогресс: ${metrics.averageProgress}%`}</small><button onClick={onOpen}>Открыть <span>→</span></button></div>
    </div>
  </article>
}

export default App
