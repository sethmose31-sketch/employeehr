# Quick Reference - Elevate HR System Architecture

## System Type
**Multi-Tenant SaaS HR Platform** with Dynamic Branding & Role-Based Access Control

---

## Core Technologies

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 15, React 18, Tailwind CSS, shadcn/ui |
| **Backend** | Express.js (Node.js) |
| **Primary DB** | MongoDB (all tenant data) |
| **Secondary DB** | MySQL (via Prisma - sync cache) |
| **Auth** | JWT tokens stored in localStorage |
| **Real-time** | WebRTC + Socket.io |
| **UI Components** | 100+ shadcn/ui components (Radix UI primitives) |

---

## Multi-Tenancy Model

**Type:** Organization-based (`org_id`)

**Flow:**
```
User Login → JWT with org_id in payload
         ↓
All requests include org_id via middleware
         ↓
Every query filtered by org_id (org-scoped)
         ↓
Complete data isolation between organizations
```

**Isolation Enforcement:**
- Auth middleware extracts org_id from JWT token
- Tenant isolation middleware enforces it on all routes
- Database queries include org_id filter
- Audit logging for compliance

---

## Branding System

**Customization Per Company:**
- Primary, secondary, accent colors
- Background and text colors
- Border radius (rounded/sharp/pill)
- Custom font family
- Company logo

**Implementation:**
1. Admin saves branding in Company model
2. ThemeProvider fetches on app load via API
3. CSS variables applied to `<html>` root
4. All shadcn/ui components inherit brand colors
5. Automatic theme switching (light/dark mode)

**Key Component:** `components/theme-provider.tsx`
**API Endpoint:** `GET /api/company/branding`

---

## Page Structure & Access Control

### Main Routes
- **`/auth/`** - Public auth (login, signup, reset)
- **`/dashboard/`** - Employee dashboard
- **`/manager/`** - Manager dashboard
- **`/employee/`** - Employee view
- **`/admin/`** - Admin/HR administrative area
- **`/careers/`** - Public job postings
- **`/setup`** - Initial company setup wizard

### Admin Sections (Fine-grained Access)
```
CORE → User management, dashboard
RECRUITMENT → Jobs, applications, communications
EMPLOYEE MANAGEMENT → Leave, payroll, meetings, contracts, badges, polls
INVENTORY MANAGER → Stock, invoices, quotations, dispatch, analytics
ACCOUNTS → Financial accounts
PERFORMANCE → KPIs, 360 feedback, reports
SYSTEM → Settings, stamps
```

### User Roles & Permissions
- `company_admin` → Full access to all sections
- `admin` → Full access except settings:write
- `hr` → Users, payroll, reports, settings (read-only)
- `manager` → Reports (read-only), basic user info
- `employee` → Reports (read-only)

---

## Frontend Architecture

### Key Directories
```
app/                    # Next.js pages
├── admin/             # Admin dashboard + 40+ pages
├── dashboard/         # Employee dashboard
├── auth/             # Authentication pages
└── setup/            # Company setup wizard

components/            # React components
├── admin/            # Admin-specific UI
├── dashboard/        # Dashboard-specific UI
├── ui/               # shadcn/ui primitives (100+)
└── theme-provider.tsx # Dynamic branding

lib/
├── auth.ts           # Token/user management
├── api.ts            # Centralized API client
└── types.ts          # TypeScript interfaces
```

### Data Flow
```
User Action → React Component
           ↓
           → API Client (lib/api.ts)
           ↓
           → Express Backend
           ↓
           → MongoDB/MySQL Query (org-scoped)
           ↓
           → Response → State Update → UI Render
```

---

## Backend Architecture

### API Organization
```
/api/
├── /auth           - Login, signup, token validation
├── /users          - Employee management
├── /company        - Branding, settings
├── /performance    - Performance reviews
├── /attendance     - Attendance tracking
├── /leave          - Leave requests/approval
├── /payroll        - Salary processing
├── /kpis           - KPI management
├── /feedback-360   - 360 feedback surveys
├── /stock          - Inventory management
├── /jobs           - Job postings + public career page
└── 30+ more...
```

