#!/bin/bash
rsync -avr --delete-after web@auslan.fyi:/home/web/beta.find.auslan.fyi/logs -e ssh ~/Sync/sign-search
rsync -avr --delete-after web@auslan.fyi:/home/web/beta.find.auslan.fyi/datasets -e ssh ~/Sync/sign-search
rsync -avr --delete-after web@auslan.fyi:/home/web/beta.find.auslan.fyi/feeds -e ssh ~/Sync/sign-search
rsync -avr --delete-after web@auslan.fyi:/home/web/beta.find.auslan.fyi/datasets.torrent -e ssh ~/Sync/sign-search
rsync -avr --delete-after web@auslan.fyi:/home/web/beta.find.auslan.fyi/tools/spiders/frozen-data -e ssh ~/Sync/sign-search/tools/spiders
rsync -avr --delete-after --exclude=".DS_Store" --exclude="/node_modules" --exclude="/.git" --exclude="/.dat" --exclude="/datasets" ~/Sync/sign-search/* -e ssh web@auslan.fyi:/home/web/beta.find.auslan.fyi
