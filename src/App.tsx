import { Routes, Route } from 'react-router-dom';
import HomePage from './app/page';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Future routes can be added here:
      <Route path="/batch" element={<BatchPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      */}
    </Routes>
  );
}
