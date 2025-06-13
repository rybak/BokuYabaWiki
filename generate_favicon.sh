#!/bin/bash

# This script was used to convert the PNG favicon into ICO favicon
# with different sizes.
# This was needed to allow saving of the favicon in Firefox history.

convert ${1:original.png} -colors 256 -define icon:auto-resize=16,48,256 -compress zip ${2:output.ico}
