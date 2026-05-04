import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  private backendUri = environment.serverUri;
  

  constructor(private http: HttpClient) { }

  uploadFile(file: File, projectId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);

    return this.http.post(`${this.backendUri}/si/upload/file/${file.name}`, formData, {
      withCredentials: true
    });
  }

  getChecksum$(): Observable<string> {
    return this.http.get(`${this.backendUri}/si/crypto/public-key-checksum`, {
      responseType: 'text',
      withCredentials: true
    });
  }

  downloadPublicKey$(): Observable<Blob> {
    return this.http.post(`${this.backendUri}/si/crypto/public-key/download`, {}, {
      responseType: 'blob',
      withCredentials: true,
    });
  }

   getFilesUploaded(project_id: string) {
    const form = new FormData();
    form.append('project_id', project_id);
    return this.http.post(`${this.backendUri}/si/files/list`, form, {
      withCredentials: true,
    });
  }
}