import { useLocation } from "react-router-dom";
import CustomerAssistant from "../components/CustomerAssistant";
import Navbar from "../components/Navbar";

const assistantRoutes = ["/", "/services", "/login", "/register", "/forgot-password"];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const shouldShowAssistant = assistantRoutes.some((route) =>
    route === "/services" ? location.pathname.startsWith("/services") : location.pathname === route
  );

  return (
    <div className="min-h-screen bg-sand">
      <Navbar />
      <main>{children}</main>
      {shouldShowAssistant && <CustomerAssistant />}
    </div>
  );
};

export default AppLayout;
