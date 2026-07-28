import {Component, HostListener, OnInit} from '@angular/core';
import {GetCalenderService} from '../../services/get-calender.service'
import {CalenderData} from "./calender-item.interface";

interface CalendarCatalyst {
  date: string;
  item: CalenderData;
  score: number;
}

interface CalendarOverview {
  reportDateCount: number;
  companyCount: number;
  avgImpliedMove: number;
  highMoveCount: number;
  crowdedShortCount: number;
  busiestDate: string;
  busiestDateCount: number;
  largestMarketCapItem: CalenderData | null;
}

interface CalendarWeekSummary {
  key: string;
  startDate: string;
  endDate: string;
  reportDateCount: number;
  companyCount: number;
  avgImpliedMove: number;
  highRiskCount: number;
  leader: CalendarCatalyst | null;
}

type SavedReportStatus = 'research' | 'watching' | 'ready' | 'skip';
type SavedReportFilter = 'all' | SavedReportStatus;

interface SavedCalendarReport {
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
  selector: 'app-calender-item',
  templateUrl: './calender-item.component.html',
  styleUrls: ['./calender-item.component.css'],
})
export class CalenderItemComponent implements OnInit {

  calenderData: { [key: string]: CalenderData[] } = {};
  filteredCalenderData: { [key: string]: CalenderData[] } = {};
  calendarSearchText = '';
  minimumCalendarImpliedMove = 0;
  minimumCalendarShortInterest = 0;
  minimumCalendarMarketCap = 0;
  calendarRiskProfile = 'any';
  calendarHorizonDays = 30;
  selectedCalendarWeek = 'all';
  calendarExportMessage = '';
  calendarShareMessage = '';
  savedCalendarReports: SavedCalendarReport[] = [];
  savedCalendarReportFilter: SavedReportFilter = 'all';
  savedCalendarReportMessage = '';
  readonly savedCalendarWorkflowStages: Array<{key: SavedReportStatus; label: string; detail: string}> = [
    {key: 'research', label: 'Research', detail: 'Needs a first review'},
    {key: 'watching', label: 'Watching', detail: 'Catalyst is on deck'},
    {key: 'ready', label: 'Ready', detail: 'Plan is prepared'},
    {key: 'skip', label: 'Skip', detail: 'No action planned'}
  ];
  private readonly savedReportStorageKey = 'earnings-site-saved-reports';

  slideConfig = {
    infinite: false,
    arrows: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: true,
    lazyLoad: 'progressive',
  }

  constructor(private calenderService: GetCalenderService) {}

  ngOnInit(): void {
    this.savedCalendarReports = this.loadSavedCalendarReports();
    this.restoreCalendarView();

    // @ts-ignore
    this.calenderService.getCalenderData().subscribe((data: string) => {
      const parsedData = JSON.parse(data) as CalenderData[];
      this.calenderData = this.groupDataByReportDate(parsedData);
      this.applyCalendarFilters();
    });
  }

  getDates(data: { [key: string]: CalenderData[] }): string[] {

    const allDates = Object.keys(data);
    const today = new Date();
    today.setDate(today.getDate() - 1)// Making this yesterday today was being filtered out

    const filteredDates = allDates.filter(dateString => {
        const date = new Date(dateString);
        return date >= today;
    });

    filteredDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return filteredDates;
  }

  applyCalendarFilters(): void {
    const normalizedSearch = this.calendarSearchText.trim().toLowerCase();
    const filteredData: { [key: string]: CalenderData[] } = {};

    Object.entries(this.calenderData).forEach(([date, items]) => {
      if (!this.isDateInCalendarHorizon(date)) {
        return;
      }

      if (this.selectedCalendarWeek !== 'all' && this.getCalendarWeekKey(date) !== this.selectedCalendarWeek) {
        return;
      }

      const filteredItems = items.filter((item) => this.matchesCalendarFilters(item, normalizedSearch))
        .sort((firstItem, secondItem) => {
        const moveDifference = secondItem.Implied_Move - firstItem.Implied_Move;

        if (moveDifference !== 0) {
          return moveDifference;
        }

        return secondItem.Market_Cap - firstItem.Market_Cap;
      });

      if (filteredItems.length > 0) {
        filteredData[date] = filteredItems;
      }
    });

    this.filteredCalenderData = filteredData;
  }

