import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, catchError, map, timeout } from 'rxjs';
import { Scholarship, FilterCategories } from '../models/scholarship.model';
import { StudentProfile } from '../models/student-profile.model';
import { EligibilityEvaluationResponse, EvaluatedScholarship } from '../models/eligibility-result.model';
import { DEFAULT_SCHOLARSHIPS } from '../data/default-scholarships.data';

@Injectable({
  providedIn: 'root'
})
export class ScholarshipService {
  private readonly apiUrl = 'http://localhost:5000/api';

  // Fast In-Memory Cache (Instant 0ms access)
  private scholarshipsCache: Scholarship[] = [...DEFAULT_SCHOLARSHIPS];

  // BehaviorSubject to retain the latest eligibility check evaluation results
  private readonly evaluationSubject = new BehaviorSubject<EligibilityEvaluationResponse | null>(null);
  public currentEvaluation$ = this.evaluationSubject.asObservable();

  // Retain last student profile used in check
  private readonly lastProfileSubject = new BehaviorSubject<StudentProfile | null>(null);
  public lastProfile$ = this.lastProfileSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    // Proactively warm up cache in background
    this.refreshCache();
  }

  private refreshCache(): void {
    this.http.get<{ success: boolean; data: Scholarship[] }>(`${this.apiUrl}/scholarships`).pipe(
      timeout(1500),
      map((res) => res.data || []),
      catchError(() => of(this.scholarshipsCache))
    ).subscribe((data) => {
      if (data && data.length > 0) {
        this.scholarshipsCache = data;
      }
    });
  }

  /**
   * Fetch all scholarships with instant in-memory fallback
   */
  getScholarships(): Observable<Scholarship[]> {
    return this.http.get<{ success: boolean; data: Scholarship[] }>(`${this.apiUrl}/scholarships`).pipe(
      timeout(1500),
      map((res) => {
        if (res.data && res.data.length > 0) {
          this.scholarshipsCache = res.data;
          return res.data;
        }
        return this.scholarshipsCache;
      }),
      catchError((err) => {
        console.warn('Backend unavailable, using instant memory cache:', err);
        return of(this.scholarshipsCache);
      })
    );
  }

  /**
   * Fetch a single scholarship by ID (INSTANT zero-latency lookup)
   */
  getScholarshipById(id: number): Observable<Scholarship | null> {
    // 1. Check local cache first for instant resolution
    const localMatch = this.scholarshipsCache.find((s) => s.id === id);
    if (localMatch) {
      return of(localMatch);
    }

    // 2. Fallback to API with fast 1.5s timeout
    return this.http.get<{ success: boolean; data: Scholarship }>(`${this.apiUrl}/scholarships/${id}`).pipe(
      timeout(1500),
      map((res) => res.data || null),
      catchError((err) => {
        console.warn(`Error fetching scholarship ${id}:`, err);
        const fallback = DEFAULT_SCHOLARSHIPS.find((s) => s.id === id) || null;
        return of(fallback);
      })
    );
  }

  /**
   * Search and filter scholarships with query params & instant fallback
   */
  searchScholarships(filterParams: {
    state?: string;
    educationLevel?: string;
    category?: string;
    provider?: string;
    q?: string;
  }): Observable<Scholarship[]> {
    let params = new HttpParams();
    if (filterParams.state) params = params.set('state', filterParams.state);
    if (filterParams.educationLevel) params = params.set('educationLevel', filterParams.educationLevel);
    if (filterParams.category) params = params.set('category', filterParams.category);
    if (filterParams.provider) params = params.set('provider', filterParams.provider);
    if (filterParams.q) params = params.set('q', filterParams.q);

    return this.http.get<{ success: boolean; data: Scholarship[] }>(`${this.apiUrl}/scholarships/search`, { params }).pipe(
      timeout(1500),
      map((res) => res.data || this.scholarshipsCache),
      catchError(() => {
        return of(this.scholarshipsCache);
      })
    );
  }

  /**
   * Send student profile to backend eligibility engine (with instant local evaluator fallback)
   */
  checkEligibility(profile: StudentProfile): Observable<EligibilityEvaluationResponse> {
    return this.http.post<EligibilityEvaluationResponse>(`${this.apiUrl}/eligibility/check`, profile).pipe(
      timeout(2000),
      map((response) => {
        this.evaluationSubject.next(response);
        this.lastProfileSubject.next(profile);
        return response;
      }),
      catchError((err) => {
        console.warn('Backend eligibility check timed out or unreachable, evaluating locally:', err);
        const localEvaluation = this.evaluateLocally(profile);
        this.evaluationSubject.next(localEvaluation);
        this.lastProfileSubject.next(profile);
        return of(localEvaluation);
      })
    );
  }

  /**
   * Get distinct categories, states, and education levels for filters
   */
  getCategories(): Observable<FilterCategories> {
    return this.http.get<{ success: boolean; data: FilterCategories }>(`${this.apiUrl}/categories`).pipe(
      timeout(1500),
      map((res) => res.data),
      catchError(() => of({
        categories: ['Merit-Based', 'Means-Based', 'Category-Based', 'Special'],
        educationLevels: ['Undergraduate', 'Postgraduate', 'Intermediate', 'Diploma', 'Ph.D.'],
        states: ['All India', 'Telangana'],
        providers: []
      }))
    );
  }

  /**
   * Clear current evaluation cache
   */
  clearEvaluation(): void {
    this.evaluationSubject.next(null);
    this.lastProfileSubject.next(null);
  }

  /**
   * Local instant fallback evaluation if backend server is slow or blocked
   */
  private evaluateLocally(student: StudentProfile): EligibilityEvaluationResponse {
    const list = this.scholarshipsCache;
    const evaluated: EvaluatedScholarship[] = list.map((scholarship) => {
      const checks: any[] = [];
      let isEligible = true;
      let isBorderline = false;
      let passedCount = 0;
      let totalRules = 0;

      // 1. Education Level
      totalRules++;
      const studentLevel = (student.educationLevel || '').toLowerCase();
      const levels = (scholarship.educationLevels || []).map((l) => l.toLowerCase());
      const levelMatch = levels.includes('all') || levels.some((l) => studentLevel.includes(l) || l.includes(studentLevel));
      if (levelMatch) {
        passedCount++;
        checks.push({ criterion: 'Education Level', passed: true, detail: `Enrolled in "${student.educationLevel}" (Matches ${scholarship.educationLevels.join(', ')})` });
      } else {
        isEligible = false;
        checks.push({ criterion: 'Education Level', passed: false, detail: `Requires: ${scholarship.educationLevels.join(', ')}` });
      }

      // 2. Marks
      totalRules++;
      const marks = Number(student.previousPercentage) || 0;
      const min = scholarship.minimumPercentage || 0;
      if (marks >= min) {
        passedCount++;
        checks.push({ criterion: 'Academic Performance', passed: true, detail: `Score of ${marks}% meets minimum ${min}%.` });
      } else if (marks >= min - 3) {
        isBorderline = true;
        checks.push({ criterion: 'Academic Performance', passed: false, isBorderline: true, detail: `Score of ${marks}% is within relaxation range of ${min}%.` });
      } else {
        isEligible = false;
        checks.push({ criterion: 'Academic Performance', passed: false, detail: `Score of ${marks}% is below mandatory ${min}%.` });
      }

      // 3. Income
      totalRules++;
      const inc = Number(student.annualFamilyIncome) || 0;
      const maxInc = scholarship.maximumFamilyIncome;
      if (!maxInc) {
        passedCount++;
        checks.push({ criterion: 'Family Income', passed: true, detail: 'No income ceiling specified.' });
      } else if (inc <= maxInc) {
        passedCount++;
        checks.push({ criterion: 'Family Income', passed: true, detail: `Income ₹${inc.toLocaleString('en-IN')} is within ceiling ₹${maxInc.toLocaleString('en-IN')}.` });
      } else {
        isEligible = false;
        checks.push({ criterion: 'Family Income', passed: false, detail: `Income ₹${inc.toLocaleString('en-IN')} exceeds ceiling ₹${maxInc.toLocaleString('en-IN')}.` });
      }

      // 4. State
      totalRules++;
      const st = (student.state || '').toLowerCase();
      const states = (scholarship.eligibleStates || []).map((s) => s.toLowerCase());
      const stateMatch = states.includes('all india') || states.includes('all') || states.some((s) => s.includes(st) || st.includes(s));
      if (stateMatch) {
        passedCount++;
        checks.push({ criterion: 'State of Residence', passed: true, detail: `Resident state "${student.state}" satisfies domicile criteria.` });
      } else {
        isEligible = false;
        checks.push({ criterion: 'State of Residence', passed: false, detail: `Scheme is restricted to residents of: ${scholarship.eligibleStates.join(', ')}.` });
      }

      // Status
      let status: 'Meets Listed Criteria' | 'May Be Eligible' | 'Not Eligible Under Listed Rules' = 'Not Eligible Under Listed Rules';
      if (isEligible && !isBorderline) status = 'Meets Listed Criteria';
      else if (isBorderline) status = 'May Be Eligible';

      return {
        scholarship,
        status,
        matchScore: Math.round((passedCount / totalRules) * 100),
        totalRulesChecked: totalRules,
        rulesPassed: passedCount,
        checks,
        matchedCriteria: checks.filter((c) => c.passed),
        unmatchedCriteria: checks.filter((c) => !c.passed),
        preliminaryNotice: 'Instant assessment based on provided details.'
      };
    });

    const eligibleCount = evaluated.filter((r) => r.status === 'Meets Listed Criteria').length;
    const borderlineCount = evaluated.filter((r) => r.status === 'May Be Eligible').length;
    const notEligibleCount = evaluated.filter((r) => r.status === 'Not Eligible Under Listed Rules').length;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      studentSummary: {
        name: student.name || 'Student',
        educationLevel: student.educationLevel,
        course: student.course || 'Degree',
        state: student.state,
        percentage: Number(student.previousPercentage) || 0,
        income: Number(student.annualFamilyIncome) || 0,
        socialCategory: student.socialCategory || 'General',
        disabilityStatus: student.disabilityStatus || 'No'
      },
      summary: {
        totalEvaluated: evaluated.length,
        eligibleCount,
        borderlineCount,
        notEligibleCount
      },
      disclaimer: 'Instant preliminary assessment based on configured scholarship rules.',
      results: evaluated
    };
  }
}
