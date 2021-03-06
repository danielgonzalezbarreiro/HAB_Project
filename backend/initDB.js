require('dotenv').config();
const bcrypt = require('bcrypt');

const { getConnection } = require('./db');

//const args = process.argv;

//const addData = args[2] === '--data';

async function main() {
  // Get reference to db
  const connection = await getConnection();

  console.log('Dropping tables');
  await connection.query('DROP TABLE IF EXISTS users');
  await connection.query('DROP TABLE IF EXISTS travels');
  await connection.query('DROP TABLE IF EXISTS messages');
  await connection.query('DROP TABLE IF EXISTS rates');
  await connection.query('DROP TABLE IF EXISTS follow');
  await connection.query('DROP TABLE IF EXISTS reel');
  await connection.query('DROP TABLE IF EXISTS user_choose_travel');


  console.log('Creating tables')

  await connection.query(`
    CREATE TABLE users (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_login VARCHAR(50) NOT NULL UNIQUE,
      user_password VARCHAR(255) UNIQUE NOT NULL,
      biography VARCHAR(200),
      email VARCHAR(50) NOT NULL UNIQUE,
      profile_name VARCHAR(50) NOT NULL,
      birthday DATE NOT NULL,
      tlf VARCHAR(50),
      locality VARCHAR(50),
      avatar_img VARCHAR(50),
      role ENUM("normal", "admin") DEFAULT "normal" NOT NULL,
      active BOOLEAN DEFAULT false NOT NULL,
      registrationCode VARCHAR(255),
      user_password_last_update datetime not null,
      create_user TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_user TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`);

  await connection.query(`
    CREATE TABLE travels (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      description TEXT NOT NULL,
      locality VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      category varchar(50) NOT NULL,
      budget FLOAT DEFAULT 0,
      id_user INT UNSIGNED NOT NULL REFERENCES users,
      create_travel TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_travel TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`);

  await connection.query(`
    CREATE TABLE messages (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      msg_text TEXT NOT NULL,
      id_user_send INT UNSIGNED REFERENCES users,
      id_user_recive INT UNSIGNED REFERENCES users,
      msg_send TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      create_message TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_message TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`);

  await connection.query(`
    CREATE TABLE rates (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      rate_text TEXT NOT NULL,
      points INT(5) NOT NULL,
      id_user_send INT UNSIGNED REFERENCES users,
      id_user_recive INT UNSIGNED REFERENCES users,
      rate_send TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      create_rate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_rate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`);
  await connection.query(`
    CREATE TABLE follow (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      follower_id INT UNSIGNED REFERENCES users,
      user_id INT UNSIGNED REFERENCES users,
      create_follow TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_follow TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`);
  await connection.query(`
    CREATE TABLE reel (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNSIGNED REFERENCES users,
      photo VARCHAR(50) NOT NULL,
      text TEXT NOT NULL,
      create_photo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_photo TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`);
  await connection.query(`
    CREATE TABLE user_choose_travel (
      id_user INT UNSIGNED REFERENCES users,
      id_travel INT UNSIGNED REFERENCES travels,
      choose_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_admitted boolean default false,
      join_message VARCHAR(255),
      PRIMARY KEY (id_user, id_travel),
      create_user_choose_travel TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      update_user_choose_travel TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`);

  // Create initial user
  const password = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);

  await connection.query(`
        INSERT INTO users(user_password_last_update, email, user_password, role, profile_name, active, user_login, birthday)
        VALUES( UTC_TIMESTAMP, "danielgonzalezbarreiro@gmail.com", "${password}", "admin", "Daniel Gonzalez", true, "danixxz", "1996-06-25")
      `);

  console.log('Initial structure created');

  connection.release();
  process.exit();
}

main();