# Security Enhancements Design Document

## Overview

This design document outlines the implementation of comprehensive security enhancements for the TradeX trading platform. The enhancements include Two-Factor Authentication (2FA) using TOTP, enhanced session management with device tracking, granular API rate limiting, and comprehensive audit logging. These features work together to provide defense-in-depth security, protecting user accounts and system integrity from unauthorized access, abuse, and security threats.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 2FA Setup UI │  │ Session Mgmt │  │ Security     │      │
│  │              │  │ Dashboard    │  │ Settings     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Middleware Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Rate Limiter │  │ Auth + 2FA   │  │ Audit Logger │      │
│  │ Middleware   │  │ Middleware   │  │ Middleware   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 2FA Service  │  │ Session      │  │ Audit        │      │
│  │              │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 2FA Repo     │  │ Session Repo │  │ Audit Repo   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ user_2fa     │  │ sessions     │  │ audit_logs   │      │
│  │ backup_codes │  │ rate_limits  │  │ ip_blocks    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Security Flow

1. **Authentication Flow with 2FA**:
   - User provides credentials → Password verification → 2FA check → TOTP validation → Session creation → Audit log

2. **Request Processing Flow**:
   - Request → Rate limit check → Authentication → Authorization → Audit log → Business logic → Response

3. **Session Management Flow**:
   - Session creation → Device fingerprinting → IP tracking → Activity monitoring → Timeout management → Cleanup

## Components and Interfaces

### 1. Two-Factor Authentication Service

**Purpose**: Manages TOTP-based 2FA setup, verification, and recovery codes.

**Dependencies**:
- `speakeasy` library for TOTP generation and verification
- `qrcode` library for QR code generation
- `crypto` module for secure random generation

**Interface**:
```javascript
class TwoFactorService {
  // Generate 2FA secret and QR code
  async generateSecret(userId, email)
  
  // Verify TOTP code
  async verifyToken(userId, token)
  
  // Enable 2FA for user
  async enable2FA(userId, secret, verificationToken)
  
  // Disable 2FA for user
  async disable2FA(userId, password, token)
  
  // Generate backup recovery codes
  async generateBackupCodes(userId)
  
  // Verify backup code
  async verifyBackupCode(userId, code)
  
  // Check if user has 2FA enabled
  async is2FAEnabled(userId)
}
```

### 2. Enhanced Session Service

**Purpose**: Manages user sessions with device tracking, IP monitoring, and automatic expiration.

**Interface**:
```javascript
class SessionService {
  // Create new session with device fingerprint
  async createSession(userId, ipAddress, userAgent, rememberMe)
  
  // Get all active sessions for user
  async getUserSessions(userId)
  
  // Terminate specific session
  async terminateSession(sessionId, userId)
  
  // Terminate all sessions except current
  async terminateOtherSessions(currentSessionId, userId)
  
  // Update session activity
  async updateSessionActivity(sessionId)
  
  // Check for suspicious session activity
  async detectSuspiciousActivity(sessionId, newIpAddress)
  
  // Clean up expired sessions
  async cleanupExpiredSessions()
  
  // Get session details
  async getSessionDetails(sessionId)
}
```

### 3. Rate Limiting Service

**Purpose**: Implements granular rate limiting for different endpoint categories.

**Interface**:
```javascript
class RateLimitService {
  // Check rate limit for endpoint
  async checkRateLimit(identifier, endpoint, category)
  
  // Increment rate limit counter
  async incrementCounter(identifier, endpoint, category)
  
  // Get rate limit status
  async getRateLimitStatus(identifier, endpoint)
  
  // Block IP address temporarily
  async blockIP(ipAddress, duration, reason)
  
  // Check if IP is blocked
  async isIPBlocked(ipAddress)
  
  // Get rate limit statistics
  async getRateLimitStats(timeRange)
}
```

### 4. Audit Logging Service

**Purpose**: Records all security-relevant events in an immutable audit trail.

**Interface**:
```javascript
class AuditService {
  // Log authentication event
  async logAuthEvent(userId, action, result, metadata)
  
  // Log account change
  async logAccountChange(userId, changeType, oldValue, newValue)
  
  // Log trading operation
  async logTradingOperation(userId, operation, details)
  
  // Log security event
  async logSecurityEvent(severity, eventType, details)
  
  // Query audit logs
  async queryLogs(filters)
  
  // Export audit logs
  async exportLogs(filters, format)
  
  // Archive old logs
  async archiveLogs(olderThan)
}
```

