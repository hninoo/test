read -p "are you sure to clear cache prod?:"

for var in pfc pfc2
do

ssh $var " /usr/bin/php /var/www/PopoframeworkSlimCloud/script.php /cache_clear"

done