  clearCalendarFilters(): void {
    this.calendarSearchText = '';
    this.minimumCalendarImpliedMove = 0;
    this.minimumCalendarShortInterest = 0;
    this.minimumCalendarMarketCap = 0;
    this.calendarRiskProfile = 'any';
    this.calendarHorizonDays = 30;
    this.selectedCalendarWeek = 'all';
    this.calendarShareMessage = '';
    window.history.replaceState({}, '', window.location.pathname);
    this.applyCalendarFilters();
  }

  shareCalendarView(): void {
    const sharedUrl = new URL(window.location.href);

    sharedUrl.search = '';
    this.setCalendarQueryParam(sharedUrl, 'q', this.calendarSearchText.trim());
    this.setCalendarQueryParam(sharedUrl, 'move', this.minimumCalendarImpliedMove, 0);
    this.setCalendarQueryParam(sharedUrl, 'short', this.minimumCalendarShortInterest, 0);
    this.setCalendarQueryParam(sharedUrl, 'cap', this.minimumCalendarMarketCap, 0);
    this.setCalendarQueryParam(sharedUrl, 'profile', this.calendarRiskProfile, 'any');
    this.setCalendarQueryParam(sharedUrl, 'window', this.calendarHorizonDays, 30);
    this.setCalendarQueryParam(sharedUrl, 'week', this.selectedCalendarWeek, 'all');
    window.history.replaceState({}, '', `${sharedUrl.pathname}${sharedUrl.search}${sharedUrl.hash}`);

    if (!navigator.clipboard) {
      this.calendarShareMessage = 'Shared scanner link is ready in the address bar.';
      return;
    }

    navigator.clipboard.writeText(sharedUrl.toString())
      .then(() => {
        this.calendarShareMessage = 'Shared scanner link copied to the clipboard.';
      })
      .catch(() => {
        this.calendarShareMessage = 'Shared scanner link is ready in the address bar.';
      });
  }

