export interface ScholarshipContact {
  helpline: string;
  email: string;
}

export interface Scholarship {
  id: number;
  name: string;
  provider: string;
  category: 'Merit-Based' | 'Means-Based' | 'Category-Based' | 'Special' | string;
  description: string;
  educationLevels: string[];
  eligibleCourses: string[];
  eligibleStates: string[];
  minimumPercentage: number;
  maximumFamilyIncome: number | null;
  eligibleSocialCategories: string[];
  disabilityStatusRequired: boolean;
  genderSpecific: 'All' | 'Female Only' | string;
  benefit: string;
  requiredDocuments: string[];
  applicationOpenDate: string;
  applicationCloseDate: string;
  applicationProcess: string;
  officialWebsite: string | null;
  isSampleData: boolean;
  contactInfo: ScholarshipContact;
}

export interface FilterCategories {
  categories: string[];
  educationLevels: string[];
  states: string[];
  providers: string[];
}

