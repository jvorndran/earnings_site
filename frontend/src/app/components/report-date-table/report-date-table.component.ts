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

type SortField = 'marketCap' | 'impliedMove' | 'shortInterest' | 'quarterlyGrowth' | 'daysToCover' | 'estimate' | 'ticker';
type SortDirection = 'asc' | 'desc';
type EstimateOutlook = 'all' | 'positive' | 'loss' | 'breakEven';
type CatalystProfile = 'all' | 'volatileCrowded' | 'moveDriven' | 'crowdedOnly' | 'lowerRisk';
type MarketCapCohort = 'all' | 'small' | 'mid' | 'large' | 'mega';
type SavedReportStatus = 'research' | 'watching' | 'ready' | 'skip';
type SavedReportFilter = 'all' | SavedReportStatus;

interface ReportDateSummary {
  companyCount: number;
  avgImpliedMove: number;
  avgShortInterest: number;
  megaCapCount: number;
  topMoveStock: StockInfo | null;
  largestMarketCapStock: StockInfo | null;
}

interface EventRiskPlan {
  stock: StockInfo;
  impliedMove: number;
  maxPositionValue: number;
  estimatedEventLoss: number;
}

interface EstimateOutlookSummary {
  positiveCount: number;
  lossCount: number;
  breakEvenCount: number;
  averageEstimate: number;
  highestEstimateStock: StockInfo | null;
  lowestEstimateStock: StockInfo | null;
}

interface CatalystBucket {
  key: Exclude<CatalystProfile, 'all'>;
  label: string;
  detail: string;
  count: number;
  averageImpliedMove: number;
  leader: StockInfo | null;
}

interface MarketCapCohortSummary {
  key: Exclude<MarketCapCohort, 'all'>;
  label: string;
  range: string;
  count: number;
  averageImpliedMove: number;
  averageQuarterlyGrowth: number;
  moveLeader: StockInfo | null;
}

interface CrowdingWatchItem {
  stock: StockInfo;
  score: number;
  level: 'Elevated' | 'Watch' | 'Moderate';
  shortInterest: number;
  daysToCover: number;
  impliedMove: number;
}

interface OpportunityMapPoint {
  stock: StockInfo;
  x: number;
  y: number;
  impliedMove: number;
  quarterlyGrowth: number;
}

