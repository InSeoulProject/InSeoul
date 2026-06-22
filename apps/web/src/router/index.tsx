import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import RequireAuth from "../components/guards/RequireAuth";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ConditionInputPage from "../pages/ConditionInputPage";
import ConfirmPage from "../pages/ConfirmPage";
import DashboardPage from "../pages/DashboardPage";
import StrategyCardPage from "../pages/StrategyCardPage";
import HistoryPage from "../pages/HistoryPage";
import StrategySelectPage from "../pages/StrategySelectPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: "/signup", element: <SignupPage /> },
      { path: "/login", element: <LoginPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/app/input", element: <ConditionInputPage /> },
          { path: "/app/confirm", element: <ConfirmPage /> },
          { path: "/app/dashboard", element: <DashboardPage /> },
          { path: "/app/strategy-card", element: <StrategyCardPage /> },
          { path: "/app/history", element: <HistoryPage /> },
          { path: "/app/strategy-select", element: <StrategySelectPage /> },
        ],
      },
    ],
  },
]);
