import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class FileManagementService {

  private apiUri = environment.backendUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

/* FOR TESTING ONLY   
getQueueFiles() {
    const role = this.authService.getRole();

    return this.http.get(`${this.apiUri}/api/si/get-queue-files`);
  } */

  getQueueFiles() {
    return this.http.get(`${this.apiUri}/api/si/get/files`, { withCredentials: true });
  }

  processFile(form : FormData) {
    return this.http.post(`${this.apiUri}/api/si/ingest`, form, { withCredentials: true });
  }

  getProjectFiles(projectId: string) {
    const form = new FormData();
    form.append('project_id', projectId);
    return this.http.post(`${this.apiUri}/api/si/files/list`, form , { withCredentials: true });
  }

  getFile(fileId: string) {
    return this.http.get(`${this.apiUri}/api/si/get/file/${fileId}`, { withCredentials: true });
  }

  fileIngested(fileId: string) {
    const form = new FormData();
    form.append('file_id', fileId);
    return this.http.post(`${this.apiUri}/api/si/update/file/status`, form, { withCredentials: true });
  }
}
