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
  // Individual education items (first and second)
  education0?: string; // First education item (formatted)
  education1?: string; // Second education item (formatted)
  // First education item fields
  education0Degree?: string;
  education0Institution?: string;
  education0FieldOfStudy?: string;
  education0StartDate?: string;
  education0EndDate?: string;
  education0Gpa?: string;
  // Second education item fields
  education1Degree?: string;
  education1Institution?: string;
  education1FieldOfStudy?: string;
  education1StartDate?: string;
  education1EndDate?: string;
  education1Gpa?: string;
  
  // Profile data
  profileName?: string;
  positionSummaryHeadline?: string;
  summaryTitle?: string;
  summary?: string;
  workExperienceTitle?: string;
  workExperience?: string;
  // Individual work experience items (up to 10)
  workExperience0?: string; // First work experience (formatted)
  workExperience1?: string; // Second work experience (formatted)
  workExperience2?: string; // Third work experience (formatted)
  workExperience3?: string; // Fourth work experience (formatted)
  workExperience4?: string; // Fifth work experience (formatted)
  workExperience5?: string; // Sixth work experience (formatted)
  workExperience6?: string; // Seventh work experience (formatted)
  workExperience7?: string; // Eighth work experience (formatted)
  workExperience8?: string; // Ninth work experience (formatted)
  workExperience9?: string; // Tenth work experience (formatted)
  // First work experience item fields
  workExperience0Position?: string;
  workExperience0Company?: string;
  workExperience0Location?: string;
  workExperience0StartDate?: string;
  workExperience0EndDate?: string;
  workExperience0Current?: string; // "Yes" or "No"
  workExperience0Description?: string;
  // Second work experience item fields
  workExperience1Position?: string;
  workExperience1Company?: string;
  workExperience1Location?: string;
  workExperience1StartDate?: string;
  workExperience1EndDate?: string;
  workExperience1Current?: string;
  workExperience1Description?: string;
  // Third work experience item fields
  workExperience2Position?: string;
  workExperience2Company?: string;
  workExperience2Location?: string;
  workExperience2StartDate?: string;
  workExperience2EndDate?: string;
  workExperience2Current?: string;
  workExperience2Description?: string;
  // Fourth work experience item fields
  workExperience3Position?: string;
  workExperience3Company?: string;
  workExperience3Location?: string;
  workExperience3StartDate?: string;
  workExperience3EndDate?: string;
  workExperience3Current?: string;
  workExperience3Description?: string;
  // Fifth work experience item fields
  workExperience4Position?: string;
  workExperience4Company?: string;
  workExperience4Location?: string;
  workExperience4StartDate?: string;
  workExperience4EndDate?: string;
  workExperience4Current?: string;
  workExperience4Description?: string;
  // Sixth work experience item fields
  workExperience5Position?: string;
  workExperience5Company?: string;
  workExperience5Location?: string;
  workExperience5StartDate?: string;
  workExperience5EndDate?: string;
  workExperience5Current?: string;
  workExperience5Description?: string;
  // Seventh work experience item fields
  workExperience6Position?: string;
  workExperience6Company?: string;
  workExperience6Location?: string;
  workExperience6StartDate?: string;
  workExperience6EndDate?: string;
  workExperience6Current?: string;
  workExperience6Description?: string;
  // Eighth work experience item fields
  workExperience7Position?: string;
  workExperience7Company?: string;
  workExperience7Location?: string;
  workExperience7StartDate?: string;
  workExperience7EndDate?: string;
  workExperience7Current?: string;
  workExperience7Description?: string;
  // Ninth work experience item fields
  workExperience8Position?: string;
  workExperience8Company?: string;
  workExperience8Location?: string;
  workExperience8StartDate?: string;
  workExperience8EndDate?: string;
  workExperience8Current?: string;
  workExperience8Description?: string;
  // Tenth work experience item fields
  workExperience9Position?: string;
  workExperience9Company?: string;
  workExperience9Location?: string;
  workExperience9StartDate?: string;
  workExperience9EndDate?: string;
  workExperience9Current?: string;
  workExperience9Description?: string;
  skillsTitle?: string;
  skills?: string;
  // Individual skill categories (first, second, third, etc.)
  skills0?: string; // First skill category (formatted as "Category: skill1, skill2")
  skills1?: string; // Second skill category
  skills2?: string; // Third skill category
  skills3?: string; // Fourth skill category
  skills4?: string; // Fifth skill category
  // Individual skill category names and lists (for separate formatting)
  skills0Category?: string; // First category name only
  skills0List?: string; // First category skills list only
  skills1Category?: string; // Second category name only
  skills1List?: string; // Second category skills list only
  skills2Category?: string; // Third category name only
  skills2List?: string; // Third category skills list only
  skills3Category?: string; // Fourth category name only
  skills3List?: string; // Fourth category skills list only
  skills4Category?: string; // Fifth category name only
  skills4List?: string; // Fifth category skills list only
  certifications?: string;
}