### Controller Pattern
```typescript
// Every endpoint follows:
1. Auth middleware → validates JWT
2. Tenant isolation → extracts org_id
3. Controller method → org-scoped query
4. Error handler → consistent error format
5. Audit log → compliance tracking
```

### Key Middleware Stack
1. `helmet` - Security headers
2. `morgan` - Request logging
3. `cors` - Cross-origin support
4. `sanitizeInput` - XSS prevention
5. `apiLimiter` - Rate limiting
6. `authMiddleware` - JWT validation → sets req.user
7. `tenantIsolation` - org_id scoping enforcement

---

## Database Models (MongoDB)

**Core Models:**
- Company, User, Department, Branch
- Attendance, Leave, Payroll
- Performance, KPI, PDP, Feedback
- Job, JobApplication
- Stock*, Invoice*, Quotation*
- Meeting, Message, Communication
- Award, Badge, Poll
- AuditLog

**Key Pattern:**
- Every model includes indexed `org_id` field
- Queries filter by org_id automatically
- No shared data between organizations

**MySQL (Prisma - Secondary):**
- Mirrors MongoDB for analytics/caching
- 5-minute sync scheduler
- Used for session management and audit trails

---

## Authentication & Token Management

### Token Storage
```javascript
localStorage.setItem('elevate_auth_token', token)    // JWT token
localStorage.setItem('elevate_user', userJson)      // User object with org_id
```

### Token Validation
```javascript
// Every token must have:
- Valid JWT format (3 parts: header.payload.signature)
- Valid org_id in payload
- Valid userId (MongoDB ObjectId: 24 hex chars)
```

### Frontend Token Cleanup
- `cleanupTokens()` runs on app load
- Validates stored tokens
- Removes invalid/expired tokens
- Called by `AppInitializer` component

---

## Branding in Action: Step-by-Step

1. **Admin Updates Branding** (Company Settings)
   ```json
   {
     "primaryColor": "#667eea",
     "secondaryColor": "#764ba2",
     "logo": "https://cdn.example.com/logo.png"
   }
   ```

2. **Saves to MongoDB**
   ```
   db.companies.updateOne(
     { org_id: "..." },
     { $set: { primaryColor, secondaryColor, logo } }
   )
   ```

3. **User Loads App**
   - ThemeProvider calls `api.company.getBranding()`
   - API returns company colors

4. **Frontend Applies CSS Variables**
   ```css
   document.documentElement.style.setProperty(
     '--brand-primary', 
     '#667eea'
   )
   ```

5. **Shadcn/ui Components Inherit**
   ```css
   .bg-primary {
     background-color: var(--primary);  /* Uses --brand-primary */
   }
   ```

6. **Result:** All buttons, cards, links render in company colors

---

## Admin Dashboard Features

### Real-Time Metrics
- Total employees, active PDPs, monthly awards
- Average performance scores
- Department-wise breakdown
- Attendance trends
- Pending leave requests
- Payroll processing status
- Stock dispatch status

### Quick Actions
- Create invoices
- Add employees
- Schedule meetings
- Review performance
- Process payroll

### Charts & Analytics
- Performance by department (BarChart)
- Trends over 1/3/6 months (LineChart)
- Stock distribution (PieChart)
- Department headcount ranking

---

## Important Files to Know

### Frontend
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with ThemeProvider |
| `components/theme-provider.tsx` | Branding system |
| `components/app-initializer.tsx` | Token cleanup on start |
| `app/admin/layout.tsx` | Admin layout + auth guards |
| `app/admin/page.tsx` | Admin dashboard |
| `lib/auth.ts` | Token & user management |
| `lib/api.ts` | Centralized API client |

