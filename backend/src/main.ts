import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Define the allowed origin for your frontend
    // Use an environment variable for production and a fallback for development
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const allowedOrigins = [
      frontendUrl,
    ];
    
    // Log environment info for debugging
    console.log(`✅ NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`✅ RENDER: ${process.env.RENDER}`);
    console.log(`✅ FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    
    console.log(`✅ Allowing CORS for origins: ${allowedOrigins.join(', ')}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV}`);

    // Configure Socket.IO adapter with proper CORS settings
    // The main app.enableCors does not apply to WebSockets
    app.useWebSocketAdapter(new IoAdapter(app));
    
    console.log('✅ Socket.IO adapter configured');

    // Enable CORS with multiple allowed origins
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Cookie parser middleware
    app.use(cookieParser());

  // Swagger API documentation setup
  const config = new DocumentBuilder()
    .setTitle('TeleMedicine API')
    .setDescription('API documentation for TeleMedicine platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Doctors', 'Doctor management endpoints')
    .addTag('Patients', 'Patient management endpoints')
    .addTag('Appointments', 'Appointment scheduling endpoints')
    .addTag('Prescriptions', 'Prescription management endpoints')
    .addTag('Video Calls', 'Video consultation endpoints')
    .addTag('Notifications', 'Real-time notification endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 TeleMedicine API server started successfully on port ${port}`);
    console.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
    console.log(`🌐 CORS enabled for: ${frontendUrl}`);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});