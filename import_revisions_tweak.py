#!/usr/bin/python


# This script ensures attribution is added to edit summaries of edits
# which are exported from https://en.wikipedia.org/wiki/Special:Export
# The pages are then imported at https://bokuyaba.fandom.com/wiki/Special:Import
#
# Input: a full export (with history) of some pages from English Wikipedia
# Output: the same export, but with altered edit summaries


from bs4 import BeautifulSoup
import sys


def tweak(input_filename, output_filename):
    with open(input_filename, 'r') as f:
        data = f.read()
    Bs_data = BeautifulSoup(data, "xml")

    revisions = Bs_data.find_all('revision')
    print(len(revisions))


    for revision in revisions:
        revid = revision.id.text
        username = (revision.contributor.username or revision.contributor.ip).text
        prefix = f"imported from [[wikipedia:Special:Permalink/{revid}]] by [[wikipedia:User:{username}|{username}]]"

        comment_tag = revision.comment
        if comment_tag is None:
            comment = prefix
            comment_tag = Bs_data.new_tag('comment')
            comment_tag.append(comment)
            revision.append(comment_tag)
        else:
            comment = prefix + ': ' + comment_tag.text
            comment_tag.string = comment
        # print(revision.comment)

    with open(output_filename, 'w') as f:
        f.write(str(Bs_data))
        # f.write(Bs_data.prettify())


def tweaked_filename(fn):
    return fn[:-4] + '-FOR-IMPORT.xml'


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print('Specify filename')
        sys.exit(1)
    tweak(sys.argv[1], tweaked_filename(sys.argv[1]))
