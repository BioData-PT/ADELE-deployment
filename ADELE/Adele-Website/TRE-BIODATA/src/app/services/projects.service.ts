import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { UUID } from 'mongodb';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  user_id = '';
  private backendUri = environment.serverUri;

  
  constructor(private authService : AuthService, private http: HttpClient) { 
    this.authService.user$.subscribe(user => {
      if (user) {
        this.user_id = user.sub;     
      } else {
        console.error('No user logged in');
        return;
      }
    });
  }

  getProjects() {
    return this.http.get(this.backendUri + '/projects', { withCredentials: true });
  }

  getProject(id: string) {
    return this.http.get(this.backendUri + '/projects/' + id, { withCredentials: true });
  }

  saveProject(project: any) {
    project.last_update = new Date().toISOString().split('T')[0];
    project.owner = this.user_id;
    project.status = 'P-AR';
    console.log('Project to save: ', project);
    return this.http.post(this.backendUri + '/submit-project', project, { withCredentials: true });
  }

  updateProject(id: string, updateData: any) {
    const data: any = { ...updateData };
    data.last_update = new Date().toISOString().split('T')[0];
    console.log('Updating project with ID:', id, 'with data:', data);
    return this.http.patch(this.backendUri + '/projects/' + id, data, { withCredentials: true });
  }

}
