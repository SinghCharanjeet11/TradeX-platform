# Implementation Plan

- [ ] 1. Database migrations and schema setup
- [x] 1.1 Create database migration for user_2fa table


  - Create migration file with user_2fa table schema
  - Include indexes for user_id lookups
  - Add foreign key constraints
  - _Requirements: 1.1, 1.2, 2.3_



- [ ] 1.2 Create database migration for backup_codes table
  - Create migration file with backup_codes table schema
  - Include indexes for user_id and code_hash lookups


  - Add foreign key constraints
  - _Requirements: 1.3, 2.1, 2.2, 2.5_

- [ ] 1.3 Create database migration for enhanced sessions table
  - Modify existing sessions table to add device tracking fields


  - Add device_fingerprint, device_type, browser, os, location fields
  - Add last_activity timestamp
  - Include indexes for efficient querying
  - _Requirements: 3.1, 3.2, 3.3, 4.3_


- [ ] 1.4 Create database migration for rate_limits table
  - Create migration file with rate_limits table schema
  - Include indexes for identifier and window lookups
  - Add automatic cleanup for expired entries
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

- [x] 1.5 Create database migration for ip_blocks table

  - Create migration file with ip_blocks table schema
  - Include indexes for IP address and expiration lookups
  - _Requirements: 6.4_

- [x] 1.6 Create database migration for audit_logs table


  - Create migration file with audit_logs table schema
  - Include indexes for user_id, event_type, created_at, severity
  - Add JSONB columns for flexible metadata storage
  - Implement database constraints for immutability
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.7 Create database migration for security_alerts table


  - Create migration file with security_alerts table schema
  - Include indexes for user_id and created_at
  - _Requirements: 9.1, 9.2_

- [x] 1.8 Run all security migrations


  - Execute migration runner script
  - Verify all tables created successfully
  - Test database constraints
  - _Requirements: All database requirements_

- [ ] 2. Two-Factor Authentication implementation
- [x] 2.1 Install 2FA dependencies


  - Install speakeasy for TOTP generation
  - Install qrcode for QR code generation
  - Update package.json
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Create 2FA repository layer


  - Implement create2FASecret function
  - Implement enable2FA function
  - Implement disable2FA function
  - Implement get2FAStatus function
  - Implement createBackupCodes function
  - Implement verifyBackupCode function
  - Implement invalidateBackupCode function
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.3 Write property test for 2FA secret generation
  - **Property 1: 2FA secret generation uniqueness**
  - **Validates: Requirements 1.1**

- [ ]* 2.4 Write property test for 2FA activation verification
  - **Property 2: 2FA activation requires verification**
  - **Validates: Requirements 1.2**

- [x] 2.5 Create 2FA service layer


  - Implement generateSecret function with QR code generation
  - Implement verifyToken function for TOTP validation
  - Implement enable2FA function with verification
  - Implement disable2FA function with authentication
  - Implement generateBackupCodes function
  - Implement verifyBackupCode function with single-use enforcement
  - Implement is2FAEnabled function
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.6 Write property test for backup code generation
  - **Property 3: Backup codes generation on verification**
  - **Validates: Requirements 1.3**

- [ ]* 2.7 Write property test for 2FA login enforcement
  - **Property 4: 2FA enforcement on login**
  - **Validates: Requirements 1.4**

- [ ]* 2.8 Write property test for invalid TOTP rejection
  - **Property 5: Invalid TOTP rejection and counter increment**
  - **Validates: Requirements 1.5**

- [ ]* 2.9 Write property test for backup code authentication
  - **Property 6: Backup code authentication**
  - **Validates: Requirements 2.1**

- [ ]* 2.10 Write property test for backup code single-use
  - **Property 7: Backup code single-use enforcement**
  - **Validates: Requirements 2.2**

- [ ]* 2.11 Write property test for 2FA disable authentication
  - **Property 8: 2FA disable requires authentication**
  - **Validates: Requirements 2.3**

