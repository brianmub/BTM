# Design Guidelines: BTM Mobile App

## 1. Brand Identity

**Purpose**: Streamline church ministry training program—enrollment, cell groups, attendance, assignments, and graduation tracking.

**Aesthetic Direction**: **Bold/Striking (Sports-Inspired)**
- High contrast dark theme (black backgrounds, white text)
- Premium, energetic feel inspired by elite sports organizations
- Gold accents create VIP/achievement moments
- Stadium-entrance powerful onboarding experience
- Clear visual hierarchy with dramatic color use

**Memorable Element**: Dark, premium interface with explosive red and gold highlights that make every interaction feel significant and motivational—like joining a championship team.

---

## 2. Navigation Architecture

**Authentication**: Required (SSO with Apple/Google Sign-In)
- Role selection after first sign-in: Participant, Cell Leader, Program Admin, System Admin
- Roles require approval (cannot self-assign leader/admin)

**Root Navigation**: Tab Bar (role-dependent)

### Participant Tabs (4):
1. **Home** - Dashboard with session schedule, assignments, graduation progress
2. **Assignments** - View/submit assignments
3. **My Cell** - Cell members, facilitator contact
4. **Profile** - Settings, payment history, logout

### Cell Leader Tabs (4):
1. **Home** - Session overview, quick actions
2. **My Cell** - Member list with attendance/payment/assignment tracking
3. **Attendance** - Mark attendance and payment per session
4. **Profile** - Settings, logout

### Admin Tabs (3):
1. **Dashboard** - Aggregated program stats
2. **Reports** - Attendance, assignments, graduation lists
3. **Settings** - Role management, enrollment periods (System Admin only)

---

## 3. Screen-by-Screen Specifications

### Onboarding Flow (Stack-Only)

**Welcome Screen**
- Full-bleed image (welcome-splash.png) with dark gradient overlay
- App logo centered
- Tagline: "Train. Lead. Transform." (white, centered)
- Primary button "Enter" at bottom (full-width, red, white text)
- Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl

**Role Selection Screen**
- Black background
- Header: "Choose Your Path" (white, bold, centered)
- Three large cards (vertically stacked): Participant, Cell Leader, Admin
- Each card: red border when selected, icon, title, description (white text)
- Bottom: "Continue" button (red, white text, disabled until selection)
- Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl

**Registration Form Screen**
- Black background
- Opaque header: "Register" title, "Back" button (left), both white
- Scrollable form with white text labels, white-bordered input fields
- Fields: Full Name, Contact, Gender, Marital Status, Availability
- Submit button below form (red, white text)
- Safe area: top = Spacing.xl, bottom = insets.bottom + Spacing.xl

### Participant Home Screen
- Black background
- Transparent header: "Hi, [Name]" (left, white), notification bell icon (right, white)
- Scrollable content:
  - Graduation progress card: black surface, red progress bar, white text, gold star icon at completion milestones
  - Upcoming session card: full-bleed session image with gradient overlay, white text, gold "NEXT" badge
  - Recent assignments section: horizontal scroll of assignment cards (black surfaces, red status badges)
- Empty state: empty-sessions.png with white text "No upcoming sessions"
- Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

### Assignments Screen (Participant)
- Black background
- Default opaque header: "Assignments" (white), search icon (right, white)
- Scrollable list of assignment cards:
  - Each card: black surface, white title, gray due date, status badge (red: Late, gold: Submitted, white: Pending)
- Tap card → Assignment Detail Modal (native modal, black background)
  - Header: "Back" (left, white), assignment title (white)
  - Scrollable: white text description, due date, submission form (text/file upload)
  - Submit button at bottom (red, white text, full-width)
- Empty state: empty-assignments.png, white text "No assignments yet"
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl

### My Cell Screen (Participant)
- Black background
- Default opaque header: "My Cell" (white)
- Scrollable content:
  - Facilitator card: avatar, name (white), contact button (red outlined, white text)
  - Members grid: avatars in red circular borders, names below (white)
- Empty state: empty-cell.png, white text "You haven't been assigned to a cell yet"
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl

### Attendance Screen (Cell Leader)
- Black background
- Transparent header: session dropdown (left, white), "Save" button (right, red when enabled)
- Scrollable member list:
  - Each row: avatar, name (white), attendance checkbox (red when checked), payment checkbox (gold when checked)
- Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

### Reports Screen (Admin)
- Black background
- Default opaque header: "Reports" (white), filter icon (right, white)
- Scrollable cards (black surfaces, white text, red accent borders):
  - Attendance summary card with stats
  - Assignment completion card with percentage
  - Graduation eligibility card (tap → list)
- Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl

---

## 4. Color Palette

**Primary**: #DA291C (bold red - energy, passion)
**Accent**: #FFD700 (gold - achievement, highlight)
**Background**: #0D0D0D (near black)
**Surface**: #1A1A1A (dark surface for cards)
**Text Primary**: #FFFFFF (pure white)
**Text Secondary**: #A0A0A0 (light gray)
**Border**: #2A2A2A (subtle dark border)
**Success**: #16A34A (green)
**Warning**: #F59E0B (amber)
**Error**: #DA291C (same as primary)

---

## 5. Typography

**Primary Font**: Inter (Google Font - modern, legible, athletic)

**Type Scale**:
- H1: 32pt, Bold (screen titles)
- H2: 24pt, Bold (section headers)
- H3: 18pt, SemiBold (card titles)
- Body: 16pt, Regular (main content)
- Caption: 14pt, Regular (labels, secondary)
- Button: 16pt, Bold

---

## 6. Visual Design

- **Cards**: #1A1A1A background, 8pt radius, 1px #2A2A2A border, no shadow
- **Buttons (Primary)**: #DA291C background, white text, 8pt radius
- **Buttons (Secondary)**: Transparent background, #DA291C border, white text, 8pt radius
- **Floating Action Button**: #DA291C, white icon, 56px diameter, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- **Pressed State**: 85% opacity for all touchables
- **Icons**: Feather icons (@expo/vector-icons), 24px default size, white color
- **Progress Bar**: #DA291C filled, #2A2A2A track, 6pt height, rounded ends
- **Tab Bar**: #0D0D0D background, #DA291C active tint, #A0A0A0 inactive tint
- **Status Badges**: 4pt radius, bold text, colored backgrounds (red/gold/white)

---

## 7. Assets to Generate

1. **icon.png** - Bold BTM letters in white on #DA291C red background with subtle gold accent stripe
   - WHERE USED: Device home screen

2. **splash-icon.png** - Same as icon.png
   - WHERE USED: App launch screen

3. **welcome-splash.png** - Full-bleed dramatic photo: silhouetted crowd with raised hands (stadium entrance feel), dark vignette, #DA291C and #FFD700 light rays
   - WHERE USED: Welcome Screen (onboarding)

4. **empty-sessions.png** - Minimalist white line art of a calendar with a red star, on transparent background (for black BG)
   - WHERE USED: Participant Home Screen (no upcoming sessions)

5. **empty-assignments.png** - White outline of clipboard with red checkmark, simple geometric style
   - WHERE USED: Assignments Screen (no assignments)

6. **empty-cell.png** - White circular outline of connected people (unity symbol), red accent ring
   - WHERE USED: My Cell Screen (not assigned yet)

7. **avatar-preset-1.png** - Geometric avatar: white circle with bold red triangle pattern, gold border
   - WHERE USED: Default user avatar throughout app

All illustrations must work on black backgrounds with white/red/gold colors only. Premium, modern, sports-inspired aesthetic—not corporate or clipart.