import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class GetCalenderService {

  constructor(private http: HttpClient) { }

  getCalenderData(){
    return this.http.get('https://earnings-site-api-6e5e869bb564.herokuapp.com/api/calender');
  }

}