  exportFilteredCalendar(): void {
    const reportEntries = Object.entries(this.filteredCalenderData)
      .flatMap(([date, items]) => items.map((item) => ({date, item})));

    if (reportEntries.length === 0) {
      this.calendarExportMessage = 'No matching earnings reports to export.';
      return;
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const events = reportEntries.flatMap(({date, item}) => {
      const reportDate = date.replace(/\D/g, '').slice(0, 8);
      const nextDate = this.getNextCalendarDate(date);
      const description = [
        item.Name,
        `EPS estimate: ${Number(item.Estimate).toFixed(2)}`,
        `Implied move: ${this.formatPercentValue(item.Implied_Move)}`,
        `Short interest: ${this.formatPercentValue(item.Short_Interest)}`
      ].join('\n');
      const detailUrl = `${window.location.origin}/${this.formatDateRoute(date)}/${encodeURIComponent(item.Ticker)}`;

      return [
        'BEGIN:VEVENT',
        `UID:${this.escapeCalendarText(`${item.Ticker}-${reportDate}@earnings-site`)}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${reportDate}`,
        `DTEND;VALUE=DATE:${nextDate}`,
        `SUMMARY:${this.escapeCalendarText(`${item.Ticker} earnings report`)}`,
        `DESCRIPTION:${this.escapeCalendarText(description)}`,
        `URL:${detailUrl}`,
        'END:VEVENT'
      ];
    });
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Earnings Site//Filtered Earnings Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([calendar], {type: 'text/calendar;charset=utf-8'});
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `earnings-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    this.calendarExportMessage = `${reportEntries.length} matching report${reportEntries.length === 1 ? '' : 's'} exported to your calendar.`;
  }

  getVisibleCompanyCount(): number {
    return Object.values(this.filteredCalenderData)
      .reduce((total, items) => total + items.length, 0);
  }

  getCalendarOverview(): CalendarOverview {
    const entries = Object.entries(this.filteredCalenderData);
    const items = entries.flatMap(([, calendarItems]) => calendarItems);

    if (items.length === 0) {
      return {
        reportDateCount: 0,
        companyCount: 0,
        avgImpliedMove: 0,
        highMoveCount: 0,
        crowdedShortCount: 0,
        busiestDate: '',
        busiestDateCount: 0,
        largestMarketCapItem: null
      };
    }

    const busiestEntry = entries.reduce((currentBusiest, entry) => (
      entry[1].length > currentBusiest[1].length ? entry : currentBusiest
    ), entries[0]);
    const largestMarketCapItem = items.reduce((largestItem, item) => (
      this.getMarketCapInBillions(item.Market_Cap) > this.getMarketCapInBillions(largestItem.Market_Cap)
        ? item
        : largestItem
    ), items[0]);
    const totalImpliedMove = items.reduce((total, item) => total + this.getPercentValue(item.Implied_Move), 0);

    return {
      reportDateCount: entries.length,
      companyCount: items.length,
      avgImpliedMove: totalImpliedMove / items.length,
      highMoveCount: items.filter((item) => this.getPercentValue(item.Implied_Move) >= 8).length,
      crowdedShortCount: items.filter((item) => this.getPercentValue(item.Short_Interest) >= 15).length,
      busiestDate: busiestEntry[0],
      busiestDateCount: busiestEntry[1].length,
      largestMarketCapItem
    };
  }

  getCalendarWeekSummaries(): CalendarWeekSummary[] {
    const normalizedSearch = this.calendarSearchText.trim().toLowerCase();
    const weekEntries = new Map<string, Array<{date: string; item: CalenderData}>>();

    Object.entries(this.calenderData).forEach(([date, items]) => {
      if (!this.isDateInCalendarHorizon(date)) {
        return;
      }

      const matches = items.filter((item) => this.matchesCalendarFilters(item, normalizedSearch));

      if (matches.length === 0) {
        return;
      }

      const weekKey = this.getCalendarWeekKey(date);
      const existingEntries = weekEntries.get(weekKey) || [];
      weekEntries.set(weekKey, [
        ...existingEntries,
        ...matches.map((item) => ({date, item}))
      ]);
    });

    return [...weekEntries.entries()]
      .sort(([firstWeek], [secondWeek]) => firstWeek.localeCompare(secondWeek))
      .map(([weekKey, entries]) => {
        const reportDates = new Set(entries.map((entry) => entry.date));
        const totalImpliedMove = entries.reduce(
          (total, entry) => total + this.getPercentValue(entry.item.Implied_Move),
          0
        );
        const leader = entries.reduce<CalendarCatalyst | null>((currentLeader, entry) => {
          const candidate = {
            date: entry.date,
            item: entry.item,
            score: this.getCatalystScore(entry.item)
          };

          return !currentLeader || candidate.score > currentLeader.score ? candidate : currentLeader;
        }, null);

        return {
          key: weekKey,
          startDate: weekKey,
          endDate: this.offsetCalendarDate(weekKey, 6),
          reportDateCount: reportDates.size,
          companyCount: entries.length,
          avgImpliedMove: totalImpliedMove / entries.length,
          highRiskCount: entries.filter((entry) => (
            this.getPercentValue(entry.item.Implied_Move) >= 8 ||
            this.getPercentValue(entry.item.Short_Interest) >= 15
          )).length,
          leader
        };
      });
  }

  selectCalendarWeek(weekKey: string): void {
    this.selectedCalendarWeek = this.selectedCalendarWeek === weekKey ? 'all' : weekKey;
    this.applyCalendarFilters();
  }

  get visibleSavedCalendarReports(): SavedCalendarReport[] {
    return [...this.savedCalendarReports]
      .filter((report) => (
        this.savedCalendarReportFilter === 'all' ||
        this.getSavedCalendarReportStatus(report) === this.savedCalendarReportFilter
      ))
      .sort((firstReport, secondReport) => firstReport.reportDate.localeCompare(secondReport.reportDate));
  }

  setSavedCalendarReportFilter(filter: SavedReportFilter): void {
    this.savedCalendarReportFilter = filter;
  }

  getSavedCalendarReportStatus(report: SavedCalendarReport): SavedReportStatus {
    return this.normalizeSavedCalendarReportStatus(report.status);
  }

  getSavedCalendarReportStatusCount(status: SavedReportStatus): number {
    return this.savedCalendarReports
      .filter((report) => this.getSavedCalendarReportStatus(report) === status)
      .length;
  }

  setSavedCalendarReportStatus(report: SavedCalendarReport, status: SavedReportStatus): void {
    const normalizedStatus = this.normalizeSavedCalendarReportStatus(status);
    this.savedCalendarReports = this.savedCalendarReports.map((savedReport) => (
      savedReport.ticker === report.ticker && savedReport.reportDate === report.reportDate
        ? {...savedReport, status: normalizedStatus}
        : savedReport
    ));
    this.persistSavedCalendarReports();
    const statusLabel = this.savedCalendarWorkflowStages
      .find((stage) => stage.key === normalizedStatus)?.label || 'Research';
    this.savedCalendarReportMessage = `${report.ticker} moved to ${statusLabel}.`;
  }

  removeSavedCalendarReport(report: SavedCalendarReport): void {
    this.savedCalendarReports = this.savedCalendarReports.filter((savedReport) => (
      savedReport.ticker !== report.ticker || savedReport.reportDate !== report.reportDate
    ));
    this.persistSavedCalendarReports();
    this.savedCalendarReportMessage = `${report.ticker} removed from the saved earnings queue.`;
  }

  formatSavedCalendarReportDate(reportDate: string): string {
    const reportDateObject = this.parseSavedCalendarReportDate(reportDate);

    return reportDateObject
      ? new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
        .format(reportDateObject)
      : reportDate;
  }

  getSavedCalendarReportTiming(reportDate: string): string {
    const reportDateObject = this.parseSavedCalendarReportDate(reportDate);

    if (!reportDateObject) {
      return 'Date unavailable';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((reportDateObject.getTime() - today.getTime()) / 86400000);

    if (daysUntil === 0) {
      return 'Reports today';
    }

    if (daysUntil === 1) {
      return 'Reports tomorrow';
    }

    if (daysUntil > 1) {
      return `Reports in ${daysUntil} days`;
    }

    return `Reported ${Math.abs(daysUntil)} day${daysUntil === -1 ? '' : 's'} ago`;
  }

  getCalendarStats(date: string): { count: number; avgImpliedMove: number; maxShortInterest: number; totalMarketCap: number } {
    const items = this.filteredCalenderData[date] || [];

    if (items.length === 0) {
      return { count: 0, avgImpliedMove: 0, maxShortInterest: 0, totalMarketCap: 0 };
    }

    const totalImpliedMove = items.reduce((total, item) => total + this.getPercentValue(item.Implied_Move), 0);
    const maxShortInterest = items.reduce((maxValue, item) => Math.max(maxValue, this.getPercentValue(item.Short_Interest)), 0);
    const totalMarketCap = items.reduce((total, item) => total + this.getMarketCapInBillions(item.Market_Cap), 0);

    return {
      count: items.length,
      avgImpliedMove: totalImpliedMove / items.length,
      maxShortInterest,
      totalMarketCap
    };
  }

  getCatalystLeaders(): CalendarCatalyst[] {
    return Object.entries(this.filteredCalenderData)
      .flatMap(([date, items]) => items.map((item) => ({
        date,
        item,
        score: this.getCatalystScore(item)
      })))
      .sort((firstCatalyst, secondCatalyst) => secondCatalyst.score - firstCatalyst.score)
      .slice(0, 6);
  }

  getCatalystScore(item: CalenderData): number {
    const impliedMoveScore = this.getPercentValue(item.Implied_Move) * 2;
    const shortInterestScore = this.getPercentValue(item.Short_Interest);
    const marketCapScore = Math.min(this.getMarketCapInBillions(item.Market_Cap), 250) / 50;

    return impliedMoveScore + shortInterestScore + marketCapScore;
  }

  formatPercentValue(value: number): string {
    return `${this.getPercentValue(value).toFixed(1)}%`;
  }

  formatMarketCap(value: number): string {
    const marketCap = this.getMarketCapInBillions(value);

    if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(1)}T`;
    }

    return `$${marketCap.toFixed(marketCap >= 10 ? 0 : 1)}B`;
  }

