# 🔧 Backend Setup Instructions

## For Developers

### First Time Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your actual credentials
   # Ask your team lead for the MongoDB URI and other secrets
   ```

3. **Update `.env` File**
   Open `.env` and fill in the required values:
   - `MONGODB_URI`: Get this from MongoDB Atlas or your database admin
   - `JWT_SECRET`: For future authentication (can keep default for now)
   - `PORT`: Backend server port (default: 5000)

4. **Start the Server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # OR production mode
   npm start
   ```

---

## Environment Variables

### Required
- **`MONGODB_URI`**: MongoDB connection string
  - **How to get it**: MongoDB Atlas → Connect → Connect Your Application
  - **Format**: `mongodb+srv://username:password@cluster.mongodb.net/SupplementDB`

### Optional
- **`PORT`**: Server port (default: 5000)
- **`JWT_SECRET`**: Secret key for JWT tokens (for future authentication)
- **`FRONTEND_URL`**: Frontend URL for CORS (default: http://localhost:3001)
- **`GYM_APP_URL`**: Gym app URL for CORS (default: http://localhost:80)

---

## 🔐 Security Notes

### ⚠️ IMPORTANT
- **NEVER commit `.env`** to git - it contains sensitive credentials
- `.env` is already in `.gitignore` and will not be tracked
- **ALWAYS commit `.env.example`** for other developers

### Sharing Credentials with Team
When a new developer joins:
1. Send them the actual `.env` values via secure channel (Slack DM, 1Password, etc.)
2. Tell them to create `.env` file with those values
3. **DO NOT** send credentials via email or public channels

---

## 📁 File Structure

```
backend/
├── .env               ← Your actual credentials (gitignored, DO NOT COMMIT)
├── .env.example       ← Template for developers (COMMIT THIS)
├── app.js            ← Main application file
├── package.json      ← Dependencies
└── ...
```

---

## ✅ Verifying Setup

After starting the server, you should see:
```
Server running on port 5000
DB connection successful!
MongoDB connected to: MongoDB Atlas
```

If you see an error about `MONGODB_URI`, check that:
1. `.env` file exists in `backend/` directory
2. `MONGODB_URI` is correctly set in `.env`
3. MongoDB connection string is valid

---

## 🆘 Common Issues

### Error: "MONGODB_URI is not defined"
**Solution**: Create `.env` file from `.env.example` and add your credentials

### Error: "Cannot find module 'dotenv'"
**Solution**: Run `npm install`

### Error: "Connection refused" or "ECONNREFUSED"
**Solution**: Check that MongoDB URI is correct and MongoDB Atlas allows your IP

### Error: "Authentication failed"
**Solution**: Check username/password in MongoDB connection string

---

## 🚀 For Production Deployment

1. Create `.env` on production server
2. Use strong, unique `JWT_SECRET` (generate with: `openssl rand -hex 32`)
3. Set `NODE_ENV=production`
4. Never expose `.env` file
5. Use environment variables from your hosting platform (Heroku, AWS, etc.)

---

## 📞 Need Help?

Contact your team lead or check the main README.md for more information.

