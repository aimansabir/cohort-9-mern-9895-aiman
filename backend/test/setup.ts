// env.ts reads these when it is first imported and throws if any are
// missing, so they are set here rather than relying on a local .env file
// that will not exist on someone else's machine or in CI.
process.env['NODE_ENV'] = 'test';
// fatal, because several tests make the server fail on purpose and the stack
// traces would otherwise bury the test output
process.env['LOG_LEVEL'] = 'fatal';

// none of these are real credentials, they only have to satisfy the
// shape checks in env.ts
process.env['JWT_SECRET'] = 'test-only-secret-value-long-enough-for-the-check';
process.env['JWT_EXPIRES_IN'] = '1d';
process.env['DUMMY_PASSWORD_HASH'] = '$2b$12$BlnmY.zAnM/XsX6m810BYexyFmsQMfngAuhLzEZl.h8EJKcot.Bzu';
process.env['DB_USER'] = 'test_user';
process.env['DB_NAME'] = 'test_db';
process.env['DB_PASSWORD'] = '';
