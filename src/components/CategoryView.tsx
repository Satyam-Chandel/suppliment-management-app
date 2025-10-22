import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { SupplementType, SupplementProduct } from "../types";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useEffect, useState } from "react";
import { productsApi, metadataApi } from "../services/api";
import { toast } from "sonner";
import { getErrorMessage } from "../utils/errorHandler";

interface CategoryViewProps {
  category: string;
  categoryName: string;
  onBack: () => void;
}

interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  image?: string;
}

export function CategoryView({ category, categoryName, onBack }: CategoryViewProps) {
  const [products, setProducts] = useState<SupplementProduct[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, brandsData] = await Promise.all([
        productsApi.getAll({ category }),
        metadataApi.getBrands()
      ]);
      setProducts(productsData);
      setBrands(brandsData);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  };
  
  // Group products by brand
  const productsByBrand = products.reduce((acc, product) => {
    if (!acc[product.brand]) {
      acc[product.brand] = [];
    }
    acc[product.brand].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  // Get unique flavors for the category
  const uniqueFlavors = [...new Set(products.map(p => p.flavor))];

  const getBrandImage = (brandName: string) => {
    const brand = brands.find(b => b.name === brandName);
    return brand?.image || 'https://images.unsplash.com/photo-1601113329251-0aebe217bdbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNjbGUlMjBibGF6ZSUyMHN1cHBsZW1lbnQlMjBwcm90ZWlufGVufDF8fHx8MTc1ODI1OTQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
  };

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="text-center py-8 text-sm sm:text-base">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mb-3 sm:mb-4 text-sm h-9"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Back
        </Button>
        
        <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl">{categoryName}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Browse all {categoryName.toLowerCase()} products by brand and flavor.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{products.length}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{Object.keys(productsByBrand).length}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Different</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Flavors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{uniqueFlavors.length}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Options</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{products.reduce((sum, p) => sum + p.quantity, 0)}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">Units</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Flavors */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader className="p-4 sm:p-5 md:p-6">
          <CardTitle className="text-base sm:text-lg">Available Flavors</CardTitle>
          <CardDescription className="text-xs sm:text-sm">All flavor options in this category</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-wrap gap-2">
            {uniqueFlavors.map((flavor) => (
              <Badge key={flavor} variant="secondary" className="text-xs">
                {flavor}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products by Brand */}
      <div className="space-y-6 sm:space-y-8">
        {Object.entries(productsByBrand).map(([brandName, brandProducts]) => (
          <Card key={brandName}>
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <ImageWithFallback
                    src={getBrandImage(brandName)}
                    alt={brandName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg truncate">{brandName}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {brandProducts.length} product{brandProducts.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {brandProducts.map((product) => {
                  const isExpanded = expandedProducts[product.id] || false;
                  const availableUnits = product.units?.filter(u => u.status === 'available') || [];
                  const soldUnits = product.units?.filter(u => u.status === 'sold') || [];
                  
                  return (
                    <Card key={product.id} className="p-3 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm sm:text-base truncate">{product.name}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">{product.weight}</p>
                          </div>
                          <Badge variant={product.quantity > 10 ? "secondary" : product.quantity > 5 ? "default" : "destructive"} className="text-xs flex-shrink-0">
                            {product.quantity}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-muted-foreground">Flavor:</span> {product.flavor}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price:</span> ₹{product.price.toLocaleString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost:</span> ₹{product.costPrice.toLocaleString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Profit:</span> 
                            <span className={product.price - product.costPrice >= 0 ? "text-green-600" : "text-red-600"}>
                              {" "}₹{(product.price - product.costPrice).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Individual Units Section - Collapsible */}
                        {product.units && product.units.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <div 
                              className="flex items-center justify-between mb-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors border border-transparent hover:border-gray-200"
                              onClick={() => {
                                console.log('Toggling product:', product.id, 'Current state:', isExpanded);
                                toggleProductExpand(product.id);
                              }}
                            >
                              <h5 className="font-semibold text-sm">Individual Units:</h5>
                              <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-700" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-700" />
                                )}
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="space-y-4">
                                {/* Available Units */}
                                {availableUnits.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {availableUnits.map((unit: any) => (
                                      <div key={unit._id} className="border rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded font-semibold">
                                            {unit.serialNumber}
                                          </span>
                                          <Badge variant="default" className="text-xs">
                                            {unit.status}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          <div>Expires: {new Date(unit.expiryDate).toLocaleDateString()}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Sold Units */}
                                {soldUnits.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {soldUnits.map((unit: any) => (
                                      <div key={unit._id} className="border rounded-lg p-3 space-y-2 bg-muted/50">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-mono bg-background px-2 py-1 rounded font-semibold">
                                            {unit.serialNumber}
                                          </span>
                                          <Badge variant="secondary" className="text-xs">
                                            {unit.status}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          <div>Expires: {new Date(unit.expiryDate).toLocaleDateString()}</div>
                                          {unit.soldDate && (
                                            <div>Sold: {new Date(unit.soldDate).toLocaleDateString()}</div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No products available in this category yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}