### Backend
| File | Purpose |
|------|---------|
| `server/src/index.ts` | Server entry point |
| `server/src/middleware/tenantIsolation.middleware.ts` | Org scoping |
| `server/src/middleware/auth.ts` | JWT validation |
| `server/src/controllers/companyController.ts` | Branding API |
| `server/src/models/Company.ts` | Company schema + defaults |
| `server/prisma/schema.prisma` | MySQL schema for sync |

---

## Security Checklist

- ✅ JWT tokens validated on every request
- ✅ Org_id extracted and enforced on all queries
- ✅ No cross-tenant data access possible
- ✅ Passwords hashed with bcryptjs
- ✅ CORS restricted to known domains
- ✅ Input sanitization (XSS prevention)
- ✅ Rate limiting on API routes
- ✅ Audit logging for compliance
- ✅ Helmet security headers
- ✅ Sensitive data encrypted in transit (HTTPS)

---

## Adding New Features: Checklists

### Adding New Admin Page
- [ ] Create route in `app/admin/[section]/`
- [ ] Add section to `ADMIN_SECTION_PATHS` in layout
- [ ] Create backend API endpoints (if needed)
- [ ] Add sidebar navigation link
- [ ] Ensure org_id scoping in backend
- [ ] Test page access permissions

### Adding New API Endpoint
- [ ] Create controller method
- [ ] Create/update routes file
- [ ] Add auth middleware
- [ ] Add org_id filtering to queries
- [ ] Add error handling
- [ ] Add audit logging (if sensitive)
- [ ] Update frontend API client
- [ ] Test multi-tenant isolation

### Adding Branding Support
- [ ] Add field to Company model
- [ ] Update API endpoint
- [ ] Add UI in settings
- [ ] Update ThemeProvider CSS variables
- [ ] Test on light/dark modes

---

## Common Tasks

### Debug an Auth Issue
1. Check token in localStorage: `console.log(localStorage.getItem('elevate_auth_token'))`
2. Decode JWT: https://jwt.io
3. Verify org_id in payload
4. Check API response for 401 status
5. Clear cache and retry login

### Check Org Isolation
1. Login as user in Org A
2. Try to access another org's data via API directly
3. Should return 401 or empty results
4. Check MongoDB query logs for org_id filter

### Apply New Branding
1. Go to Company Settings
2. Update colors/logo
3. Save changes
4. Refresh browser (or wait for next ThemeProvider check)
5. All UI should reflect new colors

---

## System Scale

- **Users:** Thousands per organization
- **Organizations:** Multiple independent tenants
- **API Endpoints:** 50+ routes
- **Database Models:** 50+ Mongoose models
- **Components:** 100+ shadcn/ui components
- **Pages:** 80+ admin + dashboard pages
- **Modules:** 7 major feature areas

---

## Performance Notes

- Dashboard refreshes every 2 minutes (not 30 seconds)
- Uses Promise.allSettled for parallel API calls
- Graceful degradation if non-critical APIs fail
- MySQL sync runs every 5 minutes (async)
- Images optimized via Next.js
- CSS-in-JS via Tailwind (no runtime overhead)

---

## Deployment

**Frontend:**
- Hosted on Vercel
- URL: https://employeehr.vercel.app
- Auto-deploys on Git push

**Backend:**
- Node.js Express
- URL: https://hpapi.codewithseth.co.ke
- CORS: Whitelist specific origins

**Databases:**
- MongoDB: Production data store
- MySQL: Secondary cache + sessions

---

## Next Steps (Recommendations)

1. **Documentation** ✅ (You're reading it!)
2. **Load Testing** - Verify org isolation under stress
3. **Security Audit** - OWASP compliance check
4. **Performance Optimization** - Monitor slow endpoints
5. **Feature Roadmap** - Plan new modules
6. **Disaster Recovery** - Database backup strategy
7. **User Training** - Admin onboarding guide

---

**Last Updated:** 2026  
**System:** Elevate HR Platform  
**Version:** 1.1.0  
**Status:** Production

For detailed information, see: **SYSTEM_ARCHITECTURE.md**
