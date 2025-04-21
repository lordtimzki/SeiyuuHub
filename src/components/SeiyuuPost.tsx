import React, { useState, useEffect } from "react";
import { supabase } from "../../client.ts";

const SeiyuuPost = ({ seiyuuId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [seiyuuId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Posts")
        .select("*")
        .eq("seiyuu", seiyuuId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (postId, currentUpvotes) => {
    try {
      // Update the post in Supabase
      const { error } = await supabase
        .from("Posts")
        .update({ upvotes: currentUpvotes + 1 })
        .eq("id", postId);

      if (error) throw error;

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? { ...post, upvotes: (post.upvotes || 0) + 1 }
            : post
        )
      );
    } catch (err) {
      console.error("Error updating upvotes:", err);
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

  if (loading) return <p className="text-gray-500">Loading posts...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (posts.length === 0)
    return (
      <p className="text-gray-500">
        No posts yet. Be the first to post about this seiyuu!
      </p>
    );

  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <div
          key={post.id}
          className="border-b border-gray-200 pb-6 mb-6 last:border-0"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold">{post.title}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpvote(post.id, post.upvotes || 0)}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                aria-label="Upvote post"
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
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                <span>{post.upvotes || 0}</span>
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            Posted by {post.user} • {formatDate(post.created_at)}
          </p>

          {post.content && (
            <p className="text-gray-700 mb-4 whitespace-pre-line">
              {post.content}
            </p>
          )}

          {post.image && (
            <div className="mb-4">
              <img
                src={post.image}
                alt={post.title}
                className="max-h-96 rounded-lg object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://via.placeholder.com/400x300?text=Image+Not+Available";
                }}
              />
            </div>
          )}

          {post.video && getYouTubeVideoId(post.video) && (
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                  post.video
                )}`}
                title={post.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-72 rounded-lg"
              ></iframe>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SeiyuuPost;
