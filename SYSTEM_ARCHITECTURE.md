# Elevate HR System - Complete Architecture Documentation

## Executive Summary

**Elevate** is a comprehensive multi-tenant HR (Human Resources) Management and Performance Development Platform built on a **Next.js 15 frontend** with an **Express.js backend**. It features complete tenant isolation, dynamic branding per organization, and extensive role-based access control across 40+ integrated modules.

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### 1.1 Technology Stack

**Frontend:**
- Framework: Next.js 15.5.7 (App Router)
- UI Library: React 18.3.1
- Component Library: shadcn/ui with Radix UI primitives
- Styling: Tailwind CSS v4
- State Management: React Hooks + Context API + SWR
- HTTP Client: Fetch API with custom ApiClient
- Theme: next-themes with dynamic branding
- Charts: Recharts for data visualization
- 3D Graphics: React Three Fiber + Three.js
- Forms: React Hook Form + Zod validation
- Icons: Lucide React

**Backend:**
- Framework: Express.js (Node.js)
- Primary Database: MongoDB (Main tenant data)
- Secondary Database: MySQL (Prisma sync cache)
- ORM: Prisma (for MySQL secondary storage only)
- Authentication: JWT-based with MongoDB session management
- File Storage: Local `/uploads` directory (CORS-enabled)
- Real-time: WebRTC signaling + Socket.io
- Email: SMTP configuration support
- AI: LangChain + OpenAI integration
- Payment: M-Pesa webhook support

**Key Packages:**
- Authentication: jsonwebtoken, bcryptjs
- Validation: zod
- Email: Nodemailer (via emailService)
- SMS: Integrated via webhooks
- PDF Generation: jspdf
- Excel: xlsx
- Spreadsheet: country-state-city

---

## 2. MULTI-TENANCY ARCHITECTURE

### 2.1 Tenant Isolation Strategy

The system uses **organization-based multi-tenancy (org_id)** with complete data isolation:

```
User Authentication Flow:
1. User logs in → Backend validates credentials
2. Backend returns JWT token + org_id in payload
3. Frontend stores token + user info (including org_id)
4. All API requests include: Authorization: Bearer {token}
5. Tenant middleware enforces org_id from token
```

### 2.2 Key Multi-Tenancy Components

**Tenant Isolation Middleware** (`server/src/middleware/tenantIsolation.middleware.ts`):
```typescript
- Validates req.user.org_id exists
- Sets req.org_id for all downstream handlers
- Logs all tenant access via AuditService
- Prevents cross-tenant data access
```

**MongoDB Data Structure:**
- Every model includes `org_id` field (indexed)
- Queries filter by org_id automatically
- No shared data between organizations

**MySQL Secondary Storage (Prisma):**
```prisma
model User {
  org_id       String    // ← Tenant identifier
  mongoId      String    // ← Reference to MongoDB
  email        String    @unique
  // ...
}
```

### 2.3 Company Configuration

**Company Model** (`server/src/models/Company.ts`):
- `slug`: Unique identifier (used in URLs like `/careers/{companyName}`)
- `org_id`: Internal tenant ID
- `email`, `phone`, `website`, `industry`, `employeeCount`
- Status: active, suspended, inactive
- Frozen accounts: isFrozen + frozenReason + frozenAt

---

## 3. BRANDING SYSTEM

### 3.1 Dynamic Branding Architecture

Each company can customize their brand colors and styling:

**Branding Fields in Company Model:**
```typescript
primaryColor: "#2563eb"           // Main brand color
secondaryColor: "#059669"          // Secondary accent
accentColor: "#f59e0b"             // Call-to-action color
backgroundColor: "#ffffff"         // Page background
textColor: "#1f2937"               // Text color
borderRadius: "0.5rem"             // Component border radius
fontFamily: "system-ui"            // Custom font
buttonStyle: "rounded|sharp|pill"  // Button style preset
logo: "https://..."                // Company logo URL
```

### 3.2 Frontend Branding Implementation

