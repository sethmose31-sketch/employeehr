"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SourceManager from "./source-manager"
import ProductManufacturerLinking from "./product-manufacturer-linking"

interface ImportationManagerProps {
  branding?: any
}

export default function ImportationManager({ branding }: ImportationManagerProps) {
  const [activeTab, setActiveTab] = useState("sources")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sources">Source Management</TabsTrigger>
          <TabsTrigger value="products">Product Linking</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <SourceManager branding={branding} refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductManufacturerLinking branding={branding} refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
