import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private backendUri = environment.serverUri;
  
  constructor(private http: HttpClient) {}

  // Download a file by its filename and project ID
  downloadTemplateFile(filename: string, projectId: string): Observable<Blob> {
    const uri = `${this.backendUri}/files/download/template/${projectId}/${filename}`;
    return this.http.get(uri, { responseType: 'blob' });
  }

  // Get a signed URI for downloading a file
  getSignedDownloadUri(filename: string, projectId: string): Observable<Blob> {
    const uri = `${this.backendUri}/files/download/signed/${projectId}/${filename}`;
    return this.http.get(uri, { responseType: 'blob' });
  }

  // Upload a file to the server
  uploadFile(file: File, projectId: string): Observable<any> {
    const uri = `${this.backendUri}/files/upload-signed/${projectId}`;
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(uri, formData);
  }

}
