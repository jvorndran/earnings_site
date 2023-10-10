from django.urls import path
from . import views

urlpatterns = [
    # path('', views.calender, name='Calender'),
    path('api/<str:date>/', views.calender_detail, name='calender_detail'),
    path('api/calender', views.api_calender, name='calender')
]
