"""Authentication services
CURRENTLY in backend node"""

"""First, they'll need user registration. That involves creating a new user with a username and password,
hashing the password for security. Then, there's the login process, which verifies the credentials and 
generates a JWT token for session management. Password reset functionality is also important,
which might involve sending a reset link via email. Additionally, token validation and refreshing tokens 
would be necessary to maintain secure sessions.

I should remember to use secure password hashing, maybe with bcrypt. JWT tokens are standard for handling
authentication tokens, so using PyJWT makes sense. Including functions for registration, login, password reset, 
token refresh, and logout (token invalidation) would cover the basics. Also, input validation using Pydantic 
models will help ensure data integrity. Error handling is crucial here to catch issues like duplicate usernames
or invalid tokens.

Oh, and integrating with the existing database models they have, like the User model from `database.models`.
They'll need to check for existing users during registration and verify passwords during login. Sending emails
for account confirmation and password resets would require the email service they have in place. I should also
mention security considerations like using HTTPS and secure cookies for tokens."""
