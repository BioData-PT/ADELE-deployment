import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private backendUri = environment.serverUri;

  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private cookieService: CookieService
  ) {
    this.loadUserData();
  }

  /** Redirect user to login page */
  login(): void {  
    window.location.href = `${this.backendUri}/login`;
  }  

  handleCallback(): void {
    const uriParams = new URLSearchParams(window.location.search);
    const code = uriParams.get('code');  // Extract "code" from URL

    if (code) {
      this.exchangeCodeForToken(code);  
    } else {
      console.error('No authorization code found in callback URI');
    }
  }
  

  exchangeCodeForToken(code: string): void {
    this.http.get(`${this.backendUri}/oidc-callback?code=${code}`, { withCredentials: true })
      .subscribe({
        next: () => {
          console.log('Tokens set in cookies, redirecting...');
          this.loadUserData();  
        },
        error: (error) => console.error('Error exchanging code:', error)
      });
  }

  loadUserData(): void {
    this.http.get(`${this.backendUri}/api/user`, { withCredentials: true })
      .subscribe({
        next: (user) => {
          console.log('User data received:', user);
          this.userSubject.next(user); 
          this.router.navigate(['/']); 
        },
        error: (error) => {
          console.error('Error getting user data:', error);
          this.userSubject.next(null);
        }
      });
  }

  isLogged(): boolean {
    return this.userSubject.value !== null;
  }

  /** Logs out the user */
  logout(): void {
    this.cookieService.delete('id_token', '/');
    this.cookieService.delete('access_token', '/');
    this.cookieService.delete('token_type', '/');
    this.cookieService.delete('user', '/');
    this.userSubject.next(null);
    this.router.navigate(['/']); 
  }

  getIdToken(): string {
    return this.userSubject.value.sub;
  }

  redirectIfNotLoggedIn(): void {
    if (!this.isLogged()) {
      this.login();
    }
  }

}
