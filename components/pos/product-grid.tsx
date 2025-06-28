"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Package, AlertTriangle } from "lucide-react"
import type { Product } from "@/types/gym"

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "supplements":
        return "bg-blue-100 text-blue-800"
      case "apparel":
        return "bg-purple-100 text-purple-800"
      case "accessories":
        return "bg-green-100 text-green-800"
      case "equipment":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "low_stock":
        return "bg-yellow-100 text-yellow-800"
      case "out_of_stock":
        return "bg-red-100 text-red-800"
      case "discontinued":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm line-clamp-2 flex-1">{product.name}</h3>
                {product.status === "low_stock" && (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(product.category)} variant="secondary">
                  {product.category}
                </Badge>
                <Badge className={getStatusColor(product.status)} variant="secondary">
                  {product.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="text-xs text-gray-500">
                <p>SKU: {product.sku}</p>
                <p>Stock: {product.stock} units</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Cost: ${product.cost.toFixed(2)}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAddToCart(product)}
                  disabled={product.status === "out_of_stock"}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
