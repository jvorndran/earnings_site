from django.db import models


class StockInfo(models.Model):
    Ticker = models.CharField(max_length=10, primary_key=True)
    Name = models.CharField(max_length=200)
    Report_Date = models.DateField()
    Fiscal_Date_End = models.DateField()
    Days_To_Cover = models.FloatField()
    Estimate = models.FloatField()
    Implied_Move = models.FloatField()
    Market_Cap = models.IntegerField()
    Website = models.CharField(max_length=200)

    def __str__(self):
        return self.Ticker

