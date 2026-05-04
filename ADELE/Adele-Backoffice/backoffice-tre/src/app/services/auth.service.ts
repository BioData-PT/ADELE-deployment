import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment'; 

@Injectable({ providedIn: 'root' })
export class AuthService {
  private role: string | null = null;
  private username: string | null = null;
  private name: string | null = null;

   private apiUri = environment.backendUrl;

  constructor(private http: HttpClient) {
    this.loadFromLocalStorage();
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUri}/api/user/login`, { username, password }, { withCredentials: true }).pipe(
      tap(res => {
        this.role = res.role;
        this.username = res.username;
        this.name = res.name;
        localStorage.setItem('auth_role', res.role);
        localStorage.setItem('auth_username', res.username);
        localStorage.setItem('auth_name', res.name);
      })
    );
  }

  register(username: string, password: string, role: string, name: string) {
    return this.http.post<any>(`${this.apiUri}/api/user/register`, { username, password, role, name }).pipe(
      tap(res => {
        this.role = res.role;
        this.username = res.username;
        this.name = res.name;
        localStorage.setItem('auth_role', res.role);
        localStorage.setItem('auth_username', res.username);
        localStorage.setItem('auth_name', res.name);
      })
    );
  }

  logout(): void {
    this.role = null;
    this.username = null;
    this.name = null;
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_name');
    this.http.post('/api/user/logout', {}).subscribe();
  }

  getRole(): string | null {
    return this.role;
  }

  isLoggedIn(): boolean {
    return !!this.role;
  }

  loadFromLocalStorage(): void {
    this.role = localStorage.getItem('auth_role');
    this.username = localStorage.getItem('auth_username');
    this.name = localStorage.getItem('auth_name');
  }

  getName(): string | null {
    return this.name;
  }
}
