import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { UpDownRiverPage } from "./games/upDownRiver/UpDownRiverPage";
import { KingsCupPage } from "./games/kingsCup/KingsCupPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/up-down-river/setup" element={<UpDownRiverPage />} />
        <Route path="/games/kings-cup/setup" element={<KingsCupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
