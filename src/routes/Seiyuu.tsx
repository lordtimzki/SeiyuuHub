import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const Seiyuu = () => {
  const [seiyuuData, setSeiyuuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    fetchSeiyuu();
  }, [id]);

  const fetchSeiyuu = async () => {
    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($id: Int) {
              Staff(id: $id) {
                id
                name {
                  full
                  native
                }
                homeTown
                image {
                  large
                }
                dateOfBirth {
                  year
                  month
                  day
                }
                dateOfDeath {
                  year
                  month
                  day
                }
                age
                characters(sort: FAVOURITES_DESC, page: 1, perPage: 15) {
                  nodes {
                    id
                    name {
                      full
                    }  
                    image {
                      medium
                    }
                  }
                }
              }
            }
          `,
          variables: {
            id: parseInt(id),
          },
        }),
      });

      const data = await response.json();
      setSeiyuuData(data.data.Staff);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching seiyuu data:", error);
      setLoading(false);
    }
  };

  if (loading)
    return <div className="container mx-auto p-4 text-center">Loading...</div>;
  if (!seiyuuData)
    return (
      <div className="container mx-auto p-4 text-center">Seiyuu not found</div>
    );

  const formatDate = (dateObj) => {
    if (!dateObj || !dateObj.year) return "Unknown";
    return `${dateObj.year}-${dateObj.month
      ?.toString()
      .padStart(2, "0")}-${dateObj.day?.toString().padStart(2, "0")}`;
  };

  const birthDate = formatDate(seiyuuData.dateOfBirth);
  const deathDate =
    seiyuuData.dateOfDeath && seiyuuData.dateOfDeath.year
      ? formatDate(seiyuuData.dateOfDeath)
      : null;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={seiyuuData.image?.large}
              alt={seiyuuData.name.full}
              className="w-full h-auto object-cover"
            />
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-1">
                {seiyuuData.name.full}
              </h1>
              {seiyuuData.name.native && (
                <h2 className="text-xl text-gray-700 mb-4">
                  {seiyuuData.name.native}
                </h2>
              )}

              <div className="space-y-2 text-gray-600">
                {seiyuuData.homeTown && (
                  <p>
                    <span className="font-semibold">Hometown:</span>{" "}
                    {seiyuuData.homeTown}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Birth Date:</span> {birthDate}
                </p>
                {deathDate && deathDate !== "Unknown" && (
                  <p>
                    <span className="font-semibold">Death Date:</span>{" "}
                    {deathDate}
                  </p>
                )}
                {seiyuuData.age && (
                  <p>
                    <span className="font-semibold">Age:</span> {seiyuuData.age}
                  </p>
                )}
              </div>
            </div>
          </div>

          {seiyuuData.characters?.nodes?.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold mb-4">Notable Characters</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {seiyuuData.characters.nodes.map((character) => (
                  <div key={character.id} className="text-center">
                    <img
                      src={character.image?.medium}
                      alt={character.name.full}
                      className="w-full h-30 rounded-md"
                    />
                    <p className="text-xs mt-1 truncate">
                      {character.name.full}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side - Posts/Comments area */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="bg-white rounded-lg shadow-md p-6 min-h-[500px]">
            <h2 className="text-2xl font-bold mb-4">Posts & Comments</h2>
            <div className="border-t border-gray-200 pt-4">
              {/* Your posts/comments content will go here */}
              <p className="text-gray-500 italic">
                This is where your posts and comments will appear.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Seiyuu;
