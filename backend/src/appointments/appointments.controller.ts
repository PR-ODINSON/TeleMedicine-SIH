import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  findAll(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Request() req?: any
  ) {
    if (search && req.user) {
      // Determine user type - this would need to be part of JWT payload
      const userType = req.user.userType || 'patient'; 
      return this.appointmentsService.searchAppointments(req.user.userId, userType, search);
    }
    if (doctorId) {
      return this.appointmentsService.findByDoctor(doctorId);
    }
    if (patientId) {
      return this.appointmentsService.findByPatient(patientId);
    }
    return this.appointmentsService.findAll();
  }

  @Get('my/upcoming')
  getMyUpcomingAppointments(@Request() req) {
    const userType = req.user.userType || 'patient';
    if (userType === 'patient') {
      return this.appointmentsService.findUpcomingByPatient(req.user.userId);
    } else {
      return this.appointmentsService.findUpcomingByDoctor(req.user.userId);
    }
  }

  @Get('my/completed')
  getMyCompletedAppointments(@Request() req) {
    const userType = req.user.userType || 'patient';
    if (userType === 'patient') {
      return this.appointmentsService.findCompletedByPatient(req.user.userId);
    } else {
      return this.appointmentsService.findByDoctor(req.user.userId);
    }
  }

  @Get('my/stats')
  getMyAppointmentStats(@Request() req) {
    const userType = req.user.userType || 'patient';
    return this.appointmentsService.getAppointmentStats(req.user.userId, userType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() body: { cancelReason?: string }) {
    return this.appointmentsService.cancel(id, body.cancelReason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
