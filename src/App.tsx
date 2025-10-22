import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { Home } from "./components/Home";
import { CategoryView } from "./components/CategoryView";
import { StockEntry } from "./components/StockEntry";
import { SalesInsights } from "./components/SalesInsights";
import { NearExpiry } from "./components/NearExpiry";
import { Orders } from "./components/Orders";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState<{type: string, name: string} | null>(null);
  const [stockEntryCategory, setStockEntryCategory] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Capture authentication data from URL parameters (passed from Gym app)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const email = urlParams.get('email');
    const token = urlParams.get('token');
    const role = urlParams.get('role');

    // If auth parameters are present, store them in localStorage
    if (userId && token) {
      localStorage.setItem('supplement_userId', userId);
      localStorage.setItem('supplement_email', email || '');
      localStorage.setItem('supplement_token', token);
      localStorage.setItem('supplement_role', role || 'employee');
      setUserRole(role || 'employee');
      
      // Clean up URL by removing query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Try to load from localStorage if not in URL
      const storedRole = localStorage.getItem('supplement_role');
      setUserRole(storedRole || 'employee');
    }
  }, []);

  const handleCategoryClick = (categoryType: string, _categoryName: string) => {
    setStockEntryCategory(categoryType);
    setActiveSection("stock-entry");
  };

  const handleBackToHome = () => {
    setSelectedCategory(null);
    setStockEntryCategory(null);
    setActiveSection("home");
  };

  const handleSectionChange = (section: string) => {
    // Clear stock entry category when navigating from sidebar (unless going to home)
    if (section !== "stock-entry" && section !== "home") {
      setStockEntryCategory(null);
    }
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <Home onCategoryClick={handleCategoryClick} />;
      case "category-view":
        return selectedCategory ? (
          <CategoryView 
            category={selectedCategory.type} 
            categoryName={selectedCategory.name}
            onBack={handleBackToHome}
          />
        ) : <Home onCategoryClick={handleCategoryClick} />;
      case "stock-entry":
        return <StockEntry 
          initialTab={stockEntryCategory ? "view-stock" : "add-stock"}
          initialCategory={stockEntryCategory || undefined}
          userRole={userRole}
        />;
      case "sales-insights":
        // Only show Sales Insights to admin users
        if (userRole === 'admin') {
          return <SalesInsights />;
        } else {
          // Redirect non-admin users to home
          return (
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view Sales Insights. This section is only available to administrators.
              </p>
              <button 
                onClick={() => setActiveSection("home")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
      case "near-expiry":
        return <NearExpiry />;
      case "orders":
        return <Orders />;
      default:
        return <Home onCategoryClick={handleCategoryClick} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          userRole={userRole}
        />
        <main className="flex-1 overflow-auto w-full">
          <div className="sticky top-0 z-10 bg-background border-b p-3 sm:p-4 flex items-center">
            <SidebarTrigger />
            <h2 className="ml-3 text-sm sm:text-base font-semibold truncate">
              {activeSection === "home" && "Dashboard"}
              {activeSection === "stock-entry" && "Stock Entry"}
              {activeSection === "sales-insights" && "Sales Insights"}
              {activeSection === "near-expiry" && "Near Expiry"}
              {activeSection === "orders" && "Orders"}
              {activeSection === "category-view" && "Categories"}
            </h2>
          </div>
          <div className="min-h-0">
            {renderContent()}
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}