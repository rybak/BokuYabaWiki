#!/usr/bin/python

# This script is used to generate the section
# https://bokuyaba.fandom.com/wiki/User:Andrybak/Twitter_extras_search#Twitter_searches
#
# Input: a text file with a list of ISO 8601 dates.
# e.g.
#
#   2018-03-08
#   2018-03-15
#   [...]
#   2025-05-27
#   2025-06-13
#
# Output: wikitext to copy-paste

from datetime import date
from datetime import timedelta
import sys


def pairwise(a):
    return list(zip(a, a[1:]))


def parse_iso_date(line):
    return date.fromisoformat(line.rstrip())


def twitter_search(account, from_date, to_date):
    # https://x.com/search?q=(from%3Aboku__yaba)%20since%3A2019-02-10%20until%3A2019-02-27&src=typed_query&f=live
    from_date = from_date - timedelta(days=1)
    to_date = to_date + timedelta(days=1)
    return f'https://x.com/search?q=(from%3A{account})%20since%3A{from_date}%20until%3A{to_date}&src=typed_query&f=live'


def maybe_anchor(chapter_index):
    if (chapter_index % 10) == 0:
        return "{{anchor|" + str(chapter_index) + "}} "
    return ""


def generate_twitter_searches(input_filename):
    with open(input_filename, 'r') as f:
        lines = f.readlines()
    dates = list(map(parse_iso_date, lines))
    pairs = pairwise(dates)
    output_filename = input_filename.replace('.txt', '-parsed.txt')
    with open(output_filename, 'w') as f:
        output = []
        for i, (from_date, to_date) in enumerate(pairs):
            output.append("# " + maybe_anchor(i + 1) + twitter_search('lovely_pig328', from_date, to_date))
            output.append("#* " + twitter_search('boku__yaba', from_date, to_date))
            if from_date >= date(2022,7,10):
                output.append("#* " + twitter_search('bokuyaba_anime', from_date, to_date))

        f.write("\n".join(output) + "\n")


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print('Specify filename')
        sys.exit(1)
    generate_twitter_searches(sys.argv[1])
