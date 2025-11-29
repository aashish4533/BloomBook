# Firebase Emulators Setup

## Starting the Emulators

To start all Firebase emulators (Auth, Firestore, Storage, and UI):

```bash
cd backend
firebase emulators:start
```

Or from the root directory:

```bash
npm run start:emulators
```

## Emulator Ports

- **Auth Emulator**: http://127.0.0.1:9099
- **Firestore Emulator**: http://127.0.0.1:8080
- **Storage Emulator**: http://127.0.0.1:9199
- **Emulator UI**: http://127.0.0.1:4000

## Troubleshooting

If you see the error "The Firestore Emulator is currently not running":

1. Make sure the emulators are started before running the frontend
2. Check that ports 8080, 9099, 9199, and 4000 are not in use by other applications
3. Verify the emulator is running by visiting http://127.0.0.1:4000

## Starting Everything Together

From the root directory, you can start both emulators and frontend:

**Option 1: Start both simultaneously (recommended)**
```bash
npm start
```
The frontend will automatically connect to emulators when they're ready.

**Option 2: Start with delay (if you encounter connection issues)**
```bash
npm run start:delayed
```
This waits 5 seconds before starting the frontend to ensure emulators are fully ready.

