"use client"

import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
import API_URL from "@/lib/apiBase"
import { parseResponse } from "@/lib/fetchUtils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Link2, Unlink2, Info } from "lucide-react"
import { toast } from "sonner"

interface Product {
  _id: string
  name: string
  category?: string
  startingPrice: number
  sellingPrice: number
}

interface Source {
  _id: string
  companyName: string
  sourceType: "MANUFACTURER" | "SUPPLIER"
  linkedProducts?: string[]
}

interface ProductManufacturerLinkingProps {
  branding?: any
  refreshTrigger: number
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(15, 118, 110, ${alpha})`
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function ProductManufacturerLinking({
  branding,
  refreshTrigger,
}: ProductManufacturerLinkingProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("")
  const [linkedDialogOpen, setLinkedDialogOpen] = useState(false)
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([])

  const token = getToken()
  const primaryColor = branding?.primaryColor || "#0f766e"
  const primarySoftColor = hexToRgba(primaryColor, 0.08)

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, sourcesRes] = await Promise.all([
        fetch(`${API_URL}/stock/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/importation/sources`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const productsData = await parseResponse(productsRes)
      const sourcesData = await parseResponse(sourcesRes)

      setProducts(
        Array.isArray(productsData) ? productsData : (productsData?.data || [])
      )
      setSources(
        Array.isArray(sourcesData) ? sourcesData : (sourcesData?.data || [])
      )
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleLinkProduct = async () => {
    if (!selectedProduct || !selectedManufacturer) {
      toast.error("Please select both product and manufacturer")
      return
    }

    try {
      const response = await fetch(`${API_URL}/importation/link-product`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          manufacturerId: selectedManufacturer,
        }),
      })

      const data = await parseResponse(response)
      if (response.ok) {
        toast.success("Product linked to manufacturer successfully")
        setSelectedProduct("")
        setSelectedManufacturer("")
        fetchData()
      } else {
        toast.error(data?.error || "Failed to link product")
      }
    } catch (error) {
      console.error("Error linking product:", error)
      toast.error("An error occurred while linking")
    }
  }

  const handleUnlinkProduct = async (productId: string) => {
    if (!selectedManufacturer) return

    try {
      const response = await fetch(`${API_URL}/importation/unlink-product`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          manufacturerId: selectedManufacturer,
        }),
      })

      if (response.ok) {
        toast.success("Product unlinked successfully")
        fetchData()
        if (selectedManufacturer) {
          fetchLinkedProducts(selectedManufacturer)
        }
      } else {
        toast.error("Failed to unlink product")
      }
    } catch (error) {
      console.error("Error unlinking product:", error)
      toast.error("An error occurred while unlinking")
    }
  }

  const fetchLinkedProducts = async (manufacturerId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/importation/sources/${manufacturerId}/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await parseResponse(response)
      setLinkedProducts(Array.isArray(data) ? data : (data?.data || []))
      setLinkedDialogOpen(true)
    } catch (error) {
      console.error("Error fetching linked products:", error)
      toast.error("Failed to fetch linked products")
    }
  }

  const selectedManufacturerData = sources.find(
    (s) => s._id === selectedManufacturer
  )
  const manufacturersOnly = sources.filter((s) => s.sourceType === "MANUFACTURER")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader style={{ backgroundColor: primarySoftColor }}>
          <CardTitle>Link Products to Manufacturers</CardTitle>
          <CardDescription>
            Select a product and manufacturer to create a link between them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : manufacturersOnly.length === 0 ? (
            <div style={{ backgroundColor: primarySoftColor }} className="p-4 rounded-lg border border-current">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                <p className="text-sm">No manufacturers created yet. Please create a manufacturer in the Source Management tab first.</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div style={{ backgroundColor: primarySoftColor }} className="p-4 rounded-lg border border-current">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                <p className="text-sm">No products available. Please create products in the Inventory Manager first.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Product Select */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Product
                  </label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Manufacturer Select */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Manufacturer
                  </label>
                  <Select
                    value={selectedManufacturer}
                    onValueChange={setSelectedManufacturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a manufacturer..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {manufacturersOnly.map((source) => (
                        <SelectItem key={source._id} value={source._id}>
                          {source.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Link Button */}
                <div className="flex items-end">
                  <Button
                    onClick={handleLinkProduct}
                    style={{
                      backgroundColor: primaryColor,
                    }}
                    className="w-full text-white hover:opacity-90"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Link Product
                  </Button>
                </div>
              </div>

              {/* View Linked Products Button */}
              {selectedManufacturer && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => fetchLinkedProducts(selectedManufacturer)}
                    className="w-full"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    View Linked Products for {selectedManufacturerData?.companyName}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Linked Products Dialog */}
      <Dialog open={linkedDialogOpen} onOpenChange={setLinkedDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Linked Products</DialogTitle>
            <DialogDescription>
              Products linked to {selectedManufacturerData?.companyName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {linkedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No products linked yet</p>
              </div>
            ) : (
              linkedProducts.map((product) => (
                <Card key={product._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        Category: {product.category || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: ${product.sellingPrice.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnlinkProduct(product._id)}
                      className="flex-shrink-0"
                    >
                      <Unlink2 className="w-4 h-4 mr-2" />
                      Unlink
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Section */}
      <Card style={{ backgroundColor: primarySoftColor }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-5 h-5" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">1. Select a product:</span> Choose from the "Select Product" dropdown
          </p>
          <p>
            <span className="font-medium">2. Choose a manufacturer:</span> Pick a manufacturer from the "Select Manufacturer" dropdown
          </p>
          <p>
            <span className="font-medium">3. Link the product:</span> Click "Link Product" to create the association
          </p>
          <p>
            <span className="font-medium">4. View linked products:</span> Use "View Linked Products" to see all products linked to a manufacturer
          </p>
          <p>
            <span className="font-medium">5. Unlink if needed:</span> Click "Unlink" to remove the association between a product and manufacturer
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
