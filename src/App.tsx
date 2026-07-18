import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { UpDownRiverPage } from "./games/upDownRiver/UpDownRiverPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/up-down-river/setup" element={<UpDownRiverPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
