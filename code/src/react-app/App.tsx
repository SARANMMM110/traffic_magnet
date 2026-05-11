import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";
import Landing from "@/react-app/pages/Landing";
import Dashboard from "@/react-app/pages/Dashboard";
import CreateTool from "@/react-app/pages/CreateTool";
import NewProject from "@/react-app/pages/NewProject";
import ProjectsList from "@/react-app/pages/ProjectsList";
import ProjectView from "@/react-app/pages/ProjectView";
import BlueprintView from "@/react-app/pages/BlueprintView";
import ToolBuilder from "@/react-app/pages/ToolBuilder";
import MyTools from "@/react-app/pages/MyTools";
import MyMagnets from "@/react-app/pages/MyMagnets";
import SeoPages from "@/react-app/pages/SeoPages";
import ContentWrapper from "@/react-app/pages/ContentWrapper";
import HelpFAQ from "@/react-app/pages/HelpFAQ";
import SettingsPage from "@/react-app/pages/SettingsPage";
import UpgradePage from "@/react-app/pages/UpgradePage";
import WordPress from "@/react-app/pages/WordPress";
import Login from "@/react-app/pages/Login";
import Signup from "@/react-app/pages/Signup";
import Onboarding from "@/react-app/pages/Onboarding";
import AuthCallback from "@/react-app/pages/AuthCallback";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/start"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateTool />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <NewProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blueprints/:id"
            element={
              <ProtectedRoute>
                <BlueprintView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/:id"
            element={
              <ProtectedRoute>
                <ToolBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tools"
            element={
              <ProtectedRoute>
                <MyTools />
              </ProtectedRoute>
            }
          />
          <Route
            path="/magnets"
            element={
              <ProtectedRoute>
                <MyMagnets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content"
            element={
              <ProtectedRoute>
                <ContentWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faq"
            element={
              <ProtectedRoute>
                <HelpFAQ />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seo-pages"
            element={
              <ProtectedRoute>
                <SeoPages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upgrade"
            element={
              <ProtectedRoute>
                <UpgradePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wordpress"
            element={
              <ProtectedRoute>
                <WordPress />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
