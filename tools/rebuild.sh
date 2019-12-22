cd scrapers/asphyxia
node spider.js > ../logs/asphyxia.txt
cd ../..
cd scrapers/auslan-signbank
node spider.js > ../logs/auslan-signbank.txt
cd ../..
cd scrapers/auslan-stage-left
node spider.js > ../logs/auslan-stage-left.txt
cd ../..
cd scrapers/youtube
node spider.js > ../logs/youtube.txt
cd ../..
node create-datasets-torrent.js > ../logs/create-datasets-torrent.txt