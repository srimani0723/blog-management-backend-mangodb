const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Initialize app
const app = express();
app.use(express.json());

console.log(process.env.MONGO_URI);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Editor", "User"], default: "User" },
  isVerified: { type: Boolean, default: false }, // For bonus email verification
});

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  assignedEditor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const User = mongoose.model("User", userSchema);
const Blog = mongoose.model("Blog", blogSchema);

// Helper Functions
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

const authorize = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient Permissions" });
  }
  next();
};

// Routes
// User Registration
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error registering user", error: err.message });
  }
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Create Blog (Admin only)
app.post("/blogs", authenticate, authorize("Admin"), async (req, res) => {
  const { title, content } = req.body;

  try {
    const blog = new Blog({ title, content });
    await blog.save();
    res.status(201).json({ message: "Blog created successfully", blog });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating blog", error: err.message });
  }
});

// Assign Blog to Editor (Admin only)
app.put(
  "/blogs/:id/assign",
  authenticate,
  authorize("Admin"),
  async (req, res) => {
    const { id } = req.params;
    const { editorId } = req.body;

    try {
      const blog = await Blog.findById(id);
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      if (blog.assignedEditor)
        return res
          .status(400)
          .json({ message: "Blog already assigned to an editor" });

      blog.assignedEditor = editorId;
      await blog.save();
      res.status(200).json({ message: "Blog assigned successfully", blog });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error assigning blog", error: err.message });
    }
  }
);

// Edit Blog (Editor only)
app.put("/blogs/:id", authenticate, authorize("Editor"), async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const blog = await Blog.findOne({ _id: id, assignedEditor: req.user.id });
    if (!blog)
      return res
        .status(404)
        .json({ message: "Blog not found or not assigned to you" });

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    await blog.save();
    res.status(200).json({ message: "Blog updated successfully", blog });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating blog", error: err.message });
  }
});

// View Blogs (All users)
app.get("/blogs", authenticate, async (req, res) => {
  try {
    const blogs = await Blog.find().populate(
      "assignedEditor",
      "username email"
    );
    res.status(200).json({ blogs });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving blogs", error: err.message });
  }
});

// Add Comment to Blog (User)
app.post("/blogs/:id/comments", authenticate, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.comments.push({ user: req.user.id, content });
    await blog.save();
    res.status(200).json({ message: "Comment added successfully", blog });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding comment", error: err.message });
  }
});

// Delete Comment (User)
app.delete(
  "/blogs/:blogId/comments/:commentId",
  authenticate,
  async (req, res) => {
    const { blogId, commentId } = req.params;

    try {
      const blog = await Blog.findById(blogId);
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      const comment = blog.comments.id(commentId);
      if (!comment)
        return res.status(404).json({ message: "Comment not found" });

      if (comment.user.toString() !== req.user.id)
        return res
          .status(403)
          .json({ message: "You can only delete your own comments" });

      comment.remove();
      await blog.save();
      res.status(200).json({ message: "Comment deleted successfully", blog });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error deleting comment", error: err.message });
    }
  }
);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
