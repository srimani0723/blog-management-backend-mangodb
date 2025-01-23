# Blog Management API

A role-based Blog Management API built with Node.js, Express, and MongoDB. The API supports Admin, Editor, and User roles to handle authentication, blog management, and comments. Admins can create and assign blogs, while Editors can modify assigned blogs, and Users can comment on blogs.

### LIVE API LINK

> Deployed in the vercel, the following:
> [https://blog-management-backend-mangodb.vercel.app/](https://blog-management-backend-mangodb.vercel.app/)

## Features

- User Registration and Login
- Role-based Access Control (Admin, Editor, User)
- Create, Edit, View Blogs
- Assign Blogs to Editors
- Add, Delete Comments on blogs

## Prerequisites

- Node.js (version >= 14.x)
- MongoDB (Local or Remote)

# Setup and Installation

1.  Clone the repository

    ```bash
    git clone https://github.com/your-username/blog-management-api.git
    cd blog-management-api
    ```

2.  Install dependencies

    ```bash
    npm install
    ```

3.  Set up environment variables

    Create a .env file in the root of your project and add the following:

    ```bash
    MONGO_URI=mongodb://your_mongo_connection_string
    JWT_SECRET=your_jwt_secret
    PORT=5000
    ```

Replace your_mongo_connection_string with your MongoDB URI and your_jwt_secret with a secret key for JWT generation.

4. Start the server
   ```bash
   npm start
   ```
   The server will run on port 5000 by default.

# API Documentation

## Authentication

1. Register User

   Endpoint: `POST /register`

   Body:

   ```json
   {
     "username": "testuser",
     "email": "test@example.com",
     "password": "yourpassword",
     "role": "User"
   }
   ```

   > role: default is "User" or Optional -> "Admin" , "Editor"

- Response:

  ```json
  {
    "message": "User registered successfully!"
  }
  ```

2. Login User

   Endpoint: `POST /login`

   Body:

   ```json
   {
     "email": "test@example.com",
     "password": "yourpassword"
   }
   ```

- Response:
  ```json
  {
    "message": "Login successful",
    "token": "your-jwt-token"
  }
  ```

## Blog Management

3. Create Blog (Admin only)

   Endpoint: `POST /blogs`

   Headers: Authorization: Bearer <JWT_TOKEN>

   Body:

   ```json
   {
     "title": "My First Blog",
     "content": "This is the content of my first blog."
   }
   ```

- Response:
  ```json
  {
    "message": "Blog created successfully",
    "blog": {
      "_id": "blogId",
      "title": "My First Blog",
      "content": "This is the content of my first blog.",
      "assignedEditor": null,
      "comments": []
    }
  }
  ```

4. Assign Blog to Editor (Admin only)

   Endpoint: `PUT /blogs/:id/assign`

   Headers: Authorization: Bearer <JWT_TOKEN>

   Body:

   ```json
   {
     "editorId": "editorUserId"
   }
   ```

- Response:
  ```json
  {
    "message": "Blog assigned successfully",
    "blog": {
      "_id": "blogId",
      "assignedEditor": "editorUserId"
    }
  }
  ```

5. Edit Blog (Editor only)

   Endpoint: `PUT /blogs/:id`

   Headers: Authorization: Bearer <JWT_TOKEN>

   Body:

   ```json
   {
     "title": "Updated Blog Title",
     "content": "Updated blog content."
   }
   ```

- Response:
  ```json
  {
    "message": "Blog updated successfully",
    "blog": {
      "_id": "blogId",
      "title": "Updated Blog Title",
      "content": "Updated blog content."
    }
  }
  ```

6. View Blogs

   Endpoint: `GET /blogs`

   Headers: Authorization: Bearer <JWT_TOKEN>

- Response:
  ```json
  {
    "blogs": [
      {
        "_id": "blogId",
        "title": "Blog Title",
        "content": "Blog content",
        "assignedEditor": {
          "username": "editorUser",
          "email": "editor@example.com"
        },
        "comments": [
          {
            "user": "userId",
            "content": "Great post!",
            "createdAt": "2025-01-01T00:00:00Z"
          }
        ]
      }
    ]
  }
  ```

7. Add Comment to Blog

   Endpoint: `POST /blogs/:id/comments`

   Headers: Authorization: Bearer <JWT_TOKEN>

   Body:

   ```json
   {
     "content": "This is a comment on the blog."
   }
   ```

- Response:
  ```json
  {
    "message": "Comment added successfully",
    "blog": {
      "_id": "blogId",
      "comments": [
        {
          "user": "userId",
          "content": "This is a comment on the blog."
        }
      ]
    }
  }
  ```

8. Delete Comment (User)

   Endpoint: `DELETE /blogs/:blogId/comments/:commentId`

   Headers: Authorization: Bearer <JWT_TOKEN>

- Response:
  ```json
  {
    "message": "Comment deleted successfully",
    "blog": {
      "_id": "blogId",
      "comments": []
    }
  }
  ```

# Testing the API

To test the API:

1. Use tools like Postman or Insomnia to make HTTP requests.
2. Use the JWT token returned from the Login endpoint to authenticate requests that require authorization (such as creating blogs, assigning editors, etc.).
3. Refer to the API documentation above for the request formats and expected responses.

Deployment
Deploying Locally
Ensure MongoDB is running on your local machine or use a cloud-based MongoDB service (like MongoDB Atlas) and set the MONGO_URI in your .env file accordingly.

Run the following command to start the server locally:

```bash
npm start
```

By default, the server will run on [http://localhost:5000](http://localhost:5000).

## Deploying to Production

For production, you can deploy the API to platforms like:

- Heroku
- Vercel
- AWS (EC2, Lambda)
- DigitalOcean
  Ensure to set environment variables (like MONGO_URI and JWT_SECRET) in the platform’s environment settings.

> vercel

Add `vercel.json` file and copy this

```bash
{
  "version": 2,
  "builds": [
    {
      "src": "/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/app.js"
    }
  ]
}
```

and then deploy in vercel
