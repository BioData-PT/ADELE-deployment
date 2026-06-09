import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { interval, Observable, switchMap, takeWhile } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private backendUri = environment.serverUri;

  constructor(private http:HttpClient) { }

  submitTask(fileId: string, pipelineId: string): Observable<any> {
    return this.http.post(`${this.backendUri}/run-task`, { file_id: fileId, pipeline_id: pipelineId}, { withCredentials: true });
  }

  pollTaskStatus(taskId: string): Observable<any> {
    return interval(8080).pipe(
      switchMap(() => this.http.get(`${this.backendUri}/run-task/${taskId}`, { withCredentials: true })),
      takeWhile((response: any) => response.state !== 'COMPLETE' && response.state !== 'SYSTEM_ERROR' &&  response.state !== 'EXECUTOR_ERROR', true) // Stop when done
    );
  }

  getUserFiles(id: string): Observable<any> {
    return this.http.get(`${this.backendUri}/si/files`, { params: { id }, withCredentials: true });
  }

  getPipelines(): Observable<any> {
    return this.http.get(`${this.backendUri}/pipelines`, { withCredentials: true });
  }

  getUserTasks(): Observable<any> {
    return this.http.get(`${this.backendUri}/tasks`, { withCredentials: true });
  }

  generatePresignedUri(user: string, fileId: string): Observable<any> {
    return this.http.get(`${this.backendUri}/si/generate-presigned-uri/${user}/${fileId}`, { withCredentials: true });
  }

  getTaskResult(user: string, fileId: string): Observable<string> {
    return this.http.get(
      `${this.backendUri}/si/result/${encodeURIComponent(user)}/${encodeURIComponent(fileId)}`,
      { withCredentials: true, responseType: 'text' }
    );
  }

}
