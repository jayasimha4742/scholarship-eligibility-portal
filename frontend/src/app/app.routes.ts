import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { EligibilityFormComponent } from './components/eligibility-form/eligibility-form';
import { ScholarshipResultsComponent } from './components/scholarship-results/scholarship-results';
import { ScholarshipDetailsComponent } from './components/scholarship-details/scholarship-details';
import { SavedScholarshipsComponent } from './components/saved-scholarships/saved-scholarships';
import { AboutComponent } from './components/about/about';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Dashboard | Scholarship Eligibility Portal' },
  { path: 'eligibility-check', component: EligibilityFormComponent, title: 'Check Eligibility | Scholarship Portal' },
  { path: 'scholarships', component: ScholarshipResultsComponent, title: 'Scholarships Catalog | Scholarship Portal' },
  { path: 'scholarships/:id', component: ScholarshipDetailsComponent, title: 'Scholarship Details | Scholarship Portal' },
  { path: 'saved', component: SavedScholarshipsComponent, title: 'Saved Scholarships | Scholarship Portal' },
  { path: 'about', component: AboutComponent, title: 'About & System Design | Scholarship Portal' },
  { path: '**', redirectTo: '' }
];
