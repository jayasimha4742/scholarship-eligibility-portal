import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ScholarshipService } from '../../services/scholarship.service';
import { BookmarkService } from '../../services/bookmark.service';
import { Scholarship } from '../../models/scholarship.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-scholarship-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './scholarship-details.html',
  styleUrl: './scholarship-details.css'
})
export class ScholarshipDetailsComponent implements OnInit, OnDestroy {
  scholarship: Scholarship | null = null;
  isLoading = true;
  errorMessage = '';
  private routeSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly scholarshipService: ScholarshipService,
    public readonly bookmarkService: BookmarkService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      const id = idParam ? parseInt(idParam, 10) : NaN;

      if (isNaN(id)) {
        this.errorMessage = 'Invalid scholarship ID provided in URL.';
        this.isLoading = false;
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';

      // Instant lookup via service (resolves within 0-10ms)
      this.scholarshipService.getScholarshipById(id).subscribe({
        next: (data) => {
          if (!data) {
            this.errorMessage = `Scholarship with ID #${id} could not be found.`;
          } else {
            this.scholarship = data;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching scholarship detail:', err);
          this.errorMessage = 'Failed to load scholarship details.';
          this.isLoading = false;
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  toggleBookmark(): void {
    if (this.scholarship) {
      this.bookmarkService.toggleSave(this.scholarship.id);
    }
  }
}