- [ ]* 2.12 Write property test for backup code regeneration
  - **Property 10: Backup code regeneration invalidates old codes**
  - **Validates: Requirements 2.5**

- [x] 2.13 Create 2FA controller endpoints


  - Implement POST /api/auth/2fa/setup endpoint
  - Implement POST /api/auth/2fa/enable endpoint
  - Implement POST /api/auth/2fa/disable endpoint
  - Implement POST /api/auth/2fa/verify endpoint
  - Implement GET /api/auth/2fa/status endpoint
  - Implement POST /api/auth/2fa/backup-codes/regenerate endpoint
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 2.4, 2.5_

- [ ] 2.14 Update authentication middleware for 2FA


  - Modify login controller to check 2FA status
  - Add 2FA verification step after password validation
  - Support backup code authentication
  - Update session creation after 2FA verification
  - _Requirements: 1.4, 1.5, 2.1_

- [ ] 3. Enhanced session management implementation
- [ ] 3.1 Install session management dependencies
  - Install ua-parser-js for user agent parsing
  - Install geoip-lite for IP geolocation
  - Update package.json
  - _Requirements: 3.1, 4.3_

- [ ] 3.2 Create device fingerprinting utility
  - Implement parseUserAgent function
  - Implement extractDeviceInfo function
  - Implement getLocationFromIP function
  - _Requirements: 3.1, 3.3_

- [ ] 3.3 Update session repository layer
  - Modify createSession to include device metadata
  - Implement getUserSessions function
  - Implement terminateSession function
  - Implement terminateOtherSessions function
  - Implement updateSessionActivity function
  - Implement getSessionDetails function
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.2, 4.3_

- [ ]* 3.4 Write property test for session creation metadata
  - **Property 11: Session creation with complete metadata**
  - **Validates: Requirements 3.1**

- [ ]* 3.5 Write property test for session expiration
  - **Property 12: Automatic session expiration**
  - **Validates: Requirements 3.2**

- [ ] 3.6 Create session service layer
  - Implement createSession with device fingerprinting
  - Implement getUserSessions with formatting
  - Implement terminateSession with validation
  - Implement terminateOtherSessions logic
  - Implement updateSessionActivity function
  - Implement detectSuspiciousActivity function
  - Implement cleanupExpiredSessions scheduled job
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.5_

- [ ]* 3.7 Write property test for session list completeness
  - **Property 13: Session list completeness**
  - **Validates: Requirements 3.3**

- [ ]* 3.8 Write property test for session termination
  - **Property 14: Session termination effectiveness**
  - **Validates: Requirements 3.4**

- [ ]* 3.9 Write property test for logout cleanup
  - **Property 15: Logout session cleanup**
  - **Validates: Requirements 3.5**

- [ ]* 3.10 Write property test for bulk session termination
  - **Property 16: Bulk session termination preservation**
  - **Validates: Requirements 4.2**

- [ ]* 3.11 Write property test for IP change detection
  - **Property 17: IP change detection and logging**
  - **Validates: Requirements 4.3**

- [ ]* 3.12 Write property test for concurrent session limits
  - **Property 19: Concurrent session limit enforcement**
  - **Validates: Requirements 4.5**

- [ ] 3.13 Create session management controller endpoints
  - Implement GET /api/auth/sessions endpoint
  - Implement DELETE /api/auth/sessions/:id endpoint
  - Implement DELETE /api/auth/sessions/others endpoint
  - _Requirements: 3.3, 3.4, 4.2_

- [ ] 3.14 Update authentication middleware for session tracking
  - Modify verifyAuth to update last_activity
  - Add IP change detection logic
  - Implement session expiration checking
  - _Requirements: 3.2, 4.3_

- [ ] 3.15 Implement session cleanup scheduled job
  - Create cleanup job that runs every hour
  - Remove expired sessions from database
  - Log cleanup statistics
  - _Requirements: 3.2_

