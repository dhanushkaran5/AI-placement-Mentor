import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_placement_mentor_token_123!';

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check if email already exists
    const existingUser = await get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const userResult = await run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), normalizedEmail, hashedPassword]
    );

    // Create empty profile
    await run(
      'INSERT INTO user_profiles (user_id, target_role, target_company, readiness_score) VALUES (?, ?, ?, ?)',
      [userResult.id, 'SDE', 'TCS', 0]
    );

    // Generate JWT token
    const token = jwt.sign({ id: userResult.id, email: normalizedEmail, name: name.trim() }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.status(201).json({
      message: 'Signup successful.',
      token,
      user: { id: userResult.id, name: name.trim(), email: normalizedEmail },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
};

export const register = signup;

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await get(
      `SELECT u.name, u.email, p.target_role, p.target_company, p.readiness_score 
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
};

export const getMe = getProfile;

export const updateProfile = async (req, res) => {
  const { target_role, target_company } = req.body;

  if (!target_role || !target_company) {
    return res.status(400).json({ error: 'Target role and company are required.' });
  }

  try {
    // Update profile
    await run(
      `UPDATE user_profiles 
       SET target_role = ?, target_company = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [target_role, target_company, req.user.id]
    );

    // Log the profile update activity
    await run(
      'INSERT INTO progress_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
      [req.user.id, 'profile_update', `Updated target role to ${target_role} at ${target_company}`]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error updating profile.' });
  }
};
