import { Scholarship } from './scholarship.model';

export interface CriterionCheck {
  criterion: string;
  passed: boolean;
  isBorderline?: boolean;
  detail: string;
}

export interface EvaluatedScholarship {
  scholarship: Scholarship;
  status: 'Meets Listed Criteria' | 'May Be Eligible' | 'Not Eligible Under Listed Rules';
  matchScore: number;
  totalRulesChecked: number;
  rulesPassed: number;
  checks: CriterionCheck[];
  matchedCriteria: CriterionCheck[];
  unmatchedCriteria: CriterionCheck[];
  preliminaryNotice: string;
}

export interface EligibilityEvaluationResponse {
  success: boolean;
  timestamp: string;
  studentSummary: {
    name: string;
    educationLevel: string;
    course: string;
    state: string;
    percentage: number;
    income: number;
    socialCategory: string;
    disabilityStatus: string;
  };
  summary: {
    totalEvaluated: number;
    eligibleCount: number;
    borderlineCount: number;
    notEligibleCount: number;
  };
  disclaimer: string;
  results: EvaluatedScholarship[];
}

