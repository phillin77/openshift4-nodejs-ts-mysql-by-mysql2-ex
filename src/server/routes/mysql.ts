// mysql2 example referene from: https://evertpot.com/executing-a-mysql-query-in-nodejs/

import { Request, Response, NextFunction } from 'express';
import * as util from 'util';
import * as mysql from 'mysql2/promise';

/**
 * Init DB Connection (use Pool)
 *
 * @returns {mysql.Pool}
 */
function initDbConn():mysql.Pool|null {
  let mysqlURL = process.env.OPENSHIFT_MYSQL_DB_URL || process.env.MYSQL_URL,
      mysqlURLLabel = "";

  if (mysqlURL == null) {
    var mysqlHost, mysqlPort, mysqlDatabase, mysqlPassword, mysqlUser;
    // If using multi-database modified by p.l.77 (MONGODB_DATABASE_SERVICE_NAME & MYSQL_DATABASE_SERVICE_NAME)
    if (process.env.MYSQL_DATABASE_SERVICE_NAME) {
      var mysqlServiceName = process.env.MYSQL_DATABASE_SERVICE_NAME.toUpperCase();
      mysqlHost = process.env[mysqlServiceName + '_SERVICE_HOST'];
      mysqlPort = process.env[mysqlServiceName + '_SERVICE_PORT'];
      mysqlDatabase = process.env[mysqlServiceName + '_DATABASE'];
      mysqlPassword = process.env[mysqlServiceName + '_PASSWORD'];
      mysqlUser = process.env[mysqlServiceName + '_USER'];

    // If using plane old env vars via service discovery
    } else if (process.env.DATABASE_SERVICE_NAME) {
      var mysqlServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
      mysqlHost = process.env[mysqlServiceName + '_SERVICE_HOST'];
      mysqlPort = process.env[mysqlServiceName + '_SERVICE_PORT'];
      mysqlDatabase = process.env[mysqlServiceName + '_DATABASE'];
      mysqlPassword = process.env[mysqlServiceName + '_PASSWORD'];
      mysqlUser = process.env[mysqlServiceName + '_USER'];

    // If using env vars from secret from service binding  
    } else if (process.env.database_name) {
      mysqlDatabase = process.env.database_name;
      mysqlPassword = process.env.password;
      mysqlUser = process.env.username;
      var mysqlUriParts = process.env.uri && process.env.uri.split("//");
      if (mysqlUriParts && mysqlUriParts.length == 2) {
        mysqlUriParts = mysqlUriParts[1].split(":");
        if (mysqlUriParts && mysqlUriParts.length == 2) {
          mysqlHost = mysqlUriParts[0];
          mysqlPort = mysqlUriParts[1];
        }
      }
    }

    if (mysqlHost && mysqlPort && mysqlDatabase) {
      mysqlURLLabel = mysqlURL = 'mysql://';
      if (mysqlUser && mysqlPassword) {
        mysqlURL += mysqlUser + ':' + mysqlPassword + '@';
      }
      // Provide UI label that excludes user id and pw
      mysqlURLLabel += mysqlHost + ':' + mysqlPort + '/' + mysqlDatabase;
      mysqlURL += mysqlHost + ':' +  mysqlPort + '/' + mysqlDatabase;
    }
  }

  // console.log(`mysqlURL: ${mysqlURL}`);
  
  if (mysqlURL == null) return null;

  if (mysql == null) return null;

  // Create Pool
  const pool = mysql.createPool({
    host: mysqlHost,
    port: Number(mysqlPort) || 3306,
    user: mysqlUser,
    password: mysqlPassword,
    database: mysqlDatabase,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  return pool;
};


/* GET */
exports.handler = async function(req:Request, res:Response, next:NextFunction) {
  console.log('GET /mysql, headers = ', util.inspect(req.headers, { showHidden: false, depth: null, colors: true }));
  const reqdata = req.body;
  console.log('GET /mysql, body = ', util.inspect(reqdata, { showHidden: false, depth: null, colors: true }));

  try {
    const pool:mysql.Pool|null = initDbConn();
    if (!pool) {
      console.log('Error connect to database.');
      res.status(500);
      res.send('Error connect to database.');
      return;
    }

    const results:any[] = await pool.query('SELECT 1 + 1 AS solution, NOW() as now');
    // console.log(`results: ${util.inspect(results, { showHidden: false, depth: null, colors: true })}`);
    res.send(`OK: ${results[0][0]["solution"]} at ${results[0][0]["now"]}`);

  } catch (error) {
    console.log('Error Message:\n' + error);
    res.status(500);
    res.send(error);
  } // try-catch
}; // exports.handler
