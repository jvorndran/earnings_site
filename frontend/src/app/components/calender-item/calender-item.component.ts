import {Component, HostListener, OnInit} from '@angular/core';
import {GetCalenderService} from '../../services/get-calender.service'
import {CalenderData} from "./calender-item.interface";

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
          marketCap >= this.minimumCalendarMarketCap;
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
