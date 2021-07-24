import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

import datetime
import glob
import pytz

colnames = [
    'square_id', 'time_interval', 'country_code','sms_in',
    'sms_out', 'call_in', 'call_out', 'internet_traffic'
]
use_colnames = [
    'square_id', 'time_interval', 'sms_in',
    'sms_out', 'call_in', 'call_out', 'internet_traffic'
]
dtypes = {
    'square_id': str, 'time_interval': long, 'sms_in': float,
    'sms_out': float, 'call_in': float, 'call_out': float, 'internet_traffic': float
}

# print all times in the data frame
def print_df_times(df):
    print(df.info)
    ts = df.iloc[0:4]['time_interval']
    ts = ts.append(df.iloc[-5:-1]['time_interval'])
    for t in ts:
        time = datetime.datetime.fromtimestamp(t/1000, pytz.utc)
        print(t, time)


    # convert time_interval to time
    df['time'] = pd.to_datetime(df['time_interval']/1000, unit='s')
    colnames_output = colnames.append('time')
    print(df.info)
    print(df.iloc[0]['time'])
    print(df.iloc[-1]['time'])


# group by time first (all squares in the same interval is merged)
# output sum of 10 minutes interval
# resampling by 1 hour
# output sum of 1 hour interval
def merge_squares_and_times(df):
    # print_df_times(df)

    # group by time (merge square)
    grouped_times = df.groupby(['time_interval'], as_index = False).sum()
    # convert time interval to time
    grouped_times['time'] = pd.to_datetime(grouped_times['time_interval'], unit='ms')
    grouped_times['time_display'] = pd.to_datetime(grouped_times['time_interval'], unit='ms')
    # set new time column as index
    grouped_times = grouped_times.set_index('time')
    print('grouped times with 10m interval', grouped_times)
    # combine sms and call
    grouped_times['sms_all'] = grouped_times['sms_in'] + grouped_times['sms_out']
    grouped_times['call_all'] = grouped_times['call_in'] + grouped_times['call_out']
    # drop sms and call
    grouped_times.drop(columns=['sms_in', 'sms_out', 'call_in', 'call_out'], inplace=True)

    # resampling by hour
    grouped_times_hourly = grouped_times.resample('1H').sum()
    # re-calculate time_interval from index
    grouped_times_hourly['time_interval'] = (grouped_times_hourly.index - pd.Timestamp('1970-01-01')) // pd.Timedelta('1ms')
    grouped_times_hourly['time_display'] = pd.to_datetime(grouped_times_hourly['time_interval'], unit='ms')
    print('grouped times with 1h interval', grouped_times_hourly)

    return grouped_times, grouped_times_hourly


# filter only interested squares first
# group by time and square_id (squares are preserved)
# output sum of 10 minutes interval
# resampling by 1 hour
# output sum of 1 hour interval
def filter_squares_and_merge_times(df, square_ids=None):
    # print_df_times(df)

    # filter only interested squares
    if square_ids != None:
        filtered_df = df[df['square_id'].isin(square_ids)]
    # do not filter, get all unqiue squares
    if square_ids == None:
        square_ids = df['square_id'].unique()
        filtered_df = df[df['square_id'].isin(square_ids)]

    # group by time and square
    grouped_times = filtered_df.groupby(['time_interval', 'square_id'], as_index = False).sum()
    # convert time interval to time
    grouped_times['time'] = pd.to_datetime(grouped_times['time_interval'], unit='ms')
    grouped_times['time_display'] = pd.to_datetime(grouped_times['time_interval'], unit='ms')
    # set new time column as index
    grouped_times = grouped_times.set_index('time')
    # combine sms and call
    grouped_times['sms_all'] = grouped_times['sms_in'] + grouped_times['sms_out']
    grouped_times['call_all'] = grouped_times['call_in'] + grouped_times['call_out']
    # drop sms and call
    grouped_times.drop(columns=['sms_in', 'sms_out', 'call_in', 'call_out'], inplace=True)

    # for each square
    # resampling by hour
    grouped_times_hourly = grouped_times.groupby('square_id').resample('1H').sum()
    # for each square
    # re-calculate time_interval from index
    for square_id in square_ids:
        grouped_times_hourly.loc[square_id, 'time_interval'] = (grouped_times_hourly.loc[square_id].index - pd.Timestamp('1970-01-01')) // pd.Timedelta('1ms')
        grouped_times_hourly.loc[square_id, 'time_display'] = pd.to_datetime(grouped_times_hourly.loc[square_id, 'time_interval'], unit='ms').values
        print('grouped times and squares with 1h interval', square_id)

    return grouped_times, grouped_times_hourly


