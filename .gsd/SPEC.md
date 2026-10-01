# SPEC-01: Concierge Assisted Marketplace & Service Grid Redesign

## 1. Overview & Problem Definition
In the current early stage of the marketplace, workers are not reliably online or available in real-time, resulting in empty specialist lists, slow automated worker matching, and customer friction.
To solve this, the marketplace is pivoting to an **Assisted Concierge / Managed Dispatch Model**:
1. **Customer Home Screen**:
   - Hide/remove the "Specialists Near You" / individual worker profile browsing to prevent empty screens.
   - Transform service categories from a single horizontal scroll row into an elegant, high-converting multi-row, multi-column grid (3 columns on mobile) using the 3D isometric icons.
   - Tapping any service category opens a popup sheet with two direct primary actions:
     - **"Call Now" (📞)**: Instant one-tap dial to the customer support / concierge dispatch helpline (`tel:7975182162`).
     - **"Book Now" (⚡)**: Quick booking sheet capturing customer address (GPS auto-filled), issue description/notes, and booking confirmation.
2. **Booking Lifecycle & Realtime Sync**:
   - Creating a booking writes to Supabase `bookings` with `customer_id`, `category_id`, `address_text`, `customer_lat`, `customer_lng`, `description`, and `worker_id: null`, status: `'searching'`.
   - The active booking immediately displays in the **Customer App** with real-time status tracking and a "Call Dispatch" button.
   - The booking immediately pushes via Supabase Realtime to the **Admin Dashboard** (`AdminDashboard.tsx`) with full customer details (Name, Phone, Address, Notes, Category, Time).
3. **Admin Assisted Dispatch Workflow**:
   - Admin receives incoming bookings in real-time.
   - Admin can 1-tap "Call Customer" to confirm requirements.
   - Admin can view nearby/registered technicians for the requested category, 1-tap "Call Worker" offline to confirm availability, and click "Assign Worker & Dispatch" to link the worker to the booking and update status to `accepted` / `on_the_way`.

## 2. Requirements & Verification Matrix
- Story NT-01: Grid Transformation for Service Categories (`HomeScreen.tsx`)
- Story NT-02: Hide Worker Profiles from Customer Browsing (`HomeScreen.tsx`)
- Story NT-03: Category Action Popup with "Call Now" & "Book Now" (`ServiceActionModal.tsx` & `HomeScreen.tsx`)
- Story NT-04: Supabase Booking Creation with Nullable Worker & Address Notes (`src/lib/supabase.ts` & `createBooking`)
- Story NT-05: Customer Bookings Screen Assisted Dispatch State & Helpline Call (`BookingsScreen.tsx`)
- Story NT-06: Admin Dashboard Realtime Bookings Subscription & Concierge Dispatch Assignment (`AdminDashboard.tsx`)
