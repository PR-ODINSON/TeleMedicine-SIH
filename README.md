# 🏥 TeleMedicine Platform

A comprehensive digital healthcare platform built for the **Smart India Hackathon (SIH)**, providing seamless telemedicine services, AI-powered health assistance, and e-pharmacy solutions.

![Telemedicine Platform](https://img.shields.io/badge/Status-Production%20Ready-green) ![React](https://img.shields.io/badge/React-19.0.0-blue) ![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red) ![MongoDB](https://img.shields.io/badge/MongoDB-6.19.0-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)

## 🌟 Key Features

### 🔐 **Multi-Role Authentication System**
- **Patient Portal**: Complete health management dashboard
- **Doctor Portal**: Professional consultation management interface
- **Secure JWT Authentication**: HTTP-only cookies with role-based access control
- **Profile Management**: Comprehensive user profiles with medical history

### 🎥 **Real-Time Video Consultations**
- **WebRTC Video Calls**: High-quality peer-to-peer video communication
- **Real-Time Chat**: Instant messaging during consultations
- **Call Management**: Start, accept, reject, and cancel call functionality
- **Session Recording**: Consultation history and session management
- **Socket.IO Integration**: Real-time bidirectional communication

### 🤖 **AI-Powered Health Assistant**
- **Intelligent Chatbot**: Health recommendations and symptom analysis
- **Medicine Recommendation**: AI-driven medicine suggestions based on symptoms
- **OCR Prescription Reader**: Extract text from prescription images using Tesseract
- **Voice Commands**: Speech recognition and text-to-speech capabilities
- **Machine Learning Models**: TF-IDF vectorization for intelligent matching

### 💊 **Complete E-Pharmacy Solution**
- **Medicine Shop**: Browse and search thousands of medicines
- **Shopping Cart**: Add, remove, and manage medicine orders
- **Secure Checkout**: Integrated payment gateway (Razorpay)
- **Order Tracking**: Real-time order status and delivery tracking
- **Prescription Upload**: Digital prescription management

### 📅 **Smart Appointment System**
- **Doctor Discovery**: Search and filter doctors by specialization, location, rating
- **Real-Time Booking**: Instant appointment scheduling with availability
- **Calendar Integration**: Comprehensive appointment management
- **Automated Notifications**: Email and in-app notification system
- **Consultation History**: Complete medical record management

### 🗺️ **Location-Based Services**
- **Hospital Finder**: Nearby hospitals using OpenStreetMap API
- **Interactive Maps**: Leaflet integration for location services
- **Geo-location**: Automatic location detection and services

### 📊 **Advanced Dashboard Analytics**
- **Patient Dashboard**: Health metrics, upcoming appointments, medical records
- **Doctor Dashboard**: Patient management, consultation history, earnings
- **Real-Time Statistics**: Live data updates and analytics
- **Notification Center**: Centralized communication hub

## 🏗️ Architecture Overview

### **Frontend (React + TypeScript)**
- **Framework**: React 19.0.0 with TypeScript for type safety
- **UI Library**: Tailwind CSS 4.0 for modern, responsive design
- **State Management**: React Context API for global state
- **Routing**: React Router DOM for SPA navigation
- **Real-Time**: Socket.IO client for live updates
- **Build Tool**: Vite for fast development and optimized builds

### **Backend (NestJS + TypeScript)**
- **Framework**: NestJS 10.0 with decorator-based architecture
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport.js strategies
- **File Upload**: Multer for image and document handling
- **API Documentation**: Swagger/OpenAPI integration
- **WebSockets**: Socket.IO for real-time communication

### **AI/ML Services (Flask + Python)**
- **Framework**: Flask for lightweight AI service endpoints
- **Machine Learning**: Scikit-learn for recommendation algorithms
- **NLP Processing**: TF-IDF vectorization for text analysis
- **Computer Vision**: OpenCV and Tesseract for image processing
- **Data Processing**: Pandas for efficient data manipulation

## 📁 Project Structure

```
TeleMedicine/
├── 📱 frontend/                    # React TypeScript Frontend
│   ├── src/
│   │   ├── Components/            # Reusable UI Components
│   │   │   ├── About.tsx
│   │   │   ├── AppointmentBooking.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   ├── ConsultationService.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── DoctorSidebar.tsx
│   │   │   ├── FAQ.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── PrescriptionForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── VideoCallNotification.tsx
│   │   │   └── VideoCallPopup.tsx
│   │   ├── Pages/
│   │   │   ├── Patient/           # Patient Portal Pages
│   │   │   │   ├── Appointments.tsx
│   │   │   │   ├── Cart.tsx
│   │   │   │   ├── Checkout.tsx
│   │   │   │   ├── ConsultationHistory.tsx
│   │   │   │   ├── DoctorsList.tsx
│   │   │   │   ├── MedicineRecommendation.tsx
│   │   │   │   ├── MedicineShop.tsx
│   │   │   │   ├── Notifications.tsx
│   │   │   │   ├── Orders.tsx
│   │   │   │   ├── OrderSuccess.tsx
│   │   │   │   ├── PatientDashboard.tsx
│   │   │   │   ├── PatientSupport.tsx
│   │   │   │   ├── Prescription.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   └── VideoCall.tsx
│   │   │   ├── Doctor/            # Doctor Portal Pages
│   │   │   │   ├── ConsultationHistory.tsx
│   │   │   │   ├── DoctorDashboard.tsx
│   │   │   │   ├── PatientList.tsx
│   │   │   │   ├── PrescribedPatients.tsx
│   │   │   │   └── VideoConsultation.tsx
│   │   │   ├── LandingPage.tsx    # Public Landing Page
│   │   │   ├── SigninPage.tsx     # Authentication
│   │   │   └── SignupPage.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # Authentication Context
│   │   ├── assets/                # Images and Static Assets
│   │   └── App.tsx               # Main Application Component
│   ├── public/                    # Public Assets
│   ├── package.json              # Frontend Dependencies
│   ├── tailwind.config.js        # Tailwind Configuration
│   ├── vite.config.js           # Vite Build Configuration
│   └── vercel.json              # Vercel Deployment Config
│
├── 🚀 backend/                     # NestJS TypeScript Backend
│   ├── src/
│   │   ├── auth/                 # Authentication Module
│   │   ├── appointments/         # Appointment Management
│   │   ├── doctors/              # Doctor Management
│   │   ├── patients/             # Patient Management
│   │   ├── video-call/           # Video Call System
│   │   ├── medicines/            # Medicine Management
│   │   ├── cart/                 # Shopping Cart
│   │   ├── orders/               # Order Management
│   │   ├── prescriptions/        # Prescription Management
│   │   ├── notifications/        # Notification System
│   │   ├── chat-history/         # Chat History
│   │   ├── ai-ml/                # AI/ML Integration
│   │   ├── uploads/              # File Upload System
│   │   ├── database/             # Database Configuration
│   │   ├── schemas/              # MongoDB Schemas
│   │   ├── dto/                  # Data Transfer Objects
│   │   ├── app.controller.ts     # Main App Controller
│   │   ├── app.module.ts        # Main App Module
│   │   └── main.ts              # Application Entry Point
│   ├── models/                   # Database Models
│   ├── uploads/                  # File Upload Storage
│   ├── package.json             # Backend Dependencies
│   ├── nest-cli.json           # NestJS CLI Configuration
│   └── video-consultation-test-guide.md
│
├── 🧠 flaskServer/                # AI/ML Python Backend
│   ├── app.py                   # Main Flask Application
│   ├── Chatbot.py              # AI Chatbot Logic
│   ├── MedicineRecommend.py    # Medicine Recommendation Engine
│   ├── Maps.py                 # Location Services
│   ├── requirements.txt        # Python Dependencies
│   ├── A_Z_medicines_dataset_of_India.csv  # Medicine Database
│   ├── diet.csv                # Diet Recommendations
│   ├── workout.csv             # Workout Suggestions
│   └── precautions.csv         # Medical Precautions
│
├── package.json                 # Root Package Configuration
└── README.md                   # This Documentation
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v6.0 or higher)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/telemedicine.git
cd telemedicine
```

### 2. Backend Setup (NestJS)
```bash
cd backend
npm install
npm run start:dev
# Server runs on http://localhost:3000
# API Documentation: http://localhost:3000/api/docs
```

### 3. Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
# Application runs on http://localhost:5173
```

### 4. AI/ML Services Setup (Flask)
```bash
cd flaskServer
pip install -r requirements.txt
python app.py
# AI services run on http://localhost:5000
```

### 5. Database Setup
- Install MongoDB locally or use MongoDB Atlas
- Default connection: `mongodb://127.0.0.1:27017/TeleMedicine`
- Database seeding is automatic on first run

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/TeleMedicine
JWT_SECRET=your-jwt-secret-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

#### Flask Server (.env)
```env
FLASK_ENV=development
FLASK_DEBUG=True
GEMINI_API_KEY=your-gemini-api-key
MONGODB_URI=mongodb://127.0.0.1:27017/TeleMedicine
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /register              # User registration
POST /login                 # User login  
GET  /logout                # User logout
GET  /profile               # Get user profile
PUT  /profile               # Update user profile
```

### Doctor Management
```
GET    /api/doctors                    # Get all doctors
GET    /api/doctors/:id                # Get doctor by ID
GET    /api/doctors?specialization=X   # Filter by specialization
PUT    /api/doctors/:id                # Update doctor profile
DELETE /api/doctors/:id                # Delete doctor
```

### Patient Management
```
GET    /api/patients           # Get all patients
GET    /api/patients/:id       # Get patient by ID
PUT    /api/patients/:id       # Update patient profile
DELETE /api/patients/:id       # Delete patient
```

### Appointment System
```
POST   /api/appointments              # Create appointment
GET    /api/appointments              # Get all appointments
GET    /api/appointments/:id          # Get appointment by ID
PUT    /api/appointments/:id          # Update appointment
DELETE /api/appointments/:id          # Cancel appointment
GET    /api/appointments?doctorId=X   # Doctor's appointments
GET    /api/appointments?patientId=X  # Patient's appointments
```

### Video Consultation
```
POST   /api/video-consultation/start-call     # Start video call
PUT    /api/video-consultation/join-call/:id  # Join video call
PUT    /api/video-consultation/end-call/:id   # End video call
PUT    /api/video-consultation/reject-call/:id # Reject video call
GET    /api/video-consultation/active-calls   # Get active calls
```

### Medicine & Pharmacy
```
GET    /api/medicines              # Get all medicines
GET    /api/medicines/:id          # Get medicine by ID
POST   /api/medicines/search       # Search medicines
GET    /api/cart                   # Get shopping cart
POST   /api/cart/add               # Add to cart
DELETE /api/cart/remove/:id        # Remove from cart
POST   /api/orders                 # Create order
GET    /api/orders                 # Get order history
GET    /api/orders/:id             # Get order details
```

### AI/ML Services (Flask)
```
POST   /chatbot                    # AI chatbot interaction
POST   /medicine-recommend         # Get medicine recommendations
POST   /ocr-prescription          # Extract text from prescription images
POST   /voice-command             # Process voice commands
GET    /nearby-hospitals          # Find nearby hospitals
```

## 🎯 Key Features in Detail

### 1. Video Consultation System
- **WebRTC Implementation**: Peer-to-peer video communication
- **Socket.IO Gateway**: Real-time signaling server
- **Call States**: Pending → Active → Ended/Rejected
- **Chat Integration**: Real-time messaging during calls
- **Session Management**: Automatic cleanup and history

### 2. AI-Powered Health Assistant
- **Symptom Analysis**: Machine learning-based symptom checking
- **Medicine Recommendations**: TF-IDF vectorization for smart matching
- **Voice Interface**: Speech recognition with pyttsx3 and SpeechRecognition
- **OCR Technology**: Prescription reading using Tesseract
- **Health Tips**: Personalized diet, workout, and precaution suggestions

### 3. E-Commerce Medicine Shop
- **Comprehensive Catalog**: 1000+ medicines with detailed information
- **Smart Search**: Fuzzy matching for medicine names
- **Shopping Cart**: Session-based cart management
- **Payment Integration**: Secure Razorpay payment gateway
- **Order Tracking**: Real-time order status updates

### 4. Real-Time Notifications
- **Socket.IO Integration**: Instant notifications across the platform
- **Multi-Channel**: In-app, email, and push notifications
- **Event-Driven**: Appointment reminders, call notifications, order updates
- **User Preferences**: Customizable notification settings

### 5. Location-Based Services
- **Hospital Finder**: OpenStreetMap integration for nearby hospitals
- **Interactive Maps**: Leaflet maps with custom markers
- **Geolocation**: Automatic location detection
- **Distance Calculation**: Proximity-based search results

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure HTTP-only cookie-based authentication
- **Role-Based Access**: Patient and Doctor role separation
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Management**: Automatic token refresh and expiry

### Data Protection
- **Input Validation**: Class-validator for request validation
- **XSS Protection**: Content Security Policy headers
- **CORS Configuration**: Restricted cross-origin access
- **File Upload Security**: Type and size restrictions

## 🚀 Deployment

### Production Deployment

#### Frontend (Vercel)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

#### Backend (Railway/Heroku/AWS)
```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

#### Flask Services (Python Anywhere/Heroku)
```bash
# Install dependencies
pip install -r requirements.txt

# Set production environment
export FLASK_ENV=production

# Start production server
gunicorn app:app
```

## 🐛 Troubleshooting

### Common Issues

#### Video Call Problems
```bash
# Check WebSocket connection
npx wscat -c ws://localhost:3000/video-consultation

# Verify ICE servers configuration
# Check browser WebRTC support
```

#### Database Connection Issues
```bash
# Check MongoDB status
mongosh "mongodb://127.0.0.1:27017/TeleMedicine"

# Verify connection string
# Check firewall settings
```

#### AI Service Issues
```bash
# Check Flask server status
curl http://localhost:5000/health

# Verify Python dependencies
pip list | grep -E "(flask|scikit-learn|opencv)"
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Smart India Hackathon**: Platform and opportunity
- **OpenStreetMap**: Location services and mapping data
- **React Community**: UI component libraries and tools
- **NestJS Team**: Backend framework and ecosystem
- **MongoDB**: Database platform and tools
- **Open Source Community**: Libraries and contributions

---

<div align="center">

**Built with ❤️ for Smart India Hackathon 2024**

[🌐 Live Demo](https://tele-medicine-sih-b6xz.vercel.app) | [📖 Documentation](https://docs.telemedicine.com) | [🐛 Report Bug](https://github.com/your-username/telemedicine/issues) | [✨ Request Feature](https://github.com/your-username/telemedicine/issues)

</div>
