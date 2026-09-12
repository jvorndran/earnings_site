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
type EarningsQualityProfile = 'all' | 'durable' | 'expectationsHigh' | 'turnaround' | 'fundamentalPressure' | 'mixed';
type MarketCapCohort = 'all' | 'small' | 'mid' | 'large' | 'mega';
type EarningsSignalLens = 'balanced' | 'fundamental' | 'squeeze';
type SavedReportStatus = 'research' | 'watching' | 'ready' | 'skip';
type SavedReportFilter = 'all' | SavedReportStatus;
type SavedReportStrategy = 'unassigned' | 'preEvent' | 'postEvent' | 'avoidEvent' | 'longTerm';
type SavedReportStrategyFilter = 'all' | SavedReportStrategy;
type SavedReportEventTiming = 'unconfirmed' | 'beforeOpen' | 'afterClose' | 'duringMarket';
type SavedReportRole = 'unassigned' | 'primary' | 'satellite' | 'hedge' | 'monitor';
type SavedReportRoleFilter = 'all' | SavedReportRole;
type SavedReportConviction = 'unassigned' | 'exploratory' | 'standard' | 'high';
type SavedReportConvictionFilter = 'all' | SavedReportConviction;
type SavedReportDecisionFilter = 'all' | 'needsStrategy' | 'needsRole' | 'needsConviction' | 'needsPreEventRisk';
type SavedReportResearchLane = 'all' | 'needsFoundation' | 'needsPreflight' | 'needsJournal' | 'readyToStage' | 'executionReady' | 'skipped';
type SavedReportPreparationKey = 'estimateReviewed' | 'riskPlanned' | 'timingConfirmed';
type SavedReportJournalKey = 'thesis' | 'risk' | 'decision';
type SavedReportReviewOutcome = 'unreviewed' | 'positive' | 'negative' | 'mixed' | 'flat';
type SavedReportReviewKey = 'reaction' | 'lesson' | 'followUp';
type PostEarningsReviewFilter = 'all' | 'needsOutcome' | 'needsNotes' | 'complete';
type SavedReportLessonOutcomeFilter = 'all' | Exclude<SavedReportReviewOutcome, 'unreviewed'>;
type SavedReportPlaybookKey = 'preEventStarter' | 'postEventStarter' | 'longTermResearch';

interface SavedReportPreparation {
  estimateReviewed: boolean;
  riskPlanned: boolean;
  timingConfirmed: boolean;
}

interface SavedReportJournal {
  thesis: string;
  risk: string;
  decision: string;
}

interface SavedReportReview {
  followUp: string;
  followUpComplete: boolean;
  outcome: SavedReportReviewOutcome;
  reaction: string;
  lesson: string;
}

interface SavedReportPlaybook {
  conviction: SavedReportConviction;
  detail: string;
  key: SavedReportPlaybookKey;
  label: string;
  plannedRiskPercent: number;
  role: SavedReportRole;
  status: SavedReportStatus;
  strategy: SavedReportStrategy;
}

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

