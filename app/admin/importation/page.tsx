"use client"

import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
import API_URL from "@/lib/apiBase"
import { parseResponse } from "@/lib/fetchUtils"
import ImportationManager from "@/components/admin/importation/importation-manager"

export default function ImportationPage() {
  const [branding, setBranding] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const token = getToken()
        const response = await fetch(`${API_URL}/company/branding`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await parseResponse(response)
        if (data?.success) {
          setBranding(data.data)
        } else if (data?.data) {
          setBranding(data.data)
        }
      } catch (error) {
        console.error("Error fetching branding:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBranding()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: branding?.primaryColor || "#0f766e" }}>
          Importation Management
        </h1>
        <p className="text-gray-600">Manage manufacturers, suppliers, and product sourcing</p>
      </div>

      <ImportationManager branding={branding} />
    </div>
  )
}
