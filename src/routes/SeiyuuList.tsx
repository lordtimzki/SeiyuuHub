import { useState, useEffect } from "react";
import Card from "../components/Card";

const SeiyuuList = () => {
  const [seiyuus, setSeiyuus] = useState([]);
  const [page, setPage] = useState(1);

  const fetchSeiyuus = async () => {
    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($page: Int) {
              Page(page: $page, perPage: 25) {
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
      setSeiyuus(
        data.data.Page.staff.filter(
          (staff) =>
            staff.primaryOccupations &&
            staff.primaryOccupations.includes("Voice Actor")
        )
      );
    } catch (error) {
      console.error("Error fetching seiyuu data:", error);
    }
  };

  useEffect(() => {
    fetchSeiyuus();
  }, [page]);

  return (
    <div className="container p-4">
      <div className="flex flex-wrap gap-5 justify-center">
        {seiyuus.length > 0 ? (
          seiyuus.map((seiyuu) => (
            <Card
              key={seiyuu.id}
              attributes={{
                image: seiyuu.image.large,
                name: seiyuu.name.full,
                nativeName: seiyuu.name.native,
                favorites: seiyuu.favourites,
              }}
            />
          ))
        ) : (
          <p className="text-gray-500">Loading seiyuu data...</p>
        )}
      </div>
    </div>
  );
};

export default SeiyuuList;
