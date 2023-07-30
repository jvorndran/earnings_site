import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-company-card',
  templateUrl: './company-card.component.html',
  styleUrls: ['./company-card.component.css']
})
export class CompanyCardComponent {

  @Input() companyInfo: any;

   handleImageError(event:any) {
    event.target.src = '../../../assets/img/image.svg';
    event.target.style.width = '3vw';
    event.target.style.height = '3vh'
  }

}
