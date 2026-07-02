import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {animate, state, style, transition, trigger} from '@angular/animations';

export interface StockInfo {
  Ticker: string;
  Name: string;
  Website: string;
  [key: string]: string | number;
  'Report Date': string;
  'Days To Cover': number;
  Estimate: number;
  'Quarterly Growth': number;
  'Short Interest': number;
  'Implied Move': number;
  'Market Cap': string | number;
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
export class ReportDateTableComponent implements OnInit {

  columnsToDisplay = ['Ticker', 'Name', 'Market Cap', 'Estimate'];

  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];

  expandedElement?: StockInfo | null;

  date: string = "";
  stockInfoObjects: StockInfo[] = [];
  filteredStockInfoObjects: StockInfo[] = [];

  expandedTicker: string | null = null;
  searchText = '';
  minimumImpliedMove = 0;
  minimumShortInterest = 0;
  minimumMarketCap = 0;


  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.date = params['date'];
      this.fetchStockInfoByDate(this.date)
      const ticker = params['ticker'];
      this.expandedTicker = ticker || null;
      })
  }

  toggleExpanded(ticker: string): void {
  this.expandedTicker = this.expandedTicker === ticker ? null : ticker;
}

  fetchStockInfoByDate(date:string): void {
    const apiUrl = `https://earnings-site-api-6e5e869bb564.herokuapp.com/api/${date}`;

    this.http.get<StockInfo[]>(apiUrl).subscribe(
      data => {
        this.stockInfoObjects = data;
        this.applyFilters();
      },
      error => {
        console.error('Error fetching data', error)
      }
    )
  }

  applyFilters(): void {
    const normalizedSearch = this.searchText.trim().toLowerCase();

    this.filteredStockInfoObjects = this.stockInfoObjects.filter((stock) => {
      const matchesSearch = normalizedSearch.length === 0 ||
        stock.Ticker.toLowerCase().includes(normalizedSearch) ||
        stock.Name.toLowerCase().includes(normalizedSearch);

      const impliedMove = this.getPercentageValue(stock, 'Implied Move');
      const shortInterest = this.getPercentageValue(stock, 'Short Interest');
      const marketCap = this.getMarketCapInBillions(stock['Market Cap']);

      return matchesSearch &&
        impliedMove >= this.minimumImpliedMove &&
        shortInterest >= this.minimumShortInterest &&
        marketCap >= this.minimumMarketCap;
    });

    if (this.expandedTicker && !this.filteredStockInfoObjects.some((stock) => stock.Ticker === this.expandedTicker)) {
      this.expandedTicker = null;
    }
  }

  clearFilters(): void {
    this.searchText = '';
    this.minimumImpliedMove = 0;
    this.minimumShortInterest = 0;
    this.minimumMarketCap = 0;
    this.applyFilters();
  }

  private getPercentageValue(stock: StockInfo, field: string): number {
    const value = Number(stock[field]);

    if (Number.isNaN(value)) {
      return 0;
    }

    return value * 100;
  }

  private getMarketCapInBillions(value: string | number): number {
    if (typeof value === 'number') {
      return value > 1000000 ? value / 1000000000 : value;
    }

    const parsedValue = parseFloat(value);

    if (Number.isNaN(parsedValue)) {
      return 0;
    }

    return parsedValue;
  }

  formatDate(date:string):string|null{

    const year = parseInt(date.slice(0,4), 10);
    const month = parseInt(date.slice(4,6), 10) - 1;
    const day = parseInt(date.slice(6,8), 10);

    const dateObject = new Date(year, month, day);

    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(dateObject)
  }

  handleImageError(event:any) {
    event.target.src = '../../../assets/img/image.svg';
    event.target.style.width = '50px';
    event.target.style.height = '50px'
  }
}
