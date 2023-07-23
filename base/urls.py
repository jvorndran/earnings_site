from django.urls import path
from . import views

urlpatterns = [
    path('', views.calender, name='Calender'),
    path('<str:date>/', views.calender_detail, name='calender_detail'),
]
