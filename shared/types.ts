// Shared types between frontend and backend

export interface Profile {
  id: string;
  name: string;
  summary?: string;
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  certifications: Certification[];
  resumeTemplateId?: string;
  fieldMappings?: FieldMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  skills: string[];
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  legalName?: string;
  email: string;
  phone: string;
  address: Address;
  dateOfBirth?: string;
  ssn?: string; // Encrypted in production
  linkedIn?: string;
  portfolio?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  location?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface FieldMapping {
  fieldName: string;
  fieldType: FieldType;
  profileId?: string; // Profile-specific mapping
  confidence?: number;
  learnedAt: string;
}

export enum FieldType {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  FULL_NAME = 'fullName',
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS_STREET = 'addressStreet',
  ADDRESS_CITY = 'addressCity',
  ADDRESS_STATE = 'addressState',
  ADDRESS_ZIP = 'addressZip',
  ADDRESS_COUNTRY = 'addressCountry',
  DATE_OF_BIRTH = 'dateOfBirth',
  SSN = 'ssn',
  LINKEDIN = 'linkedIn',
  PORTFOLIO = 'portfolio',
  WORK_EXPERIENCE = 'workExperience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  CERTIFICATIONS = 'certifications',
  RESUME = 'resume',
  COVER_LETTER = 'coverLetter',
  UNKNOWN = 'unknown'
}

export interface LearnedPattern {
  fieldName: string;
  fieldType: FieldType;
  embedding?: number[];
  confidence: number;
  usageCount: number;
  lastUsed: string;
}

export interface AutomationSession {
  id: string;
  profileId: string;
  url?: string;
  mode: 'url' | 'manual';
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentStep?: string;
  progress: number;
  errors: AutomationError[];
  startedAt?: string;
  completedAt?: string;
}

export interface AutomationError {
  type: 'field_not_found' | 'field_unmapped' | 'navigation_error' | 'validation_error' | 'other';
  message: string;
  fieldName?: string;
  timestamp: string;
}

export interface FormField {
  selector: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio';
  value?: string;
  required?: boolean;
  options?: string[];
}

export interface ResumeTemplate {
  id: string;
  name: string;
  googleDriveId: string;
  profileId?: string;
  placeholders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GoogleAuthToken {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

