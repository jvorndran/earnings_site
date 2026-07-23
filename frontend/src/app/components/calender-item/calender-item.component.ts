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
  calendarExportMessage = '';

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

      const filteredItems = items.filter((item) => {
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
      }).sort((firstItem, secondItem) => {
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
    this.applyCalendarFilters();
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
