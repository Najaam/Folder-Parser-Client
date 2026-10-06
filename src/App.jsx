import { useState } from "react";
import FolderParser from "./pages/FolderParser";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const [screen, setScreen] = useState("landing");

  return screen === "landing"
    ? <LandingPage onGetStarted={() => setScreen("analyzer")} />
    : <FolderParser />;
}
