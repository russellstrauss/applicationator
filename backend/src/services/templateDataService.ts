import type { Profile, User, PersonalInfo, WorkExperience, SkillCategory, Certification, Education } from '../../../shared/types.js';

export interface TemplateData {
  // Personal info from User
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  addressFull?: string;
  linkedIn?: string;
  portfolio?: string;
  github?: string;
  
  // Education from User
  education?: string;
  
  // Profile data
  profileName?: string;
  positionSummaryHeadline?: string;
  summaryTitle?: string;
  summary?: string;
  workExperienceTitle?: string;
  workExperience?: string;
  skillsTitle?: string;
  skills?: string;
  certifications?: string;
}

export class TemplateDataService {
  /**
   * Build template data from profile and user
   */
  static buildTemplateData(profile: Profile, user: User | null): TemplateData {
    const data: TemplateData = {};
    const hideLocation = profile.hideLocation || false;
    
    // Personal info from user
    if (user?.personalInfo) {
      const personalInfo = user.personalInfo;
      data.firstName = personalInfo.firstName;
      data.lastName = personalInfo.lastName;
      data.fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
      data.email = personalInfo.email;
      data.phone = personalInfo.phone;
      
      // Location fields - set to empty if hideLocation is true
      if (hideLocation) {
        data.addressStreet = '';
        data.addressCity = '';
        data.addressState = '';
        data.addressZip = '';
        data.addressCountry = '';
        data.addressFull = '';
      } else {
        data.addressStreet = personalInfo.address.street;
        data.addressCity = personalInfo.address.city;
        data.addressState = personalInfo.address.state;
        data.addressZip = personalInfo.address.zipCode;
        data.addressCountry = personalInfo.address.country;
        data.addressFull = this.formatAddress(personalInfo.address);
      }
      
      data.linkedIn = personalInfo.linkedIn;
      data.portfolio = personalInfo.portfolio || personalInfo.onlinePortfolio;
      data.github = personalInfo.github;
    }
    
    // Education from user
    if (user?.education && user.education.length > 0) {
      data.education = this.formatEducation(user.education);
    }
    
    // Profile data
    data.profileName = profile.name;
    data.positionSummaryHeadline = profile.positionSummaryHeadline;
    data.summaryTitle = profile.summaryTitle;
    data.summary = profile.summary;
    data.workExperienceTitle = profile.workExperienceTitle;
    
    // Format work experience
    if (profile.workExperience && profile.workExperience.length > 0) {
      data.workExperience = this.formatWorkExperience(profile.workExperience);
    }
    
    // Format skills
    if (profile.skills && profile.skills.length > 0) {
      data.skillsTitle = profile.skillsTitle;
      data.skills = this.formatSkills(profile.skills);
    }
    
    // Format certifications
    if (profile.certifications && profile.certifications.length > 0) {
      data.certifications = this.formatCertifications(profile.certifications);
    }
    
    return data;
  }
  
  /**
   * Get placeholder map for replacing in templates
   * Supports both {{placeholder}} and {placeholder} formats
   */
  static getPlaceholderMap(data: TemplateData): Map<string, string> {
    const map = new Map<string, string>();
    
    // Add all data fields with both formats
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // {{key}} format
        map.set(`{{${key}}}`, String(value));
        map.set(`{{ ${key} }}`, String(value)); // with spaces
        // {key} format
        map.set(`{${key}}`, String(value));
        map.set(`{ ${key} }`, String(value)); // with spaces
        // Uppercase variants
        map.set(`{{${key.toUpperCase()}}}`, String(value));
        map.set(`{${key.toUpperCase()}}`, String(value));
      }
    });
    
    return map;
  }
  
  private static formatAddress(address: { street: string; city: string; state: string; zipCode: string; country: string }): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  }
  
  private static formatEducation(education: Education[]): string {
    return education
      .map((edu) => {
        const parts = [edu.degree];
        if (edu.fieldOfStudy) parts.push(`in ${edu.fieldOfStudy}`);
        parts.push(`from ${edu.institution}`);
        if (edu.startDate || edu.endDate) {
          const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
          parts.push(`(${dates})`);
        }
        if (edu.gpa) parts.push(`GPA: ${edu.gpa}`);
        return parts.join(' ');
      })
      .join('\n');
  }
  
  private static formatWorkExperience(workExp: WorkExperience[]): string {
    return workExp
      .map((exp) => {
        const parts = [`${exp.position} at ${exp.company}`];
        if (exp.location) parts.push(`(${exp.location})`);
        const dates = exp.current
          ? `${exp.startDate} - Present`
          : `${exp.startDate} - ${exp.endDate || 'Present'}`;
        parts.push(dates);
        if (exp.description) {
          parts.push(`\n${exp.description}`);
        }
        return parts.join('\n');
      })
      .join('\n\n');
  }
  
  private static formatSkills(skills: SkillCategory[]): string {
    return skills
      .map((category) => {
        if (category.skills.length === 0) return '';
        const skillsList = category.skills.join(', ');
        return category.title ? `${category.title}: ${skillsList}` : skillsList;
      })
      .filter(Boolean)
      .join('\n');
  }
  
  private static formatCertifications(certs: Certification[]): string {
    return certs
      .map((cert) => {
        const parts = [cert.name];
        if (cert.issuer) parts.push(`from ${cert.issuer}`);
        if (cert.issueDate) parts.push(`(${cert.issueDate})`);
        if (cert.credentialId) parts.push(`ID: ${cert.credentialId}`);
        return parts.join(' ');
      })
      .join('\n');
  }
}

