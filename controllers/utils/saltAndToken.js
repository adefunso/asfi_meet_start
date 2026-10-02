const crypto = require('crypto'); // Use require instead of import

/**
 * Generates a user token based on a passphrase using SHA-256.
 * @param {string} passphrase - The passphrase used to generate the user token.
 * @returns {string} - The generated user token as a hexadecimal string.
 */
function generateUserToken(passphrase) {
  // Create a hash using SHA-256
  const hash = crypto.createHash('sha256');
  
  // Update the hash with the passphrase
  hash.update(passphrase);
  
  // Return the hash as a hexadecimal string
  return hash.digest('hex');
}

/**
 * Creates a random secret salt using crypto's randomBytes function.
 * @param {number} length - The length of the salt in bytes (default 16).
 * @returns {string} - The base64-encoded secret salt.
 */
 function createSecretSalt(length = 16) {
  // Generate random bytes of the specified length
  const salt = crypto.randomBytes(length);
  
  // Encode the salt as a base64 string
  return salt.toString('base64');
}

 function GenerateRandomID() {
  return Math.floor(100000 + Math.random() * 900000);
}


module.exports = {
  GenerateRandomID,
  createSecretSalt,
  generateUserToken
}