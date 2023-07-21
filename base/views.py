from django.shortcuts import render
from django.http import HttpResponse
from base.models import StockInfo


def home(request):

    stock_info_objects = StockInfo.objects.all()

    context = {
        'stock_info_objects': stock_info_objects
    }

    return render(request, 'home.html', context)



