import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RemsService {

  //private remsUri = 'http://localhost:3000'; // must have a ssh connection active to the server
  private backendUri = environment.serverUri;


  constructor(private http: HttpClient) {}

  redirectToRemsCatalog(): void {
    //window.location.href = `${this.remsUri}/catalogue`;
  }

  redirectToRemsAdmin(): void {
    //window.location.href = `${this.remsUri}/administration/catalogue-items`;
  }

  createResource(name: string) {
    //return this.http.post(`${this.backendUri}/rems/create_resource`,{filename: name});
  }
}
