import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ScholarshipService } from '../../services/scholarship.service';
import { BookmarkService } from '../../services/bookmark.service';
import { Scholarship, FilterCategories } from '../../models/scholarship.model';
import { EvaluatedScholarship, EligibilityEvaluationResponse } from '../../models/eligibility-result.model';

@Component({
  selector: 'app-scholarship-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './scholarship-results.html',
  styleUrl: './scholarship-results.css'
})
export class ScholarshipResultsComponent implements OnInit {
  allScholarships: Scholarship[] = [];
  evaluatedResults: EvaluatedScholarship[] = [];
  filteredList: Array<{ scholarship: Scholarship; evaluation?: EvaluatedScholarship }> = [];

  isEvaluationMode = false;
  evaluationResponse: EligibilityEvaluationResponse | null = null;
  isLoading = true;
  errorMessage = '';

  // Filter States
  searchTerm = '';
  selectedCategory = 'All';
  selectedEducationLevel = 'All';
  selectedState = 'All';
  selectedStatus = 'All';

  // Dynamic filter dropdown options
  categoriesList: string[] = [];
  educationLevelsList: string[] = [];
  statesList: string[] = [];

  // Expanded explanations track map (id -> boolean)
  expandedExplanations: { [id: number]: boolean } = {};

  constructor(
    private readonly scholarshipService: ScholarshipService,
    public readonly bookmarkService: BookmarkService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();

    // Check if we arrived from an evaluation check
    this.scholarshipService.currentEvaluation$.subscribe((evaluation) => {
      if (evaluation) {
        this.isEvaluationMode = true;
        this.evaluationResponse = evaluation;
        this.evaluatedResults = evaluation.results;
        this.buildCombinedListFromEvaluation();
        this.isLoading = false;
      } else {
        // Normal browse mode
        this.isEvaluationMode = false;
        this.loadAllScholarships();
      }
    });
  }

  loadFilterOptions(): void {
    this.scholarshipService.getCategories().subscribe((catData) => {
      this.categoriesList = ['All', ...catData.categories];
      this.educationLevelsList = ['All', ...catData.educationLevels];
      this.statesList = ['All', ...catData.states];
    });
  }

  loadAllScholarships(): void {
    this.isLoading = true;
    this.scholarshipService.getScholarships().subscribe({
      next: (data) => {
        this.allScholarships = data;
        this.filteredList = data.map((s) => ({ scholarship: s }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load scholarships list:', err);
        this.errorMessage = 'Unable to connect to the backend server. Please verify Express API is active.';
        this.isLoading = false;
      }
    });
  }

  buildCombinedListFromEvaluation(): void {
    this.filteredList = this.evaluatedResults.map((item) => ({
      scholarship: item.scholarship,
      evaluation: item
    }));
    this.applyFilters();
  }

  applyFilters(): void {
    let source: Array<{ scholarship: Scholarship; evaluation?: EvaluatedScholarship }> = this.isEvaluationMode
      ? this.evaluatedResults.map((item) => ({ scholarship: item.scholarship, evaluation: item }))
      : this.allScholarships.map((s) => ({ scholarship: s }));

    // 1. Search keyword
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      source = source.filter((item) => {
        const s = item.scholarship;
        return (
          s.name.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.benefit.toLowerCase().includes(q)
        );
      });
    }

    // 2. Category
    if (this.selectedCategory !== 'All') {
      source = source.filter((item) => item.scholarship.category === this.selectedCategory);
    }

    // 3. Education Level
    if (this.selectedEducationLevel !== 'All') {
      source = source.filter((item) =>
        item.scholarship.educationLevels.includes(this.selectedEducationLevel)
      );
    }

    // 4. State
    if (this.selectedState !== 'All') {
      source = source.filter((item) => {
        const states = item.scholarship.eligibleStates;
        return states.includes('All India') || states.includes(this.selectedState);
      });
    }

    // 5. Status (if evaluated)
    if (this.isEvaluationMode && this.selectedStatus !== 'All') {
      source = source.filter((item) => item.evaluation?.status === this.selectedStatus);
    }

    this.filteredList = source;
  }

  toggleExplanation(id: number): void {
    this.expandedExplanations[id] = !this.expandedExplanations[id];
  }

  toggleBookmark(event: Event, id: number): void {
    event.stopPropagation();
    event.preventDefault();
    this.bookmarkService.toggleSave(id);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.selectedEducationLevel = 'All';
    this.selectedState = 'All';
    this.selectedStatus = 'All';
    this.applyFilters();
  }
}
