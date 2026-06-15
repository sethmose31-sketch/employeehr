"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SourceManager from "./source-manager"
import ProductManufacturerLinking from "./product-manufacturer-linking"

interface ImportationManagerProps {
  branding?: any
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(15, 118, 110, ${alpha})`
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function ImportationManager({ branding }: ImportationManagerProps) {
  const [activeTab, setActiveTab] = useState("sources")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const primaryColor = branding?.primaryColor || "#0f766e"
  const primarySoftColor = hexToRgba(primaryColor, 0.08)

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2" style={{ backgroundColor: primarySoftColor }}>
          <TabsTrigger 
            value="sources"
            style={activeTab === "sources" ? { backgroundColor: primaryColor, color: "white" } : {}}
          >
            Source Management
          </TabsTrigger>
          <TabsTrigger 
            value="products"
            style={activeTab === "products" ? { backgroundColor: primaryColor, color: "white" } : {}}
          >
            Product Linking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4 mt-6">
          <SourceManager branding={branding} refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-6">
          <ProductManufacturerLinking branding={branding} refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
