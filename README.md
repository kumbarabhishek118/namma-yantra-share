# Namma-Yantra Share

An agriculture machinery rental platform built for small farmers and machine owners.

## Tech Stack
- **Kotlin**: Primary language
- **Firebase Auth**: Mobile/Email authentication
- **Cloud Firestore**: Real-time database for listings and bookings
- **Material UI**: Modern, rugged agricultural design
- **MVVM Architecture**: Clean app structure

## Features
- **Farmer Dashboard**: Search and book nearby machinery.
- **Owner Dashboard**: List and manage equipment.
- **Real-Time Availability**: No double bookings.
- **Price Calculator**: Dynamic hourly and daily rates.
- **Booking Status**: Track requests from pending to completed.

## Project Structure
- `com.nammayantra.share.ui`: Activities and Fragments
- `com.nammayantra.share.data`: Models and Repositories
- `com.nammayantra.share.viewmodel`: MVVM ViewModels

## Setup Instructions
1. Download the ZIP of this project.
2. Open in **Android Studio** (Ladybug or newer).
3. Connect your own **Firebase Project** and replace `app/google-services.json`.
4. Enable **Firestore** and **Email/Phone Auth** in the Firebase Console.
5. Build and Run!