export class TemplateDataService {
  /**
   * Build template data from profile and user
   * 
   * Available placeholders for templates:
   * 
   * Work Experience:
   * - {{workExperience}} - All experiences formatted together
   * - {{workExperience0}} through {{workExperience9}} - Individual formatted experiences
   * - {{workExperience0Position}}, {{workExperience0Company}}, etc. - Individual attributes
   * - Individual attributes available: Position, Company, Location, StartDate, EndDate, Current, Description
   * 
   * Skills:
   * - {{skills}} - All skills formatted together
   * - {{skills0}} through {{skills4}} - Individual skill categories (formatted)
   * - {{skills0Category}}, {{skills0List}} - Category name and list separately
   * 
   * Education:
   * - {{education}} - All education formatted together
   * - {{education0}}, {{education1}} - Individual education items
   * - {{education0Degree}}, {{education0Institution}}, etc. - Individual attributes
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
      
      // First education item
      if (user.education.length > 0) {
        const edu0 = user.education[0];
        data.education0 = this.formatSingleEducation(edu0);
        data.education0Degree = edu0.degree;
        data.education0Institution = edu0.institution;
        data.education0FieldOfStudy = edu0.fieldOfStudy;
        data.education0StartDate = edu0.startDate;
        data.education0EndDate = edu0.endDate;
        data.education0Gpa = edu0.gpa;
      }
      
      // Second education item
      if (user.education.length > 1) {
        const edu1 = user.education[1];
        data.education1 = this.formatSingleEducation(edu1);
        data.education1Degree = edu1.degree;
        data.education1Institution = edu1.institution;
        data.education1FieldOfStudy = edu1.fieldOfStudy;
        data.education1StartDate = edu1.startDate;
        data.education1EndDate = edu1.endDate;
        data.education1Gpa = edu1.gpa;
      }
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
      
      // Individual work experience items (up to 10)
      const workExpItems = ['workExperience0', 'workExperience1', 'workExperience2', 'workExperience3', 'workExperience4', 
                           'workExperience5', 'workExperience6', 'workExperience7', 'workExperience8', 'workExperience9'];
      
      profile.workExperience.slice(0, 10).forEach((exp, index) => {
        // Formatted work experience item
        (data as any)[workExpItems[index]] = this.formatSingleWorkExperience(exp);
        
        // Individual attributes
        (data as any)[`${workExpItems[index]}Position`] = exp.position || '';
        (data as any)[`${workExpItems[index]}Company`] = exp.company || '';
        (data as any)[`${workExpItems[index]}Location`] = exp.location || '';
        // Format dates - extract year from start date, and use "Present" for current jobs
        (data as any)[`${workExpItems[index]}StartDate`] = this.extractYear(exp.startDate);
        (data as any)[`${workExpItems[index]}EndDate`] = exp.current ? 'Present' : this.extractYear(exp.endDate);
        (data as any)[`${workExpItems[index]}Current`] = exp.current ? 'Yes' : 'No';
        // Description - format with proper line breaks for PDF output
        (data as any)[`${workExpItems[index]}Description`] = this.formatDescription(exp.description || '');
      });
    }
    
    // Format skills
    if (profile.skills && profile.skills.length > 0) {
      data.skillsTitle = profile.skillsTitle;
      data.skills = this.formatSkills(profile.skills);
      
      // Individual skill categories (up to 5)
      const skillCategories = ['skills0', 'skills1', 'skills2', 'skills3', 'skills4'];
      const categoryNames = ['skills0Category', 'skills1Category', 'skills2Category', 'skills3Category', 'skills4Category'];
      const categoryLists = ['skills0List', 'skills1List', 'skills2List', 'skills3List', 'skills4List'];
      profile.skills.slice(0, 5).forEach((category, index) => {
        if (category.skills.length > 0) {
          const skillsList = category.skills.join(', ');
          const formatted = category.title ? `${category.title}: ${skillsList}` : skillsList;
          (data as any)[skillCategories[index]] = formatted;
          
          // Separate category name and list for independent formatting
          if (category.title) {
            (data as any)[categoryNames[index]] = category.title;
            (data as any)[categoryLists[index]] = skillsList;
          } else {
            (data as any)[categoryNames[index]] = '';
            (data as any)[categoryLists[index]] = skillsList;
          }
        }
      });
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
        const lines = [edu.degree];
        if (edu.fieldOfStudy) lines.push(edu.fieldOfStudy);
        lines.push(edu.institution);
        if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
        return lines.join('\n');
      })
      .join('\n\n');
  }

  private static formatSingleEducation(edu: Education): string {
    const lines = [edu.degree];
    if (edu.fieldOfStudy) lines.push(edu.fieldOfStudy);
    lines.push(edu.institution);
    if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
    return lines.join('\n');
  }
  
  /**
   * Extract year from a date string (handles YYYY-MM-DD, MM/DD/YYYY, and other formats)
   */
  private static extractYear(dateString: string | undefined | null): string {
    if (!dateString) return '';
    
    // Try YYYY-MM-DD format first (ISO format)
    const isoMatch = dateString.match(/^(\d{4})-\d{2}-\d{2}/);
    if (isoMatch) {
      return isoMatch[1];
    }
    
    // Try MM/DD/YYYY format
    const slashMatch = dateString.match(/\/(\d{4})$/);
    if (slashMatch) {
      return slashMatch[1];
    }
    
    // Try to parse as Date and extract year
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return String(date.getFullYear());
    }
    
