import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SanityChecks } from '@angular/material/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MetadataUploadService {
  
  constructor( private http: HttpClient) { }
  
  private backendUri = environment.serverUri;

  uploadMetadata(dataset: any, distributions: any[]) {
    const data = {
      dataset: dataset,
      distributions: distributions
    };
    return this.http.post(this.backendUri + '/fdp/upload', data, { withCredentials: true });
  }

  getCatalogs() {
    return this.http.get(this.backendUri + '/fdp/catalogs', { withCredentials: true });
  }

  getDatasets() {
    return this.http.get(this.backendUri + '/fdp/datasets', { withCredentials: true });
  }

  getDistributions() {
    return this.http.get(this.backendUri + '/distributions', { withCredentials: true });
  }

  getDatasetByCatalog(catalog_id: string) {
    return this.http.get(this.backendUri + '/catalog/' + catalog_id + "/datasets", { withCredentials: true });
  }

  getDistributionByDataset(dataset_id: string) {
    return this.http.get(this.backendUri + '/dataset/' + dataset_id + "/distributions", { withCredentials: true });
  }

  fetchSkosLabel(uri: string)  { 
    return this.http.get(this.backendUri + '/skos/label?uri=' + uri, { withCredentials: true });
  }

  getContactInfo(uri: string) {
    return this.http.get(this.backendUri + '/contact-info?uri=' + uri, { withCredentials: true });
  }

}
