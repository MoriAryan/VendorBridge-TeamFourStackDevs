import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Activity } from "./pages/Activity";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="activity" element={<Activity />} />
          <Route path="*" element={<div className="text-center p-12 text-[#6B7280]">Page under construction</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
