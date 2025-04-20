const Card = ({ attributes }) => {
  return (
    <div className="w-40 h-full bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <img
        src={attributes.image}
        alt={attributes.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 className="text-white font-semibold text-base mb-1">
          {attributes.name}
        </h3>
        <p className="text-red-300 text-sm">❤️ {attributes.favorites}</p>
      </div>
    </div>
  );
};

export default Card;
