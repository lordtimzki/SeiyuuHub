import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="text-3xl font-normal">
          Seiyuu<span className="text-purple-500 font-extrabold">Hub</span>
        </div>
        <div className="flex space-x-8 text-xl">
          <Link to="/" className="hover:text-gray-600">
            Home
          </Link>
          <Link to="/create" className="hover:text-gray-600">
            Create
          </Link>
          <Link to="/seiyuu" className="hover:text-gray-600">
            Seiyuu List
          </Link>
        </div>
      </div>
      <hr className="mt-4 border-gray-800" />
    </nav>
  );
};

export default Navbar;
