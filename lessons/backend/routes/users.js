// routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/users
 * Получить список всех пользователей
 */
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                user_id,
                username,
                email,
                created_at,
                last_active
            FROM users
            ORDER BY last_active DESC
            LIMIT 100
        `);
        
        res.json({
            success: true,
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/users/:username
 * Получить информацию о пользователе
 */
router.get('/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                user_id,
                username,
                email,
                created_at,
                last_active
            FROM users
            WHERE username = $1
        `, [username]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/users
 * Создать нового пользователя или получить существующего
 */
router.post('/', async (req, res) => {
    const { username, email } = req.body;
    
    if (!username) {
        return res.status(400).json({ 
            success: false, 
            error: 'Username is required' 
        });
    }
    
    try {
        const result = await pool.query(`
            INSERT INTO users (username, email) 
            VALUES ($1, $2)
            ON CONFLICT (username) DO UPDATE 
            SET last_active = CURRENT_TIMESTAMP
            RETURNING user_id, username, email, created_at
        `, [username, email]);
        
        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/users/:userId
 * Удалить пользователя (только для администраторов)
 */
router.delete('/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            DELETE FROM users 
            WHERE user_id = $1
            RETURNING username
        `, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            message: `User ${result.rows[0].username} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
