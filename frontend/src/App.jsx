import { AuthProvider } from "./auth/AuthContext";
import AppRoutes from "./routes";
import ErrorBoundary from "./components/ErrorBoundary";
import AntdGlobal from "./utils/antdGlobal";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AntdGlobal />
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
