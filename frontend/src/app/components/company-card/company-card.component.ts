import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-company-card',
  templateUrl: './company-card.component.html',
  styleUrls: ['./company-card.component.css']
})
export class CompanyCardComponent{

  @Input() companyInfo: any;
  @Input() date: any;


  handleImageError(event:any) {
    event.target.src = '../../../assets/img/image.svg';
    event.target.style.width = '50px';
    event.target.style.height = '50px'
  }

  getRiskTags(): string[] {
    if (!this.companyInfo) {
      return [];
    }

    const tags: string[] = [];
    const impliedMove = this.getPercentValue(this.companyInfo.Implied_Move);
    const shortInterest = this.getPercentValue(this.companyInfo.Short_Interest);
    const marketCap = Number(this.companyInfo.Market_Cap) / 1000000000;
    const quarterlyGrowth = this.getPercentValue(this.companyInfo.Quarterly_Growth);

    if (impliedMove >= 8) {
      tags.push('High move');
    }

    if (shortInterest >= 15) {
      tags.push('Crowded short');
    }

    if (marketCap >= 100) {
      tags.push('Mega cap');
    }

    if (quarterlyGrowth >= 10 && impliedMove >= 5) {
      tags.push('Growth volatility');
    }

    return tags.slice(0, 3);
  }

  private getPercentValue(value: number): number {
    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
      return 0;
    }

    return parsedValue * 100;
  }


}
