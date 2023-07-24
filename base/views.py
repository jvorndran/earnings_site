from django.shortcuts import render
from django.http import HttpResponse
from base.models import StockInfo
from django.utils import timezone
from collections import defaultdict
from datetime import date, datetime


def calender(request):
    today = date.today()

    # Get the first five dates on or after today
    five_dates_after_today = StockInfo.objects.filter(Report_Date__gte=today).values('Report_Date').distinct().order_by(
        'Report_Date')[:5]

    # Fetch the corresponding StockInfo objects for the five dates
    five_most_recent_objects = StockInfo.objects.filter(Report_Date__in=five_dates_after_today)

    # Create a defaultdict to group the objects by release date
    release_date_dict = defaultdict(list)
    for obj in five_most_recent_objects:
        release_date_dict[obj.Report_Date].append(obj)

    # Sort the dictionary by release date in ascending order
    sorted_release_date_dict = dict(sorted(release_date_dict.items(), key=lambda x: x[0]))

    # Sort each sublist by market cap in descending order
    for stock_info_list in sorted_release_date_dict.values():
        stock_info_list.sort(key=lambda obj: obj.Market_Cap, reverse=True)

        stock_info_list[:] = stock_info_list[:20]

    context = {
        'stock_info_objects': sorted_release_date_dict
    }

    return render(request, 'calender.html', context)


def home(request, calender_date):

    today = timezone.now().date()

    # stock_info_objects = StockInfo.objects.filter(Report_Date=today)

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

    context = {
        'release_date': release_date,
        'stock_info_objects': stock_info_objects,
    }

    return render(request, 'calender_detail.html', context)
