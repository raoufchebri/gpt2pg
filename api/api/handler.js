const { Client } = require('pg');

const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://chat.openai.com');
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
  const connectionString = request.body.databaseUrl || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connectionString,
  });
  try {
    await client.connect();
    if (connectionString === process.env.DATABASE_URL) {
      console.log('creating schema', request.body.chatId);
      await client.query(
        `CREATE SCHEMA IF NOT EXISTS "${request.body.chatId}"`
      );
      console.log('setting search path');
      await client.query(`SET search_path TO "${request.body.chatId}"`);
    } else {
      console.log('querying database url', connectionString);
    }
    console.log('running query', request.body.sql);
    const { rows } = await client.query(request.body.sql);
    response.status(200).json({
      body: rows.slice(0, 10),
    });
    console.log('query ran successfully');
  } catch (e) {
    console.log('error', e);
    response.status(400).json({
      error: e,
    });
  } finally {
    await client.end();
  }
};

module.exports = allowCors(handler);
