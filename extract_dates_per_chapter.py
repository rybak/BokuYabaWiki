#!/usr/bin/python

# This script was used as one of the steps to prepare the dates to be added in the edit:
# https://bokuyaba.fandom.com/wiki/Module:Chapter/data?diff=prev&oldid=8041
#
# Input: current pages database dump from https://bokuyaba.fandom.com/wiki/Special:Statistics
#
# Output: List of dates from chapter articles of BokuYaba Wiki.
#         It is vaguely formated to make its further editing easier.
#         It was never intended to be used as is.


from bs4 import BeautifulSoup
import sys
import re


MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November',
          'December']


def monthNameToNumber(month):
    try:
        return MONTHS.index(month) + 1
    except:
        # special cases
        if month == 'Feburary':
            return 2
        if month == 'Mar':
            return 3
        # shouldn't happen on current data as of 2025-05-26
        return month


def zeroPadTwo(number):
    if len(str(number)) < 2:
        return '0' + str(number)
    return str(number)


def mdyDateToIso(d):
    mdyDateToIsoMatches = re.match(r' *([A-Z][a-z]+) +([0-9]{1,2})([stndrdth]{2})?, (20[0-9]+) *$', d)
    year = mdyDateToIsoMatches[4]
    month = zeroPadTwo(monthNameToNumber(mdyDateToIsoMatches[1]))
    dayOfMonth = zeroPadTwo(mdyDateToIsoMatches[2])
    result = f'{year}-{month}-{dayOfMonth}'
    print(result)
    return result


def extract(input_filename):
    dates = list(range(170))
    with open(input_filename, 'r') as f:
        data = f.read()
    Bs_data = BeautifulSoup(data, "xml")

    pages = Bs_data.find_all('page')
    print(len(pages))

    for page in pages:
        revision = page.revision
        title = page.title.string
        text = revision.text
        try:
            index = int(re.findall(r'[0-9]+', title)[0])

            if 'publication_date' in text[:1000]:
                print(title)
                # '<' to exclude publication_date with <ref>
                matches = re.findall(r'publication_date=([^<\n]*).*\n', text)
                if len(matches) > 0:
                    date = mdyDateToIso(matches[0])
                    dates[index] = date
        except:
            print('Failed for ' + title)
    print(dates)
    for i, v in enumerate(dates):
        if isinstance(v, str):
            print('[' + str(i) + '] = "' + v + '"')


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print('Specify filename')
        sys.exit(1)
    extract(sys.argv[1])
