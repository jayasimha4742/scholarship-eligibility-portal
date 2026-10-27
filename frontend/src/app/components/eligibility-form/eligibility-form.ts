import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ScholarshipService } from '../../services/scholarship.service';
import { StudentProfile } from '../../models/student-profile.model';

@Component({
  selector: 'app-eligibility-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eligibility-form.html',
  styleUrl: './eligibility-form.css'
})
export class EligibilityFormComponent implements OnInit {
  profile: StudentProfile = {
    name: '',
    state: 'Telangana',
    educationLevel: 'Undergraduate',
    course: 'B.Tech Computer Science',
    academicYear: '2026-2027',
    semesterOrYear: '2nd Year',
    previousPercentage: 82,
    annualFamilyIncome: 180000,
    socialCategory: 'OBC',
    disabilityStatus: 'No',
    scholarshipType: 'All',
    gender: 'All'
  };

  statesList: string[] = [
    'Telangana',
    'Andhra Pradesh',
    'Karnataka',
    'Maharashtra',
    'Tamil Nadu',
    'Kerala',
    'Delhi',
    'Uttar Pradesh',
    'Other Indian State'
  ];

  educationLevels: string[] = [
    'Intermediate',
    'Diploma',
    'Undergraduate',
    'Postgraduate',
    'Ph.D.'
  ];

  categories: string[] = [
    'General',
    'OBC',
    'SC',
    'ST',
    'EWS',
    'Minority'
  ];

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly scholarshipService: ScholarshipService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Check if there was a previous profile
    this.scholarshipService.lastProfile$.subscribe((last) => {
      if (last) {
        this.profile = { ...last };
      }
    });
  }

  // Pre-fill demo profiles for quick demonstration in practicals / viva
  loadDemoProfile(type: 'telangana' | 'nsp_merit' | 'girl_stem'): void {
    if (type === 'telangana') {
      this.profile = {
        name: 'Ravi Kumar',
        state: 'Telangana',
        educationLevel: 'Undergraduate',
        course: 'B.Tech Electrical & Electronics',
        academicYear: '2026-2027',
        semesterOrYear: '2nd Year',
        previousPercentage: 74,
        annualFamilyIncome: 160000,
        socialCategory: 'OBC',
        disabilityStatus: 'No',
        scholarshipType: 'All',
        gender: 'Male'
      };
    } else if (type === 'nsp_merit') {
      this.profile = {
        name: 'Pooja Sharma',
        state: 'Delhi',
        educationLevel: 'Undergraduate',
        course: 'B.Sc Mathematics',
        academicYear: '2026-2027',
        semesterOrYear: '1st Year',
        previousPercentage: 88,
        annualFamilyIncome: 320000,
        socialCategory: 'General',
        disabilityStatus: 'No',
        scholarshipType: 'Merit-Based',
        gender: 'Female'
      };
    } else if (type === 'girl_stem') {
      this.profile = {
        name: 'Ananya Reddy',
        state: 'Telangana',
        educationLevel: 'Undergraduate',
        course: 'B.Tech Computer Science',
        academicYear: '2026-2027',
        semesterOrYear: '1st Year',
        previousPercentage: 84,
        annualFamilyIncome: 240000,
        socialCategory: 'General',
        disabilityStatus: 'No',
        scholarshipType: 'All',
        gender: 'Female'
      };
    }
    this.errorMessage = '';
  }

  clearForm(): void {
    this.profile = {
      name: '',
      state: 'Telangana',
      educationLevel: 'Undergraduate',
      course: '',
      academicYear: '2026-2027',
      semesterOrYear: '1st Year',
      previousPercentage: null,
      annualFamilyIncome: null,
      socialCategory: 'General',
      disabilityStatus: 'No',
      scholarshipType: 'All',
      gender: 'All'
    };
    this.errorMessage = '';
    this.scholarshipService.clearEvaluation();
  }

  onSubmit(): void {
    this.errorMessage = '';

    // Frontend Validations
    if (!this.profile.state) {
      this.errorMessage = 'Please select your State of Residence.';
      return;
    }

    if (!this.profile.educationLevel) {
      this.errorMessage = 'Please select your Current Education Level.';
      return;
    }

    if (this.profile.previousPercentage === null || this.profile.previousPercentage === undefined) {
      this.errorMessage = 'Please enter your Previous Examination Percentage.';
      return;
    }

    const marks = Number(this.profile.previousPercentage);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      this.errorMessage = 'Previous Examination Percentage must be between 0% and 100%.';
      return;
    }

    if (this.profile.annualFamilyIncome === null || this.profile.annualFamilyIncome === undefined) {
      this.errorMessage = 'Please enter your Annual Family Income.';
      return;
    }

    const income = Number(this.profile.annualFamilyIncome);
    if (isNaN(income) || income < 0) {
      this.errorMessage = 'Annual Family Income must be a non-negative number.';
      return;
    }

    this.isSubmitting = true;

    this.scholarshipService.checkEligibility(this.profile).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        // Navigate to results page with evaluation data
        this.router.navigate(['/scholarships'], { queryParams: { evaluated: 'true' } });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Eligibility check request failed:', err);
        this.errorMessage = err.error?.message || 'Server communication error. Please ensure the backend server is running.';
      }
    });
  }
}

