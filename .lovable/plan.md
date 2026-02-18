

# The Chameleon CRM — Final Execution Plan

## Overview
A universal, industry-agnostic small business CRM for local service professionals. Mobile-first, RTL-ready, with WhatsApp integration, calendar views, and image uploads. Clean, Linear-inspired design.

---

## Phase 1: Foundation, Auth & Database

### 1.1 — Supabase Cloud Setup
- Spin up Lovable Cloud backend with email/password authentication
- Create login and signup pages with minimal, centered card design
- Protected routes — unauthenticated users redirect to login

### 1.2 — Full Database Schema
Create all tables with RLS so each user only sees their own data:
- **`profiles`** — display_name, business_type, locale (en/he/ar), onboarding_completed
- **`contacts`** — name, phone, email, company, notes, last_contact_date, contact_frequency_days
- **`pipelines`** — name (e.g., "Default Pipeline")
- **`pipeline_stages`** — name, display_order, color, linked to pipeline
- **`deals`** — title, value, due_date, event_date, notes, linked to contact + stage
- **`interactions`** — type (call/whatsapp/note/meeting), content, timestamp, linked to contact

### 1.3 — Supabase Storage
- Create a `deal-photos` storage bucket for image uploads on deals
- RLS policies so users can only access their own uploads

---

## Phase 2: Design System & RTL Foundation

### 2.1 — Theme & Layout Shell
- Linear-inspired color system: white/gray/black base with a configurable accent color (default: blue-violet)
- Global layout component that reads the user's locale preference and sets `dir="rtl"` or `dir="ltr"` on the root element
- All spacing, icons, and navigation flip correctly in RTL mode

### 2.2 — Mobile-First Navigation
- **Mobile:** Bottom tab bar with 5 tabs — Dashboard, Calendar, Kanban, Contacts, Settings
- **Desktop:** Collapsible sidebar with the same navigation items
- All forms and detail views use slide-up Sheets/Drawers (thumb-friendly on mobile)

---

## Phase 3: Smart Onboarding Wizard

### 3.1 — Business Type Selection
- After first login, redirect to onboarding if not completed
- Step 1: "What drives your business?" — three visual cards:
  - **Service Appointments** (Barber, Salon, Trainer) → Calendar mode as default view
  - **Project Pipelines** (Web Dev, Freelancer) → Kanban mode as default view
  - **Sales Leads** (Real Estate, Insurance) → List/Dashboard mode as default view

### 3.2 — Auto-Pipeline Generation
- Auto-create a default pipeline with preset stages based on selection:
  - *Service:* Booked → In Progress → Completed → Paid
  - *Project:* Lead → Proposal → In Progress → Review → Completed
  - *Sales:* New Lead → Contacted → Qualified → Negotiation → Closed Won / Lost

### 3.3 — Profile Setup
- Step 2: Enter business name, display name
- Step 3: Choose language/direction preference (English LTR or Hebrew/Arabic RTL)
- Mark onboarding complete, redirect to the preferred default view

---

## Phase 4: Dashboard — "Your Day at a Glance"

### 4.1 — Dashboard Widgets
- **"Who to contact today?"** — contacts where last_contact_date + frequency ≤ today, with one-tap "Mark Contacted" and "Snooze 1 week" buttons
- **"Upcoming Jobs"** — next 5 deals by due_date with contact name and value
- **"Revenue this month"** — sum of deal values in "Completed/Paid" stages for current month
- **Quick-add FAB** (floating action button) to create a new deal or contact

---

## Phase 5: The Rolodex (Contact Management) & WhatsApp

### 5.1 — Contact List
- Searchable by name OR phone number
- Each row shows: avatar initials, name, phone, last interaction date
- Color-coded overdue indicator when past follow-up frequency
- Add contact via slide-up sheet

### 5.2 — Contact Detail View
- Contact info card at top with three prominent action buttons:
  - **WhatsApp** (primary, green) — opens `https://wa.me/{phone}` directly
  - **Call** — opens `tel:{phone}`
  - **Email** — opens `mailto:{email}`
