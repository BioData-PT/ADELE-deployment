import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import {Router, RouterModule, RouterOutlet} from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import { AuthService } from './services/auth.service';
import { CookieService } from 'ngx-cookie-service';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from "./components/footer/footer.component";

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, MatSidenavModule, TooltipModule, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Trusted Research Environment';
  isMenuOpen = false;

  constructor(private router: Router, private authService: AuthService
  ) {
    this.router.events.subscribe(() => {
      this.isMenuOpen = false;
    });
  }

  

  login(){
    this.authService.login();
  }

  logout(){
    this.authService.logout();
  }

  isLogged(): boolean {
    return this.authService.isLogged();
  }
}


