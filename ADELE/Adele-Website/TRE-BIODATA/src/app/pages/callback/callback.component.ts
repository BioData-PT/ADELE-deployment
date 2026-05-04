import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent {
  

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Handle the callback when the user is redirected back from the OAuth provider
    this.authService.handleCallback();
  }

}
