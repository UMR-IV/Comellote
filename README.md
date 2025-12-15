# Comellote 🧁

A modern, responsive online bakery ordering platform built with JavaScript and Firebase. Browse pastries, cakes, cookies, and traditional Malaysian treats.

- **Production Website:** https://comellote.web.app
- **Development Website:** https://cmlt-e5d5e.web.app

## Tech Stack 🛠️

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Firebase (Realtime Database, Authentication)
- **Deployment:** Firebase Hosting
- **Version Control:** Git & GitHub

## Quick Start 🚀

### **Prerequisites**
- Node.js and npm installed
- A Firebase project (free tier available)

### 1. **Develop the Website**

### 2. **Configure Firebase**

Get your Firebase config from [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps

Create `firebase-config.js` with your Firebase credentials (see `firebase-config.example.js` for template)

### 3. **Install & login into Firebase**
```bash
npm install -g firebase-tools
firebase login
```

### 4. **Run Locally**
```bash
python -m http.server 8000
```

Visit: `http://localhost:8000`

### 5. **Deploy to Firebase Hosting**
```bash
firebase deploy
```

## Project Structure 📁

```
CMLT-Web/
├── menu.html                  # Main HTML file
├── script.js                  # JavaScript logic (ES6 modules)
├── styles.css                 # CSS styling
├── firebase-config.js         # Firebase configuration (NOT committed)
├── firebase-config.example.js # Firebase config template
├── firebase.json              # Firebase Hosting config
├── .firebaserc                # Firebase project reference
├── assets/                    # Product images
└── README.md                  # This file
```

## Security 🔒

- ⚠️ **Never commit `firebase-config.js`** - It's in `.gitignore`
- 🔐 **Firebase Security Rules** protect your database, make sure to set it up securely
