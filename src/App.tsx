import viteLogo from "/vite.svg";
import "./App.css";
import Navbar from "./components/Navbar";
import { useRoutes } from "react-router-dom";
import Home from "./routes/Home";
import Create from "./routes/Create";
import SeiyuuList from "./routes/SeiyuuList";

function App() {
  const element = useRoutes([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/create",
      element: <Create />,
    },
    {
      path: "/seiyuu",
      element: <SeiyuuList />,
    },
  ]);
  return (
    <>
      <Navbar />
      {element}
    </>
  );
}

export default App;
