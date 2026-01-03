import { query } from '../config/database.js'

/**
 * Create a new user in the database
 * @param {object} userData - User data
 * @returns {Promise<object>} Created user
 */
export const createUser = async ({ username, email, passwordHash }) => {
  const sql = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at
  `
  const result = await query(sql, [username, email, passwordHash])
  return result.rows[0]
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User or null
 */
export const findUserByEmail = async (email) => {
  const sql = `
    SELECT id, username, email, password_hash, created_at, last_login
    FROM users
    WHERE email = $1
  `
  const result = await query(sql, [email])
  return result.rows[0] || null
}

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {Promise<object|null>} User or null
 */
export const findUserByUsername = async (username) => {
  const sql = `
    SELECT id, username, email, password_hash, created_at, last_login
    FROM users
    WHERE username = $1
  `
  const result = await query(sql, [username])
  return result.rows[0] || null
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User or null
 */
export const findUserById = async (userId) => {
  const sql = `
    SELECT id, username, email, full_name, phone, bio, profile_picture, created_at, last_login, password_hash
    FROM users
    WHERE id = $1
  `
  const result = await query(sql, [userId])
  return result.rows[0] || null
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} passwordHash - New password hash
 * @returns {Promise<boolean>} Success status
 */
export const updateUserPassword = async (userId, passwordHash) => {
  const sql = `
    UPDATE users
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `
  const result = await query(sql, [passwordHash, userId])
  return result.rowCount > 0
}

/**
 * Update last login timestamp
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const updateLastLogin = async (userId) => {
  const sql = `
    UPDATE users
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = $1
  `
  const result = await query(sql, [userId])
  return result.rowCount > 0
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to update
 * @returns {Promise<boolean>} Success status
 */
export const updateUserProfile = async (userId, { username, email, fullName, phone, bio }) => {
  const sql = `
    UPDATE users
    SET 
      username = COALESCE($1, username),
      email = COALESCE($2, email),
      full_name = COALESCE($3, full_name),
      phone = $4,
      bio = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
  `
  const result = await query(sql, [username, email, fullName, phone, bio, userId])
  return result.rowCount > 0
}