**ThemeProvider** (`components/theme-provider.tsx`):
1. On app load, fetches branding from API via `api.company.getBranding()`
2. Applies CSS variables to document root:
   ```css
   --brand-primary: {primaryColor}
   --brand-secondary: {secondaryColor}
   --brand-accent: {accentColor}
   --brand-background: {backgroundColor}
   --brand-text: {textColor}
   --brand-radius: {borderRadius}
   --brand-font: {fontFamily}
   --company-logo-url: url('{logo}')
   ```
3. Uses next-themes for dark mode support
4. Silently fails if branding not available (optional feature)

**CSS Variable Application:**
- Tailwind CSS uses CSS variables for theming
- All shadcn/ui components inherit brand colors
- Can override individual component colors

### 3.3 Branding API Endpoint

**GET `/api/company/branding`** - Requires auth:
- Returns full branding configuration
- Scoped to requesting user's organization
- Used by theme provider on app initialization

---

## 4. DATABASE SCHEMA

### 4.1 MongoDB Core Collections

**Primary Collections:**
- `Company` - Organization master record
- `User` - Employee/staff accounts
- `Department` - Organizational departments
- `Branch` - Physical/organizational branches
- `Leave, Attendance, Payroll` - HR management
- `Performance, KPI, PDP, Feedback` - Performance management
- `Job, JobApplication` - Recruitment
- `Stock*, Invoice*, Quotation*` - Inventory/billing
- `Meeting, Message, Communication` - Collaboration
- `Award, Badge, Poll` - Recognition & engagement
- `AuditLog` - Compliance tracking

**Key Fields (Org Isolation):**
- All user-data models include `org_id` indexed field
- Queries automatically scoped by org_id in controllers

### 4.2 MySQL Secondary Storage (Prisma)

Tables mirror MongoDB for sync/cache purposes:
- `mongo_sync_users` - User data cache
- `mongo_sync_companies` - Company branding cache
- `mongo_sync_sessions` - Session management
- `mongo_sync_audit_logs` - Audit trail
- `mongo_sync_analytics_snapshots` - Analytics aggregation

**Purpose:** Dual-write sync for performance, analytics, and sessions.

---

## 5. FRONTEND STRUCTURE

### 5.1 Page Hierarchy & Routes

```
/
├── /auth/
│   ├── /login
│   ├── /signup
│   ├── /forgot-password
│   ├── /reset-password
│   └── /verify-otp
├── /dashboard/ [Employee View]
│   ├── /dashboard (home)
│   ├── /dashboard/analytics
│   ├── /dashboard/awards
│   ├── /dashboard/kpis
│   ├── /dashboard/pdp
│   ├── /dashboard/performance
│   ├── /dashboard/meetings
│   ├── /dashboard/organization
│   └── /dashboard/reports
├── /manager/ [Manager View]
├── /employee/ [Employee View]
├── /admin/ [Admin/HR View]
│   ├── /admin (dashboard)
│   ├── /admin/users
│   ├── /admin/accounts/*
│   ├── /admin/attendance
│   ├── /admin/awards
│   ├── /admin/badges
│   ├── /admin/bookings
│   ├── /admin/leave
│   ├── /admin/payroll
│   ├── /admin/meetings
│   ├── /admin/communications
│   ├── /admin/clients-communication
│   ├── /admin/contracts
│   ├── /admin/feedback-360
│   ├── /admin/jobs
│   ├── /admin/applications
│   ├── /admin/analytics
│   ├── /admin/kpis
│   ├── /admin/reports
│   ├── /admin/settings/
│   │   ├── /company
│   │   ├── /email
│   │   ├── /system/
│   │   │   ├── /branches
│   │   │   ├── /invoice-generation
│   │   │   └── /page-access
│   │   └── /users
│   ├── /admin/stock/ [Inventory Manager]
│   │   ├── /analytics/*
│   │   ├── /dispatch
│   │   ├── /history
│   │   ├── /invoices
│   │   ├── /quotations
│   │   ├── /sales
│   │   ├── /services
│   │   ├── /status
│   │   └── /add-inventory
│   ├── /admin/alerts
│   ├── /admin/stamps
│   ├── /admin/polls
│   ├── /admin/badges
│   ├── /admin/allocations
│   └── /admin/suggestions
├── /careers/
│   └── [companyName]/[positionIndex]
├── /company/
│   └── [slug]
└── /setup (Initial company setup)
```