    // If all else fails, return the original string
    return dateString;
  }

  private static formatWorkExperience(workExp: WorkExperience[]): string {
    return workExp
      .map((exp) => {
        const parts = [`${exp.position} at ${exp.company}`];
        if (exp.location) parts.push(`(${exp.location})`);
        const startYear = this.extractYear(exp.startDate);
        const endYear = exp.current ? 'Present' : this.extractYear(exp.endDate);
        const dates = `${startYear} - ${endYear}`;
        parts.push(dates);
        if (exp.description) {
          parts.push(`\n${exp.description}`);
        }
        return parts.join('\n');
      })
      .join('\n\n');
  }

  /**
   * Format a single work experience item consistently
   * Matches the attribute display pattern used in WorkExperienceItem component
   */
  private static formatSingleWorkExperience(exp: WorkExperience): string {
    const parts: string[] = [];
    
    // Position
    if (exp.position) {
      parts.push(`Position: ${exp.position}`);
    }
    
    // Company
    if (exp.company) {
      parts.push(`Company: ${exp.company}`);
    }
    
    // Location (if provided)
    if (exp.location) {
      parts.push(`Location: ${exp.location}`);
    }
    
    // Start Date - extract year only
    const startYear = this.extractYear(exp.startDate);
    if (startYear) {
      parts.push(`Start Date: ${startYear}`);
    }
    
    // End Date - extract year only, or "Present" for current jobs
    if (exp.current) {
      parts.push(`End Date: Present`);
    } else if (exp.endDate) {
      const endYear = this.extractYear(exp.endDate);
      if (endYear) {
        parts.push(`End Date: ${endYear}`);
      }
    }
    
    // Current Status
    parts.push(`Current: ${exp.current ? 'Yes' : 'No'}`);
    
    // Description (formatted as newline-separated list)
    if (exp.description) {
      const descriptionLines = exp.description.split('\n').filter(line => line.trim());
      if (descriptionLines.length > 0) {
        parts.push('Description:');
        descriptionLines.forEach(line => {
          parts.push(`  • ${line.trim()}`);
        });
      }
    }
    
    return parts.join('\n');
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

  /**
   * Format description text to preserve line breaks in PDF output
   * Converts newlines to ensure they render properly in Google Docs/PDF
   */
  private static formatDescription(description: string): string {
    if (!description) return '';
    // Split by newlines and join with newlines to ensure proper formatting
    // Google Docs API replaceAllText supports \n for line breaks
    return description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }
}

