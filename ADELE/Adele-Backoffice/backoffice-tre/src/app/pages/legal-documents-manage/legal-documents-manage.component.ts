import { Component, OnInit } from '@angular/core';
import { DocumentWorkflowService } from '../../services/document-workflow.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-legal-documents-manage',
  imports: [CommonModule, MatIconModule],
  templateUrl: './legal-documents-manage.component.html',
  styleUrl: './legal-documents-manage.component.scss'
})
export class LegalDocumentsManageComponent implements OnInit {

  selectedFile: File | null = null;
  uploadStatus: string = '';
  templates: string[] = [];

  constructor(private docService: DocumentWorkflowService) {}

  ngOnInit() {
    this.fetchTemplates();
  }

  fetchTemplates() {
    this.docService.getTemplates().subscribe({
      next: (templates: any[]) => {
        this.templates = templates;
      },
      error: () => {
        this.templates = [];
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {
    if (this.selectedFile) {
      this.docService.uploadTemplate(this.selectedFile).subscribe((res: { file: any; }) => {
        this.uploadStatus = `Uploaded: ${res.file}`;
        this.selectedFile = null;
        this.fetchTemplates();
      });
    }
  }

  getTemplateDownloadUri(template: string): string {
    return this.docService.getTemplateDownloadUri(template);
  }

  deleteTemplate(template: string) {
    if (confirm(`Are you sure you want to delete "${template}"?`)) {
      this.docService.deleteTemplate(template).subscribe(() => {
        this.fetchTemplates();
      });
    }
  }
}
