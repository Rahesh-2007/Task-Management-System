# Todoist Design Notes & Design System Specification

## 1. Overview & Brand Identity
* **Product**: Todoist Clone (Educational / Learning Project)
* **Design Philosophy**: Minimalist, high contrast, warm cream background, signature crimson red CTA, micro-interactions, clean sans-serif typography, WCAG AA contrast compliance.

---

## 2. Color System (Computed Styles)

### Primary Brand Palette
| Token | Hex / Value | Description & State |
|---|---|---|
| `--color-brand-red` | `#E44332` | Signature Todoist brand red (Buttons, Highlights) |
| `--color-brand-red-hover` | `#C53B2C` | Primary button hover state |
| `--color-brand-red-active` | `#B03022` | Primary button active / pressed state |
| `--color-brand-red-light` | `#FDF3F2` | Tinted icon containers, notification backgrounds |
| `--color-brand-red-border` | `#FADCD8` | Subtle border for red highlights |

### Neutral Palette
| Token | Hex / Value | Description & State |
|---|---|---|
| `--color-bg-cream` | `#FAF8F5` | Page body background (warm off-white) |
| `--color-bg-white` | `#FFFFFF` | Card surfaces, hero mockup, modals, inputs |
| `--color-bg-dark` | `#1E1F21` | Dark surfaces, footer background |
| `--color-text-primary` | `#1E1F21` | Headings, primary body copy |
| `--color-text-secondary` | `#555555` | Subtitles, helper text, muted labels |
| `--color-text-tertiary` | `#808080` | Placeholders, inactive icons, timestamps |
| `--color-text-inverted` | `#FFFFFF` | Text on red buttons and dark backgrounds |
| `--color-border-subtle` | `#EEEEEE` | Dividers, card borders, section separators |
| `--color-border-medium` | `#E0E0E0` | Input borders, sidebar borders |
| `--color-focus-ring` | `#E44332` | 2px focus ring on interactive elements |

### Priority Colors (P1 - P4)
| Priority | Hex | Label | Description |
|---|---|---|---|
| **P1** | `#D1453B` | Priority 1 (Urgent) | Red flag & checkbox border |
| **P2** | `#EB8909` | Priority 2 (High) | Orange flag & checkbox border |
| **P3** | `#246FE0` | Priority 3 (Medium) | Blue flag & checkbox border |
| **P4** | `#808080` | Priority 4 (Low / None) | Grey flag & subtle checkbox border |

---

## 3. Typography Scale & Fonts

* **Font Stack**:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  ```

### Responsive Hierarchy Table

| Element | Desktop (1440px) | Tablet (820px) | Mobile (390px) | Weight | Line Height | Tracking |
|---|---|---|---|---|---|---|
| **Hero H1** | `56px` (3.5rem) | `44px` (2.75rem) | `36px` (2.25rem) | `800` (Extra Bold) | `1.1` | `-0.025em` |
| **Section H2** | `40px` (2.5rem) | `32px` (2rem) | `26px` (1.625rem) | `700` (Bold) | `1.2` | `-0.02em` |
| **Feature H3** | `22px` (1.375rem) | `20px` (1.25rem) | `18px` (1.125rem) | `600` (Semi Bold) | `1.3` | `-0.01em` |
| **Hero Subtext** | `20px` (1.25rem) | `18px` (1.125rem) | `16px` (1rem) | `400` (Regular) | `1.5` | `normal` |
| **Body Standard**| `16px` (1rem) | `15px` (0.9375rem) | `15px` (0.9375rem) | `400` (Regular) | `1.6` | `normal` |
| **Navigation Link** | `15px` (0.9375rem) | `15px` | `16px` | `500` (Medium) | `1.0` | `normal` |
| **CTA Buttons** | `16px` (1rem) | `15px` | `15px` | `600` (Semi Bold) | `1.0` | `normal` |
| **Badge / Caption** | `13px` (0.8125rem) | `12px` | `12px` | `600` (Semi Bold) | `1.4` | `0.02em` |

---

## 4. Spacing, Radii, and Elevation

### Container & Layout Max Widths
* **Max Page Container**: `1200px` (`max-w-6xl` or `max-w-7xl` with `mx-auto px-4 sm:px-6 lg:px-8`)
* **Hero Content Max Width**: `780px`
* **Section Padding Y**:
  * Desktop (1440px): `96px` – `112px` (`py-24` to `py-28`)
  * Tablet (820px): `64px` – `80px` (`py-16` to `py-20`)
  * Mobile (390px): `48px` – `56px` (`py-12` to `py-14`)

### Border Radii
* **Inputs & Buttons**: `8px` (`rounded-lg`)
* **Cards & Feature Boxes**: `16px` (`rounded-2xl`)
* **Mockups & Banners**: `20px` – `24px` (`rounded-3xl`)
* **Pills & Badges**: `9999px` (`rounded-full`)

### Box Shadows
* **Subtle Card**: `0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)`
* **Hover Card**: `0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)`
* **Hero Mockup Elevated**: `0 20px 50px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)`
* **Sticky Header Glass**: `0 1px 3px rgba(0, 0, 0, 0.05)` with `backdrop-filter: blur(12px)`

---

## 5. Header, Navigation & Interactions

* **Header State**:
  * Fixed / Sticky at top (`top-0 z-50`)
  * Background: `rgba(250, 248, 245, 0.88)` on scroll with blur, `rgba(250, 248, 245, 1)` initial
  * Height: `72px` (Desktop), `60px` (Mobile)
  * Left: Custom SVG Logo + Wordmark
  * Center: Links (`Features`, `For Teams`, `Resources`, `Pricing`) with smooth hover underlines and dropdown triggers
  * Right: "Log in" ghost link + Red "Start for free" CTA button
* **Mobile Menu**:
  * Hamburger icon with animated transition to close (`X`)
  * Slide-down sheet with full navigation list and auth action buttons

---

## 6. Hero Mini Task Manager (Working Demo Specifications)
* **HTML/CSS Components**: Authentic Todoist client representation without external image dependence.
* **Layout**: Left sidebar (Inbox, Today, Upcoming, Projects) + Main Today task stream + Task input bar.
* **Natural Language Parsing**: `chrono-node` integration (`"tomorrow 4pm"`, `"every Monday"`, `"in 2 hours"`).
* **Priorities**: Quick priority picker (P1, P2, P3, P4) with signature colored dots/flags.
* **Interaction**: Checkbox with ripple & checkmark strike-through animation, task completion celebration sound/confetti option, local storage sync.

---

## 7. App Route (/app) Team Workspace Specifications
* **Workspaces**: Personal Workspace & Team Workspace switcher.
* **Views**:
  1. **List View**: Categorized by section, expandable, inline task add.
  2. **Board View (Kanban)**: Drag-and-drop columns by section.
  3. **Calendar View**: Interactive month & week grid with drag-to-reschedule.
  4. **Team Workload View**: Per-teammate task count and overload indicators.
  5. **Upcoming View**: Day timeline with drag-and-drop between days.
* **Task Detail Modal**: Subtasks, natural language due date picker, recurrence selector, priority, assignees, comments thread with `@mentions`, and full activity log.
* **Shortcuts**: `Q` for Quick Task Add, `T` for jump to Today, `/` for search filter.
