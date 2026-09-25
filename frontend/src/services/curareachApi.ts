/**
 * CuraReach 360 - Frontend API Client (Connected to FastAPI /api/v1)
 */
import { 
  UserProfile, 
  CaseSummary, 
  CaseDetail, 
  TimelineEvent, 
  Facility, 
  FacilityMatch, 
  FollowUpTask, 
  InAppNotification,
  DemoScenario 
} from '../types/curareach';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// Token Management
export function getStoredToken(): string | null {
  return localStorage.getItem('curareach_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('curareach_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('curareach_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network error or invalid response.' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// 1. AUTHENTICATION & DEMO SWITCHER
export async function loginApi(email: string, password: string): Promise<{ access_token: string; user: UserProfile }> {
  const res = await request<{ access_token: string; user: UserProfile }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setStoredToken(res.access_token);
  return res;
}

export async function fetchMe(): Promise<UserProfile> {
  return request<UserProfile>('/auth/me');
}

export async function switchDemoRoleApi(role: string, email?: string): Promise<{ access_token: string; user: UserProfile }> {
  const res = await request<{ access_token: string; user: UserProfile }>('/auth/switch-demo-role', {
    method: 'POST',
    body: JSON.stringify({ target_role: role, target_email: email }),
  });
  setStoredToken(res.access_token);
  return res;
}

// 2. CASES & TIMELINE
export async function fetchCases(urgency?: string, state?: string): Promise<CaseSummary[]> {
  const params = new URLSearchParams();
  if (urgency) params.append('urgency', urgency);
  if (state) params.append('state', state);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request<CaseSummary[]>(`/cases/${q}`);
}

export async function fetchCaseDetail(caseId: string): Promise<CaseDetail> {
  return request<CaseDetail>(`/cases/${caseId}`);
}

export async function fetchCaseTimeline(caseId: string): Promise<TimelineEvent[]> {
  return request<TimelineEvent[]>(`/cases/${caseId}/timeline`);
}

export async function createCaseApi(payload: {
  primary_complaint: string;
  patient_id?: string;
  assigned_worker_id?: string;
  health_data_consent?: boolean;
  referral_consent?: boolean;
  photo_consent?: boolean;
  worker_assistance_consent?: boolean;
}): Promise<CaseSummary> {
  return request<CaseSummary>('/cases/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function closeCaseApi(caseId: string, closureReason: string): Promise<any> {
  return request(`/cases/${caseId}/close`, {
    method: 'POST',
    body: JSON.stringify({ closure_reason: closureReason }),
  });
}

// 3. INTAKE & SECURE IMAGE
export async function submitIntakeApi(caseId: string, symptoms: {
  main_complaint: string;
  description: string;
  onset_duration: string;
  reported_severity: number;
  accompanying_symptoms?: string;
  existing_conditions?: string;
  current_medications?: string;
  access_barriers?: string;
  temperature?: number;
  heart_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  respiratory_rate?: number;
}): Promise<any> {
  return request(`/intake/${caseId}/submit`, {
    method: 'POST',
    body: JSON.stringify(symptoms),
  });
}

export async function saveDraftIntakeApi(caseId: string, symptoms: any): Promise<any> {
  return request(`/intake/${caseId}/assist-draft`, {
    method: 'POST',
    body: JSON.stringify(symptoms),
  });
}

export async function uploadMedicalPhotoApi(caseId: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  return request(`/images/${caseId}/upload`, {
    method: 'POST',
    body: formData,
  });
}

export function getImageUrl(imageId: string): string {
  const token = getStoredToken();
  return `${API_BASE}/images/${imageId}/file${token ? `?token=${token}` : ''}`;
}

// 4. CLINICAL REVIEW & TRIAGE
export async function submitClinicianReviewApi(caseId: string, payload: {
  action: string;
  confirmed_urgency: string;
  clinical_notes: string;
  override_reason?: string;
}): Promise<any> {
  return request(`/triage/${caseId}/clinician-review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 5. FACILITIES & CARE INTELLIGENCE
export async function fetchFacilities(district?: string): Promise<Facility[]> {
  const q = district ? `?district=${encodeURIComponent(district)}` : '';
  return request<Facility[]>(`/facilities/${q}`);
}

export async function matchFacilitiesForCase(caseId: string): Promise<{
  case_id: string;
  specialty: string;
  urgency: string;
  patient_district: string;
  has_transport_barrier: boolean;
  matches: FacilityMatch[];
}> {
  return request(`/facilities/match/${caseId}`);
}

// 6. REFERRALS & HOSPITAL COORDINATION
export async function authorizeReferralApi(caseId: string, payload: {
  hospital_id: string;
  target_department: string;
  referral_reason: string;
  urgency: string;
  is_alternative?: boolean;
}): Promise<any> {
  return request(`/referrals/${caseId}/authorize`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function respondToReferralApi(referralId: string, payload: {
  response_type: 'ACCEPT' | 'DECLINE' | 'REQUEST_INFO';
  reason_code?: string;
  response_notes?: string;
  proposed_appointment_time?: string;
}): Promise<any> {
  return request(`/referrals/${referralId}/respond`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approveAlternativeReferralApi(caseId: string, payload: {
  hospital_id: string;
  target_department: string;
  referral_reason: string;
  urgency: string;
}): Promise<any> {
  return request(`/referrals/${caseId}/approve-alternative`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 7. APPOINTMENTS & CARE ENCOUNTERS
export async function confirmAppointmentApi(referralId: string, payload: {
  scheduled_at: string;
  doctor_name?: string;
  department_name?: string;
}): Promise<any> {
  return request(`/appointments/${referralId}/confirm`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reportEncounterStatusApi(appointmentId: string, payload: {
  arrival_status: 'ARRIVED' | 'NOT_ARRIVED';
  consultation_notes: string;
  discharge_instructions?: string;
}): Promise<any> {
  return request(`/appointments/${appointmentId}/status`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 8. FOLLOW-UP TASKS & NOTIFICATIONS
export async function fetchTasks(status?: string): Promise<FollowUpTask[]> {
  const q = status ? `?status_filter=${status}` : '';
  return request<FollowUpTask[]>(`/followup/tasks${q}`);
}

export async function completeTaskApi(taskId: string, payload: {
  worker_notes: string;
  barrier_reported?: string;
}): Promise<any> {
  return request(`/followup/tasks/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function escalateTaskApi(taskId: string, escalationReason: string): Promise<any> {
  return request(`/followup/tasks/${taskId}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ escalation_reason: escalationReason }),
  });
}

export async function fetchNotifications(): Promise<InAppNotification[]> {
  return request<InAppNotification[]>('/followup/notifications');
}

// 9. COMMUNITY WORKER SPECIFIC
export async function fetchAssignedPatients(): Promise<any[]> {
  return request<any[]>('/community/my-patients');
}

export async function assistedPatientRegisterApi(patient: {
  full_name: string;
  phone: string;
  address: string;
  district?: string;
  transport_access_barrier?: boolean;
  financial_barrier?: boolean;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  abha_id?: string;
}): Promise<any> {
  return request('/community/register-patient', {
    method: 'POST',
    body: JSON.stringify(patient),
  });
}

export async function reportBarrierApi(caseId: string, category: string, description: string): Promise<any> {
  return request('/community/report-barrier', {
    method: 'POST',
    body: JSON.stringify({ case_id: caseId, barrier_category: category, barrier_description: description }),
  });
}

// 10. HOSPITAL DASHBOARD
export async function fetchHospitalProfile(): Promise<any> {
  return request('/hospitals/profile');
}

export async function updateHospitalCapacityApi(capacity: {
  total_beds: number;
  available_beds: number;
  has_icu: boolean;
  has_oxygen_manifold: boolean;
  operating_hours?: string;
}): Promise<any> {
  return request('/hospitals/capacity', {
    method: 'PUT',
    body: JSON.stringify(capacity),
  });
}

export async function fetchHospitalReferrals(status?: string): Promise<any[]> {
  const q = status ? `?status_filter=${status}` : '';
  return request<any[]>(`/hospitals/referrals${q}`);
}

// 11. ADMIN OPERATIONS
export async function fetchAdminMetrics(): Promise<any> {
  return request('/admin/metrics');
}

export async function fetchAdminHospitals(): Promise<any[]> {
  return request<any[]>('/admin/hospitals');
}

export async function verifyHospitalApi(hospitalId: string, status: string, notes?: string): Promise<any> {
  return request(`/admin/verify-hospital/${hospitalId}`, {
    method: 'POST',
    body: JSON.stringify({ verification_status: status, verification_notes: notes }),
  });
}

export async function fetchSubscriptions(): Promise<any> {
  return request('/admin/subscriptions');
}

export async function fetchInvoices(): Promise<any[]> {
  return request<any[]>('/admin/invoices');
}

export async function fetchAgentExecutions(): Promise<any[]> {
  return request<any[]>('/admin/agent-executions');
}

export async function fetchAuditLogs(): Promise<any[]> {
  return request<any[]>('/admin/audit-logs');
}

// 12. DEMO CONTROLS
export async function resetDemoDatabaseApi(): Promise<any> {
  return request('/demo/reset-database', { method: 'POST' });
}

export async function fetchDemoScenarios(): Promise<DemoScenario[]> {
  return request<DemoScenario[]>('/demo/scenarios');
}

// 13. PATIENT REGISTRATION & PROFILE (Self-service and Assisted)
export async function registerPatientApi(payload: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  primary_language?: string;
  abha_id?: string;
  transport_access_barrier?: boolean;
  financial_barrier?: boolean;
}): Promise<{ access_token: string; user: UserProfile }> {
  const res = await request<{ access_token: string; user: UserProfile }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...payload, role: 'PATIENT' }),
  });
  setStoredToken(res.access_token);
  return res;
}

export async function assistedPatientRegistrationApi(payload: {
  email: string;
  password?: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  district?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  primary_language?: string;
  abha_id?: string;
  transport_access_barrier?: boolean;
  financial_barrier?: boolean;
}): Promise<any> {
  return request('/auth/assisted-patient-registration', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePatientProfileApi(payload: any): Promise<any> {
  return request('/auth/patient-profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchPatientsApi(search?: string): Promise<any[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<any[]>(`/auth/patients${q}`);
}

// 14. MEDICAL HISTORY (Conditions, Allergies, Surgeries, Medications, Family)
export async function fetchMedicalHistory(patientId: string = 'me'): Promise<any> {
  return request(`/medical-history/patient/${patientId}`);
}

export async function addConditionApi(patientId: string, payload: {
  condition_name: string;
  status?: string;
  diagnosed_date?: string;
  severity?: string;
  notes?: string;
}): Promise<any> {
  return request(`/medical-history/patient/${patientId}/conditions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteConditionApi(conditionId: string): Promise<any> {
  return request(`/medical-history/conditions/${conditionId}`, { method: 'DELETE' });
}

export async function addAllergyApi(patientId: string, payload: {
  allergen: string;
  reaction?: string;
  severity?: string;
  date_noted?: string;
  notes?: string;
}): Promise<any> {
  return request(`/medical-history/patient/${patientId}/allergies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAllergyApi(allergyId: string): Promise<any> {
  return request(`/medical-history/allergies/${allergyId}`, { method: 'DELETE' });
}

export async function addSurgeryApi(patientId: string, payload: {
  procedure_name: string;
  surgery_date?: string;
  hospital_name?: string;
  notes?: string;
}): Promise<any> {
  return request(`/medical-history/patient/${patientId}/surgeries`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addMedicationApi(patientId: string, payload: {
  medication_name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  is_current?: boolean;
  prescribed_by?: string;
  notes?: string;
}): Promise<any> {
  return request(`/medical-history/patient/${patientId}/medications`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addFamilyHistoryApi(patientId: string, payload: {
  relationship_to_patient: string;
  condition: string;
  notes?: string;
}): Promise<any> {
  return request(`/medical-history/patient/${patientId}/family-history`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 15. MEDICAL RECORDS & DIAGNOSTIC REPORTS
export async function fetchMedicalRecords(patientId: string = 'me', recordType?: string): Promise<any[]> {
  const q = recordType ? `?record_type=${recordType}` : '';
  return request<any[]>(`/medical-records/patient/${patientId}${q}`);
}

export async function createTextRecordApi(patientId: string, payload: {
  record_type: string;
  title: string;
  description?: string;
  facility_name?: string;
  document_date?: string;
  is_sensitive?: boolean;
  case_id?: string;
  appointment_id?: string;
}): Promise<any> {
  return request(`/medical-records/patient/${patientId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadMedicalDocumentApi(patientId: string, formData: FormData): Promise<any> {
  return request(`/medical-records/patient/${patientId}/upload`, {
    method: 'POST',
    body: formData,
  });
}

export function getMedicalRecordDownloadUrl(recordId: string): string {
  return `${API_BASE}/medical-records/${recordId}/download`;
}

// 16. DIGITAL PRESCRIPTIONS
export async function fetchPrescriptions(patientId: string = 'me'): Promise<any[]> {
  return request<any[]>(`/prescriptions/patient/${patientId}`);
}

export async function createPrescriptionApi(payload: {
  patient_id: string;
  diagnosis: string;
  general_instructions?: string;
  valid_until?: string;
  case_id?: string;
  appointment_id?: string;
  items: Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
    duration_days: number;
    instructions?: string;
  }>;
}): Promise<any> {
  return request('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePrescriptionStatusApi(prescriptionId: string, newStatus: string): Promise<any> {
  return request(`/prescriptions/${prescriptionId}/status?new_status=${newStatus}`, {
    method: 'PATCH',
  });
}

// 17. PATIENT TREATMENT TRANSACTIONS (Strictly separate from software subscriptions)
export async function fetchPatientTransactions(patientId: string = 'me'): Promise<any[]> {
  return request<any[]>(`/transactions/patient/${patientId}`);
}

export async function fetchAllTreatmentTransactions(hospitalId?: string, status?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (hospitalId) params.append('hospital_id', hospitalId);
  if (status) params.append('status', status);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request<any[]>(`/transactions${q}`);
}

export async function createTreatmentInvoiceApi(payload: {
  patient_id: string;
  case_id?: string;
  hospital_id?: string;
  appointment_id?: string;
  transaction_type: string;
  item_description: string;
  amount_inr: number;
  discount_inr?: number;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
}): Promise<any> {
  return request('/transactions/invoice', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recordTreatmentPaymentApi(transactionId: string, payload: {
  payment_method: string;
  transaction_reference?: string;
  notes?: string;
}): Promise<any> {
  return request(`/transactions/${transactionId}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function processTreatmentRefundApi(transactionId: string, payload: {
  refund_reason: string;
  refund_reference?: string;
}): Promise<any> {
  return request(`/transactions/${transactionId}/refund`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