### 5. Security Monitoring Service

**Purpose**: Detects and responds to suspicious security patterns.

**Interface**:
```javascript
class SecurityMonitoringService {
  // Detect brute force attempts
  async detectBruteForce(identifier, timeWindow)
  
  // Detect unusual location
  async detectUnusualLocation(userId, ipAddress)
  
  // Detect unusual API patterns
  async detectUnusualAPIUsage(userId, endpoint, frequency)
  
  // Lock account temporarily
  async lockAccount(userId, reason, duration)
  
  // Send security alert
  async sendSecurityAlert(userId, alertType, details)
}
```

## Data Models

### user_2fa Table
```sql
CREATE TABLE user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMP,
  backup_codes_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### backup_codes Table
```sql
CREATE TABLE backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_backup_codes_user_id (user_id),
  INDEX idx_backup_codes_code_hash (code_hash)
);
```

### Enhanced sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET NOT NULL,
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_token_hash (token_hash),
  INDEX idx_sessions_expires_at (expires_at)
);
```

### rate_limits Table
```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint_category VARCHAR(50) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rate_limits_identifier (identifier),
  INDEX idx_rate_limits_window (window_end)
);
```

### ip_blocks Table
```sql
CREATE TABLE ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_by VARCHAR(50),
  INDEX idx_ip_blocks_ip (ip_address),
  INDEX idx_ip_blocks_expires (expires_at)
);
```

### audit_logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_id UUID,
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  action TEXT NOT NULL,
  resource_type VARCHAR(50),
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  result VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_user_id (user_id),
  INDEX idx_audit_logs_event_type (event_type),
  INDEX idx_audit_logs_created_at (created_at),
  INDEX idx_audit_logs_severity (severity)
);
```

### security_alerts Table
```sql
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_alerts_user_id (user_id),
  INDEX idx_security_alerts_created_at (created_at)
);
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Two-Factor Authentication Properties

**Property 1: 2FA secret generation uniqueness**
*For any* user enabling 2FA, the system should generate a unique secret key and return a valid QR code data URL that can be scanned by authenticator apps.
**Validates: Requirements 1.1**

**Property 2: 2FA activation requires verification**
*For any* user with a generated 2FA secret, the 2FA enabled flag should remain false until a valid TOTP code is successfully verified.
**Validates: Requirements 1.2**

**Property 3: Backup codes generation on verification**
*For any* user successfully verifying their initial TOTP code, the system should generate and return a set of backup recovery codes that are stored in the database.
**Validates: Requirements 1.3**

**Property 4: 2FA enforcement on login**
*For any* user with 2FA enabled, authentication should fail when only password is provided, and succeed only when both valid password and valid TOTP code are provided.
**Validates: Requirements 1.4**

**Property 5: Invalid TOTP rejection and counter increment**
*For any* authentication attempt with an invalid TOTP code, the system should reject the attempt and increment the failed attempt counter.
**Validates: Requirements 1.5**

**Property 6: Backup code authentication**
*For any* user with 2FA enabled who has lost access to their authenticator app, a valid unused backup recovery code should allow successful authentication.
**Validates: Requirements 2.1**

**Property 7: Backup code single-use enforcement**
*For any* backup recovery code that is successfully used for authentication, that specific code should be marked as used and subsequent authentication attempts with the same code should fail.
**Validates: Requirements 2.2**

**Property 8: 2FA disable requires authentication**
*For any* user attempting to disable 2FA, the operation should fail unless both current password and valid TOTP code are provided.
**Validates: Requirements 2.3**

**Property 9: 2FA status visibility**
*For any* user viewing their security settings, the API response should include the current 2FA enabled status and the timestamp when it was last enabled.
**Validates: Requirements 2.4**

**Property 10: Backup code regeneration invalidates old codes**
*For any* user regenerating backup codes, all previously generated backup codes should be invalidated and new codes should be generated, such that old codes fail authentication and new codes succeed.
**Validates: Requirements 2.5**

### Session Management Properties

