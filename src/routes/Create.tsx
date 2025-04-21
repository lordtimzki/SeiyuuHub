import { useState } from "react";
import { supabase } from "../../client.ts";

const Create = () => {
  const [formData, setFormData] = useState({
    title: "",
    user: "",
    seiyuuId: "",
    content: "",
    imageUrl: "",
    videoUrl: "",
  });
  const [seiyuuName, setSeiyuuName] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [seiyuuError, setSeiyuuError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (
      name &&
      typeof name === "string" &&
      Object.keys(formData).includes(name)
    ) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const getYouTubeVideoId = (url: string): string | false => {
    const regExp: RegExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match: RegExpMatchArray | null = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : false;
  };

  const apiUrl = import.meta.env.DEV
    ? "/api/anilist"
    : "/.netlify/functions/anilist";

  const validateSeiyuu = async () => {
    if (!formData.seiyuuId || isNaN(parseInt(formData.seiyuuId))) {
      setSeiyuuError("Please enter a valid numeric ID");
      return false;
    }

    try {
      setValidating(true);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($id: Int) {
              Staff(id: $id) {
                id
                name {
                  full
                }
                primaryOccupations
              }
            }
          `,
          variables: {
            id: parseInt(formData.seiyuuId),
          },
        }),
      });

      const data = await response.json();

      if (data.errors || !data.data.Staff) {
        setSeiyuuError("Seiyuu not found with this ID");
        setValidating(false);
        return false;
      }

      const staff = data.data.Staff;
      const isVoiceActor = staff.primaryOccupations?.includes("Voice Actor");

      if (!isVoiceActor) {
        setSeiyuuError("This ID does not belong to a voice actor");
        setValidating(false);
        return false;
      }

      setSeiyuuName(staff.name.full);
      setSeiyuuError("");
      setValidating(false);
      return true;
    } catch (error) {
      console.error("Error validating seiyuu:", error);
      setSeiyuuError("Error validating seiyuu ID");
      setValidating(false);
      return false;
    }
  };

  interface PostData {
    title: string;
    user: string;
    seiyuu: number;
    content: string | null;
    image: string | null;
    video: string | null;
    created_at: Date;
    upvotes: number;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.user.trim()) {
      setError("Your name is required");
      return;
    }

    const isValid = await validateSeiyuu();
    if (!isValid) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: supabaseError } = await supabase
        .from("Posts")
        .insert([
          {
            title: formData.title,
            user: formData.user,
            seiyuu: parseInt(formData.seiyuuId),
            content: formData.content || null,
            image: formData.imageUrl || null,
            video: formData.videoUrl || null,
            created_at: new Date(),
            upvotes: 0,
          } as PostData,
        ])
        .select();

      if (supabaseError) {
        throw supabaseError;
      }

      console.log("Post created:", data);

      setFormData({
        title: "",
        user: "",
        seiyuuId: "",
        content: "",
        imageUrl: "",
        videoUrl: "",
      });
      setSeiyuuName("");

      // Show success message or redirect
      // For example: navigate(`/seiyuu/${formData.seiyuuId}`);
    } catch (error) {
      console.error("Error submitting to Supabase:", error);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-gray-700 font-medium mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="user"
              className="block text-gray-700 font-medium mb-2"
            >
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="user"
              name="user"
              value={formData.user}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="seiyuuId"
              className="block text-gray-700 font-medium mb-2"
            >
              Seiyuu ID <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="seiyuuId"
                name="seiyuuId"
                value={formData.seiyuuId}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter AniList ID (e.g. 119331)"
                required
              />
              <button
                type="button"
                onClick={validateSeiyuu}
                disabled={validating}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {validating ? "Checking..." : "Verify"}
              </button>
            </div>
            {seiyuuError && (
              <p className="mt-1 text-sm text-red-600">{seiyuuError}</p>
            )}
            {seiyuuName && (
              <p className="mt-1 text-sm text-green-600">
                ✓ Valid: {seiyuuName}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="content"
              className="block text-gray-700 font-medium mb-2"
            >
              Content
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
            ></textarea>
          </div>
          <div className="mb-6">
            <label
              htmlFor="imageUrl"
              className="block text-gray-700 font-medium mb-2"
            >
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Preview:</p>
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="h-24 w-auto object-contain border border-gray-300"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/150?text=Invalid+Image")
                  }
                />
              </div>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="videoUrl"
              className="block text-gray-700 font-medium mb-2"
            >
              YouTube Video URL
            </label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            />
            {formData.videoUrl && formData.videoUrl.includes("youtube.com") && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Preview:</p>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                      formData.videoUrl
                    )}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-48 border border-gray-300"
                  ></iframe>
                </div>
              </div>
            )}
            {formData.videoUrl &&
              !formData.videoUrl.includes("youtube.com") && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid YouTube URL
                </p>
              )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 ${
                loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {loading ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Create;
