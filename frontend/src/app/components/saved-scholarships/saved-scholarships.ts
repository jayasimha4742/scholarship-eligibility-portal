import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScholarshipService } from '../../services/scholarship.service';
import { BookmarkService } from '../../services/bookmark.service';
import { Scholarship } from '../../models/scholarship.model';

@Component({
  selector: 'app-saved-scholarships',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './saved-scholarships.html',
  styleUrl: './saved-scholarships.css'
})
export class SavedScholarshipsComponent implements OnInit {
  savedScholarships: Scholarship[] = [];
  isLoading = true;

  constructor(
    private readonly scholarshipService: ScholarshipService,
    public readonly bookmarkService: BookmarkService
  ) {}

  ngOnInit(): void {
    this.loadSaved();
  }

  loadSaved(): void {
    this.isLoading = true;
    const savedIds = this.bookmarkService.getSavedIds();

    if (savedIds.length === 0) {
      this.savedScholarships = [];
      this.isLoading = false;
      return;
    }

    this.scholarshipService.getScholarships().subscribe({
      next: (all) => {
        this.savedScholarships = all.filter((s) => savedIds.includes(s.id));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading saved scholarships:', err);
        this.isLoading = false;
      }
    });
  }

  remove(id: number): void {
    this.bookmarkService.removeSaved(id);
    this.savedScholarships = this.savedScholarships.filter((s) => s.id !== id);
  }

  clearAll(): void {
    if (confirm('Are you sure you want to remove all saved scholarships from browser storage?')) {
      this.bookmarkService.clearAll();
      this.savedScholarships = [];
    }
  }
}

