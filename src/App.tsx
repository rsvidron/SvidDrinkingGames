import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { UpDownRiverPage } from "./games/upDownRiver/UpDownRiverPage";
import { KingsCupPage } from "./games/kingsCup/KingsCupPage";
import { FuckTheDealerPage } from "./games/fuckTheDealer/FuckTheDealerPage";
import { FuckTheDealerViewer } from "./games/fuckTheDealer/FuckTheDealerViewer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/up-down-river/setup" element={<UpDownRiverPage />} />
        <Route path="/games/kings-cup/setup" element={<KingsCupPage />} />
        <Route path="/games/fuck-the-dealer/setup" element={<FuckTheDealerPage />} />
        <Route path="/view/:code" element={<FuckTheDealerViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
