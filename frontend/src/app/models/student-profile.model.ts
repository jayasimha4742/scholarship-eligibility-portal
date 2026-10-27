export interface StudentProfile {
  name: string;
  state: string;
  educationLevel: string;
  course: string;
  academicYear: string;
  semesterOrYear: string;
  previousPercentage: number | null;
  annualFamilyIncome: number | null;
  socialCategory: string;
  disabilityStatus: string; // 'Yes' | 'No'
  scholarshipType?: string; // 'All' | 'Merit-Based' | 'Means-Based' | 'Category-Based'
  gender?: string; // 'All' | 'Female' | 'Male' | 'Other'
}

