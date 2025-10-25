import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { DatePicker } from "./ui/date-picker";
import { Plus, Eye, ArrowUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ordersApi, productsApi } from "../services/api";
import { Order, SupplementProduct } from "../types";
import { getErrorMessage } from "../utils/errorHandler";

interface SelectedOrderProduct {
  productId: string;
  unitId: string;
  serialNumber: string;
  expiryDate: string;
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<SupplementProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [fulfillingOrderId, setFulfillingOrderId] = useState<string | null>(null);
  
  const [selectedProducts, setSelectedProducts] = useState<SelectedOrderProduct[]>([]);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    soldBy: "",
    orderDate: new Date(),
    discount: "",
    notes: ""
  });

  // State for sorting and filtering
  const [sortField, setSortField] = useState<string>('orderDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [soldByFilter, setSoldByFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load products'));
    }
  };

  // Get unique sold by names for filter
  const uniqueSoldBy = [...new Set(orders.map(order => order.soldBy))];

  // Filter and sort orders
  const getFilteredAndSortedOrders = () => {
    let filteredOrders = orders;

    // Apply filters
    if (statusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }

    if (soldByFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.soldBy === soldByFilter);
    }

    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm)
      );
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      let valueA: any = a[sortField as keyof typeof a];
      let valueB: any = b[sortField as keyof typeof b];

      // Handle special cases
      if (sortField === 'orderDate') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else if (sortField === 'finalAmount') {
        valueA = Number(valueA);
        valueB = Number(valueB);
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredOrders;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const fulfilledOrders = orders.filter(order => order.status === 'fulfilled');

  const handleAddProduct = () => {
    setSelectedProducts([...selectedProducts, { productId: "", unitId: "", serialNumber: "", expiryDate: "" }]);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], productId, unitId: "", serialNumber: "", expiryDate: "" };
    setSelectedProducts(updated);
  };

  const handleUnitChange = (index: number, unitId: string) => {
    const product = products.find(p => p.id === selectedProducts[index].productId);
    if (product && product.units) {
      const unit = product.units.find(u => u._id === unitId);
      if (unit) {
        const updated = [...selectedProducts];
        updated[index] = { 
          ...updated[index], 
          unitId: unit._id || "", 
          serialNumber: unit.serialNumber,
          expiryDate: unit.expiryDate
        };
        setSelectedProducts(updated);
      }
    }
  };

  const getAvailableUnits = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.units) return [];
    return product.units.filter(unit => unit.status === 'available');
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product && item.unitId ? product.price : 0);
    }, 0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }
    
    // Validate all products have units selected
    const hasEmptyUnits = selectedProducts.some(item => !item.unitId);
    if (hasEmptyUnits) {
      toast.error("Please select a unit for all products");
      return;
    }
    
    if (!orderForm.soldBy) {
      toast.error("Please specify who sold this order");
      return;
    }
    
    setSubmittingOrder(true);
    try {
      // Format products for API (include unitIds)
      const orderProducts = selectedProducts.map(item => ({
        productId: item.productId,
        unitId: item.unitId,
        quantity: 1 // Each unit is quantity 1
      }));
      
      await ordersApi.create({
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        customerEmail: orderForm.customerEmail,
        products: orderProducts,
        discountAmount: parseInt(orderForm.discount) || 0,
        soldBy: orderForm.soldBy,
        orderDate: orderForm.orderDate.toISOString(),
        notes: orderForm.notes
      });

      toast.success("Order created successfully! Stock updated.");
      
      // Reset form
      setOrderForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        soldBy: "",
        orderDate: new Date(),
        discount: "",
        notes: ""
      });
      setSelectedProducts([]);
      
      // Reload orders and products to reflect updated stock
      await Promise.all([loadOrders(), loadProducts()]);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to create order'));
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleMarkFulfilled = async (orderId: string) => {
    setFulfillingOrderId(orderId);
    try {
      await ordersApi.update(orderId, { status: 'fulfilled' });
      toast.success("Order marked as fulfilled!");
      loadOrders();
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to update order'));
    } finally {
      setFulfillingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'pending' ? 'default' : 'secondary';
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="text-center py-8 text-sm sm:text-base">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl">Orders Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage customer orders and track sales transactions.
        </p>
      </div>

      <Tabs defaultValue="all-orders" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="all-orders" className="text-xs sm:text-sm px-2 sm:px-3 py-2">All Orders</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Pending<span className="hidden sm:inline"> ({pendingOrders.length})</span></TabsTrigger>
          <TabsTrigger value="fulfilled" className="text-xs sm:text-sm px-2 sm:px-3 py-2">Fulfilled<span className="hidden sm:inline"> ({fulfilledOrders.length})</span></TabsTrigger>
          <TabsTrigger value="new-order" className="text-xs sm:text-sm px-2 sm:px-3 py-2 col-span-2 sm:col-span-1">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="all-orders">
          <Card>
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <CardTitle className="text-lg sm:text-xl">All Orders</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Complete list of all customer orders</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              {/* Filters and Search */}
              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, ID, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[130px] text-xs sm:text-sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={soldByFilter} onValueChange={setSoldByFilter}>
                      <SelectTrigger className="w-full sm:w-[130px] text-xs sm:text-sm">
                        <SelectValue placeholder="Seller" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sellers</SelectItem>
                        {uniqueSoldBy.map((seller) => (
                          <SelectItem key={seller} value={seller}>{seller}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {getFilteredAndSortedOrders().map((order) => (
                  <Card key={order.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        </div>
                        <Badge variant={getStatusColor(order.status)} className="text-xs flex-shrink-0">
                          {order.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">ID:</span> {order.id}</div>
                        <div><span className="text-muted-foreground">Items:</span> {order.products.length}</div>
                        <div><span className="text-muted-foreground">Date:</span> {new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div><span className="text-muted-foreground">Amount:</span> ₹{order.finalAmount.toLocaleString()}</div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <Badge variant="outline" className="text-xs">{order.soldBy}</Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs h-8">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="break-all text-sm sm:text-base">Order Details - {order.id}</DialogTitle>
                              <DialogDescription className="text-xs sm:text-sm">Complete order information</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 sm:space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-1.5 sm:space-y-2">
                                  <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Customer Information</h4>
                                  <p className="break-words text-xs sm:text-sm"><strong>Name:</strong> {order.customerName}</p>
                                  <p className="break-words text-xs sm:text-sm"><strong>Phone:</strong> {order.customerPhone}</p>
                                  <p className="break-all text-xs sm:text-sm"><strong>Email:</strong> {order.customerEmail}</p>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                  <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Order Information</h4>
                                  <p className="text-xs sm:text-sm"><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                                  <p className="text-xs sm:text-sm"><strong>Status:</strong> <Badge variant={getStatusColor(order.status)} className="text-xs">{order.status}</Badge></p>
                                  <p className="text-xs sm:text-sm"><strong>Sold By:</strong> <Badge variant="outline" className="text-xs">{order.soldBy}</Badge></p>
                                  <p className="break-words text-xs sm:text-sm"><strong>Notes:</strong> {order.notes || 'None'}</p>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <h4 className="font-medium mb-2 text-sm sm:text-base">Products</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs">Product</TableHead>
                                      <TableHead className="text-xs">Quantity</TableHead>
                                      <TableHead className="text-xs">Price</TableHead>
                                      <TableHead className="text-xs">Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {order.products.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="max-w-[150px] sm:max-w-[200px] break-words text-xs sm:text-sm">{item.productName}</TableCell>
                                        <TableCell className="text-xs sm:text-sm">{item.quantity}</TableCell>
                                        <TableCell className="text-xs sm:text-sm">₹{item.price}</TableCell>
                                        <TableCell className="text-xs sm:text-sm">₹{item.price * item.quantity}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="text-right space-y-1 text-xs sm:text-sm">
                                <p><strong>Subtotal:</strong> ₹{order.totalAmount.toLocaleString()}</p>
                                <p><strong>Discount:</strong> -₹{order.discountAmount.toLocaleString()}</p>
                                <p className="text-base sm:text-lg"><strong>Final Amount:</strong> ₹{order.finalAmount.toLocaleString()}</p>
                              </div>
                              {order.status === 'pending' && (
                                <Button 
                                  onClick={() => handleMarkFulfilled(order.id)} 
                                  className="w-full text-sm"
                                  disabled={fulfillingOrderId === order.id}
                                >
                                  {fulfillingOrderId === order.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Marking as Fulfilled...
                                    </>
                                  ) : (
                                    'Mark as Fulfilled'
                                  )}
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('id')} className="h-auto p-0 font-medium">
                        Order ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('customerName')} className="h-auto p-0 font-medium">
                        Customer
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('orderDate')} className="h-auto p-0 font-medium">
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('finalAmount')} className="h-auto p-0 font-medium">
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('soldBy')} className="h-auto p-0 font-medium">
                        Sold By
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAndSortedOrders().map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>{order.products.length} items</TableCell>
                      <TableCell>₹{order.finalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.soldBy}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="break-all">Order Details - {order.id}</DialogTitle>
                              <DialogDescription>Complete order information</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <h4 className="font-medium mb-3">Customer Information</h4>
                                  <p className="break-words"><strong>Name:</strong> {order.customerName}</p>
                                  <p className="break-words"><strong>Phone:</strong> {order.customerPhone}</p>
                                  <p className="break-all"><strong>Email:</strong> {order.customerEmail}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium mb-3">Order Information</h4>
                                  <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                                  <p><strong>Status:</strong> <Badge variant={getStatusColor(order.status)}>{order.status}</Badge></p>
                                  <p><strong>Sold By:</strong> <Badge variant="outline">{order.soldBy}</Badge></p>
                                  <p className="break-words"><strong>Notes:</strong> {order.notes || 'None'}</p>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <h4 className="font-medium mb-2">Products</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>Price</TableHead>
                                      <TableHead>Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {order.products.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="max-w-[200px] break-words">{item.productName}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>₹{item.price}</TableCell>
                                        <TableCell>₹{item.price * item.quantity}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="text-right space-y-1">
                                <p><strong>Subtotal:</strong> ₹{order.totalAmount.toLocaleString()}</p>
                                <p><strong>Discount:</strong> -₹{order.discountAmount.toLocaleString()}</p>
                                <p className="text-lg"><strong>Final Amount:</strong> ₹{order.finalAmount.toLocaleString()}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <CardTitle className="text-lg sm:text-xl">Pending Orders</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Orders that need to be fulfilled</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              {/* Mobile View - Pending Orders */}
              <div className="block md:hidden space-y-3">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        </div>
                        <Badge variant="default" className="text-xs flex-shrink-0">Pending</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">ID:</span> {order.id}</div>
                        <div><span className="text-muted-foreground">Date:</span> {new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Amount:</span> ₹{order.finalAmount.toLocaleString()}</div>
                      </div>
                      <Button 
                        onClick={() => handleMarkFulfilled(order.id)}
                        size="sm"
                        className="w-full text-xs h-8 mt-2"
                        disabled={fulfillingOrderId === order.id}
                      >
                        {fulfillingOrderId === order.id ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Marking...
                          </>
                        ) : (
                          'Mark as Fulfilled'
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
                {pendingOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-xs sm:text-sm">No pending orders</p>
                )}
              </div>
              {/* Desktop View - Pending Orders */}
              <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>₹{order.finalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkFulfilled(order.id)}
                          disabled={fulfillingOrderId === order.id}
                        >
                          {fulfillingOrderId === order.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Fulfilling...
                            </>
                          ) : (
                            'Mark as Fulfilled'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfilled">
          <Card>
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <CardTitle className="text-lg sm:text-xl">Fulfilled Orders</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Completed orders</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              {/* Mobile View - Fulfilled Orders */}
              <div className="block md:hidden space-y-3">
                {fulfilledOrders.map((order) => (
                  <Card key={order.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">Fulfilled</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">ID:</span> {order.id}</div>
                        <div><span className="text-muted-foreground">Date:</span> {new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Amount:</span> ₹{order.finalAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  </Card>
                ))}
                {fulfilledOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-xs sm:text-sm">No fulfilled orders yet</p>
                )}
              </div>
              {/* Desktop View - Fulfilled Orders */}
              <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fulfilledOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>₹{order.finalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-order">
          <Card>
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <CardTitle className="text-lg sm:text-xl">Create New Order</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Add a new customer order with product details</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <form onSubmit={handleSubmitOrder} className="space-y-4 sm:space-y-6">
                {/* Order Details */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-medium text-sm sm:text-base">Order Details</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderDate">Order Date</Label>
                      <DatePicker
                        date={orderForm.orderDate}
                        onDateChange={(date) => setOrderForm({...orderForm, orderDate: date || new Date()})}
                        placeholder="Select order date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="soldBy">Sold By</Label>
                      <Input
                        id="soldBy"
                        value={orderForm.soldBy}
                        onChange={(e) => setOrderForm({...orderForm, soldBy: e.target.value})}
                        placeholder="Salesperson name"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={orderForm.customerName}
                        onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Phone Number</Label>
                      <Input
                        id="customerPhone"
                        value={orderForm.customerPhone}
                        onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={orderForm.customerEmail}
                        onChange={(e) => setOrderForm({...orderForm, customerEmail: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Products</h3>
                    <Button type="button" onClick={handleAddProduct} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                  
                  {selectedProducts.map((item, index) => {
                    const availableUnits = getAvailableUnits(item.productId);
                    const selectedProduct = products.find(p => p.id === item.productId);
                    
                    return (
                      <div key={index} className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label>Product</Label>
                            <Select 
                              value={item.productId} 
                              onValueChange={(value: string) => handleProductChange(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.filter(p => (p.units && p.units.some(u => u.status === 'available'))).map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} - {product.brand} (₹{product.price})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {item.productId && (
                            <div className="space-y-2">
                              <Label>Select Unit (Serial Number - Expiry)</Label>
                              <Select 
                                value={item.unitId} 
                                onValueChange={(value: string) => handleUnitChange(index, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableUnits.map((unit) => (
                                    <SelectItem key={unit._id} value={unit._id || ''}>
                                      <div className="flex flex-col">
                                        <span className="font-mono font-semibold">{unit.serialNumber}</span>
                                        <span className="text-xs text-muted-foreground">
                                          Expires: {new Date(unit.expiryDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {availableUnits.length === 0 && (
                                <p className="text-xs text-red-500">No units available for this product</p>
                              )}
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <div className="pt-2">
                              <p className="text-lg font-semibold">
                                {item.unitId && selectedProduct ? `₹${selectedProduct.price}` : '-'}
                              </p>
                              {item.serialNumber && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {item.serialNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveProduct(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="font-medium">Order Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount Amount (₹)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        value={orderForm.discount}
                        onChange={(e) => setOrderForm({...orderForm, discount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Amount</Label>
                      <div className="pt-2">
                        <p>Subtotal: ₹{calculateTotal().toLocaleString()}</p>
                        <p>Discount: -₹{orderForm.discount || 0}</p>
                        <p className="font-medium">Final: ₹{(calculateTotal() - (parseInt(orderForm.discount) || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                      placeholder="Any additional notes about the order..."
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submittingOrder}>
                  {submittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    'Create Order'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
