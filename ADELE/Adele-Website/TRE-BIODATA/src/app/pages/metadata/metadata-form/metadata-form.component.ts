import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as uuid from 'uuid';
import { MetadataUploadService } from '../../../services/metadata-upload.service';
import { AuthService } from '../../../services/auth.service';
import { ProjectsService } from '../../../services/projects.service';
import { identity, Observable } from 'rxjs';
import { ThemeDirective } from '@coreui/angular';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metadata-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule],
  templateUrl: './metadata-form.component.html',
  styleUrls: ['./metadata-form.component.scss']
})
export class MetadataFormComponent implements OnInit {
  @Input() project: any;

  datasetForm: FormGroup;
  distributionForm: FormGroup;

  distributionsForms: FormGroup[] = [];

  datasetData: any = {};
  distributionsData: any[] = [];

  user: Observable<any> | undefined;
  helpField: string = '';

  theme: any = {};

  constructor(
    private fb: FormBuilder,
    private metadataUploadService: MetadataUploadService,
    private authService: AuthService,
    private projectService: ProjectsService,
    private router: Router
  ) {
        // Initialize dataset form with fields from the HTML
    this.datasetForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      theme_uri: ['', Validators.required],
      theme_label: ['', Validators.required],
      publisher_name: ['', Validators.required],
      publisher_identifier: ['', Validators.required],
      version: ['', Validators.required],
      issued_date: ['', Validators.required],
      modified_date: [''],
      license: ['', Validators.required],
      contact_email: ['', [Validators.required, Validators.email]],
      contact_name: ['', Validators.required],
      contact_uid: [''],
      keywords: [''],
    });

    // Initialize distribution form with placeholder values
    this.distributionForm = this.fb.group({
      title: [''],
      media_type: ['', Validators.required],
      publisher_name: ['', Validators.required],
      publisher_identifier: ['', Validators.required],
      version: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    if (this.project.status == 'M-E') {
    this.user = this.authService.user$;
    this.user.subscribe((user) => { 
      console.log('User:', user);
      if (user) {
        this.datasetForm.patchValue({
          contact_name: user.name,
          contact_email: user.email
        });
      }
    });
    }
  }


  // Save dataset data
  saveDataset(): void {
    this.datasetData = {
      // TODO: Add personalized identifier to the dataset
      contact_point: this.datasetForm.value.contact_name?.toLowerCase().replace(/\s+/g, ''),
      contact_email: this.datasetForm.value.contact_email,
      contact_name: this.datasetForm.value.contact_name,
      contact_uid: this.datasetForm.value.contact_uid,
      description: this.datasetForm.value.description,
      distribution: [],
      issued_date: this.datasetForm.value.issued_date,
      keyword: [{ value: this.datasetForm.value.keywords }],
      modified_date: this.datasetForm.value.modified_date,
      publisher: { name: [this.datasetForm.value.publisher_name], identifier: this.datasetForm.value.publisher_identifier},
      theme: this.theme,
      title: this.datasetForm.value.title,
      license: this.datasetForm.value.license,
      has_version: this.datasetForm.value.version,
    };
    console.log('Dataset Data:', this.datasetData);
  }

  transformDistributionData(distribution: any): any {
    const distributionsData = {
      // TODO: Add personalized identifier to the distribution
      title: distribution.title,
      publisher: { name: [distribution.publisher_name], identifier: distribution.publisher_identifier },
      description: distribution.description,
      access_uri: "https://example.com/dataset.csv",
      media_type: distribution.media_type,
      has_version: distribution.version
    };

    return distributionsData;
  }

  addDistribution(): void {
    const form = this.fb.group(this.distributionForm.value);
    form.addControl('collapsed', this.fb.control(false));
    this.distributionsForms.push(form);
  }

  saveDistribution(index: number): void {
    const dist = this.distributionsForms[index];
    if (dist.valid) {
      dist.get('collapsed')?.setValue(true);
    } else {
      dist.markAllAsTouched(); // Show validation errors
    }
  }

  editDistribution(index: number): void {
    this.distributionsForms[index].get('collapsed')?.setValue(false);
  }

  submitMetadata(): void {
    this.saveDataset();

    console.log('Submitting metadata...');
    // Remove collapsed property from each distribution
    this.distributionsForms.forEach((dist) => {
      dist.removeControl('collapsed');
      this.distributionsData.push(this.transformDistributionData(dist.value));
    });
    console.log('Dataset Data:', this.datasetData);
    console.log('Distributions Data:', this.distributionsData);
    this.metadataUploadService.uploadMetadata(this.datasetData, this.distributionsData).subscribe({
      next: (response: any) => {
        console.log('Metadata submitted successfully:', response);
        const datasetUri = response.dataset_uri;
        const distributionUris = response.distributions_uri;
        this.goToNextPage(datasetUri, distributionUris);
      },
      error: (error) => {
        console.error('Error submitting metadata:', error);
      }
    });
  }

  removeDistribution(index: number): void {
    this.distributionsForms.splice(index, 1);
  }

  resetForm(): void {
    this.datasetForm.reset();
    this.distributionForm.reset();
    this.distributionsData = [];
    this.datasetData = {};
  }

  goToNextPage(dataset_uri: string, distributions_uri: string[]): void {
    const updateValue = {
      status: 'M-AR',
      dataset_uri: dataset_uri,
      distributions_uri: distributions_uri
    };

    this.projectService.updateProject(this.project.id, updateValue).subscribe({
      next: () => {
        console.log('updated');
        this.project.status = 'M-AR';
        this.ngOnInit();
      }
    });
  }

  isInvalid(form: FormGroup, controlName: string): boolean {
    const control = form.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  fetchSkosLabel(){
    console.log('[fetchSkosLabelComponent] Fetching SKOS label...');
    const uri = this.datasetForm.get('theme_uri')?.value;
    console.log('[fetchSkosLabelComponent] URI:', uri);

    if (!uri) {
      console.error('[fetchSkosLabelComponent] URI is null or undefined.');
      this.datasetForm.get('theme_label')?.setValue('');
      return;
    }

    this.metadataUploadService.fetchSkosLabel(uri).subscribe(
      (response: any) => {
        console.log('[fetchSkosLabelComponent] Response:', response);
        if (response) {
          this.datasetForm.get('theme_label')?.setValue(response.prefLabel.en || response.prefLabel[0]);
          this.theme = response;
        } else {
          console.error('[fetchSkosLabelComponent] No label found in the response.');
          this.datasetForm.get('theme_label')?.setValue('');
        }
      },
      (error) => {
        console.error('[fetchSkosLabelComponent] Error fetching SKOS label:', error);
        this.datasetForm.get('theme_label')?.setValue('');
      }
    );
  }

  getContactInfoFromBackend(form: FormGroup, field: string): void {
    console.log('Fetching contact info for field:', field);
    const uri = form.get(field)?.value;
    this.metadataUploadService.getContactInfo(uri).subscribe(
      (response: any) => {
        console.log('Contact Info:', response);
        if (field === 'publisher_identifier') {
          form.get('publisher_name')?.setValue(response.name); 
        } else if (field === 'contact_uid') {
          form.get('contact_name')?.setValue(response.name);
          form.get('contact_email')?.setValue(response.email);
        }
      },
      (error:any) => {
        console.error('Error fetching contact info:', error);
      }
    );
  }
}