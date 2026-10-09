# MyPlan — Modern Mobile Productivity & Reminder App

> **"Plan Today. Build a Better Tomorrow."**

A complete, production-ready personal daily planner and reminder mobile application built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Crafted to match the modern, minimal, premium reference UI down to pixel details, spacing, typography, gradients, animations, and sound effects.

---

## 📱 Visual Reference & Screen Walkthrough

| Screen | Description | Features Implemented |
|---|---|---|
| **1. Splash Screen** | Deep blue gradient background (`#1C7DF8` → `#0A57D1`), soft wave SVG curves, white rounded logo card with checkmark. | Auto-transitions to onboarding after 2.4s or tap to continue. |
| **2. Onboarding Screen** | "Stay on Track", clipboard/calendar & bell illustration, pagination dots. | "Get Started" and "Skip" action buttons. |
| **3. Home Screen** | "Good Morning, Prince 👋", horizontal date selector (Mon 29 - Fri 3), "Today's Tasks", dynamic 3/5 progress bar. | Interactive task checkboxes, category color dots, time displays, "+ Add Task" button, and Bottom Navigation. |
| **4. Add Task** | Title, Description, Date, Time, Repeat, Reminder, Category pills, Notes. | Full validation, sub-pickers for repeat/reminder intervals, category selection. |
| **5. Calendar View** | Monthly calendar matrix (`< October 2026 >`), weekday headers, active date circle, task indicator dots. | Selecting any day filters and displays tasks scheduled for that specific date. |
| **6. Task Details** | Category icon header, "Mark as Completed" toggle, metadata list, in-place edit mode, and delete confirmation dialog. | Sound chimes, confetti effects, and reminder test button. |
| **7. Settings** | Morning Summary toggle & time picker (07:00 AM), Night Reminder toggle & time picker (09:30 PM), Default Reminder, Dark Mode, Sound toggle, Backup & Sync. | Full persistence, browser push notification permission request. |
| **8. Category Management** | Default categories (Study, College, Work, Personal, Health, Other) + custom category creator. | Add new category, color palette picker, rename, and delete custom categories. |
| **9. Night Review** | Dark translucent card with glowing crescent moon 🌙, lists incomplete tasks with checkboxes. | Quick action buttons: `[30 minutes later]`, `[1 hour later]`, `[Tomorrow]`, `[Custom Time]`. Automatically reschedules tasks. |
| **10. Morning Notification** | Lock screen simulation (7:00 AM, Thu 2 Oct, dawn mountain wallpaper). | Generates morning task overview notification in Hindi/English ("Aaj ke 5 tasks hain: • 9:00 — College Assignment..."). |
| **11. Night Notification** | Lock screen simulation (9:30 PM, Thu 2 Oct, starry night wallpaper with moon). | Shows pending task alert ("You have 2 tasks pending today. Do you want to set a reminder?"), with `[Set Reminder]` and `[Later]` buttons. |
| **📊 Stats Screen** | Productivity score, 4-day streak flame, 2x2 metric cards (Today, This Week, Pending, Success Rate), weekly bar chart, and category progress bars. | Calculates statistics dynamically across all tasks. |

---

## 🔔 Notification & Audio Architecture

1. **Morning Summary (7:00 AM)**:
   - Scans today's schedule and delivers a morning digest with scheduled times and task names.
   - If empty: *"Good Morning! You have no tasks planned for today."*
2. **Night Review (9:30 PM)**:
   - Scans pending/incomplete tasks at the user's night reminder time.
   - If pending tasks remain: Prompts with options to reschedule for 30m, 1h, tomorrow, or custom time.
   - If all completed: *"Great job! All today's tasks are completed."*
3. **Task-Specific Reminders**:
   - Customizable per task (*At time of task, 5 min, 10 min, 15 min, 30 min, 1 hour, or Custom*).
4. **Web Notifications API**:
   - Requests native OS/browser notification permission with graceful fallback to in-app banners.
5. **Tactile Sound Synthesis (Web Audio API)**:
   - Melodic C5-E5-G5 task completion chime.
   - Elegant notification ping for alerts.
   - Subtle tactile tap sound.
   - Toggleable in Settings or top frame toolbar.

---

## 🗄️ Database & Supabase Integration

The app includes both:
1. **Instant Offline/Local Mode**: Uses reactive state synchronized to `localStorage` so the application runs immediately without requiring external database provisioning.
2. **Supabase PostgreSQL Integration**:
   - Connect via `.env` variables or through the **Backup & Sync / Supabase Config modal** inside the app.
   - Full PostgreSQL schema with **Row Level Security (RLS)** is provided in `supabase/schema.sql`.

### Supabase Tables:
- `tasks`: Task entity with user scoping, recurrence, and reminders.
- `categories`: User categories and default color schemes.
- `user_settings`: User notification preferences, times, and dark mode.

### Running SQL Schema in Supabase:
1. Navigate to the SQL Editor in your Supabase Dashboard.
2. Copy and execute the contents of `supabase/schema.sql`.
3. Obtain your **Project URL** and **Anon Public Key**.
4. Set them in `.env` or click on the avatar in the app to paste them directly.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will run at `http://localhost:5173/`.