# output csv, json and plot
def output(data_frame, name):
    data_frame.to_csv('./data/' + name + '.csv')
    data_frame.reset_index().to_json('./data/' + name + '.json', orient='records', date_format='iso') # reset_index so that MultiIndex can be output in to_json
    # plot
    try:
        data_frame.loc[:, ['sms_all', 'call_all', 'internet_traffic']].plot()
        plt.draw()
        plt.savefig('./data/' + name + '.png')
    except:
        pass


# process a week, merge all squares
grouped_times = pd.DataFrame()
grouped_times_hourly = pd.DataFrame()
input_dir = '../november-first-week' # sms-call-internet-mi-2013-11-03.txt - sms-call-internet-mi-2013-11-09.txt
for file in glob.glob(input_dir + '/*.txt'):
    print(file)
    curr_df = pd.read_csv(file, sep='\t', names=colnames, usecols=use_colnames, dtype=dtypes)
    curr_grouped_times, curr_grouped_times_hourly = merge_squares_and_times(curr_df)
    grouped_times = grouped_times.append(curr_grouped_times)
    grouped_times_hourly = grouped_times_hourly.append(curr_grouped_times_hourly)
output(grouped_times, 'output-grouped-times')
output(grouped_times_hourly, 'output-grouped-times-hourly')


# process a week, filter selected squares
# IF ([square_id] == 4259) THEN "University"
# ELSEIF ([square_id] == 5060) THEN "Downtown"
# ELSEIF ([square_id] == 4456) THEN "Nightlife"
# ELSEIF ([square_id] == 4703) THEN "Forest"
# END
square_ids = ['4259', '5060', '4456', '4703']
grouped_times = pd.DataFrame()
grouped_times_hourly = pd.DataFrame()
input_dir = '../november-first-week' # sms-call-internet-mi-2013-11-03.txt - sms-call-internet-mi-2013-11-09.txt
for file in glob.glob(input_dir + '/*.txt'):
    print(file)
    curr_df = pd.read_csv(file, sep='\t', names=colnames, usecols=use_colnames, dtype=dtypes)
    curr_grouped_times, curr_grouped_times_hourly = filter_squares_and_merge_times(curr_df, square_ids)
    _ = grouped_times.append(curr_grouped_times)
    grouped_times_hourly = grouped_times_hourly.append(curr_grouped_times_hourly)
output(grouped_times_hourly, 'output-grouped-times-filtered-squares-hourly')


# process a single day, keep all sqaures
df = pd.read_csv('../november-first-week/sms-call-internet-mi-2013-11-04.txt',
                 sep='\t', names=colnames, usecols=use_colnames, dtype=dtypes)
_, grouped_times_hourly = filter_squares_and_merge_times(df)
grouped_times_hourly['all'] = grouped_times_hourly['sms_all'] + grouped_times_hourly['call_all'] + grouped_times_hourly['internet_traffic']
output(grouped_times_hourly, 'output-grouped-times-all-squares-hourly')
grouped_times_hourly.drop(columns=['sms_all', 'call_all', 'internet_traffic'], inplace=True)
output(grouped_times_hourly, 'output-grouped-times-all-squares-hourly')
