import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../client.ts";

const Post = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seiyuuName, setSeiyuuName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const commentInputRef = useRef(null);

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  const fetchPostAndComments = async () => {
    try {
      setLoading(true);

      const { data: postData, error: postError } = await supabase
        .from("Posts")
        .select("*")
        .eq("id", id)
        .single();

      if (postError) throw postError;
      if (!postData) throw new Error("Post not found");

      setPost(postData);

      // Fetch comments for this post
      const { data: commentsData, error: commentsError } = await supabase
        .from("Comments")
        .select("*")
        .eq("post_Id", id)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);

      // Fetch seiyuu name
      await fetchSeiyuuName(postData.seiyuu);
    } catch (err) {
      console.error("Error fetching post:", err);
      setError(err.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const fetchSeiyuuName = async (seiyuuId) => {
    try {
      const response = await fetch("/api/anilist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: `
            query ($id: Int) {
              Staff(id: $id) {
                id
                name {
                  full
                }
              }
            }
          `,
          variables: { id: parseInt(seiyuuId) },
        }),
      });

      const data = await response.json();
      if (data.data?.Staff) {
        setSeiyuuName(data.data.Staff.name.full);
      }
    } catch (err) {
      console.error("Error fetching seiyuu name:", err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);

      const { data, error } = await supabase
        .from("Comments")
        .insert([
          {
            post_Id: id,
            content: newComment,
            created_at: new Date(),
          },
        ])
        .select();

      if (error) throw error;

      // Add new comment to the list
      if (data && data.length > 0) {
        setComments([...comments, data[0]]);
      }

      // Clear input
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!post) return;

    try {
      const newUpvotes = (post.upvotes || 0) + 1;

      const { error } = await supabase
        .from("Posts")
        .update({ upvotes: newUpvotes })
        .eq("id", post.id);

      if (error) throw error;

      // Update post locally
      setPost({
        ...post,
        upvotes: newUpvotes,
      });
    } catch (err) {
      console.error("Error upvoting post:", err);
      alert("Failed to upvote post. Please try again.");
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-gray-500">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-3xl mx-auto text-center py-12">
          <p className="text-red-500">{error || "Post not found"}</p>
          <Link
            to="/"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditedContent(post.content || "");
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from("Posts")
        .update({ content: editedContent })
        .eq("id", post.id);

      if (error) throw error;

      // Update local post data
      setPost({
        ...post,
        content: editedContent,
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Failed to update post. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePost = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    try {
      setIsProcessing(true);

      const { error: commentsError } = await supabase
        .from("Comments")
        .delete()
        .eq("post_Id", post.id);

      if (commentsError) throw commentsError;

      const { error: postError } = await supabase
        .from("Posts")
        .delete()
        .eq("id", post.id);

      if (postError) throw postError;

      window.location.href = "/";
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post. Please try again.");
      setIsDeleting(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
              disabled={isProcessing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span className="text-lg font-medium">{post.upvotes || 0}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <span>Posted by {post.user}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(post.created_at)}</span>
            <span className="mx-2">•</span>
            <Link
              to={`/seiyuu/${post.seiyuu}`}
              className="text-blue-600 hover:underline"
            >
              {seiyuuName || "Loading seiyuu..."}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEditToggle}
              disabled={isProcessing || isDeleting}
              className="text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              {isEditing ? "Cancel" : "Edit"}
            </button>

            <button
              onClick={handleDeletePost}
              disabled={isProcessing || isEditing}
              className={`flex items-center gap-1 transition-colors ${
                isDeleting ? "text-red-600" : "text-gray-500 hover:text-red-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {isDeleting ? "Confirm Delete" : "Delete"}
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mb-6">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
            ></textarea>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSaveEdit}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          post.content && (
            <div className="mb-6">
              <p className="text-gray-700 whitespace-pre-line">
                {post.content}
              </p>
            </div>
          )
        )}

        {post.image && (
          <div className="mb-6">
            <img
              src={post.image}
              alt={post.title}
              className="max-w-full h-auto rounded-lg mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/800x450?text=Image+Not+Available";
              }}
            />
          </div>
        )}

        {post.video && getYouTubeVideoId(post.video) && (
          <div className="mb-6 aspect-w-16 aspect-h-9">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                post.video
              )}`}
              title={post.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-96 rounded-lg"
            ></iframe>
          </div>
        )}

        {isDeleting && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium mb-2">
              Are you sure you want to delete this post?
            </p>
            <p className="text-red-600 mb-4">
              This action cannot be undone. All comments will also be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing ? "Deleting..." : "Delete Post"}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 mt-6 pt-6 px-6 pb-6">
        <h2 className="text-xl font-semibold mb-4">
          Comments ({comments.length})
        </h2>

        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex flex-col space-y-2">
            <textarea
              ref={commentInputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {commentLoading ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </form>
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-700 whitespace-pre-line">
                  {comment.content}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {formatDate(comment.created_at)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Post;
