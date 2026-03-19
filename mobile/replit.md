# BTM - Basic Training for Ministry App

## Overview
BTM is a mobile application designed to streamline the management of ministry training programs. It handles program enrollment, cell group assignments, attendance tracking (including QR code-based check-ins), assignment management, payment processing, and graduation eligibility. The app aims to provide a comprehensive solution for participants, cell leaders, facilitators, and administrators to manage their roles within ministry training programs efficiently. Its multi-program support and role-based access control ensure a tailored experience for different user types, facilitating spiritual and leadership development.

## User Preferences
Not specified.

## System Architecture

The BTM application is a React Native (Expo) mobile client interacting with an Express.js backend.

### UI/UX Decisions
- **Color Scheme**: Primary: #DC2626 (Bold Red), Accent: #991B1B (Deep Red), Background: #FFFFFF (White), Text: #1A1A1A (Near Black), Text Secondary: #6B6B6B, Success: #16A34A, Error: #DC2626.
- **Typography**: Headings use bold fonts (28/22/18/16pt), Body text is regular 16pt, and small text is regular 14pt.
- **Role-Based Navigation**: The application features distinct navigation flows and screens tailored to each user role (Participant, Cell Leader, Facilitator, Program Admin, System Admin).

### Technical Implementations
- **Frontend**: Developed with React Native using Expo for cross-platform compatibility.
- **Backend**: Implemented using Express.js, providing a RESTful API for all data operations.
- **Authentication**: User authentication state is managed via `AuthContext.tsx`.
- **Local Storage**: AsyncStorage is utilized for local persistence of user profiles, authentication state, program details, session info, attendance, payment records, and enrollment status.
- **Push Notifications**: Integrated using `expo-notifications` for various alerts and reminders (session, assignment, attendance, cell assignment, leader approval, payment, graduation).
- **QR Code System**: Implemented for attendance tracking (check-in/check-out) with entry and exit time recording. Leaders/Admins can display QR codes, and participants scan them.
- **File Uploads**: Supports attachment of documents and media (PDF, Word, text, images, videos) to assignment submissions, leveraging `expo-document-picker` and `expo-image-picker`. Files are stored on the server using `multer`.
- **Auto Cell Assignment**: A backend algorithm balances married/unmarried participants evenly across cells after enrollment closes.

### Feature Specifications
- **Multi-Program Support**: Users can enroll in multiple programs with defined enrollment periods.
- **Onboarding Flow**: Guides new users through role selection, program selection, and registration.
- **Attendance Tracking**: QR code-based system records entry and exit times. Leaders confirm attendance for graduation eligibility.
- **Payment Tracking**: Session-based payment recording by cell leaders with options for 'PAID', 'UNPAID' (with reason), and 'WAIVE'. Bulk actions are available.
- **Graduation Eligibility**: Requires 5+ confirmed sessions with paid/waived payments and all assignments submitted/confirmed.
- **Assignment Management**: Participants submit assignments; leaders review and confirm them. Facilitators create and manage assignments.
- **Leader Approval Workflow**: New cell leaders undergo an approval process by System Administrators.
- **Audit Logging**: Critical actions within the system are logged for accountability.
- **Profile Settings**: Comprehensive settings for account management, payment history, notification preferences, and help/support.

### System Design Choices
- **Modular Project Structure**: Organized into `client/` and `server/` directories, with clear separation of components, contexts, hooks, and utilities in the client.
- **API-centric Data Flow**: All database operations are handled through the REST API, ensuring a centralized and secure data access layer.

## External Dependencies
- **Supabase PostgreSQL**: Used as the primary production database for data persistence.
- **React Native (Expo)**: The framework for mobile application development.
- **Express.js**: The framework for the backend REST API server.
- **expo-notifications**: For managing and sending push notifications.
- **expo-document-picker**: For enabling document uploads in assignment submissions.
- **expo-image-picker**: For enabling image/video uploads in assignment submissions.
- **multer**: Server-side middleware for handling file uploads.