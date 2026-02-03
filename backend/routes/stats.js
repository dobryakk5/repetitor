// routes/stats.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/stats/user/:username
 * Получить детальную статистику пользователя
 */
router.get('/user/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT * FROM v_user_detailed_stats
            WHERE username = $1
            ORDER BY test_name_ru
        `, [username]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            username: username,
            stats: result.rows
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/stats/recent
 * Получить последние попытки
 */
router.get('/recent', async (req, res) => {
    const limit = req.query.limit || 20;
    
    try {
        const result = await pool.query(`
            SELECT * FROM v_recent_attempts
            LIMIT $1
        `, [limit]);
        
        res.json({
            success: true,
            count: result.rows.length,
            recent_attempts: result.rows
        });
    } catch (error) {
        console.error('Error fetching recent attempts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/stats/tests/overview
 * Получить общую статистику по всем тестам
 */
router.get('/tests/overview', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                tt.test_name_ru,
                COUNT(DISTINCT ta.user_id) AS unique_users,
                COUNT(ta.attempt_id) AS total_attempts,
                ROUND(AVG(ta.accuracy), 2) AS average_accuracy,
                MAX(ta.accuracy) AS best_accuracy,
                MIN(ta.accuracy) AS worst_accuracy
            FROM test_attempts ta
            JOIN test_variants tv ON ta.variant_id = tv.variant_id
            JOIN test_types tt ON tv.test_type_id = tt.test_type_id
            GROUP BY tt.test_name_ru
            ORDER BY total_attempts DESC
        `);
        
        res.json({
            success: true,
            count: result.rows.length,
            overview: result.rows
        });
    } catch (error) {
        console.error('Error fetching tests overview:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/stats/variants/difficulty
 * Получить статистику по сложности вариантов
 */
router.get('/variants/difficulty', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                tt.test_name_ru,
                tv.variant_number,
                tv.difficulty_level,
                COUNT(ta.attempt_id) AS attempts,
                ROUND(AVG(ta.accuracy), 2) AS avg_accuracy
            FROM test_variants tv
            JOIN test_types tt ON tv.test_type_id = tt.test_type_id
            LEFT JOIN test_attempts ta ON tv.variant_id = ta.variant_id
            GROUP BY tt.test_name_ru, tv.variant_number, tv.difficulty_level
            ORDER BY tt.test_name_ru, tv.variant_number
        `);
        
        res.json({
            success: true,
            count: result.rows.length,
            variants: result.rows
        });
    } catch (error) {
        console.error('Error fetching variants difficulty:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/stats/active-users
 * Получить активных пользователей за период
 */
router.get('/active-users', async (req, res) => {
    const days = req.query.days || 7;
    
    try {
        const result = await pool.query(`
            SELECT 
                u.username,
                COUNT(ta.attempt_id) AS attempts,
                ROUND(AVG(ta.accuracy), 2) AS avg_accuracy,
                MAX(ta.completed_at) AS last_attempt
            FROM users u
            JOIN test_attempts ta ON u.user_id = ta.user_id
            WHERE ta.completed_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
            GROUP BY u.username
            ORDER BY attempts DESC
            LIMIT 50
        `);
        
        res.json({
            success: true,
            period_days: days,
            count: result.rows.length,
            active_users: result.rows
        });
    } catch (error) {
        console.error('Error fetching active users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/stats/dashboard
 * Получить общую статистику для dashboard
 */
router.get('/dashboard', async (req, res) => {
    try {
        // Общая статистика
        const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalAttempts = await pool.query('SELECT COUNT(*) as count FROM test_attempts');
        const avgAccuracy = await pool.query('SELECT ROUND(AVG(accuracy), 2) as avg FROM test_attempts');
        
        // Последние 7 дней
        const recentAttempts = await pool.query(`
            SELECT COUNT(*) as count 
            FROM test_attempts 
            WHERE completed_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        `);
        
        res.json({
            success: true,
            dashboard: {
                total_users: parseInt(totalUsers.rows[0].count),
                total_attempts: parseInt(totalAttempts.rows[0].count),
                average_accuracy: parseFloat(avgAccuracy.rows[0].avg || 0),
                recent_attempts_7d: parseInt(recentAttempts.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
