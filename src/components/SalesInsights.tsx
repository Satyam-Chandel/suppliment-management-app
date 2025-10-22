import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";
import { analyticsApi } from "../services/api";
import { toast } from "sonner";
import { SalesData } from "../types";
import moment from "moment";
import { getErrorMessage } from "../utils/errorHandler";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function SalesInsights() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [allTimeSalesData, setAllTimeSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const currentMonth = moment().format('YYYY-MM');
      
      // Fetch current month sales
      const monthData = await analyticsApi.getSales({ period: 'month', value: currentMonth });
      setSalesData(monthData);
      
      // Fetch all-time sales (no period filter)
      const allTimeData = await analyticsApi.getSales({});
      setAllTimeSalesData(allTimeData);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to load sales data'));
    } finally {
      setLoading(false);
    }
  };

  const totalProductsSold = salesData.reduce((sum, item) => sum + item.quantitySold, 0);
  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const allTimeRevenue = allTimeSalesData.reduce((sum, item) => sum + item.revenue, 0);
  const mostSoldProduct = salesData.length > 0 
    ? salesData.reduce((max, item) => item.quantitySold > max.quantitySold ? item : max)
    : null;

  const chartData = salesData.map(item => ({
    name: item.productName.split(' ').slice(0, 2).join(' '),
    quantity: item.quantitySold,
    revenue: item.revenue
  }));

  const pieData = salesData.map(item => ({
    name: item.productName.split(' ').slice(0, 2).join(' '),
    value: item.quantitySold
  }));

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="text-center py-8 text-sm sm:text-base">Loading sales data...</div>
      </div>
    );
  }

  if (salesData.length === 0) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl">Sales Insights</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comprehensive analytics and insights into your supplement sales performance.
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">
              No sales data available for this month. Start creating orders to see insights!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl">Sales Insights</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Comprehensive analytics and insights into your supplement sales performance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Products Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{totalProductsSold}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">{moment().format('MMMM YYYY')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm">Total Revenue Till Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">₹{allTimeRevenue.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs sm:text-sm">All time</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Most Sold Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{mostSoldProduct ? mostSoldProduct.productName.split(' ').slice(0, 2).join(' ') : 'N/A'}</div>
            <p className="text-muted-foreground text-sm">{mostSoldProduct ? `${mostSoldProduct.quantitySold} units sold` : 'No sales data'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">₹{totalProductsSold > 0 ? Math.round(totalRevenue / totalProductsSold).toLocaleString() : '0'}</div>
            <p className="text-muted-foreground text-sm">Per product</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <CardTitle className="text-base sm:text-lg">Sales by Product</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Number of units sold this month</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <CardTitle className="text-base sm:text-lg">Revenue by Product</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Revenue distribution this month</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <CardTitle className="text-base sm:text-lg">Sales Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Quantity sold by product</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '10px' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <CardTitle className="text-base sm:text-lg">Top Selling Products</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Ranked by quantity sold</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {salesData
                .sort((a, b) => b.quantitySold - a.quantitySold)
                .map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{product.productName}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {product.quantitySold} units • ₹{product.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}