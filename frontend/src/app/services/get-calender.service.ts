import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class GetCalenderService {

  constructor(private http: HttpClient) { }

  getCalenderData(){
    return this.http.get('http://127.0.0.1:8000/api/calender');
  }

}
