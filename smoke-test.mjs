globalThis.localStorage = {
  store: {},
  getItem(k) {
    return this.store[k] ?? null;
  },
  setItem(k, v) {
    this.store[k] = String(v);
  },
  removeItem(k) {
    delete this.store[k];
  },
};

const { loginUser, getAllTodos, createTodo, updateTodo, toggleTodoStatus, deleteTodo,
  getAllPosts, createPost, updatePost, deletePost } =
  await import("./src/lib/api.js");

const assert = (cond, label) => {
  if (!cond) throw new Error(`FAILED: ${label}`);
  console.log(`OK: ${label}`);
};

const loginData = await loginUser("ahmedtask14", "test@123");
assert(loginData.accessToken && loginData.user.username === "ahmedtask14", "login unwraps { accessToken, user }");
localStorage.setItem("token", loginData.accessToken);

// ---- posts ----
const createdPost = await createPost("smoke post content");
assert(createdPost._id && createdPost.content === "smoke post content", "post create (FormData) returns post");
const page = await getAllPosts();
assert(Array.isArray(page.posts) && page.posts.some((p) => p._id === createdPost._id), "getAllPosts returns paginated { posts } containing new post");
const updatedPost = await updatePost(createdPost._id, "smoke post content v2");
assert(updatedPost.content === "smoke post content v2", "post update works");
await deletePost(createdPost._id);
const page2 = await getAllPosts();
assert(!page2.posts.some((p) => p._id === createdPost._id), "post delete removes post");

const created = await createTodo("axios-smoke-test");
const id = created._id;
assert(id, "create returns unwrapped todo with _id");

let list = await getAllTodos();
assert(Array.isArray(list) && list.some((t) => t._id === id), "list contains created todo");

await toggleTodoStatus(id);
list = await getAllTodos();
assert(list.find((t) => t._id === id).isComplete === true, "toggle sets isComplete true");

await updateTodo(id, "axios-smoke-test-2");
list = await getAllTodos();
assert(list.find((t) => t._id === id).title === "axios-smoke-test-2", "update changes title");

await deleteTodo(id);
list = await getAllTodos();
assert(!list.some((t) => t._id === id), "delete removes todo");

// NOTE: FreeAPI /todos is public - it answers 200 even with an invalid/no token,
// so a 401 cannot be produced here. Auto-logout stays wired in api.js for any
// endpoint that does reject bad tokens.
localStorage.removeItem("token");
const publicList = await getAllTodos();
assert(Array.isArray(publicList), "/todos responds without auth (public endpoint)");

console.log("ALL SMOKE TESTS PASSED");
