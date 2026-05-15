const crypto = require('crypto');

const generateOTP = (length = 4) => {
  if (process.env.MOCK_OTP === 'true') {
    return '1234';
  }
  // Generate random digits
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join('');
};

const sendOTP = async (phone, otp) => {
  if (process.env.MOCK_OTP === 'true') {
    console.log(`[MOCK] OTP for ${phone} is ${otp}`);
    return true;
  }
  
  // Real implementation would call MSG91, Twilio, etc.
  // Example for MSG91:
  // await axios.post('https://api.msg91.com/api/v5/otp', { ... })
  
  console.log(`[REAL] Sending OTP to ${phone}: ${otp}`);
  return true;
};

const verifyOTP = async (phone, otp) => {
  const { query } = require('../db');
  
  // Find valid OTP
  const result = await query(
    `SELECT id FROM otps 
     WHERE phone = $1 AND otp = $2 AND used = FALSE AND expires_at > NOW()`,
    [phone, otp]
  );
  
  return result.rows.length > 0;
};

module.exports = { generateOTP, sendOTP, verifyOTP };
