import MainLayout from '../layouts/MainLayout.jsx';
import Home from '../pages/Home.jsx';
import NotFound from '../pages/NotFound.jsx';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';

export default function Routes() {
  return (
    <RouterRoutes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
}
