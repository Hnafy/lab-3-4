import axios from "axios";

let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

const api = axios.create({
  baseURL: "https://api.freeapi.app/api/v1",
});

api.interceptors.request.use((config) => {
  const Access_Token = localStorage.getItem("token");
  if (Access_Token) {
    config.headers.Authorization = `Bearer ${Access_Token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const message = error.response?.data?.message || "Internal Server Error";
    return Promise.reject(new Error(message));
  },
);

export default api;

// ---------------auth----------------
export const loginUser = (username, password) =>
  api.post("/users/login", { username, password });

export const registerUser = ({ username, email, password }) =>
  api.post("/users/register", { username, email, password, role: "USER" });

// ---------------todos----------------
export const getAllTodos = () => api.get("/todos");

export const createTodo = (title) => api.post("/todos/", { title });

export const updateTodo = (todoId, title) =>
  api.patch(`/todos/${todoId}`, { title });

export const toggleTodoStatus = (todoId) =>
  api.patch(`/todos/toggle/status/${todoId}`);

export const deleteTodo = (todoId) => api.delete(`/todos/${todoId}`);

// ---------------social media posts----------------
export const getAllPosts = () => api.get("/social-media/posts");

export const createPost = (content) => {
  const formData = new FormData();
  formData.append("content", content);
  return api.post("/social-media/posts", formData);
};

export const updatePost = (postId, content) => {
  const formData = new FormData();
  formData.append("content", content);
  return api.patch(`/social-media/posts/${postId}`, formData);
};

export const deletePost = (postId) =>
  api.delete(`/social-media/posts/${postId}`);
