const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const dirs = ['logs', 'uploads', 'temp', 'reports'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================
// LOGGING SETUP
// ============================================
const logStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);

// ============================================
// MIDDLEWARE
// ============================================
// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://*.supabase.co", "ws://localhost:*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: isProduction ? ['https://emms.com'] : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('dev'));

// ============================================
// STATIC FILES
// ============================================
// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// API ROUTES - Mock API for Frontend Development
// ============================================
const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'EMMS Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Server Info
apiRouter.get('/info', (req, res) => {
  res.json({
    name: 'EMMS Backend API',
    version: '1.0.0',
    description: 'Equipment Maintenance Management System API',
    endpoints: {
      '/api/health': 'Health check',
      '/api/info': 'Server information',
      '/api/auth/login': 'User login',
      '/api/auth/register': 'User registration',
      '/api/auth/logout': 'User logout',
      '/api/equipment': 'Equipment management',
      '/api/maintenance': 'Maintenance management',
      '/api/requests': 'Request management',
      '/api/users': 'User management',
      '/api/technicians': 'Technician management',
      '/api/notifications': 'Notification management',
      '/api/reports': 'Report generation'
    }
  });
});

// ============================================
// AUTH ROUTES
// ============================================
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock users
  const users = {
    'admin@emms.com': { id: '1', name: 'John Admin', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=John+Admin&background=3b82f6&color=fff' },
    'user@emms.com': { id: '2', name: 'Jane User', role: 'user', avatar: 'https://ui-avatars.com/api/?name=Jane+User&background=22c55e&color=fff' },
    'tech@emms.com': { id: '3', name: 'Bob Technician', role: 'technician', avatar: 'https://ui-avatars.com/api/?name=Bob+Technician&background=f59e0b&color=fff' }
  };

  const user = users[email];
  if (user) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        ...user,
        email,
        token: 'mock-jwt-token-' + Date.now()
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
});

