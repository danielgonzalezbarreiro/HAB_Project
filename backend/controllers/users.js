require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { getConnection } = require('../db');

const {
  userSchema,
  editUserSchema,
  editPasswordUserSchema,
  userSchemaRegister
} = require('./validations');

const {
  processAndSavePhoto,
  deletePhoto,
  randomString,
  sendEmail,
  generateError,
  formatDatetoDB
} = require('../helpers');

//POST -/users

async function newUser(req, res, next) {
  let connection;
  try {
    // Validate body payload
    await userSchemaRegister.validateAsync(req.body);

    connection = await getConnection();

    const { email, password, user_login, profile_name, birthday } = req.body;
    console.log(req.body)
    // Check if user email is already in the db
    const [
      existing
    ] = await connection.query('SELECT id from users where email=?', [email]);

    if (existing.length) {
      throw generateError('This email alredy existed in BBDD', 409);
    }

    // hash password
    const dbPassword = await bcrypt.hash(password, 10);
    const registrationCode = randomString(40);

    const validationURL = `${process.env.PUBLIC_HOST}/users/validate?code=${registrationCode}`;

    try {
      await sendEmail({
        email: email,
        title: 'Validate your account in "Compañeros de Viaje"',
        content: `For validate you account paste this link in your account: ${validationURL}`
      });
    } catch (error) {
      console.error(error.response.body);
      throw new Error(
        'Mail service error. Try again later.'
      );
    }

    await connection.query(
      `
      INSERT INTO users (user_password_last_update, email, user_password, role, registrationCode, user_login, profile_name, birthday)
      VALUES(UTC_TIMESTAMP, ?, ?, "normal", ?, ?, ?, ?)
    `,
      [email, dbPassword, registrationCode, user_login, profile_name, birthday]
    );

    res.send({
      staus: 'ok',
      message:
        'Registered user. Check your email for activate the account. Check SPAM box'
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

async function validateUser(req, res, next) {
  let connection;

  try {
    const { code } = req.query;

    connection = await getConnection();

    // Actualizamos el usuario
    const [
      result
    ] = await connection.query(
      'UPDATE users SET active=1,registrationCode=NULL WHERE registrationCode=?',
      [code]
    );

    if (result.affectedRows === 0) {
      throw generateError('Validación incorrecta', 400);
    }

    res.send({
      status: 'ok',
      message: 'Validated user, you can login.'
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
}
// GET - /username
async function getUserName(req, res, next) {
  try {
    const { id } = req.body
    console.log(req.body)

    const connection = await getConnection();

    let result;
    result = await connection.query(
      `SELECT profile_name
      FROM users
      WHERE id=?`, [id],
    );
    const [profile_name] = result;

    connection.release();

    res.send({
      status: 'ok',
      data: profile_name
    });
  } catch (error) {
    next(error);
  }
}

// GET - /users/:id
async function getUser(req, res, next) {
  let connection;

  try {
    const { id } = req.params;
    connection = await getConnection();

    const [result] = await connection.query(
      `
      SELECT id, create_user, email, role, profile_name, biography, avatar_img, birthday, tlf, locality, user_login 
      FROM users WHERE id=?  
    `,
      [id]
    );

    // Throw 404 if no results
    if (!result.length) {
      throw generateError(`There is no user with the id ${id}`, 404);
    }

    const [userData] = result;

    const payload = {
      registrationDate: userData.create_user,
      user_login: userData.user_login,
      tlf: userData.tlf,
      email: userData.email,
      avatar_img: userData.avatar_img
    };

    payload.profile_name = userData.profile_name;
    payload.role = userData.role;
    payload.birthday = userData.birthday;
    payload.locality = userData.locality;
    payload.biography = userData.biography;

    res.send({
      status: 'ok',
      data: payload
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

// GET - /users
async function getAllUsers(req, res, next) {
  let connection;

  try {
    connection = await getConnection();

    const [result] = await connection.query(
      `
      SELECT * FROM users  
    `,
    );

    // Throw 404 if no results
    if (!result.length) {
      throw generateError(`No hay ningun usuario registrado`, 404);
    }

    res.send({
      status: 'ok',
      data: result
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

// POST - /users/login
async function loginUser(req, res, next) {

  let connection;

  try {
    await userSchema.validateAsync(req.body);

    const { email, user_password } = req.body;

    connection = await getConnection();

    // Find the user in the db by email
    const [
      dbUser
    ] = await connection.query(
      'SELECT id, email, user_password, role from users where email=? AND active=1',
      [email]
    );
    console.log(dbUser)

    if (!dbUser.length) {
      throw generateError(
        'There is no active user with that email in the BBDD. If you just registered, validate the email',
        404
      );
    }

    const [user] = dbUser;

    const passwordsMath = await bcrypt.compare(user_password, user.user_password);

    if (!passwordsMath) {
      throw generateError('Incorrect Password', 401);
    }

    // Build jsonwebtoken
    const tokenPayload = { id: user.id, role: user.role };
    const token = jwt.sign(tokenPayload, process.env.SECRET, {
      expiresIn: '30d'
    });

    // Create response
    res.send({
      status: 'ok',
      message: 'Correct login',
      data: { token, user }
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

// PUT - /users/:id
async function editUser(req, res, next) {
  let connection;

  try {
    await editUserSchema.validateAsync(req.body);

    const { id } = req.params;
    console.log(id)
    const { email, tlf, user_login } = req.body;
    console.log(email)

    connection = await getConnection();

    // Check if user exists

    const [current] = await connection.query(
      `
      SELECT id, avatar_img FROM users WHERE id=?
    `,
      [id]
    );
    console.log(id)
    console.log(current)
    if (!current.length) {
      throw generateError(`The user with id ${id} does not exist`, 404);
    }

    // Check if auth user is the same as :id or is admin
    if (current[0].id !== req.auth.id && req.auth.role !== 'admin') {
      throw generateError('You do not have permission to edit this user', 401);
    }

    // Check if there is a uploaded avatar and process it

    let savedFileName;

    if (req.files && req.files.avatar) {
      try {
        savedFileName = await processAndSavePhoto(req.files.avatar);

        if (current && current.avatar) {
          await deletePhoto(current.avatar);
        }
      } catch (error) {
        throw generateError('Can not process upload image. Try again.', 400);
      }
    } else {
      savedFileName = current.avatar;
    }

    // Update user

    await connection.query(
      `
      UPDATE users SET user_login=?, email=?, avatar_img=?, tlf=? WHERE id=?
    `,
      [user_login, email, savedFileName, tlf, id]
    );

    res.send({ status: 'ok', message: 'User update' });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

// POST - /users/:id/password
async function updatePasswordUser(req, res, next) {
  let connection;

  try {
    const { id } = req.params;
    // body: oldpassword, newPassword, newPasswordRepeat (opcional)
    connection = await getConnection();

    await editPasswordUserSchema.validateAsync(req.body);

    const { oldPassword, newPassword } = req.body;
    // Comprobar que el usuario del token es el mismo que el que vamos a cambiar la pass

    if (Number(id) !== req.auth.id) {
      throw generateError(
        `You do not have permissions to change the user's password with id ${id}`,
        401
      );
    }

    if (oldPassword === newPassword) {
      throw generateError(
        'The new password cannot be the same as the old one',
        400
      );
    }

    // Sacar la info del usuario de la base de datos
    const [currentUser] = await connection.query(
      `
      SELECT id, user_password from users where id=?
      `,
      [id]
    );

    // Código un poco redundante
    if (!currentUser.length) {
      throw generateError(`User with id ${id} dont exists`, 404);
    }

    const [dbUser] = currentUser;

    // Comprobar que la vieja password envíada sea la correcta
    // el orden es: passord sin encriptar, password encriptada
    const passwordsMath = await bcrypt.compare(oldPassword, dbUser.user_password);

    if (!passwordsMath) {
      throw generateError('Your old password are incorrect', 401);
    }
    // generar hash de la password
    const dbNewPassword = await bcrypt.hash(newPassword, 10);

    // actualizar la base de datos
    await connection.query(
      `
      UPDATE users SET user_password=?, user_password_last_update=UTC_TIMESTAMP WHERE id=?
    `,
      [dbNewPassword, id]
    );

    res.send({
      status: 'ok',
      message:
        'Password change done correctly. All your tokens are invalidated. Please login again to get a valid token.'
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

// DELETE - /users/:id
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    await connection.query('DELETE FROM users WHERE id=?', [id]);

    connection.release()

    res.send({
      status: 'ok',
      message: `The user with id ${id} has been deleted`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  newUser,
  loginUser,
  getUser,
  editUser,
  updatePasswordUser,
  validateUser,
  getUserName,
  getAllUsers,
  deleteUser
};