### 5.2 Role-Based Access Control (RBAC)

**User Roles:**
```typescript
type Role = 'company_admin' | 'admin' | 'hr' | 'manager' | 'employee'
```

**Access Control:**
- Auth middleware validates JWT + org_id
- Admin layout checks `isAdmin()` → allows company_admin, admin, hr
- Manager routes check role === 'manager'
- Employee routes check role === 'employee'
- Page access further restricted via admin section permissions

**Admin Sections** (Fine-grained access):
```typescript
const ADMIN_SECTION_PATHS = [
  { section: "CORE", match: paths for users, admin dashboard }
  { section: "RECRUITMENT", match: jobs, applications, analytics, communications }
  { section: "EMPLOYEE MANAGEMENT", match: leave, payroll, meetings, contracts, etc }
  { section: "INVENTORY MANAGER", match: all /admin/stock/* }
  { section: "ACCOUNTS", match: all /admin/accounts/* }
  { section: "PERFORMANCE", match: kpis, feedback-360, reports }
  { section: "SYSTEM", match: settings, stamps }
]
```

### 5.3 Component Architecture

**Layout Components:**
- `components/dashboard/sidebar.tsx` - Employee sidebar navigation
- `components/dashboard/top-nav.tsx` - Employee top navigation
- `components/admin/sidebar.tsx` - Admin sidebar with collapsible state
- `components/admin/top-nav.tsx` - Admin top navigation

**Key Components:**
- `components/theme-provider.tsx` - Dynamic branding provider
- `components/app-initializer.tsx` - Token cleanup on app start
- `components/ui/*` - shadcn/ui primitives (100+ components)
- `components/dashboard/recent-activity.tsx`
- `components/dashboard/quick-actions.tsx`
- `components/ai/ai-assistant-chat.tsx` - AI sidebar (admin only)

---

## 6. BACKEND STRUCTURE

### 6.1 API Route Organization

All routes prefixed with `/api/`:
```
/auth - Authentication (login, signup, verify-otp, etc)
/users - User management
/company - Company/branding configuration
/performance - Performance reviews
/kpis - KPI management
/pdps - Personal Development Plans
/feedback - 360 feedback
/attendance - Attendance tracking
/awards - Recognition/awards
/tasks - Task management
/messages - Internal messaging
/meetings - Meeting scheduling
/suggestions - Employee suggestions
/badges - Badge/gamification
/polls - Polls/surveys
/contracts - Contract management
/alerts - Alert management
/jobs - Job postings (public + private)
/application-forms - Application forms
/job-applications - Job applications
/communications - External communications
/invitations - Invitations
/reports - Report management
/holidays - Holiday calendar
/leave - Leave management
/payroll - Payroll processing
/feedback-360 - 360 feedback surveys
/feedback-surveys - General surveys
/stock - Inventory management
/accounts - Financial accounts
/setup - Initial company setup
/ai-assistant - AI assistant endpoints
```

### 6.2 Controller Pattern

Each route has a dedicated controller (e.g., `UserController`, `PerformanceController`):

```typescript
// Example: UserController
export class UserController {
  static async getAll(req: AuthenticatedRequest, res: Response) {
    const orgId = req.org_id
    const users = await User.find({ org_id: orgId })
    res.json({ success: true, data: users })
  }
  // ... more methods
}
```

**Key Pattern:**
- Org_id extracted from authenticated request
- All queries filtered by org_id
- Error handling via errorHandler middleware
- Audit logging for sensitive operations

### 6.3 Middleware Stack

