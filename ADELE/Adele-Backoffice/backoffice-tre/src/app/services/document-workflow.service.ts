import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export interface LegalDocumentTemplate {
  selected: boolean;
  filename: string;
}

export interface SignedFile {
  filename: string;
  path: string;
  verified: boolean;
  feedback: string | null;
}

@Injectable({
  providedIn: 'root'
})

export class DocumentWorkflowService {
  private apiUri = environment.backendUrl + '/files'; // Adjust this base URI as needed

  constructor(private http: HttpClient) {}

  getTemplates(): Observable<LegalDocumentTemplate[]> {
    return this.http.get<LegalDocumentTemplate[]>(`${this.apiUri}/templates`, { withCredentials: true });
  }

  downloadTemplate(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUri}/templates/${filename}`, {
      responseType: 'blob',
      withCredentials: true
    });
  }

  downloadSignedDocument(projectId: string, filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUri}/signed/${projectId}/${filename}`, {
      responseType: 'blob',
      withCredentials: true
    });
  }

  getSignedFileDownloadUri(projectId: string, filename: string): string {
    return `${this.apiUri}/signed/${projectId}/${filename}`;
  }

  getTemplateDownloadUri(filename: string): string {
    return `${this.apiUri}/templates/${filename}`;
  }

  deleteTemplate(filename: string): Observable<any> {
    return this.http.delete(`${this.apiUri}/templates/${filename}`, { withCredentials: true });
  }

  uploadTemplate(file: File): Observable<any>  {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUri}/upload-template`, formData, { withCredentials: true });
  }

  assignTemplates(projectId: string, templates: string[]): Observable<any> {
    return this.http.post(`${this.apiUri}/assign-templates/${projectId}`, templates, { withCredentials: true });
  }

  validateFile(projectId: string, filename: string, approved: boolean, feedback?: string): Observable<any> {
    const data = {
      filename: filename,
      approved: approved,
      feedback: feedback || ''
    }
    console.log(`Validating file: ${filename}, Approved: ${approved}, Feedback: ${feedback}`);
    return this.http.post(`${this.apiUri}/validate-file/${projectId}`, data, { withCredentials: true });
  }
}
