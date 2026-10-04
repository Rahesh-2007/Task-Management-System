# Todoist Marketing Website & Team Workspace Clone

> **Educational Project**: An authentic, pixel-accurate clone of the Todoist marketing website ([todoist.com](https://www.todoist.com)) and collaborative team workspace application (`/app`), built with **React**, **Tailwind CSS**, **Framer Motion**, **chrono-node**, and **Vitest**.

---

## 🚀 Key Features

### 1. Marketing Website (`/`)
* **Cookie Banner**: Fixed bottom consent bar, "We respect your privacy", Accept & Decline actions with `localStorage` memory.
* **Header & Navigation**: Sticky header with `backdrop-filter: blur(12px)`, custom SVG logo, dropdown preview menus (Features, For Teams, Resources, Pricing), and quick "Log in" & "Start for free" CTAs.
* **Hero Section & Interactive Working Demo**:
  * Headline: *"Your trusted second brain."*
  * Subtext & badges for 30M+ users.
  * **Interactive Mini Task Manager Mockup** (pure HTML/CSS/Tailwind components):
    * Natural-language date and time parsing with `chrono-node` (*"tomorrow 4pm"*, *"every Monday"*, *"in 2 hours"*).
    * Priority flags P1–P4 with Todoist-style colors (`#D1453B`, `#EB8909`, `#246FE0`, `#808080`).
    * Checkbox completion animation with celebratory confetti and strikethrough.
    * Real-time detected NLP badge chips while typing.
    * Full `localStorage` persistence.
* **5 Signature Features Breakdown**:
  * *With you everywhere* (Multi-platform synchronization)
  * *Never miss a thing* (Tasks, subtasks, due dates & reminders)
  * *Customizable features* (Custom filters, colored labels, priorities)
  * *Understands human language* (Chrono natural language parser)
  * *Connect with your other tools* (Google Calendar, Slack, Outlook, 90+ integrations)
* **Social Proof & Reviews**:
  * Publication review cards (The Verge, PCMag Editor's Choice, TechRadar).
  * Global statistics counter (30M+ users, 2B+ completed tasks, 100k+ teams).
* **Tweet-Style Testimonials**:
  * 3-column responsive grid with avatars, verified checkmarks, original quotes, and interaction metrics.
* **Pre-footer Call-to-Action**:
  * *"Gain clarity and calm in your workday"* with primary red CTA.
* **Multi-Column Footer**:
  * Features, Solutions, Resources, Company, Download columns, language switcher dropdown, social links, and educational disclaimer notice.

---

### 2. Team Workspace App (`/app`)
* **Workspace Switcher**: Personal Workspace (`My Workspace`) vs. Collaborative Team Workspace (`Acme Product Team`).
* **5 Interactive View Modes**:
  1. **List View**: Categorized by project section, inline quick-add, overdue alert banner with a 1-click *"Reschedule all to Today"* bulk action.
  2. **Board View (Kanban)**: Responsive columns by section with drag-and-drop card movements and column creation.
  3. **Calendar View**: Full monthly and weekly interactive calendar grid with color-coded project pills and drag-and-drop date rescheduling.
  4. **Upcoming View**: 7-day horizontal timeline strip with drag-to-reschedule across days.
  5. **Team Workload Matrix**: Daily task count and capacity tracker per teammate (Alex, Sarah, David, Elena) with overload warnings (> 2 tasks/day).
* **Task Detail Modal**:
  * In-place title & rich description editing.
  * Subtask checklist with add, toggle, and delete.
  * Teammate assignee picker with role indicators.
  * Due date & time picker with live natural-language parsing input.
  * Recurrence selector (Daily, Weekdays, Weekly, Biweekly, Monthly).
  * Priority selector (P1–P4).
  * Comment threads with `@teammate` mentions.
  * Full activity audit history per project.
* **Notification Center & Reminders**: In-app notifications for overdue commitments and assignments.
* **Keyboard Shortcuts**:
  * <kbd>Q</kbd> : Quick Add Task Modal
  * <kbd>T</kbd> : Jump to Today View
  * <kbd>/</kbd> : Focus Global Search
  * <kbd>Esc</kbd> : Close open modal

---

## 🎨 Design System & Measurements

Extracted and recorded in [`/docs/design-notes.md`](file:///d:/Smt/TaskManagementSystem/docs/design-notes.md):

* **Brand Red**: `#E44332` (Hover: `#C53B2C`, Active: `#B03022`)
* **Background Colors**: Cream `#FAF8F5` (Body), White `#FFFFFF` (Surfaces), Dark `#1E1F21` (Footer)
* **Priority Palette**:
  * P1 (Urgent): `#D1453B`
  * P2 (High): `#EB8909`
  * P3 (Medium): `#246FE0`
  * P4 (Low): `#808080`
* **Typography Scale**:
  * H1 Hero: `56px` (Desktop) / `44px` (Tablet) / `36px` (Mobile)
  * H2 Section: `40px` (Desktop) / `32px` (Tablet) / `26px` (Mobile)
  * Font Family: `Inter`, system-ui sans-serif
* **Breakpoints**: Desktop (`1440px`), Tablet (`820px`), Mobile (`390px`)

---

## 📦 Getting Started & Run Instructions

### Prerequisites
* Node.js 18+ and npm

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173` to explore:
* `/` — Todoist Marketing Website
* `/app` — Collaborative Workspace App

### 3. Run Automated Tests
```bash
npx vitest run
```

### 4. Build for Production
```bash
npm run build
```

---

## 📋 Differences & Educational Attribution
* **Original Assets & Logos**: In accordance with intellectual property guidelines, custom vector SVG logos, icons, and original placeholder testimonial copy were authored.
* **Self-Contained Architecture**: All UI components, calendars, Kanban columns, and natural-language schedulers run client-side with full `localStorage` persistence without external backend dependencies.
* **Disclaimer**: *Unofficial clone for educational and portfolio demonstration purposes.*