Applied in order:
1. `helmet` - Security headers
2. `morgan` - Request logging
3. `cors` - Cross-origin resource sharing
4. Express JSON/URL-encoded body parsing
5. `sanitizeInput` - XSS/injection prevention
6. `apiLimiter` - Rate limiting
7. Route-specific middleware:
   - `authMiddleware` - Validates JWT, sets req.user
   - `tenantIsolation` - Enforces org_id scoping
   - Upload middleware for file handling

### 6.4 Key Services

- **authService** - JWT generation, password hashing
- **emailService** - SMTP-based email delivery
- **aiAssistantService** - LangChain AI integration
- **performanceService** - Performance analytics
- **stockService** - Inventory calculations
- **auditService** - Compliance logging
- **syncQueueService** - MongoDB → MySQL sync
- **smsService** - SMS delivery
- **mpesaService** - M-Pesa payment integration
- **encryptionService** - Data encryption

### 6.5 Authentication Flow

```
POST /api/auth/login
├─ Validate credentials
├─ Generate JWT (includes userId, org_id, role)
├─ Create session record (MySQL)
├─ Return token + user object

Subsequent Requests:
├─ Header: Authorization: Bearer {token}
├─ authMiddleware validates token
├─ Extracts org_id from token payload
├─ Sets req.user (userId, org_id, role, etc)
├─ tenantIsolation ensures data scoping
```

**Token Validation** (`lib/auth.ts`):
- Validates JWT structure (3 parts: header.payload.signature)
- Checks userId is valid MongoDB ObjectId
- Rejects invalid tokens with console warnings
- Stores in localStorage: `elevate_auth_token` and `elevate_user`

---

## 7. KEY FEATURES & MODULES

### 7.1 HR Management
- **Attendance**: Clock in/out, reports, analytics
- **Leave Management**: Request/approval workflow, balance tracking
- **Payroll**: Salary processing, payment channels (Bank, M-Pesa)
- **Performance Reviews**: 360-degree feedback, KPI tracking
- **PDPs**: Personal Development Plans with status tracking

### 7.2 Recruitment
- **Job Postings**: Public career page + internal postings
- **Job Applications**: Application form builder, screening
- **Interviews**: Meeting scheduling via calendar integration
- **Analytics**: Recruitment funnel tracking

### 7.3 Performance Management
- **KPIs**: Define, track, review organizational KPIs
- **Feedback 360**: Anonymous feedback with pools and surveys
- **Performance Ratings**: Scoring and trend analysis
- **Goals & Development**: PDP tracking

### 7.4 Collaboration
- **Meetings**: Schedule, invite, track attendance
- **Messages**: Internal messaging/chat
- **Communications**: External client communications
- **Documents**: Contract management and storage

### 7.5 Recognition & Engagement
- **Awards**: Recognition program
- **Badges**: Gamification badges
- **Polls**: Employee surveys and polls
- **Leaderboards**: Performance rankings

### 7.6 Inventory Management
- **Stock Management**: Product catalog, quantities
- **Invoices & Quotations**: Sales documents
- **Dispatch**: Logistics tracking with SMS notifications
- **Analytics**: Sales by product, margins, trends
- **Expenses & Credit Notes**: Financial management

### 7.7 System Administration
- **Company Settings**: Branding, email, invoice config
- **User Management**: Add/edit/deactivate employees
- **Department/Branch**: Organizational structure
- **Page Access Control**: Fine-grained permission matrix
- **Email Configuration**: SMTP setup for outbound emails
- **Setup Wizard**: Initial company configuration

### 7.8 Analytics & Reporting
- **Dashboard Analytics**: Real-time organizational metrics
- **Department Reports**: Performance by department
- **Financial Reports**: Revenue, expenses, margins
- **Monthly Invoice Summary**: Revenue tracking
- **Custom Reports**: Employee-specific reports

### 7.9 AI Assistance
- **AI Assistant Chat**: Sidebar chat with organizational context
- **AI Meeting Notes**: Automatic meeting transcription
- **AI Analysis**: Performance and trends analysis
- **Org Context**: LLM has access to organizational structure

