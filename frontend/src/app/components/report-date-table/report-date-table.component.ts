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

type SortField = 'marketCap' | 'impliedMove' | 'shortInterest' | 'ticker';
type SortDirection = 'asc' | 'desc';

interface ReportDateSummary {
  companyCount: number;
  avgImpliedMove: number;
  avgShortInterest: number;
  megaCapCount: number;
  topMoveStock: StockInfo | null;
  largestMarketCapStock: StockInfo | null;
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

  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'compare', 'expand'];

  expandedElement?: StockInfo | null;

  date: string = "";
  stockInfoObjects: StockInfo[] = [];
  filteredStockInfoObjects: StockInfo[] = [];

  expandedTicker: string | null = null;
  searchText = '';
  minimumImpliedMove = 0;
  minimumShortInterest = 0;
  minimumMarketCap = 0;
  sortField: SortField = 'marketCap';
  sortDirection: SortDirection = 'desc';
  comparisonTickers: string[] = [];
  comparisonMessage = 'Select up to four companies from the report table.';
  exportMessage = '';


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

  get comparedStocks(): StockInfo[] {
    return this.comparisonTickers
      .map((ticker) => this.stockInfoObjects.find((stock) => stock.Ticker === ticker))
      .filter((stock): stock is StockInfo => Boolean(stock));
  }

  isCompared(ticker: string): boolean {
    return this.comparisonTickers.includes(ticker);
  }

  toggleComparison(stock: StockInfo): void {
    if (this.isCompared(stock.Ticker)) {
      this.comparisonTickers = this.comparisonTickers.filter((ticker) => ticker !== stock.Ticker);
      this.comparisonMessage = `${stock.Ticker} removed from the comparison.`;
      return;
    }

    if (this.comparisonTickers.length >= 4) {
      this.comparisonMessage = 'Remove a company before adding another; the comparison supports four names.';
      return;
    }

    this.comparisonTickers = [...this.comparisonTickers, stock.Ticker];
    this.comparisonMessage = `${stock.Ticker} added to the comparison.`;
  }

  clearComparison(): void {
    this.comparisonTickers = [];
    this.comparisonMessage = 'Comparison cleared. Select up to four companies from the report table.';
  }

  fetchStockInfoByDate(date:string): void {
    const apiUrl = `https://earnings-site-api-6e5e869bb564.herokuapp.com/api/${date}`;

    this.comparisonTickers = [];
    this.comparisonMessage = 'Select up to four companies from the report table.';

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

    const filteredStocks = this.stockInfoObjects.filter((stock) => {
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

    this.filteredStockInfoObjects = this.sortStocks(filteredStocks);

    if (this.expandedTicker && !this.filteredStockInfoObjects.some((stock) => stock.Ticker === this.expandedTicker)) {
      this.expandedTicker = null;
    }
  }

  clearFilters(): void {
    this.searchText = '';
    this.minimumImpliedMove = 0;
    this.minimumShortInterest = 0;
    this.minimumMarketCap = 0;
    this.sortField = 'marketCap';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  exportFilteredReports(): void {
    if (this.filteredStockInfoObjects.length === 0) {
      this.exportMessage = 'No matching reports to export.';
      return;
    }

    const headers = [
      'Report Date',
      'Ticker',
      'Company',
      'Estimate',
      'Market Cap',
      'Implied Move %',
      'Quarterly Growth %',
      'Short Interest %',
      'Days To Cover',
      'Website'
    ];
    const rows = this.filteredStockInfoObjects.map((stock) => [
      stock['Report Date'] || this.date,
      stock.Ticker,
      stock.Name,
      stock.Estimate,
      stock['Market Cap'],
      this.getPercentageValue(stock, 'Implied Move').toFixed(2),
      this.getPercentageValue(stock, 'Quarterly Growth').toFixed(2),
      this.getPercentageValue(stock, 'Short Interest').toFixed(2),
      stock['Days To Cover'],
      stock.Website
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
      .join('\r\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `earnings-reports-${this.date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    this.exportMessage = `${rows.length} matching report${rows.length === 1 ? '' : 's'} exported.`;
  }

  getReportDateSummary(): ReportDateSummary {
    const stocks = this.filteredStockInfoObjects;

    if (stocks.length === 0) {
      return {
        companyCount: 0,
        avgImpliedMove: 0,
        avgShortInterest: 0,
        megaCapCount: 0,
        topMoveStock: null,
        largestMarketCapStock: null
      };
    }

    const totalImpliedMove = stocks.reduce((total, stock) => total + this.getPercentageValue(stock, 'Implied Move'), 0);
    const totalShortInterest = stocks.reduce((total, stock) => total + this.getPercentageValue(stock, 'Short Interest'), 0);
    const topMoveStock = stocks.reduce((topStock, stock) => (
      this.getPercentageValue(stock, 'Implied Move') > this.getPercentageValue(topStock, 'Implied Move')
        ? stock
        : topStock
    ), stocks[0]);
    const largestMarketCapStock = stocks.reduce((largestStock, stock) => (
      this.getMarketCapInBillions(stock['Market Cap']) > this.getMarketCapInBillions(largestStock['Market Cap'])
        ? stock
        : largestStock
    ), stocks[0]);

    return {
      companyCount: stocks.length,
      avgImpliedMove: totalImpliedMove / stocks.length,
      avgShortInterest: totalShortInterest / stocks.length,
      megaCapCount: stocks.filter((stock) => this.getMarketCapInBillions(stock['Market Cap']) >= 100).length,
      topMoveStock,
      largestMarketCapStock
    };
  }

  formatStockPercent(stock: StockInfo | null, field: string): string {
    if (!stock) {
      return '-';
    }

    return `${this.getPercentageValue(stock, field).toFixed(1)}%`;
  }

  formatStockMarketCap(stock: StockInfo | null): string {
    if (!stock) {
      return '-';
    }

    return this.formatMarketCapDisplay(stock['Market Cap']);
  }

  formatMarketCapDisplay(value: string | number | undefined): string {
    if (value === undefined) {
      return '-';
    }

    const marketCap = this.getMarketCapInBillions(value);

    if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(1)}T`;
    }

    return `$${marketCap.toFixed(marketCap >= 10 ? 0 : 1)}B`;
  }

  private sortStocks(stocks: StockInfo[]): StockInfo[] {
    const directionMultiplier = this.sortDirection === 'asc' ? 1 : -1;

    return [...stocks].sort((firstStock, secondStock) => {
      const firstValue = this.getSortValue(firstStock);
      const secondValue = this.getSortValue(secondStock);

      if (typeof firstValue === 'string' && typeof secondValue === 'string') {
        return firstValue.localeCompare(secondValue) * directionMultiplier;
      }

      return (Number(firstValue) - Number(secondValue)) * directionMultiplier;
    });
  }

  private getSortValue(stock: StockInfo): number | string {
    if (this.sortField === 'ticker') {
      return stock.Ticker;
    }

    if (this.sortField === 'impliedMove') {
      return this.getPercentageValue(stock, 'Implied Move');
    }

    if (this.sortField === 'shortInterest') {
      return this.getPercentageValue(stock, 'Short Interest');
    }

    return this.getMarketCapInBillions(stock['Market Cap']);
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

  private escapeCsvValue(value: string | number): string {
    const stringValue = value === undefined || value === null ? '' : String(value);

    return `"${stringValue.replace(/"/g, '""')}"`;
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