- [ ] 4. API rate limiting implementation
- [ ] 4.1 Install rate limiting dependencies
  - Install ioredis for Redis client
  - Configure Redis connection
  - Update package.json
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

- [ ] 4.2 Create rate limit repository layer
  - Implement checkRateLimit function
  - Implement incrementCounter function
  - Implement getRateLimitStatus function
  - Implement resetCounter function
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 4.3 Create IP blocking repository layer
  - Implement blockIP function
  - Implement isIPBlocked function
  - Implement unblockIP function
  - Implement cleanupExpiredBlocks function
  - _Requirements: 6.4_

- [ ]* 4.4 Write property test for authentication rate limiting
  - **Property 20: Authentication endpoint rate limiting**
  - **Validates: Requirements 5.1**

- [ ]* 4.5 Write property test for general API rate limiting
  - **Property 21: General API rate limiting**
  - **Validates: Requirements 5.2**

- [ ]* 4.6 Write property test for rate limit response format
  - **Property 22: Rate limit response format**
  - **Validates: Requirements 5.3**

- [ ] 4.7 Create rate limiting service layer
  - Implement checkRateLimit with category support
  - Implement incrementCounter with Redis
  - Implement getRateLimitStatus function
  - Implement blockIP function
  - Implement isIPBlocked function
  - Implement getRateLimitStats function
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 4.8 Write property test for rate limit violation logging
  - **Property 23: Rate limit violation logging**
  - **Validates: Requirements 5.4**

- [ ]* 4.9 Write property test for rate limit reset
  - **Property 24: Rate limit counter reset**
  - **Validates: Requirements 5.5**

- [ ]* 4.10 Write property test for trading endpoint limits
  - **Property 25: Trading endpoint rate limiting**
  - **Validates: Requirements 6.1**

- [ ]* 4.11 Write property test for market data endpoint limits
  - **Property 26: Market data endpoint rate limiting**
  - **Validates: Requirements 6.2**

- [ ]* 4.12 Write property test for account management limits
  - **Property 27: Account management endpoint rate limiting**
  - **Validates: Requirements 6.3**

- [ ]* 4.13 Write property test for automatic IP blocking
  - **Property 28: Automatic IP blocking on repeated violations**
  - **Validates: Requirements 6.4**

- [ ] 4.14 Create rate limiting middleware
  - Implement createRateLimiter middleware factory
  - Implement authRateLimiter for authentication endpoints
  - Implement apiRateLimiter for general endpoints
  - Implement tradingRateLimiter for trading endpoints
  - Implement marketDataRateLimiter for market data endpoints
  - Implement accountRateLimiter for account management endpoints
  - Add IP blocking check to all rate limiters
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

- [ ] 4.15 Apply rate limiting middleware to routes
  - Apply authRateLimiter to authentication routes
  - Apply tradingRateLimiter to paper trading routes
  - Apply marketDataRateLimiter to market data routes
  - Apply accountRateLimiter to account management routes
  - Apply apiRateLimiter to remaining routes
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

- [ ] 4.16 Create rate limit monitoring endpoint
  - Implement GET /api/admin/rate-limits/stats endpoint
  - Return statistics by endpoint and user
  - Require admin authentication
  - _Requirements: 6.5_

- [ ] 5. Audit logging implementation
- [ ] 5.1 Create audit log repository layer
  - Implement createAuditLog function
  - Implement queryAuditLogs function with filtering
  - Implement exportAuditLogs function
  - Implement archiveOldLogs function
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3_

- [ ]* 5.2 Write property test for authentication event logging
  - **Property 30: Authentication event logging completeness**
  - **Validates: Requirements 7.1**

- [ ]* 5.3 Write property test for account change logging
  - **Property 31: Account change logging with before/after values**
  - **Validates: Requirements 7.2**

- [ ]* 5.4 Write property test for audit log immutability
  - **Property 34: Audit log immutability**
  - **Validates: Requirements 7.5**

