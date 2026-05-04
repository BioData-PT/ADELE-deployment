import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metadata-fragment',
  imports: [CommonModule],
  templateUrl: './metadata-fragment.component.html',
  styleUrl: './metadata-fragment.component.scss'
})
export class MetadataFragmentComponent {
  @Input() project: any;

  constructor() { }

  ngOnInit(): void {
    // Initialization logic if needed
  }

}
