import React, { useState } from 'react';
import { FaCalendar, FaClock, FaVideo, FaStethoscope, FaTimes } from 'react-icons/fa';
import axios from 'axios';
// import { getVideoCallNotificationService } from '../utils/video-call-notifications'; // Removed

interface Doctor {
  _id: string;
  doctorId: string;
  fullname: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: string;
  location: string;
  medicalRegNo: string;
  specialization: string;
  password?: string;
  profileImage?: string;
  qualification?: string;
  experience?: number;
  consultationFee?: number;
  about?: string;
  rating?: number;
  totalRatings?: number;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  // Frontend display fields (computed)
  id: string;
  name: string;
  totalPatients: number;
  languages: string[];
  education: string;
  hospital: string;
  image: string;
  bio: string;
}

interface AppointmentBookingProps {
  doctor: Doctor;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (appointmentId: string) => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  doctor,
  isOpen,
  onClose,
  onBookingSuccess
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: ''
  });

  // Generate available dates (next 7 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return dates;
  };

  // Generate available time slots
  const getAvailableTimeSlots = () => {
    const timeSlots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + 30;
        const endHourValue = endMinute >= 60 ? hour + 1 : hour;
        const endMinuteValue = endMinute >= 60 ? 0 : endMinute;
        const endTime = `${endHourValue.toString().padStart(2, '0')}:${endMinuteValue.toString().padStart(2, '0')}`;
        
        // Format display time
        const startDisplayTime = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const endDisplayTime = new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        timeSlots.push({
          value: startTime,
          label: `${startDisplayTime} - ${endDisplayTime}`
        });
      }
    }
    
    return timeSlots;
  };

  const handlePayAmount = () => {
    if (!selectedDate || !selectedTime || !reason.trim()) {
      setBookingError('Please fill in all required fields');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName || !paymentData.email) {
      setPaymentError('Please fill in all payment details');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      // Mock payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get current patient ID
      const patientResponse = await axios.get(`${(import.meta as any).env.VITE_BACKEND_URL}/api/patients/me`, {
        withCredentials: true
      });
      
      const response = await axios.post(`${(import.meta as any).env.VITE_BACKEND_URL}/api/appointments`, {
        doctor: doctor._id,
        patient: patientResponse.data._id,
        date: selectedDate,
        time: selectedTime,
        reason: reason.trim(),
        status: 'Confirmed',
        fees: doctor.consultationFee || 100
      }, {
        withCredentials: true
      });

      console.log('Appointment booked and payment successful:', response.data);
      onBookingSuccess(response.data._id);
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setPaymentData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        email: ''
      });
      setShowPaymentModal(false);
      onClose();
    } catch (error: any) {
      console.error('Failed to process payment:', error);
      setPaymentError(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">Book Consultation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Doctor Info */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-emerald-50 rounded-xl">
            <img 
              src={doctor.image} 
              alt={doctor.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div>
              <h3 className="text-lg font-bold text-gray-800">{doctor.fullname}</h3>
              <p className="text-emerald-600 font-medium">{doctor.specialization}</p>
              <p className="text-sm text-gray-600">{doctor.experience || 0} years experience</p>
            </div>
          </div>


          {/* Booking Error */}
          {bookingError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{bookingError}</p>
            </div>
          )}

          {/* Date Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaCalendar className="text-emerald-600" />
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Choose a date</option>
              {getAvailableDates().map(date => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaClock className="text-emerald-600" />
              Select Time
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Choose a time</option>
              {getAvailableTimeSlots().map(time => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Visit */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaStethoscope className="text-emerald-600" />
              Reason for Consultation
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe your symptoms or reason for consultation..."
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-24 resize-none"
            />
          </div>

          {/* Consultation Fee */}
          <div className="mb-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Consultation Fee:</span>
              <span className="text-2xl font-bold text-emerald-600">₹{doctor.consultationFee || 100}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePayAmount}
              disabled={isBooking || !selectedDate || !selectedTime || !reason.trim()}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBooking ? 'Processing...' : 'Pay Amount'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Payment Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Payment Summary */}
              <div className="mb-6 p-4 bg-emerald-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doctor:</span>
                    <span className="font-medium">{doctor.fullname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Specialization:</span>
                    <span className="font-medium">{doctor.specialization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-lg font-bold text-emerald-600">₹{doctor.consultationFee || 100}</span>
                  </div>
                </div>
              </div>

              {/* Payment Error */}
              {paymentError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{paymentError}</p>
                </div>
              )}

              {/* Payment Form */}
              <div className="space-y-4">
                {/* Card Number */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Card Number</label>
                  <input
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                    placeholder="1234 5678 9012 3456"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Expiry Date and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Expiry Date</label>
                    <input
                      type="text"
                      value={paymentData.expiryDate}
                      onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                      placeholder="MM/YY"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">CVV</label>
                    <input
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                      placeholder="123"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Cardholder Name</label>
                  <input
                    type="text"
                    value={paymentData.cardholderName}
                    onChange={(e) => setPaymentData({...paymentData, cardholderName: e.target.value})}
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
                  <input
                    type="email"
                    value={paymentData.email}
                    onChange={(e) => setPaymentData({...paymentData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? 'Processing Payment...' : 'Pay ₹' + (doctor.consultationFee || 100)}
                </button>
              </div>

              {/* Security Notice */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-xs text-center">
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;