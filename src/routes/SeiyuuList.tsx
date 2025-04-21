import { useState, useEffect } from "react";
import Card from "../components/Card";

interface Seiyuu {
  id: number;
  name: {
    full: string;
    native: string;
  };
  image: {
    large: string;
  };
  primaryOccupations: string[];
  favourites: number;
}

const SeiyuuList = () => {
  const [filteredSeiyuus, setFilteredSeiyuus] = useState<Seiyuu[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchSeiyuus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/anilist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($page: Int) {
              Page(page: $page, perPage: 50) {
                staff(sort: FAVOURITES_DESC) {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                  }
                  primaryOccupations
                  favourites
                }
              }
            }
          `,
          variables: {
            page: page,
          },
        }),
      });
      const data = await response.json();
      const voiceActors: Seiyuu[] = data.data.Page.staff.filter(
        (staff: {
          id: number;
          name: { full: string; native: string };
          image: { large: string };
          primaryOccupations?: string[];
          favourites: number;
        }) =>
          staff.primaryOccupations &&
          staff.primaryOccupations.includes("Voice Actor")
      );
      setFilteredSeiyuus(voiceActors);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching seiyuu data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeiyuus();
  }, [page]);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    setPage(page + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap gap-5 justify-center">
        {loading ? (
          <p className="text-gray-500">Loading seiyuu data...</p>
        ) : filteredSeiyuus.length > 0 ? (
          filteredSeiyuus.map((seiyuu) => (
            <Card
              key={seiyuu.id}
              attributes={{
                id: seiyuu.id.toString(),
                image: seiyuu.image.large,
                name: seiyuu.name.full,
                nativeName: seiyuu.name.native,
              }}
            />
          ))
        ) : (
          <p className="text-gray-500">No seiyuu found matching your search.</p>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-center items-center gap-4">
        <button
          onClick={handlePreviousPage}
          disabled={page === 1}
          className={`px-4 py-2 rounded-lg ${
            page === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Previous Page
        </button>
        <span className="text-lg font-medium">Page {page}</span>
        <button
          onClick={handleNextPage}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Next Page
        </button>
      </div>
    </div>
  );
};

export default SeiyuuList;
