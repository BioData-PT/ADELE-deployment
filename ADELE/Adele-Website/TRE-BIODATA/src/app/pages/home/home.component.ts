import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';


@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {


  constructor( private route: ActivatedRoute,
              private router: Router, 
              private authService: AuthService ) {}

  ngOnInit() {  
  }


  goToPage(pageRef : string){
    console.log("Go to page: " + pageRef);
    this.router.navigate([pageRef]);
  }
  
}
