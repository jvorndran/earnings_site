import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {animate, state, style, transition, trigger} from '@angular/animations';
import {yearsPerPage} from "@angular/material/datepicker";

export interface StockInfo {
  Ticker: string;
  Name: string;
  Report_Date: string;
  Fiscal_Date_End: string;
  Days_To_Cover: number;
  Estimate: number;
  Quarterly_Growth: number;
  Short_Interest: number;
  Implied_Move: number;
  Market_Cap: number;
  Website: string;
}

@Component({
  selector: 'app-report-date-table',
  templateUrl: './report-date-table.component.html',
  styleUrls: ['./report-date-table.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ReportDateTableComponent implements OnInit{

  columnsToDisplay = ['Ticker', 'Name', 'Market Cap', 'Estimate'];

  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];

  expandedElement?: StockInfo | null;

  date: string = "";
  stockInfoObjects: StockInfo[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.date = params['date'];
      this.fetchStockInfoByDate(this.date)
    })
  }

  fetchStockInfoByDate(date:string): void {
    const apiUrl = `http://127.0.0.1:8000/api/${date}`;

    this.http.get<StockInfo[]>(apiUrl).subscribe(
      data => {
        this.stockInfoObjects = data;
        console.log(this.stockInfoObjects)
      },
      error => {
        console.error('Error fetching data', error)
      }
    )
  }

  formatDate(date:string):string|null{

    const year = parseInt(date.slice(0,4), 10);
    const month = parseInt(date.slice(4,6), 10) - 1;
    const day = parseInt(date.slice(6,8), 10);

    const dateObject = new Date(year, month, day);

    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(dateObject)
  }


}
