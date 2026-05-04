import { Component, Input } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-code-display',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './code-display.component.html',
  styleUrl: './code-display.component.scss'
})
export class CodeDisplayComponent {
@Input() code: string = '';


constructor(private clipboard: Clipboard, private snackBar: MatSnackBar) { }

copyCode() {
  this.clipboard.copy(this.code);
  this.snackBar.open('Code copied to clipboard!', 'Close', { duration: 2000 });
}

}