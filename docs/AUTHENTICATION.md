# Simple Authentication Implementation

## Overview
Added simple username/password authentication to the Device Activity Tracker application. Users must login before accessing the tracker.

## Configuration

### Credentials (.env)
- **Username:** `admin`
- **Password:** `tracker123`

Edit `.env` to change credentials:
```env
AUTH_USERNAME=admin
AUTH_PASSWORD=tracker123
```

## Backend Implementation

### Authentication Endpoint
**Route:** `POST /auth/login`

Request body:
```json
{
  "username": "admin",
  "password": "tracker123"
}
```

Response (success):
```json
{
  "success": true,
  "token": "base64-encoded-token"
}
```

Response (failure):
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Socket.io Auth Middleware
Added authentication middleware to Socket.io that validates tokens:
- Requires `auth.token` in socket handshake
- Token is sent with every Socket.io connection
- Rejects unauthenticated connections

## Frontend Implementation

### Login Screen (AuthLogin.tsx)
New component that displays:
- Application branding
- Username input field
- Password input field
- Login button with loading state
- Error message display
- Demo credentials hint

Styling:
- Dark theme (slate-900 background)
- Blue accent colors
- Responsive design
- Glassmorphism effects

### App.tsx Updates
1. **New State:** `isAuthenticated` boolean tracks login status
2. **Login Handler:** `handleLogin(token)` 
   - Sets authenticated flag
   - Creates Socket.io connection with auth token
   - Initializes socket listeners
3. **Logout Handler:** `handleLogout()`
   - Clears authentication
   - Disconnects socket
   - Resets connection state
4. **Conditional Render:** Shows AuthLogin component if not authenticated
5. **Logout Button:** Red button in header to logout from app

## User Flow

1. **Initial Load** → User sees login screen
2. **Login** → User enters credentials → Submit
3. **Validation** → Backend validates credentials → Returns token
4. **Socket Connection** → Frontend connects with token
5. **Access Granted** → Dashboard loads
6. **Logout** → User clicks red LogOut button → Disconnects → Returns to login

## Security Notes

⚠️ **Current Implementation:**
- Token is simple base64 encoding (for demo purposes)
- No encryption on frontend (develop in HTTPS for production)
- Password stored in .env (use environment variables)
- Single hardcoded user

🔒 **For Production, Implement:**
- JWT tokens with signatures
- Password hashing (bcrypt/argon2)
- Token expiration/refresh
- HTTPS enforcement
- Rate limiting on /auth/login
- CORS restrictions
- Database-backed user storage

## Files Modified

1. **/.env** - Added AUTH_USERNAME and AUTH_PASSWORD
2. **/src/server.ts** - Added /auth/login endpoint and Socket.io auth middleware
3. **/client/src/App.tsx** - Added authentication logic and handlers
4. **/client/src/components/AuthLogin.tsx** - New login component

## Testing

### Test Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"tracker123"}'
```

### Test Wrong Credentials
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpass"}'
```

## Docker Deployment

If using Docker, rebuild containers:
```bash
docker-compose down
docker-compose up -d --build
```

Access at: http://localhost:3000

## Environment Variables

| Variable      | Default    | Purpose             |
| ------------- | ---------- | ------------------- |
| AUTH_USERNAME | admin      | Login username      |
| AUTH_PASSWORD | tracker123 | Login password      |
| NODE_ENV      | production | Environment         |
| BACKEND_PORT  | 3001       | Backend server port |
| CLIENT_PORT   | 3000       | Frontend port       |

## Features

✅ Simple username/password authentication
✅ Token-based socket.io auth
✅ Login screen with error handling
✅ Session-based access control
✅ Logout functionality
✅ Error messages and loading states
✅ Responsive design
✅ Dark theme UI
