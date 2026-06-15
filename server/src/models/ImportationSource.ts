import mongoose, { Schema, type Document } from "mongoose"

export interface IImportationSource extends Document {
  _id?: string
  org_id: string
  sourceType: "MANUFACTURER" | "SUPPLIER"
  companyName: string
  location: string // Country for Manufacturer, Location for Supplier
  contactPerson: string
  contactPhone: string
  comments?: string
  linkedProducts?: string[] // Array of product IDs linked to this source
  createdBy?: string
  updatedAt?: Date
  createdAt?: Date
}

const importationSourceSchema = new Schema<IImportationSource>(
  {
    org_id: { type: String, required: true, index: true },
    sourceType: {
      type: String,
      enum: ["MANUFACTURER", "SUPPLIER"],
      required: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    comments: { type: String, default: "", trim: true },
    linkedProducts: [{ type: String, ref: "StockProduct" }],
    createdBy: { type: String },
  },
  { timestamps: true }
)

importationSourceSchema.index({ org_id: 1, sourceType: 1 })
importationSourceSchema.index({ org_id: 1, companyName: 1 })

export const ImportationSource = mongoose.model<IImportationSource>(
  "ImportationSource",
  importationSourceSchema
)