**Property 11: Session creation with complete metadata**
*For any* successful authentication, the created session should include a unique identifier, device fingerprint, IP address, user agent, and timestamp.
**Validates: Requirements 3.1**

**Property 12: Automatic session expiration**
*For any* session with last_activity timestamp older than 30 minutes, the session should be considered expired and authentication attempts using that session should fail.
**Validates: Requirements 3.2**

**Property 13: Session list completeness**
*For any* user viewing their active sessions, the response should include all current non-expired sessions with device type, location, IP address, and last activity timestamp for each session.
**Validates: Requirements 3.3**

**Property 14: Session termination effectiveness**
*For any* session that is terminated by a user, subsequent authentication attempts using that session's token should immediately fail with an invalid session error.
**Validates: Requirements 3.4**

**Property 15: Logout session cleanup**
*For any* user signing out, the current session should be deleted from the database and the session token should be invalidated.
**Validates: Requirements 3.5**

**Property 16: Bulk session termination preservation**
*For any* user terminating all other sessions, all sessions except the current one should be invalidated, and the current session should remain active and functional.
**Validates: Requirements 4.2**

**Property 17: IP change detection and logging**
*For any* session accessed from a different IP address than the original, the system should update the session record with the new IP and create an audit log entry documenting the change.
**Validates: Requirements 4.3**

**Property 18: Password change session invalidation**
*For any* user changing their password, all existing sessions except the current one should be invalidated, requiring re-authentication on other devices.
**Validates: Requirements 4.4**

**Property 19: Concurrent session limit enforcement**
*For any* user with 5 active sessions, creating a new (6th) session should automatically terminate the oldest session, maintaining a maximum of 5 concurrent sessions.
**Validates: Requirements 4.5**

### Rate Limiting Properties

**Property 20: Authentication endpoint rate limiting**
*For any* IP address making requests to authentication endpoints, the 6th request within a 15-minute window should return HTTP 429 status code.
**Validates: Requirements 5.1**

**Property 21: General API rate limiting**
*For any* authenticated user making requests to general API endpoints, the 101st request within a 1-minute window should return HTTP 429 status code.
**Validates: Requirements 5.2**

**Property 22: Rate limit response format**
*For any* request that exceeds the rate limit, the response should have HTTP status 429 and include a retry-after header indicating when requests can resume.
**Validates: Requirements 5.3**

**Property 23: Rate limit violation logging**
*For any* request that exceeds the rate limit, an audit log entry should be created containing the IP address, user identifier (if authenticated), endpoint, and timestamp.
**Validates: Requirements 5.4**

**Property 24: Rate limit counter reset**
*For any* rate limit counter that has exceeded its time window, subsequent requests should be allowed to proceed normally as if starting a new window.
**Validates: Requirements 5.5**

**Property 25: Trading endpoint rate limiting**
*For any* authenticated user making requests to trading endpoints, the 11th request within a 1-minute window should return HTTP 429 status code.
**Validates: Requirements 6.1**

**Property 26: Market data endpoint rate limiting**
*For any* authenticated user making requests to market data endpoints, the 61st request within a 1-minute window should return HTTP 429 status code.
**Validates: Requirements 6.2**

**Property 27: Account management endpoint rate limiting**
*For any* authenticated user making requests to account management endpoints, the 21st request within a 1-hour window should return HTTP 429 status code.
**Validates: Requirements 6.3**

**Property 28: Automatic IP blocking on repeated violations**
*For any* IP address that exceeds rate limits multiple times (e.g., 3 violations within 10 minutes), the system should automatically block that IP for 1 hour.
**Validates: Requirements 6.4**

**Property 29: Rate limiting metrics availability**
*For any* administrator querying rate limiting metrics, the response should include statistics aggregated by endpoint and user, showing rate limit hit counts.
**Validates: Requirements 6.5**

### Audit Logging Properties

**Property 30: Authentication event logging completeness**
*For any* authentication action (login, logout, 2FA verification), an audit log entry should be created containing timestamp, user ID, action type, IP address, and result (success/failure).
**Validates: Requirements 7.1**

**Property 31: Account change logging with before/after values**
*For any* account setting modification, an audit log entry should be created containing both the old value and new value of the changed setting.
**Validates: Requirements 7.2**

