# Tabs + Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Checkbox tracking. Not a git repo — no commits.

**Spec:** `docs/superpowers/specs/2026-08-24-tabs-posts-design.md`

### Task 1: api.js — add post endpoint functions

Append after todos section:

```js
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

export const deletePost = (postId) => api.delete(`/social-media/posts/${postId}`);
```

### Task 2: Create src/components/Posts.jsx

Full component: useApi(getAllPosts) reading `data.posts`, modal (create/edit shared), own-post edit/delete buttons, default image `/img.png` with onError fallback.

### Task 3: Create src/components/posts.css

Card grid, modal overlay/card, error banner, disabled states — all via existing CSS variables.

### Task 4: App.jsx — tab bar with useState + App.css

```jsx
const [activeTab, setActiveTab] = useState("todos");
// logged-in view: Header, .tabs bar (Todos/Posts), conditional Todo/Posts
```

### Task 5: Verification

- lint + build clean
- smoke-test.mjs extended: posts create/list/patch/delete round-trip
