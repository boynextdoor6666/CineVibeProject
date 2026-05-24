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
  // drop foreign keys
  try {
    await ds.query("ALTER TABLE reviews DROP FOREIGN KEY reviews_ibfk_1");
  } catch(e) {
      console.log('Error dropping fk:', e.message);
  }
  
  try {
    await ds.query("ALTER TABLE reviews MODIFY COLUMN movie_id INT NULL");
  } catch(e) {
      console.log('Error modifying column:', e.message);
  }
  
  console.log('done');
  await ds.destroy();
}
run();
