import { useState } from "react";
import { createPost, deletePost, getAllPosts, updatePost } from "../api/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import "./posts.css";

const DEFAULT_IMAGE = "/img.png";

export default function Posts() {
  const { user } = useAuth();
  const {
    data,
    loading,
    error: listError,
    execute: refreshPosts,
  } = useApi(getAllPosts);

  const posts = data.posts || [];
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [content, setContent] = useState("");

  const error = listError || actionError;

  function openCreate() {
    setEditingPost(null);
    setContent("");
    setModalOpen(true);
  }

  function openEdit(post) {
    setEditingPost(post);
    setContent(post.content);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPost(null);
    setContent("");
    setActionError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = content.trim();
    if (text === "") return;

    setBusyId("modal");
    try {
      if (editingPost) {
        await updatePost(editingPost._id, text);
      } else {
        await createPost(text);
      }
      closeModal();
      await refreshPosts();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setActionError("");
    try {
      await deletePost(id);
      await refreshPosts();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="posts-wrap">
      <div className="posts-toolbar">
        <h2>Posts</h2>
        <button className="new-post-button" onClick={openCreate}>
          New Post
        </button>
      </div>

      {!modalOpen && error && <p className="post-error">{error}</p>}

      {posts.length === 0 && (
        <div className="posts-empty">
          {loading ? "Loading posts..." : "No posts yet"}
        </div>
      )}

      <div className="posts-list">
        {posts.map((post) => {
          const isOwn = post.author?.account?.username === user?.username;
          return (
            <article className="post-card" key={post._id}>
              <img
                className="post-image"
                src={post.images?.[0]?.url || DEFAULT_IMAGE}
                alt=""
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMAGE;
                }}
              />
              <div className="post-body">
                <span className="post-author">
                  {post.author?.account?.username || "unknown"}
                </span>
                <p className="post-content">{post.content}</p>
              </div>
              {isOwn && (
                <div className="post-actions">
                  <button
                    disabled={busyId === post._id}
                    onClick={() => openEdit(post)}
                  >
                    Update
                  </button>
                  <button
                    className="danger"
                    disabled={busyId === post._id}
                    onClick={() => handleDelete(post._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <form
            className="modal-card"
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editingPost ? "Edit Post" : "New Post"}</h3>

            {actionError && <p className="post-error">{actionError}</p>}

            <textarea
              rows={4}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="modal-actions">
              <button type="button" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" disabled={busyId === "modal"}>
                {busyId === "modal"
                  ? "Saving..."
                  : editingPost
                    ? "Update"
                    : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