**Property 32: Trading operation logging**
*For any* trading operation performed by a user, an audit log entry should be created containing all transaction details including asset, quantity, price, and timestamp.
**Validates: Requirements 7.3**

**Property 33: Security event severity logging**
*For any* security event (failed login, suspicious activity, etc.), an audit log entry should be created with a severity level field (low, medium, high, critical).
**Validates: Requirements 7.4**

**Property 34: Audit log immutability**
*For any* audit log entry created in the database, the entry should not be modifiable or deletable through normal application operations (enforced by database constraints).
**Validates: Requirements 7.5**

**Property 35: Audit log query filtering**
*For any* administrator querying audit logs, the query API should accept and correctly apply filters for user ID, date range, action type, and severity level.
**Validates: Requirements 8.1**

**Property 36: Audit log archival**
*For any* audit logs older than 90 days, the archival function should move them to long-term storage while maintaining the ability to query and retrieve them.
**Validates: Requirements 8.2**

**Property 37: Audit log export formats**
*For any* administrator exporting audit logs, the system should generate valid output in the requested format (JSON or CSV) containing all log entries matching the filter criteria.
**Validates: Requirements 8.3**

**Property 38: Request ID correlation**
*For any* audit log entry created, the entry should include a request_id field that can be used to correlate related events across distributed system components.
**Validates: Requirements 8.4**

**Property 39: Critical event severity flagging**
*For any* critical security event (account compromise, privilege escalation, etc.), the audit log entry should have severity set to 'high' or 'critical' for immediate administrator attention.
**Validates: Requirements 8.5**

### Security Monitoring Properties

**Property 40: Account locking on failed attempts**
*For any* user account with N consecutive failed login attempts (e.g., N=5) within a time window, the account should be temporarily locked and a notification should be sent to the user.
**Validates: Requirements 9.1**

**Property 41: New location detection**
*For any* successful login from a geographic location not previously associated with the user account, a security alert should be created and logged.
**Validates: Requirements 9.2**

**Property 42: Unusual API pattern flagging**
*For any* API usage pattern that deviates significantly from the user's historical behavior, the activity should be flagged in audit logs with appropriate metadata.
**Validates: Requirements 9.3**

**Property 43: Privileged operation elevated logging**
*For any* privileged operation (admin actions, account deletion, etc.), the audit log entry should have severity level set to at least 'high'.
**Validates: Requirements 9.4**

**Property 44: Adaptive rate limiting on brute force**
*For any* IP address detected as performing brute force attacks, the rate limit for that IP should be automatically reduced (e.g., from 5 to 2 attempts per window).
**Validates: Requirements 9.5**

### Data Protection Properties

**Property 45: Sensitive data exclusion from logs**
*For any* audit log entry related to authentication, the log should not contain password values, TOTP codes, or other sensitive credentials.
**Validates: Requirements 10.1**

**Property 46: Session data encryption**
*For any* session stored in the database, sensitive attributes (such as device fingerprint or location data) should be encrypted at rest.
**Validates: Requirements 10.2**

**Property 47: API parameter redaction**
*For any* audit log entry containing API request details, sensitive parameters (API keys, tokens, passwords) should be redacted or masked.
**Validates: Requirements 10.3**

**Property 48: Audit log retention enforcement**
*For any* audit logs older than the configured retention period, the system should automatically delete them according to the data retention policy.
**Validates: Requirements 10.4**

**Property 49: Audit access auditing**
*For any* administrator accessing audit logs, a new audit log entry should be created documenting the administrator's identity, timestamp, and query parameters.
**Validates: Requirements 10.5**

## Error Handling

### 2FA Error Scenarios

1. **Invalid TOTP Code**: Return clear error message indicating code is invalid or expired
2. **2FA Not Enabled**: Prevent 2FA verification attempts when 2FA is not enabled for the account
3. **Backup Code Already Used**: Return specific error when attempting to reuse a backup code
4. **QR Code Generation Failure**: Gracefully handle QR code generation errors with fallback to manual secret entry

### Session Error Scenarios

1. **Expired Session**: Return 401 with clear message prompting re-authentication
2. **Invalid Session Token**: Return 401 for tampered or non-existent session tokens
3. **Session Limit Exceeded**: Automatically clean up oldest sessions when limit is reached
4. **Concurrent Session Conflict**: Handle race conditions in session creation/deletion

