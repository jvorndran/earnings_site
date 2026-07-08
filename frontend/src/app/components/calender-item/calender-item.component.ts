import {Component, HostListener, OnInit} from '@angular/core';
import {GetCalenderService} from '../../services/get-calender.service'
import {CalenderData} from "./calender-item.interface";

interface CalendarCatalyst {
  date: string;
  item: CalenderData;
  score: number;
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
    this.applyCalendarFilters();
  }

  getVisibleCompanyCount(): number {
    return Object.values(this.filteredCalenderData)
      .reduce((total, items) => total + items.length, 0);
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
