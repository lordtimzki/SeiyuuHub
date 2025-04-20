const Navbar = () => {
  return (
    <nav className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="text-3xl font-normal">
          Seiyuu<span className="text-purple-500">Hub</span>
        </div>
        <div className="flex space-x-8 text-xl">
          <a href="/" className="hover:text-gray-600">
            Home
          </a>
          <a href="/create" className="hover:text-gray-600">
            Create
          </a>
          <a href="/seiyuu" className="hover:text-gray-600">
            Seiyuu List
          </a>
        </div>
      </div>
      <hr className="mt-4 border-gray-800" />
    </nav>
  );
};

export default Navbar;