### Rate Limiting Error Scenarios

1. **Rate Limit Exceeded**: Return 429 with retry-after header and remaining time
2. **IP Blocked**: Return 403 with clear message about temporary block and duration
3. **Rate Limit Storage Failure**: Fail open (allow request) rather than fail closed to prevent service disruption

### Audit Logging Error Scenarios

1. **Log Write Failure**: Queue failed log writes for retry, never block main request flow
2. **Storage Full**: Implement log rotation and archival before storage limits are reached
3. **Query Timeout**: Implement pagination and time-based partitioning for large log queries

## Testing Strategy

### Unit Testing

Unit tests will verify individual components and functions:

- **2FA Service Tests**: Test secret generation, TOTP verification, backup code management
- **Session Service Tests**: Test session creation, expiration logic, termination
- **Rate Limit Service Tests**: Test counter increment, limit checking, reset logic
- **Audit Service Tests**: Test log creation, querying, filtering, export
- **Security Monitoring Tests**: Test detection algorithms, alert generation

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using the `fast-check` library for JavaScript. Each test will run a minimum of 100 iterations with randomly generated inputs.

**2FA Properties**:
- Generate random user IDs and verify secret uniqueness
- Generate random TOTP codes and verify validation logic
- Generate random backup codes and verify single-use enforcement

**Session Properties**:
- Generate random session data and verify metadata completeness
- Generate random timestamps and verify expiration logic
- Generate random IP addresses and verify change detection

**Rate Limiting Properties**:
- Generate random request sequences and verify limit enforcement
- Generate random time windows and verify counter reset
- Generate random endpoints and verify category-specific limits

**Audit Logging Properties**:
- Generate random events and verify log completeness
- Generate random filter combinations and verify query correctness
- Generate random sensitive data and verify redaction

### Integration Testing

Integration tests will verify end-to-end flows:

- Complete 2FA setup and authentication flow
- Session lifecycle from creation to expiration
- Rate limiting across multiple requests
- Audit log creation and querying across multiple operations

### Security Testing

Security-specific tests will verify:

- TOTP time window validation (prevent replay attacks)
- Session token tampering detection
- Rate limit bypass attempts
- Audit log tampering prevention
- SQL injection in audit log queries
- XSS in audit log display

## Implementation Notes

### Libraries and Dependencies

- **speakeasy**: TOTP generation and verification (RFC 6238 compliant)
- **qrcode**: QR code generation for 2FA setup
- **express-rate-limit**: Base rate limiting middleware
- **ioredis**: Redis client for distributed rate limiting and session storage
- **ua-parser-js**: User agent parsing for device detection
- **geoip-lite**: IP geolocation for location tracking
- **fast-check**: Property-based testing library

### Performance Considerations

1. **Session Storage**: Use Redis for session storage to enable horizontal scaling
2. **Rate Limiting**: Use Redis for distributed rate limiting across multiple server instances
3. **Audit Logging**: Implement async logging to avoid blocking request processing
4. **Database Indexing**: Create appropriate indexes on audit_logs table for query performance
5. **Log Archival**: Implement automated archival to prevent audit_logs table from growing unbounded

### Security Considerations

1. **TOTP Window**: Use 30-second time window with ±1 window tolerance for clock skew
2. **Backup Codes**: Generate cryptographically secure random codes (minimum 128-bit entropy)
3. **Session Tokens**: Use cryptographically secure random tokens (minimum 256-bit entropy)
4. **Rate Limit Storage**: Store rate limit counters in Redis with automatic expiration
5. **Audit Log Integrity**: Consider implementing cryptographic log chaining for tamper evidence
6. **IP Blocking**: Implement temporary blocks only, with automatic expiration to prevent permanent lockouts

### Scalability Considerations

1. **Distributed Sessions**: Use Redis cluster for session storage across multiple servers
2. **Distributed Rate Limiting**: Use Redis for centralized rate limit counters
3. **Log Partitioning**: Partition audit_logs table by date for better query performance
4. **Async Processing**: Process non-critical operations (notifications, archival) asynchronously
5. **Caching**: Cache frequently accessed data (2FA status, session metadata) with short TTL
