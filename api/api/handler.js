const { Client } = require('pg');

const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://chat.openai.com');
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

const handler = async (request, response) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${request.body.chatId}"`);
    await client.query(`SET search_path TO "${request.body.chatId}"`);
    const { rows } = await client.query(request.body.sql);
    response.status(200).json({
      body: rows,
    });
  } catch (e) {
    console.log(e);
    response.status(400).json({
      error: e,
    });
  } finally {
    await client.end();
  }
};

module.exports = allowCors(handler);
