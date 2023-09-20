from django.forms import model_to_dict
from django.shortcuts import render
from django.http import HttpResponse
from base.models import StockInfo
from django.utils import timezone
from collections import defaultdict
from datetime import date, datetime
from django.http import JsonResponse
import json
from django.core.serializers.json import DjangoJSONEncoder


class DateJSONEncoder(DjangoJSONEncoder):
    def default(self, o):
        if isinstance(o, date):
            return o.isoformat()
        return super().default(o)


def api_calender(request):
    today = date.today()

    # Get the first five dates on or after today
    five_dates_after_today = StockInfo.objects.filter(Report_Date__gte=today).values('Report_Date').distinct().order_by(
        'Report_Date')[:30]

    # Fetch the corresponding StockInfo objects for the five dates
    five_most_recent_objects = StockInfo.objects.filter(Report_Date__in=five_dates_after_today)

    # Create a defaultdict to group the objects by release date
    release_date_dict = defaultdict(list)
    for obj in five_most_recent_objects:
        release_date_dict[obj.Report_Date].append(obj)

    # Sort each sublist by market cap in descending order and limit to 20 items
    for stock_info_list in release_date_dict.values():
        stock_info_list.sort(key=lambda obj: obj.Market_Cap, reverse=True)
        stock_info_list[:] = stock_info_list[:18]

    # Convert the dictionary values to a list of dictionaries
    stock_info_data = [model_to_dict(stock_info) for stock_info_list in release_date_dict.values() for stock_info in stock_info_list]

    # Serialize the data and return as JSON response
    json_data = json.dumps(stock_info_data, cls=DateJSONEncoder)

    return JsonResponse(json_data, safe=False)



def home(request, calender_date):

    today = timezone.now().date()

    stock_info_objects = StockInfo.objects.all().order_by('-Market_Cap')


    context = {
        'stock_info_objects': stock_info_objects
    }

    return render(request, 'home.html', context)


def calender_detail(request, date):

    if request.path == '/favicon.ico/':
        return HttpResponse()

    # Parse the date string into a datetime object
    release_date = datetime.strptime(date, '%Y%m%d').date()

    # Get the StockInfo objects for the specified release date
    stock_info_objects = StockInfo.objects.filter(Report_Date=release_date).order_by('-Market_Cap')



    stock_info_list = [
        {
            'Name': obj.Name,
            'Ticker': obj.Ticker,
            'Market Cap': "{:.1f}B".format(obj.Market_Cap / 1_000_000_000),
            'Report Date': obj.Report_Date,
            'Days To Cover': obj.Days_To_Cover,
            'Estimate': obj.Estimate,
            'Quarterly Growth': obj.Quarterly_Growth,
            'Short Interest': obj.Short_Interest,
            'Implied Move': obj.Implied_Move,
            'Website': obj.Website
        }
        for obj in stock_info_objects
    ]

    return JsonResponse(stock_info_list, safe=False)
