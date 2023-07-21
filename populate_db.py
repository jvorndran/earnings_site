import yfinance as yf
import csv
import requests
import pandas as pd
from django.conf import settings
import os
from dotenv import load_dotenv


load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'earnings_site.settings')


import django
django.setup()


load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'earnings_site.settings')

api_key = 'ZUVY81MBX0E12LVI'

#Earnings calendar API URL
CSV_URL = f'https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=1month&apikey={api_key}'

#Get earnings calender as a list
with requests.Session() as s:
    download = s.get(CSV_URL)
    decoded_content = download.content.decode('utf-8')
    cr = csv.reader(decoded_content.splitlines(), delimiter=',')
    my_list = list(cr)

#convert to dataframe
df = pd.DataFrame(my_list[1:], columns=my_list[0])

#Cleaning Data
df = df.drop(index=0).reset_index(drop=True)
df['reportDate'] = pd.to_datetime(df['reportDate'])
df = df.sort_values(by='reportDate')
df = df[df['currency'] == 'USD']
df = df[:5]


def find_nearest_option(options, stock_price):
    # loop through options get two rows that have false true or true false
    temp_row = None

    for index, row in options.iterrows():

        # skip first row
        if index == 0:
            temp_row = row
            continue

        if row['inTheMoney'] and not temp_row['inTheMoney']:

            distance_to_strike_1 = abs(row['strike'] - stock_price)
            distance_to_strike_2 = abs(temp_row['strike'] - stock_price)

            if distance_to_strike_1 < distance_to_strike_2:
                return row
            else:
                return temp_row

        if not row['inTheMoney'] and temp_row['inTheMoney']:

            distance_to_strike_1 = abs(row['strike'] - stock_price)
            distance_to_strike_2 = abs(temp_row['strike'] - stock_price)

            if distance_to_strike_1 < distance_to_strike_2:
                return row
            else:
                return temp_row


def get_implied_move(stock_symbol, stock_price):
    try:
        # Get the stock data
        stock = yf.Ticker(stock_symbol)

        # Get the option chain data
        options = stock.option_chain()

        # Find nearest in-the-money call and put options
        nearest_in_call = find_nearest_option(options.calls, stock_price)

        nearest_in_put = find_nearest_option(options.puts, stock_price)

        # Get the implied move as the sum of the absolute differences between call and put strikes
        implied_move = (nearest_in_put['lastPrice'] + nearest_in_call['lastPrice']) / stock_price

        return implied_move
    except Exception as e:
        print("Error fetching data:", e)
        return None


# Enriching Data ie adding 5 new columns
def get_stock_info(ticker):
    stock = yf.Ticker(ticker)
    info = stock.get_info()
    price = info['currentPrice']
    website = info['website']
    mkt_cap = info['marketCap']
    short_ratio = info['shortRatio']
    return website, mkt_cap, short_ratio, price


websites = []
market_caps = []
short_ratios = []
implied_moves = []

for symbol in df['symbol']:
    print(symbol)
    website, mkt_cap, short_ratio, price = get_stock_info(symbol)

    if mkt_cap < 500000000:
        df = df[~df['symbol'].str.contains(symbol)]
        continue

    implied_moves.append(get_implied_move(symbol, price))
    websites.append(website)
    market_caps.append(mkt_cap)
    short_ratios.append(short_ratio)

df['Implied_Move'] = implied_moves
df['Website'] = websites
df['Market_Cap'] = market_caps
df['Short_Ratio'] = short_ratios

print(df)

from base.models import StockInfo

for index, row in df.iterrows():

    stock_info = StockInfo(
        Ticker=row['symbol'],
        Name=row['name'],
        Report_Date=row['reportDate'],
        Fiscal_Date_End=row['fiscalDateEnding'],
        Estimate=row['estimate'],
        Implied_Move=row['Implied_Move'],
        Market_Cap=row['Market_Cap'],
        Days_To_Cover=row['Short_Ratio']
    )

    stock_info.save()
