import { Component, OnInit, HostListener } from '@angular/core';
import { GetCalenderService } from '../../services/get-calender.service'
import { CalenderData } from "./calender-item.interface";
import { SlickCarouselModule } from "ngx-slick-carousel";

@Component({
  selector: 'app-calender-item',
  templateUrl: './calender-item.component.html',
  styleUrls: ['./calender-item.component.css'],
})
export class CalenderItemComponent implements OnInit {

  calenderData: { [key: string]: CalenderData[] } = {};

  cols: number = 6;

  constructor(private calenderService: GetCalenderService) { }
  ngOnInit(): void {
    this.setCols()

    // @ts-ignore
    this.calenderService.getCalenderData().subscribe((data:string) =>{
      const parsedData = JSON.parse(data) as CalenderData[];
      this.calenderData = this.groupDataByReportDate(parsedData);
    });
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

  getDates(data: { [key: string]: CalenderData[] }): string[] {
    return Object.keys(data);
  }

  handleImageError(event:any) {
    event.target.src = '../../../assets/img/image.svg';
    event.target.style.width = '3vw';
    event.target.style.height = '3vh'
  }


  formatDate(date:string):string|null{
    console.log(date)
    const dateObject = new Date(date);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(dateObject)
  }

  breakpoints = {
    xl: 6,
    lg: 4,
    md: 3,
    sm: 2,
    xs: 1,
  };
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

  formatDateRoute (date:string):string{

      return date.replace(/-/g, '')

  }


  slideConfig = {
    infinite: true,
    arrows: true,
  slidesToShow: 1,
  slidesToScroll: 1,
    dots: true,
    className: 'slides'
  }



}
