cd /Users/moraine/PhpStormProjects/popoframework_slim/html_angular4
sed -i".bak" -e 's$href="/"$href="/cms/"$' src/index.html
ng build --env=meispo --output-hashing=all
git checkout src/index.html
rsync -av dist/ spohp:/var/www/vhosts/meispo.net/cms/
cd /Users/moraine/PhpStormProjects/popoframework_slim/
rsync -av --exclude='vendor' --exclude='.git' --exclude='html_angular4' ./ spohp:/var/www/vhosts_lib/PopoframeworkSlim/
