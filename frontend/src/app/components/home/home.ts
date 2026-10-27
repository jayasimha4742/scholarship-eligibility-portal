import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScholarshipService } from '../../services/scholarship.service';
import { BookmarkService } from '../../services/bookmark.service';
import { Scholarship } from '../../models/scholarship.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  scholarships: Scholarship[] = [];
  featuredScholarships: Scholarship[] = [];
  isLoading = true;
  errorMessage = '';

  // Metrics
  totalScholarships = 0;
  totalMerit = 0;
  totalMeans = 0;
  totalCategory = 0;

  constructor(
    private readonly scholarshipService: ScholarshipService,
    public readonly bookmarkService: BookmarkService
  ) {}

  ngOnInit(): void {
    this.fetchScholarships();
  }

  fetchScholarships(): void {
    this.isLoading = true;
    this.scholarshipService.getScholarships().subscribe({
      next: (data) => {
        this.scholarships = data;
        this.totalScholarships = data.length;
        this.totalMerit = data.filter((s) => s.category === 'Merit-Based').length;
        this.totalMeans = data.filter((s) => s.category === 'Means-Based').length;
        this.totalCategory = data.filter((s) => s.category === 'Category-Based').length;
        // Take top 4 as featured
        this.featuredScholarships = data.slice(0, 4);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load scholarships for home:', err);
        this.errorMessage = 'Unable to connect to the backend server. Please verify the Express API is running on port 5000.';
        this.isLoading = false;
      }
    });
  }

  toggleBookmark(event: Event, id: number): void {
    event.stopPropagation();
    event.preventDefault();
    this.bookmarkService.toggleSave(id);
  }
}

