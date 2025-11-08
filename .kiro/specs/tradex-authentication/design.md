# Design Document

## Overview

The TradeX Authentication System is a full-stack web application implementing secure user registration and authentication. The system uses a modern client-server architecture with a React-based frontend, Node.js/Express backend, and PostgreSQL database. The design prioritizes security, user experience, and maintainability while matching the provided visual specifications.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           React Application (SPA)                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Register Page│  │ Sign In Page │  │ Reset Page  │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────┐│ │
│  │  │         Form Validation & State Management         ││ │
│  │  └────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Server (Node.js/Express)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                      │ │
│  │  [CORS] [CSRF] [Rate Limiting] [Input Sanitization]   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Authentication Routes                                 │ │
│  │  POST /api/auth/register                              │ │
│  │  POST /api/auth/login                                 │ │
│  │  POST /api/auth/logout                                │ │
│  │  POST /api/auth/forgot-password                       │ │
│  │  POST /api/auth/reset-password                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Service Layer                                         │ │
│  │  [AuthService] [EmailService] [TokenService]          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ users table  │  │ sessions     │  │ reset_tokens │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with functional components and hooks
- React Router for navigation
- CSS Modules for styling
- Axios for HTTP requests
- Formik + Yup for form validation

**Backend:**
- Node.js 18+ with Express.js
- bcrypt for password hashing
- jsonwebtoken for session tokens
- express-validator for input validation
- helmet for security headers
- express-rate-limit for rate limiting
- nodemailer for email sending

**Database:**
- PostgreSQL 14+
- pg (node-postgres) driver

## Components and Interfaces

### Frontend Components

#### 1. App Component
Root component managing routing and global state.

```javascript
<App>
  <Router>
    <Route path="/register" component={RegisterPage} />
    <Route path="/signin" component={SignInPage} />
    <Route path="/forgot-password" component={ForgotPasswordPage} />
    <Route path="/reset-password/:token" component={ResetPasswordPage} />
  </Router>
</App>
```

#### 2. RegisterPage Component
Handles user registration with real-time validation.

**Props:** None

**State:**
- `formData: { username: string, email: string, password: string }`
- `errors: { username?: string, email?: string, password?: string }`
- `isSubmitting: boolean`
- `submitError: string | null`

**Methods:**
- `handleInputChange(field, value)`: Updates form data and triggers validation
- `validateField(field, value)`: Validates individual field
- `handleSubmit()`: Submits registration request to API

#### 3. SignInPage Component
Handles user authentication with remember me option.

**Props:** None

**State:**
- `formData: { email: string, password: string, rememberMe: boolean }`
- `errors: { email?: string, password?: string }`
- `isSubmitting: boolean`
- `submitError: string | null`

**Methods:**
- `handleInputChange(field, value)`: Updates form data
- `handleSubmit()`: Submits login request to API
- `handleRememberMeToggle()`: Toggles remember me checkbox

#### 4. FormInput Component
Reusable input component with validation feedback.

**Props:**
- `type: string`
- `name: string`
- `value: string`
- `placeholder: string`
- `icon: ReactNode`
- `error: string | null`
- `helperText: string`
- `onChange: (value: string) => void`

#### 5. Button Component
Reusable button with loading state.

**Props:**
- `text: string`
- `onClick: () => void`
- `isLoading: boolean`
- `disabled: boolean`
- `variant: 'primary' | 'secondary'`

### Backend API Endpoints

#### POST /api/auth/register
Creates a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars)",
  "email": "string (valid email)",
  "password": "string (8+ chars, 1 number, 1 symbol)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Username already taken"
}
```

#### POST /api/auth/login
Authenticates user and creates session.

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "rememberMe": "boolean"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string"
  }
}
```
Sets HTTP-only cookie: `session_token`

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### POST /api/auth/logout
Invalidates current session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/forgot-password
Initiates password reset flow.

