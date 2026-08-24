import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import RegisterPage from "../pages/Auth/RegisterPage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";

// Building Pages
import BuildingPage from "../pages/Building/BuildingPage.jsx";
import BuildingDetailPage from "../pages/Building/BuildingDetailPage.jsx";
import BuildingFormPage from "../pages/Building/BuildingFormPage.jsx";
import FloorFormPage from "../pages/Building/FloorFormPage.jsx";
import RoomFormPage from "../pages/Building/RoomFormPage.jsx";
import RackFormPage from "../pages/Building/RackFormPage.jsx";

// Asset Pages
import AssetsPage from "../pages/Assets/AssetsPage.jsx";
import AssetDetailPage from "../pages/Assets/AssetDetailPage.jsx";
import AssetFormPage from "../pages/Assets/AssetFormPage.jsx";

// Mapping Pages
import MappingPage from "../pages/Mapping/MappingPage.jsx";
import ConnectionFormPage from "../pages/Mapping/ConnectionFormPage.jsx";

// Maintenance & Other Pages
import SimulationPage from "../pages/Simulation/SimulationPage.jsx";
import DigitalTwinPage from "../pages/DigitalTwin/DigitalTwinPage.jsx";
import MaintenancePage from "../pages/Maintenance/MaintenancePage.jsx";
import MaintenanceFormPage from "../pages/Maintenance/MaintenanceFormPage.jsx";
import ProfilePage from "../pages/Profile/ProfilePage.jsx";
import MainLayout from "../components/layout/MainLayout.jsx";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="dashboard"                 element={<DashboardPage />} />
        
        {/* Buildings */}
        <Route path="buildings"                 element={<BuildingPage />} />
        <Route path="buildings/create"          element={<BuildingFormPage />} />
        <Route path="buildings/:id"             element={<BuildingDetailPage />} />
        <Route path="buildings/:id/edit"        element={<BuildingFormPage />} />
        <Route path="buildings/:id/floors/create" element={<FloorFormPage />} />
        <Route path="buildings/:id/rooms/create"  element={<RoomFormPage />} />
        <Route path="buildings/:id/racks/create"  element={<RackFormPage />} />

        {/* Assets */}
        <Route path="assets"                    element={<AssetsPage />} />
        <Route path="assets/create"             element={<AssetFormPage />} />
        <Route path="assets/:id"                element={<AssetDetailPage />} />
        <Route path="assets/:id/edit"           element={<AssetFormPage />} />

        {/* Mapping */}
        <Route path="mapping"                   element={<MappingPage />} />
        <Route path="mapping/create-connection" element={<ConnectionFormPage />} />

        {/* Simulation, Digital Twin, Maintenance, Profile */}
        <Route path="simulation"                element={<SimulationPage />} />
        <Route path="digital-twin"              element={<DigitalTwinPage />} />
        <Route path="maintenance"               element={<MaintenancePage />} />
        <Route path="maintenance/create"        element={<MaintenanceFormPage />} />
        <Route path="maintenance/:id/edit"      element={<MaintenanceFormPage />} />
        <Route path="profile"                   element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

