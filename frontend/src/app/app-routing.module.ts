import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CalenderItemComponent} from "./components/calender-item/calender-item.component";
import {ReportDateTableComponent} from "./components/report-date-table/report-date-table.component";

const routes: Routes = [
  {path: '', component: CalenderItemComponent},
  {path: ':date', component: ReportDateTableComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
