import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  @Input() name: string = '';
  initials: string = '';
  avatarColor: string = '';

  getInitials(): string {
    return this.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  }

  getAvatarColor(): string {
    const colors = ['#9FB3DF', '#9EC6F3', '#BDDDE4', '#FFDCCC'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  ngOnInit() {
    this.initials = this.getInitials();
    this.avatarColor = this.getAvatarColor();
  }

}
