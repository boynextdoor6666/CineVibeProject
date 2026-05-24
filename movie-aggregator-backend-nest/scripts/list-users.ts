import { DataSource } from 'typeorm';
const ds = new DataSource({ type: 'mysql', host: '127.0.0.1', port: 3306, username: 'root', password: 'Aidar1904', database: 'warehouse' });
async function run() {
  await ds.initialize();
  const rows = await ds.query("SELECT id, username, email FROM users LIMIT 5");
  console.log(rows);
  await ds.destroy();
}
run();