  formatDateRoute(date: string): string {
    return date.replace(/-/g, '')
  }

  private getPercentValue(value: number): number {
    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
      return 0;
    }

    return parsedValue * 100;
  }

  private getMarketCapInBillions(value: number): number {
    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
      return 0;
    }

    return parsedValue / 1000000000;
  }

  private isDateInCalendarHorizon(dateString: string): boolean {
    const date = new Date(dateString);
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 1);

    if (date < startDate) {
      return false;
    }

    if (this.calendarHorizonDays === 0) {
      return true;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + this.calendarHorizonDays);

    return date <= endDate;
  }

  private matchesRiskProfile(item: CalenderData): boolean {
    const impliedMove = this.getPercentValue(item.Implied_Move);
    const shortInterest = this.getPercentValue(item.Short_Interest);
    const marketCap = this.getMarketCapInBillions(item.Market_Cap);
    const quarterlyGrowth = this.getPercentValue(item.Quarterly_Growth);

    if (this.calendarRiskProfile === 'highMove') {
      return impliedMove >= 8;
    }

    if (this.calendarRiskProfile === 'shortSqueeze') {
      return shortInterest >= 15;
    }

    if (this.calendarRiskProfile === 'megaCap') {
      return marketCap >= 100;
    }

    if (this.calendarRiskProfile === 'growthVolatility') {
      return quarterlyGrowth >= 10 && impliedMove >= 5;
    }

    return true;
  }

  private matchesCalendarFilters(item: CalenderData, normalizedSearch: string): boolean {
    const matchesSearch = normalizedSearch.length === 0 ||
      item.Ticker.toLowerCase().includes(normalizedSearch) ||
      item.Name.toLowerCase().includes(normalizedSearch);
    const impliedMove = this.getPercentValue(item.Implied_Move);
    const shortInterest = this.getPercentValue(item.Short_Interest);
    const marketCap = this.getMarketCapInBillions(item.Market_Cap);

    return matchesSearch &&
      impliedMove >= this.minimumCalendarImpliedMove &&
      shortInterest >= this.minimumCalendarShortInterest &&
      marketCap >= this.minimumCalendarMarketCap &&
      this.matchesRiskProfile(item);
  }

  private loadSavedCalendarReports(): SavedCalendarReport[] {
    try {
      const storedReports = JSON.parse(localStorage.getItem(this.savedReportStorageKey) || '[]');

      return Array.isArray(storedReports)
        ? storedReports
          .filter((report) => report && report.ticker && report.reportDate)
          .map((report) => ({
            ...report,
            status: this.normalizeSavedCalendarReportStatus(report.status)
          }))
          .slice(0, 20)
        : [];
    } catch (error) {
      return [];
    }
  }

  private normalizeSavedCalendarReportStatus(status: unknown): SavedReportStatus {
    return status === 'watching' || status === 'ready' || status === 'skip' ? status : 'research';
  }

  private persistSavedCalendarReports(): void {
    try {
      localStorage.setItem(this.savedReportStorageKey, JSON.stringify(this.savedCalendarReports));
    } catch (error) {
      this.savedCalendarReportMessage = 'Saved reports are unavailable in this browser.';
    }
  }

  private parseSavedCalendarReportDate(reportDate: string): Date | null {
    if (!/^\d{8}$/.test(reportDate)) {
      return null;
    }

    const year = Number(reportDate.slice(0, 4));
    const month = Number(reportDate.slice(4, 6));
    const day = Number(reportDate.slice(6, 8));
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getCalendarWeekKey(dateString: string): string {
    const [year, month, day] = dateString.split('-').map((part) => Number(part));
    const date = new Date(Date.UTC(year, month - 1, day));
    const daysSinceMonday = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - daysSinceMonday);

    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0')
    ].join('-');
  }

  private offsetCalendarDate(dateString: string, dayOffset: number): string {
    const [year, month, day] = dateString.split('-').map((part) => Number(part));
    const date = new Date(Date.UTC(year, month - 1, day + dayOffset));

    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0')
    ].join('-');
  }

  private getNextCalendarDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map((part) => Number(part));
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

    return [
      nextDate.getUTCFullYear(),
      String(nextDate.getUTCMonth() + 1).padStart(2, '0'),
      String(nextDate.getUTCDate()).padStart(2, '0')
    ].join('');
  }

  private escapeCalendarText(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  private restoreCalendarView(): void {
    const query = new URLSearchParams(window.location.search);
    const riskProfiles = ['any', 'highMove', 'shortSqueeze', 'megaCap', 'growthVolatility'];

    this.calendarSearchText = (query.get('q') || '').slice(0, 100);
    this.minimumCalendarImpliedMove = this.readCalendarNumberFilter(query, 'move', [0, 3, 5, 8, 10], 0);
    this.minimumCalendarShortInterest = this.readCalendarNumberFilter(query, 'short', [0, 5, 10, 15, 20], 0);
    this.minimumCalendarMarketCap = this.readCalendarNumberFilter(query, 'cap', [0, 1, 10, 50, 100], 0);
    this.calendarHorizonDays = this.readCalendarNumberFilter(query, 'window', [0, 7, 30, 90], 30);

    const requestedProfile = query.get('profile') || 'any';
    this.calendarRiskProfile = riskProfiles.includes(requestedProfile) ? requestedProfile : 'any';
    const requestedWeek = query.get('week') || 'all';
    this.selectedCalendarWeek = requestedWeek === 'all' || /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek)
      ? requestedWeek
      : 'all';

    if (query.toString()) {
      this.calendarShareMessage = 'Shared scanner settings restored from this link.';
    }
  }

  private readCalendarNumberFilter(
    query: URLSearchParams,
    key: string,
    allowedValues: number[],
    fallback: number
  ): number {
    const requestedValue = Number(query.get(key));

    return allowedValues.includes(requestedValue) ? requestedValue : fallback;
  }

  private setCalendarQueryParam(
    sharedUrl: URL,
    key: string,
    value: string | number,
    defaultValue: string | number = ''
  ): void {
    if (value !== defaultValue && value !== '') {
      sharedUrl.searchParams.set(key, String(value));
    }
  }

  private groupDataByReportDate(data: CalenderData[]): { [key: string]: CalenderData[] } {
    return data.reduce((groupedData, item) => {
      const reportDate = item.Report_Date;
      if (groupedData[reportDate]) {
        groupedData[reportDate].push(item);
      } else {
        groupedData[reportDate] = [item];
      }
      return groupedData;
    }, {} as { [key: string]: CalenderData[] });
  }


}
