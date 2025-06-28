"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, DollarSign, Receipt, User } from "lucide-react"
import type { Product } from "@/types/gym"

interface CartItem extends Product {
  quantity: number
}

interface POSInterfaceProps {
  cart: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onCompleteSale: (paymentMethod: string, customerInfo?: any) => void
  total: number
}

export function POSInterface({ cart, onUpdateQuantity, onRemoveItem, onCompleteSale, total }: POSInterfaceProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [cashReceived, setCashReceived] = useState("")

  const handleCompleteSale = () => {
    onCompleteSale(paymentMethod, customerInfo)
    setIsCheckoutOpen(false)
    setCustomerInfo({ name: "", email: "", phone: "", notes: "" })
    setCashReceived("")
  }

  const change = paymentMethod === "cash" && cashReceived ? Number.parseFloat(cashReceived) - total : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Shopping Cart
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Cart is empty</p>
            <p className="text-sm">Add products to start a sale</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-8 w-8 p-0 ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (8.5%):</span>
                <span>${(total * 0.085).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${(total * 1.085).toFixed(2)}</span>
              </div>
            </div>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <Receipt className="mr-2 h-4 w-4" />
                  Checkout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Complete Sale</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Customer Information */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Customer Information (Optional)
                    </Label>
                    <Input
                      placeholder="Customer name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    />
                    <Input
                      placeholder="Phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    />
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={paymentMethod === "cash" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("cash")}
                        className="flex items-center justify-center"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Cash
                      </Button>
                      <Button
                        variant={paymentMethod === "card" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("card")}
                        className="flex items-center justify-center"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Card
                      </Button>
                    </div>
                  </div>

                  {paymentMethod === "cash" && (
                    <div className="space-y-2">
                      <Label htmlFor="cash-received">Cash Received</Label>
                      <Input
                        id="cash-received"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                      />
                      {cashReceived && (
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>${(total * 1.085).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cash Received:</span>
                            <span>${Number.parseFloat(cashReceived).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Change:</span>
                            <span className={change < 0 ? "text-red-600" : "text-green-600"}>${change.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes for this sale..."
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span>${(total * 1.085).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteSale}
                    className="w-full"
                    size="lg"
                    disabled={paymentMethod === "cash" && (!cashReceived || change < 0)}
                  >
                    Complete Sale
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  )
}