interface EarningsQualityBucket {
  key: Exclude<EarningsQualityProfile, 'all'>;
  label: string;
  detail: string;
  count: number;
  averageQuarterlyGrowth: number;
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

interface EarningsSignalItem {
  daysToCover: number;
  estimate: number;
  growth: number;
  impliedMove: number;
  score: number;
  shortInterest: number;
  stock: StockInfo;
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
  eventTiming?: SavedReportEventTiming;
  impliedMove: number;
  shortInterest: number;
  marketCap: string | number;
  plannedRiskPercent?: number;
  status?: SavedReportStatus;
  strategy?: SavedReportStrategy;
  role?: SavedReportRole;
  conviction?: SavedReportConviction;
  preparation?: Partial<SavedReportPreparation>;
  journal?: Partial<SavedReportJournal>;
  review?: Partial<SavedReportReview>;
}

interface SavedReportFocus {
  report: SavedReport;
  score: number;
  nextAction: string;
  preparationRemaining: number;
  journalRemaining: number;
}

interface SavedReportExposurePlan {
  allocationPercent: number;
  impliedMove: number;
  plannedEventRisk: number;
  report: SavedReport;
  targetPositionValue: number;
}

interface SavedReportRoleExposure {
  averageAllocationPercent: number;
  plannedEventRisk: number;
  reportCount: number;
  role: SavedReportRole;
  roleLabel: string;
  targetPositionValue: number;
}

interface SavedReportRoleReviewSummary {
  completedCount: number;
  lessonCount: number;
  negativeCount: number;
  positiveCount: number;
  recordedOutcomeCount: number;
  reportCount: number;
  role: Exclude<SavedReportRole, 'unassigned'>;
  roleLabel: string;
}

interface SavedReportRoleConvictionSummary {
  activeCount: number;
  conviction: SavedReportConviction;
  convictionLabel: string;
  plannedEventRisk: number;
  reportCount: number;
  role: SavedReportRole;
  roleLabel: string;
}

interface SavedReportRiskCapacity {
  capacity: number;
  hasRiskCap: boolean;
  plannedEventRisk: number;
  riskOverage: number;
  riskRemaining: number;
  status: 'unavailable' | 'open' | 'tight' | 'over';
  utilization: number;
}

interface SavedReportReadiness {
  activeCount: number;
  fullyDocumentedCount: number;
  journalFieldsRemaining: number;
  nextReport: SavedReport | null;
  preparationStepsRemaining: number;
  readinessPercent: number;
  skippedCount: number;
}

type SavedReportScheduleWindow = 'now' | 'nextWeek' | 'later' | 'past';

interface SavedReportScheduleItem {
  daysUntil: number | null;
  journalRemaining: number;
  preparationRemaining: number;
  report: SavedReport;
}

interface SavedReportScheduleGroup {
  detail: string;
  items: SavedReportScheduleItem[];
  key: SavedReportScheduleWindow;
  label: string;
}

interface SavedReportEventConcentration {
  averageImpliedMove: number;
  elevatedMoveCount: number;
  estimatedRisk: number;
  reportDate: string;
  reports: SavedReport[];
  totalImpliedMove: number;
}

interface SavedReportRiskWindow {
  endDate: string;
  plannedEventRisk: number;
  plans: SavedReportExposurePlan[];
  targetPositionValue: number;
  startDate: string;
}

interface SavedReportTimingPlan {
  plannedEventRisk: number;
  preparationRemaining: number;
  readyCount: number;
  reports: SavedReport[];
  targetPositionValue: number;
  timing: SavedReportEventTiming;
  timingDetail: string;
  timingLabel: string;
}

interface SavedReportReviewItem {
  daysSince: number;
  report: SavedReport;
}

interface SavedReportFollowUpItem extends SavedReportReviewItem {
  action: string;
}

interface SavedReportReviewSummary {
  completeCount: number;
  leadingOutcome: SavedReportReviewOutcome | null;
  lessonCount: number;
  negativeCount: number;
  positiveCount: number;
  recordedOutcomeCount: number;
  totalCount: number;
}

interface SavedReportLessonItem {
  report: SavedReport;
  review: SavedReportReview;
}

interface SavedReportStrategyReviewSummary {
  completedCount: number;
  lessonCount: number;
  negativeCount: number;
  positiveCount: number;
  recordedOutcomeCount: number;
  reportCount: number;
  strategy: Exclude<SavedReportStrategy, 'unassigned'>;
  strategyLabel: string;
}

interface SavedReportTimingReviewSummary {
  completedCount: number;
  lessonCount: number;
  negativeCount: number;
  positiveCount: number;
  recordedOutcomeCount: number;
  reportCount: number;
  timing: SavedReportEventTiming;
  timingDetail: string;
  timingLabel: string;
}

interface SavedReportConvictionReviewSummary {
  completedCount: number;
  conviction: Exclude<SavedReportConviction, 'unassigned'>;
  convictionLabel: string;
  lessonCount: number;
  negativeCount: number;
  positiveCount: number;
  recordedOutcomeCount: number;
  reportCount: number;
}

type SavedReportImpliedMoveCohort = 'contained' | 'expected' | 'elevated';

interface SavedReportImpliedMoveReviewSummary {
  averageImpliedMove: number;
  completedCount: number;
  cohort: SavedReportImpliedMoveCohort;
  cohortLabel: string;
  detail: string;
  negativeCount: number;
  positiveCount: number;
  recordedOutcomeCount: number;
  reportCount: number;
}

interface SavedReportTickerMemory {
  documentedReviewCount: number;
  lessonCount: number;
  name: string;
  nextReport: SavedReport | null;
  pastReportCount: number;
  reportCount: number;
  ticker: string;
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
  earningsQualityProfile: EarningsQualityProfile = 'all';
  marketCapCohort: MarketCapCohort = 'all';
  earningsSignalLens: EarningsSignalLens = 'balanced';
  sortField: SortField = 'marketCap';
  sortDirection: SortDirection = 'desc';
  comparisonTickers: string[] = [];
  comparisonMessage = 'Select up to four companies from the report table.';
  exportMessage = '';
  savedReportMessage = '';
  savedReports: SavedReport[] = [];
  savedReportFilter: SavedReportFilter = 'all';
  savedReportStrategyFilter: SavedReportStrategyFilter = 'all';
  savedReportRoleFilter: SavedReportRoleFilter = 'all';
  savedReportConvictionFilter: SavedReportConvictionFilter = 'all';
  savedReportDecisionFilter: SavedReportDecisionFilter = 'all';
  savedReportResearchLaneFilter: SavedReportResearchLane = 'all';
  savedReportSearchText = '';
  postEarningsReviewFilter: PostEarningsReviewFilter = 'all';
  savedReportLessonSearchText = '';
  savedReportLessonOutcomeFilter: SavedReportLessonOutcomeFilter = 'all';
  readonly savedReportWorkflowStages: Array<{key: SavedReportStatus; label: string; detail: string}> = [
    {key: 'research', label: 'Research', detail: 'Needs a first review'},
    {key: 'watching', label: 'Watching', detail: 'Catalyst is on deck'},
    {key: 'ready', label: 'Ready', detail: 'Plan is prepared'},
    {key: 'skip', label: 'Skip', detail: 'No action planned'}
  ];
  readonly savedReportStrategies: Array<{key: SavedReportStrategy; label: string; detail: string}> = [
    {key: 'unassigned', label: 'Needs decision', detail: 'Choose an event approach'},
    {key: 'preEvent', label: 'Pre-event', detail: 'Plan for exposure before results'},
    {key: 'postEvent', label: 'After results', detail: 'Wait for the report reaction'},
    {key: 'avoidEvent', label: 'Avoid event', detail: 'No exposure through results'},
    {key: 'longTerm', label: 'Long-term', detail: 'Research beyond this report'}
  ];
  readonly savedReportEventTimings: Array<{key: SavedReportEventTiming; label: string; detail: string}> = [
    {key: 'unconfirmed', label: 'Confirm timing', detail: 'Report session has not been recorded.'},
    {key: 'beforeOpen', label: 'Before open', detail: 'Plan research and orders before the market opens.'},
    {key: 'afterClose', label: 'After close', detail: 'Plan for an after-hours catalyst and next-session review.'},
    {key: 'duringMarket', label: 'During market', detail: 'Keep an intraday response plan ready.'}
  ];
  readonly savedReportRoles: Array<{key: SavedReportRole; label: string; detail: string}> = [
    {key: 'unassigned', label: 'Needs role', detail: 'Classify its place in the portfolio'},
    {key: 'primary', label: 'Primary idea', detail: 'Highest-conviction event research'},
    {key: 'satellite', label: 'Satellite', detail: 'Smaller tactical catalyst'},
    {key: 'hedge', label: 'Hedge', detail: 'Offsets a related exposure'},
    {key: 'monitor', label: 'Monitor', detail: 'Track without allocating risk'}
  ];
  readonly savedReportConvictions: Array<{key: SavedReportConviction; label: string; detail: string}> = [
    {key: 'unassigned', label: 'Needs conviction', detail: 'Set a research confidence level'},
    {key: 'exploratory', label: 'Exploratory', detail: 'Early thesis or limited evidence'},
    {key: 'standard', label: 'Standard', detail: 'Evidence supports a normal review'},
    {key: 'high', label: 'High conviction', detail: 'Strong evidence for priority research'}
  ];
  readonly savedReportDecisionFilters: Array<{key: SavedReportDecisionFilter; label: string; detail: string}> = [
    {key: 'all', label: 'All saved reports', detail: 'Full research shortlist'},
    {key: 'needsStrategy', label: 'Needs approach', detail: 'Choose how to handle the event'},
    {key: 'needsRole', label: 'Needs role', detail: 'Classify the portfolio purpose'},
    {key: 'needsConviction', label: 'Needs conviction', detail: 'Set research confidence'},
    {key: 'needsPreEventRisk', label: 'Needs allocation', detail: 'Pre-event plan has no risk share'}
  ];
  readonly savedReportResearchLanes: Array<{key: Exclude<SavedReportResearchLane, 'all'>; label: string; detail: string}> = [
    {key: 'needsFoundation', label: 'Needs foundation', detail: 'Approach, role, or conviction is missing.'},
    {key: 'needsPreflight', label: 'Needs preflight', detail: 'Checklist or pre-event allocation is incomplete.'},
    {key: 'needsJournal', label: 'Needs journal', detail: 'Capture thesis, risk, or event decision.'},
    {key: 'readyToStage', label: 'Ready to stage', detail: 'Research is complete; mark the workflow ready.'},
    {key: 'executionReady', label: 'Execution ready', detail: 'Saved as ready with complete research.'},
    {key: 'skipped', label: 'Skipped', detail: 'Retained for reference without an active plan.'}
  ];
  readonly savedReportRiskAllocations: Array<{percent: number; label: string}> = [
    {percent: 0, label: 'Not planned'},
    {percent: 25, label: '25% of risk budget'},
    {percent: 50, label: '50% of risk budget'},
    {percent: 75, label: '75% of risk budget'},
    {percent: 100, label: '100% of risk budget'}
  ];
  readonly savedReportPlaybooks: SavedReportPlaybook[] = [
    {
      key: 'preEventStarter',
      label: 'Pre-event starter',
      detail: 'Watching · Satellite · Standard · 25% event risk',
      status: 'watching',
      strategy: 'preEvent',
      role: 'satellite',
      conviction: 'standard',
      plannedRiskPercent: 25
    },
    {
      key: 'postEventStarter',
      label: 'Post-event confirmation',
      detail: 'Watching · Monitor · Standard · no event risk',
      status: 'watching',
      strategy: 'postEvent',
      role: 'monitor',
      conviction: 'standard',
      plannedRiskPercent: 0
    },
    {
      key: 'longTermResearch',
      label: 'Long-term research',
      detail: 'Research · Primary · High conviction · no event risk',
      status: 'research',
      strategy: 'longTerm',
      role: 'primary',
      conviction: 'high',
      plannedRiskPercent: 0
    }
  ];
  readonly savedReportReviewOutcomes: Array<{key: SavedReportReviewOutcome; label: string}> = [
    {key: 'unreviewed', label: 'Not reviewed'},
    {key: 'positive', label: 'Positive reaction'},
    {key: 'negative', label: 'Negative reaction'},
    {key: 'mixed', label: 'Mixed reaction'},
    {key: 'flat', label: 'Muted reaction'}
  ];
  readonly postEarningsReviewFilters: Array<{key: PostEarningsReviewFilter; label: string; detail: string}> = [
    {key: 'all', label: 'All past reports', detail: 'See every saved report whose date has passed.'},
    {key: 'needsOutcome', label: 'Needs outcome', detail: 'Record the initial market reaction.'},
    {key: 'needsNotes', label: 'Needs notes', detail: 'Finish the reaction and carry-forward lesson.'},
    {key: 'complete', label: 'Complete', detail: 'Review fully documented event learnings.'}
  ];
  readonly savedReportLessonOutcomes: Array<{key: Exclude<SavedReportReviewOutcome, 'unreviewed'>; label: string}> = [
    {key: 'positive', label: 'Positive'},
    {key: 'negative', label: 'Negative'},
    {key: 'mixed', label: 'Mixed'},
    {key: 'flat', label: 'Muted'}
  ];
  readonly earningsSignalLenses: Array<{key: EarningsSignalLens; label: string; detail: string}> = [
    {key: 'balanced', label: 'Balanced catalyst', detail: 'Growth, earnings, event move, and positioning share the weight.'},
    {key: 'fundamental', label: 'Fundamental', detail: 'Prioritize positive earnings power and quarterly growth.'},
    {key: 'squeeze', label: 'Squeeze setup', detail: 'Prioritize short interest, days to cover, and expected move.'}
  ];
  readonly savedReportPreparationSteps: Array<{key: SavedReportPreparationKey; label: string}> = [
    {key: 'estimateReviewed', label: 'Review the consensus estimate'},
    {key: 'riskPlanned', label: 'Set the event-risk budget'},
    {key: 'timingConfirmed', label: 'Confirm report timing'}
  ];
  opportunityMapPoints: OpportunityMapPoint[] = [];
  opportunityRiskLine = 50;
  opportunityZeroLine = 50;
  portfolioValue = 25000;
  maximumEventRiskPercent = 1;
  maximumAggregateEventRiskPercent = 3;
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
        status: 'research' as SavedReportStatus,
        strategy: 'unassigned' as SavedReportStrategy,
        role: 'unassigned' as SavedReportRole,
        conviction: 'unassigned' as SavedReportConviction,
        plannedRiskPercent: 0,
        preparation: this.normalizeSavedReportPreparation(),
        review: this.normalizeSavedReportReview()
      }, ...this.savedReports].slice(0, 20);
      this.savedReportMessage = `${stock.Ticker} saved for follow-up.`;
      this.savedReportFilter = 'all';
      this.savedReportStrategyFilter = 'all';
      this.savedReportRoleFilter = 'all';
      this.savedReportConvictionFilter = 'all';
      this.savedReportDecisionFilter = 'all';
      this.savedReportResearchLaneFilter = 'all';
      this.savedReportSearchText = '';
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
    this.savedReportStrategyFilter = 'all';
    this.savedReportRoleFilter = 'all';
    this.savedReportConvictionFilter = 'all';
    this.savedReportDecisionFilter = 'all';
    this.savedReportResearchLaneFilter = 'all';
    this.savedReportSearchText = '';
    this.savedReportMessage = 'Saved report shortlist cleared.';
    this.persistSavedReports();
  }

  downloadSavedReportsBackup(): void {
    if (this.savedReports.length === 0) {
      this.savedReportMessage = 'Save at least one report before downloading a backup.';
      return;
    }

    const backup = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      reports: this.savedReports
    }, null, 2);
    const blob = new Blob([backup], {type: 'application/json'});
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `earnings-research-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    this.savedReportMessage = `${this.savedReports.length} saved report${this.savedReports.length === 1 ? '' : 's'} downloaded as a backup.`;
  }

  downloadSavedReportsCsv(): void {
    if (this.savedReports.length === 0) {
      this.savedReportMessage = 'Save at least one report before exporting research.';
      return;
    }

    const headers = [
      'Ticker', 'Company', 'Report Date', 'Report Timing', 'Workflow Status', 'Event Strategy', 'Portfolio Role', 'Conviction',
      'Implied Move (%)', 'Short Interest (%)', 'EPS Estimate', 'Market Cap', 'Risk Allocation (%)',
      'Preparation Complete', 'Journal Fields Complete', 'Review Outcome', 'Review Reaction', 'Review Lesson',
      'Follow-through Action', 'Follow-through Complete'
    ];
    const rows = [...this.savedReports]
      .sort((first, second) => first.reportDate.localeCompare(second.reportDate) || first.ticker.localeCompare(second.ticker))
      .map((report) => {
        const review = this.getSavedReportReview(report);

        return [
          report.ticker,
          report.name,
          report.reportDate,
          this.getSavedReportEventTimingLabel(this.getSavedReportEventTiming(report)),
          this.getSavedReportStatusLabel(this.getSavedReportStatus(report)),
          this.getSavedReportStrategyLabel(this.getSavedReportStrategy(report)),
          this.getSavedReportRoleLabel(this.getSavedReportRole(report)),
          this.getSavedReportConvictionLabel(this.getSavedReportConviction(report)),
          report.impliedMove,
          report.shortInterest,
          report.estimate,
          report.marketCap,
          this.getSavedReportRiskAllocation(report),
          `${this.getSavedReportPreparationCount(report)}/${this.savedReportPreparationSteps.length}`,
          `${this.getSavedReportJournalCount(report)}/3`,
          this.getSavedReportReviewLabel(review.outcome),
          review.reaction,
          review.lesson,
          review.followUp,
          review.followUpComplete ? 'Complete' : 'Open',
        ];
      });
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `earnings-research-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    this.savedReportMessage = `${this.savedReports.length} saved report${this.savedReports.length === 1 ? '' : 's'} exported as CSV.`;
  }

  restoreSavedReportsBackup(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    input.value = '';

    if (!file) {
      return;
    }

    if (file.size > 1024 * 1024) {
      this.savedReportMessage = 'Choose a saved-report backup smaller than 1 MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsedBackup = JSON.parse(String(reader.result || ''));
        const importedReports = this.normalizeSavedReports(parsedBackup?.reports);

        if (importedReports.length === 0) {
          throw new Error('No saved reports found');
        }

        this.savedReports = importedReports;
        this.savedReportFilter = 'all';
        this.savedReportStrategyFilter = 'all';
        this.savedReportRoleFilter = 'all';
        this.savedReportConvictionFilter = 'all';
        this.savedReportDecisionFilter = 'all';
        this.savedReportResearchLaneFilter = 'all';
        this.persistSavedReports();
        this.savedReportMessage = `${importedReports.length} saved report${importedReports.length === 1 ? '' : 's'} restored from backup.`;
      } catch (error) {
        this.savedReportMessage = 'That file is not a valid saved-report backup.';
      }
    };
    reader.onerror = () => {
      this.savedReportMessage = 'The selected backup could not be read.';
    };
    reader.readAsText(file);
  }

  get visibleSavedReports(): SavedReport[] {
    const normalizedSearch = this.savedReportSearchText.trim().toLowerCase();

    return this.savedReports.filter((report) => (
      (this.savedReportFilter === 'all' || this.getSavedReportStatus(report) === this.savedReportFilter) &&
      (this.savedReportStrategyFilter === 'all' || this.getSavedReportStrategy(report) === this.savedReportStrategyFilter) &&
      (this.savedReportRoleFilter === 'all' || this.getSavedReportRole(report) === this.savedReportRoleFilter) &&
      (this.savedReportConvictionFilter === 'all' || this.getSavedReportConviction(report) === this.savedReportConvictionFilter) &&
      this.matchesSavedReportDecisionFilter(report, this.savedReportDecisionFilter) &&
      this.matchesSavedReportResearchLane(report, this.savedReportResearchLaneFilter) &&
      (normalizedSearch.length === 0 ||
        report.ticker.toLowerCase().includes(normalizedSearch) ||
        report.name.toLowerCase().includes(normalizedSearch) ||
        report.reportDate.toLowerCase().includes(normalizedSearch))
    ));
  }

  getSavedReportTickerMemories(now: Date = new Date()): SavedReportTickerMemory[] {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reportsByTicker = this.savedReports.reduce((groups, report) => {
      const ticker = report.ticker.trim().toUpperCase();
      const reports = groups.get(ticker) || [];
      reports.push(report);
      groups.set(ticker, reports);
      return groups;
    }, new Map<string, SavedReport[]>());

    return Array.from(reportsByTicker.entries())
      .map(([ticker, reports]) => {
        const datedReports = reports.map((report) => ({
          report,
          daysUntil: this.getSavedReportDaysUntil(report.reportDate, startOfToday)
        }));
        const nextReport = datedReports
          .filter((item) => item.daysUntil !== null && item.daysUntil >= 0)
          .sort((left, right) => (left.daysUntil || 0) - (right.daysUntil || 0))[0]?.report || null;
        const pastReports = datedReports.filter((item) => item.daysUntil !== null && item.daysUntil < 0);

        return {
          ticker,
          name: reports[0].name,
          nextReport,
          reportCount: reports.length,
          pastReportCount: pastReports.length,
          documentedReviewCount: pastReports.filter((item) => this.isSavedReportReviewComplete(item.report)).length,
          lessonCount: reports.filter((report) => this.getSavedReportReview(report).lesson.trim().length > 0).length
        };
      })
      .sort((left, right) => {
        const leftDays = left.nextReport ? this.getSavedReportDaysUntil(left.nextReport.reportDate, startOfToday) : Number.MAX_SAFE_INTEGER;
        const rightDays = right.nextReport ? this.getSavedReportDaysUntil(right.nextReport.reportDate, startOfToday) : Number.MAX_SAFE_INTEGER;
        return (leftDays || 0) - (rightDays || 0) || left.ticker.localeCompare(right.ticker);
      });
  }

  focusSavedReportTicker(ticker: string): void {
    this.savedReportFilter = 'all';
    this.savedReportStrategyFilter = 'all';
    this.savedReportRoleFilter = 'all';
    this.savedReportConvictionFilter = 'all';
    this.savedReportDecisionFilter = 'all';
    this.savedReportResearchLaneFilter = 'all';
    this.savedReportSearchText = ticker;
    this.savedReportMessage = `Showing every saved ${ticker} report and its research history.`;
  }

  getSavedReportFocusItems(): SavedReportFocus[] {
    return this.savedReports
      .filter((report) => this.getSavedReportStatus(report) !== 'skip')
      .map((report) => {
        const preparationRemaining = this.savedReportPreparationSteps.length - this.getSavedReportPreparationCount(report);
        const journalRemaining = 3 - this.getSavedReportJournalCount(report);
        const nextChecklistStep = this.savedReportPreparationSteps.find((step) => (
          !this.isSavedReportPreparationComplete(report, step.key)
        ));
        const status = this.getSavedReportStatus(report);
        const score = (preparationRemaining * 10) + (journalRemaining * 6) +
          (status === 'research' ? 12 : status === 'watching' ? 6 : 0) +
          (report.impliedMove >= 8 ? 4 : 0) + (report.shortInterest >= 10 ? 3 : 0);
        const nextAction = nextChecklistStep
          ? nextChecklistStep.label
          : journalRemaining > 0
            ? 'Capture the remaining decision journal fields'
            : status === 'ready'
              ? 'Review the ready event plan'
              : 'Set the event workflow stage';

        return {report, score, nextAction, preparationRemaining, journalRemaining};
      })
      .sort((first, second) => second.score - first.score || first.report.reportDate.localeCompare(second.report.reportDate))
      .slice(0, 3);
  }

  getSavedReportReadiness(): SavedReportReadiness {
    const activeReports = this.savedReports.filter((report) => this.getSavedReportStatus(report) !== 'skip');
    const preparationStepCount = this.savedReportPreparationSteps.length;
    const journalFieldCount = 3;
    const preparationStepsRemaining = activeReports.reduce((total, report) => (
      total + preparationStepCount - this.getSavedReportPreparationCount(report)
    ), 0);
    const journalFieldsRemaining = activeReports.reduce((total, report) => (
      total + journalFieldCount - this.getSavedReportJournalCount(report)
    ), 0);
    const totalResearchFields = activeReports.length * (preparationStepCount + journalFieldCount);
    const completedResearchFields = totalResearchFields - preparationStepsRemaining - journalFieldsRemaining;
    const nextReport = [...activeReports]
      .sort((first, second) => first.reportDate.localeCompare(second.reportDate) || first.ticker.localeCompare(second.ticker))[0] || null;

    return {
      activeCount: activeReports.length,
      fullyDocumentedCount: activeReports.filter((report) => (
        this.getSavedReportPreparationCount(report) === preparationStepCount &&
        this.getSavedReportJournalCount(report) === journalFieldCount
      )).length,
      journalFieldsRemaining,
      nextReport,
      preparationStepsRemaining,
      readinessPercent: totalResearchFields === 0 ? 0 : Math.round((completedResearchFields / totalResearchFields) * 100),
      skippedCount: this.savedReports.length - activeReports.length
    };
  }

  getSavedReportSchedule(now: Date = new Date()): SavedReportScheduleGroup[] {
    const groups: SavedReportScheduleGroup[] = [
      {key: 'now', label: 'Due now', detail: 'Today through the next two days', items: []},
      {key: 'nextWeek', label: 'Next week', detail: 'Three to seven days away', items: []},
      {key: 'later', label: 'Later', detail: 'More than one week away', items: []},
      {key: 'past', label: 'Past / review', detail: 'A report date has passed or needs attention', items: []}
    ];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    this.savedReports
      .filter((report) => this.getSavedReportStatus(report) !== 'skip')
      .forEach((report) => {
        const daysUntil = this.getSavedReportDaysUntil(report.reportDate, startOfToday);
        const item: SavedReportScheduleItem = {
          daysUntil,
          journalRemaining: 3 - this.getSavedReportJournalCount(report),
          preparationRemaining: this.savedReportPreparationSteps.length - this.getSavedReportPreparationCount(report),
          report
        };
        const groupIndex = daysUntil === null || daysUntil < 0
          ? 3
          : daysUntil <= 2 ? 0 : daysUntil <= 7 ? 1 : 2;

        groups[groupIndex].items.push(item);
      });

    return groups
      .map((group) => ({
        ...group,
        items: group.items.sort((first, second) => {
          const firstDate = first.daysUntil === null ? Number.MAX_SAFE_INTEGER : first.daysUntil;
          const secondDate = second.daysUntil === null ? Number.MAX_SAFE_INTEGER : second.daysUntil;
          return firstDate - secondDate || first.report.ticker.localeCompare(second.report.ticker);
        })
      }))
      .filter((group) => group.items.length > 0);
  }

  getSavedReportEventConcentrations(now: Date = new Date()): SavedReportEventConcentration[] {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activeReports = this.savedReports.filter((report) => (
      this.getSavedReportStatus(report) !== 'skip' && this.getSavedReportDaysUntil(report.reportDate, startOfToday) !== null
    ));
    const reportsByDate = activeReports.reduce((groups, report) => {
      const reports = groups.get(report.reportDate) || [];
      groups.set(report.reportDate, [...reports, report]);
      return groups;
    }, new Map<string, SavedReport[]>());
    const riskPerReport = this.getEventRiskBudget();

    return Array.from(reportsByDate.entries())
      .map(([reportDate, reports]) => {
        const totalImpliedMove = reports.reduce((total, report) => total + report.impliedMove, 0);

        return {
          averageImpliedMove: totalImpliedMove / reports.length,
          elevatedMoveCount: reports.filter((report) => report.impliedMove >= 8).length,
          estimatedRisk: reports.length * riskPerReport,
          reportDate,
          reports: [...reports].sort((first, second) => first.ticker.localeCompare(second.ticker)),
          totalImpliedMove,
        };
      })
      .filter((group) => group.reports.length > 1)
      .sort((first, second) => first.reportDate.localeCompare(second.reportDate));
  }

  getSavedReportRiskWindows(now: Date = new Date()): SavedReportRiskWindow[] {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const plans = this.getSavedReportExposurePlans(now)
      .sort((first, second) => first.report.reportDate.localeCompare(second.report.reportDate) || first.report.ticker.localeCompare(second.report.ticker));
    const windows: SavedReportExposurePlan[][] = [];
    let activeWindow: SavedReportExposurePlan[] = [];
    let windowStartDay: number | null = null;

    plans.forEach((plan) => {
      const daysUntil = this.getSavedReportDaysUntil(plan.report.reportDate, startOfToday);
      const isWithinWindow = windowStartDay !== null && daysUntil !== null && daysUntil - windowStartDay <= 2;

      if (activeWindow.length > 0 && !isWithinWindow) {
        windows.push(activeWindow);
        activeWindow = [];
        windowStartDay = null;
      }

      if (activeWindow.length === 0) {
        windowStartDay = daysUntil;
      }

      activeWindow.push(plan);
    });

    if (activeWindow.length > 0) {
      windows.push(activeWindow);
    }

    return windows
      .filter((window) => window.length > 1)
      .map((window) => ({
        startDate: window[0].report.reportDate,
        endDate: window[window.length - 1].report.reportDate,
        plans: window,
        plannedEventRisk: window.reduce((total, plan) => total + plan.plannedEventRisk, 0),
        targetPositionValue: window.reduce((total, plan) => total + plan.targetPositionValue, 0)
      }));
  }

  getSavedReportTimingPlans(now: Date = new Date()): SavedReportTimingPlan[] {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activeReports = this.savedReports
      .filter((report) => {
        const daysUntil = this.getSavedReportDaysUntil(report.reportDate, startOfToday);
        return this.getSavedReportStatus(report) !== 'skip' && daysUntil !== null && daysUntil >= 0;
      });
    const exposurePlans = this.getSavedReportExposurePlans(now);

    return this.savedReportEventTimings
      .map((timing) => {
        const reports = activeReports
          .filter((report) => this.getSavedReportEventTiming(report) === timing.key)
          .sort((first, second) => first.reportDate.localeCompare(second.reportDate) || first.ticker.localeCompare(second.ticker));
        const plans = exposurePlans.filter((plan) => this.getSavedReportEventTiming(plan.report) === timing.key);

        return {
          plannedEventRisk: plans.reduce((total, plan) => total + plan.plannedEventRisk, 0),
          preparationRemaining: reports.reduce((total, report) => (
            total + this.savedReportPreparationSteps.length - this.getSavedReportPreparationCount(report)
          ), 0),
          readyCount: reports.filter((report) => this.getSavedReportStatus(report) === 'ready').length,
          reports,
          targetPositionValue: plans.reduce((total, plan) => total + plan.targetPositionValue, 0),
          timing: timing.key,
          timingDetail: timing.detail,
          timingLabel: timing.label,
        };
      })
      .filter((plan) => plan.reports.length > 0);
  }

  getSavedReportExposurePlans(now: Date = new Date()): SavedReportExposurePlan[] {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const portfolioValue = Math.max(Number(this.portfolioValue) || 0, 0);
    const riskBudget = this.getEventRiskBudget();

    if (portfolioValue === 0 || riskBudget === 0) {
      return [];
    }

    return this.savedReports
      .filter((report) => {
        const daysUntil = this.getSavedReportDaysUntil(report.reportDate, startOfToday);
        return this.getSavedReportStatus(report) !== 'skip' &&
          this.getSavedReportStrategy(report) === 'preEvent' &&
          this.getSavedReportRiskAllocation(report) > 0 &&
          daysUntil !== null && daysUntil >= 0;
      })
      .map((report) => {
        const allocationPercent = this.getSavedReportRiskAllocation(report);
        const plannedEventRisk = riskBudget * (allocationPercent / 100);
        const impliedMove = Math.max(Number(report.impliedMove) || 0, 0);
        const targetPositionValue = impliedMove > 0
          ? Math.min(plannedEventRisk / (impliedMove / 100), portfolioValue)
          : 0;

        return {allocationPercent, impliedMove, plannedEventRisk, report, targetPositionValue};
      })
      .sort((first, second) => (
        first.report.reportDate.localeCompare(second.report.reportDate) ||
        second.plannedEventRisk - first.plannedEventRisk ||
        first.report.ticker.localeCompare(second.report.ticker)
      ));
  }

  getSavedReportExposureRiskTotal(): number {
    return this.getSavedReportExposurePlans().reduce((total, plan) => total + plan.plannedEventRisk, 0);
  }

  getSavedReportRiskCapacity(): SavedReportRiskCapacity {
    const portfolioValue = Math.max(Number(this.portfolioValue) || 0, 0);
    const riskCapPercent = Math.max(Number(this.maximumAggregateEventRiskPercent) || 0, 0);
    const capacity = portfolioValue * (riskCapPercent / 100);
    const plannedEventRisk = this.getSavedReportExposureRiskTotal();

    if (capacity === 0) {
      return {
        capacity: 0,
        hasRiskCap: false,
        plannedEventRisk,
        riskOverage: 0,
        riskRemaining: 0,
        status: 'unavailable',
        utilization: 0
      };
    }

    const utilization = plannedEventRisk / capacity;

    return {
      capacity,
      hasRiskCap: true,
      plannedEventRisk,
      riskOverage: Math.max(plannedEventRisk - capacity, 0),
      riskRemaining: Math.max(capacity - plannedEventRisk, 0),
      status: utilization > 1 ? 'over' : utilization >= 0.8 ? 'tight' : 'open',
      utilization
    };
  }

  getSavedReportRoleExposure(): SavedReportRoleExposure[] {
    const plans = this.getSavedReportExposurePlans();
    const roleOrder = this.savedReportRoles.map((role) => role.key);

    return this.savedReportRoles
      .map((role) => {
        const rolePlans = plans.filter((plan) => this.getSavedReportRole(plan.report) === role.key);
        const plannedEventRisk = rolePlans.reduce((total, plan) => total + plan.plannedEventRisk, 0);
        const targetPositionValue = rolePlans.reduce((total, plan) => total + plan.targetPositionValue, 0);

        return {
          averageAllocationPercent: rolePlans.length > 0
            ? rolePlans.reduce((total, plan) => total + plan.allocationPercent, 0) / rolePlans.length
            : 0,
          plannedEventRisk,
          reportCount: rolePlans.length,
          role: role.key,
          roleLabel: role.label,
          targetPositionValue,
        };
      })
      .filter((summary) => summary.reportCount > 0)
      .sort((first, second) => (
        roleOrder.indexOf(first.role) - roleOrder.indexOf(second.role) ||
        second.plannedEventRisk - first.plannedEventRisk
      ));
  }

  getSavedReportRoleConvictionSummaries(): SavedReportRoleConvictionSummary[] {
    const roleOrder = this.savedReportRoles.map((role) => role.key);
    const convictionOrder = this.savedReportConvictions.map((conviction) => conviction.key);
    const exposurePlans = this.getSavedReportExposurePlans();

    return this.savedReportRoles.flatMap((role) => this.savedReportConvictions.map((conviction) => {
      const reports = this.savedReports.filter((report) => (
        this.getSavedReportRole(report) === role.key &&
        this.getSavedReportConviction(report) === conviction.key
      ));
      const plannedEventRisk = exposurePlans
        .filter((plan) => (
          this.getSavedReportRole(plan.report) === role.key &&
          this.getSavedReportConviction(plan.report) === conviction.key
        ))
        .reduce((total, plan) => total + plan.plannedEventRisk, 0);

      return {
        activeCount: reports.filter((report) => this.getSavedReportStatus(report) !== 'skip').length,
        conviction: conviction.key,
        convictionLabel: conviction.label,
        plannedEventRisk,
        reportCount: reports.length,
        role: role.key,
        roleLabel: role.label,
      };
    }))
      .filter((summary) => summary.reportCount > 0)
      .sort((first, second) => (
        roleOrder.indexOf(first.role) - roleOrder.indexOf(second.role) ||
        convictionOrder.indexOf(first.conviction) - convictionOrder.indexOf(second.conviction) ||
        first.roleLabel.localeCompare(second.roleLabel)
      ));
  }

  getPostEarningsReviewItems(now: Date = new Date()): SavedReportReviewItem[] {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return this.savedReports
      .map((report) => ({report, daysUntil: this.getSavedReportDaysUntil(report.reportDate, startOfToday)}))
      .filter((item): item is {report: SavedReport; daysUntil: number} => item.daysUntil !== null && item.daysUntil < 0)
      .map((item) => ({report: item.report, daysSince: Math.abs(item.daysUntil)}))
      .sort((first, second) => (
        Number(this.isSavedReportReviewComplete(first.report)) - Number(this.isSavedReportReviewComplete(second.report)) ||
        first.report.reportDate.localeCompare(second.report.reportDate) ||
        first.report.ticker.localeCompare(second.report.ticker)
      ));
  }

  getPostEarningsReviewCompleteCount(): number {
    return this.getPostEarningsReviewItems().filter((item) => this.isSavedReportReviewComplete(item.report)).length;
  }

  getSavedReportFollowUpItems(): SavedReportFollowUpItem[] {
    return this.getPostEarningsReviewItems()
      .map((item) => ({
        ...item,
        action: this.getSavedReportReview(item.report).followUp.trim()
      }))
      .filter((item) => item.action.length > 0 && !this.isSavedReportFollowUpComplete(item.report))
      .sort((first, second) => second.daysSince - first.daysSince || first.report.ticker.localeCompare(second.report.ticker));
  }

  getSavedReportFollowUpCompleteCount(): number {
    return this.getPostEarningsReviewItems().filter((item) => {
      const review = this.getSavedReportReview(item.report);
      return review.followUp.trim().length > 0 && review.followUpComplete;
    }).length;
  }

  getVisiblePostEarningsReviewItems(): SavedReportReviewItem[] {
    return this.getPostEarningsReviewItems()
      .filter((item) => this.matchesPostEarningsReviewFilter(item, this.postEarningsReviewFilter));
  }

  getPostEarningsReviewFilterCount(filter: PostEarningsReviewFilter): number {
    return this.getPostEarningsReviewItems()
      .filter((item) => this.matchesPostEarningsReviewFilter(item, filter))
      .length;
  }

  setPostEarningsReviewFilter(filter: PostEarningsReviewFilter): void {
    this.postEarningsReviewFilter = filter;
  }

  setSavedReportLessonOutcomeFilter(filter: SavedReportLessonOutcomeFilter): void {
    this.savedReportLessonOutcomeFilter = filter;
  }

  clearSavedReportLessonSearch(): void {
    this.savedReportLessonSearchText = '';
  }

  getSavedReportLessonItems(): SavedReportLessonItem[] {
    const normalizedSearch = this.savedReportLessonSearchText.trim().toLowerCase();

    return this.getPostEarningsReviewItems()
      .map((item) => ({report: item.report, review: this.getSavedReportReview(item.report)}))
      .filter((item) => (
        item.review.lesson.trim().length > 0 &&
        item.review.outcome !== 'unreviewed' &&
        (this.savedReportLessonOutcomeFilter === 'all' || item.review.outcome === this.savedReportLessonOutcomeFilter) &&
        (normalizedSearch.length === 0 ||
          item.report.ticker.toLowerCase().includes(normalizedSearch) ||
          item.report.name.toLowerCase().includes(normalizedSearch) ||
          item.review.lesson.toLowerCase().includes(normalizedSearch) ||
          item.review.reaction.toLowerCase().includes(normalizedSearch))
      ))
      .sort((first, second) => (
        second.report.reportDate.localeCompare(first.report.reportDate) ||
        first.report.ticker.localeCompare(second.report.ticker)
      ));
  }

  private matchesPostEarningsReviewFilter(item: SavedReportReviewItem, filter: PostEarningsReviewFilter): boolean {
    const review = this.getSavedReportReview(item.report);

    if (filter === 'needsOutcome') {
      return review.outcome === 'unreviewed';
    }

    if (filter === 'needsNotes') {
      return review.outcome !== 'unreviewed' && !this.isSavedReportReviewComplete(item.report);
    }

    return filter !== 'complete' || this.isSavedReportReviewComplete(item.report);
  }

  getPostEarningsReviewSummary(): SavedReportReviewSummary {
    const reviewItems = this.getPostEarningsReviewItems();
    const outcomeCounts: Record<Exclude<SavedReportReviewOutcome, 'unreviewed'>, number> = {
      positive: 0,
      negative: 0,
      mixed: 0,
      flat: 0
    };
    let completeCount = 0;
    let lessonCount = 0;
    let recordedOutcomeCount = 0;

    reviewItems.forEach(({report}) => {
      const review = this.getSavedReportReview(report);

      if (this.isSavedReportReviewComplete(report)) {
        completeCount += 1;
      }

      if (review.lesson.trim().length > 0) {
        lessonCount += 1;
      }

      if (review.outcome !== 'unreviewed') {
        recordedOutcomeCount += 1;
        outcomeCounts[review.outcome] += 1;
      }
    });

    const leadingOutcome = (Object.entries(outcomeCounts) as Array<[Exclude<SavedReportReviewOutcome, 'unreviewed'>, number]>)
      .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
      .find(([, count]) => count > 0)?.[0] || null;

    return {
      completeCount,
      leadingOutcome,
      lessonCount,
      negativeCount: outcomeCounts.negative,
      positiveCount: outcomeCounts.positive,
      recordedOutcomeCount,
      totalCount: reviewItems.length
    };
  }

  getSavedReportStrategyReviewSummaries(): SavedReportStrategyReviewSummary[] {
    const pastReports = this.getPostEarningsReviewItems().map((item) => item.report);

    return this.savedReportStrategies
      .filter((strategy): strategy is {key: Exclude<SavedReportStrategy, 'unassigned'>; label: string; detail: string} => (
        strategy.key !== 'unassigned'
      ))
      .map((strategy) => {
        const reports = pastReports.filter((report) => this.getSavedReportStrategy(report) === strategy.key);
        const summary = reports.reduce((totals, report) => {
          const review = this.getSavedReportReview(report);

          if (this.isSavedReportReviewComplete(report)) {
            totals.completedCount += 1;
          }
          if (review.lesson.trim().length > 0) {
            totals.lessonCount += 1;
          }
          if (review.outcome !== 'unreviewed') {
            totals.recordedOutcomeCount += 1;
            if (review.outcome === 'positive') {
              totals.positiveCount += 1;
            }
            if (review.outcome === 'negative') {
              totals.negativeCount += 1;
            }
          }

          return totals;
        }, {
          completedCount: 0,
          lessonCount: 0,
          negativeCount: 0,
          positiveCount: 0,
          recordedOutcomeCount: 0,
        });

        return {
          ...summary,
          reportCount: reports.length,
          strategy: strategy.key,
          strategyLabel: strategy.label,
        };
      })
      .filter((summary) => summary.reportCount > 0)
      .sort((first, second) => (
        second.reportCount - first.reportCount || first.strategyLabel.localeCompare(second.strategyLabel)
      ));
  }

  getSavedReportTimingReviewSummaries(): SavedReportTimingReviewSummary[] {
    const pastReports = this.getPostEarningsReviewItems().map((item) => item.report);

    return this.savedReportEventTimings
      .map((timing) => {
        const reports = pastReports.filter((report) => this.getSavedReportEventTiming(report) === timing.key);
        const summary = reports.reduce((totals, report) => {
          const review = this.getSavedReportReview(report);

          if (this.isSavedReportReviewComplete(report)) {
            totals.completedCount += 1;
          }
          if (review.lesson.trim().length > 0) {
            totals.lessonCount += 1;
          }
          if (review.outcome !== 'unreviewed') {
            totals.recordedOutcomeCount += 1;
            if (review.outcome === 'positive') {
              totals.positiveCount += 1;
            }
            if (review.outcome === 'negative') {
              totals.negativeCount += 1;
            }
          }

          return totals;
        }, {
          completedCount: 0,
          lessonCount: 0,
          negativeCount: 0,
          positiveCount: 0,
          recordedOutcomeCount: 0,
        });

        return {
          ...summary,
          reportCount: reports.length,
          timing: timing.key,
          timingDetail: timing.detail,
          timingLabel: timing.label,
        };
      })
      .filter((summary) => summary.reportCount > 0);
  }

  getSavedReportImpliedMoveReviewSummaries(): SavedReportImpliedMoveReviewSummary[] {
    const pastReports = this.getPostEarningsReviewItems().map((item) => item.report);
    const cohorts: Array<{cohort: SavedReportImpliedMoveCohort; cohortLabel: string; detail: string; matches: (report: SavedReport) => boolean}> = [
      {
        cohort: 'contained',
        cohortLabel: 'Contained move',
        detail: 'Below 4% implied move before earnings',
        matches: (report) => report.impliedMove < 4
      },
      {
        cohort: 'expected',
        cohortLabel: 'Typical move',
        detail: '4% to under 8% implied move before earnings',
        matches: (report) => report.impliedMove >= 4 && report.impliedMove < 8
      },
      {
        cohort: 'elevated',
        cohortLabel: 'Elevated move',
        detail: '8% or higher implied move before earnings',
        matches: (report) => report.impliedMove >= 8
      }
    ];

    return cohorts
      .map((cohort) => {
        const reports = pastReports.filter(cohort.matches);
        const summary = reports.reduce((totals, report) => {
          const review = this.getSavedReportReview(report);

          if (this.isSavedReportReviewComplete(report)) {
            totals.completedCount += 1;
          }
          if (review.outcome !== 'unreviewed') {
            totals.recordedOutcomeCount += 1;
            if (review.outcome === 'positive') {
              totals.positiveCount += 1;
            }
            if (review.outcome === 'negative') {
              totals.negativeCount += 1;
            }
          }

          return totals;
        }, {
          completedCount: 0,
          negativeCount: 0,
          positiveCount: 0,
          recordedOutcomeCount: 0
        });
        const averageImpliedMove = reports.reduce((total, report) => total + report.impliedMove, 0) / (reports.length || 1);

        return {...cohort, ...summary, averageImpliedMove, reportCount: reports.length};
      })
      .filter((summary) => summary.reportCount > 0);
  }

  getSavedReportRoleReviewSummaries(): SavedReportRoleReviewSummary[] {
    const pastReports = this.getPostEarningsReviewItems().map((item) => item.report);
    const roleOrder = this.savedReportRoles.map((role) => role.key);

    return this.savedReportRoles
      .filter((role): role is {key: Exclude<SavedReportRole, 'unassigned'>; label: string; detail: string} => (
        role.key !== 'unassigned'
      ))
      .map((role) => {
        const reports = pastReports.filter((report) => this.getSavedReportRole(report) === role.key);
        const summary = reports.reduce((totals, report) => {
          const review = this.getSavedReportReview(report);

          if (this.isSavedReportReviewComplete(report)) {
            totals.completedCount += 1;
          }
          if (review.lesson.trim().length > 0) {
            totals.lessonCount += 1;
          }
          if (review.outcome !== 'unreviewed') {
            totals.recordedOutcomeCount += 1;
            if (review.outcome === 'positive') {
              totals.positiveCount += 1;
            }
            if (review.outcome === 'negative') {
              totals.negativeCount += 1;
            }
          }

          return totals;
        }, {
          completedCount: 0,
          lessonCount: 0,
          negativeCount: 0,
          positiveCount: 0,
          recordedOutcomeCount: 0,
        });

        return {
          ...summary,
          reportCount: reports.length,
          role: role.key,
          roleLabel: role.label,
        };
      })
      .filter((summary) => summary.reportCount > 0)
      .sort((first, second) => (
        roleOrder.indexOf(first.role) - roleOrder.indexOf(second.role) ||
        second.reportCount - first.reportCount
      ));
  }

  getSavedReportConvictionReviewSummaries(): SavedReportConvictionReviewSummary[] {
    const pastReports = this.getPostEarningsReviewItems().map((item) => item.report);
    const convictionOrder = this.savedReportConvictions.map((conviction) => conviction.key);

    return this.savedReportConvictions
      .filter((conviction): conviction is {key: Exclude<SavedReportConviction, 'unassigned'>; label: string; detail: string} => (
        conviction.key !== 'unassigned'
      ))
      .map((conviction) => {
        const reports = pastReports.filter((report) => this.getSavedReportConviction(report) === conviction.key);
        const summary = reports.reduce((totals, report) => {
          const review = this.getSavedReportReview(report);

          if (this.isSavedReportReviewComplete(report)) {
            totals.completedCount += 1;
          }
          if (review.lesson.trim().length > 0) {
            totals.lessonCount += 1;
          }
          if (review.outcome !== 'unreviewed') {
            totals.recordedOutcomeCount += 1;
            if (review.outcome === 'positive') {
              totals.positiveCount += 1;
            }
            if (review.outcome === 'negative') {
              totals.negativeCount += 1;
            }
          }

          return totals;
        }, {
          completedCount: 0,
          lessonCount: 0,
          negativeCount: 0,
          positiveCount: 0,
          recordedOutcomeCount: 0,
        });

        return {
          ...summary,
          conviction: conviction.key,
          convictionLabel: conviction.label,
          reportCount: reports.length,
        };
      })
      .filter((summary) => summary.reportCount > 0)
      .sort((first, second) => (
        convictionOrder.indexOf(second.conviction) - convictionOrder.indexOf(first.conviction) ||
        second.reportCount - first.reportCount
      ));
  }

  isSavedReportReviewDue(report: SavedReport, now: Date = new Date()): boolean {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysUntil = this.getSavedReportDaysUntil(report.reportDate, startOfToday);
    return daysUntil !== null && daysUntil < 0;
  }

  formatSavedReportCountdown(daysUntil: number | null): string {
    if (daysUntil === null) {
      return 'Check report date';
    }

    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)} day${daysUntil === -1 ? '' : 's'} overdue`;
    }

    if (daysUntil === 0) {
      return 'Reports today';
    }

    if (daysUntil === 1) {
      return 'Tomorrow';
    }

    return `${daysUntil} days away`;
  }

  private getSavedReportDaysUntil(reportDate: string, startOfToday: Date): number | null {
    const parsedDate = new Date(`${reportDate}T12:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    const startOfReportDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    return Math.round((startOfReportDate.getTime() - startOfToday.getTime()) / 86400000);
  }

  getSavedReportStatus(report: SavedReport): SavedReportStatus {
    return this.normalizeSavedReportStatus(report.status);
  }

  getSavedReportStatusCount(status: SavedReportStatus): number {
    return this.savedReports.filter((report) => this.getSavedReportStatus(report) === status).length;
  }

  getSavedReportStrategy(report: SavedReport): SavedReportStrategy {
    return this.normalizeSavedReportStrategy(report.strategy);
  }

  getSavedReportEventTiming(report: SavedReport): SavedReportEventTiming {
    return this.normalizeSavedReportEventTiming(report.eventTiming);
  }

  getSavedReportEventTimingLabel(timing: SavedReportEventTiming): string {
    return this.savedReportEventTimings.find((item) => item.key === timing)?.label || 'Confirm timing';
  }

  getSavedReportEventTimingDetail(timing: SavedReportEventTiming): string {
    return this.savedReportEventTimings.find((item) => item.key === timing)?.detail || 'Report session has not been recorded.';
  }

  setSavedReportEventTiming(report: SavedReport, timing: SavedReportEventTiming): void {
    const normalizedTiming = this.normalizeSavedReportEventTiming(timing);

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, eventTiming: normalizedTiming}
        : savedReport
    ));
    this.savedReportMessage = normalizedTiming === 'unconfirmed'
      ? `${report.ticker} report session needs confirmation.`
      : `${report.ticker} report timing set to ${this.getSavedReportEventTimingLabel(normalizedTiming).toLowerCase()}.`;
    this.persistSavedReports();
  }

  getSavedReportStrategyCount(strategy: SavedReportStrategy): number {
    return this.savedReports.filter((report) => this.getSavedReportStrategy(report) === strategy).length;
  }

  setSavedReportFilter(filter: SavedReportFilter): void {
    this.savedReportFilter = filter;
  }

  setSavedReportStrategyFilter(filter: SavedReportStrategyFilter): void {
    this.savedReportStrategyFilter = filter;
  }

  getSavedReportRole(report: SavedReport): SavedReportRole {
    return this.normalizeSavedReportRole(report.role);
  }

  getSavedReportRoleCount(role: SavedReportRole): number {
    return this.savedReports.filter((report) => this.getSavedReportRole(report) === role).length;
  }

  setSavedReportRoleFilter(filter: SavedReportRoleFilter): void {
    this.savedReportRoleFilter = filter;
  }

  getSavedReportConviction(report: SavedReport): SavedReportConviction {
    return this.normalizeSavedReportConviction(report.conviction);
  }

  getSavedReportConvictionCount(conviction: SavedReportConviction): number {
    return this.savedReports.filter((report) => this.getSavedReportConviction(report) === conviction).length;
  }

  getSavedReportConvictionLabel(conviction: SavedReportConviction): string {
    return this.savedReportConvictions.find((item) => item.key === conviction)?.label || 'Needs conviction';
  }

  setSavedReportConvictionFilter(filter: SavedReportConvictionFilter): void {
    this.savedReportConvictionFilter = filter;
  }

  focusSavedReportRoleConviction(role: SavedReportRole, conviction: SavedReportConviction): void {
    this.savedReportFilter = 'all';
    this.savedReportStrategyFilter = 'all';
    this.savedReportRoleFilter = role;
    this.savedReportConvictionFilter = conviction;
    this.savedReportDecisionFilter = 'all';
    this.savedReportResearchLaneFilter = 'all';
    this.savedReportSearchText = '';
    this.savedReportMessage = `${this.getSavedReportRoleLabel(role)} / ${this.getSavedReportConvictionLabel(conviction)} is now in view.`;
  }

  setSavedReportDecisionFilter(filter: SavedReportDecisionFilter): void {
    this.savedReportDecisionFilter = filter;
  }

  setSavedReportResearchLaneFilter(filter: SavedReportResearchLane): void {
    this.savedReportResearchLaneFilter = filter;
  }

  getSavedReportResearchLaneCount(lane: Exclude<SavedReportResearchLane, 'all'>): number {
    return this.savedReports.filter((report) => this.getSavedReportResearchLane(report) === lane).length;
  }

  getSavedReportResearchLane(report: SavedReport): Exclude<SavedReportResearchLane, 'all'> {
    const status = this.getSavedReportStatus(report);

    if (status === 'skip') {
      return 'skipped';
    }

    const hasFoundation = this.getSavedReportStrategy(report) !== 'unassigned' &&
      this.getSavedReportRole(report) !== 'unassigned' &&
      this.getSavedReportConviction(report) !== 'unassigned';
    const hasPreflight = this.getSavedReportPreparationCount(report) === this.savedReportPreparationSteps.length &&
      (this.getSavedReportStrategy(report) !== 'preEvent' || this.getSavedReportRiskAllocation(report) > 0);
    const hasJournal = this.getSavedReportJournalCount(report) === 3;

    if (!hasFoundation) {
      return 'needsFoundation';
    }

    if (!hasPreflight) {
      return 'needsPreflight';
    }

    if (!hasJournal) {
      return 'needsJournal';
    }

    return status === 'ready' ? 'executionReady' : 'readyToStage';
  }

  getSavedReportDecisionFilterCount(filter: SavedReportDecisionFilter): number {
    return this.savedReports.filter((report) => this.matchesSavedReportDecisionFilter(report, filter)).length;
  }

  getSavedReportDecisionGapCount(): number {
    return this.savedReports.filter((report) => (
      this.matchesSavedReportDecisionFilter(report, 'needsStrategy') ||
      this.matchesSavedReportDecisionFilter(report, 'needsRole') ||
      this.matchesSavedReportDecisionFilter(report, 'needsConviction') ||
      this.matchesSavedReportDecisionFilter(report, 'needsPreEventRisk')
    )).length;
  }

  private matchesSavedReportDecisionFilter(report: SavedReport, filter: SavedReportDecisionFilter): boolean {
    switch (filter) {
      case 'needsStrategy':
        return this.getSavedReportStrategy(report) === 'unassigned';
      case 'needsRole':
        return this.getSavedReportRole(report) === 'unassigned';
      case 'needsConviction':
        return this.getSavedReportConviction(report) === 'unassigned';
      case 'needsPreEventRisk':
        return this.getSavedReportStrategy(report) === 'preEvent' && this.getSavedReportRiskAllocation(report) === 0;
      default:
        return true;
    }
  }

  private matchesSavedReportResearchLane(report: SavedReport, filter: SavedReportResearchLane): boolean {
    return filter === 'all' || this.getSavedReportResearchLane(report) === filter;
  }

  setSavedReportConviction(report: SavedReport, conviction: SavedReportConviction): void {
    const normalizedConviction = this.normalizeSavedReportConviction(conviction);

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, conviction: normalizedConviction}
        : savedReport
    ));
    this.savedReportMessage = `${report.ticker} conviction set to ${this.getSavedReportConvictionLabel(normalizedConviction)}.`;
    this.persistSavedReports();
  }

  setSavedReportRole(report: SavedReport, role: SavedReportRole): void {
    const normalizedRole = this.normalizeSavedReportRole(role);

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, role: normalizedRole}
        : savedReport
    ));
    this.savedReportMessage = `${report.ticker} assigned to ${this.getSavedReportRoleLabel(normalizedRole)}.`;
    this.persistSavedReports();
  }

  getSavedReportRiskAllocation(report: SavedReport): number {
    return this.normalizeSavedReportRiskAllocation(report.plannedRiskPercent);
  }

  applySavedReportPlaybook(report: SavedReport, playbookKey: string): void {
    const playbook = this.savedReportPlaybooks.find((item) => item.key === playbookKey);

    if (!playbook) {
      return;
    }

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {
          ...savedReport,
          status: playbook.status,
          strategy: playbook.strategy,
          role: playbook.role,
          conviction: playbook.conviction,
          plannedRiskPercent: playbook.plannedRiskPercent
        }
        : savedReport
    ));
    this.savedReportMessage = `${report.ticker} initialized with the ${playbook.label.toLowerCase()} playbook. Checklist, journal, and review notes were kept.`;
    this.persistSavedReports();
  }

  setSavedReportRiskAllocation(report: SavedReport, plannedRiskPercent: number): void {
    const normalizedAllocation = this.normalizeSavedReportRiskAllocation(plannedRiskPercent);

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, plannedRiskPercent: normalizedAllocation}
        : savedReport
    ));
    this.savedReportMessage = normalizedAllocation === 0
      ? `${report.ticker} removed from the event exposure plan.`
      : `${report.ticker} assigned ${normalizedAllocation}% of the per-report risk budget.`;
    this.persistSavedReports();
  }

  getSavedReportRoleLabel(role: SavedReportRole): string {
    return this.savedReportRoles.find((item) => item.key === role)?.label || 'Needs role';
  }

  clearSavedReportSearch(): void {
    this.savedReportSearchText = '';
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

  setSavedReportStrategy(report: SavedReport, strategy: SavedReportStrategy): void {
    const normalizedStrategy = this.normalizeSavedReportStrategy(strategy);

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, strategy: normalizedStrategy}
        : savedReport
    ));
    this.savedReportMessage = `${report.ticker} approach set to ${this.getSavedReportStrategyLabel(normalizedStrategy)}.`;
    this.persistSavedReports();
  }

  getSavedReportStrategyLabel(strategy: SavedReportStrategy): string {
    return this.savedReportStrategies.find((item) => item.key === strategy)?.label || 'Needs decision';
  }

  isSavedReportPreparationComplete(report: SavedReport, key: SavedReportPreparationKey): boolean {
    return this.normalizeSavedReportPreparation(report.preparation)[key];
  }

  toggleSavedReportPreparation(report: SavedReport, key: SavedReportPreparationKey): void {
    const preparation = this.normalizeSavedReportPreparation(report.preparation);
    preparation[key] = !preparation[key];

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, preparation}
        : savedReport
    ));

    const completedCount = this.getSavedReportPreparationCount({...report, preparation});
    this.savedReportMessage = `${report.ticker} preparation is ${completedCount} of ${this.savedReportPreparationSteps.length} complete.`;
    this.persistSavedReports();
  }

  getSavedReportPreparationCount(report: SavedReport): number {
    const preparation = this.normalizeSavedReportPreparation(report.preparation);
    return this.savedReportPreparationSteps.filter((step) => preparation[step.key]).length;
  }

  getSavedReportPreparationPercent(report: SavedReport): number {
    return Math.round((this.getSavedReportPreparationCount(report) / this.savedReportPreparationSteps.length) * 100);
  }

  getSavedReportJournal(report: SavedReport): SavedReportJournal {
    return this.normalizeSavedReportJournal(report.journal);
  }

  getSavedReportJournalCount(report: SavedReport): number {
    const journal = this.getSavedReportJournal(report);
    return Object.values(journal).filter((entry) => entry.trim().length > 0).length;
  }

  updateSavedReportJournal(report: SavedReport, key: SavedReportJournalKey, value: string): void {
    const journal = this.getSavedReportJournal(report);
    journal[key] = this.normalizeSavedReportJournalText(value);

    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, journal}
        : savedReport
    ));
    this.persistSavedReports();
  }

  getSavedReportReview(report: SavedReport): SavedReportReview {
    return this.normalizeSavedReportReview(report.review);
  }

  getSavedReportReviewLabel(outcome: SavedReportReviewOutcome | null): string {
    if (outcome === null) {
      return 'No outcome yet';
    }

    return this.savedReportReviewOutcomes.find((item) => item.key === outcome)?.label || 'Not reviewed';
  }

  isSavedReportReviewComplete(report: SavedReport): boolean {
    const review = this.getSavedReportReview(report);
    return review.outcome !== 'unreviewed' && review.reaction.trim().length > 0 && review.lesson.trim().length > 0;
  }

  setSavedReportReviewOutcome(report: SavedReport, outcome: SavedReportReviewOutcome): void {
    const review = this.getSavedReportReview(report);
    review.outcome = this.normalizeSavedReportReviewOutcome(outcome);

    this.updateSavedReportReview(report, review);
    this.savedReportMessage = `${report.ticker} post-earnings outcome set to ${this.getSavedReportReviewLabel(review.outcome)}.`;
  }

  updateSavedReportReviewNote(report: SavedReport, key: SavedReportReviewKey, value: string): void {
    const review = this.getSavedReportReview(report);
    review[key] = this.normalizeSavedReportJournalText(value);
    if (key === 'followUp') {
      review.followUpComplete = false;
    }
    this.updateSavedReportReview(report, review);
  }

  isSavedReportFollowUpComplete(report: SavedReport): boolean {
    return this.getSavedReportReview(report).followUpComplete;
  }

  setSavedReportFollowUpComplete(report: SavedReport, isComplete: boolean): void {
    const review = this.getSavedReportReview(report);

    if (review.followUp.trim().length === 0) {
      this.savedReportMessage = `Add a follow-through action for ${report.ticker} before marking it complete.`;
      return;
    }

    review.followUpComplete = isComplete;
    this.updateSavedReportReview(report, review);
    this.savedReportMessage = isComplete
      ? `${report.ticker} follow-through marked complete.`
      : `${report.ticker} follow-through reopened.`;
  }

  private updateSavedReportReview(report: SavedReport, review: SavedReportReview): void {
    this.savedReports = this.savedReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, review}
        : savedReport
    ));
    this.persistSavedReports();
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
      return this.matchesBaseFilters(stock, normalizedSearch) &&
        this.matchesCatalystProfile(stock) &&
        this.matchesEarningsQualityProfile(stock);
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
    this.earningsQualityProfile = 'all';
    this.marketCapCohort = 'all';
    this.earningsSignalLens = 'balanced';
    this.sortField = 'marketCap';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  setCatalystProfile(profile: CatalystProfile): void {
    this.catalystProfile = this.catalystProfile === profile ? 'all' : profile;
    this.applyFilters();
  }

  setEarningsQualityProfile(profile: Exclude<EarningsQualityProfile, 'all'>): void {
    this.earningsQualityProfile = this.earningsQualityProfile === profile ? 'all' : profile;
    this.applyFilters();
  }

  setMarketCapCohort(cohort: Exclude<MarketCapCohort, 'all'>): void {
    this.marketCapCohort = this.marketCapCohort === cohort ? 'all' : cohort;
    this.minimumMarketCap = 0;
    this.applyFilters();
  }

  setEarningsSignalLens(lens: EarningsSignalLens): void {
    this.earningsSignalLens = lens;
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

  getEarningsQualityBuckets(): EarningsQualityBucket[] {
    const normalizedSearch = this.searchText.trim().toLowerCase();
    const candidates = this.stockInfoObjects.filter((stock) => (
      this.matchesBaseFilters(stock, normalizedSearch) && this.matchesCatalystProfile(stock)
    ));
    const definitions: Array<Pick<EarningsQualityBucket, 'key' | 'label' | 'detail'>> = [
      {key: 'durable', label: 'Durable Growth', detail: 'Positive EPS, 10%+ growth, under 8% move'},
      {key: 'expectationsHigh', label: 'High Expectations', detail: 'Positive EPS, 10%+ growth, 8%+ move'},
      {key: 'turnaround', label: 'Turnaround', detail: '10%+ growth with breakeven or loss EPS'},
      {key: 'fundamentalPressure', label: 'Fundamental Pressure', detail: 'Negative growth or loss estimate'},
      {key: 'mixed', label: 'Mixed Setup', detail: 'Does not fit another quality profile'}
    ];

    return definitions.map((definition) => {
      const stocks = candidates.filter((stock) => this.getEarningsQualityProfile(stock) === definition.key);
      const averageQuarterlyGrowth = stocks.length
        ? stocks.reduce((total, stock) => total + this.getPercentageValue(stock, 'Quarterly Growth'), 0) / stocks.length
        : 0;
      const averageImpliedMove = stocks.length
        ? stocks.reduce((total, stock) => total + this.getPercentageValue(stock, 'Implied Move'), 0) / stocks.length
        : 0;
      const leader = stocks.length
        ? stocks.reduce((currentLeader, stock) => (
          this.getPercentageValue(stock, 'Quarterly Growth') > this.getPercentageValue(currentLeader, 'Quarterly Growth')
            ? stock
            : currentLeader
        ), stocks[0])
        : null;

      return {...definition, count: stocks.length, averageQuarterlyGrowth, averageImpliedMove, leader};
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

  getEarningsSignalBoard(): EarningsSignalItem[] {
    return this.filteredStockInfoObjects
      .map((stock) => {
        const growth = this.getPercentageValue(stock, 'Quarterly Growth');
        const impliedMove = this.getPercentageValue(stock, 'Implied Move');
        const shortInterest = this.getPercentageValue(stock, 'Short Interest');
        const daysToCover = this.getNumberValue(stock, 'Days To Cover');
        const estimate = this.getEstimateValue(stock);
        const growthScore = this.clampSignalScore(((growth + 10) / 50) * 100);
        const estimateScore = estimate > 0.1 ? 100 : estimate >= -0.1 ? 50 : 0;
        const moveScore = this.clampSignalScore((impliedMove / 15) * 100);
        const shortScore = this.clampSignalScore((shortInterest / 20) * 100);
        const coverScore = this.clampSignalScore((daysToCover / 10) * 100);
        let score: number;

        if (this.earningsSignalLens === 'fundamental') {
          score = (growthScore * 0.55) + (estimateScore * 0.3) + (moveScore * 0.1) + (shortScore * 0.05);
        } else if (this.earningsSignalLens === 'squeeze') {
          score = (shortScore * 0.35) + (coverScore * 0.3) + (moveScore * 0.25) + (growthScore * 0.1);
        } else {
          score = (growthScore * 0.3) + (estimateScore * 0.25) + (moveScore * 0.25) + (shortScore * 0.1) + (coverScore * 0.1);
        }

        return {stock, score: Math.round(score), growth, estimate, impliedMove, shortInterest, daysToCover} as EarningsSignalItem;
      })
      .sort((first, second) => (
        second.score - first.score ||
        second.growth - first.growth ||
        first.stock.Ticker.localeCompare(second.stock.Ticker)
      ))
      .slice(0, 8);
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

  private clampSignalScore(value: number): number {
    return Math.min(100, Math.max(0, value));
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

  private getEarningsQualityProfile(stock: StockInfo): Exclude<EarningsQualityProfile, 'all'> {
    const estimate = this.getEstimateValue(stock);
    const quarterlyGrowth = this.getPercentageValue(stock, 'Quarterly Growth');
    const impliedMove = this.getPercentageValue(stock, 'Implied Move');

    if (estimate > 0.1 && quarterlyGrowth >= 10 && impliedMove >= 8) {
      return 'expectationsHigh';
    }

    if (estimate > 0.1 && quarterlyGrowth >= 10) {
      return 'durable';
    }

    if (quarterlyGrowth >= 10 && estimate <= 0.1) {
      return 'turnaround';
    }

    if (quarterlyGrowth < 0 || estimate < -0.1) {
      return 'fundamentalPressure';
    }

    return 'mixed';
  }

  private matchesEarningsQualityProfile(stock: StockInfo): boolean {
    return this.earningsQualityProfile === 'all' ||
      this.getEarningsQualityProfile(stock) === this.earningsQualityProfile;
  }

  private loadSavedReports(): SavedReport[] {
    try {
      const storedReports = JSON.parse(localStorage.getItem(this.savedReportStorageKey) || '[]');
      return this.normalizeSavedReports(storedReports);
    } catch (error) {
      return [];
    }
  }

  private normalizeSavedReports(reports: unknown): SavedReport[] {
    if (!Array.isArray(reports)) {
      return [];
    }

    return reports
      .filter((report): report is Partial<SavedReport> => (
        Boolean(report) && typeof report === 'object' &&
        typeof (report as SavedReport).ticker === 'string' &&
        typeof (report as SavedReport).reportDate === 'string'
      ))
      .map((report) => ({
        ...report,
        ticker: report.ticker!.trim().toUpperCase(),
        reportDate: report.reportDate!.trim(),
        eventTiming: this.normalizeSavedReportEventTiming(report.eventTiming),
        status: this.normalizeSavedReportStatus(report.status),
        strategy: this.normalizeSavedReportStrategy(report.strategy),
        role: this.normalizeSavedReportRole(report.role),
        conviction: this.normalizeSavedReportConviction(report.conviction),
        plannedRiskPercent: this.normalizeSavedReportRiskAllocation(report.plannedRiskPercent),
        preparation: this.normalizeSavedReportPreparation(report.preparation),
        journal: this.normalizeSavedReportJournal(report.journal),
        review: this.normalizeSavedReportReview(report.review)
      }))
      .filter((report) => report.ticker.length > 0 && report.reportDate.length > 0)
      .slice(0, 20) as SavedReport[];
  }

  private normalizeSavedReportStatus(status: unknown): SavedReportStatus {
    return status === 'watching' || status === 'ready' || status === 'skip' ? status : 'research';
  }

  private normalizeSavedReportStrategy(strategy: unknown): SavedReportStrategy {
    return strategy === 'preEvent' || strategy === 'postEvent' || strategy === 'avoidEvent' || strategy === 'longTerm'
      ? strategy
      : 'unassigned';
  }

  private normalizeSavedReportEventTiming(timing: unknown): SavedReportEventTiming {
    return timing === 'beforeOpen' || timing === 'afterClose' || timing === 'duringMarket'
      ? timing
      : 'unconfirmed';
  }

  private normalizeSavedReportRole(role: unknown): SavedReportRole {
    return role === 'primary' || role === 'satellite' || role === 'hedge' || role === 'monitor'
      ? role
      : 'unassigned';
  }

  private normalizeSavedReportConviction(conviction: unknown): SavedReportConviction {
    return conviction === 'exploratory' || conviction === 'standard' || conviction === 'high'
      ? conviction
      : 'unassigned';
  }

  private normalizeSavedReportRiskAllocation(value: unknown): number {
    const allocation = Number(value);
    return this.savedReportRiskAllocations.some((item) => item.percent === allocation) ? allocation : 0;
  }

  private normalizeSavedReportPreparation(preparation?: Partial<SavedReportPreparation>): SavedReportPreparation {
    return {
      estimateReviewed: preparation?.estimateReviewed === true,
      riskPlanned: preparation?.riskPlanned === true,
      timingConfirmed: preparation?.timingConfirmed === true
    };
  }

  private normalizeSavedReportJournal(journal?: Partial<SavedReportJournal>): SavedReportJournal {
    return {
      thesis: this.normalizeSavedReportJournalText(journal?.thesis),
      risk: this.normalizeSavedReportJournalText(journal?.risk),
      decision: this.normalizeSavedReportJournalText(journal?.decision)
    };
  }

  private normalizeSavedReportReview(review?: Partial<SavedReportReview>): SavedReportReview {
    return {
      followUp: this.normalizeSavedReportJournalText(review?.followUp),
      followUpComplete: review?.followUpComplete === true,
      outcome: this.normalizeSavedReportReviewOutcome(review?.outcome),
      reaction: this.normalizeSavedReportJournalText(review?.reaction),
      lesson: this.normalizeSavedReportJournalText(review?.lesson)
    };
  }

  private normalizeSavedReportReviewOutcome(outcome: unknown): SavedReportReviewOutcome {
    return outcome === 'positive' || outcome === 'negative' || outcome === 'mixed' || outcome === 'flat'
      ? outcome
      : 'unreviewed';
  }

  private normalizeSavedReportJournalText(value: unknown): string {
    return typeof value === 'string' ? value.slice(0, 280) : '';
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