**Request Body:**
```json
{
  "email": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /api/auth/reset-password
Resets password using token.

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Data Models

### User Model

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$'),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Session Model

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### Reset Token Model

```sql
CREATE TABLE reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_reset_tokens_user_id ON reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires_at ON reset_tokens(expires_at);
```

### Login Attempts Model (Rate Limiting)

```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  successful BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email, attempted_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, attempted_at);
```

## Error Handling

### Frontend Error Handling

**Validation Errors:**
- Display inline error messages below form fields
- Prevent form submission until all fields are valid
- Show field-specific error messages

**API Errors:**
- Network errors: "Unable to connect. Please try again."
- 400 Bad Request: Display specific validation error from server
- 401 Unauthorized: "Invalid email or password"
- 429 Too Many Requests: "Too many attempts. Please try again in 15 minutes."
- 500 Server Error: "Something went wrong. Please try again later."

**Error Display:**
- Use toast notifications for global errors
- Use inline messages for field-specific errors
- Auto-dismiss success messages after 3 seconds
- Keep error messages visible until user takes action

### Backend Error Handling

**Middleware Chain:**
1. Input validation (express-validator)
2. Sanitization (express-validator)
3. Rate limiting (express-rate-limit)
4. CSRF validation
5. Route handler
6. Error handler middleware

**Error Response Format:**
```javascript
{
  success: false,
  error: "Human-readable error message",
  code: "ERROR_CODE", // Optional error code
  details: {} // Optional additional details (dev mode only)
}
```

**Logging:**
- Log all authentication attempts (success and failure)
- Log rate limit violations
- Log server errors with stack traces
- Never log passwords or tokens

## Testing Strategy

### Frontend Testing

**Unit Tests (Jest + React Testing Library):**
- Form validation logic
- Input component rendering
- Button states (loading, disabled)
- Error message display
- Navigation between pages

**Integration Tests:**
- Complete registration flow
- Complete sign-in flow
- Form submission with API mocking
- Error handling scenarios

**E2E Tests (Cypress):**
- User can register with valid credentials
- User cannot register with duplicate username/email
- User can sign in with valid credentials
- User cannot sign in with invalid credentials
- Remember me functionality persists session
- Forgot password flow sends email

### Backend Testing

**Unit Tests (Jest):**
- Password hashing and verification
- Token generation and validation
- Input validation functions
- Email format validation
- Username format validation

**Integration Tests:**
- Registration endpoint with valid data
- Registration endpoint with duplicate username
- Registration endpoint with duplicate email
- Login endpoint with valid credentials
- Login endpoint with invalid credentials
- Rate limiting after 5 failed attempts
- Session creation and validation
- Password reset token generation
- Password reset with valid token

**Security Tests:**
- SQL injection attempts
- XSS payload attempts
- CSRF token validation
- Rate limiting effectiveness
- Password strength enforcement

### Performance Testing

- Load test: 100 concurrent registration requests
- Load test: 100 concurrent login requests
- Database query performance (< 100ms for auth queries)
- API response time (< 500ms for auth endpoints)

## Security Considerations

### Password Security
- Minimum 8 characters with complexity requirements
- bcrypt hashing with cost factor 12
- Never store or log plain text passwords
- Implement password reset, not password recovery

### Session Security
- HTTP-only cookies prevent XSS access
- Secure flag requires HTTPS
- SameSite=Strict prevents CSRF
- Short expiration (24 hours default, 30 days with remember me)
- Token rotation on sensitive operations

### Input Validation
- Whitelist validation for usernames (alphanumeric, hyphen, underscore)
- Email format validation (RFC 5322)
- Password complexity validation
- Sanitize all inputs before database queries
- Use parameterized queries (prevent SQL injection)

### Rate Limiting
- 5 failed login attempts per email per 15 minutes
- 10 registration attempts per IP per hour
- 3 password reset requests per email per hour
- Return 429 status code when limit exceeded

### CSRF Protection
- Generate CSRF token on page load
- Include token in all state-changing requests
- Validate token on server before processing
- Rotate token after authentication

### Headers
```javascript
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 1; mode=block
```

## UI/UX Design Specifications

### Color Palette
- Background: Dark blue gradient (#0a1628 to #1a2942)
- Primary button: Blue (#6b7fff)
- Primary button hover: Lighter blue (#8b9fff)
- Text primary: White (#ffffff)
- Text secondary: Light gray (#a0aec0)
- Input border: Blue (#3d5a80)
- Input border focus: Bright blue (#6b7fff)
- Error: Red (#ef4444)
- Success: Green (#10b981)

### Typography
- Font family: 'Inter', sans-serif
- Headings: Bold, 32-48px
- Body text: Regular, 14-16px
- Input labels: Medium, 14px
- Helper text: Regular, 12px

### Layout
- Max content width: 1200px
- Form max width: 400px
- Input height: 48px
- Button height: 48px
- Spacing unit: 8px (use multiples)
- Border radius: 8px (inputs), 24px (buttons)

### Responsive Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Animations
- Button hover: transform scale(1.02), transition 200ms
- Input focus: border color transition 200ms
- Page transitions: fade in 300ms
- Loading spinner: rotate 360deg, 1s linear infinite

### Accessibility
- WCAG 2.1 Level AA compliance
- Minimum contrast ratio 4.5:1 for text
- Keyboard navigation support
- ARIA labels for form inputs
- Focus indicators visible
- Error messages announced to screen readers
