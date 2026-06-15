import type { Response } from "express"
import type { AuthenticatedRequest } from "../middleware/auth"
import { ImportationSource } from "../models/ImportationSource"
import { StockProduct } from "../models/StockProduct"

const ADMIN_ROLES = ["company_admin", "hr", "admin", "super_admin"]

function isAdminRole(role?: string) {
  return !!role && ADMIN_ROLES.includes(role)
}

export const importationController = {
  // Get all importation sources for an organization
  async getAllSources(req: AuthenticatedRequest, res: Response) {
    try {
      const org_id = req.user?.org_id
      if (!org_id || !isAdminRole(req.user?.role)) {
        return res.status(403).json({ error: "Unauthorized" })
      }

      const sources = await ImportationSource.find({ org_id })
        .sort({ createdAt: -1 })
        .lean()
      
      res.json(sources)
    } catch (error) {
      console.error("[v0] Error fetching importation sources:", error)
      res.status(500).json({ error: "Failed to fetch sources" })
    }
  },

  // Get single importation source
  async getSourceById(req: AuthenticatedRequest, res: Response) {
    try {
      const org_id = req.user?.org_id
      const { id } = req.params

      if (!org_id || !isAdminRole(req.user?.role)) {
        return res.status(403).json({ error: "Unauthorized" })
      }

      const source = await ImportationSource.findOne({ _id: id, org_id })
      if (!source) {
        return res.status(404).json({ error: "Source not found" })
      }

      res.json(source)
    } catch (error) {
      console.error("[v0] Error fetching source:", error)
      res.status(500).json({ error: "Failed to fetch source" })
    }
  },

  // Create new importation source
  async createSource(req: AuthenticatedRequest, res: Response) {
    try {
      const org_id = req.user?.org_id
      const { sourceType, companyName, location, contactPerson, contactPhone, comments } = req.body

      if (!org_id || !isAdminRole(req.user?.role)) {
        return res.status(403).json({ error: "Unauthorized" })
      }

      // Validate required fields
      if (!sourceType || !companyName || !location || !contactPerson || !contactPhone) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (!["MANUFACTURER", "SUPPLIER"].includes(sourceType)) {
        return res.status(400).json({ error: "Invalid source type" })
      }

      const source = new ImportationSource({
        org_id,
        sourceType,
        companyName: companyName.trim(),
        location: location.trim(),
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        comments: comments?.trim() || "",
        createdBy: req.user?.id,
      })

      const savedSource = await source.save()
      res.status(201).json(savedSource)
    } catch (error) {
      console.error("[v0] Error creating source:", error)
      res.status(500).json({ error: "Failed to create source" })
    }
  },

  // Update importation source
  async updateSource(req: AuthenticatedRequest, res: Response) {
    try {
      const org_id = req.user?.org_id
      const { id } = req.params
      const { sourceType, companyName, location, contactPerson, contactPhone, comments } = req.body

      if (!org_id || !isAdminRole(req.user?.role)) {
        return res.status(403).json({ error: "Unauthorized" })
      }

      const source = await ImportationSource.findOne({ _id: id, org_id })
      if (!source) {
        return res.status(404).json({ error: "Source not found" })
      }

      // Update fields
      if (sourceType && ["MANUFACTURER", "SUPPLIER"].includes(sourceType)) source.sourceType = sourceType
      if (companyName) source.companyName = companyName.trim()
      if (location) source.location = location.trim()
      if (contactPerson) source.contactPerson = contactPerson.trim()
      if (contactPhone) source.contactPhone = contactPhone.trim()
      if (comments !== undefined) source.comments = comments?.trim() || ""

      const updatedSource = await source.save()
      res.json(updatedSource)
    } catch (error) {
      console.error("[v0] Error updating source:", error)
      res.status(500).json({ error: "Failed to update source" })
    }
  },

  // Delete importation source
  async deleteSource(req: AuthenticatedRequest, res: Response) {
    try {
      const org_id = req.user?.org_id
      const { id } = req.params

      if (!org_id || !isAdminRole(req.user?.role)) {
        return res.status(403).json({ error: "Unauthorized" })
      }

      const source = await ImportationSource.findOneAndDelete({ _id: id, org_id })
      if (!source) {
        return res.status(404).json({ error: "Source not found" })
      }

      res.json({ message: "Source deleted successfully" })
    } catch (error) {
      console.error("[v0] Error deleting source:", error)
      res.status(500).json({ error: "Failed to delete source" })
    }
  },

  // Link product to manufacturer
  async linkProductToManufacturer(req: AuthenticatedRequest, res: Response) {
    try {
      const org_id = req.user?.org_id
      const { productId, manufacturerId } = req.body

      if (!org_id || !isAdminRole(req.user?.role)) {
        return res.status(403).json({ error: "Unauthorized" })
      }

      if (!productId || !manufacturerId) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // Verify product exists
      const product = await StockProduct.findOne({ _id: productId, org_id })
      if (!product) {
        return res.status(404).json({ error: "Product not found" })
      }

      // Verify manufacturer exists
      const manufacturer = await ImportationSource.findOne({ _id: manufacturerId, org_id })
      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" })
      }

      // Add product to manufacturer's linkedProducts if not already present
      if (!manufacturer.linkedProducts?.includes(productId)) {
        if (!manufacturer.linkedProducts) manufacturer.linkedProducts = []
        manufacturer.linkedProducts.push(productId)
        await manufacturer.save()
      }

      res.json({ message: "Product linked to manufacturer successfully", manufacturer })
    } catch (error) {
      console.error("[v0] Error linking product:", error)
      res.status(500).json({ error: "Failed to link product" })
    }
  },

  // Unlink product from manufacturer
  async unlinkProductFromManufacturer(req: AuthenticatedRequest, res: Response) {
    try {
      const org_id = req.user?.org_id
      const { productId, manufacturerId } = req.body

      if (!org_id || !isAdminRole(req.user?.role)) {
        return res.status(403).json({ error: "Unauthorized" })
      }

      if (!productId || !manufacturerId) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      const manufacturer = await ImportationSource.findOne({ _id: manufacturerId, org_id })
      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" })
      }

      // Remove product from linkedProducts
      if (manufacturer.linkedProducts?.includes(productId)) {
        manufacturer.linkedProducts = manufacturer.linkedProducts.filter((id) => id !== productId)
        await manufacturer.save()
      }

      res.json({ message: "Product unlinked from manufacturer successfully", manufacturer })
    } catch (error) {
      console.error("[v0] Error unlinking product:", error)
      res.status(500).json({ error: "Failed to unlink product" })
    }
  },

  // Get products linked to a manufacturer
  async getLinkedProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const org_id = req.user?.org_id
      const { manufacturerId } = req.params

      if (!org_id || !isAdminRole(req.user?.role)) {
        return res.status(403).json({ error: "Unauthorized" })
      }

      const manufacturer = await ImportationSource.findOne({ _id: manufacturerId, org_id })
      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" })
      }

      const products = await StockProduct.find(
        { _id: { $in: manufacturer.linkedProducts || [] }, org_id },
        { name: 1, category: 1, startingPrice: 1, sellingPrice: 1 }
      ).lean()

      res.json(products)
    } catch (error) {
      console.error("[v0] Error fetching linked products:", error)
      res.status(500).json({ error: "Failed to fetch linked products" })
    }
  },
}
