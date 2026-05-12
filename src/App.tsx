import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { BOOKING_DRAFT_KEY, clearFullPaymentSession, clearPaymentOrderState } from "./lib/sessionKeys";
import { AnimatePresence, m } from "motion/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingButtons from "./components/FloatingButtons";
import HomePage from "./pages/HomePage";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const BookingFormPage = lazy(() => import("./pages/BookingFormPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentFailurePage = lazy(() => import("./pages/PaymentFailurePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

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

function PageLoadFallback() {
  return <div className="min-h-[40vh] w-full bg-surface" aria-hidden />;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageName>("home");
  const [bookingData, setBookingData] = useState<BookingData>(emptyBooking);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const restoreBookingDraft = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<BookingData>;
      // Merge supaya field default tetap aman
      setBookingData((prev) => ({ ...emptyBooking, ...prev, ...parsed }));
    } catch {
      /* ignore */
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);

  const navigate = useCallback((page: PageName) => {
    if (page === "admin-dashboard" && !isAdminAuthenticated) {
      setCurrentPage("admin-login");
    } else {
      setCurrentPage(page);
    }
    window.scrollTo(0, 0);
    window.history.replaceState(null, "", `#${page}`);
  }, [isAdminAuthenticated]);

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
      if (hash === "admin-dashboard" && !isAdminAuthenticated) {
        setCurrentPage("admin-login");
      } else {
        setCurrentPage(hash);
      }
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [isAdminAuthenticated]);

  // Pastikan data booking tidak hilang saat kembali ke payment / payment-failed (contoh: klik "Coba Lagi")
  useEffect(() => {
    if (currentPage !== "payment" && currentPage !== "payment-failed") return;
    if (bookingData.checkIn && bookingData.checkOut) return;
    restoreBookingDraft();
  }, [currentPage, bookingData.checkIn, bookingData.checkOut, restoreBookingDraft]);

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

  const handleAdminLogin = useCallback(
    (success: boolean) => {
      if (success) {
        setIsAdminAuthenticated(true);
        navigate("admin-dashboard");
      }
    },
    [navigate]
  );

  const handleAdminLogout = useCallback(() => {
    setIsAdminAuthenticated(false);
    navigate("home");
  }, [navigate]);

  const startBooking = useCallback(
    (propertyId?: number, propertyName?: string, price?: number, image?: string) => {
      clearFullPaymentSession();
      setBookingData({
        ...emptyBooking,
        propertyId: propertyId || null,
        propertyName: propertyName || "",
        propertyPrice: price || 0,
        propertyImage: image || "",
      });
      navigate("book");
    },
    [navigate]
  );

  const proceedToPayment = useCallback(
    (data: BookingData) => {
      clearPaymentOrderState();
      sessionStorage.setItem("wolio_pay_session", String(Date.now()));
      try {
        sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
      setBookingData(data);
      navigate("payment");
    },
    [navigate]
  );

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage navigate={navigate} startBooking={startBooking} />;
      case "about":
        return (
          <Suspense fallback={<PageLoadFallback />}>
            <AboutPage />
          </Suspense>
        );
      case "book":
        return (
          <Suspense fallback={<PageLoadFallback />}>
            <BookingFormPage
              bookingData={bookingData}
              setBookingData={setBookingData}
              proceedToPayment={proceedToPayment}
              navigate={navigate}
            />
          </Suspense>
        );
      case "payment":
        return (
          <Suspense fallback={<PageLoadFallback />}>
            <PaymentPage bookingData={bookingData} navigate={navigate} />
          </Suspense>
        );
      case "payment-success":
        return (
          <Suspense fallback={<PageLoadFallback />}>
            <PaymentSuccessPage navigate={navigate} />
          </Suspense>
        );
      case "payment-failed":
        return (
          <Suspense fallback={<PageLoadFallback />}>
            <PaymentFailurePage navigate={navigate} />
          </Suspense>
        );
      case "contact":
        return (
          <Suspense fallback={<PageLoadFallback />}>
            <ContactPage navigate={navigate} />
          </Suspense>
        );
      case "admin-login":
        return (
          <Suspense fallback={<PageLoadFallback />}>
            <AdminLoginPage onLogin={handleAdminLogin} navigate={navigate} />
          </Suspense>
        );
      case "admin-dashboard":
        return (
          <Suspense fallback={<PageLoadFallback />}>
            <AdminDashboard onLogout={handleAdminLogout} />
          </Suspense>
        );
      default:
        return <HomePage navigate={navigate} startBooking={startBooking} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      {currentPage !== "admin-login" && currentPage !== "admin-dashboard" && (
        <>
          <Navbar currentPage={currentPage} navigate={navigate} />
          <FloatingButtons />
        </>
      )}

      <AnimatePresence mode="wait">
        <m.div
          key={currentPage}
          className="min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {renderPage()}
        </m.div>
      </AnimatePresence>

      {currentPage !== "admin-login" && currentPage !== "admin-dashboard" && (
        <Footer navigate={navigate} />
      )}
    </div>
  );
}
