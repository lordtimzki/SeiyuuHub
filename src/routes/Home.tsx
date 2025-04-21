import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../client.ts";

interface Post {
  id: number;
  title: string;
  content?: string;
  user: string;
  seiyuu: string;
  created_at: string;
  upvotes: number;
  image?: string;
  video?: string;
}

const apiUrl = import.meta.env.DEV
  ? "/api/anilist"
  : "/.netlify/functions/anilist";

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "upvotes"
  const [seiyuuNames, setSeiyuuNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          (post.content && post.content.toLowerCase().includes(query)) ||
          post.user.toLowerCase().includes(query) ||
          (seiyuuNames[post.seiyuu] &&
            seiyuuNames[post.seiyuu].toLowerCase().includes(query))
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts, seiyuuNames]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // Determine sort options based on user selection
      let query = supabase.from("Posts").select("*");

      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "upvotes":
          query = query.order("upvotes", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      setPosts(data || []);
      setFilteredPosts(data || []);

      await fetchSeiyuuNames(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  interface SearchChangeEvent {
    target: {
      value: string;
    };
  }

  const handleSearch = (e: SearchChangeEvent): void => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  interface AnilistResponse {
    data?: {
      Staff?: {
        id: number;
        name: {
          full: string;
        };
      };
    };
  }

  interface FetchSeiyuuNamesParams {
    seiyuu: string;
    [key: string]: string | number | boolean | null | undefined;
  }

  const fetchSeiyuuNames = async (
    postsData: FetchSeiyuuNamesParams[]
  ): Promise<void> => {
    try {
      const seiyuuIds = [...new Set(postsData.map((post) => post.seiyuu))];
      const namesMap: Record<string, string> = {};

      for (const id of seiyuuIds) {
        const response = await fetch(apiUrl, {
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
            variables: { id: parseInt(id) },
          }),
        });

        const data: AnilistResponse = await response.json();
        if (data.data?.Staff) {
          namesMap[id] = data.data.Staff.name.full;
        } else {
          namesMap[id] = "Unknown Seiyuu";
        }
      }

      setSeiyuuNames(namesMap);
    } catch (err) {
      console.error("Error fetching seiyuu names:", err);
    }
  };

  interface YouTubeUrlMatchResult extends Array<string> {
    [index: number]: string;
  }

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp: RegExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match: YouTubeUrlMatchResult | null = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  interface FormatDateOptions {
    year: "numeric";
    month: "short";
    day: "numeric";
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    } as FormatDateOptions);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Posts</h1>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search posts by title, content, user or seiyuu..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="flex justify-between items-center">
            {/* Show result count when searching */}
            {searchQuery && (
              <div className="text-sm text-gray-600">
                Found {filteredPosts.length}{" "}
                {filteredPosts.length === 1 ? "post" : "posts"} for "
                {searchQuery}"
              </div>
            )}

            <div className="flex items-center ml-auto">
              <label htmlFor="sortBy" className="mr-2 text-gray-700">
                Sort by:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="upvotes">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            {searchQuery ? (
              <div>
                <p className="text-gray-500 mb-2">
                  No posts found matching your search.
                </p>
                <button
                  onClick={clearSearch}
                  className="text-blue-600 hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">
                  No posts yet. Be the first to create one!
                </p>
                <Link
                  to="/create"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Post
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <Link
                  to={`/post/${post.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="p-4">
                    {/* The rest of your post card stays the same */}
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-semibold">{post.title}</h2>
                      <div className="flex items-center text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
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
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span>Posted by {post.user}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(post.created_at)}</span>
                      <span className="mx-2">•</span>
                      <Link
                        to={`/seiyuu/${post.seiyuu}`}
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {seiyuuNames[post.seiyuu] || "Loading..."}
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {post.image && (
                        <div className="w-24 h-24 bg-gray-100 rounded">
                          <img
                            src={post.image}
                            alt=""
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              const imgElement = e.target as HTMLImageElement;
                              imgElement.onerror = null;
                              imgElement.src =
                                "https://via.placeholder.com/150?text=Image";
                            }}
                          />
                        </div>
                      )}

                      {post.video && getYouTubeVideoId(post.video) && (
                        <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center relative">
                          <img
                            src={`https://img.youtube.com/vi/${getYouTubeVideoId(
                              post.video
                            )}/0.jpg`}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
