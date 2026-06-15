import { Router } from "express"
import { importationController } from "../controllers/importationController"
import { authMiddleware, orgMiddleware } from "../middleware/auth"
import { tenantIsolation } from "../middleware/tenantIsolation.middleware"

const router = Router()

router.use(authMiddleware, orgMiddleware, tenantIsolation)

// Importation sources routes
router.get("/sources", importationController.getAllSources)
router.post("/sources", importationController.createSource)
router.get("/sources/:id", importationController.getSourceById)
router.put("/sources/:id", importationController.updateSource)
router.delete("/sources/:id", importationController.deleteSource)

// Product-manufacturer linking routes
router.post("/link-product", importationController.linkProductToManufacturer)
router.post("/unlink-product", importationController.unlinkProductFromManufacturer)
router.get("/sources/:manufacturerId/products", importationController.getLinkedProducts)

export default router
