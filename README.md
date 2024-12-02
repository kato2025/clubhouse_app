Clubhouse App - README

Welcome to the Clubhouse App, an exclusive messaging platform where users can post, view, and interact with messages in a secure and engaging environment. The app features robust authentication, role-based permissions, and a dynamic user experience styled to resemble popular messaging platforms.

Features

- User Authentication
- Secure registration and login with password hashing using bcrypt.

Messaging System
Users can create, view, edit, and delete messages. Messages include a title, content, and timestamp.

Role Upgrades

- Use a secret passcode to become a member.
- Use an admin passcode to gain admin privileges.

Public and Private Views

- Public visitors see posts but not their authors.
  Logged-in members:
- See the authors of messages.
- Manage messages, enforce community guidelines, and oversee membership.

Technologies Used

Backend

- Node.js: JavaScript runtime environment for building server-side logic.
- Express.js: Web application framework for routing and middleware.
- PostgreSQL: Relational database for storing users, messages, and roles.
- Passport.js: Authentication middleware for secure login and sessions.
- Bcrypt.js: Library for hashing and verifying passwords.

Frontend

- EJS (Embedded JavaScript Templates): Dynamic template engine for rendering HTML with data.
- CSS: Custom styles to enhance the app's appearance.

Other Tools and Libraries

- pg (node-postgres): PostgreSQL client for Node.js.
- dotenv: Environment variable management for sensitive configuration details.
- Express-session: Session management for authenticated users.
- Connect-flash: Flash messaging for displaying user notifications.
- Method-override: Allows usage of HTTP verbs like PUT and DELETE in HTML forms.
  Development
- Nodemon: Development tool for automatically restarting the server on changes.
- Git: Version control for tracking and managing changes.
- Render: Hosting platform for deploying the app.
- Neon: Hosting platform for deploying PostgreSQL database.

License
This project is open-source and available under the MIT License.
