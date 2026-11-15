const request = require('supertest');
const app = require('../src/app');

require('./setup');

describe('Authentication & Authorization Suite', () => {
  it('should register a new user successfully with safe profile response (no password leaked)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
        password: 'Password123',
        phone: '9876543210',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('aarav@example.com');
    expect(res.body.data.user.password).toBeUndefined(); // Password hash must NEVER be returned
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject registration with duplicate email address', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'duplicate@example.com',
      password: 'Password123',
    });

    const duplicateRes = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'duplicate@example.com',
      password: 'Password123',
    });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  it('should reject registration with weak password (missing uppercase or numbers)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak Pass',
      email: 'weak@example.com',
      password: 'weak',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate user with valid credentials and reject invalid credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Tester',
      email: 'login@example.com',
      password: 'CorrectPassword123',
    });

    // Valid login
    const validRes = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'CorrectPassword123',
    });

    expect(validRes.status).toBe(200);
    expect(validRes.body.data.accessToken).toBeDefined();

    // Invalid password
    const invalidRes = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword123',
    });

    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body.success).toBe(false);
  });

  it('should protect /api/auth/me against unauthenticated access', async () => {
    const unauthRes = await request(app).get('/api/auth/me');
    expect(unauthRes.status).toBe(401);

    // Register and use token
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Token Tester',
      email: 'token@example.com',
      password: 'SecurePassword123',
    });
    const token = regRes.body.data.accessToken;

    const authRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.data.user.email).toBe('token@example.com');
  });
});
