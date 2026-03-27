# MoveO User Stories

## App Overview
MoveO is a React Native mobility application inspired by ride-hailing platforms like Uber. It allows users to search for routes, view trip details, simulate ride bookings, save trips, and receive real-time updates and reminders. The app also includes personalized settings, notifications, and persistent data storage to enhance user experience.

---

## Personas

### Persona 1: Daily Commuter
A user who frequently travels and wants quick access to routes and ride booking.

### Persona 2: Occasional Traveler
A user who uses the app occasionally and needs guidance and simple navigation.

### Persona 3: Admin
An administrator who manages app settings and notifications.

---

## Priority Legend
- High Priority → Core functionality
- Medium Priority → Enhancements
- Low Priority → Optional features

---

## 1. Login and Registration

### User Story 1
As a new user, I want to register with my name, email, and password so that I can create an account.  
- Priority: High  
- Acceptance Criteria:
  - User can input name, email, password
  - Signup button creates account successfully

### User Story 2
As a user, I want to log in using my credentials so that I can access my rides and preferences.  
- Priority: High  
- Acceptance Criteria:
  - Login with email/password
  - Redirect to home screen

### User Story 3
As a user, I want error messages for invalid input so that I know what went wrong.  
- Priority: High  
- Acceptance Criteria:
  - Show error for empty fields
  - Show error for incorrect credentials

### User Story 4
As a user, I want my login session to be saved so that I don’t need to log in every time.  
- Priority: High  
- Acceptance Criteria:
  - Session stored locally
  - Auto-login on app restart

---

## 2. Home Screen (Ride Search)

### User Story 1
As a user, I want to enter pickup and destination locations so that I can search for available rides.  
- Priority: High  
- Acceptance Criteria:
  - Input fields for pickup and destination
  - Search button available

### User Story 2
As a user, I want to see available ride options so that I can choose the best one.  
- Priority: High  
- Acceptance Criteria:
  - Display list of ride options
  - Show estimated time and price

### User Story 3
As a user, I want quick access to saved trips so that I can reuse previous routes.  
- Priority: Medium  
- Acceptance Criteria:
  - Saved trips section visible
  - Tap to reuse route

---

## 3. Detail Screen (Ride Details)

### User Story 1
As a user, I want to see detailed ride information so that I can make a decision.  
- Priority: High  
- Acceptance Criteria:
  - Show distance, time, and price estimate

### User Story 2
As a user, I want to book a ride so that I can start my trip.  
- Priority: High  
- Acceptance Criteria:
  - “Book Ride” button available
  - Confirmation message shown

### User Story 3
As a user, I want to save a ride so that I can access it later.  
- Priority: Medium  
- Acceptance Criteria:
  - Save button available
  - Ride added to saved list

---

## 4. Persistent Data

### User Story 1
As a user, I want my saved rides to persist so that I can access them anytime.  
- Priority: High  
- Acceptance Criteria:
  - Saved rides stored locally

### User Story 2
As a user, I want my preferences (theme, settings) saved so that I don’t need to reconfigure.  
- Priority: High  
- Acceptance Criteria:
  - Preferences stored locally

---

## 5. External API Integration

### User Story 1
As a user, I want to see real-time location or route suggestions so that my travel is accurate.  
- Priority: High  
- Acceptance Criteria:
  - Fetch data from external API

### User Story 2
As a user, I want to see estimated travel time and cost so that I can plan better.  
- Priority: Medium  
- Acceptance Criteria:
  - Display calculated or API-based estimates

---

## 6. Settings Menu

### User Story 1
As a user, I want to access the settings menu easily so that I can customize my app.  
- Priority: High  
- Acceptance Criteria:
  - Settings accessible from navigation/menu

### User Story 2
As a user, I want categorized settings so that navigation is easy.  
- Priority: Medium  
- Acceptance Criteria:
  - Sections like Profile, Notifications, Appearance

---

## 7. Settings Screen

### User Story 1
As a user, I want to enable dark mode so that I can use the app comfortably at night.  
- Priority: High  
- Acceptance Criteria:
  - Toggle switch for dark mode

### User Story 2
As a user, I want to manage notification preferences so that I receive relevant alerts.  
- Priority: High  
- Acceptance Criteria:
  - Toggle notifications on/off

### User Story 3
As a user, I want to update my account details so that my profile stays current.  
- Priority: Medium  
- Acceptance Criteria:
  - Edit profile functionality

---

## 8. Notifications

### User Story 1
As a user, I want to receive ride reminders so that I don’t miss my trips.  
- Priority: High  
- Acceptance Criteria:
  - Notification before trip time

### User Story 2
As a user, I want to receive ride status updates so that I stay informed.  
- Priority: Medium  
- Acceptance Criteria:
  - Notifications like “Ride booked” or “Driver arriving”

### User Story 3
As a user, I want to disable unnecessary notifications so that I avoid distractions.  
- Priority: High  
- Acceptance Criteria:
  - Toggle for promotional notifications

---

## 9. Logout

### User Story 1
As a user, I want to log out securely so that my account is protected.  
- Priority: High  
- Acceptance Criteria:
  - Logout clears session
  - Redirect to login screen

---

