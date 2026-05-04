import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DocumentWorkflowService, LegalDocumentTemplate, SignedFile } from '../../../services/document-workflow.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-agreements-fragment',
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './agreements-fragment.component.html',
  styleUrls: ['./agreements-fragment.component.scss']
})
export class AgreementsFragmentComponent implements OnInit {
  @Input() project!: any;

  templates: LegalDocumentTemplate[] = [];
  signedDocuments: Boolean = false;


  constructor(private docService: DocumentWorkflowService) {}

   ngOnInit() {
    if (!this.project) {
      console.error('Project input is not provided or is undefined.');
      return;
    }
    if (this.project.userSignedFiles && this.project.userSignedFiles.length > 0) {
      this.signedDocuments = true;
    }
     this.docService.getTemplates().subscribe(templates => {
      console.log('Templates fetched:', templates);
      templates.forEach(template => {
        const newLegalDocument: LegalDocumentTemplate = {
          selected: false,
          filename: String(template),
        };
        this.templates.push(newLegalDocument);
      });
     });
   }

   assignTemplates() {
    const selected = this.templates.filter(t => t.selected).map(t => t.filename);
    if (selected.length === 0) {
      console.warn('No templates selected for assignment.');
      return;
    }
    console.log('Assigning templates:', selected);
    this.docService.assignTemplates(this.project.id, selected).subscribe(() => {
      console.log('Templates assigned successfully');
      this.project.legalDocuments = selected;
      window.location.reload();
    }
    , error => {
      console.error('Error assigning templates:', error);
    }
    );
  }

  

  getDownloadUri(file: SignedFile) {
    return this.docService.getSignedFileDownloadUri(this.project.id, file.filename);
  }

  approveFile(file: SignedFile) {
    if (file.verified) {
      console.warn(`File ${file.filename} is already verified.`);
      return;
    }
    console.log(`Approving file: ${file.filename}`);
    file.verified = true;

    this.docService.validateFile(this.project.id, file.filename, true, file.feedback ? file.feedback : undefined).subscribe(() => {
      console.log(`File ${file.filename} approved successfully.`);
    }, error => {
      console.error(`Error approving file ${file.filename}:`, error);
      file.verified = false; // Reset verification status on error
    });
  }

  rejectFile(file: SignedFile) {
    if (!file.verified) {
      console.warn(`File ${file.filename} is not verified.`);
      return;
    }
    console.log(`Rejecting file: ${file.filename}`);
    file.verified = false;

    this.docService.validateFile(this.project.id, file.filename, false, file.feedback ? file.feedback : undefined).subscribe(() => {
      console.log(`File ${file.filename} rejected successfully.`);
    }, error => {
      console.error(`Error rejecting file ${file.filename}:`, error);
      file.verified = true;
    });
  }

  canApproveAll(): boolean {
    return this.project.userSignedFiles?.every((file: SignedFile) => file.verified == true);
  }

  approveAll() {
    this.project.userSignedFiles.forEach((file: SignedFile) => {
      this.approveFile(file);
    });
  }

}
