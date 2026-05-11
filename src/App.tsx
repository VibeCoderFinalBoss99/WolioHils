import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingButtons from "./components/FloatingButtons";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import BookingFormPage from "./pages/BookingFormPage";
import PaymentPage from "./pages/PaymentPage";
import ContactPage from "./pages/ContactPage";

export type PageName = "home" | "about" | "book" | "payment" | "contact";

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

  const navigate = (page: PageName) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState(null, "", `#${page}`);
  };

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as PageName;
    const validPages: PageName[] = ["home", "about", "book", "payment", "contact"];
    if (validPages.includes(hash)) {
      setCurrentPage(hash);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace("#", "") as PageName;
      const validPages: PageName[] = ["home", "about", "book", "payment", "contact"];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
    setBookingData(data);
    navigate("payment");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage navigate={navigate} startBooking={startBooking} />;
      case "about":
        return <AboutPage navigate={navigate} />;
      case "book":
        return <BookingFormPage bookingData={bookingData} setBookingData={setBookingData} proceedToPayment={proceedToPayment} navigate={navigate} />;
      case "payment":
        return <PaymentPage bookingData={bookingData} navigate={navigate} />;
      case "contact":
        return <ContactPage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} startBooking={startBooking} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navbar currentPage={currentPage} navigate={navigate} />
      <FloatingButtons />
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
      <Footer navigate={navigate} />
    </div>
  );
}
