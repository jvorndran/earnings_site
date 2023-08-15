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

  cols: number = 6;
  breakpoints = {
    xl: 6,
    lg: 4,
    md: 3,
    sm: 2,
    xs: 1,
  };
  slideConfig = {
    infinite: false,
    arrows: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: true,
    lazyLoad: 'progressive',
  }

  constructor(private calenderService: GetCalenderService) {
  }

  ngOnInit(): void {

    this.setCols()

    // @ts-ignore
    this.calenderService.getCalenderData().subscribe((data: string) => {
      const parsedData = JSON.parse(data) as CalenderData[];
      this.calenderData = this.groupDataByReportDate(parsedData);
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

  setCols() {
    const width = window.innerWidth;

    if (width >= 1500) {
      this.cols = this.breakpoints.xl;
    } else if (width >= 992) {
      this.cols = this.breakpoints.lg;
    } else if (width >= 768) {
      this.cols = this.breakpoints.md;
    } else if (width >= 576) {
      this.cols = this.breakpoints.sm;
    } else {
      this.cols = this.breakpoints.xs;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setCols();
  }

  formatDateRoute(date: string): string {
    return date.replace(/-/g, '')
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