---

## 8. DATA FLOW EXAMPLES

### 8.1 Employee Login

```
┌─────────────────┐
│   Browser       │
│  (Next.js SPA)  │
└────────┬────────┘
         │ POST /api/auth/login
         │ { email, password }
         │
         ▼
┌─────────────────┐
│   Express API   │
│  (Node.js)      │
│                 │
│ → Validate creds
│ → Hash & compare
│ → Generate JWT
│ → Create session
│                 │
└────────┬────────┘
         │ Response
         │ {
         │   token: "eyJhb...",
         │   user: {
         │     _id, email, role,
         │     org_id, firstName
         │   }
         │ }
         │
         ▼
┌─────────────────┐
│   localStorage  │
│                 │
│ elevate_auth_token
│ elevate_user    │
└─────────────────┘
```

### 8.2 Fetch Dashboard Data

```
┌──────────────────┐
│  app/admin/page  │
│  (React)         │
│                  │
│ useEffect():     │
│  api.users.getAll()
│  api.kpis.getAll()
│  api.awards.getAll()
│  api.performance.getAll()
│  // ... parallel calls
└─────────┬────────┘
          │ GET /api/users, etc
          │ Authorization: Bearer {token}
          │
          ▼
┌──────────────────┐
│   Express API    │
│                  │
│ authMiddleware:  │
│  Extract token   │
│  Validate JWT    │
│  Get org_id from │
│  token payload   │
│                  │
│ userController   │
│  .getAll():      │
│   User.find({    │
│     org_id: {org}
│   })             │
└─────────┬────────┘
          │ [users for org]
          │
          ▼
┌──────────────────┐
│   React State    │
│   (useState)     │
│                  │
│ setData({        │
│   users: [...]   │
│   kpis: [...]    │
│   ...            │
│ })               │
└──────────────────┘
         │
         ▼ Render
      (UI Updates)
```

### 8.3 Create Performance Review

```
┌───────────────────┐
│  User submits     │
│  performance      │
│  form with scores │
└────────┬──────────┘
         │ POST /api/performance
         │ {
         │   employee_id,
         │   scores: {...},
         │   feedback,
         │   status: "draft"
         │ }
         │ Authorization: Bearer {token}
         │
         ▼
┌────────────────────┐
│  performanceRouter │
│  → authMiddleware  │
│  → tenantIsolation │
│  → PerformanceCtrl │
│   .create()        │
│   - Validate input │
│   - org_id scoped  │
│   - Save to DB     │
│   - Audit log      │
└────────┬───────────┘
         │ Response
         │ {
         │   success: true,
         │   data: {...}
         │ }
         │
         ▼
┌────────────────────┐
│  MongoDB           │
│  Performance doc:  │
│  {                 │
│    _id, org_id,    │
│    employee_id,    │
│    scores,         │
│    status, dates   │
│  }                 │
└────────────────────┘
```

---

## 9. BRANDING FLOW IN ACTION

### 9.1 Company Setup

1. Admin enters branding during setup/settings:
   - Primary color: #667eea (purple)
   - Secondary color: #764ba2 (darker purple)
   - Logo URL
   - Font family: "Poppins"

2. Colors saved to `Company` document in MongoDB

### 9.2 User Visits App

1. Browser loads `/admin` or `/dashboard`
2. ThemeProvider component runs `useEffect`
3. Calls `api.company.getBranding()` → fetches from `/api/company/branding`
4. Backend returns company branding colors + settings
5. Frontend sets CSS variables on `<html>` root:
   ```css
   --brand-primary: #667eea;
   --brand-secondary: #764ba2;
   --brand-font: "Poppins";
   ```
6. All shadcn/ui components use these variables
7. Buttons, cards, badges, links all render with company colors

### 9.3 Example Color Application

