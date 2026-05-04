import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { DropdownComponent, 
  DropdownItemDirective, 
  DropdownMenuDirective, 
  DropdownToggleDirective
} from '@coreui/angular'
import { AvatarComponent } from "../avatar/avatar.component";
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent {

  title = 'Trusted Research Environment';
  userData: any;
  environment = environment;

  constructor( private authService: AuthService) {
    this.authService.user$.subscribe(user => {
      this.userData = user;
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