- [ ] 5.5 Create audit logging service layer
  - Implement logAuthEvent function
  - Implement logAccountChange function
  - Implement logTradingOperation function
  - Implement logSecurityEvent function
  - Implement queryLogs function with filtering
  - Implement exportLogs function (JSON and CSV)
  - Implement archiveLogs function
  - Add request ID generation and tracking
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

- [ ]* 5.6 Write property test for audit log query filtering
  - **Property 35: Audit log query filtering**
  - **Validates: Requirements 8.1**

- [ ]* 5.7 Write property test for audit log export
  - **Property 37: Audit log export formats**
  - **Validates: Requirements 8.3**

- [ ]* 5.8 Write property test for request ID correlation
  - **Property 38: Request ID correlation**
  - **Validates: Requirements 8.4**

- [ ]* 5.9 Write property test for critical event severity
  - **Property 39: Critical event severity flagging**
  - **Validates: Requirements 8.5**

- [ ] 5.10 Create audit logging middleware
  - Implement auditLogger middleware
  - Generate request ID for each request
  - Attach request ID to req object
  - Log request/response automatically
  - Implement sensitive data redaction
  - _Requirements: 8.4, 10.1, 10.3_

- [ ] 5.11 Integrate audit logging into authentication flow
  - Add audit logs to login attempts
  - Add audit logs to 2FA verification
  - Add audit logs to password changes
  - Add audit logs to session termination
  - _Requirements: 7.1, 7.2_

- [ ] 5.12 Integrate audit logging into trading operations
  - Add audit logs to paper trading transactions
  - Add audit logs to account resets
  - _Requirements: 7.3_

- [ ] 5.13 Create audit log query endpoints
  - Implement GET /api/admin/audit-logs endpoint with filtering
  - Implement GET /api/admin/audit-logs/export endpoint
  - Require admin authentication
  - _Requirements: 8.1, 8.3_

- [ ] 5.14 Implement audit log archival scheduled job
  - Create archival job that runs daily
  - Archive logs older than 90 days
  - Log archival statistics
  - _Requirements: 8.2_

- [ ]* 5.15 Write property test for sensitive data exclusion
  - **Property 45: Sensitive data exclusion from logs**
  - **Validates: Requirements 10.1**

- [ ]* 5.16 Write property test for API parameter redaction
  - **Property 47: API parameter redaction**
  - **Validates: Requirements 10.3**

- [ ]* 5.17 Write property test for audit access auditing
  - **Property 49: Audit access auditing**
  - **Validates: Requirements 10.5**

- [ ] 6. Security monitoring implementation
- [ ] 6.1 Create security alerts repository layer
  - Implement createSecurityAlert function
  - Implement getUserAlerts function
  - Implement acknowledgeAlert function
  - _Requirements: 9.1, 9.2_

- [ ] 6.2 Create security monitoring service layer
  - Implement detectBruteForce function
  - Implement detectUnusualLocation function
  - Implement detectUnusualAPIUsage function
  - Implement lockAccount function
  - Implement sendSecurityAlert function
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ]* 6.3 Write property test for account locking
  - **Property 40: Account locking on failed attempts**
  - **Validates: Requirements 9.1**

- [ ]* 6.4 Write property test for new location detection
  - **Property 41: New location detection**
  - **Validates: Requirements 9.2**

- [ ]* 6.5 Write property test for privileged operation logging
  - **Property 43: Privileged operation elevated logging**
  - **Validates: Requirements 9.4**

- [ ]* 6.6 Write property test for adaptive rate limiting
  - **Property 44: Adaptive rate limiting on brute force**
  - **Validates: Requirements 9.5**

- [ ] 6.7 Integrate security monitoring into authentication
  - Add brute force detection to login
  - Add location detection to login
  - Add account locking on failed attempts
  - Send security alerts for suspicious activity
  - _Requirements: 9.1, 9.2, 9.5_

- [ ] 6.8 Integrate security monitoring into rate limiting
  - Detect repeated rate limit violations
  - Implement adaptive rate limiting
  - Flag unusual API patterns
  - _Requirements: 9.3, 9.5_

