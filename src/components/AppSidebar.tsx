import { Home, Package, TrendingUp, AlertTriangle, ShoppingCart } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
    key: "home",
    adminOnly: false
  },
  {
    title: "Stock Entry",
    url: "#",
    icon: Package,
    key: "stock-entry",
    adminOnly: false
  },
  {
    title: "Sales Insights",
    url: "#",
    icon: TrendingUp,
    key: "sales-insights",
    adminOnly: true // Only visible to admin
  },
  {
    title: "Near Expiry",
    url: "#",
    icon: AlertTriangle,
    key: "near-expiry",
    adminOnly: false
  },
  {
    title: "Orders",
    url: "#",
    icon: ShoppingCart,
    key: "orders",
    adminOnly: false
  },
];

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: string | null;
}

export function AppSidebar({ activeSection, onSectionChange, userRole }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  
  // Filter items based on user role
  const visibleItems = items.filter(item => {
    if (item.adminOnly) {
      return userRole === 'admin';
    }
    return true;
  });

  const handleMenuItemClick = (key: string) => {
    onSectionChange(key);
    // Close sidebar on mobile when a menu item is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Xtreme Fitness Supplements</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton 
                    asChild
                    isActive={activeSection === item.key}
                  >
                    <button 
                      onClick={() => handleMenuItemClick(item.key)}
                      className="w-full"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}