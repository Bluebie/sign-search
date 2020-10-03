#!/bin/bash
rsync -avzr -e ssh "web@auslan.fyi:/home/web/find.auslan.fyi/datasets" ~/Sync/sign-search/
rsync -avzr -e ssh "web@auslan.fyi:/home/web/find.auslan.fyi/feeds" ~/Sync/sign-search/
rsync -avzr -e ssh "web@auslan.fyi:/home/web/find.auslan.fyi/datasets.torrent" ~/Sync/sign-search/
rsync -avzr -e ssh "web@auslan.fyi:/home/web/find.auslan.fyi/tools/spiders/frozen-data" ~/Sync/sign-search/tools/spiders/