```html
<!-- Tailwind class: bg-primary -->
<button class="bg-primary text-white px-4 py-2">
  Create Invoice
</button>

<!-- Compiles to -->
<style>
  .bg-primary {
    background-color: var(--primary); /* inherits from --brand-primary */
  }
</style>

<!-- With branding applied -->
<style>
  html {
    --primary: #667eea; /* Company branding */
  }
</style>

<!-- Result: Purple button with company color -->
```

---

## 10. SETUP WIZARD FLOW

**Location:** `app/admin/layout.tsx` + `app/setup/` pages

**Progress Tracking:**
```typescript
setupProgress: {
  completed: false,
  currentStep: "companyInfo",
  steps: {
    companyInfo: false,
    branding: false,
    emailConfig: false,
    employees: false,
    kpis: false
  }
}
```

**Steps:**
1. **Company Info** - Name, industry, employee count
2. **Branding** - Logo, colors, fonts, button style
3. **Email Config** - SMTP settings for outbound emails
4. **Employees** - Upload employee database
5. **KPIs** - Define organizational KPIs

**On Completion:**
- `setupProgress.completed = true`
- Redirect to `/admin` dashboard
- All features unlocked

---

## 11. IMPORTANT FILES & LOCATIONS

### Frontend Key Files
```
app/
├── layout.tsx                    # Root with ThemeProvider
├── admin/
│   ├── layout.tsx               # Admin layout + auth check
│   └── page.tsx                 # Admin dashboard
├── dashboard/
│   ├── layout.tsx               # Employee dashboard layout
│   └── page.tsx                 # Employee dashboard
├── auth/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── ...
components/
├── theme-provider.tsx            # Branding loader
├── app-initializer.tsx           # Token cleanup
├── admin/
│   ├── sidebar.tsx              # Admin navigation
│   └── top-nav.tsx              # Admin header
├── dashboard/
│   ├── sidebar.tsx
│   └── top-nav.tsx
lib/
├── auth.ts                      # Token management
├── api.ts                       # API client
└── apiBase.ts                   # API URL config
```

### Backend Key Files
```
server/
├── src/
│   ├── index.ts                 # Server entry point
│   ├── config/
│   │   ├── auth.ts
│   │   └── database.ts
│   ├── middleware/
│   │   ├── auth.ts              # JWT validation
│   │   ├── tenantIsolation.ts   # Org scoping
│   │   └── errorHandler.ts      # Error handling
│   ├── controllers/             # 40+ controllers
│   │   ├── companyController.ts # Branding API
│   │   ├── userController.ts
│   │   ├── performanceController.ts
│   │   └── ...
│   ├── models/                  # 50+ Mongoose models
│   │   ├── Company.ts
│   │   ├── User.ts
│   │   ├── Performance.ts
│   │   └── ...
│   ├── routes/                  # Route definitions
│   │   ├── company.routes.ts
│   │   ├── auth.routes.ts
│   │   └── ...
│   ├── services/                # Business logic
│   │   ├── authService.ts
│   │   ├── aiAssistantService.ts
│   │   └── ...
│   └── types/
│       └── interfaces.ts        # TypeScript interfaces
├── prisma/
│   └── schema.prisma            # MySQL schema
└── package.json
```

---

## 12. DEPLOYMENT ARCHITECTURE

**Frontend:** Vercel (v0 deployment)
- Auto-deploy on Git push
- Environment: Next.js 15 App Router
- URL: https://employeehr.vercel.app (or custom domain)

**Backend:** Node.js Express
- URL: https://hpapi.codewithseth.co.ke
- Alternative: https://backend.codewithseth.co.ke

**CORS Configuration:**
Allowed origins:
- http://localhost:3000 (dev)
- https://employeehr.vercel.app (prod)
- https://hpapi.codewithseth.co.ke
- https://backend.codewithseth.co.ke
- https://hr.codewithseth.co.ke
- Environment variable: `FRONTEND_URL`

**Databases:**
- MongoDB: Primary data store (all tenants)
- MySQL: Secondary cache via Prisma sync

---

## 13. SECURITY CONSIDERATIONS

