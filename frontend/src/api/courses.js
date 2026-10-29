import api from './axios';

// Получить список всех курсов (публичный)
export const getCourses = async () => {
  const response = await api.get('/v1/courses');
  return response.data;
};

// Получить карточку курса (публичный для публичных курсов)
export const getCourse = async (courseId) => {
  const response = await api.get(`/v1/courses/${courseId}`);
  return response.data;
};

// Создать курс (только для преподавателей/админов)
export const createCourse = async (courseData) => {
  const response = await api.post('/v1/courses', courseData);
  return response.data;
};

// Обновить курс
export const updateCourse = async (courseId, courseData) => {
  const response = await api.put(`/v1/courses/${courseId}`, courseData);
  return response.data;
};

// Опубликовать курс
export const publishCourse = async (courseId) => {
  const response = await api.post(`/v1/courses/${courseId}/publish`);
  return response.data;
};

// Удалить курс
export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/v1/courses/${courseId}`);
  return response.data;
};

// Создать приглашение на приватный курс
export const createInvitation = async (courseId, email) => {
  const response = await api.post(`/v1/courses/${courseId}/invite`, { email });
  return response.data;
};

// Принять приглашение
export const acceptInvitation = async (token) => {
  const response = await api.post(`/v1/invitations/${token}/accept`);
  return response.data;
};