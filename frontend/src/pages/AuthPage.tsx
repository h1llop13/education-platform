import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { ApiError } from '../api/client'

type AuthPageProps = {
  mode: 'login' | 'register'
}

export default function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const location = useLocation()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const notice =
    (location.state as { notice?: string } | null)?.notice

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (isRegister && password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.')
      return
    }

    setLoading(true)

    try {
      if (isRegister) {
        await register({ fullName: fullName.trim(), email: email.trim(), password })
        navigate('/login', {
          replace: true,
          state: { notice: 'Аккаунт создан. Теперь войди, используя свой email и пароль.' },
        })
      } else {
        await login({ email: email.trim(), password })
        navigate('/', { replace: true })
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setError('Неверный email или пароль.')
      } else if (cause instanceof ApiError && cause.status === 409) {
        setError('Аккаунт с таким email уже существует.')
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Не удалось выполнить запрос. Попробуй ещё раз.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link className="auth-brand" to="/">
          <span className="brand-mark">e</span>
          <span>eduspace<span className="brand-dot">.</span></span>
        </Link>

        <div className="auth-visual-copy">
          <span className="eyebrow">ТВОЁ ПРОСТРАНСТВО ДЛЯ РОСТА</span>
          <h1>Большие цели начинаются с <span>одного шага.</span></h1>
          <p>Изучай новое, развивай навыки и двигайся к тому, что важно именно тебе.</p>
          <div className="auth-visual-art">
            <span className="auth-art-orbit" />
            <span className="auth-art-book">e.</span>
            <span className="auth-art-star">✳</span>
          </div>
        </div>

        <p className="auth-visual-footer">Учись. Создавай. Развивайся.</p>
      </section>

      <section className="auth-form-side">
        <Link className="auth-back" to="/">← На главную</Link>

        <div className="auth-form-wrap">
          <span className="eyebrow">{isRegister ? 'ТВОЙ ПУТЬ НАЧИНАЕТСЯ ЗДЕСЬ' : 'РАДЫ ТЕБЯ ВИДЕТЬ СНОВА'}</span>
          <h2>{isRegister ? 'Создать аккаунт' : 'С возвращением!'}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Зарегистрируйся, чтобы начать своё обучение.'
              : 'Войди в аккаунт и продолжай обучение.'}
          </p>

          {notice && <div className="auth-notice" role="status">{notice}</div>}
          {error && <div className="auth-error" role="alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                ФИО
                <input
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Как тебя зовут?"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Пароль
              <input
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isRegister ? 'Минимум 8 символов' : 'Введи пароль'}
                minLength={isRegister ? 8 : undefined}
                required
              />
            </label>

            <button className="primary-button auth-submit" type="submit" disabled={loading}>
              {loading
                ? 'Подожди...'
                : isRegister
                  ? 'Создать аккаунт'
                  : 'Войти в аккаунт'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Уже есть аккаунт?' : 'Впервые в EduSpace?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Войти' : 'Создать аккаунт'}
            </Link>
          </p>
          <p className="auth-demo-note">
            Для успешного входа backend должен быть запущен и доступен из Codespaces.
          </p>
        </div>
      </section>
    </main>
  )
}
