import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CalenderItemComponent } from './components/calender-item/calender-item.component';
import { GetCalenderService } from './services/get-calender.service';
import { HomeComponent } from './components/home/home.component'
import {HttpClientModule} from "@angular/common/http";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule, MatGridList, MatGridTile} from "@angular/material/grid-list";
import { TruncatePipe } from './truncate.pipe';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import { ReportDateTableComponent } from './components/report-date-table/report-date-table.component';
import {MatTableModule} from "@angular/material/table";
import { SlickCarouselModule } from "ngx-slick-carousel";
import { CarouselModule } from "ngx-owl-carousel-o";
import {RouterModule} from "@angular/router";
import { CarouselHolderComponentComponent } from './components/carousel-holder-component/carousel-holder-component.component';
import { SlickCarouselComponent } from "ngx-slick-carousel";

@NgModule({
  declarations: [
    AppComponent,
    CalenderItemComponent,
    HomeComponent,
    TruncatePipe,
    ReportDateTableComponent,
    CarouselHolderComponentComponent,
    CalenderItemComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    SlickCarouselModule,
    CarouselModule,
    RouterModule,
    BrowserAnimationsModule,
  ],
  providers: [GetCalenderService],
  bootstrap: [AppComponent]
})
export class AppModule { }
