import { UAParser } from 'ua-parser-js'
import geoip from 'geoip-lite'

/**
 * Parse user agent string to extract device information
 * @param {string} userAgent - User agent string from request headers
 * @returns {Object} Parsed device information
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      device: 'Unknown',
      deviceType: 'desktop'
    }
  }

  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || '',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || '',
    device: result.device.model || result.device.vendor || 'Unknown',
    deviceType: result.device.type || 'desktop'
  }
}

/**
 * Extract comprehensive device information from request
 * @param {Object} req - Express request object
 * @returns {Object} Device information including fingerprint
 */
function extractDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || ''
  const parsedUA = parseUserAgent(userAgent)
  
  // Create device fingerprint from key characteristics
  const fingerprintData = [
    parsedUA.browser,
    parsedUA.os,
    parsedUA.deviceType,
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || ''
  ].join('|')
  
  // Simple hash for fingerprint (in production, consider using crypto.createHash)
  const fingerprint = Buffer.from(fingerprintData).toString('base64').substring(0, 32)

  return {
    deviceFingerprint: fingerprint,
    deviceType: parsedUA.deviceType,
    browser: `${parsedUA.browser} ${parsedUA.browserVersion}`.trim(),
    os: `${parsedUA.os} ${parsedUA.osVersion}`.trim(),
    userAgent: userAgent
  }
}

/**
 * Get location information from IP address
 * @param {string} ipAddress - IP address to lookup
 * @returns {Object} Location information
 */
function getLocationFromIP(ipAddress) {
  if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
    return {
      country: 'Local',
      city: 'Localhost',
      countryCode: 'XX'
    }
  }

  // Handle IPv6-mapped IPv4 addresses
  let cleanIP = ipAddress
  if (ipAddress.startsWith('::ffff:')) {
    cleanIP = ipAddress.substring(7)
  }

  const geo = geoip.lookup(cleanIP)
  
  if (!geo) {
    return {
      country: 'Unknown',
      city: 'Unknown',
      countryCode: 'XX'
    }
  }

  return {
    country: geo.country || 'Unknown',
    city: geo.city || 'Unknown',
    countryCode: geo.country || 'XX',
    timezone: geo.timezone || null,
    coordinates: geo.ll ? { lat: geo.ll[0], lon: geo.ll[1] } : null
  }
}

/**
 * Get client IP address from request, handling proxies
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  // Check other common headers
  const realIP = req.headers['x-real-ip']
  if (realIP) {
    return realIP
  }
  
  // Fall back to connection remote address
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || 'Unknown'
}

/**
 * Create complete session metadata from request
 * @param {Object} req - Express request object
 * @returns {Object} Complete session metadata
 */
function createSessionMetadata(req) {
  const ipAddress = getClientIP(req)
  const deviceInfo = extractDeviceInfo(req)
  const location = getLocationFromIP(ipAddress)

  return {
    ...deviceInfo,
    ipAddress,
    locationCountry: location.countryCode,
    locationCity: location.city,
    timezone: location.timezone,
    coordinates: location.coordinates
  }
}

export {
  parseUserAgent,
  extractDeviceInfo,
  getLocationFromIP,
  getClientIP,
  createSessionMetadata
}
