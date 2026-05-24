import { DataSource } from 'typeorm';

const ds = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'Aidar1904',
  database: 'warehouse',
});

async function run() {
  await ds.initialize();
  const res = await ds.query("SHOW CREATE TABLE reviews");
  console.log(res[0]['Create Table']);
  await ds.destroy();
}
run();
