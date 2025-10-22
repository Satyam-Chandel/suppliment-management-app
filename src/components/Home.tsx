import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useEffect, useState } from "react";
import { metadataApi, analyticsApi } from "../services/api";
import { toast } from "sonner";
import { getErrorMessage } from "../utils/errorHandler";

interface HomeProps {
  onCategoryClick: (categoryType: string, categoryName: string) => void;
}

interface Category {
  id: string;
  name: string;
  type: string;
  description: string;
  image?: string;
}

// Default categories to display
const defaultCategories: Category[] = [
  {
    id: '1',
    name: 'Whey Proteins',
    image: 'https://images.unsplash.com/photo-1638405803126-d12de49c7d47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGV5JTIwcHJvdGVpbiUyMHBvd2RlciUyMGNvbnRhaW5lcnxlbnwxfHx8fDE3NTgyNjAxMDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'High-quality protein powders for muscle building',
    type: 'whey-protein'
  },
  {
    id: '2',
    name: 'Pre-Workouts',
    image: 'https://images.unsplash.com/photo-1704650311140-aba27da8623d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmUlMjB3b3Jrb3V0JTIwc3VwcGxlbWVudCUyMHBvd2RlcnxlbnwxfHx8fDE3NTgyNjAxMDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Energy boosters for enhanced workout performance',
    type: 'pre-workout'
  },
  {
    id: '3',
    name: 'Peanut Butter & Protein Bars',
    image: 'https://images.unsplash.com/photo-1630319265212-3e6a78541413?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFudXQlMjBidXR0ZXIlMjBqYXIlMjBwcm90ZWlufGVufDF8fHx8MTc1ODIyMDEwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Nutritious spreads and convenient protein bars',
    type: 'peanut-butter'
  },
  {
    id: '4',
    name: 'Creatine',
    image: 'https://images.unsplash.com/photo-1693996046514-0406d0773a7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGluZSUyMHN1cHBsZW1lbnQlMjBwb3dkZXJ8ZW58MXx8fHwxNzU4MjYwMTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Strength and power enhancement supplements',
    type: 'creatine'
  },
  {
    id: '5',
    name: 'Oral Supplements',
    image: 'https://images.unsplash.com/photo-1556739664-787e863d09c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFsJTIwc3VwcGxlbWVudCUyMHBpbGxzJTIwdml0YW1pbnN8ZW58MXx8fHwxNzU4MjYwMTE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Vitamins, minerals, and health supplements',
    type: 'other'
  }
];

interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  nearExpiryCount: number;
  monthRevenue: number;
  monthQuantity: number;
  pendingOrdersCount: number;
}

export function Home({ onCategoryClick }: HomeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const sliderImages = [
    {
      src: "/images/whey-proteins.jpg",
      alt: "Whey Protein Powder",
      title: "Premium Whey Protein"
    },
    {
      src: "/images/preworkout.jpg",
      alt: "Pre-Workout Supplement",
      title: "High Energy Pre-Workout"
    },
    {
      src: "/images/creatine.jpg",
      alt: "Creatine Supplements",
      title: "Pure Creatine Monohydrate"
    },
    {
      src: "https://images.unsplash.com/photo-1554886729-fe8d4499a108?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm90ZWluJTIwYmFycyUyMG51dHJpdGlvbnxlbnwxfHx8fDE3NTkyOTc4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      alt: "Protein Bars",
      title: "Nutritious Protein Bars"
    },
    {
      src: "https://images.unsplash.com/photo-1743187248656-b53c203d808e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFsJTIwc3VwcGxlbWVudHMlMjB2aXRhbWluc3xlbnwxfHx8fDE3NTkyOTc4NDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      alt: "Oral Supplements",
      title: "Essential Vitamins & Minerals"
    }
  ];

  // Load categories and dashboard stats
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, statsData] = await Promise.all([
        metadataApi.getCategories().catch(() => []),
        analyticsApi.getDashboard()
      ]);
      // Use API categories if available, otherwise use default categories
      setCategories(categoriesData.length > 0 ? categoriesData : defaultCategories);
      setDashboardStats(statsData);
    } catch (error: any) {
      // On error, use default categories
      setCategories(defaultCategories);
      toast.error(getErrorMessage(error, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => 
        prevSlide === sliderImages.length - 1 ? 0 : prevSlide + 1
      );
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  return (
    <div>
      <div className="p-3 sm:p-4 md:p-6 pb-0">
        <div className="mb-4 sm:mb-6">
          <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl">Welcome to Xtreme Fitness Supplements</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your one-stop shop for premium fitness supplements and nutrition products.
          </p>
        </div>
      </div>

      {/* Photo Slider */}
      <div className="mb-6 sm:mb-8">
        <div className="relative w-full">
          <div className="relative aspect-[16/7] sm:aspect-[16/6] md:aspect-[16/5] overflow-hidden">
            <ImageWithFallback
              src={sliderImages[currentSlide].src}
              alt={sliderImages[currentSlide].alt}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <h3 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-center px-3 sm:px-4">
                {sliderImages[currentSlide].title}
              </h3>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <button
            onClick={() => setCurrentSlide(currentSlide === 0 ? sliderImages.length - 1 : currentSlide - 1)}
            className="absolute left-2 sm:left-4 md:left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-2.5 md:p-3 rounded-full transition-all active:scale-95"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentSlide(currentSlide === sliderImages.length - 1 ? 0 : currentSlide + 1)}
            className="absolute right-2 sm:right-4 md:right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-2.5 md:p-3 rounded-full transition-all active:scale-95"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all active:scale-90 ${
                  index === currentSlide ? 'bg-white w-6 sm:w-8' : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Category Cards without Photos */}
      <div className="px-3 sm:px-4 md:px-6 mb-6 sm:mb-8">
        <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl md:text-2xl">Browse by Category</h2>
        {loading ? (
          <div className="text-center py-8 text-sm sm:text-base">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
            No categories available. Please add categories from the admin panel.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]" 
                onClick={() => onCategoryClick(category.type, category.name)}
              >
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <CardTitle className="text-center text-base sm:text-lg">{category.name}</CardTitle>
                  <CardDescription className="text-center text-xs sm:text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 sm:px-4 md:px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg md:text-xl">Total Products</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Currently in stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{loading ? '...' : dashboardStats?.totalProducts || 0}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg md:text-xl">Low Stock Alert</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Products running low</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{loading ? '...' : dashboardStats?.lowStockCount || 0}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Need restocking soon</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg md:text-xl">This Month's Sales</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">₹{loading ? '...' : (dashboardStats?.monthRevenue || 0).toLocaleString()}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">{dashboardStats?.monthQuantity || 0} units sold</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}