interface SavedReport {
  ticker: string;
  name: string;
  reportDate: string;
  estimate: number;
  impliedMove: number;
  shortInterest: number;
  marketCap: string | number;
  status?: SavedReportStatus;
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

  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'save', 'compare', 'expand'];

  expandedElement?: StockInfo | null;

  date: string = "";
  stockInfoObjects: StockInfo[] = [];
  filteredStockInfoObjects: StockInfo[] = [];

  expandedTicker: string | null = null;
  searchText = '';
  minimumImpliedMove = 0;
  minimumShortInterest = 0;
  minimumQuarterlyGrowth: number | null = null;
  minimumDaysToCover = 0;
  minimumMarketCap = 0;
  estimateOutlook: EstimateOutlook = 'all';
  catalystProfile: CatalystProfile = 'all';
  marketCapCohort: MarketCapCohort = 'all';
  sortField: SortField = 'marketCap';
  sortDirection: SortDirection = 'desc';
  comparisonTickers: string[] = [];
  comparisonMessage = 'Select up to four companies from the report table.';
  exportMessage = '';
  savedReportMessage = '';
  savedReports: SavedReport[] = [];
  savedReportFilter: SavedReportFilter = 'all';
  readonly savedReportWorkflowStages: Array<{key: SavedReportStatus; label: string; detail: string}> = [
    {key: 'research', label: 'Research', detail: 'Needs a first review'},
    {key: 'watching', label: 'Watching', detail: 'Catalyst is on deck'},
    {key: 'ready', label: 'Ready', detail: 'Plan is prepared'},
    {key: 'skip', label: 'Skip', detail: 'No action planned'}
  ];
  opportunityMapPoints: OpportunityMapPoint[] = [];
  opportunityRiskLine = 50;
  opportunityZeroLine = 50;
  portfolioValue = 25000;
  maximumEventRiskPercent = 1;
  private readonly savedReportStorageKey = 'earnings-site-saved-reports';


  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.savedReports = this.loadSavedReports();
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

  isSavedReport(ticker: string): boolean {
    return this.savedReports.some((report) => report.ticker === ticker && report.reportDate === this.date);
  }

  toggleSavedReport(stock: StockInfo): void {
    if (this.isSavedReport(stock.Ticker)) {
      this.savedReports = this.savedReports.filter((report) => (
        report.ticker !== stock.Ticker || report.reportDate !== this.date
      ));
      this.savedReportMessage = `${stock.Ticker} removed from saved reports.`;
    } else {
      this.savedReports = [{
        ticker: stock.Ticker,
        name: stock.Name,
        reportDate: this.date,
        estimate: this.getEstimateValue(stock),
        impliedMove: this.getPercentageValue(stock, 'Implied Move'),
        shortInterest: this.getPercentageValue(stock, 'Short Interest'),
        marketCap: stock['Market Cap'],
        status: 'research' as SavedReportStatus
      }, ...this.savedReports].slice(0, 20);
      this.savedReportMessage = `${stock.Ticker} saved for follow-up.`;
      this.savedReportFilter = 'all';
    }

    this.persistSavedReports();
  }

  removeSavedReport(report: SavedReport): void {
    this.savedReports = this.savedReports.filter((savedReport) => (
      savedReport.ticker !== report.ticker || savedReport.reportDate !== report.reportDate
    ));
    this.savedReportMessage = `${report.ticker} removed from saved reports.`;
    this.persistSavedReports();
  }

  clearSavedReports(): void {
    this.savedReports = [];
    this.savedReportFilter = 'all';
    this.savedReportMessage = 'Saved report shortlist cleared.';
    this.persistSavedReports();
  }

  get visibleSavedReports(): SavedReport[] {
    if (this.savedReportFilter === 'all') {
      return this.savedReports;
    }

    return this.savedReports.filter((report) => this.getSavedReportStatus(report) === this.savedReportFilter);
  }

  getSavedReportStatus(report: SavedReport): SavedReportStatus {
    return this.normalizeSavedReportStatus(report.status);
  }

  getSavedReportStatusCount(status: SavedReportStatus): number {
    return this.savedReports.filter((report) => this.getSavedReportStatus(report) === status).length;
  }

  setSavedReportFilter(filter: SavedReportFilter): void {
    this.savedReportFilter = filter;
  }

  setSavedReportStatus(report: SavedReport, status: SavedReportStatus): void {
    const normalizedStatus = this.normalizeSavedReportStatus(status);

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, status: normalizedStatus}
        : savedReport
    ));
    this.savedReportMessage = `${report.ticker} moved to ${this.getSavedReportStatusLabel(normalizedStatus)}.`;
    this.persistSavedReports();
  }

  getSavedReportStatusLabel(status: SavedReportStatus): string {
    return this.savedReportWorkflowStages.find((stage) => stage.key === status)?.label || 'Research';
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
      return this.matchesBaseFilters(stock, normalizedSearch) && this.matchesCatalystProfile(stock);
    });

    this.filteredStockInfoObjects = this.sortStocks(filteredStocks);
    this.buildOpportunityMap();

    if (this.expandedTicker && !this.filteredStockInfoObjects.some((stock) => stock.Ticker === this.expandedTicker)) {
      this.expandedTicker = null;
    }
  }

  clearFilters(): void {
    this.searchText = '';
    this.minimumImpliedMove = 0;
    this.minimumShortInterest = 0;
    this.minimumQuarterlyGrowth = null;
    this.minimumDaysToCover = 0;
    this.minimumMarketCap = 0;
    this.estimateOutlook = 'all';
    this.catalystProfile = 'all';
    this.marketCapCohort = 'all';
    this.sortField = 'marketCap';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  setCatalystProfile(profile: CatalystProfile): void {
    this.catalystProfile = this.catalystProfile === profile ? 'all' : profile;
    this.applyFilters();
  }

  setMarketCapCohort(cohort: Exclude<MarketCapCohort, 'all'>): void {
    this.marketCapCohort = this.marketCapCohort === cohort ? 'all' : cohort;
    this.minimumMarketCap = 0;
    this.applyFilters();
  }

  clearMarketCapCohort(): void {
    this.marketCapCohort = 'all';
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

  getEventRiskBudget(): number {
    const portfolioValue = Math.max(Number(this.portfolioValue) || 0, 0);
    const riskPercent = Math.max(Number(this.maximumEventRiskPercent) || 0, 0);

    return portfolioValue * (riskPercent / 100);
  }

  getEstimateOutlookSummary(): EstimateOutlookSummary {
    const stocks = this.filteredStockInfoObjects;

    if (stocks.length === 0) {
      return {
        positiveCount: 0,
        lossCount: 0,
        breakEvenCount: 0,
        averageEstimate: 0,
        highestEstimateStock: null,
        lowestEstimateStock: null
      };
    }

    const positiveCount = stocks.filter((stock) => this.getEstimateValue(stock) > 0.1).length;
    const lossCount = stocks.filter((stock) => this.getEstimateValue(stock) < -0.1).length;
    const breakEvenCount = stocks.length - positiveCount - lossCount;
    const averageEstimate = stocks.reduce((total, stock) => total + this.getEstimateValue(stock), 0) / stocks.length;
    const highestEstimateStock = stocks.reduce((highest, stock) => (
      this.getEstimateValue(stock) > this.getEstimateValue(highest) ? stock : highest
    ), stocks[0]);
    const lowestEstimateStock = stocks.reduce((lowest, stock) => (
      this.getEstimateValue(stock) < this.getEstimateValue(lowest) ? stock : lowest
    ), stocks[0]);

    return {
      positiveCount,
      lossCount,
      breakEvenCount,
      averageEstimate,
      highestEstimateStock,
      lowestEstimateStock
    };
  }

  getCatalystBuckets(): CatalystBucket[] {
    const normalizedSearch = this.searchText.trim().toLowerCase();
    const candidates = this.stockInfoObjects.filter((stock) => this.matchesBaseFilters(stock, normalizedSearch));
    const bucketDefinitions: Array<Pick<CatalystBucket, 'key' | 'label' | 'detail'>> = [
      {key: 'volatileCrowded', label: 'Volatile + Crowded', detail: '8%+ move and 10%+ short interest'},
      {key: 'moveDriven', label: 'Move-Driven', detail: '8%+ move with lighter short interest'},
      {key: 'crowdedOnly', label: 'Crowded Positioning', detail: '10%+ short interest with a lower move'},
      {key: 'lowerRisk', label: 'Lower Event Pressure', detail: 'Below both matrix thresholds'}
    ];

    return bucketDefinitions.map((definition) => {
      const stocks = candidates.filter((stock) => this.getCatalystProfile(stock) === definition.key);
      const averageImpliedMove = stocks.length
        ? stocks.reduce((total, stock) => total + this.getPercentageValue(stock, 'Implied Move'), 0) / stocks.length
        : 0;
      const leader = stocks.length
        ? stocks.reduce((topStock, stock) => (
          this.getPercentageValue(stock, 'Implied Move') > this.getPercentageValue(topStock, 'Implied Move')
            ? stock
            : topStock
        ), stocks[0])
        : null;

      return {...definition, count: stocks.length, averageImpliedMove, leader};
    });
  }

  getCrowdingWatch(): CrowdingWatchItem[] {
    return this.filteredStockInfoObjects
      .map((stock) => {
        const shortInterest = this.getPercentageValue(stock, 'Short Interest');
        const daysToCoverValue = Number(stock['Days To Cover']);
        const daysToCover = Number.isFinite(daysToCoverValue) ? Math.max(daysToCoverValue, 0) : 0;
        const impliedMove = this.getPercentageValue(stock, 'Implied Move');
        const score = Math.min(100, Math.round(
          (shortInterest * 2) + (daysToCover * 6) + (impliedMove * 2)
        ));
        const level = score >= 65 ? 'Elevated' : score >= 40 ? 'Watch' : 'Moderate';

        return {stock, score, level, shortInterest, daysToCover, impliedMove} as CrowdingWatchItem;
      })
      .filter((item) => item.shortInterest > 0 && item.daysToCover > 0)
      .sort((firstItem, secondItem) => (
        secondItem.score - firstItem.score ||
        secondItem.shortInterest - firstItem.shortInterest ||
        firstItem.stock.Ticker.localeCompare(secondItem.stock.Ticker)
      ))
      .slice(0, 6);
  }

  getMarketCapCohorts(): MarketCapCohortSummary[] {
    const normalizedSearch = this.searchText.trim().toLowerCase();
    const candidates = this.stockInfoObjects.filter((stock) => (
      this.matchesBaseFilters(stock, normalizedSearch, true) && this.matchesCatalystProfile(stock)
    ));
    const definitions: Array<Pick<MarketCapCohortSummary, 'key' | 'label' | 'range'>> = [
      {key: 'small', label: 'Small Cap', range: 'Below $2B'},
      {key: 'mid', label: 'Mid Cap', range: '$2B to $10B'},
      {key: 'large', label: 'Large Cap', range: '$10B to $100B'},
      {key: 'mega', label: 'Mega Cap', range: '$100B and above'}
    ];

    return definitions.map((definition) => {
      const stocks = candidates.filter((stock) => this.getMarketCapCohort(stock) === definition.key);
      const averageImpliedMove = stocks.length
        ? stocks.reduce((total, stock) => total + this.getPercentageValue(stock, 'Implied Move'), 0) / stocks.length
        : 0;
      const averageQuarterlyGrowth = stocks.length
        ? stocks.reduce((total, stock) => total + this.getPercentageValue(stock, 'Quarterly Growth'), 0) / stocks.length
        : 0;
      const moveLeader = stocks.length
        ? stocks.reduce((leader, stock) => (
          this.getPercentageValue(stock, 'Implied Move') > this.getPercentageValue(leader, 'Implied Move')
            ? stock
            : leader
        ), stocks[0])
        : null;

      return {
        ...definition,
        count: stocks.length,
        averageImpliedMove,
        averageQuarterlyGrowth,
        moveLeader
      };
    });
  }

  formatStockEstimate(stock: StockInfo | null): string {
    if (!stock) {
      return '-';
    }

    return this.getEstimateValue(stock).toFixed(2);
  }

  getEventRiskPlans(): EventRiskPlan[] {
    const portfolioValue = Math.max(Number(this.portfolioValue) || 0, 0);
    const eventRiskBudget = this.getEventRiskBudget();

    if (portfolioValue === 0 || eventRiskBudget === 0) {
      return [];
    }

    return this.filteredStockInfoObjects
      .map((stock) => {
        const impliedMove = this.getPercentageValue(stock, 'Implied Move');
        const maxPositionValue = impliedMove > 0
          ? Math.min(eventRiskBudget / (impliedMove / 100), portfolioValue)
          : 0;

        return {
          stock,
          impliedMove,
          maxPositionValue,
          estimatedEventLoss: maxPositionValue * (impliedMove / 100)
        };
      })
      .filter((plan) => plan.impliedMove > 0)
      .slice(0, 8);
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

  private buildOpportunityMap(): void {
    const stocks = [...this.filteredStockInfoObjects]
      .sort((firstStock, secondStock) => (
        this.getMarketCapInBillions(secondStock['Market Cap']) -
        this.getMarketCapInBillions(firstStock['Market Cap'])
      ))
      .slice(0, 30);

    if (stocks.length === 0) {
      this.opportunityMapPoints = [];
      this.opportunityRiskLine = 50;
      this.opportunityZeroLine = 50;
      return;
    }

    const impliedMoves = stocks.map((stock) => this.getPercentageValue(stock, 'Implied Move'));
    const quarterlyGrowthValues = stocks.map((stock) => this.getPercentageValue(stock, 'Quarterly Growth'));
    const maxImpliedMove = Math.max(8, ...impliedMoves);
    const minQuarterlyGrowth = Math.min(0, ...quarterlyGrowthValues);
    const maxQuarterlyGrowth = Math.max(0, ...quarterlyGrowthValues);
    const growthRange = maxQuarterlyGrowth - minQuarterlyGrowth;

    this.opportunityRiskLine = 8 + (8 / maxImpliedMove) * 84;
    this.opportunityZeroLine = growthRange === 0
      ? 50
      : 8 + ((0 - minQuarterlyGrowth) / growthRange) * 84;
    this.opportunityMapPoints = stocks.map((stock) => {
      const impliedMove = this.getPercentageValue(stock, 'Implied Move');
      const quarterlyGrowth = this.getPercentageValue(stock, 'Quarterly Growth');

      return {
        stock,
        impliedMove,
        quarterlyGrowth,
        x: 8 + (Math.max(impliedMove, 0) / maxImpliedMove) * 84,
        y: growthRange === 0
          ? 50
          : 8 + ((quarterlyGrowth - minQuarterlyGrowth) / growthRange) * 84
      };
    });
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

    if (this.sortField === 'quarterlyGrowth') {
      return this.getPercentageValue(stock, 'Quarterly Growth');
    }

    if (this.sortField === 'daysToCover') {
      return this.getNumberValue(stock, 'Days To Cover');
    }

    if (this.sortField === 'estimate') {
      return this.getEstimateValue(stock);
    }

    return this.getMarketCapInBillions(stock['Market Cap']);
  }

  private getEstimateValue(stock: StockInfo): number {
    const value = Number(stock.Estimate);
    return Number.isNaN(value) ? 0 : value;
  }

  private matchesBaseFilters(stock: StockInfo, normalizedSearch: string, ignoreMarketCap = false): boolean {
    const matchesSearch = normalizedSearch.length === 0 ||
      stock.Ticker.toLowerCase().includes(normalizedSearch) ||
      stock.Name.toLowerCase().includes(normalizedSearch);
    const marketCap = this.getMarketCapInBillions(stock['Market Cap']);
    const matchesMarketCap = ignoreMarketCap || (
      marketCap >= this.minimumMarketCap && this.matchesMarketCapCohort(stock)
    );

    return matchesSearch &&
      this.getPercentageValue(stock, 'Implied Move') >= this.minimumImpliedMove &&
      this.getPercentageValue(stock, 'Short Interest') >= this.minimumShortInterest &&
      (this.minimumQuarterlyGrowth === null ||
        this.getPercentageValue(stock, 'Quarterly Growth') >= this.minimumQuarterlyGrowth) &&
      this.getNumberValue(stock, 'Days To Cover') >= this.minimumDaysToCover &&
      matchesMarketCap &&
      this.matchesEstimateOutlook(this.getEstimateValue(stock));
  }

  private getMarketCapCohort(stock: StockInfo): Exclude<MarketCapCohort, 'all'> | null {
    const marketCap = this.getMarketCapInBillions(stock['Market Cap']);

    if (marketCap <= 0) {
      return null;
    }
    if (marketCap < 2) {
      return 'small';
    }
    if (marketCap < 10) {
      return 'mid';
    }
    if (marketCap < 100) {
      return 'large';
    }
    return 'mega';
  }

  private matchesMarketCapCohort(stock: StockInfo): boolean {
    return this.marketCapCohort === 'all' || this.getMarketCapCohort(stock) === this.marketCapCohort;
  }

  private getCatalystProfile(stock: StockInfo): Exclude<CatalystProfile, 'all'> {
    const hasHighMove = this.getPercentageValue(stock, 'Implied Move') >= 8;
    const hasHighShortInterest = this.getPercentageValue(stock, 'Short Interest') >= 10;

    if (hasHighMove && hasHighShortInterest) {
      return 'volatileCrowded';
    }

    if (hasHighMove) {
      return 'moveDriven';
    }

    if (hasHighShortInterest) {
      return 'crowdedOnly';
    }

    return 'lowerRisk';
  }

  private matchesCatalystProfile(stock: StockInfo): boolean {
    return this.catalystProfile === 'all' || this.getCatalystProfile(stock) === this.catalystProfile;
  }

  private loadSavedReports(): SavedReport[] {
    try {
      const storedReports = JSON.parse(localStorage.getItem(this.savedReportStorageKey) || '[]');
      return Array.isArray(storedReports)
        ? storedReports
          .filter((report) => report && report.ticker && report.reportDate)
          .map((report) => ({...report, status: this.normalizeSavedReportStatus(report.status)}))
          .slice(0, 20)
        : [];
    } catch (error) {
      return [];
    }
  }

  private normalizeSavedReportStatus(status: unknown): SavedReportStatus {
    return status === 'watching' || status === 'ready' || status === 'skip' ? status : 'research';
  }

  private persistSavedReports(): void {
    try {
      localStorage.setItem(this.savedReportStorageKey, JSON.stringify(this.savedReports));
    } catch (error) {
      this.savedReportMessage = 'Saved reports are unavailable in this browser.';
    }
  }

  private matchesEstimateOutlook(estimate: number): boolean {
    if (this.estimateOutlook === 'positive') {
      return estimate > 0.1;
    }

    if (this.estimateOutlook === 'loss') {
      return estimate < -0.1;
    }

    if (this.estimateOutlook === 'breakEven') {
      return estimate >= -0.1 && estimate <= 0.1;
    }

    return true;
  }

  private getPercentageValue(stock: StockInfo, field: string): number {
    const value = Number(stock[field]);

    if (Number.isNaN(value)) {
      return 0;
    }

    return value * 100;
  }

  private getNumberValue(stock: StockInfo, field: string): number {
    const value = Number(stock[field]);
    return Number.isNaN(value) ? 0 : value;
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
