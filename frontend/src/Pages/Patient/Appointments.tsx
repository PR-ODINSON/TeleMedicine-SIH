import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../Components/Sidebar'
import { FaCalendar, FaClock, FaUser, FaVideo, FaMapPin, FaFilter, FaPlus, FaCheckCircle, FaPhone, FaHeart, FaStethoscope, FaFileAlt, FaSearch } from 'react-icons/fa'
import { FaX } from "react-icons/fa6"
import axios from 'axios';
import { VideoCallService, initializeVideoCallService } from '../../utils/video-call'

interface Appointment {
  _id: string;
  id: number;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  type: 'Online' | 'In-Person';
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Pending' | 'Confirmed' | 'In Progress' | 'Rescheduled';
  location?: string;
  reason: string;
  consultationFee: number;
  fees?: number;
  doctor?: {
    _id: string;
    fullname: string;
    specialization: string;
  };
}

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled' | 'rescheduled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Online' | 'In-Person'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'doctor' | 'specialization'>('date');
  
  // Dynamic data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Video call states
  const [videoCallService, setVideoCallService] = useState<VideoCallService | null>(null);
  const [isCallingDoctor, setIsCallingDoctor] = useState<string | null>(null);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'requesting' | 'waiting' | 'accepted' | 'rejected'>('idle');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
    initializeVideoCall();
    
    // Cleanup
    return () => {
      if (videoCallService) {
        videoCallService.disconnect();
      }
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Always fetch all appointments for the user
      const endpoint = `${(import.meta as any).env.VITE_BACKEND_URL}/api/appointments`;
      
      const response = await axios.get(endpoint, {
        withCredentials: true
      });
      
      // Transform database appointments to match frontend interface
      const transformedAppointments: Appointment[] = response.data.map((apt: any) => ({
        _id: apt._id,
        id: apt._id,
        doctorName: apt.doctor?.fullname || 'Unknown Doctor',
        specialization: apt.doctor?.specialization || 'General Medicine',
        date: new Date(apt.date).toISOString().split('T')[0],
        time: apt.time || '00:00',
        type: apt.type || 'Online',
        status: apt.status || 'Pending',
        reason: apt.reason || 'Consultation',
        consultationFee: apt.consultationFee || apt.doctor?.consultationFee || 0,
        location: apt.type === 'In-Person' ? apt.doctor?.location || 'Medical Center' : undefined,
        doctor: apt.doctor
      }));
      
      setAppointments(transformedAppointments);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
      // Set empty array as fallback
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };


  const filteredAppointments = appointments.filter(appointment => {
    // Filter by tab
    let matchesTab = true;
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'upcoming':
          matchesTab = ['Pending', 'Confirmed', 'In Progress'].includes(appointment.status);
          break;
        case 'completed':
          matchesTab = appointment.status === 'Completed';
          break;
        case 'cancelled':
          matchesTab = appointment.status === 'Cancelled';
          break;
        case 'rescheduled':
          matchesTab = appointment.status === 'Rescheduled';
          break;
      }
    }
    
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by type
    const matchesType = filterType === 'all' || appointment.type === filterType;
    
    return matchesTab && matchesSearch && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'doctor':
        return a.doctorName.localeCompare(b.doctorName);
      case 'specialization':
        return a.specialization.localeCompare(b.specialization);
      case 'date':
      default:
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
  });

  const handleBookAppointment = () => {
    navigate('/patient/doctors');
  };

  const initializeVideoCall = async () => {
    try {
      let patientId: string | null = null;
      
      // Try to get patient ID from localStorage/sessionStorage first
      const storedPatientId = localStorage.getItem('patientId') || sessionStorage.getItem('patientId') || localStorage.getItem('userId') || sessionStorage.getItem('userId');
      console.log('🔥 PATIENT: Trying stored patient ID:', storedPatientId);
      
      if (storedPatientId) {
        patientId = storedPatientId;
      } else {
        // Fallback: try API
        try {
          const response = await axios.get(`${(import.meta as any).env.VITE_BACKEND_URL}/api/patients/me`, {
            withCredentials: true
          });
          patientId = response.data.patientId || response.data._id || response.data.id;
          console.log('🔥 PATIENT: Got patient ID from API:', patientId);
        } catch (apiError) {
          console.log('🔥 PATIENT: API failed, using test patient ID');
          // For testing: use a hardcoded patient ID (custom patientId, not MongoDB ObjectId)
          patientId = 'PATIENT001'; // Use custom patient ID for testing
        }
      }
      
      if (!patientId) {
        console.error('❌ PATIENT: No patient ID found');
        return;
      }
      
      console.log('🔥 PATIENT: Initializing video call service with ID:', patientId);
      const service = initializeVideoCallService(patientId, 'patient');
      setVideoCallService(service);
      
      // Set up event listeners
      service.onCallRequestSent((data) => {
        console.log('🔥 PATIENT: Call request sent:', data);
        setCallStatus('waiting');
      });
      
      service.onCallAccepted((data) => {
        console.log('🔥 PATIENT: Call accepted:', data);
        setCallStatus('accepted');
        setShowVideoCallModal(false);
        // Navigate to video call page
        navigate(`/patient/video-call/${data.callId}`);
      });
      
      service.onCallRejected((data) => {
        console.log('🔥 PATIENT: Call rejected:', data);
        setCallStatus('rejected');
        setTimeout(() => {
          setShowVideoCallModal(false);
          setCallStatus('idle');
          setIsCallingDoctor(null);
        }, 3000);
      });
      
      service.onCallError((data) => {
        console.error('🔥 PATIENT: Call error:', data);
        // Don't show alert for minor errors, just log them
        setCallStatus('idle');
        setShowVideoCallModal(false);
        setIsCallingDoctor(null);
      });
      
    } catch (error) {
      console.error('Failed to initialize video call service:', error);
    }
  };

  const isVideoCallActive = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date);
    const appointmentTime = appointment.time;
    const now = new Date();
    
    // Check if it's the same date
    const isSameDate = appointmentDate.toDateString() === now.toDateString();
    
    if (!isSameDate) return false;
    
    // Check if it's within the time window (30 minutes before and after)
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    const timeDiff = Math.abs(now.getTime() - appointmentDateTime.getTime());
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    return timeDiff <= thirtyMinutes;
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setIsCancelling(appointmentId);
    try {
      await axios.patch(`${(import.meta as any).env.VITE_BACKEND_URL}/api/appointments/${appointmentId}/cancel`, {
        cancelReason: 'Cancelled by patient'
      }, {
        withCredentials: true
      });

      // Refresh appointments list
      await fetchAppointments();
      
      // Show success message
      alert('Appointment cancelled successfully');
    } catch (error: any) {
      console.error('Failed to cancel appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(null);
    }
  };

  const startVideoCall = async (appointment: Appointment) => {
    if (!videoCallService || !appointment.doctor) {
      alert('Video call service not initialized or doctor information missing.');
      return;
    }

    if (!isVideoCallActive(appointment)) {
      alert('Video call is only available 30 minutes before and after the scheduled appointment time.');
      return;
    }

    try {
      setIsCallingDoctor(appointment.doctor._id);
      setSelectedAppointment(appointment);
      setCallStatus('requesting');
      setShowVideoCallModal(true);
      
      // Get current user info
      const response = await axios.get(`${(import.meta as any).env.VITE_BACKEND_URL}/api/auth/me`, {
        withCredentials: true
      });
      
      const patientName = response.data.user.fullname || 'Patient';
      console.log('🔥 PATIENT: Starting video call with doctor:', appointment.doctorName);

      if (!videoCallService.isServiceConnected()) {
        alert('Video call service not connected! Please check your internet connection.');
        return;
      }
      
      const callResult = videoCallService.requestVideoCall({
        doctorId: appointment.doctor._id,
        doctorName: appointment.doctorName,
        patientName: patientName,
        specialization: appointment.specialization
      });
      
      console.log('🔥 PATIENT: Video call request result:', callResult);
      
      if (callResult) {
        alert(`Video call request sent to Dr. ${appointment.doctorName}! Call ID: ${callResult}`);
      } else {
        alert('Failed to send video call request!');
      }
      
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Failed to start video call. Please try again.');
      setCallStatus('idle');
      setShowVideoCallModal(false);
      setIsCallingDoctor(null);
    }
  };

  const cancelVideoCall = () => {
    setShowVideoCallModal(false);
    setCallStatus('idle');
    setIsCallingDoctor(null);
    setSelectedAppointment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Rescheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'Online' ? <FaVideo className="w-4 h-4" /> : <FaMapPin className="w-4 h-4" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Sidebar />
        <main className="lg:ml-80 p-4 lg:p-8 xl:p-12 overflow-y-auto min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Sidebar />
        <main className="lg:ml-80 p-4 lg:p-8 xl:p-12 overflow-y-auto min-h-screen">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-xl mb-4">⚠️ Error Loading Appointments</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchAppointments}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Sidebar />
      <main className="lg:ml-80 p-4 lg:p-8 xl:p-12 overflow-y-auto min-h-screen">
        {/* Appointments Header Card */}
        <section className="mb-8">
          <div className="relative overflow-hidden gradient-bg-primary rounded-3xl p-6 shadow-xl">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FaCalendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 font-secondary">My Appointments</h1>
                  <p className="text-emerald-100">Manage and track your healthcare appointments</p>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <FaSearch className="w-5 h-5 text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search appointments by doctor, specialization, or reason..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:ring-4 focus:ring-white/30 focus:bg-white transition-all duration-300 text-lg shadow-lg"
                  />
                </div>
                
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-4 rounded-2xl border-0 bg-white/90 backdrop-blur-sm text-gray-800 focus:ring-4 focus:ring-white/30 focus:bg-white transition-all duration-300 shadow-lg"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="doctor">Sort by Doctor</option>
                    <option value="specialization">Sort by Specialty</option>
                  </select>
                </div>
              </div>              
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="inline-flex gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg border border-emerald-100">
            {[
              { 
                key: 'all', 
                label: 'All', 
                count: appointments.length 
              },
              { 
                key: 'upcoming', 
                label: 'Upcoming', 
                count: appointments.filter(a => ['Pending', 'Confirmed', 'In Progress'].includes(a.status)).length 
              },
              { 
                key: 'completed', 
                label: 'Completed', 
                count: appointments.filter(a => a.status === 'Completed').length 
              },
              { 
                key: 'cancelled', 
                label: 'Cancelled', 
                count: appointments.filter(a => a.status === 'Cancelled').length 
              },
              { 
                key: 'rescheduled', 
                label: 'Rescheduled', 
                count: appointments.filter(a => a.status === 'Rescheduled').length 
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Table */}
        {filteredAppointments.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Doctor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Fee</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.map((appointment, index) => (
                  <tr key={appointment.id} className="hover:bg-gray-50 transition-colors duration-200">
                    {/* Doctor Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                          <FaStethoscope className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{appointment.doctorName}</div>
                          <div className="text-sm text-emerald-600">{appointment.specialization}</div>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaCalendar className="w-3 h-3 text-emerald-500" />
                          <span>{new Date(appointment.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaClock className="w-3 h-3 text-emerald-500" />
                          <span>
                            {appointment.time} -{" "}
                            {(() => {
                              const [hour, minute] = appointment.time.split(':').map(Number);
                              const startDate = new Date(2000, 0, 1, hour, minute);
                              const endDate = new Date(startDate.getTime() + 30 * 60000);
                              return endDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              });
                            })()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(appointment.type)}
                        <span className="text-sm text-gray-600">{appointment.type}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>

                    {/* Fee */}
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-emerald-600">
                        ₹{appointment.fees || appointment.consultationFee || 0}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {(appointment.status === 'Confirmed' || appointment.status === 'In Progress') && (
                          <button 
                            onClick={() => startVideoCall(appointment)}
                            disabled={!isVideoCallActive(appointment) || isCallingDoctor === appointment.doctor?._id}
                            className={`px-3 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 text-sm ${
                              isVideoCallActive(appointment) 
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <FaVideo className="w-3 h-3" />
                            {isCallingDoctor === appointment.doctor?._id ? 'Calling...' : 'Video Call'}
                          </button>
                        )}
                        
                        {(appointment.status === 'Pending' || appointment.status === 'Confirmed') && (
                          <button 
                            onClick={() => handleCancelAppointment(appointment._id)}
                            disabled={isCancelling === appointment._id}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaX className="w-3 h-3" />
                            {isCancelling === appointment._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        
                        {appointment.status === 'Completed' && (
                          <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-300 flex items-center gap-2 text-sm">
                            <FaFileAlt className="w-3 h-3" />
                            Report
                          </button>
                        )}
                        
                        {appointment.status === 'Cancelled' && (
                          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-not-allowed flex items-center gap-2 text-sm">
                            <FaX className="w-3 h-3" />
                            Cancelled
                          </button>
                        )}
                        
                        {appointment.status === 'Rescheduled' && (
                          <button className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-300 flex items-center gap-2 text-sm">
                            <FaCalendar className="w-3 h-3" />
                            Reschedule
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAppointments.length === 0 && (
          <div className="text-center py-14">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCalendar className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? "No appointments match your current filters. Try adjusting your search or filters."
                : `You don't have any ${activeTab} appointments at the moment.`
              }
            </p>
          </div>
        )}

        {/* Video Call Modal */}
        {showVideoCallModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
              <div className="mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FaVideo className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedAppointment.doctorName}</h3>
                <p className="text-emerald-600 font-medium">{selectedAppointment.specialization}</p>
              </div>

              {callStatus === 'requesting' && (
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Sending call request...</p>
                </div>
              )}

              {callStatus === 'waiting' && (
                <div className="mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="animate-pulse bg-blue-600 rounded-full h-4 w-4 mx-1"></div>
                    <div className="animate-pulse bg-blue-600 rounded-full h-4 w-4 mx-1" style={{animationDelay: '0.2s'}}></div>
                    <div className="animate-pulse bg-blue-600 rounded-full h-4 w-4 mx-1" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <p className="text-gray-800 font-medium">Calling Dr. {selectedAppointment.doctorName}...</p>
                  <p className="text-gray-600 text-sm mt-2">Waiting for the doctor to respond</p>
                </div>
              )}

              {callStatus === 'accepted' && (
                <div className="mb-6">
                  <div className="text-green-600 text-4xl mb-4">✅</div>
                  <p className="text-green-600 font-medium">Call Accepted!</p>
                  <p className="text-gray-600 text-sm">Joining video call...</p>
                </div>
              )}

              {callStatus === 'rejected' && (
                <div className="mb-6">
                  <div className="text-red-600 text-4xl mb-4">❌</div>
                  <p className="text-red-600 font-medium">Call Declined</p>
                  <p className="text-gray-600 text-sm">Dr. {selectedAppointment.doctorName} is not available right now</p>
                  <p className="text-gray-500 text-xs mt-2">Try again later or contact the doctor</p>
                </div>
              )}

              <div className="flex gap-3">
                {callStatus === 'waiting' && (
                  <button
                    onClick={cancelVideoCall}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancel Call
                  </button>
                )}
                
                {(callStatus === 'rejected' || callStatus === 'requesting') && (
                  <button
                    onClick={cancelVideoCall}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300"
                  >
                    Close
                  </button>
                )}
              </div>

              {callStatus === 'waiting' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Tip:</strong> The doctor will receive a notification and can join the call
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Appointments