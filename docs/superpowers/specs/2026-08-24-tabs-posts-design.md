# Design: Todos/Posts Tabs + Social Media Posts

Date: 2026-08-24
Builds on: `2026-08-24-axios-useapi-design.md`

## Goal

Two tabs — Todos and Posts — switched with `useState` (no react-router, no page reload). Posts use the FreeAPI social-media endpoints with a create/edit modal; no image upload by the user.

## Verified API contract (live)

- `GET /social-media/posts` -> unwrapped `{ posts: [...], totalPosts, page, totalPages, ... }`
- `POST /social-media/posts` -> multipart FormData (`content`; images optional) — JSON body rejected
- `PATCH /social-media/posts/{id}` -> FormData or JSON `{ content }`
- `DELETE /social-media/posts/{id}` -> works on own posts

Post shape: `{ _id, content, tags[], images[{url}], likes, comments, isLiked, author:{ account:{ username }, firstName, lastName } }`

## UI

- **Tabs** in App.jsx logged-in view: two buttons, `useState("todos")`, instant swap of `<Todo/>` / `<Posts/>`.
- **Posts list**: card per post — image (`post.images[0].url`, fallback `/img.png` from public + onError fallback), author username, content.
- **Edit/Delete only on own posts** (`author.account.username === user.username`) since the feed contains all users' posts.
- **Modal** (overlay + card): shared for New/Edit post, textarea only — no image input. Cancel/overlay click closes.
- Loading ("Loading posts..."), empty ("No posts yet"), error banners as in todos.

## Files

| File | Action |
|---|---|
| `src/lib/api.js` | add getAllPosts/createPost/updatePost/deletePost |
| `src/components/Posts.jsx` | create |
| `src/components/posts.css` | create |
| `src/App.jsx` | tab state + tab bar |
| `src/App.css` | create — tab bar styles |
