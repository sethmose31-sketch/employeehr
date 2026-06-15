# IMPORTATION Module - Quick Start Guide

## Accessing the Module
1. Log in to the admin dashboard
2. In the left sidebar, scroll down to find **"Importation"** (appears directly below "Inventory History")
3. Click to navigate to `/admin/importation`

## Main Features

### Tab 1: Source Management

#### Creating a New Source

**For Manufacturers:**
1. Click "Add New Source" button (top-right)
2. Click "Manufacturer" button in the dialog
3. Fill in the form:
   - **Company Name**: Name of the manufacturer company
   - **Country**: Manufacturing country
   - **Contact Person**: Name of the primary contact
   - **Contact Phone**: Phone number for contact
   - **Comments**: Optional notes about the manufacturer
4. Click "Create Source"

**For Suppliers:**
1. Click "Add New Source" button
2. Click "Supplier" button in the dialog
3. Fill in the form:
   - **Company Name**: Name of the supplier company
   - **Location**: Geographic location of the supplier
   - **Contact Person**: Name of the primary contact
   - **Contact Phone**: Phone number for contact
   - **Comments**: Optional notes about the supplier
4. Click "Create Source"

#### Managing Sources
- **Edit**: Click the edit icon (✏️) on any source card to modify details
- **Delete**: Click the trash icon (🗑️) on any source card to remove it
  - A confirmation dialog will appear before deletion

#### Viewing Source Details
Each source card displays:
- Company name with source type badge (MANUFACTURER or SUPPLIER)
- Location/Country
- Contact person name
- Contact phone number
- Comments (if any)

### Tab 2: Product Linking

#### Linking a Product to a Manufacturer

1. Click on the "Product Linking" tab
2. In the "Link Products to Manufacturers" card:
   - **Select Product**: Choose a product from the dropdown
   - **Select Manufacturer**: Choose a manufacturer from the dropdown
   - Click **"Link Product"** button
3. You'll see a success message confirming the link was created

#### Viewing Linked Products

1. Select a manufacturer from the "Select Manufacturer" dropdown
2. Click **"View Linked Products for [Company Name]"**
3. A modal will open showing all products linked to that manufacturer
4. From this modal, you can:
   - See all linked products with their details (category, price)
   - Click **"Unlink"** to remove a product from the manufacturer

#### Unlinking a Product

1. Select the manufacturer from the dropdown
2. Click "View Linked Products"
3. Find the product you want to unlink
4. Click the **"Unlink"** button
5. Confirm the action - the product will be removed from the manufacturer

## Important Notes

### Multi-Tenant Isolation
- Each organization can only see and manage its own manufacturers and suppliers
- Data is automatically isolated by organization
- Cross-organization data access is not possible

### Branding
- All buttons and badges use your company's primary brand color
- Colors are automatically applied from your company settings

### Validation
- All fields are required when creating/editing sources
- Phone numbers should include country codes or standard formatting
- Company names should be unique per organization

### Permissions
- Only admin users can access the IMPORTATION module
- Required role: company_admin, hr, admin, or super_admin

## Workflow Example

### Setting Up a New Supplier Relationship

1. **Create Source**
   - Go to "Source Management" tab
   - Click "Add New Source"
   - Select "Supplier"
   - Fill in supplier details (company name, location, contact info)
   - Click "Create Source"

2. **Link Products**
   - Go to "Product Linking" tab
   - Select one of your products from the dropdown
   - Select the supplier you just created
   - Click "Link Product"

3. **Verify Link**
   - Click "View Linked Products for [Supplier Name]"
   - Confirm your product appears in the modal
   - You can now see this product is sourced from that supplier

## Troubleshooting

### Can't see the IMPORTATION menu item?
- Verify you're logged in with admin role
- Check if your company admin sections have been updated (may require page refresh)

### Getting an error when creating a source?
- Ensure all required fields are filled in
- Check that the company name is not already used for another source

### Products not showing in dropdown?
- Ensure you've created products in the Stock Management section first
- The product dropdown only shows products from your organization

### Can't link a product?
- Verify you've selected both a product AND a manufacturer
- Ensure the manufacturer exists in your sources list
- Check your browser console for any error messages

## API Reference (for developers)

The IMPORTATION module provides these API endpoints:

```
POST   /api/importation/sources                    - Create source
GET    /api/importation/sources                    - List all sources
GET    /api/importation/sources/:id                - Get specific source
PUT    /api/importation/sources/:id                - Update source
DELETE /api/importation/sources/:id                - Delete source
POST   /api/importation/link-product               - Link product to manufacturer
POST   /api/importation/unlink-product             - Unlink product
GET    /api/importation/sources/:manufacturerId/products - Get linked products
```

All endpoints require authentication via JWT token in Authorization header.
