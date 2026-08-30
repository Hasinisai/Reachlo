# Reachlo

## Project Overview
Reachlo is a full-stack mobile application consisting of a React Native (Expo) frontend and a Python (FastAPI) backend. It leverages MySQL for database management and integrates with various external APIs (Google Maps, Gemini, HuggingFace, Ideogram) to provide AI-powered features and location services.

## Features
- AI-generated thumbnails and content
- Location-based services via Google Maps
- Secure user authentication
- Lead and Campaign management
- Image uploading and background processing

## Tech Stack
- **Frontend**: React Native, Expo, React Navigation
- **Backend**: Python 3, FastAPI, SQLAlchemy, PyMySQL
- **Database**: MySQL (TiDB)
- **External Services**: Google Maps, Gemini AI, HuggingFace, Ideogram

## Project Structure
```text
Reachlo/
├── REACHLO/                 # React Native Expo App (Frontend)
│   ├── src/                 # UI components and app logic
│   ├── App.js               # Main entry point
│   └── package.json         # Frontend dependencies
├── backend/                 # FastAPI Application (Backend)
│   ├── app/                 # Backend core logic (routers, models, schemas)
│   ├── requirements.txt     # Python dependencies
│   └── main.py              # FastAPI server entry point
├── .gitignore               # Global git ignores
└── README.md                # Project documentation
```

## Requirements
- Node.js (v18 or higher)
- npm or yarn
- Python (3.9 or higher)
- MySQL Database

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Hasinisai/Reachlo.git
   cd Reachlo
   ```

2. **Frontend Installation:**
   ```bash
   cd REACHLO
   npm install
   ```

3. **Backend Installation:**
   ```bash
   cd ../backend
   python -m venv .venv
   # Activate virtual environment (Windows):
   .venv\Scripts\activate
   # Activate virtual environment (Mac/Linux):
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

## Environment Variables

### Backend Configuration
1. Navigate to the `backend` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update the `DATABASE_URL` with your actual MySQL/TiDB connection string.
4. Fill in the required API keys (Google Maps, Gemini, etc.). **Never commit this `.env` file!**

### Frontend Configuration
1. Navigate to the `REACHLO` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update the `EXPO_PUBLIC_API_URL` to point to your computer's local IP address. 
   - **Example:** `EXPO_PUBLIC_API_URL=http://192.168.1.7:8000/api`
   - **Note:** Do NOT use `localhost` or `127.0.0.1` if you are testing on a physical mobile device, as the phone will look for the server on itself instead of your computer.

## Database Setup
1. Ensure your MySQL server is running and accessible.
2. The FastAPI backend uses SQLAlchemy `create_all()`, which will automatically create all necessary tables upon startup if they don't exist.

## Backend Setup
To start the FastAPI backend server:
```bash
cd backend
# Ensure your virtual environment is activated
python -m app.main
```
The backend will run on `http://0.0.0.0:8000`.

## Frontend Setup & Running on Android
To start the React Native application:
```bash
cd REACHLO
npx expo start --clear
```

### Physical Android Phone Setup
1. Install the **Expo Go** app from the Google Play Store on your Android device.
2. Ensure your Android phone and your computer are connected to the **SAME Wi-Fi network**.
3. Once the Metro bundler has started on your computer, a QR code will be displayed in the terminal.
4. Open the Expo Go app on your phone and select "Scan QR Code".
5. The app will build and launch on your phone.

## Network Configuration
If the mobile app cannot connect to the backend (e.g., Network Error):
- Verify your computer's local IP address (e.g., `ipconfig` on Windows or `ifconfig` on Mac/Linux).
- Ensure the `EXPO_PUBLIC_API_URL` in `REACHLO/.env` matches this IP address exactly.
- Check if your computer's Firewall is blocking port `8000`.

## Troubleshooting
- **Metro Error: "Unable to resolve VirtualView"**: This is resolved via a custom `metro.config.js` configuration in this project that disables package exports (`unstable_enablePackageExports: false`). Do not remove this config unless upgrading React Native.
- **Connection Refused**: Double-check the Wi-Fi network matches and the IP in `REACHLO/.env` is correct. You may need to restart the Expo server with `--clear` after changing the `.env`.