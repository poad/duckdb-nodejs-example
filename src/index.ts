import duckdb from '@duckdb/node-api';
import assert from 'assert';

const file = process.env.FILE;
assert(file, 'FILE environment variable must be set');

const instance = await duckdb.DuckDBInstance.create(':memory:');

const connection = await instance.connect();

await connection.runAndReadAll('INSTALL aws; LOAD aws;');

const reader = await connection.runAndReadAll(`
    CREATE OR REPLACE SECRET secret (
    TYPE s3,
    PROVIDER config,
    REGION 'us-west-2'
);`);
const rows = reader.getRows();
console.log(rows);

const prepared = await connection.prepare('CREATE OR REPLACE TABLE data AS SELECT * FROM read_csv($file);');
prepared.bind({'file': file});
const createTableResult = await prepared.runAndReadAll();
console.log(`Table created with ${createTableResult.getRows()} rows.`);

const query = await connection.runAndReadAll('SELECT * FROM data LIMIT 10;');
const queryRows = query.getRows();
console.log('First 10 rows from the data table:');
queryRows.forEach((row) => {
  console.log(row);
});
