import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingButtons from "./components/FloatingButtons";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage.tsx";
import BookingFormPage from "./pages/BookingFormPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import ContactPage from "./pages/ContactPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";

export type PageName =
  | "home"
  | "about"
  | "book"
  | "payment"
  | "payment-success"
  | "payment-failed"
  | "contact"
  | "admin-login"
  | "admin-dashboard";

export interface BookingData {
  propertyId: number | null;
  propertyName: string;
  propertyPrice: number;
  propertyImage: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  specialRequests: string;
}

const emptyBooking: BookingData = {
  propertyId: null,
  propertyName: "",
  propertyPrice: 0,
  propertyImage: "",
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  checkIn: "",
  checkOut: "",
  guests: 1,
  rooms: 1,
  specialRequests: "",
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageName>("home");
  const [bookingData, setBookingData] = useState<BookingData>(emptyBooking);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const navigate = (page: PageName) => {
    // Check if trying to access admin dashboard without authentication
    if (page === "admin-dashboard" && !isAdminAuthenticated) {
      setCurrentPage("admin-login");
    } else {
      setCurrentPage(page);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState(null, "", `#${page}`);
  };

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as PageName;
    const validPages: PageName[] = [
      "home",
      "about",
      "book",
      "payment",
      "payment-success",
      "payment-failed",
      "contact",
      "admin-login",
      "admin-dashboard",
    ];
    if (validPages.includes(hash)) {
      // Check if trying to access admin dashboard without authentication
      if (hash === "admin-dashboard" && !isAdminAuthenticated) {
        setCurrentPage("admin-login");
      } else {
        setCurrentPage(hash);
      }
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace("#", "") as PageName;
      const validPages: PageName[] = [
      "home",
      "about",
      "book",
      "payment",
      "payment-success",
      "payment-failed",
      "contact",
      "admin-login",
      "admin-dashboard",
    ];
      if (validPages.includes(hash)) {
        // Check if trying to access admin dashboard without authentication
        if (hash === "admin-dashboard" && !isAdminAuthenticated) {
          setCurrentPage("admin-login");
        } else {
          setCurrentPage(hash);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAdminAuthenticated]);

  const handleAdminLogin = (success: boolean) => {
    if (success) {
      setIsAdminAuthenticated(true);
      navigate("admin-dashboard");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    navigate("home");
  };

  const startBooking = (propertyId?: number, propertyName?: string, price?: number, image?: string) => {
    setBookingData({
      ...emptyBooking,
      propertyId: propertyId || null,
      propertyName: propertyName || "",
      propertyPrice: price || 0,
      propertyImage: image || "",
    });
    navigate("book");
  };

  const proceedToPayment = (data: BookingData) => {
    sessionStorage.setItem("wolio_pay_session", String(Date.now()));
    setBookingData(data);
    navigate("payment");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage navigate={navigate} startBooking={startBooking} />;
      case "about":
        return <AboutPage />;
      case "book":
        return <BookingFormPage bookingData={bookingData} setBookingData={setBookingData} proceedToPayment={proceedToPayment} navigate={navigate} />;
      case "payment":
        return <PaymentPage bookingData={bookingData} navigate={navigate} />;
      case "payment-success":
        return <PaymentSuccessPage navigate={navigate} />;
      case "payment-failed":
        return <PaymentFailurePage navigate={navigate} />;
      case "contact":
        return <ContactPage navigate={navigate} />;
      case "admin-login":
        return <AdminLoginPage onLogin={handleAdminLogin} />;
      case "admin-dashboard":
        return <AdminDashboard onLogout={handleAdminLogout} />;
      default:
        return <HomePage navigate={navigate} startBooking={startBooking} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Show Navbar and Footer only for non-admin pages */}
      {currentPage !== "admin-login" && currentPage !== "admin-dashboard" && (
        <>
          <Navbar currentPage={currentPage} navigate={navigate} />
          <FloatingButtons />
        </>
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      
      {/* Show Footer only for non-admin pages */}
      {currentPage !== "admin-login" && currentPage !== "admin-dashboard" && (
        <Footer navigate={navigate} />
      )}
    </div>
  );
}
