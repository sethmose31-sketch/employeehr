"use client"

import { useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
import API_URL from "@/lib/apiBase"
import { parseResponse } from "@/lib/fetchUtils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ImportationSource {
  _id: string
  sourceType: "MANUFACTURER" | "SUPPLIER"
  companyName: string
  location: string
  contactPerson: string
  contactPhone: string
  comments?: string
  createdAt: string
}

interface SourceManagerProps {
  branding?: any
  refreshTrigger: number
  onRefresh: () => void
}

export default function SourceManager({ branding, refreshTrigger, onRefresh }: SourceManagerProps) {
  const [sources, setSources] = useState<ImportationSource[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sourceType, setSourceType] = useState<"MANUFACTURER" | "SUPPLIER">("MANUFACTURER")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    companyName: "",
    location: "",
    contactPerson: "",
    contactPhone: "",
    comments: "",
  })

  const token = getToken()

  const fetchSources = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/importation/sources`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await parseResponse(response)
      if (data.success || Array.isArray(data)) {
        setSources(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error("Error fetching sources:", error)
      toast.error("Failed to load sources")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [refreshTrigger])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName.trim() || !formData.location.trim() || !formData.contactPerson.trim() || !formData.contactPhone.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const url = editingId ? `${API_URL}/importation/sources/${editingId}` : `${API_URL}/importation/sources`
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceType,
          ...formData,
        }),
      })

      const data = await parseResponse(response)
      if (response.ok) {
        toast.success(editingId ? "Source updated successfully" : "Source created successfully")
        setDialogOpen(false)
        resetForm()
        onRefresh()
      } else {
        toast.error(data.error || "Failed to save source")
      }
    } catch (error) {
      console.error("Error saving source:", error)
      toast.error("An error occurred while saving")
    }
  }

  const handleEdit = (source: ImportationSource) => {
    setEditingId(source._id)
    setSourceType(source.sourceType)
    setFormData({
      companyName: source.companyName,
      location: source.location,
      contactPerson: source.contactPerson,
      contactPhone: source.contactPhone,
      comments: source.comments || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source?")) return

    try {
      const response = await fetch(`${API_URL}/importation/sources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success("Source deleted successfully")
        onRefresh()
      } else {
        toast.error("Failed to delete source")
      }
    } catch (error) {
      console.error("Error deleting source:", error)
      toast.error("An error occurred while deleting")
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setSourceType("MANUFACTURER")
    setFormData({
      companyName: "",
      location: "",
      contactPerson: "",
      contactPhone: "",
      comments: "",
    })
  }

  const manufacturerLabel = sourceType === "MANUFACTURER" ? "Country" : "Location"

  return (
    <div className="space-y-6">
      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => resetForm()}
            style={{ backgroundColor: branding?.primaryColor || "#2563eb" }}
            className="text-white hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Source
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Source" : "Add New Source"}</DialogTitle>
            <DialogDescription>
              Create a {sourceType === "MANUFACTURER" ? "manufacturer" : "supplier"} entry for product sourcing
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Source Type Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={sourceType === "MANUFACTURER" ? "default" : "outline"}
                  onClick={() => setSourceType("MANUFACTURER")}
                  style={
                    sourceType === "MANUFACTURER"
                      ? { backgroundColor: branding?.primaryColor || "#2563eb" }
                      : {}
                  }
                  className={sourceType === "MANUFACTURER" ? "text-white" : ""}
                >
                  Manufacturer
                </Button>
                <Button
                  type="button"
                  variant={sourceType === "SUPPLIER" ? "default" : "outline"}
                  onClick={() => setSourceType("SUPPLIER")}
                  style={
                    sourceType === "SUPPLIER"
                      ? { backgroundColor: branding?.primaryColor || "#2563eb" }
                      : {}
                  }
                  className={sourceType === "SUPPLIER" ? "text-white" : ""}
                >
                  Supplier
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Company Name *</label>
                <Input
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">{manufacturerLabel} *</label>
                <Input
                  placeholder={`Enter ${manufacturerLabel.toLowerCase()}`}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contact Person *</label>
                <Input
                  placeholder="Enter contact person name"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contact Phone *</label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Comments</label>
                <Textarea
                  placeholder="Add any additional comments or notes"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: branding?.primaryColor || "#2563eb" }}
                className="text-white"
              >
                {editingId ? "Update Source" : "Create Source"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sources List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sources</h3>
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-gray-600">Loading sources...</p>
            </CardContent>
          </Card>
        ) : sources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600">No sources added yet</p>
              <p className="text-sm text-gray-500">Click "Add New Source" to create one</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((source) => (
              <Card key={source._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{source.companyName}</CardTitle>
                      <CardDescription>
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium text-white mt-1"
                          style={{ backgroundColor: branding?.primaryColor || "#2563eb" }}
                        >
                          {source.sourceType}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(source)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(source._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Location:</span> {source.location}
                  </div>
                  <div>
                    <span className="font-medium">Contact:</span> {source.contactPerson}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {source.contactPhone}
                  </div>
                  {source.comments && (
                    <div>
                      <span className="font-medium">Comments:</span> {source.comments}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
