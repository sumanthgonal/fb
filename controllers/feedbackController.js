import pool from '../config/db.js';

// Get all feedbacks
export const getAllFeedbacks = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        f.id,
        f.title,
        f.description,
        f.status,
        f.created_at,
        f.updated_at,
        u.name as author_name,
        u.id as author_id,
        COUNT(DISTINCT v.id) as votes_count
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN votes v ON f.id = v.feedback_id
    `;

    const queryParams = [];

    if (status) {
      query += ' WHERE f.status = $1';
      queryParams.push(status);
    }

    query += ' GROUP BY f.id, u.name, u.id ORDER BY f.created_at DESC';

    const result = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: {
        feedbacks: result.rows
      }
    });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedbacks'
    });
  }
};

// Get single feedback
export const getFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        f.id,
        f.title,
        f.description,
        f.status,
        f.created_at,
        f.updated_at,
        u.name as author_name,
        u.id as author_id,
        COUNT(DISTINCT v.id) as votes_count
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN votes v ON f.id = v.feedback_id
      WHERE f.id = $1
      GROUP BY f.id, u.name, u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        feedback: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback'
    });
  }
};

// Create new feedback
export const createFeedback = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and description'
      });
    }

    // Create feedback
    const result = await pool.query(
      'INSERT INTO feedbacks (user_id, title, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, description, 'Planned']
    );

    const feedback = result.rows[0];

    // Get feedback with author info
    const feedbackWithAuthor = await pool.query(
      `SELECT
        f.id,
        f.title,
        f.description,
        f.status,
        f.created_at,
        u.name as author_name,
        u.id as author_id
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = $1`,
      [feedback.id]
    );

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: {
        feedback: feedbackWithAuthor.rows[0]
      }
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating feedback'
    });
  }
};

// Update feedback status
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Planned', 'In Progress', 'Completed', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (Planned, In Progress, Completed, Rejected)'
      });
    }

    // Update feedback
    const result = await pool.query(
      'UPDATE feedbacks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully',
      data: {
        feedback: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating feedback'
    });
  }
};

// Vote on feedback
export const voteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if feedback exists
    const feedbackExists = await pool.query(
      'SELECT * FROM feedbacks WHERE id = $1',
      [id]
    );

    if (feedbackExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user already voted
    const voteExists = await pool.query(
      'SELECT * FROM votes WHERE user_id = $1 AND feedback_id = $2',
      [userId, id]
    );

    if (voteExists.rows.length > 0) {
      // Remove vote (toggle functionality)
      await pool.query(
        'DELETE FROM votes WHERE user_id = $1 AND feedback_id = $2',
        [userId, id]
      );

      return res.status(200).json({
        success: true,
        message: 'Vote removed successfully',
        data: {
          voted: false
        }
      });
    }

    // Add vote
    await pool.query(
      'INSERT INTO votes (user_id, feedback_id) VALUES ($1, $2)',
      [userId, id]
    );

    res.status(200).json({
      success: true,
      message: 'Vote added successfully',
      data: {
        voted: true
      }
    });
  } catch (error) {
    console.error('Vote feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while voting'
    });
  }
};

// Get user's voted feedbacks
export const getUserVotes = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT feedback_id FROM votes WHERE user_id = $1',
      [userId]
    );

    const votedFeedbackIds = result.rows.map(row => row.feedback_id);

    res.status(200).json({
      success: true,
      data: {
        votedFeedbacks: votedFeedbackIds
      }
    });
  } catch (error) {
    console.error('Get user votes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching votes'
    });
  }
};
