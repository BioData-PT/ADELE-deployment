import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  role: string | null = null;
  name: string | null = null;

  constructor(private authService: AuthService) {
    this.role = this.authService.getRole();
    this.name = this.authService.getName();

    if (!this.role) {
      this.authService.loadFromLocalStorage();
      this.role = this.authService.getRole();
      this.name = this.authService.getName();
    }

  }



}
