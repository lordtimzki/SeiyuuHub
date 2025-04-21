import viteLogo from "/vite.svg";
import "./App.css";
import Navbar from "./components/Navbar";
import { useRoutes } from "react-router-dom";
import Home from "./routes/Home";
import Create from "./routes/Create";
import SeiyuuList from "./routes/SeiyuuList";
import Seiyuu from "./routes/Seiyuu";
import Post from "./routes/Post";
import SeiyuuPost from "./components/SeiyuuPost";

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
    {
      path: "/seiyuu/:id",
      element: <Seiyuu />,
    },
    {
      path: "/post/:id",
      element: <Post />,
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