apiRouter.post('/auth/register', (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: Date.now().toString(),
      name,
      email,
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`,
      createdAt: new Date().toISOString()
    }
  });
});

apiRouter.post('/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

apiRouter.post('/auth/reset-password', (req, res) => {
  const { email } = req.body;
  res.json({
    success: true,
    message: 'Password reset email sent'
  });
});

// ============================================
// EQUIPMENT ROUTES
// ============================================
const mockEquipment = [
  {
    id: '1',
    name: 'CNC Milling Machine',
    category: 'Manufacturing',
    location: 'Workshop A',
    status: 'available',
    serialNumber: 'CNC-2024-001',
    model: 'XYZ-5000',
    manufacturer: 'TechMach Industries',
    purchaseDate: '2023-06-15',
    lastMaintenance: '2024-02-10',
    nextMaintenance: '2024-05-10',
    description: 'High-precision 5-axis CNC milling machine'
  },
  {
    id: '2',
    name: 'Industrial Compressor',
    category: 'HVAC',
    location: 'Utility Room',
    status: 'in-progress',
    serialNumber: 'COM-2024-002',
    model: 'AirMax 3000',
    manufacturer: 'CompressPro',
    purchaseDate: '2023-08-20',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    description: '200 HP industrial air compressor'
  },
  {
    id: '3',
    name: 'Conveyor Belt System',
    category: 'Material Handling',
    location: 'Assembly Line 2',
    status: 'pending',
    serialNumber: 'CON-2024-003',
    model: 'BeltMaster X',
    manufacturer: 'Conveyor Solutions',
    purchaseDate: '2023-10-01',
    lastMaintenance: '2024-03-01',
    nextMaintenance: '2024-06-01',
    description: 'Automated conveyor system with sorting capability'
  }
];

apiRouter.get('/equipment', (req, res) => {
  const { status, search, category } = req.query;
  let filtered = [...mockEquipment];
  
  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }
  if (category) {
    filtered = filtered.filter(e => e.category === category);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(searchLower) ||
      e.serialNumber.toLowerCase().includes(searchLower) ||
      e.category.toLowerCase().includes(searchLower)
    );
  }
  
  res.json({
    success: true,
    data: filtered,
    count: filtered.length
  });
});

apiRouter.get('/equipment/:id', (req, res) => {
  const equipment = mockEquipment.find(e => e.id === req.params.id);
  if (equipment) {
    res.json({
      success: true,
      data: equipment
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Equipment not found'
    });
  }
});

apiRouter.post('/equipment', (req, res) => {
  const newEquipment = {
    id: (mockEquipment.length + 1).toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockEquipment.push(newEquipment);
  res.json({
    success: true,
    data: newEquipment,
    message: 'Equipment added successfully'
  });
});

apiRouter.put('/equipment/:id', (req, res) => {
  const index = mockEquipment.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    mockEquipment[index] = {
      ...mockEquipment[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      data: mockEquipment[index],
      message: 'Equipment updated successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Equipment not found'
    });
  }
});

apiRouter.delete('/equipment/:id', (req, res) => {
  const index = mockEquipment.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    mockEquipment.splice(index, 1);
    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Equipment not found'
    });
  }
});

// ============================================
// MAINTENANCE ROUTES
// ============================================
const mockMaintenance = [
  {
    id: '1',
    equipmentId: '1',
    type: 'preventive',
    scheduledDate: '2024-05-10',
    status: 'pending',
    assignedTo: '3',
    description: 'Routine maintenance and calibration'
  },
  {
    id: '2',
    equipmentId: '2',
    type: 'corrective',
    scheduledDate: '2024-03-15',
    status: 'in-progress',
    assignedTo: '3',
    description: 'Fix compressor noise issue'
  }
];

apiRouter.get('/maintenance', (req, res) => {
  res.json({
    success: true,
    data: mockMaintenance,
    count: mockMaintenance.length
  });
});

apiRouter.get('/maintenance/:id', (req, res) => {
  const maintenance = mockMaintenance.find(m => m.id === req.params.id);
  if (maintenance) {
    res.json({
      success: true,
      data: maintenance
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Maintenance record not found'
    });
  }
});

apiRouter.post('/maintenance', (req, res) => {
  const newMaintenance = {
    id: (mockMaintenance.length + 1).toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockMaintenance.push(newMaintenance);
  res.json({
    success: true,
    data: newMaintenance,
    message: 'Maintenance scheduled successfully'
  });
});

apiRouter.put('/maintenance/:id', (req, res) => {
  const index = mockMaintenance.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    mockMaintenance[index] = {
      ...mockMaintenance[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      data: mockMaintenance[index],
      message: 'Maintenance updated successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Maintenance record not found'
    });
  }
});

// ============================================
// REQUEST ROUTES
// ============================================
const mockRequests = [
  {
    id: '1',
    equipmentId: '2',
    userId: '2',
    title: 'Compressor making unusual noise',
    description: 'The industrial compressor started making a loud rattling noise',
    status: 'pending',
    priority: 'high',
    createdAt: '2024-03-10T10:30:00'
  },
  {
    id: '2',
    equipmentId: '3',
    userId: '2',
    title: 'Conveyor belt slipping',
    description: 'The conveyor belt is slipping during operation',
    status: 'assigned',
    priority: 'medium',
    assignedTo: '3',
    createdAt: '2024-03-08T14:20:00'
  }
];

apiRouter.get('/requests', (req, res) => {
  res.json({
    success: true,
    data: mockRequests,
    count: mockRequests.length
  });
});

apiRouter.get('/requests/:id', (req, res) => {
  const request = mockRequests.find(r => r.id === req.params.id);
  if (request) {
    res.json({
      success: true,
      data: request
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }
});

apiRouter.post('/requests', (req, res) => {
  const newRequest = {
    id: (mockRequests.length + 1).toString(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  mockRequests.push(newRequest);
  res.json({
    success: true,
    data: newRequest,
    message: 'Request submitted successfully'
  });
});

apiRouter.put('/requests/:id', (req, res) => {
  const index = mockRequests.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    mockRequests[index] = {
      ...mockRequests[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      data: mockRequests[index],
      message: 'Request updated successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }
});

// ============================================
// USER ROUTES
// ============================================
const mockUsers = [
  { id: '1', name: 'John Admin', email: 'admin@emms.com', role: 'admin', status: 'active' },
  { id: '2', name: 'Jane User', email: 'user@emms.com', role: 'user', status: 'active' },
  { id: '3', name: 'Bob Technician', email: 'tech@emms.com', role: 'technician', status: 'active' }
];

apiRouter.get('/users', (req, res) => {
  res.json({
    success: true,
    data: mockUsers,
    count: mockUsers.length
  });
});

apiRouter.get('/users/:id', (req, res) => {
  const user = mockUsers.find(u => u.id === req.params.id);
  if (user) {
    res.json({
      success: true,
      data: user
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
});

apiRouter.post('/users', (req, res) => {
  const newUser = {
    id: (mockUsers.length + 1).toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  mockUsers.push(newUser);
  res.json({
    success: true,
    data: newUser,
    message: 'User added successfully'
  });
});

apiRouter.put('/users/:id', (req, res) => {
  const index = mockUsers.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    mockUsers[index] = {
      ...mockUsers[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      data: mockUsers[index],
      message: 'User updated successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
});

// ============================================
// TECHNICIAN ROUTES
// ============================================
apiRouter.get('/technicians', (req, res) => {
  const technicians = mockUsers.filter(u => u.role === 'technician');
  res.json({
    success: true,
    data: technicians,
    count: technicians.length
  });
});

// ============================================
// NOTIFICATION ROUTES
// ============================================
const mockNotifications = [
  { id: '1', title: 'New Request', message: 'New maintenance request received', read: false, type: 'request', createdAt: new Date().toISOString() },
  { id: '2', title: 'Maintenance Completed', message: 'Job #123 has been completed', read: true, type: 'maintenance', createdAt: new Date(Date.now() - 3600000).toISOString() }
];

apiRouter.get('/notifications', (req, res) => {
  res.json({
    success: true,
    data: mockNotifications,
    count: mockNotifications.length
  });
});

apiRouter.put('/notifications/:id/read', (req, res) => {
  const notification = mockNotifications.find(n => n.id === req.params.id);
  if (notification) {
    notification.read = true;
    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
});

// ============================================
// REPORT ROUTES
// ============================================
apiRouter.post('/reports/generate', (req, res) => {
  const { type, format, dateRange } = req.body;
  res.json({
    success: true,
    message: 'Report generation started',
    reportId: 'RPT-' + Date.now(),
    type,
    format,
    dateRange,
    downloadUrl: `/reports/report-${Date.now()}.${format || 'pdf'}`
  });
});

apiRouter.get('/reports/download/:id', (req, res) => {
  res.json({
    success: true,
    message: `Report ${req.params.id} is ready for download`,
    url: `/reports/${req.params.id}.pdf`
  });
});

// ============================================
// MOUNT API ROUTES
// ============================================
app.use('/api', apiRouter);

// ============================================
// FRONTEND ROUTING
// ============================================
if (isProduction) {
  // Production: Serve built files
  const buildPath = path.join(__dirname, 'build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({
          success: false,
          message: 'API endpoint not found'
        });
      }
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else {
    console.warn('⚠️ Build folder not found. Run `npm run build` first.');
    app.get('*', (req, res) => {
      res.send(`
        <h1>Build not found</h1>
        <p>Please run <code>npm run build</code> to build the application.</p>
      `);
    });
  }
} else {
  // Development: Serve React development server
  // The React dev server will run on port 3000 separately
  // This server runs on a different port (e.g., 5000) as a mock API
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }
    
    // In development, serve the React dev server index.html
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <h1>Development Mode</h1>
        <p>React Dev Server: <a href="http://localhost:3000">http://localhost:3000</a></p>
        <p>API Server: http://localhost:${PORT}</p>
        <p>Please run <code>npm start</code> in a separate terminal.</p>
      `);
    }
  });
}

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: isProduction ? {} : err.stack
  });
});

// ============================================
// PROCESS HANDLERS
// ============================================
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Keep the server running
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  // Keep the server running
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, () => {
  console.log('\n═══════════════════════════════════════════');
  console.log('🚀 EMMS Server Started Successfully');
  console.log('═══════════════════════════════════════════');
  console.log(`📍 API Server: http://localhost:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API Base: http://localhost:${PORT}/api`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Server Info: http://localhost:${PORT}/api/info`);
  
  if (!isProduction) {
    console.log('\n📌 Development Mode:');
    console.log(`   React Dev Server: http://localhost:3000`);
    console.log(`   API Server: http://localhost:${PORT}`);
    console.log('   Run both servers for full development experience');
  }
  console.log('\n📖 Documentation:');
  console.log(`   GET  /api/health        - Health check`);
  console.log(`   GET  /api/info          - Server information`);
  console.log(`   POST /api/auth/login    - User login`);
  console.log(`   GET  /api/equipment     - Get all equipment`);
  console.log(`   GET  /api/maintenance   - Get maintenance records`);
  console.log(`   GET  /api/requests      - Get maintenance requests`);
  console.log(`   GET  /api/users         - Get all users`);
  console.log('═══════════════════════════════════════════\n');
});

module.exports = app;