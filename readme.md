# Earnings Insights Website
This project allows you to view upcoming earnings for publicly listed companies

# Purpose
I modeled this website off what earningsights.com was. A few of the stats they had were
behind a pay wall and I knew I could easily calculate them myself.

# Features
When you first come to the website you will see the largest 20 companies who are reporting earnings
on the next report date. You can scroll left or right to see who reports in the following days.
Click on a company or date, and you will be brought to a page with all the companies reporting for that
day along with useful statistics. The stats include implied 1 week move, EPS estimate, market capitalization,
quarterly growth rate, days to cover, short interest, etc.

# Methodology
I used the AlphaVantage API to get a list of the companies reporting for the next 6 months. Then I use
that to get the tickers and pull various statistics from yahoo finance using the yfinance python package.
I had to calculate 1 week implied move myself. I take the price of the put and the call that are at the money (the closest
strike to the underlying) and add them together. Then I take that and divide it by the price of the underlying stock. This
effectively gives us how much the stock is implied to move by the end of the week. Implied moves are normally elevated on the
week that earnings are reported for obvious reasons. There are various strategies that people use 1 week implied move on earnings
week. If you would like to read more https://marketrebellion.com/news/trading-insights/implied-volatility-crush-how-to-beat-iv-crush-with-options/

# Technology Used
Frontend - Angular 

Backend - Django

Database - Sqlite


# Installation
The project uses Angular on the frontend and Django on the backend. cd into the frontend folder
and use npm install to install the dependencies. Then use the requirements.txt file to install the dependencies
for the backend with the command "pip install -r requirements.txt".

# Running the Project
From the root directory, use "python manage.py runserver" to run the backend. Then cd into the frontend and 
use "ng serve" to run the frontend.