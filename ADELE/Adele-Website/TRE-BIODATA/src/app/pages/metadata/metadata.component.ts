import { Component } from '@angular/core';
import { MetadataFormComponent } from './metadata-form/metadata-form.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-metadata',
  imports:  [CommonModule],
  templateUrl: './metadata.component.html',
  styleUrl: './metadata.component.scss'
})
export class MetadataComponent {

  isAuthenticated = false;

  constructor(private router : Router, private authService: AuthService) {}

  ngOnInit() {
    
  }
  
  isLogged(): boolean {
    return this.authService.isLogged();
  }

  goToForm() {
    this.router.navigate(['/metadata-details/new-form']);
  }



}
