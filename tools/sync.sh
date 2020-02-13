#!/bin/bash
rsync -avzr \
  --include="/logs" \
  --include="/datasets" \
  --include="/feeds" \
  --include="/datasets.torrent*" \
  --include="/*.html*" \
  --include="/tools/spiders/frozen-data" \
  --exclude="*" -e ssh "web@auslan.fyi:/home/web/beta.find.auslan.fyi/*" ~/Sync/sign-search
rsync -avzr --delete-after \
  --exclude=".DS_Store" \
  --exclude="/node_modules" \
  --exclude="/*.html*" \
  --exclude="/tools/spiders/frozen-data" \
  --exclude="/logs" \
  --exclude="/datasets.torrent*" \
  --exclude="/.git" \
  --exclude="/.dat" \
  --exclude="/datasets" \
  ~/Sync/sign-search/* -e ssh web@auslan.fyi:/home/web/beta.find.auslan.fyi
