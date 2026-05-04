import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';


export interface Project {
  id: number;
  title: string;
  description: 'Pending' | 'Approved' | 'Rejected';
  deadline: Date;
  status: string;
  organization: string;
  internal_storage: boolean;
  last_update: Date;
  owner: string; 
  legal_documents?: any; // Changed type from [] to any[]
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private http: HttpClient) { }

  backendUri = environment.backendUrl + '/api';

  getProjects(){
    return this.http.get(this.backendUri + '/projects', { withCredentials: true })
  }
  
  getProject(id: string){
    return this.http.get<Project>(`${this.backendUri}/projects/${id}`, { withCredentials: true })
  }
    
  createProject(project: Project){
    return this.http.post<Project>(`${this.backendUri}/projects`, project, { withCredentials: true })
  }

  updateProjectStatus(id: string, newStatus: string){
    return this.http.patch<Project>(`${this.backendUri}/projects/${id}`, { status: newStatus }, { withCredentials: true })
  }
}

