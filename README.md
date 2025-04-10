# AeroAid - Crowdsourced Emergency Response with Drones

AeroAid is a web application that connects emergency situations with nearby drone operators for rapid response and search operations.

## Features

- User authentication and profile management
- Emergency request creation with location tracking
- Real-time notification of nearby drone operators
- Search area assignment for efficient coverage
- Live drone location tracking
- Finding reporting with location data
- Historical emergency data logging

## Tech Stack

- Frontend: React.js with Tailwind CSS
- Backend: Firebase (Authentication, Firestore, Cloud Messaging)
- Maps: Leaflet.js integration

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/aeroaid.git
   cd aeroaid
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Set up Firebase Cloud Messaging

4. Configure Firebase:
   - Update the Firebase configuration in `src/services/firebase.js`
   - Update the Firebase configuration in `public/firebase-messaging-sw.js`
   - Generate and add your VAPID key for web push notifications

5. Start the development server:
   ```
   npm start
   ```

### Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy
   ```

## Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
  - `/contexts` - React context for state management
  - `/pages` - Main application pages
  - `/services` - Firebase and API services
  - `/utils` - Utility functions

## Future Enhancements

- Drone API integration for direct control
- Real-time video streaming from drones
- AI-powered object detection for search operations
- Mobile app version with native device capabilities
- Integration with emergency services API