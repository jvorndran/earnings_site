from django.db import models


class StockInfo(models.Model):
    Ticker = models.CharField(max_length=10, primary_key=True)
    Name = models.CharField(max_length=200)
    Report_Date = models.DateField()
    Fiscal_Date_End = models.DateField()
    Days_To_Cover = models.FloatField(default=0.0)
    Estimate = models.FloatField(default=0.0)
    Quarterly_Growth = models.FloatField(default=0.0)
    Short_Interest = models.FloatField(default=0.0)
    Implied_Move = models.FloatField(default=0.0)
    Market_Cap = models.IntegerField(default=0)
    Website = models.CharField(max_length=200)

    def __str__(self):
        return self.Ticker

