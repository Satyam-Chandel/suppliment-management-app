import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { inventoryApi } from "../services/api";
import { toast } from "sonner";
import { SupplementProduct } from "../types";
import { getErrorMessage } from "../utils/errorHandler";

export function NearExpiry() {
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [oneMonthProducts, setOneMonthProducts] = useState<SupplementProduct[]>([]);
  const [threeMonthProducts, setThreeMonthProducts] = useState<SupplementProduct[]>([]);
  const [fourMonthProducts, setFourMonthProducts] = useState<SupplementProduct[]>([]);
  const [sixMonthProducts, setSixMonthProducts] = useState<SupplementProduct[]>([]);

  useEffect(() => {
    loadExpiryData();
  }, []);

  const loadExpiryData = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getAlerts({ type: 'expiry', months: '1,3,4,6' });
      setOneMonthProducts(data['1Month'] || []);
      setThreeMonthProducts(data['3Month'] || []);
      setFourMonthProducts(data['4Month'] || []);
      setSixMonthProducts(data['6Month'] || []);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load expiry data'));
    } finally {
      setLoading(false);
    }
  };

  const getExpiryBadgeColor = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);
    
    if (diffMonths <= 1) return "destructive";
    if (diffMonths <= 3) return "default";
    return "secondary";
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const ProductCard = ({ product }: { product: any }) => (
    <Card className="p-3 sm:p-4">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm sm:text-base truncate">{product.name}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{product.brand}</p>
          </div>
          <Badge variant={getExpiryBadgeColor(product.expiryDate)} className="text-xs flex-shrink-0">
            {getDaysUntilExpiry(product.expiryDate)}d
          </Badge>
        </div>
        
        {/* Serial Number */}
        {product.serialNumber && (
          <div className="bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
            <span className="text-[10px] sm:text-xs font-mono font-semibold">{product.serialNumber}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="truncate">
            <span className="text-muted-foreground">Flavor:</span> {product.flavor}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Weight:</span> {product.weight}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Qty:</span> {product.quantity}
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Price:</span> ₹{product.price}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">Expires: {new Date(product.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="text-center py-8 text-sm sm:text-base">Loading expiry data...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl">Near Expiry Products</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Monitor products approaching their expiry dates to minimize waste and optimize sales.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm flex items-center">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-red-500 flex-shrink-0" />
              <span>1 Month</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{oneMonthProducts.length}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Urgent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm flex items-center">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-orange-500 flex-shrink-0" />
              <span>3 Months</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{threeMonthProducts.length}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Plan sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm flex items-center">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-yellow-500 flex-shrink-0" />
              <span>4 Months</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{fourMonthProducts.length}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Monitor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm flex items-center">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500 flex-shrink-0" />
              <span>6 Months</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{sixMonthProducts.length}</div>
            <p className="text-muted-foreground text-sm">Good condition</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="1-month" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="1-month" className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">1M <span className="hidden sm:inline">({oneMonthProducts.length})</span></span>
          </TabsTrigger>
          <TabsTrigger value="3-months" className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">3M <span className="hidden sm:inline">({threeMonthProducts.length})</span></span>
          </TabsTrigger>
          <TabsTrigger value="4-months" className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">4M <span className="hidden sm:inline">({fourMonthProducts.length})</span></span>
          </TabsTrigger>
          <TabsTrigger value="6-months" className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">6M <span className="hidden sm:inline">({sixMonthProducts.length})</span></span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="1-month">
          <Card>
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <CardTitle className="text-red-600 flex items-center text-base sm:text-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span>Expiring Within 1 Month</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                These products need immediate attention. Consider offering discounts or promotions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
              {oneMonthProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {oneMonthProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">
                  No products expiring within 1 month.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3-months">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Expiring Within 3 Months
              </CardTitle>
              <CardDescription>
                Plan your sales strategy for these products to avoid waste.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threeMonthProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {threeMonthProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No products expiring within 3 months.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="4-months">
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-600 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Expiring Within 4 Months
              </CardTitle>
              <CardDescription>
                Monitor these products and plan inventory rotation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fourMonthProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fourMonthProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No products expiring within 4 months.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="6-months">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Expiring Within 6 Months
              </CardTitle>
              <CardDescription>
                These products are in good condition but should be monitored.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sixMonthProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sixMonthProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No products expiring within 6 months.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}