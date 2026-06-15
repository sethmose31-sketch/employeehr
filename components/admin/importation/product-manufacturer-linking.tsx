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
import { AlertCircle, Link2, Unlink2 } from "lucide-react"
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
        Array.isArray(productsData) ? productsData : productsData.data || []
      )
      setSources(
        Array.isArray(sourcesData) ? sourcesData : sourcesData.data || []
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
          "Authorization": `Bearer ${token}`,
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
        toast.error(data.error || "Failed to link product")
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
          "Authorization": `Bearer ${token}`,
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
      setLinkedProducts(Array.isArray(data) ? data : data.data || [])
      setLinkedDialogOpen(true)
    } catch (error) {
      console.error("Error fetching linked products:", error)
      toast.error("Failed to fetch linked products")
    }
  }

  const selectedManufacturerData = sources.find(
    (s) => s._id === selectedManufacturer
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Link Products to Manufacturers</CardTitle>
          <CardDescription>
            Select a product and manufacturer to create a link between them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Loading...</p>
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
                      {sources
                        .filter((s) => s.sourceType === "MANUFACTURER")
                        .map((source) => (
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
                      backgroundColor: branding?.primaryColor || "#2563eb",
                    }}
                    className="w-full text-white"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Link Product
                  </Button>
                </div>
              </div>

              {/* View Linked Products Button */}
              {selectedManufacturer && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchLinkedProducts(selectedManufacturer)}
                    className="w-full"
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
                <Card key={product._id}>
                  <CardContent className="flex items-center justify-between pt-4">
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            1. Select a product from the "Select Product" dropdown
          </p>
          <p>
            2. Choose a manufacturer from the "Select Manufacturer" dropdown
          </p>
          <p>
            3. Click "Link Product" to create the association
          </p>
          <p>
            4. Use "View Linked Products" to see all products linked to a manufacturer
          </p>
          <p>
            5. Click "Unlink" to remove the association between a product and manufacturer
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
