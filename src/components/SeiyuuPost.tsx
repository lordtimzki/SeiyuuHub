import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../client.ts";

interface SeiyuuPostProps {
  seiyuuId: string;
}

interface Post {
  id: string;
  title: string;
  content?: string;
  image?: string;
  video?: string;
  upvotes: number;
  user: string;
  created_at: string;
  seiyuu: string;
}

const SeiyuuPost = ({ seiyuuId }: SeiyuuPostProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  interface UpvoteHandlerParams {
    postId: string;
    currentUpvotes: number;
    e: React.MouseEvent<HTMLButtonElement>;
  }

  const handleUpvote = async ({
    postId,
    currentUpvotes,
    e,
  }: UpvoteHandlerParams): Promise<void> => {
    e.stopPropagation();
    e.preventDefault();

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

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  interface DateFormatOptions {
    year: "numeric";
    month: "short";
    day: "numeric";
    hour: "2-digit";
    minute: "2-digit";
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    } as DateFormatOptions);
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
        <Link
          to={`/post/${post.id}`}
          key={post.id}
          className="block border-b border-gray-200 pb-6 mb-6 last:border-0 hover:bg-gray-50 transition-colors rounded-lg p-4"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold">{post.title}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) =>
                  handleUpvote({
                    postId: post.id,
                    currentUpvotes: post.upvotes || 0,
                    e,
                  })
                }
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
            <p className="text-gray-700 mb-4 whitespace-pre-line line-clamp-3">
              {post.content}
            </p>
          )}

          {post.image && (
            <div className="mb-4">
              <img
                src={post.image}
                alt={post.title}
                className="max-h-96 rounded-lg object-contain"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.onerror = null;
                  imgElement.src =
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
                onClick={(e) => e.stopPropagation()}
              ></iframe>
            </div>
          )}

          <div className="mt-4 text-sm flex items-center text-blue-600">
            <span>View full post</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default SeiyuuPost;
