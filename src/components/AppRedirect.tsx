import { Navigate, useParams } from "react-router-dom";

/**
 * Redireciona /app e /app/* para /dashboard e /dashboard/*
 */
export default function AppRedirect() {
  const params = useParams();
  const splat = params["*"];
  const to = splat ? `/dashboard/${splat}` : "/dashboard";
  return <Navigate to={to} replace />;
}
