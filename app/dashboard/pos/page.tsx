"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, ShoppingCart, Package, DollarSign, TrendingUp, Barcode, Receipt, AlertTriangle } from "lucide-react"
import { POSInterface } from "@/components/pos/pos-interface"
import { ProductGrid } from "@/components/pos/product-grid"
import { SalesHistoryCard } from "@/components/pos/sales-history-card"
import { QuickActionsCard } from "@/components/pos/quick-actions-card"
import type { Product, Sale } from "@/types/gym"

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cart, setCart] = useState<Array<Product & { quantity: number }>>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem("gym_products") || "[]")
    const savedSales = JSON.parse(localStorage.getItem("gym_sales") || "[]")

    if (savedProducts.length === 0) {
      // Initialize with sample data
      const sampleProducts: Product[] = [
        {
          id: "1",
          name: "Whey Protein Powder",
          category: "supplements",
          price: 49.99,
          cost: 25.0,
          stock: 45,
          minStock: 10,
          sku: "WPP001",
          description: "Premium whey protein for muscle building",
          supplier: "NutriCorp",
          status: "active",
          image: "/placeholder.svg?height=100&width=100",
        },
        {
          id: "2",
          name: "Gym T-Shirt",
          category: "apparel",
          price: 24.99,
          cost: 12.0,
          stock: 8,
          minStock: 15,
          sku: "GTS001",
          description: "Comfortable cotton gym t-shirt",
          supplier: "FitWear",
          status: "low_stock",
          image: "/placeholder.svg?height=100&width=100",
        },
        {
          id: "3",
          name: "Water Bottle",
          category: "accessories",
          price: 12.99,
          cost: 6.0,
          stock: 120,
          minStock: 20,
          sku: "WB001",
          description: "BPA-free sports water bottle",
          supplier: "HydroGear",
          status: "active",
          image: "/placeholder.svg?height=100&width=100",
        },
        {
          id: "4",
          name: "Pre-Workout",
          category: "supplements",
          price: 34.99,
          cost: 18.0,
          stock: 2,
          minStock: 5,
          sku: "PWO001",
          description: "Energy boosting pre-workout supplement",
          supplier: "NutriCorp",
          status: "low_stock",
          image: "/placeholder.svg?height=100&width=100",
        },
      ]
      setProducts(sampleProducts)
      localStorage.setItem("gym_products", JSON.stringify(sampleProducts))
    } else {
      setProducts(savedProducts)
    }

    setSales(savedSales)
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id)
    if (existingItem) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map((item) => (item.id === productId ? { ...item, quantity } : item)))
    }
  }

  const completeSale = (paymentMethod: string, customerInfo?: any) => {
    const sale: Sale = {
      id: Date.now().toString(),
      items: cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentMethod,
      customerInfo,
      timestamp: new Date().toISOString(),
      cashier: "Current User",
    }

    const updatedSales = [sale, ...sales]
    setSales(updatedSales)
    localStorage.setItem("gym_sales", JSON.stringify(updatedSales))

    // Update product stock
    const updatedProducts = products.map((product) => {
      const cartItem = cart.find((item) => item.id === product.id)
      if (cartItem) {
        const newStock = product.stock - cartItem.quantity
        return {
          ...product,
          stock: newStock,
          status: newStock <= product.minStock ? ("low_stock" as const) : product.status,
        }
      }
      return product
    })
    setProducts(updatedProducts)
    localStorage.setItem("gym_products", JSON.stringify(updatedProducts))

    // Clear cart
    setCart([])
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const todaySales = sales.filter((sale) => sale.timestamp.startsWith(new Date().toISOString().split("T")[0]))
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const lowStockItems = products.filter((p) => p.stock <= p.minStock).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600">Process sales and manage inventory</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            <ShoppingCart className="h-4 w-4 mr-1" />
            {cart.length} items in cart
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">{todaySales.length}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-600">+15%</span>
                  <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${todayRevenue.toFixed(2)}</p>
                <div className="flex items-center mt-2">
                  <DollarSign className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-gray-500">Total earnings</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <div className="flex items-center mt-2">
                  <Package className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-gray-500">In inventory</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-gray-500">Need restock</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products or scan barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="supplements">Supplements</option>
                  <option value="apparel">Apparel</option>
                  <option value="accessories">Accessories</option>
                  <option value="equipment">Equipment</option>
                </select>
                <Button variant="outline">
                  <Barcode className="mr-2 h-4 w-4" />
                  Scan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
        </div>

        {/* POS Interface */}
        <div className="space-y-6">
          <POSInterface
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onCompleteSale={completeSale}
            total={cartTotal}
          />

          <QuickActionsCard />
        </div>
      </div>

      {/* Sales History */}
      <SalesHistoryCard sales={sales.slice(0, 10)} />
    </div>
  )
}
