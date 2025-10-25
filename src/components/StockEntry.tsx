import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChevronDown, ChevronRight, Loader2, X, Plus } from "lucide-react";
import { SupplementType, SupplementProduct } from "../types";
import { toast } from "sonner";
import { productsApi, metadataApi } from "../services/api";
import { getErrorMessage } from "../utils/errorHandler";

const supplementTypes: { value: SupplementType; label: string }[] = [
  { value: "whey-protein", label: "Whey Protein" },
  { value: "creatine", label: "Creatine" },
  { value: "peanut-butter", label: "Peanut Butter" },
  { value: "pre-workout", label: "Pre-Workout" },
  { value: "other", label: "Other Supplements" },
];

interface ProductUnit {
  expiryDate: string;
  serialNumber: string;
}

interface StockEntryProps {
  initialTab?: string;
  initialCategory?: string;
  userRole?: string | null;
}

export function StockEntry({ initialTab = "add-stock", initialCategory, userRole }: StockEntryProps = {}) {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    type: "" as SupplementType,
    flavor: "",
    weight: "",
    price: "",
    costPrice: "",
    quantity: "",
    description: "",
  });

  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [products, setProducts] = useState<SupplementProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    initialCategory ? { [initialCategory]: true } : {}
  );
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // New category dialog state
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: "",
    type: "",
    description: "",
    image: ""
  });
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  };

  // Generate product units when quantity changes
  useEffect(() => {
    const qty = parseInt(formData.quantity) || 0;
    if (qty > 0) {
      const units: ProductUnit[] = Array.from({ length: qty }, () => ({
        expiryDate: "",
        serialNumber: ""
      }));
      setProductUnits(units);
    } else {
      setProductUnits([]);
    }
  }, [formData.quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all units have expiry dates and serial numbers
    const hasEmptyExpiry = productUnits.some(unit => !unit.expiryDate);
    if (hasEmptyExpiry) {
      toast.error("Please set expiry date for all product units");
      return;
    }
    
    const hasEmptySerial = productUnits.some(unit => !unit.serialNumber || unit.serialNumber.trim() === '');
    if (hasEmptySerial) {
      toast.error("Please enter serial number for all product units");
      return;
    }
    
    // Check for duplicate serial numbers
    const serialNumbers = productUnits.map(u => u.serialNumber.trim());
    const duplicates = serialNumbers.filter((item, index) => serialNumbers.indexOf(item) !== index);
    if (duplicates.length > 0) {
      toast.error(`Duplicate serial numbers found: ${duplicates.join(', ')}`);
      return;
    }
    
    setSubmitting(true);
    try {
      const productData = {
        name: formData.name,
        brand: formData.brand,
        type: formData.type,
        flavor: formData.flavor,
        weight: formData.weight,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        quantity: parseInt(formData.quantity),
        units: productUnits,
        description: formData.description || undefined
      };

      await productsApi.create(productData);
      toast.success(`Product added with ${productUnits.length} units!`);
      
      // Reset form
      setFormData({
        name: "",
        brand: "",
        type: "" as SupplementType,
        flavor: "",
        weight: "",
        price: "",
        costPrice: "",
        quantity: "",
        description: "",
      });
      setProductUnits([]);
      
      // Reload products
      loadProducts();
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to add product'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUnitExpiryChange = (index: number, expiryDate: string) => {
    setProductUnits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], expiryDate };
      return updated;
    });
  };

  const handleUnitSerialChange = (index: number, serialNumber: string) => {
    setProductUnits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], serialNumber };
      return updated;
    });
  };

  const getProductsByType = (type: SupplementType) => {
    return products.filter(product => 
      product.type === type && 
      product.units && 
      product.units.length > 0
    );
  };

  const toggleCategory = (categoryValue: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryValue]: !prev[categoryValue]
    }));
  };

  const handleDeleteSoldUnit = async (productId: string, unitId: string) => {
    setDeletingUnitId(unitId);
    try {
      await productsApi.deleteUnit(productId, unitId);
      toast.success('Unit removed successfully');
      loadProducts(); // Reload to reflect changes
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to remove unit'));
    } finally {
      setDeletingUnitId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryData.name || !newCategoryData.type) {
      toast.error("Please fill in category name and type");
      return;
    }

    setCreatingCategory(true);
    try {
      await metadataApi.createCategory(newCategoryData);
      toast.success("Category created successfully");
      
      // Close dialog and reset form
      setIsNewCategoryDialogOpen(false);
      setNewCategoryData({
        name: "",
        type: "",
        description: "",
        image: ""
      });
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to create category'));
    } finally {
      setCreatingCategory(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl">Stock Entry</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Add new products to your inventory and manage existing stock.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-stock" className="text-xs sm:text-sm">Add New Stock</TabsTrigger>
          <TabsTrigger value="view-stock" className="text-xs sm:text-sm">View by Category</TabsTrigger>
        </TabsList>

        <TabsContent value="add-stock">
          <Card>
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <CardTitle className="text-lg sm:text-xl">Add New Product</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Enter product details to add to inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., Muscle Blaze Whey Gold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange("brand", e.target.value)}
                      placeholder="e.g., Muscle Blaze"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Supplement Type</Label>
                    <Select value={formData.type} onValueChange={(value: string) => {
                      if (value === "new-category") {
                        setIsNewCategoryDialogOpen(true);
                      } else {
                        handleInputChange("type", value);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplement type" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplementTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="new-category" className="text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span>New Category</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flavor">Flavor</Label>
                    <Input
                      id="flavor"
                      value={formData.flavor}
                      onChange={(e) => handleInputChange("flavor", e.target.value)}
                      placeholder="e.g., Chocolate, Vanilla"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight/Size</Label>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      placeholder="e.g., 2kg, 300g"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price (₹)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange("costPrice", e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description" className="text-sm">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Product description"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Individual Product Units Section */}
                {productUnits.length > 0 && (
                  <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                    <div className="border-t pt-3 sm:pt-4">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                        Individual Product Units ({productUnits.length} units)
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        Enter unique serial number and expiry date for each product unit.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-96 overflow-y-auto p-1 sm:p-2">
                        {productUnits.map((unit, index) => (
                          <Card key={index} className="p-3 sm:p-4">
                            <div className="space-y-2 sm:space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="font-semibold text-sm">Unit #{index + 1}</Label>
                                <Badge variant={unit.serialNumber && unit.expiryDate ? "default" : "outline"} className="text-xs">
                                  {unit.serialNumber && unit.expiryDate ? "Complete" : "Pending"}
                                </Badge>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor={`serial-${index}`} className="text-xs sm:text-sm">Serial Number / Product ID</Label>
                                <Input
                                  id={`serial-${index}`}
                                  type="text"
                                  value={unit.serialNumber}
                                  onChange={(e) => handleUnitSerialChange(index, e.target.value)}
                                  placeholder="e.g., WHE-001"
                                  required
                                  className="w-full font-mono text-sm"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor={`expiry-${index}`} className="text-xs sm:text-sm">Expiry Date</Label>
                                <Input
                                  id={`expiry-${index}`}
                                  type="date"
                                  value={unit.expiryDate}
                                  onChange={(e) => handleUnitExpiryChange(index, e.target.value)}
                                  required
                                  className="w-full text-sm"
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full text-sm sm:text-base h-10 sm:h-11" disabled={productUnits.length === 0 || submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Adding to Stock...</span>
                      <span className="sm:hidden">Adding...</span>
                    </>
                  ) : productUnits.length === 0 ? (
                    <>
                      <span className="hidden sm:inline">Enter quantity to continue</span>
                      <span className="sm:hidden">Enter quantity</span>
                    </>
                  ) : (
                    `Add ${productUnits.length} Unit${productUnits.length > 1 ? 's' : ''} to Stock`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view-stock">
          {loading ? (
            <div className="text-center py-8 text-sm sm:text-base">Loading products...</div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {supplementTypes.map((type) => {
                const typeProducts = getProductsByType(type.value);
                const isOpen = openCategories[type.value] || false;
                
                return (
                  <Card key={type.value}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleCategory(type.value)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 sm:py-4 px-3 sm:px-4 md:px-6">
                          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                              )}
                              <span className="leading-none">{type.label}</span>
                            </div>
                            <Badge variant="secondary" className="ml-2 text-xs">{typeProducts.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
                          {typeProducts.length > 0 ? (
                            <div className="space-y-4 sm:space-y-6">
                              {typeProducts.map((product) => (
                                <Card key={product.id} className="p-3 sm:p-4">
                                  <div className="space-y-3 sm:space-y-4">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-base sm:text-lg truncate">{product.name}</h4>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{product.brand}</p>
                                      </div>
                                      <Badge variant="secondary" className="text-xs flex-shrink-0">{product.quantity} units</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                                      <div className="truncate">
                                        <span className="text-muted-foreground">Flavor:</span> {product.flavor}
                                      </div>
                                      <div className="truncate">
                                        <span className="text-muted-foreground">Weight:</span> {product.weight}
                                      </div>
                                      <div className="truncate">
                                        <span className="text-muted-foreground">Price:</span> ₹{product.price}
                                      </div>
                                      <div className="truncate">
                                        <span className="text-muted-foreground">Cost:</span> ₹{product.costPrice}
                                      </div>
                                    </div>
                                    
                                    {/* Individual Units */}
                                    {product.units && product.units.length > 0 && (
                                      <div className="mt-3 sm:mt-4 border-t pt-3 sm:pt-4">
                                        <h5 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm">Individual Units:</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                          {product.units.map((unit: any, idx: number) => (
                                            <div key={unit._id || idx} className="border rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2 relative">
                                              {/* Delete button - only visible to admin users */}
                                              {userRole === 'admin' && (
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-destructive hover:text-white"
                                                  onClick={() => handleDeleteSoldUnit(product.id, unit._id)}
                                                  disabled={deletingUnitId === unit._id}
                                                  aria-label="Delete unit"
                                                >
                                                  {deletingUnitId === unit._id ? (
                                                    <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
                                                  ) : (
                                                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                  )}
                                                </Button>
                                              )}
                                              <div className="flex items-center justify-between pr-5 sm:pr-6 gap-1">
                                                <span className="text-[10px] sm:text-xs font-mono bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate">
                                                  {unit.serialNumber}
                                                </span>
                                                <Badge 
                                                  variant={
                                                    unit.status === 'available' ? 'default' :
                                                    unit.status === 'sold' ? 'secondary' :
                                                    unit.status === 'expired' ? 'destructive' : 'outline'
                                                  }
                                                  className="text-[10px] sm:text-xs flex-shrink-0"
                                                >
                                                  {unit.status}
                                                </Badge>
                                              </div>
                                              <div className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
                                                <div>Exp: {new Date(unit.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</div>
                                                {unit.soldDate && (
                                                  <div>Sold: {new Date(unit.soldDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-6 sm:py-8 text-xs sm:text-sm">
                              No products in this category yet.
                            </p>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Category Dialog */}
      <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new supplement category to organize your products.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={newCategoryData.name}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Mass Gainers"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryType">Category Type (URL-friendly) *</Label>
              <Input
                id="categoryType"
                value={newCategoryData.type}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, type: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="e.g., mass-gainer"
                required
              />
              <p className="text-xs text-muted-foreground">This will be used for product categorization</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description (Optional)</Label>
              <Input
                id="categoryDescription"
                value={newCategoryData.description}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryImage">Image URL (Optional)</Label>
              <Input
                id="categoryImage"
                value={newCategoryData.image}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsNewCategoryDialogOpen(false)}
                disabled={creatingCategory}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingCategory}>
                {creatingCategory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Category'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
