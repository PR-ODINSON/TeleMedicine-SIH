import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from '../schemas/appointment.schema';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/appointment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // If status is 'Confirmed', set payment status to 'Paid'
    const appointmentData = {
      ...createAppointmentDto,
      paymentStatus: createAppointmentDto.status === 'Confirmed' ? 'Paid' : 'Pending'
    };
    
    const appointment = new this.appointmentModel(appointmentData);
    const savedAppointment = await appointment.save();
    
    // Create notifications for both doctor and patient
    try {
      await this.notificationsService.createAppointmentNotification({
        appointmentId: savedAppointment._id.toString(),
        doctorId: savedAppointment.doctor.toString(),
        patientId: savedAppointment.patient.toString(),
        doctorName: 'Dr. Smith', // You might want to populate this from the doctor data
        patientName: 'Patient', // You might want to populate this from the patient data
        appointmentDate: savedAppointment.date,
        type: 'appointment_booked'
      });
    } catch (error) {
      console.error('Failed to create appointment notifications:', error);
    }
    
    return savedAppointment;
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentModel
      .find()
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .exec();
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .exec();
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async findByDoctor(doctorId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ doctor: doctorId })
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .exec();
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ patient: patientId })
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .sort({ date: -1, time: -1 })
      .exec();
  }

  async findUpcomingByPatient(patientId: string): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.appointmentModel
      .find({ 
        patient: patientId,
        date: { $gte: today },
        status: { $in: ['Pending', 'Confirmed'] }
      })
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async findCompletedByPatient(patientId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ 
        patient: patientId,
        status: 'Completed'
      })
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .sort({ date: -1, time: -1 })
      .exec();
  }

  async findUpcomingByDoctor(doctorId: string): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.appointmentModel
      .find({ 
        doctor: doctorId,
        date: { $gte: today },
        status: { $in: ['Pending', 'Confirmed'] }
      })
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async searchAppointments(userId: string, userType: 'patient' | 'doctor', query: string): Promise<Appointment[]> {
    const searchRegex = new RegExp(query, 'i');
    const userField = userType === 'patient' ? 'patient' : 'doctor';
    
    const appointments = await this.appointmentModel
      .find({ [userField]: userId })
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .exec();

    // Filter appointments based on search query
    return appointments.filter(appointment => {
      const doctorName = (appointment.doctor as any)?.fullname || '';
      const patientName = (appointment.patient as any)?.fullname || '';
      const reason = appointment.reason || '';
      const diagnosis = appointment.diagnosis || '';
      
      return doctorName.match(searchRegex) || 
             patientName.match(searchRegex) || 
             reason.match(searchRegex) || 
             diagnosis.match(searchRegex);
    });
  }

  async getAppointmentStats(userId: string, userType: 'patient' | 'doctor') {
    const userField = userType === 'patient' ? 'patient' : 'doctor';
    
    const totalAppointments = await this.appointmentModel.countDocuments({ [userField]: userId });
    const completedAppointments = await this.appointmentModel.countDocuments({ 
      [userField]: userId, 
      status: 'Completed' 
    });
    const upcomingAppointments = await this.appointmentModel.countDocuments({ 
      [userField]: userId, 
      date: { $gte: new Date() },
      status: { $in: ['Pending', 'Confirmed'] }
    });
    const canceledAppointments = await this.appointmentModel.countDocuments({ 
      [userField]: userId, 
      status: 'Canceled' 
    });

    return {
      total: totalAppointments,
      completed: completedAppointments,
      upcoming: upcomingAppointments,
      canceled: canceledAppointments
    };
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .exec();
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async cancel(id: string, cancelReason?: string): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findByIdAndUpdate(
        id, 
        { 
          status: 'Canceled', 
          cancelReason: cancelReason || 'Cancelled by patient' 
        }, 
        { new: true }
      )
      .populate('doctor', '-password')
      .populate('patient', '-password')
      .exec();
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async remove(id: string): Promise<void> {
    const result = await this.appointmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Appointment not found');
    }
  }
}