### 13.1 Authentication & Authorization
- JWT tokens include org_id + userId + role
- Token validation on every protected route
- Middleware enforces org_id scoping on all queries
- Passwords hashed with bcryptjs (not stored plain text)

### 13.2 Data Isolation
- Every query includes `org_id: req.org_id` filter
- Database indexes on org_id for performance
- No cross-tenant data leakage by design

### 13.3 Input Validation
- `sanitizeInput` middleware prevents XSS
- Zod schema validation on request bodies
- Rate limiting on API routes
- CSRF protection via CORS

### 13.4 Audit Logging
- AuditLog model tracks all significant actions
- Fields: org_id, userId, action, resource, changes, timestamp
- Queryable for compliance audits

---

## 14. SCALABILITY & PERFORMANCE

### 14.1 Frontend Optimizations
- Code splitting via Next.js App Router
- Image optimization
- CSS-in-JS with Tailwind (post-CSS)
- React.useMemo for expensive calculations
- Component lazy loading

### 14.2 Backend Optimizations
- MongoDB indexes on frequently queried fields
- MySQL secondary storage for analytics
- Connection pooling for databases
- Rate limiting to prevent abuse
- Gzip compression on responses

### 14.3 Sync Strategy
- MongoDB → MySQL sync every 5 minutes
- Dual-write pattern for critical data
- Async workers for non-blocking operations

---

## 15. ADDING NEW FEATURES

### 15.1 Adding a New Admin Page

1. Create route: `app/admin/[section]/page.tsx`
2. Add to `ADMIN_SECTION_PATHS` in `admin/layout.tsx`
3. Create backend API routes if needed
4. Check page access permissions in `pageAccessSettings`
5. Add sidebar navigation link in `components/admin/sidebar.tsx`

### 15.2 Adding a New API Endpoint

1. Create controller: `server/src/controllers/[feature]Controller.ts`
2. Create routes: `server/src/routes/[feature].routes.ts`
3. Import routes in `server/src/index.ts`
4. Add to Postman/API docs
5. Ensure org_id scoping in controller
6. Add to frontend API client: `lib/api.ts`

### 15.3 Adding Branding Support

- Add fields to `Company` schema
- Update `ThemeProvider` to apply via CSS variables
- Add UI in company settings to configure
- Update company controller to handle updates

---

## 16. TROUBLESHOOTING

### Authentication Issues
- Check JWT token format: `Authorization: Bearer {token}`
- Verify token hasn't expired
- Check org_id matches in token payload
- Clear localStorage and retry login

### Org Isolation Issues
- Ensure all queries include `org_id` filter
- Check middleware order (auth before tenant isolation)
- Verify token includes valid org_id

### Branding Not Appearing
- Confirm company branding saved in DB
- Check CSS variables on `<html>` element
- Verify API endpoint `/api/company/branding` returns data
- Check browser DevTools for CSS variable values

### CORS Errors
- Add origin to CORS whitelist in `server/src/index.ts`
- Check preflight OPTIONS requests
- Verify credentials: true for cookie-based auth

---

## 17. KEY METRICS & MONITORING

**Things to Monitor:**
- API response times per endpoint
- MongoDB query performance
- Auth token expiry distribution
- Org isolation enforcement
- File upload sizes
- Active user sessions
- Error rates by endpoint

**Audit Concerns:**
- Unauthorized data access attempts
- Cross-tenant data leakage
- Permission bypasses
- Sensitive field modifications

---

## 18. CONCLUSION

Elevate is a production-grade multi-tenant HR system with:
- ✅ Complete organizational isolation via org_id
- ✅ Dynamic branding system (colors, fonts, logos)
- ✅ 7 admin sections with fine-grained permissions
- ✅ 40+ integrated HR modules
- ✅ Real-time collaboration (meetings, messaging)
- ✅ AI-powered insights and assistance
- ✅ Compliance & audit logging
- ✅ Mobile-responsive UI with shadcn/ui
- ✅ Scalable architecture for growth

Every component has been designed with multi-tenancy and branding in mind from the ground up.

