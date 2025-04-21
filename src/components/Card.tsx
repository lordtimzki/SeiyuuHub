import { Link } from "react-router-dom";
interface CardProps {
  attributes: {
    id: string;
    image: string;
    name: string;
    nativeName?: string;
  };
}

const Card = ({ attributes }: CardProps) => {
  return (
    <div className="w-40 h-60 relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col group">
      <img
        src={attributes.image}
        alt={attributes.name}
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 pointer-events-none text-left">
        <h3 className="text-white font-semibold text-sm mb-1 truncate">
          {attributes.name}
        </h3>
        {attributes.nativeName && (
          <p className="text-gray-300 text-xs truncate">
            {attributes.nativeName}
          </p>
        )}
      </div>

      <Link
        to={`/seiyuu/${attributes.id}`}
        className="absolute inset-0"
        aria-label={`View details for ${attributes.name}`}
      ></Link>
    </div>
  );
};

export default Card;