- [ ] 6.9 Create security alerts endpoints
  - Implement GET /api/auth/security-alerts endpoint
  - Implement POST /api/auth/security-alerts/:id/acknowledge endpoint
  - _Requirements: 9.1, 9.2_

- [ ] 7. Client-side implementation
- [ ] 7.1 Create 2FA setup component
  - Create TwoFactorSetup.jsx component
  - Display QR code for scanning
  - Show manual entry option
  - Implement TOTP verification input
  - Display backup codes after setup
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7.2 Create 2FA verification component
  - Create TwoFactorVerification.jsx component
  - Add TOTP code input to login flow
  - Add backup code option
  - Handle verification errors
  - _Requirements: 1.4, 1.5, 2.1_

- [ ] 7.3 Create security settings page
  - Create SecuritySettings.jsx component
  - Display 2FA status and enable/disable options
  - Show backup code regeneration option
  - Display active sessions list
  - Add session termination controls
  - _Requirements: 2.3, 2.4, 2.5, 3.3, 3.4, 4.2_

- [ ] 7.4 Create session management component
  - Create SessionList.jsx component
  - Display device type, location, IP, last activity
  - Add terminate session button
  - Add terminate all other sessions button
  - _Requirements: 3.3, 3.4, 4.2_

- [ ] 7.5 Create security alerts component
  - Create SecurityAlerts.jsx component
  - Display unacknowledged alerts
  - Add acknowledge button
  - Show alert details
  - _Requirements: 9.1, 9.2_

- [ ] 7.6 Update login page for 2FA
  - Modify SignInPage.jsx to handle 2FA flow
  - Show TOTP input when 2FA is required
  - Add backup code option
  - Handle 2FA errors
  - _Requirements: 1.4, 1.5, 2.1_

- [ ] 7.7 Add rate limit error handling
  - Update API service to handle 429 responses
  - Display retry-after time to user
  - Show user-friendly rate limit messages
  - _Requirements: 5.3_

- [ ] 8. Testing and validation
- [ ] 8.1 Create integration tests for 2FA flow
  - Test complete 2FA setup flow
  - Test 2FA login flow
  - Test backup code usage
  - Test 2FA disable flow
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3_

- [ ] 8.2 Create integration tests for session management
  - Test session creation with metadata
  - Test session expiration
  - Test session termination
  - Test concurrent session limits
  - _Requirements: 3.1, 3.2, 3.4, 4.5_

- [ ] 8.3 Create integration tests for rate limiting
  - Test rate limit enforcement across categories
  - Test IP blocking
  - Test rate limit reset
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4_

- [ ] 8.4 Create integration tests for audit logging
  - Test audit log creation for various events
  - Test audit log querying and filtering
  - Test audit log export
  - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.3_

- [ ] 8.5 Create security tests
  - Test TOTP replay attack prevention
  - Test session token tampering detection
  - Test rate limit bypass attempts
  - Test audit log immutability
  - Test SQL injection in audit queries
  - _Requirements: 1.5, 3.4, 5.1, 7.5_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Documentation and deployment
- [ ] 10.1 Update API documentation
  - Document all new 2FA endpoints
  - Document session management endpoints
  - Document audit log endpoints
  - Document rate limiting behavior
  - _Requirements: All_

- [ ] 10.2 Create user documentation
  - Write 2FA setup guide
  - Write session management guide
  - Write security best practices
  - _Requirements: 1.1, 1.2, 3.3_

- [ ] 10.3 Update environment configuration
  - Add Redis connection configuration
  - Add 2FA configuration options
  - Add rate limit configuration
  - Add audit log retention settings
  - _Requirements: All_

- [ ] 10.4 Create deployment checklist
  - Verify all migrations run successfully
  - Verify Redis is configured
  - Verify scheduled jobs are running
  - Test 2FA setup in production
  - Monitor rate limiting effectiveness
  - _Requirements: All_
