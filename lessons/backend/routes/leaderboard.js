// routes/leaderboard.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/leaderboard/:testType
 * Получить leaderboard для конкретного типа теста
 */
router.get('/:testType', async (req, res) => {
    const { testType } = req.params;
    const limit = req.query.limit || 10;
    
    try {
        const result = await pool.query(`
            SELECT 
                l.rank,
                u.username,
                l.total_correct,
                l.total_questions,
                l.accuracy,
                l.last_updated
            FROM leaderboard l
            JOIN users u ON l.user_id = u.user_id
            JOIN test_types tt ON l.test_type_id = tt.test_type_id
            WHERE tt.test_name = $1 AND l.rank IS NOT NULL
            ORDER BY l.rank
            LIMIT $2
        `, [testType, limit]);
        
        res.json({
            success: true,
            test_type: testType,
            count: result.rows.length,
            leaderboard: result.rows
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/leaderboard/all/top
 * Получить топ пользователей по всем тестам
 */
router.get('/all/top', async (req, res) => {
    const limit = req.query.limit || 10;
    
    try {
        const result = await pool.query(`
            SELECT * FROM v_top_users
            LIMIT $1
        `, [limit]);
        
        res.json({
            success: true,
            count: result.rows.length,
            top_users: result.rows
        });
    } catch (error) {
        console.error('Error fetching top users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/leaderboard/user/:username/rank
 * Получить позицию пользователя в leaderboard
 */
router.get('/user/:username/rank', async (req, res) => {
    const { username } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                tt.test_name_ru,
                l.rank,
                l.total_correct,
                l.total_questions,
                l.accuracy
            FROM leaderboard l
            JOIN users u ON l.user_id = u.user_id
            JOIN test_types tt ON l.test_type_id = tt.test_type_id
            WHERE u.username = $1
            ORDER BY tt.test_name
        `, [username]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found in leaderboard' 
            });
        }
        
        res.json({
            success: true,
            username: username,
            ranks: result.rows
        });
    } catch (error) {
        console.error('Error fetching user rank:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/leaderboard/update-ranks
 * Обновить ранги в leaderboard (только для админов)
 */
router.post('/update-ranks', async (req, res) => {
    try {
        await pool.query('SELECT update_leaderboard_ranks()');
        
        res.json({
            success: true,
            message: 'Ranks updated successfully'
        });
    } catch (error) {
        console.error('Error updating ranks:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
