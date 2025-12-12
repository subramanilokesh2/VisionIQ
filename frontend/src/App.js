import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./Modules/Landing";
import LoginPage from "./Modules/Login";
import Dashboard from "./Modules/Dashboard"
import CompanyProfile from "./Modules/CompanyProfile"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/company-profile" element={<CompanyProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
