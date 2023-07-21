from django.shortcuts import render
from django.http import HttpResponse
from base.models import StockInfo
from django.utils import timezone


def home(request):

    today = timezone.now().date()

    stock_info_objects = StockInfo.objects.filter(Report_Date=today)


    context = {
        'stock_info_objects': stock_info_objects
    }

    return render(request, 'home.html', context)



