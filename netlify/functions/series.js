// netlify/functions/series.js
const { Client } = require('pg');

const getClient = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = await getClient();

  try {
    // GET - Fetch all series
    if (event.httpMethod === 'GET') {
      const result = await client.query(
        'SELECT * FROM series ORDER BY created_at DESC'
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // POST - Create new series
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const result = await client.query(
        `INSERT INTO series (title, description, start_date, end_date, created_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING *`,
        [data.title, data.description, data.startDate, data.endDate]
      );
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // PUT - Update series
    if (event.httpMethod === 'PUT') {
      const data = JSON.parse(event.body);
      const result = await client.query(
        `UPDATE series 
         SET title = $1, description = $2, start_date = $3, end_date = $4
         WHERE id = $5
         RETURNING *`,
        [data.title, data.description, data.startDate, data.endDate, data.id]
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // DELETE - Delete series and associated parties
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      
      // Delete parties first (foreign key)
      await client.query('DELETE FROM parties WHERE series_id = $1', [id]);
      
      // Delete series
      await client.query('DELETE FROM series WHERE id = $1', [id]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.end();
  }
};