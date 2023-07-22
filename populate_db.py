import yfinance as yf
import csv
import requests
import pandas as pd
from django.conf import settings
import os
from dotenv import load_dotenv
import django


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'earnings_site.settings')
django.setup()


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
        stock = yf.Ticker(stock_symbol)

        options = stock.option_chain()

        nearest_in_call = find_nearest_option(options.calls, stock_price)

        nearest_in_put = find_nearest_option(options.puts, stock_price)

        implied_move = (nearest_in_put['lastPrice'] + nearest_in_call['lastPrice']) / stock_price

        return implied_move
    except Exception as e:
        print("Error fetching data:", e)
        return 0.0


# Enriching Data ie adding 5 new columns
def get_stock_info(ticker):
    stock = yf.Ticker(ticker)
    info = stock.get_info()
    price = info.get('currentPrice', 0.0)
    website = info.get('website', 0.0)
    mkt_cap = info.get('marketCap', 0.0)
    short_interest = info.get('shortPercentOfFloat', 0.0)
    quarterly_growth = info.get('earningsQuarterlyGrowth', 0.0)
    try:
        short_ratio = info['shortRatio']
    except KeyError:
        short_ratio = 0.0

    return website, mkt_cap, short_ratio, price, short_interest, quarterly_growth


websites = []
market_caps = []
short_ratios = []
implied_moves = []
short_interests = []
quarterly_growths = []

df_copy = df.copy()

for symbol in df_copy['symbol']:
    print(symbol)
    try:
        website, mkt_cap, short_ratio, price, short_interest, quarterly_growth = get_stock_info(symbol)

        if mkt_cap < 800000000:
            df = df[df['symbol'] != symbol]
            continue

        implied_move = get_implied_move(symbol, price)
        implied_moves.append(implied_move)
        websites.append(website)
        market_caps.append(mkt_cap)
        short_ratios.append(short_ratio)
        short_interests.append(short_interest)
        quarterly_growths.append(quarterly_growth)

    except Exception as e:
        df = df[df['symbol'] != symbol]
        print(f"An error occurred for symbol '{symbol}': {e}")
        continue


df['Implied_Move'] = implied_moves
df['Website'] = websites
df['Market_Cap'] = market_caps
df['Short_Ratio'] = short_ratios
df['Short_Interest'] = short_interests
df['Quarterly_Growth'] = quarterly_growths

from base.models import StockInfo

for index, row in df.iterrows():

    stock_info = StockInfo(
        Ticker=row['symbol'],
        Name=row['name'],
        Report_Date=row['reportDate'],
        Fiscal_Date_End=row['fiscalDateEnding'],
        Estimate=float(row['estimate']) if row['estimate'] else 0.0,
        Implied_Move=row['Implied_Move'],
        Market_Cap=row['Market_Cap'],
        Website=row['Website'],
        Days_To_Cover=row['Short_Ratio'],
        Short_Interest=row['Short_Interest'],
        Quarterly_Growth=row['Quarterly_Growth']
    )

    stock_info.save()