- Activity Timeline below — chronological feed of interactions and linked deals
- Quick-action row: "Log Call", "Add Note", "Create Deal"
- Frequency setting: "Remind me every X days" slider/input

### 5.3 — Interaction Logging
- When logging an interaction, choose type: Call, WhatsApp, Meeting, Note
- Automatically updates `last_contact_date` on the contact

---

## Phase 6: Dynamic Kanban Board

### 6.1 — Kanban View
- Columns fetched dynamically from `pipeline_stages` table
- Deal cards show: title, contact name, value, due date, status color
- Drag-and-drop between columns to update stage
- "+" button on each column to quick-add a deal to that stage
- Overdue deals highlighted with a visual badge

### 6.2 — Deal Detail (Slide-out Sheet)
- Title, value, due/event date, notes, linked contact
- Stage selector dropdown
- Image gallery section (see Phase 7)
- Activity log for the deal

### 6.3 — Pipeline Settings
- Rename, reorder, add, or delete stages
- Change stage colors
- Option to create additional pipelines

---

## Phase 7: Calendar View

### 7.1 — Monthly/Weekly Calendar
- Displays deals plotted on their `due_date` or `event_date`
- Toggle between month view and week view
- Color-coded dots/blocks by stage status (e.g., green = Paid, yellow = Pending, red = Overdue)

### 7.2 — Quick Appointment Creation
- Tapping an empty date/time slot opens a pre-filled "New Deal" sheet with that date
- Select or create a contact inline
- Assign to a pipeline stage

### 7.3 — Day Detail
- Tapping a date with existing deals shows a list of that day's appointments/deals
- Each item links to the full deal detail sheet

---

## Phase 8: Deal Image Gallery & Attachments

### 8.1 — Photo Upload on Deals
- In the deal detail view, an "Add Photos" section
- Upload images from camera or gallery (mobile-optimized)
- Images stored in Supabase Storage `deal-photos` bucket
- Display as a thumbnail grid within the deal
- Tap to view full-size with lightbox

### 8.2 — Use Cases
- Barber: photo of the finished haircut
- Caterer: event setup photos
- Freelancer: project screenshots or deliverables

---

## Phase 9: Task & Re-engagement System

### 9.1 — Follow-up Alerts
- Dashboard widget shows contacts needing follow-up (frequency-based)
- Visual badge/dot on the contact in the list view
- One-tap actions:
  - **"Contacted"** — logs interaction, resets timer
  - **"Snooze 1 week"** — pushes reminder forward 7 days

### 9.2 — Deal Due Date Alerts
- Deals approaching or past due date surface on the dashboard
- Color indicators on both Kanban cards and Calendar entries

---

## Phase 10: Settings & Localization

### 10.1 — Settings Page
- **Profile:** Edit name, business name, business type
- **Language & Direction:** Switch between LTR (English) and RTL (Hebrew/Arabic) — updates `dir` attribute globally
- **Pipeline Management:** Rename/reorder/add stages
- **Account:** Change password, log out

### 10.2 — RTL Implementation Details
- Tailwind `rtl:` variant utilities for flipped padding, margins, and alignment
- Navigation, sheets, and drawers all respect text direction
- Icons that imply direction (arrows, chevrons) flip in RTL mode

---

## Build Order Summary

| Step | What Gets Built | Key Outcome |
|------|----------------|-------------|
| 1 | Auth + Database + Storage | Working login, full schema, file bucket |
| 2 | Design system + Layout shell + RTL | Navigation, theme, direction support |
| 3 | Onboarding wizard | Business type selection, auto-pipeline |
| 4 | Dashboard | Daily overview with widgets |
| 5 | Contacts + WhatsApp | Rolodex with click-to-WhatsApp |
| 6 | Kanban board | Drag-and-drop deal management |
| 7 | Calendar view | Date-based deal visualization |
| 8 | Deal photos | Image upload and gallery |
| 9 | Re-engagement system | Follow-up reminders and snooze |
| 10 | Settings + Localization | RTL toggle, pipeline config, account |

